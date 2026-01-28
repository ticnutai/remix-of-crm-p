import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseUserSettingsOptions<T> {
  key: string;
  defaultValue: T;
}

export function useUserSettings<T>({ key, defaultValue }: UseUserSettingsOptions<T>) {
  const { user } = useAuth();
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from database
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
          setValue(data.setting_value as T);
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
      ? (newValueOrUpdater as (prev: T) => T)(value)
      : newValueOrUpdater;
    
    setValue(newValue);

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
  }, [user?.id, key, value]);

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
