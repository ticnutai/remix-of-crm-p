/**
 * Data Sync Service - Syncs data between local IndexedDB and Supabase cloud
 * Handles bidirectional synchronization with conflict resolution
 */

import { supabase } from "@/integrations/supabase/client";
import { offlineStorage, SyncQueueItem } from "./offlineStorage";

// Tables to sync with their Supabase table names
const SYNC_TABLES = {
  clients: "clients",
  projects: "projects",
  tasks: "tasks",
  meetings: "meetings",
  time_entries: "time_entries",
  documents: "documents",
  quotes: "quotes",
  contracts: "contracts",
  invoices: "invoices",
  reminders: "reminders",
  // Note: contacts, calls, notes tables do not exist in Supabase
} as const;

// Tables that don't have an updated_at column (skip incremental sync filter)
const TABLES_WITHOUT_UPDATED_AT = new Set(["reminders"]);

type SyncTableName = keyof typeof SYNC_TABLES;

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingChanges: number;
  error: string | null;
}

class DataSyncService {
  private isSyncing = false;
  private syncInterval: number | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private lastSyncedAt: number | null = null;
  private syncError: string | null = null;
  private initialized = false;

  /**
   * Initialize the sync service
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return; // Already initialized — skip duplicate calls
    }
    this.initialized = true;

    await offlineStorage.init();

    // Listen for online/offline events
    window.addEventListener("online", () => this.onOnline());
    window.addEventListener("offline", () => this.onOffline());

    // Start periodic sync if online
    if (navigator.onLine) {
      this.startPeriodicSync();
    }

    console.log("🔄 DataSyncService initialized");
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.getStatus());
    return () => this.listeners.delete(callback);
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      pendingChanges: 0, // Will be updated async
      error: this.syncError,
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((callback) => callback(status));
  }

  /**
   * Handle coming online
   */
  private async onOnline(): Promise<void> {
    console.log("🌐 Back online - starting sync");
    this.notifyListeners();
    await this.syncAll();
    this.startPeriodicSync();
  }

  /**
   * Handle going offline
   */
  private onOffline(): void {
    console.log("📴 Gone offline - stopping periodic sync");
    this.stopPeriodicSync();
    this.notifyListeners();
  }

  /**
   * Start periodic sync (every 5 minutes)
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = window.setInterval(
      () => {
        if (navigator.onLine && !this.isSyncing) {
          this.syncAll();
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all tables
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ["Sync already in progress"],
      };
    }

    if (!navigator.onLine) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ["No internet connection"],
      };
    }

    this.isSyncing = true;
    this.syncError = null;
    this.notifyListeners();

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // First, push local changes to cloud
      await this.pushLocalChanges();

      // Then, pull latest from cloud
      for (const [localTable, supabaseTable] of Object.entries(SYNC_TABLES)) {
        try {
          await this.syncTable(localTable as SyncTableName, supabaseTable);
          result.synced++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to sync ${localTable}: ${error}`);
        }
      }

      this.lastSyncedAt = Date.now();
      result.success = result.failed === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
      this.syncError = String(error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    console.log("🔄 Sync completed:", result);
    return result;
  }

  /**
   * Sync a single table from Supabase to local storage
   */
  private async syncTable(
    localTable: SyncTableName,
    supabaseTable: string,
  ): Promise<void> {
    // Get last sync time for this table
    const syncMeta = await offlineStorage.getSyncMeta(localTable);
    const lastSync = syncMeta?.lastSyncedAt || 0;

    // Fetch data from Supabase (only updated since last sync)
    let query = (supabase as any).from(supabaseTable).select("*");

    if (lastSync > 0 && !TABLES_WITHOUT_UPDATED_AT.has(localTable)) {
      const lastSyncDate = new Date(lastSync).toISOString();
      query = query.gte("updated_at", lastSyncDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data && data.length > 0) {
      // Store in IndexedDB
      await offlineStorage.setMany(localTable, data as any);
      console.log(`📥 Synced ${data.length} items to ${localTable}`);
    }

    // Update sync metadata
    await offlineStorage.updateSyncMeta(localTable, Date.now());
  }

  /**
   * Push local changes to cloud
   */
  private async pushLocalChanges(): Promise<void> {
    const queue = await offlineStorage.getSyncQueue();

    if (queue.length === 0) {
      return;
    }

    console.log(`📤 Pushing ${queue.length} local changes to cloud`);

    for (const item of queue) {
      try {
        await this.pushSingleChange(item);
        await offlineStorage.removeSyncQueueItem(item.id);
      } catch (error) {
        console.error(`Failed to push change ${item.id}:`, error);
        // Will retry on next sync
      }
    }
  }

  /**
   * Push a single change to cloud
   */
  private async pushSingleChange(item: SyncQueueItem): Promise<void> {
    const supabaseTable = SYNC_TABLES[item.table as SyncTableName];
    if (!supabaseTable) {
      throw new Error(`Unknown table: ${item.table}`);
    }

    switch (item.operation) {
      case "insert":
        const { error: insertError } = await (supabase as any)
          .from(supabaseTable)
          .insert(item.data);
        if (insertError) throw insertError;
        break;

      case "update":
        const { error: updateError } = await (supabase as any)
          .from(supabaseTable)
          .update(item.data)
          .eq("id", item.data.id);
        if (updateError) throw updateError;
        break;

      case "delete":
        const { error: deleteError } = await (supabase as any)
          .from(supabaseTable)
          .delete()
          .eq("id", item.data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  /**
   * Queue a local change for sync
   */
  async queueChange(
    table: string,
    operation: "insert" | "update" | "delete",
    data: any,
  ): Promise<void> {
    // Save to local storage immediately
    if (operation !== "delete") {
      await offlineStorage.set(table as any, data);
    } else {
      await offlineStorage.delete(table as any, data.id);
    }

    // Add to sync queue if offline or for background sync
    await offlineStorage.addToSyncQueue({
      table,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });

    // If online, try to sync immediately
    if (navigator.onLine) {
      this.pushLocalChanges().catch(console.error);
    }

    this.notifyListeners();
  }

  /**
   * Get data from local storage (offline-first)
   */
  async getData<T>(table: string): Promise<T[]> {
    return offlineStorage.getAll<T>(table as any);
  }

  /**
   * Get single item from local storage
   */
  async getItem<T>(table: string, id: string): Promise<T | undefined> {
    return offlineStorage.get<T>(table as any, id);
  }

  /**
   * Force full sync (clear local and re-download)
   */
  async forceFullSync(): Promise<SyncResult> {
    // Clear all local data except sync queue
    for (const table of Object.keys(SYNC_TABLES)) {
      await offlineStorage.clear(table as any);
    }

    // Reset sync metadata
    await offlineStorage.clear("sync_meta");

    // Do full sync
    return this.syncAll();
  }

  /**
   * Get pending changes count
   */
  async getPendingChangesCount(): Promise<number> {
    const queue = await offlineStorage.getSyncQueue();
    return queue.length;
  }

  /**
   * Check if we have cached data
   */
  async hasCachedData(): Promise<boolean> {
    return offlineStorage.hasData();
  }

  /**
   * Get storage info
   */
  async getStorageInfo() {
    return offlineStorage.getStorageInfo();
  }
}

// Export singleton
export const dataSyncService = new DataSyncService();
