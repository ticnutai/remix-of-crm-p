/**
 * IndexedDB Persister for React Query
 * Persists the entire React Query cache to IndexedDB so data survives page refreshes.
 * Uses a dedicated DB to avoid conflicts with the offlineStorage sync system.
 */

import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

const DB_NAME = "ncrm-query-cache";
const DB_VERSION = 1;
const STORE_NAME = "queryCache";
const CACHE_KEY = "reactQueryCache";

// Max age for persisted cache: 24 hours
export const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("❌ Failed to open query cache DB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Creates an IndexedDB-based persister for React Query.
 * This stores the entire query cache as a single serialized blob.
 */
export function createIDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(client, CACHE_KEY);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (error) {
        console.warn("⚠️ Failed to persist query cache:", error);
      }
    },

    restoreClient: async (): Promise<PersistedClient | undefined> => {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(CACHE_KEY);
        return new Promise((resolve, reject) => {
          request.onsuccess = () =>
            resolve(request.result as PersistedClient | undefined);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn("⚠️ Failed to restore query cache:", error);
        return undefined;
      }
    },

    removeClient: async () => {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(CACHE_KEY);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (error) {
        console.warn("⚠️ Failed to remove query cache:", error);
      }
    },
  };
}
