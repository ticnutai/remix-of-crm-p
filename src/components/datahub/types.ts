// DataHub Types - מרכז ניהול הנתונים המאוחד

export type DataHubTab = 'import' | 'export' | 'cloud' | 'restore' | 'analyze';

// Import Types
export interface ImportSource {
  id: string;
  name: string;
  type: 'json' | 'excel' | 'csv' | 'google' | 'supabase';
  icon: string;
  description: string;
}

export interface DetectedEntity {
  type: 'clients' | 'projects' | 'time_entries' | 'tasks' | 'meetings' | 'quotes' | 'users' | 'custom_tables' | 'custom_table_data' | 'documents' | 'other';
  count: number;
  fields: string[];
  sample?: any;
  status: 'ready' | 'mapped' | 'error' | 'skipped';
  targetTable?: string;
  fieldMappings?: Record<string, string>;
}

export interface ImportAnalysis {
  sourceFormat: string;
  sourceType: 'archflow' | 'legacy' | 'supabase' | 'excel' | 'csv' | 'unknown';
  totalRecords: number;
  entities: DetectedEntity[];
  duplicateStrategy: 'skip' | 'overwrite' | 'merge';
  createdAt: string;
  rawData?: any;
}

export interface ImportProgress {
  phase: 'analyzing' | 'mapping' | 'validating' | 'importing' | 'complete' | 'error';
  currentEntity?: string;
  processedCount: number;
  totalCount: number;
  successCount: number;
  errorCount: number;
  skipCount: number;
  errors: ImportError[];
  startTime: Date;
  endTime?: Date;
}

export interface ImportError {
  entity: string;
  record?: any;
  message: string;
  details?: string;
}

// Export Types
export interface ExportOptions {
  format: 'json' | 'excel' | 'csv';
  tables: string[];
  includeMetadata: boolean;
  dateRange?: { start: Date; end: Date };
  filters?: Record<string, any>;
}

export interface ExportProgress {
  phase: 'fetching' | 'processing' | 'packaging' | 'downloading' | 'complete' | 'error';
  currentTable?: string;
  processedTables: number;
  totalTables: number;
  totalRecords: number;
}

// Cloud Backup Types
export interface CloudBackup {
  id: string;
  name: string;
  created_at: string;
  created_by?: string;
  size_bytes?: number;
  tables_count: number;
  records_count: number;
  status: 'active' | 'archived' | 'restoring';
  auto_backup?: boolean;
  source?: 'manual' | 'auto' | 'schedule';
}

export interface CloudBackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupTime: string;
  retentionDays: number;
  selectedTables: string[];
}

// Restore Types
export interface RestoreSource {
  type: 'cloud' | 'local' | 'file';
  backup?: CloudBackup;
  file?: File;
  localBackupId?: string;
}

export interface RestoreOptions {
  selectedTables: string[];
  strategy: 'replace' | 'merge' | 'append';
  createBackupFirst: boolean;
}

export interface RestoreProgress {
  phase: 'validating' | 'backing_up' | 'restoring' | 'verifying' | 'complete' | 'error';
  currentTable?: string;
  processedTables: number;
  totalTables: number;
  processedRecords: number;
  totalRecords: number;
}

// Analysis Types
export interface DataAnalysis {
  tableStats: TableStat[];
  totalRecords: number;
  lastUpdated: Date;
  healthScore: number;
  issues: DataIssue[];
  recommendations: string[];
}

export interface TableStat {
  name: string;
  displayName: string;
  icon: string;
  recordCount: number;
  lastModified?: Date;
  sizeEstimate?: number;
  relatedTables?: string[];
}

export interface DataIssue {
  severity: 'low' | 'medium' | 'high';
  type: 'orphan' | 'duplicate' | 'missing_relation' | 'invalid_data';
  table: string;
  count: number;
  description: string;
  suggestedFix?: string;
}

// Field Mapping Types
export interface FieldMapping {
  sourceField: string;
  targetField: string | null;
  transform?: 'none' | 'date' | 'number' | 'boolean' | 'json' | 'custom';
  customTransform?: string;
  required: boolean;
  validated: boolean;
  sampleValue?: any;
}

export interface EntityMapping {
  sourceEntity: string;
  targetTable: string;
  fieldMappings: FieldMapping[];
  strategy: 'skip_duplicates' | 'update_duplicates' | 'always_insert';
  matchFields: string[]; // Fields used to detect duplicates
}

// Common DB Tables Info
export const DB_TABLES = {
  clients: { name: 'clients', displayName: '👥 לקוחות', icon: 'Users' },
  projects: { name: 'projects', displayName: '📁 פרויקטים', icon: 'FolderKanban' },
  time_entries: { name: 'time_entries', displayName: '⏱️ רישומי זמן', icon: 'Clock' },
  tasks: { name: 'tasks', displayName: '📋 משימות', icon: 'CheckSquare' },
  meetings: { name: 'meetings', displayName: '📅 פגישות', icon: 'Calendar' },
  quotes: { name: 'quotes', displayName: '📝 הצעות מחיר', icon: 'FileText' },
  profiles: { name: 'profiles', displayName: '👤 פרופילים', icon: 'User' },
  client_custom_tabs: { name: 'client_custom_tabs', displayName: '🗂️ טאבים מותאמים', icon: 'Tabs' },
  client_tab_columns: { name: 'client_tab_columns', displayName: '📊 עמודות מותאמות', icon: 'Columns' },
  custom_tables: { name: 'custom_tables', displayName: '📋 טבלאות מותאמות', icon: 'Table' },
  custom_table_data: { name: 'custom_table_data', displayName: '📝 נתוני טבלאות', icon: 'Database' },
} as const;

export type TableName = keyof typeof DB_TABLES;

// Field type mappings for common fields
export const FIELD_MAPPINGS: Record<string, string[]> = {
  name: ['name', 'שם', 'Name', 'full_name', 'client_name', 'title'],
  email: ['email', 'אימייל', 'Email', 'mail', 'e-mail'],
  phone: ['phone', 'טלפון', 'Phone', 'mobile', 'tel', 'telephone'],
  address: ['address', 'כתובת', 'Address', 'location'],
  notes: ['notes', 'הערות', 'Notes', 'description', 'תיאור', 'comment'],
  status: ['status', 'סטטוס', 'Status', 'state'],
  date: ['date', 'תאריך', 'created_at', 'updated_at', 'log_date', 'start_date', 'end_date'],
  duration: ['duration', 'duration_seconds', 'duration_minutes', 'משך', 'time'],
};
