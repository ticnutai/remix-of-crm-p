// DataTable Pro - Advanced Table System with Supabase Sync
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { UniversalDataTable } from '@/components/tables/UniversalDataTable';
import { ColumnDef, Preset, FilterState, SortState, TableStyleConfig } from '@/components/DataTable/types';
import { TableStyleSettings } from '@/components/DataTable/components/TableStyleSettings';
import { useTableStyleConfig } from '@/components/DataTable/hooks/useTableStyleConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDataTableSync, SyncedProject, SyncedClient } from '@/hooks/useDataTableSync';
import { useEmployeesSync, SyncedEmployee } from '@/hooks/useEmployeesSync';
import { useCustomTables, useCustomTableData, CustomTable, CustomTableData, TableColumn } from '@/hooks/useCustomTables';
import { useTableCustomColumns, useCustomData } from '@/hooks/useTableCustomColumns';
import { useClientClassification, ClientFilter } from '@/hooks/useClientClassification';
import { useClientStagesTable } from '@/hooks/useClientStagesTable';
import { useClientConsultantsTable } from '@/hooks/useClientConsultantsTable';
import { CreateTableDialog } from '@/components/custom-tables/CreateTableDialog';
import { CustomTableTab } from '@/components/custom-tables/CustomTableTab';
import { ManageTablesDialog } from '@/components/custom-tables/ManageTablesDialog';
import { AddColumnDialog, CustomColumn } from '@/components/tables/AddColumnDialog';
import { BulkConsultantDialog } from '@/components/clients/BulkConsultantDialog';
import { ColumnOptionsMenu } from '@/components/DataTable/components/ColumnOptionsMenu';
import { ClientFilterPanel } from '@/components/clients/ClientFilterPanel';
import { CategoriesSidebar } from '@/components/clients/CategoriesSidebar';
import { ClientNameWithCategory } from '@/components/clients/ClientNameWithCategory';
import { Loader2, Database, RefreshCw, Crown, UserCog, User, FolderOpen, Layers } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  Settings,
  Save,
  Trash2,
  Download,
  Filter,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  LayoutGrid,
  Folder,
  Calendar,
  DollarSign,
  Star,
  AlertTriangle,
  Info,
  Plus,
  Pencil,
  Undo2,
  Redo2,
  GripVertical,
  Columns,
  Upload,
  FileSpreadsheet,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FolderKanban,
  Package,
  Briefcase,
  Building,
  Car,
  ShoppingCart,
  Wallet,
  FileText,
  Eye,
  Heart,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// Demo data types
interface DemoProject {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget: number;
  spent: number;
  progress: number;
  startDate: string;
  endDate: string | null;
  team: string[];
  category: string;
  rating: number;
  [key: string]: any; // Allow dynamic columns
}

// Custom column interface for dynamic columns
interface DynamicColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'data_type';
  options?: string[];
  required?: boolean;
  defaultValue?: string;
  dataTypeId?: string;
}

interface DemoEmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'vacation';
  performance: number;
  projects: number;
}

// Role badge component
const RoleBadge = React.forwardRef<HTMLDivElement, { role: string }>(({ role }, ref) => {
  const config: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    admin: { label: 'מנהל ראשי', color: '#dc2626', bgColor: '#fee2e2', icon: <Crown className="h-3 w-3" /> },
    manager: { label: 'מנהל', color: '#ca8a04', bgColor: '#fef9c3', icon: <UserCog className="h-3 w-3" /> },
    employee: { label: 'עובד', color: '#6b7280', bgColor: '#f3f4f6', icon: <User className="h-3 w-3" /> },
    client: { label: 'לקוח', color: '#2563eb', bgColor: '#dbeafe', icon: <User className="h-3 w-3" /> },
  };

  const roleConfig = config[role] || config.employee;

  return (
    <div 
      ref={ref} 
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: roleConfig.bgColor, color: roleConfig.color }}
    >
      {roleConfig.icon}
      {roleConfig.label}
    </div>
  );
});
RoleBadge.displayName = 'RoleBadge';


// Status badge component
const StatusBadge = React.forwardRef<HTMLDivElement, { status: string }>(({ status }, ref) => {
  const variants: Record<string, { color: string; icon: React.ReactNode }> = {
    active: { color: 'bg-green-500/20 text-green-600 border-green-500/30', icon: <CheckCircle className="h-3 w-3" /> },
    completed: { color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', icon: <CheckCircle className="h-3 w-3" /> },
    'on-hold': { color: 'bg-amber-500/20 text-amber-600 border-amber-500/30', icon: <Clock className="h-3 w-3" /> },
    cancelled: { color: 'bg-red-500/20 text-red-600 border-red-500/30', icon: <XCircle className="h-3 w-3" /> },
    inactive: { color: 'bg-gray-500/20 text-gray-600 border-gray-500/30', icon: <XCircle className="h-3 w-3" /> },
    vacation: { color: 'bg-purple-500/20 text-purple-600 border-purple-500/30', icon: <Calendar className="h-3 w-3" /> },
  };

  const statusLabels: Record<string, string> = {
    active: 'פעיל',
    completed: 'הושלם',
    'on-hold': 'בהמתנה',
    cancelled: 'בוטל',
    inactive: 'לא פעיל',
    vacation: 'חופשה',
  };

  const config = variants[status] || variants.active;

  return (
    <div ref={ref} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${config.color}`}>
      {config.icon}
      {statusLabels[status] || status}
    </div>
  );
});
StatusBadge.displayName = 'StatusBadge';

// Priority badge
const PriorityBadge = React.forwardRef<HTMLDivElement, { priority: string }>(({ priority }, ref) => {
  const colors: Record<string, string> = {
    low: 'bg-slate-500/20 text-slate-600',
    medium: 'bg-blue-500/20 text-blue-600',
    high: 'bg-orange-500/20 text-orange-600',
    critical: 'bg-red-500/20 text-red-600',
  };

  const labels: Record<string, string> = {
    low: 'נמוך',
    medium: 'בינוני',
    high: 'גבוה',
    critical: 'קריטי',
  };

  return (
    <div ref={ref} className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${colors[priority]}`}>
      {labels[priority]}
    </div>
  );
});
PriorityBadge.displayName = 'PriorityBadge';

// Progress bar
const ProgressBar = React.forwardRef<HTMLDivElement, { value: number }>(({ value }, ref) => (
  <div ref={ref} className="flex items-center gap-2">
    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full transition-all ${
          value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-blue-500' : value >= 25 ? 'bg-amber-500' : 'bg-red-500'
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="text-sm text-muted-foreground w-10">{value}%</span>
  </div>
));
ProgressBar.displayName = 'ProgressBar';

// Rating stars
const RatingStars = React.forwardRef<HTMLDivElement, { rating: number }>(({ rating }, ref) => (
  <div ref={ref} className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted'}`}
      />
    ))}
  </div>
));
RatingStars.displayName = 'RatingStars';

// Presets storage key
const PRESETS_STORAGE_KEY = 'datatable-pro-presets';

export default function DataTablePro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('clients');
  
  // Table styling configuration
  const { config: tableStyleConfig, updateConfig: updateTableStyleConfig, resetConfig: resetTableStyleConfig } = useTableStyleConfig('clients');
  
  // Database sync hook
  const {
    projects: dbProjects,
    clients: dbClients,
    clientOptions,
    isLoading: dbLoading,
    isSyncing,
    fetchData: refreshData,
    updateProject,
    addProject: addDbProject,
    deleteProject: deleteDbProject,
    updateClient,
    addClient: addDbClient,
    deleteClient: deleteDbClient,
  } = useDataTableSync();
  
  // Client classification hook for smart filtering
  const {
    consultants,
    clientConsultants,
    loading: classificationLoading,
    fetchClientConsultants,
    assignConsultant,
    removeConsultant,
    getClientsByConsultant,
    filterClients,
  } = useClientClassification();
  
  // Client filter state
  const [clientFilter, setClientFilter] = useState<ClientFilter>({});
  const [filteredClients, setFilteredClients] = useState<SyncedClient[] | null>(null);
  
  // Client categories state
  interface ClientCategory {
    id: string;
    name: string;
    color: string;
    icon: string;
  }
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  
  // Load categories from Supabase
  useEffect(() => {
    const loadCategories = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('client_categories')
        .select('*')
        .order('name');
      if (data) setCategories(data);
    };
    loadCategories();
  }, []);
  
  // Client stages for table display
  const {
    clientStages: clientStagesMap,
    allStages: availableStages,
    loading: stagesLoading,
    updateClientStage,
    updateMultipleClientsStage,
    getClientStageInfo,
  } = useClientStagesTable();
  
  // Client consultants for table display (bi-directional sync)
  const {
    clientConsultants: clientConsultantsMap,
    allConsultants: availableConsultants,
    loading: consultantsTableLoading,
    setClientConsultant,
    updateMultipleClientsConsultant,
    getClientConsultantsInfo,
  } = useClientConsultantsTable();
  
  // Employees sync hook
  const {
    employees: dbEmployees,
    isLoading: employeesLoading,
    isSyncing: employeesSyncing,
    fetchEmployees: refreshEmployees,
    updateEmployee,
    isManager,
    isAdmin,
  } = useEmployeesSync();

  // Custom tables hook
  const {
    tables: customTables,
    isLoading: customTablesLoading,
    fetchTables: refreshCustomTables,
    deleteTable: deleteCustomTable,
    updateTable: updateCustomTable,
    duplicateTable: duplicateCustomTable,
    canManage: canManageCustomTables,
  } = useCustomTables();

  // Custom columns for clients table (persistent in DB)
  const {
    customColumns: clientCustomColumns,
    isLoading: clientColumnsLoading,
    dataTypeOptions: clientDataTypeOptions,
    addColumn: addClientCustomColumn,
    deleteColumn: deleteClientCustomColumn,
    refetch: refetchClientColumns,
  } = useTableCustomColumns('clients');

  // Custom columns for projects table (persistent in DB)
  const {
    customColumns: projectCustomColumns,
    isLoading: projectColumnsLoading,
    dataTypeOptions: projectDataTypeOptions,
    addColumn: addProjectCustomColumn,
    deleteColumn: deleteProjectCustomColumn,
    refetch: refetchProjectColumns,
  } = useTableCustomColumns('projects');

  // Custom columns for employees/profiles table (persistent in DB)
  const {
    customColumns: employeeCustomColumns,
    isLoading: employeeColumnsLoading,
    dataTypeOptions: employeeDataTypeOptions,
    addColumn: addEmployeeCustomColumn,
    deleteColumn: deleteEmployeeCustomColumn,
    refetch: refetchEmployeeColumns,
  } = useTableCustomColumns('profiles');

  // Create table dialog state
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);
  const [isManageTablesDialogOpen, setIsManageTablesDialogOpen] = useState(false);

  // Active custom table state
  const activeCustomTable = useMemo(() => {
    if (!activeTab.startsWith('custom_')) return null;
    const tableId = activeTab.replace('custom_', '');
    return customTables.find(t => t.id === tableId) || null;
  }, [activeTab, customTables]);
  
  // Preset management
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [presetName, setPresetName] = useState('');
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState[]>([]);
  const [currentSorts, setCurrentSorts] = useState<SortState[]>([]);

  const [isAddRowDialogOpen, setIsAddRowDialogOpen] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [headerStyle, setHeaderStyle] = useState({ bold: true, align: 'right' as 'left' | 'center' | 'right' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Client name edit dialog state
  const [isEditClientNameOpen, setIsEditClientNameOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingClientName, setEditingClientName] = useState('');
  
  const openEditDialog = useCallback((client: SyncedClient) => {
    setEditingClientId(client.id);
    setEditingClientName(client.name);
    setIsEditClientNameOpen(true);
  }, []);
  
  const handleSaveClientName = useCallback(async () => {
    if (!editingClientId || !editingClientName.trim()) return;
    await updateClient(editingClientId, 'name', editingClientName.trim());
    setIsEditClientNameOpen(false);
    setEditingClientId(null);
    setEditingClientName('');
    toast({ title: 'שם הלקוח עודכן בהצלחה' });
  }, [editingClientId, editingClientName, updateClient, toast]);



  // Editable column headers state
  const [columnHeaders, setColumnHeaders] = useState<Record<string, string>>({
    name: 'שם פרויקט',
    client: 'לקוח',
    status: 'סטטוס',
    priority: 'עדיפות',
    category: 'קטגוריה',
    budget: 'תקציב',
    spent: 'הוצאות',
    progress: 'התקדמות',
    rating: 'דירוג',
    startDate: 'תאריך התחלה',
    team: 'צוות',
  });

  // Enhanced select options state (with colors and icons)
  const [priorityOptions, setPriorityOptions] = useState<{ value: string; label: string; color?: string; bgColor?: string; icon?: string; }[]>([
    { value: 'low', label: 'נמוך', color: '#6b7280', bgColor: '#f3f4f6', icon: 'Circle' },
    { value: 'medium', label: 'בינוני', color: '#ca8a04', bgColor: '#fef9c3', icon: 'Circle' },
    { value: 'high', label: 'גבוה', color: '#ea580c', bgColor: '#ffedd5', icon: 'AlertTriangle' },
    { value: 'critical', label: 'קריטי', color: '#dc2626', bgColor: '#fee2e2', icon: 'Zap' },
  ]);

  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string; color?: string; bgColor?: string; icon?: string; }[]>([
    { value: 'active', label: 'פעיל', color: '#16a34a', bgColor: '#dcfce7', icon: 'CheckCircle' },
    { value: 'completed', label: 'הושלם', color: '#2563eb', bgColor: '#dbeafe', icon: 'CheckCircle' },
    { value: 'on-hold', label: 'בהמתנה', color: '#ca8a04', bgColor: '#fef9c3', icon: 'Clock' },
    { value: 'cancelled', label: 'בוטל', color: '#dc2626', bgColor: '#fee2e2', icon: 'XCircle' },
  ]);

  const handleHeaderChange = useCallback((columnId: string, newHeader: string) => {
    setColumnHeaders(prev => ({ ...prev, [columnId]: newHeader }));
    toast({ title: 'כותרת עודכנה', description: `הכותרת שונתה ל-"${newHeader}"` });
  }, [toast]);

  // Cell formatting state
  const [cellFormatting, setCellFormatting] = useState<{
    styles: Record<string, any>;
    notes: Record<string, any>;
    reminders: Record<string, any[]>;
  }>({ styles: {}, notes: {}, reminders: {} });

  const handleCellStyleChange = useCallback((cellId: string, style: any) => {
    setCellFormatting(prev => ({
      ...prev,
      styles: { ...prev.styles, [cellId]: style }
    }));
  }, []);

  const handleCellNoteChange = useCallback((cellId: string, note: any) => {
    setCellFormatting(prev => ({
      ...prev,
      notes: note ? { ...prev.notes, [cellId]: note } : 
        Object.fromEntries(Object.entries(prev.notes).filter(([k]) => k !== cellId))
    }));
    toast({ title: note ? 'הערה נשמרה' : 'הערה נמחקה' });
  }, [toast]);

  const handleCellReminderAdd = useCallback((cellId: string, reminder: any) => {
    const newReminder = { ...reminder, id: `rem-${Date.now()}` };
    setCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: [...(prev.reminders[cellId] || []), newReminder] }
    }));
    toast({ title: 'תזכורת נוספה' });
  }, [toast]);

  const handleCellReminderUpdate = useCallback((cellId: string, reminder: any) => {
    setCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: prev.reminders[cellId]?.map((r: any) => r.id === reminder.id ? reminder : r) || [] }
    }));
  }, []);

  const handleCellReminderDelete = useCallback((cellId: string, reminderId: string) => {
    setCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: prev.reminders[cellId]?.filter((r: any) => r.id !== reminderId) || [] }
    }));
    toast({ title: 'תזכורת נמחקה' });
  }, [toast]);

  // Undo/Redo history
  const [projectHistory, setProjectHistory] = useState<DemoProject[][]>([]);
  const [projectFuture, setProjectFuture] = useState<DemoProject[][]>([]);
  const maxHistorySize = 50;

  // Save to history before changes
  const saveToHistory = useCallback((currentData: DemoProject[]) => {
    setProjectHistory(prev => {
      const newHistory = [...prev, currentData];
      return newHistory.slice(-maxHistorySize);
    });
    setProjectFuture([]);
  }, []);

  // Import from file (CSV/Excel)
  const handleImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        const importedData: DemoProject[] = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return {
            id: `imported-${Date.now()}-${index}`,
            name: values[0] || `פרויקט ${index + 1}`,
            client: values[1] || 'לקוח מיובא',
            status: 'active' as const,
            priority: 'medium' as const,
            budget: parseInt(values[2]) || 0,
            spent: parseInt(values[3]) || 0,
            progress: parseInt(values[4]) || 0,
            startDate: new Date().toISOString(),
            endDate: null,
            team: [],
            category: 'מיובא',
            rating: 3,
          };
        });

        toast({ title: 'יובא בהצלחה', description: `${importedData.length} שורות יובאו מקובץ CSV` });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedData: DemoProject[] = jsonData.map((row: any, index: number) => ({
          id: `imported-${Date.now()}-${index}`,
          name: row['שם'] || row['name'] || `פרויקט ${index + 1}`,
          client: row['לקוח'] || row['client'] || 'לקוח מיובא',
          status: 'active' as const,
          priority: 'medium' as const,
          budget: parseInt(row['תקציב'] || row['budget']) || 0,
          spent: parseInt(row['הוצאות'] || row['spent']) || 0,
          progress: parseInt(row['התקדמות'] || row['progress']) || 0,
          startDate: new Date().toISOString(),
          endDate: null,
          team: [],
          category: 'מיובא',
          rating: 3,
        }));

        toast({ title: 'יובא בהצלחה', description: `${importedData.length} שורות יובאו מקובץ Excel` });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לייבא את הקובץ', variant: 'destructive' });
    }

    setIsImportDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [saveToHistory, toast]);

  // Connect to Google Sheets (placeholder - requires API key)
  const handleConnectGoogleSheets = useCallback(() => {
    toast({ 
      title: 'חיבור ל-Google Sheets', 
      description: 'תכונה זו דורשת הגדרת API Key של Google. פנה למנהל המערכת.',
    });
  }, [toast]);

  // Undo - placeholder for DB mode
  const handleUndo = useCallback(() => {
    toast({ title: 'לא זמין', description: 'פעולת ביטול לא נתמכת במצב מסד נתונים' });
  }, [toast]);

  // Redo - placeholder for DB mode
  const handleRedo = useCallback(() => {
    toast({ title: 'לא זמין', description: 'פעולת חזרה לא נתמכת במצב מסד נתונים' });
  }, [toast]);

  // Move row - placeholder for DB mode
  const handleMoveRow = useCallback((rowId: string, direction: 'up' | 'down') => {
    toast({ title: 'לא זמין', description: 'הזזת שורות לא נתמכת במצב מסד נתונים' });
  }, [toast]);

  // Local projects state for custom data updates
  const [localProjects, setLocalProjects] = useState<SyncedProject[]>([]);
  
  // Keep localProjects in sync with dbProjects
  useEffect(() => {
    setLocalProjects(dbProjects);
  }, [dbProjects]);
  
  // Custom data hook for updating custom columns data for projects
  const { updateCustomData: updateProjectCustomData } = useCustomData('projects', localProjects, setLocalProjects);

  // Project column added handler (for AddColumnDialog)
  const handleProjectColumnAdded = useCallback((column: CustomColumn) => {
    addProjectCustomColumn(column);
    setIsAddColumnDialogOpen(false);
    toast({ title: 'נוסף', description: `העמודה "${column.column_name}" נוספה` });
  }, [addProjectCustomColumn, toast]);

  // Delete column for projects (from DB)
  const handleDeleteProjectColumn = useCallback(async (columnId: string) => {
    const { error } = await deleteProjectCustomColumn(columnId);
    if (!error) {
      toast({ title: 'נמחק', description: 'העמודה נמחקה' });
    } else {
      toast({ title: 'שגיאה', description: 'לא ניתן למחוק את העמודה', variant: 'destructive' });
    }
  }, [deleteProjectCustomColumn, toast]);

  // Handle cell edit - syncs to database and supports custom columns
  const handleProjectCellEdit = useCallback(async (row: SyncedProject, columnId: string, newValue: any) => {
    // Check if this is a custom column (stored in custom_data)
    const customColumn = projectCustomColumns.find(col => col.column_key === columnId || `custom_data.${col.column_key}` === columnId);
    
    if (customColumn) {
      // Extract the actual column key from accessorKey if needed
      const actualColumnKey = columnId.startsWith('custom_data.') 
        ? columnId.replace('custom_data.', '') 
        : columnId;
      
      const { error } = await updateProjectCustomData(row.id, actualColumnKey, newValue);
      if (error) {
        toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את הערך', variant: 'destructive' });
      } else {
        toast({ title: 'עודכן', description: 'הערך נשמר' });
      }
    } else {
      // Base column - update via updateProject
      await updateProject(row.id, columnId, newValue);
    }
  }, [updateProject, projectCustomColumns, updateProjectCustomData, toast]);

  // Local employees state for custom data updates (must be before handleEmployeeCellEdit)
  const [localEmployees, setLocalEmployees] = useState<SyncedEmployee[]>([]);
  
  // Keep localEmployees in sync with dbEmployees
  useEffect(() => {
    setLocalEmployees(dbEmployees);
  }, [dbEmployees]);
  
  // Custom data hook for updating custom columns data for employees
  const { updateCustomData: updateEmployeeCustomData } = useCustomData('profiles', localEmployees, setLocalEmployees);

  const handleEmployeeCellEdit = useCallback(async (row: SyncedEmployee, columnId: string, newValue: any) => {
    
    // Check if this is a custom column (stored in custom_data)
    const customColumn = employeeCustomColumns.find(col => col.column_key === columnId || `custom_data.${col.column_key}` === columnId);
    
    if (customColumn) {
      // Update custom column data
      const actualColumnKey = columnId.startsWith('custom_data.') ? columnId.replace('custom_data.', '') : columnId;
      const { error } = await updateEmployeeCustomData(row.id, actualColumnKey, newValue);
      
      if (error) {
        console.error('❌ Error updating custom data:', error);
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לעדכן את העמודה',
          variant: 'destructive',
        });
      } else {
        // success - no log needed
      }
    } else {
      // Update base column
      await updateEmployee(row.id, columnId, newValue);
    }
  }, [updateEmployee, employeeCustomColumns, updateEmployeeCustomData, toast]);

  // Add new project - syncs to database
  const handleAddProject = useCallback(async () => {
    if (!newProjectName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם פרויקט',
        variant: 'destructive',
      });
      return;
    }

    const result = await addDbProject(newProjectName, newProjectClient);
    if (result) {
      setNewProjectName('');
      setNewProjectClient('');
      setIsAddRowDialogOpen(false);
    }
  }, [newProjectName, newProjectClient, toast, addDbProject]);

  // Delete selected projects - now syncs to database
  const [selectedProjects, setSelectedProjects] = useState<DemoProject[]>([]);
  const [selectedClients, setSelectedClients] = useState<SyncedClient[]>([]);
  
  // Client dialog states
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  
  // Bulk operations state
  const [isBulkConsultantOpen, setIsBulkConsultantOpen] = useState(false);
  
  // Client dynamic columns state - using persistent DB columns
  const [isAddClientColumnDialogOpen, setIsAddClientColumnDialogOpen] = useState(false);
  const clientFileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Local clients state for custom data updates
  const [localClients, setLocalClients] = useState<SyncedClient[]>([]);
  
  // Keep localClients in sync with dbClients
  useEffect(() => {
    setLocalClients(dbClients);
  }, [dbClients]);
  
  // Custom data hook for updating custom columns data
  const { updateCustomData: updateClientCustomData } = useCustomData('clients', localClients, setLocalClients);
  
  // Client column headers state (editable)
  const [clientColumnHeaders, setClientColumnHeaders] = useState<Record<string, string>>({
    name: 'שם לקוח',
    company: 'חברה',
    email: 'אימייל',
    phone: 'טלפון',
    status: 'סטטוס',
    address: 'כתובת',
    notes: 'הערות',
    created_at: 'תאריך הוספה',
    actions: 'פעולות',
  });
  
  // Client hidden columns state
  const [hiddenClientColumns, setHiddenClientColumns] = useState<Set<string>>(new Set());
  
  // Handle client column header change
  const handleClientHeaderChange = useCallback((columnId: string, newHeader: string) => {
    setClientColumnHeaders(prev => ({ ...prev, [columnId]: newHeader }));
    toast({ title: 'כותרת עודכנה', description: `הכותרת שונתה ל-"${newHeader}"` });
  }, [toast]);
  
  // Handle client column hide/show
  const handleHideClientColumn = useCallback((columnId: string) => {
    setHiddenClientColumns(prev => {
      const newSet = new Set(prev);
      newSet.add(columnId);
      return newSet;
    });
    toast({ title: 'עמודה הוסתרה', description: 'ניתן להחזיר אותה מהגדרות העמודות' });
  }, [toast]);
  
  const handleShowClientColumn = useCallback((columnId: string) => {
    setHiddenClientColumns(prev => {
      const newSet = new Set(prev);
      newSet.delete(columnId);
      return newSet;
    });
  }, []);
  
  // Client cell formatting state
  const [clientCellFormatting, setClientCellFormatting] = useState<{
    styles: Record<string, any>;
    notes: Record<string, any>;
    reminders: Record<string, any[]>;
  }>({ styles: {}, notes: {}, reminders: {} });
  
  // Client history for Undo/Redo
  const [clientHistory, setClientHistory] = useState<SyncedClient[][]>([]);
  const [clientFuture, setClientFuture] = useState<SyncedClient[][]>([]);
  
  // Employee dialog states
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeeDepartment, setNewEmployeeDepartment] = useState('');
  const [newEmployeePosition, setNewEmployeePosition] = useState('');
  const [newEmployeePhone, setNewEmployeePhone] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<SyncedEmployee[]>([]);
  
  // Employee columns state
  const [isAddEmployeeColumnDialogOpen, setIsAddEmployeeColumnDialogOpen] = useState(false);
  const employeeFileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Employee cell formatting state
  const [employeeCellFormatting, setEmployeeCellFormatting] = useState<{
    styles: Record<string, any>;
    notes: Record<string, any>;
    reminders: Record<string, any[]>;
  }>({ styles: {}, notes: {}, reminders: {} });
  
  // Employee history for Undo/Redo
  const [employeeHistory, setEmployeeHistory] = useState<SyncedEmployee[][]>([]);
  const [employeeFuture, setEmployeeFuture] = useState<SyncedEmployee[][]>([]);

  // Handle client cell edit - supports both base columns and custom columns
  const handleClientCellEdit = useCallback(async (row: SyncedClient, columnId: string, newValue: any) => {
    // Special handling for current_stage column
    if (columnId === 'current_stage') {
      const success = await updateClientStage(row.id, newValue);
      if (success) {
        toast({ title: 'עודכן', description: `השלב שונה ל-${newValue}` });
      } else {
        toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את השלב', variant: 'destructive' });
      }
      return;
    }
    
    // Special handling for consultants column (bi-directional sync)
    if (columnId === 'consultants') {
      const success = await setClientConsultant(row.id, newValue);
      if (success) {
        toast({ title: 'עודכן', description: `היועץ שונה ל-${newValue}` });
      } else {
        toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את היועץ', variant: 'destructive' });
      }
      return;
    }
    
    // Check if this is a custom column (stored in custom_data)
    const customColumn = clientCustomColumns.find(col => col.column_key === columnId || `custom_data.${col.column_key}` === columnId);
    
    if (customColumn) {
      // Extract the actual column key from accessorKey if needed
      const actualColumnKey = columnId.startsWith('custom_data.') 
        ? columnId.replace('custom_data.', '') 
        : columnId;
      
      const { error } = await updateClientCustomData(row.id, actualColumnKey, newValue);
      if (error) {
        toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את הערך', variant: 'destructive' });
      } else {
        toast({ title: 'עודכן', description: 'הערך נשמר' });
      }
    } else {
      // Base column - update via updateClient
      await updateClient(row.id, columnId, newValue);
    }
  }, [updateClient, clientCustomColumns, updateClientCustomData, toast, updateClientStage, setClientConsultant]);

  // Add new client
  const handleAddClient = useCallback(async () => {
    if (!newClientName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לקוח',
        variant: 'destructive',
      });
      return;
    }

    const result = await addDbClient(newClientName);
    if (result) {
      // Update additional fields if provided
      if (newClientEmail) await updateClient(result.id, 'email', newClientEmail);
      if (newClientPhone) await updateClient(result.id, 'phone', newClientPhone);
      if (newClientCompany) await updateClient(result.id, 'company', newClientCompany);
      
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientCompany('');
      setIsAddClientDialogOpen(false);
    }
  }, [newClientName, newClientEmail, newClientPhone, newClientCompany, addDbClient, updateClient, toast]);

  // Delete selected clients
  const handleDeleteSelectedClients = useCallback(async () => {
    if (selectedClients.length === 0) return;
    
    const count = selectedClients.length;
    const confirmed = window.confirm(`האם למחוק ${count} לקוחות שנבחרו?`);
    if (!confirmed) return;
    
    let successCount = 0;
    for (const client of selectedClients) {
      try {
        await deleteDbClient(client.id);
        successCount++;
      } catch (e) {
        console.error('Failed to delete client:', client.id, e);
      }
    }
    setSelectedClients([]);
    toast({
      title: 'לקוחות נמחקו',
      description: `${successCount} מתוך ${count} לקוחות נמחקו בהצלחה`,
    });
  }, [selectedClients, deleteDbClient, toast]);

  // Handle client selection change from table (stable callback)
  const handleClientSelectionChange = useCallback((selected: any[]) => {
    setSelectedClients(selected as SyncedClient[]);
  }, []);

  // Set stage for multiple selected clients
  const handleBulkSetStage = useCallback(async (stageName: string) => {
    if (selectedClients.length === 0) return;
    
    const clientIds = selectedClients.map(c => c.id);
    const { successCount, failCount } = await updateMultipleClientsStage(clientIds, stageName);
    
    if (successCount > 0) {
      toast({
        title: 'השלב עודכן',
        description: `${successCount} לקוחות עודכנו לשלב "${stageName}"${failCount > 0 ? ` (${failCount} נכשלו)` : ''}`,
      });
    } else {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את השלבים',
        variant: 'destructive',
      });
    }
  }, [selectedClients, updateMultipleClientsStage, toast]);

  // Client cell formatting handlers
  const handleClientCellStyleChange = useCallback((cellId: string, style: any) => {
    setClientCellFormatting(prev => ({
      ...prev,
      styles: { ...prev.styles, [cellId]: style }
    }));
  }, []);

  const handleClientCellNoteChange = useCallback((cellId: string, note: any) => {
    setClientCellFormatting(prev => ({
      ...prev,
      notes: note ? { ...prev.notes, [cellId]: note } : 
        Object.fromEntries(Object.entries(prev.notes).filter(([k]) => k !== cellId))
    }));
    toast({ title: note ? 'הערה נשמרה' : 'הערה נמחקה' });
  }, [toast]);

  const handleClientCellReminderAdd = useCallback((cellId: string, reminder: any) => {
    const newReminder = { ...reminder, id: `rem-${Date.now()}` };
    setClientCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: [...(prev.reminders[cellId] || []), newReminder] }
    }));
    toast({ title: 'תזכורת נוספה' });
  }, [toast]);

  const handleClientCellReminderUpdate = useCallback((cellId: string, reminder: any) => {
    setClientCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: prev.reminders[cellId]?.map((r: any) => r.id === reminder.id ? reminder : r) || [] }
    }));
  }, []);

  const handleClientCellReminderDelete = useCallback((cellId: string, reminderId: string) => {
    setClientCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: prev.reminders[cellId]?.filter((r: any) => r.id !== reminderId) || [] }
    }));
    toast({ title: 'תזכורת נמחקה' });
  }, [toast]);

  // Client Undo/Redo handlers
  const handleClientUndo = useCallback(() => {
    if (clientHistory.length === 0) return;
    toast({ title: 'בוטל', description: 'הפעולה האחרונה בוטלה' });
  }, [clientHistory, toast]);

  const handleClientRedo = useCallback(() => {
    if (clientFuture.length === 0) return;
    toast({ title: 'שוחזר', description: 'הפעולה שוחזרה' });
  }, [clientFuture, toast]);

  // Client column added handler (for AddColumnDialog)
  const handleClientColumnAdded = useCallback((column: CustomColumn) => {
    addClientCustomColumn(column);
    setIsAddClientColumnDialogOpen(false);
    toast({ title: 'נוסף', description: `העמודה "${column.column_name}" נוספה` });
  }, [addClientCustomColumn, toast]);

  // Employee column added handler (for AddColumnDialog)
  const handleEmployeeColumnAdded = useCallback((column: CustomColumn) => {
    addEmployeeCustomColumn(column);
    setIsAddEmployeeColumnDialogOpen(false);
    toast({ title: 'נוסף', description: `העמודה "${column.column_name}" נוספה` });
  }, [addEmployeeCustomColumn, toast]);

  // Delete column for employees (from DB)
  const handleDeleteEmployeeColumn = useCallback(async (columnId: string) => {
    const { error } = await deleteEmployeeCustomColumn(columnId);
    if (!error) {
      toast({ title: 'נמחק', description: 'העמודה נמחקה' });
    } else {
      toast({ title: 'שגיאה', description: 'לא ניתן למחוק את העמודה', variant: 'destructive' });
    }
  }, [deleteEmployeeCustomColumn, toast]);

  // Client import from file
  const handleClientImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        toast({ title: 'יובא בהצלחה', description: `${lines.length - 1} שורות נקראו מקובץ CSV` });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        toast({ title: 'יובא בהצלחה', description: `${jsonData.length} שורות נקראו מקובץ Excel` });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לייבא את הקובץ', variant: 'destructive' });
    }

    if (clientFileInputRef.current) clientFileInputRef.current.value = '';
  }, [toast]);

  // Delete column for clients (from DB)
  const handleDeleteClientColumn = useCallback(async (columnId: string) => {
    const { error } = await deleteClientCustomColumn(columnId);
    if (!error) {
      toast({ title: 'נמחק', description: 'העמודה נמחקה' });
    } else {
      toast({ title: 'שגיאה', description: 'לא ניתן למחוק את העמודה', variant: 'destructive' });
    }
  }, [deleteClientCustomColumn, toast]);

  // Employee cell formatting handlers
  const handleEmployeeCellStyleChange = useCallback((cellId: string, style: any) => {
    setEmployeeCellFormatting(prev => ({
      ...prev,
      styles: { ...prev.styles, [cellId]: style }
    }));
  }, []);

  const handleEmployeeCellNoteChange = useCallback((cellId: string, note: any) => {
    setEmployeeCellFormatting(prev => ({
      ...prev,
      notes: note ? { ...prev.notes, [cellId]: note } : 
        Object.fromEntries(Object.entries(prev.notes).filter(([k]) => k !== cellId))
    }));
    toast({ title: note ? 'הערה נשמרה' : 'הערה נמחקה' });
  }, [toast]);

  const handleEmployeeCellReminderAdd = useCallback((cellId: string, reminder: any) => {
    const newReminder = { ...reminder, id: `rem-${Date.now()}` };
    setEmployeeCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: [...(prev.reminders[cellId] || []), newReminder] }
    }));
    toast({ title: 'תזכורת נוספה' });
  }, [toast]);

  const handleEmployeeCellReminderUpdate = useCallback((cellId: string, reminder: any) => {
    setEmployeeCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: prev.reminders[cellId]?.map((r: any) => r.id === reminder.id ? reminder : r) || [] }
    }));
  }, []);

  const handleEmployeeCellReminderDelete = useCallback((cellId: string, reminderId: string) => {
    setEmployeeCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: prev.reminders[cellId]?.filter((r: any) => r.id !== reminderId) || [] }
    }));
    toast({ title: 'תזכורת נמחקה' });
  }, [toast]);

  // Employee Undo/Redo handlers
  const handleEmployeeUndo = useCallback(() => {
    if (employeeHistory.length === 0) return;
    toast({ title: 'בוטל', description: 'הפעולה האחרונה בוטלה' });
  }, [employeeHistory, toast]);

  const handleEmployeeRedo = useCallback(() => {
    if (employeeFuture.length === 0) return;
    toast({ title: 'שוחזר', description: 'הפעולה שוחזרה' });
  }, [employeeFuture, toast]);

  // Employee import from file
  const handleEmployeeImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        toast({ title: 'יובא בהצלחה', description: `${lines.length - 1} שורות נקראו מקובץ CSV` });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        toast({ title: 'יובא בהצלחה', description: `${jsonData.length} שורות נקראו מקובץ Excel` });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לייבא את הקובץ', variant: 'destructive' });
    }

    if (employeeFileInputRef.current) employeeFileInputRef.current.value = '';
  }, [toast]);

  // Delete selected employees
  const handleDeleteSelectedEmployees = useCallback(async () => {
    if (selectedEmployees.length === 0) return;
    // Note: deleteEmployee function would need to be added to useEmployeesSync hook
    toast({ 
      title: 'מחיקה', 
      description: `${selectedEmployees.length} עובדים נבחרו למחיקה`,
    });
    setSelectedEmployees([]);
  }, [selectedEmployees, toast]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedProjects.length === 0) return;
    
    for (const project of selectedProjects) {
      await deleteDbProject(project.id);
    }
    setSelectedProjects([]);
  }, [selectedProjects, deleteDbProject]);

  // Project columns with editable fields + drag column + dynamic columns
  const projectColumns: ColumnDef<DemoProject>[] = useMemo(() => {
    const baseColumns: ColumnDef<DemoProject>[] = [
      {
        id: 'drag',
        header: '',
        accessorKey: 'id',
        width: 50,
        cell: (value, row) => (
          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleMoveRow(row.id, 'up'); }}
              className="p-0.5 hover:bg-muted rounded"
              title="העלה"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleMoveRow(row.id, 'down'); }}
              className="p-0.5 hover:bg-muted rounded"
              title="הורד"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>
        ),
      },
      {
        id: 'name',
        header: columnHeaders.name,
        accessorKey: 'name',
        sortable: true,
        filterable: true,
        sticky: 'right',
        width: 180,
        editable: true,
        editType: 'text',
        headerEditable: true,
        onHeaderChange: (val) => handleHeaderChange('name', val),
      },
      {
        id: 'client',
        header: columnHeaders.client,
        accessorKey: 'client',
        sortable: true,
        filterable: true,
        groupable: true,
        editable: true,
        editType: 'select',
        editOptions: clientOptions,
        headerEditable: true,
        onHeaderChange: (val) => handleHeaderChange('client', val),
      },
      {
        id: 'status',
        header: columnHeaders.status,
        accessorKey: 'status',
        sortable: true,
        filterable: true,
        groupable: true,
        cell: (value) => {
          const opt = statusOptions.find(o => o.value === value);
          if (!opt) return <StatusBadge status={value} />;
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: opt.bgColor, color: opt.color }}
            >
              {opt.label}
            </span>
          );
        },
        editable: true,
        editType: 'select',
        editOptions: statusOptions,
        allowAddOptions: true,
        onOptionsChange: setStatusOptions,
        headerEditable: true,
        onHeaderChange: (val) => handleHeaderChange('status', val),
      },
      {
        id: 'priority',
        header: columnHeaders.priority,
        accessorKey: 'priority',
        sortable: true,
        filterable: true,
        cell: (value) => {
          const opt = priorityOptions.find(o => o.value === value);
          if (!opt) return <PriorityBadge priority={value} />;
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: opt.bgColor, color: opt.color }}
            >
              {opt.label}
            </span>
          );
        },
        editable: true,
        editType: 'select',
        editOptions: priorityOptions,
        allowAddOptions: true,
        onOptionsChange: setPriorityOptions,
        headerEditable: true,
        onHeaderChange: (val) => handleHeaderChange('priority', val),
      },
      {
        id: 'category',
        header: columnHeaders.category,
        accessorKey: 'category',
        sortable: true,
        filterable: true,
        groupable: true,
        editable: true,
        editType: 'select',
        editOptions: [
          { value: 'פיתוח', label: 'פיתוח', color: '#2563eb', bgColor: '#dbeafe' },
          { value: 'עיצוב', label: 'עיצוב', color: '#9333ea', bgColor: '#f3e8ff' },
          { value: 'שיווק', label: 'שיווק', color: '#16a34a', bgColor: '#dcfce7' },
          { value: 'ייעוץ', label: 'ייעוץ', color: '#ea580c', bgColor: '#ffedd5' },
          { value: 'תחזוקה', label: 'תחזוקה', color: '#6b7280', bgColor: '#f3f4f6' },
        ],
        headerEditable: true,
        onHeaderChange: (val) => handleHeaderChange('category', val),
      },
      {
        id: 'budget',
        header: columnHeaders.budget,
        accessorKey: 'budget',
        sortable: true,
        align: 'left',
        cell: (value) => `₪${value.toLocaleString()}`,
        summary: 'sum',
        editable: true,
        editType: 'number',
        headerEditable: true,
        onHeaderChange: (val) => handleHeaderChange('budget', val),
      },
      {
        id: 'spent',
        header: columnHeaders.spent,
        accessorKey: 'spent',
        sortable: true,
        align: 'left',
        cell: (value) => `₪${value.toLocaleString()}`,
        summary: 'sum',
        editable: true,
        editType: 'number',
      },
      {
        id: 'progress',
        header: 'התקדמות',
        accessorKey: 'progress',
        sortable: true,
        cell: (value) => <ProgressBar value={value} />,
        summary: 'avg',
        width: 180,
        editable: true,
        editType: 'number',
      },
      {
        id: 'rating',
        header: 'דירוג',
        accessorKey: 'rating',
        sortable: true,
        cell: (value) => <RatingStars rating={value} />,
        summary: 'avg',
        editable: true,
        editType: 'number',
      },
      {
        id: 'startDate',
        header: 'תאריך התחלה',
        accessorKey: 'startDate',
        sortable: true,
        cell: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: he }),
        editable: true,
        editType: 'date',
      },
      {
        id: 'team',
        header: 'צוות',
        accessorKey: 'team',
        cell: (value: string[]) => (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 2).map((member) => (
              <Badge key={member} variant="secondary" className="text-xs">
                {member}
              </Badge>
            ))}
            {value.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{value.length - 2}
              </Badge>
            )}
          </div>
        ),
      },
    ];

    // Add dynamic columns from DB (projectCustomColumns)
    const dynamicCols: ColumnDef<DemoProject>[] = projectCustomColumns.map(col => {
      // Determine editType based on column_type
      let editType: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'enhanced-select' = 'text';
      let editOptions: any[] | undefined = undefined;
      
      if (col.column_type === 'number') {
        editType = 'number';
      } else if (col.column_type === 'date') {
        editType = 'date';
      } else if (col.column_type === 'boolean') {
        editType = 'checkbox';
      } else if (col.column_type === 'select') {
        editType = 'enhanced-select';
        editOptions = (col.column_options || []).map((opt: string) => ({
          value: opt,
          label: opt,
          color: '#6b7280',
          bgColor: '#f3f4f6',
        }));
      } else if (col.column_type === 'data_type') {
        editType = 'enhanced-select';
        editOptions = (projectDataTypeOptions[col.column_key] || []).map((opt: any) => ({
          value: opt.value,
          label: opt.label,
          color: opt.color || '#1e3a5f',
          bgColor: opt.color ? `${opt.color}20` : '#f0f4f8',
        }));
      }

      return {
        id: col.column_key,
        header: (
          <div className="flex items-center gap-1.5">
            <span>{col.column_name}</span>
            <ColumnOptionsMenu
              columnName={col.column_name}
              columnId={col.id || ''}
              onDelete={handleDeleteProjectColumn}
            />
          </div>
        ),
        accessorKey: `custom_data.${col.column_key}`,
        sortable: true,
        filterable: true,
        editable: true,
        editType,
        editOptions,
        cell: (value: any, row: DemoProject) => {
          const customValue = row.custom_data?.[col.column_key];
          if (customValue == null || customValue === '') return null;
          
          if (col.column_type === 'boolean') {
            return customValue ? '✓' : '✗';
          }
          
          // For data_type and select columns, show as colored badge
          if (col.column_type === 'data_type' || col.column_type === 'select') {
            const options = editOptions || [];
            const option = options.find((o: any) => o.value === customValue);
            if (option) {
              return (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 w-fit px-2 py-0.5"
                  style={{
                    borderColor: option.color,
                    backgroundColor: option.bgColor || `${option.color}15`,
                    color: option.color,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </Badge>
              );
            }
          }
          
          return customValue;
        },
      };
    });

    return [...baseColumns, ...dynamicCols];
  }, [projectCustomColumns, projectDataTypeOptions, handleMoveRow, handleDeleteProjectColumn]);

  // Employee columns with editable fields - connected to DB
  const employeeColumns: ColumnDef<SyncedEmployee>[] = useMemo(() => [
    {
      id: 'full_name',
      header: 'שם מלא',
      accessorKey: 'full_name',
      sortable: true,
      filterable: true,
      sticky: 'right',
      width: 180,
      editable: isManager || isAdmin,
      editType: 'text',
      cell: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {value?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-medium">{value || 'ללא שם'}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'אימייל',
      accessorKey: 'email',
      sortable: true,
      filterable: true,
      editable: false, // Email is read-only (from auth)
      cell: (value) => value ? (
        <span dir="ltr" className="text-primary">{value}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      id: 'phone',
      header: 'טלפון',
      accessorKey: 'phone',
      sortable: true,
      filterable: true,
      editable: isManager || isAdmin,
      editType: 'text',
      cell: (value) => {
        const phone = value ? String(value) : '-';
        return phone !== '-' ? (
          <span dir="ltr" className="font-mono">{phone}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: 'department',
      header: 'מחלקה',
      accessorKey: 'department',
      sortable: true,
      filterable: true,
      groupable: true,
      editable: isManager || isAdmin,
      editType: 'select',
      editOptions: [
        { value: 'פיתוח', label: 'פיתוח' },
        { value: 'עיצוב', label: 'עיצוב' },
        { value: 'שיווק', label: 'שיווק' },
        { value: 'מכירות', label: 'מכירות' },
        { value: 'HR', label: 'HR' },
        { value: 'כספים', label: 'כספים' },
        { value: 'תפעול', label: 'תפעול' },
        { value: 'הנהלה', label: 'הנהלה' },
      ],
      cell: (value) => value || <span className="text-muted-foreground">-</span>,
    },
    {
      id: 'position',
      header: 'תפקיד',
      accessorKey: 'position',
      sortable: true,
      filterable: true,
      editable: isManager || isAdmin,
      editType: 'text',
      cell: (value) => value || <span className="text-muted-foreground">-</span>,
    },
    {
      id: 'role',
      header: 'הרשאה',
      accessorKey: 'role',
      sortable: true,
      filterable: true,
      editable: isAdmin, // Only admin can change roles
      editType: 'select',
      editOptions: [
        { value: 'employee', label: 'עובד' },
        { value: 'manager', label: 'מנהל' },
        { value: 'admin', label: 'מנהל ראשי' },
      ],
      cell: (value) => <RoleBadge role={value} />,
    },
    {
      id: 'hourly_rate',
      header: 'תעריף שעתי',
      accessorKey: 'hourly_rate',
      sortable: true,
      align: 'left',
      cell: (value) => `₪${(value || 0).toLocaleString()}`,
      summary: 'avg',
      editable: isAdmin, // Only admin can change hourly rate
      editType: 'number',
    },
    {
      id: 'is_active',
      header: 'סטטוס',
      accessorKey: 'is_active',
      sortable: true,
      filterable: true,
      cell: (value) => <StatusBadge status={value ? 'active' : 'inactive'} />,
      editable: isManager || isAdmin,
      editType: 'select',
      editOptions: [
        { value: 'true', label: 'פעיל' },
        { value: 'false', label: 'לא פעיל' },
      ],
    },
    {
      id: 'hoursThisWeek',
      header: 'שעות השבוע',
      accessorKey: 'hoursThisWeek',
      sortable: true,
      align: 'left',
      summary: 'sum',
      cell: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={value > 40 ? 'text-amber-600 font-medium' : ''}>{value}h</span>
        </div>
      ),
    },
    {
      id: 'hoursThisMonth',
      header: 'שעות החודש',
      accessorKey: 'hoursThisMonth',
      sortable: true,
      align: 'left',
      summary: 'sum',
      cell: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}h</span>
        </div>
      ),
    },
    {
      id: 'billableHoursThisMonth',
      header: 'שעות לחיוב',
      accessorKey: 'billableHoursThisMonth',
      sortable: true,
      align: 'left',
      summary: 'sum',
      cell: (value, row) => {
        const percentage = row.hoursThisMonth > 0 
          ? Math.round((value / row.hoursThisMonth) * 100) 
          : 0;
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">{value}h</span>
            <span className="text-xs text-muted-foreground">({percentage}%)</span>
          </div>
        );
      },
    },
    {
      id: 'created_at',
      header: 'תאריך הצטרפות',
      accessorKey: 'created_at',
      sortable: true,
      cell: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: he }),
    },
  ], [isManager, isAdmin]);

  // Client columns with editable fields + dynamic columns
  const clientColumns: ColumnDef<SyncedClient>[] = useMemo(() => {
    const baseColumns: ColumnDef<SyncedClient>[] = [
      {
        id: 'name',
        header: clientColumnHeaders['name'] || 'שם לקוח',
        accessorKey: 'name',
        sortable: true,
        filterable: true,
        sticky: 'right',
        width: 200,
        editable: false, // Navigation column - not editable directly, edit via pencil button
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('name', val),
        deletable: false, // Name column cannot be deleted
        cell: (value, row) => (
          <div className="flex items-center gap-2 group">
            <ClientNameWithCategory
              clientName={value}
              clientId={row.id}
              categoryId={row.category_id}
              categories={categories}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                openEditDialog(row);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
              title="עריכת שם"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ),
      },
      {
        id: 'company',
        header: clientColumnHeaders['company'] || 'חברה',
        accessorKey: 'company',
        sortable: true,
        filterable: true,
        width: 150,
        editable: true,
        editType: 'text',
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('company', val),
      },
      {
        id: 'email',
        header: clientColumnHeaders['email'] || 'אימייל',
        accessorKey: 'email',
        sortable: true,
        filterable: true,
        width: 200,
        editable: true,
        editType: 'text',
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('email', val),
        cell: (value) => value ? (
          <span dir="ltr" className="text-primary">{value}</span>
        ) : null,
      },
      {
        id: 'phone',
        header: clientColumnHeaders['phone'] || 'טלפון',
        accessorKey: 'phone',
        sortable: true,
        filterable: true,
        width: 140,
        editable: true,
        editType: 'text',
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('phone', val),
        cell: (value) => value ? (
          <span dir="ltr">{value}</span>
        ) : null,
      },
      {
        id: 'status',
        header: clientColumnHeaders['status'] || 'סטטוס',
        accessorKey: 'status',
        sortable: true,
        filterable: true,
        width: 100,
        groupable: true,
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('status', val),
        cell: (value) => {
          const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
            active: { label: 'פעיל', color: '#16a34a', bgColor: '#dcfce7' },
            inactive: { label: 'לא פעיל', color: '#6b7280', bgColor: '#f3f4f6' },
            pending: { label: 'ממתין', color: '#ca8a04', bgColor: '#fef9c3' },
          };
          const config = statusConfig[value] || statusConfig.active;
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: config.bgColor, color: config.color }}
            >
              {config.label}
            </span>
          );
        },
        editable: true,
        editType: 'select',
        editOptions: [
          { value: 'active', label: 'פעיל', color: '#16a34a', bgColor: '#dcfce7' },
          { value: 'inactive', label: 'לא פעיל', color: '#6b7280', bgColor: '#f3f4f6' },
          { value: 'pending', label: 'ממתין', color: '#ca8a04', bgColor: '#fef9c3' },
        ],
      },
      // Current Stage column - shows client's current progress stage
      {
        id: 'current_stage',
        header: clientColumnHeaders['current_stage'] || 'שלב נוכחי',
        accessorKey: 'id', // We use id to lookup in clientStagesMap
        sortable: true,
        filterable: true,
        groupable: true,
        width: 180,
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('current_stage', val),
        cell: (value, row) => {
          const stageInfo = getClientStageInfo(row.id);
          if (!stageInfo || !stageInfo.current_stage_name) {
            return (
              <span className="text-muted-foreground text-xs italic">
                ללא שלבים
              </span>
            );
          }
          
          const progress = stageInfo.total_tasks > 0 
            ? Math.round((stageInfo.completed_tasks / stageInfo.total_tasks) * 100)
            : 0;
          
          return (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{stageInfo.current_stage_name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{stageInfo.completed_tasks}/{stageInfo.total_tasks} משימות</span>
                  {stageInfo.total_tasks > 0 && (
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        },
        // Make it editable via dropdown
        editable: true,
        editType: 'select',
        editOptions: availableStages.map(s => ({
          value: s.stage_name,
          label: s.stage_name,
        })),
      },
      // Consultants column - shows client's assigned consultants with bi-directional sync
      {
        id: 'consultants',
        header: clientColumnHeaders['consultants'] || 'יועצים',
        accessorKey: 'id', // We use id to lookup in clientConsultantsMap
        sortable: true,
        filterable: true,
        groupable: true,
        width: 180,
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('consultants', val),
        cell: (value, row) => {
          const consultantsInfo = getClientConsultantsInfo(row.id);
          if (!consultantsInfo || consultantsInfo.consultant_names.length === 0) {
            return (
              <span className="text-muted-foreground text-xs italic">
                ללא יועצים
              </span>
            );
          }
          
          return (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {consultantsInfo.primary_consultant_name}
                </div>
                {consultantsInfo.consultant_names.length > 1 && (
                  <div className="text-xs text-muted-foreground">
                    +{consultantsInfo.consultant_names.length - 1} נוספים
                  </div>
                )}
              </div>
            </div>
          );
        },
        // Make it editable via dropdown
        editable: true,
        editType: 'select',
        editOptions: availableConsultants.map(c => ({
          value: c.name,
          label: `${c.name}${c.profession ? ` (${c.profession})` : ''}`,
        })),
      },
      {
        id: 'address',
        header: clientColumnHeaders['address'] || 'כתובת',
        accessorKey: 'address',
        sortable: true,
        filterable: true,
        width: 160,
        editable: true,
        editType: 'text',
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('address', val),
        cell: (value) => value || null,
      },
      {
        id: 'notes',
        header: clientColumnHeaders['notes'] || 'הערות',
        accessorKey: 'notes',
        sortable: false,
        width: 180,
        editable: true,
        editType: 'text',
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('notes', val),
        cell: (value) => value ? (
          <span className="max-w-[200px] truncate block" title={value}>{value}</span>
        ) : null,
      },
      {
        id: 'created_at',
        header: clientColumnHeaders['created_at'] || 'תאריך הוספה',
        accessorKey: 'created_at',
        sortable: true,
        width: 120,
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('created_at', val),
        cell: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: he }),
      },
      {
        id: 'actions',
        header: clientColumnHeaders['actions'] || 'פעולות',
        accessorKey: 'id',
        width: 100,
        headerEditable: true,
        onHeaderChange: (val) => handleClientHeaderChange('actions', val),
        deletable: false, // Actions column cannot be deleted
        cell: (value, row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/client-profile/${row.id}`);
            }}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            פרופיל
          </Button>
        ),
      },
    ];

    // Filter out hidden columns
    const visibleBaseColumns = baseColumns.filter(col => !hiddenClientColumns.has(col.id));

    // Add dynamic columns from DB (clientCustomColumns)
    const dynamicCols: ColumnDef<SyncedClient>[] = clientCustomColumns.map(col => {
      // Determine editType based on column_type
      let editType: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'enhanced-select' = 'text';
      let editOptions: any[] | undefined = undefined;
      
      if (col.column_type === 'number') {
        editType = 'number';
      } else if (col.column_type === 'date') {
        editType = 'date';
      } else if (col.column_type === 'boolean') {
        editType = 'checkbox';
      } else if (col.column_type === 'select') {
        editType = 'enhanced-select';
        editOptions = (col.column_options || []).map((opt: string) => ({
          value: opt,
          label: opt,
          color: '#6b7280',
          bgColor: '#f3f4f6',
        }));
      } else if (col.column_type === 'data_type') {
        editType = 'enhanced-select';
        // Get options from clientDataTypeOptions
        editOptions = (clientDataTypeOptions[col.column_key] || []).map((opt: any) => ({
          value: opt.value,
          label: opt.label,
          color: opt.color || '#1e3a5f',
          bgColor: opt.color ? `${opt.color}20` : '#f0f4f8',
        }));
      }

      return {
        id: col.column_key,
        header: (
          <div className="flex items-center gap-1.5">
            <span>{col.column_name}</span>
            <ColumnOptionsMenu
              columnName={col.column_name}
              columnId={col.id || ''}
              onDelete={handleDeleteClientColumn}
            />
          </div>
        ),
        accessorKey: `custom_data.${col.column_key}`,
        sortable: true,
        filterable: true,
        editable: true,
        editType,
        editOptions,
        cell: (value, row) => {
          const customValue = row.custom_data?.[col.column_key];
          if (customValue == null || customValue === '') return null;
          
          if (col.column_type === 'boolean') {
            return customValue ? '✓' : '✗';
          }
          
          // For data_type and select columns, show as colored badge
          if (col.column_type === 'data_type' || col.column_type === 'select') {
            const options = editOptions || [];
            const option = options.find((o: any) => o.value === customValue);
            if (option) {
              return (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 w-fit px-2 py-0.5"
                  style={{
                    borderColor: option.color,
                    backgroundColor: option.bgColor || `${option.color}15`,
                    color: option.color,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </Badge>
              );
            }
          }
          
          return customValue;
        },
      };
    });

    const result = [...visibleBaseColumns, ...dynamicCols];
    
    return result;
  }, [navigate, clientCustomColumns, handleDeleteClientColumn, clientColumnHeaders, hiddenClientColumns, handleClientHeaderChange, handleHideClientColumn, getClientStageInfo, availableStages]);

  // Employee columns with editable fields + dynamic columns from DB
  const employeeColumnsWithDynamic: ColumnDef<SyncedEmployee>[] = useMemo(() => {
    // Add dynamic columns from DB (employeeCustomColumns)
    const dynamicCols: ColumnDef<SyncedEmployee>[] = employeeCustomColumns.map(col => {
      // Determine editType based on column_type
      let editType: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'enhanced-select' = 'text';
      let editOptions: any[] | undefined = undefined;
      
      if (col.column_type === 'number') {
        editType = 'number';
      } else if (col.column_type === 'date') {
        editType = 'date';
      } else if (col.column_type === 'boolean') {
        editType = 'checkbox';
      } else if (col.column_type === 'select') {
        editType = 'enhanced-select';
        editOptions = (col.column_options || []).map((opt: string) => ({
          value: opt,
          label: opt,
          color: '#6b7280',
          bgColor: '#f3f4f6',
        }));
      } else if (col.column_type === 'data_type') {
        editType = 'enhanced-select';
        editOptions = (employeeDataTypeOptions[col.column_key] || []).map((opt: any) => ({
          value: opt.value,
          label: opt.label,
          color: opt.color || '#1e3a5f',
          bgColor: opt.color ? `${opt.color}20` : '#f0f4f8',
        }));
      }

      return {
        id: col.column_key,
        header: (
          <div className="flex items-center gap-1.5">
            <span>{col.column_name}</span>
            <ColumnOptionsMenu
              columnName={col.column_name}
              columnId={col.id || ''}
              onDelete={handleDeleteEmployeeColumn}
            />
          </div>
        ),
        accessorKey: `custom_data.${col.column_key}`,
        sortable: true,
        filterable: true,
        editable: isManager || isAdmin,
        editType,
        editOptions,
        cell: (value: any, row: SyncedEmployee) => {
          const customValue = (row as any).custom_data?.[col.column_key];
          if (customValue == null || customValue === '') return null;
          
          if (col.column_type === 'boolean') {
            return customValue ? '✓' : '✗';
          }
          
          // For data_type and select columns, show as colored badge
          if (col.column_type === 'data_type' || col.column_type === 'select') {
            const options = editOptions || [];
            const option = options.find((o: any) => o.value === customValue);
            if (option) {
              return (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 w-fit px-2 py-0.5"
                  style={{
                    borderColor: option.color,
                    backgroundColor: option.bgColor || `${option.color}15`,
                    color: option.color,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </Badge>
              );
            }
          }
          
          return customValue;
        },
      };
    });

    return [...employeeColumns, ...dynamicCols];
  }, [employeeColumns, employeeCustomColumns, employeeDataTypeOptions, handleDeleteEmployeeColumn, isManager, isAdmin]);

  // Expanded content for clients
  const clientExpandedContent = useCallback((row: SyncedClient) => (
    <div className="grid grid-cols-3 gap-4 p-4 bg-card rounded-lg">
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" />
          פרטי לקוח
        </h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">מזהה:</dt>
            <dd>{row.id.slice(0, 8)}...</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">חברה:</dt>
            <dd>{row.company || '-'}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          פרטי קשר
        </h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">אימייל:</dt>
            <dd>{row.email || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">טלפון:</dt>
            <dd dir="ltr" className="font-mono">{row.phone || '-'}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          מידע נוסף
        </h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">כתובת:</dt>
            <dd>{row.address || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">תאריך הוספה:</dt>
            <dd>{format(new Date(row.created_at), 'dd/MM/yyyy', { locale: he })}</dd>
          </div>
        </dl>
      </div>
    </div>
  ), []);

  // Expanded content for employees
  const employeeExpandedContent = useCallback((row: SyncedEmployee) => (
    <div className="grid grid-cols-3 gap-4 p-4 bg-card rounded-lg">
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" />
          פרטי עובד
        </h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">מזהה:</dt>
            <dd>{row.id.slice(0, 8)}...</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">מחלקה:</dt>
            <dd>{row.department || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">תפקיד:</dt>
            <dd>{row.position || '-'}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          נתונים כספיים
        </h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">תעריף שעתי:</dt>
            <dd>₪{(row.hourly_rate || 0).toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">שעות החודש:</dt>
            <dd>{row.hoursThisMonth}h</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">שעות לחיוב:</dt>
            <dd className="text-green-600">{row.billableHoursThisMonth}h</dd>
          </div>
        </dl>
      </div>
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          סטטיסטיקות
        </h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">שעות השבוע:</dt>
            <dd>{row.hoursThisWeek}h</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">תאריך הצטרפות:</dt>
            <dd>{format(new Date(row.created_at), 'dd/MM/yyyy', { locale: he })}</dd>
          </div>
        </dl>
      </div>
    </div>
  ), []);

  // Save preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לפריסט',
        variant: 'destructive',
      });
      return;
    }

    const newPreset: Preset = {
      id: crypto.randomUUID(),
      name: presetName,
      filters: currentFilters,
      sorts: currentSorts,
      hiddenColumns: [],
      columnOrder: [],
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));

    toast({
      title: 'פריסט נשמר',
      description: `הפריסט "${presetName}" נשמר בהצלחה`,
    });

    setPresetName('');
    setIsPresetDialogOpen(false);
  }, [presetName, currentFilters, currentSorts, presets, toast]);

  // Delete preset
  const handleDeletePreset = useCallback((id: string) => {
    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));

    toast({
      title: 'פריסט נמחק',
    });
  }, [presets, toast]);

  // Expanded content for projects
  const projectExpandedContent = useCallback((row: DemoProject) => (
    <div className="grid grid-cols-3 gap-4 p-4 bg-card rounded-lg">
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" />
          פרטי פרויקט
        </h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">מזהה:</dt>
            <dd>{row.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">קטגוריה:</dt>
            <dd>{row.category}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          תקציב
        </h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">תקציב:</dt>
            <dd>₪{row.budget.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">הוצאות:</dt>
            <dd>₪{row.spent.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">יתרה:</dt>
            <dd className={row.budget - row.spent < 0 ? 'text-red-500' : 'text-green-500'}>
              ₪{(row.budget - row.spent).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          צוות ({row.team.length})
        </h4>
        <div className="flex flex-wrap gap-1">
          {row.team.map((member) => (
            <Badge key={member} variant="secondary">
              {member}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  ), []);

  // Combined client data filtering: filter panel + categories
  const displayClients = useMemo(() => {
    let clients = filteredClients ?? dbClients;
    
    // Apply category filter if any selected
    if (selectedCategoryIds.length > 0) {
      clients = clients.filter(client => 
        client.category_id && selectedCategoryIds.includes(client.category_id)
      );
    }
    
    return clients;
  }, [filteredClients, dbClients, selectedCategoryIds]);

  // Calculate client count per category for sidebar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const sourceClients = filteredClients || dbClients;
    sourceClients.forEach(client => {
      if (client.category_id) {
        counts[client.category_id] = (counts[client.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [filteredClients, dbClients]);

  return (
    <AppLayout title="DataTable Pro">
      <div className="p-6 space-y-6 animate-fade-in w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Table className="h-8 w-8 text-secondary" />
              DataTable Pro
            </h1>
            <p className="text-muted-foreground mt-1">
              טבלה מתקדמת עם כל התכונות המובנות
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Navigation to Clients Gallery */}
            <Button 
              variant="outline" 
              onClick={() => navigate('/clients')}
              className="border-[hsl(45,70%,45%)] text-[hsl(45,70%,45%)] hover:bg-[hsl(45,70%,45%)] hover:text-[hsl(222,47%,15%)] transition-all"
            >
              <LayoutGrid className="h-4 w-4 ml-2" />
              גלריה
            </Button>

            {/* Preset management */}
            <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Save className="h-4 w-4 ml-2" />
                  שמור פריסט
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>שמירת פריסט</DialogTitle>
                  <DialogDescription>
                    שמור את הגדרות הסינון והמיון הנוכחיות לשימוש עתידי
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="presetName">שם הפריסט</Label>
                  <Input
                    id="presetName"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="לדוגמה: פרויקטים פעילים בעדיפות גבוהה"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPresetDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleSavePreset}>
                    <Save className="h-4 w-4 ml-2" />
                    שמור
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Saved Presets */}
        {presets.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                פריסטים שמורים
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Badge
                    key={preset.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 gap-2 py-1.5"
                  >
                    {preset.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePreset(preset.id);
                      }}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for different demos */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center gap-2">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                לקוחות
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                פרויקטים
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                עובדים
              </TabsTrigger>
              
              {/* Custom Tables */}
              {customTables.map((table) => {
                const IconComponent = {
                  Table,
                  FileSpreadsheet,
                  Users,
                  FolderKanban,
                  Package,
                  Briefcase,
                  Building,
                  Car,
                  ShoppingCart,
                  Wallet,
                  FileText,
                  Calendar,
                  Clock,
                  Star,
                  Heart,
                }[table.icon] || Table;
                
                return (
                  <TabsTrigger
                    key={table.id}
                    value={`custom_${table.id}`}
                    className="flex items-center gap-2"
                  >
                    <IconComponent className="h-4 w-4" />
                    {table.display_name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Manage Tables Button */}
            {canManageCustomTables && customTables.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setIsManageTablesDialogOpen(true)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ניהול טבלאות</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Add Table Button */}
            {canManageCustomTables && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 border-dashed border-primary/50 hover:border-primary hover:bg-primary/10"
                      onClick={() => setIsCreateTableDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>הוסף טבלה חדשה</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Table Style Settings */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <TableStyleSettings
                      config={tableStyleConfig}
                      onChange={updateTableStyleConfig}
                      onReset={resetTableStyleConfig}
                      trigger={
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          title="עיצוב טבלה"
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>עיצוב טבלה</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Create Table Dialog */}
          <CreateTableDialog
            open={isCreateTableDialogOpen}
            onOpenChange={setIsCreateTableDialogOpen}
            onSuccess={() => {
              refreshCustomTables();
            }}
          />

          {/* Manage Tables Dialog */}
          <ManageTablesDialog
            open={isManageTablesDialogOpen}
            onOpenChange={setIsManageTablesDialogOpen}
            tables={customTables}
            onUpdateTable={updateCustomTable}
            onDeleteTable={deleteCustomTable}
            onDuplicateTable={duplicateCustomTable}
            onSelectTable={setActiveTab}
          />

          {/* Clients Tab */}
          <TabsContent value="clients" className="mt-6">
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-secondary" />
                      טבלת לקוחות
                      <Badge variant="outline" className="text-xs gap-1 mr-2">
                        <Database className="h-3 w-3" />
                        מחובר למסד נתונים
                      </Badge>
                      {isSyncing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>
                      {displayClients.length} לקוחות
                      {selectedClients.length > 0 && (
                        <span className="text-primary font-semibold"> | {selectedClients.length} נבחרו</span>
                      )}
                      {' | לחץ על תא כדי לערוך | שינויים נשמרים אוטומטית'}
                      {selectedClients.length === 0 && displayClients.length > 0 && (
                        <span className="text-muted-foreground"> | ✓ סמן לקוחות בעמודת הבחירה</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Refresh button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshData()}
                      disabled={dbLoading}
                      title="רענן נתונים"
                    >
                      <RefreshCw className={`h-4 w-4 ${dbLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  
                    {/* Import buttons */}
                    <div className="flex items-center gap-1 border-l pl-2">
                      <input
                        ref={clientFileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleClientImportFile}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clientFileInputRef.current?.click()}
                      title="ייבא מקובץ"
                    >
                      <Upload className="h-4 w-4 ml-1" />
                      ייבוא
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectGoogleSheets}
                      title="חבר ל-Google Sheets"
                    >
                      <FileSpreadsheet className="h-4 w-4 ml-1" />
                      Sheets
                    </Button>
                  </div>
                  
                  {/* Undo/Redo buttons */}
                  <div className="flex items-center gap-1 border-l pl-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClientUndo}
                      disabled={clientHistory.length === 0}
                      title="בטל (Undo)"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClientRedo}
                      disabled={clientFuture.length === 0}
                      title="חזור (Redo)"
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bulk Actions - Always visible section */}
                  {selectedClients.length > 0 ? (
                    <div className="flex items-center gap-2 border-r pr-2 bg-primary/5 rounded-lg px-3 py-1">
                      <Badge variant="default" className="bg-primary text-white text-sm px-3 py-1">
                        ✓ {selectedClients.length} נבחרו
                      </Badge>
                      {/* Bulk Set Stage Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-primary bg-white hover:bg-primary/5"
                          >
                            <Layers className="h-4 w-4 ml-2 text-primary" />
                            קבע שלב ({selectedClients.length})
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                          <DropdownMenuLabel>בחר שלב עבור {selectedClients.length} לקוחות</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {availableStages.length > 0 ? (
                            availableStages.map((stage) => (
                              <DropdownMenuItem
                                key={stage.stage_id}
                                onClick={() => handleBulkSetStage(stage.stage_name)}
                                className="flex items-center gap-2"
                              >
                                <Layers className="h-4 w-4 text-primary" />
                                {stage.stage_name}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>
                              אין שלבים זמינים
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Bulk Assign Consultant Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsBulkConsultantOpen(true)}
                        className="border-primary bg-white hover:bg-primary/5"
                      >
                        <UserCog className="h-4 w-4 ml-2 text-primary" />
                        שייך יועץ ({selectedClients.length})
                      </Button>
                      
                      {/* Delete Button */}
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleDeleteSelectedClients}
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        מחק ({selectedClients.length})
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 border-r pr-2">
                      <span className="text-xs text-muted-foreground">
                        ← סמן לקוחות בצ'קבוקס לפעולות מרובות
                      </span>
                    </div>
                  )}
                  
                  {/* Add Client Column Button and Dialog */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddClientColumnDialogOpen(true)}
                    className="border-[#D4AF37] bg-white hover:bg-[#1e3a8a]/5 hover:border-[#D4AF37]/80 transition-all shadow-sm"
                  >
                    <Columns className="h-4 w-4 ml-2 text-[#D4AF37]" />
                    <span className="text-[#1e3a8a] font-medium">הוסף עמודה</span>
                  </Button>
                  
                  {/* Restore Hidden Columns Button */}
                  {hiddenClientColumns.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-orange-400 bg-white hover:bg-orange-50 transition-all shadow-sm"
                        >
                          <Eye className="h-4 w-4 ml-2 text-orange-500" />
                          <span className="text-orange-700 font-medium">עמודות מוסתרות ({hiddenClientColumns.size})</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>שחזר עמודות מוסתרות</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Array.from(hiddenClientColumns).map((columnId) => (
                          <DropdownMenuItem
                            key={columnId}
                            onClick={() => handleShowClientColumn(columnId)}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            {clientColumnHeaders[columnId] || columnId}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setHiddenClientColumns(new Set())}
                          className="text-blue-600"
                        >
                          <RefreshCw className="h-4 w-4 ml-2" />
                          הצג את כל העמודות
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  <AddColumnDialog
                    open={isAddClientColumnDialogOpen}
                    onOpenChange={setIsAddClientColumnDialogOpen}
                    tableName="clients"
                    onColumnAdded={handleClientColumnAdded}
                    existingColumns={clientCustomColumns}
                  />
                  
                  {/* Add Client Sheet */}
                  <Sheet open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
                    <SheetTrigger asChild>
                      <Button variant="default" size="sm">
                        <Plus className="h-4 w-4 ml-2" />
                        הוסף לקוח
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="sm:max-w-xl" dir="rtl">
                      <SheetHeader>
                        <SheetTitle>הוספת לקוח חדש</SheetTitle>
                        <SheetDescription>
                          הזן את פרטי הלקוח החדש
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="newClientName">שם לקוח *</Label>
                          <Input
                            id="newClientName"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="הזן שם לקוח"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newClientCompany">חברה</Label>
                          <Input
                            id="newClientCompany"
                            value={newClientCompany}
                            onChange={(e) => setNewClientCompany(e.target.value)}
                            placeholder="הזן שם חברה"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newClientEmail">אימייל</Label>
                          <Input
                            id="newClientEmail"
                            type="email"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="mt-2"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newClientPhone">טלפון</Label>
                          <Input
                            id="newClientPhone"
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                            placeholder="050-0000000"
                            className="mt-2"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <SheetFooter>
                        <Button variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>
                          ביטול
                        </Button>
                        <Button onClick={handleAddClient}>
                          <Plus className="h-4 w-4 ml-2" />
                          הוסף
                        </Button>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                  </div>
                </div>
                
                {/* Client Filter Panel */}
                <div className="border-t pt-4 flex items-center gap-3 flex-wrap">
                  {/* Categories Toggle Button */}
                  {categories.length > 0 && (
                    <Button
                      variant={showCategories ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowCategories(!showCategories)}
                      className={showCategories 
                        ? 'bg-[#d4a843] hover:bg-[#c49a33] text-white border-[#d4a843]' 
                        : 'border-[#d4a843]/50 hover:border-[#d4a843] hover:bg-[#fef9ee]'}
                    >
                      <FolderOpen className="h-4 w-4 ml-1.5" />
                      קטגוריות
                      {showCategories ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
                      {selectedCategoryIds.length > 0 && (
                        <Badge variant="secondary" className="mr-1 text-xs px-1.5 py-0 h-5 bg-white/20 text-current">
                          {selectedCategoryIds.length}
                        </Badge>
                      )}
                    </Button>
                  )}
                  <ClientFilterPanel
                    consultants={consultants}
                    activeFilters={clientFilter}
                    onFilterChange={async (filter) => {
                      setClientFilter(filter);
                      if (Object.keys(filter).some(k => filter[k as keyof ClientFilter])) {
                        const filtered = await filterClients(filter);
                        setFilteredClients(filtered as SyncedClient[]);
                      } else {
                        setFilteredClients(null);
                      }
                    }}
                    onClear={() => {
                      setClientFilter({});
                      setFilteredClients(null);
                    }}
                    totalClients={dbClients.length}
                    filteredCount={displayClients.length}
                  />
                </div>
              </CardHeader>
              
              {/* Collapsible Categories Panel - inside the card */}
              {showCategories && categories.length > 0 && (
                <div className="border-t border-b bg-muted/30 px-4 py-3" dir="rtl">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedCategoryIds.length > 0 && (
                      <button
                        onClick={() => setSelectedCategoryIds([])}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded hover:bg-destructive/10 transition-colors"
                      >
                        ✕ נקה
                      </button>
                    )}
                    {categories.map((category) => {
                      const isSelected = selectedCategoryIds.includes(category.id);
                      const count = categoryCounts[category.id] || 0;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                            } else {
                              setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                            isSelected 
                              ? 'bg-[#d4a843] text-white border-[#d4a843] shadow-sm' 
                              : 'bg-white text-slate-700 border-slate-200 hover:border-[#d4a843] hover:bg-[#fef9ee]'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: isSelected ? '#fff' : category.color, opacity: isSelected ? 0.9 : 1 }}
                          />
                          {category.name}
                          {count > 0 && (
                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                              ({count})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <CardContent className="p-0">
                {dbLoading && localClients.length === 0 ? (
                  <div className="p-8 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <UniversalDataTable
                    tableName="clients"
                    data={displayClients}
                    columns={clientColumns}
                    variant="gold"
                    selectable
                    filterable
                    globalSearch
                    exportable
                    showSummary
                    onCellEdit={handleClientCellEdit}
                    onSelectionChange={handleClientSelectionChange}
                    loading={isSyncing}
                    tableStyleConfig={tableStyleConfig}
                    onTableStyleChange={updateTableStyleConfig}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-secondary" />
                    טבלת פרויקטים
                    <Badge variant="outline" className="text-xs gap-1 mr-2">
                      <Database className="h-3 w-3" />
                      מחובר למסד נתונים
                    </Badge>
                    {isSyncing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </CardTitle>
                  <CardDescription>
                    {localProjects.length} פרויקטים | לחץ על תא כדי לערוך | שינויים נשמרים אוטומטית
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Refresh button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshData()}
                    disabled={dbLoading}
                    title="רענן נתונים"
                  >
                    <RefreshCw className={`h-4 w-4 ${dbLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  {/* Import buttons */}
                  <div className="flex items-center gap-1 border-l pl-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      title="ייבא מקובץ"
                    >
                      <Upload className="h-4 w-4 ml-1" />
                      ייבוא
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectGoogleSheets}
                      title="חבר ל-Google Sheets"
                    >
                      <FileSpreadsheet className="h-4 w-4 ml-1" />
                      Sheets
                    </Button>
                  </div>

                  {/* Undo/Redo buttons */}
                  <div className="flex items-center gap-1 border-l pl-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUndo}
                      disabled={projectHistory.length === 0}
                      title="בטל (Undo)"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRedo}
                      disabled={projectFuture.length === 0}
                      title="חזור (Redo)"
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedProjects.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק ({selectedProjects.length})
                    </Button>
                  )}
                  {/* Add Project Column Button and Dialog */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddColumnDialogOpen(true)}
                    className="border-[#D4AF37] bg-white hover:bg-[#1e3a8a]/5 hover:border-[#D4AF37]/80 transition-all shadow-sm"
                  >
                    <Columns className="h-4 w-4 ml-2 text-[#D4AF37]" />
                    <span className="text-[#1e3a8a] font-medium">הוסף עמודה</span>
                  </Button>
                  
                  <AddColumnDialog
                    open={isAddColumnDialogOpen}
                    onOpenChange={setIsAddColumnDialogOpen}
                    tableName="projects"
                    onColumnAdded={handleProjectColumnAdded}
                    existingColumns={projectCustomColumns}
                  />

                  {/* Add Row Dialog */}
                  <Dialog open={isAddRowDialogOpen} onOpenChange={setIsAddRowDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <Plus className="h-4 w-4 ml-2" />
                        הוסף שורה
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                      <DialogHeader>
                        <DialogTitle>הוספת פרויקט חדש</DialogTitle>
                        <DialogDescription>
                          הזן את פרטי הפרויקט החדש
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="newProjectName">שם פרויקט *</Label>
                          <Input
                            id="newProjectName"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="הזן שם פרויקט"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newProjectClient">לקוח</Label>
                          <Input
                            id="newProjectClient"
                            value={newProjectClient}
                            onChange={(e) => setNewProjectClient(e.target.value)}
                            placeholder="הזן שם לקוח"
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRowDialogOpen(false)}>
                          ביטול
                        </Button>
                        <Button onClick={handleAddProject}>
                          <Plus className="h-4 w-4 ml-2" />
                          הוסף
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <UniversalDataTable
                  tableName="projects"
                  data={localProjects}
                  setData={setLocalProjects}
                  columns={projectColumns}
                  variant="gold"
                  selectable
                  filterable
                  globalSearch
                  paginated
                  pageSizeOptions={[10, 25, 50, 100]}
                  exportable
                  columnToggle
                  showSummary
                  onCellEdit={handleProjectCellEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-secondary" />
                    טבלת עובדים
                    <Badge variant="outline" className="text-xs gap-1 mr-2">
                      <Database className="h-3 w-3" />
                      מחובר למסד נתונים
                    </Badge>
                    {employeesSyncing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </CardTitle>
                  <CardDescription>
                    {dbEmployees.length} עובדים | לחץ על תא כדי לערוך | שינויים נשמרים אוטומטית
                    {!isManager && !isAdmin && ' | מצב צפייה בלבד'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Refresh button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshEmployees()}
                    disabled={employeesLoading}
                    title="רענן נתונים"
                  >
                    <RefreshCw className={`h-4 w-4 ${employeesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  
                  {/* Import buttons */}
                  <div className="flex items-center gap-1 border-l pl-2">
                    <input
                      ref={employeeFileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleEmployeeImportFile}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => employeeFileInputRef.current?.click()}
                      title="ייבא מקובץ"
                    >
                      <Upload className="h-4 w-4 ml-1" />
                      ייבוא
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectGoogleSheets}
                      title="חבר ל-Google Sheets"
                    >
                      <FileSpreadsheet className="h-4 w-4 ml-1" />
                      Sheets
                    </Button>
                  </div>
                  
                  {/* Undo/Redo buttons */}
                  <div className="flex items-center gap-1 border-l pl-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEmployeeUndo}
                      disabled={employeeHistory.length === 0}
                      title="בטל (Undo)"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEmployeeRedo}
                      disabled={employeeFuture.length === 0}
                      title="חזור (Redo)"
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {selectedEmployees.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDeleteSelectedEmployees}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק ({selectedEmployees.length})
                    </Button>
                  )}
                  
                  {/* Add Employee Column Button and Dialog */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddEmployeeColumnDialogOpen(true)}
                    className="border-[#D4AF37] bg-white hover:bg-[#1e3a8a]/5 hover:border-[#D4AF37]/80 transition-all shadow-sm"
                  >
                    <Columns className="h-4 w-4 ml-2 text-[#D4AF37]" />
                    <span className="text-[#1e3a8a] font-medium">הוסף עמודה</span>
                  </Button>
                  
                  <AddColumnDialog
                    open={isAddEmployeeColumnDialogOpen}
                    onOpenChange={setIsAddEmployeeColumnDialogOpen}
                    tableName="profiles"
                    onColumnAdded={handleEmployeeColumnAdded}
                    existingColumns={employeeCustomColumns}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <UniversalDataTable
                  tableName="profiles"
                  data={localEmployees}
                  setData={setLocalEmployees}
                  columns={employeeColumnsWithDynamic}
                  loading={employeesLoading}
                  variant="navy"
                  selectable
                  filterable
                  globalSearch
                  paginated
                  pageSizeOptions={[10, 25, 50, 100]}
                  exportable
                  columnToggle
                  showSummary
                  striped
                  onCellEdit={handleEmployeeCellEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Tables Content */}
          {customTables.map((table) => (
            <TabsContent key={table.id} value={`custom_${table.id}`} className="mt-6">
              <CustomTableTab
                table={table}
                onDeleteTable={async (tableId) => {
                  const success = await deleteCustomTable(tableId);
                  if (success) {
                    setActiveTab('clients');
                  }
                  return success;
                }}
                canManage={canManageCustomTables}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Edit Client Name Dialog */}
        <Dialog open={isEditClientNameOpen} onOpenChange={setIsEditClientNameOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>עריכת שם לקוח</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="clientName">שם הלקוח</Label>
              <Input
                id="clientName"
                value={editingClientName}
                onChange={(e) => setEditingClientName(e.target.value)}
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveClientName();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditClientNameOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleSaveClientName}>
                שמור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Consultant Assignment Dialog */}
        <BulkConsultantDialog
          isOpen={isBulkConsultantOpen}
          onClose={() => setIsBulkConsultantOpen(false)}
          selectedClientIds={selectedClients.map(c => c.id)}
          onUpdate={() => { setIsBulkConsultantOpen(false); setSelectedClients([]); }}
        />
      </div>
    </AppLayout>
  );
}
