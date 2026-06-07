// Hook to resolve user IDs into display names (full_name from profiles).
// Caches results across mounts to minimize round-trips.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<void>>();

async function fetchMissing(ids: string[]) {
  const need = ids.filter((id) => id && !cache.has(id));
  if (need.length === 0) return;

  // Dedup in-flight requests by id
  const todo = need.filter((id) => !inflight.has(id));
  if (todo.length === 0) {
    await Promise.all(need.map((id) => inflight.get(id)).filter(Boolean) as Promise<void>[]);
    return;
  }

  const p = (async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", todo);
      (data || []).forEach((row: any) => {
        cache.set(row.id, row.full_name || row.email || row.id);
      });
      // Mark missing ones with id as fallback to avoid retry loops
      todo.forEach((id) => {
        if (!cache.has(id)) cache.set(id, "משתמש לא ידוע");
      });
    } catch {
      todo.forEach((id) => cache.set(id, "משתמש לא ידוע"));
    }
  })();
  todo.forEach((id) => inflight.set(id, p));
  await p;
  todo.forEach((id) => inflight.delete(id));
}

export function useProfileNames(userIds: Array<string | null | undefined>) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unique = Array.from(new Set(userIds.filter(Boolean) as string[]));
    const missing = unique.filter((id) => !cache.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    fetchMissing(missing).then(() => {
      if (!cancelled) setVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds.join("|")]);

  return (id: string | null | undefined): string => {
    if (!id) return "ללא משתמש";
    return cache.get(id) || id.slice(0, 8);
  };
}
