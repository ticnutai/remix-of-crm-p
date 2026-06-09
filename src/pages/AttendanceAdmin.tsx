// Attendance Admin — manager dashboard with summary, daily detail,
// missing-days detection, edit any record, exports.
import React, { useEffect, useMemo, useState } from "react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  FileText,
  AlertTriangle,
  Edit2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MonthlyTimesheet } from "@/components/attendance/MonthlyTimesheet";
import {
  AttendanceRecord, AttendanceUser, listAllRecords, listAllUsers,
  summarizeByUser, findMissingDays,
  formatDate, formatTime, formatMinutes,
  exportSummaryToExcel, exportDetailToExcel, exportSummaryToPdf,
} from "@/lib/attendance";
import { supabase } from "@/integrations/supabase/client";

export default function AttendanceAdmin() {
  const { isAdmin, isManager, isSuperManager, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [allUsers, setAllUsers] = useState<AttendanceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workMonthStartDayRaw, setWorkMonthStartDayRaw] = useSyncedSetting<number>({
    key: "attendance-admin-work-month-start-day",
    defaultValue: 1,
  });
  const workMonthStartDay = clampWorkMonthStartDay(Number(workMonthStartDayRaw));
  const [draftWorkMonthStartDay, setDraftWorkMonthStartDay] = useState(workMonthStartDay);
  const [standardHoursByUserId, setStandardHoursByUserId] = useState<Record<string, number>>({});
  const [workMonthUserFilter, setWorkMonthUserFilter] = useSyncedSetting<string>({
    key: "attendance-admin-work-month-user-filter",
    defaultValue: "all",
  });
  const [userFilter, setUserFilter] = useSyncedSetting<string>({ key: "attendance-admin-user-filter", defaultValue: "all" });
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [activeTab, setActiveTab] = useSyncedSetting<string>({ key: "attendance-admin-tab", defaultValue: "summary" });

  const allowed = isAdmin || isManager || isSuperManager;

  useEffect(() => {
    if (!isLoading && !allowed) navigate("/");
  }, [isLoading, allowed, navigate]);

  useEffect(() => {
    setDraftWorkMonthStartDay(workMonthStartDay);
  }, [workMonthStartDay]);

  const range = useMemo(() => {
    return getWorkMonthRange(monthOffset, workMonthStartDay);
  }, [monthOffset, workMonthStartDay]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [recs, users, employeeStandardsRes] = await Promise.all([
        listAllRecords(range.from.toISOString(), range.to.toISOString()),
        listAllUsers(),
        supabase
          .from("employees")
          .select("profile_id, standard_monthly_hours, is_active")
          .not("profile_id", "is", null)
          .eq("is_active", true),
      ]);
      setRecords(recs);
      setAllUsers(users);

      const standards: Record<string, number> = {};
      if (!employeeStandardsRes.error) {
        for (const row of employeeStandardsRes.data ?? []) {
          const profileId = row.profile_id;
          const standardHours = Number(row.standard_monthly_hours ?? 0);
          if (!profileId || standardHours <= 0) continue;
          standards[profileId] = standardHours;
        }
      }
      setStandardHoursByUserId(standards);
    } catch (e: any) {
      toast({ title: "שגיאה בטעינה", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (allowed) refresh(); /* eslint-disable-next-line */ }, [allowed, monthOffset, workMonthStartDay]);

  const summary = useMemo(() => summarizeByUser(records, allUsers), [records, allUsers]);
  const summaryWithTargets = useMemo(() => {
    return summary.map((u) => {
      const standardHours = standardHoursByUserId[u.user_id];
      const targetMinutes =
        typeof standardHours === "number" && standardHours > 0
          ? Math.round(standardHours * 60)
          : null;
      const gapMinutes = targetMinutes !== null ? u.total_minutes - targetMinutes : null;
      const utilizationPct =
        targetMinutes && targetMinutes > 0
          ? Math.round((u.total_minutes / targetMinutes) * 100)
          : null;

      return {
        ...u,
        standardHours: targetMinutes !== null ? standardHours : null,
        targetMinutes,
        gapMinutes,
        utilizationPct,
      };
    });
  }, [summary, standardHoursByUserId]);
  const filtered = useMemo(() => userFilter === "all" ? records : records.filter(r => r.user_id === userFilter), [records, userFilter]);
  const missing  = useMemo(() => findMissingDays(records, range.from, new Date(), allUsers.map(u => u.id)), [records, range, allUsers]);

  const totalAll = summaryWithTargets.reduce((s, u) => s + u.total_minutes, 0);
  const totalOt  = summaryWithTargets.reduce((s, u) => s + u.overtime_minutes, 0);
  const totalTargetMinutes = summaryWithTargets.reduce((s, u) => s + (u.targetMinutes ?? 0), 0);
  const usersWithTarget = summaryWithTargets.filter((u) => u.targetMinutes !== null).length;
  const totalGapMinutes = usersWithTarget > 0 ? totalAll - totalTargetMinutes : null;
  const totalUtilizationPct = totalTargetMinutes > 0
    ? Math.round((totalAll / totalTargetMinutes) * 100)
    : null;
  const selectedMonth = range.from.getMonth();
  const selectedYear = range.from.getFullYear();
  const baseWorkMonthStart = useMemo(() => getWorkMonthRange(0, workMonthStartDay).from, [workMonthStartDay]);
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = selectedYear - 3; y <= selectedYear + 1; y += 1) {
      years.push(y);
    }
    return years;
  }, [selectedYear]);

  const setWorkMonthByYearAndMonth = (year: number, month0: number) => {
    const normalizedYear = Number.isFinite(year) ? year : selectedYear;
    const normalizedMonth = Math.min(11, Math.max(0, Math.round(month0)));
    const diff = monthDiffInCalendarMonths(
      baseWorkMonthStart,
      new Date(normalizedYear, normalizedMonth, 1),
    );
    setMonthOffset(diff);
  };

  const workMonthSummaryRows = useMemo(() => {
    if (workMonthUserFilter === "all") return summaryWithTargets;
    return summaryWithTargets.filter((u) => u.user_id === workMonthUserFilter);
  }, [summaryWithTargets, workMonthUserFilter]);

  const workMonthDetailRows = useMemo(() => {
    const rows = workMonthUserFilter === "all"
      ? records
      : records.filter((r) => r.user_id === workMonthUserFilter);
    return [...rows].sort(
      (a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime(),
    );
  }, [records, workMonthUserFilter]);

  const workMonthTotals = useMemo(() => {
    const totalMinutes = workMonthDetailRows.reduce(
      (sum, r) => sum + (r.duration_minutes ?? 0),
      0,
    );
    const totalBreakMinutes = workMonthDetailRows.reduce(
      (sum, r) => sum + (r.break_minutes ?? 0),
      0,
    );
    const totalOvertimeMinutes = workMonthSummaryRows.reduce(
      (sum, u) => sum + u.overtime_minutes,
      0,
    );
    const totalMissingClockOuts = workMonthSummaryRows.reduce(
      (sum, u) => sum + u.missing_clock_outs,
      0,
    );
    const totalShifts = workMonthSummaryRows.reduce((sum, u) => sum + u.shifts, 0);

    return {
      totalMinutes,
      totalBreakMinutes,
      totalOvertimeMinutes,
      totalMissingClockOuts,
      totalShifts,
    };
  }, [workMonthSummaryRows, workMonthDetailRows]);

  const saveWorkMonthSettings = () => {
    const normalized = clampWorkMonthStartDay(draftWorkMonthStartDay);
    setWorkMonthStartDayRaw(normalized);
    setMonthOffset(0);
    setSettingsOpen(false);
    toast({
      title: "הגדרת חודש עבודה נשמרה",
      description: `חודש העבודה האישי מתחיל ב-${normalized} לחודש`,
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4 space-y-4" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">נוכחות עובדים — מנהל</h1>
            <p className="text-muted-foreground">חודש עבודה {range.label}</p>
            <p className="text-xs text-muted-foreground">תחילת חודש עבודה אישי: יום {workMonthStartDay}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <WorkMonthNavigator
              rangeLabel={range.label}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              yearOptions={yearOptions}
              onPrev={() => setMonthOffset((o) => o - 1)}
              onNext={() => setMonthOffset((o) => o + 1)}
              onReset={() => setMonthOffset(0)}
              onMonthChange={(month0) => setWorkMonthByYearAndMonth(selectedYear, month0)}
              onYearChange={(year) => setWorkMonthByYearAndMonth(year, selectedMonth)}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              title="הגדרת תחילת חודש עבודה אישי"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportSummaryToExcel(summary, range.label)}>
              <Download className="ml-1 h-4 w-4" /> Excel סיכום
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportDetailToExcel(records, range.label)}>
              <Download className="ml-1 h-4 w-4" /> Excel פירוט
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportSummaryToPdf(summary, range.label)}>
              <FileText className="ml-1 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
          <Stat label="סה״כ עובדים" value={summaryWithTargets.length.toString()} />
          <Stat label="ללא דיווח כלל" value={summaryWithTargets.filter(u => u.shifts === 0 && u.missing_clock_outs === 0).length.toString()} />
          <Stat label="סה״כ שעות" value={formatMinutes(totalAll)} />
          <Stat label="שעות נוספות" value={formatMinutes(totalOt)} />
          <Stat label="חוסרי יציאה" value={summaryWithTargets.reduce((s, u) => s + u.missing_clock_outs, 0).toString()} />
          <Stat label="יעד שעות תקן" value={usersWithTarget > 0 ? formatMinutes(totalTargetMinutes) : "—"} />
          <Stat label="פער לתקן" value={totalGapMinutes !== null ? formatSignedMinutes(totalGapMinutes) : "—"} />
          <Stat label="ביצוע מהיעד" value={totalUtilizationPct !== null ? `${totalUtilizationPct}%` : "—"} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="summary">סיכום לעובד</TabsTrigger>
            <TabsTrigger value="work-month">סיכום חודש עבודה</TabsTrigger>
            <TabsTrigger value="detail">פירוט יומי</TabsTrigger>
            <TabsTrigger value="missing">חוסרים</TabsTrigger>
            <TabsTrigger value="timesheet">עריכה ידנית</TabsTrigger>
          </TabsList>

          <TabsContent value="work-month">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">סיכום חודש עבודה</CardTitle>
                    <CardDescription>
                      כל הפרטים לפי חודש העבודה שנבחר: {range.label}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <WorkMonthNavigator
                      rangeLabel={range.label}
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      yearOptions={yearOptions}
                      onPrev={() => setMonthOffset((o) => o - 1)}
                      onNext={() => setMonthOffset((o) => o + 1)}
                      onReset={() => setMonthOffset(0)}
                      onMonthChange={(month0) => setWorkMonthByYearAndMonth(selectedYear, month0)}
                      onYearChange={(year) => setWorkMonthByYearAndMonth(year, selectedMonth)}
                    />
                    <Label>הצג עבור:</Label>
                    <Select value={workMonthUserFilter} onValueChange={setWorkMonthUserFilter}>
                      <SelectTrigger className="w-[260px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל העובדים</SelectItem>
                        {summaryWithTargets.map((u) => (
                          <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Stat label="סה״כ שעות כללי" value={formatMinutes(workMonthTotals.totalMinutes)} />
                  <Stat label="סה״כ משמרות" value={workMonthTotals.totalShifts.toString()} />
                  <Stat label="סה״כ הפסקות" value={formatMinutes(workMonthTotals.totalBreakMinutes)} />
                  <Stat label="סה״כ שעות נוספות" value={formatMinutes(workMonthTotals.totalOvertimeMinutes)} />
                  <Stat label="חוסרי יציאה" value={workMonthTotals.totalMissingClockOuts.toString()} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-right">
                        <th className="p-2">עובד</th>
                        <th className="p-2">משמרות</th>
                        <th className="p-2">סה״כ שעות</th>
                        <th className="p-2">הפסקות</th>
                        <th className="p-2">שעות נוספות</th>
                        <th className="p-2">תקן שעות</th>
                        <th className="p-2">פער לתקן</th>
                        <th className="p-2">ביצוע</th>
                        <th className="p-2">חוסר יציאה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={9} className="p-4 text-center">טוען...</td>
                        </tr>
                      )}
                      {!loading && workMonthSummaryRows.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-4 text-center text-muted-foreground">אין נתונים</td>
                        </tr>
                      )}
                      {workMonthSummaryRows.map((u) => (
                        <tr key={u.user_id} className="border-b hover:bg-muted/40">
                          <td className="p-2 font-medium">{u.full_name}</td>
                          <td className="p-2">{u.shifts}</td>
                          <td className="p-2 font-semibold">{formatMinutes(u.total_minutes)}</td>
                          <td className="p-2">{formatMinutes(u.break_minutes)}</td>
                          <td className="p-2 text-orange-600">{formatMinutes(u.overtime_minutes)}</td>
                          <td className="p-2">{u.targetMinutes !== null ? formatMinutes(u.targetMinutes) : "—"}</td>
                          <td className={`p-2 ${u.gapMinutes === null ? "" : u.gapMinutes < 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {u.gapMinutes !== null ? formatSignedMinutes(u.gapMinutes) : "—"}
                          </td>
                          <td className="p-2">{u.utilizationPct !== null ? `${u.utilizationPct}%` : "—"}</td>
                          <td className="p-2">
                            {u.missing_clock_outs > 0
                              ? <Badge variant="destructive">{u.missing_clock_outs}</Badge>
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto">
                  <div className="text-sm font-medium mb-2">פירוט משמרות בחודש העבודה</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-right">
                        <th className="p-2">תאריך</th>
                        <th className="p-2">עובד</th>
                        <th className="p-2">כניסה</th>
                        <th className="p-2">יציאה</th>
                        <th className="p-2">סה״כ</th>
                        <th className="p-2">הפסקה</th>
                        <th className="p-2">הערות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center">טוען...</td>
                        </tr>
                      )}
                      {!loading && workMonthDetailRows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">אין נתונים</td>
                        </tr>
                      )}
                      {workMonthDetailRows.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-muted/40">
                          <td className="p-2">{formatDate(r.clock_in)}</td>
                          <td className="p-2">{r.profile?.full_name ?? r.user_id.slice(0, 8)}</td>
                          <td className="p-2">{formatTime(r.clock_in)}</td>
                          <td className="p-2">{r.clock_out ? formatTime(r.clock_out) : <Badge variant="outline">פתוח</Badge>}</td>
                          <td className="p-2">{formatMinutes(r.duration_minutes ?? 0)}</td>
                          <td className="p-2">{formatMinutes(r.break_minutes ?? 0)}</td>
                          <td className="p-2 max-w-[260px] truncate">{r.notes ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">סיכום שעות לפי עובד</CardTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title="הגדרת תחילת חודש עבודה אישי"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  השוואה מול תקן שעות חודשי מטבלת עובדים
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">עובד</th>
                      <th className="p-2">אימייל</th>
                      <th className="p-2">משמרות</th>
                      <th className="p-2">סה״כ</th>
                      <th className="p-2">תקן שעות</th>
                      <th className="p-2">פער לתקן</th>
                      <th className="p-2">ביצוע</th>
                      <th className="p-2">הפסקות</th>
                      <th className="p-2">שעות נוספות</th>
                      <th className="p-2">חוסר יציאה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={10} className="p-4 text-center">טוען...</td></tr>}
                    {!loading && summaryWithTargets.length === 0 && <tr><td colSpan={10} className="p-4 text-center text-muted-foreground">אין נתונים</td></tr>}
                    {summaryWithTargets.map(u => (
                      <tr key={u.user_id} className="border-b hover:bg-muted/40">
                        <td className="p-2 font-medium">
                          {u.full_name}
                          {u.shifts === 0 && u.missing_clock_outs === 0 && (
                            <Badge variant="destructive" className="mr-2">ללא דיווח</Badge>
                          )}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">{u.email}</td>
                        <td className="p-2">{u.shifts}</td>
                        <td className="p-2 font-semibold">{formatMinutes(u.total_minutes)}</td>
                        <td className="p-2">{u.targetMinutes !== null ? formatMinutes(u.targetMinutes) : "—"}</td>
                        <td className={`p-2 ${u.gapMinutes === null ? "" : u.gapMinutes < 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {u.gapMinutes !== null ? formatSignedMinutes(u.gapMinutes) : "—"}
                        </td>
                        <td className="p-2">{u.utilizationPct !== null ? `${u.utilizationPct}%` : "—"}</td>
                        <td className="p-2">{formatMinutes(u.break_minutes)}</td>
                        <td className="p-2 text-orange-600">{formatMinutes(u.overtime_minutes)}</td>
                        <td className="p-2">
                          {u.missing_clock_outs > 0
                            ? <Badge variant="destructive">{u.missing_clock_outs}</Badge>
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detail">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Label>סינון עובד:</Label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כולם</SelectItem>
                      {summaryWithTargets.map(u => (
                        <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    title="הגדרת תחילת חודש עבודה אישי"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">תאריך</th>
                      <th className="p-2">עובד</th>
                      <th className="p-2">כניסה</th>
                      <th className="p-2">יציאה</th>
                      <th className="p-2">סה״כ</th>
                      <th className="p-2">הפסקה</th>
                      <th className="p-2">הערות</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} className="border-b hover:bg-muted/40">
                        <td className="p-2">{formatDate(r.clock_in)}</td>
                        <td className="p-2">{r.profile?.full_name ?? r.user_id.slice(0, 8)}</td>
                        <td className="p-2">{formatTime(r.clock_in)}</td>
                        <td className="p-2">{r.clock_out ? formatTime(r.clock_out) : <Badge variant="outline">פתוח</Badge>}</td>
                        <td className="p-2">{formatMinutes(r.duration_minutes ?? 0)}</td>
                        <td className="p-2">{formatMinutes(r.break_minutes ?? 0)}</td>
                        <td className="p-2 max-w-[260px] truncate">{r.notes ?? ""}</td>
                        <td className="p-2">
                          {r.is_edited && <Badge variant="secondary" className="ml-1">נערך</Badge>}
                          <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="missing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  ימים ללא דיווח (א׳–ה׳)
                </CardTitle>
                <CardDescription>עד התאריך של היום</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {summaryWithTargets.length === 0 && <div className="text-muted-foreground">אין נתונים</div>}
                {summaryWithTargets.map(u => {
                  const days = missing[u.user_id] ?? [];
                  return (
                    <div key={u.user_id} className="border rounded p-3">
                      <div className="font-medium mb-1">{u.full_name}</div>
                      {days.length === 0
                        ? <span className="text-green-600 text-sm">דיווח מלא ✓</span>
                        : (
                          <div className="flex flex-wrap gap-1">
                            {days.map(d => <Badge key={d} variant="destructive">{d}</Badge>)}
                          </div>
                        )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timesheet">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Label>בחר עובד:</Label>
                  <Select value={userFilter === "all" ? (summaryWithTargets[0]?.user_id ?? "") : userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="בחר עובד" />
                    </SelectTrigger>
                    <SelectContent>
                      {summaryWithTargets.map(u => (
                        <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const sel = userFilter !== "all" ? userFilter : (summaryWithTargets[0]?.user_id ?? "");
                  const selUser = summaryWithTargets.find(s => s.user_id === sel);
                  if (!sel) return <p className="text-muted-foreground p-4">אין עובדים להצגה</p>;
                  return (
                    <MonthlyTimesheet
                      userId={sel}
                      employeeName={selUser?.full_name ?? selUser?.email}
                      isManager={true}
                    />
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>הגדרת חודש עבודה אישי</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                ההגדרה נשמרת למשתמש שלך בלבד, ומגדירה את טווח הסיכום החודשי במסך זה.
              </p>
              <div>
                <Label htmlFor="work-month-start-day">יום תחילת חודש עבודה (1-28)</Label>
                <Input
                  id="work-month-start-day"
                  type="number"
                  min={1}
                  max={28}
                  value={draftWorkMonthStartDay}
                  onChange={(e) => setDraftWorkMonthStartDay(Number(e.target.value))}
                />
              </div>
              <div className="flex gap-2">
                {[1, 21, 26].map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={draftWorkMonthStartDay === day ? "default" : "outline"}
                    onClick={() => setDraftWorkMonthStartDay(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>ביטול</Button>
              <Button onClick={saveWorkMonthSettings}>שמירה</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {editing && (
          <ManagerEditDialog
            record={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); refresh(); }}
          />
        )}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function WorkMonthNavigator({
  rangeLabel,
  selectedMonth,
  selectedYear,
  yearOptions,
  onPrev,
  onNext,
  onReset,
  onMonthChange,
  onYearChange,
}: {
  rangeLabel: string;
  selectedMonth: number;
  selectedYear: number;
  yearOptions: number[];
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onMonthChange: (month0: number) => void;
  onYearChange: (year: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/40 p-1.5">
      <Button variant="outline" size="icon" className="h-8 w-8" title="חודש קודם" onClick={onPrev}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" className="h-8" onClick={onReset}>
        החודש
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8" title="חודש הבא" onClick={onNext}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select value={String(selectedMonth)} onValueChange={(v) => onMonthChange(Number(v))}>
        <SelectTrigger className="w-[130px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HEBREW_MONTHS.map((label, idx) => (
            <SelectItem key={label} value={String(idx)}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-[98px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((year) => (
            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="text-xs text-muted-foreground whitespace-nowrap px-1">
        טווח: {rangeLabel}
      </div>
    </div>
  );
}

function ManagerEditDialog({
  record, onClose, onSaved,
}: { record: AttendanceRecord; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clockInLocal, setClockInLocal]   = useState(toLocalInput(record.clock_in));
  const [clockOutLocal, setClockOutLocal] = useState(toLocalInput(record.clock_out));
  const [notes, setNotes] = useState(record.notes ?? "");
  const [breakMin, setBreakMin] = useState<number>(record.break_minutes ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("attendance_records" as any)
        .update({
          clock_in: new Date(clockInLocal).toISOString(),
          clock_out: clockOutLocal ? new Date(clockOutLocal).toISOString() : null,
          notes,
          break_minutes: Number(breakMin) || 0,
          is_edited: true,
          edited_by: user?.id,
          edited_at: new Date().toISOString(),
        })
        .eq("id", record.id);
      if (error) throw error;
      toast({ title: "נשמר" });
      onSaved();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm("למחוק רישום זה?")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("attendance_records" as any).delete().eq("id", record.id);
      if (error) throw error;
      toast({ title: "נמחק" });
      onSaved();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת רישום (מנהל)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {record.profile?.full_name ?? record.user_id}
          </div>
          <div>
            <Label>כניסה</Label>
            <Input type="datetime-local" value={clockInLocal} onChange={e => setClockInLocal(e.target.value)} />
          </div>
          <div>
            <Label>יציאה</Label>
            <Input type="datetime-local" value={clockOutLocal} onChange={e => setClockOutLocal(e.target.value)} />
          </div>
          <div>
            <Label>הפסקה (דקות)</Label>
            <Input type="number" min={0} value={breakMin} onChange={e => setBreakMin(Number(e.target.value))} />
          </div>
          <div>
            <Label>הערה</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="justify-between">
          <Button variant="destructive" onClick={remove} disabled={saving}>מחיקה</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>ביטול</Button>
            <Button onClick={save} disabled={saving}>שמירה</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function clampWorkMonthStartDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.min(28, Math.max(1, Math.round(day)));
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getWorkMonthRange(monthOffset: number, startDay: number) {
  const safeStartDay = clampWorkMonthStartDay(startDay);
  const now = new Date();

  let from = new Date(now.getFullYear(), now.getMonth(), safeStartDay, 0, 0, 0, 0);
  if (now.getDate() < safeStartDay) {
    from = new Date(now.getFullYear(), now.getMonth() - 1, safeStartDay, 0, 0, 0, 0);
  }

  from = new Date(from.getFullYear(), from.getMonth() + monthOffset, safeStartDay, 0, 0, 0, 0);

  const nextStart = new Date(from.getFullYear(), from.getMonth() + 1, safeStartDay, 0, 0, 0, 0);
  const to = new Date(nextStart.getTime() - 1);

  return {
    from,
    to,
    label: `${formatShortDate(from)} - ${formatShortDate(to)}`,
  };
}

function formatSignedMinutes(mins: number): string {
  const sign = mins < 0 ? "-" : "+";
  return `${sign}${formatMinutes(Math.abs(mins))}`;
}

const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

function monthDiffInCalendarMonths(base: Date, target: Date): number {
  return (
    (target.getFullYear() - base.getFullYear()) * 12 +
    (target.getMonth() - base.getMonth())
  );
}
