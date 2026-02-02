// Data Analyzer Utility
// ניתוח חכם של קבצי גיבוי וזיהוי אוטומטי של פורמטים

import { 
  DetectedEntity, 
  ImportAnalysis, 
  FieldMapping, 
  EntityMapping,
  FIELD_MAPPINGS 
} from './types';

// Format detection patterns
const FORMAT_PATTERNS = {
  archflow: {
    required: ['data', 'categories'],
    optional: ['generated_at', 'by', 'total_records'],
    entityPrefix: ['Client', 'Project', 'TimeLog', 'Task', 'Meeting'],
  },
  supabase_export: {
    required: ['metadata', 'data'],
    optional: ['version', 'tables'],
  },
  legacy_all_data: {
    required: [],
    entityKeys: ['Client', 'Task', 'TimeLog', 'Meeting', 'Project', 'Quote'],
  },
  snake_case: {
    entityKeys: ['clients', 'tasks', 'time_logs', 'timelogs', 'meetings', 'projects', 'quotes'],
  },
  spreadsheet_backup: {
    required: ['type', 'spreadsheets'],
    typeValue: 'spreadsheets_full_backup',
  },
  access_control: {
    required: ['export_info', 'users'],
  },
};

// Entity type mapping from various formats to our standard
const ENTITY_TYPE_MAP: Record<string, DetectedEntity['type']> = {
  // PascalCase (ArchFlow)
  Client: 'clients',
  Project: 'projects',
  TimeLog: 'time_entries',
  Task: 'tasks',
  Meeting: 'meetings',
  Quote: 'quotes',
  User: 'users',
  TeamMember: 'users',
  CustomTable: 'custom_tables',
  CustomTableData: 'custom_table_data',
  CustomSpreadsheet: 'custom_tables',
  Document: 'documents',
  
  // snake_case
  clients: 'clients',
  projects: 'projects',
  time_entries: 'time_entries',
  time_logs: 'time_entries',
  timelogs: 'time_entries',
  tasks: 'tasks',
  meetings: 'meetings',
  quotes: 'quotes',
  users: 'users',
  team_members: 'users',
  custom_tables: 'custom_tables',
  custom_table_data: 'custom_table_data',
  documents: 'documents',
  
  // Hebrew variants
  לקוחות: 'clients',
  פרויקטים: 'projects',
  משימות: 'tasks',
  פגישות: 'meetings',
};

// Detect the source format of a JSON object
export function detectSourceFormat(data: any, fileName?: string): ImportAnalysis['sourceType'] {
  // ArchFlow format check
  if (data.data && data.categories && Array.isArray(data.categories)) {
    return 'archflow';
  }
  
  // Supabase export format
  if (data.metadata && data.data && data.metadata.tables) {
    return 'supabase';
  }
  
  // Legacy ALL_DATA format (direct entities at root)
  const legacyKeys = FORMAT_PATTERNS.legacy_all_data.entityKeys;
  if (legacyKeys.some(key => Array.isArray(data[key]))) {
    return 'legacy';
  }
  
  // snake_case format
  const snakeKeys = FORMAT_PATTERNS.snake_case.entityKeys;
  if (snakeKeys.some(key => Array.isArray(data[key]))) {
    return 'legacy';
  }
  
  // Spreadsheet backup
  if (data.type === 'spreadsheets_full_backup') {
    return 'legacy';
  }
  
  // Excel detection (handled separately by file type)
  if (fileName?.endsWith('.xlsx') || fileName?.endsWith('.xls')) {
    return 'excel';
  }
  
  // CSV detection
  if (fileName?.endsWith('.csv')) {
    return 'csv';
  }
  
  return 'unknown';
}

// Extract entities from various formats
export function extractEntities(data: any, sourceType: ImportAnalysis['sourceType']): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  
  switch (sourceType) {
    case 'archflow':
      return extractArchflowEntities(data);
    
    case 'supabase':
      return extractSupabaseEntities(data);
    
    case 'legacy':
      return extractLegacyEntities(data);
    
    default:
      return extractGenericEntities(data);
  }
}

function extractArchflowEntities(data: any): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  const dataObj = data.data || {};
  
  for (const [key, value] of Object.entries(dataObj)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    
    const entityType = ENTITY_TYPE_MAP[key] || 'other';
    const sample = value[0];
    const fields = sample ? Object.keys(sample) : [];
    
    entities.push({
      type: entityType,
      count: value.length,
      fields,
      sample,
      status: 'ready',
      targetTable: entityType !== 'other' ? entityType : undefined,
    });
  }
  
  return entities;
}

function extractSupabaseEntities(data: any): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  const dataObj = data.data || {};
  
  for (const [tableName, records] of Object.entries(dataObj)) {
    if (!Array.isArray(records) || records.length === 0) continue;
    
    const sample = records[0];
    const fields = sample ? Object.keys(sample) : [];
    const entityType = ENTITY_TYPE_MAP[tableName] || 'other';
    
    entities.push({
      type: entityType,
      count: records.length,
      fields,
      sample,
      status: 'ready',
      targetTable: tableName,
    });
  }
  
  return entities;
}

function extractLegacyEntities(data: any): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  
  // Handle spreadsheet backup specially
  if (data.type === 'spreadsheets_full_backup' && data.spreadsheets) {
    entities.push({
      type: 'custom_tables',
      count: data.spreadsheets.length,
      fields: ['id', 'name', 'columns', 'rows'],
      sample: data.spreadsheets[0],
      status: 'ready',
      targetTable: 'custom_tables',
    });
    return entities;
  }
  
  // Check all possible entity keys
  const allKeys = [...FORMAT_PATTERNS.legacy_all_data.entityKeys, ...FORMAT_PATTERNS.snake_case.entityKeys];
  
  for (const key of allKeys) {
    const value = data[key];
    if (!Array.isArray(value) || value.length === 0) continue;
    
    const entityType = ENTITY_TYPE_MAP[key] || 'other';
    const sample = value[0];
    const fields = sample ? Object.keys(sample) : [];
    
    // Avoid duplicates (e.g., both 'clients' and 'Client')
    if (!entities.some(e => e.type === entityType)) {
      entities.push({
        type: entityType,
        count: value.length,
        fields,
        sample,
        status: 'ready',
        targetTable: entityType !== 'other' ? entityType : undefined,
      });
    }
  }
  
  return entities;
}

function extractGenericEntities(data: any): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  
  // Try to detect any array properties that look like data
  for (const [key, value] of Object.entries(data)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    
    const sample = value[0];
    if (typeof sample !== 'object' || sample === null) continue;
    
    const fields = Object.keys(sample);
    const entityType = guessEntityType(key, fields);
    
    entities.push({
      type: entityType,
      count: value.length,
      fields,
      sample,
      status: 'ready',
    });
  }
  
  return entities;
}

// Guess entity type from key name and fields
function guessEntityType(key: string, fields: string[]): DetectedEntity['type'] {
  const keyLower = key.toLowerCase();
  
  // Direct match
  if (ENTITY_TYPE_MAP[key]) return ENTITY_TYPE_MAP[key];
  if (ENTITY_TYPE_MAP[keyLower]) return ENTITY_TYPE_MAP[keyLower];
  
  // Field-based detection
  if (fields.includes('client_id') && fields.includes('duration')) return 'time_entries';
  if (fields.includes('email') && fields.includes('phone')) return 'clients';
  if (fields.includes('assigned_to') && fields.includes('due_date')) return 'tasks';
  if (fields.includes('start_time') && fields.includes('end_time')) return 'meetings';
  if (fields.includes('total_amount') || fields.includes('quote_number')) return 'quotes';
  
  return 'other';
}

// Auto-generate field mappings for an entity
export function autoMapFields(entity: DetectedEntity, targetTable: string): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  const sourceFields = entity.fields;
  
  for (const sourceField of sourceFields) {
    const mapping = findBestFieldMapping(sourceField, targetTable);
    
    mappings.push({
      sourceField,
      targetField: mapping.targetField,
      transform: mapping.transform,
      required: mapping.required,
      validated: mapping.targetField !== null,
      sampleValue: entity.sample?.[sourceField],
    });
  }
  
  return mappings;
}

interface FieldMatchResult {
  targetField: string | null;
  transform: FieldMapping['transform'];
  required: boolean;
}

function findBestFieldMapping(sourceField: string, targetTable: string): FieldMatchResult {
  const sourceLower = sourceField.toLowerCase();
  
  // Direct match patterns
  for (const [targetField, patterns] of Object.entries(FIELD_MAPPINGS)) {
    const patternsLower = patterns.map(p => p.toLowerCase());
    if (patternsLower.includes(sourceLower) || patterns.includes(sourceField)) {
      return {
        targetField,
        transform: inferTransform(targetField),
        required: ['name', 'client_id'].includes(targetField),
      };
    }
  }
  
  // Fuzzy match - check if source field contains known keywords
  if (sourceLower.includes('date') || sourceLower.includes('time') || sourceLower.includes('_at')) {
    return { targetField: null, transform: 'date', required: false };
  }
  
  if (sourceLower.includes('duration') || sourceLower.includes('amount') || sourceLower.includes('count')) {
    return { targetField: null, transform: 'number', required: false };
  }
  
  if (sourceLower.includes('is_') || sourceLower.includes('has_')) {
    return { targetField: null, transform: 'boolean', required: false };
  }
  
  // Pass through as-is if field name matches exactly
  return {
    targetField: sourceField,
    transform: 'none',
    required: false,
  };
}

function inferTransform(fieldName: string): FieldMapping['transform'] {
  if (['date', 'created_at', 'updated_at', 'log_date', 'start_date', 'end_date'].includes(fieldName)) {
    return 'date';
  }
  if (['duration', 'duration_seconds', 'duration_minutes', 'amount', 'budget'].includes(fieldName)) {
    return 'number';
  }
  if (['is_sample', 'is_active', 'is_completed'].includes(fieldName)) {
    return 'boolean';
  }
  if (['custom_data', 'tags', 'metadata'].includes(fieldName)) {
    return 'json';
  }
  return 'none';
}

// Full analysis of uploaded data
export function analyzeImportData(data: any, fileName?: string): ImportAnalysis {
  const sourceType = detectSourceFormat(data, fileName);
  const entities = extractEntities(data, sourceType);
  
  // Calculate totals
  const totalRecords = entities.reduce((sum, e) => sum + e.count, 0);
  
  // Determine format description
  let sourceFormat = 'לא ידוע';
  switch (sourceType) {
    case 'archflow':
      sourceFormat = 'ArchFlow / e-control';
      break;
    case 'supabase':
      sourceFormat = 'Supabase Export';
      break;
    case 'legacy':
      sourceFormat = 'גיבוי ישן / Legacy';
      break;
    case 'excel':
      sourceFormat = 'Excel';
      break;
    case 'csv':
      sourceFormat = 'CSV';
      break;
  }
  
  return {
    sourceFormat,
    sourceType,
    totalRecords,
    entities,
    duplicateStrategy: 'skip',
    createdAt: new Date().toISOString(),
    rawData: data,
  };
}

// Validate an entity mapping before import
export function validateEntityMapping(entity: DetectedEntity, mapping: EntityMapping): string[] {
  const errors: string[] = [];
  
  // Check required fields are mapped
  const requiredFields = mapping.fieldMappings.filter(f => f.required);
  for (const field of requiredFields) {
    if (!field.targetField) {
      errors.push(`שדה חובה "${field.sourceField}" לא ממופה`);
    }
  }
  
  // Check match fields exist
  if (mapping.matchFields.length === 0 && mapping.strategy !== 'always_insert') {
    errors.push('יש לבחור לפחות שדה אחד לזיהוי כפילויות');
  }
  
  // Check target table is valid
  if (!mapping.targetTable) {
    errors.push('לא נבחרה טבלת יעד');
  }
  
  return errors;
}
