export interface StageTaskElapsedStage {
  stageId: string;
  sortOrder: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StageTaskElapsedTask {
  id: string;
  stageId: string;
  completed: boolean;
  createdAt?: string | null;
  completedAt?: string | null;
}

function validTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function latestTimestamp(values: Array<string | null | undefined>): number | null {
  const timestamps = values
    .map(validTimestamp)
    .filter((value): value is number => value !== null);

  return timestamps.length > 0 ? Math.max(...timestamps) : null;
}

/**
 * Returns the effective counting start for every task in an active or completed
 * workflow stage. Tasks in future stages are deliberately omitted.
 */
export function buildStageTaskElapsedStartMap(
  stages: StageTaskElapsedStage[],
  tasks: StageTaskElapsedTask[],
): Record<string, string> {
  const orderedStages = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  if (orderedStages.length === 0) return {};

  const tasksByStage = new Map<string, StageTaskElapsedTask[]>();
  tasks.forEach((task) => {
    const stageTasks = tasksByStage.get(task.stageId) || [];
    stageTasks.push(task);
    tasksByStage.set(task.stageId, stageTasks);
  });

  let activeStageIndex = orderedStages.findIndex((stage) =>
    (tasksByStage.get(stage.stageId) || []).some((task) => !task.completed),
  );

  if (activeStageIndex === -1) {
    for (let index = orderedStages.length - 1; index >= 0; index -= 1) {
      if ((tasksByStage.get(orderedStages[index].stageId) || []).length > 0) {
        activeStageIndex = index;
        break;
      }
    }
  }

  if (activeStageIndex === -1) return {};

  const result: Record<string, string> = {};
  let previousActivationTimestamp: number | null = null;

  orderedStages.forEach((stage, stageIndex) => {
    if (stageIndex > activeStageIndex) return;

    const priorStages = orderedStages.slice(0, stageIndex);
    const priorTaskCompletionTimestamp = latestTimestamp(
      priorStages.flatMap((priorStage) =>
        (tasksByStage.get(priorStage.stageId) || []).map(
          (task) => task.completedAt,
        ),
      ),
    );
    const priorStageUpdateTimestamp = latestTimestamp(
      priorStages.map((priorStage) => priorStage.updatedAt),
    );
    const stageCreatedTimestamp = validTimestamp(stage.createdAt);

    const activationTimestamp =
      stageIndex === 0
        ? stageCreatedTimestamp
        : priorTaskCompletionTimestamp ??
          priorStageUpdateTimestamp ??
          stageCreatedTimestamp ??
          previousActivationTimestamp;

    previousActivationTimestamp = activationTimestamp;

    (tasksByStage.get(stage.stageId) || []).forEach((task) => {
      const taskCreatedTimestamp = validTimestamp(task.createdAt);
      const effectiveStart =
        activationTimestamp === null
          ? taskCreatedTimestamp
          : taskCreatedTimestamp === null
            ? activationTimestamp
            : Math.max(activationTimestamp, taskCreatedTimestamp);

      if (effectiveStart !== null) {
        result[task.id] = new Date(effectiveStart).toISOString();
      }
    });
  });

  return result;
}
