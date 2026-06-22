import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Single source of truth for the default VAT rate across the app.
 * Use `?? DEFAULT_VAT_RATE` (NOT `|| DEFAULT_VAT_RATE`) so that 0 (no VAT) is preserved.
 */
export const DEFAULT_VAT_RATE = 18;

const LS_KEY = "global-default-vat-rate";

function readLocal(): number {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw == null) return DEFAULT_VAT_RATE;
    const n = parseFloat(raw);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_VAT_RATE;
  } catch {
    return DEFAULT_VAT_RATE;
  }
}

function writeLocal(v: number) {
  try {
    localStorage.setItem(LS_KEY, String(v));
  } catch {
    /* noop */
  }
}

/**
 * Returns the user's chosen default VAT rate.
 * Reads from cache instantly, syncs from `app_settings.vat_rate` in the background.
 * Returns 0 if user explicitly chose "ללא מע״מ".
 */
export function useDefaultVatRate(): number {
  const { user } = useAuth();
  const [vat, setVat] = useState<number>(() => readLocal());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("vat_rate")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const v = data?.vat_rate;
      if (v != null && Number.isFinite(Number(v))) {
        const n = Number(v);
        setVat(n);
        writeLocal(n);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return vat;
}

/**
 * Synchronous reader for non-hook contexts (utilities, callbacks).
 * Reads from localStorage cache only.
 */
export function getDefaultVatRate(): number {
  return readLocal();
}

/**
 * Resolve a VAT rate with proper fallbacks. 0 is a legal value (no VAT).
 */
export function resolveVatRate(value: unknown, fallback: number = getDefaultVatRate()): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
