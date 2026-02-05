/**
 * Offline Storage Service - IndexedDB wrapper for offline data storage
 * Stores all CRM data locally for offline access
 */

const DB_NAME = 'ncrm-offline-db';
const DB_VERSION = 1;

// Tables to cache offline
const STORES = [
  'clients',
  'projects', 
  'tasks',
  'meetings',
  'time_entries',
  'documents',
  'quotes',
  'contracts',
  'invoices',
  'reminders',
  'contacts',
  'calls',
  'emails',
  'notes',
  'custom_tables',
  'user_settings',
  'sync_queue', // For pending changes to sync
  'sync_meta'   // For sync metadata
] as const;

type StoreName = typeof STORES[number];

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncMeta {
  table: string;
  lastSyncedAt: number;
  lastModifiedAt: number;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each table
        STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // Add common indexes
            if (storeName !== 'sync_queue' && storeName !== 'sync_meta') {
              store.createIndex('updated_at', 'updated_at', { unique: false });
              store.createIndex('created_at', 'created_at', { unique: false });
            }
            
            // Add sync-specific indexes
            if (storeName === 'sync_queue') {
              store.createIndex('table', 'table', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (storeName === 'sync_meta') {
              store.createIndex('table', 'table', { unique: true });
            }
          }
        });

        console.log('📦 IndexedDB schema created/updated');
      };
    });

    return this.initPromise;
  }

  /**
   * Get database instance, initializing if needed
   */
  private async getDB(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Store multiple items in a table
   */
  async setMany<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      items.forEach(item => {
        store.put({
          ...item,
          _localUpdatedAt: Date.now()
        });
      });
    });
  }

  /**
   * Store a single item
   */
  async set<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
    return this.setMany(storeName, [item]);
  }

  /**
   * Get a single item by ID
   */
  async get<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from a table
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete an item by ID
   */
  async delete(storeName: StoreName, id: string): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all items from a table
   */
  async clear(storeName: StoreName): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add an item to the sync queue (for offline changes)
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<void> {
    return this.set('sync_queue', {
      id: `${item.table}_${item.data.id}_${Date.now()}`,
      ...item
    });
  }

  /**
   * Get all pending sync items
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.getAll<SyncQueueItem>('sync_queue');
  }

  /**
   * Remove an item from sync queue after successful sync
   */
  async removeSyncQueueItem(id: string): Promise<void> {
    return this.delete('sync_queue', id);
  }

  /**
   * Update sync metadata for a table
   */
  async updateSyncMeta(table: string, lastSyncedAt: number): Promise<void> {
    return this.set('sync_meta', {
      id: table,
      table,
      lastSyncedAt,
      lastModifiedAt: Date.now()
    });
  }

  /**
   * Get sync metadata for a table
   */
  async getSyncMeta(table: string): Promise<SyncMeta | undefined> {
    return this.get<SyncMeta>('sync_meta', table);
  }

  /**
   * Get count of items in a table
   */
  async count(storeName: StoreName): Promise<number> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if database has any cached data
   */
  async hasData(): Promise<boolean> {
    try {
      const clientCount = await this.count('clients');
      return clientCount > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  async getStorageInfo(): Promise<{ used: string; available: string }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage ? `${(estimate.usage / 1024 / 1024).toFixed(2)} MB` : 'Unknown';
      const available = estimate.quota ? `${(estimate.quota / 1024 / 1024).toFixed(2)} MB` : 'Unknown';
      return { used, available };
    }
    return { used: 'Unknown', available: 'Unknown' };
  }

  /**
   * Export all data (for backup purposes)
   */
  async exportAllData(): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {};
    
    for (const store of STORES) {
      if (store !== 'sync_queue' && store !== 'sync_meta') {
        data[store] = await this.getAll(store);
      }
    }
    
    return data;
  }

  /**
   * Import data (for restore purposes)
   */
  async importData(data: Record<string, any[]>): Promise<void> {
    for (const [storeName, items] of Object.entries(data)) {
      if (STORES.includes(storeName as StoreName)) {
        await this.setMany(storeName as StoreName, items);
      }
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();

// Export types
export type { SyncQueueItem, SyncMeta, StoreName };
