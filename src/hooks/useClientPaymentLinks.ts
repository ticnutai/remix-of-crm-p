import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Live payment-amount linking between a client's signed quote ("הצעה חתומה")
// and the matching task in the client's work-stages board.
//
// In the quote editor's "סדר תשלומים" each payment step can be linked
// ("שיוך") to a client stage-template task by NAME (templateStageName →
// templateTaskName). When the quote is signed, this hook reads that schedule
// and exposes the computed amount per linked task so the board can show it
// live (read-only) — e.g. the "מקדמה" amount on "תשלום א' מקדמה".

export interface TaskPaymentInfo {
  /** Computed amount = percentage% of the quote total (incl. VAT). */
  amount: number;
  percentage: number;
  /** Title of the signed quote this amount came from. */
  quoteTitle: string;
}

interface RawPaymentStep {
  percentage?: number;
  linkSource?: string;
  templateStageName?: string | null;
  templateTaskName?: string | null;
}

// Statuses that count as "signed" — only these contribute live amounts.
const SIGNED_STATUSES = ["signed", "converted"];

/** Build a stable lookup key from a stage name + task title. */
export function paymentTaskKey(
  stageName: string | null | undefined,
  taskTitle: string | null | undefined,
): string {
  return `${(stageName || "").trim().toLowerCase()}|||${(taskTitle || "")
    .trim()
    .toLowerCase()}`;
}

const EMPTY_MAP: Map<string, TaskPaymentInfo> = new Map();

function buildPaymentMap(rows: any[]): Map<string, TaskPaymentInfo> {
  const map = new Map<string, TaskPaymentInfo>();
  // rows are ordered newest-first; first write per key wins (latest quote).
  for (const row of rows) {
    const total = Number(row?.total_with_vat) || 0;
    const schedule: RawPaymentStep[] = Array.isArray(row?.payment_schedule)
      ? row.payment_schedule
      : [];

    for (const step of schedule) {
      const stageName = step?.templateStageName;
      const taskName = step?.templateTaskName;
      // Only stage-template links target board tasks (quote-template links
      // point at items inside the quote itself, not the work board).
      if (!stageName || !taskName) continue;

      const pct = Number(step?.percentage) || 0;
      if (pct <= 0 || total <= 0) continue;

      const key = paymentTaskKey(stageName, taskName);
      if (map.has(key)) continue; // keep the latest quote's value

      map.set(key, {
        amount: Math.round((total * pct) / 100),
        percentage: pct,
        quoteTitle: row?.title || "הצעת מחיר",
      });
    }
  }
  return map;
}

/**
 * Loads the client's signed quotes and returns a map of
 * `paymentTaskKey(stageName, taskTitle)` → {@link TaskPaymentInfo}.
 * Shared via react-query so multiple consumers dedupe to one request.
 */
export function useClientPaymentLinks(
  clientId: string | undefined,
): Map<string, TaskPaymentInfo> {
  const { data } = useQuery({
    queryKey: ["client-payment-links", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data: rows, error } = await (supabase as any)
        .from("saved_quotes")
        .select("id, title, status, total_with_vat, payment_schedule, updated_at")
        .eq("client_id", clientId)
        .in("status", SIGNED_STATUSES)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return buildPaymentMap(rows || []);
    },
  });

  return data ?? EMPTY_MAP;
}
