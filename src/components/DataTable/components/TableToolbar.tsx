import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  X,
  Download,
  Columns,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  File,
  GripVertical,
  Pencil,
  Trash2,
  Check,
  Plus,
  TableRowsSplit,
} from 'lucide-react';
import { ColumnDef, FilterState } from '../types';
import { cn } from '@/lib/utils';

interface TableToolbarProps<T> {
  embedded?: boolean;
  globalSearchTerm: string;
  onGlobalSearchChange: (term: string) => void;
  columns: ColumnDef<T>[];
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string) => void;
  onReorderColumns?: (fromIndex: number, toIndex: number) => void;
  onRenameColumn?: (columnId: string, newName: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onDeleteColumns?: (columnIds: string[]) => void;
  onAddColumn?: () => void;
  filters: FilterState[];
  onClearFilters: () => void;
  exportable?: boolean;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  onRefresh?: () => void;
  selectedCount?: number;
  totalCount: number;
  // Quick add props
  onQuickAddRows?: () => void;
  onQuickAddColumns?: () => void;
}

export function TableToolbar<T>({
  embedded = false,
  globalSearchTerm,
  onGlobalSearchChange,
  columns,
  hiddenColumns,
  onToggleColumn,
  onReorderColumns,
  onRenameColumn,
  onDeleteColumn,
  onDeleteColumns,
  onAddColumn,
  filters,
  onClearFilters,
  exportable,
  onExport,
  onRefresh,
  selectedCount = 0,
  totalCount,
  onQuickAddRows,
  onQuickAddColumns,
}: TableToolbarProps<T>) {
  const hasActiveFilters = filters.length > 0 || globalSearchTerm.length > 0;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && onReorderColumns) {
      onReorderColumns(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleStartEdit = (column: ColumnDef<T>) => {
    setEditingColumnId(column.id);
    setEditingName(typeof column.header === 'string' ? column.header : column.id);
  };

  const handleSaveEdit = () => {
    if (editingColumnId && onRenameColumn) {
      onRenameColumn(editingColumnId, editingName);
    }
    setEditingColumnId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingColumnId(null);
    setEditingName('');
  };

  const handleToggleColumnSelection = (columnId: string) => {
    setSelectedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedColumns.size === columns.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(columns.map(c => c.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedColumns.size > 0 && onDeleteColumns) {
      onDeleteColumns(Array.from(selectedColumns));
      setSelectedColumns(new Set());
    }
  };

  const handleDeleteSingle = (columnId: string) => {
    setColumnToDelete(columnId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (columnToDelete && onDeleteColumn) {
      onDeleteColumn(columnToDelete);
      setColumnToDelete(null);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        embedded
          ? "flex-nowrap min-w-max"
          : "flex-wrap px-2 py-1.5 border-b border-table-border bg-card"
      )}
      dir="rtl"
    >
      {/* Compact Search */}
      <div className="relative w-[120px]">
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="חיפוש..."
          value={globalSearchTerm}
          onChange={(e) => onGlobalSearchChange(e.target.value)}
          className="pr-7 h-7 text-xs"
        />
        {globalSearchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => onGlobalSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Selection info */}
      {selectedCount > 0 && (
        <div className="text-xs text-muted-foreground bg-secondary/20 px-2 py-0.5 rounded">
          {selectedCount}/{totalCount}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Quick Add Rows - icon only */}
        {onQuickAddRows && (
          <Button
            variant="outline"
            size="icon"
            onClick={onQuickAddRows}
            className="h-7 w-7 border-primary/30 hover:border-primary"
            title="+ שורות"
          >
            <TableRowsSplit className="h-3.5 w-3.5 text-primary" />
          </Button>
        )}

        {/* Quick Add Columns - icon only */}
        {onQuickAddColumns && (
          <Button
            variant="outline"
            size="icon"
            onClick={onQuickAddColumns}
            className="h-7 w-7 border-primary/30 hover:border-primary"
            title="+ עמודות"
          >
            <Columns className="h-3.5 w-3.5 text-primary" />
          </Button>
        )}

        {/* Clear filters - icon only */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearFilters}
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="נקה סינון"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Refresh - icon only */}
        {onRefresh && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh} title="רענן">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Column visibility - icon only */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-7 w-7 border-[#D4AF37]" title="עמודות">
              <Columns className="h-3.5 w-3.5 text-[#D4AF37]" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            dir="rtl"
            className="w-96 p-0 bg-white border border-[#D4AF37] shadow-2xl z-50 rounded-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#D4AF37]/40 bg-gradient-to-l from-[#1e3a8a]/5 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                    <Columns className="h-5 w-5 text-[#D4AF37]" />
                    ניהול עמודות 
                  </h3>
                  <p className="text-sm text-[#1e3a8a]/70 mt-1">גרור לשינוי סדר, בחר למחיקה</p>
                </div>
                {/* Add Column Button */}
                {onAddColumn && (
                  <Button
                    size="sm"
                    onClick={onAddColumn}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#F4BF37] hover:from-[#F4BF37] hover:to-[#D4AF37] text-[#1e3a8a] font-bold shadow-md"
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    הוסף
                  </Button>
                )}
              </div>
              
              {/* Select All & Delete Selected Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#D4AF37]/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex-1 border-[#1e3a8a]/20 hover:bg-[#1e3a8a]/10 text-[#1e3a8a]"
                >
                  <Checkbox
                    checked={selectedColumns.size === columns.length && columns.length > 0}
                    className="ml-2 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                  />
                  {selectedColumns.size === columns.length ? 'בטל הכל' : 'בחר הכל'}
                </Button>
                {selectedColumns.size > 0 && onDeleteColumns && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    מחק ({selectedColumns.size})
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="h-80 bg-white">
              <div className="p-3 space-y-2">
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    onDragOver={(e) => handleDragOver(e, index)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all border",
                      "hover:bg-[#D4AF37]/5 hover:border-[#D4AF37] hover:shadow-md group bg-white",
                      "border-[#1e3a8a]/10",
                      selectedColumns.has(column.id) && "bg-[#D4AF37]/10 border-[#D4AF37]",
                      dragOverIndex === index && "bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg",
                      draggedIndex === index && "opacity-50"
                    )}
                  >
                    {/* Selection Checkbox */}
                    <Checkbox
                      checked={selectedColumns.has(column.id)}
                      onCheckedChange={() => handleToggleColumnSelection(column.id)}
                      className="data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37] border border-[#1e3a8a]/30 w-5 h-5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Drag Handle */}
                    <span
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#D4AF37]/20 transition-colors"
                      title="גרור לסידור"
                    >
                      <GripVertical className="h-5 w-5 text-[#1e3a8a]/40 group-hover:text-[#D4AF37]" />
                    </span>

                    {/* Visibility Checkbox */}
                    <Checkbox
                      checked={!hiddenColumns.has(column.id)}
                      onCheckedChange={() => onToggleColumn(column.id)}
                      className="data-[state=checked]:bg-[#1e3a8a] data-[state=checked]:border-[#1e3a8a] border border-[#1e3a8a]/30 w-4 h-4"
                      title="הצג/הסתר עמודה"
                    />

                    {/* Column Name / Edit Input */}
                    {editingColumnId === column.id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-7 text-sm border-[#D4AF37] focus:ring-[#D4AF37]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={handleSaveEdit}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-base font-medium truncate text-[#1e3a8a]">
                          {typeof column.header === 'string' ? column.header : column.id}
                        </span>

                        {/* Action Icons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {onRenameColumn && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all border border-transparent hover:border-[#D4AF37]/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(column);
                              }}
                              title="עריכת שם"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {onDeleteColumn && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSingle(column.id);
                              }}
                              title="מחיקת עמודה"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-white border border-[#D4AF37]" dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#1e3a8a]">האם למחוק את העמודה?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#1e3a8a]/70">
                פעולה זו תמחק את העמודה ואת כל הנתונים שבה. לא ניתן לבטל פעולה זו.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-[#1e3a8a]/30 text-[#1e3a8a] hover:bg-[#1e3a8a]/10">
                ביטול
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Export */}
        {exportable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-1" />
                ייצוא
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border border-border shadow-lg z-50">
              <DropdownMenuItem onClick={() => onExport?.('csv')}>
                <File className="h-4 w-4 ml-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('excel')}>
                <FileSpreadsheet className="h-4 w-4 ml-2" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                <FileText className="h-4 w-4 ml-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
