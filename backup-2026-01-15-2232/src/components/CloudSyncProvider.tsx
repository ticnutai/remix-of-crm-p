// Cloud Sync Provider - Syncs user preferences between localStorage and cloud
import React, { useEffect, useRef } from 'react';
import { useCloudPreferences } from '@/hooks/useCloudPreferences';
import { useAuth } from '@/hooks/useAuth';

// Keys that trigger auto-save when changed
const WATCH_KEYS = [
  'ten-arch-theme',
  'sidebar-tasks-open',
  'sidebar-gestures-config',
  'button-gestures-config',
  'finance-page-sections',
  'datatable-pro-presets',
  'timelogs-view-mode',
  'timelogs-client',
  'timelogs-project',
  'timelogs-date-filter',
  'quotes-status-filter',
  'reports-date-range',
  'myday-meetings-view',
];

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { saveToCloud, loadFromCloud } = useCloudPreferences();
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedFromCloud = useRef(false);

  // Load from cloud on login
  useEffect(() => {
    if (user?.id && !hasLoadedFromCloud.current) {
      hasLoadedFromCloud.current = true;
      loadFromCloud();
    }
    
    // Reset on logout
    if (!user?.id) {
      hasLoadedFromCloud.current = false;
    }
  }, [user?.id, loadFromCloud]);

  // Watch for localStorage changes and auto-save
  useEffect(() => {
    if (!user?.id) return;

    // Override localStorage.setItem to detect changes
    const originalSetItem = localStorage.setItem.bind(localStorage);
    
    localStorage.setItem = (key: string, value: string) => {
      originalSetItem(key, value);
      
      // If it's a watched key, schedule a save
      if (WATCH_KEYS.includes(key)) {
        if (saveTimeout.current) {
          clearTimeout(saveTimeout.current);
        }
        // Debounce: save after 3 seconds of no changes
        saveTimeout.current = setTimeout(() => {
          saveToCloud();
        }, 3000);
      }
    };

    // Save on page unload
    const handleBeforeUnload = () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      // Sync save (may not complete if page closes too fast)
      saveToCloud();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      localStorage.setItem = originalSetItem;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [user?.id, saveToCloud]);

  return <>{children}</>;
}
