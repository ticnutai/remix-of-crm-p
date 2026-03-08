import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@/components/DataTable/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
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
  Plus,
  Trash2,
  RefreshCw,
  Database,
  Loader2,
  Upload,
  Undo2,
  Redo2,
  Columns,
  XCircle,
  Eye,
  Type,
  Hash,
  ToggleLeft,
  List,
  Link2,
  Sparkles,
  Settings2,
  TableRowsSplit,
} from 'lucide-react';
import { CustomTable, CustomTableData, TableColumn, useCustomTableData } from '@/hooks/useCustomTables';
import { useCustomTables } from '@/hooks/useCustomTables';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { QuickAddRowsDialog } from '@/components/tables/QuickAddRowsDialog';
import { QuickAddColumnsDialog } from '@/components/tables/QuickAddColumnsDialog';
import { BulkColumnWizard } from '@/components/custom-tables/BulkColumnWizard';
import { CustomTemplateManager } from '@/components/custom-tables/CustomTemplateManager';

const ICON_MAP: Record<string, React.ElementType> = {
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
};

interface CustomTableTabProps {
  table: CustomTable;
  onDeleteTable: (tableId: string) => Promise<boolean>;
  canManage: boolean;
}

export function CustomTableTab({ table, onDeleteTable, canManage }: CustomTableTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data,
    isLoading,
    fetchData,
    addRow,
    updateRow,
    deleteRow,
    deleteMultipleRows,
  } = useCustomTableData(table.id);
  
  const { addColumn, deleteColumn, updateTable } = useCustomTables();
  
  // Clients for client column type
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const [isAddRowDialogOpen, setIsAddRowDialogOpen] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<CustomTableData[]>([]);
  
  // New column state
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'number' | 'boolean' | 'date' | 'select' | 'data_type'>('text');
  const [newColumnOptions, setNewColumnOptions] = useState('');
  const [newColumnRequired, setNewColumnRequired] = useState(false);
  const [newColumnDefault, setNewColumnDefault] = useState('');
  const [dataTypes, setDataTypes] = useState<{ id: string; name: string; display_name: string; color?: string }[]>([]);
  const [selectedDataType, setSelectedDataType] = useState('');
  
  // Undo/Redo state
  const [history, setHistory] = useState<CustomTableData[][]>([]);
  const [future, setFuture] = useState<CustomTableData[][]>([]);
  const maxHistorySize = 50;
  
  // Quick add dialogs state
  const [isQuickAddRowsOpen, setIsQuickAddRowsOpen] = useState(false);
  const [isQuickAddColumnsOpen, setIsQuickAddColumnsOpen] = useState(false);
  const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  
  // Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TableIcon = ICON_MAP[table.icon] || Table;

  // Fetch clients for client column type
  useEffect(() => {
    const hasClientColumn = table.columns.some(col => col.type === 'client');
    if (hasClientColumn) {
      supabase
        .from('clients')
        .select('id, name')
        .order('name')
        .then(({ data: clientsData }) => {
          if (clientsData) {
            setClients(clientsData);
          }
        });
    }
  }, [table.columns]);

  // Fetch data types for data_type column
  useEffect(() => {
    if (isAddColumnDialogOpen) {
      supabase
        .from('data_types')
        .select('id, name, display_name, color')
        .order('display_name')
        .then(({ data }) => {
          if (data) {
            setDataTypes(data);
          }
        });
    }
  }, [isAddColumnDialogOpen]);

  // Save to history before changes
  const saveToHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev, data];
      return newHistory.slice(-maxHistorySize);
    });
    setFuture([]);
  }, [data]);

  // Handle import file
  const handleImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const rowData: Record<string, any> = {};
          
          table.columns.forEach((col, idx) => {
            const value = values[idx] || '';
            if (col.type === 'number') {
              rowData[col.name] = parseFloat(value) || 0;
            } else if (col.type === 'boolean') {
              rowData[col.name] = value.toLowerCase() === 'true' || value === '1';
            } else {
              rowData[col.name] = value;
            }
          });
          
          await addRow(rowData);
          importedCount++;
        }
        
        toast({ title: 'יובא בהצלחה', description: `${importedCount} שורות יובאו מקובץ CSV` });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let importedCount = 0;
        for (const row of jsonData as any[]) {
          const rowData: Record<string, any> = {};
          
          table.columns.forEach((col) => {
            const value = row[col.displayName] || row[col.name] || '';
            if (col.type === 'number') {
              rowData[col.name] = parseFloat(value) || 0;
            } else if (col.type === 'boolean') {
              rowData[col.name] = value === true || value === 'true' || value === 1;
            } else {
              rowData[col.name] = value;
            }
          });
          
          await addRow(rowData);
          importedCount++;
        }
        
        toast({ title: 'יובא בהצלחה', description: `${importedCount} שורות יובאו מקובץ Excel` });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לייבא את הקובץ', variant: 'destructive' });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [table.columns, addRow, toast]);

  // Connect to Google Sheets
  const handleConnectGoogleSheets = useCallback(() => {
    toast({ 
      title: 'חיבור ל-Google Sheets', 
      description: 'תכונה זו דורשת הגדרת API Key של Google. פנה למנהל המערכת.',
    });
  }, [toast]);

  // Add new column
  const handleAddColumn = useCallback(async () => {
    if (!newColumnName.trim()) {
      toast({ title: 'שגיאה', description: 'יש להזין שם עמודה', variant: 'destructive' });
      return;
    }

    if (newColumnType === 'data_type' && !selectedDataType) {
      toast({ title: 'שגיאה', description: 'יש לבחור סוג נתון', variant: 'destructive' });
      return;
    }

    const columnId = `col_${Date.now()}`;
    const newColumn: TableColumn = {
      id: columnId,
      name: columnId,
      displayName: newColumnName,
      type: newColumnType,
      options: newColumnType === 'select' ? newColumnOptions.split('\n').map(o => o.trim()).filter(Boolean) : undefined,
      required: newColumnRequired,
      defaultValue: newColumnDefault || undefined,
      dataTypeId: newColumnType === 'data_type' ? selectedDataType : undefined,
    };

    const success = await addColumn(table.id, newColumn);
    
    if (success) {
      // Add default value to all existing rows
      const defaultValue = newColumnDefault || (
        newColumnType === 'number' ? 0 : 
        newColumnType === 'boolean' ? false : 
        newColumnType === 'date' ? new Date().toISOString().split('T')[0] : ''
      );
      
      for (const row of data) {
        await updateRow(row.id, { ...row.data, [columnId]: defaultValue });
      }
      
      // Reset form
      setNewColumnName('');
      setNewColumnType('text');
      setNewColumnOptions('');
      setNewColumnRequired(false);
      setNewColumnDefault('');
      setSelectedDataType('');
      setIsAddColumnDialogOpen(false);
      
      toast({ title: 'נוסף', description: `העמודה "${newColumnName}" נוספה` });
    }
  }, [newColumnName, newColumnType, newColumnOptions, newColumnRequired, newColumnDefault, selectedDataType, table.id, addColumn, data, updateRow, toast]);

  // Delete column
  const handleDeleteColumn = useCallback(async (columnId: string) => {
    await deleteColumn(table.id, columnId);
    toast({ title: 'נמחק', description: 'העמודה נמחקה' });
  }, [table.id, deleteColumn, toast]);

  // Generate columns from table definition
  const columns: ColumnDef<CustomTableData>[] = useMemo(() => {
    return table.columns.map((col: TableColumn) => {
      const baseColumn: ColumnDef<CustomTableData> = {
        id: col.name,
        header: canManage ? (
          <div className="flex items-center gap-2">
            {col.displayName}
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.id); }}
              className="p-0.5 hover:bg-destructive/20 rounded text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              title="מחק עמודה"
            >
              <XCircle className="h-3 w-3" />
            </button>
          </div>
        ) : col.displayName,
        accessorKey: `data.${col.name}`,
        sortable: true,
        filterable: true,
        editable: canManage,
        headerEditable: canManage,
        onHeaderChange: async (newName: string) => {
          const updatedColumns = table.columns.map(c => 
            c.id === col.id ? { ...c, displayName: newName } : c
          );
          await updateTable(table.id, { columns: updatedColumns });
        },
      };

      switch (col.type) {
        case 'number':
          return {
            ...baseColumn,
            editType: 'number',
            align: 'left' as const,
            cell: (value: any) => value?.toLocaleString() ?? '-',
            summary: 'sum',
          };
        case 'boolean':
          return {
            ...baseColumn,
            editType: 'select',
            editOptions: [
              { value: 'true', label: 'כן' },
              { value: 'false', label: 'לא' },
            ],
            cell: (value: any) => (
              <Badge variant={value ? 'default' : 'secondary'}>
                {value ? 'כן' : 'לא'}
              </Badge>
            ),
          };
        case 'date':
          return {
            ...baseColumn,
            editType: 'date',
            cell: (value: any) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: he }) : '-',
          };
        case 'select':
          return {
            ...baseColumn,
            editType: 'select',
            editOptions: (col.options || []).map(opt => ({ value: opt, label: opt })),
            cell: (value: any) => value ? (
              <Badge variant="outline">{value}</Badge>
            ) : '-',
          };
        case 'client':
          return {
            ...baseColumn,
            editType: 'select',
            editOptions: clients.map(c => ({ value: c.id, label: c.name })),
            cell: (value: any, row: CustomTableData) => {
              const client = clients.find(c => c.id === value);
              if (!client) return '-';
              return (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Building className="h-3 w-3" />
                    {client.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/client-profile/${client.id}`);
                    }}
                    title="צפה בפרופיל לקוח"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              );
            },
          };
        default:
          return {
            ...baseColumn,
            editType: 'text',
            cell: (value: any) => (value != null && value !== '' ? value : null),
          };
      }
    });
  }, [table.columns, table.id, canManage, handleDeleteColumn, updateTable, clients, navigate]);

  const handleCellEdit = useCallback(async (row: CustomTableData, columnId: string, newValue: any) => {
    saveToHistory();
    const updatedData = {
      ...row.data,
      [columnId]: newValue,
    };

    // Check if this is a client column - if so, update linked_client_id
    const column = table.columns.find(c => c.name === columnId);
    if (column?.type === 'client') {
      await updateRow(row.id, updatedData, newValue || null);
    } else {
      await updateRow(row.id, updatedData);
    }
  }, [updateRow, saveToHistory, table.columns]);

  const handleAddRow = async () => {
    if (Object.keys(newRowData).length === 0) {
      // Create empty row with default values
      const defaultRow: Record<string, any> = {};
      table.columns.forEach(col => {
        defaultRow[col.name] = col.type === 'number' ? 0 : 
                              col.type === 'boolean' ? false : '';
      });
      await addRow(defaultRow);
    } else {
      await addRow(newRowData);
    }
    setNewRowData({});
    setIsAddRowDialogOpen(false);
  };

  const handleDeleteSelectedRows = async () => {
    if (selectedRows.length === 0) return;
    saveToHistory();
    await deleteMultipleRows(selectedRows.map(r => r.id));
    setSelectedRows([]);
  };

  const handleDeleteTable = async () => {
    await onDeleteTable(table.id);
  };

  // Quick add rows handler
  const handleQuickAddRows = useCallback(async (rows: Record<string, any>[]) => {
    for (const rowData of rows) {
      const processedRow: Record<string, any> = {};
      table.columns.forEach(col => {
        processedRow[col.name] = rowData[col.name] ?? (col.type === 'number' ? 0 : col.type === 'boolean' ? false : '');
      });
      await addRow(processedRow);
    }
    toast({ title: 'שורות נוספו', description: `${rows.length} שורות נוספו בהצלחה` });
    setIsQuickAddRowsOpen(false);
  }, [table.columns, addRow, toast]);

  // Quick add columns handler
  const handleQuickAddColumns = useCallback(async (columns: Array<{ name: string; type: string }>) => {
    for (const col of columns) {
      const columnId = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newColumn: TableColumn = {
        id: columnId,
        name: columnId,
        displayName: col.name,
        type: col.type as any,
      };
      await addColumn(table.id, newColumn);
    }
    toast({ title: 'עמודות נוספו', description: `${columns.length} עמודות נוספו בהצלחה` });
    setIsQuickAddColumnsOpen(false);
  }, [table.id, addColumn, toast]);

  // Bulk columns added handler
  const handleBulkColumnsAdded = useCallback(async (bulkColumns: any[], groupName?: string) => {
    for (const col of bulkColumns) {
      const columnId = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newColumn: TableColumn = {
        id: columnId,
        name: columnId,
        displayName: col.column_name,
        type: col.column_type as any,
        options: col.column_options,
        required: col.is_required,
        defaultValue: col.default_value,
        dataTypeId: col.data_type_id,
      };
      await addColumn(table.id, newColumn);
    }
    toast({ title: 'עמודות נוספו', description: `${bulkColumns.length} עמודות נוספו${groupName ? ` לקבוצה "${groupName}"` : ''} בהצלחה` });
    setIsBulkWizardOpen(false);
  }, [table.id, addColumn, toast]);

  // Template columns added handler
  const handleTemplateColumnsAdded = useCallback((columns: any[]) => {
    handleBulkColumnsAdded(columns, 'מתבנית');
    setIsTemplateManagerOpen(false);
  }, [handleBulkColumnsAdded]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-primary" />
            {table.display_name}
            <Badge variant="outline" className="text-xs gap-1 mr-2">
              <Database className="h-3 w-3" />
              מחובר למסד נתונים
            </Badge>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <CardDescription>
            {data.length} רשומות | {table.columns.length} עמודות | {table.description || 'לחץ על תא כדי לערוך | שינויים נשמרים אוטומטית'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Import buttons */}
          {canManage && (
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
          )}

          {/* Quick Add buttons */}
          {canManage && (
            <div className="flex items-center gap-1 border-l pl-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuickAddRowsOpen(true)}
                className="gap-1"
                title="הוסף שורות במהירות"
              >
                <TableRowsSplit className="h-4 w-4" />
                + שורות
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuickAddColumnsOpen(true)}
                className="gap-1"
                title="הוסף עמודות במהירות"
              >
                <Columns className="h-4 w-4" />
                + עמודות
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkWizardOpen(true)}
                className="gap-1"
                title="הוסף קבוצת עמודות"
              >
                <Sparkles className="h-4 w-4" />
                קבוצה
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTemplateManagerOpen(true)}
                className="gap-1"
                title="מנהל תבניות"
              >
                <Settings2 className="h-4 w-4" />
                תבניות
              </Button>
            </div>
          )}

          {/* Undo/Redo - placeholder for future implementation */}
          {canManage && (
            <div className="flex items-center gap-1 border-l pl-2">
              <Button
                variant="outline"
                size="sm"
                disabled={history.length === 0}
                title="בטל (Undo)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={future.length === 0}
                title="חזור (Redo)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={isLoading}
            title="רענן נתונים"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          {selectedRows.length > 0 && canManage && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelectedRows}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              מחק ({selectedRows.length})
            </Button>
          )}

          {canManage && (
            <>
              {/* Add Column Dialog */}
              <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns className="h-4 w-4 ml-2" />
                    הוסף עמודה
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      הוספת עמודה חדשה
                    </DialogTitle>
                    <DialogDescription>
                      הגדר עמודה מותאמת אישית לטבלה
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Column Name */}
                    <div className="grid gap-2">
                      <Label>שם העמודה *</Label>
                      <Input
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="לדוגמה: הערות, עדיפות, תאריך סיום..."
                      />
                    </div>

                    {/* Column Type Cards */}
                    <div className="grid gap-2">
                      <Label>סוג העמודה *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { type: 'text', label: 'טקסט', icon: Type, description: 'שדה טקסט חופשי' },
                          { type: 'number', label: 'מספר', icon: Hash, description: 'ערך מספרי' },
                          { type: 'date', label: 'תאריך', icon: Calendar, description: 'בחירת תאריך' },
                          { type: 'boolean', label: 'כן/לא', icon: ToggleLeft, description: 'תיבת סימון' },
                          { type: 'select', label: 'בחירה', icon: List, description: 'רשימת אפשרויות' },
                          { type: 'data_type', label: 'סוג נתון', icon: Link2, description: 'קישור לנתון אחר (לקוח, עובד, פרויקט)' },
                        ].map(({ type, label, icon: Icon, description }) => {
                          const isSelected = newColumnType === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNewColumnType(type as any)}
                              className={`p-3 rounded-lg border text-right transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              }`}
                            >
                              <Icon className={`h-4 w-4 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div className="text-sm font-medium">{label}</div>
                              <div className="text-xs text-muted-foreground">{description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Select Options */}
                    {newColumnType === 'select' && (
                      <div className="grid gap-2">
                        <Label>אפשרויות (שורה לכל אפשרות)</Label>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="אפשרות 1&#10;אפשרות 2&#10;אפשרות 3"
                          value={newColumnOptions}
                          onChange={(e) => setNewColumnOptions(e.target.value)}
                          rows={4}
                        />
                      </div>
                    )}

                    {/* Data Type Selection */}
                    {newColumnType === 'data_type' && (
                      <div className="grid gap-2">
                        <Label>סוג הנתון המקושר *</Label>
                        <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר סוג נתון..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dataTypes.map((dt) => (
                              <SelectItem key={dt.id} value={dt.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: dt.color || '#6366f1' }}
                                  />
                                  {dt.display_name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          ניתן ליצור סוגי נתונים חדשים דרך ניהול סוגי נתונים בסרגל הצד
                        </p>
                      </div>
                    )}

                    {/* Default Value */}
                    {newColumnType !== 'data_type' && newColumnType !== 'boolean' && (
                      <div className="grid gap-2">
                        <Label>ערך ברירת מחדל (אופציונלי)</Label>
                        <Input
                          placeholder="ערך ברירת מחדל לרשומות חדשות"
                          value={newColumnDefault}
                          onChange={(e) => setNewColumnDefault(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Required Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>שדה חובה</Label>
                        <p className="text-xs text-muted-foreground">חובה למלא שדה זה</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={newColumnRequired}
                        onChange={(e) => setNewColumnRequired(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddColumnDialogOpen(false)}>
                      ביטול
                    </Button>
                    <Button onClick={handleAddColumn}>
                      <Plus className="ml-2 h-4 w-4" />
                      הוסף עמודה
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Add Row Dialog */}
              <Dialog open={isAddRowDialogOpen} onOpenChange={setIsAddRowDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף שורה
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader className="text-right">
                    <DialogTitle>הוספת רשומה חדשה</DialogTitle>
                    <DialogDescription>
                      הזן את הנתונים עבור הרשומה החדשה
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {table.columns.map((col: TableColumn) => (
                      <div key={col.id} className="space-y-2">
                        <Label>
                          {col.displayName}
                          {col.required && <span className="text-destructive mr-1">*</span>}
                        </Label>
                        {col.type === 'select' ? (
                          <Select
                            value={newRowData[col.name] || ''}
                            onValueChange={(value) => setNewRowData(prev => ({ ...prev, [col.name]: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="בחר..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(col.options || []).map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : col.type === 'boolean' ? (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={newRowData[col.name] || false}
                              onCheckedChange={(checked) => setNewRowData(prev => ({ ...prev, [col.name]: checked }))}
                            />
                            <span className="text-sm">{col.displayName}</span>
                          </div>
                        ) : col.type === 'number' ? (
                          <Input
                            type="number"
                            value={newRowData[col.name] || ''}
                            onChange={(e) => setNewRowData(prev => ({ ...prev, [col.name]: parseFloat(e.target.value) || 0 }))}
                            placeholder={`הזן ${col.displayName}`}
                          />
                        ) : col.type === 'date' ? (
                          <Input
                            type="date"
                            value={newRowData[col.name] || ''}
                            onChange={(e) => setNewRowData(prev => ({ ...prev, [col.name]: e.target.value }))}
                          />
                        ) : (
                          <Input
                            value={newRowData[col.name] || ''}
                            onChange={(e) => setNewRowData(prev => ({ ...prev, [col.name]: e.target.value }))}
                            placeholder={`הזן ${col.displayName}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddRowDialogOpen(false)}>
                      ביטול
                    </Button>
                    <Button onClick={handleAddRow}>
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader className="text-right">
                    <AlertDialogTitle>מחיקת טבלה</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם אתה בטוח שברצונך למחוק את הטבלה "{table.display_name}"?
                      <br />
                      פעולה זו תמחק את כל הנתונים ולא ניתן לבטל אותה.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteTable}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      מחק טבלה
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable<CustomTableData>
          data={data}
          columns={columns}
          loading={isLoading}
          variant="gold"
          selectable={canManage}
          multiSelect
          sortable
          filterable
          globalSearch
          paginated
          pageSizeOptions={[10, 25, 50, 100]}
          exportable
          exportFilename={`${table.name}-export`}
          columnReorder
          columnResize
          columnToggle
          showSummary
          keyboardNavigation
          striped
          onCellEdit={handleCellEdit}
          onSelectionChange={setSelectedRows}
          onQuickAddRows={() => setIsQuickAddRowsOpen(true)}
          onQuickAddColumns={() => setIsQuickAddColumnsOpen(true)}
        />
      </CardContent>

      {/* Quick Add Rows Dialog */}
      <QuickAddRowsDialog
        open={isQuickAddRowsOpen}
        onOpenChange={setIsQuickAddRowsOpen}
        columns={columns}
        onRowsAdd={handleQuickAddRows}
      />

      {/* Quick Add Columns Dialog */}
      <QuickAddColumnsDialog
        open={isQuickAddColumnsOpen}
        onOpenChange={setIsQuickAddColumnsOpen}
        existingColumns={columns}
        onColumnsAdd={handleQuickAddColumns}
      />

      {/* Bulk Column Wizard */}
      <BulkColumnWizard
        open={isBulkWizardOpen}
        onOpenChange={setIsBulkWizardOpen}
        tableName={table.name}
        onColumnsAdded={handleBulkColumnsAdded}
        existingColumns={[]}
      />

      {/* Template Manager */}
      <CustomTemplateManager
        open={isTemplateManagerOpen}
        onOpenChange={setIsTemplateManagerOpen}
        tableName={table.name}
        onColumnsAdded={handleTemplateColumnsAdded}
        existingColumns={table.columns.map(c => c.name)}
      />
    </Card>
  );
}
