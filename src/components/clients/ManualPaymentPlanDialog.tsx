import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookCopy,
  Calculator,
  CheckCircle2,
  Link2,
  Loader2,
  Plus,
  Receipt,
  Save,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { createManualClientPaymentPlan, type ManualPaymentPlanRowInput } from "@/lib/createManualClientPaymentPlan";

interface ClientStageOption {
  id: string;
  sourceStageId: string;
  name: string;
  sortOrder: number;
}

interface ClientTaskOption {
  id: string;
  stageId: string;
  stageName: string;
  stagePosition: number;
  title: string;
  completed: boolean;
  sortOrder: number;
  payment_amount?: number | null;
  payment_percentage?: number | null;
  payment_quote_id?: string | null;
  payment_step_id?: string | null;
}

interface PlanRow extends ManualPaymentPlanRowInput {
  localId: string;
}

interface PaymentTemplateStep {
  name: string;
  percentage: number;
  vatRate: number;
}

interface PaymentTemplate {
  id: string;
  name: string;
  steps: PaymentTemplateStep[];
  createdAt: string;
  updatedAt: string;
}

interface ManualPaymentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  existingPaymentStagesCount: number;
  initialTemplatesOpen?: boolean;
  onCreated: () => void | Promise<void>;
}

const DEFAULT_VAT_RATE = 18;
const UNLINKED_VALUE = "__unlinked__";
const PAYMENT_TEMPLATES_SETTING_KEY = "client-payment-plan-templates";
const PAYMENT_PERCENTAGE_STEP = 5;
const MIN_PAYMENT_AMOUNT = 10;

const round2 = (value: number) => Math.round(value * 100) / 100;
const parseWholeAmountInput = (value: string) => {
  if (value === "") return 0;
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
};
const normalizePaymentPercentage = (value: number) =>
  Math.min(100, Math.max(0, Math.round((Number(value) || 0) / PAYMENT_PERCENTAGE_STEP) * PAYMENT_PERCENTAGE_STEP));

const createEmptyRow = (index: number): PlanRow => ({
  localId: crypto.randomUUID(),
  name: `תשלום ${index + 1}`,
  amount: 0,
  percentage: 0,
  vatRate: DEFAULT_VAT_RATE,
  linkedStageId: null,
  linkedTaskId: null,
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export function ManualPaymentPlanDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  existingPaymentStagesCount,
  initialTemplatesOpen = false,
  onCreated,
}: ManualPaymentPlanDialogProps) {
  const { toast } = useToast();
  const [planTitle, setPlanTitle] = useState("תוכנית תשלומים");
  const [projectAmount, setProjectAmount] = useState(0);
  const [defaultVatRate, setDefaultVatRate] = useState(DEFAULT_VAT_RATE);
  const [rows, setRows] = useState<PlanRow[]>([createEmptyRow(0)]);
  const [stages, setStages] = useState<ClientStageOption[]>([]);
  const [tasks, setTasks] = useState<ClientTaskOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [paymentTemplates, setPaymentTemplates] = useSyncedSetting<PaymentTemplate[]>({
    key: PAYMENT_TEMPLATES_SETTING_KEY,
    defaultValue: [],
  });

  const loadClientStagesAndTasks = useCallback(async () => {
    if (!clientId) return;
    setLoadingOptions(true);
    try {
      const [stagesResult, tasksResult] = await Promise.all([
        (supabase as any)
          .from("client_stages")
          .select("id, stage_id, stage_name, sort_order")
          .eq("client_id", clientId)
          .order("sort_order"),
        (supabase as any)
          .from("client_stage_tasks")
          .select(
            "id, stage_id, title, completed, sort_order, payment_amount, payment_percentage, payment_quote_id, payment_step_id",
          )
          .eq("client_id", clientId)
          .ilike("title", "%תשלום%")
          .order("sort_order"),
      ]);

      if (stagesResult.error) throw stagesResult.error;
      if (tasksResult.error) throw tasksResult.error;

      const normalizedStages = (stagesResult.data || []).map((stage: any) => ({
        id: stage.id,
        sourceStageId: String(stage.stage_id || stage.id),
        name: stage.stage_name || "שלב ללא שם",
        sortOrder: Number(stage.sort_order || 0),
      }));
      setStages(normalizedStages);
      setTasks(
        (tasksResult.data || [])
          .filter((task: any) => String(task.title || "").includes("תשלום"))
          .map((task: any) => {
            const taskStageId = String(task.stage_id);
            const stageIndex = normalizedStages.findIndex(
              (stage) => stage.id === taskStageId || stage.sourceStageId === taskStageId,
            );
            const stage = stageIndex >= 0 ? normalizedStages[stageIndex] : null;
            return {
              ...task,
              stageId: stage?.sourceStageId || taskStageId,
              stageName: stage?.name || "שלב לא ידוע",
              stagePosition: stageIndex >= 0 ? stageIndex + 1 : normalizedStages.length + 1,
              completed: Boolean(task.completed),
              sortOrder: Number(task.sort_order || 0),
            };
          })
          .sort(
            (firstTask, secondTask) =>
              firstTask.stagePosition - secondTask.stagePosition || firstTask.sortOrder - secondTask.sortOrder,
          ),
      );
    } catch (error: any) {
      toast({
        title: "לא ניתן לטעון שלבים ומשימות",
        description: error?.message || "אירעה שגיאה בטעינת נתוני הלקוח",
        variant: "destructive",
      });
    } finally {
      setLoadingOptions(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    if (!open) return;
    setPlanTitle("תוכנית תשלומים");
    setProjectAmount(0);
    setDefaultVatRate(DEFAULT_VAT_RATE);
    setRows([createEmptyRow(0)]);
    setTemplatesOpen(initialTemplatesOpen);
    setTemplateName("");
    void loadClientStagesAndTasks();
  }, [initialTemplatesOpen, loadClientStagesAndTasks, open]);

  const totalAmount = useMemo(() => round2(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)), [rows]);
  const totalPercentage = useMemo(
    () => Math.round(rows.reduce((sum, row) => sum + Number(row.percentage || 0), 0) * 1000) / 1000,
    [rows],
  );
  const remainingAmount = round2(projectAmount - totalAmount);
  const isBalanced = projectAmount > 0 && Math.abs(remainingAmount) <= 0.01 && Math.abs(totalPercentage - 100) <= 0.01;

  const updateRow = (localId: string, patch: Partial<PlanRow>) => {
    setRows((current) => current.map((row) => (row.localId === localId ? { ...row, ...patch } : row)));
  };

  const updatePercentage = (row: PlanRow, percentage: number) => {
    const otherRowsPercentage = rows
      .filter((item) => item.localId !== row.localId)
      .reduce((sum, item) => sum + Number(item.percentage || 0), 0);
    const maxAvailablePercentage = Math.max(
      0,
      Math.floor((100 - otherRowsPercentage) / PAYMENT_PERCENTAGE_STEP) * PAYMENT_PERCENTAGE_STEP,
    );
    const normalizedPercentage = Math.min(normalizePaymentPercentage(percentage), maxAvailablePercentage);
    updateRow(row.localId, {
      percentage: normalizedPercentage,
      amount: projectAmount > 0 ? round2((projectAmount * normalizedPercentage) / 100) : 0,
    });
  };

  const updateAmount = (row: PlanRow, amount: number) => {
    if (projectAmount <= 0) {
      updateRow(row.localId, { amount });
      return;
    }
    const percentage = normalizePaymentPercentage((amount * 100) / projectAmount);
    updatePercentage(row, percentage);
  };

  const updateProjectAmount = (amount: number) => {
    setProjectAmount(amount);
    if (amount <= 0) return;
    setRows((current) =>
      current.map((row) => ({
        ...row,
        amount: round2((amount * Number(row.percentage || 0)) / 100),
      })),
    );
  };

  const updateDefaultVat = (vatRate: number) => {
    setDefaultVatRate(vatRate);
    setRows((current) => current.map((row) => ({ ...row, vatRate })));
  };

  const addRow = () => {
    setRows((current) => [...current, createEmptyRow(current.length)]);
  };

  const removeRow = (localId: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.localId !== localId)));
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    setRows((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const distributeEvenly = () => {
    if (projectAmount <= 0 || rows.length === 0) return;
    const totalUnits = 100 / PAYMENT_PERCENTAGE_STEP;
    const baseUnits = Math.floor(totalUnits / rows.length);
    const extraUnits = totalUnits % rows.length;
    setRows((current) =>
      current.map((row, index) => {
        const percentage = (baseUnits + (index < extraUnits ? 1 : 0)) * PAYMENT_PERCENTAGE_STEP;
        return {
          ...row,
          percentage,
          amount: round2((projectAmount * percentage) / 100),
        };
      }),
    );
  };

  const balanceLastRow = () => {
    if (projectAmount <= 0 || rows.length === 0) return;
    const percentageBeforeLast = rows.slice(0, -1).reduce((sum, row) => sum + Number(row.percentage || 0), 0);
    const lastRow = rows[rows.length - 1];
    updatePercentage(lastRow, Math.max(100 - percentageBeforeLast, 0));
  };

  const savePaymentTemplate = () => {
    const normalizedName = templateName.trim();
    const normalizedSteps = rows.map((row) => ({
      name: row.name.trim(),
      percentage: normalizePaymentPercentage(Number(row.percentage || 0)),
      vatRate: Number(row.vatRate || defaultVatRate || DEFAULT_VAT_RATE),
    }));
    const percentageSum = Math.round(normalizedSteps.reduce((sum, step) => sum + step.percentage, 0) * 1000) / 1000;

    if (!normalizedName) {
      toast({
        title: "יש לתת שם לתבנית",
        description: "השם יעזור לזהות את חלוקת התשלומים בפעם הבאה",
        variant: "destructive",
      });
      return;
    }
    if (
      normalizedSteps.length === 0 ||
      normalizedSteps.some((step) => !step.name || step.percentage <= 0) ||
      Math.abs(percentageSum - 100) > 0.01
    ) {
      toast({
        title: "לא ניתן לשמור את התבנית",
        description: "לכל שלב צריך להיות שם ואחוז חיובי, וסך האחוזים חייב להיות 100%",
        variant: "destructive",
      });
      return;
    }

    const now = new Date().toISOString();
    const existing = paymentTemplates.find((template) => template.name.trim() === normalizedName);
    setPaymentTemplates((current) =>
      existing
        ? current.map((template) =>
            template.id === existing.id ? { ...template, steps: normalizedSteps, updatedAt: now } : template,
          )
        : [
            ...current,
            {
              id: crypto.randomUUID(),
              name: normalizedName,
              steps: normalizedSteps,
              createdAt: now,
              updatedAt: now,
            },
          ],
    );
    setTemplateName("");
    toast({
      title: existing ? "תבנית התשלום עודכנה" : "תבנית התשלום נשמרה",
      description: `${normalizedSteps.length} שלבים · 100%`,
    });
  };

  const applyPaymentTemplate = (template: PaymentTemplate) => {
    if (!Array.isArray(template.steps) || template.steps.length === 0) return;
    setRows(
      template.steps.map((step, index) => {
        const previousPercentage = template.steps
          .slice(0, index)
          .reduce((sum, previousStep) => sum + normalizePaymentPercentage(Number(previousStep.percentage || 0)), 0);
        const percentage =
          index === template.steps.length - 1
            ? Math.max(0, 100 - previousPercentage)
            : Math.min(normalizePaymentPercentage(Number(step.percentage || 0)), Math.max(0, 100 - previousPercentage));
        return {
          localId: crypto.randomUUID(),
          name: step.name,
          amount: projectAmount > 0 ? round2((projectAmount * percentage) / 100) : 0,
          percentage,
          vatRate: Number(step.vatRate || defaultVatRate || DEFAULT_VAT_RATE),
          linkedStageId: null,
          linkedTaskId: null,
        };
      }),
    );
    setPlanTitle(template.name);
    setDefaultVatRate(Number(template.steps[0]?.vatRate || defaultVatRate || DEFAULT_VAT_RATE));
    toast({
      title: "תבנית התשלום נטענה",
      description: "השיוכים נשארו ריקים כדי לבחור את המשימות של הלקוח הנוכחי",
    });
  };

  const deletePaymentTemplate = (templateId: string) => {
    setPaymentTemplates((current) => current.filter((template) => template.id !== templateId));
  };

  const handleTaskChange = (row: PlanRow, taskId: string) => {
    const nextTaskId = taskId === UNLINKED_VALUE ? null : taskId;
    const selectedInAnotherRow = Boolean(
      nextTaskId && rows.some((item) => item.localId !== row.localId && item.linkedTaskId === nextTaskId),
    );
    if (selectedInAnotherRow) {
      toast({
        title: "המשימה כבר נבחרה",
        description: "אפשר לשייך כל משימה לשלב תשלום אחד בלבד",
        variant: "destructive",
      });
      return;
    }
    const selectedTask = tasks.find((task) => task.id === nextTaskId);
    updateRow(row.localId, {
      linkedTaskId: nextTaskId,
      linkedStageId: selectedTask?.stageId || null,
    });
  };

  const handleSave = async () => {
    if (!isBalanced) {
      toast({
        title: "התוכנית עדיין אינה מאוזנת",
        description: "סכום השלבים חייב להיות סכום העסקה והאחוזים חייבים להסתכם ב־100%",
        variant: "destructive",
      });
      return;
    }
    if (rows.some((row) => !row.name.trim() || row.amount < MIN_PAYMENT_AMOUNT || !Number.isInteger(row.amount))) {
      toast({
        title: "חסרים פרטים",
        description: "יש להזין בכל שלב שם וסכום שלם של 10 ₪ ומעלה",
        variant: "destructive",
      });
      return;
    }
    const linkedTaskIds = rows.map((row) => row.linkedTaskId).filter((taskId): taskId is string => Boolean(taskId));
    if (new Set(linkedTaskIds).size !== linkedTaskIds.length) {
      toast({
        title: "יש משימה ששויכה פעמיים",
        description: "יש לבחור משימה אחרת או להשאיר את השיוך ריק. כל משימה יכולה להשתייך לתשלום אחד בלבד.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await createManualClientPaymentPlan({
        clientId,
        clientName,
        planTitle,
        rows,
        existingTasks: tasks,
      });
      toast({
        title: "תוכנית התשלומים נוצרה",
        description: `${result.paymentStageIds.length} שלבי תשלום נשמרו${result.linkedTasks ? ` ו־${result.linkedTasks} משימות שויכו` : ""}`,
      });
      await onCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "לא ניתן לשמור את התוכנית",
        description: error?.message || "אירעה שגיאה בשמירת תוכנית התשלומים",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden p-0" dir="rtl">
        <DialogHeader className="border-b bg-muted/20 px-6 py-5 text-right">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">הגדרת תוכנית תשלומים ללקוח קיים</DialogTitle>
              <DialogDescription className="mt-1 text-right">
                הגדר סכומים, סדר ושיוך למשימות של {clientName}. התוכנית נשמרת ישירות בתיק הלקוח.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-168px)]">
          <div className="space-y-5 p-6">
            {existingPaymentStagesCount > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                ללקוח כבר קיימים {existingPaymentStagesCount} שלבי תשלום. התוכנית החדשה תתווסף אליהם ולא תמחק או תשנה
                תשלומים קיימים.
              </div>
            )}

            <section className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="manual-payment-plan-title">שם התוכנית</Label>
                <Input
                  id="manual-payment-plan-title"
                  value={planTitle}
                  onChange={(event) => setPlanTitle(event.target.value)}
                  placeholder="לדוג: תכנון ורישוי"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-payment-plan-amount">סכום העסקה לפני מע״מ</Label>
                <Input
                  id="manual-payment-plan-amount"
                  type="number"
                  min={MIN_PAYMENT_AMOUNT}
                  step={1}
                  value={projectAmount || ""}
                  onChange={(event) => {
                    const amount = parseWholeAmountInput(event.target.value);
                    if (amount !== null) updateProjectAmount(amount);
                  }}
                  onBlur={() => {
                    if (projectAmount > 0 && projectAmount < MIN_PAYMENT_AMOUNT) {
                      updateProjectAmount(MIN_PAYMENT_AMOUNT);
                    }
                  }}
                  inputMode="numeric"
                  placeholder="10 ומעלה"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-payment-plan-vat">מע״מ ברירת מחדל</Label>
                <Input
                  id="manual-payment-plan-vat"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={defaultVatRate}
                  onChange={(event) => updateDefaultVat(Number(event.target.value) || 0)}
                />
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={addRow} className="gap-2">
                  <Plus className="h-4 w-4" />
                  הוסף שלב תשלום
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={distributeEvenly}
                  disabled={projectAmount <= 0}
                  className="gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  חלק שווה בשווה
                </Button>
                <Button type="button" variant="ghost" onClick={balanceLastRow} disabled={projectAmount <= 0}>
                  השלם יתרה בשורה האחרונה
                </Button>
                <Button
                  type="button"
                  variant={templatesOpen ? "default" : "outline"}
                  onClick={() => setTemplatesOpen((current) => !current)}
                  className="gap-2"
                  aria-expanded={templatesOpen}
                >
                  <BookCopy className="h-4 w-4" />
                  תבניות תשלום
                  {paymentTemplates.length > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1.5">
                      {paymentTemplates.length}
                    </Badge>
                  )}
                </Button>
              </div>
              <Badge
                variant="outline"
                className={
                  isBalanced
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-amber-300 bg-amber-50 text-amber-800"
                }
              >
                {isBalanced ? <CheckCircle2 className="ml-1 h-4 w-4" /> : <Calculator className="ml-1 h-4 w-4" />}
                {formatCurrency(totalAmount)} מתוך {formatCurrency(projectAmount)} · {totalPercentage}%
              </Badge>
            </div>

            {templatesOpen && (
              <section className="space-y-3 rounded-2xl border border-primary/25 bg-primary/[0.035] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <BookCopy className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">תבניות תשלום מוכנות</h3>
                      <p className="text-xs text-muted-foreground">
                        התבנית שומרת שמות, אחוזים ומע״מ בלבד. שיוך למשימות נבחר בנפרד לכל לקוח.
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-[280px] flex-1 items-center gap-2 md:max-w-md">
                    <Input
                      value={templateName}
                      onChange={(event) => setTemplateName(event.target.value)}
                      placeholder="שם לתבנית הנוכחית..."
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          savePaymentTemplate();
                        }
                      }}
                    />
                    <Button type="button" onClick={savePaymentTemplate} className="shrink-0 gap-1.5">
                      <Save className="h-4 w-4" />
                      שמור
                    </Button>
                  </div>
                </div>

                {paymentTemplates.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-background/70 px-4 py-5 text-center text-sm text-muted-foreground">
                    עדיין אין תבניות. הגדר את השלבים והאחוזים, הזן שם ולחץ שמור.
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {paymentTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center gap-2 rounded-xl border bg-background p-3 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => applyPaymentTemplate(template)}
                          className="min-w-0 flex-1 text-right"
                        >
                          <span className="block truncate font-medium">{template.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {template.steps.length} שלבים ·{" "}
                            {template.steps.reduce((sum, step) => sum + Number(step.percentage || 0), 0)}%
                          </span>
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => applyPaymentTemplate(template)}
                        >
                          החל
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-destructive"
                          onClick={() => deletePaymentTemplate(template.id)}
                          aria-label={`מחק את התבנית ${template.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <div className="space-y-3">
              {rows.map((row, index) => {
                const selectedTask = tasks.find((task) => task.id === row.linkedTaskId);
                const selectedTaskAlreadyLinked = Boolean(
                  selectedTask && (Number(selectedTask.payment_amount) > 0 || selectedTask.payment_step_id),
                );
                const selectedTaskIdsInOtherRows = new Set(
                  rows
                    .filter((item) => item.localId !== row.localId)
                    .map((item) => item.linkedTaskId)
                    .filter((taskId): taskId is string => Boolean(taskId)),
                );
                return (
                  <div key={row.localId} className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className="h-7 min-w-7 justify-center rounded-full">{index + 1}</Badge>
                        <span className="font-semibold">שלב תשלום</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => moveRow(index, -1)}
                          disabled={index === 0}
                          aria-label="העבר למעלה"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => moveRow(index, 1)}
                          disabled={index === rows.length - 1}
                          aria-label="העבר למטה"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeRow(row.localId)}
                          disabled={rows.length === 1}
                          aria-label="מחק שלב"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-12">
                      <div className="space-y-1.5 lg:col-span-3">
                        <Label>שם התשלום</Label>
                        <Input
                          value={row.name}
                          onChange={(event) => updateRow(row.localId, { name: event.target.value })}
                          placeholder="לדוג: מקדמה"
                        />
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label>אחוז</Label>
                        <Select
                          value={row.percentage > 0 ? String(row.percentage) : undefined}
                          onValueChange={(value) => updatePercentage(row, Number(value))}
                        >
                          <SelectTrigger aria-label={`אחוז תשלום ${index + 1}`}>
                            <SelectValue placeholder="בחר אחוז" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(
                              { length: 100 / PAYMENT_PERCENTAGE_STEP },
                              (_, percentageIndex) => (percentageIndex + 1) * PAYMENT_PERCENTAGE_STEP,
                            ).map((percentage) => {
                              const otherRowsPercentage = rows
                                .filter((item) => item.localId !== row.localId)
                                .reduce((sum, item) => sum + Number(item.percentage || 0), 0);
                              return (
                                <SelectItem
                                  key={percentage}
                                  value={String(percentage)}
                                  disabled={percentage + otherRowsPercentage > 100}
                                >
                                  {percentage}%
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label>סכום לפני מע״מ</Label>
                        <Input
                          type="number"
                          min={MIN_PAYMENT_AMOUNT}
                          step={1}
                          value={row.amount || ""}
                          onChange={(event) => {
                            const amount = parseWholeAmountInput(event.target.value);
                            if (amount !== null) updateAmount(row, amount);
                          }}
                          onBlur={() => {
                            if (row.amount > 0 && row.amount < MIN_PAYMENT_AMOUNT) {
                              updateAmount(row, MIN_PAYMENT_AMOUNT);
                            }
                          }}
                          inputMode="numeric"
                          placeholder="10 ומעלה"
                        />
                      </div>
                      <div className="space-y-1.5 lg:col-span-5">
                        <Label>שיוך למשימת תשלום</Label>
                        <Select
                          value={row.linkedTaskId || UNLINKED_VALUE}
                          onValueChange={(value) => handleTaskChange(row, value)}
                          disabled={loadingOptions}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingOptions ? "טוען..." : "בחר משימה ששמה כולל „תשלום”"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNLINKED_VALUE}>ללא שיוך למשימה</SelectItem>
                            {tasks.map((task) => {
                              const alreadyLinked = Number(task.payment_amount) > 0 || Boolean(task.payment_step_id);
                              const selectedInAnotherRow = selectedTaskIdsInOtherRows.has(task.id);
                              return (
                                <SelectItem
                                  key={task.id}
                                  value={task.id}
                                  disabled={alreadyLinked || selectedInAnotherRow}
                                >
                                  <span className="flex min-w-0 flex-col text-right">
                                    <span>
                                      {task.title}
                                      {task.completed ? " · הושלמה" : ""}
                                      {alreadyLinked ? " · כבר משויך תשלום" : ""}
                                      {selectedInAnotherRow ? " · נבחר בשלב תשלום אחר" : ""}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      שלב {task.stagePosition}: {task.stageName}
                                    </span>
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {tasks.length === 0 && !loadingOptions && (
                          <p className="text-xs text-muted-foreground">לא נמצאו אצל הלקוח משימות ששמן כולל „תשלום”</p>
                        )}
                        {selectedTask && (
                          <p className="text-xs text-muted-foreground">
                            שלב {selectedTask.stagePosition}: {selectedTask.stageName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        כולל מע״מ:{" "}
                        <strong className="text-foreground">
                          {formatCurrency(row.amount * (1 + row.vatRate / 100))}
                        </strong>
                      </span>
                      {row.linkedTaskId && (
                        <span
                          className={
                            selectedTaskAlreadyLinked ? "text-destructive" : "flex items-center gap-1 text-emerald-700"
                          }
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          {selectedTaskAlreadyLinked
                            ? "למשימה כבר משויך תשלום"
                            : `ישויך למשימה: ${selectedTask?.title || ""}`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t bg-background px-6 py-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {loadingOptions
                ? "טוען את משימות התשלום של הלקוח..."
                : `${tasks.length} משימות תשלום זמינות לשיוך מתוך ${stages.length} שלבים`}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                ביטול
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || loadingOptions || !isBalanced}
                className="min-w-40 gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                צור תוכנית תשלומים
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
