import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  CheckCircle2,
  Link2,
  Loader2,
  Plus,
  Receipt,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  createManualClientPaymentPlan,
  type ManualPaymentPlanRowInput,
} from "@/lib/createManualClientPaymentPlan";

interface ClientStageOption {
  id: string;
  sourceStageId: string;
  name: string;
  sortOrder: number;
}

interface ClientTaskOption {
  id: string;
  stageId: string;
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
  selectedClientStageId: string;
}

interface ManualPaymentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  existingPaymentStagesCount: number;
  onCreated: () => void | Promise<void>;
}

const DEFAULT_VAT_RATE = 18;
const UNLINKED_VALUE = "__unlinked__";

const round2 = (value: number) => Math.round(value * 100) / 100;

const createEmptyRow = (index: number): PlanRow => ({
  localId: crypto.randomUUID(),
  name: `תשלום ${index + 1}`,
  amount: 0,
  percentage: 0,
  vatRate: DEFAULT_VAT_RATE,
  linkedStageId: null,
  linkedTaskId: null,
  selectedClientStageId: UNLINKED_VALUE,
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
          .order("sort_order"),
      ]);

      if (stagesResult.error) throw stagesResult.error;
      if (tasksResult.error) throw tasksResult.error;

      setStages(
        (stagesResult.data || []).map((stage: any) => ({
          id: stage.id,
          sourceStageId: String(stage.stage_id || stage.id),
          name: stage.stage_name || "שלב ללא שם",
          sortOrder: Number(stage.sort_order || 0),
        })),
      );
      setTasks(
        (tasksResult.data || []).map((task: any) => ({
          ...task,
          stageId: String(task.stage_id),
          completed: Boolean(task.completed),
          sortOrder: Number(task.sort_order || 0),
        })),
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
    void loadClientStagesAndTasks();
  }, [loadClientStagesAndTasks, open]);

  const totalAmount = useMemo(
    () => round2(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
    [rows],
  );
  const totalPercentage = useMemo(
    () =>
      Math.round(
        rows.reduce((sum, row) => sum + Number(row.percentage || 0), 0) * 1000,
      ) / 1000,
    [rows],
  );
  const remainingAmount = round2(projectAmount - totalAmount);
  const isBalanced =
    projectAmount > 0 &&
    Math.abs(remainingAmount) <= 0.01 &&
    Math.abs(totalPercentage - 100) <= 0.01;

  const updateRow = (localId: string, patch: Partial<PlanRow>) => {
    setRows((current) =>
      current.map((row) => (row.localId === localId ? { ...row, ...patch } : row)),
    );
  };

  const updatePercentage = (row: PlanRow, percentage: number) => {
    updateRow(row.localId, {
      percentage,
      amount: projectAmount > 0 ? round2((projectAmount * percentage) / 100) : 0,
    });
  };

  const updateAmount = (row: PlanRow, amount: number) => {
    updateRow(row.localId, {
      amount,
      percentage: projectAmount > 0 ? Math.round((amount * 100000) / projectAmount) / 1000 : 0,
    });
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
    setRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.localId !== localId),
    );
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
    const basePercentage = Math.floor((100 / rows.length) * 1000) / 1000;
    const baseAmount = round2((projectAmount * basePercentage) / 100);
    setRows((current) =>
      current.map((row, index) => {
        const isLast = index === current.length - 1;
        return {
          ...row,
          percentage: isLast
            ? Math.round((100 - basePercentage * (current.length - 1)) * 1000) / 1000
            : basePercentage,
          amount: isLast
            ? round2(projectAmount - baseAmount * (current.length - 1))
            : baseAmount,
        };
      }),
    );
  };

  const balanceLastRow = () => {
    if (projectAmount <= 0 || rows.length === 0) return;
    const amountBeforeLast = rows
      .slice(0, -1)
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const lastRow = rows[rows.length - 1];
    updateAmount(lastRow, round2(Math.max(projectAmount - amountBeforeLast, 0)));
  };

  const tasksForStage = (stage: ClientStageOption) =>
    tasks.filter(
      (task) => task.stageId === stage.id || task.stageId === stage.sourceStageId,
    );

  const handleStageChange = (row: PlanRow, selectedStageId: string) => {
    if (selectedStageId === UNLINKED_VALUE) {
      updateRow(row.localId, {
        selectedClientStageId: UNLINKED_VALUE,
        linkedStageId: null,
        linkedTaskId: null,
      });
      return;
    }

    const stage = stages.find((item) => item.id === selectedStageId);
    updateRow(row.localId, {
      selectedClientStageId: selectedStageId,
      linkedStageId: stage?.sourceStageId || selectedStageId,
      linkedTaskId: null,
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
    if (rows.some((row) => !row.name.trim() || row.amount <= 0)) {
      toast({
        title: "חסרים פרטים",
        description: "יש להזין שם וסכום בכל שלב תשלום",
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
                ללקוח כבר קיימים {existingPaymentStagesCount} שלבי תשלום. התוכנית החדשה תתווסף
                אליהם ולא תמחק או תשנה תשלומים קיימים.
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
                  min={0}
                  step="0.01"
                  value={projectAmount || ""}
                  onChange={(event) => updateProjectAmount(Number(event.target.value) || 0)}
                  placeholder="0"
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={balanceLastRow}
                  disabled={projectAmount <= 0}
                >
                  השלם יתרה בשורה האחרונה
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
                {isBalanced ? (
                  <CheckCircle2 className="ml-1 h-4 w-4" />
                ) : (
                  <Calculator className="ml-1 h-4 w-4" />
                )}
                {formatCurrency(totalAmount)} מתוך {formatCurrency(projectAmount)} ·{" "}
                {totalPercentage}%
              </Badge>
            </div>

            <div className="space-y-3">
              {rows.map((row, index) => {
                const selectedStage = stages.find(
                  (stage) => stage.id === row.selectedClientStageId,
                );
                const availableTasks = selectedStage ? tasksForStage(selectedStage) : [];
                const selectedTask = tasks.find((task) => task.id === row.linkedTaskId);
                const selectedTaskAlreadyLinked = Boolean(
                  selectedTask &&
                    (Number(selectedTask.payment_amount) > 0 || selectedTask.payment_step_id),
                );
                return (
                  <div
                    key={row.localId}
                    className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className="h-7 min-w-7 justify-center rounded-full">
                          {index + 1}
                        </Badge>
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
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.001"
                          value={row.percentage || ""}
                          onChange={(event) =>
                            updatePercentage(row, Number(event.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label>סכום לפני מע״מ</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.amount || ""}
                          onChange={(event) =>
                            updateAmount(row, Number(event.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label>שיוך לשלב</Label>
                        <Select
                          value={row.selectedClientStageId}
                          onValueChange={(value) => handleStageChange(row, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="ללא שיוך" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNLINKED_VALUE}>ללא שיוך</SelectItem>
                            {stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 lg:col-span-3">
                        <Label>שיוך למשימה</Label>
                        <Select
                          value={row.linkedTaskId || UNLINKED_VALUE}
                          onValueChange={(value) =>
                            updateRow(row.localId, {
                              linkedTaskId: value === UNLINKED_VALUE ? null : value,
                            })
                          }
                          disabled={!selectedStage || loadingOptions}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={loadingOptions ? "טוען..." : "בחר משימה"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNLINKED_VALUE}>ללא שיוך למשימה</SelectItem>
                            {availableTasks.map((task) => {
                              const alreadyLinked =
                                Number(task.payment_amount) > 0 || Boolean(task.payment_step_id);
                              return (
                                <SelectItem key={task.id} value={task.id} disabled={alreadyLinked}>
                                  {task.title}
                                  {task.completed ? " · הושלמה" : ""}
                                  {alreadyLinked ? " · כבר משויך תשלום" : ""}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
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
                            selectedTaskAlreadyLinked
                              ? "text-destructive"
                              : "flex items-center gap-1 text-emerald-700"
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
                ? "טוען את שלבי הלקוח..."
                : `${stages.length} שלבים ו־${tasks.length} משימות זמינים לשיוך`}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
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
