const DAY_MS = 24 * 60 * 60 * 1000;

interface TaskElapsedDaysInput {
  createdAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;
  completed: boolean;
  now?: Date;
}

export function getTaskElapsedDays({
  createdAt,
  completedAt,
  updatedAt,
  completed,
  now = new Date(),
}: TaskElapsedDaysInput): number | null {
  if (!createdAt) return null;

  const startedAt = new Date(createdAt);
  const finishedAt = completed
    ? new Date(completedAt || updatedAt || createdAt)
    : now;

  if (
    Number.isNaN(startedAt.getTime()) ||
    Number.isNaN(finishedAt.getTime())
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.floor((finishedAt.getTime() - startedAt.getTime()) / DAY_MS),
  );
}
