import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const EXPENSE_CATEGORIES = [
  { value: 'supplier', label: 'ספקים', color: 'hsl(217, 91%, 60%)' },
  { value: 'equipment', label: 'ציוד', color: 'hsl(142, 76%, 36%)' },
  { value: 'rent', label: 'שכירות', color: 'hsl(45, 93%, 47%)' },
  { value: 'marketing', label: 'שיווק ופרסום', color: 'hsl(280, 100%, 70%)' },
  { value: 'office', label: 'משרד', color: 'hsl(0, 84%, 60%)' },
  { value: 'travel', label: 'נסיעות', color: 'hsl(180, 76%, 40%)' },
  { value: 'software', label: 'תוכנה ומנויים', color: 'hsl(320, 70%, 55%)' },
  { value: 'professional', label: 'שירותים מקצועיים', color: 'hsl(30, 90%, 55%)' },
  { value: 'other', label: 'אחר', color: 'hsl(200, 30%, 50%)' },
];

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  has_vat: boolean;
  is_recurring: boolean;
  supplier_name?: string | null;
}

interface ExpenseAnalyticsProps {
  expenses: Expense[];
  vatRate?: number;
  year?: number;
}

const formatCurrency = (amount: number): string => {
  return `₪${Math.round(amount).toLocaleString('he-IL')}`;
};

export const ExpenseAnalytics: React.FC<ExpenseAnalyticsProps> = ({
  expenses,
  vatRate = 18,
  year,
}) => {
  // Filter by year if provided
  const filteredExpenses = useMemo(() => {
    if (!year) return expenses;
    return expenses.filter(e => new Date(e.expense_date).getFullYear() === year);
  }, [expenses, year]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalAmount = filteredExpenses.reduce((sum, e) => {
      const amount = Number(e.amount);
      return sum + (e.is_recurring ? amount * 12 : amount);
    }, 0);

    const monthlyAvg = totalAmount / 12;
    const withVat = filteredExpenses.reduce((sum, e) => {
      if (!e.has_vat) return sum;
      const amount = Number(e.amount);
      return sum + (e.is_recurring ? amount * 12 : amount);
    }, 0);

    const vatAmount = withVat - (withVat / (1 + vatRate / 100));
    const recurringTotal = filteredExpenses.filter(e => e.is_recurring).reduce((sum, e) => sum + Number(e.amount) * 12, 0);
    const oneTimeTotal = filteredExpenses.filter(e => !e.is_recurring).reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      total: totalAmount,
      monthlyAvg,
      vatAmount,
      recurringTotal,
      oneTimeTotal,
      recurringCount: filteredExpenses.filter(e => e.is_recurring).length,
      oneTimeCount: filteredExpenses.filter(e => !e.is_recurring).length,
    };
  }, [filteredExpenses, vatRate]);

  // Category breakdown
  const categoryData = useMemo(() => {
    return EXPENSE_CATEGORIES.map(cat => {
      const catExpenses = filteredExpenses.filter(e => e.category === cat.value);
      const total = catExpenses.reduce((sum, e) => {
        const amount = Number(e.amount);
        return sum + (e.is_recurring ? amount * 12 : amount);
      }, 0);
      const count = catExpenses.length;
      const percentage = totals.total > 0 ? (total / totals.total) * 100 : 0;
      
      return {
        name: cat.label,
        value: cat.value,
        total,
        count,
        percentage,
        color: cat.color,
      };
    }).filter(c => c.count > 0).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, totals.total]);

  // Monthly trend (last 12 months)
  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthExpenses = expenses.filter(e => {
        const expDate = parseISO(e.expense_date);
        return expDate >= monthStart && expDate <= monthEnd;
      });

      const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      // Add recurring expenses for this month
      const recurringTotal = expenses
        .filter(e => e.is_recurring && parseISO(e.expense_date) <= monthEnd)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        month: format(date, 'MMM', { locale: he }),
        fullMonth: format(date, 'MMMM yyyy', { locale: he }),
        total: total + recurringTotal,
        oneTime: total,
        recurring: recurringTotal,
      };
    });
  }, [expenses]);

  // Top suppliers
  const topSuppliers = useMemo(() => {
    const supplierMap = new Map<string, number>();
    
    filteredExpenses.forEach(e => {
      const supplier = e.supplier_name || 'לא צוין';
      const amount = e.is_recurring ? Number(e.amount) * 12 : Number(e.amount);
      supplierMap.set(supplier, (supplierMap.get(supplier) || 0) + amount);
    });

    return Array.from(supplierMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredExpenses]);

  // Growth analysis
  const growthAnalysis = useMemo(() => {
    if (monthlyTrend.length < 2) return { percentage: 0, trend: 'stable' as const };
    
    const lastMonth = monthlyTrend[monthlyTrend.length - 1].total;
    const prevMonth = monthlyTrend[monthlyTrend.length - 2].total;
    
    if (prevMonth === 0) return { percentage: 0, trend: 'stable' as const };
    
    const percentage = ((lastMonth - prevMonth) / prevMonth) * 100;
    const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    
    return { percentage: Math.abs(percentage), trend };
  }, [monthlyTrend]);

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    
    doc.setFontSize(20);
    doc.text('Expense Analysis Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Total Expenses: ${formatCurrency(totals.total)}`, 20, 40);
    doc.text(`Monthly Average: ${formatCurrency(totals.monthlyAvg)}`, 20, 50);
    doc.text(`VAT Amount: ${formatCurrency(totals.vatAmount)}`, 20, 60);
    doc.text(`Recurring: ${formatCurrency(totals.recurringTotal)} (${totals.recurringCount} items)`, 20, 70);
    doc.text(`One-time: ${formatCurrency(totals.oneTimeTotal)} (${totals.oneTimeCount} items)`, 20, 80);
    
    doc.setFontSize(14);
    doc.text('Category Breakdown:', 20, 100);
    
    let y = 110;
    categoryData.forEach((cat, i) => {
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${cat.name}: ${formatCurrency(cat.total)} (${cat.percentage.toFixed(1)}%)`, 25, y);
      y += 8;
    });

    doc.save(`expense-analysis-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData: (string | number)[][] = [
      ['סיכום הוצאות', ''],
      ['סה"כ שנתי', totals.total],
      ['ממוצע חודשי', totals.monthlyAvg],
      ['סה"כ מע"מ', totals.vatAmount],
      ['הוצאות קבועות', totals.recurringTotal],
      ['הוצאות חד-פעמיות', totals.oneTimeTotal],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'סיכום');
    
    // Categories sheet
    const catData: (string | number)[][] = [['קטגוריה', 'סכום', 'אחוז', 'כמות']];
    categoryData.forEach(cat => {
      catData.push([cat.name, cat.total, `${cat.percentage.toFixed(1)}%`, cat.count]);
    });
    const catSheet = XLSX.utils.aoa_to_sheet(catData);
    XLSX.utils.book_append_sheet(wb, catSheet, 'קטגוריות');
    
    // Monthly trend sheet
    const trendData: (string | number)[][] = [['חודש', 'סה"כ', 'חד-פעמי', 'קבוע']];
    monthlyTrend.forEach(m => {
      trendData.push([m.fullMonth, m.total, m.oneTime, m.recurring]);
    });
    const trendSheet = XLSX.utils.aoa_to_sheet(trendData);
    XLSX.utils.book_append_sheet(wb, trendSheet, 'מגמה חודשית');

    XLSX.writeFile(wb, `expense-analysis-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">סה"כ הוצאות שנתי</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
                <p className="text-xs text-muted-foreground">ממוצע חודשי: {formatCurrency(totals.monthlyAvg)}</p>
              </div>
              <div className="rounded-lg bg-red-100 dark:bg-red-900/20 p-3">
                <Receipt className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">הוצאות קבועות</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.recurringTotal)}</p>
                <p className="text-xs text-muted-foreground">{totals.recurringCount} פריטים</p>
              </div>
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/20 p-3">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">הוצאות חד-פעמיות</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.oneTimeTotal)}</p>
                <p className="text-xs text-muted-foreground">{totals.oneTimeCount} פריטים</p>
              </div>
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/20 p-3">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">מגמה חודשית</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{growthAnalysis.percentage.toFixed(1)}%</p>
                  {growthAnalysis.trend === 'up' && (
                    <Badge className="bg-red-100 text-red-700">
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                      עלייה
                    </Badge>
                  )}
                  {growthAnalysis.trend === 'down' && (
                    <Badge className="bg-green-100 text-green-700">
                      <ArrowDownRight className="h-3 w-3 ml-1" />
                      ירידה
                    </Badge>
                  )}
                  {growthAnalysis.trend === 'stable' && (
                    <Badge variant="secondary">יציב</Badge>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/20 p-3">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="h-4 w-4 ml-2" />
          ייצוא PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <Download className="h-4 w-4 ml-2" />
          ייצוא Excel
        </Button>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="categories" dir="rtl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories" className="gap-2">
            <PieIcon className="h-4 w-4" />
            קטגוריות
          </TabsTrigger>
          <TabsTrigger value="trend" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            מגמה
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Receipt className="h-4 w-4" />
            ספקים
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            התראות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>התפלגות לפי קטגוריה</CardTitle>
                <CardDescription>חלוקת ההוצאות לפי סוג</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="total"
                        nameKey="name"
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>פירוט קטגוריות</CardTitle>
                <CardDescription>סכום וכמות לכל קטגוריה</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((cat, i) => (
                    <div key={cat.value} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">{cat.count} פריטים</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{formatCurrency(cat.total)}</p>
                        <p className="text-xs text-muted-foreground">{cat.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>מגמת הוצאות - 12 חודשים אחרונים</CardTitle>
              <CardDescription>השוואה בין הוצאות קבועות לחד-פעמיות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => monthlyTrend.find(m => m.month === label)?.fullMonth || label}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="recurring" 
                      name="קבועות"
                      stackId="1"
                      fill="hsl(217, 91%, 60%)"
                      stroke="hsl(217, 91%, 50%)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="oneTime" 
                      name="חד-פעמיות"
                      stackId="1"
                      fill="hsl(45, 93%, 47%)"
                      stroke="hsl(45, 93%, 37%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>ספקים מובילים</CardTitle>
              <CardDescription>5 הספקים עם ההוצאות הגבוהות ביותר</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSuppliers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="total" name="סכום" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>התראות וחריגות</CardTitle>
              <CardDescription>זיהוי דפוסי הוצאות חריגים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* High spending categories */}
                {categoryData.filter(c => c.percentage > 30).map(cat => (
                  <div key={cat.value} className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        קטגוריית {cat.name} מהווה {cat.percentage.toFixed(1)}% מההוצאות
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        סה"כ {formatCurrency(cat.total)} - מומלץ לבדוק אפשרויות לחיסכון
                      </p>
                    </div>
                  </div>
                ))}

                {/* Growth alert */}
                {growthAnalysis.trend === 'up' && growthAnalysis.percentage > 10 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <TrendingUp className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">
                        עלייה של {growthAnalysis.percentage.toFixed(1)}% בהוצאות החודש
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        בדקו מה גרם לעלייה והאם ניתן לצמצם
                      </p>
                    </div>
                  </div>
                )}

                {/* Recurring expenses alert */}
                {totals.recurringTotal > totals.total * 0.7 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        הוצאות קבועות מהוות {((totals.recurringTotal / totals.total) * 100).toFixed(0)}% מההוצאות
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        בדקו אם יש מנויים או שירותים שניתן לבטל
                      </p>
                    </div>
                  </div>
                )}

                {categoryData.filter(c => c.percentage > 30).length === 0 && 
                 growthAnalysis.percentage <= 10 && 
                 totals.recurringTotal <= totals.total * 0.7 && (
                  <div className="flex items-center justify-center p-8 text-center text-muted-foreground">
                    <div>
                      <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">אין התראות</p>
                      <p className="text-sm">ההוצאות שלך מאוזנות ובמגמה יציבה</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
