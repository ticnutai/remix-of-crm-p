// Full-featured custom table tab for client profiles with column management
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  FileText,
  Upload,
  Download,
  Trash2,
  Pencil,
  MoreVertical,
  BarChart3,
  FileSpreadsheet,
  Grid3X3,
  List,
  LayoutGrid,
  Eye,
  FileUp,
  X,
  Loader2,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Columns,
  Settings,
  Copy,
  TableRowsSplit,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClientTabData, ClientTabDataRow } from '@/hooks/useClientTabData';
import { useClientTabColumns, ClientTabColumn, NewColumnData } from '@/hooks/useClientTabColumns';
import { ClientCustomTab } from '@/hooks/useClientCustomTabs';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@/components/DataTable/types';
import { AddColumnDialog } from '@/components/tables/AddColumnDialog';
import { DayCounterCell } from '@/components/tables/DayCounterCell';
import { BulkColumnWizard } from '@/components/custom-tables/BulkColumnWizard';
import { CustomTemplateManager } from '@/components/custom-tables/CustomTemplateManager';
import { QuickAddRowsDialog } from '@/components/tables/QuickAddRowsDialog';
import { QuickAddColumnsDialog } from '@/components/tables/QuickAddColumnsDialog';
import { useDataTypes } from '@/hooks/useDataTypes';
import { toast } from 'sonner';

interface ClientCustomTableTabProps {
  tab: ClientCustomTab;
  clientId: string;
}

// View modes
type ViewMode = 'table' | 'cards' | 'grid' | 'summary';

export function ClientCustomTableTab({ tab, clientId }: ClientCustomTableTabProps) {
  const {
    rows,
    isLoading: isLoadingData,
    canEdit,
    addRow,
    updateRow,
    deleteRow,
    addFile,
    deleteFile,
    refetch: refetchRows,
    summary,
    analysis,
    generateSummary,
    generateAnalysis,
  } = useClientTabData(tab.id, clientId);

  const {
    columns: tabColumns,
    isLoading: isLoadingColumns,
    addColumn,
    addColumnsInBulk,
    updateColumn,
    deleteColumn,
    refetch: refetchColumns,
  } = useClientTabColumns(tab.id);

  const { dataTypes } = useDataTypes();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isAddRowDialogOpen, setIsAddRowDialogOpen] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isDeleteColumnDialogOpen, setIsDeleteColumnDialogOpen] = useState(false);
  const [isQuickAddRowsOpen, setIsQuickAddRowsOpen] = useState(false);
  const [isQuickAddColumnsOpen, setIsQuickAddColumnsOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<ClientTabColumn | null>(null);
  const [editRow, setEditRow] = useState<ClientTabDataRow | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formNotes, setFormNotes] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);

  const isLoading = isLoadingData || isLoadingColumns;

  // Generate summary and analysis on mount
  useEffect(() => {
    if (rows.length > 0) {
      generateSummary();
      generateAnalysis();
    }
  }, [rows, generateSummary, generateAnalysis]);

  // Filter rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row => {
      const dataStr = JSON.stringify(row.data).toLowerCase();
      const notesStr = (row.notes || '').toLowerCase();
      return dataStr.includes(term) || notesStr.includes(term);
    });
  }, [rows, searchTerm]);

  // Flatten rows for DataTable - data is inside 'data' field
  const tableData = useMemo(() => {
    return filteredRows.map(row => ({
      id: row.id,
      ...row.data,
      _notes: row.notes,
      _files: row.files,
      _created_at: row.created_at,
      _row: row, // Keep original row for actions
    }));
  }, [filteredRows]);

  // Build dynamic columns for DataTable
  const dynamicColumns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = tabColumns.map(col => {
      let editType: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'enhanced-select' | undefined = undefined;
      
      switch (col.column_type) {
        case 'text':
        case 'textarea':
          editType = 'text';
          break;
        case 'number':
          editType = 'number';
          break;
        case 'date':
          editType = 'date';
          break;
        case 'boolean':
          editType = 'checkbox';
          break;
        case 'select':
          editType = 'select';
          break;
        case 'enhanced-select':
        case 'multi_select':
          editType = 'enhanced-select';
          break;
        case 'day_counter':
          // Day counter uses date input, but displays as counter
          editType = 'date';
          break;
      }

      // Special handling for day_counter column type
      if (col.column_type === 'day_counter') {
        const config = col.column_options?.[0] || { targetDays: 35 };
        return {
          id: col.column_key,
          header: col.column_name,
          accessorKey: col.column_key,
          sortable: true,
          filterable: true,
          editable: canEdit,
          editType,
          // Enable header editing
          headerEditable: canEdit,
          onHeaderChange: async (newName: string) => {
            await handleRenameColumn(col.id, newName);
          },
          cell: (value: any) => {
            if (!value) {
              return <span className="text-muted-foreground">-</span>;
            }
            return (
              <DayCounterCell 
                startDate={value} 
                config={{
                  targetDays: typeof config === 'object' ? config.targetDays : 35,
                  connectToTask: typeof config === 'object' ? config.connectToTask : false,
                  connectToReminder: typeof config === 'object' ? config.connectToReminder : false,
                }}
                showDetails={false}
              />
            );
          },
        };
      }

      return {
        id: col.column_key,
        header: col.column_name,
        accessorKey: col.column_key,
        sortable: true,
        filterable: true,
        editable: canEdit,
        editType,
        // Enable header editing
        headerEditable: canEdit,
        onHeaderChange: async (newName: string) => {
          await handleRenameColumn(col.id, newName);
        },
        editOptions: col.column_options?.map((opt: any) => 
          typeof opt === 'string' ? { value: opt, label: opt } : opt
        ),
        cell: (value: any) => {
          if (value === undefined || value === null || value === '') {
            return <span className="text-muted-foreground">-</span>;
          }
          
          if (col.column_type === 'date' && value) {
            try {
              return format(new Date(value), 'dd/MM/yyyy', { locale: he });
            } catch {
              return String(value);
            }
          }
          
          if (col.column_type === 'boolean') {
            return value ? '✓' : '✗';
          }
          
          if (col.column_type === 'number' && typeof value === 'number') {
            return value.toLocaleString();
          }
          
          if (col.column_type === 'select' || col.column_type === 'enhanced-select' || col.column_type === 'multi_select') {
            // Simple span for better performance instead of Badge
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">{String(value)}</span>;
          }
          
          const strValue = String(value);
          return strValue.length > 50 ? strValue.slice(0, 50) + '...' : strValue;
        },
      };
    });

    // Add notes column
    cols.push({
      id: '_notes',
      header: 'הערות',
      accessorKey: '_notes',
      cell: (value: any) => {
        if (!value) return '-';
        return (
          <Badge variant="outline" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            יש הערה
          </Badge>
        );
      },
    });

    // Add files column
    cols.push({
      id: '_files',
      header: 'קבצים',
      accessorKey: '_files',
      cell: (value: any) => {
        if (!value || value.length === 0) return '-';
        return <Badge variant="secondary">{value.length} קבצים</Badge>;
      },
    });

    // Add created date column
    cols.push({
      id: '_created_at',
      header: 'תאריך',
      accessorKey: '_created_at',
      sortable: true,
      cell: (value: any) => {
        if (!value) return '-';
        try {
          return format(new Date(value), 'dd/MM/yy', { locale: he });
        } catch {
          return '-';
        }
      },
    });

    // Add actions column
    cols.push({
      id: 'actions',
      header: '',
      accessorKey: 'id',
      cell: (value: any, rowData: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(rowData._row)}>
              <Pencil className="h-4 w-4 ml-2" />
              ערוך
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setUploadingRowId(rowData.id);
                fileInputRef.current?.click();
              }}
            >
              <Upload className="h-4 w-4 ml-2" />
              העלה קובץ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(rowData.id)}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              מחק
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });

    return cols;
  }, [tabColumns, canEdit]);

  // Reset form
  const resetForm = () => {
    setFormData({});
    setFormNotes('');
    setEditRow(null);
  };

  // Open add row dialog
  const handleAddRow = () => {
    resetForm();
    setIsAddRowDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (row: ClientTabDataRow) => {
    setFormData(row.data || {});
    setFormNotes(row.notes || '');
    setEditRow(row);
    setIsAddRowDialogOpen(true);
  };

  // Submit form (add/edit row)
  const handleSubmitRow = async () => {
    if (editRow) {
      await updateRow(editRow.id, { data: formData, notes: formNotes || null });
    } else {
      await addRow(formData, formNotes || undefined);
    }
    setIsAddRowDialogOpen(false);
    resetForm();
  };

  // Delete row
  const handleDelete = async (rowId: string) => {
    if (confirm('האם למחוק את הרשומה?')) {
      await deleteRow(rowId);
    }
  };

  // Handle cell edit from DataTable
  const handleCellEdit = useCallback(async (rowIndex: number, columnId: string, value: any) => {
    const row = filteredRows[rowIndex];
    if (!row) return;

    // Skip only internal columns (_row, actions, id)
    if (columnId === '_row' || columnId === 'actions' || columnId === 'id') return;

    const updatedData = { ...row.data, [columnId]: value };
    await updateRow(row.id, { data: updatedData }, row.field_metadata);
  }, [filteredRows, updateRow]);

  // Get field metadata for a row
  const getRowFieldMetadata = useCallback((rowData: any) => {
    const originalRow = filteredRows.find(r => r.id === rowData.id);
    return originalRow?.field_metadata;
  }, [filteredRows]);

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !uploadingRowId) return;
    
    try {
      for (const file of Array.from(files)) {
        await addFile(uploadingRowId, file);
      }
    } finally {
      setUploadingRowId(null);
    }
  };

  // Handle add column
  const handleAddColumn = async (columnData: any) => {
    const newColumn: NewColumnData = {
      column_name: columnData.column_name,
      column_type: columnData.column_type,
      column_options: columnData.column_options || [],
      data_type_id: columnData.data_type_id || null,
      is_required: columnData.is_required || false,
      default_value: columnData.default_value || null,
      column_group: columnData.column_group || null,
      allow_multiple: columnData.allow_multiple || false,
      max_rating: columnData.max_rating || 5,
      formula: columnData.formula || null,
    };

    const result = await addColumn(newColumn);
    if (result) {
      setIsAddColumnDialogOpen(false);
    }
  };

  // Handle bulk add columns
  const handleBulkAddColumns = async (columns: any[], groupName: string) => {
    console.log('handleBulkAddColumns called with:', { columns, groupName });
    
    const newColumns: NewColumnData[] = columns.map(col => ({
      column_name: col.column_name,
      column_type: col.column_type,
      column_key: col.column_key, // העבר את ה-column_key אם קיים
      column_options: col.column_options || [],
      data_type_id: col.data_type_id || null,
      is_required: col.is_required || false,
      default_value: col.default_value || null,
      column_group: groupName || col.column_group || null,
      allow_multiple: col.allow_multiple || false,
      max_rating: col.max_rating || 5,
      formula: col.formula || null,
    }));

    console.log('Mapped columns for bulk add:', newColumns);

    const result = await addColumnsInBulk(newColumns, groupName);
    if (result) {
      setIsBulkWizardOpen(false);
    }
  };

  // Handle delete column
  const handleDeleteColumn = async () => {
    if (!columnToDelete) return;
    
    const result = await deleteColumn(columnToDelete.id);
    if (result) {
      setIsDeleteColumnDialogOpen(false);
      setColumnToDelete(null);
    }
  };

  // Handle rename column (for editable headers)
  const handleRenameColumn = useCallback(async (columnId: string, newName: string) => {
    if (!newName.trim()) return;
    await updateColumn(columnId, { column_name: newName.trim() });
  }, [updateColumn]);

  // Handle quick add rows
  const handleQuickAddRows = useCallback(async (rows: Record<string, any>[]) => {
    for (const row of rows) {
      await addRow(row);
    }
    toast.success(`${rows.length} שורות נוספו בהצלחה`);
    setIsQuickAddRowsOpen(false);
  }, [addRow]);

  // Handle quick add columns
  const handleQuickAddColumns = useCallback(async (columns: Array<{ name: string; type: string }>) => {
    for (const col of columns) {
      const newColumn: NewColumnData = {
        column_name: col.name,
        column_type: col.type as any,
        column_options: [],
        is_required: false,
        default_value: null,
        column_group: null,
        allow_multiple: false,
        max_rating: 5,
        formula: null,
      };
      await addColumn(newColumn);
    }
    toast.success(`${columns.length} עמודות נוספו בהצלחה`);
    setIsQuickAddColumnsOpen(false);
  }, [addColumn]);

  // Render form field for add/edit row
  const renderFormField = (column: ClientTabColumn) => {
    const value = formData[column.column_key] || '';
    
    switch (column.column_type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={e => setFormData(prev => ({ ...prev, [column.column_key]: e.target.value }))}
            placeholder={column.column_name}
            className="min-h-[80px]"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={e => setFormData(prev => ({ ...prev, [column.column_key]: parseFloat(e.target.value) || 0 }))}
            placeholder={column.column_name}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={e => setFormData(prev => ({ ...prev, [column.column_key]: e.target.value }))}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => setFormData(prev => ({ ...prev, [column.column_key]: e.target.checked }))}
              className="h-4 w-4"
            />
            <span>{column.column_name}</span>
          </div>
        );
      case 'select':
      case 'enhanced-select':
        return (
          <select
            value={value}
            onChange={e => setFormData(prev => ({ ...prev, [column.column_key]: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">בחר...</option>
            {column.column_options?.map((opt: any) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return <option key={optValue} value={optValue}>{optLabel}</option>;
            })}
          </select>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={e => setFormData(prev => ({ ...prev, [column.column_key]: e.target.value }))}
            placeholder={column.column_name}
          />
        );
    }
  };

  // Render cards view
  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredRows.map(row => (
        <Card key={row.id} className="relative overflow-hidden border-2 border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {row.data[tabColumns[0]?.column_key] || 'ללא כותרת'}
                </CardTitle>
                <CardDescription>
                  {format(new Date(row.created_at), 'dd/MM/yyyy', { locale: he })}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(row)}>
                    <Pencil className="h-4 w-4 ml-2" />
                    ערוך
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(row.id)}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {tabColumns.slice(1, 4).map(col => (
              <div key={col.column_key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{col.column_name}:</span>
                <span>{row.data[col.column_key] ?? '-'}</span>
              </div>
            ))}
            {row.notes && (
              <div className="pt-2 mt-2 border-t text-sm text-muted-foreground">
                {row.notes.slice(0, 100)}{row.notes.length > 100 ? '...' : ''}
              </div>
            )}
            {row.files && row.files.length > 0 && (
              <Badge variant="secondary" className="mt-2">
                {row.files.length} קבצים
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {filteredRows.map(row => (
        <Card 
          key={row.id} 
          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-2"
          onClick={() => handleEdit(row)}
        >
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-primary">
              {row.data[tabColumns[0]?.column_key] || '-'}
            </div>
            {tabColumns[1] && (
              <div className="text-sm text-muted-foreground">
                {row.data[tabColumns[1].column_key] ?? '-'}
              </div>
            )}
            <div className="flex justify-center gap-2">
              {row.notes && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
              {row.files && row.files.length > 0 && <FileText className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // Render summary view
  const renderSummaryView = () => (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-l from-primary/10 to-background">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            סיכום נתונים
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg">
            {summary || 'אין סיכום זמין'}
          </pre>
          <Button 
            variant="outline" 
            className="mt-4 w-full" 
            onClick={generateSummary}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            עדכן סיכום
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="bg-gradient-to-l from-secondary/10 to-background">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ניתוח נתונים
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg">
            {analysis || 'אין ניתוח זמין'}
          </pre>
          <Button 
            variant="outline" 
            className="mt-4 w-full" 
            onClick={generateAnalysis}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            עדכן ניתוח
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={e => handleFileUpload(e.target.files)}
      />

      {/* Header with tab name */}
      <div className="flex items-center justify-between bg-gradient-to-l from-muted/30 to-background rounded-xl p-4 border border-border/50">
        <div className="text-right">
          <h2 className="text-xl font-bold text-foreground">{tab.display_name}</h2>
          <p className="text-sm text-muted-foreground">
            {filteredRows.length} רשומות | {tabColumns.length} עמודות
            {searchTerm && ` (מתוך ${rows.length})`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {canEdit && (
            <>
              <Button 
                onClick={handleAddRow} 
                className="gap-2 bg-gradient-to-r from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] hover:from-[hsl(222,47%,25%)] hover:to-[hsl(222,47%,35%)] border border-[hsl(222,47%,35%)]"
              >
                <Plus className="h-4 w-4" />
                הוסף שורה
              </Button>
            </>
          )}
          <Button variant="outline" size="icon" onClick={() => { refetchRows(); refetchColumns(); }} title="רענן">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Column Management Toolbar */}
      {canEdit && (
        <div className="flex items-center justify-between flex-wrap gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Columns className="h-4 w-4" />
            <span>ניהול עמודות:</span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsQuickAddRowsOpen(true)}
              className="gap-1 border-primary/30 hover:border-primary"
            >
              <TableRowsSplit className="h-4 w-4 text-primary" />
              + שורות
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsQuickAddColumnsOpen(true)}
              className="gap-1 border-primary/30 hover:border-primary"
            >
              <Columns className="h-4 w-4 text-primary" />
              + עמודות
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsTemplateManagerOpen(true)}
              className="gap-1"
            >
              <Copy className="h-4 w-4" />
              מנהל תבניות
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsBulkWizardOpen(true)}
              className="gap-1"
            >
              <FileSpreadsheet className="h-4 w-4" />
              הוסף קבוצת עמודות
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setIsAddColumnDialogOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              הוסף עמודה
            </Button>
          </div>
        </div>
      )}

      {/* Existing columns display */}
      {tabColumns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tabColumns.map(col => (
            <Badge 
              key={col.id} 
              variant="secondary" 
              className="px-3 py-1 flex items-center gap-2"
            >
              {col.column_name}
              <span className="text-xs text-muted-foreground">({col.column_type})</span>
              {canEdit && (
                <button
                  onClick={() => {
                    setColumnToDelete(col);
                    setIsDeleteColumnDialogOpen(true);
                  }}
                  className="mr-1 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-muted/20 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="🔍 חיפוש..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-56 bg-background"
          />
        </div>
        
        {/* View mode buttons */}
        <div className="flex border rounded-lg overflow-hidden bg-background shadow-sm">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="rounded-none gap-1 px-3"
            title="תצוגת טבלה"
          >
            <List className="h-4 w-4" />
            <span className="hidden md:inline">טבלה</span>
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="rounded-none gap-1 px-3"
            title="תצוגת כרטיסים"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden md:inline">כרטיסים</span>
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-none gap-1 px-3"
            title="תצוגת רשת"
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden md:inline">רשת</span>
          </Button>
          <Button
            variant={viewMode === 'summary' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('summary')}
            className="rounded-none gap-1 px-3"
            title="סיכום וניתוח"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">סיכום</span>
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'table' && (
        <Card className="border-2 border-[hsl(222,47%,25%)]/50 shadow-sm">
          <CardContent className="p-0">
            {tabColumns.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Columns className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">אין עמודות בטבלה</p>
                <p className="text-sm mb-4">הוסף עמודות כדי להתחיל להזין נתונים</p>
                {canEdit && (
                  <Button onClick={() => setIsAddColumnDialogOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף עמודה ראשונה
                  </Button>
                )}
              </div>
            ) : (
              <DataTable
                data={tableData}
                columns={dynamicColumns}
                onCellEdit={handleCellEdit}
                filterable={true}
                sortable={true}
                striped={true}
                bordered={true}
                exportable={true}
                globalSearch={true}
                paginated={true}
                pageSizeOptions={[10, 25, 50, 100]}
                columnToggle={true}
                columnReorder={true}
                columnResize={true}
                onQuickAddRows={() => setIsQuickAddRowsOpen(true)}
                onQuickAddColumns={() => setIsQuickAddColumnsOpen(true)}
                rowFieldMetadata={getRowFieldMetadata}
                variant="gold"
              />
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'cards' && renderCardsView()}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'summary' && renderSummaryView()}

      {/* Add/Edit Row Dialog */}
      <Dialog open={isAddRowDialogOpen} onOpenChange={setIsAddRowDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>{editRow ? 'עריכת רשומה' : 'הוספת רשומה'}</DialogTitle>
            <DialogDescription>
              מלא את הפרטים עבור הרשומה החדשה
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              {tabColumns.map(column => (
                <div key={column.id} className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    {column.column_name}
                    {column.is_required && <span className="text-destructive">*</span>}
                  </label>
                  {renderFormField(column)}
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">הערות</label>
                <Textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="הערות נוספות..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddRowDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSubmitRow}>
              {editRow ? 'שמור שינויים' : 'הוסף רשומה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Column Dialog */}
      <AddColumnDialog
        open={isAddColumnDialogOpen}
        onOpenChange={setIsAddColumnDialogOpen}
        onColumnAdded={handleAddColumn}
        tableName={`client_tab_${tab.id}`}
      />

      {/* Bulk Column Wizard */}
      <BulkColumnWizard
        open={isBulkWizardOpen}
        onOpenChange={setIsBulkWizardOpen}
        onColumnsAdded={(columns, groupName) => handleBulkAddColumns(columns as any[], groupName || '')}
        tableName={`client_tab_${tab.id}`}
      />

      {/* Template Manager */}
      <CustomTemplateManager
        open={isTemplateManagerOpen}
        onOpenChange={setIsTemplateManagerOpen}
        onColumnsAdded={(columns) => {
          handleBulkAddColumns(columns as any[], 'מתבנית');
          setIsTemplateManagerOpen(false);
        }}
        tableName={`client_tab_${tab.id}`}
      />

      {/* Quick Add Rows Dialog */}
      <QuickAddRowsDialog
        open={isQuickAddRowsOpen}
        onOpenChange={setIsQuickAddRowsOpen}
        columns={dynamicColumns}
        onRowsAdd={handleQuickAddRows}
      />

      {/* Quick Add Columns Dialog */}
      <QuickAddColumnsDialog
        open={isQuickAddColumnsOpen}
        onOpenChange={setIsQuickAddColumnsOpen}
        existingColumns={dynamicColumns}
        onColumnsAdd={handleQuickAddColumns}
      />

      {/* Delete Column Confirmation */}
      <Dialog open={isDeleteColumnDialogOpen} onOpenChange={setIsDeleteColumnDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>מחיקת עמודה</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את העמודה "{columnToDelete?.column_name}"?
              <br />
              <span className="text-destructive font-medium">
                פעולה זו לא ניתנת לביטול והנתונים בעמודה יאבדו.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteColumnDialogOpen(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDeleteColumn}>
              <Trash2 className="h-4 w-4 ml-2" />
              מחק עמודה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
