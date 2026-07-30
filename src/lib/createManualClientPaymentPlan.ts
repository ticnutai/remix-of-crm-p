import { supabase } from "@/integrations/supabase/client";

export interface ManualPaymentPlanRowInput {
  name: string;
  amount: number;
  percentage: number;
  vatRate: number;
  linkedStageId?: string | null;
  linkedTaskId?: string | null;
}

interface ExistingTaskPaymentState {
  id: string;
  title: string;
  payment_amount?: number | null;
  payment_percentage?: number | null;
  payment_quote_id?: string | null;
  payment_step_id?: string | null;
}

interface CreateManualClientPaymentPlanInput {
  clientId: string;
  clientName: string;
  planTitle: string;
  rows: ManualPaymentPlanRowInput[];
  existingTasks: ExistingTaskPaymentState[];
}

export interface CreateManualClientPaymentPlanResult {
  paymentStageIds: string[];
  linkedTasks: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;
const PAYMENT_PERCENTAGE_STEP = 5;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || "שגיאה לא ידועה");
  }
  return String(error || "שגיאה לא ידועה");
}

export async function createManualClientPaymentPlan({
  clientId,
  clientName,
  planTitle,
  rows,
  existingTasks,
}: CreateManualClientPaymentPlanInput): Promise<CreateManualClientPaymentPlanResult> {
  const normalizedRows = rows.map((row) => ({
    ...row,
    name: row.name.trim(),
    amount: round2(Number(row.amount) || 0),
    percentage: Math.round((Number(row.percentage) || 0) * 1000) / 1000,
    vatRate: Number(row.vatRate) || 0,
    linkedStageId: row.linkedStageId || null,
    linkedTaskId: row.linkedTaskId || null,
  }));

  if (!clientId || normalizedRows.length === 0) {
    throw new Error("יש להוסיף לפחות שלב תשלום אחד");
  }

  if (normalizedRows.some((row) => !row.name || row.amount <= 0)) {
    throw new Error("לכל שלב תשלום חייבים להיות שם וסכום תקין");
  }
  if (
    normalizedRows.some(
      (row) =>
        row.percentage <= 0 ||
        row.percentage > 100 ||
        Math.abs(row.percentage % PAYMENT_PERCENTAGE_STEP) > 0.001,
    ) ||
    Math.abs(
      normalizedRows.reduce((sum, row) => sum + row.percentage, 0) - 100,
    ) > 0.01
  ) {
    throw new Error("אחוזי התשלום חייבים להיות בכפולות של 5 ולהסתכם ב־100%");
  }

  const linkedTaskIds = normalizedRows
    .map((row) => row.linkedTaskId)
    .filter((id): id is string => Boolean(id));
  if (new Set(linkedTaskIds).size !== linkedTaskIds.length) {
    throw new Error("לא ניתן לשייך את אותה משימה ליותר מתשלום אחד");
  }

  const taskMap = new Map(existingTasks.map((task) => [task.id, task]));
  const invalidLinkedTasks = linkedTaskIds.filter((taskId) => {
    const task = taskMap.get(taskId);
    return !task || !String(task.title || "").includes("תשלום");
  });
  if (invalidLinkedTasks.length > 0) {
    throw new Error("ניתן לשייך תשלום רק למשימה ששמה כולל את המילה „תשלום”");
  }
  const alreadyLinkedTasks = linkedTaskIds
    .map((taskId) => taskMap.get(taskId))
    .filter(
      (task): task is ExistingTaskPaymentState =>
        Boolean(task && (Number(task.payment_amount) > 0 || task.payment_step_id)),
    );
  if (alreadyLinkedTasks.length > 0) {
    throw new Error(
      `למשימות הבאות כבר משויך תשלום: ${alreadyLinkedTasks
        .map((task) => task.title)
        .join(", ")}`,
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const { data: lastStage, error: lastStageError } = await (supabase as any)
    .from("client_payment_stages")
    .select("stage_number")
    .eq("client_id", clientId)
    .order("stage_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastStageError) throw lastStageError;

  const nextStageNumber = Number(lastStage?.stage_number || 0) + 1;
  const title = planTitle.trim() || `תוכנית תשלומים — ${clientName}`;
  const rowsToInsert = normalizedRows.map((row, index) => {
    const id = crypto.randomUUID();
    return {
      id,
      client_id: clientId,
      stage_name: row.name,
      stage_number: nextStageNumber + index,
      description: `[תוכנית ידנית: ${title}]`,
      amount: row.amount,
      percentage: row.percentage > 0 ? row.percentage : null,
      vat_rate: row.vatRate,
      quote_id: null,
      payment_step_id: `client_payment_stage:${id}`,
      linked_stage_id: row.linkedStageId,
      linked_task_id: row.linkedTaskId,
      created_by: authData.user?.id || null,
    };
  });

  const insertedIds = rowsToInsert.map((row) => row.id);
  const updatedTaskIds: string[] = [];

  try {
    const { error: insertError } = await (supabase as any)
      .from("client_payment_stages")
      .insert(rowsToInsert);
    if (insertError) throw insertError;

    for (let index = 0; index < normalizedRows.length; index += 1) {
      const row = normalizedRows[index];
      if (!row.linkedTaskId) continue;

      const grossAmount = round2(row.amount * (1 + row.vatRate / 100));
      const { data: updatedTask, error: taskError } = await (supabase as any)
        .from("client_stage_tasks")
        .update({
          payment_amount: grossAmount,
          payment_percentage: row.percentage > 0 ? row.percentage : null,
          payment_quote_id: null,
          payment_step_id: rowsToInsert[index].payment_step_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.linkedTaskId)
        .eq("client_id", clientId)
        .select("id")
        .maybeSingle();
      if (taskError) throw taskError;
      if (!updatedTask?.id) {
        throw new Error("המשימה שנבחרה לשיוך לא נמצאה עוד בתיק הלקוח");
      }
      updatedTaskIds.push(row.linkedTaskId);
    }

    return {
      paymentStageIds: insertedIds,
      linkedTasks: updatedTaskIds.length,
    };
  } catch (error) {
    if (updatedTaskIds.length > 0) {
      await (supabase as any)
        .from("client_stage_tasks")
        .update({
          payment_amount: null,
          payment_percentage: null,
          payment_quote_id: null,
          payment_step_id: null,
          updated_at: new Date().toISOString(),
        })
        .in("id", updatedTaskIds);
    }
    await (supabase as any)
      .from("client_payment_stages")
      .delete()
      .in("id", insertedIds);

    throw new Error(`שמירת תוכנית התשלומים נכשלה: ${getErrorMessage(error)}`);
  }
}
