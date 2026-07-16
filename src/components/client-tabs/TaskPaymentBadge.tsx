import { Banknote, BellPlus, FileSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import {
  useClientPaymentLinks,
  paymentTaskKey,
  LATEST_CLIENT_QUOTE_KEY,
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
  paymentAmount?: number | null;
  paymentPercentage?: number | null;
  paymentQuoteId?: string | null;
  taskId?: string;
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
  paymentAmount,
  paymentPercentage,
  paymentQuoteId,
  taskId,
}: TaskPaymentBadgeProps) {
  const navigate = useNavigate();
  const map = useClientPaymentLinks(clientId);
  const legacyInfo = map.get(paymentTaskKey(stageName, taskTitle));
  const quoteInfo = legacyInfo || map.get(LATEST_CLIENT_QUOTE_KEY);
  const info = Number(paymentAmount) > 0
    ? {
        ...quoteInfo,
        amount: Number(paymentAmount),
        percentage: Number(paymentPercentage) || 0,
        quoteTitle: quoteInfo?.quoteTitle || "הצעת המחיר המשויכת",
        quoteId: paymentQuoteId || quoteInfo?.quoteId || "",
        quoteStatus: quoteInfo?.quoteStatus || "draft",
        vatRate: quoteInfo?.vatRate || 18,
      }
    : legacyInfo;
  if (!info) return null;

  const amountBeforeVat = info.amount / (1 + info.vatRate / 100);
  const isSigned = ["signed", "converted"].includes(info.quoteStatus);
  const stopPropagation = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <span
      title={`כולל מע״מ: ${currencyFormatter.format(info.amount)} | לפני מע״מ: ${currencyFormatter.format(amountBeforeVat)} | ${info.quoteTitle}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
        className,
      )}
    >
      <Banknote className="h-3 w-3 shrink-0" />
      {currencyFormatter.format(info.amount)}
      <span className="font-normal opacity-70">({info.percentage}%)</span>
      {taskId && (
        <AddReminderDialog
          entityType="client_stage_task"
          entityId={taskId}
          initialValues={{
            title: `תזכורת לתשלום: ${taskTitle || "תשלום"}`,
            message: `${currencyFormatter.format(info.amount)} כולל מע״מ`,
            client_id: clientId,
          }}
          trigger={
            <button
              type="button"
              title="צור תזכורת לתשלום"
              aria-label="צור תזכורת לתשלום"
              onClick={stopPropagation}
              className="mr-0.5 rounded p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800"
            >
              <BellPlus className="h-3.5 w-3.5" />
            </button>
          }
        />
      )}
      {info.quoteId && (
        <button
          type="button"
          title={isSigned ? "פתח את החוזה החתום" : "פתח את הצעת המחיר"}
          aria-label={isSigned ? "פתח את החוזה החתום" : "פתח את הצעת המחיר"}
          onClick={(event) => {
            stopPropagation(event);
            navigate(`/quotes?openSavedQuote=${encodeURIComponent(info.quoteId)}`);
          }}
          className="rounded p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800"
        >
          <FileSignature className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

export default TaskPaymentBadge;
