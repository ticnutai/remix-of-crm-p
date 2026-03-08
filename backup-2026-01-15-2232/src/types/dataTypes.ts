// Data Types System - Universal linked data types for synchronization across tables
// This defines the core types for linking entities (clients, employees, projects, custom) across the system

export type LinkedDataTypeSource = 'system' | 'custom';

// System data types that are built-in
export type SystemDataType = 'client' | 'employee' | 'project';

// Data type mode - linked to a table or custom options list
export type DataTypeMode = 'linked' | 'options';

// Option for custom options-based data types
export interface DataTypeSelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

// Configuration for a data type
export interface DataTypeConfig {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color: string;
  source_type: LinkedDataTypeSource;
  type_mode: DataTypeMode;
  // For 'linked' mode
  source_table: string | null;
  display_field: string | null;
  // For 'options' mode
  options?: DataTypeSelectOption[];
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// System data types configuration (built-in)
export const SYSTEM_DATA_TYPES: Record<SystemDataType, Omit<DataTypeConfig, 'id' | 'created_by' | 'created_at' | 'updated_at'>> = {
  client: {
    name: 'client',
    display_name: 'לקוח',
    icon: 'Users',
    color: '#3b82f6',
    source_type: 'system',
    type_mode: 'linked',
    source_table: 'clients',
    display_field: 'name',
    description: 'סוג נתון מובנה ללקוחות',
  },
  employee: {
    name: 'employee',
    display_name: 'עובד',
    icon: 'UserCog',
    color: '#10b981',
    source_type: 'system',
    type_mode: 'linked',
    source_table: 'profiles',
    display_field: 'full_name',
    description: 'סוג נתון מובנה לעובדים',
  },
  project: {
    name: 'project',
    display_name: 'פרויקט',
    icon: 'FolderKanban',
    color: '#f59e0b',
    source_type: 'system',
    type_mode: 'linked',
    source_table: 'projects',
    display_field: 'name',
    description: 'סוג נתון מובנה לפרויקטים',
  },
};

// Tables that can be linked to each system data type
export const DATA_TYPE_LINKED_TABLES: Record<SystemDataType, string[]> = {
  client: [
    'time_entries',
    'projects',
    'invoices',
    'tasks',
    'meetings',
    'reminders',
    'client_files',
    'client_messages',
    'whatsapp_messages',
    'custom_table_data',
  ],
  employee: [
    'time_entries',
    'tasks',
    'projects',
    'meetings',
  ],
  project: [
    'time_entries',
    'tasks',
    'invoices',
    'meetings',
  ],
};

// Column type for data type linking
export interface DataTypeColumnConfig {
  dataType: string; // Reference to data_types.name
  allowMultiple?: boolean; // Allow selecting multiple values
  required?: boolean;
}

// Linked entity reference (stored in table data)
export interface LinkedEntityRef {
  id: string;
  type: string; // data type name
  displayValue: string;
}

// Options for data type select dropdowns
export interface DataTypeOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

// Summary data for linked entities
export interface LinkedEntitySummary {
  entityId: string;
  entityType: string;
  entityName: string;
  linkedData: {
    table: string;
    count: number;
    items: any[];
  }[];
}
