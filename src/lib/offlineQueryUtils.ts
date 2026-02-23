/**
 * Offline-Aware Query Utilities
 * Provides helpers for React Query hooks to fall back to IndexedDB when offline.
 * Also provides mutation helpers that queue changes when offline.
 */

import { offlineStorage, StoreName } from "@/lib/offlineStorage";
import { dataSyncService } from "@/lib/dataSyncService";

// Tables that exist in both Supabase and IndexedDB
const SYNCABLE_TABLES: Set<string> = new Set([
  "clients",
  "projects",
  "tasks",
  "meetings",
  "time_entries",
  "documents",
  "quotes",
  "contracts",
  "invoices",
  "reminders",
  "contacts",
  "calls",
  "notes",
]);

/**
 * Wraps a Supabase queryFn with IndexedDB fallback.
 * - Online: fetches from Supabase, saves to IndexedDB in background
 * - Offline: returns data from IndexedDB
 *
 * @param table - The IndexedDB store name (must match offlineStorage stores)
 * @param supabaseFetch - The original async function that fetches from Supabase
 * @returns The fetched data (from Supabase or IndexedDB)
 */
export function createOfflineQueryFn<T extends { id: string }>(
  table: string,
  supabaseFetch: () => Promise<T[]>,
): () => Promise<T[]> {
  return async () => {
    // If table is not syncable, just do normal fetch
    if (!SYNCABLE_TABLES.has(table)) {
      return supabaseFetch();
    }

    if (navigator.onLine) {
      try {
        const data = await supabaseFetch();
        // Save to IndexedDB in background (non-blocking)
        offlineStorage.setMany(table as StoreName, data).catch((err) => {
          console.warn(`⚠️ Failed to cache ${table} to IndexedDB:`, err);
        });
        return data;
      } catch (error) {
        // Network error even though navigator.onLine — try IndexedDB
        console.warn(
          `⚠️ Supabase fetch failed for ${table}, trying IndexedDB:`,
          error,
        );
        const cached = await offlineStorage.getAll<T>(table as StoreName);
        if (cached.length > 0) {
          // Serving from IndexedDB cache
          return cached;
        }
        throw error; // No cache available either
      }
    } else {
      // Offline — read from IndexedDB
      const cached = await offlineStorage.getAll<T>(table as StoreName);
      // Offline: serving from IndexedDB
      return cached;
    }
  };
}

/**
 * Wraps a mutation to queue changes when offline.
 * - Online: executes the mutation normally + updates IndexedDB
 * - Offline: saves to IndexedDB + queues for sync
 *
 * @param table - The IndexedDB store name
 * @param operation - insert, update, or delete
 * @param supabaseMutation - The original async mutation function
 * @returns The function to call for the mutation
 */
export function createOfflineMutation<T>(
  table: string,
  operation: "insert" | "update" | "delete",
  supabaseMutation: (data: T) => Promise<T>,
): (data: T) => Promise<T> {
  return async (data: T) => {
    if (!SYNCABLE_TABLES.has(table)) {
      return supabaseMutation(data);
    }

    // Extract id from various data shapes
    const extractId = (d: any): string | undefined => {
      if (typeof d === "string") return d;
      if (d && typeof d === "object" && "id" in d) return d.id;
      return undefined;
    };

    if (navigator.onLine) {
      try {
        const result = await supabaseMutation(data);
        // Update local cache
        const resultId = extractId(result) || extractId(data);
        if (operation === "delete" && resultId) {
          offlineStorage
            .delete(table as StoreName, resultId)
            .catch(console.warn);
        } else if (
          result &&
          typeof result === "object" &&
          "id" in (result as any)
        ) {
          offlineStorage
            .set(table as StoreName, result as any)
            .catch(console.warn);
        }
        return result;
      } catch (error) {
        // If online but request failed, queue for later
        console.warn(
          `⚠️ Mutation failed for ${table}, queueing for sync:`,
          error,
        );
        const queueData =
          typeof data === "object" && data !== null ? data : { id: data };
        await dataSyncService.queueChange(table, operation, queueData);
        return data;
      }
    } else {
      // Offline — queue the change
      // Offline: queueing operation
      const queueData =
        typeof data === "object" && data !== null ? data : { id: data };
      await dataSyncService.queueChange(table, operation, queueData);
      return data;
    }
  };
}
