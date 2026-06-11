import { Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useClientPaymentLinks,
  paymentTaskKey,
} from "@/hooks/useClientPaymentLinks";

const currencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

interface TaskPaymentBadgeProps {
  clientId: string | undefined;
  stageName: string | null | undefined;
  taskTitle: string | null | undefined;
  className?: string;
}

/**
 * Read-only badge showing the payment amount linked to a stage task from the
 * client's signed quote ("הצעה חתומה"). Renders nothing when there is no
 * linked payment. Data comes live from the client's signed quotes (shared/
 * deduplicated via react-query, so it is safe to mount one per task row).
 */
export function TaskPaymentBadge({
  clientId,
  stageName,
  taskTitle,
  className,
}: TaskPaymentBadgeProps) {
  const map = useClientPaymentLinks(clientId);
  const info = map.get(paymentTaskKey(stageName, taskTitle));
  if (!info) return null;

  return (
    <span
      title={`מתוך הצעה חתומה: ${info.quoteTitle} (${info.percentage}%)`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
        className,
      )}
    >
      <Banknote className="h-3 w-3 shrink-0" />
      {currencyFormatter.format(info.amount)}
      <span className="font-normal opacity-70">({info.percentage}%)</span>
    </span>
  );
}

export default TaskPaymentBadge;
