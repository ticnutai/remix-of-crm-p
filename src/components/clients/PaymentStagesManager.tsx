import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Circle,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  Building,
  Smartphone,
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

// =========================================
// Types
// =========================================

interface PaymentStage {
  id: string;
  client_id: string;
  stage_name: string;
  stage_number: number;
  description: string | null;
  amount: number;
  vat_rate: number;
  amount_with_vat: number;
  is_paid: boolean;
  paid_date: string | null;
  paid_amount: number;
  payment_method: string;
  paid_by: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AdditionalPayment {
  id: string;
  client_id: string;
  payment_type: string;
  description: string;
  amount: number;
  vat_rate: number;
  amount_with_vat: number;
  is_paid: boolean;
  paid_date: string | null;
  paid_amount: number;
  payment_method: string;
  paid_by: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentStagesManagerProps {
  clientId: string;
  clientName: string;
}

// =========================================
// Constants
// =========================================

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "העברה בנקאית", icon: Building },
  { value: "cash", label: "מזומן", icon: Banknote },
  { value: "check", label: "צ'ק", icon: FileText },
  { value: "credit_card", label: "כרטיס אשראי", icon: CreditCard },
  { value: "bit", label: "ביט", icon: Smartphone },
  { value: "paypal", label: "PayPal", icon: DollarSign },
  { value: "other", label: "אחר", icon: Wallet },
];

const PAYMENT_TYPES = [
  { value: "extra_hours", label: "תוספת שעות" },
  { value: "renderings", label: "הדמיות" },
  { value: "additional_services", label: "שירותים נוספים" },
  { value: "expenses", label: "הוצאות" },
  { value: "materials", label: "חומרים" },
  { value: "travel", label: "נסיעות" },
  { value: "consulting", label: "ייעוץ" },
  { value: "other", label: "אחר" },
];

const formatCurrency = (amount: number): string => {
  return `₪${Math.round(amount).toLocaleString("he-IL")}`;
};

const getPaymentMethodInfo = (method: string) => {
  return PAYMENT_METHODS.find((m) => m.value === method) || PAYMENT_METHODS[6];
};

const getPaymentTypeLabel = (type: string) => {
  return PAYMENT_TYPES.find((t) => t.value === type)?.label || type;
};

// =========================================
// Payment Method Badge
// =========================================

const PaymentMethodBadge = ({ method }: { method: string }) => {
  const info = getPaymentMethodInfo(method);
  const Icon = info.icon;
  const colorMap: Record<string, string> = {
    bank_transfer: "bg-purple-500/20 text-purple-600",
    cash: "bg-green-500/20 text-green-600",
    check: "bg-blue-500/20 text-blue-600",
    credit_card: "bg-orange-500/20 text-orange-600",
    bit: "bg-pink-500/20 text-pink-600",
    paypal: "bg-blue-500/20 text-blue-600",
    other: "bg-gray-500/20 text-gray-600",
  };
  return (
    <Badge className={`${colorMap[method] || colorMap.other} border-0 gap-1`}>
      <Icon className="h-3 w-3" />
      {info.label}
    </Badge>
  );
};

// =========================================
// Stage Form Dialog
// =========================================

interface StageFormData {
  stage_name: string;
  stage_number: number;
  description: string;
  amount: number;
  vat_rate: number;
}

const StageFormDialog = ({
  open,
  onClose,
  onSave,
  initialData,
  nextStageNumber,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: StageFormData) => void;
  initialData?: StageFormData | null;
  nextStageNumber: number;
}) => {
  const [form, setForm] = useState<StageFormData>({
    stage_name: "",
    stage_number: nextStageNumber,
    description: "",
    amount: 0,
    vat_rate: 17,
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        stage_name: `שלב ${nextStageNumber}`,
        stage_number: nextStageNumber,
        description: "",
        amount: 0,
        vat_rate: 17,
      });
    }
  }, [initialData, nextStageNumber, open]);

  const amountWithVat = form.amount * (1 + form.vat_rate / 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "עריכת שלב תשלום" : "הוספת שלב תשלום חדש"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>שם השלב</Label>
              <Input
                value={form.stage_name}
                onChange={(e) =>
                  setForm({ ...form, stage_name: e.target.value })
                }
                placeholder="שלב 1 - תכנון"
              />
            </div>
            <div>
              <Label>מספר שלב</Label>
              <Input
                type="number"
                min={1}
                value={form.stage_number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stage_number: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label>תיאור</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="תיאור השלב..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>סכום (לפני מע"מ)</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={form.amount || ""}
                onChange={(e) =>
                  setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label>אחוז מע"מ</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.vat_rate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    vat_rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span>סכום לפני מע"מ:</span>
              <span className="font-medium">{formatCurrency(form.amount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>מע"מ ({form.vat_rate}%):</span>
              <span>{formatCurrency((form.amount * form.vat_rate) / 100)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-bold">
              <span>סה"כ כולל מע"מ:</span>
              <span>{formatCurrency(amountWithVat)}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!form.stage_name || form.amount <= 0}
          >
            {initialData ? "עדכן" : "הוסף שלב"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =========================================
// Record Payment Dialog
// =========================================

interface PaymentRecordData {
  paid_amount: number;
  payment_method: string;
  paid_by: string;
  paid_date: string;
  payment_reference: string;
  notes: string;
}

const RecordPaymentDialog = ({
  open,
  onClose,
  onSave,
  maxAmount,
  stageName,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: PaymentRecordData) => void;
  maxAmount: number;
  stageName: string;
}) => {
  const [form, setForm] = useState<PaymentRecordData>({
    paid_amount: maxAmount,
    payment_method: "bank_transfer",
    paid_by: "",
    paid_date: new Date().toISOString().split("T")[0],
    payment_reference: "",
    notes: "",
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, paid_amount: maxAmount }));
  }, [maxAmount, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>תיעוד תשלום — {stageName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>סכום ששולם</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={form.paid_amount || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paid_amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                מתוך {formatCurrency(maxAmount)}
              </p>
            </div>
            <div>
              <Label>תאריך תשלום</Label>
              <Input
                type="date"
                value={form.paid_date}
                onChange={(e) =>
                  setForm({ ...form, paid_date: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label>אמצעי תשלום</Label>
            <Select
              value={form.payment_method}
              onValueChange={(v) => setForm({ ...form, payment_method: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>שולם על ידי</Label>
            <Input
              value={form.paid_by}
              onChange={(e) => setForm({ ...form, paid_by: e.target.value })}
              placeholder="שם המשלם..."
            />
          </div>
          <div>
            <Label>מספר אסמכתא / העברה</Label>
            <Input
              value={form.payment_reference}
              onChange={(e) =>
                setForm({ ...form, payment_reference: e.target.value })
              }
              placeholder="מספר צ'ק, אסמכתא..."
            />
          </div>
          <div>
            <Label>הערות</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="הערות נוספות..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={() => onSave(form)} disabled={form.paid_amount <= 0}>
            <CheckCircle className="h-4 w-4 ml-1" />
            סמן כשולם
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =========================================
// Additional Payment Form Dialog
// =========================================

interface AdditionalPaymentFormData {
  payment_type: string;
  description: string;
  amount: number;
  vat_rate: number;
  is_paid: boolean;
  paid_date: string;
  paid_amount: number;
  payment_method: string;
  paid_by: string;
  payment_reference: string;
  notes: string;
}

const AdditionalPaymentDialog = ({
  open,
  onClose,
  onSave,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AdditionalPaymentFormData) => void;
  initialData?: AdditionalPaymentFormData | null;
}) => {
  const [form, setForm] = useState<AdditionalPaymentFormData>({
    payment_type: "other",
    description: "",
    amount: 0,
    vat_rate: 17,
    is_paid: false,
    paid_date: new Date().toISOString().split("T")[0],
    paid_amount: 0,
    payment_method: "bank_transfer",
    paid_by: "",
    payment_reference: "",
    notes: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        payment_type: "other",
        description: "",
        amount: 0,
        vat_rate: 17,
        is_paid: false,
        paid_date: new Date().toISOString().split("T")[0],
        paid_amount: 0,
        payment_method: "bank_transfer",
        paid_by: "",
        payment_reference: "",
        notes: "",
      });
    }
  }, [initialData, open]);

  const amountWithVat = form.amount * (1 + form.vat_rate / 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "עריכת תשלום נוסף" : "הוספת תשלום נוסף"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-1">
            <div>
              <Label>סוג תשלום</Label>
              <Select
                value={form.payment_type}
                onValueChange={(v) => setForm({ ...form, payment_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תיאור</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="תיאור התשלום..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>סכום (לפני מע"מ)</Label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={form.amount || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>מע"מ %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.vat_rate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vat_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex justify-between font-bold">
                <span>סה"כ כולל מע"מ:</span>
                <span>{formatCurrency(amountWithVat)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.is_paid}
                onCheckedChange={(c) =>
                  setForm({
                    ...form,
                    is_paid: !!c,
                    paid_amount: c
                      ? form.amount * (1 + form.vat_rate / 100)
                      : 0,
                  })
                }
              />
              <Label className="cursor-pointer">שולם</Label>
            </div>

            {form.is_paid && (
              <div className="space-y-3 bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>סכום ששולם</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.paid_amount || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          paid_amount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>תאריך תשלום</Label>
                    <Input
                      type="date"
                      value={form.paid_date}
                      onChange={(e) =>
                        setForm({ ...form, paid_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>אמצעי תשלום</Label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(v) =>
                      setForm({ ...form, payment_method: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>שולם על ידי</Label>
                  <Input
                    value={form.paid_by}
                    onChange={(e) =>
                      setForm({ ...form, paid_by: e.target.value })
                    }
                    placeholder="שם המשלם..."
                  />
                </div>
                <div>
                  <Label>אסמכתא</Label>
                  <Input
                    value={form.payment_reference}
                    onChange={(e) =>
                      setForm({ ...form, payment_reference: e.target.value })
                    }
                    placeholder="מספר צ'ק / אסמכתא..."
                  />
                </div>
              </div>
            )}

            <div>
              <Label>הערות</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="הערות..."
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!form.description || form.amount <= 0}
          >
            {initialData ? "עדכן" : "הוסף תשלום"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =========================================
// Main Component
// =========================================

export default function PaymentStagesManager({
  clientId,
  clientName,
}: PaymentStagesManagerProps) {
  const { toast } = useToast();
  const [stages, setStages] = useState<PaymentStage[]>([]);
  const [additionalPayments, setAdditionalPayments] = useState<
    AdditionalPayment[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PaymentStage | null>(null);
  const [recordPaymentDialogOpen, setRecordPaymentDialogOpen] = useState(false);
  const [recordPaymentStage, setRecordPaymentStage] =
    useState<PaymentStage | null>(null);
  const [additionalDialogOpen, setAdditionalDialogOpen] = useState(false);
  const [editingAdditional, setEditingAdditional] =
    useState<AdditionalPayment | null>(null);
  const [expandedStages, setExpandedStages] = useState(true);
  const [expandedAdditional, setExpandedAdditional] = useState(true);

  // =========================================
  // Data fetching
  // =========================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stagesRes, addRes] = await Promise.all([
        (supabase as any)
          .from("client_payment_stages")
          .select("*")
          .eq("client_id", clientId)
          .order("stage_number"),
        (supabase as any)
          .from("client_additional_payments")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at"),
      ]);
      if (stagesRes.data) setStages(stagesRes.data);
      if (addRes.data) setAdditionalPayments(addRes.data);
    } catch (err) {
      console.error("Error fetching payment stages:", err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =========================================
  // Summary calculations
  // =========================================

  const summary = useMemo(() => {
    const totalStagesAmount = stages.reduce(
      (s, st) =>
        s + (st.amount_with_vat || st.amount * (1 + (st.vat_rate || 17) / 100)),
      0,
    );
    const totalStagesPaid = stages
      .filter((s) => s.is_paid)
      .reduce((s, st) => s + (st.paid_amount || st.amount_with_vat || 0), 0);
    const totalAdditionalAmount = additionalPayments.reduce(
      (s, ap) =>
        s + (ap.amount_with_vat || ap.amount * (1 + (ap.vat_rate || 17) / 100)),
      0,
    );
    const totalAdditionalPaid = additionalPayments
      .filter((a) => a.is_paid)
      .reduce((s, ap) => s + (ap.paid_amount || ap.amount_with_vat || 0), 0);
    const totalAmount = totalStagesAmount + totalAdditionalAmount;
    const totalPaid = totalStagesPaid + totalAdditionalPaid;
    const totalRemaining = totalAmount - totalPaid;
    const progressPercent =
      totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    const paidStages = stages.filter((s) => s.is_paid).length;
    const totalStages = stages.length;
    return {
      totalAmount,
      totalPaid,
      totalRemaining,
      progressPercent,
      paidStages,
      totalStages,
      totalAdditionalAmount,
      totalAdditionalPaid,
    };
  }, [stages, additionalPayments]);

  // =========================================
  // Stage CRUD
  // =========================================

  const handleSaveStage = async (data: StageFormData) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (editingStage) {
        const { error } = await (supabase as any)
          .from("client_payment_stages")
          .update({
            stage_name: data.stage_name,
            stage_number: data.stage_number,
            description: data.description || null,
            amount: data.amount,
            vat_rate: data.vat_rate,
          })
          .eq("id", editingStage.id);
        if (error) throw error;
        toast({
          title: "שלב עודכן",
          description: `${data.stage_name} עודכן בהצלחה`,
        });
      } else {
        const { error } = await (supabase as any)
          .from("client_payment_stages")
          .insert({
            client_id: clientId,
            stage_name: data.stage_name,
            stage_number: data.stage_number,
            description: data.description || null,
            amount: data.amount,
            vat_rate: data.vat_rate,
            created_by: userData?.user?.id,
          });
        if (error) throw error;
        toast({
          title: "שלב נוסף",
          description: `${data.stage_name} נוסף בהצלחה`,
        });
      }
      setStageDialogOpen(false);
      setEditingStage(null);
      fetchData();
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStage = async (stage: PaymentStage) => {
    if (!confirm(`למחוק את "${stage.stage_name}"?`)) return;
    try {
      const { error } = await (supabase as any)
        .from("client_payment_stages")
        .delete()
        .eq("id", stage.id);
      if (error) throw error;
      toast({ title: "שלב נמחק" });
      fetchData();
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRecordPayment = async (data: PaymentRecordData) => {
    if (!recordPaymentStage) return;
    try {
      const { error } = await (supabase as any)
        .from("client_payment_stages")
        .update({
          is_paid: true,
          paid_amount: data.paid_amount,
          paid_date: data.paid_date,
          payment_method: data.payment_method,
          paid_by: data.paid_by || null,
          payment_reference: data.payment_reference || null,
          notes: data.notes || null,
        })
        .eq("id", recordPaymentStage.id);
      if (error) throw error;
      toast({
        title: "תשלום נרשם",
        description: `${recordPaymentStage.stage_name} סומן כשולם`,
      });
      setRecordPaymentDialogOpen(false);
      setRecordPaymentStage(null);
      fetchData();
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleUnmarkPaid = async (stage: PaymentStage) => {
    try {
      const { error } = await (supabase as any)
        .from("client_payment_stages")
        .update({
          is_paid: false,
          paid_amount: 0,
          paid_date: null,
          payment_method: "bank_transfer",
          paid_by: null,
          payment_reference: null,
        })
        .eq("id", stage.id);
      if (error) throw error;
      toast({ title: "סימון תשלום בוטל" });
      fetchData();
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // =========================================
  // Additional Payments CRUD
  // =========================================

  const handleSaveAdditional = async (data: AdditionalPaymentFormData) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        client_id: clientId,
        payment_type: data.payment_type,
        description: data.description,
        amount: data.amount,
        vat_rate: data.vat_rate,
        is_paid: data.is_paid,
        paid_date: data.is_paid ? data.paid_date : null,
        paid_amount: data.is_paid ? data.paid_amount : 0,
        payment_method: data.payment_method,
        paid_by: data.paid_by || null,
        payment_reference: data.payment_reference || null,
        notes: data.notes || null,
        created_by: userData?.user?.id,
      };
      if (editingAdditional) {
        const { created_by, ...updatePayload } = payload;
        const { error } = await (supabase as any)
          .from("client_additional_payments")
          .update(updatePayload)
          .eq("id", editingAdditional.id);
        if (error) throw error;
        toast({ title: "תשלום עודכן" });
      } else {
        const { error } = await (supabase as any)
          .from("client_additional_payments")
          .insert(payload);
        if (error) throw error;
        toast({
          title: "תשלום נוסף",
          description: `${data.description} נוסף בהצלחה`,
        });
      }
      setAdditionalDialogOpen(false);
      setEditingAdditional(null);
      fetchData();
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdditional = async (payment: AdditionalPayment) => {
    if (!confirm(`למחוק את "${payment.description}"?`)) return;
    try {
      const { error } = await (supabase as any)
        .from("client_additional_payments")
        .delete()
        .eq("id", payment.id);
      if (error) throw error;
      toast({ title: "תשלום נמחק" });
      fetchData();
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // =========================================
  // Render
  // =========================================

  return (
    <div className="space-y-4" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xs text-muted-foreground">סה"כ פרויקט</p>
            <p className="text-lg font-bold">
              {formatCurrency(summary.totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-xs text-muted-foreground">שולם</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(summary.totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30">
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-xs text-muted-foreground">נותר לתשלום</p>
            <p className="text-lg font-bold text-orange-600">
              {formatCurrency(summary.totalRemaining)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-xs text-muted-foreground">שלבים שולמו</p>
            <p className="text-lg font-bold">
              {summary.paidStages}/{summary.totalStages}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {summary.totalAmount > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>התקדמות תשלומים</span>
            <span>{Math.round(summary.progressPercent)}%</span>
          </div>
          <Progress value={summary.progressPercent} className="h-2" />
        </div>
      )}

      {/* Payment Stages */}
      <Card className="border-border/50">
        <CardHeader
          className="pb-2 cursor-pointer"
          onClick={() => setExpandedStages(!expandedStages)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">שלבי תשלום</CardTitle>
              <Badge variant="outline">{stages.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingStage(null);
                  setStageDialogOpen(true);
                }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                הוסף שלב
              </Button>
              {expandedStages ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CardHeader>
        {expandedStages && (
          <CardContent className="pt-0">
            {stages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>אין שלבי תשלום</p>
                <p className="text-xs">
                  הוסף שלבים לפרויקט כדי לעקוב אחרי התשלומים
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {stages.map((stage) => {
                  const vatAmount =
                    (stage.amount * (stage.vat_rate || 17)) / 100;
                  const totalWithVat =
                    stage.amount_with_vat || stage.amount + vatAmount;
                  return (
                    <div
                      key={stage.id}
                      className={`border rounded-lg p-3 transition-all ${
                        stage.is_paid
                          ? "bg-green-500/5 border-green-500/30"
                          : "bg-card border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Right side: Status + Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Paid/Unpaid toggle */}
                          <button
                            onClick={() => {
                              if (stage.is_paid) {
                                handleUnmarkPaid(stage);
                              } else {
                                setRecordPaymentStage(stage);
                                setRecordPaymentDialogOpen(true);
                              }
                            }}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {stage.is_paid ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-medium text-sm ${stage.is_paid ? "line-through text-muted-foreground" : ""}`}
                              >
                                {stage.stage_name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                שלב {stage.stage_number}
                              </Badge>
                              {stage.is_paid && (
                                <Badge className="bg-green-500/20 text-green-600 border-0 text-xs">
                                  שולם
                                </Badge>
                              )}
                            </div>
                            {stage.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {stage.description}
                              </p>
                            )}
                            {/* Amount details */}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span>
                                {formatCurrency(stage.amount)} + מע"מ{" "}
                                {formatCurrency(vatAmount)}
                              </span>
                              <span className="font-bold text-foreground">
                                = {formatCurrency(totalWithVat)}
                              </span>
                            </div>
                            {/* Payment details if paid */}
                            {stage.is_paid && (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <PaymentMethodBadge
                                  method={stage.payment_method}
                                />
                                {stage.paid_date && (
                                  <span className="text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 inline ml-0.5" />
                                    {format(
                                      new Date(stage.paid_date),
                                      "dd/MM/yyyy",
                                    )}
                                  </span>
                                )}
                                {stage.paid_by && (
                                  <span className="text-xs text-muted-foreground">
                                    ע"י {stage.paid_by}
                                  </span>
                                )}
                                {stage.payment_reference && (
                                  <span className="text-xs text-muted-foreground">
                                    אסמכתא: {stage.payment_reference}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Left side: Amount + Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingStage(stage);
                              setStageDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDeleteStage(stage)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Additional Payments */}
      <Card className="border-border/50">
        <CardHeader
          className="pb-2 cursor-pointer"
          onClick={() => setExpandedAdditional(!expandedAdditional)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">תשלומים נוספים</CardTitle>
              <Badge variant="outline">{additionalPayments.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingAdditional(null);
                  setAdditionalDialogOpen(true);
                }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                הוסף תשלום
              </Button>
              {expandedAdditional ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CardHeader>
        {expandedAdditional && (
          <CardContent className="pt-0">
            {additionalPayments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">אין תשלומים נוספים</p>
                <p className="text-xs">
                  הוסף תשלומים על תוספת שעות, הדמיות, הוצאות ועוד
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {additionalPayments.map((payment) => {
                  const vatAmount =
                    (payment.amount * (payment.vat_rate || 17)) / 100;
                  const totalWithVat =
                    payment.amount_with_vat || payment.amount + vatAmount;
                  return (
                    <div
                      key={payment.id}
                      className={`border rounded-lg p-3 transition-all ${
                        payment.is_paid
                          ? "bg-green-500/5 border-green-500/30"
                          : "bg-card border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {payment.is_paid ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-medium text-sm ${payment.is_paid ? "line-through text-muted-foreground" : ""}`}
                              >
                                {payment.description}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {getPaymentTypeLabel(payment.payment_type)}
                              </Badge>
                              {payment.is_paid && (
                                <Badge className="bg-green-500/20 text-green-600 border-0 text-xs">
                                  שולם
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span>
                                {formatCurrency(payment.amount)} + מע"מ ={" "}
                              </span>
                              <span className="font-bold text-foreground">
                                {formatCurrency(totalWithVat)}
                              </span>
                            </div>
                            {payment.is_paid && (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <PaymentMethodBadge
                                  method={payment.payment_method}
                                />
                                {payment.paid_date && (
                                  <span className="text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 inline ml-0.5" />
                                    {format(
                                      new Date(payment.paid_date),
                                      "dd/MM/yyyy",
                                    )}
                                  </span>
                                )}
                                {payment.paid_by && (
                                  <span className="text-xs text-muted-foreground">
                                    ע"י {payment.paid_by}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingAdditional(payment);
                              setAdditionalDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDeleteAdditional(payment)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Dialogs */}
      <StageFormDialog
        open={stageDialogOpen}
        onClose={() => {
          setStageDialogOpen(false);
          setEditingStage(null);
        }}
        onSave={handleSaveStage}
        initialData={
          editingStage
            ? {
                stage_name: editingStage.stage_name,
                stage_number: editingStage.stage_number,
                description: editingStage.description || "",
                amount: editingStage.amount,
                vat_rate: editingStage.vat_rate,
              }
            : null
        }
        nextStageNumber={stages.length + 1}
      />

      <RecordPaymentDialog
        open={recordPaymentDialogOpen}
        onClose={() => {
          setRecordPaymentDialogOpen(false);
          setRecordPaymentStage(null);
        }}
        onSave={handleRecordPayment}
        maxAmount={
          recordPaymentStage
            ? recordPaymentStage.amount_with_vat ||
              recordPaymentStage.amount *
                (1 + (recordPaymentStage.vat_rate || 17) / 100)
            : 0
        }
        stageName={recordPaymentStage?.stage_name || ""}
      />

      <AdditionalPaymentDialog
        open={additionalDialogOpen}
        onClose={() => {
          setAdditionalDialogOpen(false);
          setEditingAdditional(null);
        }}
        onSave={handleSaveAdditional}
        initialData={
          editingAdditional
            ? {
                payment_type: editingAdditional.payment_type,
                description: editingAdditional.description,
                amount: editingAdditional.amount,
                vat_rate: editingAdditional.vat_rate,
                is_paid: editingAdditional.is_paid,
                paid_date:
                  editingAdditional.paid_date ||
                  new Date().toISOString().split("T")[0],
                paid_amount: editingAdditional.paid_amount,
                payment_method: editingAdditional.payment_method,
                paid_by: editingAdditional.paid_by || "",
                payment_reference: editingAdditional.payment_reference || "",
                notes: editingAdditional.notes || "",
              }
            : null
        }
      />
    </div>
  );
}
