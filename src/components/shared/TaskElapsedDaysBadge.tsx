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
        "inline-flex shrink-0 items-center justify-center rounded-full font-black leading-none text-white tabular-nums shadow-sm",
        compact ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-xs",
        days >= 100 && (compact ? "text-[8px]" : "text-[9px]"),
        completed
          ? "bg-emerald-600 shadow-emerald-200/70"
          : "bg-red-600 shadow-red-200/70",
        className,
      )}
    >
      {days}
    </span>
  );
}
