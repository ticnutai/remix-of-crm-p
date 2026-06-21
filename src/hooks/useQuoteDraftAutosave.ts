import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const LS_PREFIX = "quote-draft::";
const SETTING_PREFIX = "quote-draft::";

/**
 * Strip base64-encoded images from a draft snapshot before writing to localStorage.
 * Full data is always saved to the cloud; local storage keeps only text/structural data.
 */
function trimSnapshotForLocalStorage(snapshot: any): any {
  if (!snapshot || typeof snapshot !== "object") return snapshot;
  const ds = snapshot.designSettings;
  if (!ds) return snapshot;
  const trimmedDs = { ...ds };
  // Remove fields that commonly hold large base64 strings
  if (typeof trimmedDs.logoUrl === "string" && trimmedDs.logoUrl.startsWith("data:"))
    trimmedDs.logoUrl = null;
  if (trimmedDs.stripLayers && typeof trimmedDs.stripLayers === "object") {
    trimmedDs.stripLayers = Object.fromEntries(
      Object.entries(trimmedDs.stripLayers).map(([k, v]: [string, any]) => [
        k,
        v && typeof v.url === "string" && v.url.startsWith("data:")
          ? { ...v, url: null }
          : v,
      ])
    );
  }
  return { ...snapshot, designSettings: trimmedDs };
}

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface UseQuoteDraftAutosaveOptions {
  /** Stable key per draft (template id, quote id, or "new"). */
  key: string;
  /** The full snapshot to persist on change. */
  snapshot: any;
  /** Enable autosave (defaults true). */
  enabled?: boolean;
  /** Debounce ms before writing to cloud. Default 2000. */
  debounceMs?: number;
}

interface UseQuoteDraftAutosaveResult {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  /** Synchronously read draft from localStorage. */
  loadLocalDraft: () => any | null;
  /** Async read draft from cloud (user_settings). */
  loadCloudDraft: () => Promise<any | null>;
  /** Wipe draft from LS + cloud. Call after a successful explicit save. */
  clearDraft: () => Promise<void>;
  /** Cancel pending debounce and write immediately to LS + cloud. Call on tab switch. */
  flushSave: () => Promise<void>;
}

/**
 * Autosave for the quote editor.
 * - Writes localStorage immediately (instant restore on next open).
 * - Writes user_settings (cloud) debounced (cross-device restore).
 */
export function useQuoteDraftAutosave({
  key,
  snapshot,
  enabled = true,
  debounceMs = 2000,
}: UseQuoteDraftAutosaveOptions): UseQuoteDraftAutosaveResult {
  const { user } = useAuth();
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastJsonRef = useRef<string>("");
  const firstRunRef = useRef(true);
  const snapshotRef = useRef<any>(snapshot);
  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);

  const lsKey = LS_PREFIX + key;
  const settingKey = SETTING_PREFIX + key;

  const loadLocalDraft = useCallback((): any | null => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.data ?? null;
    } catch {
      return null;
    }
  }, [lsKey]);

  const loadCloudDraft = useCallback(async (): Promise<any | null> => {
    if (!user?.id) return null;
    try {
      const { data } = await supabase
        .from("user_settings")
        .select("setting_value")
        .eq("user_id", user.id)
        .eq("setting_key", settingKey)
        .maybeSingle();
      const v: any = (data as any)?.setting_value;
      return v?.data ?? null;
    } catch {
      return null;
    }
  }, [settingKey, user?.id]);

  const clearDraft = useCallback(async () => {
    try {
      localStorage.removeItem(lsKey);
    } catch {
      /* no-op */
    }
    if (!user?.id) return;
    try {
      await supabase
        .from("user_settings")
        .delete()
        .eq("user_id", user.id)
        .eq("setting_key", settingKey);
    } catch {
      /* no-op */
    }
  }, [lsKey, settingKey, user?.id]);

  useEffect(() => {
    if (!enabled) return;
    if (!snapshot) return;

    let json: string;
    try {
      json = JSON.stringify(snapshot);
    } catch {
      return;
    }

    // Skip the very first run after mount — that's just the initial render,
    // nothing the user changed yet.
    if (firstRunRef.current) {
      firstRunRef.current = false;
      lastJsonRef.current = json;
      return;
    }

    if (json === lastJsonRef.current) return;
    lastJsonRef.current = json;

    // 1. Instant LS write — strip heavy base64 blobs before storing locally
    // (logos, strip layers) to avoid QuotaExceededError; cloud write keeps full data.
    const LS_SIZE_LIMIT = 150_000; // 150 KB per draft key
    try {
      const lsPayload = json.length <= LS_SIZE_LIMIT
        ? snapshot
        : trimSnapshotForLocalStorage(snapshot);
      localStorage.setItem(
        lsKey,
        JSON.stringify({ data: lsPayload, savedAt: new Date().toISOString() }),
      );
    } catch {
      /* quota — cloud write below will still save the full snapshot */
    }

    // 2. Debounced cloud write
    setStatus("saving");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      timerRef.current = null;
      if (!user?.id) {
        // No user → LS only.
        setStatus("saved");
        setLastSavedAt(new Date());
        return;
      }
      try {
        await supabase.from("user_settings").upsert(
          {
            user_id: user.id,
            setting_key: settingKey,
            setting_value: {
              data: snapshot,
              savedAt: new Date().toISOString(),
            } as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,setting_key" },
        );
        setStatus("saved");
        setLastSavedAt(new Date());
      } catch {
        setStatus("error");
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [snapshot, enabled, lsKey, settingKey, user?.id, debounceMs]);

  const flushSave = useCallback(async () => {
    if (!enabled) return;

    // Cancel any pending debounce so we don't double-write
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const currentSnapshot = snapshotRef.current;

    // Write LS immediately (trimmed to avoid quota errors)
    try {
      const lsPayload = JSON.stringify(currentSnapshot).length <= 150_000
        ? currentSnapshot
        : trimSnapshotForLocalStorage(currentSnapshot);
      localStorage.setItem(lsKey, JSON.stringify({ data: lsPayload, savedAt: new Date().toISOString() }));
    } catch { /* quota */ }

    // Write cloud immediately
    if (!user?.id) return;
    setStatus("saving");
    try {
      await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          setting_key: settingKey,
          setting_value: {
            data: currentSnapshot,
            savedAt: new Date().toISOString(),
          } as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,setting_key" },
      );
      setStatus("saved");
      setLastSavedAt(new Date());
    } catch {
      setStatus("error");
    }
  }, [enabled, lsKey, settingKey, user?.id]);

  return { status, lastSavedAt, loadLocalDraft, loadCloudDraft, clearDraft, flushSave };
}

export default useQuoteDraftAutosave;
