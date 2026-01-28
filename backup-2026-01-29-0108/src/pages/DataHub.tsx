// DataHub - מרכז נתונים מאוחד (ייבוא וגיבויים)
// e-control CRM Pro
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useBackupRestore, BackupMetadata } from '@/hooks/useBackupRestore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Upload,
  Database,
  HardDrive,
  Cloud,
  FileSpreadsheet,
  Users,
  FolderKanban,
  Clock,
  Shield,
  Download,
  Trash2,
  RotateCcw,
  Plus,
  FileJson,
  Calendar,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Settings2,
  RefreshCw,
  Contact,
  XCircle,
  Eye,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ContactsImportDialog } from '@/components/backup/ContactsImportDialog';
import { normalizeExternalBackup, getSupportedFormats } from '@/utils/backupNormalizer';

// =====================================
// Types & Interfaces
// =====================================

interface ImportResult {
  type: 'client' | 'time_entry' | 'project';
  name: string;
  status: 'success' | 'error' | 'skipped' | 'duplicate';
  message: string;
}

interface ParsedClient {
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
  position?: string;
  phone_secondary?: string;
  whatsapp?: string;
  website?: string;
  linkedin?: string;
  preferred_contact?: string;
  custom_data?: Record<string, any>;
  original_id?: string;
  is_sample?: boolean;
  client_status?: string;
}

interface ParsedTimeLog {
  client_id_ref: string;
  client_name: string;
  log_date: string;
  duration_seconds: number;
  title?: string;
  notes?: string;
  original_id?: string;
}

interface ParsedProject {
  name: string;
  client_name?: string;
  client_id_ref?: string;
  description?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  original_id?: string;
}

interface ImportOptions {
  importClients: boolean;
  importProjects: boolean;
  importTimeLogs: boolean;
  skipDuplicates: boolean;
  overwriteDuplicates: boolean;
}

// =====================================
// Validation Types & Functions
// =====================================

type OperationType = 'import' | 'export' | 'backup' | 'restore';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  entity: 'client' | 'project' | 'timelog' | 'backup' | 'system';
  field: string;
  value: string;
  message: string;
  row?: number;
}

interface DataIntegrityCheck {
  tableName: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  issues: ValidationIssue[];
}

interface ComprehensiveValidationResult {
  isValid: boolean;
  operation: OperationType;
  timestamp: string;
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warnings: number;
  };
  dataIntegrity: DataIntegrityCheck[];
  schemaValidation: {
    isValid: boolean;
    missingTables: string[];
    missingColumns: Record<string, string[]>;
  };
  referentialIntegrity: {
    isValid: boolean;
    orphanedRecords: { table: string; count: number }[];
    brokenReferences: { from: string; to: string; count: number }[];
  };
  dataQuality: {
    duplicates: { table: string; count: number }[];
    emptyRequiredFields: { table: string; field: string; count: number }[];
    invalidFormats: { table: string; field: string; count: number }[];
  };
  issues: ValidationIssue[];
}

// Legacy interface for backward compatibility
interface ValidationSummary {
  isValid: boolean;
  errors: number;
  warnings: number;
  infos: number;
  issues: ValidationIssue[];
  duplicatesFound: number;
  emptyRequiredFields: number;
  invalidEmails: number;
  invalidPhones: number;
  invalidDates: number;
}

// Validation helper functions
const validateEmail = (email: string): boolean => {
  if (!email) return true; // Empty is OK (not required)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Empty is OK (not required)
  // Israeli phone formats: 05X-XXXXXXX, 0X-XXXXXXX, +972-XX-XXXXXXX
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+972|0)\d{8,10}$/;
  return phoneRegex.test(cleanPhone) || cleanPhone.length >= 9;
};

const validateDate = (dateStr: string): boolean => {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

const validateRequiredField = (value: any, fieldName: string): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
};

// =====================================
// Comprehensive Validation Functions
// =====================================

const validateJsonStructure = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('הנתונים אינם אובייקט JSON תקין');
    return { isValid: false, errors };
  }
  
  // Check for circular references
  try {
    JSON.stringify(data);
  } catch (e) {
    errors.push('נמצאו הפניות מעגליות בנתונים');
  }
  
  return { isValid: errors.length === 0, errors };
};

const validateBackupStructure = (backup: any): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  
  // Required fields for backup
  if (!backup.generated_at && !backup.created_at && !backup.timestamp) {
    issues.push({
      type: 'warning',
      entity: 'backup',
      field: 'timestamp',
      value: '',
      message: 'חסר תאריך יצירת הגיבוי'
    });
  }
  
  if (!backup.data && !backup.tables && !backup.categories) {
    issues.push({
      type: 'error',
      entity: 'backup',
      field: 'data',
      value: '',
      message: 'חסרים נתונים בקובץ הגיבוי'
    });
  }
  
  // Validate each table
  const tables = backup.data || backup.tables || {};
  Object.entries(tables).forEach(([tableName, records]) => {
    if (Array.isArray(records)) {
      if (records.length === 0) {
        issues.push({
          type: 'info',
          entity: 'backup',
          field: tableName,
          value: '0',
          message: `טבלת ${tableName} ריקה`
        });
      }
      
      // Check for null/undefined records
      const nullCount = records.filter(r => r === null || r === undefined).length;
      if (nullCount > 0) {
        issues.push({
          type: 'error',
          entity: 'backup',
          field: tableName,
          value: String(nullCount),
          message: `${nullCount} רשומות ריקות בטבלת ${tableName}`
        });
      }
    }
  });
  
  return issues;
};

const validateDataIntegrity = async (
  data: Record<string, any[]>,
  operation: OperationType
): Promise<DataIntegrityCheck[]> => {
  const checks: DataIntegrityCheck[] = [];
  
  // Clients validation
  if (data.Client || data.clients) {
    const clients = data.Client || data.clients || [];
    const clientIssues: ValidationIssue[] = [];
    let validCount = 0;
    
    clients.forEach((client: any, idx: number) => {
      let isValid = true;
      
      // Name is required
      if (!client.name || client.name.trim() === '') {
        clientIssues.push({
          type: 'error',
          entity: 'client',
          field: 'name',
          value: '',
          message: 'שם לקוח חובה',
          row: idx + 1
        });
        isValid = false;
      }
      
      // Email validation
      if (client.email && !validateEmail(client.email)) {
        clientIssues.push({
          type: 'warning',
          entity: 'client',
          field: 'email',
          value: client.email,
          message: 'כתובת אימייל לא תקינה',
          row: idx + 1
        });
      }
      
      // Phone validation
      if (client.phone && !validatePhone(client.phone)) {
        clientIssues.push({
          type: 'warning',
          entity: 'client',
          field: 'phone',
          value: client.phone,
          message: 'מספר טלפון לא תקין',
          row: idx + 1
        });
      }
      
      if (isValid) validCount++;
    });
    
    checks.push({
      tableName: 'לקוחות',
      totalRecords: clients.length,
      validRecords: validCount,
      invalidRecords: clients.length - validCount,
      issues: clientIssues
    });
  }
  
  // Projects validation
  if (data.Project || data.projects) {
    const projects = data.Project || data.projects || [];
    const projectIssues: ValidationIssue[] = [];
    let validCount = 0;
    
    projects.forEach((project: any, idx: number) => {
      let isValid = true;
      
      if (!project.name || project.name.trim() === '') {
        projectIssues.push({
          type: 'error',
          entity: 'project',
          field: 'name',
          value: '',
          message: 'שם פרויקט חובה',
          row: idx + 1
        });
        isValid = false;
      }
      
      // Date validation
      if (project.start_date && !validateDate(project.start_date)) {
        projectIssues.push({
          type: 'warning',
          entity: 'project',
          field: 'start_date',
          value: project.start_date,
          message: 'תאריך התחלה לא תקין',
          row: idx + 1
        });
      }
      
      if (project.end_date && !validateDate(project.end_date)) {
        projectIssues.push({
          type: 'warning',
          entity: 'project',
          field: 'end_date',
          value: project.end_date,
          message: 'תאריך סיום לא תקין',
          row: idx + 1
        });
      }
      
      if (isValid) validCount++;
    });
    
    checks.push({
      tableName: 'פרויקטים',
      totalRecords: projects.length,
      validRecords: validCount,
      invalidRecords: projects.length - validCount,
      issues: projectIssues
    });
  }
  
  // Time entries validation
  if (data.TimeLog || data.time_entries) {
    const timeLogs = data.TimeLog || data.time_entries || [];
    const timeIssues: ValidationIssue[] = [];
    let validCount = 0;
    
    timeLogs.forEach((entry: any, idx: number) => {
      let isValid = true;
      
      if (!entry.log_date && !entry.date) {
        timeIssues.push({
          type: 'error',
          entity: 'timelog',
          field: 'date',
          value: '',
          message: 'תאריך חובה לרישום זמן',
          row: idx + 1
        });
        isValid = false;
      }
      
      const duration = entry.duration_seconds || entry.duration;
      if (duration !== undefined && (isNaN(duration) || duration < 0)) {
        timeIssues.push({
          type: 'error',
          entity: 'timelog',
          field: 'duration',
          value: String(duration),
          message: 'משך זמן לא תקין',
          row: idx + 1
        });
        isValid = false;
      }
      
      if (isValid) validCount++;
    });
    
    checks.push({
      tableName: 'רישומי זמן',
      totalRecords: timeLogs.length,
      validRecords: validCount,
      invalidRecords: timeLogs.length - validCount,
      issues: timeIssues
    });
  }
  
  // Tasks validation
  if (data.Task || data.tasks) {
    const tasks = data.Task || data.tasks || [];
    const taskIssues: ValidationIssue[] = [];
    let validCount = 0;
    
    tasks.forEach((task: any, idx: number) => {
      let isValid = true;
      
      if (!task.title && !task.name) {
        taskIssues.push({
          type: 'error',
          entity: 'system',
          field: 'title',
          value: '',
          message: 'כותרת משימה חובה',
          row: idx + 1
        });
        isValid = false;
      }
      
      if (isValid) validCount++;
    });
    
    checks.push({
      tableName: 'משימות',
      totalRecords: tasks.length,
      validRecords: validCount,
      invalidRecords: tasks.length - validCount,
      issues: taskIssues
    });
  }
  
  // Meetings validation
  if (data.Meeting || data.meetings) {
    const meetings = data.Meeting || data.meetings || [];
    const meetingIssues: ValidationIssue[] = [];
    let validCount = 0;
    
    meetings.forEach((meeting: any, idx: number) => {
      let isValid = true;
      
      if (meeting.start_time && !validateDate(meeting.start_time)) {
        meetingIssues.push({
          type: 'warning',
          entity: 'system',
          field: 'start_time',
          value: meeting.start_time,
          message: 'זמן התחלה לא תקין',
          row: idx + 1
        });
      }
      
      if (isValid) validCount++;
    });
    
    checks.push({
      tableName: 'פגישות',
      totalRecords: meetings.length,
      validRecords: validCount,
      invalidRecords: meetings.length - validCount,
      issues: meetingIssues
    });
  }
  
  return checks;
};

const checkForDuplicates = (data: Record<string, any[]>): { table: string; count: number }[] => {
  const duplicates: { table: string; count: number }[] = [];
  
  // Check clients duplicates by name
  const clients = data.Client || data.clients || [];
  if (clients.length > 0) {
    const names = clients.map((c: any) => c.name?.toLowerCase().trim()).filter(Boolean);
    const uniqueNames = new Set(names);
    if (names.length > uniqueNames.size) {
      duplicates.push({ table: 'לקוחות', count: names.length - uniqueNames.size });
    }
  }
  
  // Check projects duplicates
  const projects = data.Project || data.projects || [];
  if (projects.length > 0) {
    const names = projects.map((p: any) => p.name?.toLowerCase().trim()).filter(Boolean);
    const uniqueNames = new Set(names);
    if (names.length > uniqueNames.size) {
      duplicates.push({ table: 'פרויקטים', count: names.length - uniqueNames.size });
    }
  }
  
  return duplicates;
};

const performComprehensiveValidation = async (
  data: any,
  operation: OperationType
): Promise<ComprehensiveValidationResult> => {
  const timestamp = new Date().toISOString();
  const issues: ValidationIssue[] = [];
  
  // JSON structure validation
  const jsonCheck = validateJsonStructure(data);
  if (!jsonCheck.isValid) {
    jsonCheck.errors.forEach(err => {
      issues.push({
        type: 'error',
        entity: 'system',
        field: 'structure',
        value: '',
        message: err
      });
    });
  }
  
  // Backup structure validation
  const backupIssues = validateBackupStructure(data);
  issues.push(...backupIssues);
  
  // Data integrity validation
  const dataToValidate = data.data || data.tables || data;
  const integrityChecks = await validateDataIntegrity(dataToValidate, operation);
  
  // Collect all issues from integrity checks
  integrityChecks.forEach(check => {
    issues.push(...check.issues);
  });
  
  // Check for duplicates
  const duplicates = checkForDuplicates(dataToValidate);
  
  // Calculate summary
  const errors = issues.filter(i => i.type === 'error').length;
  const warnings = issues.filter(i => i.type === 'warning').length;
  
  const result: ComprehensiveValidationResult = {
    isValid: errors === 0,
    operation,
    timestamp,
    summary: {
      totalChecks: integrityChecks.length + 2, // +2 for json and backup structure
      passedChecks: integrityChecks.filter(c => c.invalidRecords === 0).length + (jsonCheck.isValid ? 1 : 0) + (backupIssues.filter(i => i.type === 'error').length === 0 ? 1 : 0),
      failedChecks: errors,
      warnings
    },
    dataIntegrity: integrityChecks,
    schemaValidation: {
      isValid: true,
      missingTables: [],
      missingColumns: {}
    },
    referentialIntegrity: {
      isValid: true,
      orphanedRecords: [],
      brokenReferences: []
    },
    dataQuality: {
      duplicates,
      emptyRequiredFields: integrityChecks
        .flatMap(c => c.issues)
        .filter(i => i.message.includes('חובה'))
        .reduce((acc: { table: string; field: string; count: number }[], i) => {
          const existing = acc.find(a => a.field === i.field);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ table: i.entity, field: i.field, count: 1 });
          }
          return acc;
        }, []),
      invalidFormats: integrityChecks
        .flatMap(c => c.issues)
        .filter(i => i.message.includes('לא תקין'))
        .reduce((acc: { table: string; field: string; count: number }[], i) => {
          const existing = acc.find(a => a.field === i.field);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ table: i.entity, field: i.field, count: 1 });
          }
          return acc;
        }, [])
    },
    issues
  };
  
  return result;
};

interface CloudBackup {
  name: string;
  created_at: string;
  size: number;
  metadata?: {
    version?: string;
    tables?: Record<string, number>;
    totalRecords?: number;
  };
}

// Interface for external ArchFlow backup format
interface ArchFlowBackup {
  generated_at: string;
  by: string;
  total_records: number;
  categories: string[];
  data: {
    Client?: ArchFlowClient[];
    Project?: ArchFlowProject[];
    TimeLog?: ArchFlowTimeLog[];
    Task?: ArchFlowTask[];
    Meeting?: ArchFlowMeeting[];
    [key: string]: unknown[] | undefined;
  };
}

interface ArchFlowClient {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  status?: string;
  stage?: string;
  notes?: string;
  custom_data?: Record<string, any>;
  id: string;
  created_date: string;
  updated_date: string;
}

interface ArchFlowProject {
  name: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  id: string;
  created_date: string;
  updated_date: string;
}

interface ArchFlowTimeLog {
  client_id?: string;
  client_name?: string;
  log_date: string;
  duration_seconds: number;
  title?: string;
  notes?: string;
  id: string;
  created_date: string;
  updated_date: string;
}

interface ArchFlowTask {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  client_id?: string;
  project_id?: string;
  tags?: string[];
}

interface ArchFlowMeeting {
  id: string;
  title?: string;
  description?: string;
  client_id?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  notes?: string;
  status?: string;
}

interface JsonImportStats {
  clients: { total: number; imported: number; skipped: number };
  projects: { total: number; imported: number; skipped: number };
  time_entries: { total: number; imported: number; skipped: number };
  tasks: { total: number; imported: number; skipped: number };
  meetings: { total: number; imported: number; skipped: number };
}

// =====================================
// Main Component
// =====================================

export default function DataHub() {
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const { backups, isLoading: backupsLoading, createBackup, restoreBackup, deleteBackup, refreshBackups } = useBackupRestore();
  
  // Tab state from URL
  const [activeTab, setActiveTab] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'import';
  });

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);

  // Handle URL changes (back/forward)
  useEffect(() => {
    const onPopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setActiveTab(urlParams.get('tab') || 'import');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // =====================================
  // Import Tab State (Unified for all file types)
  // =====================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [parsedData, setParsedData] = useState<{
    clients: ParsedClient[];
    timeLogs: ParsedTimeLog[];
    projects: ParsedProject[];
  } | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [previewTab, setPreviewTab] = useState<'clients' | 'projects' | 'timelogs'>('clients');
  
  // Detected file type
  const [detectedFileType, setDetectedFileType] = useState<'csv' | 'excel' | 'json' | null>(null);
  const [detectedFileName, setDetectedFileName] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<string>('');
  
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    importClients: true,
    importProjects: true,
    importTimeLogs: true,
    skipDuplicates: false,
    overwriteDuplicates: true,
  });
  
  const [importStats, setImportStats] = useState({
    totalClients: 0,
    totalTimeLogs: 0,
    totalProjects: 0,
    successClients: 0,
    successTimeLogs: 0,
    successProjects: 0,
    duplicates: 0,
    errors: 0
  });

  // Validation state
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  
  // Comprehensive validation state
  const [comprehensiveValidation, setComprehensiveValidation] = useState<ComprehensiveValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showComprehensiveValidation, setShowComprehensiveValidation] = useState(false);

  // =====================================
  // Backup Tab State
  // =====================================
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupMetadata | null>(null);
  
  // Cloud backups
  const [cloudBackups, setCloudBackups] = useState<CloudBackup[]>([]);
  const [loadingCloudBackups, setLoadingCloudBackups] = useState(false);
  const [isContactsImportOpen, setIsContactsImportOpen] = useState(false);

  // =====================================
  // JSON Backup Import State
  // =====================================
  const [externalBackupData, setExternalBackupData] = useState<ArchFlowBackup | null>(null);
  const [isJsonImporting, setIsJsonImporting] = useState(false);
  const [jsonImportProgress, setJsonImportProgress] = useState(0);
  const [jsonImportMessage, setJsonImportMessage] = useState('');
  const [jsonImportStats, setJsonImportStats] = useState<JsonImportStats | null>(null);
  const [lastImportError, setLastImportError] = useState<string | null>(null);
  const [jsonImportOptions, setJsonImportOptions] = useState({
    clients: true,
    projects: true,
    time_entries: true,
    tasks: true,
    meetings: true,
  });

  // =====================================
  // Helper Functions
  // =====================================
  
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getStatusIcon = (status: ImportResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'duplicate': return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: ImportResult['type']) => {
    switch (type) {
      case 'client': return <Users className="h-4 w-4" />;
      case 'time_entry': return <Clock className="h-4 w-4" />;
      case 'project': return <FolderKanban className="h-4 w-4" />;
    }
  };

  // =====================================
  // Validation Function
  // =====================================
  
  const validateParsedData = useCallback((data: {
    clients: ParsedClient[];
    timeLogs: ParsedTimeLog[];
    projects: ParsedProject[];
  }): ValidationSummary => {
    const issues: ValidationIssue[] = [];
    let duplicatesFound = 0;
    let emptyRequiredFields = 0;
    let invalidEmails = 0;
    let invalidPhones = 0;
    let invalidDates = 0;
    
    // Track seen names for duplicate detection
    const seenClientNames = new Set<string>();
    const seenProjectNames = new Set<string>();
    
    // Validate Clients
    data.clients.forEach((client, idx) => {
      const row = idx + 1;
      
      // Required: name
      if (!validateRequiredField(client.name, 'name')) {
        issues.push({
          type: 'error',
          entity: 'client',
          field: 'שם',
          value: client.name || '(ריק)',
          message: 'שם לקוח הוא שדה חובה',
          row
        });
        emptyRequiredFields++;
      } else {
        // Check for duplicates in file
        const normalizedName = client.name.trim().toLowerCase();
        if (seenClientNames.has(normalizedName)) {
          issues.push({
            type: 'warning',
            entity: 'client',
            field: 'שם',
            value: client.name,
            message: 'לקוח כפול בקובץ',
            row
          });
          duplicatesFound++;
        } else {
          seenClientNames.add(normalizedName);
        }
      }
      
      // Validate email
      if (client.email && !validateEmail(client.email)) {
        issues.push({
          type: 'warning',
          entity: 'client',
          field: 'אימייל',
          value: client.email,
          message: 'פורמט אימייל לא תקין',
          row
        });
        invalidEmails++;
      }
      
      // Validate phone
      if (client.phone && !validatePhone(client.phone)) {
        issues.push({
          type: 'info',
          entity: 'client',
          field: 'טלפון',
          value: client.phone,
          message: 'פורמט טלפון לא סטנדרטי',
          row
        });
        invalidPhones++;
      }
    });
    
    // Validate Projects
    data.projects.forEach((project, idx) => {
      const row = idx + 1;
      
      // Required: name
      if (!validateRequiredField(project.name, 'name')) {
        issues.push({
          type: 'error',
          entity: 'project',
          field: 'שם',
          value: project.name || '(ריק)',
          message: 'שם פרויקט הוא שדה חובה',
          row
        });
        emptyRequiredFields++;
      } else {
        const normalizedName = project.name.trim().toLowerCase();
        if (seenProjectNames.has(normalizedName)) {
          issues.push({
            type: 'warning',
            entity: 'project',
            field: 'שם',
            value: project.name,
            message: 'פרויקט כפול בקובץ',
            row
          });
          duplicatesFound++;
        } else {
          seenProjectNames.add(normalizedName);
        }
      }
      
      // Validate dates
      if (project.start_date && !validateDate(project.start_date)) {
        issues.push({
          type: 'warning',
          entity: 'project',
          field: 'תאריך התחלה',
          value: project.start_date,
          message: 'פורמט תאריך לא תקין',
          row
        });
        invalidDates++;
      }
      if (project.end_date && !validateDate(project.end_date)) {
        issues.push({
          type: 'warning',
          entity: 'project',
          field: 'תאריך סיום',
          value: project.end_date,
          message: 'פורמט תאריך לא תקין',
          row
        });
        invalidDates++;
      }
    });
    
    // Validate Time Logs
    data.timeLogs.forEach((log, idx) => {
      const row = idx + 1;
      
      // Required: client reference
      if (!log.client_name && !log.client_id_ref) {
        issues.push({
          type: 'error',
          entity: 'timelog',
          field: 'לקוח',
          value: '(ריק)',
          message: 'חובה לציין לקוח לרישום זמן',
          row
        });
        emptyRequiredFields++;
      }
      
      // Validate date
      if (!log.log_date) {
        issues.push({
          type: 'error',
          entity: 'timelog',
          field: 'תאריך',
          value: '(ריק)',
          message: 'תאריך הוא שדה חובה',
          row
        });
        emptyRequiredFields++;
      } else if (!validateDate(log.log_date)) {
        issues.push({
          type: 'warning',
          entity: 'timelog',
          field: 'תאריך',
          value: log.log_date,
          message: 'פורמט תאריך לא תקין',
          row
        });
        invalidDates++;
      }
      
      // Validate duration
      if (!log.duration_seconds || log.duration_seconds <= 0) {
        issues.push({
          type: 'warning',
          entity: 'timelog',
          field: 'משך',
          value: String(log.duration_seconds || 0),
          message: 'משך זמן לא תקין או חסר',
          row
        });
      }
    });
    
    const errors = issues.filter(i => i.type === 'error').length;
    const warnings = issues.filter(i => i.type === 'warning').length;
    const infos = issues.filter(i => i.type === 'info').length;
    
    return {
      isValid: errors === 0,
      errors,
      warnings,
      infos,
      issues,
      duplicatesFound,
      emptyRequiredFields,
      invalidEmails,
      invalidPhones,
      invalidDates
    };
  }, []);

  // =====================================
  // Import Functions
  // =====================================
  
  // Advanced CSV parser
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let braceDepth = 0;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && braceDepth === 0) {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === '{' && !inQuotes) {
        braceDepth++;
        current += char;
      } else if (char === '}' && !inQuotes) {
        braceDepth--;
        current += char;
      } else if (char === ',' && !inQuotes && braceDepth === 0) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseJsonField = (value: string): Record<string, any> | null => {
    if (!value || value === '""' || value === '') return null;
    try {
      let cleanValue = value.trim();
      if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
        cleanValue = cleanValue.slice(1, -1);
      }
      cleanValue = cleanValue.replace(/""/g, '"');
      return JSON.parse(cleanValue);
    } catch {
      return null;
    }
  };

  const parseTagsField = (value: string): string[] => {
    if (!value || value === '""' || value === '') return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      return [String(parsed)];
    } catch {
      return value.split(',').map(t => t.trim()).filter(Boolean);
    }
  };

  const parseBackupFile = (content: string) => {
    const lines = content.split('\n');
    const clients: ParsedClient[] = [];
    const timeLogs: ParsedTimeLog[] = [];
    const projects: ParsedProject[] = [];
    
    let currentSection = '';
    let headers: string[] = [];
    let headersParsed = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('# ')) continue;
      
      if (line.startsWith('### ')) {
        const sectionMatch = line.match(/### (\w+)/);
        if (sectionMatch) {
          const sectionType = sectionMatch[1].toLowerCase();
          if (sectionType === 'client') currentSection = 'client';
          else if (sectionType === 'timelog' || sectionType === 'time_log') currentSection = 'timelog';
          else if (sectionType === 'project' || sectionType === 'task') currentSection = 'project';
        }
        headersParsed = false;
        continue;
      }
      
      if (!headersParsed && line.includes(',') && currentSection) {
        const lowerLine = line.toLowerCase();
        if (currentSection === 'client' && lowerLine.includes('name') && !lowerLine.includes('###')) {
          headers = parseCSVLine(line);
          headersParsed = true;
          continue;
        }
        if (currentSection === 'timelog' && (lowerLine.includes('client_id') || lowerLine.includes('duration'))) {
          headers = parseCSVLine(line);
          headersParsed = true;
          continue;
        }
        if (currentSection === 'project' && (lowerLine.includes('name') || lowerLine.includes('client'))) {
          headers = parseCSVLine(line);
          headersParsed = true;
          continue;
        }
      }
      
      // Parse data based on section...
      if (currentSection === 'client' && headersParsed && line.includes(',')) {
        try {
          const values = parseCSVLine(line);
          if (values.length > 0 && values[0]) {
            const getVal = (key: string): string | undefined => {
              const idx = headers.indexOf(key);
              return idx >= 0 ? values[idx] : undefined;
            };
            const name = getVal('name') || values[0] || '';
            if (!name || name.startsWith('###') || name === 'name') continue;
            
            clients.push({
              name,
              email: getVal('email'),
              phone: getVal('phone'),
              company: getVal('company'),
              status: getVal('status'),
              original_id: getVal('id'),
            });
          }
        } catch (e) { /* skip */ }
      }
      
      if (currentSection === 'timelog' && headersParsed && line.includes(',')) {
        try {
          const values = parseCSVLine(line);
          if (values.length > 3) {
            const getVal = (key: string): string | undefined => {
              const idx = headers.indexOf(key);
              return idx >= 0 ? values[idx] : undefined;
            };
            const clientName = getVal('client_name') || values[1] || '';
            if (!clientName || clientName === 'client_name') continue;
            
            timeLogs.push({
              client_id_ref: getVal('client_id') || values[0],
              client_name: clientName,
              log_date: getVal('log_date') || values[2],
              duration_seconds: parseInt(getVal('duration_seconds') || values[3]) || 0,
            });
          }
        } catch (e) { /* skip */ }
      }
      
      if (currentSection === 'project' && headersParsed && line.includes(',')) {
        try {
          const values = parseCSVLine(line);
          if (values.length > 0 && values[0]) {
            const getVal = (key: string): string | undefined => {
              const idx = headers.indexOf(key);
              return idx >= 0 ? values[idx] : undefined;
            };
            const name = getVal('name') || values[0] || '';
            if (!name || name.startsWith('###') || name === 'name') continue;
            
            projects.push({
              name,
              client_name: getVal('client_name'),
              status: getVal('status'),
            });
          }
        } catch (e) { /* skip */ }
      }
    }
    
    return { clients, timeLogs, projects };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setDetectedFileName(file.name);
    setLastImportError(null);
    
    try {
      setIsProcessing(true);
      setCurrentAction('מזהה סוג קובץ...');
      
      const fileName = file.name.toLowerCase();
      
      // =====================================
      // JSON FILE HANDLING
      // =====================================
      if (fileName.endsWith('.json')) {
        setDetectedFileType('json');
        setCurrentAction('קורא קובץ JSON...');
        
        const text = await file.text();
        const result = normalizeExternalBackup(text, file.name);
        
        if (!result.success || !result.data) {
          const supportedFormats = getSupportedFormats();
          const errorDetails = [
            `שם קובץ: ${file.name}`,
            `פורמט שזוהה: ${result.detectedFormat || 'לא ידוע'}`,
            result.detectedKeys?.length ? `מפתחות שנמצאו: ${result.detectedKeys.slice(0, 5).join(', ')}${result.detectedKeys.length > 5 ? '...' : ''}` : '',
            '',
            'פורמטים נתמכים:',
            ...supportedFormats.map(f => `• ${f}`),
          ].filter(Boolean).join('\n');
          
          setLastImportError(errorDetails);
          
          toast({
            title: 'שגיאה בזיהוי פורמט הקובץ',
            description: result.error || 'הקובץ אינו בפורמט תקין',
            variant: 'destructive',
          });
          return;
        }
        
        setDetectedFormat(result.detectedFormat || 'JSON גיבוי');
        
        // Convert to ArchFlowBackup format
        const normalizedData: ArchFlowBackup = {
          generated_at: result.data.generated_at,
          by: result.data.by,
          total_records: result.data.total_records,
          categories: result.data.categories,
          data: result.data.data as ArchFlowBackup['data'],
        };
        
        setExternalBackupData(normalizedData);
        setJsonImportStats(null);
        setFileSelected(true);
        
        // Update JSON import options based on available data
        setJsonImportOptions({
          clients: !!normalizedData.data.Client?.length,
          projects: !!normalizedData.data.Project?.length,
          time_entries: !!normalizedData.data.TimeLog?.length,
          tasks: !!normalizedData.data.Task?.length,
          meetings: !!normalizedData.data.Meeting?.length,
        });
        
        toast({
          title: 'קובץ JSON נטען בהצלחה ✓',
          description: `זוהה: ${result.detectedFormat}. ${result.data.total_records} רשומות ב-${result.data.categories.length} קטגוריות.`,
        });
        
        return;
      }
      
      // =====================================
      // EXCEL FILE HANDLING
      // =====================================
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        setDetectedFileType('excel');
        setCurrentAction('קורא קובץ Excel...');
        
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const clients: ParsedClient[] = [];
        const timeLogs: ParsedTimeLog[] = [];
        const projects: ParsedProject[] = [];
        
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
          
          const lowerName = sheetName.toLowerCase();
          if (lowerName.includes('client') || lowerName.includes('לקוח')) {
            for (const row of data) {
              clients.push({
                name: row.name || row.שם || row.Name || '',
                email: row.email || row.אימייל,
                phone: row.phone || row.טלפון,
                company: row.company || row.חברה,
                status: row.status || row.סטטוס,
              });
            }
          }
          if (lowerName.includes('project') || lowerName.includes('פרויקט')) {
            for (const row of data) {
              projects.push({
                name: row.name || row.שם || row.Name || '',
                clientName: row.client || row.לקוח || row.client_name,
                status: row.status || row.סטטוס,
              });
            }
          }
          if (lowerName.includes('time') || lowerName.includes('זמן') || lowerName.includes('log')) {
            for (const row of data) {
              timeLogs.push({
                clientName: row.client || row.לקוח || row.client_name || '',
                date: row.date || row.תאריך,
                duration: parseInt(row.duration || row.duration_seconds || row.משך || '0'),
                title: row.title || row.כותרת || row.description,
                notes: row.notes || row.הערות,
              });
            }
          }
        }
        
        const parsed = { clients, timeLogs, projects };
        setParsedData(parsed);
        setFileSelected(true);
        setDetectedFormat(`Excel (${workbook.SheetNames.length} גליונות)`);
        setExternalBackupData(null);
        
        setImportStats(prev => ({
          ...prev,
          totalClients: parsed.clients.length,
          totalTimeLogs: parsed.timeLogs.length,
          totalProjects: parsed.projects.length,
        }));
        
        const validation = validateParsedData(parsed);
        setValidationSummary(validation);
        
        toast({
          title: 'קובץ Excel נטען בהצלחה ✓',
          description: `${parsed.clients.length} לקוחות, ${parsed.projects.length} פרויקטים, ${parsed.timeLogs.length} רישומי זמן`,
        });
        
        return;
      }
      
      // =====================================
      // CSV/TXT FILE HANDLING
      // =====================================
      setDetectedFileType('csv');
      setCurrentAction('קורא קובץ CSV...');
      
      const content = await file.text();
      const parsed = parseBackupFile(content);
      
      setParsedData(parsed);
      setFileSelected(true);
      setDetectedFormat('CSV / טקסט');
      setExternalBackupData(null);
      
      setImportStats(prev => ({
        ...prev,
        totalClients: parsed.clients.length,
        totalTimeLogs: parsed.timeLogs.length,
        totalProjects: parsed.projects.length,
      }));
      
      const validation = validateParsedData(parsed);
      setValidationSummary(validation);
      
      if (validation.errors > 0) {
        toast({
          title: 'נמצאו בעיות בקובץ',
          description: `${validation.errors} שגיאות, ${validation.warnings} אזהרות`,
          variant: 'destructive',
        });
      } else if (validation.warnings > 0) {
        toast({
          title: 'קובץ נטען עם אזהרות',
          description: `${parsed.clients.length} לקוחות, ${validation.warnings} אזהרות`,
        });
      } else {
        toast({
          title: 'קובץ CSV נטען בהצלחה ✓',
          description: `${parsed.clients.length} לקוחות, ${parsed.projects.length} פרויקטים`,
        });
      }
      
    } catch (error) {
      toast({
        title: 'שגיאה בקריאת הקובץ',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction('');
    }
  };

  const handleImport = async () => {
    if (!parsedData || !user) return;
    
    setIsProcessing(true);
    setResults([]);
    const newResults: ImportResult[] = [];
    let successClients = 0, successProjects = 0, successTimeLogs = 0;
    let duplicates = 0, errors = 0;
    
    const total = 
      (importOptions.importClients ? parsedData.clients.length : 0) +
      (importOptions.importProjects ? parsedData.projects.length : 0) +
      (importOptions.importTimeLogs ? parsedData.timeLogs.length : 0);
    
    let processed = 0;
    
    // Import clients
    if (importOptions.importClients) {
      setCurrentAction('מייבא לקוחות...');
      for (const client of parsedData.clients) {
        try {
          // Check for duplicate
          const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .eq('name', client.name)
            .maybeSingle();
          
          if (existing) {
            if (importOptions.skipDuplicates) {
              newResults.push({ type: 'client', name: client.name, status: 'duplicate', message: 'דולג - קיים במערכת' });
              duplicates++;
            } else if (importOptions.overwriteDuplicates) {
              await supabase.from('clients').update({
                email: client.email,
                phone: client.phone,
                company: client.company,
                status: client.status || 'active',
              }).eq('id', existing.id);
              newResults.push({ type: 'client', name: client.name, status: 'success', message: 'עודכן' });
              successClients++;
            }
          } else {
            const { error } = await supabase.from('clients').insert({
              name: client.name,
              email: client.email,
              phone: client.phone,
              company: client.company,
              status: client.status || 'active',
              created_by: user.id,
            });
            
            if (error) {
              newResults.push({ type: 'client', name: client.name, status: 'error', message: error.message });
              errors++;
            } else {
              newResults.push({ type: 'client', name: client.name, status: 'success', message: 'נוסף בהצלחה' });
              successClients++;
            }
          }
        } catch (e) {
          errors++;
        }
        processed++;
        setProgress(Math.round((processed / total) * 100));
      }
    }
    
    setResults(newResults);
    setImportStats(prev => ({
      ...prev,
      successClients,
      successProjects,
      successTimeLogs,
      duplicates,
      errors,
    }));
    setIsProcessing(false);
    setCurrentAction('');
    
    toast({
      title: 'ייבוא הושלם',
      description: `${successClients} לקוחות, ${duplicates} כפילויות, ${errors} שגיאות`,
    });
  };

  const resetImport = () => {
    setParsedData(null);
    setFileSelected(false);
    setResults([]);
    setProgress(0);
    setValidationSummary(null);
    setShowValidationDetails(false);
    setDetectedFileType(null);
    setDetectedFileName('');
    setDetectedFormat('');
    setExternalBackupData(null);
    setJsonImportStats(null);
    setLastImportError(null);
    setImportStats({
      totalClients: 0, totalTimeLogs: 0, totalProjects: 0,
      successClients: 0, successTimeLogs: 0, successProjects: 0,
      duplicates: 0, errors: 0
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const template = [
      { name: 'שם לקוח', email: 'email@example.com', phone: '050-1234567', company: 'חברה', status: 'active' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'לקוחות');
    XLSX.writeFile(wb, 'template_import.xlsx');
  };

  // =====================================
  // Backup Functions
  // =====================================
  
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await createBackup('ידני');
      toast({ title: 'גיבוי נוצר בהצלחה' });
    } catch (error) {
      toast({ title: 'שגיאה ביצירת גיבוי', variant: 'destructive' });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // =====================================
  // JSON Backup Import Functions
  // =====================================

  const runComprehensiveValidation = useCallback(async (data: any, operation: OperationType) => {
    setIsValidating(true);
    try {
      const result = await performComprehensiveValidation(data, operation);
      setComprehensiveValidation(result);
      setShowComprehensiveValidation(true);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleJsonImport = async () => {
    if (!externalBackupData || !user?.id) return;
    
    setIsJsonImporting(true);
    setJsonImportProgress(0);
    setJsonImportMessage('מבצע ולידציה לפני ייבוא...');
    
    // Run comprehensive validation first
    const validationResult = await runComprehensiveValidation(externalBackupData, 'import');
    
    // Check for critical errors
    const criticalErrors = validationResult.issues.filter(i => i.type === 'error');
    if (criticalErrors.length > 0) {
      setJsonImportMessage('נמצאו שגיאות קריטיות - בדוק את הולידציה');
      toast({
        title: 'נמצאו שגיאות בקובץ',
        description: `${criticalErrors.length} שגיאות קריטיות. בדוק את פרטי הולידציה לפני המשך`,
        variant: 'destructive',
      });
      setIsJsonImporting(false);
      return;
    }
    
    setJsonImportMessage('מתחיל ייבוא...');
    
    const stats: JsonImportStats = {
      clients: { total: 0, imported: 0, skipped: 0 },
      projects: { total: 0, imported: 0, skipped: 0 },
      time_entries: { total: 0, imported: 0, skipped: 0 },
      tasks: { total: 0, imported: 0, skipped: 0 },
      meetings: { total: 0, imported: 0, skipped: 0 },
    };
    
    const clientIdMap: Record<string, string> = {};
    const projectIdMap: Record<string, string> = {};
    
    try {
      // 1. Import Clients
      if (jsonImportOptions.clients && externalBackupData.data.Client) {
        const clients = externalBackupData.data.Client;
        stats.clients.total = clients.length;
        setJsonImportMessage(`מייבא לקוחות... (0/${clients.length})`);
        
        for (let i = 0; i < clients.length; i++) {
          const client = clients[i];
          setJsonImportProgress(Math.round((i / clients.length) * 20));
          
          // Check if client exists
          const { data: existing } = await supabase
            .from('clients')
            .select('id, name')
            .eq('user_id', user.id)
            .ilike('name', client.name)
            .maybeSingle();
          
          if (existing) {
            clientIdMap[client.id] = existing.id;
            stats.clients.skipped++;
          } else {
            const { data: inserted, error } = await supabase
              .from('clients')
              .insert({
                user_id: user.id,
                name: client.name,
                email: client.email || null,
                phone: client.phone || null,
                address: client.address || null,
                company: client.company || null,
                status: client.status || 'active',
                stage: client.stage || null,
                notes: client.notes || null,
              })
              .select('id')
              .single();
            
            if (inserted) {
              clientIdMap[client.id] = inserted.id;
              stats.clients.imported++;
            }
          }
          
          setJsonImportMessage(`מייבא לקוחות... (${i + 1}/${clients.length})`);
        }
      }
      
      // 2. Import Projects
      if (jsonImportOptions.projects && externalBackupData.data.Project) {
        const projects = externalBackupData.data.Project;
        stats.projects.total = projects.length;
        setJsonImportMessage(`מייבא פרויקטים... (0/${projects.length})`);
        
        for (let i = 0; i < projects.length; i++) {
          const project = projects[i];
          setJsonImportProgress(20 + Math.round((i / projects.length) * 20));
          
          // Map client_id if exists
          let mappedClientId = project.client_id ? clientIdMap[project.client_id] : null;
          
          // If no mapping, try to find client by name
          if (!mappedClientId && project.client_name) {
            const { data: foundClient } = await supabase
              .from('clients')
              .select('id')
              .eq('user_id', user.id)
              .ilike('name', project.client_name)
              .maybeSingle();
            if (foundClient) {
              mappedClientId = foundClient.id;
            }
          }
          
          const { data: existing } = await supabase
            .from('projects')
            .select('id, name')
            .eq('user_id', user.id)
            .ilike('name', project.name)
            .maybeSingle();
          
          if (existing) {
            projectIdMap[project.id] = existing.id;
            stats.projects.skipped++;
          } else {
            const { data: inserted } = await supabase
              .from('projects')
              .insert({
                user_id: user.id,
                name: project.name,
                description: project.description || null,
                client_id: mappedClientId,
                status: project.status || 'active',
                priority: project.priority || 'medium',
                start_date: project.start_date || null,
                end_date: project.end_date || null,
                budget: project.budget || null,
              })
              .select('id')
              .single();
            
            if (inserted) {
              projectIdMap[project.id] = inserted.id;
              stats.projects.imported++;
            }
          }
          
          setJsonImportMessage(`מייבא פרויקטים... (${i + 1}/${projects.length})`);
        }
      }
      
      // 3. Import Time Entries
      if (jsonImportOptions.time_entries && externalBackupData.data.TimeLog) {
        const timeLogs = externalBackupData.data.TimeLog;
        stats.time_entries.total = timeLogs.length;
        setJsonImportMessage(`מייבא רישומי זמן... (0/${timeLogs.length})`);
        
        for (let i = 0; i < timeLogs.length; i++) {
          const timeLog = timeLogs[i];
          setJsonImportProgress(40 + Math.round((i / timeLogs.length) * 20));
          
          // Map client_id
          let mappedClientId = timeLog.client_id ? clientIdMap[timeLog.client_id] : null;
          
          // If no mapping, try to find client by name
          if (!mappedClientId && timeLog.client_name) {
            const { data: foundClient } = await supabase
              .from('clients')
              .select('id')
              .eq('user_id', user.id)
              .ilike('name', timeLog.client_name)
              .maybeSingle();
            if (foundClient) {
              mappedClientId = foundClient.id;
            }
          }
          
          if (mappedClientId) {
            const { error } = await supabase
              .from('time_entries')
              .insert({
                user_id: user.id,
                client_id: mappedClientId,
                date: timeLog.log_date,
                duration: timeLog.duration_seconds,
                description: timeLog.title || timeLog.notes || '',
              });
            
            if (!error) {
              stats.time_entries.imported++;
            } else {
              stats.time_entries.skipped++;
            }
          } else {
            stats.time_entries.skipped++;
          }
          
          setJsonImportMessage(`מייבא רישומי זמן... (${i + 1}/${timeLogs.length})`);
        }
      }
      
      // 4. Import Tasks
      if (jsonImportOptions.tasks && externalBackupData.data.Task) {
        const tasks = externalBackupData.data.Task;
        stats.tasks.total = tasks.length;
        setJsonImportMessage(`מייבא משימות... (0/${tasks.length})`);
        
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          setJsonImportProgress(60 + Math.round((i / tasks.length) * 20));
          
          const mappedClientId = task.client_id ? clientIdMap[task.client_id] : null;
          const mappedProjectId = task.project_id ? projectIdMap[task.project_id] : null;
          
          const { error } = await supabase
            .from('tasks')
            .insert({
              user_id: user.id,
              title: task.title,
              description: task.description || null,
              status: task.status || 'pending',
              priority: task.priority || 'medium',
              due_date: task.due_date || null,
              client_id: mappedClientId,
              project_id: mappedProjectId,
            });
          
          if (!error) {
            stats.tasks.imported++;
          } else {
            stats.tasks.skipped++;
          }
          
          setJsonImportMessage(`מייבא משימות... (${i + 1}/${tasks.length})`);
        }
      }
      
      // 5. Import Meetings
      if (jsonImportOptions.meetings && externalBackupData.data.Meeting) {
        const meetings = externalBackupData.data.Meeting;
        stats.meetings.total = meetings.length;
        setJsonImportMessage(`מייבא פגישות... (0/${meetings.length})`);
        
        for (let i = 0; i < meetings.length; i++) {
          const meeting = meetings[i];
          setJsonImportProgress(80 + Math.round((i / meetings.length) * 20));
          
          const mappedClientId = meeting.client_id ? clientIdMap[meeting.client_id] : null;
          
          const { error } = await supabase
            .from('meetings')
            .insert({
              user_id: user.id,
              title: meeting.title || 'פגישה',
              description: meeting.description || null,
              client_id: mappedClientId,
              start_time: meeting.start_time || null,
              end_time: meeting.end_time || null,
              location: meeting.location || null,
              notes: meeting.notes || null,
              status: meeting.status || 'scheduled',
            });
          
          if (!error) {
            stats.meetings.imported++;
          } else {
            stats.meetings.skipped++;
          }
          
          setJsonImportMessage(`מייבא פגישות... (${i + 1}/${meetings.length})`);
        }
      }
      
      setJsonImportProgress(100);
      setJsonImportStats(stats);
      setJsonImportMessage('ייבוא הושלם בהצלחה!');
      
      const totalImported = stats.clients.imported + stats.projects.imported + 
        stats.time_entries.imported + stats.tasks.imported + stats.meetings.imported;
      
      toast({
        title: 'ייבוא הושלם בהצלחה',
        description: `יובאו ${totalImported} רשומות`,
      });
      
    } catch (error) {
      console.error('Import failed:', error);
      setJsonImportMessage('שגיאה בייבוא');
      toast({
        title: 'שגיאה בייבוא',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    } finally {
      setIsJsonImporting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    setIsRestoring(true);
    try {
      await restoreBackup(selectedBackup.id);
      toast({ title: 'שחזור הושלם בהצלחה' });
    } catch (error) {
      toast({ title: 'שגיאה בשחזור', variant: 'destructive' });
    } finally {
      setIsRestoring(false);
      setRestoreDialogOpen(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!backupToDelete) return;
    try {
      await deleteBackup(backupToDelete.id);
      toast({ title: 'גיבוי נמחק' });
    } catch (error) {
      toast({ title: 'שגיאה במחיקה', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setBackupToDelete(null);
    }
  };

  // Load cloud backups
  useEffect(() => {
    const loadCloudBackups = async () => {
      if (!user?.id) return;
      setLoadingCloudBackups(true);
      try {
        const { data } = await supabase.storage
          .from('backups')
          .list(user.id, { sortBy: { column: 'created_at', order: 'desc' } });
        
        if (data) {
          setCloudBackups(data.map(f => ({
            name: f.name,
            created_at: f.created_at || '',
            size: f.metadata?.size || 0,
          })));
        }
      } catch (e) { /* ignore */ }
      finally { setLoadingCloudBackups(false); }
    };
    
    if (activeTab === 'backups') {
      loadCloudBackups();
    }
  }, [user?.id, activeTab]);

  // =====================================
  // Access Control
  // =====================================
  
  if (!isAdmin && !isManager) {
    return (
      <AppLayout title="מרכז נתונים">
        <div className="p-6 flex items-center justify-center min-h-[400px]" dir="rtl">
          <Card className="max-w-md text-center">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <CardTitle>אין גישה</CardTitle>
              <CardDescription>
                רק מנהלים יכולים לגשת למרכז הנתונים
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // =====================================
  // Render
  // =====================================
  
  return (
    <AppLayout title="מרכז נתונים">
      <div className="p-6 space-y-6 animate-fade-in" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="gap-1">
            <Cloud className="h-3 w-3" />
            מסונכרן
          </Badge>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">מרכז נתונים</h1>
            <HardDrive className="h-7 w-7 text-primary" />
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger 
              value="import" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Upload className="h-4 w-4" />
              <span>ייבוא נתונים</span>
              <Badge variant="secondary" className="mr-2 text-xs">כל הפורמטים</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="backups" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Database className="h-4 w-4" />
              <span>גיבוי ושחזור</span>
              <Badge variant="secondary" className="mr-2 text-xs">{backups.length} גיבויים</Badge>
            </TabsTrigger>
          </TabsList>

          {/* =====================================
              UNIFIED IMPORT TAB
              ===================================== */}
          <TabsContent value="import" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-end">
                  ייבוא נתונים - זיהוי אוטומטי
                  <Upload className="h-5 w-5" />
                </CardTitle>
                <CardDescription className="text-right">
                  העלה קובץ בכל פורמט - המערכת תזהה אוטומטית (JSON, Excel, CSV)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  {/* File Selection */}
                  <div className="flex flex-col items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.xlsx,.xls,.json"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isProcessing || isJsonImporting}
                    />
                    
                    {!fileSelected ? (
                      <div className="w-full max-w-lg space-y-4">
                        {/* Main Upload Button */}
                        <div 
                          onClick={() => !isProcessing && fileInputRef.current?.click()}
                          className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                            "hover:border-primary hover:bg-muted/50",
                            isProcessing && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isProcessing ? (
                            <div className="space-y-3">
                              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                              <p className="text-lg font-medium">{currentAction}</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex justify-center gap-3">
                                <FileJson className="h-10 w-10 text-green-500" />
                                <FileSpreadsheet className="h-10 w-10 text-blue-500" />
                                <FileText className="h-10 w-10 text-orange-500" />
                              </div>
                              <p className="text-xl font-medium">גרור קובץ לכאן או לחץ לבחירה</p>
                              <div className="flex justify-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  <FileJson className="h-3 w-3 ml-1" />
                                  JSON גיבוי
                                </Badge>
                                <Badge variant="outline" className="text-blue-600 border-blue-300">
                                  <FileSpreadsheet className="h-3 w-3 ml-1" />
                                  Excel
                                </Badge>
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  <FileText className="h-3 w-3 ml-1" />
                                  CSV
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                המערכת מזהה אוטומטית את סוג הקובץ ומציגה תצוגה מקדימה
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={downloadTemplate}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 ml-2" />
                            הורד תבנית Excel
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsContactsImportOpen(true)}
                            className="flex-1"
                          >
                            <Contact className="h-4 w-4 ml-2" />
                            ייבוא אנשי קשר
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* File Loaded State */
                      <div className="w-full space-y-4">
                        {/* File Info Bar */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted to-muted/50 border">
                          <Button variant="outline" size="sm" onClick={resetImport}>
                            <RefreshCw className="h-4 w-4 ml-2" />
                            בחר קובץ אחר
                          </Button>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-medium">{detectedFileName}</p>
                              <p className="text-sm text-muted-foreground">{detectedFormat}</p>
                            </div>
                            {detectedFileType === 'json' && <FileJson className="h-8 w-8 text-green-500" />}
                            {detectedFileType === 'excel' && <FileSpreadsheet className="h-8 w-8 text-blue-500" />}
                            {detectedFileType === 'csv' && <FileText className="h-8 w-8 text-orange-500" />}
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview & Options */}
                  {fileSelected && parsedData && (
                    <>
                      <Separator />
                      
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                            <div className="text-2xl font-bold">{parsedData.clients.length}</div>
                            <div className="text-sm text-muted-foreground">לקוחות</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <FolderKanban className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                            <div className="text-2xl font-bold">{parsedData.projects.length}</div>
                            <div className="text-sm text-muted-foreground">פרויקטים</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <Clock className="h-6 w-6 mx-auto mb-2 text-green-500" />
                            <div className="text-2xl font-bold">{parsedData.timeLogs.length}</div>
                            <div className="text-sm text-muted-foreground">רישומי זמן</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Validation Summary */}
                      {validationSummary && (
                        <Card className={cn(
                          "border-2",
                          validationSummary.errors > 0 ? "border-red-500/50 bg-red-500/5" :
                          validationSummary.warnings > 0 ? "border-yellow-500/50 bg-yellow-500/5" :
                          "border-green-500/50 bg-green-500/5"
                        )}>
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-base">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowValidationDetails(!showValidationDetails)}
                              >
                                {showValidationDetails ? 'הסתר פרטים' : 'הצג פרטים'}
                              </Button>
                              <div className="flex items-center gap-2">
                                {validationSummary.errors > 0 ? (
                                  <><XCircle className="h-5 w-5 text-red-500" /> נמצאו בעיות בקובץ</>
                                ) : validationSummary.warnings > 0 ? (
                                  <><AlertCircle className="h-5 w-5 text-yellow-500" /> נמצאו אזהרות</>
                                ) : (
                                  <><CheckCircle className="h-5 w-5 text-green-500" /> הקובץ תקין לייבוא</>
                                )}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {/* Validation Stats */}
                            <div className="grid grid-cols-5 gap-2 text-center text-sm mb-4">
                              <div className={cn("p-2 rounded", validationSummary.errors > 0 ? "bg-red-500/20" : "bg-muted")}>
                                <div className="font-bold text-red-500">{validationSummary.errors}</div>
                                <div className="text-xs">שגיאות</div>
                              </div>
                              <div className={cn("p-2 rounded", validationSummary.warnings > 0 ? "bg-yellow-500/20" : "bg-muted")}>
                                <div className="font-bold text-yellow-500">{validationSummary.warnings}</div>
                                <div className="text-xs">אזהרות</div>
                              </div>
                              <div className={cn("p-2 rounded", validationSummary.duplicatesFound > 0 ? "bg-blue-500/20" : "bg-muted")}>
                                <div className="font-bold text-blue-500">{validationSummary.duplicatesFound}</div>
                                <div className="text-xs">כפילויות</div>
                              </div>
                              <div className={cn("p-2 rounded", validationSummary.invalidEmails > 0 ? "bg-orange-500/20" : "bg-muted")}>
                                <div className="font-bold text-orange-500">{validationSummary.invalidEmails}</div>
                                <div className="text-xs">אימיילים</div>
                              </div>
                              <div className={cn("p-2 rounded", validationSummary.invalidPhones > 0 ? "bg-purple-500/20" : "bg-muted")}>
                                <div className="font-bold text-purple-500">{validationSummary.invalidPhones}</div>
                                <div className="text-xs">טלפונים</div>
                              </div>
                            </div>

                            {/* Details */}
                            {showValidationDetails && validationSummary.issues.length > 0 && (
                              <ScrollArea className="h-48 border rounded-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-right w-16">שורה</TableHead>
                                      <TableHead className="text-right w-20">סוג</TableHead>
                                      <TableHead className="text-right w-24">שדה</TableHead>
                                      <TableHead className="text-right">ערך</TableHead>
                                      <TableHead className="text-right">הודעה</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {validationSummary.issues.slice(0, 50).map((issue, idx) => (
                                      <TableRow key={idx} className={cn(
                                        issue.type === 'error' ? 'bg-red-500/5' :
                                        issue.type === 'warning' ? 'bg-yellow-500/5' : ''
                                      )}>
                                        <TableCell className="text-right">{issue.row}</TableCell>
                                        <TableCell className="text-right">
                                          <Badge variant={
                                            issue.type === 'error' ? 'destructive' :
                                            issue.type === 'warning' ? 'secondary' : 'outline'
                                          }>
                                            {issue.entity === 'client' ? 'לקוח' :
                                             issue.entity === 'project' ? 'פרויקט' : 'זמן'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{issue.field}</TableCell>
                                        <TableCell className="text-right text-muted-foreground truncate max-w-[100px]">
                                          {issue.value}
                                        </TableCell>
                                        <TableCell className="text-right">{issue.message}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {validationSummary.issues.length > 50 && (
                                  <p className="text-center text-sm text-muted-foreground py-2">
                                    ועוד {validationSummary.issues.length - 50} בעיות...
                                  </p>
                                )}
                              </ScrollArea>
                            )}

                            {validationSummary.errors > 0 && (
                              <p className="text-sm text-red-500 mt-2 text-right">
                                ⚠️ יש שגיאות קריטיות. הייבוא עשוי להיכשל בחלק מהרשומות.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Import Options */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-right">אפשרויות ייבוא</h3>
                        <div className="flex flex-wrap gap-4 justify-end">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="importClients"
                              checked={importOptions.importClients}
                              onCheckedChange={(c) => setImportOptions(prev => ({ ...prev, importClients: !!c }))}
                            />
                            <Label htmlFor="importClients">לקוחות</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="importProjects"
                              checked={importOptions.importProjects}
                              onCheckedChange={(c) => setImportOptions(prev => ({ ...prev, importProjects: !!c }))}
                            />
                            <Label htmlFor="importProjects">פרויקטים</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="importTimeLogs"
                              checked={importOptions.importTimeLogs}
                              onCheckedChange={(c) => setImportOptions(prev => ({ ...prev, importTimeLogs: !!c }))}
                            />
                            <Label htmlFor="importTimeLogs">רישומי זמן</Label>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-end">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="skipDuplicates"
                              checked={importOptions.skipDuplicates}
                              onCheckedChange={(c) => setImportOptions(prev => ({ 
                                ...prev, 
                                skipDuplicates: !!c,
                                overwriteDuplicates: c ? false : prev.overwriteDuplicates 
                              }))}
                            />
                            <Label htmlFor="skipDuplicates">דלג על כפילויות</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="overwriteDuplicates"
                              checked={importOptions.overwriteDuplicates}
                              onCheckedChange={(c) => setImportOptions(prev => ({ 
                                ...prev, 
                                overwriteDuplicates: !!c,
                                skipDuplicates: c ? false : prev.skipDuplicates 
                              }))}
                            />
                            <Label htmlFor="overwriteDuplicates">עדכן כפילויות</Label>
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      {isProcessing && (
                        <div className="space-y-2">
                          <Progress value={progress} />
                          <p className="text-sm text-center text-muted-foreground">{currentAction}</p>
                        </div>
                      )}

                      {/* Start Import Button */}
                      <Button
                        size="lg"
                        onClick={handleImport}
                        disabled={isProcessing}
                        className="w-full btn-gold"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                            מייבא...
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 ml-2" />
                            התחל ייבוא
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {/* =====================================
                      JSON FILE PREVIEW
                      ===================================== */}
                  {fileSelected && externalBackupData && detectedFileType === 'json' && (
                    <>
                      <Separator />
                      
                      {/* JSON Stats */}
                      <div className="grid grid-cols-5 gap-3">
                        {externalBackupData.data.Client && (
                          <Card className={cn(
                            "transition-all",
                            jsonImportOptions.clients && "ring-2 ring-primary"
                          )}>
                            <CardContent className="pt-4 text-center">
                              <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                              <div className="text-xl font-bold">{externalBackupData.data.Client.length}</div>
                              <div className="text-xs text-muted-foreground">לקוחות</div>
                            </CardContent>
                          </Card>
                        )}
                        {externalBackupData.data.Project && (
                          <Card className={cn(
                            "transition-all",
                            jsonImportOptions.projects && "ring-2 ring-primary"
                          )}>
                            <CardContent className="pt-4 text-center">
                              <FolderKanban className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                              <div className="text-xl font-bold">{externalBackupData.data.Project.length}</div>
                              <div className="text-xs text-muted-foreground">פרויקטים</div>
                            </CardContent>
                          </Card>
                        )}
                        {externalBackupData.data.TimeLog && (
                          <Card className={cn(
                            "transition-all",
                            jsonImportOptions.time_entries && "ring-2 ring-primary"
                          )}>
                            <CardContent className="pt-4 text-center">
                              <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
                              <div className="text-xl font-bold">{externalBackupData.data.TimeLog.length}</div>
                              <div className="text-xs text-muted-foreground">רישומי זמן</div>
                            </CardContent>
                          </Card>
                        )}
                        {externalBackupData.data.Task && (
                          <Card className={cn(
                            "transition-all",
                            jsonImportOptions.tasks && "ring-2 ring-primary"
                          )}>
                            <CardContent className="pt-4 text-center">
                              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                              <div className="text-xl font-bold">{externalBackupData.data.Task.length}</div>
                              <div className="text-xs text-muted-foreground">משימות</div>
                            </CardContent>
                          </Card>
                        )}
                        {externalBackupData.data.Meeting && (
                          <Card className={cn(
                            "transition-all",
                            jsonImportOptions.meetings && "ring-2 ring-primary"
                          )}>
                            <CardContent className="pt-4 text-center">
                              <Calendar className="h-5 w-5 mx-auto mb-1 text-pink-500" />
                              <div className="text-xl font-bold">{externalBackupData.data.Meeting.length}</div>
                              <div className="text-xs text-muted-foreground">פגישות</div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* JSON Import Options */}
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-end gap-2">
                            בחר מה לייבא
                            <Settings2 className="h-4 w-4" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-4 justify-end">
                            {externalBackupData.data.Client && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="json-clients"
                                  checked={jsonImportOptions.clients}
                                  onCheckedChange={(c) => setJsonImportOptions(prev => ({ ...prev, clients: !!c }))}
                                />
                                <Label htmlFor="json-clients">לקוחות ({externalBackupData.data.Client.length})</Label>
                              </div>
                            )}
                            {externalBackupData.data.Project && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="json-projects"
                                  checked={jsonImportOptions.projects}
                                  onCheckedChange={(c) => setJsonImportOptions(prev => ({ ...prev, projects: !!c }))}
                                />
                                <Label htmlFor="json-projects">פרויקטים ({externalBackupData.data.Project.length})</Label>
                              </div>
                            )}
                            {externalBackupData.data.TimeLog && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="json-timelogs"
                                  checked={jsonImportOptions.time_entries}
                                  onCheckedChange={(c) => setJsonImportOptions(prev => ({ ...prev, time_entries: !!c }))}
                                />
                                <Label htmlFor="json-timelogs">רישומי זמן ({externalBackupData.data.TimeLog.length})</Label>
                              </div>
                            )}
                            {externalBackupData.data.Task && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="json-tasks"
                                  checked={jsonImportOptions.tasks}
                                  onCheckedChange={(c) => setJsonImportOptions(prev => ({ ...prev, tasks: !!c }))}
                                />
                                <Label htmlFor="json-tasks">משימות ({externalBackupData.data.Task.length})</Label>
                              </div>
                            )}
                            {externalBackupData.data.Meeting && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="json-meetings"
                                  checked={jsonImportOptions.meetings}
                                  onCheckedChange={(c) => setJsonImportOptions(prev => ({ ...prev, meetings: !!c }))}
                                />
                                <Label htmlFor="json-meetings">פגישות ({externalBackupData.data.Meeting.length})</Label>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* JSON Preview - First 5 clients */}
                      {externalBackupData.data.Client && externalBackupData.data.Client.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                              <Button variant="ghost" size="sm" onClick={() => setShowValidationDetails(!showValidationDetails)}>
                                {showValidationDetails ? 'הסתר' : 'הצג עוד'}
                              </Button>
                              <div className="flex items-center gap-2">
                                תצוגה מקדימה - לקוחות
                                <Eye className="h-4 w-4" />
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-48">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-right">שם</TableHead>
                                    <TableHead className="text-right">אימייל</TableHead>
                                    <TableHead className="text-right">טלפון</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {externalBackupData.data.Client.slice(0, showValidationDetails ? 20 : 5).map((client, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">{client.name}</TableCell>
                                      <TableCell className="text-muted-foreground">{client.email || '-'}</TableCell>
                                      <TableCell className="text-muted-foreground">{client.phone || '-'}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{client.status || 'active'}</Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      )}

                      {/* JSON Import Progress */}
                      {isJsonImporting && (
                        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                          <Progress value={jsonImportProgress} />
                          <p className="text-sm text-center text-muted-foreground">{jsonImportMessage}</p>
                        </div>
                      )}

                      {/* JSON Import Stats */}
                      {jsonImportStats && !isJsonImporting && (
                        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                          <CardContent className="pt-4">
                            <h4 className="font-medium text-green-700 dark:text-green-400 mb-3 text-right flex items-center justify-end gap-2">
                              סיכום ייבוא הושלם בהצלחה
                              <CheckCircle className="h-5 w-5" />
                            </h4>
                            <div className="grid grid-cols-5 gap-2 text-sm">
                              {jsonImportStats.clients.total > 0 && (
                                <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                                  <div className="font-bold text-green-600">{jsonImportStats.clients.imported}</div>
                                  <div className="text-xs">לקוחות יובאו</div>
                                </div>
                              )}
                              {jsonImportStats.projects.total > 0 && (
                                <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                                  <div className="font-bold text-green-600">{jsonImportStats.projects.imported}</div>
                                  <div className="text-xs">פרויקטים</div>
                                </div>
                              )}
                              {jsonImportStats.time_entries.total > 0 && (
                                <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                                  <div className="font-bold text-green-600">{jsonImportStats.time_entries.imported}</div>
                                  <div className="text-xs">רישומי זמן</div>
                                </div>
                              )}
                              {jsonImportStats.tasks.total > 0 && (
                                <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                                  <div className="font-bold text-green-600">{jsonImportStats.tasks.imported}</div>
                                  <div className="text-xs">משימות</div>
                                </div>
                              )}
                              {jsonImportStats.meetings.total > 0 && (
                                <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                                  <div className="font-bold text-green-600">{jsonImportStats.meetings.imported}</div>
                                  <div className="text-xs">פגישות</div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Error Display */}
                      {lastImportError && (
                        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                          <CardContent className="pt-4">
                            <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 text-right">שגיאה:</h4>
                            <pre className="text-sm whitespace-pre-wrap text-red-600 dark:text-red-300 text-right">
                              {lastImportError}
                            </pre>
                          </CardContent>
                        </Card>
                      )}

                      {/* Comprehensive Validation Results */}
                      {comprehensiveValidation && showComprehensiveValidation && (
                        <Card className={cn(
                          "border-2",
                          comprehensiveValidation.isValid 
                            ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" 
                            : "border-red-200 bg-red-50/50 dark:bg-red-900/10"
                        )}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowComprehensiveValidation(false)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center gap-2">
                                תוצאות ולידציה
                                {comprehensiveValidation.isValid ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                                <div className="font-bold text-blue-600">{comprehensiveValidation.summary.totalChecks}</div>
                                <div className="text-xs">בדיקות</div>
                              </div>
                              <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                                <div className="font-bold text-green-600">{comprehensiveValidation.summary.passedChecks}</div>
                                <div className="text-xs">עברו</div>
                              </div>
                              <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                                <div className="font-bold text-red-600">{comprehensiveValidation.summary.failedChecks}</div>
                                <div className="text-xs">שגיאות</div>
                              </div>
                              <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                                <div className="font-bold text-yellow-600">{comprehensiveValidation.summary.warnings}</div>
                                <div className="text-xs">אזהרות</div>
                              </div>
                            </div>

                            {/* Data Integrity */}
                            {comprehensiveValidation.dataIntegrity.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-right">תקינות נתונים:</h4>
                                {comprehensiveValidation.dataIntegrity.map((check, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm p-2 bg-white/30 dark:bg-black/20 rounded">
                                    <div className="flex items-center gap-2">
                                      {check.invalidRecords === 0 ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                      )}
                                      <span>{check.validRecords}/{check.totalRecords} תקינות</span>
                                    </div>
                                    <span className="font-medium">{check.tableName}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Duplicates */}
                            {comprehensiveValidation.dataQuality.duplicates.length > 0 && (
                              <div className="p-2 bg-yellow-100/50 dark:bg-yellow-900/20 rounded text-sm text-right">
                                <span className="font-medium">כפילויות זוהו: </span>
                                {comprehensiveValidation.dataQuality.duplicates.map((d, idx) => (
                                  <span key={idx}>{d.table}: {d.count} כפילויות{idx < comprehensiveValidation.dataQuality.duplicates.length - 1 ? ', ' : ''}</span>
                                ))}
                              </div>
                            )}

                            {/* Issues List */}
                            {comprehensiveValidation.issues.length > 0 && comprehensiveValidation.issues.length <= 10 && (
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {comprehensiveValidation.issues.slice(0, 10).map((issue, idx) => (
                                  <div key={idx} className={cn(
                                    "text-xs p-2 rounded flex items-center justify-between",
                                    issue.type === 'error' && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                                    issue.type === 'warning' && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
                                    issue.type === 'info' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                  )}>
                                    <span>{issue.row ? `שורה ${issue.row}` : ''}</span>
                                    <span>{issue.message}</span>
                                  </div>
                                ))}
                                {comprehensiveValidation.issues.length > 10 && (
                                  <div className="text-xs text-muted-foreground text-center">
                                    +{comprehensiveValidation.issues.length - 10} בעיות נוספות
                                  </div>
                                )}
                              </div>
                            )}

                            {comprehensiveValidation.isValid && (
                              <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium">
                                ✓ כל הבדיקות עברו בהצלחה - ניתן להמשיך בייבוא
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Validate Button */}
                      {!comprehensiveValidation && !jsonImportStats && (
                        <Button
                          variant="outline"
                          onClick={() => runComprehensiveValidation(externalBackupData, 'import')}
                          disabled={isValidating || isJsonImporting}
                          className="w-full"
                        >
                          {isValidating ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                              בודק תקינות...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 ml-2" />
                              בדוק תקינות לפני ייבוא
                            </>
                          )}
                        </Button>
                      )}

                      {/* Start JSON Import Button */}
                      {!jsonImportStats && (
                        <Button
                          size="lg"
                          onClick={handleJsonImport}
                          disabled={isJsonImporting || isValidating}
                          className="w-full btn-gold"
                        >
                          {isJsonImporting ? (
                            <>
                              <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                              מייבא...
                            </>
                          ) : (
                            <>
                              <Upload className="h-5 w-5 ml-2" />
                              התחל ייבוא מקובץ JSON
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-end">
                    תוצאות ייבוא
                    <FileText className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-500/10 rounded-lg">
                      <div className="text-2xl font-bold text-green-500">{importStats.successClients}</div>
                      <div className="text-xs">לקוחות יובאו</div>
                    </div>
                    <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">{importStats.successProjects}</div>
                      <div className="text-xs">פרויקטים</div>
                    </div>
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">{importStats.duplicates}</div>
                      <div className="text-xs">כפילויות</div>
                    </div>
                    <div className="text-center p-3 bg-red-500/10 rounded-lg">
                      <div className="text-2xl font-bold text-red-500">{importStats.errors}</div>
                      <div className="text-xs">שגיאות</div>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {results.slice(0, 50).map((result, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded border bg-card"
                        >
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">{result.message}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[150px]">{result.name}</span>
                            {getTypeIcon(result.type)}
                            {getStatusIcon(result.status)}
                          </div>
                        </div>
                      ))}
                      {results.length > 50 && (
                        <p className="text-center text-sm text-muted-foreground">
                          ועוד {results.length - 50} תוצאות...
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <Button onClick={resetImport} className="w-full mt-4">
                    <Upload className="h-4 w-4 ml-2" />
                    ייבא קובץ נוסף
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* =====================================
              BACKUPS TAB
              ===================================== */}
          <TabsContent value="backups" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-border-gold/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-secondary/10">
                      <Database className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{backups.length}</p>
                      <p className="text-sm text-muted-foreground">גיבויים מקומיים</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <HardDrive className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {formatSize(backups.reduce((acc, b) => acc + b.size, 0))}
                      </p>
                      <p className="text-sm text-muted-foreground">נפח מקומי</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Cloud className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{cloudBackups.length}</p>
                      <p className="text-sm text-muted-foreground">גיבויי ענן</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <Clock className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {backups.length > 0 
                          ? formatDistanceToNow(new Date(backups[0].created_at), { addSuffix: true, locale: he })
                          : 'אין'}
                      </p>
                      <p className="text-sm text-muted-foreground">גיבוי אחרון</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  פעולות גיבוי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
                    {isCreatingBackup ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 ml-2" />
                    )}
                    צור גיבוי חדש
                  </Button>
                  
                  <Button variant="outline" onClick={refreshBackups}>
                    <RefreshCw className="h-4 w-4 ml-2" />
                    רענן רשימה
                  </Button>
                  <Button variant="outline" onClick={() => setIsContactsImportOpen(true)}>
                    <Contact className="h-4 w-4 ml-2" />
                    ייבוא אנשי קשר
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('import')}
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    ייבא נתונים
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Backups List */}
            <Card>
              <CardHeader>
                <CardTitle>גיבויים שמורים</CardTitle>
                <CardDescription>רשימת כל הגיבויים המקומיים</CardDescription>
              </CardHeader>
              <CardContent>
                {backupsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : backups.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין גיבויים שמורים</p>
                    <p className="text-sm">צור גיבוי חדש כדי להתחיל</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-right">סוג</TableHead>
                        <TableHead className="text-right">גודל</TableHead>
                        <TableHead className="text-right">רשומות</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{backup.type || 'ידני'}</Badge>
                          </TableCell>
                          <TableCell>{formatSize(backup.size)}</TableCell>
                          <TableCell>{backup.metadata?.totalRecords || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  setRestoreDialogOpen(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setBackupToDelete(backup);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Restore Dialog */}
        <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>שחזור גיבוי</AlertDialogTitle>
              <AlertDialogDescription>
                האם אתה בטוח שברצונך לשחזר את הנתונים מגיבוי זה? פעולה זו תוסיף את הנתונים מהגיבוי למערכת.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                שחזר
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>מחיקת גיבוי</AlertDialogTitle>
              <AlertDialogDescription>
                האם אתה בטוח שברצונך למחוק גיבוי זה? פעולה זו אינה ניתנת לביטול.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBackup} className="bg-destructive hover:bg-destructive/90">
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Contacts Import Dialog */}
        <ContactsImportDialog
          open={isContactsImportOpen}
          onOpenChange={setIsContactsImportOpen}
        />
      </div>
    </AppLayout>
  );
}
