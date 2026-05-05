// HR & Payroll — manage hire dates, leaves (vacation/sick/etc.),
// pension contributions and approximate monthly payroll.
// Data persists in Supabase: employees / employee_leaves / payroll_runs.
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, CalendarDays, Coins, FileSpreadsheet, Plus,
  Edit2, Trash2, Download, AlertTriangle, CheckCircle2,
} from "lucide-react";
import {
  annualLeaveEntitlement, yearsOfService, calcPayroll,
  workingDaysBetween, fmtNIS, LEAVE_TYPE_LABELS,
} from "@/lib/payroll";

// --- Types (loose — generated types may not include new tables yet) ----------
interface Employee {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  termination_date: string | null;
  is_active: boolean;
  employment_type: "monthly" | "hourly" | "contractor";
  monthly_salary: number;
  hourly_rate: number;
  standard_monthly_hours: number;
  tax_credit_points: number;
  transport_allowance: number;
  meal_allowance: number;
  pension_employee_pct: number;
  pension_employer_pct: number;
  pension_severance_pct: number;
  study_fund_employee_pct: number;
  study_fund_employer_pct: number;
  bank_account: string | null;
  id_number: string | null;
  birth_date: string | null;
  notes: string | null;
}

interface Leave {
  id: string;
  employee_id: string;
  leave_type: keyof typeof LEAVE_TYPE_LABELS;
  start_date: string;
  end_date: string;
  days: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  paid: boolean;
  notes: string | null;
}

interface PayrollRun {
  id: string;
  employee_id: string;
  period_year: number;
  period_month: number;
  worked_hours: number;
  overtime_hours_125: number;
  overtime_hours_150: number;
  vacation_days: number;
  sick_days: number;
  base_pay: number;
  overtime_pay: number;
  transport: number;
  meal: number;
  other_additions: number;
  gross_total: number;
  pensionable_base: number;
  pension_employee: number;
  pension_employer: number;
  pension_severance: number;
  income_tax: number;
  national_insurance: number;
  health_tax: number;
  net_total: number;
  employer_total_cost: number;
  status: "draft" | "final" | "paid" | "cancelled";
  notes: string | null;
}

const sb = supabase as any;

// =============================================================================
export default function HRPayroll() {
  const { isAdmin, isManager, isSuperManager, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const allowed = isAdmin || isManager || isSuperManager;

  const [activeTab, setActiveTab] = useSyncedSetting<string>({
    key: "hr-payroll-tab", defaultValue: "overview",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !allowed) navigate("/");
  }, [isLoading, allowed, navigate]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, leaveRes, payRes] = await Promise.all([
        sb.from("employees").select("*").order("name"),
        sb.from("employee_leaves").select("*").order("start_date", { ascending: false }),
        sb.from("payroll_runs").select("*")
          .order("period_year", { ascending: false })
          .order("period_month", { ascending: false }),
      ]);
      if (empRes.error)   throw empRes.error;
      if (leaveRes.error) throw leaveRes.error;
      if (payRes.error)   throw payRes.error;
      setEmployees(empRes.data || []);
      setLeaves(leaveRes.data || []);
      setPayrollRuns(payRes.data || []);
    } catch (e: any) {
      toast({ title: "שגיאה בטעינה", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { if (allowed) refresh(); }, [allowed, refresh]);

  if (isLoading) return <AppLayout><div className="p-6">טוען...</div></AppLayout>;
  if (!allowed) return null;

  return (
    <AppLayout>
      <div className="container mx-auto p-4 space-y-4" dir="rtl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Coins className="h-6 w-6 text-primary" /> משאבי אנוש ושכר
            </h1>
            <p className="text-sm text-muted-foreground">
              ניהול עובדים, חופשות, פנסיה וחישובי שכר חודשיים (משוער).
            </p>
          </div>
          <Button onClick={refresh} disabled={loading} variant="outline">
            רענן נתונים
          </Button>
        </div>

        <div className="rounded-md border bg-amber-50 dark:bg-amber-950/30 border-amber-300 p-3 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <strong>הערה חשובה:</strong> חישובי השכר, המס וההפרשות הם <u>משוערים</u>{" "}
            ומבוססים על ערכי 2026 כברירת מחדל. אינם מהווים תחליף לתוכנת שכר רשמית
            או רואה חשבון. לפני תשלום בפועל יש לאמת מול חשב שכר מורשה.
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="overview">סקירה</TabsTrigger>
            <TabsTrigger value="employees">עובדים</TabsTrigger>
            <TabsTrigger value="leaves">חופשות</TabsTrigger>
            <TabsTrigger value="payroll">שכר ופנסיה</TabsTrigger>
            <TabsTrigger value="reports">דוחות</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab employees={employees} leaves={leaves} payrollRuns={payrollRuns} />
          </TabsContent>
          <TabsContent value="employees" className="space-y-4">
            <EmployeesTab employees={employees} onChanged={refresh} />
          </TabsContent>
          <TabsContent value="leaves" className="space-y-4">
            <LeavesTab employees={employees} leaves={leaves} onChanged={refresh} />
          </TabsContent>
          <TabsContent value="payroll" className="space-y-4">
            <PayrollTab employees={employees} runs={payrollRuns} onChanged={refresh} />
          </TabsContent>
          <TabsContent value="reports" className="space-y-4">
            <ReportsTab employees={employees} leaves={leaves} runs={payrollRuns} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// =============================================================================
// Overview tab
// =============================================================================
function OverviewTab({ employees, leaves, payrollRuns }: {
  employees: Employee[]; leaves: Leave[]; payrollRuns: PayrollRun[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const onLeaveToday = leaves.filter(l =>
    l.status === "approved" && l.start_date <= today && l.end_date >= today
  );
  const activeEmployees = employees.filter(e => e.is_active);

  // Forecast monthly cost = sum of monthly_salary*(1+~25% employer) for monthly + last run for hourly
  const monthlyForecast = activeEmployees.reduce((s, e) => {
    if (e.employment_type === "monthly") {
      const base = Number(e.monthly_salary) || 0;
      return s + base * 1.25; // approx employer cost
    }
    return s;
  }, 0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const finalizedThisMonth = payrollRuns.filter(
    r => r.period_year === currentYear && r.period_month === currentMonth && r.status !== "draft"
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard icon={<Users className="h-5 w-5" />} title="עובדים פעילים" value={String(activeEmployees.length)} sub={`מתוך ${employees.length}`} />
      <SummaryCard icon={<CalendarDays className="h-5 w-5" />} title="בחופשה היום" value={String(onLeaveToday.length)} sub="מאושרים בלבד" />
      <SummaryCard icon={<Coins className="h-5 w-5" />} title="עלות מעביד צפויה" value={fmtNIS(monthlyForecast)} sub="חודשיים, כולל הפרשות" />
      <SummaryCard icon={<FileSpreadsheet className="h-5 w-5" />} title="תלושים סופיים החודש" value={String(finalizedThisMonth)} sub={`${currentMonth}/${currentYear}`} />
    </div>
  );
}

function SummaryCard({ icon, title, value, sub }: {
  icon: React.ReactNode; title: string; value: string; sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}{title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Employees tab — extended HR fields
// =============================================================================
function EmployeesTab({ employees, onChanged }: {
  employees: Employee[]; onChanged: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>עובדים</CardTitle>
          <CardDescription>פרטים מלאים: ותק, שכר, תנאים והפרשות.</CardDescription>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 ml-1" /> הוסף עובד
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>תפקיד</TableHead>
                <TableHead>סוג העסקה</TableHead>
                <TableHead>תחילת עבודה</TableHead>
                <TableHead>ותק</TableHead>
                <TableHead>שכר חודשי / שעתי</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(e => {
                const yrs = e.hire_date ? yearsOfService(e.hire_date) : 0;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.position || "—"}</TableCell>
                    <TableCell>
                      {e.employment_type === "monthly" ? "חודשי" :
                       e.employment_type === "hourly"  ? "שעתי" : "קבלן"}
                    </TableCell>
                    <TableCell>{e.hire_date || "—"}</TableCell>
                    <TableCell>{e.hire_date ? `${yrs} שנים` : "—"}</TableCell>
                    <TableCell>
                      {e.employment_type === "monthly"
                        ? fmtNIS(Number(e.monthly_salary) || 0)
                        : `${fmtNIS(Number(e.hourly_rate) || 0)} / ש"ע`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.is_active ? "default" : "secondary"}>
                        {e.is_active ? "פעיל" : "לא פעיל"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(e)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    אין עובדים. לחץ "הוסף עובד" כדי להתחיל.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {(editing || creating) && (
        <EmployeeEditDialog
          employee={editing}
          open={true}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); onChanged(); }}
        />
      )}
    </Card>
  );
}

// -----------------------------------------------------------------------------
function EmployeeEditDialog({ employee, open, onClose, onSaved }: {
  employee: Employee | null; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Employee>>(employee || {
    name: "", email: "", phone: "", position: "", department: "",
    employment_type: "monthly", monthly_salary: 0, hourly_rate: 0,
    standard_monthly_hours: 182, tax_credit_points: 2.25,
    transport_allowance: 0, meal_allowance: 0,
    pension_employee_pct: 6.0, pension_employer_pct: 6.5, pension_severance_pct: 6.0,
    study_fund_employee_pct: 0, study_fund_employer_pct: 0,
    is_active: true, hire_date: null,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Employee>(k: K, v: Employee[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast({ title: "שם חובה", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      // Convert empty strings to null for date columns
      if (!payload.hire_date) payload.hire_date = null;
      if (!payload.birth_date) payload.birth_date = null;
      if (!payload.termination_date) payload.termination_date = null;

      let res;
      if (employee?.id) {
        res = await sb.from("employees").update(payload).eq("id", employee.id);
      } else {
        res = await sb.from("employees").insert(payload);
      }
      if (res.error) throw res.error;
      toast({ title: employee?.id ? "עודכן" : "נוצר", description: form.name });
      onSaved();
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{employee ? `עריכת עובד: ${employee.name}` : "הוספת עובד"}</DialogTitle>
          <DialogDescription>פרטי בסיס, שכר, פנסיה ומיסוי.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="שם מלא *">
            <Input value={form.name || ""} onChange={e => set("name", e.target.value)} />
          </Field>
          <Field label="ת.ז.">
            <Input value={form.id_number || ""} onChange={e => set("id_number", e.target.value)} />
          </Field>
          <Field label="אימייל">
            <Input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} />
          </Field>
          <Field label="טלפון">
            <Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
          </Field>
          <Field label="תפקיד">
            <Input value={form.position || ""} onChange={e => set("position", e.target.value)} />
          </Field>
          <Field label="מחלקה">
            <Input value={form.department || ""} onChange={e => set("department", e.target.value)} />
          </Field>
          <Field label="תאריך תחילת עבודה">
            <Input type="date" value={form.hire_date || ""} onChange={e => set("hire_date", e.target.value)} />
          </Field>
          <Field label="תאריך לידה">
            <Input type="date" value={form.birth_date || ""} onChange={e => set("birth_date", e.target.value)} />
          </Field>

          <Field label="סוג העסקה">
            <Select value={form.employment_type || "monthly"}
                    onValueChange={(v: any) => set("employment_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">חודשי</SelectItem>
                <SelectItem value="hourly">שעתי</SelectItem>
                <SelectItem value="contractor">קבלן (חשבונית)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="סטטוס">
            <Select value={form.is_active ? "1" : "0"}
                    onValueChange={(v) => set("is_active", v === "1")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">פעיל</SelectItem>
                <SelectItem value="0">לא פעיל</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="שכר חודשי (₪)">
            <Input type="number" value={form.monthly_salary ?? 0}
                   onChange={e => set("monthly_salary", Number(e.target.value))} />
          </Field>
          <Field label='תעריף שעתי (₪/ש"ע)'>
            <Input type="number" value={form.hourly_rate ?? 0}
                   onChange={e => set("hourly_rate", Number(e.target.value))} />
          </Field>
          <Field label="שעות חודשיות רגילות">
            <Input type="number" value={form.standard_monthly_hours ?? 182}
                   onChange={e => set("standard_monthly_hours", Number(e.target.value))} />
          </Field>
          <Field label="נקודות זיכוי">
            <Input type="number" step="0.25" value={form.tax_credit_points ?? 2.25}
                   onChange={e => set("tax_credit_points", Number(e.target.value))} />
          </Field>
          <Field label="החזר נסיעות (₪/חודש)">
            <Input type="number" value={form.transport_allowance ?? 0}
                   onChange={e => set("transport_allowance", Number(e.target.value))} />
          </Field>
          <Field label="ארוחות (₪/חודש)">
            <Input type="number" value={form.meal_allowance ?? 0}
                   onChange={e => set("meal_allowance", Number(e.target.value))} />
          </Field>

          <div className="col-span-1 md:col-span-2 mt-2">
            <h4 className="font-semibold text-sm mb-1">הפרשות פנסיה (%)</h4>
          </div>
          <Field label="עובד">
            <Input type="number" step="0.1" value={form.pension_employee_pct ?? 6.0}
                   onChange={e => set("pension_employee_pct", Number(e.target.value))} />
          </Field>
          <Field label="מעביד תגמולים">
            <Input type="number" step="0.1" value={form.pension_employer_pct ?? 6.5}
                   onChange={e => set("pension_employer_pct", Number(e.target.value))} />
          </Field>
          <Field label="פיצויים">
            <Input type="number" step="0.1" value={form.pension_severance_pct ?? 6.0}
                   onChange={e => set("pension_severance_pct", Number(e.target.value))} />
          </Field>
          <Field label="קרן השתלמות עובד">
            <Input type="number" step="0.1" value={form.study_fund_employee_pct ?? 0}
                   onChange={e => set("study_fund_employee_pct", Number(e.target.value))} />
          </Field>
          <Field label="קרן השתלמות מעביד">
            <Input type="number" step="0.1" value={form.study_fund_employer_pct ?? 0}
                   onChange={e => set("study_fund_employer_pct", Number(e.target.value))} />
          </Field>
          <Field label="חשבון בנק">
            <Input value={form.bank_account || ""} onChange={e => set("bank_account", e.target.value)} />
          </Field>

          <div className="col-span-1 md:col-span-2">
            <Field label="הערות">
              <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "שומר..." : "שמירה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

// =============================================================================
// Leaves tab
// =============================================================================
function LeavesTab({ employees, leaves, onChanged }: {
  employees: Employee[]; leaves: Leave[]; onChanged: () => void;
}) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const empMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const balances = useMemo(() => employees.map(e => {
    const yrs = yearsOfService(e.hire_date);
    const ent = annualLeaveEntitlement(yrs);
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const used = leaves
      .filter(l => l.employee_id === e.id && l.status === "approved" &&
                   l.leave_type === "vacation" && l.start_date >= yearStart)
      .reduce((s, l) => s + Number(l.days), 0);
    const usedSick = leaves
      .filter(l => l.employee_id === e.id && l.status === "approved" &&
                   l.leave_type === "sick" && l.start_date >= yearStart)
      .reduce((s, l) => s + Number(l.days), 0);
    return { employee: e, yrs, ent, used, remaining: ent - used, usedSick };
  }), [employees, leaves]);

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק רשומת חופשה?")) return;
    const { error } = await sb.from("employee_leaves").delete().eq("id", id);
    if (error) toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    else { toast({ title: "נמחק" }); onChanged(); }
  };

  const handleStatus = async (id: string, status: Leave["status"]) => {
    const { error } = await sb.from("employee_leaves")
      .update({ status, approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    else { toast({ title: "עודכן" }); onChanged(); }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>יתרות חופשה שנתיות</CardTitle>
          <CardDescription>זכאות מחושבת לפי חוק חופשה שנתית וותק עובד.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>עובד</TableHead>
                  <TableHead>ותק</TableHead>
                  <TableHead>זכאות שנתית</TableHead>
                  <TableHead>נוצלו (חופשה)</TableHead>
                  <TableHead>יתרה</TableHead>
                  <TableHead>ימי מחלה (השנה)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map(b => (
                  <TableRow key={b.employee.id}>
                    <TableCell className="font-medium">{b.employee.name}</TableCell>
                    <TableCell>{b.yrs} שנים</TableCell>
                    <TableCell>{b.ent}</TableCell>
                    <TableCell>{b.used}</TableCell>
                    <TableCell>
                      <Badge variant={b.remaining < 0 ? "destructive" : b.remaining < 5 ? "secondary" : "default"}>
                        {b.remaining}
                      </Badge>
                    </TableCell>
                    <TableCell>{b.usedSick}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>היסטוריית חופשות</CardTitle>
            <CardDescription>חופשה, מחלה, מילואים, חופשת לידה ועוד.</CardDescription>
          </div>
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 ml-1" /> הוסף חופשה
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>עובד</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>מתאריך</TableHead>
                  <TableHead>עד תאריך</TableHead>
                  <TableHead>ימים</TableHead>
                  <TableHead>בתשלום</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>הערות</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{empMap.get(l.employee_id)?.name || "—"}</TableCell>
                    <TableCell>{LEAVE_TYPE_LABELS[l.leave_type] || l.leave_type}</TableCell>
                    <TableCell>{l.start_date}</TableCell>
                    <TableCell>{l.end_date}</TableCell>
                    <TableCell>{l.days}</TableCell>
                    <TableCell>{l.paid ? "כן" : "לא"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        l.status === "approved" ? "default" :
                        l.status === "pending"  ? "secondary" :
                        "destructive"
                      }>
                        {l.status === "approved" ? "מאושר" :
                         l.status === "pending"  ? "ממתין" :
                         l.status === "rejected" ? "נדחה" : "בוטל"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{l.notes || "—"}</TableCell>
                    <TableCell className="flex gap-1">
                      {l.status === "pending" && (
                        <Button size="sm" variant="ghost" onClick={() => handleStatus(l.id, "approved")} title="אשר">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(l.id)} title="מחק">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {leaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      אין רשומות חופשה.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {adding && (
        <LeaveAddDialog
          employees={employees}
          open={adding}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); onChanged(); }}
        />
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
function LeaveAddDialog({ employees, open, onClose, onSaved }: {
  employees: Employee[]; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [type, setType] = useState<Leave["leave_type"]>("vacation");
  const [start, setStart] = useState(today);
  const [end, setEnd]     = useState(today);
  const [days, setDays]   = useState(1);
  const [paid, setPaid]   = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoCalc, setAutoCalc] = useState(true);

  useEffect(() => {
    if (autoCalc && start && end) setDays(workingDaysBetween(start, end));
  }, [autoCalc, start, end]);

  const handleSave = async () => {
    if (!employeeId) { toast({ title: "בחר עובד", variant: "destructive" }); return; }
    if (!start || !end || end < start) {
      toast({ title: "תאריכים לא תקינים", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await sb.from("employee_leaves").insert({
        employee_id: employeeId,
        leave_type: type,
        start_date: start,
        end_date: end,
        days,
        paid,
        notes,
        status: "approved",
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
        created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: "נשמר" });
      onSaved();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת חופשה</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="עובד">
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {employees.map(e =>
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </Field>
          <Field label="סוג">
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) =>
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="מתאריך">
              <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
            </Field>
            <Field label="עד תאריך">
              <Input type="date" value={end} onChange={e => setEnd(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Field label="ימים">
              <Input type="number" step="0.5" value={days}
                     onChange={e => { setAutoCalc(false); setDays(Number(e.target.value)); }} />
            </Field>
            <label className="flex items-center gap-2 text-sm mt-5">
              <input type="checkbox" checked={autoCalc}
                     onChange={e => setAutoCalc(e.target.checked)} />
              חישוב אוטומטי (ימי עבודה)
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} />
            בתשלום
          </label>
          <Field label="הערות">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "שומר..." : "שמירה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Payroll tab — per-employee monthly calculator
// =============================================================================
function PayrollTab({ employees, runs, onChanged }: {
  employees: Employee[]; runs: PayrollRun[]; onChanged: () => void;
}) {
  const { toast } = useToast();
  const now = new Date();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [workedHours, setWorkedHours] = useState<number>(182);
  const [ot125, setOt125] = useState<number>(0);
  const [ot150, setOt150] = useState<number>(0);
  const [otherAdditions, setOtherAdditions] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);

  useEffect(() => {
    if (!employeeId && employees[0]) setEmployeeId(employees[0].id);
  }, [employees, employeeId]);

  const emp = employees.find(e => e.id === employeeId);

  const calc = useMemo(() => {
    if (!emp) return null;
    const basePay = emp.employment_type === "monthly"
      ? Number(emp.monthly_salary) || 0
      : (Number(emp.hourly_rate) || 0) * workedHours;
    return calcPayroll({
      basePay,
      hourlyRate: Number(emp.hourly_rate) || undefined,
      overtime125Hours: ot125,
      overtime150Hours: ot150,
      transport: Number(emp.transport_allowance) || 0,
      meal:      Number(emp.meal_allowance) || 0,
      otherAdditions,
      otherDeductions,
      pensionEmployeePct:  Number(emp.pension_employee_pct),
      pensionEmployerPct:  Number(emp.pension_employer_pct),
      pensionSeverancePct: Number(emp.pension_severance_pct),
      studyEmployeePct:    Number(emp.study_fund_employee_pct),
      studyEmployerPct:    Number(emp.study_fund_employer_pct),
      taxCreditPoints:     Number(emp.tax_credit_points),
    });
  }, [emp, workedHours, ot125, ot150, otherAdditions, otherDeductions]);

  // Pull worked hours from attendance_records for the selected month
  const fetchHoursFromAttendance = async () => {
    if (!emp?.user_id) {
      toast({ title: "אין user_id מקושר", description: "לא ניתן למשוך נוכחות", variant: "destructive" });
      return;
    }
    setLoadingHours(true);
    try {
      const from = new Date(year, month - 1, 1).toISOString();
      const to   = new Date(year, month, 0, 23, 59, 59).toISOString();
      const { data, error } = await sb.from("attendance_records")
        .select("duration_minutes")
        .eq("user_id", emp.user_id)
        .gte("clock_in", from)
        .lte("clock_in", to)
        .not("clock_out", "is", null);
      if (error) throw error;
      const totalMin = (data || []).reduce((s: number, r: any) => s + (r.duration_minutes || 0), 0);
      setWorkedHours(Math.round((totalMin / 60) * 10) / 10);
      toast({ title: "נטען", description: `${Math.round(totalMin / 60)} שעות מנוכחות` });
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally { setLoadingHours(false); }
  };

  const handleSaveRun = async (status: "draft" | "final") => {
    if (!emp || !calc) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        employee_id: emp.id,
        period_year: year,
        period_month: month,
        worked_hours: workedHours,
        overtime_hours_125: ot125,
        overtime_hours_150: ot150,
        base_pay: calc.base_pay,
        overtime_pay: calc.overtime_pay,
        transport: calc.transport,
        meal: calc.meal,
        other_additions: calc.other_additions,
        gross_total: calc.gross_total,
        pensionable_base: calc.pensionable_base,
        pension_employee:  calc.pension.employee,
        pension_employer:  calc.pension.employer,
        pension_severance: calc.pension.severance,
        study_fund_employee: calc.pension.study_employee,
        study_fund_employer: calc.pension.study_employer,
        income_tax: calc.income_tax,
        national_insurance: calc.national_insurance,
        health_tax: calc.health_tax,
        other_deductions: calc.other_deductions,
        net_total: calc.net_total,
        employer_total_cost: calc.employer_total_cost,
        status,
        created_by: user?.id || null,
        calculation_meta: { computed_at: new Date().toISOString() },
      };
      const { error } = await sb.from("payroll_runs")
        .upsert(payload, { onConflict: "employee_id,period_year,period_month" });
      if (error) throw error;
      toast({ title: status === "final" ? "תלוש סופי נשמר" : "טיוטה נשמרה" });
      onChanged();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>חישוב שכר חודשי</CardTitle>
          <CardDescription>בחר עובד וחודש לחישוב משוער של ברוטו, נטו והפרשות.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="עובד">
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {employees.filter(e => e.is_active).map(e =>
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="שנה">
              <Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
            </Field>
            <Field label="חודש">
              <Input type="number" min={1} max={12} value={month}
                     onChange={e => setMonth(Number(e.target.value))} />
            </Field>
          </div>
          <div className="flex items-end gap-2">
            <Field label='שעות עבודה (לעובד שעתי / שע"נ)'>
              <Input type="number" step="0.5" value={workedHours}
                     onChange={e => setWorkedHours(Number(e.target.value))} />
            </Field>
            <Button variant="outline" onClick={fetchHoursFromAttendance} disabled={loadingHours}>
              {loadingHours ? "..." : "משוך מנוכחות"}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label='שעות נוספות 125%'>
              <Input type="number" step="0.5" value={ot125}
                     onChange={e => setOt125(Number(e.target.value))} />
            </Field>
            <Field label='שעות נוספות 150%'>
              <Input type="number" step="0.5" value={ot150}
                     onChange={e => setOt150(Number(e.target.value))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="תוספות נוספות (₪)">
              <Input type="number" value={otherAdditions}
                     onChange={e => setOtherAdditions(Number(e.target.value))} />
            </Field>
            <Field label="ניכויים נוספים (₪)">
              <Input type="number" value={otherDeductions}
                     onChange={e => setOtherDeductions(Number(e.target.value))} />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => handleSaveRun("draft")} disabled={saving} variant="outline">
              שמור כטיוטה
            </Button>
            <Button onClick={() => handleSaveRun("final")} disabled={saving}>
              שמור תלוש סופי
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>תוצאת חישוב</CardTitle>
          <CardDescription>
            {emp ? `${emp.name} – ${month}/${year}` : "בחר עובד"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calc && emp ? (
            <div className="space-y-1 text-sm">
              <Row label='שכר בסיס' value={fmtNIS(calc.base_pay)} />
              <Row label='שעות נוספות' value={fmtNIS(calc.overtime_pay)} />
              <Row label='נסיעות' value={fmtNIS(calc.transport)} />
              <Row label='ארוחות' value={fmtNIS(calc.meal)} />
              <Row label='תוספות נוספות' value={fmtNIS(calc.other_additions)} />
              <Row label='ברוטו לתשלום' value={fmtNIS(calc.gross_total)} bold />
              <hr className="my-2" />
              <Row label='בסיס פנסיוני' value={fmtNIS(calc.pensionable_base)} muted />
              <Row label={`פנסיה עובד (${emp.pension_employee_pct}%)`} value={`-${fmtNIS(calc.pension.employee)}`} />
              <Row label={`פנסיה מעביד (${emp.pension_employer_pct}%)`} value={fmtNIS(calc.pension.employer)} muted />
              <Row label={`פיצויים (${emp.pension_severance_pct}%)`} value={fmtNIS(calc.pension.severance)} muted />
              {calc.pension.study_employee > 0 &&
                <Row label="קרן השתלמות עובד" value={`-${fmtNIS(calc.pension.study_employee)}`} />}
              <hr className="my-2" />
              <Row label="מס הכנסה" value={`-${fmtNIS(calc.income_tax)}`} />
              <Row label='ביטוח לאומי' value={`-${fmtNIS(calc.national_insurance)}`} />
              <Row label="מס בריאות" value={`-${fmtNIS(calc.health_tax)}`} />
              {calc.other_deductions > 0 &&
                <Row label="ניכויים נוספים" value={`-${fmtNIS(calc.other_deductions)}`} />}
              <hr className="my-2" />
              <Row label="נטו לתשלום" value={fmtNIS(calc.net_total)} bold large />
              <Row label="עלות מעביד כוללת" value={fmtNIS(calc.employer_total_cost)} bold />
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">בחר עובד להצגת חישוב.</div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>תלושים שמורים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>עובד</TableHead>
                  <TableHead>תקופה</TableHead>
                  <TableHead>ברוטו</TableHead>
                  <TableHead>נטו</TableHead>
                  <TableHead>עלות מעביד</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map(r => {
                  const e = employees.find(x => x.id === r.employee_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{e?.name || "—"}</TableCell>
                      <TableCell>{r.period_month}/{r.period_year}</TableCell>
                      <TableCell>{fmtNIS(Number(r.gross_total))}</TableCell>
                      <TableCell>{fmtNIS(Number(r.net_total))}</TableCell>
                      <TableCell>{fmtNIS(Number(r.employer_total_cost))}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "final" || r.status === "paid" ? "default" : "secondary"}>
                          {r.status === "final" ? "סופי" :
                           r.status === "paid"  ? "שולם" :
                           r.status === "draft" ? "טיוטה" : "בוטל"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {runs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      אין תלושים שמורים.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold, muted, large }: {
  label: string; value: string; bold?: boolean; muted?: boolean; large?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""} ${muted ? "text-muted-foreground" : ""} ${large ? "text-lg" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// =============================================================================
// Reports tab — CSV exports
// =============================================================================
function ReportsTab({ employees, leaves, runs }: {
  employees: Employee[]; leaves: Leave[]; runs: PayrollRun[];
}) {
  const downloadCSV = (filename: string, rows: any[]) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map(r => headers.map(h => {
        const v = r[h] ?? "";
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const empMap = new Map(employees.map(e => [e.id, e.name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>ייצוא דוחות</CardTitle>
        <CardDescription>
          קבצי CSV מתאימים לתוכנת שכר חיצונית (חילן/מיכפל וכד׳) או לרואה חשבון.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => downloadCSV("employees.csv",
          employees.map(e => ({
            name: e.name, id_number: e.id_number, position: e.position,
            employment_type: e.employment_type, monthly_salary: e.monthly_salary,
            hourly_rate: e.hourly_rate, hire_date: e.hire_date,
            tax_credit_points: e.tax_credit_points, is_active: e.is_active,
          })))}>
          <Download className="h-4 w-4 ml-1" /> עובדים (CSV)
        </Button>
        <Button variant="outline" onClick={() => downloadCSV("leaves.csv",
          leaves.map(l => ({
            employee: empMap.get(l.employee_id) || "",
            type: LEAVE_TYPE_LABELS[l.leave_type] || l.leave_type,
            start_date: l.start_date, end_date: l.end_date,
            days: l.days, paid: l.paid, status: l.status, notes: l.notes,
          })))}>
          <Download className="h-4 w-4 ml-1" /> חופשות (CSV)
        </Button>
        <Button variant="outline" onClick={() => downloadCSV("payroll.csv",
          runs.map(r => ({
            employee: empMap.get(r.employee_id) || "",
            period: `${r.period_month}/${r.period_year}`,
            gross: r.gross_total, net: r.net_total,
            employer_cost: r.employer_total_cost,
            pension_employee: r.pension_employee, pension_employer: r.pension_employer,
            pension_severance: r.pension_severance,
            income_tax: r.income_tax, ni: r.national_insurance, health: r.health_tax,
            status: r.status,
          })))}>
          <Download className="h-4 w-4 ml-1" /> תלושים (CSV)
        </Button>
      </CardContent>
    </Card>
  );
}
