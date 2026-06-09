// EmployeeWizard - 6-tab comprehensive employee editor with AI assist
// Replaces the simple EmployeeEditDialog in HRPayroll.tsx
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User, Home, GraduationCap, Briefcase, Landmark, Sparkles,
  Plus, Trash2, AlertTriangle, CheckCircle2, Loader2, X,
} from "lucide-react";
import {
  calcTaxCreditPoints,
  checkEmployeeCompleteness,
  calcTransportByDistance,
} from "@/lib/payrollExtended";
import { useHRAiAssist } from "@/hooks/useHRAiAssist";

const sb = supabase as any;

interface ChildEntry {
  name?: string;
  birth_date?: string;
  has_custody?: boolean;
}

export interface EmployeeFull {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  id_number?: string | null;
  birth_date?: string | null;
  gender?: "male" | "female" | "other" | null;
  marital_status?: "single" | "married" | "divorced" | "widowed" | "separated" | null;
  children_count?: number;
  children_data?: ChildEntry[];
  spouse_works?: boolean | null;
  spouse_id_number?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_zip?: string | null;
  country_of_origin?: string | null;
  aliyah_date?: string | null;
  disability_pct?: number | null;
  academic_degree?: string | null;
  degree_completion_year?: number | null;
  profession_code?: string | null;
  department?: string | null;
  position?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  is_active?: boolean;
  employment_type?: "monthly" | "hourly" | "contractor";
  position_ratio_pct?: number;
  monthly_salary?: number;
  hourly_rate?: number;
  standard_monthly_hours?: number;
  tax_credit_points?: number;
  transport_allowance?: number;
  work_distance_km?: number | null;
  meal_allowance?: number;
  clothing_allowance_annual?: number;
  has_company_car?: boolean;
  company_car_value?: number;
  has_company_phone?: boolean;
  company_phone_value?: number;
  pension_employee_pct?: number;
  pension_employer_pct?: number;
  pension_severance_pct?: number;
  pension_fund_name?: string | null;
  pension_policy_number?: string | null;
  study_fund_employee_pct?: number;
  study_fund_employer_pct?: number;
  study_fund_name?: string | null;
  study_fund_policy_number?: string | null;
  bank_code?: string | null;
  bank_branch?: string | null;
  bank_account_number?: string | null;
  bank_account?: string | null;
  notes?: string | null;
}

function FieldRow({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmployeeWizard({
  employee,
  open,
  onClose,
  onSaved,
}: {
  employee: EmployeeFull | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const { analyzeEmployee, loading: aiLoading } = useHRAiAssist();
  const [tab, setTab] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const [form, setForm] = useState<EmployeeFull>({
    name: "",
    employment_type: "monthly",
    is_active: true,
    standard_monthly_hours: 182,
    tax_credit_points: 2.25,
    pension_employee_pct: 6.0,
    pension_employer_pct: 6.5,
    pension_severance_pct: 6.0,
    study_fund_employee_pct: 0,
    study_fund_employer_pct: 0,
    position_ratio_pct: 100,
    children_data: [],
    ...employee,
  });

  useEffect(() => {
    if (employee) {
      setForm({
        ...employee,
        children_data: Array.isArray(employee.children_data)
          ? employee.children_data
          : [],
      });
    }
  }, [employee]);

  const set = <K extends keyof EmployeeFull>(k: K, v: EmployeeFull[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Auto-calculated tax credit points
  const autoTaxCredits = useMemo(() => {
    return calcTaxCreditPoints({
      gender: form.gender,
      marital_status: form.marital_status,
      children_data: form.children_data,
      aliyah_date: form.aliyah_date,
      disability_pct: form.disability_pct,
      academic_degree: form.academic_degree,
      degree_completion_year: form.degree_completion_year,
    });
  }, [
    form.gender, form.marital_status, form.children_data,
    form.aliyah_date, form.disability_pct,
    form.academic_degree, form.degree_completion_year,
  ]);

  // Auto-calculated transport from km
  const autoTransport = useMemo(
    () => calcTransportByDistance(form.work_distance_km || 0),
    [form.work_distance_km],
  );

  // Completeness check
  const missing = useMemo(() => checkEmployeeCompleteness(form), [form]);
  const missingCritical = missing.filter((m) => m.importance === "required");

  const addChild = () =>
    set("children_data", [
      ...(form.children_data || []),
      { name: "", birth_date: "", has_custody: true },
    ]);

  const updateChild = (idx: number, patch: Partial<ChildEntry>) => {
    const next = [...(form.children_data || [])];
    next[idx] = { ...next[idx], ...patch };
    set("children_data", next);
    set("children_count", next.length);
  };

  const removeChild = (idx: number) => {
    const next = (form.children_data || []).filter((_, i) => i !== idx);
    set("children_data", next);
    set("children_count", next.length);
  };

  const applyAutoTaxCredits = () => {
    set("tax_credit_points", autoTaxCredits.total);
    toast({
      title: "נקודות זיכוי עודכנו",
      description: `${autoTaxCredits.total} נקודות`,
    });
  };

  const applyAutoTransport = () => {
    set("transport_allowance", autoTransport);
    toast({ title: "נסיעות עודכנו", description: `${autoTransport} ₪/חודש` });
  };

  const runAiAnalysis = async () => {
    const result = await analyzeEmployee(form);
    if (result) {
      setAiAnalysis(result);
      setTab("ai");
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast({ title: "שם חובה", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        id_number: form.id_number || null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        marital_status: form.marital_status || null,
        children_count: form.children_count || 0,
        children_data: form.children_data || [],
        spouse_works: form.spouse_works ?? null,
        spouse_id_number: form.spouse_id_number || null,
        address_street: form.address_street || null,
        address_city: form.address_city || null,
        address_zip: form.address_zip || null,
        country_of_origin: form.country_of_origin || null,
        aliyah_date: form.aliyah_date || null,
        disability_pct: form.disability_pct ?? null,
        academic_degree: form.academic_degree || null,
        degree_completion_year: form.degree_completion_year ?? null,
        profession_code: form.profession_code || null,
        department: form.department || null,
        position: form.position || null,
        hire_date: form.hire_date || null,
        termination_date: form.termination_date || null,
        is_active: form.is_active !== false,
        employment_type: form.employment_type || "monthly",
        position_ratio_pct: form.position_ratio_pct ?? 100,
        monthly_salary: Number(form.monthly_salary) || 0,
        hourly_rate: Number(form.hourly_rate) || 0,
        standard_monthly_hours: Number(form.standard_monthly_hours) || 182,
        tax_credit_points: Number(form.tax_credit_points) || 2.25,
        transport_allowance: Number(form.transport_allowance) || 0,
        work_distance_km: form.work_distance_km ?? null,
        meal_allowance: Number(form.meal_allowance) || 0,
        clothing_allowance_annual: Number(form.clothing_allowance_annual) || 0,
        has_company_car: !!form.has_company_car,
        company_car_value: Number(form.company_car_value) || 0,
        has_company_phone: !!form.has_company_phone,
        company_phone_value: Number(form.company_phone_value) || 0,
        pension_employee_pct: Number(form.pension_employee_pct) || 6.0,
        pension_employer_pct: Number(form.pension_employer_pct) || 6.5,
        pension_severance_pct: Number(form.pension_severance_pct) || 6.0,
        pension_fund_name: form.pension_fund_name || null,
        pension_policy_number: form.pension_policy_number || null,
        study_fund_employee_pct: Number(form.study_fund_employee_pct) || 0,
        study_fund_employer_pct: Number(form.study_fund_employer_pct) || 0,
        study_fund_name: form.study_fund_name || null,
        study_fund_policy_number: form.study_fund_policy_number || null,
        bank_code: form.bank_code || null,
        bank_branch: form.bank_branch || null,
        bank_account_number: form.bank_account_number || null,
        bank_account: form.bank_account || null,
        notes: form.notes || null,
      };

      const res = employee?.id
        ? await sb.from("employees").update(payload).eq("id", employee.id)
        : await sb.from("employees").insert(payload);
      if (res.error) throw res.error;

      toast({ title: employee?.id ? "עודכן" : "נוצר", description: form.name });
      onSaved();
    } catch (e: any) {
      toast({
        title: "שגיאה בשמירה",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl max-h-[92vh] p-0 overflow-hidden rtl"
      >
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">
                {employee?.id ? `עריכת עובד: ${employee.name}` : "הוספת עובד חדש"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {missingCritical.length > 0 ? (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    חסרים {missingCritical.length} שדות חובה לתלוש שכר
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    כל שדות החובה מולאו
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runAiAnalysis}
              disabled={aiLoading}
              className="gap-2"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-500" />
              )}
              ניתוח AI
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b px-6 h-auto py-1 gap-1">
            <TabsTrigger value="personal" className="gap-1.5">
              <User className="h-3.5 w-3.5" /> אישי
            </TabsTrigger>
            <TabsTrigger value="address" className="gap-1.5">
              <Home className="h-3.5 w-3.5" /> כתובת
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> השכלה
            </TabsTrigger>
            <TabsTrigger value="job" className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> שכר ועבודה
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-1.5">
              <Landmark className="h-3.5 w-3.5" /> בנק ופנסיה
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> AI
              {aiAnalysis && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  {aiAnalysis.rights_alerts?.length || 0}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] px-6 py-4">
            {/* ============ PERSONAL ============ */}
            <TabsContent value="personal" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldRow label="שם מלא" required>
                  <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
                </FieldRow>
                <FieldRow label="תעודת זהות" required>
                  <Input value={form.id_number || ""} onChange={(e) => set("id_number", e.target.value)} maxLength={9} />
                </FieldRow>
                <FieldRow label="אימייל">
                  <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
                </FieldRow>
                <FieldRow label="טלפון">
                  <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
                </FieldRow>
                <FieldRow label="תאריך לידה" required>
                  <Input type="date" value={form.birth_date || ""} onChange={(e) => set("birth_date", e.target.value)} />
                </FieldRow>
                <FieldRow label="מגדר" hint="משפיע על נק' זיכוי">
                  <Select value={form.gender || ""} onValueChange={(v: any) => set("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">זכר</SelectItem>
                      <SelectItem value="female">נקבה (+0.5 נק')</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="מצב משפחתי">
                  <Select value={form.marital_status || ""} onValueChange={(v: any) => set("marital_status", v)}>
                    <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">רווק/ה</SelectItem>
                      <SelectItem value="married">נשוי/ה</SelectItem>
                      <SelectItem value="divorced">גרוש/ה</SelectItem>
                      <SelectItem value="widowed">אלמן/ה</SelectItem>
                      <SelectItem value="separated">פרוד/ה</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                {form.marital_status === "married" && (
                  <>
                    <FieldRow label='ת"ז בן/בת זוג'>
                      <Input value={form.spouse_id_number || ""} onChange={(e) => set("spouse_id_number", e.target.value)} />
                    </FieldRow>
                    <FieldRow label="בן/בת זוג עובד/ת">
                      <Select value={form.spouse_works == null ? "" : form.spouse_works ? "1" : "0"}
                        onValueChange={(v) => set("spouse_works", v === "1")}>
                        <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">כן</SelectItem>
                          <SelectItem value="0">לא</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                  </>
                )}
              </div>

              {/* Children */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">ילדים ({form.children_data?.length || 0})</Label>
                  <Button size="sm" variant="outline" onClick={addChild}>
                    <Plus className="h-3.5 w-3.5 ml-1" /> הוספת ילד
                  </Button>
                </div>
                {(form.children_data || []).map((child, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label className="text-xs">שם</Label>
                      <Input
                        value={child.name || ""}
                        onChange={(e) => updateChild(idx, { name: e.target.value })}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">תאריך לידה</Label>
                      <Input
                        type="date"
                        value={child.birth_date || ""}
                        onChange={(e) => updateChild(idx, { birth_date: e.target.value })}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">משמורת</Label>
                      <Select
                        value={child.has_custody === false ? "0" : "1"}
                        onValueChange={(v) => updateChild(idx, { has_custody: v === "1" })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">כן</SelectItem>
                          <SelectItem value="0">לא</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeChild(idx)}
                      className="col-span-1 h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {(form.children_data?.length || 0) === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    אין ילדים רשומים
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FieldRow label="אחוז נכות" hint="90%+ = +2 נקודות זיכוי">
                  <Input type="number" min={0} max={100} value={form.disability_pct ?? ""}
                    onChange={(e) => set("disability_pct", e.target.value ? Number(e.target.value) : null)} />
                </FieldRow>
                <FieldRow label="ארץ מוצא">
                  <Input value={form.country_of_origin || ""} onChange={(e) => set("country_of_origin", e.target.value)} />
                </FieldRow>
                <FieldRow label="תאריך עלייה" hint="עולה חדש = נק' זיכוי נוספות">
                  <Input type="date" value={form.aliyah_date || ""} onChange={(e) => set("aliyah_date", e.target.value)} />
                </FieldRow>
              </div>
            </TabsContent>

            {/* ============ ADDRESS ============ */}
            <TabsContent value="address" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldRow label="רחוב ומספר">
                  <Input value={form.address_street || ""} onChange={(e) => set("address_street", e.target.value)} />
                </FieldRow>
                <FieldRow label="עיר">
                  <Input value={form.address_city || ""} onChange={(e) => set("address_city", e.target.value)} />
                </FieldRow>
                <FieldRow label="מיקוד">
                  <Input value={form.address_zip || ""} onChange={(e) => set("address_zip", e.target.value)} />
                </FieldRow>
                <FieldRow label='מרחק לעבודה (ק"מ)' hint="לחישוב אוטומטי של דמי נסיעה">
                  <div className="flex gap-2">
                    <Input type="number" step="0.1" value={form.work_distance_km ?? ""}
                      onChange={(e) => set("work_distance_km", e.target.value ? Number(e.target.value) : null)} />
                    {autoTransport > 0 && (
                      <Button variant="outline" size="sm" onClick={applyAutoTransport}>
                        החל {autoTransport}₪
                      </Button>
                    )}
                  </div>
                </FieldRow>
              </div>
            </TabsContent>

            {/* ============ EDUCATION ============ */}
            <TabsContent value="education" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldRow label="תואר אקדמי" hint="ראשון/שני/דוקטור - 3 שנים אחרי סיום = +נקודה">
                  <Select value={form.academic_degree || ""} onValueChange={(v) => set("academic_degree", v)}>
                    <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ללא</SelectItem>
                      <SelectItem value="תואר ראשון">תואר ראשון (BSc/BA)</SelectItem>
                      <SelectItem value="תואר שני">תואר שני (MSc/MA)</SelectItem>
                      <SelectItem value="דוקטורט">דוקטורט (PhD)</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="שנת סיום תואר">
                  <Input type="number" min={1960} max={new Date().getFullYear()}
                    value={form.degree_completion_year ?? ""}
                    onChange={(e) => set("degree_completion_year", e.target.value ? Number(e.target.value) : null)} />
                </FieldRow>
                <FieldRow label="קוד מקצוע">
                  <Input value={form.profession_code || ""} onChange={(e) => set("profession_code", e.target.value)} />
                </FieldRow>
              </div>
            </TabsContent>

            {/* ============ JOB & SALARY ============ */}
            <TabsContent value="job" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldRow label="מחלקה">
                  <Input value={form.department || ""} onChange={(e) => set("department", e.target.value)} />
                </FieldRow>
                <FieldRow label="תפקיד">
                  <Input value={form.position || ""} onChange={(e) => set("position", e.target.value)} />
                </FieldRow>
                <FieldRow label="תאריך תחילת עבודה" required>
                  <Input type="date" value={form.hire_date || ""} onChange={(e) => set("hire_date", e.target.value)} />
                </FieldRow>
                <FieldRow label="תאריך סיום עבודה">
                  <Input type="date" value={form.termination_date || ""} onChange={(e) => set("termination_date", e.target.value)} />
                </FieldRow>
                <FieldRow label="סוג העסקה">
                  <Select value={form.employment_type || "monthly"} onValueChange={(v: any) => set("employment_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">חודשי</SelectItem>
                      <SelectItem value="hourly">שעתי</SelectItem>
                      <SelectItem value="contractor">קבלן (חשבונית)</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="יחס משרה (%)">
                  <Input type="number" min={0} max={100} value={form.position_ratio_pct ?? 100}
                    onChange={(e) => set("position_ratio_pct", Number(e.target.value))} />
                </FieldRow>
                <FieldRow label="שכר חודשי (₪)">
                  <Input type="number" value={form.monthly_salary ?? 0}
                    onChange={(e) => set("monthly_salary", Number(e.target.value))} />
                </FieldRow>
                <FieldRow label="תעריף שעתי (₪)">
                  <Input type="number" value={form.hourly_rate ?? 0}
                    onChange={(e) => set("hourly_rate", Number(e.target.value))} />
                </FieldRow>
                <FieldRow label="שעות חודשיות תקניות">
                  <Input type="number" value={form.standard_monthly_hours ?? 182}
                    onChange={(e) => set("standard_monthly_hours", Number(e.target.value))} />
                </FieldRow>

                <FieldRow
                  label="נקודות זיכוי"
                  hint={`חישוב אוטו': ${autoTaxCredits.total} נק' (${autoTaxCredits.items.map((i) => i.label).join(", ")})`}
                >
                  <div className="flex gap-2">
                    <Input type="number" step="0.25" value={form.tax_credit_points ?? 2.25}
                      onChange={(e) => set("tax_credit_points", Number(e.target.value))} />
                    <Button variant="outline" size="sm" onClick={applyAutoTaxCredits}>
                      החל {autoTaxCredits.total}
                    </Button>
                  </div>
                </FieldRow>

                <FieldRow label="החזר נסיעות (₪/חודש)">
                  <Input type="number" value={form.transport_allowance ?? 0}
                    onChange={(e) => set("transport_allowance", Number(e.target.value))} />
                </FieldRow>
                <FieldRow label="ארוחות (₪/חודש)">
                  <Input type="number" value={form.meal_allowance ?? 0}
                    onChange={(e) => set("meal_allowance", Number(e.target.value))} />
                </FieldRow>
                <FieldRow label="ביגוד שנתי (₪)">
                  <Input type="number" value={form.clothing_allowance_annual ?? 0}
                    onChange={(e) => set("clothing_allowance_annual", Number(e.target.value))} />
                </FieldRow>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <h4 className="font-semibold text-sm">הטבות נוספות (שווי לצורכי מס)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldRow label="רכב צמוד">
                    <div className="flex items-center gap-2">
                      <Select value={form.has_company_car ? "1" : "0"}
                        onValueChange={(v) => set("has_company_car", v === "1")}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">לא</SelectItem>
                          <SelectItem value="1">כן</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.has_company_car && (
                        <Input type="number" placeholder="שווי חודשי" value={form.company_car_value ?? 0}
                          onChange={(e) => set("company_car_value", Number(e.target.value))} />
                      )}
                    </div>
                  </FieldRow>
                  <FieldRow label="טלפון נייד">
                    <div className="flex items-center gap-2">
                      <Select value={form.has_company_phone ? "1" : "0"}
                        onValueChange={(v) => set("has_company_phone", v === "1")}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">לא</SelectItem>
                          <SelectItem value="1">כן</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.has_company_phone && (
                        <Input type="number" placeholder="שווי חודשי" value={form.company_phone_value ?? 0}
                          onChange={(e) => set("company_phone_value", Number(e.target.value))} />
                      )}
                    </div>
                  </FieldRow>
                </div>
              </div>
            </TabsContent>

            {/* ============ BANK & PENSION ============ */}
            <TabsContent value="bank" className="space-y-4 mt-0">
              <div className="border rounded-lg p-3 space-y-3">
                <h4 className="font-semibold text-sm">חשבון בנק</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FieldRow label="קוד בנק">
                    <Input value={form.bank_code || ""} onChange={(e) => set("bank_code", e.target.value)} />
                  </FieldRow>
                  <FieldRow label="סניף">
                    <Input value={form.bank_branch || ""} onChange={(e) => set("bank_branch", e.target.value)} />
                  </FieldRow>
                  <FieldRow label="מס' חשבון">
                    <Input value={form.bank_account_number || ""} onChange={(e) => set("bank_account_number", e.target.value)} />
                  </FieldRow>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <h4 className="font-semibold text-sm">פנסיה</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldRow label="שם קרן פנסיה">
                    <Input value={form.pension_fund_name || ""} onChange={(e) => set("pension_fund_name", e.target.value)} />
                  </FieldRow>
                  <FieldRow label="מס' פוליסה">
                    <Input value={form.pension_policy_number || ""} onChange={(e) => set("pension_policy_number", e.target.value)} />
                  </FieldRow>
                  <FieldRow label="% עובד">
                    <Input type="number" step="0.1" value={form.pension_employee_pct ?? 6.0}
                      onChange={(e) => set("pension_employee_pct", Number(e.target.value))} />
                  </FieldRow>
                  <FieldRow label="% מעביד תגמולים">
                    <Input type="number" step="0.1" value={form.pension_employer_pct ?? 6.5}
                      onChange={(e) => set("pension_employer_pct", Number(e.target.value))} />
                  </FieldRow>
                  <FieldRow label="% פיצויים">
                    <Input type="number" step="0.1" value={form.pension_severance_pct ?? 6.0}
                      onChange={(e) => set("pension_severance_pct", Number(e.target.value))} />
                  </FieldRow>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <h4 className="font-semibold text-sm">קרן השתלמות</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldRow label="שם קרן">
                    <Input value={form.study_fund_name || ""} onChange={(e) => set("study_fund_name", e.target.value)} />
                  </FieldRow>
                  <FieldRow label="מס' פוליסה">
                    <Input value={form.study_fund_policy_number || ""} onChange={(e) => set("study_fund_policy_number", e.target.value)} />
                  </FieldRow>
                  <FieldRow label="% עובד">
                    <Input type="number" step="0.1" value={form.study_fund_employee_pct ?? 0}
                      onChange={(e) => set("study_fund_employee_pct", Number(e.target.value))} />
                  </FieldRow>
                  <FieldRow label="% מעביד">
                    <Input type="number" step="0.1" value={form.study_fund_employer_pct ?? 0}
                      onChange={(e) => set("study_fund_employer_pct", Number(e.target.value))} />
                  </FieldRow>
                </div>
              </div>

              <FieldRow label="הערות">
                <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={3} />
              </FieldRow>
            </TabsContent>

            {/* ============ AI ANALYSIS ============ */}
            <TabsContent value="ai" className="space-y-4 mt-0">
              {!aiAnalysis && !aiLoading && (
                <div className="text-center py-8 space-y-3">
                  <Sparkles className="h-12 w-12 text-amber-500 mx-auto" />
                  <h3 className="font-semibold">עוזר AI לפרופיל עובד</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    ה-AI יבדוק את הפרופיל, יזהה שדות חסרים, יציע ערכים מתאימים,
                    ויתריע על זכויות שמגיעות לעובד (הבראה, נק' זיכוי וכו').
                  </p>
                  <Button onClick={runAiAnalysis} className="gap-2">
                    <Sparkles className="h-4 w-4" /> הפעל ניתוח
                  </Button>
                </div>
              )}

              {aiLoading && (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500" />
                  <p className="text-sm text-muted-foreground mt-3">מנתח...</p>
                </div>
              )}

              {aiAnalysis && (
                <div className="space-y-4">
                  {aiAnalysis.summary && (
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <p className="text-sm">{aiAnalysis.summary}</p>
                    </div>
                  )}

                  {aiAnalysis.rights_alerts?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        זכויות שמגיעות לעובד
                      </h4>
                      <ul className="space-y-1.5">
                        {aiAnalysis.rights_alerts.map((alert: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded">
                            <span className="text-emerald-600">✓</span>
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysis.suggestions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">הצעות AI</h4>
                      <ul className="space-y-2">
                        {aiAnalysis.suggestions.map((s: any, i: number) => (
                          <li key={i} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{s.label || s.field}</span>
                              <Badge variant={s.confidence === "high" ? "default" : "secondary"} className="text-[10px]">
                                {s.confidence}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{s.reason}</p>
                            <p className="text-xs mt-1">
                              ערך מוצע: <span className="font-mono">{String(s.suggested_value)}</span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {missing.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        שדות חסרים ({missing.length})
                      </h4>
                      <ul className="space-y-1">
                        {missing.map((m, i) => (
                          <li key={i} className="text-xs flex items-center gap-2 p-1.5">
                            <Badge variant={m.importance === "required" ? "destructive" : "outline"} className="text-[10px]">
                              {m.importance === "required" ? "חובה" : m.importance === "important" ? "חשוב" : "אופציונלי"}
                            </Badge>
                            <span className="font-medium">{m.label}</span>
                            <span className="text-muted-foreground">- {m.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 ml-1" /> ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : null}
            שמירה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
