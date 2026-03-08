// Auto-sync hook for background synchronization
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AutoSyncSettings {
  enabled: boolean;
  intervalMinutes: number;
}

const DEFAULT_SETTINGS: AutoSyncSettings = {
  enabled: false,
  intervalMinutes: 15,
};

const STORAGE_KEY = 'google-calendar-auto-sync-settings';

export function useAutoSync(onSync: () => Promise<void>) {
  const { user } = useAuth();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [settings, setSettings] = useState<AutoSyncSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nextSyncTime, setNextSyncTime] = useState<Date | null>(null);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: AutoSyncSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<AutoSyncSettings>) => {
    const newSettings = { ...settings, ...updates };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Perform sync
  const performSync = useCallback(async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    try {
      await onSync();
      setLastSyncTime(new Date());
      
      // Calculate next sync time
      if (settings.enabled) {
        const next = new Date();
        next.setMinutes(next.getMinutes() + settings.intervalMinutes);
        setNextSyncTime(next);
      }
    } catch (error) {
      console.error('Auto-sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, onSync, settings.enabled, settings.intervalMinutes]);

  // Setup interval
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!settings.enabled || !user) {
      setNextSyncTime(null);
      return;
    }

    // Calculate next sync time
    const next = new Date();
    next.setMinutes(next.getMinutes() + settings.intervalMinutes);
    setNextSyncTime(next);

    // Set up new interval
    const intervalMs = settings.intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(() => {
      performSync();
    }, intervalMs);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings.enabled, settings.intervalMinutes, user, performSync]);

  // Manual sync trigger
  const syncNow = useCallback(async () => {
    await performSync();
    toast({
      title: 'סנכרון בוצע',
      description: 'כל החשבונות סונכרנו בהצלחה',
    });
  }, [performSync, toast]);

  return {
    settings,
    updateSettings,
    lastSyncTime,
    nextSyncTime,
    isSyncing,
    syncNow,
  };
}
