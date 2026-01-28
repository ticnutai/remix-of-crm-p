// Data Hub - Unified Types
// מערכת גיבוי וייבוא נתונים מאוחדת

export type DataHubTab = 'overview' | 'backup' | 'restore' | 'import' | 'analyze' | 'cloud' | 'history';

export type BackupStatus = 'idle' | 'creating' | 'restoring' | 'importing' | 'analyzing' | 'success' | 'error';

export type ImportSource = 'json' | 'csv' | 'excel' | 'cloud' | 'contacts' | 'archflow' | 'external';

// ============= סטטיסטיקות =============
export interface DataStats {
  clients: number;
  projects: number;
  time_entries: number;
  tasks: number;
  meetings: number;
  quotes: number;
  invoices: number;
  custom_tables: number;
  custom_table_data: number;
  team_members: number;
  documents: number;
  total: number;
  totalHours?: number;
  lastBackup?: string;
  lastImport?: string;
}

// ============= גיבוי =============
export interface BackupMetadata {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  size?: number;
  tables: Record<string, number>;
  total_records: number;
  version: string;
  source?: 'local' | 'cloud' | 'external';
}

export interface BackupOptions {
  clients: boolean;
  projects: boolean;
  time_entries: boolean;
  tasks: boolean;
  meetings: boolean;
  quotes: boolean;
  invoices: boolean;
  profiles: boolean;
  custom_tables: boolean;
  custom_table_data: boolean;
  settings: boolean;
  documents: boolean;
  client_custom_tabs: boolean;
  client_tab_columns: boolean;
}

export interface ExportFormats {
  json: boolean;
  excel: boolean;
  csv: boolean;
}

// ============= ייבוא =============
export interface ImportOptions {
  clients: boolean;
  projects: boolean;
  time_entries: boolean;
  tasks: boolean;
  meetings: boolean;
  quotes: boolean;
  invoices: boolean;
  custom_spreadsheets: boolean;
  custom_tables: boolean;
  team_members: boolean;
  documents: boolean;
  skipDuplicates: boolean;
  overwriteDuplicates: boolean;
  createMissingRelations: boolean;
}

export interface ImportResult {
  type: string;
  name: string;
  status: 'success' | 'error' | 'skipped' | 'duplicate' | 'updated';
  message: string;
  details?: Record<string, any>;
}

export interface ImportStats {
  clients: { total: number; imported: number; skipped: number; updated: number; errors: number };
  projects: { total: number; imported: number; skipped: number; updated: number; errors: number };
  time_entries: { total: number; imported: number; skipped: number; updated: number; errors: number };
  tasks: { total: number; imported: number; skipped: number; updated: number; errors: number };
  meetings: { total: number; imported: number; skipped: number; updated: number; errors: number };
  quotes: { total: number; imported: number; skipped: number; updated: number; errors: number };
  custom_tables: { total: number; imported: number; skipped: number; updated: number; errors: number };
}

export interface ImportProgress {
  phase: 'analyzing' | 'clients' | 'projects' | 'time_entries' | 'tasks' | 'meetings' | 'quotes' | 'tables' | 'done';
  current: number;
  total: number;
  message: string;
  entityMaps: {
    clients: Record<string, string>;
    projects: Record<string, string>;
    users: Record<string, string>;
  };
}

// ============= ניתוח נתונים =============
export interface AnalysisResult {
  sourceType: ImportSource;
  fileName: string;
  fileSize: number;
  detectedFormat: string;
  entities: {
    type: string;
    count: number;
    sampleFields: string[];
    duplicatesInDb: number;
    newRecords: number;
    fieldsMapping: Record<string, string>;
  }[];
  warnings: string[];
  recommendations: string[];
  canImport: boolean;
  estimatedTime: number; // seconds
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  targetTable: string;
  transform?: 'none' | 'date' | 'number' | 'boolean' | 'json' | 'array';
  defaultValue?: any;
}

// ============= פורמטים חיצוניים =============
export interface ArchFlowBackup {
  generated_at: string;
  by: string;
  total_records: number;
  categories: string[];
  data: {
    Client?: any[];
    Project?: any[];
    TimeLog?: any[];
    Task?: any[];
    Meeting?: any[];
    [key: string]: any[] | undefined;
  };
}

export interface NormalizedBackup {
  metadata: {
    source: ImportSource;
    version: string;
    exportedAt: string;
    exportedBy?: string;
  };
  statistics: DataStats;
  data: {
    users?: any[];
    clients?: any[];
    projects?: any[];
    timeLogs?: any[];
    tasks?: any[];
    meetings?: any[];
    quotes?: any[];
    invoices?: any[];
    spreadsheets?: any[];
    customTables?: any[];
    teamMembers?: any[];
    documents?: any[];
  };
}

// ============= ענן =============
export interface CloudBackup {
  name: string;
  created_at: string;
  size: number;
  metadata?: {
    version?: string;
    tables?: Record<string, number>;
    totalRecords?: number;
    createdBy?: string;
  };
}

// ============= היסטוריה =============
export interface DataOperation {
  id: string;
  type: 'backup' | 'restore' | 'import' | 'export';
  status: 'success' | 'failed' | 'partial';
  created_at: string;
  created_by: string;
  details: {
    source?: string;
    target?: string;
    records?: Record<string, number>;
    errors?: string[];
    duration?: number;
  };
}

// ============= Parsed Entities =============
export interface ParsedClient {
  name: string;
  name_clean?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  status?: string;
  notes?: string;
  stage?: string;
  budget_range?: string;
  source?: string;
  tags?: string[];
  custom_data?: Record<string, any>;
  original_id?: string;
  created_at?: string;
}

export interface ParsedProject {
  name: string;
  client_id?: string;
  client_name?: string;
  description?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  original_id?: string;
}

export interface ParsedTimeEntry {
  client_id?: string;
  client_name?: string;
  user_id?: string;
  user_email?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  duration_seconds?: number;
  is_billable?: boolean;
  original_id?: string;
  created_by_id?: string;
  log_date?: string;
}

export interface ParsedTask {
  title: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  project_id?: string;
  project_name?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  original_id?: string;
}

export interface ParsedMeeting {
  title: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  meeting_date?: string;
  duration_minutes?: number;
  location?: string;
  status?: string;
  original_id?: string;
}
