import { supabase } from "@/integrations/supabase/client";
import { syncQuotePaymentLinksToClientTasks } from "@/lib/syncQuotePaymentLinks";

// For an existing client file, walk over all non-terminal saved_quotes and
// make sure every payment step that was linked to a stage-template
// task (templateStageName + templateTaskName) has a matching task on the
// client's board. Missing tasks are created, then the live payment amounts
// are written to those tasks so the TaskPaymentBadge shows up immediately.

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
const TERMINAL = ["rejected", "expired", "cancelled"];

export interface SyncPaymentTasksResult {
  tasksCreated: number;
  tasksLinked: number;
  quotesProcessed: number;
}

export async function syncPaymentTasksForClient(
  clientId: string,
): Promise<SyncPaymentTasksResult> {
  const result: SyncPaymentTasksResult = {
    tasksCreated: 0,
    tasksLinked: 0,
    quotesProcessed: 0,
  };
  if (!clientId) return result;

  const { data: quotes, error: qErr } = await (supabase as any)
    .from("saved_quotes")
    .select("id, title, base_price, total_with_vat, vat_rate, payment_schedule, status, updated_at")
    .eq("client_id", clientId)
    .not("status", "in", `(${TERMINAL.join(",")})`)
    .order("updated_at", { ascending: false });
  if (qErr) throw qErr;

  const { data: stages, error: sErr } = await (supabase as any)
    .from("client_stages")
    .select("stage_id, stage_name, sort_order")
    .eq("client_id", clientId);
  if (sErr) throw sErr;

  const { data: tasks, error: tErr } = await (supabase as any)
    .from("client_stage_tasks")
    .select("id, stage_id, title, sort_order")
    .eq("client_id", clientId);
  if (tErr) throw tErr;

  const stagesByName = new Map<string, any[]>();
  for (const s of stages || []) {
    const k = norm(s.stage_name);
    stagesByName.set(k, [...(stagesByName.get(k) || []), s]);
  }
  const taskKey = (stageId: string, title: string) => `${stageId}::${norm(title)}`;
  const existingTasks = new Set<string>(
    (tasks || []).map((t: any) => taskKey(t.stage_id, t.title)),
  );
  const maxSortByStage = new Map<string, number>();
  for (const t of tasks || []) {
    maxSortByStage.set(
      t.stage_id,
      Math.max(maxSortByStage.get(t.stage_id) ?? -1, t.sort_order || 0),
    );
  }

  for (const quote of quotes || []) {
    const schedule = Array.isArray(quote?.payment_schedule)
      ? quote.payment_schedule
      : [];
    if (!schedule.length) continue;
    result.quotesProcessed += 1;

    for (const step of schedule) {
      const stageName = step?.templateStageName || step?.quoteTemplateStageName;
      const taskName = step?.templateTaskName || step?.quoteTemplateItemText;
      if (!stageName || !taskName) continue;

      const matchingStages = stagesByName.get(norm(stageName)) || [];
      if (!matchingStages.length) continue;

      for (const stage of matchingStages) {
        const key = taskKey(stage.stage_id, taskName);
        if (existingTasks.has(key)) continue;
        const nextSort = (maxSortByStage.get(stage.stage_id) ?? -1) + 1;
        const { error: insErr } = await (supabase as any)
          .from("client_stage_tasks")
          .insert({
            client_id: clientId,
            stage_id: stage.stage_id,
            title: taskName,
            sort_order: nextSort,
            task_type: "task",
          });
        if (insErr) {
          console.error("[syncPaymentTasksForClient] task insert failed", insErr);
          continue;
        }
        existingTasks.add(key);
        maxSortByStage.set(stage.stage_id, nextSort);
        result.tasksCreated += 1;
      }
    }

    try {
      const linked = await syncQuotePaymentLinksToClientTasks({
        clientId,
        quoteId: quote.id,
        basePrice: Number(quote.total_with_vat) || Number(quote.base_price) || 0,
        schedule,
      });
      result.tasksLinked += linked;
    } catch (e) {
      console.error("[syncPaymentTasksForClient] link failed", e);
    }
  }

  // Client files created by older/fallback quote flows may have payment rows
  // without a saved_quote. Link those rows by title only when the title is
  // unique on this client's board, so we never attach money ambiguously.
  const { data: paymentRows, error: paymentRowsError } = await (supabase as any)
    .from("client_payment_stages")
    .select("id, stage_name, amount, vat_rate, stage_number, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .order("stage_number", { ascending: false });
  if (paymentRowsError) throw paymentRowsError;

  const tasksByTitle = new Map<string, any[]>();
  for (const task of tasks || []) {
    const key = norm(task.title);
    tasksByTitle.set(key, [...(tasksByTitle.get(key) || []), task]);
  }
  const totalNet = (paymentRows || []).reduce(
    (sum: number, payment: any) => sum + (Number(payment.amount) || 0),
    0,
  );
  const handledTitles = new Set<string>();

  for (const payment of paymentRows || []) {
    const title = norm(payment.stage_name);
    if (!title || handledTitles.has(title)) continue;
    handledTitles.add(title);
    const titleMatches = tasksByTitle.get(title) || [];
    if (titleMatches.length !== 1) continue;

    const task = titleMatches[0];
    const netAmount = Number(payment.amount) || 0;
    const vatRate = Number(payment.vat_rate) || 0;
    const grossAmount = Math.round(netAmount * (1 + vatRate / 100) * 100) / 100;
    const percentage = totalNet > 0
      ? Math.round((netAmount * 100 / totalNet) * 1000) / 1000
      : null;
    const { data: updatedTask, error: updateError } = await (supabase as any)
      .from("client_stage_tasks")
      .update({
        payment_amount: grossAmount,
        payment_percentage: percentage,
        payment_step_id: `client_payment_stage:${payment.id}`,
      })
      .eq("id", task.id)
      .is("payment_amount", null)
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;
    if (updatedTask) result.tasksLinked += 1;
  }

  return result;
}
