import { supabase } from "@/integrations/supabase/client";

type SyncClientStageTemplateParams = {
  clientId: string;
  templateId: string;
  previousTemplateId?: string | null;
  clearAllOnTemplateChange?: boolean;
};

type SyncClientStageTemplateResult = {
  addedStages: number;
  addedTasks: number;
  clearedAll: boolean;
};

function normalizeText(value: string | null | undefined): string {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export async function syncClientStagesFromTemplate({
  clientId,
  templateId,
  previousTemplateId,
  clearAllOnTemplateChange = true,
}: SyncClientStageTemplateParams): Promise<SyncClientStageTemplateResult> {
  if (!clientId || !templateId) {
    return { addedStages: 0, addedTasks: 0, clearedAll: false };
  }

  const { data: templateStagesRaw, error: templateStagesError } = await supabase
    .from("stage_template_stages")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order");

  if (templateStagesError) {
    throw templateStagesError;
  }

  const templateStages = (templateStagesRaw || []) as any[];
  if (templateStages.length === 0) {
    return { addedStages: 0, addedTasks: 0, clearedAll: false };
  }

  const templateStageIds = templateStages.map((stage) => stage.id);
  const { data: templateTasksRaw, error: templateTasksError } = await supabase
    .from("stage_template_tasks")
    .select("*")
    .in("template_stage_id", templateStageIds)
    .order("sort_order");

  if (templateTasksError) {
    throw templateTasksError;
  }

  const templateTasks = (templateTasksRaw || []) as any[];
  const { data: templateMeta } = await (supabase as any)
    .from("stage_templates")
    .select("structure_version")
    .eq("id", templateId)
    .maybeSingle();

  const shouldClearAll =
    Boolean(clearAllOnTemplateChange) &&
    Boolean(previousTemplateId) &&
    previousTemplateId !== templateId;

  let clearedAll = false;

  if (shouldClearAll) {
    const { error: clearTasksError } = await supabase
      .from("client_stage_tasks")
      .delete()
      .eq("client_id", clientId);

    if (clearTasksError) {
      throw clearTasksError;
    }

    const { error: clearStagesError } = await supabase
      .from("client_stages")
      .delete()
      .eq("client_id", clientId);

    if (clearStagesError) {
      throw clearStagesError;
    }

    clearedAll = true;

    await (supabase as any)
      .from("client_stage_template_assignments")
      .delete()
      .eq("client_id", clientId)
      .eq("template_id", previousTemplateId);
  }

  const { data: existingStagesRaw, error: existingStagesError } = await supabase
    .from("client_stages")
    .select("*")
    .eq("client_id", clientId)
    .order("sort_order");

  if (existingStagesError) {
    throw existingStagesError;
  }

  const { data: existingTasksRaw, error: existingTasksError } = await supabase
    .from("client_stage_tasks")
    .select("*")
    .eq("client_id", clientId)
    .order("sort_order");

  if (existingTasksError) {
    throw existingTasksError;
  }

  const existingStages = (existingStagesRaw || []) as any[];
  const existingTasks = (existingTasksRaw || []) as any[];

  const stagesByName = new Map<string, any>();
  const existingStageIds = new Set<string>();

  existingStages.forEach((stage) => {
    const key = normalizeText(stage.stage_name);
    if (key && !stagesByName.has(key)) {
      stagesByName.set(key, stage);
    }
    existingStageIds.add(stage.stage_id);
  });

  let nextStageSortOrder = existingStages.reduce(
    (max, stage) => Math.max(max, stage.sort_order || 0),
    -1,
  );

  let addedStages = 0;
  let addedTasks = 0;
  const templateStageToClientStage = new Map<string, string>();

  for (const templateStage of templateStages) {
    const stageNameKey = normalizeText(templateStage.stage_name);
    let matchedStage = stageNameKey ? stagesByName.get(stageNameKey) : undefined;

    if (!matchedStage) {
      const baseStageId = `template_${templateId}_${templateStage.id}`;
      let uniqueStageId = baseStageId;
      let suffix = 1;

      while (existingStageIds.has(uniqueStageId)) {
        uniqueStageId = `${baseStageId}_${suffix}`;
        suffix += 1;
      }

      const { data: insertedStage, error: insertStageError } = await supabase
        .from("client_stages")
        .insert({
          client_id: clientId,
          stage_id: uniqueStageId,
          stage_name: templateStage.stage_name,
          stage_icon: templateStage.stage_icon,
          sort_order: nextStageSortOrder + 1,
          target_working_days: templateStage.target_working_days || null,
          source_template_id: templateId,
          source_template_stage_id: templateStage.id,
        })
        .select()
        .single();

      if (insertStageError) {
        throw insertStageError;
      }

      matchedStage = insertedStage;
      nextStageSortOrder += 1;
      addedStages += 1;
      existingStageIds.add(uniqueStageId);

      if (stageNameKey) {
        stagesByName.set(stageNameKey, matchedStage);
      }
    } else if (!matchedStage.source_template_stage_id) {
      await (supabase as any)
        .from("client_stages")
        .update({
          source_template_id: templateId,
          source_template_stage_id: templateStage.id,
        })
        .eq("id", matchedStage.id);
    }

    templateStageToClientStage.set(templateStage.id, matchedStage.stage_id);
  }

  const existingTasksByKey = new Map<string, any>();
  existingTasks.forEach((task) => {
    const key = `${task.stage_id}::${normalizeText(task.title)}`;
    if (!existingTasksByKey.has(key)) existingTasksByKey.set(key, task);
  });
  const existingTaskKeys = new Set(existingTasksByKey.keys());

  const stageTaskSortOrder = new Map<string, number>();
  existingTasks.forEach((task) => {
    const currentMax = stageTaskSortOrder.get(task.stage_id) ?? -1;
    stageTaskSortOrder.set(task.stage_id, Math.max(currentMax, task.sort_order || 0));
  });

  const tasksToInsert: any[] = [];
  for (const templateTask of templateTasks) {
    const clientStageId = templateStageToClientStage.get(
      templateTask.template_stage_id,
    );

    if (!clientStageId) continue;

    const titleKey = normalizeText(templateTask.title);
    if (!titleKey) continue;

    const taskKey = `${clientStageId}::${titleKey}`;
    if (existingTaskKeys.has(taskKey)) {
      const matchedTask = existingTasksByKey.get(taskKey);
      if (matchedTask && !matchedTask.source_template_task_id) {
        await (supabase as any)
          .from("client_stage_tasks")
          .update({
            source_template_id: templateId,
            source_template_task_id: templateTask.id,
          })
          .eq("id", matchedTask.id);
      }
      continue;
    }

    const nextTaskSortOrder = (stageTaskSortOrder.get(clientStageId) ?? -1) + 1;
    stageTaskSortOrder.set(clientStageId, nextTaskSortOrder);

    const taskType =
      templateTask.task_type === "timer_tab"
        ? "timer_tab"
        : templateTask.task_type === "check"
          ? "check"
          : "task";
    const isTimerTab =
      templateTask.task_type === "timer_tab" &&
      Boolean(templateTask.auto_timer_days);

    tasksToInsert.push({
      client_id: clientId,
      stage_id: clientStageId,
      title: templateTask.title,
      sort_order: nextTaskSortOrder,
      task_type: taskType,
      auto_timer_days: isTimerTab ? templateTask.auto_timer_days || null : null,
      check_states: taskType === "check" ? templateTask.check_states || undefined : undefined,
      check_state_index: taskType === "check" ? 0 : undefined,
      check_marked: taskType === "check" ? false : undefined,
      source_template_id: templateId,
      source_template_task_id: templateTask.id,
    });

    existingTaskKeys.add(taskKey);
  }

  if (tasksToInsert.length > 0) {
    const { error: insertTasksError } = await supabase
      .from("client_stage_tasks")
      .insert(tasksToInsert);

    if (insertTasksError) {
      throw insertTasksError;
    }

    addedTasks = tasksToInsert.length;
  }

  await (supabase as any).from("client_stage_template_assignments").upsert(
    {
      client_id: clientId,
      template_id: templateId,
      synced_version: templateMeta?.structure_version || 1,
      applied_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "client_id,template_id" },
  );

  return {
    addedStages,
    addedTasks,
    clearedAll,
  };
}
