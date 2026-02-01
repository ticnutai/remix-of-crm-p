/**
 * Script to import time logs from CSV
 * 
 * CSV Structure:
 * לקוח,תאריך,שעה,כותרת,הערות,עובד,משך (שעות:דקות),משך שעות,שכר שעתי,עלות,פרויקט
 * 
 * Usage:
 * 1. Upload CSV via the import UI
 * 2. The system will:
 *    - Create clients if they don't exist
 *    - Create time entries linked to each client
 */

import { supabase } from '@/integrations/supabase/client';

export interface CsvTimeEntry {
  clientName: string;
  date: string;
  time: string;
  title: string;
  notes: string;
  worker: string;
  durationHM: string;  // e.g., "4:22" means 4 hours 22 minutes
  durationHours: number;
  hourlyRate: number;
  cost: number;
  project: string;
}

export interface ImportResult {
  success: boolean;
  clientsCreated: number;
  timeEntriesCreated: number;
  errors: string[];
}

/**
 * Parse CSV content into structured time entries
 */
export function parseCsvContent(csvContent: string): CsvTimeEntry[] {
  const lines = csvContent.split('\n');
  const entries: CsvTimeEntry[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and summary lines (containing ===)
    if (!line || line.includes('===') || line.includes('סה"כ')) {
      continue;
    }
    
    // Parse CSV line (handle quoted fields)
    const fields = parseCSVLine(line);
    
    if (fields.length < 8) continue;
    
    const [clientName, date, time, title, notes, worker, durationHM, durationHours, hourlyRate, cost, project] = fields;
    
    // Skip if no client name or date
    if (!clientName || !date || clientName.trim() === '') continue;
    
    // Parse duration hours
    const hours = parseFloat(durationHours) || 0;
    if (hours <= 0) continue; // Skip entries with no duration
    
    entries.push({
      clientName: clientName.trim(),
      date: date.trim(),
      time: time?.trim() || '',
      title: title?.trim() || '',
      notes: notes?.trim() || '',
      worker: worker?.trim() || '',
      durationHM: durationHM?.trim() || '',
      durationHours: hours,
      hourlyRate: parseFloat(hourlyRate) || 0,
      cost: parseFloat(cost) || 0,
      project: project?.trim() || '',
    });
  }
  
  return entries;
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
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

/**
 * Import time entries from parsed CSV data
 */
export async function importTimeEntries(
  entries: CsvTimeEntry[],
  userId: string,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    clientsCreated: 0,
    timeEntriesCreated: 0,
    errors: [],
  };
  
  // Group entries by client
  const entriesByClient = new Map<string, CsvTimeEntry[]>();
  for (const entry of entries) {
    const existing = entriesByClient.get(entry.clientName) || [];
    existing.push(entry);
    entriesByClient.set(entry.clientName, existing);
  }
  
  // Get existing clients
  const { data: existingClients } = await supabase
    .from('clients')
    .select('id, name');
  
  const clientNameToId = new Map<string, string>();
  existingClients?.forEach(c => clientNameToId.set(c.name.toLowerCase(), c.id));
  
  let processed = 0;
  const total = entries.length;
  
  // Process each client's entries
  for (const [clientName, clientEntries] of entriesByClient) {
    let clientId = clientNameToId.get(clientName.toLowerCase());
    
    // Create client if doesn't exist
    if (!clientId) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: clientName,
          user_id: userId,
          status: 'active',
        })
        .select('id')
        .single();
      
      if (clientError) {
        result.errors.push(`שגיאה ביצירת לקוח "${clientName}": ${clientError.message}`);
        continue;
      }
      
      clientId = newClient.id;
      clientNameToId.set(clientName.toLowerCase(), clientId);
      result.clientsCreated++;
    }
    
    // Create time entries for this client
    for (const entry of clientEntries) {
      // Parse date
      const entryDate = entry.date;
      
      // Convert duration to minutes
      const durationMinutes = Math.round(entry.durationHours * 60);
      
      // Create time entry
      const { error: entryError } = await supabase
        .from('time_entries')
        .insert({
          user_id: userId,
          client_id: clientId,
          date: entryDate,
          start_time: entry.time || null,
          duration_minutes: durationMinutes,
          description: entry.title || entry.notes || 'יובא מקובץ CSV',
          notes: entry.notes || null,
          is_billable: entry.hourlyRate > 0,
          hourly_rate: entry.hourlyRate > 0 ? entry.hourlyRate : null,
        });
      
      if (entryError) {
        result.errors.push(`שגיאה ביצירת רישום זמן: ${entryError.message}`);
      } else {
        result.timeEntriesCreated++;
      }
      
      processed++;
      onProgress?.(processed, total);
    }
  }
  
  result.success = result.errors.length === 0;
  return result;
}

/**
 * Get summary of time logs by client
 */
export function getClientSummary(entries: CsvTimeEntry[]): Map<string, { totalHours: number; count: number }> {
  const summary = new Map<string, { totalHours: number; count: number }>();
  
  for (const entry of entries) {
    const existing = summary.get(entry.clientName) || { totalHours: 0, count: 0 };
    existing.totalHours += entry.durationHours;
    existing.count++;
    summary.set(entry.clientName, existing);
  }
  
  return summary;
}
