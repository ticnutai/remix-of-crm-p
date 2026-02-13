import React, { useState, useRef, useEffect } from "react";
import { ColumnDef } from "../types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StickyNote, Bell } from "lucide-react";
import {
  CellContextMenu,
  CellStyle,
  CellNote,
  CellReminder,
} from "./CellContextMenu";
import { EnhancedSelect, EnhancedSelectCell } from "./EnhancedSelect";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FieldMetadataPopover } from "@/components/shared/FieldMetadataPopover";
import { FieldMetadataEntry } from "@/hooks/useFieldMetadata";

interface TableCellProps<T> {
  column: ColumnDef<T>;
  row: T;
  rowIndex: number;
  value: any;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: (newValue: any) => void;
  onCancelEdit: () => void;
  isFocused?: boolean;
  isSelected?: boolean;
  // Cell formatting props
  cellStyle?: CellStyle;
  cellNote?: CellNote;
  cellReminders?: CellReminder[];
  onStyleChange?: (cellId: string, style: CellStyle) => void;
  onNoteChange?: (cellId: string, note: CellNote | null) => void;
  onReminderAdd?: (cellId: string, reminder: Omit<CellReminder, "id">) => void;
  onReminderUpdate?: (cellId: string, reminder: CellReminder) => void;
  onReminderDelete?: (cellId: string, reminderId: string) => void;
  // Selection handlers
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  // Merge support
  rowSpan?: number;
  colSpan?: number;
  // Column width for alignment
  columnWidth?: number;
  // Field metadata for Ctrl+Click display
  fieldMetadata?: FieldMetadataEntry | null;
  // Sticky first column (RTL)
  isFirstColumn?: boolean;
  // Index for calculating sticky position when multiple columns are frozen
  columnIndex?: number;
  // Number of frozen columns
  frozenColumns?: number;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function TableCell<T>({
  column,
  row,
  rowIndex,
  value,
  isEditing,
  onStartEdit,
  onEndEdit,
  onCancelEdit,
  isFocused,
  isSelected,
  cellStyle = {},
  cellNote,
  cellReminders = [],
  onStyleChange,
  onNoteChange,
  onReminderAdd,
  onReminderUpdate,
  onReminderDelete,
  onMouseDown,
  onMouseEnter,
  rowSpan,
  colSpan,
  columnWidth,
  fieldMetadata,
  isFirstColumn,
  columnIndex = 0,
  frozenColumns = 0,
}: TableCellProps<T>) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellId = `${rowIndex}-${column.id}`;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onEndEdit(editValue);
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  const handleCopy = () => {
    const textValue = value?.toString() || "";
    navigator.clipboard.writeText(textValue);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onEndEdit(text);
    } catch (error) {
      console.error("Failed to paste:", error);
    }
  };

  const handleDelete = () => {
    onEndEdit("");
  };

  const renderEditingContent = () => {
    switch (column.editType) {
      case "enhanced-select":
        return (
          <EnhancedSelect
            value={String(editValue)}
            options={column.editOptions || []}
            onChange={(val) => {
              setEditValue(val);
              onEndEdit(val);
            }}
            onOptionsChange={column.onOptionsChange}
            allowAddOptions={column.allowAddOptions}
            className="w-full"
            autoOpen={true}
          />
        );

      case "select":
        return (
          <Select
            value={String(editValue)}
            onValueChange={(val) => {
              setEditValue(val);
              onEndEdit(val);
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              {column.editOptions?.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: opt.bgColor || "#f3f4f6",
                      color: opt.color || "#374151",
                    }}
                  >
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <Checkbox
            checked={Boolean(editValue)}
            onCheckedChange={(checked) => {
              setEditValue(checked);
              onEndEdit(checked);
            }}
          />
        );

      case "number":
        return (
          <Input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            onBlur={() => onEndEdit(editValue)}
            className="h-8 text-sm"
          />
        );

      case "date":
        return (
          <Input
            ref={inputRef}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onEndEdit(editValue)}
            className="h-8 text-sm"
          />
        );

      default: // text
        return (
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onEndEdit(editValue)}
            className="h-8 text-sm"
          />
        );
    }
  };

  const renderDisplayContent = () => {
    if (column.cell) {
      return column.cell(value, row, rowIndex);
    }

    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (typeof value === "boolean") {
      return value ? "✓" : "✗";
    }

    return String(value);
  };

  // Get plain text for tooltip
  const getPlainTextValue = (): string => {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "boolean") return value ? "✓" : "✗";
    return String(value);
  };

  const tooltipText = getPlainTextValue();

  // Build inline styles from cellStyle
  const inlineStyles: React.CSSProperties = {
    fontWeight: cellStyle.bold ? "bold" : undefined,
    fontStyle: cellStyle.italic ? "italic" : undefined,
    textDecoration: cellStyle.underline ? "underline" : undefined,
    color: cellStyle.color,
    backgroundColor:
      cellStyle.backgroundColor && cellStyle.backgroundColor !== "transparent"
        ? cellStyle.backgroundColor
        : undefined,
    textAlign: cellStyle.align,
    width: columnWidth ? `${columnWidth}px` : "auto",
    minWidth: columnWidth ? `${columnWidth}px` : "80px",
    maxWidth: columnWidth ? `${columnWidth}px` : undefined,
  };

  // Check if this column should be frozen (RTL - frozen columns are from the right)
  const isFrozenColumn = frozenColumns > 0 && columnIndex < frozenColumns;

  // Calculate right position for stacked frozen columns (RTL)
  // Each frozen column needs to be positioned after the previous ones
  const getFrozenColumnPosition = () => {
    if (!isFrozenColumn) return undefined;
    // For RTL: first column (index 0) is at right: 0, second at right: width of first, etc.
    // Using a fixed width estimate for now, can be improved with actual widths
    return columnIndex * (columnWidth || 150);
  };

  const cellClasses = cn(
    "p-3 text-sm transition-all duration-150 border-b border-table-border relative group",
    "overflow-hidden text-ellipsis whitespace-nowrap",
    column.align === "center" && "text-center",
    column.align === "left" && "text-left",
    column.align === "right" && "text-right",
    !column.align && "text-right", // RTL default
    isFocused && "ring-2 ring-inset ring-secondary",
    isSelected && "bg-table-row-selected",
    column.editable && !isEditing && "cursor-pointer hover:bg-table-row-hover",
    // Sticky frozen columns for RTL
    isFrozenColumn && "sticky z-10 bg-background",
    // Add shadow only to the last frozen column
    isFrozenColumn &&
      columnIndex === frozenColumns - 1 &&
      "shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]",
  );

  const hasIndicators = cellNote || cellReminders.length > 0;

  const cellInner = (
    <div
      className="flex items-center gap-1 overflow-hidden"
      title={tooltipText}
    >
      <div className="flex-1 truncate min-w-0">
        {isEditing ? renderEditingContent() : renderDisplayContent()}
      </div>

      {/* Indicators for notes and reminders */}
      {hasIndicators && !isEditing && (
        <div className="flex items-center gap-0.5 opacity-70">
          {cellNote && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <StickyNote className="h-3 w-3 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{cellNote.text}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {cellReminders.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Bell className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] text-blue-500">
                      {cellReminders.length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    {cellReminders.map((r) => (
                      <p key={r.id} className="text-sm">
                        {r.text} -{" "}
                        {new Date(r.dueDate).toLocaleDateString("he-IL")}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );

  const cellContent = (
    <td
      className={cellClasses}
      style={{
        ...inlineStyles,
        // Add right position for frozen columns in RTL
        ...(isFrozenColumn ? { right: getFrozenColumnPosition() } : {}),
      }}
      onClick={(e) => {
        // Don't start edit on Ctrl+Click (reserved for metadata)
        if (e.ctrlKey || e.metaKey) return;
        if (column.editable && !isEditing) {
          onStartEdit();
        }
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      tabIndex={0}
      rowSpan={rowSpan}
      colSpan={colSpan}
    >
      <FieldMetadataPopover
        metadata={fieldMetadata}
        fieldName={
          typeof column.header === "string" ? column.header : column.id
        }
      >
        {cellInner}
      </FieldMetadataPopover>
    </td>
  );

  // Wrap with context menu if handlers are provided
  if (onStyleChange || onNoteChange || onReminderAdd) {
    return (
      <CellContextMenu
        cellId={cellId}
        cellStyle={cellStyle}
        cellNote={cellNote}
        cellReminders={cellReminders}
        onStyleChange={(style) => onStyleChange?.(cellId, style)}
        onNoteChange={(note) => onNoteChange?.(cellId, note)}
        onReminderAdd={(reminder) => onReminderAdd?.(cellId, reminder)}
        onReminderUpdate={(reminder) => onReminderUpdate?.(cellId, reminder)}
        onReminderDelete={(reminderId) =>
          onReminderDelete?.(cellId, reminderId)
        }
        onCopy={handleCopy}
        onPaste={column.editable ? handlePaste : undefined}
        onDelete={column.editable ? handleDelete : undefined}
      >
        {cellContent}
      </CellContextMenu>
    );
  }

  return cellContent;
}

// Memoize to prevent unnecessary re-renders
export const MemoizedTableCell = React.memo(TableCell) as typeof TableCell;
