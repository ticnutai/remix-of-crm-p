// DataHub - מרכז נתונים מאוחד (ייבוא וגיבויים)
// e-control CRM Pro
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  History,
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
  FileUp,
  Timer,
  Link,
  FileText,
  MessageSquare,
  UserCheck,
  Settings2,
  Mail,
  RefreshCw,
  Play,
  Contact,
  XCircle,
  Eye,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ContactsImportDialog } from '@/components/backup/ContactsImportDialog';
import { ImportProgressPanel, createImportPhases, ImportPhase } from '@/components/backup/ImportProgressPanel';
import { normalizeExternalBackup, getSupportedFormats, NormalizedBackup } from '@/utils/backupNormalizer';

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

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  entity: 'client' | 'project' | 'timelog';
  field: string;
  value: string;
  message: string;
  row: number;
}

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
}

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
  // Import Tab State
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
    
    try {
      setIsProcessing(true);
      setCurrentAction('קורא קובץ...');
      
      const content = await file.text();
      let parsed;
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel
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
        }
        
        parsed = { clients, timeLogs, projects };
      } else {
        // Parse CSV/TXT
        parsed = parseBackupFile(content);
      }
      
      setParsedData(parsed);
      setFileSelected(true);
      setImportStats(prev => ({
        ...prev,
        totalClients: parsed.clients.length,
        totalTimeLogs: parsed.timeLogs.length,
        totalProjects: parsed.projects.length,
      }));
      
      // Run validation
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
          title: 'קובץ נטען בהצלחה ✓',
          description: `${parsed.clients.length} לקוחות, ${parsed.projects.length} פרויקטים - תקין לייבוא`,
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
              <Badge variant="secondary" className="mr-2 text-xs">CSV / Excel</Badge>
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
              IMPORT TAB
              ===================================== */}
          <TabsContent value="import" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-end">
                  ייבוא נתונים (CSV / Excel)
                  <Upload className="h-5 w-5" />
                </CardTitle>
                <CardDescription className="text-right">
                  העלה קובץ CSV או Excel - כולל לקוחות, פרויקטים ורישומי זמן.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  {/* File Selection */}
                  <div className="flex flex-col items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    
                    {!fileSelected ? (
                      <div className="w-full max-w-md space-y-3">
                        <Button
                          size="lg"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                          ) : (
                            <FileSpreadsheet className="h-5 w-5 ml-2" />
                          )}
                          {isProcessing ? currentAction : 'בחר קובץ (CSV / Excel)'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={downloadTemplate}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 ml-2" />
                          הורד תבנית Excel
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                          <Button variant="outline" size="sm" onClick={resetImport}>
                            בחר קובץ אחר
                          </Button>
                          <div className="flex items-center gap-2 text-sm">
                            <span>קובץ נטען בהצלחה</span>
                            <CheckCircle className="h-4 w-4 text-green-500" />
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
                        className="w-full"
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
