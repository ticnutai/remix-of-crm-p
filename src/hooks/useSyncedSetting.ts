import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const LS_PREFIX = "synced::";
const SYNCED_SETTING_EVENT = "synced-setting-change";
const cloudSaveTimers = new Map<string, number>();

interface UseSyncedSettingOptions<T> {
  /** Stable key. Will be used as both `localStorage` key and `user_settings.setting_key`. */
  key: string;
  defaultValue: T;
  /** Sync to Supabase user_settings table. Default true. */
  cloud?: boolean;
  /** Debounce ms for cloud writes. Default 600. */
  debounceMs?: number;
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, val: T) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
    window.dispatchEvent(
      new CustomEvent(SYNCED_SETTING_EVENT, {
        detail: { key, value: val },
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

/**
 * useSyncedSetting — drop-in `useState` replacement that persists to:
 *   1. localStorage (instant, available before login)
 *   2. Supabase `user_settings` (debounced; cross-device sync)
 *
 * On mount: reads LS immediately, then async-fetches cloud value and
 * overrides if cloud is newer / different.
 *
 * @example
 * const [view, setView] = useSyncedSetting({ key: "clients-view", defaultValue: "table" });
 */
export function useSyncedSetting<T>({
  key,
  defaultValue,
  cloud = true,
  debounceMs = 600,
}: UseSyncedSettingOptions<T>) {
  const { user } = useAuth();
  const [value, setValueState] = useState<T>(() => readLocal(key, defaultValue));
  const valueRef = useRef(value);
  valueRef.current = value;
  const skipNextWriteRef = useRef(false);

  // Keep multiple hook instances with the same key in sync in the current
  // browser tab. The native `storage` event only fires in other tabs, so
  // without this event a filter control could update while its data view kept
  // using the previous value.
  useEffect(() => {
    const handleSettingChange = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; value: T }>).detail;
      if (!detail || detail.key !== key) return;
      setValueState(detail.value);
    };

    window.addEventListener(SYNCED_SETTING_EVENT, handleSettingChange);
    return () => {
      window.removeEventListener(SYNCED_SETTING_EVENT, handleSettingChange);
    };
  }, [key]);

  // Cloud → state once after login (or when key changes)
  useEffect(() => {
    if (!cloud || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("user_settings")
          .select("setting_value")
          .eq("user_id", user.id)
          .eq("setting_key", LS_PREFIX + key)
          .maybeSingle();
        if (cancelled) return;
        const cloudVal = (data as any)?.setting_value;
        if (cloudVal !== undefined && cloudVal !== null) {
          // Only update if different from current
          if (JSON.stringify(cloudVal) !== JSON.stringify(valueRef.current)) {
            skipNextWriteRef.current = true; // don't echo back to cloud
            setValueState(cloudVal as T);
            writeLocal(key, cloudVal);
          }
        }
      } catch {
        /* ignore cloud read errors — LS still works */
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, key, cloud]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeLocal(key, resolved);

        if (skipNextWriteRef.current) {
          skipNextWriteRef.current = false;
          return resolved;
        }

        if (cloud && user?.id) {
          const existing = cloudSaveTimers.get(key);
          if (existing) window.clearTimeout(existing);
          const t = window.setTimeout(async () => {
            cloudSaveTimers.delete(key);
            try {
              await supabase.from("user_settings").upsert(
                {
                  user_id: user.id,
                  setting_key: LS_PREFIX + key,
                  setting_value: resolved as any,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,setting_key" },
              );
            } catch {
              /* ignore — LS already saved */
            }
          }, debounceMs);
          cloudSaveTimers.set(key, t);
        }
        return resolved;
      });
    },
    [key, cloud, user?.id, debounceMs],
  );

  return [value, setValue] as const;
}

export default useSyncedSetting;
