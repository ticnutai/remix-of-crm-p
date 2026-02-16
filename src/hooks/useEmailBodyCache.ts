/**
 * useEmailBodyCache - IndexedDB persistent cache for email bodies
 * Pre-fetches email bodies in the background so hover preview is instant.
 *
 * Strategy:
 * 1. IndexedDB stores email HTML bodies persistently (survives refresh)
 * 2. After email list loads, background-fetch bodies using requestIdleCallback
 * 3. On hover preview, check IndexedDB first → instant if cached
 * 4. Cache bounded to 500 entries (LRU eviction by accessedAt)
 */

import { useCallback, useRef, useEffect } from "react";

const DB_NAME = "gmail_body_cache";
const DB_VERSION = 1;
const STORE_NAME = "bodies";
const MAX_ENTRIES = 500;

interface CachedBody {
  messageId: string;
  html: string;
  cachedAt: number;
  accessedAt: number;
}

// Singleton DB instance
let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "messageId",
        });
        store.createIndex("accessedAt", "accessedAt");
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => {
      console.warn("IndexedDB open failed:", request.error);
      reject(request.error);
    };
  });
  return dbPromise;
}

async function getFromDB(messageId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(messageId);
      req.onsuccess = () => {
        const result = req.result as CachedBody | undefined;
        if (result) {
          // Update accessedAt for LRU
          result.accessedAt = Date.now();
          store.put(result);
          resolve(result.html);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function putInDB(messageId: string, html: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const entry: CachedBody = {
      messageId,
      html,
      cachedAt: Date.now(),
      accessedAt: Date.now(),
    };
    store.put(entry);

    // Evict oldest if over limit
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result > MAX_ENTRIES) {
        const evictCount = countReq.result - MAX_ENTRIES;
        const index = store.index("accessedAt");
        const cursor = index.openCursor();
        let deleted = 0;
        cursor.onsuccess = () => {
          const c = cursor.result;
          if (c && deleted < evictCount) {
            c.delete();
            deleted++;
            c.continue();
          }
        };
      }
    };
  } catch {
    // Silently fail - cache is optional
  }
}

async function hasInDB(messageId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getKey(messageId);
      req.onsuccess = () => resolve(req.result !== undefined);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export function useEmailBodyCache() {
  // In-memory fast lookup (subset of IndexedDB)
  const memCache = useRef<Map<string, string>>(new Map());
  const prefetchingRef = useRef<Set<string>>(new Set());
  const abortRef = useRef(false);

  // Get cached body - checks memory first, then IndexedDB
  const getCachedBody = useCallback(
    async (messageId: string): Promise<string | null> => {
      // 1. Memory cache (instant)
      const mem = memCache.current.get(messageId);
      if (mem) return mem;

      // 2. IndexedDB (fast, ~1-5ms)
      const idb = await getFromDB(messageId);
      if (idb) {
        memCache.current.set(messageId, idb);
        // Keep memory cache bounded
        if (memCache.current.size > 200) {
          const firstKey = memCache.current.keys().next().value;
          if (firstKey) memCache.current.delete(firstKey);
        }
        return idb;
      }

      return null;
    },
    [],
  );

  // Store body in both memory and IndexedDB
  const cacheBody = useCallback(async (messageId: string, html: string) => {
    memCache.current.set(messageId, html);
    if (memCache.current.size > 200) {
      const firstKey = memCache.current.keys().next().value;
      if (firstKey) memCache.current.delete(firstKey);
    }
    await putInDB(messageId, html);
  }, []);

  // Background pre-fetch email bodies for a list of message IDs
  // Uses requestIdleCallback to avoid blocking the UI
  const prefetchBodies = useCallback(
    (
      messageIds: string[],
      fetchBody: (messageId: string) => Promise<string | null>,
    ) => {
      abortRef.current = false;

      const fetchNext = async (ids: string[], index: number) => {
        if (abortRef.current || index >= ids.length) return;

        const id = ids[index];
        // Skip if already cached or currently fetching
        if (memCache.current.has(id) || prefetchingRef.current.has(id)) {
          // Use setTimeout to yield to the event loop
          setTimeout(() => fetchNext(ids, index + 1), 0);
          return;
        }

        // Check IndexedDB
        const inDB = await hasInDB(id);
        if (inDB) {
          setTimeout(() => fetchNext(ids, index + 1), 0);
          return;
        }

        // Fetch in background
        prefetchingRef.current.add(id);
        try {
          const html = await fetchBody(id);
          if (html && !abortRef.current) {
            memCache.current.set(id, html);
            await putInDB(id, html);
          }
        } catch {
          // Silently skip failed fetches
        } finally {
          prefetchingRef.current.delete(id);
        }

        // Small delay between fetches to avoid rate limiting (200ms)
        if (!abortRef.current) {
          setTimeout(() => fetchNext(ids, index + 1), 200);
        }
      };

      // Start after a short initial delay to let the UI settle
      setTimeout(() => fetchNext(messageIds, 0), 1500);
    },
    [],
  );

  // Stop any ongoing prefetch
  const stopPrefetch = useCallback(() => {
    abortRef.current = true;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  return {
    getCachedBody,
    cacheBody,
    prefetchBodies,
    stopPrefetch,
  };
}
