// Attendance Admin — manager dashboard with summary, daily detail,
// missing-days detection, edit any record, exports.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Edit2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { MonthlyTimesheet } from "@/components/attendance/MonthlyTimesheet";
import {
  AttendanceRecord, AttendanceUser, listAllRecords, listAllUsers,
  summarizeByUser, findMissingDays,
  formatDate, formatTime, formatMinutes,
  exportSummaryToExcel,
  exportDetailToExcel,
  exportSummaryToPdf,
  exportDetailToPdf,
  exportSummaryToWord,
  exportDetailToWord,
  exportTimesheetPdf,
} from "@/lib/attendance";
import { summarizeAttendanceHours } from "@/lib/attendancePayroll";
import { supabase } from "@/integrations/supabase/client";

type SortDirection = "asc" | "desc";
type WorkMonthSummarySortKey =
  | "full_name"
  | "shifts"
  | "total_minutes"
  | "break_minutes"
  | "overtime_minutes"
  | "target_minutes"
  | "gap_minutes"
  | "utilization_pct"
  | "missing_clock_outs";
type WorkMonthDetailSortKey =
  | "date"
  | "employee"
  | "clock_in"
  | "clock_out"
  | "duration_minutes"
  | "break_minutes"
  | "notes";

interface PayrollRunLite {
  employee_id: string;
  period_year: number;
  period_month: number;
  net_total: number | null;
  status: string;
  worked_hours: number;
}

interface EmployeeLinkLite {
  employeeId: string;
  userId: string;
  employeeName: string;
  hourlyRate: number;
}

export default function AttendanceAdmin() {
  const { isAdmin, isManager, isSuperManager, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [workMonthSummarySort, setWorkMonthSummarySort] = useState<{
    key: WorkMonthSummarySortKey;
    direction: SortDirection;
  }>({ key: "total_minutes", direction: "desc" });
  const [workMonthDetailSort, setWorkMonthDetailSort] = useState<{
    key: WorkMonthDetailSortKey;
    direction: SortDirection;
  }>({ key: "date", direction: "desc" });
  const [userFilter, setUserFilter] = useSyncedSetting<string>({ key: "attendance-admin-user-filter", defaultValue: "all" });
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [activeTab, setActiveTab] = useSyncedSetting<string>({ key: "attendance-admin-tab", defaultValue: "summary" });
  const formatDateInputLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [includeDraftRuns, setIncludeDraftRuns] = useSyncedSetting<boolean>({
    key: "attendance-admin-include-draft-runs",
    defaultValue: false,
  });
  const [comparisonMonths, setComparisonMonths] = useSyncedSetting<number>({
    key: "attendance-admin-comparison-months",
    defaultValue: 6,
  });
  const defaultRangeFrom = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return formatDateInputLocal(d);
  }, []);
  const defaultRangeTo = useMemo(() => formatDateInputLocal(new Date()), []);
  const [dateRangeFrom, setDateRangeFrom] = useSyncedSetting<string>({
    key: "attendance-admin-range-from",
    defaultValue: defaultRangeFrom,
  });
  const [dateRangeTo, setDateRangeTo] = useSyncedSetting<string>({
    key: "attendance-admin-range-to",
    defaultValue: defaultRangeTo,
  });
  const [profileHourlyRateByUserId, setProfileHourlyRateByUserId] = useState<Record<string, number>>({});

  const [rangeRecords, setRangeRecords] = useState<AttendanceRecord[]>([]);
  const [rangePayrollRuns, setRangePayrollRuns] = useState<PayrollRunLite[]>([]);
  const [rangeEmployeeLinks, setRangeEmployeeLinks] = useState<EmployeeLinkLite[]>([]);
  const [loadingRangeAnalytics, setLoadingRangeAnalytics] = useState(false);

  const [comparisonRecords, setComparisonRecords] = useState<AttendanceRecord[]>([]);
  const [comparisonPayrollRuns, setComparisonPayrollRuns] = useState<PayrollRunLite[]>([]);
  const [comparisonEmployeeLinks, setComparisonEmployeeLinks] = useState<EmployeeLinkLite[]>([]);
  const [loadingComparisonAnalytics, setLoadingComparisonAnalytics] = useState(false);

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
      const [recs, users, employeeStandardsRes, profileRatesRes] = await Promise.all([
        listAllRecords(range.from.toISOString(), range.to.toISOString()),
        listAllUsers(),
        supabase
          .from("employees")
          .select("profile_id, standard_monthly_hours, is_active")
          .not("profile_id", "is", null)
          .eq("is_active", true),
        supabase
          .from("profiles")
          .select("id, hourly_rate, is_active")
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

      const profileRates: Record<string, number> = {};
      if (!profileRatesRes.error) {
        for (const row of profileRatesRes.data ?? []) {
          const profileId = row.id;
          if (!profileId) continue;
          profileRates[profileId] = Number(row.hourly_rate ?? 0);
        }
      }
      setProfileHourlyRateByUserId(profileRates);
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

  useEffect(() => {
    if (!allowed) return;

    const tab = searchParams.get("tab");
    const employeeId = searchParams.get("employeeId");
    const yearRaw = searchParams.get("year");
    const monthRaw = searchParams.get("month");
    const yearParam = yearRaw ? Number(yearRaw) : Number.NaN;
    const monthParam = monthRaw ? Number(monthRaw) : Number.NaN;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!tab && !employeeId && !fromParam && !toParam && !Number.isFinite(yearParam) && !Number.isFinite(monthParam)) {
      return;
    }

    const validTabs = new Set([
      "summary",
      "work-month",
      "detail",
      "missing",
      "timesheet",
      "date-range",
      "comparison",
    ]);

    let changed = false;

    if (tab && validTabs.has(tab)) {
      setActiveTab(tab);
      changed = true;
    }

    if (employeeId && employeeId !== "all") {
      setUserFilter(employeeId);
      setWorkMonthUserFilter(employeeId);
      changed = true;
    }

    if (
      Number.isFinite(yearParam) &&
      Number.isFinite(monthParam) &&
      monthParam >= 1 &&
      monthParam <= 12
    ) {
      setWorkMonthByYearAndMonth(yearParam, monthParam - 1);
      changed = true;
    }

    if (fromParam && isIsoDateInput(fromParam)) {
      setDateRangeFrom(fromParam);
      changed = true;
    }
    if (toParam && isIsoDateInput(toParam)) {
      setDateRangeTo(toParam);
      changed = true;
    }

    if (changed) {
      const nextParams = new URLSearchParams(searchParams);
      ["tab", "employeeId", "year", "month", "from", "to"].forEach((key) => {
        nextParams.delete(key);
      });
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    allowed,
    searchParams,
    setSearchParams,
    setActiveTab,
    setDateRangeFrom,
    setDateRangeTo,
    setUserFilter,
    setWorkMonthUserFilter,
    setWorkMonthByYearAndMonth,
  ]);

  const fetchAnalyticsWindow = useCallback(async (
    fromDate: Date,
    toDate: Date,
  ) => {
    const [windowRecords, employeeLinksRes] = await Promise.all([
      listAllRecords(fromDate.toISOString(), toDate.toISOString()),
      supabase
        .from("employees")
        .select("id, user_id, name, hourly_rate")
        .not("user_id", "is", null),
    ]);

    if (employeeLinksRes.error) throw employeeLinksRes.error;

    const employeeLinks: EmployeeLinkLite[] = (employeeLinksRes.data || [])
      .filter((row) => !!row.user_id)
      .map((row) => ({
        employeeId: row.id,
        userId: row.user_id as string,
        employeeName: String(row.name || ""),
        hourlyRate: Number(row.hourly_rate ?? 0),
      }));

    const employeeIds = Array.from(new Set(employeeLinks.map((link) => link.employeeId)));
    const monthKeys = getMonthKeysInRange(fromDate, toDate);
    const years = Array.from(new Set(monthKeys.map((key) => Number(key.slice(0, 4)))));

    let payrollRuns: PayrollRunLite[] = [];
    if (employeeIds.length > 0 && years.length > 0) {
      const statusFilter = includeDraftRuns ? ["draft", "final", "paid"] : ["final", "paid"];
      const runsRes = await supabase
        .from("payroll_runs")
        .select("employee_id, period_year, period_month, net_total, status, worked_hours")
        .in("employee_id", employeeIds)
        .in("period_year", years)
        .in("status", statusFilter);

      if (runsRes.error) throw runsRes.error;

      const monthKeySet = new Set(monthKeys);
      payrollRuns = ((runsRes.data || []) as Array<PayrollRunLite & { worked_hours?: number | null }>)
        .filter((run) => monthKeySet.has(getMonthKey(run.period_year, run.period_month)))
        .map((run) => ({
          employee_id: run.employee_id,
          period_year: run.period_year,
          period_month: run.period_month,
          net_total: Number(run.net_total ?? 0),
          status: String(run.status || "draft"),
          worked_hours: Number(run.worked_hours ?? 0),
        }));
    }

    return {
      windowRecords,
      employeeLinks,
      payrollRuns,
    };
  }, [includeDraftRuns]);

  useEffect(() => {
    if (!allowed) return;

    const fromDate = toDateStartLocal(dateRangeFrom);
    const toDate = toDateEndLocal(dateRangeTo);

    if (!fromDate || !toDate || fromDate > toDate) {
      setRangeRecords([]);
      setRangePayrollRuns([]);
      setRangeEmployeeLinks([]);
      return;
    }

    let cancelled = false;
    setLoadingRangeAnalytics(true);
    fetchAnalyticsWindow(fromDate, toDate)
      .then((data) => {
        if (cancelled) return;
        setRangeRecords(data.windowRecords);
        setRangePayrollRuns(data.payrollRuns);
        setRangeEmployeeLinks(data.employeeLinks);
      })
      .catch((e: any) => {
        if (cancelled) return;
        toast({
          title: "שגיאה בטעינת טווח תאריכים",
          description: e?.message || "לא ניתן לטעון נתונים",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingRangeAnalytics(false);
      });

    return () => {
      cancelled = true;
    };
  }, [allowed, dateRangeFrom, dateRangeTo, fetchAnalyticsWindow, toast]);

  const comparisonWindow = useMemo(() => {
    return getLastMonthsWindow(Math.max(2, Number(comparisonMonths) || 6));
  }, [comparisonMonths]);

  useEffect(() => {
    if (!allowed) return;

    let cancelled = false;
    setLoadingComparisonAnalytics(true);
    fetchAnalyticsWindow(comparisonWindow.from, comparisonWindow.to)
      .then((data) => {
        if (cancelled) return;
        setComparisonRecords(data.windowRecords);
        setComparisonPayrollRuns(data.payrollRuns);
        setComparisonEmployeeLinks(data.employeeLinks);
      })
      .catch((e: any) => {
        if (cancelled) return;
        toast({
          title: "שגיאה בטעינת השוואת חודשים",
          description: e?.message || "לא ניתן לטעון נתונים",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingComparisonAnalytics(false);
      });

    return () => {
      cancelled = true;
    };
  }, [allowed, comparisonWindow.from, comparisonWindow.to, fetchAnalyticsWindow, toast]);

  const toggleWorkMonthSummarySort = (key: WorkMonthSummarySortKey) => {
    setWorkMonthSummarySort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: key === "full_name" ? "asc" : "desc" };
    });
  };

  const toggleWorkMonthDetailSort = (key: WorkMonthDetailSortKey) => {
    setWorkMonthDetailSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: key === "employee" || key === "notes" ? "asc" : "desc" };
    });
  };

  const workMonthSummaryRows = useMemo(() => {
    const baseRows = workMonthUserFilter === "all"
      ? summaryWithTargets
      : summaryWithTargets.filter((u) => u.user_id === workMonthUserFilter);

    const nullSafeNumber = (value: number | null | undefined) => {
      if (value === null || value === undefined) {
        return workMonthSummarySort.direction === "asc"
          ? Number.POSITIVE_INFINITY
          : Number.NEGATIVE_INFINITY;
      }
      return value;
    };

    return [...baseRows].sort((a, b) => {
      let compare = 0;
      switch (workMonthSummarySort.key) {
        case "full_name":
          compare = a.full_name.localeCompare(b.full_name, "he");
          break;
        case "shifts":
          compare = a.shifts - b.shifts;
          break;
        case "total_minutes":
          compare = a.total_minutes - b.total_minutes;
          break;
        case "break_minutes":
          compare = a.break_minutes - b.break_minutes;
          break;
        case "overtime_minutes":
          compare = a.overtime_minutes - b.overtime_minutes;
          break;
        case "target_minutes":
          compare = nullSafeNumber(a.targetMinutes) - nullSafeNumber(b.targetMinutes);
          break;
        case "gap_minutes":
          compare = nullSafeNumber(a.gapMinutes) - nullSafeNumber(b.gapMinutes);
          break;
        case "utilization_pct":
          compare = nullSafeNumber(a.utilizationPct) - nullSafeNumber(b.utilizationPct);
          break;
        case "missing_clock_outs":
          compare = a.missing_clock_outs - b.missing_clock_outs;
          break;
      }
      return workMonthSummarySort.direction === "asc" ? compare : -compare;
    });
  }, [summaryWithTargets, workMonthUserFilter, workMonthSummarySort]);

  const workMonthDetailRows = useMemo(() => {
    const baseRows = workMonthUserFilter === "all"
      ? records
      : records.filter((r) => r.user_id === workMonthUserFilter);

    return [...baseRows].sort((a, b) => {
      const nameA = getAttendanceRecordDisplayName(a);
      const nameB = getAttendanceRecordDisplayName(b);

      let compare = 0;
      switch (workMonthDetailSort.key) {
        case "date":
          compare = new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime();
          break;
        case "employee":
          compare = nameA.localeCompare(nameB, "he");
          break;
        case "clock_in":
          compare = new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime();
          break;
        case "clock_out":
          compare = (a.clock_out ? new Date(a.clock_out).getTime() : 0) - (b.clock_out ? new Date(b.clock_out).getTime() : 0);
          break;
        case "duration_minutes":
          compare = (a.duration_minutes ?? 0) - (b.duration_minutes ?? 0);
          break;
        case "break_minutes":
          compare = (a.break_minutes ?? 0) - (b.break_minutes ?? 0);
          break;
        case "notes":
          compare = (a.notes ?? "").localeCompare(b.notes ?? "", "he");
          break;
      }
      return workMonthDetailSort.direction === "asc" ? compare : -compare;
    });
  }, [records, workMonthUserFilter, workMonthDetailSort]);

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

  const rangeVisibleRecords = useMemo(() => {
    return filterRecordsByUser(rangeRecords, workMonthUserFilter);
  }, [rangeRecords, workMonthUserFilter]);

  const rangeHoursSummary = useMemo(() => {
    return summarizeAttendanceHours(toAttendanceLite(rangeVisibleRecords));
  }, [rangeVisibleRecords]);

  const rangePaidSummary = useMemo(() => {
    return calculatePaidAmountForRecords({
      records: rangeRecords,
      payrollRuns: rangePayrollRuns,
      employeeLinks: rangeEmployeeLinks,
      profileHourlyRateByUserId,
      selectedUserId: workMonthUserFilter,
    });
  }, [
    rangeRecords,
    rangePayrollRuns,
    rangeEmployeeLinks,
    profileHourlyRateByUserId,
    workMonthUserFilter,
  ]);

  const comparisonRows = useMemo(() => {
    const monthKeys = getMonthKeysInRange(comparisonWindow.from, comparisonWindow.to);
    const rows = monthKeys.map((monthKey) => {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const monthRecords = filterRecordsByUser(
        comparisonRecords.filter((record) => {
          const clockIn = new Date(record.clock_in).getTime();
          return clockIn >= monthStart.getTime() && clockIn <= monthEnd.getTime();
        }),
        workMonthUserFilter,
      );

      const hours = summarizeAttendanceHours(toAttendanceLite(monthRecords));
      const paid = calculatePaidAmountForRecords({
        records: monthRecords,
        payrollRuns: comparisonPayrollRuns,
        employeeLinks: comparisonEmployeeLinks,
        profileHourlyRateByUserId,
        selectedUserId: "all",
      });

      return {
        monthKey,
        monthLabel: formatMonthKeyHebrew(monthKey),
        hours: hours.totalHours,
        shifts: hours.entriesCount,
        paidAmount: paid.totalAmount,
      };
    });

    return rows.map((row, index) => {
      const prev = index > 0 ? rows[index - 1] : null;
      return {
        ...row,
        deltaHours: prev ? row.hours - prev.hours : null,
        deltaPaidAmount: prev ? row.paidAmount - prev.paidAmount : null,
      };
    });
  }, [
    comparisonWindow.from,
    comparisonWindow.to,
    comparisonRecords,
    comparisonPayrollRuns,
    comparisonEmployeeLinks,
    profileHourlyRateByUserId,
    workMonthUserFilter,
  ]);

  const comparisonTotals = useMemo(() => {
    return comparisonRows.reduce(
      (acc, row) => {
        acc.hours += row.hours;
        acc.paidAmount += row.paidAmount;
        acc.shifts += row.shifts;
        return acc;
      },
      { hours: 0, paidAmount: 0, shifts: 0 },
    );
  }, [comparisonRows]);

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

  const exportEmployeeTimesheet = (userId: string, employeeName: string) => {
    const employeeRecords = records.filter((record) => record.user_id === userId);
    if (employeeRecords.length === 0) {
      toast({
        title: "אין נתונים לייצוא",
        description: `לא נמצאו רישומי נוכחות עבור ${employeeName} בחודש העבודה ${range.label}`,
        variant: "destructive",
      });
      return;
    }

    exportTimesheetPdf(employeeRecords, range.label, employeeName);
  };

  const exportSelectedEmployeeTimesheet = () => {
    if (workMonthUserFilter === "all") {
      toast({
        title: "בחר עובד",
        description: "בחר עובד ספציפי בשדה 'הצג עבור' כדי לייצא דוח אישי.",
      });
      return;
    }

    const selectedEmployee = summaryWithTargets.find((item) => item.user_id === workMonthUserFilter);
    const employeeName = selectedEmployee?.full_name || "עובד";
    exportEmployeeTimesheet(workMonthUserFilter, employeeName);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  title="ייצוא דוחות"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" dir="rtl">
                <DropdownMenuLabel className="text-right">ייצוא דוחות</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-end gap-2" onClick={() => exportSummaryToExcel(summary, range.label)}>
                  <span>Excel סיכום</span>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-end gap-2" onClick={() => exportDetailToExcel(records, range.label)}>
                  <span>Excel פירוט</span>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-end gap-2" onClick={() => exportSummaryToPdf(summary, range.label)}>
                  <span>PDF סיכום</span>
                  <FileText className="h-4 w-4 text-red-600" />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-end gap-2" onClick={() => exportDetailToPdf(records, range.label)}>
                  <span>PDF פירוט</span>
                  <FileText className="h-4 w-4 text-red-600" />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-end gap-2" onClick={exportSelectedEmployeeTimesheet}>
                  <span>PDF עובד נבחר</span>
                  <Download className="h-4 w-4 text-amber-700" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-end gap-2" onClick={() => exportSummaryToWord(summary, range.label)}>
                  <span>Word סיכום</span>
                  <FileText className="h-4 w-4 text-blue-600" />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-end gap-2" onClick={() => exportDetailToWord(records, range.label)}>
                  <span>Word פירוט</span>
                  <FileText className="h-4 w-4 text-blue-600" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <TabsTrigger value="date-range">טווח תאריכים</TabsTrigger>
            <TabsTrigger value="comparison">השוואת חודשים</TabsTrigger>
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
                        <SortableHeader
                          label="עובד"
                          isActive={workMonthSummarySort.key === "full_name"}
                          direction={workMonthSummarySort.direction}
                          onClick={() => toggleWorkMonthSummarySort("full_name")}
                        />
                        <SortableHeader
                          label="משמרות"
                          isActive={workMonthSummarySort.key === "shifts"}
                          direction={workMonthSummarySort.direction}
                          onClick={() => toggleWorkMonthSummarySort("shifts")}
                        />
                        <SortableHeader
                          label="סה״כ שעות"
                          isActive={workMonthSummarySort.key === "total_minutes"}
                          direction={workMonthSummarySort.direction}
                          onClick={() => toggleWorkMonthSummarySort("total_minutes")}
                        />
                        <SortableHeader
                          label="הפסקות"
                          isActive={workMonthSummarySort.key === "break_minutes"}
                          direction={workMonthSummarySort.direction}
                          onClick={() => toggleWorkMonthSummarySort("break_minutes")}
                        />
                        <SortableHeader
                          label="שעות נוספות"
                          isActive={workMonthSummarySort.key === "overtime_minutes"}
                          direction={workMonthSummarySort.direction}
                          onClick={() => toggleWorkMonthSummarySort("overtime_minutes")}
                        />
                        <SortableHeader
                          label="תקן שעות"
                          isActive={workMonthSummarySort.key === "target_minutes"}
                          direction={workMonthSummarySort.direction}
                          onClick={() => toggleWorkMonthSummarySort("target_minutes")}
                        />
                        <SortableHeader
                          label="פער לתקן"
                          isActive={workMonthSummarySort.key === "gap_minutes"}
                          direction={workMonthSummarySort.direction}
                          onClick={() => toggleWorkMonthSummarySort("gap_minutes")}
                        />
                        <SortableHeader
                          label="ביצוע"
                          isActive={workMonthSummarySort.key === "utilization_pct"}
                          direction={workMonthSummarySort.direction}
                          onClick={() => toggleWorkMonthSummarySort("utilization_pct")}
                        />
                        <SortableHeader
                          label="חוסר יציאה"
                          isActive={workMonthSummarySort.key === "missing_clock_outs"}
                          direction={workMonthSummarySort.direction}
                          onClick={() => toggleWorkMonthSummarySort("missing_clock_outs")}
                        />
                        <th className="p-2 text-right">ייצוא עובד</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={10} className="p-4 text-center">טוען...</td>
                        </tr>
                      )}
                      {!loading && workMonthSummaryRows.length === 0 && (
                        <tr>
                          <td colSpan={10} className="p-4 text-center text-muted-foreground">אין נתונים</td>
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
                          <td className="p-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportEmployeeTimesheet(u.user_id, u.full_name)}
                              title={`ייצוא דוח אישי עבור ${u.full_name}`}
                            >
                              <Download className="h-4 w-4 ml-1" />
                              PDF
                            </Button>
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
                        <SortableHeader
                          label="תאריך"
                          isActive={workMonthDetailSort.key === "date"}
                          direction={workMonthDetailSort.direction}
                          onClick={() => toggleWorkMonthDetailSort("date")}
                        />
                        <SortableHeader
                          label="עובד"
                          isActive={workMonthDetailSort.key === "employee"}
                          direction={workMonthDetailSort.direction}
                          onClick={() => toggleWorkMonthDetailSort("employee")}
                        />
                        <SortableHeader
                          label="כניסה"
                          isActive={workMonthDetailSort.key === "clock_in"}
                          direction={workMonthDetailSort.direction}
                          onClick={() => toggleWorkMonthDetailSort("clock_in")}
                        />
                        <SortableHeader
                          label="יציאה"
                          isActive={workMonthDetailSort.key === "clock_out"}
                          direction={workMonthDetailSort.direction}
                          onClick={() => toggleWorkMonthDetailSort("clock_out")}
                        />
                        <SortableHeader
                          label="סה״כ"
                          isActive={workMonthDetailSort.key === "duration_minutes"}
                          direction={workMonthDetailSort.direction}
                          onClick={() => toggleWorkMonthDetailSort("duration_minutes")}
                        />
                        <SortableHeader
                          label="הפסקה"
                          isActive={workMonthDetailSort.key === "break_minutes"}
                          direction={workMonthDetailSort.direction}
                          onClick={() => toggleWorkMonthDetailSort("break_minutes")}
                        />
                        <SortableHeader
                          label="הערות"
                          isActive={workMonthDetailSort.key === "notes"}
                          direction={workMonthDetailSort.direction}
                          onClick={() => toggleWorkMonthDetailSort("notes")}
                        />
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
                          <td className="p-2">{formatDateWithWeekday(r.clock_in)}</td>
                          <td className="p-2">{getAttendanceRecordDisplayName(r)}</td>
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
                      <th className="p-2">ייצוא</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={11} className="p-4 text-center">טוען...</td></tr>}
                    {!loading && summaryWithTargets.length === 0 && <tr><td colSpan={11} className="p-4 text-center text-muted-foreground">אין נתונים</td></tr>}
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
                        <td className="p-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportEmployeeTimesheet(u.user_id, u.full_name)}
                            title={`ייצוא דוח אישי עבור ${u.full_name}`}
                          >
                            <Download className="h-4 w-4 ml-1" />
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="date-range">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">סיכום לפי טווח תאריכים</CardTitle>
                    <CardDescription>
                      שעות + סכום משולם (Payroll קודם, שעות*תעריף כגיבוי)
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label>מתאריך</Label>
                      <Input
                        type="date"
                        value={dateRangeFrom}
                        onChange={(e) => setDateRangeFrom(e.target.value)}
                        className="w-[160px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>עד תאריך</Label>
                      <Input
                        type="date"
                        value={dateRangeTo}
                        onChange={(e) => setDateRangeTo(e.target.value)}
                        className="w-[160px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>עובד</Label>
                      <Select value={workMonthUserFilter} onValueChange={setWorkMonthUserFilter}>
                        <SelectTrigger className="w-[220px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל העובדים</SelectItem>
                          {allUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                      <Checkbox
                        id="include-draft-runs"
                        checked={!!includeDraftRuns}
                        onCheckedChange={(checked) => setIncludeDraftRuns(Boolean(checked))}
                      />
                      <Label htmlFor="include-draft-runs" className="text-xs cursor-pointer">
                        לכלול טיוטות תלוש
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingRangeAnalytics ? (
                  <div className="text-sm text-muted-foreground">טוען נתוני טווח...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <Stat label="סה״כ שעות" value={rangeHoursSummary.totalHours.toFixed(1)} />
                      <Stat label="סכום ששולם" value={formatNis(rangePaidSummary.totalAmount)} />
                      <Stat label="משמרות" value={rangeHoursSummary.entriesCount.toString()} />
                      <Stat label="שעות נוספות" value={(rangeHoursSummary.overtime125Hours + rangeHoursSummary.overtime150Hours).toFixed(1)} />
                      <Stat
                        label="ממוצע יומי"
                        value={(rangeHoursSummary.daysCount > 0
                          ? (rangeHoursSummary.totalHours / rangeHoursSummary.daysCount).toFixed(1)
                          : "0.0")}
                      />
                    </div>

                    <div className="rounded-md border p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">מבוסס תלושים</span>
                        <span className="font-medium">{formatNis(rangePaidSummary.payrollAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">חישוב גיבוי (שעות*תעריף)</span>
                        <span className="font-medium">{formatNis(rangePaidSummary.fallbackAmount)}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-right">
                            <th className="p-2">תאריך</th>
                            <th className="p-2">עובד</th>
                            <th className="p-2">כניסה</th>
                            <th className="p-2">יציאה</th>
                            <th className="p-2">סה״כ שעות</th>
                            <th className="p-2">הפסקה</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rangeVisibleRecords.slice(0, 200).map((r) => (
                            <tr key={r.id} className="border-b hover:bg-muted/40">
                              <td className="p-2">{formatDateWithWeekday(r.clock_in)}</td>
                              <td className="p-2">{getAttendanceRecordDisplayName(r)}</td>
                              <td className="p-2">{formatTime(r.clock_in)}</td>
                              <td className="p-2">{r.clock_out ? formatTime(r.clock_out) : "—"}</td>
                              <td className="p-2">{((r.duration_minutes ?? 0) / 60).toFixed(2)}</td>
                              <td className="p-2">{formatMinutes(r.break_minutes ?? 0)}</td>
                            </tr>
                          ))}
                          {rangeVisibleRecords.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-muted-foreground">אין נתונים לטווח זה</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">השוואת חודשים</CardTitle>
                    <CardDescription>
                      השוואת שעות וסכום בין חודשים
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label>טווח</Label>
                      <Select value={String(comparisonMonths)} onValueChange={(v) => setComparisonMonths(Number(v))}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 חודשים</SelectItem>
                          <SelectItem value="12">12 חודשים</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>עובד</Label>
                      <Select value={workMonthUserFilter} onValueChange={setWorkMonthUserFilter}>
                        <SelectTrigger className="w-[220px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל העובדים</SelectItem>
                          {allUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingComparisonAnalytics ? (
                  <div className="text-sm text-muted-foreground">טוען השוואת חודשים...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Stat label="סה״כ שעות" value={comparisonTotals.hours.toFixed(1)} />
                      <Stat label="סה״כ סכום" value={formatNis(comparisonTotals.paidAmount)} />
                      <Stat label="סה״כ משמרות" value={comparisonTotals.shifts.toString()} />
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-right">
                            <th className="p-2">חודש</th>
                            <th className="p-2">שעות</th>
                            <th className="p-2">שינוי שעות</th>
                            <th className="p-2">סכום ששולם</th>
                            <th className="p-2">שינוי סכום</th>
                            <th className="p-2">משמרות</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonRows.map((row) => (
                            <tr key={row.monthKey} className="border-b hover:bg-muted/40">
                              <td className="p-2 font-medium">{row.monthLabel}</td>
                              <td className="p-2">{row.hours.toFixed(1)}</td>
                              <td className={`p-2 ${row.deltaHours === null ? "" : row.deltaHours >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {row.deltaHours === null ? "—" : formatSignedNumber(row.deltaHours, 1)}
                              </td>
                              <td className="p-2">{formatNis(row.paidAmount)}</td>
                              <td className={`p-2 ${row.deltaPaidAmount === null ? "" : row.deltaPaidAmount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {row.deltaPaidAmount === null ? "—" : formatSignedNis(row.deltaPaidAmount)}
                              </td>
                              <td className="p-2">{row.shifts}</td>
                            </tr>
                          ))}
                          {comparisonRows.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-muted-foreground">אין נתונים להצגה</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
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
                        <td className="p-2">{formatDateWithWeekday(r.clock_in)}</td>
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

function SortableHeader({
  label,
  isActive,
  direction,
  onClick,
}: {
  label: string;
  isActive: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const Icon = isActive ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th className="p-2 group">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-right"
        title={`מיון לפי ${label}`}
      >
        <span>{label}</span>
        <Icon className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </th>
  );
}

function getAttendanceRecordDisplayName(record: AttendanceRecord): string {
  return record.profile?.full_name ?? record.user_id.slice(0, 8);
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

function formatDateWithWeekday(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const weekday = HEBREW_WEEKDAYS[d.getDay()] ?? "";
  return `${formatDate(iso)} (${weekday})`;
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

const HEBREW_WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function monthDiffInCalendarMonths(base: Date, target: Date): number {
  return (
    (target.getFullYear() - base.getFullYear()) * 12 +
    (target.getMonth() - base.getMonth())
  );
}

function isIsoDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toDateStartLocal(value: string): Date | null {
  if (!isIsoDateInput(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function toDateEndLocal(value: string): Date | null {
  if (!isIsoDateInput(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getMonthKeysInRange(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);

  while (cursor.getTime() <= end.getTime()) {
    keys.push(getMonthKey(cursor.getFullYear(), cursor.getMonth() + 1));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
}

function getLastMonthsWindow(monthCount: number): { from: Date; to: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const from = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1, 0, 0, 0, 0);
  return { from, to: end };
}

function toAttendanceLite(records: AttendanceRecord[]) {
  return records.map((record) => ({
    user_id: record.user_id,
    clock_in: record.clock_in,
    clock_out: record.clock_out,
    duration_minutes: record.duration_minutes,
  }));
}

function filterRecordsByUser(records: AttendanceRecord[], selectedUserId: string): AttendanceRecord[] {
  if (selectedUserId === "all") return records;
  return records.filter((record) => record.user_id === selectedUserId);
}

function statusPriority(status: string): number {
  if (status === "paid") return 3;
  if (status === "final") return 2;
  if (status === "draft") return 1;
  return 0;
}

function calculatePaidAmountForRecords({
  records,
  payrollRuns,
  employeeLinks,
  profileHourlyRateByUserId,
  selectedUserId,
}: {
  records: AttendanceRecord[];
  payrollRuns: PayrollRunLite[];
  employeeLinks: EmployeeLinkLite[];
  profileHourlyRateByUserId: Record<string, number>;
  selectedUserId: string;
}) {
  const visibleRecords = filterRecordsByUser(records, selectedUserId)
    .filter((record) => !!record.clock_out && Number(record.duration_minutes ?? 0) > 0);

  const linkByUserId = new Map<string, EmployeeLinkLite>();
  employeeLinks.forEach((link) => {
    if (!linkByUserId.has(link.userId)) {
      linkByUserId.set(link.userId, link);
    }
  });

  const runByEmployeeMonth = new Map<string, PayrollRunLite>();
  payrollRuns.forEach((run) => {
    const key = `${run.employee_id}__${getMonthKey(run.period_year, run.period_month)}`;
    const existing = runByEmployeeMonth.get(key);
    if (!existing || statusPriority(run.status) > statusPriority(existing.status)) {
      runByEmployeeMonth.set(key, run);
    }
  });

  const hoursByUserMonth = new Map<string, number>();
  visibleRecords.forEach((record) => {
    const clockInDate = new Date(record.clock_in);
    const monthKey = getMonthKey(clockInDate.getFullYear(), clockInDate.getMonth() + 1);
    const key = `${record.user_id}__${monthKey}`;
    const current = hoursByUserMonth.get(key) || 0;
    hoursByUserMonth.set(key, current + Number(record.duration_minutes ?? 0) / 60);
  });

  let payrollAmount = 0;
  let fallbackAmount = 0;

  hoursByUserMonth.forEach((hoursInRange, userMonthKey) => {
    const [userId, monthKey] = userMonthKey.split("__");
    const link = linkByUserId.get(userId);

    if (link) {
      const run = runByEmployeeMonth.get(`${link.employeeId}__${monthKey}`);
      if (run && Number(run.net_total ?? 0) > 0) {
        if (Number(run.worked_hours ?? 0) > 0 && hoursInRange > 0) {
          const ratio = Math.min(1, hoursInRange / Number(run.worked_hours));
          payrollAmount += Number(run.net_total) * ratio;
        } else {
          payrollAmount += Number(run.net_total);
        }
        return;
      }
    }

    const employeeRate = link ? Number(link.hourlyRate ?? 0) : 0;
    const profileRate = Number(profileHourlyRateByUserId[userId] ?? 0);
    const effectiveRate = employeeRate > 0 ? employeeRate : profileRate;
    fallbackAmount += hoursInRange * effectiveRate;
  });

  return {
    payrollAmount,
    fallbackAmount,
    totalAmount: payrollAmount + fallbackAmount,
  };
}

function formatMonthKeyHebrew(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const month = Number(monthStr);
  const year = Number(yearStr);
  const monthLabel = HEBREW_MONTHS[Math.max(0, Math.min(11, month - 1))] || monthKey;
  return `${monthLabel} ${year}`;
}

function formatNis(value: number): string {
  return `₪${Math.round(value).toLocaleString("he-IL")}`;
}

function formatSignedNumber(value: number, digits = 0): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(digits)}`;
}

function formatSignedNis(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}₪${Math.round(Math.abs(value)).toLocaleString("he-IL")}`;
}
