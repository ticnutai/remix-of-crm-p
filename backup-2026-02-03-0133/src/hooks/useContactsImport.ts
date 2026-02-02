// Hook for importing contacts from CSV files (Google Contacts format)
// With resumable upload support and real-time progress
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const IMPORT_STATE_KEY = 'contacts-import-state';

interface SavedImportState {
  contacts: ParsedContact[];
  lastProcessedIndex: number;
  stats: ImportStats;
  timestamp: number;
}

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  currentContactName?: string;
  status: 'idle' | 'importing' | 'paused' | 'completed' | 'error';
}

export interface ExistingClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phone_secondary: string | null;
}

export interface ParsedContact {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  email1: string;
  email2: string;
  phone1: string;
  phone2: string;
  organization: string;
  title: string;
  department: string;
  birthday: string;
  notes: string;
  labels: string;
  selected: boolean;
  isImported: boolean;
  isDuplicate: boolean;
  existingClientId?: string;
  existingClient?: ExistingClient;
  duplicateReason?: 'email' | 'phone' | 'name';
  action?: 'import' | 'update' | 'skip';
}

export interface ImportStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  duplicates: number;
  errors: number;
}

// Column mapping interface - which CSV column maps to which field
export interface ColumnMapping {
  firstName: string;
  lastName: string;
  fullName: string;
  email1: string;
  email2: string;
  phone1: string;
  phone2: string;
  organization: string;
  title: string;
  department: string;
  birthday: string;
  notes: string;
  labels: string;
}

// Raw CSV row type
export interface RawCsvRow {
  [key: string]: string;
}

// Normalize phone number for comparison
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '').replace(/^0/, '972');
}

// Normalize name for comparison
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Auto-detect column mapping based on common header names
function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    firstName: '',
    lastName: '',
    fullName: '',
    email1: '',
    email2: '',
    phone1: '',
    phone2: '',
    organization: '',
    title: '',
    department: '',
    birthday: '',
    notes: '',
    labels: '',
  };

  const patterns: Record<keyof ColumnMapping, RegExp[]> = {
    firstName: [/^(first\s*name|given\s*name|שם\s*פרטי)$/i],
    lastName: [/^(last\s*name|family\s*name|שם\s*משפחה)$/i],
    fullName: [/^(full\s*name|name|שם\s*מלא|שם)$/i],
    email1: [/^(e-?mail\s*1?\s*-?\s*value|e-?mail|email|מייל)$/i],
    email2: [/^(e-?mail\s*2\s*-?\s*value)$/i],
    phone1: [/^(phone\s*1?\s*-?\s*value|phone|טלפון|נייד)$/i],
    phone2: [/^(phone\s*2\s*-?\s*value)$/i],
    organization: [/^(organization\s*(name|1\s*-\s*name)?|company|חברה|ארגון)$/i],
    title: [/^(organization\s*(title|1\s*-\s*title)|job\s*title|title|תפקיד)$/i],
    department: [/^(organization\s*(department|1\s*-\s*department)|department|מחלקה)$/i],
    birthday: [/^(birthday|יום\s*הולדת)$/i],
    notes: [/^(notes|הערות)$/i],
    labels: [/^(labels|group\s*membership|groups|תוויות)$/i],
  };

  headers.forEach(header => {
    const normalizedHeader = header.trim();
    for (const [field, regexList] of Object.entries(patterns)) {
      if (!mapping[field as keyof ColumnMapping]) {
        for (const regex of regexList) {
          if (regex.test(normalizedHeader)) {
            mapping[field as keyof ColumnMapping] = header;
            break;
          }
        }
      }
    }
  });

  return mapping;
}

// Parse CSV to raw rows
function parseCSVToRows(csvContent: string): { headers: string[]; rows: RawCsvRow[] } {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 1) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows: RawCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: RawCsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

// Convert raw rows to parsed contacts using mapping
function applyMappingToRows(rows: RawCsvRow[], mapping: ColumnMapping): ParsedContact[] {
  const contacts: ParsedContact[] = [];

  rows.forEach((row, i) => {
    const getValue = (field: keyof ColumnMapping): string => {
      const column = mapping[field];
      if (!column) return '';
      return (row[column] || '').trim();
    };

    const firstName = getValue('firstName');
    const lastName = getValue('lastName');
    let fullName = getValue('fullName');
    const email1 = getValue('email1');
    const email2 = getValue('email2');
    const phone1 = getValue('phone1');
    const phone2 = getValue('phone2');

    // Build full name if not directly mapped
    if (!fullName) {
      fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    }

    // Skip rows without name AND without email AND without phone
    if (!fullName && !email1 && !email2 && !phone1 && !phone2) return;

    // Fallback name logic: name > email > phone
    if (!fullName) {
      if (email1) {
        fullName = email1.split('@')[0];
      } else if (phone1) {
        fullName = phone1;
      }
    }

    contacts.push({
      id: `contact-${i}-${Date.now()}`,
      firstName,
      middleName: '',
      lastName,
      fullName,
      email1,
      email2,
      phone1,
      phone2,
      organization: getValue('organization'),
      title: getValue('title'),
      department: getValue('department'),
      birthday: getValue('birthday'),
      notes: getValue('notes'),
      labels: getValue('labels'),
      selected: true,
      isImported: false,
      isDuplicate: false,
      action: 'import',
    });
  });

  return contacts;
}

// Parse Google Contacts CSV header format (legacy function for backward compatibility)
function parseGoogleContactsCSV(csvContent: string): ParsedContact[] {
  const { headers, rows } = parseCSVToRows(csvContent);
  if (rows.length === 0) return [];
  
  const mapping = autoDetectColumnMapping(headers);
  return applyMappingToRows(rows, mapping);
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

export function useContactsImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'idle',
  });
  const [hasSavedState, setHasSavedState] = useState(false);
  
  // New state for manual column mapping
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawCsvRows, setRawCsvRows] = useState<RawCsvRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    firstName: '',
    lastName: '',
    fullName: '',
    email1: '',
    email2: '',
    phone1: '',
    phone2: '',
    organization: '',
    title: '',
    department: '',
    birthday: '',
    notes: '',
    labels: '',
  });

  // Check for saved import state on mount
  useEffect(() => {
    const saved = localStorage.getItem(IMPORT_STATE_KEY);
    if (saved) {
      try {
        const state: SavedImportState = JSON.parse(saved);
        // Only restore if less than 24 hours old
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          setHasSavedState(true);
        } else {
          localStorage.removeItem(IMPORT_STATE_KEY);
        }
      } catch {
        localStorage.removeItem(IMPORT_STATE_KEY);
      }
    }
  }, []);

  // Restore saved import state
  const restoreSavedState = useCallback(() => {
    const saved = localStorage.getItem(IMPORT_STATE_KEY);
    if (saved) {
      try {
        const state: SavedImportState = JSON.parse(saved);
        setParsedContacts(state.contacts);
        setImportStats(state.stats);
        setImportProgress({
          current: state.lastProcessedIndex,
          total: state.contacts.filter(c => c.selected && !c.isImported).length + state.lastProcessedIndex,
          percentage: Math.round((state.lastProcessedIndex / (state.contacts.filter(c => c.selected).length)) * 100),
          status: 'paused',
        });
        toast({
          title: 'מצב נשמר שוחזר',
          description: `נמצאו ${state.contacts.length} אנשי קשר, ממשיכים מרשומה ${state.lastProcessedIndex + 1}`,
        });
        return true;
      } catch {
        localStorage.removeItem(IMPORT_STATE_KEY);
      }
    }
    return false;
  }, [toast]);

  // Save current import state
  const saveImportState = useCallback((contacts: ParsedContact[], lastIndex: number, stats: ImportStats) => {
    const state: SavedImportState = {
      contacts,
      lastProcessedIndex: lastIndex,
      stats,
      timestamp: Date.now(),
    };
    localStorage.setItem(IMPORT_STATE_KEY, JSON.stringify(state));
  }, []);

  // Clear saved state
  const clearSavedState = useCallback(() => {
    localStorage.removeItem(IMPORT_STATE_KEY);
    setHasSavedState(false);
  }, []);

  // Parse CSV file - now returns headers and raw rows for manual mapping
  const parseFile = useCallback(async (file: File): Promise<ParsedContact[]> => {
    setIsLoading(true);
    setImportStats(null);

    try {
      const text = await file.text();
      const { headers, rows } = parseCSVToRows(text);
      
      if (rows.length === 0) {
        toast({
          title: 'קובץ ריק',
          description: 'לא נמצאו שורות בקובץ',
          variant: 'destructive',
        });
        setIsLoading(false);
        return [];
      }

      // Store raw data for manual mapping
      setCsvHeaders(headers);
      setRawCsvRows(rows);
      
      // Auto-detect column mapping
      const autoMapping = autoDetectColumnMapping(headers);
      setColumnMapping(autoMapping);
      
      // Also parse contacts immediately for preview
      const contacts = applyMappingToRows(rows, autoMapping);
      setParsedContacts(contacts);
      
      setIsLoading(false);
      
      toast({
        title: 'הקובץ נטען בהצלחה',
        description: `נמצאו ${rows.length} שורות ו-${headers.length} עמודות`,
      });

      return contacts;
    } catch (error: any) {
      console.error('Error parsing file:', error);
      toast({
        title: 'שגיאה בקריאת הקובץ',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return [];
    }
  }, [toast]);

  // Apply the current column mapping and check for duplicates
  const applyMapping = useCallback(async () => {
    setIsLoading(true);
    
    try {
      let contacts = applyMappingToRows(rawCsvRows, columnMapping);

      if (contacts.length === 0) {
        toast({
          title: 'לא נמצאו אנשי קשר',
          description: 'בדוק את מיפוי העמודות',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Check for duplicates in database
      if (user) {
        const { data: existingClients } = await supabase
          .from('clients')
          .select('id, name, email, phone, phone_secondary, name_clean')
          .eq('user_id', user.id);

        if (existingClients && existingClients.length > 0) {
          // Build lookup maps
          const emailMap = new Map<string, ExistingClient>();
          const phoneMap = new Map<string, ExistingClient>();
          const nameMap = new Map<string, ExistingClient>();

          existingClients.forEach(client => {
            const clientData: ExistingClient = {
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              phone_secondary: client.phone_secondary,
            };

            if (client.email) {
              emailMap.set(client.email.toLowerCase(), clientData);
            }
            if (client.phone) {
              phoneMap.set(normalizePhone(client.phone), clientData);
            }
            if (client.phone_secondary) {
              phoneMap.set(normalizePhone(client.phone_secondary), clientData);
            }
            if (client.name_clean) {
              nameMap.set(client.name_clean.toLowerCase(), clientData);
            } else if (client.name) {
              nameMap.set(normalizeName(client.name), clientData);
            }
          });

          // Check each contact for duplicates
          contacts = contacts.map(contact => {
            // Check email match
            const email1Lower = contact.email1?.toLowerCase();
            const email2Lower = contact.email2?.toLowerCase();
            
            if (email1Lower && emailMap.has(email1Lower)) {
              const existing = emailMap.get(email1Lower)!;
              return {
                ...contact,
                isDuplicate: true,
                existingClientId: existing.id,
                existingClient: existing,
                duplicateReason: 'email' as const,
                selected: false,
                action: 'skip' as const,
              };
            }
            if (email2Lower && emailMap.has(email2Lower)) {
              const existing = emailMap.get(email2Lower)!;
              return {
                ...contact,
                isDuplicate: true,
                existingClientId: existing.id,
                existingClient: existing,
                duplicateReason: 'email' as const,
                selected: false,
                action: 'skip' as const,
              };
            }

            // Check phone match
            const phone1Norm = contact.phone1 ? normalizePhone(contact.phone1) : '';
            const phone2Norm = contact.phone2 ? normalizePhone(contact.phone2) : '';
            
            if (phone1Norm && phoneMap.has(phone1Norm)) {
              const existing = phoneMap.get(phone1Norm)!;
              return {
                ...contact,
                isDuplicate: true,
                existingClientId: existing.id,
                existingClient: existing,
                duplicateReason: 'phone' as const,
                selected: false,
                action: 'skip' as const,
              };
            }
            if (phone2Norm && phoneMap.has(phone2Norm)) {
              const existing = phoneMap.get(phone2Norm)!;
              return {
                ...contact,
                isDuplicate: true,
                existingClientId: existing.id,
                existingClient: existing,
                duplicateReason: 'phone' as const,
                selected: false,
                action: 'skip' as const,
              };
            }

            // Check name match
            const nameNorm = normalizeName(contact.fullName);
            if (nameNorm && nameMap.has(nameNorm)) {
              const existing = nameMap.get(nameNorm)!;
              return {
                ...contact,
                isDuplicate: true,
                existingClientId: existing.id,
                existingClient: existing,
                duplicateReason: 'name' as const,
                selected: false,
                action: 'skip' as const,
              };
            }

            return contact;
          });
        }
      }

      setParsedContacts(contacts);
      setIsLoading(false);

      const duplicateCount = contacts.filter(c => c.isDuplicate).length;
      toast({
        title: 'המיפוי הוחל בהצלחה',
        description: `נמצאו ${contacts.length} אנשי קשר${duplicateCount > 0 ? `, ${duplicateCount} כפילויות זוהו` : ''}`,
      });
    } catch (error: any) {
      console.error('Error applying mapping:', error);
      toast({
        title: 'שגיאה בהחלת המיפוי',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  }, [user, toast, rawCsvRows, columnMapping]);

  // Toggle contact selection
  const toggleContactSelection = useCallback((contactId: string) => {
    setParsedContacts(prev => 
      prev.map(c => 
        c.id === contactId ? { ...c, selected: !c.selected } : c
      )
    );
  }, []);

  // Set action for a contact (import/update/skip)
  const setContactAction = useCallback((contactId: string, action: 'import' | 'update' | 'skip') => {
    setParsedContacts(prev => 
      prev.map(c => 
        c.id === contactId ? { ...c, action, selected: action !== 'skip' } : c
      )
    );
  }, []);

  // Select/deselect all
  const toggleSelectAll = useCallback((selected: boolean) => {
    setParsedContacts(prev => 
      prev.map(c => ({ 
        ...c, 
        selected: c.isDuplicate ? false : selected,
        action: c.isDuplicate ? 'skip' : (selected ? 'import' : 'skip'),
      }))
    );
  }, []);

  // Update existing client with new info
  const updateExistingClient = useCallback(async (contact: ParsedContact): Promise<boolean> => {
    if (!contact.existingClientId) return false;

    try {
      const updates: Record<string, any> = {};

      // Add secondary phone if missing
      if (contact.phone2 && !contact.existingClient?.phone_secondary) {
        updates.phone_secondary = contact.phone2;
      }

      // Add organization if missing
      if (contact.organization) {
        updates.company = contact.organization;
      }

      // Add position if missing
      if (contact.title) {
        updates.position = contact.title;
      }

      // Add notes if there are new ones
      if (contact.notes) {
        updates.notes = contact.notes;
      }

      if (Object.keys(updates).length === 0) {
        return true; // Nothing to update
      }

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', contact.existingClientId);

      return !error;
    } catch {
      return false;
    }
  }, []);

  // Import selected contacts with progress tracking and resumable support
  const importContacts = useCallback(async (resumeFromIndex = 0): Promise<ImportStats> => {
    if (!user) {
      return { total: 0, imported: 0, updated: 0, skipped: 0, duplicates: 0, errors: 0 };
    }

    setIsImporting(true);
    
    // Get saved stats if resuming
    let stats: ImportStats = {
      total: parsedContacts.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      duplicates: 0,
      errors: 0,
    };

    // If resuming, load previous stats
    if (resumeFromIndex > 0) {
      const saved = localStorage.getItem(IMPORT_STATE_KEY);
      if (saved) {
        try {
          const state: SavedImportState = JSON.parse(saved);
          stats = { ...state.stats };
        } catch {}
      }
    }

    const contactsToProcess = parsedContacts.filter(c => c.selected && !c.isImported);
    const totalToProcess = contactsToProcess.length;
    
    setImportProgress({
      current: resumeFromIndex,
      total: totalToProcess,
      percentage: resumeFromIndex > 0 ? Math.round((resumeFromIndex / totalToProcess) * 100) : 0,
      status: 'importing',
    });

    let currentIndex = resumeFromIndex;
    let updatedContacts = [...parsedContacts];

    for (let i = resumeFromIndex; i < contactsToProcess.length; i++) {
      const contact = contactsToProcess[i];
      currentIndex = i;
      
      // Update progress
      const percentage = Math.round(((i + 1) / totalToProcess) * 100);
      setImportProgress({
        current: i + 1,
        total: totalToProcess,
        percentage,
        currentContactName: contact.fullName,
        status: 'importing',
      });

      try {
        // Handle update action for duplicates
        if (contact.action === 'update' && contact.isDuplicate) {
          const success = await updateExistingClient(contact);
          if (success) {
            stats.updated++;
            updatedContacts = updatedContacts.map(c => 
              c.id === contact.id ? { ...c, isImported: true, selected: false } : c
            );
            setParsedContacts(updatedContacts);
          } else {
            stats.errors++;
          }
          // Save state after each operation
          saveImportState(updatedContacts, i + 1, stats);
          continue;
        }

        // Skip duplicates without update action
        if (contact.isDuplicate && contact.action !== 'import') {
          stats.duplicates++;
          saveImportState(updatedContacts, i + 1, stats);
          continue;
        }

        // Import as new client
        const primaryEmail = contact.email1 || contact.email2 || null;
        const primaryPhone = contact.phone1 || contact.phone2 || null;

        const { error } = await supabase.from('clients').insert({
          name: contact.fullName,
          name_clean: normalizeName(contact.fullName),
          email: primaryEmail,
          phone: primaryPhone,
          phone_secondary: contact.phone2 || null,
          company: contact.organization || null,
          position: contact.title || null,
          notes: contact.notes || null,
          source: 'csv_import',
          status: 'active',
          user_id: user.id,
          created_by: user.id,
          tags: contact.labels ? [contact.labels.replace('* ', '').trim()] : null,
        });

        if (error) {
          console.error('Error importing contact:', error);
          stats.errors++;
        } else {
          stats.imported++;
          updatedContacts = updatedContacts.map(c => 
            c.id === contact.id ? { ...c, isImported: true, selected: false } : c
          );
          setParsedContacts(updatedContacts);
        }
        
        // Save state after each operation for resume capability
        saveImportState(updatedContacts, i + 1, stats);
        
      } catch (error) {
        console.error('Error importing contact:', error);
        stats.errors++;
        // Save state on error for resume
        saveImportState(updatedContacts, i, stats);
        
        // Set progress to paused on error
        setImportProgress(prev => ({
          ...prev,
          status: 'error',
        }));
        
        toast({
          title: 'שגיאה בייבוא',
          description: `אפשר להמשיך מאיפה שעצרת (רשומה ${i + 1})`,
          variant: 'destructive',
        });
        
        setIsImporting(false);
        return stats;
      }
    }

    // Import completed successfully - clear saved state
    clearSavedState();
    
    stats.skipped = stats.total - stats.imported - stats.updated - stats.duplicates - stats.errors;
    setImportStats(stats);
    setIsImporting(false);
    setImportProgress({
      current: totalToProcess,
      total: totalToProcess,
      percentage: 100,
      status: 'completed',
    });

    const messages = [];
    if (stats.imported > 0) messages.push(`${stats.imported} יובאו`);
    if (stats.updated > 0) messages.push(`${stats.updated} עודכנו`);
    if (stats.duplicates > 0) messages.push(`${stats.duplicates} כפולים`);
    if (stats.errors > 0) messages.push(`${stats.errors} שגיאות`);

    toast({
      title: 'הייבוא הושלם',
      description: messages.join(', '),
    });

    return stats;
  }, [user, parsedContacts, toast, updateExistingClient, saveImportState, clearSavedState]);

  // Resume import from saved state
  const resumeImport = useCallback(async () => {
    const saved = localStorage.getItem(IMPORT_STATE_KEY);
    if (saved) {
      try {
        const state: SavedImportState = JSON.parse(saved);
        setParsedContacts(state.contacts);
        return importContacts(state.lastProcessedIndex);
      } catch {
        localStorage.removeItem(IMPORT_STATE_KEY);
      }
    }
    return null;
  }, [importContacts]);

  // Reset state
  const reset = useCallback(() => {
    setParsedContacts([]);
    setImportStats(null);
    setImportProgress({
      current: 0,
      total: 0,
      percentage: 0,
      status: 'idle',
    });
    setCsvHeaders([]);
    setRawCsvRows([]);
    setColumnMapping({
      firstName: '',
      lastName: '',
      fullName: '',
      email1: '',
      email2: '',
      phone1: '',
      phone2: '',
      organization: '',
      title: '',
      department: '',
      birthday: '',
      notes: '',
      labels: '',
    });
    clearSavedState();
  }, [clearSavedState]);

  // Get selection stats
  const selectionStats = {
    total: parsedContacts.length,
    selected: parsedContacts.filter(c => c.selected).length,
    duplicates: parsedContacts.filter(c => c.isDuplicate).length,
    imported: parsedContacts.filter(c => c.isImported).length,
    toUpdate: parsedContacts.filter(c => c.action === 'update').length,
  };

  return {
    parsedContacts,
    isLoading,
    isImporting,
    importStats,
    importProgress,
    selectionStats,
    hasSavedState,
    csvHeaders,
    rawCsvRows,
    columnMapping,
    parseFile,
    setColumnMapping,
    applyMapping,
    toggleContactSelection,
    setContactAction,
    toggleSelectAll,
    importContacts,
    resumeImport,
    restoreSavedState,
    reset,
  };
}
