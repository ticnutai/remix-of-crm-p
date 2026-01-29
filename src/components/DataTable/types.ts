// DataTable Matrix Pro - Type Definitions

export type SortDirection = 'asc' | 'desc' | null;

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  bgColor?: string;
  icon?: string;
}

export interface ColumnDef<T = any> {
  id: string;
  header: string | React.ReactNode;
  subHeader?: string;
  accessorKey: keyof T | string;
  cell?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  hidden?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'right' | 'center' | 'left';
  sticky?: 'right' | 'left';
  groupable?: boolean;
  // For summary calculations
  summary?: 'sum' | 'avg' | 'count' | 'min' | 'max' | ((values: any[]) => any);
  // Cell editing
  editable?: boolean;
  editType?: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'enhanced-select';
  editOptions?: SelectOption[];
  // Header editing
  headerEditable?: boolean;
  onHeaderChange?: (newHeader: string) => void;
  // Enhanced select options
  allowAddOptions?: boolean;
  onOptionsChange?: (options: SelectOption[]) => void;
}

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export interface FilterState {
  columnId: string;
  value: string | number | boolean | null;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
}

// Cell formatting types
export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  align?: 'left' | 'center' | 'right';
}

export interface CellNote {
  id: string;
  text: string;
  createdAt: Date;
}

export interface CellReminder {
  id: string;
  text: string;
  dueDate: Date;
  completed: boolean;
}

export interface CellFormatting {
  styles: Record<string, CellStyle>;
  notes: Record<string, CellNote>;
  reminders: Record<string, CellReminder[]>;
}

// Field-level metadata for tracking creation/update timestamps
export interface FieldMetadataEntry {
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export type FieldMetadata = Record<string, FieldMetadataEntry>;

export interface DataTableProps<T = any> {
  data: T[];
  columns: ColumnDef<T>[];
  // Styling
  variant?: 'default' | 'gold' | 'navy' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  striped?: boolean;
  bordered?: boolean;
  // Features
  selectable?: boolean;
  multiSelect?: boolean;
  expandable?: boolean;
  expandedContent?: (row: T) => React.ReactNode;
  // Sorting
  sortable?: boolean;
  defaultSort?: SortState[];
  onSortChange?: (sorts: SortState[]) => void;
  // Filtering
  filterable?: boolean;
  globalSearch?: boolean;
  onFilterChange?: (filters: FilterState[]) => void;
  // Pagination
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  // Events
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  onSelectionChange?: (selected: T[]) => void;
  onCellEdit?: (row: T, columnId: string, newValue: any) => void;
  // Loading
  loading?: boolean;
  // Empty state
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  // Export
  exportable?: boolean;
  exportFilename?: string;
  // Column management
  columnReorder?: boolean;
  columnResize?: boolean;
  columnToggle?: boolean;
  // Grouping
  groupBy?: string;
  // Summary row
  showSummary?: boolean;
  // Virtual scrolling for large datasets
  virtualScroll?: boolean;
  virtualScrollThreshold?: number;
  rowHeight?: number;
  // Keyboard navigation
  keyboardNavigation?: boolean;
  // Cell formatting
  cellFormatting?: CellFormatting;
  onCellStyleChange?: (cellId: string, style: CellStyle) => void;
  onCellNoteChange?: (cellId: string, note: CellNote | null) => void;
  onCellReminderAdd?: (cellId: string, reminder: Omit<CellReminder, 'id'>) => void;
  onCellReminderUpdate?: (cellId: string, reminder: CellReminder) => void;
  onCellReminderDelete?: (cellId: string, reminderId: string) => void;
  // Multi-cell selection
  multiCellSelect?: boolean;
  onCellSelectionChange?: (selectedCells: Set<string>) => void;
  // Freeze rows
  frozenRows?: number;
  onFrozenRowsChange?: (count: number) => void;
  // Cell merging
  mergedCells?: Array<{ id: string; startRow: number; endRow: number; startColumn: string; endColumn: string; }>;
  onMergeCells?: (cells: Set<string>) => void;
  onUnmergeCells?: (mergeId: string) => void;
  // Column management callbacks
  onAddColumn?: () => void;
  onRenameColumn?: (columnId: string, newName: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onDeleteColumns?: (columnIds: string[]) => void;
  // Quick add callbacks - these open dialogs, not handle data directly
  onQuickAddRows?: () => void;
  onQuickAddColumns?: () => void;
  // Field metadata for Ctrl+Click display
  rowFieldMetadata?: (row: T) => FieldMetadata | undefined;

  /**
   * Optional: render the table toolbar into an external DOM node (by id).
   * Useful for placing all controls in a single page-level header row.
   */
  toolbarPortalId?: string;
}

export interface DataTableState<T = any> {
  data: T[];
  filteredData: T[];
  sortedData: T[];
  displayData: T[];
  selectedRows: Set<number>;
  expandedRows: Set<number>;
  sorts: SortState[];
  filters: FilterState[];
  globalSearchTerm: string;
  currentPage: number;
  pageSize: number;
  columnWidths: Record<string, number>;
  columnOrder: string[];
  hiddenColumns: Set<string>;
  editingCell: { rowIndex: number; columnId: string } | null;
}

export interface Preset {
  id: string;
  name: string;
  filters: FilterState[];
  sorts: SortState[];
  hiddenColumns: string[];
  columnOrder: string[];
}
