import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { type DesignOverride } from '@/lib/designOverrides';

const LOCAL_KEY = 'ten-arch-community-themes';

export interface CommunityThemeRecord {
  id: string;
  slug: string;
  name: string;
  name_he: string;
  primary_hsl: string;
  secondary_hsl: string;
  primary_hex: string;
  secondary_hex: string;
  element_overrides: DesignOverride[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishThemeInput {
  name: string;
  primary: string;
  secondary: string;
  primaryHex: string;
  secondaryHex: string;
  elementOverrides: DesignOverride[];
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
}

function loadCachedThemes(): CommunityThemeRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CommunityThemeRecord[]) : [];
  } catch {
    return [];
  }
}

export function useCommunityThemes() {
  const { user, isAdmin } = useAuth();
  const [themes, setThemes] = useState<CommunityThemeRecord[]>(loadCachedThemes);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('community_themes')
        .select(
          'id, slug, name, name_he, primary_hsl, secondary_hsl, primary_hex, secondary_hex, element_overrides, created_by, created_at, updated_at',
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const next = Array.isArray(data)
        ? (data.map((row) => ({
            ...row,
            element_overrides: Array.isArray(row.element_overrides) ? row.element_overrides : [],
          })) as CommunityThemeRecord[])
        : [];

      setThemes(next);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('community-themes-updated'));
    } catch (error) {
      console.warn('[community-themes] refresh failed', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void refresh();
  }, [refresh, user?.id]);

  const publishTheme = useCallback(
    async (theme: PublishThemeInput): Promise<{ ok: boolean; slug?: string; error?: string }> => {
      if (!isAdmin) {
        return { ok: false, error: 'רק מנהל מערכת יכול לפרסם ערכת קהילה' };
      }

      const base = slugify(theme.name);
      const slug = base.length > 0 ? base : `theme-${Date.now()}`;

      const payload = {
        slug,
        name: theme.name,
        name_he: theme.name,
        primary_hsl: theme.primary,
        secondary_hsl: theme.secondary,
        primary_hex: theme.primaryHex,
        secondary_hex: theme.secondaryHex,
        element_overrides: Array.isArray(theme.elementOverrides) ? theme.elementOverrides : [],
        created_by: user?.id ?? null,
      };

      const { error } = await (supabase as any)
        .from('community_themes')
        .upsert([payload], { onConflict: 'slug' });

      if (error) {
        return { ok: false, error: error.message };
      }

      await refresh();
      return { ok: true, slug };
    },
    [isAdmin, refresh, user?.id],
  );

  return {
    themes,
    loading,
    refresh,
    publishTheme,
    isAdmin,
  };
}
