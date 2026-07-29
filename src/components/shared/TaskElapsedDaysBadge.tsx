import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTaskElapsedDays } from "@/lib/taskElapsedDays";

interface TaskElapsedDaysBadgeProps {
  createdAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;
  completed: boolean;
  compact?: boolean;
  className?: string;
}

export function TaskElapsedDaysBadge({
  createdAt,
  completedAt,
  updatedAt,
  completed,
  compact = false,
  className,
}: TaskElapsedDaysBadgeProps) {
  const days = getTaskElapsedDays({
    createdAt,
    completedAt,
    updatedAt,
    completed,
  });

  if (days === null) return null;

  const label = completed
    ? `המשימה הושלמה בתוך ${days} ימים`
    : `המשימה פתוחה ${days} ימים`;

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1 rounded-full border font-black tabular-nums",
        compact ? "h-6 min-w-6 px-1.5 text-[10px]" : "h-7 min-w-7 px-2 text-xs",
        completed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-600",
        className,
      )}
    >
      <Clock3 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>{days}</span>
    </span>
  );
}
