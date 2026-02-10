import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Plus,
  Calendar,
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  Loader2,
  Receipt,
  CreditCard,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  MinusCircle,
  Calculator,
  Trash2,
  Pencil,
  Eye,
  ExternalLink,
  BarChart3,
  Target,
  Bell,
  Mail,
  MessageCircle,
  LayoutGrid,
  LayoutList,
  Grid3X3,
  Grid2X2,
  CloudUpload,
} from 'lucide-react';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// New finance components
import { useFinanceCalculations, Invoice as FinanceInvoice, Expense as FinanceExpense } from '@/hooks/useFinanceCalculations';
import {
  FinanceKPIs,
  CashFlowForecast,
  ProfitLossReport,
  BudgetManager,
  PartialPaymentDialog,
  AlertsSettings,
  FinancePageSettings,
  CollapsibleSection,
  FinanceSection,
  BankTransactionsView,
  FinanceTabs,
  FinanceWidget,
  FinanceTab,
} from '@/components/finance';
import { RevenueForecastChart } from '@/components/analytics';
import { exportInvoiceToPDF } from '@/lib/pdf-export';

// Types
interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name?: string;
  project_id: string | null;
  project_name?: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  created_at: string;
  green_invoice_id?: string | null;
  paid_amount?: number;
  remaining_amount?: number;
}

interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  has_vat: boolean;
  supplier_name: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
  is_recurring: boolean;
  recurring_day: number | null;
}

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string | null;
}

const EXPENSE_CATEGORIES = [
  { value: 'supplier', label: 'ספקים' },
  { value: 'equipment', label: 'ציוד' },
  { value: 'rent', label: 'שכירות' },
  { value: 'marketing', label: 'שיווק ופרסום' },
  { value: 'office', label: 'משרד' },
  { value: 'travel', label: 'נסיעות' },
  { value: 'software', label: 'תוכנה ומנויים' },
  { value: 'professional', label: 'שירותים מקצועיים' },
  { value: 'other', label: 'אחר' },
];

// Status badge component
const InvoiceStatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'טיוטה', color: 'bg-gray-500/20 text-gray-600', icon: <FileText className="h-3 w-3" /> },
    sent: { label: 'נשלח', color: 'bg-blue-500/20 text-blue-600', icon: <Send className="h-3 w-3" /> },
    paid: { label: 'שולם', color: 'bg-green-500/20 text-green-600', icon: <CheckCircle className="h-3 w-3" /> },
    overdue: { label: 'באיחור', color: 'bg-red-500/20 text-red-600', icon: <AlertCircle className="h-3 w-3" /> },
    cancelled: { label: 'בוטל', color: 'bg-gray-500/20 text-gray-500', icon: <AlertCircle className="h-3 w-3" /> },
  };
  
  const { label, color, icon } = config[status] || config.draft;
  
  return (
    <Badge className={`${color} border-0 gap-1`}>
      {icon}
      {label}
    </Badge>
  );
};

// Stats Card Component - Memoized for performance
const StatsCard = React.memo(({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  trendValue 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
}) => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
));

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)', 'hsl(280, 100%, 70%)'];

// View Toggle Component for Year/Month
const ViewToggle = ({ 
  view, 
  onViewChange, 
  years,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
}: { 
  view: 'year' | 'month'; 
  onViewChange: (view: 'year' | 'month') => void;
  years?: number[];
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  selectedMonth?: number;
  onMonthChange?: (month: number) => void;
}) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={view === 'year' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onViewChange('year')}
      >
        <Calendar className="h-3.5 w-3.5 ml-1" />
        שנה
      </Button>
      <Button
        variant={view === 'month' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onViewChange('month')}
      >
        <CalendarDays className="h-3.5 w-3.5 ml-1" />
        חודש
      </Button>
    </div>
    {view === 'year' && years && selectedYear && onYearChange && (
      <Select value={selectedYear.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
        <SelectTrigger className="h-7 w-20 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    {view === 'month' && selectedMonth && onMonthChange && (
      <Select value={selectedMonth.toString()} onValueChange={(v) => onMonthChange(parseInt(v))}>
        <SelectTrigger className="h-7 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }, (_, i) => (
            <SelectItem key={i + 1} value={(i + 1).toString()}>
              {format(new Date(2024, i, 1), 'MMMM', { locale: he })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  </div>
);

// Format currency without cents (agurot)
const formatCurrency = (amount: number): string => {
  return `₪${Math.round(amount).toLocaleString('he-IL')}`;
};

export default function Finance() {
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isSendingToGreenInvoice, setIsSendingToGreenInvoice] = useState(false);
  const [isSyncingFromGreenInvoice, setIsSyncingFromGreenInvoice] = useState(false);
  const [isSyncingPdfs, setIsSyncingPdfs] = useState(false);
  const [isViewingInvoice, setIsViewingInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceViewUrl, setInvoiceViewUrl] = useState<string | null>(null);
  const [isInvoiceViewDialogOpen, setIsInvoiceViewDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [invoicesViewMode, setInvoicesViewMode] = useState<'list' | 'cards' | 'grid3' | 'grid4'>('list');
  
  // New finance features state
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(true);
  const [isPartialPaymentDialogOpen, setIsPartialPaymentDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  
  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareInvoice, setShareInvoice] = useState<Invoice | null>(null);
  
  // VAT rate
  const [vatRate, setVatRate] = useState<number>(18);
  
  // Top clients limit
  const [topClientsLimit, setTopClientsLimit] = useState<number>(5);
  
  // View mode for analytics sections (year vs month)
  const [strongestMonthsView, setStrongestMonthsView] = useState<'year' | 'month'>('month');
  const [yearBreakdownView, setYearBreakdownView] = useState<'year' | 'month'>('year');
  const [topClientsView, setTopClientsView] = useState<'year' | 'month'>('year');
  const [monthlyChartView, setMonthlyChartView] = useState<'year' | 'month'>('month');
  const [revenueChartView, setRevenueChartView] = useState<'year' | 'month'>('month');
  const [selectedViewYear, setSelectedViewYear] = useState<number>(new Date().getFullYear());
  const [selectedViewMonth, setSelectedViewMonth] = useState<number>(new Date().getMonth() + 1);
  
  // Advanced filters
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Page sections configuration
  const defaultSections: FinanceSection[] = [
    { id: 'kpis', name: 'מדדים מרכזיים', icon: <BarChart3 className="h-4 w-4" />, visible: true, order: 0 },
    { id: 'cashflow', name: 'תזרים מזומנים', icon: <TrendingUp className="h-4 w-4" />, visible: true, order: 1 },
    { id: 'vat-summary', name: 'סיכום רווח ומע"מ', icon: <Calculator className="h-4 w-4" />, visible: true, order: 2 },
    { id: 'invoices-summary', name: 'סיכום חשבוניות', icon: <PieChart className="h-4 w-4" />, visible: true, order: 3 },
    { id: 'invoices-table', name: 'טבלת חשבוניות', icon: <FileText className="h-4 w-4" />, visible: true, order: 4 },
    { id: 'expenses', name: 'הוצאות', icon: <Receipt className="h-4 w-4" />, visible: true, order: 5 },
    { id: 'bank-transactions', name: 'תנועות בנק', icon: <CreditCard className="h-4 w-4" />, visible: true, order: 6 },
    { id: 'top-clients', name: 'לקוחות מובילים', icon: <Wallet className="h-4 w-4" />, visible: true, order: 7 },
    { id: 'debts', name: 'חובות פתוחים', icon: <AlertCircle className="h-4 w-4" />, visible: true, order: 8 },
    { id: 'profit-loss', name: 'דוח רווח והפסד', icon: <FileText className="h-4 w-4" />, visible: true, order: 9 },
    { id: 'budget', name: 'ניהול תקציב', icon: <Target className="h-4 w-4" />, visible: true, order: 10 },
    { id: 'alerts', name: 'התראות', icon: <Bell className="h-4 w-4" />, visible: true, order: 11 },
  ];
  const [pageSections, setPageSections] = useState<FinanceSection[]>(defaultSections);
  
  const isSectionVisible = (id: string) => pageSections.find(s => s.id === id)?.visible ?? true;

  // Finance Tabs Configuration
  const financeTabs: FinanceTab[] = [
    { id: 'overview', name: 'סקירה כללית', icon: <BarChart3 className="h-4 w-4" />, widgets: ['kpis', 'cashflow', 'vat-summary'] },
    { id: 'invoices', name: 'חשבוניות', icon: <FileText className="h-4 w-4" />, widgets: ['invoices-summary', 'invoices-table'] },
    { id: 'expenses', name: 'הוצאות', icon: <Receipt className="h-4 w-4" />, widgets: ['expenses'] },
    { id: 'bank', name: 'תנועות בנק', icon: <CreditCard className="h-4 w-4" />, widgets: ['bank-transactions'] },
    { id: 'clients', name: 'לקוחות', icon: <Wallet className="h-4 w-4" />, widgets: ['top-clients', 'debts'] },
    { id: 'reports', name: 'דוחות', icon: <PieChart className="h-4 w-4" />, widgets: ['profit-loss', 'budget', 'alerts'] },
  ];

  // Finance Widgets Configuration  
  const defaultWidgets: FinanceWidget[] = [
    { id: 'kpis', name: 'מדדים מרכזיים', icon: <BarChart3 className="h-4 w-4" />, visible: true, order: 0, size: 'full', collapsed: false, tabId: 'overview' },
    { id: 'cashflow', name: 'תזרים מזומנים', icon: <TrendingUp className="h-4 w-4" />, visible: true, order: 1, size: 'large', collapsed: false, tabId: 'overview' },
    { id: 'vat-summary', name: 'סיכום רווח ומע"מ', icon: <Calculator className="h-4 w-4" />, visible: true, order: 2, size: 'full', collapsed: false, tabId: 'overview' },
    { id: 'invoices-summary', name: 'סיכום חשבוניות', icon: <PieChart className="h-4 w-4" />, visible: true, order: 0, size: 'full', collapsed: false, tabId: 'invoices' },
    { id: 'invoices-table', name: 'טבלת חשבוניות', icon: <FileText className="h-4 w-4" />, visible: true, order: 1, size: 'full', collapsed: false, tabId: 'invoices' },
    { id: 'expenses', name: 'הוצאות', icon: <Receipt className="h-4 w-4" />, visible: true, order: 0, size: 'full', collapsed: false, tabId: 'expenses' },
    { id: 'bank-transactions', name: 'תנועות בנק', icon: <CreditCard className="h-4 w-4" />, visible: true, order: 0, size: 'full', collapsed: false, tabId: 'bank' },
    { id: 'top-clients', name: 'לקוחות מובילים', icon: <Wallet className="h-4 w-4" />, visible: true, order: 0, size: 'medium', collapsed: false, tabId: 'clients' },
    { id: 'debts', name: 'חובות פתוחים', icon: <AlertCircle className="h-4 w-4" />, visible: true, order: 1, size: 'medium', collapsed: false, tabId: 'clients' },
    { id: 'profit-loss', name: 'דוח רווח והפסד', icon: <FileText className="h-4 w-4" />, visible: true, order: 0, size: 'full', collapsed: false, tabId: 'reports' },
    { id: 'budget', name: 'ניהול תקציב', icon: <Target className="h-4 w-4" />, visible: true, order: 1, size: 'large', collapsed: false, tabId: 'reports' },
    { id: 'alerts', name: 'התראות', icon: <Bell className="h-4 w-4" />, visible: true, order: 2, size: 'medium', collapsed: false, tabId: 'reports' },
  ];
  const [financeWidgets, setFinanceWidgets] = useState<FinanceWidget[]>(defaultWidgets);
  const [useTabsView, setUseTabsView] = useState(true);

  // Form state
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    client_id: '',
    project_id: '',
    amount: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    description: '',
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'other',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    has_vat: true,
    supplier_name: '',
    receipt_number: '',
    notes: '',
    is_recurring: false,
    recurring_day: 1,
  });
  
  // Edit expense state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);

  // Helper functions for VAT calculations
  const removeVat = (amount: number): number => {
    return amount / (1 + vatRate / 100);
  };

  const getVatAmount = (amount: number): number => {
    return amount - removeVat(amount);
  };

  // Calculate annual expenses with recurring expenses multiplied by 12
  const calculateAnnualExpenses = (expensesList: Expense[], year?: number) => {
    // Filter by year if provided
    const filteredExpenses = year 
      ? expensesList.filter(e => new Date(e.expense_date).getFullYear() === year)
      : expensesList;
    
    // Calculate total: recurring expenses * 12, non-recurring * 1
    const totalExpenses = filteredExpenses.reduce((sum, e) => {
      const amount = Number(e.amount);
      return sum + (e.is_recurring ? amount * 12 : amount);
    }, 0);
    
    // Calculate expenses with VAT: only those with has_vat = true
    const expensesWithVat = filteredExpenses.reduce((sum, e) => {
      if (!e.has_vat) return sum;
      const amount = Number(e.amount);
      return sum + (e.is_recurring ? amount * 12 : amount);
    }, 0);
    
    const expensesWithoutVat = totalExpenses - expensesWithVat;
    const vatInputs = getVatAmount(expensesWithVat);
    const expensesBeforeVat = removeVat(expensesWithVat) + expensesWithoutVat;
    
    return {
      total: totalExpenses,
      withVat: expensesWithVat,
      withoutVat: expensesWithoutVat,
      vatInputs,
      beforeVat: expensesBeforeVat,
      recurringCount: filteredExpenses.filter(e => e.is_recurring).length,
      oneTimeCount: filteredExpenses.filter(e => !e.is_recurring).length,
    };
  };

  // Get filtered expenses based on year filter (memoized)
  const filteredExpensesForAnalytics = useMemo(() => {
    if (yearFilter !== 'all') {
      return expenses.filter(e => new Date(e.expense_date).getFullYear().toString() === yearFilter);
    }
    return expenses;
  }, [expenses, yearFilter]);

  // Fetch data
  useEffect(() => {
    fetchData();
    fetchVatRate();
    fetchExpenses();
  }, [fetchData, fetchVatRate, fetchExpenses]);

  const fetchVatRate = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('app_settings')
      .select('vat_rate')
      .eq('user_id', user.id)
      .single();
    if (data?.vat_rate) {
      setVatRate(data.vat_rate);
    }
  }, [user]);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    if (data) {
      setExpenses(data);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [invoicesRes, clientsRes, projectsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select(`
            *,
            clients(name),
            projects(name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('projects').select('id, name, client_id').order('name'),
      ]);

      if (invoicesRes.data) {
        setInvoices(invoicesRes.data.map(inv => ({
          ...inv,
          client_name: (inv.clients as any)?.name,
          project_name: (inv.projects as any)?.name,
        })));
      }
      if (clientsRes.data) setClients(clientsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Calculate stats - filtered by year if selected (memoized for performance)
  const filteredPaidInvoices = useMemo(() => {
    let filtered = invoices.filter(i => i.status === 'paid');
    if (yearFilter !== 'all') {
      filtered = filtered.filter(i => new Date(i.issue_date).getFullYear().toString() === yearFilter);
    }
    return filtered;
  }, [invoices, yearFilter]);

  const stats = useMemo(() => {
    const sentInvoices = invoices.filter(i => i.status === 'sent');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    const currentMonthStart = startOfMonth(new Date());
    
    return {
      totalRevenue: filteredPaidInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
      pendingPayments: sentInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
      overdueAmount: overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
      thisMonthRevenue: invoices
        .filter(i => i.status === 'paid' && i.paid_date && new Date(i.paid_date) >= currentMonthStart)
        .reduce((sum, i) => sum + Number(i.amount), 0),
      invoiceCount: invoices.length,
      paidCount: filteredPaidInvoices.length,
      overdueCount: overdueInvoices.length,
    };
  }, [invoices, filteredPaidInvoices]);

  // Calculate expense stats for selected year filter
  const expenseStats = calculateAnnualExpenses(
    expenses, 
    yearFilter !== 'all' ? parseInt(yearFilter) : undefined
  );

  // Use the new finance calculations hook
  const selectedYear = yearFilter !== 'all' ? parseInt(yearFilter) : undefined;
  const { kpis, cashFlowForecast, profitLoss, monthlyBreakdown } = useFinanceCalculations(
    invoices as any,
    expenses as any,
    clients,
    vatRate,
    selectedYear
  );

  // Expenses by category for budget manager
  const expensesByCategory = useMemo(() => {
    return EXPENSE_CATEGORIES.map(cat => {
      const catExpenses = expenses.filter(e => e.category === cat.value);
      const total = catExpenses.reduce((sum, e) => {
        const amount = Number(e.amount);
        return sum + (e.is_recurring ? amount * 12 : amount);
      }, 0);
      return { category: cat.value, amount: total };
    });
  }, [expenses]);

  // Monthly revenue chart data (memoized)
  const monthlyData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const revenue = invoices
      .filter(inv => inv.status === 'paid' && inv.paid_date)
      .filter(inv => {
        const paidDate = parseISO(inv.paid_date!);
        return paidDate >= monthStart && paidDate <= monthEnd;
      })
      .reduce((sum, inv) => sum + Number(inv.amount), 0);

    return {
      month: format(date, 'MMM', { locale: he }),
      revenue,
    };
  }), [invoices]);

  // Status distribution for pie chart (memoized)
  const statusDistribution = useMemo(() => [
    { name: 'שולם', value: invoices.filter(i => i.status === 'paid').length, color: COLORS[0] },
    { name: 'נשלח', value: invoices.filter(i => i.status === 'sent').length, color: COLORS[1] },
    { name: 'באיחור', value: invoices.filter(i => i.status === 'overdue').length, color: COLORS[3] },
    { name: 'טיוטה', value: invoices.filter(i => i.status === 'draft').length, color: COLORS[4] },
  ].filter(s => s.value > 0), [invoices]);

  // Get unique years from invoices (memoized)
  const years = useMemo(() => 
    [...new Set(invoices.map(i => new Date(i.issue_date).getFullYear()))].sort((a, b) => b - a),
    [invoices]
  );
  
  // Get unique clients from invoices
  const invoiceClients = [...new Set(invoices.map(i => i.client_id))];

  // Memoized filtered invoices for performance
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];
    
    // Status filter
    if (filter !== 'all') {
      filtered = filtered.filter(i => i.status === filter);
    }
    
    // Date range filter
    if (dateFromFilter) {
      filtered = filtered.filter(i => i.issue_date >= dateFromFilter);
    }
    if (dateToFilter) {
      filtered = filtered.filter(i => i.issue_date <= dateToFilter);
    }
    
    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(i => new Date(i.issue_date).getFullYear().toString() === yearFilter);
    }
    
    // Month filter
    if (monthFilter !== 'all') {
      filtered = filtered.filter(i => (new Date(i.issue_date).getMonth() + 1).toString() === monthFilter);
    }
    
    // Client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(i => i.client_id === clientFilter);
    }
    
    return filtered;
  }, [invoices, filter, dateFromFilter, dateToFilter, yearFilter, monthFilter, clientFilter]);

  // Analytics calculations - memoized for performance
  const analytics = useMemo(() => ({
    // Monthly breakdown - shows data for current filter
    monthlyBreakdown: Array.from({ length: 12 }, (_, i) => {
      const monthInvoices = filteredInvoices.filter(inv => {
        const date = new Date(inv.issue_date);
        return date.getMonth() === i;
      });
      return {
        month: format(new Date(2024, i, 1), 'MMM', { locale: he }),
        monthNum: i + 1,
        count: monthInvoices.length,
        total: monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
        paid: monthInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0),
      };
    }),
    
    // Client breakdown - based on filtered invoices
    clientBreakdown: clients.map(client => {
      const clientInvoices = filteredInvoices.filter(i => i.client_id === client.id);
      return {
        name: client.name,
        id: client.id,
        count: clientInvoices.length,
        total: clientInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
        paid: clientInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0),
      };
    }).filter(c => c.count > 0).sort((a, b) => b.total - a.total),
    
    // Year breakdown - always shows all years for reference
    yearBreakdown: years.map(year => {
      const yearInvoices = invoices.filter(i => new Date(i.issue_date).getFullYear() === year);
      return {
        year,
        count: yearInvoices.length,
        total: yearInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
        paid: yearInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0),
      };
    }),
    
    // Strongest months (top 3) - based on filtered invoices
    strongestMonths: Array.from({ length: 12 }, (_, i) => {
      const monthInvoices = filteredInvoices.filter(inv => new Date(inv.issue_date).getMonth() === i);
      return {
        month: format(new Date(2024, i, 1), 'MMMM', { locale: he }),
        monthNum: i + 1,
        total: monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
      };
    }).filter(m => m.total > 0).sort((a, b) => b.total - a.total).slice(0, 3),
    
    // Summary for filtered data
    filteredSummary: {
      totalAmount: filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
      paidAmount: filteredInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0),
      count: filteredInvoices.length,
    },
  }), [filteredInvoices, clients, years, invoices]);

  // Create invoice
  const handleCreateInvoice = async () => {
    if (!invoiceForm.invoice_number || !invoiceForm.client_id || !invoiceForm.amount) {
      toast({ title: 'נא למלא את כל השדות החובה', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('invoices').insert({
        invoice_number: invoiceForm.invoice_number,
        client_id: invoiceForm.client_id,
        project_id: invoiceForm.project_id || null,
        amount: parseFloat(invoiceForm.amount),
        issue_date: invoiceForm.issue_date,
        due_date: invoiceForm.due_date || null,
        description: invoiceForm.description || null,
        status: 'draft',
        created_by: user?.id,
      });

      if (error) throw error;

      toast({ title: 'החשבונית נוצרה בהצלחה' });
      setIsCreateDialogOpen(false);
      setInvoiceForm({
        invoice_number: '',
        client_id: '',
        project_id: '',
        amount: '',
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: '',
        description: '',
      });
      fetchData();
    } catch (error: any) {
      toast({ title: 'שגיאה ביצירת חשבונית', description: error.message, variant: 'destructive' });
    }
  };

  // Create expense
  const handleCreateExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast({ title: 'נא למלא תיאור וסכום', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: user?.id,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        expense_date: expenseForm.expense_date,
        has_vat: expenseForm.has_vat,
        supplier_name: expenseForm.supplier_name || null,
        receipt_number: expenseForm.receipt_number || null,
        notes: expenseForm.notes || null,
        is_recurring: expenseForm.is_recurring,
        recurring_day: expenseForm.is_recurring ? expenseForm.recurring_day : null,
      });

      if (error) throw error;

      toast({ title: 'ההוצאה נוספה בהצלחה' });
      setIsExpenseDialogOpen(false);
      setExpenseForm({
        description: '',
        amount: '',
        category: 'other',
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        has_vat: true,
        supplier_name: '',
        receipt_number: '',
        notes: '',
        is_recurring: false,
        recurring_day: 1,
      });
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'שגיאה בהוספת הוצאה', description: error.message, variant: 'destructive' });
    }
  };
  
  // Update expense
  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    
    try {
      const { error } = await supabase.from('expenses')
        .update({
          description: editingExpense.description,
          amount: editingExpense.amount,
          category: editingExpense.category,
          expense_date: editingExpense.expense_date,
          has_vat: editingExpense.has_vat,
          supplier_name: editingExpense.supplier_name,
          receipt_number: editingExpense.receipt_number,
          notes: editingExpense.notes,
          is_recurring: editingExpense.is_recurring,
          recurring_day: editingExpense.is_recurring ? editingExpense.recurring_day : null,
        })
        .eq('id', editingExpense.id);

      if (error) throw error;

      toast({ title: 'ההוצאה עודכנה בהצלחה' });
      setIsEditExpenseDialogOpen(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'שגיאה בעדכון הוצאה', description: error.message, variant: 'destructive' });
    }
  };
  
  // Open edit expense dialog
  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditExpenseDialogOpen(true);
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast({ title: 'ההוצאה נמחקה' });
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'שגיאה במחיקת הוצאה', description: error.message, variant: 'destructive' });
    }
  };

  // Update invoice status
  const updateInvoiceStatus = async (invoiceId: string, newStatus: string, paidDate?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (paidDate) updateData.paid_date = paidDate;

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) throw error;

      toast({ title: 'סטטוס החשבונית עודכן' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'שגיאה בעדכון סטטוס', description: error.message, variant: 'destructive' });
    }
  };

  // Sync from Green Invoice - ALL PAGES
  const syncFromGreenInvoice = async () => {
    setIsSyncingFromGreenInvoice(true);

    try {
      const { data, error } = await supabase.functions.invoke('green-invoice', {
        body: { action: 'list_all_invoices' }, // Use list_all_invoices to get all pages
      });

      if (error) throw error;
      if (data?.success && data?.data?.items) {
        const greenInvoices = data.data.items;
        let importedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        // Refresh clients list to get latest
        const { data: latestClients } = await supabase.from('clients').select('id, name');
        const clientsList = latestClients || [];

        for (const gi of greenInvoices) {
          // Check if invoice already exists by number
          const { data: existingInvoices } = await supabase
            .from('invoices')
            .select('id, status, green_invoice_id')
            .or(`invoice_number.eq.${gi.number},invoice_number.eq.${gi.id}`)
            .limit(1);

          // Calculate the correct status
          const amountOpened = gi.amountOpened ?? gi.amount ?? 1;
          let newStatus = 'sent';
          if (amountOpened === 0) {
            newStatus = 'paid';
          } else if (gi.status === 0) {
            newStatus = 'draft';
          } else if (gi.status === 2) {
            newStatus = 'paid';
          } else if (gi.status === 3) {
            newStatus = 'overdue';
          }

          if (existingInvoices && existingInvoices.length > 0) {
            // Update existing invoice - add green_invoice_id if missing, update status if changed to paid
            const existing = existingInvoices[0];
            const updateData: Record<string, any> = {};
            
            // Always populate green_invoice_id if it's missing
            if (!existing.green_invoice_id && gi.id) {
              updateData.green_invoice_id = gi.id;
            }
            
            // Update status if changed to paid
            if (existing.status !== 'paid' && newStatus === 'paid') {
              updateData.status = 'paid';
              updateData.paid_date = gi.paymentDate || gi.documentDate || format(new Date(), 'yyyy-MM-dd');
            }
            
            if (Object.keys(updateData).length > 0) {
              await supabase
                .from('invoices')
                .update(updateData)
                .eq('id', existing.id);
              updatedCount++;
            } else {
              skippedCount++;
            }
            continue;
          }

          // Find client by name or create a new one
          let clientId: string | null = null;
          const clientName = gi.client?.name || 'לקוח לא מזוהה';

          if (clientName) {
            const matchingClient = clientsList.find(c => 
              c.name.toLowerCase() === clientName.toLowerCase() ||
              c.name.toLowerCase().includes(clientName.toLowerCase()) ||
              clientName.toLowerCase().includes(c.name.toLowerCase())
            );
            
            if (matchingClient) {
              clientId = matchingClient.id;
            } else {
              // Create new client
              const { data: newClient, error: clientError } = await supabase
                .from('clients')
                .insert({
                  name: clientName,
                  email: gi.client?.emails?.[0] || null,
                  phone: gi.client?.phone || null,
                  created_by: user?.id,
                })
                .select('id')
                .single();

              if (!clientError && newClient) {
                clientId = newClient.id;
                clientsList.push({ id: newClient.id, name: clientName });
              }
            }
          }

          if (clientId) {
            const { error: insertError } = await supabase.from('invoices').insert({
              invoice_number: gi.number?.toString() || gi.id,
              client_id: clientId,
              amount: gi.amount || gi.amountDueVat || 0,
              issue_date: gi.documentDate || gi.date || format(new Date(), 'yyyy-MM-dd'),
              due_date: gi.dueDate || null,
              paid_date: newStatus === 'paid' ? (gi.paymentDate || gi.documentDate) : null,
              description: gi.description || gi.remarks || null,
              status: newStatus,
              created_by: user?.id,
              green_invoice_id: gi.id,
            });

            if (!insertError) {
              importedCount++;
            }
          }
        }

        toast({ 
          title: 'הסנכרון הושלם',
          description: `יובאו ${importedCount} חדשות, עודכנו ${updatedCount} קיימות (${skippedCount} ללא שינוי). סה"כ ${greenInvoices.length} מסמכים`,
        });
        fetchData();
      } else {
        toast({ title: 'לא נמצאו חשבוניות לייבוא' });
      }
    } catch (error: any) {
      console.error('Error syncing from Green Invoice:', error);
      toast({ 
        title: 'שגיאה בסנכרון מחשבונית ירוקה', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSyncingFromGreenInvoice(false);
    }
  };

  // Sync all invoices PDFs to cloud storage
  const syncAllInvoicesPdfs = async () => {
    setIsSyncingPdfs(true);

    try {
      const { data, error } = await supabase.functions.invoke('green-invoice', {
        body: { action: 'sync_all_invoices_pdfs' },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const results = data.data;
        toast({ 
          title: 'סנכרון PDFs הושלם',
          description: `הורדו ${results.success} מתוך ${results.total} חשבוניות${results.failed > 0 ? ` (${results.failed} נכשלו)` : ''}`,
        });
        fetchData();
      } else {
        toast({ title: 'לא נמצאו חשבוניות לסנכרון' });
      }
    } catch (error: any) {
      console.error('Error syncing PDFs:', error);
      toast({ 
        title: 'שגיאה בסנכרון PDFs', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSyncingPdfs(false);
    }
  };

  // Send to Green Invoice
  const sendToGreenInvoice = async (invoice: Invoice) => {
    setIsSendingToGreenInvoice(true);
    setSelectedInvoice(invoice);

    try {
      const { data, error } = await supabase.functions.invoke('green-invoice', {
        body: {
          action: 'create_invoice',
          invoice: {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            client_name: invoice.client_name,
            amount: invoice.amount,
            description: invoice.description,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
          },
        },
      });

      if (error) throw error;

      toast({ title: 'החשבונית נשלחה לחשבונית ירוקה בהצלחה' });
      
      // Update status to sent
      await updateInvoiceStatus(invoice.id, 'sent');
    } catch (error: any) {
      console.error('Error sending to Green Invoice:', error);
      toast({ 
        title: 'שגיאה בשליחה לחשבונית ירוקה', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSendingToGreenInvoice(false);
      setSelectedInvoice(null);
    }
  };

  // View invoice in Green Invoice - open directly in new tab
  const viewGreenInvoice = async (invoice: Invoice) => {
    if (!invoice.green_invoice_id) {
      toast({ 
        title: 'לא ניתן לצפות בחשבונית', 
        description: 'חשבונית זו לא מקושרת לחשבונית ירוקה',
        variant: 'destructive' 
      });
      return;
    }

    setIsViewingInvoice(true);
    setSelectedInvoice(invoice);

    try {
      const { data, error } = await supabase.functions.invoke('green-invoice', {
        body: {
          action: 'get_document_link',
          documentId: invoice.green_invoice_id,
        },
      });

      if (error) throw error;

      // Response format: { he: string, en: string, origin: string }
      // Prefer Hebrew link, then origin, then English
      const link = data?.data?.he || data?.data?.origin || data?.data?.en;
      if (link) {
        // Open directly in new tab instead of iframe (to avoid X-Frame-Options issues)
        window.open(link, '_blank');
        toast({ title: 'החשבונית נפתחה בחלון חדש' });
      } else {
        throw new Error('לא נמצא קישור לצפייה');
      }
    } catch (error: any) {
      console.error('Error viewing Green Invoice:', error);
      toast({ 
        title: 'שגיאה בטעינת החשבונית', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsViewingInvoice(false);
      setSelectedInvoice(null);
    }
  };

  // Removed duplicate - using getFilteredInvoices() instead

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ניהול כספים</h1>
            <p className="text-muted-foreground">חשבוניות, הכנסות ותזרים מזומנים</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={useTabsView ? "secondary" : "outline"}
              size="sm"
              onClick={() => setUseTabsView(!useTabsView)}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              {useTabsView ? 'תצוגת טאבים' : 'תצוגה קלאסית'}
            </Button>
            {!useTabsView && <FinancePageSettings sections={pageSections} onSectionsChange={setPageSections} />}
            <Button 
              variant="outline" 
              onClick={syncAllInvoicesPdfs} 
              disabled={isSyncingPdfs}
              className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
            >
              {isSyncingPdfs ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <CloudUpload className="h-4 w-4 ml-2" />
              )}
              סנכרן PDFs לענן
            </Button>
            <Button 
              variant="outline" 
              onClick={syncFromGreenInvoice} 
              disabled={isSyncingFromGreenInvoice}
              className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
            >
              {isSyncingFromGreenInvoice ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 ml-2" />
              )}
              סנכרן מחשבונית ירוקה
            </Button>
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
              רענן
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  חשבונית חדשה
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" dir="rtl">
                <DialogHeader className="text-right">
                  <DialogTitle>יצירת חשבונית חדשה</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>מספר חשבונית *</Label>
                      <Input
                        value={invoiceForm.invoice_number}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                        placeholder="INV-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>סכום *</Label>
                      <Input
                        type="number"
                        value={invoiceForm.amount}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>לקוח *</Label>
                    <Select
                      value={invoiceForm.client_id}
                      onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, client_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר לקוח" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>פרויקט</Label>
                    <Select
                      value={invoiceForm.project_id}
                      onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, project_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר פרויקט (אופציונלי)" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects
                          .filter(p => !invoiceForm.client_id || p.client_id === invoiceForm.client_id)
                          .map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>תאריך הנפקה</Label>
                      <Input
                        type="date"
                        value={invoiceForm.issue_date}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, issue_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>תאריך פירעון</Label>
                      <Input
                        type="date"
                        value={invoiceForm.due_date}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, due_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>תיאור</Label>
                    <Textarea
                      value={invoiceForm.description}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="תיאור החשבונית..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleCreateInvoice}>
                    צור חשבונית
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Advanced Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                פילטרים ואנליטיקס
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                {showAnalytics ? 'הסתר אנליטיקס' : 'הצג אנליטיקס'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6">
              {/* Date From */}
              <div className="space-y-2">
                <Label className="text-xs">מתאריך</Label>
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="text-sm"
                />
              </div>
              
              {/* Date To */}
              <div className="space-y-2">
                <Label className="text-xs">עד תאריך</Label>
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="text-sm"
                />
              </div>
              
              {/* Year */}
              <div className="space-y-2">
                <Label className="text-xs">שנה</Label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="כל השנים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל השנים</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Month */}
              <div className="space-y-2">
                <Label className="text-xs">חודש</Label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="כל החודשים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל החודשים</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2024, i, 1), 'MMMM', { locale: he })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Client */}
              <div className="space-y-2">
                <Label className="text-xs">לקוח</Label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="כל הלקוחות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הלקוחות</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs">סטטוס</Label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="כל הסטטוסים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="draft">טיוטה</SelectItem>
                    <SelectItem value="sent">נשלח</SelectItem>
                    <SelectItem value="paid">שולם</SelectItem>
                    <SelectItem value="overdue">באיחור</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters & Summary */}
            {(dateFromFilter || dateToFilter || yearFilter !== 'all' || monthFilter !== 'all' || clientFilter !== 'all' || filter !== 'all') && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-xs">
                      {filteredInvoices.length} תוצאות
                    </Badge>
                    <div className="text-sm">
                      <span className="text-muted-foreground">סה"כ: </span>
                      <span className="font-bold">{formatCurrency(analytics.filteredSummary.totalAmount)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">שולם: </span>
                      <span className="font-bold text-green-600">{formatCurrency(analytics.filteredSummary.paidAmount)}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setDateFromFilter('');
                      setDateToFilter('');
                      setYearFilter('all');
                      setMonthFilter('all');
                      setClientFilter('all');
                      setFilter('all');
                    }}
                  >
                    נקה פילטרים
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs View */}
        {useTabsView && (
          <FinanceTabs
            tabs={financeTabs}
            widgets={financeWidgets}
            onWidgetsChange={setFinanceWidgets}
            renderWidget={(widgetId) => {
              switch (widgetId) {
                case 'kpis':
                  return <FinanceKPIs kpis={kpis} year={selectedYear} />;
                case 'cashflow':
                  return <CashFlowForecast forecast={cashFlowForecast} />;
                case 'vat-summary':
                  return (
                    <div className="grid gap-6 lg:grid-cols-3">
                      {/* Income Summary */}
                      <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                        <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          הכנסות (שולם)
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>כולל מע"מ:</span>
                            <span className="font-bold">{formatCurrency(stats.totalRevenue)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>לפני מע"מ:</span>
                            <span>{formatCurrency(removeVat(stats.totalRevenue))}</span>
                          </div>
                          <div className="flex justify-between text-green-600 dark:text-green-400 pt-1 border-t">
                            <span>מע"מ עסקאות:</span>
                            <span className="font-semibold">{formatCurrency(getVatAmount(stats.totalRevenue))}</span>
                          </div>
                        </div>
                      </div>
                      {/* Expenses Summary */}
                      <div className="space-y-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                        <h4 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                          <MinusCircle className="h-4 w-4" />
                          הוצאות
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>סה"כ הוצאות:</span>
                            <span className="font-bold">{formatCurrency(expenseStats.total)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>לפני מע"מ:</span>
                            <span>{formatCurrency(expenseStats.beforeVat)}</span>
                          </div>
                          <div className="flex justify-between text-red-600 dark:text-red-400 pt-1 border-t">
                            <span>מע"מ תשומות:</span>
                            <span className="font-semibold">{formatCurrency(expenseStats.vatInputs)}</span>
                          </div>
                        </div>
                      </div>
                      {/* Net Profit */}
                      <div className="space-y-3 p-4 bg-primary/10 rounded-lg border border-primary/30">
                        <h4 className="font-semibold text-primary flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          סיכום
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>רווח גולמי:</span>
                            <span className={`font-bold ${(removeVat(stats.totalRevenue) - expenseStats.beforeVat) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(removeVat(stats.totalRevenue) - expenseStats.beforeVat)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t">
                            <span>מע"מ לתשלום:</span>
                            <span className="font-bold text-primary">{formatCurrency(getVatAmount(stats.totalRevenue) - expenseStats.vatInputs)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                case 'invoices-summary':
                  return (
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center p-4 bg-background rounded-lg border">
                        <p className="text-sm text-muted-foreground mb-1">סה"כ חשבוניות</p>
                        <p className="text-2xl font-bold">{formatCurrency(invoices.reduce((sum, i) => sum + Number(i.amount), 0))}</p>
                        <p className="text-xs text-muted-foreground">{invoices.length} חשבוניות</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-1">שולם</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(stats.totalRevenue)}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">{stats.paidCount} חשבוניות</p>
                      </div>
                      <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                        <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">טרם שולם</p>
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(stats.pendingPayments + stats.overdueAmount)}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">{invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length} חשבוניות</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-1">באיחור</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(stats.overdueAmount)}</p>
                        <p className="text-xs text-red-600 dark:text-red-400">{stats.overdueCount} חשבוניות</p>
                      </div>
                    </div>
                  );
                case 'invoices-table':
                  return <div className="text-muted-foreground text-center py-8">טבלת חשבוניות - ראה תצוגה קלאסית</div>;
                case 'expenses':
                  return <div className="text-muted-foreground text-center py-8">ניהול הוצאות - ראה תצוגה קלאסית</div>;
                case 'bank-transactions':
                  return <BankTransactionsView />;
                case 'top-clients':
                  return (
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-3">
                        {Object.entries(
                          invoices
                            .filter(i => i.status === 'paid')
                            .reduce((acc, inv) => {
                              const name = inv.client_name || 'לא ידוע';
                              acc[name] = (acc[name] || 0) + Number(inv.amount);
                              return acc;
                            }, {} as Record<string, number>)
                        )
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([name, amount], index) => (
                            <div key={name} className="flex flex-row-reverse items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <p className="font-medium">{name}</p>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-primary">
                                  {index + 1}
                                </div>
                              </div>
                              <p className="font-bold">{formatCurrency(amount)}</p>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  );
                case 'debts':
                  return (
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-3">
                        {invoices
                          .filter(i => i.status === 'overdue' || i.status === 'sent')
                          .slice(0, 10)
                          .map(invoice => (
                            <div key={invoice.id} className="flex flex-row-reverse items-center justify-between p-3 border rounded-lg">
                              <div className="text-end">
                                <p className="font-medium">{invoice.client_name}</p>
                                <p className="text-sm text-muted-foreground">#{invoice.invoice_number}</p>
                              </div>
                              <p className="font-bold">{formatCurrency(Number(invoice.amount))}</p>
                            </div>
                          ))}
                        {invoices.filter(i => i.status === 'overdue' || i.status === 'sent').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                            <p>אין חובות פתוחים!</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  );
                case 'profit-loss':
                  return <ProfitLossReport data={profitLoss} year={selectedYear} vatRate={vatRate} />;
                case 'budget':
                  return <BudgetManager expenses={expensesByCategory} year={selectedYear || new Date().getFullYear()} />;
                case 'alerts':
                  return (
                    <AlertsSettings 
                      invoices={invoices.map(i => ({
                        id: i.id,
                        invoice_number: i.invoice_number,
                        amount: i.amount,
                        status: i.status,
                        due_date: i.due_date,
                      }))}
                    />
                  );
                default:
                  return <div>Widget not found</div>;
              }
            }}
            defaultTab="overview"
          />
        )}

        {/* Classic View - All Sections */}
        {!useTabsView && (
          <>
        {/* NEW: KPIs Dashboard */}
        {isSectionVisible('kpis') && (
          <CollapsibleSection id="kpis">
            <FinanceKPIs kpis={kpis} year={selectedYear} />
          </CollapsibleSection>
        )}

        {/* NEW: Cash Flow Forecast */}
        {isSectionVisible('cashflow') && (
          <CollapsibleSection id="cashflow">
            <CashFlowForecast forecast={cashFlowForecast} />
          </CollapsibleSection>
        )}
        
        {/* Revenue Forecast - Smart Predictions */}
        {isSectionVisible('cashflow') && invoices.length > 0 && (
          <CollapsibleSection id="revenue-forecast">
            <RevenueForecastChart
              historicalData={invoices.filter(i => i.status === 'paid' && i.paid_date).map(inv => ({
                date: new Date(inv.paid_date!),
                revenue: inv.amount,
              }))}
              forecastMonths={6}
              className="border-2 border-blue-500/20"
            />
          </CollapsibleSection>
        )}

        {/* Profit & VAT Summary Card */}
        {isSectionVisible('vat-summary') && (
          <CollapsibleSection id="vat-summary">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  סיכום רווח ומע"מ
                  <Badge variant="outline" className="text-xs mr-2">מע"מ {vatRate}%</Badge>
                  {yearFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">{yearFilter}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Income Summary */}
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                    <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      הכנסות (שולם)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>כולל מע"מ:</span>
                        <span className="font-bold">{formatCurrency(stats.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>לפני מע"מ:</span>
                        <span>{formatCurrency(removeVat(stats.totalRevenue))}</span>
                      </div>
                      <div className="flex justify-between text-green-600 dark:text-green-400 pt-1 border-t">
                        <span>מע"מ עסקאות:</span>
                        <span className="font-semibold">{formatCurrency(getVatAmount(stats.totalRevenue))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Summary */}
                  <div className="space-y-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                    <h4 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                      <MinusCircle className="h-4 w-4" />
                      הוצאות {expenseStats.recurringCount > 0 && <span className="text-xs font-normal">(כולל חוזרות x12)</span>}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>סה"כ הוצאות:</span>
                        <span className="font-bold">{formatCurrency(expenseStats.total)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>לפני מע"מ:</span>
                        <span>{formatCurrency(expenseStats.beforeVat)}</span>
                      </div>
                      <div className="flex justify-between text-red-600 dark:text-red-400 pt-1 border-t">
                        <span>מע"מ תשומות (לזיכוי):</span>
                        <span className="font-semibold">{formatCurrency(expenseStats.vatInputs)}</span>
                      </div>
                      {expenseStats.recurringCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          * {expenseStats.recurringCount} הוצאות חוזרות × 12 חודשים
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="space-y-3 p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <h4 className="font-semibold text-primary flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      סיכום
                    </h4>
                    {(() => {
                      const incomeBeforeVat = removeVat(stats.totalRevenue);
                      const netProfit = incomeBeforeVat - expenseStats.beforeVat;
                      const vatTransactions = getVatAmount(stats.totalRevenue);
                      const vatToPay = vatTransactions - expenseStats.vatInputs;
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>רווח גולמי:</span>
                            <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(netProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t">
                            <span>מע"מ לתשלום:</span>
                            <span className="font-bold text-primary">{formatCurrency(vatToPay)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            * רווח גולמי = הכנסות לפני מע"מ - הוצאות לפני מע"מ
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleSection>
        )}

        {/* Always Visible Summary Card */}
        {isSectionVisible('invoices-summary') && (
          <CollapsibleSection id="invoices-summary">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  סיכום חשבוניות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  {/* Total All Invoices */}
                  <div className="text-center p-4 bg-background rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">סה"כ חשבוניות</p>
                    <p className="text-2xl font-bold">{formatCurrency(invoices.reduce((sum, i) => sum + Number(i.amount), 0))}</p>
                    <p className="text-xs text-muted-foreground">לפני מע"מ: {formatCurrency(removeVat(invoices.reduce((sum, i) => sum + Number(i.amount), 0)))}</p>
                    <p className="text-xs text-muted-foreground">{invoices.length} חשבוניות</p>
                  </div>
                  
                  {/* Paid */}
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">שולם</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">לפני מע"מ: {formatCurrency(removeVat(stats.totalRevenue))}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{stats.paidCount} חשבוניות</p>
                  </div>
                  
                  {/* Not Paid Yet */}
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">טרם שולם</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(stats.pendingPayments + stats.overdueAmount)}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">לפני מע"מ: {formatCurrency(removeVat(stats.pendingPayments + stats.overdueAmount))}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">{invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length} חשבוניות</p>
                  </div>
                  
                  {/* Overdue */}
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-1">באיחור</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(stats.overdueAmount)}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">לפני מע"מ: {formatCurrency(removeVat(stats.overdueAmount))}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{stats.overdueCount} חשבוניות</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleSection>
        )}

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Strongest Months */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">חודשים חזקים</CardTitle>
                  <ViewToggle 
                    view={strongestMonthsView}
                    onViewChange={setStrongestMonthsView}
                    years={years}
                    selectedYear={selectedViewYear}
                    onYearChange={setSelectedViewYear}
                  />
                </div>
                <CardDescription>3 החודשים עם ההכנסות הגבוהות ביותר</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const filteredData = strongestMonthsView === 'year' 
                      ? invoices.filter(i => new Date(i.issue_date).getFullYear() === selectedViewYear)
                      : invoices;
                    
                    const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
                      const monthInvoices = filteredData.filter(inv => new Date(inv.issue_date).getMonth() === i);
                      return {
                        month: format(new Date(2024, i, 1), 'MMMM', { locale: he }),
                        monthNum: i + 1,
                        total: monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
                      };
                    }).filter(m => m.total > 0).sort((a, b) => b.total - a.total).slice(0, 3);

                    return monthlyTotals.map((month, index) => (
                      <div key={month.monthNum} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                            index === 1 ? 'bg-gray-100 text-gray-700' : 
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium">{month.month}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(month.total)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Year Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">התפלגות לפי זמן</CardTitle>
                  <ViewToggle 
                    view={yearBreakdownView}
                    onViewChange={setYearBreakdownView}
                    years={years}
                    selectedYear={selectedViewYear}
                    onYearChange={setSelectedViewYear}
                    selectedMonth={selectedViewMonth}
                    onMonthChange={setSelectedViewMonth}
                  />
                </div>
                <CardDescription>
                  {yearBreakdownView === 'year' ? 'סיכום הכנסות לפי שנים' : `סיכום הכנסות לחודש ${format(new Date(2024, selectedViewMonth - 1, 1), 'MMMM', { locale: he })}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {yearBreakdownView === 'year' ? (
                    analytics.yearBreakdown.map(year => (
                      <div key={year.year} className="space-y-2 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">{year.year}</span>
                          <span className="text-muted-foreground text-sm">{year.count} חשבוניות</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">סה"כ כולל מע"מ:</span>
                            <span className="font-bold">{formatCurrency(year.total)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">לפני מע"מ:</span>
                            <span>{formatCurrency(removeVat(year.total))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600">שולם:</span>
                            <span className="font-bold text-green-600">{formatCurrency(year.paid)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600/70">שולם לפני מע"מ:</span>
                            <span className="text-green-600/70">{formatCurrency(removeVat(year.paid))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-600">טרם שולם:</span>
                            <span className="font-bold text-amber-600">{formatCurrency(year.total - year.paid)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-600/70">טרם שולם לפני מע"מ:</span>
                            <span className="text-amber-600/70">{formatCurrency(removeVat(year.total - year.paid))}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all" 
                            style={{ width: `${(year.paid / (year.total || 1)) * 100}%` }} 
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    (() => {
                      const monthInvoices = invoices.filter(i => new Date(i.issue_date).getMonth() + 1 === selectedViewMonth);
                      const byYear = years.map(year => {
                        const yearMonthInvoices = monthInvoices.filter(i => new Date(i.issue_date).getFullYear() === year);
                        return {
                          year,
                          count: yearMonthInvoices.length,
                          total: yearMonthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
                          paid: yearMonthInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0),
                        };
                      }).filter(y => y.count > 0);
                      
                      return byYear.map(yearData => (
                        <div key={yearData.year} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">{yearData.year}</span>
                            <span className="text-muted-foreground text-sm">{yearData.count} חשבוניות</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">סה"כ כולל מע"מ:</span>
                              <span className="font-bold">{formatCurrency(yearData.total)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">לפני מע"מ:</span>
                              <span>{formatCurrency(removeVat(yearData.total))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-600">שולם:</span>
                              <span className="font-bold text-green-600">{formatCurrency(yearData.paid)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-600/70">שולם לפני מע"מ:</span>
                              <span className="text-green-600/70">{formatCurrency(removeVat(yearData.paid))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-600">טרם שולם:</span>
                              <span className="font-bold text-amber-600">{formatCurrency(yearData.total - yearData.paid)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-600/70">טרם שולם לפני מע"מ:</span>
                              <span className="text-amber-600/70">{formatCurrency(removeVat(yearData.total - yearData.paid))}</span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all" 
                              style={{ width: `${(yearData.paid / (yearData.total || 1)) * 100}%` }} 
                            />
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">לקוחות מובילים</CardTitle>
                  <ViewToggle 
                    view={topClientsView}
                    onViewChange={setTopClientsView}
                    years={years}
                    selectedYear={selectedViewYear}
                    onYearChange={setSelectedViewYear}
                    selectedMonth={selectedViewMonth}
                    onMonthChange={setSelectedViewMonth}
                  />
                </div>
                <CardDescription className="flex items-center gap-2 flex-wrap">
                  <span>{topClientsLimit} הלקוחות המובילים</span>
                  <div className="flex gap-1">
                    <Button 
                      variant={topClientsLimit === 5 ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => setTopClientsLimit(5)}
                    >5</Button>
                    <Button 
                      variant={topClientsLimit === 10 ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => setTopClientsLimit(10)}
                    >10</Button>
                    <Button 
                      variant={topClientsLimit === 20 ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => setTopClientsLimit(20)}
                    >20</Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const filteredInvoicesForClients = topClientsView === 'year'
                      ? invoices.filter(i => new Date(i.issue_date).getFullYear() === selectedViewYear)
                      : invoices.filter(i => new Date(i.issue_date).getMonth() + 1 === selectedViewMonth);
                    
                    const clientData = clients.map(client => {
                      const clientInvoices = filteredInvoicesForClients.filter(i => i.client_id === client.id);
                      return {
                        name: client.name,
                        id: client.id,
                        count: clientInvoices.length,
                        total: clientInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
                      };
                    }).filter(c => c.count > 0).sort((a, b) => b.total - a.total).slice(0, topClientsLimit);
                    
                    return clientData.map((client, index) => (
                      <div key={client.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {index + 1}
                          </div>
                          <span className="text-sm truncate max-w-[150px]">{client.name}</span>
                        </div>
                        <div className="text-start">
                          <div className="font-bold text-sm">{formatCurrency(client.total)}</div>
                          <div className="text-xs text-muted-foreground">לפני מע"מ: {formatCurrency(removeVat(client.total))}</div>
                          <div className="text-xs text-muted-foreground">{client.count} חשבוניות</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breakdown Chart */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">התפלגות חודשית</CardTitle>
                  <ViewToggle 
                    view={monthlyChartView}
                    onViewChange={setMonthlyChartView}
                    years={years}
                    selectedYear={selectedViewYear}
                    onYearChange={setSelectedViewYear}
                  />
                </div>
                <CardDescription>
                  {monthlyChartView === 'year' ? `הכנסות לפי חודשים בשנת ${selectedViewYear}` : 'הכנסות לפי חודשים (כל השנים)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const filteredData = monthlyChartView === 'year'
                        ? invoices.filter(i => new Date(i.issue_date).getFullYear() === selectedViewYear)
                        : invoices;
                      
                      return Array.from({ length: 12 }, (_, i) => {
                        const monthInvoices = filteredData.filter(inv => new Date(inv.issue_date).getMonth() === i);
                        return {
                          month: format(new Date(2024, i, 1), 'MMM', { locale: he }),
                          monthNum: i + 1,
                          count: monthInvoices.length,
                          total: monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
                          paid: monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0),
                        };
                      });
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          formatCurrency(value), 
                          name === 'total' ? 'סה"כ' : 'שולם'
                        ]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend formatter={(value) => value === 'total' ? 'סה"כ' : 'שולם'} />
                      <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="paid" fill="hsl(var(--primary))" name="paid" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expenses Analytics Card */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MinusCircle className="h-5 w-5 text-red-600" />
                  אנליטיקס הוצאות
                  {yearFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">{yearFilter}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  ניתוח הוצאות לפי קטגוריות {expenseStats.recurringCount > 0 && '(הוצאות חוזרות מוכפלות x12)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Calculate expenses by category
                  const year = yearFilter !== 'all' ? parseInt(yearFilter) : undefined;
                  const filteredExpensesList = year 
                    ? expenses.filter(e => new Date(e.expense_date).getFullYear() === year)
                    : expenses;
                  
                  const categoryData = EXPENSE_CATEGORIES.map(cat => {
                    const catExpenses = filteredExpensesList.filter(e => e.category === cat.value);
                    const total = catExpenses.reduce((sum, e) => {
                      const amount = Number(e.amount);
                      return sum + (e.is_recurring ? amount * 12 : amount);
                    }, 0);
                    const count = catExpenses.length;
                    const recurringCount = catExpenses.filter(e => e.is_recurring).length;
                    return {
                      name: cat.label,
                      value: cat.value,
                      total,
                      count,
                      recurringCount,
                    };
                  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

                  // Monthly breakdown of expenses
                  const monthlyExpenses = Array.from({ length: 12 }, (_, i) => {
                    const monthExpenses = filteredExpensesList.filter(e => {
                      const expDate = new Date(e.expense_date);
                      return expDate.getMonth() === i;
                    });
                    const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
                    // For recurring, add full year amount divided by 12 for each month
                    const recurringTotal = filteredExpensesList
                      .filter(e => e.is_recurring)
                      .reduce((sum, e) => sum + Number(e.amount), 0);
                    
                    return {
                      month: format(new Date(2024, i, 1), 'MMM', { locale: he }),
                      monthNum: i + 1,
                      oneTime: total - monthExpenses.filter(e => e.is_recurring).reduce((sum, e) => sum + Number(e.amount), 0),
                      recurring: recurringTotal,
                      total: total - monthExpenses.filter(e => e.is_recurring).reduce((sum, e) => sum + Number(e.amount), 0) + recurringTotal,
                    };
                  });

                  return (
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Category Breakdown */}
                      <div className="space-y-4">
                        <h5 className="font-medium text-sm">הוצאות לפי קטגוריה</h5>
                        {categoryData.length > 0 ? (
                          <div className="space-y-3">
                            {categoryData.map((cat, idx) => (
                              <div key={cat.value} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                                    />
                                    {cat.name}
                                    {cat.recurringCount > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        <RefreshCw className="h-2 w-2 ml-1" />
                                        {cat.recurringCount}
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="font-bold">{formatCurrency(cat.total)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div 
                                    className="h-full transition-all" 
                                    style={{ 
                                      width: `${(cat.total / expenseStats.total) * 100}%`,
                                      backgroundColor: COLORS[idx % COLORS.length]
                                    }} 
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">אין הוצאות להצגה</p>
                        )}
                        
                        {/* Summary stats */}
                        <div className="pt-4 border-t space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">הוצאות חד-פעמיות:</span>
                            <span>{expenseStats.oneTimeCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">הוצאות חוזרות:</span>
                            <span>{expenseStats.recurringCount} (× 12 חודשים)</span>
                          </div>
                          <div className="flex justify-between font-bold pt-2 border-t">
                            <span>סה"כ שנתי:</span>
                            <span className="text-red-600">{formatCurrency(expenseStats.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pie Chart */}
                      <div className="h-[250px]">
                        {categoryData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={categoryData}
                                dataKey="total"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </RechartsPie>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            אין נתונים להצגה
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="סה״כ הכנסות"
            value={formatCurrency(stats.totalRevenue)}
            subtitle={`${stats.paidCount} חשבוניות שולמו`}
            icon={<DollarSign className="h-5 w-5 text-primary" />}
            trend="up"
            trendValue="+12% מהחודש הקודם"
          />
          <StatsCard
            title="הכנסות החודש"
            value={formatCurrency(stats.thisMonthRevenue)}
            subtitle={format(new Date(), 'MMMM yyyy', { locale: he })}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          />
          <StatsCard
            title="ממתין לתשלום"
            value={formatCurrency(stats.pendingPayments)}
            subtitle={`${invoices.filter(i => i.status === 'sent').length} חשבוניות פתוחות`}
            icon={<Clock className="h-5 w-5 text-blue-600" />}
          />
          <StatsCard
            title="באיחור"
            value={formatCurrency(stats.overdueAmount)}
            subtitle={`${stats.overdueCount} חשבוניות`}
            icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  הכנסות חודשיות
                </CardTitle>
                <ViewToggle 
                  view={revenueChartView}
                  onViewChange={setRevenueChartView}
                  years={years}
                  selectedYear={selectedViewYear}
                  onYearChange={setSelectedViewYear}
                />
              </div>
              <CardDescription>
                {revenueChartView === 'year' ? `סקירת הכנסות שנת ${selectedViewYear}` : 'סקירת הכנסות 6 חודשים אחרונים'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(() => {
                    if (revenueChartView === 'year') {
                      return Array.from({ length: 12 }, (_, i) => {
                        const monthStart = new Date(selectedViewYear, i, 1);
                        const monthEnd = new Date(selectedViewYear, i + 1, 0);
                        const revenue = invoices
                          .filter(inv => inv.status === 'paid' && inv.paid_date)
                          .filter(inv => {
                            const paidDate = parseISO(inv.paid_date!);
                            return paidDate >= monthStart && paidDate <= monthEnd;
                          })
                          .reduce((sum, inv) => sum + Number(inv.amount), 0);
                        return {
                          month: format(monthStart, 'MMM', { locale: he }),
                          revenue,
                        };
                      });
                    }
                    return monthlyData;
                  })()}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
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
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                התפלגות סטטוס
              </CardTitle>
              <CardDescription>חשבוניות לפי סטטוס</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  רשימת חשבוניות
                </CardTitle>
                <CardDescription>כל החשבוניות במערכת</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={invoicesViewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setInvoicesViewMode('list')}
                    title="תצוגת רשימה"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={invoicesViewMode === 'cards' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setInvoicesViewMode('cards')}
                    title="תצוגת כרטיסים"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={invoicesViewMode === 'grid3' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setInvoicesViewMode('grid3')}
                    title="רשת 3 עמודות"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={invoicesViewMode === 'grid4' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setInvoicesViewMode('grid4')}
                    title="רשת 4 עמודות"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="סנן לפי סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="draft">טיוטה</SelectItem>
                    <SelectItem value="sent">נשלח</SelectItem>
                    <SelectItem value="paid">שולם</SelectItem>
                    <SelectItem value="overdue">באיחור</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>אין חשבוניות להצגה</p>
                </div>
              ) : (
                <div className={
                  invoicesViewMode === 'list' ? 'space-y-3' :
                  invoicesViewMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' :
                  invoicesViewMode === 'grid3' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' :
                  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                }>
                  {filteredInvoices.map(invoice => (
                    invoicesViewMode === 'list' ? (
                      // List View
                      <div 
                        key={invoice.id} 
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-row-reverse items-center justify-between">
                          <div className="flex-1 text-end">
                            <div className="flex items-center justify-end gap-3">
                              <InvoiceStatusBadge status={invoice.status} />
                              <p className="font-semibold">#{invoice.invoice_number}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {invoice.client_name}
                              {invoice.project_name && ` • ${invoice.project_name}`}
                            </p>
                            <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(invoice.issue_date), 'dd/MM/yyyy')}
                              </span>
                              {invoice.due_date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  יעד: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-start">
                            <p className="text-xl font-bold">{formatCurrency(Number(invoice.amount))}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {invoice.green_invoice_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewGreenInvoice(invoice)}
                                  disabled={isViewingInvoice && selectedInvoice?.id === invoice.id}
                                  className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                                >
                                  {isViewingInvoice && selectedInvoice?.id === invoice.id ? (
                                    <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                                  ) : (
                                    <Eye className="h-3 w-3 ml-1" />
                                  )}
                                  צפה
                                </Button>
                              )}
                              {invoice.status === 'draft' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendToGreenInvoice(invoice)}
                                  disabled={isSendingToGreenInvoice && selectedInvoice?.id === invoice.id}
                                >
                                  {isSendingToGreenInvoice && selectedInvoice?.id === invoice.id ? (
                                    <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3 ml-1" />
                                  )}
                                  שלח
                                </Button>
                              )}
                              {(invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'partially_paid') && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedInvoiceForPayment(invoice);
                                      setIsPartialPaymentDialogOpen(true);
                                    }}
                                  >
                                    <CreditCard className="h-3 w-3 ml-1" />
                                    תשלום
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={invoice.status === 'overdue' ? 'destructive' : 'default'}
                                    onClick={() => updateInvoiceStatus(invoice.id, 'paid', format(new Date(), 'yyyy-MM-dd'))}
                                  >
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                    שולם
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShareInvoice(invoice);
                                  setShareDialogOpen(true);
                                }}
                              >
                                <Mail className="h-3 w-3 ml-1" />
                                שלח
                              </Button>
                            </div>
                          </div>
                        </div>
                        {invoice.description && (
                          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                            {invoice.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      // Card/Grid View
                      <div 
                        key={invoice.id} 
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <InvoiceStatusBadge status={invoice.status} />
                          <p className="font-semibold text-lg">#{invoice.invoice_number}</p>
                        </div>
                        <p className="text-2xl font-bold text-center my-3">{formatCurrency(Number(invoice.amount))}</p>
                        <p className="text-sm text-center text-muted-foreground">
                          {invoice.client_name}
                        </p>
                        {invoice.project_name && (
                          <p className="text-xs text-center text-muted-foreground">{invoice.project_name}</p>
                        )}
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(invoice.issue_date), 'dd/MM/yyyy')}
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t">
                          {invoice.green_invoice_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewGreenInvoice(invoice)}
                              disabled={isViewingInvoice && selectedInvoice?.id === invoice.id}
                              className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          {invoice.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendToGreenInvoice(invoice)}
                              disabled={isSendingToGreenInvoice && selectedInvoice?.id === invoice.id}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                          {(invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'partially_paid') && (
                            <Button
                              size="sm"
                              variant={invoice.status === 'overdue' ? 'destructive' : 'default'}
                              onClick={() => updateInvoiceStatus(invoice.id, 'paid', format(new Date(), 'yyyy-MM-dd'))}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShareInvoice(invoice);
                              setShareDialogOpen(true);
                            }}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Expenses Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MinusCircle className="h-5 w-5 text-red-600" />
                  רשימת הוצאות
                </CardTitle>
                <CardDescription>כל ההוצאות העסקיות</CardDescription>
              </div>
              <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    <Plus className="h-4 w-4 ml-2" />
                    הוצאה חדשה
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg" dir="rtl">
                  <DialogHeader className="text-right">
                    <DialogTitle>הוספת הוצאה חדשה</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>תיאור *</Label>
                        <Input
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="תיאור ההוצאה"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>סכום *</Label>
                        <Input
                          type="number"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>קטגוריה</Label>
                        <Select
                          value={expenseForm.category}
                          onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="בחר קטגוריה" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>תאריך</Label>
                        <Input
                          type="date"
                          value={expenseForm.expense_date}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>שם ספק</Label>
                        <Input
                          value={expenseForm.supplier_name}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, supplier_name: e.target.value }))}
                          placeholder="שם הספק"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>מספר קבלה/חשבונית</Label>
                        <Input
                          value={expenseForm.receipt_number}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, receipt_number: e.target.value }))}
                          placeholder="מספר מסמך"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="has_vat"
                        checked={expenseForm.has_vat}
                        onCheckedChange={(checked) => setExpenseForm(prev => ({ ...prev, has_vat: checked as boolean }))}
                      />
                      <Label htmlFor="has_vat" className="cursor-pointer">
                        כולל מע"מ (ניתן לזיכוי)
                      </Label>
                    </div>
                    
                    {/* Recurring expense options */}
                    <div className="p-4 bg-accent/30 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="is_recurring"
                          checked={expenseForm.is_recurring}
                          onCheckedChange={(checked) => setExpenseForm(prev => ({ ...prev, is_recurring: checked as boolean }))}
                        />
                        <Label htmlFor="is_recurring" className="cursor-pointer font-medium">
                          הוצאה חודשית קבועה
                        </Label>
                      </div>
                      {expenseForm.is_recurring && (
                        <div className="flex items-center gap-2 mr-6">
                          <Label className="text-sm">יום בחודש:</Label>
                          <Select 
                            value={expenseForm.recurring_day.toString()} 
                            onValueChange={(v) => setExpenseForm(prev => ({ ...prev, recurring_day: parseInt(v) }))}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>הערות</Label>
                      <Textarea
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="הערות נוספות..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                      ביטול
                    </Button>
                    <Button onClick={handleCreateExpense} className="bg-red-600 hover:bg-red-700">
                      הוסף הוצאה
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MinusCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין הוצאות להצגה</p>
                    <p className="text-sm">הוסף הוצאות כדי לחשב רווח נקי ומע"מ לזיכוי</p>
                  </div>
                ) : (
                  expenses.map(expense => (
                    <div 
                      key={expense.id} 
                      className={`p-4 border rounded-lg hover:bg-accent/50 transition-colors ${expense.is_recurring ? 'border-primary/30 bg-primary/5' : ''}`}
                    >
                      <div className="flex flex-row-reverse items-start justify-between gap-4">
                        <div className="flex-1 text-end">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {expense.is_recurring && (
                              <Badge className="text-xs bg-primary/20 text-primary border-0">
                                <RefreshCw className="h-3 w-3 ml-1" />
                                חודשי - יום {expense.recurring_day}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                            </Badge>
                            <p className="font-semibold">{expense.description}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {expense.supplier_name && `${expense.supplier_name} • `}
                            {format(new Date(expense.expense_date), 'dd/MM/yyyy')}
                          </p>
                          <div className="flex items-center justify-end gap-2 mt-1 flex-wrap">
                            {expense.has_vat && (
                              <Badge variant="secondary" className="text-xs">
                                כולל מע"מ לזיכוי
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-start min-w-[120px]">
                          <p className="text-xl font-bold text-red-600">{formatCurrency(Number(expense.amount))}</p>
                          <p className="text-xs text-muted-foreground">
                            לפני מע"מ: {formatCurrency(expense.has_vat ? removeVat(Number(expense.amount)) : Number(expense.amount))}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary hover:text-primary/80 hover:bg-primary/10"
                              onClick={() => openEditExpense(expense)}
                            >
                              <Pencil className="h-3 w-3 ml-1" />
                              ערוך
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-3 w-3 ml-1" />
                              מחק
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Edit Expense Dialog */}
        <Dialog open={isEditExpenseDialogOpen} onOpenChange={setIsEditExpenseDialogOpen}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                עריכת הוצאה
              </DialogTitle>
            </DialogHeader>
            {editingExpense && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>תיאור *</Label>
                    <Input
                      value={editingExpense.description}
                      onChange={(e) => setEditingExpense(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="תיאור ההוצאה"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>סכום *</Label>
                    <Input
                      type="number"
                      value={editingExpense.amount}
                      onChange={(e) => setEditingExpense(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>קטגוריה</Label>
                    <Select
                      value={editingExpense.category}
                      onValueChange={(value) => setEditingExpense(prev => prev ? { ...prev, category: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>תאריך</Label>
                    <Input
                      type="date"
                      value={editingExpense.expense_date}
                      onChange={(e) => setEditingExpense(prev => prev ? { ...prev, expense_date: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>שם ספק</Label>
                    <Input
                      value={editingExpense.supplier_name || ''}
                      onChange={(e) => setEditingExpense(prev => prev ? { ...prev, supplier_name: e.target.value } : null)}
                      placeholder="שם הספק"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit_has_vat"
                    checked={editingExpense.has_vat}
                    onCheckedChange={(checked) => setEditingExpense(prev => prev ? { ...prev, has_vat: checked as boolean } : null)}
                  />
                  <Label htmlFor="edit_has_vat" className="cursor-pointer">
                    כולל מע"מ (ניתן לזיכוי)
                  </Label>
                </div>
                
                {/* Recurring expense options */}
                <div className="p-4 bg-accent/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit_is_recurring"
                      checked={editingExpense.is_recurring}
                      onCheckedChange={(checked) => setEditingExpense(prev => prev ? { ...prev, is_recurring: checked as boolean } : null)}
                    />
                    <Label htmlFor="edit_is_recurring" className="cursor-pointer font-medium">
                      הוצאה חודשית קבועה
                    </Label>
                  </div>
                  {editingExpense.is_recurring && (
                    <div className="flex items-center gap-2 mr-6">
                      <Label className="text-sm">יום בחודש:</Label>
                      <Select 
                        value={(editingExpense.recurring_day || 1).toString()} 
                        onValueChange={(v) => setEditingExpense(prev => prev ? { ...prev, recurring_day: parseInt(v) } : null)}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>הערות</Label>
                  <Textarea
                    value={editingExpense.notes || ''}
                    onChange={(e) => setEditingExpense(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    placeholder="הערות נוספות..."
                    rows={2}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditExpenseDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleUpdateExpense}>
                שמור שינויים
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bank Transactions Section */}
        {isSectionVisible('bank-transactions') && (
          <CollapsibleSection id="bank-transactions">
            <BankTransactionsView />
          </CollapsibleSection>
        )}

        {/* Outstanding Debts & Top Clients - Swapped Order */}
        {(isSectionVisible('top-clients') || isSectionVisible('debts')) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Clients by Revenue - Now on Right */}
            {isSectionVisible('top-clients') && (
              <CollapsibleSection id="top-clients" className="lg:order-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="h-5 w-5" />
                          לקוחות מובילים
                        </CardTitle>
                        <CardDescription>לפי הכנסות</CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant={topClientsLimit === 5 ? "default" : "outline"} 
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setTopClientsLimit(5)}
                        >
                          5
                        </Button>
                        <Button 
                          variant={topClientsLimit === 10 ? "default" : "outline"} 
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setTopClientsLimit(10)}
                        >
                          10
                        </Button>
                        <Button 
                          variant={topClientsLimit === 20 ? "default" : "outline"} 
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setTopClientsLimit(20)}
                        >
                          20
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className={topClientsLimit > 5 ? "h-[400px]" : "h-[250px]"}>
                      <div className="space-y-3">
                        {Object.entries(
                          invoices
                            .filter(i => i.status === 'paid')
                            .reduce((acc, inv) => {
                              const name = inv.client_name || 'לא ידוע';
                              acc[name] = (acc[name] || 0) + Number(inv.amount);
                              return acc;
                            }, {} as Record<string, number>)
                        )
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, topClientsLimit)
                          .map(([name, amount], index) => (
                            <div key={name} className="flex flex-row-reverse items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <p className="font-medium">{name}</p>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`} style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                                  {index + 1}
                                </div>
                              </div>
                              <div className="text-start">
                                <p className="font-bold">{formatCurrency(amount)}</p>
                                <p className="text-xs text-muted-foreground">לפני מע"מ: {formatCurrency(removeVat(amount))}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CollapsibleSection>
            )}

            {/* Outstanding Debts - Now on Left */}
            {isSectionVisible('debts') && (
              <CollapsibleSection id="debts" className="lg:order-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      חובות פתוחים
                    </CardTitle>
                    <CardDescription>חשבוניות באיחור או ממתינות לתשלום</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-3">
                        {invoices
                          .filter(i => i.status === 'overdue' || i.status === 'sent')
                          .sort((a, b) => {
                            // Overdue first
                            if (a.status === 'overdue' && b.status !== 'overdue') return -1;
                            if (b.status === 'overdue' && a.status !== 'overdue') return 1;
                            return 0;
                          })
                          .map(invoice => (
                            <div key={invoice.id} className="flex flex-row-reverse items-center justify-between p-3 border rounded-lg">
                              <div className="text-end">
                                <p className="font-medium">{invoice.client_name}</p>
                                <p className="text-sm text-muted-foreground">#{invoice.invoice_number}</p>
                              </div>
                              <div className="text-start">
                                <p className="font-bold">{formatCurrency(Number(invoice.amount))}</p>
                                <InvoiceStatusBadge status={invoice.status} />
                              </div>
                            </div>
                          ))}
                        {invoices.filter(i => i.status === 'overdue' || i.status === 'sent').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                            <p>אין חובות פתוחים!</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CollapsibleSection>
            )}
          </div>
        )}

        {/* NEW: Profit & Loss Report */}
        {isSectionVisible('profit-loss') && (
          <CollapsibleSection id="profit-loss">
            <ProfitLossReport data={profitLoss} year={selectedYear} vatRate={vatRate} />
          </CollapsibleSection>
        )}

        {/* NEW: Budget Manager */}
        {isSectionVisible('budget') && (
          <CollapsibleSection id="budget">
            <BudgetManager 
              expenses={expensesByCategory} 
              year={selectedYear || new Date().getFullYear()} 
            />
          </CollapsibleSection>
        )}

        {/* NEW: Alerts Settings */}
        {isSectionVisible('alerts') && (
          <CollapsibleSection id="alerts">
            <AlertsSettings 
              invoices={invoices.map(i => ({
                id: i.id,
                invoice_number: i.invoice_number,
                amount: i.amount,
                status: i.status,
                due_date: i.due_date,
              }))}
            />
          </CollapsibleSection>
        )}
          </>
        )}
      </div>

      {/* NEW: Partial Payment Dialog */}
      <PartialPaymentDialog
        open={isPartialPaymentDialogOpen}
        onOpenChange={setIsPartialPaymentDialogOpen}
        invoice={selectedInvoiceForPayment}
        onPaymentAdded={() => {
          fetchData();
          setSelectedInvoiceForPayment(null);
        }}
      />

      {/* Invoice View Dialog */}
      <Dialog open={isInvoiceViewDialogOpen} onOpenChange={(open) => {
        setIsInvoiceViewDialogOpen(open);
        if (!open) {
          setInvoiceViewUrl(null);
        }
      }}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0" dir="rtl">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>צפייה בחשבונית</span>
              {invoiceViewUrl && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(invoiceViewUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 ml-1" />
                    פתח בחלון חדש
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={invoiceViewUrl} download>
                      <Download className="h-4 w-4 ml-1" />
                      הורד
                    </a>
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {invoiceViewUrl ? (
              <iframe
                src={invoiceViewUrl}
                className="w-full h-full border-0"
                title="Invoice Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title={`חשבונית #${shareInvoice?.invoice_number || ''}`}
        content={`לקוח: ${shareInvoice?.client_name || ''}\nסכום: ₪${shareInvoice?.amount || 0}\nתאריך: ${shareInvoice?.issue_date || ''}\n${shareInvoice?.description || ''}`}
        type="invoice"
      />
    </AppLayout>
  );
}
