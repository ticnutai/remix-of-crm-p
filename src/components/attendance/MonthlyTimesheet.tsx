import React, { useEffect, useMemo, useState } from "react";
import {
  AttendanceRecord,
  DAY_TYPE_COLORS,
  DAY_TYPE_LABELS,
  DayCell,
  DayType,
  MonthSummary,
  attachRecordsToDays,
  autoFillMonth,
  buildMonthDays,
  copyPreviousMonth,
  approveRecord,
  deleteRecord,
  exportPayrollCsv,
  exportTimesheetPdf,
  formatMinutes,
  isoToLocalHHMM,
  listMonthRecords,
  lockMonth,
  summarizeMonth,
  upsertManualEntry,
} from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Calendar as CalIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileSignature,
  Lock,
  LockOpen,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const DOW = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

interface MonthlyTimesheetProps {
  userId: string;
  employeeName?: string;
  isManager: boolean;
}

export function MonthlyTimesheet({ userId, employeeName, isManager }: MonthlyTimesheetProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [autoIn, setAutoIn] = useState("08:00");
  const [autoOut, setAutoOut] = useState("17:00");
  const [autoBreak, setAutoBreak] = useState(30);
  const [resolvedName, setResolvedName] = useState<string | undefined>(employeeName);

  // If parent didn't pass a name, fetch it once from profiles so we never show a UUID
  useEffect(() => {
    if (employeeName) { setResolvedName(employeeName); return; }
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("profiles" as any)
          .select("full_name, email")
          .eq("id", userId)
          .maybeSingle();
        if (!cancelled && data) {
          const p = data as any;
          setResolvedName(p.full_name || p.email || "ללא שם");
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [userId, employeeName]);

  const monthLabel = `${month0 + 1}/${year}`;

  // Full reload — shows spinner. Use only for initial mount and month navigation.
  const reload = async () => {
    setLoading(true);
    try {
      const recs = await listMonthRecords(userId, year, month0);
      setRecords(recs);
    } catch (e: any) {
      toast.error(e?.message ?? "שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh — updates records without touching loading state so the
  // table never disappears. Use after per-row saves/deletes.
  const silentReload = async () => {
    try {
      const recs = await listMonthRecords(userId, year, month0);
      setRecords(recs);
    } catch { /* ignore — user sees saved data already */ }
  };

  useEffect(() => { void reload(); }, [userId, year, month0]);

  const cells: DayCell[] = useMemo(() => {
    return attachRecordsToDays(buildMonthDays(year, month0), records);
  }, [year, month0, records]);

  const summary: MonthSummary = useMemo(() => summarizeMonth(records), [records]);

  const goPrev = () => {
    const d = new Date(year, month0 - 1, 1);
    setYear(d.getFullYear()); setMonth0(d.getMonth());
  };
  const goNext = () => {
    const d = new Date(year, month0 + 1, 1);
    setYear(d.getFullYear()); setMonth0(d.getMonth());
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth0(today.getMonth()); };

  const handleSaveCell = async (
    cell: DayCell,
    patch: { clock_in?: string; clock_out?: string; break_minutes?: number; day_type?: DayType; notes?: string },
  ) => {
    try {
      const cur = cell.record;
      await upsertManualEntry({
        user_id: userId,
        date: cell.date,
        clock_in: patch.clock_in ?? (cur?.clock_in ? isoToLocalHHMM(cur.clock_in) : undefined),
        clock_out: patch.clock_out ?? (cur?.clock_out ? isoToLocalHHMM(cur.clock_out) : undefined),
        break_minutes: patch.break_minutes ?? cur?.break_minutes ?? 0,
        day_type: patch.day_type ?? (cur?.day_type as DayType) ?? "work",
        notes: patch.notes ?? cur?.notes ?? null,
      });
      // Silent: don't flash the table with a loading spinner on every field blur.
      void silentReload();
    } catch (e: any) {
      toast.error(e?.message ?? "שמירה נכשלה");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("למחוק את הרשומה?")) return;
    try { await deleteRecord(id); void silentReload(); toast.success("נמחק"); }
    catch (e: any) { toast.error(e?.message ?? "שגיאה במחיקה"); }
  };

  const handleApprove = async (id?: string, approve = true) => {
    if (!id) return;
    try { await approveRecord(id, approve); void silentReload(); toast.success(approve ? "אושר" : "בוטל אישור"); }
    catch (e: any) { toast.error(e?.message ?? "שגיאה"); }
  };

  const handleAutoFill = async () => {
    try {
      const n = await autoFillMonth(userId, year, month0, {
        clockIn: autoIn, clockOut: autoOut, breakMinutes: autoBreak,
      });
      toast.success(`מולאו ${n} ימים`);
      setAutoFillOpen(false);
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "שגיאה במילוי");
    }
  };

  const handleCopyPrev = async () => {
    if (!confirm("להעתיק נתונים מהחודש הקודם לימים ריקים?")) return;
    try {
      const n = await copyPreviousMonth(userId, year, month0);
      toast.success(`הועתקו ${n} ימים`);
      await reload();
    } catch (e: any) { toast.error(e?.message ?? "שגיאה בהעתקה"); }
  };

  const handleLockMonth = async (lock: boolean) => {
    if (!confirm(lock ? "לנעול את כל החודש?" : "לבטל נעילה?")) return;
    try {
      const n = await lockMonth(userId, year, month0 + 1, lock);
      toast.success(`עודכנו ${n} רשומות`);
      await reload();
    } catch (e: any) { toast.error(e?.message ?? "שגיאה"); }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/30">
            <CalIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold tabular-nums">{monthLabel}</span>
          </div>
          <Button variant="outline" size="sm" onClick={goNext}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            היום
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoFillOpen(true)}>
            <Sparkles className="h-4 w-4 ml-1" />
            מילוי אוטומטי
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyPrev}>
            <Copy className="h-4 w-4 ml-1" />
            העתק חודש קודם
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportPayrollCsv(records, monthLabel.replace("/", "-"), employeeName)}
          >
            <Download className="h-4 w-4 ml-1" />
            CSV שכר
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTimesheetPdf(records, monthLabel.replace("/", "-"), employeeName, false)}
          >
            <Download className="h-4 w-4 ml-1" />
            PDF
          </Button>
          {isManager && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTimesheetPdf(records, monthLabel.replace("/", "-"), employeeName, true)}
              >
                <FileSignature className="h-4 w-4 ml-1" />
                PDF חתום
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleLockMonth(true)}>
                <Lock className="h-4 w-4 ml-1" />
                נעל חודש
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleLockMonth(false)}>
                <LockOpen className="h-4 w-4 ml-1" />
                בטל נעילה
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KpiCard label="ימי עבודה" value={String(summary.workDays)} />
        <KpiCard label="סה״כ שעות" value={formatMinutes(summary.totalMinutes)} />
        <KpiCard label="שעות נוספות" value={formatMinutes(summary.overtimeMinutes)} accent="text-amber-600" />
        <KpiCard
          label="חופש / מחלה / חיסור"
          value={`${summary.vacationDays} / ${summary.sickDays} / ${summary.absentDays}`}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">גיליון נוכחות {resolvedName ? `— ${resolvedName}` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs">
              <tr>
                <th className="p-2 text-right">תאריך</th>
                <th className="p-2 text-right">יום</th>
                <th className="p-2 text-right">סוג</th>
                <th className="p-2 text-right">כניסה</th>
                <th className="p-2 text-right">יציאה</th>
                <th className="p-2 text-right">הפסקה (דק׳)</th>
                <th className="p-2 text-right">סה״כ</th>
                <th className="p-2 text-right">הערות</th>
                <th className="p-2 text-right w-[140px]">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">טוען...</td></tr>
              )}
              {!loading && cells.map(cell => (
                <DayRow
                  key={cell.date}
                  cell={cell}
                  onSave={(p) => handleSaveCell(cell, p)}
                  onDelete={() => handleDelete(cell.record?.id)}
                  onApprove={(v) => handleApprove(cell.record?.id, v)}
                  isManager={isManager}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Auto-fill dialog */}
      <Dialog open={autoFillOpen} onOpenChange={setAutoFillOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>מילוי אוטומטי לחודש {monthLabel}</DialogTitle>
            <DialogDescription>
              ימלא את ימי א׳–ה׳ הריקים בלבד. ימים מאוישים לא יידרסו.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="auto-in">כניסה</Label>
                <Input id="auto-in" type="time" value={autoIn} onChange={e => setAutoIn(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="auto-out">יציאה</Label>
                <Input id="auto-out" type="time" value={autoOut} onChange={e => setAutoOut(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="auto-br">הפסקה (דקות)</Label>
              <Input id="auto-br" type="number" min={0} max={300} value={autoBreak} onChange={e => setAutoBreak(Number(e.target.value || 0))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAutoFillOpen(false)}>בטל</Button>
            <Button onClick={handleAutoFill}>
              <Save className="h-4 w-4 ml-1" />
              מלא
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-xl font-bold tabular-nums mt-0.5 ${accent ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

interface DayRowProps {
  cell: DayCell;
  onSave: (p: { clock_in?: string; clock_out?: string; break_minutes?: number; day_type?: DayType; notes?: string }) => void;
  onDelete: () => void;
  onApprove: (v: boolean) => void;
  isManager: boolean;
}

const DayRow = React.memo(function DayRow({ cell, onSave, onDelete, onApprove, isManager }: DayRowProps) {
  const r = cell.record;
  const [ci, setCi] = useState(isoToLocalHHMM(r?.clock_in));
  const [co, setCo] = useState(isoToLocalHHMM(r?.clock_out));
  const [br, setBr] = useState<number>(r?.break_minutes ?? 0);
  const [dt, setDt] = useState<DayType>((r?.day_type as DayType) ?? (cell.isWeekend ? "absent" : "work"));
  const [notes, setNotes] = useState(r?.notes ?? "");

  // Track how many inputs in this row are currently focused.
  // If any input is focused, don't reset local state from DB updates
  // (silentReload can fire mid-edit and would otherwise overwrite what the user typed).
  const focusCount = React.useRef(0);
  const onFocusField = () => { focusCount.current += 1; };
  const onBlurField = (save: () => void) => () => {
    focusCount.current = Math.max(0, focusCount.current - 1);
    save();
  };

  useEffect(() => {
    // Skip reset while the user is actively editing a field in this row.
    if (focusCount.current > 0) return;
    setCi(isoToLocalHHMM(r?.clock_in));
    setCo(isoToLocalHHMM(r?.clock_out));
    setBr(r?.break_minutes ?? 0);
    setDt((r?.day_type as DayType) ?? (cell.isWeekend ? "absent" : "work"));
    setNotes(r?.notes ?? "");
  }, [r?.id, r?.clock_in, r?.clock_out, r?.break_minutes, r?.day_type, r?.notes, cell.isWeekend]);

  const total = useMemo(() => {
    if (!ci || !co) return 0;
    const [h1, m1] = ci.split(":").map(Number);
    const [h2, m2] = co.split(":").map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1) - (br || 0);
    return Math.max(0, diff);
  }, [ci, co, br]);

  const locked = !!r?.locked;
  const approved = !!r?.approved_at;
  const dateObj = new Date(cell.date);
  const isToday = cell.date === new Date().toISOString().slice(0, 10);

  const rowClass = `border-b ${cell.isWeekend ? "bg-muted/20 text-muted-foreground" : ""} ${isToday ? "bg-primary/5" : ""} ${approved ? "bg-emerald-50/40" : ""}`;

  const commit = () => {
    onSave({ clock_in: ci || undefined, clock_out: co || undefined, break_minutes: br, day_type: dt, notes });
  };

  return (
    <tr className={rowClass}>
      <td className="p-2 tabular-nums">{dateObj.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}</td>
      <td className="p-2">{DOW[cell.weekday]}</td>
      <td className="p-2">
        <Select value={dt} onValueChange={(v: DayType) => { setDt(v); onSave({ day_type: v }); }} disabled={locked}>
          <SelectTrigger className="h-8 w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DAY_TYPE_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-2">
        <Input
          type="time" className="h-8 w-[100px]"
          value={ci} onChange={e => setCi(e.target.value)}
          onFocus={onFocusField} onBlur={onBlurField(commit)}
          disabled={locked || dt !== "work" && dt !== "wfh"}
        />
      </td>
      <td className="p-2">
        <Input
          type="time" className="h-8 w-[100px]"
          value={co} onChange={e => setCo(e.target.value)}
          onFocus={onFocusField} onBlur={onBlurField(commit)}
          disabled={locked || dt !== "work" && dt !== "wfh"}
        />
      </td>
      <td className="p-2">
        <Input
          type="number" min={0} max={300} className="h-8 w-[70px]"
          value={br} onChange={e => setBr(Number(e.target.value || 0))}
          onFocus={onFocusField} onBlur={onBlurField(commit)}
          disabled={locked || dt !== "work" && dt !== "wfh"}
        />
      </td>
      <td className="p-2 tabular-nums">
        {total > 0 ? (
          <span className={total > 510 ? "text-amber-600 font-semibold" : ""}>
            {formatMinutes(total)}
          </span>
        ) : (
          <Badge variant="outline" className={DAY_TYPE_COLORS[dt]}>
            {DAY_TYPE_LABELS[dt]}
          </Badge>
        )}
      </td>
      <td className="p-2">
        <Input
          className="h-8 min-w-[140px]"
          value={notes} onChange={e => setNotes(e.target.value)}
          onFocus={onFocusField} onBlur={onBlurField(commit)}
          disabled={locked}
          placeholder="—"
        />
      </td>
      <td className="p-2">
        <div className="flex items-center gap-1">
          {ci && co && co < ci && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>שעת יציאה לפני כניסה</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {locked && <Lock className="h-4 w-4 text-zinc-500" aria-label="נעול" />}
          {approved && <Check className="h-4 w-4 text-emerald-600" aria-label="מאושר" />}
          {isManager && r?.id && (
            <Button
              size="icon" variant="ghost" className="h-7 w-7"
              onClick={() => onApprove(!approved)}
              title={approved ? "בטל אישור" : "אשר"}
            >
              {approved ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-emerald-600" />}
            </Button>
          )}
          {r?.id && !locked && (
            <Button
              size="icon" variant="ghost" className="h-7 w-7"
              onClick={onDelete}
              title="מחק"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
});

export default MonthlyTimesheet;
