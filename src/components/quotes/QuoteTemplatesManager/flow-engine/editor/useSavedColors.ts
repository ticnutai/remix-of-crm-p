// Hook: ניהול צבעים שמורים בענן — טעינה חד-פעמית לכל הקטגוריות, סינון מקומי (ללא flicker)
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ColorCategory = "text" | "highlight" | "underline";

export interface SavedColor {
  id: string;
  color: string;
  category: ColorCategory;
}

// cache משותף בין כל המופעים של ה-Picker — מונע טעינות חוזרות וקפיצות
let _cache: SavedColor[] | null = null;
const _listeners = new Set<(c: SavedColor[]) => void>();
function _setCache(next: SavedColor[]) {
  _cache = next;
  _listeners.forEach((l) => l(next));
}

export function useSavedColors(category: ColorCategory) {
  const [all, setAll] = useState<SavedColor[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);

  const load = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("user_saved_colors")
      .select("id,color,category")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && data) _setCache(data as SavedColor[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const sub = (c: SavedColor[]) => setAll(c);
    _listeners.add(sub);
    if (_cache === null) load();
    return () => {
      _listeners.delete(sub);
    };
  }, [load]);

  const colors = useMemo(
    () => all.filter((c) => c.category === category),
    [all, category],
  );

  const save = useCallback(
    async (color: string) => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return;
      const exists = (_cache ?? []).some(
        (c) => c.category === category && c.color.toLowerCase() === color.toLowerCase(),
      );
      if (exists) return;
      const optimistic: SavedColor = { id: `tmp-${Date.now()}`, color, category };
      _setCache([optimistic, ...(_cache ?? [])]);
      const { data, error } = await (supabase as any)
        .from("user_saved_colors")
        .upsert(
          { user_id: user.id, category, color },
          { onConflict: "user_id,category,color", ignoreDuplicates: false },
        )
        .select("id,color,category")
        .single();
      if (!error && data) {
        _setCache([
          { id: data.id, color: data.color, category: data.category },
          ...(_cache ?? []).filter((c) => c.id !== optimistic.id),
        ]);
      }
    },
    [category],
  );

  const remove = useCallback(async (id: string) => {
    _setCache((_cache ?? []).filter((c) => c.id !== id));
    if (!id.startsWith("tmp-")) {
      await (supabase as any).from("user_saved_colors").delete().eq("id", id);
    }
  }, []);

  return { colors, loading, save, remove, reload: load };
}
