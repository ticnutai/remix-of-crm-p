import { supabase } from "@/integrations/supabase/client";
import { syncClientStagesFromTemplate } from "@/lib/clientStageTemplateSync";

// When a saved quote is marked as signed we auto-materialize everything
// the user mapped inside the quote editor onto the client's profile:
//   1. Stage-template stages + tasks   → client_stages / client_stage_tasks
//   2. Payment schedule steps          → client_payment_stages
//   3. A draft contract                → contracts (linked to quote + client)
//
// Each step is idempotent: re-signing or re-running won't create duplicates.

interface PaymentStep {
  id?: string;
  percentage?: number;
  description?: string;
  templateStageId?: string | null;
  templateTaskId?: string | null;
  templateStageName?: string | null;
  templateTaskName?: string | null;
  linkSource?: string;
  useCustomVat?: boolean;
  customVat?: number;
}

export interface ApplyResult {
  stagesAdded: number;
  tasksAdded: number;
  paymentsAdded: number;
  contractCreated: boolean;
  contractId?: string;
}

export async function applySignedQuoteToClient(
  savedQuote: any,
  userId: string,
): Promise<ApplyResult> {
  const clientId: string | undefined = savedQuote?.client_id;
  const result: ApplyResult = {
    stagesAdded: 0,
    tasksAdded: 0,
    paymentsAdded: 0,
    contractCreated: false,
  };

  if (!clientId) return result;

  const schedule: PaymentStep[] = Array.isArray(savedQuote?.payment_schedule)
    ? savedQuote.payment_schedule
    : [];

  const totalWithVat = Number(savedQuote?.total_with_vat) || 0;
  const basePrice = Number(savedQuote?.base_price) || 0;
  const defaultVat = Number(savedQuote?.vat_rate) || 17;

  // ── 1. Stages & tasks ─────────────────────────────────────────────────
  const templateStageIds = Array.from(
    new Set(
      schedule
        .map((s) => s?.templateStageId)
        .filter((v): v is string => Boolean(v)),
    ),
  );

  if (templateStageIds.length > 0) {
    const { data: stageRows } = await (supabase as any)
      .from("stage_template_stages")
      .select("template_id")
      .in("id", templateStageIds);

    const templateIds = Array.from(
      new Set(
        (stageRows || [])
          .map((r: any) => r?.template_id)
          .filter((v: any): v is string => Boolean(v)),
      ),
    );

    for (const templateId of templateIds) {
      try {
        const r = await syncClientStagesFromTemplate({
          clientId,
          templateId: templateId as string,
          clearAllOnTemplateChange: false,
        });
        result.stagesAdded += r.addedStages;
        result.tasksAdded += r.addedTasks;
      } catch (e) {
        console.error("[applySignedQuoteToClient] stage sync failed", e);
      }
    }
  }

  // ── 2. Payment stages ────────────────────────────────────────────────
  // Skip if we already imported this quote's payments (match by description prefix).
  const quoteTag = `הצעה ${savedQuote?.title || savedQuote?.id?.slice(0, 8) || ""}`.trim();

  const { data: existingPayments } = await (supabase as any)
    .from("client_payment_stages")
    .select("id, description")
    .eq("client_id", clientId);

  const alreadyImported = (existingPayments || []).some((p: any) =>
    (p?.description || "").includes(`[${quoteTag}]`),
  );

  if (!alreadyImported && schedule.length > 0) {
    const { data: maxRow } = await (supabase as any)
      .from("client_payment_stages")
      .select("stage_number")
      .eq("client_id", clientId)
      .order("stage_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNumber = (maxRow?.stage_number || 0) + 1;
    const rows: any[] = [];

    schedule.forEach((step) => {
      const pct = Number(step?.percentage) || 0;
      if (pct <= 0) return;
      const amount = basePrice > 0
        ? Math.round((basePrice * pct) / 100 * 100) / 100
        : Math.round((totalWithVat * pct) / 100 * 100) / 100;

      const vatRate = step?.useCustomVat ? Number(step?.customVat) || defaultVat : defaultVat;
      const baseDesc = step?.templateTaskName || step?.description || `תשלום ${pct}%`;

      rows.push({
        client_id: clientId,
        stage_name: baseDesc,
        stage_number: nextNumber++,
        description: `${baseDesc} [${quoteTag}]`,
        amount,
        vat_rate: vatRate,
        created_by: userId,
      });
    });

    if (rows.length > 0) {
      const { error: payErr } = await (supabase as any)
        .from("client_payment_stages")
        .insert(rows);
      if (payErr) {
        console.error("[applySignedQuoteToClient] payments insert failed", payErr);
      } else {
        result.paymentsAdded = rows.length;
      }
    }
  }

  // ── 3. Contract (skip if a contract for this quote already exists) ───
  const { data: existingContract } = await (supabase as any)
    .from("contracts")
    .select("id")
    .eq("quote_id", savedQuote.id)
    .maybeSingle();

  if (!existingContract) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: contractRow, error: contractErr } = await (supabase as any)
      .from("contracts")
      .insert({
        quote_id: savedQuote.id,
        client_id: clientId,
        title: savedQuote?.title || "חוזה",
        description: savedQuote?.description || null,
        contract_type: "fixed_price",
        contract_value: totalWithVat || basePrice || 0,
        currency: "ILS",
        start_date: today,
        signed_date: today,
        status: "active",
        created_by: userId,
      })
      .select("id")
      .single();

    if (contractErr) {
      console.error("[applySignedQuoteToClient] contract insert failed", contractErr);
    } else {
      result.contractCreated = true;
      result.contractId = contractRow?.id;
    }
  }

  return result;
}
