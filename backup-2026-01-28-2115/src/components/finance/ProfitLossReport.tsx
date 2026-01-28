import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  TrendingUp, 
  TrendingDown, 
  FileText,
  Download,
  Building2,
  Calendar,
  FolderOpen,
  BarChart3,
  Table,
  PieChartIcon,
  AreaChart,
  LineChart,
  Palette,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
} from 'recharts';
import { ProfitLossData, formatCurrency, EXPENSE_CATEGORIES } from '@/hooks/useFinanceCalculations';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ProfitLossReportProps {
  data: ProfitLossData;
  year?: number;
  vatRate: number;
}

// Chart view types
type ChartViewType = 'bar' | 'line' | 'area' | 'pie' | 'table';

// Preset color palettes
const COLOR_PALETTES = {
  default: ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)', 'hsl(280, 100%, 70%)', 'hsl(180, 60%, 50%)', 'hsl(320, 70%, 50%)', 'hsl(30, 80%, 50%)'],
  ocean: ['hsl(200, 80%, 50%)', 'hsl(180, 70%, 45%)', 'hsl(220, 75%, 55%)', 'hsl(190, 85%, 40%)', 'hsl(210, 90%, 60%)', 'hsl(170, 65%, 50%)', 'hsl(230, 70%, 65%)', 'hsl(195, 80%, 55%)'],
  sunset: ['hsl(20, 90%, 55%)', 'hsl(35, 95%, 50%)', 'hsl(0, 85%, 60%)', 'hsl(50, 90%, 45%)', 'hsl(10, 80%, 50%)', 'hsl(45, 85%, 55%)', 'hsl(25, 88%, 52%)', 'hsl(5, 82%, 58%)'],
  forest: ['hsl(120, 60%, 40%)', 'hsl(140, 55%, 45%)', 'hsl(100, 50%, 35%)', 'hsl(160, 65%, 40%)', 'hsl(80, 45%, 50%)', 'hsl(130, 60%, 42%)', 'hsl(150, 58%, 48%)', 'hsl(110, 52%, 38%)'],
  purple: ['hsl(270, 80%, 55%)', 'hsl(290, 75%, 50%)', 'hsl(250, 70%, 60%)', 'hsl(310, 85%, 45%)', 'hsl(260, 78%, 52%)', 'hsl(280, 72%, 48%)', 'hsl(300, 80%, 55%)', 'hsl(240, 68%, 58%)'],
  monochrome: ['hsl(220, 15%, 25%)', 'hsl(220, 15%, 35%)', 'hsl(220, 15%, 45%)', 'hsl(220, 15%, 55%)', 'hsl(220, 15%, 65%)', 'hsl(220, 15%, 75%)', 'hsl(220, 15%, 85%)', 'hsl(220, 15%, 95%)'],
};

type PaletteName = keyof typeof COLOR_PALETTES;

const PALETTE_NAMES: Record<PaletteName, string> = {
  default: 'ברירת מחדל',
  ocean: 'אוקיינוס',
  sunset: 'שקיעה',
  forest: 'יער',
  purple: 'סגול',
  monochrome: 'מונוכרום',
};

// View toggle component
const ViewModeToggle = ({ 
  viewMode, 
  onViewModeChange 
}: { 
  viewMode: ChartViewType; 
  onViewModeChange: (mode: ChartViewType) => void;
}) => (
  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
    <Button
      variant={viewMode === 'bar' ? 'secondary' : 'ghost'}
      size="sm"
      className="h-7 w-7 p-0"
      onClick={() => onViewModeChange('bar')}
      title="גרף עמודות"
    >
      <BarChart3 className="h-4 w-4" />
    </Button>
    <Button
      variant={viewMode === 'line' ? 'secondary' : 'ghost'}
      size="sm"
      className="h-7 w-7 p-0"
      onClick={() => onViewModeChange('line')}
      title="גרף קווי"
    >
      <LineChart className="h-4 w-4" />
    </Button>
    <Button
      variant={viewMode === 'area' ? 'secondary' : 'ghost'}
      size="sm"
      className="h-7 w-7 p-0"
      onClick={() => onViewModeChange('area')}
      title="גרף שטח"
    >
      <AreaChart className="h-4 w-4" />
    </Button>
    <Button
      variant={viewMode === 'pie' ? 'secondary' : 'ghost'}
      size="sm"
      className="h-7 w-7 p-0"
      onClick={() => onViewModeChange('pie')}
      title="גרף עוגה"
    >
      <PieChartIcon className="h-4 w-4" />
    </Button>
    <Button
      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
      size="sm"
      className="h-7 w-7 p-0"
      onClick={() => onViewModeChange('table')}
      title="טבלה"
    >
      <Table className="h-4 w-4" />
    </Button>
  </div>
);

// Color picker component
const ColorPalettePicker = ({
  selectedPalette,
  onPaletteChange,
}: {
  selectedPalette: PaletteName;
  onPaletteChange: (palette: PaletteName) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="sm" className="h-7 gap-1">
        <Palette className="h-4 w-4" />
        <div className="flex gap-0.5">
          {COLOR_PALETTES[selectedPalette].slice(0, 4).map((color, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-60 p-2" align="end">
      <div className="space-y-2">
        <p className="text-sm font-medium px-1">בחר ערכת צבעים</p>
        {(Object.keys(COLOR_PALETTES) as PaletteName[]).map((palette) => (
          <button
            key={palette}
            onClick={() => onPaletteChange(palette)}
            className={cn(
              "w-full flex items-center gap-2 p-2 rounded-lg transition-colors",
              "hover:bg-accent",
              selectedPalette === palette && "bg-accent"
            )}
          >
            <div className="flex gap-1">
              {COLOR_PALETTES[palette].slice(0, 6).map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-sm">{PALETTE_NAMES[palette]}</span>
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);

export default function ProfitLossReport({ data, year, vatRate }: ProfitLossReportProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [monthlyViewMode, setMonthlyViewMode] = useState<ChartViewType>('bar');
  const [clientsViewMode, setClientsViewMode] = useState<ChartViewType>('pie');
  const [expensesViewMode, setExpensesViewMode] = useState<ChartViewType>('bar');
  const [colorPalette, setColorPalette] = useState<PaletteName>('default');
  
  const COLORS = COLOR_PALETTES[colorPalette];

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text('דוח רווח והפסד', pageWidth / 2, 20, { align: 'center' });
    
    if (year) {
      doc.setFontSize(12);
      doc.text(`שנת ${year}`, pageWidth / 2, 30, { align: 'center' });
    }

    // Summary section
    doc.setFontSize(14);
    let y = 45;
    
    doc.text('סיכום', 180, y, { align: 'right' });
    y += 10;
    
    doc.setFontSize(11);
    doc.text(`הכנסות כולל מע"מ: ${formatCurrency(data.totalIncome)}`, 180, y, { align: 'right' });
    y += 7;
    doc.text(`הכנסות לפני מע"מ: ${formatCurrency(data.incomeBeforeVat)}`, 180, y, { align: 'right' });
    y += 7;
    doc.text(`מע"מ עסקאות: ${formatCurrency(data.vatOnIncome)}`, 180, y, { align: 'right' });
    y += 10;
    
    doc.text(`הוצאות כולל מע"מ: ${formatCurrency(data.totalExpenses)}`, 180, y, { align: 'right' });
    y += 7;
    doc.text(`הוצאות לפני מע"מ: ${formatCurrency(data.expensesBeforeVat)}`, 180, y, { align: 'right' });
    y += 7;
    doc.text(`מע"מ תשומות: ${formatCurrency(data.vatOnExpenses)}`, 180, y, { align: 'right' });
    y += 10;
    
    doc.setFontSize(12);
    doc.text(`רווח גולמי: ${formatCurrency(data.grossProfit)}`, 180, y, { align: 'right' });
    y += 7;
    doc.text(`רווח נקי: ${formatCurrency(data.netProfit)}`, 180, y, { align: 'right' });
    y += 7;
    doc.text(`מע"מ לתשלום: ${formatCurrency(data.vatToPay)}`, 180, y, { align: 'right' });
    
    doc.save(`profit-loss-report${year ? `-${year}` : ''}.pdf`);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['דוח רווח והפסד', year ? `שנת ${year}` : 'כל השנים'],
      [],
      ['הכנסות'],
      ['כולל מע"מ', data.totalIncome],
      ['לפני מע"מ', data.incomeBeforeVat],
      ['מע"מ עסקאות', data.vatOnIncome],
      [],
      ['הוצאות'],
      ['כולל מע"מ', data.totalExpenses],
      ['לפני מע"מ', data.expensesBeforeVat],
      ['מע"מ תשומות', data.vatOnExpenses],
      [],
      ['סיכום'],
      ['רווח גולמי', data.grossProfit],
      ['רווח נקי', data.netProfit],
      ['מע"מ לתשלום', data.vatToPay],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'סיכום');

    // Income by client
    const clientData = [
      ['הכנסות לפי לקוח'],
      ['לקוח', 'סכום'],
      ...data.incomeByClient.map(c => [c.name, c.amount]),
    ];
    const clientSheet = XLSX.utils.aoa_to_sheet(clientData);
    XLSX.utils.book_append_sheet(wb, clientSheet, 'לקוחות');

    // Expenses by category
    const categoryData = [
      ['הוצאות לפי קטגוריה'],
      ['קטגוריה', 'סכום'],
      ...data.expensesByCategory.map(c => [c.label, c.amount]),
    ];
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categorySheet, 'הוצאות');

    XLSX.writeFile(wb, `profit-loss-report${year ? `-${year}` : ''}.xlsx`);
  };

  // Render chart based on view mode
  const renderMonthlyChart = () => {
    if (monthlyViewMode === 'table') {
      return (
        <UITable>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">חודש</TableHead>
              <TableHead className="text-left">סכום</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.incomeByMonth.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.month}</TableCell>
                <TableCell className={item.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </UITable>
      );
    }

    if (monthlyViewMode === 'pie') {
      const positiveData = data.incomeByMonth.filter(d => d.amount > 0);
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={positiveData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="amount"
              nameKey="month"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {positiveData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (monthlyViewMode === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data.incomeByMonth}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'הכנסות']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke={COLORS[0]} 
              strokeWidth={2}
              dot={{ fill: COLORS[0], strokeWidth: 2 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    }

    if (monthlyViewMode === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data.incomeByMonth}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'הכנסות']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke={COLORS[0]} 
              fill={COLORS[0]}
              fillOpacity={0.3}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      );
    }

    // Default: bar chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.incomeByMonth}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'הכנסות']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="amount" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderClientsChart = () => {
    if (clientsViewMode === 'table') {
      return (
        <UITable>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-left">סכום</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.incomeByClient.map((client, index) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-green-600 font-bold">
                  {formatCurrency(client.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </UITable>
      );
    }

    if (clientsViewMode === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.incomeByClient.slice(0, 8)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
            <YAxis dataKey="name" type="category" className="text-xs" width={100} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'סכום']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {data.incomeByClient.slice(0, 8).map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Default: pie chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.incomeByClient.slice(0, 8)}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="amount"
            nameKey="name"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.incomeByClient.slice(0, 8).map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderExpensesChart = () => {
    if (expensesViewMode === 'table') {
      return (
        <UITable>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">קטגוריה</TableHead>
              <TableHead className="text-left">סכום</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.expensesByCategory.map((cat) => (
              <TableRow key={cat.category}>
                <TableCell className="font-medium">{cat.label}</TableCell>
                <TableCell className="text-red-600 font-bold">
                  {formatCurrency(cat.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </UITable>
      );
    }

    if (expensesViewMode === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.expensesByCategory}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="amount"
              nameKey="label"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {data.expensesByCategory.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // Default: bar chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.expensesByCategory} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
          <YAxis dataKey="label" type="category" className="text-xs" width={100} />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'סכום']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="amount" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="border-2 border-green-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              דוח רווח והפסד
            </CardTitle>
            <CardDescription>סיכום פיננסי מפורט {year && `לשנת ${year}`}</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {year && <Badge variant="outline">{year}</Badge>}
            <Badge variant="outline">מע"מ {vatRate}%</Badge>
            <ColorPalettePicker 
              selectedPalette={colorPalette} 
              onPaletteChange={setColorPalette} 
            />
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 ml-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 ml-1" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              סיכום
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1">
              <Building2 className="h-4 w-4" />
              לפי לקוח
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-1">
              <Calendar className="h-4 w-4" />
              לפי חודש
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1">
              <FolderOpen className="h-4 w-4" />
              הוצאות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Income */}
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4" />
                  הכנסות
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>כולל מע"מ:</span>
                    <span className="font-bold">{formatCurrency(data.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>לפני מע"מ:</span>
                    <span>{formatCurrency(data.incomeBeforeVat)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 pt-1 border-t">
                    <span>מע"מ עסקאות:</span>
                    <span className="font-semibold">{formatCurrency(data.vatOnIncome)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                <h4 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4" />
                  הוצאות
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>כולל מע"מ:</span>
                    <span className="font-bold">{formatCurrency(data.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>לפני מע"מ:</span>
                    <span>{formatCurrency(data.expensesBeforeVat)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 pt-1 border-t">
                    <span>מע"מ תשומות:</span>
                    <span className="font-semibold">{formatCurrency(data.vatOnExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <h4 className="font-semibold text-primary flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4" />
                  סיכום
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>רווח גולמי:</span>
                    <span className={`font-bold ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.grossProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>רווח נקי:</span>
                    <span className={`font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-primary pt-1 border-t">
                    <span>מע"מ לתשלום:</span>
                    <span className="font-bold">{formatCurrency(data.vatToPay)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Margin */}
            {data.totalIncome > 0 && (
              <div className="p-4 bg-accent/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">מרווח רווח נקי</span>
                  <span className={`text-lg font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.round((data.netProfit / data.incomeBeforeVat) * 100)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-full transition-all ${data.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs((data.netProfit / data.incomeBeforeVat) * 100), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            {data.incomeByClient.length > 0 ? (
              <>
                <div className="flex justify-end mb-2">
                  <ViewModeToggle viewMode={clientsViewMode} onViewModeChange={setClientsViewMode} />
                </div>
                <div className={clientsViewMode === 'table' ? '' : 'h-[300px]'}>
                  {renderClientsChart()}
                </div>
                {clientsViewMode !== 'table' && (
                  <div className="space-y-2">
                    {data.incomeByClient.map((client, index) => (
                      <div key={client.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{client.name}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(client.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                אין נתוני הכנסות לפי לקוח
              </div>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <div className="flex justify-end mb-2">
              <ViewModeToggle viewMode={monthlyViewMode} onViewModeChange={setMonthlyViewMode} />
            </div>
            <div className={monthlyViewMode === 'table' ? '' : 'h-[300px]'}>
              {renderMonthlyChart()}
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            {data.expensesByCategory.length > 0 ? (
              <>
                <div className="flex justify-end mb-2">
                  <ViewModeToggle viewMode={expensesViewMode} onViewModeChange={setExpensesViewMode} />
                </div>
                <div className={expensesViewMode === 'table' ? '' : 'h-[300px]'}>
                  {renderExpensesChart()}
                </div>
                {expensesViewMode !== 'table' && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {data.expensesByCategory.map((cat, index) => (
                      <div key={cat.category} className="flex items-center justify-between p-2 border rounded-lg">
                        <span className="font-medium">{cat.label}</span>
                        <span className="font-bold text-red-600">{formatCurrency(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                אין נתוני הוצאות לפי קטגוריה
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
