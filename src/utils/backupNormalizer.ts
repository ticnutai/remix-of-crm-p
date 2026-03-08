// Backup Normalizer Utility
// Handles various JSON backup formats and normalizes them to ArchFlowBackup format

export interface NormalizedBackup {
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
    Quote?: any[];
    Invoice?: any[];
    TeamMember?: any[];
    AccessControl?: any[];
    CustomSpreadsheet?: any[];
    CustomTable?: any[];
    CustomTableData?: any[];
    UserPreferences?: any[];
    Document?: any[];
    AuditLog?: any[];
    ClientStage?: any[];
    ClientStageTask?: any[];
    StageTemplate?: any[];
    StageTemplateStage?: any[];
    StageTemplateTask?: any[];
    [key: string]: any[] | undefined;
  };
}

export interface NormalizationResult {
  success: boolean;
  data?: NormalizedBackup;
  error?: string;
  detectedFormat?: string;
  detectedKeys?: string[];
}

// Strip BOM and clean JSON text
function cleanJsonText(text: string): string {
  // Remove BOM (Byte Order Mark) if present
  let cleaned = text.replace(/^\ufeff/, '');
  // Trim whitespace
  cleaned = cleaned.trim();
  return cleaned;
}

// Map legacy column types to current types
function mapLegacyColumnType(type: string): string {
  const typeMap: Record<string, string> = {
    'מספר': 'number',
    'טקסט': 'text',
    'תאריך': 'date',
    'כן/לא': 'boolean',
    'בחירה': 'select',
    'מספר עשרוני': 'number',
    'קישור': 'link',
    'אימייל': 'email',
    'טלפון': 'phone',
    'כסף': 'currency',
    'אחוזים': 'percent',
  };
  return typeMap[type] || type || 'text';
}

// Detect the format of the backup file
function detectFormat(data: any, fileName: string): { format: string; confidence: number } {
  // Format 1: Standard ArchFlow format
  if (data.data && data.categories && Array.isArray(data.categories)) {
    return { format: 'archflow', confidence: 1 };
  }
  
  // Format 1b: ArchFlow format with metadata/statistics (new format)
  if (data.data && (data.metadata || data.statistics)) {
    // Check if data contains entities in either PascalCase or camelCase
    const dataObj = data.data;
    if (dataObj.Client || dataObj.clients || dataObj.TimeLog || dataObj.timeLogs || 
        dataObj.Task || dataObj.tasks || dataObj.Meeting || dataObj.meetings) {
      return { format: 'archflow_metadata', confidence: 1 };
    }
  }
  
  // Format 2: ALL_DATA format (direct entities at root)
  if (data.Client || data.Task || data.TimeLog || data.Project || data.Meeting) {
    return { format: 'all_data', confidence: 0.9 };
  }
  
  // Format 2b: ALL_DATA format with camelCase
  if (data.clients || data.tasks || data.timeLogs || data.projects || data.meetings) {
    return { format: 'all_data_camel', confidence: 0.9 };
  }
  
  // Format 3: Spreadsheets full backup
  if (data.type === 'spreadsheets_full_backup' && (data.spreadsheets || data.rows_data)) {
    return { format: 'spreadsheets_full_backup', confidence: 1 };
  }
  
  // Format 4: Access control backup
  if (data.export_info && data.users && typeof data.users === 'object') {
    return { format: 'access_control_backup', confidence: 1 };
  }
  
  // Format 5: Users/Team backup
  if (data.data && data.data.TeamMember) {
    return { format: 'archflow', confidence: 0.8 };
  }
  
  // Format 6: Generic data with recognizable entity arrays
  const possibleEntities = ['clients', 'projects', 'tasks', 'timelogs', 'time_logs', 'meetings', 'quotes', 'invoices', 'team_members', 'employees'];
  const foundEntities = possibleEntities.filter(e => Array.isArray(data[e]));
  if (foundEntities.length > 0) {
    return { format: 'snake_case_entities', confidence: 0.7 };
  }
  
  // Check filename hints
  if (fileName.toLowerCase().includes('spreadsheet')) {
    return { format: 'unknown_spreadsheet', confidence: 0.3 };
  }
  if (fileName.toLowerCase().includes('access') || fileName.toLowerCase().includes('permission')) {
    return { format: 'unknown_access', confidence: 0.3 };
  }
  
  return { format: 'unknown', confidence: 0 };
}

// Convert spreadsheets full backup format
function convertSpreadsheetsBackup(data: any): Partial<NormalizedBackup['data']> {
  const result: Partial<NormalizedBackup['data']> = {};
  
  const spreadsheets = data.spreadsheets || [];
  
  // Convert to CustomSpreadsheet format
  const customSpreadsheets: any[] = spreadsheets.map((sheet: any) => {
    // Handle columns conversion
    const columns = (sheet.columns || []).map((col: any, index: number) => ({
      id: col.key || col.id || `col_${index}`,
      name: col.title || col.name || `עמודה ${index + 1}`,
      type: mapLegacyColumnType(col.type || 'text'),
      width: col.width || 150,
      options: col.options,
    }));
    
    // Handle rows - could be in sheet.rows or in data.rows_data[sheetId]
    let rows = sheet.rows || [];
    if (data.rows_data && data.rows_data[sheet.id]) {
      rows = data.rows_data[sheet.id];
    }
    
    return {
      id: sheet.id,
      name: sheet.name,
      description: sheet.description,
      columns: columns,
      rows: rows,
      created_at: sheet.created_at || sheet.createdAt || new Date().toISOString(),
      updated_at: sheet.updated_at || sheet.updatedAt || new Date().toISOString(),
      filters: sheet.filters,
      custom_types: sheet.custom_types || sheet.customTypes,
    };
  });
  
  if (customSpreadsheets.length > 0) {
    result.CustomSpreadsheet = customSpreadsheets;
  }
  
  // Also handle comments if present
  if (data.comments && Array.isArray(data.comments)) {
    result['SheetComment'] = data.comments;
  }
  
  // Handle presence data if present
  if (data.presence && Array.isArray(data.presence)) {
    result['SheetPresence'] = data.presence;
  }
  
  return result;
}

// Convert access control backup format
function convertAccessControlBackup(data: any): Partial<NormalizedBackup['data']> {
  const result: Partial<NormalizedBackup['data']> = {};
  
  const teamMembers: any[] = [];
  const accessControls: any[] = [];
  const auditLogs: any[] = [];
  
  // Process users object (keyed by email)
  const users = data.users || {};
  for (const [email, userData] of Object.entries(users) as [string, any][]) {
    // Extract user info
    const userInfo = userData.user_info || {};
    const accessControl = userData.access_control || {};
    const activity = userData.activity || {};
    
    // Create TeamMember entry
    teamMembers.push({
      id: userInfo.id || crypto.randomUUID(),
      email: email,
      full_name: userInfo.full_name || userInfo.name || email.split('@')[0],
      name: userInfo.name || userInfo.full_name || email.split('@')[0],
      role: mapLegacyRole(userInfo.role || accessControl.role),
      phone: userInfo.phone,
      avatar_url: userInfo.avatar_url,
      created_at: userInfo.created_at || new Date().toISOString(),
      updated_at: userInfo.updated_at || new Date().toISOString(),
    });
    
    // Create AccessControl entry
    if (accessControl.role || accessControl.permissions) {
      accessControls.push({
        email: email,
        user_id: userInfo.id,
        role: mapLegacyRole(accessControl.role),
        active: accessControl.active !== false,
        assigned_clients: accessControl.assigned_clients || [],
        assigned_projects: accessControl.assigned_projects || [],
        permissions: accessControl.permissions || [],
        created_at: accessControl.created_at || new Date().toISOString(),
      });
    }
    
    // Extract audit logs if present
    if (activity.audit_logs_created && Array.isArray(activity.audit_logs_created)) {
      auditLogs.push(...activity.audit_logs_created);
    }
  }
  
  // Handle super_admins array if present
  if (data.super_admins && Array.isArray(data.super_admins)) {
    for (const admin of data.super_admins) {
      const email = typeof admin === 'string' ? admin : admin.email;
      
      // Check if already added
      if (!accessControls.some(ac => ac.email === email)) {
        accessControls.push({
          email: email,
          role: 'admin',
          active: true,
          created_at: new Date().toISOString(),
        });
      }
    }
  }
  
  if (teamMembers.length > 0) {
    result.TeamMember = teamMembers;
  }
  if (accessControls.length > 0) {
    result.AccessControl = accessControls;
  }
  if (auditLogs.length > 0) {
    result.AuditLog = auditLogs;
  }
  
  return result;
}

// Map legacy roles to current role system
function mapLegacyRole(role: string | undefined): string {
  if (!role) return 'employee';
  
  const roleMap: Record<string, string> = {
    'super_admin': 'admin',
    'מנהל': 'admin',
    'admin': 'admin',
    'administrator': 'admin',
    'manager': 'manager',
    'מנהל פרויקט': 'manager',
    'employee': 'employee',
    'עובד': 'employee',
    'user': 'employee',
    'viewer': 'employee',
  };
  
  return roleMap[role.toLowerCase()] || 'employee';
}

// Convert snake_case entities format
function convertSnakeCaseEntities(data: any): Partial<NormalizedBackup['data']> {
  const result: Partial<NormalizedBackup['data']> = {};
  
  const mapping: Record<string, string> = {
    'clients': 'Client',
    'projects': 'Project',
    'tasks': 'Task',
    'timelogs': 'TimeLog',
    'time_logs': 'TimeLog',
    'meetings': 'Meeting',
    'quotes': 'Quote',
    'invoices': 'Invoice',
    'team_members': 'TeamMember',
    'employees': 'TeamMember',
    'access_control': 'AccessControl',
    'permissions': 'AccessControl',
    'custom_spreadsheets': 'CustomSpreadsheet',
    'spreadsheets': 'CustomSpreadsheet',
    'custom_tables': 'CustomTable',
    'custom_table_data': 'CustomTableData',
    'documents': 'Document',
    'user_preferences': 'UserPreferences',
  };
  
  for (const [snakeKey, pascalKey] of Object.entries(mapping)) {
    if (Array.isArray(data[snakeKey])) {
      result[pascalKey] = data[snakeKey];
    }
  }
  
  return result;
}

// Main normalization function
export function normalizeExternalBackup(rawText: string, fileName: string): NormalizationResult {
  try {
    // Clean the text
    const cleanedText = cleanJsonText(rawText);
    
    // Parse JSON
    let data: any;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      return {
        success: false,
        error: `שגיאת פרסור JSON: ${(parseError as Error).message}`,
        detectedKeys: [],
      };
    }
    
    // Detect format
    const { format, confidence } = detectFormat(data, fileName);
    const detectedKeys = Object.keys(data).slice(0, 10);
    
    if (format === 'unknown' || confidence < 0.3) {
      return {
        success: false,
        error: `פורמט לא מזוהה. מפתחות שנמצאו: ${detectedKeys.join(', ')}`,
        detectedFormat: format,
        detectedKeys,
      };
    }
    
    let normalizedData: NormalizedBackup;
    
    switch (format) {
      case 'archflow':
        // Already in correct format
        normalizedData = {
          generated_at: data.generated_at || new Date().toISOString(),
          by: data.by || 'imported',
          total_records: data.total_records || 0,
          categories: data.categories || [],
          data: data.data || {},
        };
        break;
      
      case 'archflow_metadata':
        // Format with metadata/statistics - normalize camelCase to PascalCase
        const archflowRawData = data.data || {};
        const archflowNormalizedData: NormalizedBackup['data'] = {
          Client: archflowRawData.Client || archflowRawData.clients || [],
          Project: archflowRawData.Project || archflowRawData.projects || [],
          TimeLog: archflowRawData.TimeLog || archflowRawData.timeLogs || [],
          Task: archflowRawData.Task || archflowRawData.tasks || [],
          Meeting: archflowRawData.Meeting || archflowRawData.meetings || [],
          Quote: archflowRawData.Quote || archflowRawData.quotes || [],
          Invoice: archflowRawData.Invoice || archflowRawData.invoices || [],
          ClientStage: archflowRawData.ClientStage || archflowRawData.client_stages || [],
          ClientStageTask: archflowRawData.ClientStageTask || archflowRawData.client_stage_tasks || [],
          StageTemplate: archflowRawData.StageTemplate || archflowRawData.stage_templates || [],
          StageTemplateStage: archflowRawData.StageTemplateStage || archflowRawData.stage_template_stages || [],
          StageTemplateTask: archflowRawData.StageTemplateTask || archflowRawData.stage_template_tasks || [],
        };
        normalizedData = {
          generated_at: data.metadata?.timestamp || data.metadata?.created_at || new Date().toISOString(),
          by: data.metadata?.user || 'imported',
          total_records: data.statistics?.total_records || 0,
          categories: Object.keys(archflowNormalizedData).filter(k => 
            Array.isArray(archflowNormalizedData[k]) && archflowNormalizedData[k]!.length > 0
          ),
          data: archflowNormalizedData,
        };
        break;
        
      case 'all_data':
        // Direct entities at root level
        normalizedData = {
          generated_at: new Date().toISOString(),
          by: 'imported',
          total_records: Object.values(data).reduce<number>((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
          categories: Object.keys(data).filter(k => Array.isArray(data[k])),
          data: data,
        };
        break;
      
      case 'all_data_camel':
        // Direct entities at root level in camelCase - normalize to PascalCase
        const camelData: NormalizedBackup['data'] = {
          Client: data.clients || [],
          Project: data.projects || [],
          TimeLog: data.timeLogs || [],
          Task: data.tasks || [],
          Meeting: data.meetings || [],
          Quote: data.quotes || [],
          Invoice: data.invoices || [],
          ClientStage: data.client_stages || [],
          ClientStageTask: data.client_stage_tasks || [],
          StageTemplate: data.stage_templates || [],
          StageTemplateStage: data.stage_template_stages || [],
          StageTemplateTask: data.stage_template_tasks || [],
        };
        normalizedData = {
          generated_at: new Date().toISOString(),
          by: 'imported',
          total_records: Object.values(camelData).reduce<number>((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
          categories: Object.keys(camelData).filter(k => Array.isArray(camelData[k]) && camelData[k]!.length > 0),
          data: camelData,
        };
        break;
        
      case 'spreadsheets_full_backup':
        const spreadsheetData = convertSpreadsheetsBackup(data);
        normalizedData = {
          generated_at: data.exported_at || new Date().toISOString(),
          by: 'spreadsheet_import',
          total_records: Object.values(spreadsheetData).reduce((sum: number, arr) => sum + (Array.isArray(arr) ? (arr as any[]).length : 0), 0),
          categories: Object.keys(spreadsheetData),
          data: spreadsheetData,
        };
        break;
        
      case 'access_control_backup':
        const accessData = convertAccessControlBackup(data);
        normalizedData = {
          generated_at: data.export_info?.exported_at || new Date().toISOString(),
          by: data.export_info?.exported_by || 'access_import',
          total_records: Object.values(accessData).reduce((sum: number, arr) => sum + (Array.isArray(arr) ? (arr as any[]).length : 0), 0),
          categories: Object.keys(accessData),
          data: accessData,
        };
        break;
        
      case 'snake_case_entities':
        const snakeData = convertSnakeCaseEntities(data);
        normalizedData = {
          generated_at: data.exported_at || data.created_at || new Date().toISOString(),
          by: 'imported',
          total_records: Object.values(snakeData).reduce((sum: number, arr) => sum + (Array.isArray(arr) ? (arr as any[]).length : 0), 0),
          categories: Object.keys(snakeData),
          data: snakeData,
        };
        break;
        
      default:
        return {
          success: false,
          error: `פורמט ${format} לא נתמך עדיין`,
          detectedFormat: format,
          detectedKeys,
        };
    }
    
    // Recalculate total records
    normalizedData.total_records = Object.values(normalizedData.data)
      .reduce((sum: number, arr) => sum + (Array.isArray(arr) ? (arr as any[]).length : 0), 0);
    
    // Update categories to reflect actual data
    normalizedData.categories = Object.keys(normalizedData.data)
      .filter(k => Array.isArray(normalizedData.data[k]) && normalizedData.data[k]!.length > 0);
    
    return {
      success: true,
      data: normalizedData,
      detectedFormat: format,
      detectedKeys,
    };
    
  } catch (error) {
    return {
      success: false,
      error: `שגיאה כללית: ${(error as Error).message}`,
    };
  }
}

// Merge multiple normalized backups
export function mergeNormalizedBackups(backups: NormalizedBackup[]): NormalizedBackup {
  const merged: NormalizedBackup = {
    generated_at: new Date().toISOString(),
    by: 'merged_import',
    total_records: 0,
    categories: [],
    data: {},
  };
  
  const seenIds: Record<string, Set<string>> = {};
  
  for (const backup of backups) {
    for (const [category, items] of Object.entries(backup.data)) {
      if (!Array.isArray(items)) continue;
      
      if (!merged.data[category]) {
        merged.data[category] = [];
        seenIds[category] = new Set();
      }
      
      // Add items, deduplicating by id or email
      for (const item of items) {
        const itemId = item.id || item.email || JSON.stringify(item);
        
        if (!seenIds[category].has(itemId)) {
          seenIds[category].add(itemId);
          merged.data[category]!.push(item);
        }
      }
    }
  }
  
  // Update totals
  merged.total_records = Object.values(merged.data)
    .reduce((sum: number, arr) => sum + (Array.isArray(arr) ? (arr as any[]).length : 0), 0);
  merged.categories = Object.keys(merged.data)
    .filter(k => Array.isArray(merged.data[k]) && merged.data[k]!.length > 0);
  
  return merged;
}

// Get supported formats for error messaging
export function getSupportedFormats(): string[] {
  return [
    'ArchFlow JSON (data + categories)',
    'ALL_DATA.json (ישויות ישירות)',
    'spreadsheets_full_backup (טבלאות מותאמות)',
    'access_control_backup (הרשאות משתמשים)',
    'פורמט snake_case (clients, projects, ...)',
  ];
}
