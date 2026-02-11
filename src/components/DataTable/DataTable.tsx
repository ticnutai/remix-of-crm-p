import React, { useMemo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DataTableProps } from "./types";
import { useDataTableState } from "./hooks/useDataTableState";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { useVirtualScroll } from "./hooks/useVirtualScroll";
import { useCellSelection } from "./hooks/useCellSelection";
import { TableHeader } from "./components/TableHeader";
import { MemoizedTableCell as TableCell } from "./components/TableCell";
import { TablePagination } from "./components/TablePagination";
import { TableToolbar } from "./components/TableToolbar";
import { TableSkeleton } from "./components/TableSkeleton";
import { EmptyState } from "./components/EmptyState";
import { SummaryRow } from "./components/SummaryRow";
import { ActiveFilters } from "./components/ColumnFilter";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function DataTable<T extends Record<string, any>>(
  props: DataTableProps<T>,
) {
  const {
    columns,
    variant = "default",
    size = "md",
    striped = false,
    bordered = true,
    selectable = false,
    multiSelect = false,
    expandable = false,
    expandedContent,
    sortable = true,
    filterable = true,
    globalSearch = true,
    paginated = true,
    pageSizeOptions,
    onRowClick,
    onRowDoubleClick,
    onSelectionChange,
    onCellEdit,
    loading = false,
    emptyMessage,
    emptyIcon,
    exportable = false,
    exportFilename = "export",
    columnReorder = true,
    columnResize = true,
    columnToggle = true,
    showSummary = false,
    keyboardNavigation = true,
    virtualScroll = false,
    virtualScrollThreshold = 50,
    rowHeight = 48,
    maxViewportHeightOffset = 400,
    // Cell formatting props
    cellFormatting,
    onCellStyleChange,
    onCellNoteChange,
    onCellReminderAdd,
    onCellReminderUpdate,
    onCellReminderDelete,
    // Multi-cell selection
    multiCellSelect = true,
    onCellSelectionChange,
    // Freeze rows
    frozenRows: propFrozenRows,
    onFrozenRowsChange,
    // Cell merging
    mergedCells: propMergedCells,
    onMergeCells,
    onUnmergeCells,
    // Column management
    onAddColumn,
    onRenameColumn,
    onDeleteColumn,
    onDeleteColumns,
    onHideColumn,
    onFreezeColumn,
    onMoveColumnLeft,
    onMoveColumnRight,
    // Header styling
    headerStyles,
    onHeaderStyleChange,
    // Table styling config
    tableStyleConfig,
    onTableStyleChange,
    // Quick add
    onQuickAddRows,
    onQuickAddColumns,
    // Field metadata
    rowFieldMetadata,
    // Toolbar portal
    toolbarPortalId,
  } = props;

  const { state, visibleColumns, totalPages, totalRows, actions } =
    useDataTableState(props);

  // Multi-cell selection hook
  const cellSelection = useCellSelection({
    enabled: multiCellSelect,
    columns: visibleColumns,
    rowCount: state.displayData.length,
  });

  // Local frozen rows state if not controlled
  const [localFrozenRows, setLocalFrozenRows] = useState(propFrozenRows || 0);
  const frozenRows = propFrozenRows ?? localFrozenRows;
  const setFrozenRows = onFrozenRowsChange || setLocalFrozenRows;

  // Local frozen columns state (number of columns to freeze from the right in RTL)
  const [frozenColumns, setFrozenColumns] = useState(0);

  // Optional: portal the toolbar into an external container
  const [toolbarPortalTarget, setToolbarPortalTarget] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!toolbarPortalId) {
      setToolbarPortalTarget(null);
      return;
    }
    setToolbarPortalTarget(document.getElementById(toolbarPortalId));
  }, [toolbarPortalId]);

  // Apply alignment to all selected cells
  const applyAlignmentToSelectedCells = useCallback(
    (align: "left" | "center" | "right") => {
      if (!onCellStyleChange || cellSelection.selectedCells.size === 0) return;

      cellSelection.selectedCells.forEach((cellId) => {
        const currentStyle = cellFormatting?.styles[cellId] || {};
        onCellStyleChange(cellId, { ...currentStyle, align });
      });
    },
    [cellSelection.selectedCells, onCellStyleChange, cellFormatting?.styles],
  );

  // Determine if we should use virtual scrolling (auto-enable for large datasets or explicit)
  // Enable virtualization for datasets > threshold rows when NOT paginated
  const shouldVirtualize = useMemo(() => {
    if (props.paginated) return false; // Pagination handles large datasets differently
    return virtualScroll || state.sortedData.length > virtualScrollThreshold;
  }, [
    virtualScroll,
    state.sortedData.length,
    virtualScrollThreshold,
    props.paginated,
  ]);

  // Virtual scrolling hook - provides efficient rendering for large datasets
  const { parentRef, virtualRows, totalSize, isVirtual } = useVirtualScroll({
    enabled: shouldVirtualize,
    data: state.displayData,
    rowHeight,
    overscan: 5, // Reduced overscan for better performance
  });

  const { tableRef } = useKeyboardNavigation({
    enabled: keyboardNavigation,
    rowCount: state.displayData.length,
    columnCount: visibleColumns.length,
    onEscape: () => {
      actions.setEditingCell(null);
      cellSelection.clearSelection();
    },
  });

  // Handle selection change callback - Memoized for performance
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedData = Array.from(state.selectedRows).map(
        (index) => state.displayData[index],
      );
      onSelectionChange(selectedData);
    }
  }, [state.selectedRows, state.displayData, onSelectionChange]);

  // Export handlers
  const handleExport = useCallback(
    async (format: "csv" | "excel" | "pdf") => {
      const dataToExport = state.sortedData;
      const headers = visibleColumns.map((c) => c.header);
      const rows = dataToExport.map((row) =>
        visibleColumns.map((col) => {
          const value = getNestedValue(row, col.accessorKey as string);
          // Convert complex values to strings
          if (Array.isArray(value)) return value.join(", ");
          if (typeof value === "object" && value !== null)
            return JSON.stringify(value);
          return value;
        }),
      );

      if (format === "csv") {
        const csv = [
          headers.join(","),
          ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");
        const blob = new Blob(["\ufeff" + csv], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${exportFilename}.csv`;
        link.click();
      } else if (format === "excel") {
        try {
          const XLSX = await import("xlsx");
          const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Data");
          XLSX.writeFile(wb, `${exportFilename}.xlsx`);
        } catch (error) {
          console.error("Excel export failed:", error);
        }
      } else if (format === "pdf") {
        try {
          const { default: jsPDF } = await import("jspdf");
          await import("jspdf-autotable");

          const doc = new jsPDF({ orientation: "landscape" });

          // Add RTL support
          doc.setR2L(true);

          // Use autotable
          (doc as any).autoTable({
            head: [headers],
            body: rows,
            styles: {
              font: "helvetica",
              halign: "right",
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [51, 122, 183],
              halign: "right",
            },
            margin: { top: 20 },
          });

          doc.save(`${exportFilename}.pdf`);
        } catch (error) {
          console.error("PDF export failed:", error);
        }
      }
    },
    [state.sortedData, visibleColumns, exportFilename],
  );

  // Merge tableStyleConfig with props
  const effectiveStriped = tableStyleConfig?.striped ?? striped;
  const effectiveBordered = tableStyleConfig?.bordered ?? bordered;
  const dividers = tableStyleConfig?.dividers ?? 'none';
  const rowGap = tableStyleConfig?.rowGap ?? 0;
  
  // Custom colors from config
  const customColors = {
    headerBg: tableStyleConfig?.headerBgColor,
    headerText: tableStyleConfig?.headerTextColor,
    rowBg: tableStyleConfig?.rowBgColor,
    rowAltBg: tableStyleConfig?.rowAltBgColor,
    divider: tableStyleConfig?.dividerColor,
    hover: tableStyleConfig?.hoverBgColor,
    accent: tableStyleConfig?.accentColor,
  };

  // Table container classes
  const containerClasses = cn(
    "w-full rounded-lg overflow-hidden transition-all duration-200",
    {
      "frame-gold shadow-gold-glow": variant === "gold" && !customColors.accent,
      "frame-navy shadow-navy-glow": variant === "navy" && !customColors.accent,
      "border border-table-border shadow-elegant":
        variant === "default" && effectiveBordered,
      "shadow-elegant": variant === "default" && !effectiveBordered,
      "border-0": variant === "minimal",
    },
  );

  // Row classes with dividers support
  const getRowClasses = (index: number, isSelected: boolean) =>
    cn(
      "transition-colors duration-150",
      !customColors.rowBg && effectiveStriped && index % 2 === 1 && "bg-muted/30",
      isSelected && "bg-table-row-selected",
      !isSelected && !customColors.hover && "hover:bg-table-row-hover",
      onRowClick && "cursor-pointer",
      // Horizontal dividers
      (dividers === 'horizontal' || dividers === 'both') && !customColors.divider && "border-b border-table-border",
    );

  // Row style for custom colors
  const getRowStyle = (index: number, isSelected: boolean): React.CSSProperties => {
    const style: React.CSSProperties = {};
    
    if (customColors.rowBg) {
      style.backgroundColor = effectiveStriped && index % 2 === 1 
        ? (customColors.rowAltBg || customColors.rowBg) 
        : customColors.rowBg;
    }
    
    if (customColors.divider && (dividers === 'horizontal' || dividers === 'both')) {
      style.borderBottom = `1px solid ${customColors.divider}`;
    }
    
    return style;
  };

  // Cell classes with vertical dividers
  const getCellClasses = (colIndex: number, totalCols: number) =>
    cn(
      // Vertical dividers (not on last column)
      (dividers === 'vertical' || dividers === 'both') && 
        colIndex < totalCols - 1 && 
        !customColors.divider && "border-l border-table-border",
    );

  // Cell style for custom divider color
  const getCellStyle = (colIndex: number, totalCols: number): React.CSSProperties => {
    const style: React.CSSProperties = {};
    
    if (customColors.divider && (dividers === 'vertical' || dividers === 'both') && colIndex < totalCols - 1) {
      style.borderLeft = `1px solid ${customColors.divider}`;
    }
    
    return style;
  };

  // Row gap style
  const rowGapStyle = rowGap > 0 ? { marginBottom: `${rowGap}px` } : undefined;

  // Size-based padding - can be overridden by tableStyleConfig
  const getCellPadding = () => {
    if (tableStyleConfig?.cellPadding) {
      return `p-[${tableStyleConfig.cellPadding}px]`;
    }
    if (tableStyleConfig?.compact) {
      return "p-2 text-xs";
    }
    return cellPadding[size];
  };

  // Size-based padding
  const cellPadding = {
    sm: "p-2 text-xs",
    md: "p-3 text-sm",
    lg: "p-4 text-base",
  };

  if (loading) {
    return (
      <div className={containerClasses}>
        {globalSearch && (
          <div className="p-4 border-b border-table-border">
            <div className="h-10 bg-muted rounded skeleton-shimmer w-64" />
          </div>
        )}
        <TableSkeleton rows={5} columns={visibleColumns.length} />
      </div>
    );
  }

  const hasData = state.displayData.length > 0;
  const hasFilters =
    state.filters.length > 0 || state.globalSearchTerm.length > 0;

  const shouldRenderToolbar =
    hasData ||
    globalSearch ||
    columnToggle ||
    exportable ||
    (filterable && hasFilters);

  const toolbarEl = shouldRenderToolbar ? (
    <div
      className={cn(
        "flex items-center gap-2 whitespace-nowrap",
        toolbarPortalId
          ? "w-full px-0 py-0 border-0 bg-transparent flex-row-reverse justify-between"
          : "px-3 py-1.5 border-b border-table-border bg-muted/20 flex-nowrap flex-row-reverse justify-start overflow-x-auto scrollbar-thin",
      )}
      dir="rtl"
    >
      {/* Right side group (in RTL): main actions */}
      <div className="flex items-center gap-2 min-w-max flex-row-reverse">
        {(globalSearch || columnToggle || exportable) && (
          <TableToolbar
            embedded
            showSearch={!!globalSearch}
            globalSearchTerm={state.globalSearchTerm}
            onGlobalSearchChange={actions.setGlobalSearch}
            columns={columns}
            hiddenColumns={state.hiddenColumns}
            onToggleColumn={actions.toggleColumnVisibility}
            onReorderColumns={actions.reorderColumn}
            onAddColumn={onAddColumn}
            onRenameColumn={onRenameColumn}
            onDeleteColumn={onDeleteColumn}
            onDeleteColumns={onDeleteColumns}
            filters={state.filters}
            onClearFilters={actions.clearFilters}
            exportable={exportable}
            onExport={handleExport}
            selectedCount={state.selectedRows.size}
            totalCount={totalRows}
            onQuickAddRows={onQuickAddRows}
            onQuickAddColumns={onQuickAddColumns}
          />
        )}
      </div>

      {/* Left side group: freeze + active filters */}
      <div className="flex items-center gap-2 min-w-max flex-row-reverse">
        {/* Freeze Columns */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={frozenColumns > 0 ? "secondary" : "outline"}
                size="icon"
                onClick={() => setFrozenColumns(frozenColumns > 0 ? 0 : 1)}
                className={cn(
                  "h-8 w-8",
                  frozenColumns > 0 && "text-primary bg-primary/10",
                )}
              >
                {frozenColumns > 0 ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {frozenColumns > 0 ? "ביטול הקפאת עמודה" : "הקפא עמודה"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Freeze Rows */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={frozenRows > 0 ? "secondary" : "outline"}
                size="icon"
                onClick={() => setFrozenRows(frozenRows > 0 ? 0 : 1)}
                className={cn(
                  "h-8 w-8",
                  frozenRows > 0 && "text-primary bg-primary/10",
                )}
              >
                {frozenRows > 0 ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {frozenRows > 0 ? "ביטול הקפאת שורה" : "הקפא שורה"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {filterable && state.filters.length > 0 && (
          <ActiveFilters
            embedded
            filters={state.filters}
            columns={columns}
            onRemoveFilter={(columnId) =>
              actions.setFilter({ columnId, operator: "eq", value: null })
            }
            onClearAll={actions.clearFilters}
          />
        )}
      </div>
    </div>
  ) : null;

  const toolbarRender = toolbarPortalId
    ? toolbarPortalTarget
      ? createPortal(toolbarEl, toolbarPortalTarget)
      : null
    : toolbarEl;

  // Debug logs removed (were causing noise in console)

  return (
    <div className={containerClasses}>
      {/* Toolbar (inline or portaled to external container) */}
      {toolbarRender}

      {/* Table - Virtual scroll container for efficient rendering of large datasets */}
      <div
        ref={parentRef}
        dir="rtl"
        className={cn(
          "overflow-x-auto overflow-y-auto scrollbar-thin rounded-lg border",
          !paginated && "",
        )}
        style={{
          scrollbarWidth: "thin",
          WebkitOverflowScrolling: "touch",
          maxHeight: `calc(100vh - ${maxViewportHeightOffset}px)`,
          overflowAnchor: "none",
        }}
      >
        <table
          ref={tableRef as any}
          className={cn(
            "w-full border-collapse",
            // Add border-separate for row gap support
            rowGap > 0 && "border-separate",
            // Vertical dividers on cells
            (dividers === 'vertical' || dividers === 'both') && "[&_td:not(:last-child)]:border-l [&_td]:border-table-border [&_th:not(:last-child)]:border-l [&_th]:border-table-border",
          )}
          style={{
            tableLayout: "fixed",
            isolation: "isolate",
            minWidth: "max-content",
            borderSpacing: rowGap > 0 ? `0 ${rowGap}px` : undefined,
          }}
          dir="rtl"
        >
          <TableHeader
            columns={visibleColumns}
            sorts={state.sorts}
            onSort={actions.setSort}
            selectable={selectable}
            expandable={expandable}
            allSelected={
              state.displayData.length > 0 &&
              state.selectedRows.size === state.displayData.length
            }
            someSelected={state.selectedRows.size > 0}
            onSelectAll={actions.selectAll}
            variant={variant}
            columnWidths={state.columnWidths}
            onColumnResize={columnResize ? actions.setColumnWidth : undefined}
            // Advanced filtering props
            filterable={filterable}
            filters={state.filters}
            onFilterChange={(filter, columnId) => {
              if (filter) {
                actions.setFilter(filter);
              } else {
                actions.setFilter({ columnId, operator: "eq", value: null });
              }
            }}
            data={state.data}
            // Frozen columns
            frozenColumns={frozenColumns}
            // Header context menu props
            headerStyles={headerStyles}
            onHeaderStyleChange={onHeaderStyleChange}
            onHeaderRename={onRenameColumn}
            onColumnDelete={onDeleteColumn}
            onColumnHide={onHideColumn}
            onColumnFreeze={onFreezeColumn}
            onColumnMoveLeft={onMoveColumnLeft}
            onColumnMoveRight={onMoveColumnRight}
            // Table style config
            headerOpacity={tableStyleConfig?.headerOpacity}
            // Custom colors
            customHeaderBgColor={customColors.headerBg}
            customHeaderTextColor={customColors.headerText}
            customDividerColor={customColors.divider}
          />

          <tbody
            style={
              isVirtual
                ? {
                    height: `${totalSize}px`,
                    position: "relative",
                  }
                : undefined
            }
          >
            {/* Frozen Rows - Fixed sticky positioning */}
            {frozenRows > 0 && hasData && (
              <>
                {state.displayData.slice(0, frozenRows).map((row, rowIndex) => {
                  const isSelected = state.selectedRows.has(rowIndex);
                  // Calculate proper top offset including header height
                  const headerOffset = 48; // Approximate header row height
                  const topOffset = headerOffset + rowIndex * rowHeight;
                  return (
                    <tr
                      key={`frozen-${rowIndex}`}
                      className={cn(
                        getRowClasses(rowIndex, isSelected),
                        !customColors.rowBg && "bg-muted sticky z-[5]",
                        customColors.rowBg && "sticky z-[5]",
                      )}
                      style={{ top: `${topOffset}px`, ...getRowStyle(rowIndex, isSelected) }}
                    >
                      {" "}
                      {/* Checkbox FIRST in RTL = right side */}
                      {selectable && (
                        <td
                          className={cn(
                            "w-12 text-center sticky right-0 z-[7] bg-muted",
                            cellPadding[size],
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              actions.toggleRowSelection(rowIndex)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}{" "}
                      {visibleColumns.map((column, columnIndex) => {
                        const value = getNestedValue(
                          row,
                          column.accessorKey as string,
                        );
                        const cellId = `${rowIndex}-${column.id}`;
                        const isCellSelected = cellSelection.isCellSelected(
                          rowIndex,
                          column.id,
                        );
                        const colWidth =
                          state.columnWidths[column.id] || column.width;
                        // First column (rightmost in RTL) is sticky
                        const isFirstColumn = columnIndex === 0;
                        return (
                          <td
                            key={column.id}
                            className={cn(
                              "p-3 text-sm border-b border-table-border whitespace-nowrap overflow-hidden text-ellipsis bg-muted",
                              isCellSelected &&
                                "ring-2 ring-inset ring-primary bg-primary/10",
                              // Sticky first column for RTL
                              isFirstColumn &&
                                "sticky right-0 z-[6] bg-muted shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]",
                            )}
                            style={{
                              width: colWidth ? `${colWidth}px` : "auto",
                              minWidth: colWidth ? `${colWidth}px` : "80px",
                              maxWidth: colWidth ? `${colWidth}px` : undefined,
                            }}
                          >
                            {column.cell
                              ? column.cell(value, row, rowIndex)
                              : value != null && value !== ""
                                ? String(value)
                                : null}
                          </td>
                        );
                      })}
                      {expandable && (
                        <td className={cn("w-10", cellPadding[size])} />
                      )}
                    </tr>
                  );
                })}
              </>
            )}

            {hasData ? (
              virtualRows.map(({ index: rowIndex, item: row, style }) => {
                // Skip frozen rows in main loop
                if (rowIndex < frozenRows) return null;

                const isSelected = state.selectedRows.has(rowIndex);
                const isExpanded = state.expandedRows.has(rowIndex);

                return (
                  <React.Fragment key={rowIndex}>
                    <tr
                      className={getRowClasses(rowIndex, isSelected)}
                      style={{ ...(isVirtual ? style : undefined), ...getRowStyle(rowIndex, isSelected) }}
                      onClick={() => onRowClick?.(row, rowIndex)}
                      onDoubleClick={() => onRowDoubleClick?.(row, rowIndex)}
                    >
                      {/* Checkbox FIRST in RTL = right side */}
                      {selectable && (
                        <td
                          className={cn(
                            "w-12 text-center sticky right-0 z-[3]",
                            cellPadding[size],
                            isSelected
                              ? "bg-table-row-selected"
                              : striped && rowIndex % 2 === 1
                                ? "bg-muted/30"
                                : "bg-white",
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              actions.toggleRowSelection(rowIndex)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}
                      {visibleColumns.map((column, columnIndex) => {
                        const value = getNestedValue(
                          row,
                          column.accessorKey as string,
                        );
                        const isEditing =
                          state.editingCell?.rowIndex === rowIndex &&
                          state.editingCell?.columnId === column.id;
                        const cellId = `${rowIndex}-${column.id}`;
                        const isCellSelected = cellSelection.isCellSelected(
                          rowIndex,
                          column.id,
                        );
                        const mergeInfo = cellSelection.getMergedCellInfo(
                          rowIndex,
                          column.id,
                        );
                        // First column (rightmost in RTL) - for backward compatibility
                        const isFirstColumn = columnIndex === 0;
                        // Check if this column should be frozen
                        const isFrozenColumn =
                          frozenColumns > 0 && columnIndex < frozenColumns;

                        // Skip cells that are part of a merge but not the origin
                        if (mergeInfo && !mergeInfo.isOrigin) {
                          return null;
                        }

                        // Get field metadata for this cell
                        const fieldMeta =
                          rowFieldMetadata?.(row)?.[
                            column.accessorKey as string
                          ];

                        return (
                          <TableCell
                            key={column.id}
                            column={column}
                            row={row}
                            rowIndex={rowIndex}
                            value={value}
                            isEditing={isEditing}
                            onStartEdit={() =>
                              actions.setEditingCell({
                                rowIndex,
                                columnId: column.id,
                              })
                            }
                            onEndEdit={(newValue) => {
                              onCellEdit?.(row, column.id, newValue);
                              actions.setEditingCell(null);
                            }}
                            onCancelEdit={() => actions.setEditingCell(null)}
                            isSelected={isSelected}
                            isFocused={isCellSelected}
                            // Cell formatting props
                            cellStyle={cellFormatting?.styles[cellId]}
                            cellNote={cellFormatting?.notes[cellId]}
                            cellReminders={cellFormatting?.reminders[cellId]}
                            onStyleChange={onCellStyleChange}
                            onNoteChange={onCellNoteChange}
                            onReminderAdd={onCellReminderAdd}
                            onReminderUpdate={onCellReminderUpdate}
                            onReminderDelete={onCellReminderDelete}
                            // Selection handlers
                            onMouseDown={(e: React.MouseEvent) => {
                              cellSelection.startSelection(
                                { rowIndex, columnId: column.id },
                                e.ctrlKey || e.metaKey,
                              );
                            }}
                            onMouseEnter={() => {
                              if (cellSelection.isSelecting) {
                                cellSelection.extendSelection({
                                  rowIndex,
                                  columnId: column.id,
                                });
                              }
                            }}
                            // Merge info for colspan/rowspan
                            rowSpan={mergeInfo?.rowSpan}
                            colSpan={mergeInfo?.colSpan}
                            // Column width for alignment
                            columnWidth={
                              state.columnWidths[column.id] || column.width
                            }
                            // Field metadata for Ctrl+Click
                            fieldMetadata={fieldMeta}
                            // Sticky first column for RTL
                            isFirstColumn={isFirstColumn}
                            // Frozen columns support
                            columnIndex={columnIndex}
                            frozenColumns={frozenColumns}
                          />
                        );
                      })}

                      {expandable && (
                        <td className={cn("w-10", cellPadding[size])}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.toggleRowExpansion(rowIndex);
                            }}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Expanded content */}
                    {expandable && isExpanded && expandedContent && (
                      <tr className="bg-muted/20">
                        <td
                          colSpan={
                            visibleColumns.length + (selectable ? 1 : 0) + 1
                          }
                          className="p-4"
                        >
                          <div className="animate-fade-in">
                            {expandedContent(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    visibleColumns.length +
                    (selectable ? 1 : 0) +
                    (expandable ? 1 : 0)
                  }
                >
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyMessage || "אין נתונים להצגה"}
                    hasFilters={hasFilters}
                    onClearFilters={actions.clearFilters}
                  />
                </td>
              </tr>
            )}
          </tbody>

          {/* Summary row */}
          {showSummary && hasData && (
            <SummaryRow
              columns={visibleColumns}
              data={state.sortedData}
              selectable={selectable}
            />
          )}
        </table>
      </div>

      {/* Pagination */}
      {paginated && hasData && (
        <TablePagination
          currentPage={state.currentPage}
          totalPages={totalPages}
          pageSize={state.pageSize}
          totalRows={totalRows}
          pageSizeOptions={pageSizeOptions}
          onPageChange={actions.setPage}
          onPageSizeChange={actions.setPageSize}
        />
      )}
    </div>
  );
}

export default DataTable;
