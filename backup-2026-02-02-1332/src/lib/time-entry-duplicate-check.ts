// Time Entry Duplicate Detection Utilities
import { supabase } from '@/integrations/supabase/client';

interface DuplicateCheckParams {
  clientId: string | null;
  startTime: Date;
  durationMinutes: number;
  description?: string | null;
  excludeId?: string; // For edit scenarios - exclude the current entry
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingEntry?: {
    id: string;
    start_time: string;
    duration_minutes: number;
    description: string | null;
  };
  message?: string;
}

/**
 * Check if a time entry is a potential duplicate
 * Checks for entries on the same day with same client and similar duration
 */
export async function checkTimeEntryDuplicate(params: DuplicateCheckParams): Promise<DuplicateCheckResult> {
  const { clientId, startTime, durationMinutes, description, excludeId } = params;

  // Get start and end of the day
  const startOfDay = new Date(startTime);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startTime);
  endOfDay.setHours(23, 59, 59, 999);

  // Build query
  let query = supabase
    .from('time_entries')
    .select('id, start_time, duration_minutes, description, client_id')
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString());

  // If client is specified, check for same client
  if (clientId) {
    query = query.eq('client_id', clientId);
  } else {
    query = query.is('client_id', null);
  }

  // Check for similar duration (within 1 minute tolerance)
  query = query.gte('duration_minutes', durationMinutes - 1)
               .lte('duration_minutes', durationMinutes + 1);

  // Exclude current entry if editing
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data: potentialDuplicates, error } = await query;

  if (error) {
    console.error('Error checking for duplicates:', error);
    return { isDuplicate: false };
  }

  if (!potentialDuplicates || potentialDuplicates.length === 0) {
    return { isDuplicate: false };
  }

  // Check for exact or near-exact matches
  const normalizedDesc = (description || '').trim().toLowerCase().slice(0, 50);
  
  for (const entry of potentialDuplicates) {
    const entryDescNormalized = (entry.description || '').trim().toLowerCase().slice(0, 50);
    
    // If descriptions match (or both empty), it's a duplicate
    if (normalizedDesc === entryDescNormalized) {
      return {
        isDuplicate: true,
        existingEntry: entry,
        message: `נמצא רישום דומה באותו יום עם אותו לקוח ומשך זמן דומה`
      };
    }
    
    // Even if descriptions differ, warn about same client/duration on same day
    if (entry.duration_minutes === durationMinutes) {
      return {
        isDuplicate: true,
        existingEntry: entry,
        message: `נמצא רישום באותו יום עם אותו לקוח ואותו משך זמן`
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Find all duplicate time entries in the database
 * Returns groups of duplicate entries
 */
export async function findAllDuplicateEntries(userId: string): Promise<{
  groups: Array<{
    key: string;
    entries: Array<{ id: string; start_time: string; created_at: string }>;
    count: number;
  }>;
  totalDuplicates: number;
}> {
  // Get all entries for this user
  const { data: entries, error } = await supabase
    .from('time_entries')
    .select('id, client_id, start_time, end_time, duration_minutes, description, created_at')
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (error || !entries) {
    console.error('Error fetching entries:', error);
    return { groups: [], totalDuplicates: 0 };
  }

  // Group by client + date + duration
  const groups = new Map<string, Array<{ id: string; start_time: string; created_at: string }>>();

  for (const entry of entries) {
    const dateOnly = entry.start_time?.split('T')[0] || '';
    const key = `${entry.client_id || 'no-client'}::${dateOnly}::${entry.duration_minutes}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push({
      id: entry.id,
      start_time: entry.start_time,
      created_at: entry.created_at
    });
  }

  // Filter to only groups with duplicates
  const duplicateGroups: Array<{
    key: string;
    entries: Array<{ id: string; start_time: string; created_at: string }>;
    count: number;
  }> = [];

  let totalDuplicates = 0;

  groups.forEach((entries, key) => {
    if (entries.length > 1) {
      duplicateGroups.push({
        key,
        entries,
        count: entries.length
      });
      totalDuplicates += entries.length - 1; // Count extras as duplicates
    }
  });

  return { groups: duplicateGroups, totalDuplicates };
}

/**
 * Delete duplicate entries, keeping only the first (oldest) one in each group
 */
export async function deleteDuplicateEntries(duplicateGroups: Array<{
  entries: Array<{ id: string; created_at: string }>;
}>): Promise<{ deleted: number; errors: number }> {
  let deleted = 0;
  let errors = 0;

  for (const group of duplicateGroups) {
    // Sort by created_at and keep the first one
    const sorted = [...group.entries].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // Delete all except the first
    const toDelete = sorted.slice(1).map(e => e.id);
    
    for (const id of toDelete) {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting duplicate:', error);
        errors++;
      } else {
        deleted++;
      }
    }
  }

  return { deleted, errors };
}
