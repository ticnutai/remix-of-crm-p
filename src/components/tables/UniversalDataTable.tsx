import React, { useState, useMemo, useCallback, useDeferredValue } from 'react';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@/components/DataTable/types';
import { AddColumnDialog, CustomColumn } from '@/components/tables/AddColumnDialog';
import { BulkColumnWizard } from '@/components/custom-tables/BulkColumnWizard';
import { CustomTemplateManager } from '@/components/custom-tables/CustomTemplateManager';
import { QuickAddRowsDialog } from '@/components/tables/QuickAddRowsDialog';
import { QuickAddColumnsDialog } from '@/components/tables/QuickAddColumnsDialog';
import { useTableCustomColumns, useCustomData } from '@/hooks/useTableCustomColumns';
import { useVirtualScrollThreshold } from '@/hooks/useVirtualScrollThreshold';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Settings2, Trash2, GripVertical, MoreVertical, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export interface UniversalDataTableProps<T extends { id: string; custom_data?: Record<string, any> }> {
  // Basic props
  tableName: string; // 'profiles', 'time_entries', 'projects', etc.
  data: T[];
  setData?: React.Dispatch<React.SetStateAction<T[]>>;
  baseColumns?: ColumnDef<T>[]; // Core columns defined by the page
  columns?: ColumnDef<T>[]; // Alternative to baseColumns for compatibility
  
  // DataTable passthrough props
  variant?: 'default' | 'gold' | 'navy' | 'minimal';
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  globalSearch?: boolean;
  columnToggle?: boolean;
  exportable?: boolean;
  filterable?: boolean;
  striped?: boolean;
  showSummary?: boolean;
  selectable?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: T, index: number) => void;
  onCellEdit?: (row: T, columnId: string, value: any) => void;
  
  // Permission control
  canAddColumns?: boolean;
  canDeleteColumns?: boolean;
  
  // Cell formatting (for context menu features)
  enableCellFormatting?: boolean;
}

export function UniversalDataTable<T extends { id: string; custom_data?: Record<string, any> }>({
  tableName,
  data,
  setData,
  baseColumns: baseColumnsProp,
  columns: columnsProp,
  variant = 'gold',
  paginated = false,
  pageSize = 100,
  pageSizeOptions = [25, 50, 100, 200, 500],
  globalSearch = true,
  columnToggle = true,
  exportable = true,
  filterable = true,
  striped = true,
  showSummary = false,
  selectable = false,
  emptyMessage = 'לא נמצאו רשומות',
  loading = false,
  onRowClick,
  onCellEdit,
  canAddColumns = true,
  canDeleteColumns = true,
}: UniversalDataTableProps<T>) {
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isQuickAddRowsOpen, setIsQuickAddRowsOpen] = useState(false);
  const [isQuickAddColumnsOpen, setIsQuickAddColumnsOpen] = useState(false);
  const [deleteColumnDialog, setDeleteColumnDialog] = useState<{ open: boolean; column: CustomColumn | null }>({
    open: false,
    column: null,
  });
  
  // Hide empty custom columns toggle
  const [hideEmptyColumns, setHideEmptyColumns] = useState(false);
  
  // Cell formatting state (for right-click context menu)
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
  }, []);

  const handleCellReminderAdd = useCallback((cellId: string, reminder: any) => {
    const newReminder = { ...reminder, id: `rem-${Date.now()}` };
    setCellFormatting(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [cellId]: [...(prev.reminders[cellId] || []), newReminder] }
    }));
  }, []);

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
  }, []);
  
  const {
    customColumns,
    isLoading: columnsLoading,
    dataTypeOptions,
    addColumn,
    addColumnsInBulk,
    deleteColumn,
    updateColumnRequired,
    getDataTypeDisplayValue,
  } = useTableCustomColumns(tableName);

  const { updateCustomData } = useCustomData(tableName, data, setData);
  
  // Get user's virtual scroll threshold preference
  const virtualScrollThreshold = useVirtualScrollThreshold();
  
  // React 18 optimization - defer non-urgent updates
  const deferredData = useDeferredValue(data);
  
  // Use either baseColumns or columns prop (for backwards compatibility)
  // Ensure we always have an array, even if both props are undefined
  const baseColumns = baseColumnsProp || columnsProp || [];

  // Debug log removed

  // Build dynamic columns from custom columns - Memoized heavily
  const dynamicColumns = useMemo((): ColumnDef<T>[] => {
    return customColumns.map((col) => {
      const baseColumn: ColumnDef<T> = {
        id: `custom_${col.column_key}`,
        header: col.column_name,
        accessorKey: `custom_data.${col.column_key}` as keyof T & string,
        sortable: true,
        editable: true,
      };

      // Set edit type based on column type
      switch (col.column_type) {
        case 'text':
          baseColumn.editType = 'text';
          baseColumn.cell = (value) => (
            value ? <span className="text-sm">{value}</span> : null
          );
          break;

        case 'number':
          baseColumn.editType = 'text';
          baseColumn.cell = (value) => (
            value != null ? <span className="text-sm font-medium tabular-nums">{value}</span> : null
          );
          break;

        case 'date':
          baseColumn.editType = 'date';
          baseColumn.cell = (value) => (
            value ? (
              <span className="text-sm">
                {format(new Date(value), 'dd/MM/yyyy', { locale: he })}
              </span>
            ) : null
          );
          break;

        case 'boolean':
          baseColumn.editType = 'checkbox';
          baseColumn.align = 'center';
          baseColumn.cell = (value) => (
            <Badge variant={value ? 'default' : 'secondary'} className={value ? 'bg-success/80' : ''}>
              {value ? 'כן' : 'לא'}
            </Badge>
          );
          break;

        case 'select':
          baseColumn.editType = 'enhanced-select';
          baseColumn.editOptions = (col.column_options || []).map((opt: string) => ({
            value: opt,
            label: opt,
            color: '#6b7280',
            bgColor: '#f3f4f6',
          }));
          baseColumn.cell = (value) => (
            value ? <Badge variant="outline">{value}</Badge> : null
          );
          break;

        case 'data_type':
          // Use enhanced-select for data_type columns to show colored options in dropdown
          baseColumn.editType = 'enhanced-select';
          baseColumn.editOptions = (dataTypeOptions[col.column_key] || []).map(opt => ({
            value: opt.value,
            label: opt.label,
            color: opt.color,
            bgColor: opt.color ? `${opt.color}20` : '#f3f4f6',
          }));
          baseColumn.cell = (value) => {
            const options = dataTypeOptions[col.column_key] || [];
            const option = options.find(o => o.value === value);
            if (!value || !option) {
              return null;
            }
            const optionColor = option.color || '#6b7280';
            return (
              <Badge 
                variant="outline" 
                className="flex items-center gap-2 w-fit px-3 py-1.5 border-2 cursor-default hover:shadow-sm transition-shadow"
                style={{ 
                  borderColor: optionColor,
                  backgroundColor: `${optionColor}15`,
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  data-bg-color={optionColor}
                />
                <span className="font-medium" data-color={optionColor}>
                  {option.label}
                </span>
              </Badge>
            );
          };
          break;
      }

      return baseColumn;
    });
  }, [customColumns, dataTypeOptions, getDataTypeDisplayValue]);

  // Check which custom columns have any data
  const columnsWithData = useMemo(() => {
    const columnsSet = new Set<string>();
    deferredData.forEach(row => {
      if (row.custom_data) {
        Object.entries(row.custom_data).forEach(([key, value]) => {
          if (value != null && value !== '' && value !== false) {
            columnsSet.add(key);
          }
        });
      }
    });
    return columnsSet;
  }, [deferredData]);
  
  // Get empty custom columns for deletion option (excluding required columns)
  const emptyCustomColumns = useMemo(() => {
    return customColumns.filter(col => 
      !columnsWithData.has(col.column_key) && col.is_required !== true
    );
  }, [customColumns, columnsWithData]);

  // Filter dynamic columns based on hideEmptyColumns setting
  const filteredDynamicColumns = useMemo(() => {
    if (!hideEmptyColumns) return dynamicColumns;
    return dynamicColumns.filter(col => {
      const columnKey = col.id?.replace('custom_', '') || '';
      return columnsWithData.has(columnKey);
    });
  }, [dynamicColumns, hideEmptyColumns, columnsWithData]);

  // Combine base columns with dynamic columns
  const allColumns = useMemo((): ColumnDef<T>[] => {
    // Ensure baseColumns is always an array
    const columns = baseColumns || [];
    
    // Find the actions column (usually last)
    const actionsColumnIndex = columns.findIndex(c => c.id === 'actions');
    
    if (actionsColumnIndex >= 0) {
      // Insert custom columns before the actions column
      return [
        ...columns.slice(0, actionsColumnIndex),
        ...filteredDynamicColumns,
        columns[actionsColumnIndex],
      ];
    }
    
    // No actions column, just append
    return [...columns, ...filteredDynamicColumns];
  }, [baseColumns, filteredDynamicColumns]);

  // Handle cell edit for custom columns
  const handleCellEdit = useCallback(async (row: T, columnId: string, value: any) => {
    // Check if this is a custom column
    if (columnId.startsWith('custom_')) {
      const columnKey = columnId.replace('custom_', '');
      const { error } = await updateCustomData(row.id, columnKey, value);
      
      if (error) {
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לעדכן את הערך',
          variant: 'destructive',
        });
      }
    } else {
      // Pass to parent handler
      onCellEdit?.(row, columnId, value);
    }
  }, [updateCustomData, onCellEdit]);

  // Handle column added - column was already saved by AddColumnDialog, just refresh
  const handleColumnAdded = useCallback(async (column: CustomColumn) => {
    await addColumn(column);
  }, [addColumn]);

  // Handle bulk columns added
  const handleBulkColumnsAdded = useCallback(async (columns: CustomColumn[], groupName?: string) => {
    const { error } = await addColumnsInBulk(columns, groupName);
    
    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף את העמודות',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'העמודות נוספו בהצלחה',
        description: `${columns.length} עמודות נוספו לטבלה${groupName ? ` בקבוצה "${groupName}"` : ''}`,
      });
    }
  }, [addColumnsInBulk]);

  // Handle template columns added - wrapper that converts ColumnConfig[] to CustomColumn[]
  const handleTemplateColumnsAdded = useCallback((columns: any[]) => {
    // Convert ColumnConfig format from CustomTemplateManager to CustomColumn format
    const customColumns: CustomColumn[] = columns.map(col => ({
      table_name: tableName,
      column_key: col.column_key,
      column_name: col.column_name,
      column_type: col.column_type,
      column_options: col.column_options || [],
      is_required: col.is_required || false,
      default_value: col.default_value || '',
      data_type_id: col.data_type_id,
    }));
    
    // Call the bulk add function without group name (templates don't have groups)
    handleBulkColumnsAdded(customColumns);
  }, [tableName, handleBulkColumnsAdded]);

  // Handle column delete
  const handleDeleteColumn = useCallback(async () => {
    if (!deleteColumnDialog.column?.id) return;

    // Check if column is required
    if (deleteColumnDialog.column.is_required) {
      toast({
        title: 'לא ניתן למחוק',
        description: 'עמודה זו מסומנת כעמודת חובה ולא ניתן למחוק אותה',
        variant: 'destructive',
      });
      setDeleteColumnDialog({ open: false, column: null });
      return;
    }

    const { error } = await deleteColumn(deleteColumnDialog.column.id);
    
    if (error) {
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן למחוק את העמודה',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'העמודה נמחקה',
        description: `העמודה "${deleteColumnDialog.column.column_name}" נמחקה בהצלחה`,
      });
    }
    
    setDeleteColumnDialog({ open: false, column: null });
  }, [deleteColumnDialog.column, deleteColumn, toast]);

  // Handle quick add rows
  const handleQuickAddRows = useCallback((rows: Record<string, any>[]) => {
    // For now, just show a toast - actual implementation depends on the table's data source
    toast({
      title: 'שורות נוספו',
      description: `${rows.length} שורות נוספו בהצלחה`,
    });
    setIsQuickAddRowsOpen(false);
  }, []);

  // Helper function to generate a valid column key (slug)
  const generateColumnKey = useCallback((name: string, existingKeys: string[]): string => {
    // Replace spaces with underscores, remove non-alphanumeric/unicode chars, lowercase
    let baseKey = name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\p{L}\p{N}_]/gu, '') // Keep unicode letters/numbers and underscores
      .trim();
    
    // If empty (e.g., all special chars), generate fallback
    if (!baseKey) {
      baseKey = `col_${Date.now()}`;
    }
    
    // Ensure uniqueness
    let finalKey = baseKey;
    let counter = 2;
    while (existingKeys.includes(finalKey)) {
      finalKey = `${baseKey}_${counter}`;
      counter++;
    }
    
    return finalKey;
  }, []);

  // Handle quick add columns - use addColumnsInBulk to save to DB
  const handleQuickAddColumns = useCallback(async (columns: Array<{ name: string; type: string }>) => {
    try {
      // Get existing column keys to ensure uniqueness
      const existingKeys = customColumns.map(c => c.column_key);
      const existingCount = customColumns.length;
      
      // Build new columns array with unique keys
      const columnsToInsert: CustomColumn[] = columns.map((col, index) => {
        // Collect all keys we've generated so far in this batch too
        const allUsedKeys = [...existingKeys];
        for (let i = 0; i < index; i++) {
          // Add keys from previous columns in this batch
          allUsedKeys.push(generateColumnKey(columns[i].name, existingKeys));
        }
        
        const columnKey = generateColumnKey(col.name, allUsedKeys);
        
        return {
          table_name: tableName,
          column_key: columnKey,
          column_name: col.name,
          column_type: col.type as 'text' | 'number' | 'date' | 'boolean' | 'select',
          column_options: [],
          is_required: false,
          default_value: '',
          column_order: existingCount + index,
        };
      });
      
      const { error } = await addColumnsInBulk(columnsToInsert);
      
      if (error) {
        console.error('Quick add columns error:', error);
        toast({
          title: 'שגיאה',
          description: 'לא ניתן להוסיף את העמודות',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'עמודות נוספו',
          description: `${columns.length} עמודות נוספו בהצלחה`,
        });
      }
    } catch (err) {
      console.error('Quick add columns exception:', err);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהוספת עמודות',
        variant: 'destructive',
      });
    }
    setIsQuickAddColumnsOpen(false);
  }, [addColumnsInBulk, tableName, customColumns, generateColumnKey]);

  return (
    <div className="space-y-4">
      {/* Column Management Bar */}
      {canAddColumns && (
        <div className="flex items-center justify-end gap-2 flex-wrap">
            {/* Hide empty columns toggle */}
            {emptyCustomColumns.length > 0 && (
              <Button
                variant={hideEmptyColumns ? "default" : "outline"}
                size="sm"
                onClick={() => setHideEmptyColumns(!hideEmptyColumns)}
                className="gap-2"
              >
                {hideEmptyColumns ? 'הצג עמודות ריקות' : 'הסתר עמודות ריקות'}
                <Badge variant="secondary" className="text-xs">
                  {emptyCustomColumns.length}
                </Badge>
              </Button>
            )}
            
            {customColumns.length > 0 && canDeleteColumns && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <Settings2 className="h-4 w-4" />
                    {customColumns.length} עמודות מותאמות
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-popover text-popover-foreground border border-border shadow-lg z-50">
                  {/* Delete all empty columns option */}
                  {emptyCustomColumns.length > 0 && (
                    <>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                        onSelect={async () => {
                          if (confirm(`האם אתה בטוח שברצונך למחוק ${emptyCustomColumns.length} עמודות ריקות?`)) {
                            for (const col of emptyCustomColumns) {
                              if (col.id) await deleteColumn(col.id);
                            }
                            toast({
                              title: 'עמודות ריקות נמחקו',
                              description: `${emptyCustomColumns.length} עמודות ריקות נמחקו בהצלחה`,
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        מחק כל העמודות הריקות ({emptyCustomColumns.length})
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {customColumns.map((col) => {
                    const isEmpty = !columnsWithData.has(col.column_key);
                    const isRequired = col.is_required === true;
                    return (
                      <DropdownMenuItem
                        key={col.id}
                        className="flex items-center justify-between gap-3"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <span className={cn("flex-1 truncate", isEmpty && "text-muted-foreground")}>
                          {col.column_name}
                          {isEmpty && <span className="text-xs mr-2">(ריק)</span>}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Toggle required/optional */}
                          <button
                            onClick={async () => {
                              const newRequired = !isRequired;
                              const { error } = await updateColumnRequired(col.id!, newRequired);
                              if (error) {
                                toast({
                                  title: 'שגיאה',
                                  description: 'לא ניתן לעדכן את סטטוס העמודה',
                                  variant: 'destructive',
                                });
                              } else {
                                toast({
                                  title: newRequired ? 'עמודה הוגדרה כחובה' : 'עמודה הוגדרה כרשות',
                                  description: `העמודה "${col.column_name}" עודכנה בהצלחה`,
                                });
                              }
                            }}
                            className={cn(
                              "px-2 py-0.5 text-xs rounded-full transition-colors",
                              isRequired 
                                ? "bg-primary text-primary-foreground hover:bg-primary/80" 
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                            title={isRequired ? "לחץ להגדיר כרשות" : "לחץ להגדיר כחובה"}
                          >
                            {isRequired ? "חובה" : "רשות"}
                          </button>
                          {/* Delete button - only for non-required columns */}
                          {!isRequired && (
                            <button
                              onClick={() => setDeleteColumnDialog({ open: true, column: col })}
                              className="p-1 hover:text-destructive transition-colors"
                              aria-label={`מחק עמודה ${col.column_name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          
          <Button            variant="outline"
            size="sm"
            onClick={() => setIsTemplateManagerOpen(true)}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            מנהל תבניות
          </Button>
          
          <Button            variant="outline"
            size="sm"
            onClick={() => setIsBulkWizardOpen(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            הוסף קבוצת עמודות
          </Button>

          <Button            variant="outline"
            size="sm"
            onClick={() => setIsAddColumnOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            הוסף עמודה
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={deferredData}
        columns={allColumns}
        variant={variant}
        paginated={paginated}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        globalSearch={globalSearch}
        columnToggle={columnToggle}
        exportable={exportable}
        filterable={filterable}
        striped={striped}
        showSummary={showSummary}
        selectable={selectable}
        emptyMessage={emptyMessage}
        loading={loading || data !== deferredData || columnsLoading}
        onRowClick={onRowClick}
        onCellEdit={handleCellEdit}
        virtualScrollThreshold={virtualScrollThreshold}
        // Cell formatting props (enables right-click context menu)
        cellFormatting={cellFormatting}
        onCellStyleChange={handleCellStyleChange}
        onCellNoteChange={handleCellNoteChange}
        onCellReminderAdd={handleCellReminderAdd}
        onCellReminderUpdate={handleCellReminderUpdate}
        onCellReminderDelete={handleCellReminderDelete}
        // Column management props
        onAddColumn={canAddColumns ? () => setIsAddColumnOpen(true) : undefined}
        onDeleteColumn={canDeleteColumns ? (columnId: string) => {
          const col = customColumns.find(c => `custom_${c.column_key}` === columnId);
          if (col) setDeleteColumnDialog({ open: true, column: col });
        } : undefined}
        onDeleteColumns={canDeleteColumns ? (columnIds: string[]) => {
          // Delete multiple columns
          columnIds.forEach(async (columnId) => {
            const col = customColumns.find(c => `custom_${c.column_key}` === columnId);
            if (col?.id) await deleteColumn(col.id);
          });
        } : undefined}
        onQuickAddRows={canAddColumns ? () => setIsQuickAddRowsOpen(true) : undefined}
        onQuickAddColumns={canAddColumns ? () => setIsQuickAddColumnsOpen(true) : undefined}
      />

      {/* Add Column Dialog */}
      <AddColumnDialog
        open={isAddColumnOpen}
        onOpenChange={setIsAddColumnOpen}
        tableName={tableName}
        onColumnAdded={handleColumnAdded}
        existingColumns={customColumns}
      />

      {/* Bulk Column Wizard */}
      <BulkColumnWizard
        open={isBulkWizardOpen}
        onOpenChange={setIsBulkWizardOpen}
        tableName={tableName}
        onColumnsAdded={handleBulkColumnsAdded}
        existingColumns={customColumns}
      />

      {/* Custom Template Manager */}
      <CustomTemplateManager
        open={isTemplateManagerOpen}
        onOpenChange={setIsTemplateManagerOpen}
        tableName={tableName}
        onColumnsAdded={handleTemplateColumnsAdded}
        existingColumns={customColumns.map(c => c.column_key)}
      />

      {/* Delete Column Confirmation */}
      <AlertDialog 
        open={deleteColumnDialog.open} 
        onOpenChange={(open) => setDeleteColumnDialog({ open, column: open ? deleteColumnDialog.column : null })}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת עמודה</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את העמודה "{deleteColumnDialog.column?.column_name}"?
              <br />
              <span className="text-destructive font-medium">
                פעולה זו תמחק את כל הנתונים בעמודה זו ולא ניתן לשחזרם.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteColumn}
              className="bg-destructive hover:bg-destructive/90"
            >
              מחק עמודה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Add Rows Dialog */}
      <QuickAddRowsDialog
        open={isQuickAddRowsOpen}
        onOpenChange={setIsQuickAddRowsOpen}
        columns={allColumns}
        onRowsAdd={handleQuickAddRows}
      />

      {/* Quick Add Columns Dialog */}
      <QuickAddColumnsDialog
        open={isQuickAddColumnsOpen}
        onOpenChange={setIsQuickAddColumnsOpen}
        existingColumns={allColumns}
        onColumnsAdd={handleQuickAddColumns}
      />
    </div>
  );
}
