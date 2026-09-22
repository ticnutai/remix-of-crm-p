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

/** conflict = חלון/מכשיר אחר שמר טיוטה חדשה יותר מאז שהחלון הזה נטען — לא דורסים אותה. */
export type AutosaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

export interface DraftEntry {
  data: any;
  /** ISO time the draft was written; null for legacy entries without a timestamp. */
  savedAt: string | null;
}

interface UseQuoteDraftAutosaveOptions {
  /** Stable key per draft (template id, quote id, or "new"). */
  key: string;
  /** The full snapshot to persist on change. */
  snapshot: any;
  /** Enable autosave (defaults true). */
  enabled?: boolean;
  /** Debounce ms before writing to cloud. Default 2000. */
  debounceMs?: number;
  /**
   * While a draft is being restored (local + cloud check), snapshot changes come from the
   * restore itself, not from the user. They are recorded as the baseline but NOT written —
   * otherwise a freshly loaded / stale window re-saves its state with a new timestamp and
   * overrides newer work saved from another window or device.
   */
  paused?: boolean;
}

interface UseQuoteDraftAutosaveResult {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  /** Synchronously read draft from localStorage. */
  loadLocalDraft: () => any | null;
  /** Async read draft from cloud (user_settings). */
  loadCloudDraft: () => Promise<any | null>;
  /** Read the local draft together with its save time. */
  loadLocalDraftEntry: () => DraftEntry | null;
  /** Read the cloud draft together with its save time. */
  loadCloudDraftEntry: () => Promise<DraftEntry | null>;
  /** Wipe draft from LS + cloud. Call after a successful explicit save. */
  clearDraft: () => Promise<void>;
  /**
   * Write immediately to LS + cloud. With `onlyIfPending`, writes only when there is an
   * unsaved user change (used on tab switch / close); without it, always writes
   * (explicit "save as draft").
   */
  flushSave: (opts?: { onlyIfPending?: boolean }) => Promise<void>;
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
  paused = false,
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

  // savedAt של העותק בענן שהחלון הזה מכיר (נטען או נכתב על ידו). כתיבה אוטומטית
  // מתבצעת רק אם בענן אין עותק חדש יותר — אחרת חלון ישן היה דורס עבודה חדשה.
  const cloudBaseRef = useRef<string | null>(null);
  const conflictRef = useRef(false);

  const loadLocalDraftEntry = useCallback((): DraftEntry | null => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.data) return null;
      return { data: parsed.data, savedAt: parsed.savedAt ?? null };
    } catch {
      return null;
    }
  }, [lsKey]);

  const loadLocalDraft = useCallback(
    (): any | null => loadLocalDraftEntry()?.data ?? null,
    [loadLocalDraftEntry],
  );

  const loadCloudDraftEntry = useCallback(async (): Promise<DraftEntry | null> => {
    // השחזור רץ מיד בפתיחה — לפעמים לפני ש-useAuth סיים לטעון את המשתמש. בעבר זה
    // דילג בשקט על הענן ושחזר עותק מקומי ישן, שנשמר אחר כך כ"חדש" ודרס את הענן.
    let userId = user?.id;
    if (!userId) {
      const { data: sessionData } = await supabase.auth.getSession();
      userId = sessionData.session?.user?.id;
    }
    if (!userId) return null;
    try {
      const { data } = await supabase
        .from("user_settings")
        .select("setting_value")
        .eq("user_id", userId)
        .eq("setting_key", settingKey)
        .maybeSingle();
      const v: any = (data as any)?.setting_value;
      if (!v?.data) return null;
      cloudBaseRef.current = v.savedAt ?? null;
      return { data: v.data, savedAt: v.savedAt ?? null };
    } catch {
      return null;
    }
  }, [settingKey, user?.id]);

  const loadCloudDraft = useCallback(
    async (): Promise<any | null> => (await loadCloudDraftEntry())?.data ?? null,
    [loadCloudDraftEntry],
  );

  /** כתיבה לענן. force=false בודק קודם שאין בענן עותק חדש יותר מחלון אחר. */
  const writeCloud = useCallback(
    async (data: any, force = false): Promise<"saved" | "conflict" | "skipped"> => {
      let userId = user?.id;
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession();
        userId = sessionData.session?.user?.id;
      }
      if (!userId) return "skipped";
      if (!force) {
        const { data: row } = await supabase
          .from("user_settings")
          .select("setting_value")
          .eq("user_id", userId)
          .eq("setting_key", settingKey)
          .maybeSingle();
        const remoteSavedAt: string | null = (row as any)?.setting_value?.savedAt ?? null;
        const base = cloudBaseRef.current;
        if (remoteSavedAt && (!base || Date.parse(remoteSavedAt) > Date.parse(base))) {
          conflictRef.current = true;
          // העותק המקומי של החלון הזה כבר לא עדכני — שהפתיחה הבאה תיקח את הענן
          try { localStorage.removeItem(lsKey); } catch { /* no-op */ }
          return "conflict";
        }
      }
      const savedAt = new Date().toISOString();
      await supabase.from("user_settings").upsert(
        {
          user_id: userId,
          setting_key: settingKey,
          setting_value: { data, savedAt } as any,
          updated_at: savedAt,
        },
        { onConflict: "user_id,setting_key" },
      );
      cloudBaseRef.current = savedAt;
      conflictRef.current = false;
      return "saved";
    },
    [lsKey, settingKey, user?.id],
  );

  // true while a cloud write is scheduled but not yet sent — flushed on close/unmount
  // so leaving the editor within the debounce window never loses the latest edits.
  const pendingCloudRef = useRef(false);

  const clearDraft = useCallback(async () => {
    cloudBaseRef.current = null;
    conflictRef.current = false;
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
    // שחזור בתהליך — זה לא שינוי של המשתמש; רק מעדכנים את קו הבסיס
    if (paused) return;

    // בקונפליקט עם חלון אחר לא שומרים אוטומטית (גם לא מקומית) עד רענון או שמירה מפורשת
    if (conflictRef.current) {
      setStatus("conflict");
      return;
    }

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
    pendingCloudRef.current = true;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      timerRef.current = null;
      pendingCloudRef.current = false;
      try {
        const result = await writeCloud(snapshot);
        if (result === "conflict") {
          setStatus("conflict");
          return;
        }
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
  }, [snapshot, enabled, paused, lsKey, settingKey, user?.id, debounceMs, writeCloud]);

  const flushSave = useCallback(async (opts?: { onlyIfPending?: boolean }) => {
    if (!enabled) return;
    if (opts?.onlyIfPending && !pendingCloudRef.current) return;

    // Cancel any pending debounce so we don't double-write
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingCloudRef.current = false;

    const currentSnapshot = snapshotRef.current;

    // שמירה אוטומטית (מעבר טאב/סגירה) לא דורסת חלון אחר; "שמור כטיוטה" מפורש כן
    const force = !opts?.onlyIfPending;
    if (conflictRef.current && !force) return;

    // Write LS immediately (trimmed to avoid quota errors)
    try {
      const lsPayload = JSON.stringify(currentSnapshot).length <= 150_000
        ? currentSnapshot
        : trimSnapshotForLocalStorage(currentSnapshot);
      localStorage.setItem(lsKey, JSON.stringify({ data: lsPayload, savedAt: new Date().toISOString() }));
    } catch { /* quota */ }

    // Write cloud immediately
    setStatus("saving");
    try {
      const result = await writeCloud(currentSnapshot, force);
      if (result === "conflict") {
        setStatus("conflict");
        return;
      }
      setStatus("saved");
      setLastSavedAt(new Date());
    } catch {
      setStatus("error");
    }
  }, [enabled, lsKey, writeCloud]);

  // Closing the editor (enabled → false) or unmounting used to cancel the pending
  // debounced cloud write, leaving an older cloud copy behind. Send it now instead.
  const writeCloudNow = useCallback((data: any) => {
    if (conflictRef.current) return;
    void writeCloud(data).catch(() => undefined);
  }, [writeCloud]);
  const writeCloudNowRef = useRef(writeCloudNow);
  useEffect(() => { writeCloudNowRef.current = writeCloudNow; }, [writeCloudNow]);

  useEffect(() => {
    if (enabled) return;
    // Next open starts a fresh session: its first snapshot is the pre-restore state.
    firstRunRef.current = true;
    lastJsonRef.current = "";
    if (pendingCloudRef.current) {
      pendingCloudRef.current = false;
      writeCloudNowRef.current(snapshotRef.current);
    }
  }, [enabled]);

  useEffect(() => () => {
    if (pendingCloudRef.current) {
      pendingCloudRef.current = false;
      writeCloudNowRef.current(snapshotRef.current);
    }
  }, []);

  return {
    status,
    lastSavedAt,
    loadLocalDraft,
    loadCloudDraft,
    loadLocalDraftEntry,
    loadCloudDraftEntry,
    clearDraft,
    flushSave,
  };
}

export default useQuoteDraftAutosave;
