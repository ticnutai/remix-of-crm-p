// טוען ערכות עיצוב מ-Lovable Cloud (טבלה flow_design_presets).
// ערכות מובנות נטענות אצל כולם; ערכות פרטיות שייכות למשתמש הנוכחי.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DesignPreset, DesignPresetConfig } from "./types";
import { DEFAULT_PRESET_CONFIG } from "./types";

export function usePresets() {
  const [presets, setPresets] = useState<DesignPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await (supabase as any)
      .from("flow_design_presets")
      .select("id,name,is_builtin,user_id,config")
      .order("is_builtin", { ascending: false })
      .order("name", { ascending: true });
    if (error) {
      setError(error.message);
      setPresets([]);
    } else {
      setPresets((data || []) as DesignPreset[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (name: string, config: DesignPresetConfig) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("יש להתחבר כדי לשמור ערכה");
      const { data, error } = await (supabase as any)
        .from("flow_design_presets")
        .insert({ name, config, user_id: uid, is_builtin: false })
        .select()
        .single();
      if (error) throw error;
      await load();
      return data as DesignPreset;
    },
    [load],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Pick<DesignPreset, "name" | "config">>) => {
      const { error } = await (supabase as any)
        .from("flow_design_presets")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any)
        .from("flow_design_presets")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  return { presets, loading, error, reload: load, create, update, remove };
}

export function safeConfig(p: DesignPreset | null | undefined): DesignPresetConfig {
  if (!p) return DEFAULT_PRESET_CONFIG;
  // הגנה — אם משדה ב-DB חסר משהו, ממזגים עם ברירת מחדל
  const c = p.config || ({} as any);
  return {
    fonts: { ...DEFAULT_PRESET_CONFIG.fonts, ...(c.fonts || {}) },
    colors: { ...DEFAULT_PRESET_CONFIG.colors, ...(c.colors || {}) },
    spacing: { ...DEFAULT_PRESET_CONFIG.spacing, ...(c.spacing || {}) },
    headings: {
      h1: { ...DEFAULT_PRESET_CONFIG.headings.h1, ...((c.headings || {}).h1 || {}) },
      h2: { ...DEFAULT_PRESET_CONFIG.headings.h2, ...((c.headings || {}).h2 || {}) },
    },
    page: { ...DEFAULT_PRESET_CONFIG.page, ...(c.page || {}) },
  };
}
