// Cloud Preferences Sync Hook - e-control CRM
// Syncs all user preferences between localStorage and Supabase cloud

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// All localStorage keys that should be synced to cloud
const SYNC_KEYS = [
  'ten-arch-theme',
  'sidebar-tasks-open',
  'sidebar-gestures-config',
  'button-gestures-config',
  'finance-page-sections',
  'datatable-pro-presets',
  'timelogs-view-mode',
  'timelogs-search',
  'timelogs-client',
  'timelogs-project',
  'timelogs-date-filter',
  'timelogs-custom-range',
  'timelogs-billable',
  'quotes-search',
  'quotes-status-filter',
  'reports-date-range',
  'myday-meetings-view',
  // Widget customization settings
  'work-hours-widget-colors',
  'dashboard-widgets-config',
  'dashboard-dynamic-stats',
  'dashboard-theme',
  'dashboard-auto-layout',
] as const;

interface CloudPreferences {
  ui_preferences: Record<string, any>;
}

export function useCloudPreferences() {
  const { user } = useAuth();
  const syncInProgress = useRef(false);
  const lastSyncTime = useRef<number>(0);

  // Collect all localStorage preferences
  const collectLocalPreferences = useCallback((): Record<string, any> => {
    const prefs: Record<string, any> = {};
    
    SYNC_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          // Try to parse JSON
          prefs[key] = JSON.parse(value);
        } catch {
          // Keep as string if not JSON
          prefs[key] = value;
        }
      }
    });
    
    return prefs;
  }, []);

  // Apply preferences to localStorage
  const applyToLocalStorage = useCallback((prefs: Record<string, any>) => {
    Object.entries(prefs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
      }
    });
  }, []);

  // Save preferences to cloud
  const saveToCloud = useCallback(async () => {
    if (!user?.id || syncInProgress.current) return;
    
    // Debounce: don't sync more than once per 2 seconds
    const now = Date.now();
    if (now - lastSyncTime.current < 2000) return;
    
    syncInProgress.current = true;
    lastSyncTime.current = now;

    try {
      const localPrefs = collectLocalPreferences();
      
      // Upsert: insert or update user preferences (using raw query for new column)
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          updated_at: new Date().toISOString(),
        } as any, {
          onConflict: 'user_id',
        });

      // Update ui_preferences separately if main upsert succeeded
      if (!error) {
        await supabase
          .from('user_preferences')
          .update({ ui_preferences: localPrefs } as any)
          .eq('user_id', user.id);
      }

      if (error) {
        console.error('Error saving preferences:', error);
      } else {
        console.log('✅ Preferences synced to cloud');
      }
    } catch (error) {
      console.error('❌ Failed to sync preferences to cloud:', error);
    } finally {
      syncInProgress.current = false;
    }
  }, [user?.id, collectLocalPreferences]);

  // Load preferences from cloud
  const loadFromCloud = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        // Apply UI preferences from cloud (using type assertion for new column)
        const uiPrefs = (data as any).ui_preferences;
        if (uiPrefs && typeof uiPrefs === 'object') {
          applyToLocalStorage(uiPrefs as Record<string, any>);
        }
        
        // Also apply theme if stored in dedicated column
        if (data.theme_preset && !uiPrefs?.['ten-arch-theme']) {
          localStorage.setItem('ten-arch-theme', data.theme_preset);
        }
        
        console.log('✅ Preferences loaded from cloud');
        return true;
      }
      return false;
    } catch (error) {
      // No preferences yet, that's OK
      console.log('No cloud preferences found, using local');
      return false;
    }
  }, [user?.id, applyToLocalStorage]);

  // Auto-sync on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadFromCloud();
    }
  }, [user?.id, loadFromCloud]);

  // Listen for localStorage changes and sync
  useEffect(() => {
    if (!user?.id) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && SYNC_KEYS.includes(e.key as any)) {
        saveToCloud();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?.id, saveToCloud]);

  return {
    saveToCloud,
    loadFromCloud,
    collectLocalPreferences,
  };
}
