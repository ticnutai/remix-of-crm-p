import { supabase } from "@/integrations/supabase/client";

export const CLIENT_CONSULTANTS_UPDATED_EVENT =
  "tenarch:client-consultants-updated";

const normalize = (value: string | null | undefined) =>
  String(value || "").trim().toLocaleLowerCase("he");

export function consultantProfessionMatchesTaskTitle(
  profession: string | null | undefined,
  taskTitle: string | null | undefined,
): boolean {
  const normalizedProfession = normalize(profession);
  const normalizedTitle = normalize(taskTitle);
  if (!normalizedProfession || !normalizedTitle) return false;

  if (
    normalizedTitle.includes(normalizedProfession) ||
    normalizedProfession.includes(normalizedTitle)
  ) {
    return true;
  }

  // A generic consultant assignment should match specific consultant tasks
  // such as "יועץ ניקוז", while other professions remain exact.
  return (
    normalizedProfession === "יועץ" && normalizedTitle.includes("יועץ")
  );
}

export function notifyClientConsultantsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CLIENT_CONSULTANTS_UPDATED_EVENT));
  }
}

export async function ensureStageTaskConsultantIsLinkedToClient(
  taskId: string,
  consultantId: string,
  profession?: string | null,
) {
  const { data: task, error: taskError } = await supabase
    .from("client_stage_tasks")
    .select("client_id")
    .eq("id", taskId)
    .maybeSingle();
  if (taskError) throw taskError;
  if (!task?.client_id) return;

  const { error } = await supabase.from("client_consultants").upsert(
    {
      client_id: task.client_id,
      consultant_id: consultantId,
      role: profession || null,
      status: "active",
    },
    { onConflict: "client_id,consultant_id" },
  );
  if (error) throw error;
  notifyClientConsultantsUpdated();
}

export async function syncClientConsultantToMatchingStageTasks(
  clientId: string,
  consultantId: string,
  profession: string | null | undefined,
) {
  const { data: tasks, error: tasksError } = await supabase
    .from("client_stage_tasks")
    .select("id, title")
    .eq("client_id", clientId);
  if (tasksError) throw tasksError;

  const matchingTasks = (tasks || []).filter((task) =>
    consultantProfessionMatchesTaskTitle(profession, task.title),
  );
  if (matchingTasks.length === 0) {
    notifyClientConsultantsUpdated();
    return;
  }

  const taskIds = matchingTasks.map((task) => task.id);
  const { data: existing, error: existingError } = await supabase
    .from("task_consultants")
    .select("task_id")
    .eq("consultant_id", consultantId)
    .in("task_id", taskIds);
  if (existingError) throw existingError;

  const existingTaskIds = new Set((existing || []).map((row) => row.task_id));
  const rows = matchingTasks
    .filter((task) => !existingTaskIds.has(task.id))
    .map((task) => ({
      task_id: task.id,
      consultant_id: consultantId,
      keyword: String(profession || "יועץ").trim() || "יועץ",
      keyword_context: task.title,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from("task_consultants").insert(rows);
    if (error) throw error;
  }
  notifyClientConsultantsUpdated();
}

export async function removeClientConsultantFromStageTasks(
  clientId: string,
  consultantId: string,
) {
  const { data: tasks, error: tasksError } = await supabase
    .from("client_stage_tasks")
    .select("id")
    .eq("client_id", clientId);
  if (tasksError) throw tasksError;

  const taskIds = (tasks || []).map((task) => task.id);
  if (taskIds.length > 0) {
    const { error } = await supabase
      .from("task_consultants")
      .delete()
      .eq("consultant_id", consultantId)
      .in("task_id", taskIds);
    if (error) throw error;
  }
  notifyClientConsultantsUpdated();
}
