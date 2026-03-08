// Module-level + sessionStorage cache for Supabase table availability
// Prevents repeated 400 requests to tables that don't exist in the remote database

const STORAGE_KEY = "supabase-unavailable-tables";

// Initialize from sessionStorage to persist across client-side reloads
function loadFromStorage(): Set<string> {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

const unavailableTables: Set<string> = loadFromStorage();

function saveToStorage(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...unavailableTables]));
  } catch {
    // sessionStorage unavailable (SSR, etc.)
  }
}

/**
 * Mark a table as unavailable (returned 400/error).
 * Persisted in sessionStorage so it survives page reloads within the session.
 */
export function markTableUnavailable(tableName: string): void {
  unavailableTables.add(tableName);
  saveToStorage();
}

/**
 * Check if a table is known to be unavailable.
 * Returns true if the table has NOT been marked as unavailable.
 */
export function isTableAvailable(tableName: string): boolean {
  return !unavailableTables.has(tableName);
}

/**
 * Reset availability cache (e.g., on reconnect or manual retry).
 */
export function resetTableCache(): void {
  unavailableTables.clear();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}
