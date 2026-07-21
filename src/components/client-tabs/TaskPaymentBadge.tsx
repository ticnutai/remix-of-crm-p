import { useCallback, useEffect, useState } from "react";
import { Banknote, BellPlus, CheckCircle2, FileSignature, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { notifyClientPaymentStageUpdated } from "@/lib/clientPaymentStageEvents";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import {
  useClientPaymentLinks,
  paymentTaskKey,
  LATEST_CLIENT_QUOTE_KEY,
} from "@/hooks/useClientPaymentLinks";

const currencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

interface TaskPaymentBadgeProps {
  clientId: string | undefined;
  stageName: string | null | undefined;
  taskTitle: string | null | undefined;
  className?: string;
  paymentAmount?: number | null;
  paymentPercentage?: number | null;
  paymentQuoteId?: string | null;
  paymentStepId?: string | null;
  taskId?: string;
  stageCompleted?: boolean;
}

interface LinkedPaymentStage {
  id: string;
  is_paid: boolean | null;
  amount: number;
  amount_with_vat: number | null;
  vat_rate: number | null;
  payment_method: string | null;
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
  paymentStepId,
  taskId,
  stageCompleted = false,
}: TaskPaymentBadgeProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentStage, setPaymentStage] = useState<LinkedPaymentStage | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
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
  const stopPropagation = (event: React.SyntheticEvent) => event.stopPropagation();

  const loadPaymentStage = useCallback(async () => {
    if (!clientId || !taskId) return;
    const directStageId = paymentStepId?.startsWith("client_payment_stage:")
      ? paymentStepId.slice("client_payment_stage:".length)
      : null;
    const { data, error } = await (supabase as any)
      .from("client_payment_stages")
      .select("id, is_paid, amount, amount_with_vat, vat_rate, payment_method, linked_task_id, payment_step_id, quote_id, stage_name")
      .eq("client_id", clientId);
    if (error) {
      console.error("Error loading linked payment stage:", error);
      return;
    }
    const normalizedTitle = String(taskTitle || "").trim().toLowerCase();
    const rows = data || [];
    const linked = rows.find((row: any) => row.id === directStageId)
      || rows.find((row: any) => row.linked_task_id === taskId)
      || rows.find((row: any) => paymentStepId && row.payment_step_id === paymentStepId)
      || rows.find(
        (row: any) =>
          paymentQuoteId &&
          row.quote_id === paymentQuoteId &&
          String(row.stage_name || "").trim().toLowerCase() === normalizedTitle,
      )
      || rows.find(
        (row: any) =>
          String(row.stage_name || "").trim().toLowerCase() === normalizedTitle,
      );
    setPaymentStage(linked || null);
  }, [clientId, paymentQuoteId, paymentStepId, taskId, taskTitle]);

  useEffect(() => {
    void loadPaymentStage();
  }, [loadPaymentStage]);

  const togglePaid = async (event: React.MouseEvent<HTMLButtonElement>) => {
    stopPropagation(event);
    if (!clientId || !taskId || paymentLoading) return;

    const nextPaid = !paymentStage?.is_paid;
    const vatRate = Number(paymentStage?.vat_rate || quoteInfo?.vatRate || 18);
    const displayedGrossAmount = Number(paymentAmount) || 0;
    const grossAmount = Number(paymentStage?.amount_with_vat)
      || Number(paymentStage?.amount) * (1 + vatRate / 100)
      || displayedGrossAmount;
    setPaymentLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const paidFields = {
          is_paid: nextPaid,
          paid_amount: nextPaid ? Math.round(grossAmount * 100) / 100 : 0,
          paid_date: nextPaid ? new Date().toISOString().slice(0, 10) : null,
          payment_method: paymentStage?.payment_method || "bank_transfer",
          paid_by: nextPaid ? userData?.user?.id || null : null,
          linked_task_id: taskId,
      };

      let query;
      if (paymentStage) {
        query = (supabase as any)
          .from("client_payment_stages")
          .update(paidFields)
          .eq("id", paymentStage.id);
      } else {
        const { data: lastStage } = await (supabase as any)
          .from("client_payment_stages")
          .select("stage_number")
          .eq("client_id", clientId)
          .order("stage_number", { ascending: false })
          .limit(1)
          .maybeSingle();
        const netAmount = displayedGrossAmount > 0
          ? displayedGrossAmount / (1 + vatRate / 100)
          : 0;
        query = (supabase as any)
          .from("client_payment_stages")
          .insert({
            client_id: clientId,
            stage_name: taskTitle || "תשלום",
            stage_number: Number(lastStage?.stage_number || 0) + 1,
            amount: Math.round(netAmount * 100) / 100,
            amount_with_vat: Math.round(displayedGrossAmount * 100) / 100,
            percentage: Number(paymentPercentage) || null,
            vat_rate: vatRate,
            quote_id: paymentQuoteId || null,
            payment_step_id: paymentStepId || null,
            created_by: userData?.user?.id || null,
            ...paidFields,
          });
      }
      const { data, error } = await query
        .select("id, is_paid, amount, amount_with_vat, vat_rate, payment_method")
        .single();
      if (error) throw error;
      setPaymentStage(data);
      notifyClientPaymentStageUpdated(clientId);
      toast({
        title: nextPaid ? "התשלום סומן כשולם" : "סימון התשלום בוטל",
        description: taskTitle || "שלב התשלום עודכן",
      });
    } catch (error: any) {
      toast({
        title: "לא ניתן לעדכן את התשלום",
        description: error?.message || "אירעה שגיאה בעדכון",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!info) return null;

  const amountBeforeVat = info.amount / (1 + info.vatRate / 100);
  const isSigned = ["signed", "converted"].includes(info.quoteStatus);
  const isUnpaidAfterStageCompletion = stageCompleted && !paymentStage?.is_paid;

  return (
    <span
      title={`${isUnpaidAfterStageCompletion ? "השלב הושלם אך התשלום טרם שולם | " : ""}כולל מע״מ: ${currencyFormatter.format(info.amount)} | לפני מע״מ: ${currencyFormatter.format(amountBeforeVat)} | ${info.quoteTitle}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-all",
        paymentStage?.is_paid
          ? "border-blue-400 bg-blue-600 text-white shadow-[0_0_16px_rgba(37,99,235,0.75)] ring-1 ring-blue-300 dark:border-blue-400 dark:bg-blue-600 dark:text-white"
          : isUnpaidAfterStageCompletion
            ? "border-red-500 bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.55)] ring-1 ring-red-300 dark:border-red-400 dark:bg-red-700 dark:text-white"
            : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
        className,
      )}
    >
      {taskId && (
        <button
          type="button"
          title={paymentStage?.is_paid ? "שולם — לחץ לביטול" : "סמן תשלום כשולם"}
          aria-label={paymentStage?.is_paid ? `בטל סימון ${taskTitle || "תשלום"} כשולם` : `סמן ${taskTitle || "תשלום"} כשולם`}
          onClick={togglePaid}
          disabled={paymentLoading}
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full transition-all",
            paymentStage?.is_paid
              ? "bg-white/20 text-white hover:bg-white/30"
              : isUnpaidAfterStageCompletion
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-emerald-600 text-white hover:bg-emerald-700",
            paymentLoading && "cursor-wait opacity-70",
          )}
        >
          {paymentLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : paymentStage?.is_paid ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Banknote className="h-3.5 w-3.5" />
          )}
        </button>
      )}
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
