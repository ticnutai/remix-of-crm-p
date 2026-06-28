// Hook: ניהול צבעים שמורים בענן (פר-משתמש, פר-קטגוריה)
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ColorCategory = "text" | "highlight" | "underline";

export interface SavedColor {
  id: string;
  color: string;
  category: ColorCategory;
}

export function useSavedColors(category: ColorCategory) {
  const [colors, setColors] = useState<SavedColor[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("user_saved_colors")
      .select("id,color,category")
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(48);
    if (!error && data) setColors(data as SavedColor[]);
    setLoading(false);
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (color: string) => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) return;
      // optimistic
      setColors((prev) =>
        prev.some((c) => c.color.toLowerCase() === color.toLowerCase())
          ? prev
          : [{ id: `tmp-${Date.now()}`, color, category }, ...prev],
      );
      await (supabase as any)
        .from("user_saved_colors")
        .upsert(
          { user_id: user.id, category, color },
          { onConflict: "user_id,category,color", ignoreDuplicates: true },
        );
      load();
    },
    [category, load],
  );

  const remove = useCallback(
    async (id: string) => {
      setColors((prev) => prev.filter((c) => c.id !== id));
      if (!id.startsWith("tmp-")) {
        await (supabase as any).from("user_saved_colors").delete().eq("id", id);
      }
    },
    [],
  );

  return { colors, loading, save, remove, reload: load };
}
