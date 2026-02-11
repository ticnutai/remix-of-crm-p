import React from "react";
import {
  ColumnDef,
  SortState,
  FilterState,
  TableHeaderOpacity,
} from "../types";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnFilter } from "./ColumnFilter";
import { EditableHeader } from "./EditableHeader";
import { HeaderContextMenu, HeaderStyle } from "./HeaderContextMenu";

interface TableHeaderProps<T> {
  columns: ColumnDef<T>[];
  sorts: SortState[];
  onSort: (columnId: string, multiSort: boolean) => void;
  selectable?: boolean;
  expandable?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: () => void;
  variant?: "default" | "gold" | "navy" | "minimal";
  columnWidths: Record<string, number>;
  onColumnResize?: (columnId: string, width: number) => void;
  // New filter props
  filterable?: boolean;
  filters?: FilterState[];
  onFilterChange?: (filter: FilterState | null, columnId: string) => void;
  data?: T[];
  // Frozen columns
  frozenColumns?: number;
  // Header context menu props
  headerStyles?: Record<string, HeaderStyle>;
  onHeaderStyleChange?: (columnId: string, style: HeaderStyle) => void;
  onHeaderRename?: (columnId: string, newName: string) => void;
  onColumnDelete?: (columnId: string) => void;
  onColumnHide?: (columnId: string) => void;
  onColumnFreeze?: (columnId: string) => void;
  onColumnMoveLeft?: (columnId: string) => void;
  onColumnMoveRight?: (columnId: string) => void;
  // Header opacity for sticky headers
  headerOpacity?: TableHeaderOpacity;
  // Custom colors
  customHeaderBgColor?: string;
  customHeaderTextColor?: string;
  customDividerColor?: string;
}

export function TableHeader<T>({
  columns,
  sorts,
  onSort,
  selectable,
  expandable,
  allSelected,
  someSelected,
  onSelectAll,
  variant = "default",
  columnWidths,
  onColumnResize,
  filterable = false,
  filters = [],
  onFilterChange,
  data = [],
  frozenColumns = 0,
  headerStyles = {},
  onHeaderStyleChange,
  onHeaderRename,
  onColumnDelete,
  onColumnHide,
  onColumnFreeze,
  onColumnMoveLeft,
  onColumnMoveRight,
  headerOpacity = "solid",
  customHeaderBgColor,
  customHeaderTextColor,
  customDividerColor,
}: TableHeaderProps<T>) {
  const getSortIcon = (columnId: string) => {
    const sort = sorts.find((s) => s.columnId === columnId);
    if (!sort) return <ArrowUpDown className="h-4 w-4 opacity-40" />;
    if (sort.direction === "asc")
      return <ArrowUp className="h-4 w-4 text-secondary" />;
    return <ArrowDown className="h-4 w-4 text-secondary" />;
  };

  const getSortIndex = (columnId: string) => {
    const index = sorts.findIndex((s) => s.columnId === columnId);
    return index >= 0 && sorts.length > 1 ? index + 1 : null;
  };

  const getColumnFilter = (columnId: string) => {
    return filters.find((f) => f.columnId === columnId);
  };

  const headerClasses = cn("sticky top-0 z-10", {
    // Variant styling (skip if custom colors are set)
    "text-table-header-foreground": !customHeaderTextColor && (variant === "default" || variant === "navy"),
    "text-foreground border-b-2 border-border-gold": !customHeaderBgColor && variant === "gold",
    "text-foreground": !customHeaderTextColor && variant === "minimal",
    // Header opacity - solid background (no transparency) - skip if custom bg
    "bg-table-header":
      !customHeaderBgColor && headerOpacity === "solid" &&
      (variant === "default" || variant === "navy"),
    "bg-secondary/20": !customHeaderBgColor && headerOpacity === "solid" && variant === "gold",
    "bg-muted": !customHeaderBgColor && headerOpacity === "solid" && variant === "minimal",
    // Semi-transparent with blur
    "bg-table-header/80 backdrop-blur-sm":
      !customHeaderBgColor && headerOpacity === "semi" && (variant === "default" || variant === "navy"),
    "bg-secondary/15 backdrop-blur-sm":
      !customHeaderBgColor && headerOpacity === "semi" && variant === "gold",
    "bg-muted/80 backdrop-blur-sm":
      !customHeaderBgColor && headerOpacity === "semi" && variant === "minimal",
    // Transparent with stronger blur
    "bg-table-header/50 backdrop-blur-md":
      !customHeaderBgColor && headerOpacity === "transparent" &&
      (variant === "default" || variant === "navy"),
    "bg-secondary/10 backdrop-blur-md":
      !customHeaderBgColor && headerOpacity === "transparent" && variant === "gold",
    "bg-muted/50 backdrop-blur-md":
      !customHeaderBgColor && headerOpacity === "transparent" && variant === "minimal",
  });

  // Custom header styles
  const headerStyle: React.CSSProperties = {
    ...(customHeaderBgColor && { backgroundColor: customHeaderBgColor }),
    ...(customHeaderTextColor && { color: customHeaderTextColor }),
    ...(customDividerColor && { borderColor: customDividerColor }),
  };

  const handleResize = (
    e: React.MouseEvent<HTMLDivElement>,
    columnId: string,
    startWidth: number,
  ) => {
    e.preventDefault();
    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // RTL Layout: Resize handle is on the LEFT edge of the column.
      // In RTL, columns flow right-to-left, so:
      // - Dragging LEFT (clientX decreases) = EXPAND the column (increase width)
      // - Dragging RIGHT (clientX increases) = SHRINK the column (decrease width)
      //
      // diff = startX - moveEvent.clientX
      // When dragging left: startX > clientX, so diff > 0 = expand
      // When dragging right: startX < clientX, so diff < 0 = shrink
      const diff = startX - moveEvent.clientX;
      const newWidth = Math.max(80, startWidth + diff);
      onColumnResize?.(columnId, newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <thead className={headerClasses} style={headerStyle}>
      <tr>
        {/* Checkbox column - FIRST (right side in RTL) */}
        {selectable && (
          <th
            className={cn("w-12 p-3 text-center sticky right-0 z-20", {
              "bg-table-header": !customHeaderBgColor && (variant === "default" || variant === "navy"),
              "bg-secondary/20": !customHeaderBgColor && variant === "gold",
              "bg-muted": !customHeaderBgColor && variant === "minimal",
            })}
            style={customHeaderBgColor ? { backgroundColor: customHeaderBgColor } : undefined}
          >
            <Checkbox
              checked={allSelected}
              ref={(ref) => {
                if (ref) {
                  (ref as any).indeterminate = someSelected && !allSelected;
                }
              }}
              onCheckedChange={onSelectAll}
              className="border-primary-foreground"
            />
          </th>
        )}
        {columns.map((column, columnIndex) => {
          const width = columnWidths[column.id] || column.width;
          const sortIndex = getSortIndex(column.id);
          const accessorKey = column.accessorKey as string;
          const isFilterable = filterable && column.filterable !== false;
          // First column (rightmost in RTL) is sticky - for backward compatibility
          const isFirstColumn = columnIndex === 0;
          // Check if this column should be frozen
          const isFrozenColumn =
            frozenColumns > 0 && columnIndex < frozenColumns;
          // Calculate right position for stacked frozen columns (RTL)
          const frozenColumnPosition = isFrozenColumn
            ? columnIndex * (width || 150)
            : undefined;

          // Get header style for this column
          const headerStyle = headerStyles[column.id] || {};
          const headerText =
            typeof column.header === "string" ? column.header : column.id;

          const headerContent = (
            <th
              key={column.id}
              className={cn(
                "p-3 font-semibold text-sm transition-colors relative group whitespace-nowrap overflow-hidden text-ellipsis",
                column.align === "center" && "text-center",
                column.align === "left" && "text-left",
                column.align === "right" && "text-right",
                !column.align && "text-right", // RTL default
                column.sortable !== false &&
                  "cursor-pointer hover:bg-primary/10",
                // Sticky frozen columns for RTL
                isFrozenColumn && "sticky z-20 bg-table-header",
                // Add shadow only to the last frozen column
                isFrozenColumn &&
                  columnIndex === frozenColumns - 1 &&
                  "shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]",
                // Apply header style alignment
                headerStyle.align === "center" && "text-center",
                headerStyle.align === "left" && "text-left",
                headerStyle.align === "right" && "text-right",
              )}
              style={{
                width: width ? `${width}px` : "auto",
                minWidth: width ? `${width}px` : "80px",
                maxWidth: width ? `${width}px` : undefined,
                // Add right position for frozen columns in RTL
                ...(isFrozenColumn ? { right: frozenColumnPosition } : {}),
                // Apply header styles
                ...(headerStyle.backgroundColor &&
                headerStyle.backgroundColor !== "transparent"
                  ? { backgroundColor: headerStyle.backgroundColor }
                  : {}),
                ...(headerStyle.color ? { color: headerStyle.color } : {}),
              }}
              onClick={(e) => {
                if (column.sortable !== false) {
                  onSort(accessorKey, e.shiftKey);
                }
              }}
            >
              <div className="flex items-center gap-2 justify-end">
                {/* Filter button - only show on hover or when filter is active */}
                {isFilterable && onFilterChange && (
                  <div
                    className={cn(
                      "transition-opacity",
                      getColumnFilter(accessorKey)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    <ColumnFilter
                      column={column}
                      currentFilter={getColumnFilter(accessorKey)}
                      onFilterChange={(filter) =>
                        onFilterChange(filter, accessorKey)
                      }
                      data={data}
                      variant={variant}
                    />
                  </div>
                )}

                {column.sortable !== false && (
                  <span
                    className={cn(
                      "flex items-center gap-1 transition-opacity",
                      sorts.find((s) => s.columnId === accessorKey)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {getSortIcon(accessorKey)}
                    {sortIndex && (
                      <span className="text-xs bg-secondary text-secondary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                        {sortIndex}
                      </span>
                    )}
                  </span>
                )}
                <div className="flex flex-col items-end">
                  {column.headerEditable &&
                  typeof column.header === "string" ? (
                    <EditableHeader
                      value={column.header}
                      onChange={(newValue) => column.onHeaderChange?.(newValue)}
                      editable={column.headerEditable}
                    />
                  ) : (
                    <span
                      className={cn(
                        headerStyle.bold && "font-bold",
                        headerStyle.italic && "italic",
                        headerStyle.underline && "underline",
                      )}
                    >
                      {column.header}
                    </span>
                  )}
                  {column.subHeader && (
                    <span className="text-xs font-normal opacity-70">
                      {column.subHeader}
                    </span>
                  )}
                </div>
              </div>

              {/* Resize handle - visible on left edge for RTL */}
              {column.resizable !== false && onColumnResize && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-primary/30 transition-colors z-20 flex items-center justify-center"
                  style={{ touchAction: "none" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleResize(e, column.id, width || 150);
                  }}
                >
                  <div className="w-0.5 h-4 bg-border rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </th>
          );

          // Wrap with context menu if handlers are provided
          if (
            onHeaderStyleChange ||
            onHeaderRename ||
            onColumnDelete ||
            onColumnHide
          ) {
            return (
              <HeaderContextMenu
                key={column.id}
                columnId={column.id}
                columnHeader={headerText}
                headerStyle={headerStyle}
                onStyleChange={onHeaderStyleChange}
                onRename={
                  onHeaderRename ||
                  (column.headerEditable
                    ? (id, name) => column.onHeaderChange?.(name)
                    : undefined)
                }
                onDelete={onColumnDelete}
                onHide={onColumnHide}
                onFreeze={onColumnFreeze}
                onMoveLeft={onColumnMoveLeft}
                onMoveRight={onColumnMoveRight}
                onSortAsc={
                  column.sortable !== false
                    ? () => onSort(accessorKey, false)
                    : undefined
                }
                onSortDesc={
                  column.sortable !== false
                    ? () => onSort(accessorKey, false)
                    : undefined
                }
                canDelete={column.deletable !== false}
                canHide={column.hideable !== false}
              >
                {headerContent}
              </HeaderContextMenu>
            );
          }

          return headerContent;
        })}

        {expandable && (
          <th
            className={cn("w-10 p-3", {
              "bg-table-header": variant === "default" || variant === "navy",
              "bg-secondary/20": variant === "gold",
              "bg-muted": variant === "minimal",
            })}
          />
        )}
      </tr>
    </thead>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedTableHeader = React.memo(
  TableHeader,
) as typeof TableHeader;
