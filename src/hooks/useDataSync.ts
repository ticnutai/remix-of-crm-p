/**
 * React hook for data synchronization
 * Provides sync status and controls for offline-first data access
 */

import { useState, useEffect, useCallback } from 'react';
import { dataSyncService } from '@/lib/dataSyncService';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingChanges: number;
  error: string | null;
}

export function useDataSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncedAt: null,
    pendingChanges: 0,
    error: null,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize sync service
    dataSyncService.init().then(() => {
      setIsInitialized(true);
    });

    // Subscribe to status changes
    const unsubscribe = dataSyncService.onStatusChange(setStatus);

    // Update pending changes count periodically
    const updatePendingCount = async () => {
      const count = await dataSyncService.getPendingChangesCount();
      setStatus(prev => ({ ...prev, pendingChanges: count }));
    };
    
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const syncNow = useCallback(async () => {
    return dataSyncService.syncAll();
  }, []);

  const forceSync = useCallback(async () => {
    return dataSyncService.forceFullSync();
  }, []);

  const queueChange = useCallback(async (
    table: string, 
    operation: 'insert' | 'update' | 'delete', 
    data: any
  ) => {
    return dataSyncService.queueChange(table, operation, data);
  }, []);

  const getData = useCallback(async <T,>(table: string): Promise<T[]> => {
    return dataSyncService.getData<T>(table);
  }, []);

  const getItem = useCallback(async <T,>(table: string, id: string): Promise<T | undefined> => {
    return dataSyncService.getItem<T>(table, id);
  }, []);

  const getStorageInfo = useCallback(async () => {
    return dataSyncService.getStorageInfo();
  }, []);

  return {
    ...status,
    isInitialized,
    syncNow,
    forceSync,
    queueChange,
    getData,
    getItem,
    getStorageInfo,
  };
}
