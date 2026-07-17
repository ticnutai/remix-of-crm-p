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
  if (!quotes?.length) return result;

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

  for (const quote of quotes) {
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

  return result;
}
