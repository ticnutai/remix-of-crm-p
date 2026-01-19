import React, { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Users, Clock, FolderKanban, Settings2, Database, Eye, FileSpreadsheet, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as XLSX from 'xlsx';

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

export default function DataImport() {
  const { user } = useAuth();
  const { toast } = useToast();
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
  
  const [stats, setStats] = useState({
    totalClients: 0,
    totalTimeLogs: 0,
    totalProjects: 0,
    successClients: 0,
    successTimeLogs: 0,
    successProjects: 0,
    duplicates: 0,
    errors: 0
  });

  // Advanced CSV parser that handles quoted fields with commas and JSON
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

  // Parse JSON field safely
  const parseJsonField = (value: string): Record<string, any> | null => {
    if (!value || value === '""' || value === '') return null;
    
    try {
      // Remove surrounding quotes if present
      let cleanValue = value.trim();
      if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
        cleanValue = cleanValue.slice(1, -1);
      }
      // Replace double quotes escape
      cleanValue = cleanValue.replace(/""/g, '"');
      
      return JSON.parse(cleanValue);
    } catch (e) {
      console.warn('Failed to parse JSON:', value.substring(0, 100), e);
      return null;
    }
  };

  // Parse tags field
  const parseTagsField = (value: string): string[] => {
    if (!value || value === '""' || value === '') return [];
    
    try {
      // Try parsing as JSON array
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      return [String(parsed)];
    } catch {
      // Fallback: split by comma
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
    
    console.log('Starting to parse file with', lines.length, 'lines');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('# ')) continue;
      
      // Detect sections by "### Type" pattern
      if (line.startsWith('### ')) {
        const sectionMatch = line.match(/### (\w+)/);
        if (sectionMatch) {
          const sectionType = sectionMatch[1].toLowerCase();
          if (sectionType === 'client') {
            currentSection = 'client';
            console.log('Found Client section at line', i);
          } else if (sectionType === 'timelog' || sectionType === 'time_log') {
            currentSection = 'timelog';
            console.log('Found TimeLog section at line', i);
          } else if (sectionType === 'project' || sectionType === 'task') {
            currentSection = 'project';
            console.log('Found Project section at line', i);
          }
        }
        headersParsed = false;
        continue;
      }
      
      // Parse headers based on section
      if (!headersParsed && line.includes(',') && currentSection) {
        const lowerLine = line.toLowerCase();
        
        // Check if this line looks like a header (contains field names)
        if (currentSection === 'client' && (lowerLine.includes('name') && !lowerLine.includes('###'))) {
          headers = parseCSVLine(line);
          console.log('Client headers found:', headers.length, 'columns');
          headersParsed = true;
          continue;
        }
        if (currentSection === 'timelog' && (lowerLine.includes('client_id') || lowerLine.includes('duration'))) {
          headers = parseCSVLine(line);
          console.log('TimeLog headers found:', headers.length, 'columns');
          headersParsed = true;
          continue;
        }
        if (currentSection === 'project' && (lowerLine.includes('name') || lowerLine.includes('client'))) {
          headers = parseCSVLine(line);
          console.log('Project headers found:', headers.length, 'columns');
          headersParsed = true;
          continue;
        }
      }
      
      // Parse client data
      if (currentSection === 'client' && headersParsed && line.includes(',')) {
        try {
          const values = parseCSVLine(line);
          if (values.length > 0 && values[0]) {
            const getVal = (key: string): string | undefined => {
              const idx = headers.indexOf(key);
              return idx >= 0 ? values[idx] : undefined;
            };
            
            const name = getVal('name') || values[0] || '';
            
            // Skip if it's a header line or section marker
            if (!name || name.startsWith('###') || name === 'name') continue;
            
            const client: ParsedClient = {
              name: name,
              name_clean: getVal('name_clean'),
              email: getVal('email'),
              phone: getVal('phone'),
              address: getVal('address'),
              company: getVal('company'),
              status: getVal('status') || getVal('client_status'),
              notes: getVal('notes'),
              stage: getVal('stage'),
              budget_range: getVal('budget_range'),
              source: getVal('source'),
              tags: parseTagsField(getVal('tags') || ''),
              position: getVal('position'),
              phone_secondary: getVal('phone_secondary'),
              whatsapp: getVal('whatsapp'),
              website: getVal('website'),
              linkedin: getVal('linkedin'),
              preferred_contact: getVal('preferred_contact'),
              custom_data: parseJsonField(getVal('custom_data') || ''),
              original_id: getVal('id'),
              is_sample: getVal('is_sample') === 'כן' || getVal('is_sample') === 'true',
              client_status: getVal('client_status')
            };
            
            clients.push(client);
          }
        } catch (e) {
          console.error('Error parsing client line:', i, e);
        }
      }
      
      // Parse time log data
      if (currentSection === 'timelog' && headersParsed && line.includes(',')) {
        try {
          const values = parseCSVLine(line);
          if (values.length > 3 && values[0]) {
            const getVal = (key: string): string | undefined => {
              const idx = headers.indexOf(key);
              return idx >= 0 ? values[idx] : undefined;
            };
            
            const clientName = getVal('client_name') || values[1] || '';
            if (!clientName || clientName === 'client_name') continue;
            
            const timeLog: ParsedTimeLog = {
              client_id_ref: getVal('client_id') || values[0],
              client_name: clientName,
              log_date: getVal('log_date') || values[2],
              duration_seconds: parseInt(getVal('duration_seconds') || values[3]) || 0,
              title: getVal('title'),
              notes: getVal('notes'),
              original_id: getVal('id')
            };
            
            if (timeLog.duration_seconds > 0) {
              timeLogs.push(timeLog);
            }
          }
        } catch (e) {
          console.error('Error parsing timelog line:', i, e);
        }
      }
      
      // Parse project data
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
            
            const project: ParsedProject = {
              name: name,
              client_name: getVal('client_name'),
              client_id_ref: getVal('client_id'),
              description: getVal('description'),
              status: getVal('status'),
              priority: getVal('priority'),
              start_date: getVal('start_date'),
              end_date: getVal('end_date'),
              budget: parseFloat(getVal('budget') || '0') || undefined,
              original_id: getVal('id')
            };
            
            projects.push(project);
          }
        } catch (e) {
          console.error('Error parsing project line:', i, e);
        }
      }
    }
    
    console.log('Parsed:', clients.length, 'clients,', projects.length, 'projects,', timeLogs.length, 'time logs');
    return { clients, timeLogs, projects };
  };

  // Check for duplicate client using multiple fields (smart matching)
  const findDuplicateClient = async (client: ParsedClient): Promise<string | null> => {
    // Try to find by original_id first (exact match from previous import)
    if (client.original_id) {
      const { data: byOriginalId } = await supabase
        .from('clients')
        .select('id')
        .eq('original_id', client.original_id)
        .maybeSingle();
      
      if (byOriginalId) return byOriginalId.id;
    }
    
    // Try to find by exact name match
    const { data: byName } = await supabase
      .from('clients')
      .select('id')
      .eq('name', client.name)
      .maybeSingle();
    
    if (byName) return byName.id;
    
    // Try to find by email if available
    if (client.email && client.email.trim() && client.email !== '""') {
      const { data: byEmail } = await supabase
        .from('clients')
        .select('id')
        .eq('email', client.email)
        .maybeSingle();
      
      if (byEmail) return byEmail.id;
    }
    
    // Try to find by phone if available and not a dummy number
    if (client.phone && client.phone.trim() && client.phone !== '0000000000' && client.phone !== '""') {
      const { data: byPhone } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', client.phone)
        .maybeSingle();
      
      if (byPhone) return byPhone.id;
    }
    
    return null;
  };

  // Check for duplicate time entry (smart matching)
  const isDuplicateTimeEntry = async (
    clientId: string | null,
    startTime: Date,
    durationMinutes: number,
    description: string | null
  ): Promise<boolean> => {
    const startOfDay = new Date(startTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startTime);
    endOfDay.setHours(23, 59, 59, 999);
    
    let query = supabase
      .from('time_entries')
      .select('id')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .eq('duration_minutes', durationMinutes);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data } = await query.limit(1);
    
    return data && data.length > 0;
  };

  // Check for duplicate project
  const findDuplicateProject = async (project: ParsedProject, clientId: string | null): Promise<string | null> => {
    let query = supabase
      .from('projects')
      .select('id')
      .eq('name', project.name);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data } = await query.maybeSingle();
    
    return data?.id || null;
  };

  // Parse Excel file to the same format
  const parseExcelFile = async (file: File): Promise<{ clients: ParsedClient[]; timeLogs: ParsedTimeLog[]; projects: ParsedProject[] }> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const clients: ParsedClient[] = [];
    const timeLogs: ParsedTimeLog[] = [];
    const projects: ParsedProject[] = [];
    
    // Try to find sheets by name (case-insensitive)
    const sheetNames = workbook.SheetNames.map(n => n.toLowerCase());
    
    // Parse Clients sheet
    const clientSheetIdx = sheetNames.findIndex(n => n.includes('client') || n.includes('לקוח'));
    if (clientSheetIdx >= 0) {
      const sheet = workbook.Sheets[workbook.SheetNames[clientSheetIdx]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      
      for (const row of data) {
        const client: ParsedClient = {
          name: row.name || row.שם || row.Name || '',
          name_clean: row.name_clean,
          email: row.email || row.אימייל || row.Email,
          phone: row.phone || row.טלפון || row.Phone,
          address: row.address || row.כתובת,
          company: row.company || row.חברה,
          status: row.status || row.סטטוס,
          notes: row.notes || row.הערות,
          stage: row.stage || row.שלב,
          budget_range: row.budget_range,
          source: row.source || row.מקור,
          tags: Array.isArray(row.tags) ? row.tags : (row.tags ? String(row.tags).split(',').map(t => t.trim()) : []),
          position: row.position || row.תפקיד,
          phone_secondary: row.phone_secondary,
          whatsapp: row.whatsapp,
          website: row.website || row.אתר,
          linkedin: row.linkedin,
          preferred_contact: row.preferred_contact,
          custom_data: typeof row.custom_data === 'object' ? row.custom_data : null,
          original_id: row.id || row.original_id,
          is_sample: row.is_sample === true || row.is_sample === 'true' || row.is_sample === 'כן',
        };
        if (client.name) clients.push(client);
      }
    }
    
    // Parse Projects sheet
    const projectSheetIdx = sheetNames.findIndex(n => n.includes('project') || n.includes('פרויקט'));
    if (projectSheetIdx >= 0) {
      const sheet = workbook.Sheets[workbook.SheetNames[projectSheetIdx]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      
      for (const row of data) {
        const project: ParsedProject = {
          name: row.name || row.שם || row.Name || '',
          client_name: row.client_name || row.לקוח,
          client_id_ref: row.client_id,
          description: row.description || row.תיאור,
          status: row.status || row.סטטוס,
          priority: row.priority || row.עדיפות,
          start_date: row.start_date,
          end_date: row.end_date,
          budget: parseFloat(row.budget) || undefined,
          original_id: row.id || row.original_id,
        };
        if (project.name) projects.push(project);
      }
    }
    
    // Parse Time Logs sheet
    const timeSheetIdx = sheetNames.findIndex(n => n.includes('time') || n.includes('זמן') || n.includes('log'));
    if (timeSheetIdx >= 0) {
      const sheet = workbook.Sheets[workbook.SheetNames[timeSheetIdx]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      
      for (const row of data) {
        const timeLog: ParsedTimeLog = {
          client_id_ref: row.client_id || '',
          client_name: row.client_name || row.לקוח || '',
          log_date: row.log_date || row.תאריך || row.date || '',
          duration_seconds: parseInt(row.duration_seconds) || (parseInt(row.duration_minutes) * 60) || 0,
          title: row.title || row.כותרת,
          notes: row.notes || row.הערות,
          original_id: row.id,
        };
        if (timeLog.client_name && timeLog.duration_seconds > 0) timeLogs.push(timeLog);
      }
    }
    
    // If no specific sheets found, try first sheet as clients
    if (clients.length === 0 && projects.length === 0 && timeLogs.length === 0 && workbook.SheetNames.length > 0) {
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      
      for (const row of data) {
        if (row.name || row.שם || row.Name) {
          const client: ParsedClient = {
            name: row.name || row.שם || row.Name || '',
            email: row.email || row.אימייל,
            phone: row.phone || row.טלפון,
            company: row.company || row.חברה,
            status: row.status || row.סטטוס,
            notes: row.notes || row.הערות,
          };
          clients.push(client);
        }
      }
    }
    
    console.log('Excel parsed:', clients.length, 'clients,', projects.length, 'projects,', timeLogs.length, 'time logs');
    return { clients, timeLogs, projects };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      let parsed: { clients: ParsedClient[]; timeLogs: ParsedTimeLog[]; projects: ParsedProject[] };
      
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel file
        parsed = await parseExcelFile(file);
      } else {
        // Parse CSV file
        const content = await file.text();
        parsed = parseBackupFile(content);
      }
      
      setParsedData(parsed);
      setFileSelected(true);
      setStats({
        totalClients: parsed.clients.length,
        totalTimeLogs: parsed.timeLogs.length,
        totalProjects: parsed.projects.length,
        successClients: 0,
        successTimeLogs: 0,
        successProjects: 0,
        duplicates: 0,
        errors: 0
      });
      
      toast({
        title: 'קובץ נטען בהצלחה',
        description: `נמצאו ${parsed.clients.length} לקוחות, ${parsed.projects.length} פרויקטים, ${parsed.timeLogs.length} רישומי זמן`,
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה בקריאת הקובץ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Map Hebrew status to DB enum
  const mapClientStatus = (status: string | undefined): string => {
    if (!status) return 'active';
    const s = status.toLowerCase();
    if (s.includes('לא_פעיל') || s.includes('לא פעיל') || s === 'inactive') return 'inactive';
    if (s.includes('פוטנציאלי') || s === 'potential') return 'potential';
    if (s.includes('פעיל') || s === 'active') return 'active';
    return 'active';
  };

  const handleStartImport = async () => {
    if (!parsedData || !user) {
      toast({
        title: 'שגיאה',
        description: 'לא נבחר קובץ או שאינך מחובר',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setStats(prev => ({
      ...prev,
      successClients: 0,
      successTimeLogs: 0,
      successProjects: 0,
      duplicates: 0,
      errors: 0
    }));
    
    const newResults: ImportResult[] = [];
    const clientIdMap = new Map<string, string>(); // original_id/name -> new_id
    
    // Calculate total items for progress
    let totalItems = 0;
    if (importOptions.importClients) totalItems += parsedData.clients.length;
    if (importOptions.importProjects) totalItems += parsedData.projects.length;
    if (importOptions.importTimeLogs) totalItems += parsedData.timeLogs.length;
    
    let processedItems = 0;
    
    try {
      // STEP 1: Import Clients (must be first for ID mapping)
      if (importOptions.importClients && parsedData.clients.length > 0) {
        setCurrentAction('מייבא לקוחות...');
        
        for (const client of parsedData.clients) {
          processedItems++;
          setProgress(Math.round((processedItems / totalItems) * 100));
          
          try {
            const existingId = await findDuplicateClient(client);
            const dbStatus = mapClientStatus(client.status || client.client_status);
            
            // Prepare client data for insert/update
            const clientData = {
              name: client.name,
              name_clean: client.name_clean || null,
              email: client.email && client.email !== '""' ? client.email : null,
              phone: client.phone && client.phone !== '0000000000' && client.phone !== '""' ? client.phone : null,
              address: client.address || null,
              company: client.company || null,
              status: dbStatus,
              notes: client.notes || null,
              stage: client.stage || null,
              budget_range: client.budget_range || null,
              source: client.source || null,
              tags: client.tags && client.tags.length > 0 ? client.tags : null,
              position: client.position || null,
              phone_secondary: client.phone_secondary || null,
              whatsapp: client.whatsapp || null,
              website: client.website || null,
              linkedin: client.linkedin || null,
              preferred_contact: client.preferred_contact || null,
              custom_data: client.custom_data || null,
              original_id: client.original_id || null,
              is_sample: client.is_sample || false,
              updated_at: new Date().toISOString()
            };
            
            if (existingId) {
              if (importOptions.skipDuplicates) {
                // Skip duplicate but still map the ID
                if (client.original_id) clientIdMap.set(client.original_id, existingId);
                clientIdMap.set(client.name, existingId);
                
                newResults.push({
                  type: 'client',
                  name: client.name,
                  status: 'duplicate',
                  message: 'דולג - קיים'
                });
                setStats(prev => ({ ...prev, duplicates: prev.duplicates + 1 }));
                continue;
              } else if (importOptions.overwriteDuplicates) {
                // Update existing with all fields
                const { error } = await supabase
                  .from('clients')
                  .update(clientData)
                  .eq('id', existingId);
                
                if (error) throw error;
                
                if (client.original_id) clientIdMap.set(client.original_id, existingId);
                clientIdMap.set(client.name, existingId);
                
                newResults.push({
                  type: 'client',
                  name: client.name,
                  status: 'success',
                  message: 'עודכן'
                });
                setStats(prev => ({ ...prev, successClients: prev.successClients + 1 }));
              }
            } else {
              // Insert new client with all fields
              const { data: newClient, error } = await supabase
                .from('clients')
                .insert({
                  ...clientData,
                  created_by: user.id
                })
                .select('id')
                .single();
              
              if (error) throw error;
              
              if (client.original_id && newClient) {
                clientIdMap.set(client.original_id, newClient.id);
              }
              if (newClient) {
                clientIdMap.set(client.name, newClient.id);
              }
              
              newResults.push({
                type: 'client',
                name: client.name,
                status: 'success',
                message: 'נוסף'
              });
              setStats(prev => ({ ...prev, successClients: prev.successClients + 1 }));
            }
          } catch (error: any) {
            console.error('Error importing client:', client.name, error);
            newResults.push({
              type: 'client',
              name: client.name,
              status: 'error',
              message: error.message || 'שגיאה'
            });
            setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
          }
        }
      }
      
      // STEP 2: Import Projects (after clients for proper linking)
      if (importOptions.importProjects && parsedData.projects.length > 0) {
        setCurrentAction('מייבא פרויקטים...');
        
        for (const project of parsedData.projects) {
          processedItems++;
          setProgress(Math.round((processedItems / totalItems) * 100));
          
          try {
            // Find client ID
            let clientId: string | null = null;
            if (project.client_id_ref) {
              clientId = clientIdMap.get(project.client_id_ref) || null;
            }
            if (!clientId && project.client_name) {
              clientId = clientIdMap.get(project.client_name) || null;
              
              // Try to find in DB
              if (!clientId) {
                const { data: foundClient } = await supabase
                  .from('clients')
                  .select('id')
                  .eq('name', project.client_name)
                  .maybeSingle();
                clientId = foundClient?.id || null;
              }
            }
            
            const existingId = await findDuplicateProject(project, clientId);
            
            // Map status
            let dbStatus = 'planning';
            if (project.status) {
              const statusLower = project.status.toLowerCase();
              if (statusLower.includes('active') || statusLower.includes('פעיל')) dbStatus = 'active';
              else if (statusLower.includes('completed') || statusLower.includes('הושלם')) dbStatus = 'completed';
              else if (statusLower.includes('hold') || statusLower.includes('מושהה')) dbStatus = 'on_hold';
            }
            
            if (existingId) {
              if (importOptions.skipDuplicates) {
                newResults.push({
                  type: 'project',
                  name: project.name,
                  status: 'duplicate',
                  message: 'דולג - קיים'
                });
                setStats(prev => ({ ...prev, duplicates: prev.duplicates + 1 }));
                continue;
              } else if (importOptions.overwriteDuplicates) {
                const { error } = await supabase
                  .from('projects')
                  .update({
                    description: project.description || null,
                    status: dbStatus,
                    priority: project.priority || 'medium',
                    start_date: project.start_date || null,
                    end_date: project.end_date || null,
                    budget: project.budget || null,
                    client_id: clientId,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingId);
                
                if (error) throw error;
                
                newResults.push({
                  type: 'project',
                  name: project.name,
                  status: 'success',
                  message: 'עודכן'
                });
                setStats(prev => ({ ...prev, successProjects: prev.successProjects + 1 }));
              }
            } else {
              const { error } = await supabase
                .from('projects')
                .insert({
                  name: project.name,
                  description: project.description || null,
                  status: dbStatus,
                  priority: project.priority || 'medium',
                  start_date: project.start_date || null,
                  end_date: project.end_date || null,
                  budget: project.budget || null,
                  client_id: clientId,
                  created_by: user.id
                });
              
              if (error) throw error;
              
              newResults.push({
                type: 'project',
                name: project.name,
                status: 'success',
                message: 'נוסף'
              });
              setStats(prev => ({ ...prev, successProjects: prev.successProjects + 1 }));
            }
          } catch (error: any) {
            console.error('Error importing project:', project.name, error);
            newResults.push({
              type: 'project',
              name: project.name,
              status: 'error',
              message: error.message || 'שגיאה'
            });
            setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
          }
        }
      }
      
      // STEP 3: Import Time Logs (after clients for proper linking)
      if (importOptions.importTimeLogs && parsedData.timeLogs.length > 0) {
        setCurrentAction('מייבא רישומי זמן...');
        
        for (const timeLog of parsedData.timeLogs) {
          processedItems++;
          setProgress(Math.round((processedItems / totalItems) * 100));
          
          try {
            // Find the client ID
            let clientId = clientIdMap.get(timeLog.client_id_ref) || clientIdMap.get(timeLog.client_name);
            
            if (!clientId && timeLog.client_name) {
              const { data: foundClient } = await supabase
                .from('clients')
                .select('id')
                .eq('name', timeLog.client_name)
                .maybeSingle();
              
              clientId = foundClient?.id;
            }
            
            // Parse the date
            let startTime: Date;
            try {
              if (timeLog.log_date.includes('T')) {
                startTime = new Date(timeLog.log_date);
              } else {
                const [year, month, day] = timeLog.log_date.split('-').map(Number);
                startTime = new Date(year, month - 1, day, 9, 0, 0);
              }
              
              // Validate date
              if (isNaN(startTime.getTime()) || startTime.getFullYear() < 2000) {
                startTime = new Date();
              }
            } catch {
              startTime = new Date();
            }
            
            // Convert seconds to minutes
            const durationMinutes = Math.round(timeLog.duration_seconds / 60);
            const endTime = new Date(startTime.getTime() + timeLog.duration_seconds * 1000);
            
            // Create description
            let description = '';
            if (timeLog.title) description += timeLog.title;
            if (timeLog.notes) {
              if (description) description += ' - ';
              description += timeLog.notes;
            }
            
            // Check for duplicates
            const isDuplicate = await isDuplicateTimeEntry(clientId || null, startTime, durationMinutes, description || null);
            
            if (isDuplicate) {
              if (importOptions.skipDuplicates || !importOptions.overwriteDuplicates) {
                newResults.push({
                  type: 'time_entry',
                  name: `${timeLog.client_name} - ${timeLog.log_date}`,
                  status: 'duplicate',
                  message: 'דולג - קיים'
                });
                setStats(prev => ({ ...prev, duplicates: prev.duplicates + 1 }));
                continue;
              }
            }
            
            // Insert time entry
            const { error } = await supabase
              .from('time_entries')
              .insert({
                user_id: user.id,
                client_id: clientId || null,
                description: description || null,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                duration_minutes: durationMinutes,
                is_billable: true,
                is_running: false
              });
            
            if (error) throw error;
            
            newResults.push({
              type: 'time_entry',
              name: `${timeLog.client_name} - ${timeLog.log_date}`,
              status: 'success',
              message: `${durationMinutes} דקות`
            });
            setStats(prev => ({ ...prev, successTimeLogs: prev.successTimeLogs + 1 }));
          } catch (error: any) {
            console.error('Error importing time log:', timeLog.client_name, error);
            newResults.push({
              type: 'time_entry',
              name: `${timeLog.client_name} - ${timeLog.log_date}`,
              status: 'error',
              message: error.message || 'שגיאה'
            });
            setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
          }
        }
      }
      
      setResults(newResults);
      setProgress(100);
      setCurrentAction('הושלם!');
      
      const successCount = newResults.filter(r => r.status === 'success').length;
      const dupCount = newResults.filter(r => r.status === 'duplicate').length;
      
      toast({
        title: 'ייבוא הושלם',
        description: `יובאו ${successCount} פריטים, ${dupCount} כפילויות זוהו`,
      });
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'שגיאה בייבוא',
        description: error.message || 'לא ניתן לעבד את הקובץ',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetImport = () => {
    setParsedData(null);
    setFileSelected(false);
    setResults([]);
    setStats({
      totalClients: 0,
      totalTimeLogs: 0,
      totalProjects: 0,
      successClients: 0,
      successTimeLogs: 0,
      successProjects: 0,
      duplicates: 0,
      errors: 0
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: ImportResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'skipped':
      case 'duplicate':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: ImportResult['type']) => {
    switch (type) {
      case 'client':
        return <Users className="h-4 w-4" />;
      case 'time_entry':
        return <Clock className="h-4 w-4" />;
      case 'project':
        return <FolderKanban className="h-4 w-4" />;
    }
  };

  // Download Excel template with correct headers
  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();
    
    // Clients sheet
    const clientsHeaders = [
      'name', 'email', 'phone', 'company', 'address', 'status', 'stage', 
      'notes', 'budget_range', 'source', 'tags', 'position', 
      'phone_secondary', 'whatsapp', 'website', 'linkedin', 'preferred_contact'
    ];
    const clientsData = [clientsHeaders, ['לקוח לדוגמה', 'example@email.com', '050-1234567', 'חברה בע"מ', 'תל אביב', 'active', 'lead', '', '', '', '', '', '', '', '', '', '']];
    const clientsSheet = XLSX.utils.aoa_to_sheet(clientsData);
    XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clients');
    
    // Projects sheet
    const projectsHeaders = [
      'name', 'client_name', 'description', 'status', 'priority', 
      'start_date', 'end_date', 'budget'
    ];
    const projectsData = [projectsHeaders, ['פרויקט לדוגמה', 'לקוח לדוגמה', 'תיאור הפרויקט', 'active', 'medium', '2024-01-01', '2024-12-31', '10000']];
    const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');
    
    // Time Logs sheet
    const timeLogsHeaders = [
      'client_name', 'log_date', 'duration_minutes', 'title', 'notes'
    ];
    const timeLogsData = [timeLogsHeaders, ['לקוח לדוגמה', '2024-01-15', '60', 'פגישת עבודה', 'הערות נוספות']];
    const timeLogsSheet = XLSX.utils.aoa_to_sheet(timeLogsData);
    XLSX.utils.book_append_sheet(workbook, timeLogsSheet, 'TimeLogs');
    
    // Download
    XLSX.writeFile(workbook, 'import-template.xlsx');
    
    toast({
      title: 'התבנית הורדה',
      description: 'קובץ Excel עם הכותרות הנכונות נשמר',
    });
  };

  return (
    <AppLayout title="ייבוא נתונים">
      <div className="p-6 space-y-6">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              ייבוא מקובץ גיבוי
              <Upload className="h-5 w-5" />
            </CardTitle>
            <CardDescription className="text-right">
              העלה קובץ CSV או Excel - כולל לקוחות, פרויקטים, רישומי זמן ונתונים מותאמים אישית
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
                      <FileSpreadsheet className="h-5 w-5 ml-2" />
                      בחר קובץ (CSV / Excel)
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
              
              {/* Import Options & Preview */}
              {fileSelected && parsedData && (
                <>
                  <Separator />
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 justify-end">
                      <h3 className="font-semibold">הגדרות ייבוא</h3>
                      <Settings2 className="h-4 w-4" />
                    </div>
                    
                    {/* Data Type Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-end gap-3 p-4 rounded-lg border">
                        <div className="text-right">
                          <Label htmlFor="import-clients" className="font-medium">לקוחות</Label>
                          <p className="text-sm text-muted-foreground">{parsedData.clients.length} רשומות</p>
                        </div>
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <Checkbox
                          id="import-clients"
                          checked={importOptions.importClients}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, importClients: !!checked }))
                          }
                          disabled={parsedData.clients.length === 0}
                        />
                      </div>
                      
                      <div className="flex items-center justify-end gap-3 p-4 rounded-lg border">
                        <div className="text-right">
                          <Label htmlFor="import-projects" className="font-medium">פרויקטים</Label>
                          <p className="text-sm text-muted-foreground">{parsedData.projects.length} רשומות</p>
                        </div>
                        <FolderKanban className="h-5 w-5 text-muted-foreground" />
                        <Checkbox
                          id="import-projects"
                          checked={importOptions.importProjects}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, importProjects: !!checked }))
                          }
                          disabled={parsedData.projects.length === 0}
                        />
                      </div>
                      
                      <div className="flex items-center justify-end gap-3 p-4 rounded-lg border">
                        <div className="text-right">
                          <Label htmlFor="import-timelogs" className="font-medium">רישומי זמן</Label>
                          <p className="text-sm text-muted-foreground">{parsedData.timeLogs.length} רשומות</p>
                        </div>
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <Checkbox
                          id="import-timelogs"
                          checked={importOptions.importTimeLogs}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, importTimeLogs: !!checked }))
                          }
                          disabled={parsedData.timeLogs.length === 0}
                        />
                      </div>
                    </div>
                    
                    {/* Duplicate Handling */}
                    <div className="flex flex-col md:flex-row gap-4 justify-end">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="overwrite-duplicates" className="text-sm">עדכן נתונים קיימים</Label>
                        <Checkbox
                          id="overwrite-duplicates"
                          checked={importOptions.overwriteDuplicates}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ 
                              ...prev, 
                              overwriteDuplicates: !!checked,
                              skipDuplicates: checked ? false : prev.skipDuplicates
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="skip-duplicates" className="text-sm">דלג על כפילויות</Label>
                        <Checkbox
                          id="skip-duplicates"
                          checked={importOptions.skipDuplicates}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ 
                              ...prev, 
                              skipDuplicates: !!checked,
                              overwriteDuplicates: checked ? false : prev.overwriteDuplicates
                            }))
                          }
                        />
                      </div>
                    </div>
                    
                    {/* Data Preview */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 justify-end">
                        <h4 className="font-medium">תצוגה מקדימה</h4>
                        <Eye className="h-4 w-4" />
                      </div>
                      
                      <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as typeof previewTab)} dir="rtl">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="clients" className="gap-2">
                            <Users className="h-4 w-4" />
                            לקוחות ({parsedData.clients.length})
                          </TabsTrigger>
                          <TabsTrigger value="projects" className="gap-2">
                            <FolderKanban className="h-4 w-4" />
                            פרויקטים ({parsedData.projects.length})
                          </TabsTrigger>
                          <TabsTrigger value="timelogs" className="gap-2">
                            <Clock className="h-4 w-4" />
                            זמנים ({parsedData.timeLogs.length})
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="clients" className="mt-4">
                          <ScrollArea className="h-64 rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right">שם</TableHead>
                                  <TableHead className="text-right">אימייל</TableHead>
                                  <TableHead className="text-right">טלפון</TableHead>
                                  <TableHead className="text-right">שלב</TableHead>
                                  <TableHead className="text-right">נתונים מותאמים</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {parsedData.clients.slice(0, 20).map((client, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>{client.email || '-'}</TableCell>
                                    <TableCell dir="ltr">{client.phone && client.phone !== '0000000000' ? client.phone : '-'}</TableCell>
                                    <TableCell>
                                      {client.stage && <Badge variant="outline">{client.stage}</Badge>}
                                    </TableCell>
                                    <TableCell>
                                      {client.custom_data && Object.keys(client.custom_data).length > 0 && (
                                        <Badge variant="secondary" className="gap-1">
                                          <Database className="h-3 w-3" />
                                          {Object.keys(client.custom_data).length} שדות
                                        </Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {parsedData.clients.length > 20 && (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                ועוד {parsedData.clients.length - 20} לקוחות...
                              </div>
                            )}
                          </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="projects" className="mt-4">
                          <ScrollArea className="h-64 rounded-md border">
                            {parsedData.projects.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-right">שם</TableHead>
                                    <TableHead className="text-right">לקוח</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {parsedData.projects.slice(0, 20).map((project, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">{project.name}</TableCell>
                                      <TableCell>{project.client_name || '-'}</TableCell>
                                      <TableCell>
                                        {project.status && <Badge variant="outline">{project.status}</Badge>}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                לא נמצאו פרויקטים בקובץ
                              </div>
                            )}
                          </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="timelogs" className="mt-4">
                          <ScrollArea className="h-64 rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right">לקוח</TableHead>
                                  <TableHead className="text-right">תאריך</TableHead>
                                  <TableHead className="text-right">משך (דקות)</TableHead>
                                  <TableHead className="text-right">כותרת</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {parsedData.timeLogs.slice(0, 20).map((log, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">{log.client_name}</TableCell>
                                    <TableCell>{log.log_date}</TableCell>
                                    <TableCell>{Math.round(log.duration_seconds / 60)}</TableCell>
                                    <TableCell>{log.title || '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {parsedData.timeLogs.length > 20 && (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                ועוד {parsedData.timeLogs.length - 20} רישומי זמן...
                              </div>
                            )}
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </div>
                    
                    {/* Start Import Button */}
                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        onClick={handleStartImport}
                        disabled={isProcessing || (!importOptions.importClients && !importOptions.importProjects && !importOptions.importTimeLogs)}
                        className="min-w-48"
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
                    </div>
                  </div>
                </>
              )}
              
              {/* Progress */}
              {isProcessing && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{progress}%</span>
                      <span>{currentAction}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Stats */}
        {(stats.totalClients > 0 || stats.totalTimeLogs > 0 || stats.totalProjects > 0) && results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{stats.successClients}</div>
                <div className="text-sm text-muted-foreground">לקוחות יובאו</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{stats.successProjects}</div>
                <div className="text-sm text-muted-foreground">פרויקטים יובאו</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{stats.successTimeLogs}</div>
                <div className="text-sm text-muted-foreground">רישומי זמן יובאו</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{stats.duplicates}</div>
                <div className="text-sm text-muted-foreground">כפילויות זוהו</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                תוצאות ייבוא
                <FileText className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Import Another File Button - Prominent */}
              <div className="flex justify-center pb-4 border-b">
                <Button
                  size="lg"
                  onClick={resetImport}
                  className="gap-2"
                >
                  <Upload className="h-5 w-5" />
                  ייבא קובץ נוסף
                </Button>
              </div>
              
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <span className="text-sm text-muted-foreground">{result.message}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{result.name}</span>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(result.type)}
                          {getStatusIcon(result.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
