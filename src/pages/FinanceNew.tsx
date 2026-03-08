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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Edit,
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
  GripVertical,
  Maximize2,
  Minimize2,
  EyeOff,
  Settings,
  RotateCcw,
  Building2,
  CreditCard as CreditCardIcon,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Finance components
import { useFinanceCalculations, Invoice as FinanceInvoice, Expense as FinanceExpense } from '@/hooks/useFinanceCalculations';
import {
  FinanceKPIs,
  CashFlowForecast,
  ProfitLossReport,
  BudgetManager,
  PartialPaymentDialog,
  AlertsSettings,
  BankTransactionsView,
} from '@/components/finance';

// ============================================================================
// Types
// ============================================================================

type WidgetSize = 'small' | 'medium' | 'large' | 'full';

interface WidgetConfig {
  id: string;
  title: string;
  size: WidgetSize;
  visible: boolean;
  order: number;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  widgets: WidgetConfig[];
}

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

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'finance-tabs-layout-v2';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c43'];

const sizeToColumns: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-3',
  full: 'col-span-4',
};

const sizeLabels: Record<WidgetSize, string> = {
  small: 'קטן',
  medium: 'בינוני',
  large: 'גדול',
  full: 'מלא',
};

// Default tabs configuration
const DEFAULT_TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'סקירה כללית',
    icon: <PieChart className="h-4 w-4" />,
    widgets: [
      { id: 'kpis', title: 'מדדי ביצוע', size: 'full', visible: true, order: 0 },
      { id: 'cashflow', title: 'תזרים מזומנים', size: 'large', visible: true, order: 1 },
      { id: 'vat-summary', title: 'סיכום מע"מ', size: 'medium', visible: true, order: 2 },
      { id: 'profit-loss', title: 'רווח והפסד', size: 'full', visible: true, order: 3 },
    ],
  },
  {
    id: 'invoices',
    label: 'חשבוניות',
    icon: <Receipt className="h-4 w-4" />,
    widgets: [
      { id: 'invoices-summary', title: 'סיכום חשבוניות', size: 'full', visible: true, order: 0 },
      { id: 'invoices-list', title: 'רשימת חשבוניות', size: 'full', visible: true, order: 1 },
      { id: 'debts', title: 'חובות פתוחים', size: 'medium', visible: true, order: 2 },
    ],
  },
  {
    id: 'expenses',
    label: 'הוצאות',
    icon: <MinusCircle className="h-4 w-4" />,
    widgets: [
      { id: 'expenses-summary', title: 'סיכום הוצאות', size: 'large', visible: true, order: 0 },
      { id: 'expenses-list', title: 'רשימת הוצאות', size: 'full', visible: true, order: 1 },
      { id: 'budget', title: 'ניהול תקציב', size: 'full', visible: true, order: 2 },
    ],
  },
  {
    id: 'bank',
    label: 'חשבונות בנק',
    icon: <Building2 className="h-4 w-4" />,
    widgets: [
      { id: 'bank-transactions', title: 'תנועות בנק', size: 'full', visible: true, order: 0 },
    ],
  },
  {
    id: 'analytics',
    label: 'אנליטיקס',
    icon: <BarChart3 className="h-4 w-4" />,
    widgets: [
      { id: 'top-clients', title: 'לקוחות מובילים', size: 'medium', visible: true, order: 0 },
      { id: 'monthly-chart', title: 'התפלגות חודשית', size: 'full', visible: true, order: 1 },
      { id: 'strongest-months', title: 'חודשים חזקים', size: 'medium', visible: true, order: 2 },
    ],
  },
  {
    id: 'settings',
    label: 'הגדרות',
    icon: <Settings className="h-4 w-4" />,
    widgets: [
      { id: 'alerts', title: 'התראות', size: 'full', visible: true, order: 0 },
    ],
  },
];

// ============================================================================
// Sortable Widget Component
// ============================================================================

interface SortableWidgetProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  onSizeChange: (id: string, size: WidgetSize) => void;
  onVisibilityToggle: (id: string) => void;
}

function SortableWidget({
  widget,
  children,
  onSizeChange,
  onVisibilityToggle,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sizes: WidgetSize[] = ['small', 'medium', 'large', 'full'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        sizeToColumns[widget.size],
        'transition-all duration-200',
        isDragging && 'z-50'
      )}
    >
      <Card className={cn(
        'h-full relative group border-2',
        isDragging && 'ring-2 ring-primary shadow-lg'
      )}>
        {/* Drag Handle & Controls */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-md p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rtl">
              <div className="px-2 py-1.5 text-sm font-medium">גודל</div>
              {sizes.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => onSizeChange(widget.id, size)}
                  className={cn(widget.size === size && 'bg-accent')}
                >
                  {size === 'small' && <Minimize2 className="h-4 w-4 ml-2" />}
                  {size === 'medium' && <LayoutGrid className="h-4 w-4 ml-2" />}
                  {size === 'large' && <Maximize2 className="h-4 w-4 ml-2" />}
                  {size === 'full' && <Maximize2 className="h-4 w-4 ml-2" />}
                  {sizeLabels[size]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onVisibilityToggle(widget.id)}>
                <EyeOff className="h-4 w-4 ml-2" />
                הסתר
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {children}
      </Card>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function FinanceNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Tabs state
  const [tabs, setTabs] = useState<TabConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_TABS;
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Data state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isPartialPaymentDialogOpen, setIsPartialPaymentDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  
  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    client_id: '',
    project_id: '',
    amount: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    description: '',
  });
  
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'other',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    supplier_name: '',
    has_vat: true,
    is_recurring: false,
    recurring_day: 1,
    notes: '',
  });

  // VAT rate
  const vatRate = 17;
  
  // Finance calculations hook
  const { kpis, cashFlowForecast, profitLoss } = useFinanceCalculations([], [], [], vatRate);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Save tabs layout to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('created_by', user.id)
        .order('issue_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id);

      if (clientsError) throw clientsError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, client_id')
        .eq('created_by', user.id);

      if (projectsError) throw projectsError;

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      // Map client and project names
      const clientsMap = new Map(clientsData?.map(c => [c.id, c.name]) || []);
      const projectsMap = new Map(projectsData?.map(p => [p.id, p.name]) || []);
      
      const enrichedInvoices = (invoicesData || []).map(inv => ({
        ...inv,
        client_name: clientsMap.get(inv.client_id) || 'לא ידוע',
        project_name: inv.project_id ? projectsMap.get(inv.project_id) : undefined,
      }));

      setInvoices(enrichedInvoices);
      setClients(clientsData || []);
      setProjects(projectsData || []);
      setExpenses(expensesData || []);
    } catch (error: any) {
      toast({
        title: 'שגיאה בטעינת נתונים',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Widget Management
  // ============================================================================

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setTabs(prevTabs => {
        return prevTabs.map(tab => {
          if (tab.id !== activeTab) return tab;
          
          const oldIndex = tab.widgets.findIndex(w => w.id === active.id);
          const newIndex = tab.widgets.findIndex(w => w.id === over.id);
          
          if (oldIndex === -1 || newIndex === -1) return tab;
          
          const newWidgets = arrayMove(tab.widgets, oldIndex, newIndex).map((w, i) => ({
            ...w,
            order: i,
          }));
          
          return { ...tab, widgets: newWidgets };
        });
      });
    }
  };

  const handleSizeChange = (widgetId: string, size: WidgetSize) => {
    setTabs(prevTabs => {
      return prevTabs.map(tab => {
        if (tab.id !== activeTab) return tab;
        return {
          ...tab,
          widgets: tab.widgets.map(w => 
            w.id === widgetId ? { ...w, size } : w
          ),
        };
      });
    });
  };

  const handleVisibilityToggle = (widgetId: string) => {
    setTabs(prevTabs => {
      return prevTabs.map(tab => {
        if (tab.id !== activeTab) return tab;
        return {
          ...tab,
          widgets: tab.widgets.map(w => 
            w.id === widgetId ? { ...w, visible: !w.visible } : w
          ),
        };
      });
    });
  };

  const showWidget = (widgetId: string) => {
    setTabs(prevTabs => {
      return prevTabs.map(tab => {
        if (tab.id !== activeTab) return tab;
        return {
          ...tab,
          widgets: tab.widgets.map(w => 
            w.id === widgetId ? { ...w, visible: true } : w
          ),
        };
      });
    });
  };

  const resetLayout = () => {
    setTabs(DEFAULT_TABS);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: 'הפריסה אופסה',
      description: 'כל הווידג\'טים חזרו למיקום המקורי',
    });
  };

  // ============================================================================
  // Calculations
  // ============================================================================

  const stats = useMemo(() => {
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const pendingInvoices = invoices.filter(i => i.status === 'sent');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    
    return {
      totalRevenue: paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
      pendingPayments: pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
      overdueAmount: overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
    };
  }, [invoices]);

  const expenseStats = useMemo(() => {
    const total = expenses.reduce((sum, e) => {
      const amount = Number(e.amount);
      return sum + (e.is_recurring ? amount * 12 : amount);
    }, 0);
    
    const vatExpenses = expenses.filter(e => e.has_vat);
    const vatInputs = vatExpenses.reduce((sum, e) => {
      const amount = Number(e.amount);
      const withRecurring = e.is_recurring ? amount * 12 : amount;
      return sum + (withRecurring * (vatRate / (100 + vatRate)));
    }, 0);
    
    return {
      total,
      beforeVat: total - vatInputs,
      vatInputs,
      oneTimeCount: expenses.filter(e => !e.is_recurring).length,
      recurringCount: expenses.filter(e => e.is_recurring).length,
    };
  }, [expenses, vatRate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const removeVat = (amount: number) => amount / (1 + vatRate / 100);
  const getVatAmount = (amount: number) => amount - removeVat(amount);

  // ============================================================================
  // Get current tab's widgets
  // ============================================================================

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];
  const visibleWidgets = currentTab.widgets.filter(w => w.visible);
  const hiddenWidgets = currentTab.widgets.filter(w => !w.visible);
  const activeWidget = activeId ? currentTab.widgets.find(w => w.id === activeId) : null;

  // ============================================================================
  // Render Widget Content
  // ============================================================================

  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'kpis':
        return (
          <CardContent className="pt-4">
            <FinanceKPIs kpis={kpis} year={new Date().getFullYear()} />
          </CardContent>
        );
        
      case 'cashflow':
        return (
          <CardContent className="pt-4">
            <CashFlowForecast forecast={cashFlowForecast} />
          </CardContent>
        );
        
      case 'vat-summary':
        return (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                סיכום רווח ומע"מ
                <Badge variant="outline" className="text-xs mr-2">מע"מ {vatRate}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <h4 className="font-semibold text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    הכנסות
                  </h4>
                  <div className="space-y-1 text-sm mt-2">
                    <div className="flex justify-between">
                      <span>כולל מע"מ:</span>
                      <span className="font-bold">{formatCurrency(stats.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>לפני מע"מ:</span>
                      <span>{formatCurrency(removeVat(stats.totalRevenue))}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <h4 className="font-semibold text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <MinusCircle className="h-4 w-4" />
                    הוצאות
                  </h4>
                  <div className="space-y-1 text-sm mt-2">
                    <div className="flex justify-between">
                      <span>סה"כ:</span>
                      <span className="font-bold">{formatCurrency(expenseStats.total)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>לפני מע"מ:</span>
                      <span>{formatCurrency(expenseStats.beforeVat)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    סיכום
                  </h4>
                  <div className="space-y-1 text-sm mt-2">
                    <div className="flex justify-between">
                      <span>רווח גולמי:</span>
                      <span className="font-bold">{formatCurrency(removeVat(stats.totalRevenue) - expenseStats.beforeVat)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>מע"מ לתשלום:</span>
                      <span className="font-bold">{formatCurrency(getVatAmount(stats.totalRevenue) - expenseStats.vatInputs)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        );
        
      case 'invoices-summary':
        return (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                סיכום חשבוניות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-background rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">סה"כ</p>
                  <p className="text-2xl font-bold">{formatCurrency(invoices.reduce((sum, i) => sum + Number(i.amount), 0))}</p>
                  <p className="text-xs text-muted-foreground">{invoices.length} חשבוניות</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400 mb-1">שולם</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{stats.paidCount} חשבוניות</p>
                </div>
                
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">טרם שולם</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(stats.pendingPayments)}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">{stats.pendingCount} חשבוניות</p>
                </div>
                
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1">באיחור</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(stats.overdueAmount)}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">{stats.overdueCount} חשבוניות</p>
                </div>
              </div>
            </CardContent>
          </>
        );
        
      case 'invoices-list':
        return (
          <>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  רשימת חשבוניות
                </CardTitle>
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  חדש
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>אין חשבוניות להצגה</p>
                    </div>
                  ) : (
                    invoices.slice(0, 10).map(invoice => (
                      <div key={invoice.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="text-end">
                            <p className="font-semibold">#{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">{invoice.client_name}</p>
                          </div>
                          <div className="text-start">
                            <p className="text-lg font-bold">{formatCurrency(Number(invoice.amount))}</p>
                            <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                              {invoice.status === 'paid' ? 'שולם' : invoice.status === 'overdue' ? 'באיחור' : 'נשלח'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </>
        );
        
      case 'expenses-list':
        return (
          <>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MinusCircle className="h-5 w-5 text-red-600" />
                  רשימת הוצאות
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsExpenseDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  חדש
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {expenses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MinusCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>אין הוצאות להצגה</p>
                    </div>
                  ) : (
                    expenses.slice(0, 10).map(expense => (
                      <div key={expense.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="text-end">
                            <p className="font-semibold">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                            </p>
                          </div>
                          <div className="text-start">
                            <p className="text-lg font-bold text-red-600">{formatCurrency(Number(expense.amount))}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(expense.expense_date), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </>
        );
        
      case 'expenses-summary':
        return (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MinusCircle className="h-5 w-5 text-red-600" />
                סיכום הוצאות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1">סה"כ הוצאות</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(expenseStats.total)}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">הוצאות חד-פעמיות</p>
                  <p className="text-2xl font-bold">{expenseStats.oneTimeCount}</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary mb-1">הוצאות חוזרות</p>
                  <p className="text-2xl font-bold">{expenseStats.recurringCount}</p>
                </div>
              </div>
            </CardContent>
          </>
        );
        
      case 'bank-transactions':
        return (
          <CardContent className="pt-4">
            <BankTransactionsView />
          </CardContent>
        );
        
      case 'top-clients':
        return (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                לקוחות מובילים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
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
                      <div key={name} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            {index + 1}
                          </div>
                          <span className="font-medium text-sm">{name}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </>
        );
        
      case 'debts':
        return (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                חובות פתוחים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {invoices
                    .filter(i => i.status === 'overdue' || i.status === 'sent')
                    .slice(0, 5)
                    .map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="text-end">
                          <p className="font-medium text-sm">{invoice.client_name}</p>
                          <p className="text-xs text-muted-foreground">#{invoice.invoice_number}</p>
                        </div>
                        <div className="text-start">
                          <p className="font-bold">{formatCurrency(Number(invoice.amount))}</p>
                          <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                            {invoice.status === 'overdue' ? 'באיחור' : 'ממתין'}
                          </Badge>
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
          </>
        );
        
      case 'profit-loss':
        return (
          <CardContent className="pt-4">
            <ProfitLossReport data={profitLoss} year={new Date().getFullYear()} vatRate={vatRate} />
          </CardContent>
        );
        
      case 'budget':
        return (
          <CardContent className="pt-4">
            <BudgetManager expenses={profitLoss.expensesByCategory} year={new Date().getFullYear()} />
          </CardContent>
        );
        
      case 'alerts':
        return (
          <CardContent className="pt-4">
            <AlertsSettings 
              invoices={invoices.map(i => ({
                id: i.id,
                invoice_number: i.invoice_number,
                amount: i.amount,
                status: i.status,
                due_date: i.due_date,
              }))}
            />
          </CardContent>
        );
        
      case 'monthly-chart':
        return (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                התפלגות חודשית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                גרף התפלגות חודשית
              </div>
            </CardContent>
          </>
        );
        
      case 'strongest-months':
        return (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                חודשים חזקים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthInvoices = invoices.filter(inv => new Date(inv.issue_date).getMonth() === i);
                  return {
                    month: format(new Date(2024, i, 1), 'MMMM', { locale: he }),
                    total: monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
                  };
                })
                  .filter(m => m.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 3)
                  .map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        )}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-sm">{month.month}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(month.total)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </>
        );
        
      default:
        return (
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              תוכן לא זמין
            </div>
          </CardContent>
        );
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-4 p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ניהול כספים</h1>
            <p className="text-muted-foreground">חשבוניות, הכנסות ותזרים מזומנים</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetLayout} size="sm">
              <RotateCcw className="h-4 w-4 ml-2" />
              אפס פריסה
            </Button>
            <Button variant="outline" onClick={fetchData} disabled={isLoading} size="sm">
              <RefreshCw className={cn('h-4 w-4 ml-2', isLoading && 'animate-spin')} />
              רענן
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 whitespace-nowrap">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {/* Hidden Widgets Panel */}
              {tab.widgets.some(w => !w.visible) && (
                <Card className="border-dashed mb-4">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <EyeOff className="h-4 w-4" />
                      ווידג'טים מוסתרים ({tab.widgets.filter(w => !w.visible).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="flex flex-wrap gap-2">
                      {tab.widgets
                        .filter(w => !w.visible)
                        .map(widget => (
                          <Button
                            key={widget.id}
                            variant="outline"
                            size="sm"
                            onClick={() => showWidget(widget.id)}
                            className="gap-2"
                          >
                            {widget.title}
                            <Eye className="h-3 w-3" />
                          </Button>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Widgets Grid */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={tab.widgets.filter(w => w.visible).map(w => w.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-4 gap-4 auto-rows-min">
                    {tab.widgets
                      .filter(w => w.visible)
                      .map(widget => (
                        <SortableWidget
                          key={widget.id}
                          widget={widget}
                          onSizeChange={handleSizeChange}
                          onVisibilityToggle={handleVisibilityToggle}
                        >
                          {renderWidgetContent(widget.id)}
                        </SortableWidget>
                      ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeWidget && (
                    <Card className="shadow-2xl ring-2 ring-primary opacity-80">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{activeWidget.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="h-20 flex items-center justify-center text-muted-foreground">
                        גורר...
                      </CardContent>
                    </Card>
                  )}
                </DragOverlay>
              </DndContext>
            </TabsContent>
          ))}
        </Tabs>

        {/* Create Invoice Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
              <Button onClick={() => {
                toast({ title: 'יצירת חשבונית', description: 'פונקציונליות זו תתווסף בקרוב' });
                setIsCreateDialogOpen(false);
              }}>
                צור חשבונית
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Expense Dialog */}
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={() => {
                toast({ title: 'הוספת הוצאה', description: 'פונקציונליות זו תתווסף בקרוב' });
                setIsExpenseDialogOpen(false);
              }}>
                הוסף הוצאה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Partial Payment Dialog */}
        <PartialPaymentDialog
          open={isPartialPaymentDialogOpen}
          onOpenChange={setIsPartialPaymentDialogOpen}
          invoice={selectedInvoiceForPayment}
          onPaymentAdded={() => {
            fetchData();
            setSelectedInvoiceForPayment(null);
          }}
        />
      </div>
    </AppLayout>
  );
}
