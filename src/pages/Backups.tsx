// Backup & Restore Page - e-control CRM Pro
import React, { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useBackupRestore, BackupMetadata } from '@/hooks/useBackupRestore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
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
  Database,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Plus,
  HardDrive,
  FileJson,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  FileUp,
  Users,
  FolderKanban,
  Timer,
  Link,
  FileText,
  FileSpreadsheet,
  MessageSquare,
  UserCheck,
  Settings2,
  Mail,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Cloud, RefreshCw, Play, Contact } from 'lucide-react';
import { ContactsImportDialog } from '@/components/backup/ContactsImportDialog';
import { ImportProgressPanel, createImportPhases, ImportPhase } from '@/components/backup/ImportProgressPanel';
import { normalizeExternalBackup, getSupportedFormats, NormalizedBackup } from '@/utils/backupNormalizer';

// Cloud backup interface
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

// CSV TimeLog structure (from ArchFlow CSV export)
interface CSVTimeLog {
  client_id: string;
  client_name: string;
  log_date: string;
  duration_seconds: number;
  title: string;
  notes: string;
  id: string;
  created_date: string;
  updated_date: string;
}

// Parse CSV section
const parseCSVSection = (csvContent: string, sectionName: string): Record<string, string>[] => {
  const lines = csvContent.split('\n');
  const sectionHeaderIndex = lines.findIndex(line => line.includes(`### ${sectionName}`));
  
  if (sectionHeaderIndex === -1) return [];
  
  // Get column headers (next line after section header)
  const headerLine = lines[sectionHeaderIndex + 1];
  if (!headerLine) return [];
  
  const headers = headerLine.split(',').map(h => h.trim());
  
  // Find where data ends (next section or end of file)
  let endIndex = lines.length;
  for (let i = sectionHeaderIndex + 2; i < lines.length; i++) {
    if (lines[i].startsWith('###') || lines[i].trim() === '') {
      if (lines[i].startsWith('###')) {
        endIndex = i;
        break;
      }
    }
  }
  
  // Parse data rows
  const dataRows: Record<string, string>[] = [];
  for (let i = sectionHeaderIndex + 2; i < endIndex; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('###')) break;
    
    // Simple CSV parsing (handles basic cases)
    const values = parseCSVLine(line);
    if (values.length >= headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      dataRows.push(row);
    }
  }
  
  return dataRows;
};

// Parse a single CSV line (handles quoted fields)
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
};

// Parse time logs CSV format (from external export)
// Format: לקוח,תאריך,שעה,כותרת,הערות,עובד,משך (שעות:דקות),משך שעות,שכר שעתי,עלות,פרויקט
interface ParsedTimeLogEntry {
  clientName: string;
  date: string;
  time: string;
  title: string;
  notes: string;
  worker: string;
  durationHours: number;
  hourlyRate: number;
  project: string;
}

const parseTimeLogsCSV = (csvContent: string): ParsedTimeLogEntry[] => {
  const lines = csvContent.split('\n');
  const entries: ParsedTimeLogEntry[] = [];
  
  // Expected headers (Hebrew): לקוח,תאריך,שעה,כותרת,הערות,עובד,משך (שעות:דקות),משך שעות,שכר שעתי,עלות,פרויקט
  // We skip the first line (header) and summary lines (containing === or סה"כ)
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, summary lines, and header rows
    if (!line || line.includes('===') || line.includes('סה"כ') || line.startsWith('לקוח,')) {
      continue;
    }
    
    const fields = parseCSVLine(line);
    
    // Minimum required fields: clientName, date
    if (fields.length < 2 || !fields[0] || !fields[1]) continue;
    
    const [clientName, date, time, title, notes, worker, durationHM, durationHoursStr, hourlyRateStr, cost, project] = fields;
    
    // Parse duration hours (e.g., "4.37")
    const durationHours = parseFloat(durationHoursStr) || 0;
    
    // Skip entries without duration
    if (durationHours <= 0) continue;
    
    entries.push({
      clientName: clientName.trim(),
      date: date.trim(),
      time: time?.trim() || '',
      title: title?.trim() || '',
      notes: notes?.trim() || '',
      worker: worker?.trim() || '',
      durationHours,
      hourlyRate: parseFloat(hourlyRateStr) || 0,
      project: project?.trim() || '',
    });
  }
  
  return entries;
};

type BackupStatus = 'idle' | 'creating' | 'restoring' | 'importing' | 'success' | 'error';

// Interface for external ArchFlow backup format (supports both PascalCase and camelCase)
interface ArchFlowBackup {
  generated_at?: string;
  by?: string;
  total_records?: number;
  categories?: string[];
  metadata?: {
    exported_at: string;
    exported_by: string;
    version: string;
  };
  statistics?: {
    users: number;
    clients: number;
    projects: number;
    tasks: number;
    timeLogs: number;
    meetings: number;
  };
  data: {
    // PascalCase format (backup-2026-01-20)
    Client?: ArchFlowClient[];
    Project?: ArchFlowProject[];
    TimeLog?: ArchFlowTimeLog[];
    Task?: ArchFlowTask[];
    Meeting?: ArchFlowMeeting[];
    // camelCase format (backup_2026-01-27)
    clients?: ArchFlowClient[];
    projects?: ArchFlowProject[];
    timeLogs?: ArchFlowTimeLog[];
    tasks?: ArchFlowTask[];
    meetings?: ArchFlowMeeting[];
    [key: string]: unknown[] | undefined;
  };
}

interface ArchFlowClient {
  name: string;
  name_clean?: string;
  email?: string;
  phone?: string;
  phone_secondary?: string;
  address?: string;
  company?: string;
  status?: string;
  stage?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  position?: string;
  whatsapp?: string;
  website?: string;
  linkedin?: string;
  preferred_contact?: string;
  budget_range?: string;
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
  meeting_date?: string; // Legacy field support
  location?: string;
  notes?: string;
  status?: string;
}

interface ImportStats {
  clients: { total: number; imported: number; skipped: number };
  projects: { total: number; imported: number; skipped: number };
  time_entries: { total: number; imported: number; skipped: number };
  tasks: { total: number; imported: number; skipped: number };
  meetings: { total: number; imported: number; skipped: number };
  client_stages?: { total: number; imported: number; skipped: number };
  client_stage_tasks?: { total: number; imported: number; skipped: number };
  stage_templates?: { total: number; imported: number; skipped: number };
  stage_template_stages?: { total: number; imported: number; skipped: number };
  stage_template_tasks?: { total: number; imported: number; skipped: number };
}

interface ImportProgress {
  phase: 'clients' | 'projects' | 'time_entries' | 'done';
  clientsImported: number;
  projectsImported: number;
  timeEntriesImported: number;
  clientIdMap: Record<string, string>;
  projectIdMap: Record<string, string>;
}

const IMPORT_PROGRESS_KEY = 'archflow-import-progress';

export default function Backups() {
  const { isAdmin, isManager, user } = useAuth();
  const { backups, createBackup, restoreBackup, deleteBackup, exportBackup, importBackup, clearAllBackups } = useBackupRestore();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<BackupStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  // ברירת מחדל לשם גיבוי: tenarc + תאריך
  const getDefaultBackupName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('he-IL').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
    return `tenarc-${dateStr}-${timeStr}`;
  };
  const [backupName, setBackupName] = useState(getDefaultBackupName);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isExternalImportDialogOpen, setIsExternalImportDialogOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const externalFileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  
  // Backup topics selection
  const [backupTopics, setBackupTopics] = useState({
    clients: true,
    projects: true,
    time_entries: true,
    tasks: true,
    meetings: true,
    quotes: true,
    profiles: true,
    client_custom_tabs: true,
    client_tab_columns: true,
    custom_tables: true,
    custom_table_data: true,
    settings: true,
    client_stages: true,
    client_stage_tasks: true,
    stage_templates: true,
    stage_template_stages: true,
    stage_template_tasks: true,
  });
  
  // Export format selection
  const [exportFormats, setExportFormats] = useState({
    json: true,
    excel: true,
  });
  
  // Save location selection - ברירת מחדל: שניהם
  const [saveLocations, setSaveLocations] = useState({
    local: true,   // שמירה למחשב
    cloud: true,   // שמירה לענן
  });
  
  // External backup import state
  const [externalBackupData, setExternalBackupData] = useState<ArchFlowBackup | null>(null);
  const [importOptions, setImportOptions] = useState({
    clients: true,
    projects: true,
    time_entries: true,
    tasks: true,
    meetings: true,
    quotes: true,
    invoices: true,
    custom_spreadsheets: true,
    custom_tables: true,
    team_members: true,
    documents: true,
    client_feedback: true,
    internal_messages: true,
    chat_conversations: true,
    user_preferences: true,
    access_control: true,
    skipDuplicates: true,
    client_stages: true,
    client_stage_tasks: true,
    stage_templates: true,
    stage_template_stages: true,
    stage_template_tasks: true,
  });
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [isAutoImporting, setIsAutoImporting] = useState(false);
  const [savedProgress, setSavedProgress] = useState<ImportProgress | null>(() => {
    try {
      const saved = localStorage.getItem(IMPORT_PROGRESS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  // Cloud backups state
  const [cloudBackups, setCloudBackups] = useState<CloudBackup[]>([]);
  const [loadingCloudBackups, setLoadingCloudBackups] = useState(false);
  const [isCloudRestoreDialogOpen, setIsCloudRestoreDialogOpen] = useState(false);
  const [selectedCloudBackup, setSelectedCloudBackup] = useState<CloudBackup | null>(null);
  const [restoringCloud, setRestoringCloud] = useState(false);
  const [runningManualBackup, setRunningManualBackup] = useState(false);
  const [isContactsImportOpen, setIsContactsImportOpen] = useState(false);
  const [importPhases, setImportPhases] = useState<ImportPhase[]>([]);
  const [currentImportPhase, setCurrentImportPhase] = useState<string>('');
  const [lastImportError, setLastImportError] = useState<string | null>(null);
  
  // Fetch cloud backups from storage
  const fetchCloudBackups = async () => {
    setLoadingCloudBackups(true);
    try {
      const { data: files, error } = await supabase.storage
        .from('backups')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });
      
      if (error) {
        console.error('Error fetching cloud backups:', error);
        toast({
          title: 'שגיאה בטעינת גיבויים',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      setCloudBackups((files || []).filter(f => f.name.endsWith('.json')).map(f => ({
        name: f.name,
        created_at: f.created_at || '',
        size: f.metadata?.size || 0,
      })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingCloudBackups(false);
    }
  };
  
  // Run manual cloud backup
  const runManualBackup = async () => {
    setRunningManualBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-backup');
      
      if (error) throw error;
      
      toast({
        title: 'גיבוי הושלם',
        description: `נשמרו ${data?.totalRecords || 0} רשומות`,
      });
      
      // Refresh list
      await fetchCloudBackups();
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: 'שגיאה בגיבוי',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    } finally {
      setRunningManualBackup(false);
    }
  };
  
  // Download and restore cloud backup
  const handleCloudRestore = async () => {
    if (!selectedCloudBackup) return;
    
    setRestoringCloud(true);
    try {
      // Download the backup file
      const { data: fileData, error } = await supabase.storage
        .from('backups')
        .download(selectedCloudBackup.name);
      
      if (error) throw error;
      
      // Parse JSON
      const text = await fileData.text();
      const backupContent = JSON.parse(text);
      
      // Call import-backup edge function
      const { data: result, error: importError } = await supabase.functions.invoke('import-backup', {
        body: { data: backupContent.data, userId: user?.id }
      });
      
      if (importError) throw importError;
      
      toast({
        title: 'שחזור הושלם',
        description: result?.message || 'הנתונים שוחזרו בהצלחה',
      });
      
      setIsCloudRestoreDialogOpen(false);
      setSelectedCloudBackup(null);
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: 'שגיאה בשחזור',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    } finally {
      setRestoringCloud(false);
    }
  };
  
  // Download cloud backup as file
  const downloadCloudBackup = async (backup: CloudBackup) => {
    try {
      const { data, error } = await supabase.storage
        .from('backups')
        .download(backup.name);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'שגיאה בהורדה',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    }
  };
  
  // Delete cloud backup
  const deleteCloudBackup = async (backup: CloudBackup) => {
    try {
      const { error } = await supabase.storage
        .from('backups')
        .remove([backup.name]);
      
      if (error) throw error;
      
      toast({
        title: 'גיבוי נמחק',
        description: `הגיבוי ${backup.name} נמחק בהצלחה`,
      });
      
      setCloudBackups(prev => prev.filter(b => b.name !== backup.name));
    } catch (error) {
      toast({
        title: 'שגיאה במחיקה',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    }
  };
  
  // Load cloud backups on mount
  React.useEffect(() => {
    fetchCloudBackups();
  }, []);

  // All available tables for backup
  const allTableNames = [
    'clients', 
    'projects', 
    'time_entries', 
    'tasks',
    'meetings',
    'quotes',
    'profiles', 
    'client_custom_tabs',
    'client_tab_columns',
    'custom_tables',
    'custom_table_data',
    'client_stages',
    'client_stage_tasks',
    'stage_templates',
    'stage_template_stages',
    'stage_template_tasks',
  ] as const;
  
  // Topic labels for display
  const topicLabels: Record<string, string> = {
    clients: '👥 לקוחות',
    projects: '📁 פרויקטים',
    time_entries: '⏱️ רישומי זמן',
    tasks: '📋 משימות',
    meetings: '📅 פגישות',
    quotes: '📝 הצעות מחיר',
    profiles: '👤 פרופילים',
    client_custom_tabs: '🗂️ טאבים מותאמים',
    client_tab_columns: '📊 עמודות מותאמות',
    custom_tables: '📋 טבלאות מותאמות',
    custom_table_data: '📝 נתוני טבלאות',
    settings: '⚙️ הגדרות',
    client_stages: '🚦 שלבי לקוחות',
    client_stage_tasks: '✅ משימות בשלבים',
    stage_templates: '📜 תבניות שלבים',
    stage_template_stages: '🎯 שלבים בתבניות',
    stage_template_tasks: '📌 משימות בתבניות',
  };

  // Fetch all data from Supabase for backup (with topic selection)
  const fetchAllData = async (selectedTopics?: Record<string, boolean>) => {
    const topics = selectedTopics || backupTopics;
    const tableNames = allTableNames.filter(t => topics[t] !== false);
    const data: Record<string, any[]> = {};
    
    for (let i = 0; i < tableNames.length; i++) {
      const table = tableNames[i];
      setProgress(((i + 1) / tableNames.length) * 50);
      setProgressMessage(`טוען ${topicLabels[table] || table}...`);
      
      const { data: tableData, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        continue;
      }
      
      data[table] = tableData || [];
    }
    
    return data;
  };
  
  // Export data to Excel file
  const exportToExcel = async (data: Record<string, any[]>, filename: string) => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    
    // Create a sheet for each table with data
    Object.entries(data).forEach(([tableName, records]) => {
      if (records && records.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(records);
        // Sheet name max 31 chars in Excel
        const sheetName = (topicLabels[tableName] || tableName).replace(/[^\w\s]/g, '').substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });
    
    // Add metadata sheet
    const metadataSheet = XLSX.utils.json_to_sheet([{
      'תאריך_יצירה': new Date().toLocaleString('he-IL'),
      'יוצר': user?.email || 'unknown',
      'גרסה': '1.0.0',
      'סה_כ_טבלאות': Object.keys(data).length,
      'סה_כ_רשומות': Object.values(data).reduce((sum, arr) => sum + (arr?.length || 0), 0),
    }]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'מטא-דאטה');
    
    // Generate and download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };
  
  // Export data to JSON file
  const exportToJSON = (data: Record<string, any[]>, filename: string) => {
    const exportData = {
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: user?.email,
        version: '1.0.0',
        tables: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v?.length || 0])
        ),
        totalRecords: Object.values(data).reduce((sum, arr) => sum + (arr?.length || 0), 0),
      },
      data,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Create new backup
  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לגיבוי',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if at least one topic is selected
    const hasTopics = Object.values(backupTopics).some(v => v);
    if (!hasTopics) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לפחות נושא אחד לגיבוי',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if at least one format is selected
    if (!exportFormats.json && !exportFormats.excel) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לפחות פורמט אחד לייצוא',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if at least one save location is selected
    if (!saveLocations.local && !saveLocations.cloud) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לפחות מיקום שמירה אחד',
        variant: 'destructive',
      });
      return;
    }

    setStatus('creating');
    setProgress(0);
    setProgressMessage('מתחיל גיבוי...');

    try {
      const data = await fetchAllData(backupTopics);
      setProgress(50);
      setProgressMessage('שומר גיבוי...');
      
      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
      const safeBackupName = backupName.replace(/[^a-zA-Z0-9א-ת\s-]/g, '').trim();
      const filename = `backup-${safeBackupName}-${dateStr}-${timeStr}`;
      
      // Count what we're backing up
      const totalRecords = Object.values(data).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      const tableCount = Object.keys(data).filter(k => data[k]?.length > 0).length;
      
      const backupData = {
        ...data,
        exportedBy: user?.email,
        exportedAt: new Date().toISOString(),
        backupName: backupName,
      };
      
      // Save to local storage (browser)
      if (saveLocations.local) {
        setProgressMessage('שומר למחשב...');
        createBackup(backupName, backupData);
      }
      
      setProgress(65);
      
      // Save to cloud (Supabase Storage)
      if (saveLocations.cloud) {
        setProgressMessage('מעלה לענן...');
        try {
          const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
          const cloudFilename = `${filename}.json`;
          
          const { error: uploadError } = await supabase.storage
            .from('backups')
            .upload(cloudFilename, jsonBlob, {
              contentType: 'application/json',
              upsert: true,
            });
          
          if (uploadError) {
            console.error('Cloud upload error:', uploadError);
            toast({
              title: 'אזהרה',
              description: 'הגיבוי נשמר במחשב אך נכשל בהעלאה לענן',
              variant: 'destructive',
            });
          } else {
            // Refresh cloud backups list
            await fetchCloudBackups();
          }
        } catch (cloudError) {
          console.error('Cloud backup error:', cloudError);
        }
      }
      
      setProgress(80);
      
      // Export files based on selected formats (download to computer)
      if (exportFormats.json) {
        setProgressMessage('מייצא JSON...');
        exportToJSON(data, filename);
      }
      
      setProgress(90);
      
      if (exportFormats.excel) {
        setProgressMessage('מייצא Excel...');
        exportToExcel(data, filename);
      }
      
      setProgress(100);
      setStatus('success');
      
      const formatsList = [
        exportFormats.json && 'JSON',
        exportFormats.excel && 'Excel',
      ].filter(Boolean).join(' + ');
      
      const locationsList = [
        saveLocations.local && 'מחשב',
        saveLocations.cloud && 'ענן',
      ].filter(Boolean).join(' + ');
      
      toast({
        title: 'גיבוי נוצר בהצלחה! 🎉',
        description: `נשמרו ${totalRecords} רשומות מ-${tableCount} טבלאות (${formatsList}) ל: ${locationsList}`,
      });
      
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
        setProgressMessage('');
        setBackupName(getDefaultBackupName());
        setIsCreateDialogOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Backup failed:', error);
      setStatus('error');
      toast({
        title: 'שגיאה ביצירת גיבוי',
        description: 'לא ניתן לגבות את הנתונים',
        variant: 'destructive',
      });
    }
  };

  // Restore backup
  const handleRestoreBackup = async () => {
    if (!selectedBackupId) return;

    setStatus('restoring');
    setProgress(0);

    try {
      const backup = restoreBackup(selectedBackupId);
      if (!backup) {
        setStatus('error');
        return;
      }

      // Show confirmation - actual restore to DB requires careful consideration
      // For now, we just export the data for manual review
      setProgress(100);
      setStatus('success');
      
      toast({
        title: 'גיבוי מוכן לשחזור',
        description: 'הנתונים מוכנים - הורד את הקובץ לבדיקה לפני שחזור מלא',
      });

      // Export for review
      exportBackup(backup);

      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
        setSelectedBackupId(null);
        setIsRestoreDialogOpen(false);
      }, 1500);
    } catch (error) {
      console.error('Restore failed:', error);
      setStatus('error');
    }
  };

  // Handle file import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await importBackup(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle external backup file selection - supports multiple JSON formats
  const handleExternalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLastImportError(null);
    
    try {
      const text = await file.text();
      
      // Use the normalizer to handle various formats
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
        
        if (externalFileInputRef.current) {
          externalFileInputRef.current.value = '';
        }
        return;
      }
      
      // Convert NormalizedBackup to ArchFlowBackup format
      const normalizedData: ArchFlowBackup = {
        generated_at: result.data.generated_at,
        by: result.data.by,
        total_records: result.data.total_records,
        categories: result.data.categories,
        data: result.data.data as ArchFlowBackup['data'],
      };
      
      setExternalBackupData(normalizedData);
      setIsExternalImportDialogOpen(true);
      setImportStats(null);
      
      // Show success message with detected format
      toast({
        title: 'קובץ נטען בהצלחה',
        description: `זוהה פורמט: ${result.detectedFormat}. נמצאו ${result.data.total_records} רשומות ב-${result.data.categories.length} קטגוריות.`,
      });
      
    } catch (error) {
      console.error('Failed to parse backup file:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      setLastImportError(`שגיאה בפרסור JSON: ${errorMessage}`);
      
      toast({
        title: 'שגיאה בקריאת הקובץ',
        description: 'לא ניתן לקרוא את הקובץ. ודא שזהו קובץ JSON תקין.',
        variant: 'destructive',
      });
    }
    
    if (externalFileInputRef.current) {
      externalFileInputRef.current.value = '';
    }
  };

  // Handle Excel file import
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('importing');
    setProgress(0);
    setProgressMessage('קורא קובץ Excel...');
    setIsExternalImportDialogOpen(true);

    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Parse each sheet into the data structure
      const data: Record<string, any[]> = {};
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
        
        // Map Hebrew sheet names to English
        const sheetNameMap: Record<string, string> = {
          'לקוחות': 'Client',
          'משימות': 'Task',
          'רישומי_זמן': 'TimeLog',
          'פגישות': 'Meeting',
          'הצעות_מחיר': 'Quote',
          'הרשאות': 'AccessControl',
          'העדפות_משתמש': 'UserPreferences',
        };
        
        const englishName = sheetNameMap[sheetName] || sheetName;
        if (jsonData.length > 0 && englishName !== 'סיכום') {
          data[englishName] = jsonData;
        }
      }
      
      setProgress(30);
      setProgressMessage('מייבא נתונים לדאטהבייס...');
      
      // Call edge function to import
      const { data: result, error } = await supabase.functions.invoke('import-backup', {
        body: { data, userId: user?.id }
      });
      
      if (error) {
        throw error;
      }
      
      setProgress(100);
      setProgressMessage('הייבוא הושלם!');
      setStatus('success');
      
      toast({
        title: 'ייבוא Excel הושלם',
        description: result?.message || 'הנתונים יובאו בהצלחה',
      });
      
      // Show summary
      if (result?.summary) {
        const summaryStats: ImportStats = {
          clients: { total: result.results?.clients?.imported || 0, imported: result.results?.clients?.imported || 0, skipped: result.results?.clients?.skipped || 0 },
          projects: { total: 0, imported: 0, skipped: 0 },
          time_entries: { total: result.results?.timeLogs?.imported || 0, imported: result.results?.timeLogs?.imported || 0, skipped: result.results?.timeLogs?.skipped || 0 },
          tasks: { total: result.results?.tasks?.imported || 0, imported: result.results?.tasks?.imported || 0, skipped: result.results?.tasks?.skipped || 0 },
          meetings: { total: result.results?.meetings?.imported || 0, imported: result.results?.meetings?.imported || 0, skipped: result.results?.meetings?.skipped || 0 },
        };
        setImportStats(summaryStats);
      }
      
    } catch (error) {
      console.error('Excel import failed:', error);
      setStatus('error');
      toast({
        title: 'שגיאה בייבוא Excel',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    }
    
    if (excelFileInputRef.current) {
      excelFileInputRef.current.value = '';
    }
  };

  // Import external backup to database using LOCAL import (no Edge Function)
  const handleExternalImport = async () => {
    if (!externalBackupData || !user) return;

    setStatus('importing');
    setProgress(0);
    setProgressMessage('מתחיל ייבוא מקיף...');
    
    try {
      const rawData = externalBackupData.data;
      
      // Normalize data - support both PascalCase and camelCase formats
      const dataToImport = {
        Client: rawData.Client || rawData.clients || [],
        Project: rawData.Project || rawData.projects || [],
        TimeLog: rawData.TimeLog || rawData.timeLogs || [],
        Task: rawData.Task || rawData.tasks || [],
        Meeting: rawData.Meeting || rawData.meetings || [],
        ClientStage: rawData.ClientStage || rawData.client_stages || [],
        ClientStageTask: rawData.ClientStageTask || rawData.client_stage_tasks || [],
        StageTemplate: rawData.StageTemplate || rawData.stage_templates || [],
        StageTemplateStage: rawData.StageTemplateStage || rawData.stage_template_stages || [],
        StageTemplateTask: rawData.StageTemplateTask || rawData.stage_template_tasks || [],
      };
      
      // Log what we're importing
      console.log('Importing data categories:', Object.keys(rawData));
      console.log('Normalized data counts:', {
        Client: dataToImport.Client?.length || 0,
        Task: dataToImport.Task?.length || 0,
        TimeLog: dataToImport.TimeLog?.length || 0,
        Meeting: dataToImport.Meeting?.length || 0,
        Project: dataToImport.Project?.length || 0,
        ClientStage: dataToImport.ClientStage?.length || 0,
        ClientStageTask: dataToImport.ClientStageTask?.length || 0,
        StageTemplate: dataToImport.StageTemplate?.length || 0,
        StageTemplateStage: dataToImport.StageTemplateStage?.length || 0,
        StageTemplateTask: dataToImport.StageTemplateTask?.length || 0,
      });
      
      // Initialize stats
      const stats: ImportStats = {
        clients: { total: 0, imported: 0, skipped: 0 },
        projects: { total: 0, imported: 0, skipped: 0 },
        time_entries: { total: 0, imported: 0, skipped: 0 },
        tasks: { total: 0, imported: 0, skipped: 0 },
        meetings: { total: 0, imported: 0, skipped: 0 },
        client_stages: { total: 0, imported: 0, skipped: 0 },
        client_stage_tasks: { total: 0, imported: 0, skipped: 0 },
        stage_templates: { total: 0, imported: 0, skipped: 0 },
        stage_template_stages: { total: 0, imported: 0, skipped: 0 },
        stage_template_tasks: { total: 0, imported: 0, skipped: 0 },
      };

      // Map old IDs to new IDs
      const clientIdMap = new Map<string, string>();
      const projectIdMap = new Map<string, string>();
      
      const BATCH_SIZE = 20;
      
      // Load ALL existing clients and projects upfront for efficient duplicate checking
      console.log('Loading existing clients and projects...');
      const { data: existingClients } = await supabase
        .from('clients')
        .select('id, name, name_clean, email');
      
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('id, name, client_id');
      
      // Create lookup maps for duplicates
      const clientNameMap = new Map<string, string>();
      const clientEmailMap = new Map<string, string>();
      const projectNameMap = new Map<string, string>();
      
      for (const client of existingClients || []) {
        if (client.name) clientNameMap.set(client.name.toLowerCase().trim(), client.id);
        if (client.name_clean) clientNameMap.set(client.name_clean.toLowerCase().trim(), client.id);
        if (client.email) clientEmailMap.set(client.email.toLowerCase().trim(), client.id);
      }
      
      for (const project of existingProjects || []) {
        if (project.name) projectNameMap.set(project.name.toLowerCase().trim(), project.id);
      }
      
      console.log(`Found ${existingClients?.length || 0} existing clients, ${existingProjects?.length || 0} existing projects`);
      
      // Map Hebrew status to valid English status
      const mapClientStatus = (status: string | undefined): string => {
        const statusMap: Record<string, string> = {
          'פוטנציאלי': 'pending',
          'פעיל': 'active',
          'לא_פעיל': 'inactive',
          'מ_פעיל': 'inactive',
          'לא פעיל': 'inactive',
          'כליש': 'active',
          'מילן': 'active',
          'סיום': 'inactive',
          'active': 'active',
          'inactive': 'inactive',
          'pending': 'pending',
        };
        return statusMap[status || ''] || 'pending';
      };

      // ===== IMPORT CLIENTS =====
      if (importOptions.clients && dataToImport.Client) {
        const clients = dataToImport.Client;
        stats.clients.total = clients.length;
        
        for (let i = 0; i < clients.length; i += BATCH_SIZE) {
          const batch = clients.slice(i, i + BATCH_SIZE);
          setProgress(((i + batch.length) / clients.length) * 25);
          setProgressMessage(`מייבא לקוחות (${Math.min(i + BATCH_SIZE, clients.length)}/${clients.length})...`);
          
          for (const client of batch) {
            // Check for duplicates using in-memory maps (MUCH faster!)
            const normalizedName = client.name?.toLowerCase().trim();
            const normalizedEmail = client.email?.toLowerCase().trim();
            
            let existingId = normalizedName ? clientNameMap.get(normalizedName) : null;
            if (!existingId && normalizedEmail) {
              existingId = clientEmailMap.get(normalizedEmail) || null;
            }
            
            if (existingId) {
              clientIdMap.set(client.id, existingId);
              stats.clients.skipped++;
              continue;
            }
            
            // Build notes with custom_data
            let fullNotes = client.notes || '';
            if (client.custom_data && Object.keys(client.custom_data).length > 0) {
              const customDataStr = Object.entries(client.custom_data)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ');
              fullNotes = fullNotes ? `${fullNotes}\n\n--- נתונים נוספים ---\n${customDataStr}` : customDataStr;
            }
            
            const { data: inserted, error } = await supabase
              .from('clients')
              .insert({
                name: client.name,
                name_clean: client.name_clean || client.name,
                email: client.email || null,
                phone: client.phone || null,
                address: client.address || null,
                company: client.company || null,
                status: mapClientStatus(client.status),
                stage: client.stage || 'ליד',
                source: client.source || 'imported',
                notes: fullNotes || null,
                tags: client.tags || [],
                position: client.position || null,
                phone_secondary: client.phone_secondary || null,
                whatsapp: client.whatsapp || null,
                website: client.website || null,
                linkedin: client.linkedin || null,
                preferred_contact: client.preferred_contact || null,
                budget_range: client.budget_range || null,
              })
              .select('id')
              .single();
            
            if (inserted && !error) {
              clientIdMap.set(client.id, inserted.id);
              // Add to in-memory map to prevent duplicates in same import
              if (normalizedName) clientNameMap.set(normalizedName, inserted.id);
              if (normalizedEmail) clientEmailMap.set(normalizedEmail, inserted.id);
              stats.clients.imported++;
            } else {
              console.error('Failed to import client:', client.name, error);
              stats.clients.skipped++;
            }
          }
        }
      }

      // ===== IMPORT PROJECTS =====
      if (importOptions.projects && dataToImport.Project) {
        const projects = dataToImport.Project;
        stats.projects.total = projects.length;
        
        for (let i = 0; i < projects.length; i += BATCH_SIZE) {
          const batch = projects.slice(i, i + BATCH_SIZE);
          setProgress(25 + ((i + batch.length) / projects.length) * 15);
          setProgressMessage(`מייבא פרויקטים (${Math.min(i + BATCH_SIZE, projects.length)}/${projects.length})...`);
          
          for (const project of batch) {
            // Check for duplicates using in-memory map
            const normalizedProjectName = project.name?.toLowerCase().trim();
            const existingProjectId = normalizedProjectName ? projectNameMap.get(normalizedProjectName) : null;
            
            if (existingProjectId) {
              projectIdMap.set(project.id, existingProjectId);
              stats.projects.skipped++;
              continue;
            }
            
            const mappedClientId = project.client_id ? clientIdMap.get(project.client_id) || null : null;
            
            const { data: inserted, error } = await supabase
              .from('projects')
              .insert({
                name: project.name,
                description: project.description || null,
                client_id: mappedClientId,
                status: project.status || 'פעיל',
                start_date: project.start_date || null,
                end_date: project.end_date || null,
              })
              .select('id')
              .single();
            
            if (inserted && !error) {
              projectIdMap.set(project.id, inserted.id);
              // Add to in-memory map to prevent duplicates in same import
              if (normalizedProjectName) projectNameMap.set(normalizedProjectName, inserted.id);
              stats.projects.imported++;
            } else {
              stats.projects.skipped++;
            }
          }
        }
      }

      // ===== IMPORT TIME ENTRIES =====
      if (importOptions.time_entries && dataToImport.TimeLog) {
        const timeLogs = dataToImport.TimeLog;
        stats.time_entries.total = timeLogs.length;
        
        // Fetch existing entries for duplicate checking
        const { data: existingEntries } = await supabase
          .from('time_entries')
          .select('start_time, client_id, description')
          .eq('user_id', user.id);
        
        const existingSet = new Set(
          (existingEntries || []).map(e => 
            `${e.start_time?.substring(0, 10)}|${e.client_id || 'null'}|${e.description || ''}`
          )
        );
        
        console.log(`Using ${clientNameMap.size} clients from memory for time entry matching`);
        
        const timeEntriesToInsert: Array<{
          user_id: string;
          client_id: string | null;
          start_time: string;
          end_time: string;
          description: string | null;
          is_billable: boolean;
          is_running: boolean;
        }> = [];
        
        for (let i = 0; i < timeLogs.length; i++) {
          const timeLog = timeLogs[i];
          
          if (i % 100 === 0) {
            setProgress(40 + ((i + 1) / timeLogs.length) * 20);
            setProgressMessage(`מעבד רישומי זמן (${i + 1}/${timeLogs.length})...`);
          }
          
          // Try ID mapping first, then fallback to name lookup
          let mappedClientId = timeLog.client_id ? clientIdMap.get(timeLog.client_id) || null : null;
          
          // Fallback: lookup by client_name if ID mapping failed
          if (!mappedClientId && timeLog.client_name) {
            const normalizedClientName = timeLog.client_name.toLowerCase().trim();
            mappedClientId = clientNameMap.get(normalizedClientName) || null;
            if (!mappedClientId) {
              console.log(`Could not find client for time entry: "${timeLog.client_name}"`);
            }
          }
          
          const startTime = new Date(timeLog.log_date);
          startTime.setHours(9, 0, 0, 0);
          
          const endTime = new Date(startTime.getTime() + (timeLog.duration_seconds || 0) * 1000);
          const description = [timeLog.title, timeLog.notes].filter(Boolean).join(' - ') || null;
          
          const key = `${startTime.toISOString().substring(0, 10)}|${mappedClientId || 'null'}|${description || ''}`;
          if (existingSet.has(key)) {
            stats.time_entries.skipped++;
            continue;
          }
          existingSet.add(key);
          
          timeEntriesToInsert.push({
            user_id: user.id,
            client_id: mappedClientId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            description,
            is_billable: true,
            is_running: false,
          });
        }
        
        // Batch insert
        const TIME_BATCH_SIZE = 50;
        for (let i = 0; i < timeEntriesToInsert.length; i += TIME_BATCH_SIZE) {
          const batch = timeEntriesToInsert.slice(i, i + TIME_BATCH_SIZE);
          setProgress(60 + ((i + batch.length) / timeEntriesToInsert.length) * 20);
          setProgressMessage(`מייבא רישומי זמן (${Math.min(i + TIME_BATCH_SIZE, timeEntriesToInsert.length)}/${timeEntriesToInsert.length})...`);
          
          const { error } = await supabase.from('time_entries').insert(batch);
          
          if (!error) {
            stats.time_entries.imported += batch.length;
          } else {
            console.error('Failed to import time entries batch:', error);
            stats.time_entries.skipped += batch.length;
          }
        }
      }

      // ===== IMPORT TASKS =====
      if (importOptions.tasks && dataToImport.Task) {
        const tasks = dataToImport.Task;
        stats.tasks.total = tasks.length;
        
        // Load existing tasks to prevent duplicates
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('title, client_id, due_date')
          .eq('assigned_to', user.id);
        
        const existingTasksSet = new Set(
          (existingTasks || []).map(t => 
            `${t.title}|${t.client_id || 'null'}|${t.due_date || 'null'}`
          )
        );
        
        for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
          const batch = tasks.slice(i, i + BATCH_SIZE);
          setProgress(80 + ((i + batch.length) / tasks.length) * 10);
          setProgressMessage(`מייבא משימות (${Math.min(i + BATCH_SIZE, tasks.length)}/${tasks.length})...`);
          
          for (const task of batch) {
            const mappedClientId = task.client_id ? clientIdMap.get(task.client_id) || null : null;
            
            // Check for duplicates
            const taskKey = `${task.title}|${mappedClientId || 'null'}|${task.due_date || 'null'}`;
            if (existingTasksSet.has(taskKey)) {
              stats.tasks.skipped++;
              continue;
            }
            
            const { error } = await supabase.from('tasks').insert({
              title: task.title,
              description: task.description || null,
              client_id: mappedClientId,
              status: task.status || 'pending',
              priority: task.priority || 'medium',
              due_date: task.due_date || null,
              assigned_to: user.id,
              created_by: user.id,
            } as any);
            
            if (!error) {
              existingTasksSet.add(taskKey);
              stats.tasks.imported++;
            } else {
              stats.tasks.skipped++;
            }
          }
        }
      }

      // ===== IMPORT MEETINGS =====
      if (importOptions.meetings && dataToImport.Meeting) {
        const meetings = dataToImport.Meeting;
        stats.meetings.total = meetings.length;
        
        // Load existing meetings to prevent duplicates
        const { data: existingMeetings } = await supabase
          .from('meetings')
          .select('title, client_id, start_time')
          .eq('created_by', user.id);
        
        const existingMeetingsSet = new Set(
          (existingMeetings || []).map(m => 
            `${m.title}|${m.client_id || 'null'}|${m.start_time || 'null'}`
          )
        );
        
        for (let i = 0; i < meetings.length; i += BATCH_SIZE) {
          const batch = meetings.slice(i, i + BATCH_SIZE);
          setProgress(90 + ((i + batch.length) / meetings.length) * 10);
          setProgressMessage(`מייבא פגישות (${Math.min(i + BATCH_SIZE, meetings.length)}/${meetings.length})...`);
          
          for (const meeting of batch) {
            const mappedClientId = meeting.client_id ? clientIdMap.get(meeting.client_id) || null : null;
            
            // Use start_time or fallback to meeting_date for legacy data
            const meetingStartTime = meeting.start_time || meeting.meeting_date || new Date().toISOString();
            const meetingEndTime = meeting.end_time || (meetingStartTime ? new Date(new Date(meetingStartTime).getTime() + 3600000).toISOString() : new Date().toISOString());
            
            // Check for duplicates
            const meetingKey = `${meeting.title}|${mappedClientId || 'null'}|${meetingStartTime}`;
            if (existingMeetingsSet.has(meetingKey)) {
              stats.meetings.skipped++;
              continue;
            }
            
            const { error } = await supabase.from('meetings').insert({
              title: meeting.title || 'פגישה',
              description: meeting.description || null,
              client_id: mappedClientId,
              start_time: meetingStartTime,
              end_time: meetingEndTime,
              location: meeting.location || null,
              created_by: user.id,
            } as any);
            
            if (!error) {
              existingMeetingsSet.add(meetingKey);
              stats.meetings.imported++;
            } else {
              stats.meetings.skipped++;
            }
          }
        }
      }

      // Stage imports removed - tables don't exist in current schema

      setProgress(100);
      setProgressMessage('הייבוא הושלם!');
      setImportStats(stats);
      setStatus('success');
      
      const importedItems = [];
      if (stats.clients.imported > 0) importedItems.push(`${stats.clients.imported} לקוחות`);
      if (stats.projects.imported > 0) importedItems.push(`${stats.projects.imported} פרויקטים`);
      if (stats.tasks.imported > 0) importedItems.push(`${stats.tasks.imported} משימות`);
      if (stats.meetings.imported > 0) importedItems.push(`${stats.meetings.imported} פגישות`);
      if (stats.time_entries.imported > 0) importedItems.push(`${stats.time_entries.imported} רישומי זמן`);
      if (stats.client_stages.imported > 0) importedItems.push(`${stats.client_stages.imported} שלבי לקוחות`);
      if (stats.stage_templates.imported > 0) importedItems.push(`${stats.stage_templates.imported} תבניות שלבים`);
      
      toast({
        title: 'הייבוא הושלם בהצלחה! 🎉',
        description: importedItems.length > 0 
          ? `יובאו: ${importedItems.join(', ')}`
          : 'כל הנתונים כבר קיימים במערכת',
      });
      
    } catch (error) {
      console.error('Import failed:', error);
      setStatus('error');
      toast({
        title: 'שגיאה בייבוא',
        description: error instanceof Error ? error.message : 'אירעה שגיאה במהלך ייבוא הנתונים',
        variant: 'destructive',
      });
    }
  };

  // Reset import dialog
  const resetImportDialog = () => {
    setIsExternalImportDialogOpen(false);
    setExternalBackupData(null);
    setImportStats(null);
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
    setIsAutoImporting(false);
  };

  // Save import progress to localStorage
  const saveImportProgress = (progress: ImportProgress) => {
    try {
      localStorage.setItem(IMPORT_PROGRESS_KEY, JSON.stringify(progress));
      setSavedProgress(progress);
    } catch (e) {
      console.error('Failed to save import progress:', e);
    }
  };

  // Clear import progress
  const clearImportProgress = () => {
    localStorage.removeItem(IMPORT_PROGRESS_KEY);
    setSavedProgress(null);
  };

  // Auto import from pre-loaded backup file with resume support
  const handleAutoImportFromFile = async (resumeFrom?: ImportProgress) => {
    if (!user) {
      toast({
        title: 'שגיאה',
        description: 'יש להתחבר כדי לבצע ייבוא',
        variant: 'destructive',
      });
      return;
    }

    setIsAutoImporting(true);
    setStatus('importing');
    setProgress(0);
    setProgressMessage('טוען קובץ גיבוי...');
    setIsExternalImportDialogOpen(true);

    try {
      // Fetch the backup file from public folder
      const response = await fetch('/backups/archflow-backup.json');
      if (!response.ok) {
        throw new Error('Failed to fetch backup file');
      }
      
      const backupData = await response.json() as ArchFlowBackup;
      setExternalBackupData(backupData);
      
      // Now run the import automatically
      const stats: ImportStats = {
        clients: { total: 0, imported: 0, skipped: 0 },
        projects: { total: 0, imported: 0, skipped: 0 },
        time_entries: { total: 0, imported: 0, skipped: 0 },
        tasks: { total: 0, imported: 0, skipped: 0 },
        meetings: { total: 0, imported: 0, skipped: 0 },
      };

      // Map old IDs to new IDs - restore from saved progress if resuming
      const clientIdMap = new Map<string, string>(
        resumeFrom ? Object.entries(resumeFrom.clientIdMap) : []
      );
      const projectIdMap = new Map<string, string>(
        resumeFrom ? Object.entries(resumeFrom.projectIdMap) : []
      );

      const startPhase = resumeFrom?.phase || 'clients';

      // Import Clients (if not already done)
      if (startPhase === 'clients' && backupData.data.Client) {
        const clients = backupData.data.Client;
        stats.clients.total = clients.length;
        
        // Batch insert clients for speed
        const BATCH_SIZE = 20;
        
        for (let i = 0; i < clients.length; i += BATCH_SIZE) {
          const batch = clients.slice(i, i + BATCH_SIZE);
          setProgress(((i + batch.length) / clients.length) * 30);
          setProgressMessage(`מייבא לקוחות (${Math.min(i + BATCH_SIZE, clients.length)}/${clients.length})...`);
          
          for (const client of batch) {
            // Check for duplicates by name
            const { data: existing } = await supabase
              .from('clients')
              .select('id')
              .eq('name', client.name)
              .maybeSingle();
            
            if (existing) {
              clientIdMap.set(client.id, existing.id);
              stats.clients.skipped++;
              continue;
            }
            
            // Build notes with custom_data
            let fullNotes = client.notes || '';
            if (client.custom_data && Object.keys(client.custom_data).length > 0) {
              const customDataStr = Object.entries(client.custom_data)
                .filter(([_, v]) => v && v !== '')
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n');
              if (customDataStr) {
                fullNotes = fullNotes ? `${fullNotes}\n\n--- נתונים נוספים ---\n${customDataStr}` : customDataStr;
              }
            }
            
            // Map status to allowed values (active, inactive, pending)
            const clientStatusMap: Record<string, string> = {
              'פוטנציאלי': 'pending',
              'פעיל': 'active',
              'לא פעיל': 'inactive',
              'סיום': 'inactive',
              'active': 'active',
              'inactive': 'inactive',
              'pending': 'pending',
            };
            const mappedStatus = clientStatusMap[client.stage] || clientStatusMap[client.status] || 'active';
            
            const { data: newClient, error } = await supabase
              .from('clients')
              .insert({
                name: client.name,
                email: client.email || null,
                phone: client.phone || null,
                address: client.address || null,
                company: client.company || null,
                status: mappedStatus,
                notes: fullNotes || null,
                created_by: user.id,
              })
              .select('id')
              .single();
            
            if (!error && newClient) {
              clientIdMap.set(client.id, newClient.id);
              stats.clients.imported++;
            } else {
              console.error('Failed to import client:', client.name, error);
              stats.clients.skipped++;
            }
          }
          
          // Save progress after each batch
          saveImportProgress({
            phase: 'clients',
            clientsImported: stats.clients.imported,
            projectsImported: 0,
            timeEntriesImported: 0,
            clientIdMap: Object.fromEntries(clientIdMap),
            projectIdMap: {},
          });
        }
        
        toast({
          title: `✅ לקוחות יובאו בהצלחה`,
          description: `${stats.clients.imported} לקוחות חדשים, ${stats.clients.skipped} דולגו`,
        });
      }

      // Update progress phase
      saveImportProgress({
        phase: 'projects',
        clientsImported: stats.clients.imported,
        projectsImported: 0,
        timeEntriesImported: 0,
        clientIdMap: Object.fromEntries(clientIdMap),
        projectIdMap: {},
      });

      // Import Projects
      if ((startPhase === 'clients' || startPhase === 'projects') && backupData.data.Project) {
        const projects = backupData.data.Project;
        stats.projects.total = projects.length;
        
        const BATCH_SIZE = 20;
        
        for (let i = 0; i < projects.length; i += BATCH_SIZE) {
          const batch = projects.slice(i, i + BATCH_SIZE);
          setProgress(30 + ((i + batch.length) / projects.length) * 30);
          setProgressMessage(`מייבא פרויקטים (${Math.min(i + BATCH_SIZE, projects.length)}/${projects.length})...`);
          
          for (const project of batch) {
            // Check for duplicates
            const { data: existing } = await supabase
              .from('projects')
              .select('id')
              .eq('name', project.name)
              .maybeSingle();
            
            if (existing) {
              projectIdMap.set(project.id, existing.id);
              stats.projects.skipped++;
              continue;
            }
            
            // Map client_id if exists
            const mappedClientId = project.client_id ? clientIdMap.get(project.client_id) || null : null;
            
            // Map status to valid values
            const statusMap: Record<string, string> = {
              'active': 'active',
              'completed': 'completed',
              'on-hold': 'on-hold',
              'cancelled': 'cancelled',
              'פעיל': 'active',
              'הושלם': 'completed',
              'בהמתנה': 'on-hold',
              'מבוטל': 'cancelled',
            };
            
            const { data: newProject, error } = await supabase
              .from('projects')
              .insert({
                name: project.name,
                description: project.description || null,
                client_id: mappedClientId,
                status: statusMap[project.status || ''] || 'planning',
                priority: project.priority || 'medium',
                start_date: project.start_date || null,
                end_date: project.end_date || null,
                budget: project.budget || null,
                created_by: user.id,
              })
              .select('id')
              .single();
            
            if (!error && newProject) {
              projectIdMap.set(project.id, newProject.id);
              stats.projects.imported++;
            } else {
              console.error('Failed to import project:', project.name, error);
              stats.projects.skipped++;
            }
          }
          
          // Save progress after each batch
          saveImportProgress({
            phase: 'projects',
            clientsImported: stats.clients.imported,
            projectsImported: stats.projects.imported,
            timeEntriesImported: 0,
            clientIdMap: Object.fromEntries(clientIdMap),
            projectIdMap: Object.fromEntries(projectIdMap),
          });
        }
        
        toast({
          title: `✅ פרויקטים יובאו בהצלחה`,
          description: `${stats.projects.imported} פרויקטים חדשים, ${stats.projects.skipped} דולגו`,
        });
      }

      // Update progress phase
      saveImportProgress({
        phase: 'time_entries',
        clientsImported: stats.clients.imported,
        projectsImported: stats.projects.imported,
        timeEntriesImported: 0,
        clientIdMap: Object.fromEntries(clientIdMap),
        projectIdMap: Object.fromEntries(projectIdMap),
      });

      // Import Time Logs - BATCH INSERT without duration_minutes
      if (backupData.data.TimeLog) {
        const timeLogs = backupData.data.TimeLog;
        stats.time_entries.total = timeLogs.length;
        setProgressMessage(`מכין רישומי זמן לייבוא...`);
        
        // Prepare all entries first (in memory)
        const timeEntriesToInsert: Array<{
          user_id: string;
          client_id: string | null;
          start_time: string;
          end_time: string;
          description: string | null;
          is_billable: boolean;
          is_running: boolean;
        }> = [];
        
        // Fetch existing entries once for duplicate checking
        const { data: existingEntries } = await supabase
          .from('time_entries')
          .select('start_time, client_id, description')
          .eq('user_id', user.id);
        
        const existingSet = new Set(
          (existingEntries || []).map(e => 
            `${e.start_time?.substring(0, 10)}|${e.client_id || 'null'}|${e.description || ''}`
          )
        );
        
        for (let i = 0; i < timeLogs.length; i++) {
          const timeLog = timeLogs[i];
          
          if (i % 100 === 0) {
            setProgress(60 + ((i + 1) / timeLogs.length) * 20);
            setProgressMessage(`מעבד רישומי זמן (${i + 1}/${timeLogs.length})...`);
          }
          
          // Map client_id
          const mappedClientId = timeLog.client_id ? clientIdMap.get(timeLog.client_id) || null : null;
          
          // Parse log_date to create start_time
          const startTime = new Date(timeLog.log_date);
          startTime.setHours(9, 0, 0, 0);
          
          const endTime = new Date(startTime.getTime() + timeLog.duration_seconds * 1000);
          const description = [timeLog.title, timeLog.notes].filter(Boolean).join(' - ') || null;
          
          // Check for duplicates
          const key = `${startTime.toISOString().substring(0, 10)}|${mappedClientId || 'null'}|${description || ''}`;
          if (existingSet.has(key)) {
            stats.time_entries.skipped++;
            continue;
          }
          existingSet.add(key);
          
          timeEntriesToInsert.push({
            user_id: user.id,
            client_id: mappedClientId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            description,
            is_billable: true,
            is_running: false,
          });
        }
        
        // Batch insert - 50 at a time
        const BATCH_SIZE = 50;
        for (let i = 0; i < timeEntriesToInsert.length; i += BATCH_SIZE) {
          const batch = timeEntriesToInsert.slice(i, i + BATCH_SIZE);
          setProgress(80 + ((i + batch.length) / timeEntriesToInsert.length) * 20);
          setProgressMessage(`מייבא רישומי זמן (${Math.min(i + BATCH_SIZE, timeEntriesToInsert.length)}/${timeEntriesToInsert.length})...`);
          
          const { error } = await supabase
            .from('time_entries')
            .insert(batch);
          
          if (!error) {
            stats.time_entries.imported += batch.length;
          } else {
            console.error('Failed to import time entries batch:', error);
            stats.time_entries.skipped += batch.length;
          }
          
          // Save progress after each batch
          saveImportProgress({
            phase: 'time_entries',
            clientsImported: stats.clients.imported,
            projectsImported: stats.projects.imported,
            timeEntriesImported: stats.time_entries.imported,
            clientIdMap: Object.fromEntries(clientIdMap),
            projectIdMap: Object.fromEntries(projectIdMap),
          });
        }
      }

      // Clear progress - import complete
      clearImportProgress();
      
      setProgress(100);
      setProgressMessage('הייבוא הושלם!');
      setImportStats(stats);
      setStatus('success');
      
      toast({
        title: 'הייבוא הושלם בהצלחה',
        description: `יובאו ${stats.clients.imported} לקוחות, ${stats.projects.imported} פרויקטים, ${stats.time_entries.imported} רישומי זמן`,
      });
      
    } catch (error) {
      console.error('Auto import failed:', error);
      setStatus('error');
      toast({
        title: 'שגיאה בייבוא',
        description: 'ניתן לנסות שוב - ההתקדמות נשמרה',
        variant: 'destructive',
      });
    }
  };

  // State for CSV import and fixing unlinked entries
  const [isFixingUnlinked, setIsFixingUnlinked] = useState(false);
  const [fixProgress, setFixProgress] = useState({ total: 0, fixed: 0, notFound: 0 });
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const timeLogsCSVInputRef = useRef<HTMLInputElement>(null);

  // Import time logs from simple CSV format (לקוח,תאריך,שעה,כותרת...)
  const handleTimeLogsCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setStatus('importing');
    setProgress(0);
    setProgressMessage('קורא קובץ CSV לוגי זמן...');
    setIsExternalImportDialogOpen(true);

    try {
      const csvContent = await file.text();
      
      // Parse using new function for simple CSV format
      const timeLogs = parseTimeLogsCSV(csvContent);
      if (timeLogs.length === 0) {
        throw new Error('לא נמצאו רשומות זמן בקובץ CSV');
      }

      setProgressMessage(`נמצאו ${timeLogs.length} רשומות זמן. מייבא...`);
      setProgress(5);

      // Group by client name for summary
      const clientSummary = new Map<string, number>();
      timeLogs.forEach(log => {
        const count = clientSummary.get(log.clientName) || 0;
        clientSummary.set(log.clientName, count + 1);
      });
      console.log(`Found ${clientSummary.size} unique clients in CSV`);

      // Fetch all existing clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name');
      
      const clientNameMap = new Map<string, string>();
      (clients || []).forEach(c => {
        clientNameMap.set(c.name.trim().toLowerCase(), c.id);
      });

      setProgress(10);
      setProgressMessage('בודק לקוחות קיימים ויוצר חדשים...');

      // Create missing clients
      let clientsCreated = 0;
      const clientNamesFromCSV = [...clientSummary.keys()];
      
      for (const clientName of clientNamesFromCSV) {
        if (!clientNameMap.has(clientName.toLowerCase())) {
          const { data: newClient, error } = await supabase
            .from('clients')
            .insert({
              name: clientName,
              user_id: user.id,
              status: 'active',
            })
            .select('id')
            .single();
          
          if (!error && newClient) {
            clientNameMap.set(clientName.toLowerCase(), newClient.id);
            clientsCreated++;
          }
        }
      }

      setProgress(20);
      setProgressMessage(`נוצרו ${clientsCreated} לקוחות חדשים. מייבא רישומי זמן...`);

      // Fetch existing time entries for duplicate checking
      const { data: existingEntries } = await (supabase
        .from('time_entries') as any)
        .select('start_time, client_id, description')
        .eq('user_id', user.id);

      const existingSet = new Set(
        (existingEntries || []).map((e: any) => 
          `${e.start_time}|${e.client_id || 'null'}|${(e.description || '').substring(0, 50)}`
        )
      );

      const stats: ImportStats = {
        clients: { total: clientNamesFromCSV.length, imported: clientsCreated, skipped: clientNamesFromCSV.length - clientsCreated },
        projects: { total: 0, imported: 0, skipped: 0 },
        time_entries: { total: timeLogs.length, imported: 0, skipped: 0 },
        tasks: { total: 0, imported: 0, skipped: 0 },
        meetings: { total: 0, imported: 0, skipped: 0 },
      };

      // Prepare time entries for batch insert
      const timeEntriesToInsert: Array<{
        user_id: string;
        client_id: string | null;
        date: string;
        start_time: string | null;
        duration_minutes: number;
        description: string | null;
        notes: string | null;
        is_billable: boolean;
        hourly_rate: number | null;
      }> = [];

      let clientsLinked = 0;
      let clientsNotFound = 0;

      for (let i = 0; i < timeLogs.length; i++) {
        const log = timeLogs[i];
        
        if (i % 50 === 0) {
          setProgress(20 + ((i + 1) / timeLogs.length) * 50);
          setProgressMessage(`מעבד רשומות (${i + 1}/${timeLogs.length})...`);
        }

        // Find client by NAME
        const clientName = log.clientName.trim().toLowerCase();
        const mappedClientId = clientNameMap.get(clientName) || null;

        if (mappedClientId) {
          clientsLinked++;
        } else {
          clientsNotFound++;
        }

        // Build description
        const description = [log.title, log.notes].filter(Boolean).join(' - ') || 'יובא מקובץ CSV';
        
        // Convert hours to minutes
        const durationMinutes = Math.round(log.durationHours * 60);

        // Check for duplicates
        const key = `${log.date}|${mappedClientId || 'null'}|${description.substring(0, 50)}`;
        if (existingSet.has(key)) {
          stats.time_entries.skipped++;
          continue;
        }
        existingSet.add(key);

        timeEntriesToInsert.push({
          user_id: user.id,
          client_id: mappedClientId,
          date: log.date,
          start_time: log.time || null,
          duration_minutes: durationMinutes,
          description,
          notes: log.notes || null,
          is_billable: log.hourlyRate > 0,
          hourly_rate: log.hourlyRate > 0 ? log.hourlyRate : null,
        });
      }

      // Batch insert
      const BATCH_SIZE = 50;
      for (let i = 0; i < timeEntriesToInsert.length; i += BATCH_SIZE) {
        const batch = timeEntriesToInsert.slice(i, i + BATCH_SIZE);
        setProgress(70 + ((i + batch.length) / timeEntriesToInsert.length) * 30);
        setProgressMessage(`מייבא (${Math.min(i + BATCH_SIZE, timeEntriesToInsert.length)}/${timeEntriesToInsert.length})...`);

        const { error } = await supabase.from('time_entries').insert(batch);
        if (!error) {
          stats.time_entries.imported += batch.length;
        } else {
          console.error('Batch insert error:', error);
          stats.time_entries.skipped += batch.length;
        }
      }

      setProgress(100);
      setProgressMessage('הייבוא הושלם!');
      setImportStats(stats);
      setStatus('success');

      toast({
        title: 'ייבוא לוגי זמן הושלם! 🎉',
        description: `יובאו ${stats.time_entries.imported} רשומות זמן, נוצרו ${clientsCreated} לקוחות חדשים. ${stats.time_entries.skipped} כפילויות דולגו.`,
      });

    } catch (error) {
      console.error('Time logs CSV import failed:', error);
      setStatus('error');
      toast({
        title: 'שגיאה בייבוא CSV',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    }

    if (timeLogsCSVInputRef.current) {
      timeLogsCSVInputRef.current.value = '';
    }
  };

  // Import from CSV file with client name mapping
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setStatus('importing');
    setProgress(0);
    setProgressMessage('קורא קובץ CSV...');
    setIsExternalImportDialogOpen(true);

    try {
      const csvContent = await file.text();
      
      // Parse TimeLog section from CSV
      const timeLogs = parseCSVSection(csvContent, 'TimeLog');
      if (timeLogs.length === 0) {
        throw new Error('No TimeLog data found in CSV');
      }

      setProgressMessage(`נמצאו ${timeLogs.length} רשומות זמן. מייבא...`);

      // Fetch all clients to build name -> id map
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name');
      
      const clientNameMap = new Map<string, string>();
      (clients || []).forEach(c => {
        clientNameMap.set(c.name.trim().toLowerCase(), c.id);
      });

      setProgress(10);
      setProgressMessage('בונה מפת לקוחות...');

      // Fetch existing time entries for duplicate checking
      const { data: existingEntries } = await supabase
        .from('time_entries')
        .select('start_time, client_id, description')
        .eq('user_id', user.id);

      const existingSet = new Set(
        (existingEntries || []).map(e => 
          `${e.start_time?.substring(0, 10)}|${e.client_id || 'null'}|${e.description || ''}`
        )
      );

      const stats: ImportStats = {
        clients: { total: 0, imported: 0, skipped: 0 },
        projects: { total: 0, imported: 0, skipped: 0 },
        time_entries: { total: timeLogs.length, imported: 0, skipped: 0 },
        tasks: { total: 0, imported: 0, skipped: 0 },
        meetings: { total: 0, imported: 0, skipped: 0 },
      };

      // Prepare time entries for batch insert
      const timeEntriesToInsert: Array<{
        user_id: string;
        client_id: string | null;
        start_time: string;
        end_time: string;
        description: string | null;
        is_billable: boolean;
        is_running: boolean;
      }> = [];

      let clientsLinked = 0;
      let clientsNotFound = 0;

      for (let i = 0; i < timeLogs.length; i++) {
        const log = timeLogs[i];
        
        if (i % 50 === 0) {
          setProgress(10 + ((i + 1) / timeLogs.length) * 60);
          setProgressMessage(`מעבד רשומות (${i + 1}/${timeLogs.length})...`);
        }

        // Find client by NAME
        const clientName = log.client_name?.trim().toLowerCase() || '';
        const mappedClientId = clientNameMap.get(clientName) || null;

        if (clientName && mappedClientId) {
          clientsLinked++;
        } else if (clientName) {
          clientsNotFound++;
        }

        // Parse date and duration
        const startTime = new Date(log.log_date);
        startTime.setHours(9, 0, 0, 0);
        const durationSeconds = parseInt(log.duration_seconds?.toString() || '0', 10);
        const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
        const description = [log.title, log.notes].filter(Boolean).join(' - ') || null;

        // Check for duplicates
        const key = `${startTime.toISOString().substring(0, 10)}|${mappedClientId || 'null'}|${description || ''}`;
        if (existingSet.has(key)) {
          stats.time_entries.skipped++;
          continue;
        }
        existingSet.add(key);

        timeEntriesToInsert.push({
          user_id: user.id,
          client_id: mappedClientId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          description,
          is_billable: true,
          is_running: false,
        });
      }

      // Batch insert
      const BATCH_SIZE = 50;
      for (let i = 0; i < timeEntriesToInsert.length; i += BATCH_SIZE) {
        const batch = timeEntriesToInsert.slice(i, i + BATCH_SIZE);
        setProgress(70 + ((i + batch.length) / timeEntriesToInsert.length) * 30);
        setProgressMessage(`מייבא (${Math.min(i + BATCH_SIZE, timeEntriesToInsert.length)}/${timeEntriesToInsert.length})...`);

        const { error } = await supabase.from('time_entries').insert(batch);
        if (!error) {
          stats.time_entries.imported += batch.length;
        } else {
          console.error('Batch insert error:', error);
          stats.time_entries.skipped += batch.length;
        }
      }

      setProgress(100);
      setProgressMessage('הייבוא הושלם!');
      setImportStats(stats);
      setStatus('success');

      toast({
        title: 'ייבוא CSV הושלם',
        description: `יובאו ${stats.time_entries.imported} רשומות. ${clientsLinked} חוברו ללקוחות, ${clientsNotFound} לקוחות לא נמצאו.`,
      });

    } catch (error) {
      console.error('CSV import failed:', error);
      setStatus('error');
      toast({
        title: 'שגיאה בייבוא CSV',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    }

    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
    }
  };

  // Fix existing unlinked time entries by matching client names in descriptions or other data
  const handleFixUnlinkedTimeEntries = async () => {
    if (!user) return;

    setIsFixingUnlinked(true);
    setFixProgress({ total: 0, fixed: 0, notFound: 0 });

    try {
      // Fetch all clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name');

      if (!clients || clients.length === 0) {
        toast({
          title: 'אין לקוחות',
          description: 'אין לקוחות במערכת לחיבור',
          variant: 'destructive',
        });
        setIsFixingUnlinked(false);
        return;
      }

      // Fetch unlinked time entries
      const { data: unlinkedEntries } = await supabase
        .from('time_entries')
        .select('id, description')
        .is('client_id', null)
        .eq('user_id', user.id);

      if (!unlinkedEntries || unlinkedEntries.length === 0) {
        toast({
          title: 'אין רשומות לתיקון',
          description: 'כל רשומות הזמן מחוברות ללקוחות',
        });
        setIsFixingUnlinked(false);
        return;
      }

      setFixProgress({ total: unlinkedEntries.length, fixed: 0, notFound: 0 });

      // Create a normalized name lookup
      const clientLookup = clients.map(c => ({
        id: c.id,
        name: c.name,
        normalizedName: c.name.trim().toLowerCase(),
      }));

      let fixed = 0;
      let notFound = 0;

      for (const entry of unlinkedEntries) {
        const desc = entry.description?.trim().toLowerCase() || '';
        
        // Try to find a client name match in the description
        let matchedClient: typeof clientLookup[0] | undefined;
        
        // First try exact match
        for (const client of clientLookup) {
          if (desc === client.normalizedName || desc.startsWith(client.normalizedName + ' -')) {
            matchedClient = client;
            break;
          }
        }
        
        // If not found, try partial match (client name appears at start)
        if (!matchedClient) {
          for (const client of clientLookup) {
            if (client.normalizedName.length > 3 && desc.startsWith(client.normalizedName)) {
              matchedClient = client;
              break;
            }
          }
        }

        if (matchedClient) {
          const { error } = await supabase
            .from('time_entries')
            .update({ client_id: matchedClient.id })
            .eq('id', entry.id);

          if (!error) {
            fixed++;
          }
        } else {
          notFound++;
        }

        setFixProgress({ total: unlinkedEntries.length, fixed, notFound });
      }

      toast({
        title: 'תיקון הושלם',
        description: `חוברו ${fixed} רשומות, ${notFound} לא נמצא התאמה`,
      });

    } catch (error) {
      console.error('Fix unlinked failed:', error);
      toast({
        title: 'שגיאה בתיקון',
        description: 'אירעה שגיאה בתיקון הרשומות',
        variant: 'destructive',
      });
    }

    setIsFixingUnlinked(false);
  };

  // Re-link all time entries from CSV by client name
  const handleRelinkFromCSV = async () => {
    if (!user) return;

    setStatus('importing');
    setProgress(0);
    setProgressMessage('טוען קובץ CSV לחיבור מחדש...');
    setIsExternalImportDialogOpen(true);

    try {
      // Fetch CSV from backup
      const response = await fetch('/backups/archflow-backup.csv');
      if (!response.ok) throw new Error('Failed to fetch CSV');
      
      const csvContent = await response.text();
      const timeLogs = parseCSVSection(csvContent, 'TimeLog');
      
      if (timeLogs.length === 0) {
        throw new Error('No TimeLog data found');
      }

      setProgress(10);
      setProgressMessage(`נמצאו ${timeLogs.length} רשומות ב-CSV`);

      // Fetch all clients
      const { data: clients } = await supabase.from('clients').select('id, name');
      const clientNameMap = new Map<string, string>();
      (clients || []).forEach(c => clientNameMap.set(c.name.trim().toLowerCase(), c.id));

      // Fetch all user's time entries
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('id, start_time, description, client_id')
        .eq('user_id', user.id);

      if (!timeEntries) throw new Error('Failed to fetch time entries');

      setProgress(20);
      setProgressMessage('מנתח רשומות קיימות...');

      // Create lookup by date + description
      const entryLookup = new Map<string, { id: string; client_id: string | null }>();
      for (const entry of timeEntries) {
        const date = entry.start_time?.substring(0, 10) || '';
        const desc = entry.description || '';
        const key = `${date}|${desc}`;
        entryLookup.set(key, { id: entry.id, client_id: entry.client_id });
      }

      let updated = 0;
      let alreadyLinked = 0;
      let notFoundInDB = 0;

      for (let i = 0; i < timeLogs.length; i++) {
        const log = timeLogs[i];
        
        if (i % 50 === 0) {
          setProgress(20 + ((i + 1) / timeLogs.length) * 70);
          setProgressMessage(`מעבד (${i + 1}/${timeLogs.length})...`);
        }

        const clientName = log.client_name?.trim().toLowerCase() || '';
        const mappedClientId = clientNameMap.get(clientName);
        
        if (!mappedClientId) continue; // Skip if client not in DB

        const logDate = new Date(log.log_date);
        logDate.setHours(9, 0, 0, 0);
        const dateStr = logDate.toISOString().substring(0, 10);
        const description = [log.title, log.notes].filter(Boolean).join(' - ') || '';
        
        const key = `${dateStr}|${description}`;
        const existingEntry = entryLookup.get(key);

        if (existingEntry) {
          if (existingEntry.client_id) {
            alreadyLinked++;
          } else {
            // Update to add client
            const { error } = await supabase
              .from('time_entries')
              .update({ client_id: mappedClientId })
              .eq('id', existingEntry.id);
            
            if (!error) updated++;
          }
        } else {
          notFoundInDB++;
        }
      }

      setProgress(100);
      setProgressMessage('הושלם!');
      setStatus('success');

      toast({
        title: 'חיבור מחדש הושלם',
        description: `עודכנו ${updated} רשומות, ${alreadyLinked} כבר מחוברות, ${notFoundInDB} לא נמצאו ב-DB`,
      });

    } catch (error) {
      console.error('Relink failed:', error);
      setStatus('error');
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Check permissions
  const canManageBackups = isAdmin || isManager;

  if (!canManageBackups) {
    return (
      <AppLayout title="גיבוי ושחזור">
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md text-center">
            <CardHeader>
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <CardTitle>אין גישה</CardTitle>
              <CardDescription>
                רק מנהלים יכולים לגשת למערכת הגיבוי והשחזור
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="גיבוי ושחזור">
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border-gold/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-secondary/10">
                  <Database className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{backups.length}</p>
                  <p className="text-sm text-muted-foreground">גיבויים שמורים</p>
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
                  <p className="text-sm text-muted-foreground">נפח אחסון</p>
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
                    {backups[0] 
                      ? formatDistanceToNow(new Date(backups[0].createdAt), { locale: he, addSuffix: true })
                      : '-'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">גיבוי אחרון</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Shield className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">מקומי</p>
                  <p className="text-sm text-muted-foreground">סוג אחסון</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-secondary" />
              פעולות גיבוי
            </CardTitle>
            <CardDescription>
              צור גיבוי חדש או ייבא גיבוי קיים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Create Backup */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-gold">
                    <Plus className="h-4 w-4 ml-2" />
                    צור גיבוי חדש
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>יצירת גיבוי חדש</DialogTitle>
                    <DialogDescription>
                      בחר אילו נושאים לגבות ובאיזה פורמט לייצא
                    </DialogDescription>
                  </DialogHeader>
                  
                  {status === 'creating' ? (
                    <div className="py-6 space-y-4">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-secondary" />
                      </div>
                      <Progress value={progress} className="h-2" rtl={false} />
                      <p className="text-center text-muted-foreground">
                        {progressMessage || `מגבה נתונים... ${Math.round(progress)}%`}
                      </p>
                    </div>
                  ) : status === 'success' ? (
                    <div className="py-6 flex flex-col items-center gap-4">
                      <CheckCircle className="h-16 w-16 text-green-500" />
                      <p className="text-lg font-medium">הגיבוי נוצר בהצלחה!</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
                        {/* Backup Name */}
                        <div className="space-y-2">
                          <Label htmlFor="backupName">שם הגיבוי</Label>
                          <Input
                            id="backupName"
                            value={backupName}
                            onChange={(e) => setBackupName(e.target.value)}
                            placeholder="לדוגמה: גיבוי חודשי דצמבר"
                          />
                        </div>
                        
                        <Separator />
                        
                        {/* Topics Selection */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">בחר נושאים לגיבוי</Label>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setBackupTopics(prev => 
                                  Object.fromEntries(Object.keys(prev).map(k => [k, true])) as typeof prev
                                )}
                              >
                                בחר הכל
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setBackupTopics(prev => 
                                  Object.fromEntries(Object.keys(prev).map(k => [k, false])) as typeof prev
                                )}
                              >
                                נקה הכל
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(backupTopics).map(([key, checked]) => (
                              <div key={key} className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id={`topic-${key}`}
                                  checked={checked}
                                  onCheckedChange={(val) => 
                                    setBackupTopics(prev => ({ ...prev, [key]: !!val }))
                                  }
                                />
                                <Label 
                                  htmlFor={`topic-${key}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {topicLabels[key] || key}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Format Selection */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">פורמט הקובץ</Label>
                          <div className="flex gap-6">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id="format-json"
                                checked={exportFormats.json}
                                onCheckedChange={(val) => 
                                  setExportFormats(prev => ({ ...prev, json: !!val }))
                                }
                              />
                              <Label htmlFor="format-json" className="flex items-center gap-2 cursor-pointer">
                                <FileJson className="h-4 w-4 text-orange-500" />
                                JSON
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id="format-excel"
                                checked={exportFormats.excel}
                                onCheckedChange={(val) => 
                                  setExportFormats(prev => ({ ...prev, excel: !!val }))
                                }
                              />
                              <Label htmlFor="format-excel" className="flex items-center gap-2 cursor-pointer">
                                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                Excel
                              </Label>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            JSON מומלץ לשחזור מלא • Excel מומלץ לצפייה ועריכה ידנית
                          </p>
                        </div>
                        
                        <Separator />
                        
                        {/* Save Location Selection */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">מיקום שמירה</Label>
                          <div className="flex gap-6">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id="save-local"
                                checked={saveLocations.local}
                                onCheckedChange={(val) => 
                                  setSaveLocations(prev => ({ ...prev, local: !!val }))
                                }
                              />
                              <Label htmlFor="save-local" className="flex items-center gap-2 cursor-pointer">
                                <HardDrive className="h-4 w-4 text-blue-500" />
                                מחשב (Local)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id="save-cloud"
                                checked={saveLocations.cloud}
                                onCheckedChange={(val) => 
                                  setSaveLocations(prev => ({ ...prev, cloud: !!val }))
                                }
                              />
                              <Label htmlFor="save-cloud" className="flex items-center gap-2 cursor-pointer">
                                <Cloud className="h-4 w-4 text-sky-500" />
                                ענן (Cloud)
                              </Label>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            מומלץ לשמור בשניהם לגיבוי כפול ומוגן
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          ביטול
                        </Button>
                        <Button onClick={handleCreateBackup} className="btn-gold">
                          <Database className="h-4 w-4 ml-2" />
                          צור גיבוי
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {/* Import External Backup - Opens file picker FIRST */}
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => externalFileInputRef.current?.click()}
                disabled={isAutoImporting}
              >
                {isAutoImporting ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 ml-2" />
                )}
                ייבא מקובץ גיבוי
              </Button>
              <input
                type="file"
                ref={externalFileInputRef}
                onChange={handleExternalFileSelect}
                accept=".json"
                className="hidden"
              />

              {/* Import from Excel File */}
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => excelFileInputRef.current?.click()}
                disabled={status === 'importing'}
              >
                {status === 'importing' ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                )}
                ייבא מ-Excel
              </Button>
              <input
                type="file"
                ref={excelFileInputRef}
                onChange={handleExcelFileSelect}
                accept=".xlsx,.xls"
                className="hidden"
              />

              {/* Import Time Logs from CSV */}
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => timeLogsCSVInputRef.current?.click()}
                disabled={status === 'importing'}
              >
                {status === 'importing' ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 ml-2" />
                )}
                ייבא לוגי זמן (CSV)
              </Button>
              <input
                type="file"
                ref={timeLogsCSVInputRef}
                onChange={handleTimeLogsCSVImport}
                accept=".csv"
                className="hidden"
              />

              {/* Import Local JSON Backup (for internal backups) */}
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 ml-2" />
                ייבא גיבוי מקומי (JSON)
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                className="hidden"
              />

              {/* Resume Import if there's saved progress */}
              {savedProgress && savedProgress.phase !== 'done' && (
                <Button 
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                  onClick={() => handleAutoImportFromFile(savedProgress)}
                  disabled={isAutoImporting}
                >
                  <RotateCcw className="h-4 w-4 ml-2" />
                  המשך ייבוא
                </Button>
              )}

              {/* Clear All */}
              {backups.length > 0 && isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק הכל
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת כל הגיבויים?</AlertDialogTitle>
                      <AlertDialogDescription>
                        פעולה זו תמחק את כל הגיבויים השמורים לצמיתות. לא ניתן לשחזר אותם.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllBackups} className="bg-destructive">
                        מחק הכל
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Progress during operations */}
            {(status === 'creating' || status === 'restoring') && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cloud Backups (Automatic) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  גיבויים אוטומטיים בענן
                </CardTitle>
                <CardDescription>
                  גיבויים אוטומטיים יומיים נשמרים בשעה 03:00
                  {cloudBackups.length > 0 && ` • ${cloudBackups.length} גיבויים זמינים`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCloudBackups}
                  disabled={loadingCloudBackups}
                >
                  <RefreshCw className={cn("h-4 w-4", loadingCloudBackups && "animate-spin")} />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={runManualBackup}
                  disabled={runningManualBackup}
                >
                  {runningManualBackup ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Play className="h-4 w-4 ml-2" />
                  )}
                  גיבוי עכשיו
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCloudBackups ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : cloudBackups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Cloud className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">אין גיבויים בענן</p>
                <p className="text-sm">הגיבוי האוטומטי יפעל בשעה 03:00 או לחץ על "גיבוי עכשיו"</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם קובץ</TableHead>
                    <TableHead>תאריך יצירה</TableHead>
                    <TableHead>גודל</TableHead>
                    <TableHead className="text-end">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cloudBackups.map((backup) => (
                    <TableRow key={backup.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4 text-blue-500" />
                          {backup.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {backup.created_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div>{format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(backup.created_at), { locale: he, addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatSize(backup.size)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadCloudBackup(backup)}
                            title="הורדה"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCloudBackup(backup);
                              setIsCloudRestoreDialogOpen(true);
                            }}
                            title="שחזור"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="מחיקה">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>מחיקת גיבוי ענן</AlertDialogTitle>
                                <AlertDialogDescription>
                                  האם למחוק את הגיבוי "{backup.name}"? פעולה זו לא ניתנת לביטול.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCloudBackup(backup)}
                                  className="bg-destructive"
                                >
                                  מחק
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Backups List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-secondary" />
              גיבויים שמורים
            </CardTitle>
            <CardDescription>
              {backups.length === 0 
                ? 'אין גיבויים שמורים עדיין'
                : `${backups.length} גיבויים זמינים`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">אין גיבויים שמורים</p>
                <p className="text-sm">צור גיבוי חדש כדי להתחיל</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>תאריך יצירה</TableHead>
                    <TableHead>גודל</TableHead>
                    <TableHead>גרסה</TableHead>
                    <TableHead className="text-end">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4 text-muted-foreground" />
                          {backup.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{format(new Date(backup.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(backup.createdAt), { locale: he, addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatSize(backup.size)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">v{backup.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const backupData = restoreBackup(backup.id);
                              if (backupData) {
                                exportBackup(backupData);
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBackupId(backup.id);
                              setIsRestoreDialogOpen(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>מחיקת גיבוי</AlertDialogTitle>
                                <AlertDialogDescription>
                                  האם למחוק את הגיבוי "{backup.name}"? פעולה זו לא ניתנת לביטול.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBackup(backup.id)}
                                  className="bg-destructive"
                                >
                                  מחק
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Restore Dialog */}
        <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>שחזור גיבוי</DialogTitle>
              <DialogDescription>
                השחזור יוריד את קובץ הגיבוי לבדיקה. שחזור מלא לבסיס הנתונים דורש אישור נוסף.
              </DialogDescription>
            </DialogHeader>
            
            {status === 'restoring' ? (
              <div className="py-6 space-y-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-secondary" />
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-center text-muted-foreground">
                  מכין נתונים לשחזור... {Math.round(progress)}%
                </p>
              </div>
            ) : status === 'success' ? (
              <div className="py-6 flex flex-col items-center gap-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-lg font-medium">הנתונים מוכנים!</p>
              </div>
            ) : (
              <>
                <div className="py-4">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-600">שים לב</p>
                        <p className="text-muted-foreground">
                          הקובץ יורד לבדיקה. לשחזור מלא יש לייבא את הנתונים ידנית או ליצור קשר עם מנהל המערכת.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleRestoreBackup}>
                    <Download className="h-4 w-4 ml-2" />
                    הורד גיבוי
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* External Import Dialog (ArchFlow Backup) */}
        <Dialog open={isExternalImportDialogOpen} onOpenChange={(open) => {
          if (!open) resetImportDialog();
        }}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-secondary" />
                ייבוא מגיבוי חיצוני
              </DialogTitle>
              <DialogDescription>
                ייבוא נתונים מקובץ גיבוי של ArchFlow CRM
              </DialogDescription>
            </DialogHeader>
            
            {status === 'importing' ? (
              <div className="py-6">
                <ImportProgressPanel
                  phases={importPhases.length > 0 ? importPhases : createImportPhases(
                    externalBackupData || { data: {} },
                    importOptions
                  )}
                  currentPhaseId={currentImportPhase}
                  overallProgress={progress}
                  message={progressMessage || 'מייבא נתונים...'}
                  isImporting={true}
                  canResume={!!savedProgress && savedProgress.phase !== 'done'}
                />
              </div>
            ) : status === 'success' && importStats ? (
              <div className="py-6 space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <p className="text-lg font-medium">הייבוא הושלם בהצלחה!</p>
                </div>
                
                {/* Import Summary */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-4 bg-secondary/10 rounded-lg text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <p className="text-2xl font-bold">{importStats.clients.imported}</p>
                    <p className="text-sm text-muted-foreground">לקוחות יובאו</p>
                    {importStats.clients.skipped > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ({importStats.clients.skipped} דולגו)
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <FolderKanban className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{importStats.projects.imported}</p>
                    <p className="text-sm text-muted-foreground">פרויקטים יובאו</p>
                    {importStats.projects.skipped > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ({importStats.projects.skipped} דולגו)
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg text-center">
                    <Timer className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{importStats.time_entries.imported}</p>
                    <p className="text-sm text-muted-foreground">רישומי זמן יובאו</p>
                    {importStats.time_entries.skipped > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ({importStats.time_entries.skipped} דולגו)
                      </p>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="mt-4 gap-2">
                  <Button variant="outline" onClick={() => {
                    setStatus('idle');
                    setImportStats(null);
                    setExternalBackupData(null);
                    externalFileInputRef.current?.click();
                  }}>
                    <Upload className="h-4 w-4 ml-2" />
                    ייבא קובץ נוסף
                  </Button>
                  <Button onClick={resetImportDialog} className="btn-gold">
                    סגור
                  </Button>
                </DialogFooter>
              </div>
            ) : status === 'error' ? (
              <div className="py-6 flex flex-col items-center gap-4">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <p className="text-lg font-medium">אירעה שגיאה בייבוא</p>
                <Button variant="outline" onClick={resetImportDialog}>
                  סגור
                </Button>
              </div>
            ) : externalBackupData ? (
              <>
                {/* Backup Info */}
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">פרטי הגיבוי</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">תאריך יצירה: </span>
                        <span>{format(new Date(externalBackupData.generated_at), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">נוצר על ידי: </span>
                        <span>{externalBackupData.by}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">סה"כ רשומות: </span>
                        <span>{externalBackupData.total_records}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">קטגוריות: </span>
                        <span>{externalBackupData.categories.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Available Data */}
                  <div className="space-y-3">
                    <h4 className="font-medium">נתונים זמינים לייבוא</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-clients"
                            checked={importOptions.clients}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, clients: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-clients" className="flex items-center gap-2 cursor-pointer">
                            <Users className="h-4 w-4 text-secondary" />
                            לקוחות
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {externalBackupData.data.Client?.length || 0} רשומות
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-projects"
                            checked={importOptions.projects}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, projects: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-projects" className="flex items-center gap-2 cursor-pointer">
                            <FolderKanban className="h-4 w-4 text-primary" />
                            פרויקטים
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {externalBackupData.data.Project?.length || 0} רשומות
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-timelogs"
                            checked={importOptions.time_entries}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, time_entries: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-timelogs" className="flex items-center gap-2 cursor-pointer">
                            <Timer className="h-4 w-4 text-green-500" />
                            רישומי זמן
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {externalBackupData.data.TimeLog?.length || 0} רשומות
                        </Badge>
                      </div>
                      
                      {/* Tasks */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-tasks"
                            checked={importOptions.tasks}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, tasks: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-tasks" className="flex items-center gap-2 cursor-pointer">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            משימות
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {externalBackupData.data.Task?.length || 0} רשומות
                        </Badge>
                      </div>
                      
                      {/* Meetings */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-meetings"
                            checked={importOptions.meetings}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, meetings: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-meetings" className="flex items-center gap-2 cursor-pointer">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            פגישות
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {externalBackupData.data.Meeting?.length || 0} רשומות
                        </Badge>
                      </div>
                      
                      {/* Quotes */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-quotes"
                            checked={importOptions.quotes}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, quotes: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-quotes" className="flex items-center gap-2 cursor-pointer">
                            <FileText className="h-4 w-4 text-orange-500" />
                            הצעות מחיר
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {externalBackupData.data.Quote?.length || 0} רשומות
                        </Badge>
                      </div>
                      
                      {/* Invoices */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-invoices"
                            checked={importOptions.invoices}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, invoices: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-invoices" className="flex items-center gap-2 cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                            חשבוניות
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {((externalBackupData.data as Record<string, unknown>).Invoice as unknown[] || []).length} רשומות
                        </Badge>
                      </div>
                      
                      {/* Custom Spreadsheets */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-spreadsheets"
                            checked={importOptions.custom_spreadsheets}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, custom_spreadsheets: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-spreadsheets" className="flex items-center gap-2 cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4 text-cyan-500" />
                            טבלאות מותאמות
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {((externalBackupData.data as Record<string, unknown>).CustomSpreadsheet as unknown[] || []).length} רשומות
                        </Badge>
                      </div>
                      
                      {/* Team Members */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-team-members"
                            checked={importOptions.team_members}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, team_members: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-team-members" className="flex items-center gap-2 cursor-pointer">
                            <UserCheck className="h-4 w-4 text-indigo-500" />
                            משתמשים / עובדים
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {((externalBackupData.data as Record<string, unknown>).TeamMember as unknown[] || []).length} רשומות
                        </Badge>
                      </div>
                      
                      {/* Documents */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-documents"
                            checked={importOptions.documents}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, documents: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-documents" className="flex items-center gap-2 cursor-pointer">
                            <FileText className="h-4 w-4 text-amber-500" />
                            מסמכים
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {((externalBackupData.data as Record<string, unknown>).Document as unknown[] || []).length} רשומות
                        </Badge>
                      </div>
                      
                      {/* Client Feedback */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-feedback"
                            checked={importOptions.client_feedback}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, client_feedback: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-feedback" className="flex items-center gap-2 cursor-pointer">
                            <MessageSquare className="h-4 w-4 text-pink-500" />
                            משוב לקוחות
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {((externalBackupData.data as Record<string, unknown>).ClientFeedback as unknown[] || []).length} רשומות
                        </Badge>
                      </div>
                      
                      {/* Internal Messages */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-messages"
                            checked={importOptions.internal_messages}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, internal_messages: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-messages" className="flex items-center gap-2 cursor-pointer">
                            <Mail className="h-4 w-4 text-teal-500" />
                            הודעות פנימיות
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {((externalBackupData.data as Record<string, unknown>).InternalMessage as unknown[] || []).length} רשומות
                        </Badge>
                      </div>
                      
                      {/* Chat Conversations */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-chats"
                            checked={importOptions.chat_conversations}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, chat_conversations: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-chats" className="flex items-center gap-2 cursor-pointer">
                            <MessageSquare className="h-4 w-4 text-violet-500" />
                            שיחות צ'אט
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {((externalBackupData.data as Record<string, unknown>).ChatConversation as unknown[] || []).length} רשומות
                        </Badge>
                      </div>
                      
                      {/* User Preferences */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-preferences"
                            checked={importOptions.user_preferences}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, user_preferences: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-preferences" className="flex items-center gap-2 cursor-pointer">
                            <Settings2 className="h-4 w-4 text-slate-500" />
                            העדפות משתמשים
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {((externalBackupData.data as Record<string, unknown>).UserPreferences as unknown[] || []).length} רשומות
                        </Badge>
                      </div>
                      
                      {/* Access Control */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="import-access"
                            checked={importOptions.access_control}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, access_control: checked as boolean }))
                            }
                          />
                          <Label htmlFor="import-access" className="flex items-center gap-2 cursor-pointer">
                            <Shield className="h-4 w-4 text-red-500" />
                            הרשאות גישה
                          </Label>
                        </div>
                        <Badge variant="secondary">
                          {((externalBackupData.data as Record<string, unknown>).AccessControl as unknown[] || []).length} רשומות
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg bg-muted/30">
                      <Checkbox
                        id="skip-duplicates"
                        checked={importOptions.skipDuplicates}
                        onCheckedChange={(checked) => 
                          setImportOptions(prev => ({ ...prev, skipDuplicates: checked as boolean }))
                        }
                      />
                      <Label htmlFor="skip-duplicates" className="cursor-pointer">
                        דלג על רשומות כפולות (לפי שם)
                      </Label>
                    </div>
                  </div>
                  
                  {/* Warning */}
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-600">שים לב</p>
                        <p className="text-muted-foreground">
                          הייבוא יוסיף את הנתונים לבסיס הנתונים הקיים. פעולה זו לא ניתנת לביטול.
                          מומלץ ליצור גיבוי לפני הייבוא.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={resetImportDialog}>
                    ביטול
                  </Button>
                  <Button 
                    onClick={handleExternalImport}
                    className="btn-gold"
                    disabled={
                      !importOptions.clients && 
                      !importOptions.projects && 
                      !importOptions.time_entries && 
                      !importOptions.tasks && 
                      !importOptions.meetings && 
                      !importOptions.quotes && 
                      !importOptions.invoices && 
                      !importOptions.custom_spreadsheets &&
                      !importOptions.team_members &&
                      !importOptions.documents &&
                      !importOptions.client_feedback &&
                      !importOptions.internal_messages &&
                      !importOptions.chat_conversations &&
                      !importOptions.user_preferences &&
                      !importOptions.access_control
                    }
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    התחל ייבוא
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Cloud Restore Dialog */}
        <Dialog open={isCloudRestoreDialogOpen} onOpenChange={setIsCloudRestoreDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                שחזור מגיבוי ענן
              </DialogTitle>
              <DialogDescription>
                שחזור נתונים מהגיבוי האוטומטי
              </DialogDescription>
            </DialogHeader>
            
            {selectedCloudBackup && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">פרטי הגיבוי</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">שם קובץ: </span>
                      <span className="font-mono text-xs">{selectedCloudBackup.name}</span>
                    </div>
                    {selectedCloudBackup.created_at && (
                      <div>
                        <span className="text-muted-foreground">תאריך: </span>
                        <span>{format(new Date(selectedCloudBackup.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">גודל: </span>
                      <span>{formatSize(selectedCloudBackup.size)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-600">שים לב</p>
                      <p className="text-muted-foreground">
                        השחזור ייבא את כל הנתונים מהגיבוי. רשומות כפולות ידולגו אוטומטית.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCloudRestoreDialogOpen(false)} disabled={restoringCloud}>
                ביטול
              </Button>
              <Button onClick={handleCloudRestore} disabled={restoringCloud}>
                {restoringCloud ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    משחזר...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 ml-2" />
                    שחזר נתונים
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contacts Import Dialog */}
        <ContactsImportDialog
          open={isContactsImportOpen}
          onOpenChange={setIsContactsImportOpen}
        />
      </div>
    </AppLayout>
  );
}