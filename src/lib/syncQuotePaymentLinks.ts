import { supabase } from "@/integrations/supabase/client";

export interface LinkedPaymentStep {
  id?: string | null;
  percentage?: number | string | null;
  templateStageName?: string | null;
  templateTaskName?: string | null;
}

const normalized = (value: unknown) => String(value ?? "").trim().toLowerCase();

/** Persist the current quote payment assignment on the actual client tasks. */
export async function syncQuotePaymentLinksToClientTasks({
  clientId,
  quoteId,
  basePrice,
  schedule,
}: {
  clientId: string;
  quoteId: string;
  basePrice: number;
  schedule: LinkedPaymentStep[];
}): Promise<number> {
  const linkedSteps = schedule.filter(
    (step) =>
      normalized(step.templateStageName) &&
      normalized(step.templateTaskName) &&
      Number(step.percentage) > 0,
  );
  if (!linkedSteps.length || basePrice <= 0) return 0;

  const { data: stages, error: stagesError } = await (supabase as any)
    .from("client_stages")
    .select("stage_id, stage_name")
    .eq("client_id", clientId);
  if (stagesError) throw stagesError;

  const { data: tasks, error: tasksError } = await (supabase as any)
    .from("client_stage_tasks")
    .select("id, stage_id, title")
    .eq("client_id", clientId);
  if (tasksError) throw tasksError;

  const stageIdsByName = new Map<string, string[]>();
  for (const stage of stages || []) {
    const key = normalized(stage.stage_name);
    stageIdsByName.set(key, [...(stageIdsByName.get(key) || []), stage.stage_id]);
  }

  let updated = 0;
  for (const step of linkedSteps) {
    const stageIds = stageIdsByName.get(normalized(step.templateStageName)) || [];
    const task = (tasks || []).find(
      (candidate: any) =>
        stageIds.includes(candidate.stage_id) &&
        normalized(candidate.title) === normalized(step.templateTaskName),
    );
    if (!task) continue;

    const percentage = Number(step.percentage);
    const { error } = await (supabase as any)
      .from("client_stage_tasks")
      .update({
        payment_amount: Math.round(basePrice * percentage) / 100,
        payment_percentage: percentage,
        payment_quote_id: quoteId,
        payment_step_id: step.id || null,
      })
      .eq("id", task.id);
    if (error) throw error;
    updated += 1;
  }
  return updated;
}
