import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseUserSettingsOptions<T> {
  key: string;
  defaultValue: T;
}

const LS_PREFIX = 'us_cache:';

function readLocalCache<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw == null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function writeLocalCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function useUserSettings<T>({ key, defaultValue }: UseUserSettingsOptions<T>) {
  const { user } = useAuth();
  // Lazy-init from localStorage cache — eliminates "flash of default view"
  // by making the persisted value available on the very first render.
  const [value, setValue] = useState<T>(() => {
    const cached = readLocalCache<T>(key);
    return cached !== undefined ? cached : defaultValue;
  });
  // If we have a cached value, we're not "loading" from the UI's perspective.
  const [isLoading, setIsLoading] = useState(() => readLocalCache<T>(key) === undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Mirror of the latest value, updated synchronously. This prevents stale-closure
  // clobbering when several updater functions from the same hook run in one tick.
  const valueRef = useRef<T>(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Background sync from database (refreshes cache from cloud)
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', key)
          .maybeSingle();

        if (error) {
          console.error('Error loading user settings:', error);
          return;
        }

        if (data?.setting_value !== undefined) {
          const cloudValue = data.setting_value as T;
          // Only re-render if cloud value differs from cached value.
          if (JSON.stringify(cloudValue) !== JSON.stringify(valueRef.current)) {
            setValue(cloudValue);
          }
          writeLocalCache(key, cloudValue);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.id, key]);

  // Save settings to database
  const updateValue = useCallback(async (newValueOrUpdater: T | ((prev: T) => T)) => {
    const newValue = typeof newValueOrUpdater === 'function' 
      ? (newValueOrUpdater as (prev: T) => T)(valueRef.current)
      : newValueOrUpdater;

    // Update the ref synchronously so any chained call in the same tick builds on
    // this result instead of the stale render-time value.
    valueRef.current = newValue;
    setValue(newValue);
    // Write-through cache so the next page load shows the chosen view instantly.
    writeLocalCache(key, newValue);



    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            setting_key: key,
            setting_value: newValue as any,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,setting_key',
          }
        );

      if (error) {
        console.error('Error saving user settings:', error);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, key]);

  return {
    value,
    setValue: updateValue,
    isLoading,
    isSaving,
  };
}

// Convenience hook for common settings
export function useViewSettings(pageKey: string) {
  const { value, setValue, isLoading } = useUserSettings<{
    viewMode?: string;
    columns?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
  }>({
    key: `${pageKey}_view_settings`,
    defaultValue: {},
  });

  const setViewMode = useCallback((mode: string) => {
    setValue(prev => ({ ...prev, viewMode: mode }));
  }, [setValue]);

  const setColumns = useCallback((cols: number) => {
    setValue(prev => ({ ...prev, columns: cols }));
  }, [setValue]);

  const setSortBy = useCallback((sort: string) => {
    setValue(prev => ({ ...prev, sortBy: sort }));
  }, [setValue]);

  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    setValue(prev => ({ ...prev, sortOrder: order }));
  }, [setValue]);

  const setFilters = useCallback((filters: Record<string, any>) => {
    setValue(prev => ({ ...prev, filters }));
  }, [setValue]);

  return useMemo(() => ({
    viewMode: value.viewMode,
    columns: value.columns,
    sortBy: value.sortBy,
    sortOrder: value.sortOrder,
    filters: value.filters,
    setViewMode,
    setColumns,
    setSortBy,
    setSortOrder,
    setFilters,
    updateSettings: setValue,
    isLoading,
  }), [value, setViewMode, setColumns, setSortBy, setSortOrder, setFilters, setValue, isLoading]);
}
