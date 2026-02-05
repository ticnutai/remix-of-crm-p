/**
 * Data Sync Initializer Component
 * Initializes the offline sync system and performs initial data sync
 */

import { useEffect, useRef } from 'react';
import { dataSyncService } from '@/lib/dataSyncService';
import { useAuth } from '@/hooks/useAuth';

export function DataSyncInitializer() {
  const { user } = useAuth();
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once and when user is logged in
    if (initializedRef.current || !user?.id) {
      return;
    }

    const initSync = async () => {
      try {
        console.log('🔄 Initializing data sync service...');
        await dataSyncService.init();
        
        // Check if we have cached data
        const hasCached = await dataSyncService.hasCachedData();
        
        if (!hasCached && navigator.onLine) {
          // First time - do a full sync to cache all data locally
          console.log('📥 First sync - downloading all data to local storage...');
          await dataSyncService.syncAll();
          console.log('✅ Initial sync completed');
        } else if (navigator.onLine) {
          // Already have data - just sync updates
          console.log('🔄 Syncing updates...');
          await dataSyncService.syncAll();
        } else {
          console.log('📴 Offline - using cached data');
        }
        
        initializedRef.current = true;
      } catch (error) {
        console.error('❌ Failed to initialize data sync:', error);
      }
    };

    initSync();
  }, [user?.id]);

  // Listen for background sync messages from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BACKGROUND_SYNC_TRIGGER') {
        console.log('🔄 Background sync triggered, syncing now...');
        dataSyncService.syncAll();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export default DataSyncInitializer;
