import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  Bell,
  Clock,
  Table,
  FileText,
  DollarSign,
  Loader2,
  Database,
  ChevronDown,
  Settings2,
  Receipt,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { useDashboardTheme } from './DashboardThemeProvider';

const SELECTED_TABLE_KEY = 'dashboard-selected-table';

// Navigation paths for each table
const TABLE_NAVIGATION_MAP: Record<string, string> = {
  clients: '/clients',
  projects: '/projects',
  tasks: '/tasks',
  meetings: '/calendar',
  reminders: '/reminders',
  time_entries: '/time-tracking',
  profiles: '/team',
  invoices: '/invoices',
  quotes: '/quotes',
  expenses: '/expenses',
};

interface TableOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  tableName: string;
  isCustom?: boolean;
}

const defaultTables: TableOption[] = [
  { id: 'clients', name: 'לקוחות', icon: <Users className="h-4 w-4" />, tableName: 'clients' },
  { id: 'projects', name: 'פרויקטים', icon: <Briefcase className="h-4 w-4" />, tableName: 'projects' },
  { id: 'tasks', name: 'משימות', icon: <CheckSquare className="h-4 w-4" />, tableName: 'tasks' },
  { id: 'meetings', name: 'פגישות', icon: <Calendar className="h-4 w-4" />, tableName: 'meetings' },
  { id: 'reminders', name: 'תזכורות', icon: <Bell className="h-4 w-4" />, tableName: 'reminders' },
  { id: 'time_entries', name: 'לוגי זמן', icon: <Clock className="h-4 w-4" />, tableName: 'time_entries' },
  { id: 'profiles', name: 'עובדים', icon: <Users className="h-4 w-4" />, tableName: 'profiles' },
  { id: 'invoices', name: 'חשבוניות', icon: <Receipt className="h-4 w-4" />, tableName: 'invoices' },
  { id: 'quotes', name: 'הצעות מחיר', icon: <FileText className="h-4 w-4" />, tableName: 'quotes' },
  { id: 'expenses', name: 'הוצאות', icon: <DollarSign className="h-4 w-4" />, tableName: 'expenses' },
];

// Column definitions for each table type
const tableColumns: Record<string, ColumnDef<any>[]> = {
  clients: [
    { id: 'name', header: 'שם', accessorKey: 'name', sortable: true },
    { id: 'email', header: 'אימייל', accessorKey: 'email' },
    { id: 'phone', header: 'טלפון', accessorKey: 'phone' },
    { id: 'status', header: 'סטטוס', accessorKey: 'status', cell: (value) => (
      <Badge variant={value === 'active' ? 'default' : 'secondary'}>
        {value === 'active' ? 'פעיל' : value === 'inactive' ? 'לא פעיל' : value || '-'}
      </Badge>
    )},
  ],
  projects: [
    { id: 'name', header: 'שם פרויקט', accessorKey: 'name', sortable: true },
    { id: 'status', header: 'סטטוס', accessorKey: 'status', cell: (value) => (
      <Badge variant="outline">{value || '-'}</Badge>
    )},
    { id: 'priority', header: 'עדיפות', accessorKey: 'priority' },
    { id: 'budget', header: 'תקציב', accessorKey: 'budget', cell: (value) => value ? `₪${Number(value).toLocaleString()}` : '-' },
  ],
  tasks: [
    { id: 'title', header: 'כותרת', accessorKey: 'title', sortable: true },
    { id: 'status', header: 'סטטוס', accessorKey: 'status', cell: (value) => (
      <Badge variant={value === 'completed' ? 'default' : value === 'in_progress' ? 'secondary' : 'outline'}>
        {value === 'completed' ? 'הושלם' : value === 'in_progress' ? 'בביצוע' : value === 'pending' ? 'ממתין' : value || '-'}
      </Badge>
    )},
    { id: 'priority', header: 'עדיפות', accessorKey: 'priority' },
    { id: 'due_date', header: 'תאריך יעד', accessorKey: 'due_date', cell: (value) => value ? new Date(value).toLocaleDateString('he-IL') : '-' },
  ],
  meetings: [
    { id: 'title', header: 'כותרת', accessorKey: 'title', sortable: true },
    { id: 'start_time', header: 'תאריך', accessorKey: 'start_time', cell: (value) => value ? new Date(value).toLocaleDateString('he-IL') : '-' },
    { id: 'location', header: 'מיקום', accessorKey: 'location' },
    { id: 'status', header: 'סטטוס', accessorKey: 'status', cell: (value) => (
      <Badge variant="outline">{value || 'מתוכנן'}</Badge>
    )},
  ],
  reminders: [
    { id: 'title', header: 'כותרת', accessorKey: 'title', sortable: true },
    { id: 'remind_at', header: 'תזכורת ב', accessorKey: 'remind_at', cell: (value) => value ? new Date(value).toLocaleString('he-IL') : '-' },
    { id: 'is_sent', header: 'נשלחה', accessorKey: 'is_sent', cell: (value) => (
      <Badge variant={value ? 'default' : 'outline'}>{value ? 'כן' : 'לא'}</Badge>
    )},
  ],
  time_entries: [
    { id: 'description', header: 'תיאור', accessorKey: 'description' },
    { id: 'start_time', header: 'התחלה', accessorKey: 'start_time', cell: (value) => value ? new Date(value).toLocaleString('he-IL') : '-' },
    { id: 'duration_minutes', header: 'משך (דק\')', accessorKey: 'duration_minutes' },
    { id: 'is_billable', header: 'לחיוב', accessorKey: 'is_billable', cell: (value) => (
      <Badge variant={value ? 'default' : 'outline'}>{value ? 'כן' : 'לא'}</Badge>
    )},
  ],
  profiles: [
    { id: 'full_name', header: 'שם', accessorKey: 'full_name', sortable: true },
    { id: 'email', header: 'אימייל', accessorKey: 'email' },
    { id: 'department', header: 'מחלקה', accessorKey: 'department' },
    { id: 'position', header: 'תפקיד', accessorKey: 'position' },
  ],
  invoices: [
    { id: 'invoice_number', header: 'מספר', accessorKey: 'invoice_number', sortable: true },
    { id: 'amount', header: 'סכום', accessorKey: 'amount', cell: (value) => `₪${Number(value).toLocaleString()}` },
    { id: 'status', header: 'סטטוס', accessorKey: 'status', cell: (value) => (
      <Badge variant={value === 'paid' ? 'default' : 'outline'}>
        {value === 'paid' ? 'שולם' : value === 'pending' ? 'ממתין' : value || '-'}
      </Badge>
    )},
    { id: 'issue_date', header: 'תאריך', accessorKey: 'issue_date', cell: (value) => value ? new Date(value).toLocaleDateString('he-IL') : '-' },
  ],
  quotes: [
    { id: 'quote_number', header: 'מספר', accessorKey: 'quote_number', sortable: true },
    { id: 'title', header: 'כותרת', accessorKey: 'title' },
    { id: 'total_amount', header: 'סכום', accessorKey: 'total_amount', cell: (value) => `₪${Number(value).toLocaleString()}` },
    { id: 'status', header: 'סטטוס', accessorKey: 'status', cell: (value) => (
      <Badge variant="outline">{value || '-'}</Badge>
    )},
  ],
  expenses: [
    { id: 'description', header: 'תיאור', accessorKey: 'description', sortable: true },
    { id: 'category', header: 'קטגוריה', accessorKey: 'category' },
    { id: 'amount', header: 'סכום', accessorKey: 'amount', cell: (value) => `₪${Number(value).toLocaleString()}` },
    { id: 'expense_date', header: 'תאריך', accessorKey: 'expense_date', cell: (value) => value ? new Date(value).toLocaleDateString('he-IL') : '-' },
    { id: 'supplier_name', header: 'ספק', accessorKey: 'supplier_name' },
  ],
};

interface DynamicTableWidgetProps {
  defaultTableId?: string;
  variant?: 'default' | 'gold' | 'navy';
}

export function DynamicTableWidget({ 
  defaultTableId = 'clients',
  variant = 'default',
}: DynamicTableWidgetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentTheme } = useDashboardTheme();
  
  // Load saved table from localStorage
  const getSavedTable = (): TableOption => {
    const savedId = localStorage.getItem(SELECTED_TABLE_KEY);
    if (savedId) {
      const found = defaultTables.find(t => t.id === savedId);
      if (found) return found;
    }
    return defaultTables.find(t => t.id === defaultTableId) || defaultTables[0];
  };
  
  const [selectedTable, setSelectedTable] = useState<TableOption>(getSavedTable);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customTables, setCustomTables] = useState<TableOption[]>([]);
  const [allTables, setAllTables] = useState<TableOption[]>(defaultTables);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const isNavyGold = currentTheme === 'navy-gold';
  const isModernDark = currentTheme === 'modern-dark';

  // Handle inline cell edit
  const handleCellClick = (rowId: string, column: string, currentValue: any) => {
    setEditingCell({ rowId, column });
    setEditValue(String(currentValue ?? ''));
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    
    try {
      if (selectedTable.isCustom) {
        // Update custom table
        const row = tableData.find(r => r.id === editingCell.rowId);
        if (row) {
          const newData = { ...row, [editingCell.column]: editValue };
          delete newData.id;
          
          const { error } = await supabase
            .from('custom_table_data')
            .update({ data: newData })
            .eq('id', editingCell.rowId);
          
          if (error) throw error;
        }
      } else {
        // Update standard table
        const { error } = await supabase
          .from(selectedTable.tableName as any)
          .update({ [editingCell.column]: editValue })
          .eq('id', editingCell.rowId);
        
        if (error) throw error;
      }
      
      // Update local state
      setTableData(prev => prev.map(row => 
        row.id === editingCell.rowId 
          ? { ...row, [editingCell.column]: editValue }
          : row
      ));
      
      toast({
        title: "נשמר בהצלחה",
        description: "הנתון עודכן",
      });
    } catch (err) {
      console.error('Error updating:', err);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הנתון",
        variant: "destructive",
      });
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleNavigateToTable = () => {
    const path = TABLE_NAVIGATION_MAP[selectedTable.id];
    if (path) {
      navigate(path);
    }
  };

  // Fetch custom tables
  useEffect(() => {
    const fetchCustomTables = async () => {
      const { data, error } = await supabase
        .from('custom_tables')
        .select('id, display_name, name, icon');

      if (!error && data) {
        const customTableOptions: TableOption[] = data.map(table => ({
          id: `custom_${table.id}`,
          name: table.display_name,
          icon: <Table className="h-4 w-4" />,
          tableName: table.id,
          isCustom: true,
        }));
        setCustomTables(customTableOptions);
        setAllTables([...defaultTables, ...customTableOptions]);
      }
    };

    fetchCustomTables();
  }, []);

  // Fetch table data when selection changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (selectedTable.isCustom) {
          // Fetch custom table data
          const { data, error } = await supabase
            .from('custom_table_data')
            .select('*')
            .eq('table_id', selectedTable.tableName)
            .limit(100);

          if (!error && data) {
            setTableData(data.map(row => {
              const rowData = typeof row.data === 'object' && row.data !== null ? row.data : {};
              return { id: row.id, ...(rowData as Record<string, any>) };
            }));
          }
        } else {
          // Fetch standard table data
          const { data, error } = await supabase
            .from(selectedTable.tableName as any)
            .select('*')
            .limit(100);

          if (!error && data) {
            setTableData(data);
          }
        }
      } catch (err) {
        console.error('Error fetching table data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedTable) {
      fetchData();
    }
  }, [selectedTable]);

  // Make a column editable with inline editing capability
  const makeEditableColumn = (col: ColumnDef<any>): ColumnDef<any> => {
    const accessorKey = col.accessorKey as string;
    
    // Skip making certain columns editable
    if (['id', 'created_at', 'updated_at', 'user_id', 'owner_id'].includes(accessorKey)) {
      return col;
    }
    
    return {
      ...col,
      cell: (value: any, row: any) => {
        const isEditing = editingCell?.rowId === row.id && editingCell?.column === accessorKey;
        
        if (isEditing) {
          return (
            <div className="flex items-center gap-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 text-sm w-full min-w-[100px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveEdit}>
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        }
        
        // If original column has custom cell renderer, use it for display
        if (col.cell) {
          return (
            <div 
              className="cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded transition-colors -mx-1"
              onClick={() => handleCellClick(row.id, accessorKey, value)}
              title="לחץ לעריכה"
            >
              {col.cell(value, row, 0)}
            </div>
          );
        }
        
        // Default display
        return (
          <div 
            className="cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded transition-colors -mx-1"
            onClick={() => handleCellClick(row.id, accessorKey, value)}
            title="לחץ לעריכה"
          >
            {value ?? '-'}
          </div>
        );
      },
    };
  };

  // Get columns for the selected table
  const getColumns = (): ColumnDef<any>[] => {
    if (selectedTable.isCustom) {
      // Generate columns from data keys
      if (tableData.length > 0) {
        const sampleRow = tableData[0];
        return Object.keys(sampleRow)
          .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
          .slice(0, 5)
          .map(key => makeEditableColumn({
            id: key,
            header: key,
            accessorKey: key,
          }));
      }
      return [];
    }
    
    const baseColumns = tableColumns[selectedTable.id] || [];
    return baseColumns.map(makeEditableColumn);
  };

  const handleTableChange = (table: TableOption) => {
    setSelectedTable(table);
    localStorage.setItem(SELECTED_TABLE_KEY, table.id);
  };

  return (
    <div className="space-y-4">
      {/* Table Selector - Prominent Design */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="lg"
                className={cn(
                  "gap-3 h-12 px-5 font-bold text-base shadow-lg transition-all duration-200",
                  "ring-2 ring-offset-2 ring-offset-background",
                  (isNavyGold || isModernDark) 
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-900 ring-amber-400/50 border-amber-300" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground ring-primary/30"
                )}
              >
              <div className="flex items-center gap-2">
                {selectedTable.icon}
                <span>{selectedTable.name}</span>
              </div>
              <div className="flex items-center gap-2 border-r border-current/30 pr-3 mr-1">
                <span className="text-xs opacity-80">החלף טבלה</span>
                <ChevronDown className="h-5 w-5" />
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-bold",
                  (isNavyGold || isModernDark) 
                    ? "bg-slate-900/30 text-amber-100" 
                    : "bg-primary-foreground/20 text-primary-foreground"
                )}
              >
                {allTables.length}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-72 bg-popover border-2 border-border shadow-xl z-[100] max-h-[400px] overflow-y-auto"
          >
            <DropdownMenuLabel className="flex items-center gap-2 text-base font-bold">
              <Database className="h-5 w-5 text-primary" />
              בחר טבלה להצגה
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          
            {/* System Tables */}
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-2">
              <Settings2 className="h-3 w-3" />
              טבלאות מערכת ({defaultTables.length})
            </DropdownMenuLabel>
            {defaultTables.map(table => (
              <DropdownMenuItem
                key={table.id}
                onClick={() => handleTableChange(table)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer py-3 px-4",
                  selectedTable.id === table.id && "bg-primary/10 border-r-4 border-primary font-bold"
                )}
              >
                <span className={cn(
                  "p-2 rounded-lg",
                  selectedTable.id === table.id ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {table.icon}
                </span>
                <span className="flex-1">{table.name}</span>
                {selectedTable.id === table.id && (
                  <Badge variant="default" className="text-xs">נבחר</Badge>
                )}
              </DropdownMenuItem>
            ))}
            
            {/* Custom Tables */}
            {customTables.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-2">
                  <Table className="h-3 w-3" />
                  טבלאות מותאמות ({customTables.length})
                </DropdownMenuLabel>
                {customTables.map(table => (
                  <DropdownMenuItem
                    key={table.id}
                    onClick={() => handleTableChange(table)}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer py-3 px-4",
                      selectedTable.id === table.id && "bg-primary/10 border-r-4 border-primary font-bold"
                    )}
                  >
                    <span className={cn(
                      "p-2 rounded-lg",
                      selectedTable.id === table.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {table.icon}
                    </span>
                    <span className="flex-1">{table.name}</span>
                    {selectedTable.id === table.id && (
                      <Badge variant="default" className="text-xs">נבחר</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Navigate to full table button */}
        {TABLE_NAVIGATION_MAP[selectedTable.id] && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "h-12 px-4 gap-2 font-medium",
                  (isNavyGold || isModernDark) && "border-amber-500/30 hover:bg-amber-500/10"
                )}
                onClick={handleNavigateToTable}
              >
                <ExternalLink className="h-4 w-4" />
                פתח ב{selectedTable.name}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              עבור לדף {selectedTable.name} המלא
            </TooltipContent>
          </Tooltip>
        )}
        </div>
        
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>

      {/* Table Display */}
      <DataTable
        data={tableData}
        columns={getColumns()}
        variant={variant}
        paginated
        pageSize={5}
        pageSizeOptions={[5, 10, 25]}
        globalSearch
        showSummary={false}
        emptyMessage={`לא נמצאו נתונים ב${selectedTable.name}`}
      />
    </div>
  );
}
