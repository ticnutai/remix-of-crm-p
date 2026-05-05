// Attendance helpers — shared by employee + admin pages.
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const REGULAR_DAY_MINUTES = 510; // 8.5h
export const OVERTIME_RATE_125 = 120;   // first 2h over 8.5h
export const OVERTIME_RATE_150 = 999;   // beyond that

export interface AttendanceRecord {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  break_minutes: number;
  notes: string | null;
  is_edited: boolean;
  edited_by: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  // advanced (optional, may be missing on old rows)
  day_type?: DayType;
  approved_by?: string | null;
  approved_at?: string | null;
  locked?: boolean;
  manual_entry?: boolean;
  work_date?: string | null;
  // joined
  profile?: { full_name: string; email: string } | null;
}

export type DayType =
  | "work"
  | "vacation"
  | "sick"
  | "army"
  | "bereavement"
  | "maternity"
  | "wfh"
  | "absent"
  | "holiday";

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  work:        "עבודה",
  vacation:    "חופש",
  sick:        "מחלה",
  army:        "מילואים",
  bereavement: "אבל",
  maternity:   "לידה",
  wfh:         "מהבית",
  absent:      "חיסור",
  holiday:     "חג",
};

export const DAY_TYPE_COLORS: Record<DayType, string> = {
  work:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  vacation:    "bg-amber-50 text-amber-700 border-amber-200",
  sick:        "bg-rose-50 text-rose-700 border-rose-200",
  army:        "bg-green-100 text-green-800 border-green-300",
  bereavement: "bg-zinc-100 text-zinc-700 border-zinc-300",
  maternity:   "bg-pink-50 text-pink-700 border-pink-200",
  wfh:         "bg-sky-50 text-sky-700 border-sky-200",
  absent:      "bg-gray-100 text-gray-600 border-gray-300",
  holiday:     "bg-purple-50 text-purple-700 border-purple-200",
};

export interface AttendanceBreak {
  id: string;
  attendance_id: string;
  user_id: string;
  break_start: string;
  break_end: string | null;
  duration_minutes: number | null;
  reason: string | null;
}

// ---------- formatting ----------
export function formatMinutes(mins?: number | null): string {
  const n = Math.max(0, Math.round(mins ?? 0));
  const h = Math.floor(n / 60);
  const m = n % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

export function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("he-IL");
}

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------- overtime ----------
export function splitOvertime(durationMinutes: number) {
  const regular = Math.min(durationMinutes, REGULAR_DAY_MINUTES);
  const over    = Math.max(0, durationMinutes - REGULAR_DAY_MINUTES);
  const ot125   = Math.min(over, OVERTIME_RATE_125);
  const ot150   = Math.max(0, over - OVERTIME_RATE_125);
  return { regular, ot125, ot150 };
}

// ---------- API: clock in / out ----------
export async function getOpenShift(userId: string) {
  const { data, error } = await supabase
    .from("attendance_records" as any)
    .select("*")
    .eq("user_id", userId)
    .is("clock_out", null)
    .maybeSingle();
  if (error) throw error;
  return data as AttendanceRecord | null;
}

export async function clockIn(userId: string, location?: { lat: number; lng: number }) {
  // If there's already an open shift, return it instead of failing on the unique index
  const existing = await getOpenShift(userId);
  if (existing) return existing;

  const payload: Record<string, unknown> = { user_id: userId, clock_in: new Date().toISOString() };
  if (location) {
    payload.location_lat = location.lat;
    payload.location_lng = location.lng;
  }
  const { data, error } = await supabase
    .from("attendance_records" as any)
    .insert(payload)
    .select()
    .single();
  if (error) {
    // 23505 = unique_violation → idx_attendance_one_open_per_user
    if ((error as any).code === "23505") {
      const fallback = await getOpenShift(userId);
      if (fallback) return fallback;
    }
    throw error;
  }
  return data as AttendanceRecord;
}

export async function clockOut(recordId: string, notes?: string) {
  const { data, error } = await supabase
    .from("attendance_records" as any)
    .update({ clock_out: new Date().toISOString(), notes: notes ?? null })
    .eq("id", recordId)
    .select()
    .single();
  if (error) throw error;
  return data as AttendanceRecord;
}

export async function getOpenBreak(attendanceId: string) {
  const { data, error } = await supabase
    .from("attendance_breaks" as any)
    .select("*")
    .eq("attendance_id", attendanceId)
    .is("break_end", null)
    .maybeSingle();
  if (error) throw error;
  return data as AttendanceBreak | null;
}

export async function startBreak(attendanceId: string, userId: string, reason?: string) {
  const { data, error } = await supabase
    .from("attendance_breaks" as any)
    .insert({ attendance_id: attendanceId, user_id: userId, reason: reason ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as AttendanceBreak;
}

export async function endBreak(breakId: string) {
  const { data, error } = await supabase
    .from("attendance_breaks" as any)
    .update({ break_end: new Date().toISOString() })
    .eq("id", breakId)
    .select()
    .single();
  if (error) throw error;
  return data as AttendanceBreak;
}

export async function listMyRecords(userId: string, fromIso: string, toIso: string) {
  const { data, error } = await supabase
    .from("attendance_records" as any)
    .select("*")
    .eq("user_id", userId)
    .gte("clock_in", fromIso)
    .lte("clock_in", toIso)
    .order("clock_in", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AttendanceRecord[];
}

export async function listAllRecords(fromIso: string, toIso: string) {
  // Manager view — fetch records first, then merge profiles in JS to avoid
  // unreliable FK aliases that can return 400 on some Supabase setups.
  const { data, error } = await supabase
    .from("attendance_records" as any)
    .select("*")
    .gte("clock_in", fromIso)
    .lte("clock_in", toIso)
    .order("clock_in", { ascending: false });
  if (error) throw error;
  const records = (data ?? []) as AttendanceRecord[];

  const userIds = Array.from(new Set(records.map((r) => r.user_id).filter(Boolean)));
  if (userIds.length === 0) return records;

  const { data: profiles } = await supabase
    .from("profiles" as any)
    .select("id, full_name, email")
    .in("id", userIds);

  const byId = new Map<string, { full_name?: string; email?: string }>();
  (profiles ?? []).forEach((p: any) => byId.set(p.id, { full_name: p.full_name, email: p.email }));

  return records.map((r) => ({
    ...r,
    profile: byId.get(r.user_id) ?? r.profile ?? null,
  })) as AttendanceRecord[];
}

// Manager view — fetch ALL active users (profiles) so admin can see employees
// who have zero attendance records this month too.
export interface AttendanceUser {
  id: string;
  full_name: string;
  email: string;
}
export async function listAllUsers(): Promise<AttendanceUser[]> {
  const { data, error } = await supabase
    .from("profiles" as any)
    .select("id, full_name, email, is_active")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .filter((p: any) => p.is_active !== false)
    .map((p: any) => ({
      id: p.id,
      full_name: p.full_name ?? p.email ?? "ללא שם",
      email: p.email ?? "",
    }));
}

// ---------- summaries ----------
export interface UserSummary {
  user_id: string;
  full_name: string;
  email: string;
  shifts: number;
  total_minutes: number;
  break_minutes: number;
  overtime_minutes: number;
  missing_clock_outs: number;
}

export function summarizeByUser(
  records: AttendanceRecord[],
  allUsers: AttendanceUser[] = [],
): UserSummary[] {
  const map = new Map<string, UserSummary>();
  // Seed with every known user so users with zero records still appear.
  for (const u of allUsers) {
    map.set(u.id, {
      user_id: u.id,
      full_name: u.full_name,
      email: u.email,
      shifts: 0, total_minutes: 0, break_minutes: 0,
      overtime_minutes: 0, missing_clock_outs: 0,
    });
  }
  for (const r of records) {
    const key = r.user_id;
    let s = map.get(key);
    if (!s) {
      s = {
        user_id: key,
        full_name: r.profile?.full_name ?? r.profile?.email ?? "ללא שם",
        email: r.profile?.email ?? "",
        shifts: 0, total_minutes: 0, break_minutes: 0,
        overtime_minutes: 0, missing_clock_outs: 0,
      };
      map.set(key, s);
    } else if ((!s.full_name || s.full_name === "ללא שם") && r.profile?.full_name) {
      s.full_name = r.profile.full_name;
      s.email = r.profile.email ?? s.email;
    }
    if (r.clock_out) {
      s.shifts += 1;
      s.total_minutes += r.duration_minutes ?? 0;
      s.break_minutes += r.break_minutes ?? 0;
      s.overtime_minutes += Math.max(0, (r.duration_minutes ?? 0) - REGULAR_DAY_MINUTES);
    } else {
      s.missing_clock_outs += 1;
    }
  }
  // Sort: users with hours first (desc), then zero-hour users alphabetically.
  return Array.from(map.values()).sort((a, b) => {
    if (b.total_minutes !== a.total_minutes) return b.total_minutes - a.total_minutes;
    return a.full_name.localeCompare(b.full_name, "he");
  });
}

export function findMissingDays(
  records: AttendanceRecord[],
  from: Date,
  to: Date,
  allUserIds: string[] = [],
): Record<string, string[]> {
  // returns { user_id: [yyyy-mm-dd, ...] } for weekdays without ANY record
  const days: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    const dow = cur.getDay(); // 0 sun ... 6 sat — Israel work week ~ Sun–Thu
    if (dow !== 5 && dow !== 6) days.push(ymd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  const present = new Map<string, Set<string>>();
  // Seed every known user with empty set so they get a full missing list if they never clocked in.
  for (const u of allUserIds) {
    if (!present.has(u)) present.set(u, new Set());
  }
  for (const r of records) {
    const u = r.user_id;
    const day = ymd(new Date(r.clock_in));
    if (!present.has(u)) present.set(u, new Set());
    present.get(u)!.add(day);
  }
  const result: Record<string, string[]> = {};
  for (const [u, set] of present.entries()) {
    result[u] = days.filter(d => !set.has(d));
  }
  return result;
}

// ---------- exports ----------
export function exportSummaryToExcel(summary: UserSummary[], monthLabel: string) {
  const rows = summary.map(s => ({
    "שם עובד":       s.full_name,
    "אימייל":         s.email,
    "מס׳ משמרות":    s.shifts,
    "סה״כ שעות":     formatMinutes(s.total_minutes),
    "שעות הפסקה":   formatMinutes(s.break_minutes),
    "שעות נוספות":  formatMinutes(s.overtime_minutes),
    "חוסר יציאה":    s.missing_clock_outs,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "סיכום");
  XLSX.writeFile(wb, `attendance_${monthLabel}.xlsx`);
}

export function exportDetailToExcel(records: AttendanceRecord[], monthLabel: string) {
  const rows = records.map(r => ({
    "תאריך":         formatDate(r.clock_in),
    "שם עובד":      r.profile?.full_name ?? r.user_id,
    "כניסה":         formatTime(r.clock_in),
    "יציאה":         formatTime(r.clock_out),
    "סה״כ":          formatMinutes(r.duration_minutes ?? 0),
    "הפסקה":         formatMinutes(r.break_minutes ?? 0),
    "הערות":         r.notes ?? "",
    "נערך":          r.is_edited ? "כן" : "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "פירוט");
  XLSX.writeFile(wb, `attendance_detail_${monthLabel}.xlsx`);
}

export function exportSummaryToPdf(summary: UserSummary[], monthLabel: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(`Attendance summary - ${monthLabel}`, 14, 14);
  autoTable(doc, {
    startY: 20,
    head: [["Employee", "Email", "Shifts", "Total", "Breaks", "Overtime", "Missing out"]],
    body: summary.map(s => [
      s.full_name, s.email, s.shifts,
      formatMinutes(s.total_minutes),
      formatMinutes(s.break_minutes),
      formatMinutes(s.overtime_minutes),
      s.missing_clock_outs,
    ]),
    styles: { fontSize: 9 },
  });
  doc.save(`attendance_${monthLabel}.pdf`);
}

// ============================================================================
// MONTHLY TIMESHEET — manual entries by day
// ============================================================================

export interface DayCell {
  date: string;            // yyyy-mm-dd
  weekday: number;         // 0=Sun ... 6=Sat
  isWeekend: boolean;
  record: AttendanceRecord | null;
}

export function buildMonthDays(year: number, month0: number): DayCell[] {
  // month0: 0-11
  const cells: DayCell[] = [];
  const last = new Date(year, month0 + 1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const dt = new Date(year, month0, d);
    const dow = dt.getDay();
    cells.push({
      date: `${year}-${String(month0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      weekday: dow,
      isWeekend: dow === 5 || dow === 6,
      record: null,
    });
  }
  return cells;
}

export function attachRecordsToDays(cells: DayCell[], records: AttendanceRecord[]): DayCell[] {
  const map = new Map<string, AttendanceRecord>();
  for (const r of records) {
    const day = r.work_date ?? (r.clock_in ? r.clock_in.slice(0, 10) : null);
    if (day) map.set(day, r);
  }
  return cells.map(c => ({ ...c, record: map.get(c.date) ?? null }));
}

export async function listMonthRecords(userId: string, year: number, month0: number): Promise<AttendanceRecord[]> {
  const from = `${year}-${String(month0 + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  const to = `${year}-${String(month0 + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  // try by work_date column first
  const { data, error } = await supabase
    .from("attendance_records" as any)
    .select("*")
    .eq("user_id", userId)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AttendanceRecord[];
}

export interface ManualEntryInput {
  user_id: string;
  date: string;            // yyyy-mm-dd
  clock_in?: string | null;  // HH:MM
  clock_out?: string | null; // HH:MM
  break_minutes?: number;
  day_type?: DayType;
  notes?: string | null;
}

function combineDateTime(date: string, hhmm: string): string {
  // Treat as Asia/Jerusalem local — store as ISO with that offset
  // Simple approach: build date in local tz of browser (Israel users) and toISOString
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, 0, 0);
  return dt.toISOString();
}

export async function upsertManualEntry(input: ManualEntryInput): Promise<AttendanceRecord> {
  const dayType: DayType = input.day_type ?? "work";
  const hasTimes = !!(input.clock_in && input.clock_out);
  const clockInIso = input.clock_in ? combineDateTime(input.date, input.clock_in) : null;
  const clockOutIso = input.clock_out ? combineDateTime(input.date, input.clock_out) : null;

  // Look for an existing record on this date
  const { data: existing, error: findErr } = await supabase
    .from("attendance_records" as any)
    .select("id")
    .eq("user_id", input.user_id)
    .eq("work_date", input.date)
    .maybeSingle();
  if (findErr) throw findErr;

  const payload: Record<string, unknown> = {
    user_id: input.user_id,
    work_date: input.date,
    clock_in: clockInIso ?? new Date(`${input.date}T00:00:00`).toISOString(),
    clock_out: clockOutIso,
    break_minutes: input.break_minutes ?? 0,
    day_type: dayType,
    notes: input.notes ?? null,
    manual_entry: true,
    is_edited: true,
  };
  if (hasTimes && clockInIso && clockOutIso) {
    payload.duration_minutes = Math.max(
      0,
      Math.round((new Date(clockOutIso).getTime() - new Date(clockInIso).getTime()) / 60000)
        - (input.break_minutes ?? 0),
    );
  }

  if (existing && (existing as any).id) {
    const { data, error } = await supabase
      .from("attendance_records" as any)
      .update(payload)
      .eq("id", (existing as any).id)
      .select()
      .single();
    if (error) throw error;
    return data as AttendanceRecord;
  }
  const { data, error } = await supabase
    .from("attendance_records" as any)
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AttendanceRecord;
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await supabase.from("attendance_records" as any).delete().eq("id", id);
  if (error) throw error;
}

export async function approveRecord(id: string, approve: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("attendance_records" as any)
    .update({
      approved_by: approve ? (user?.id ?? null) : null,
      approved_at: approve ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function lockMonth(userId: string, year: number, month1: number, lock: boolean): Promise<number> {
  const { data, error } = await supabase.rpc("attendance_lock_month" as any, {
    p_user_id: userId, p_year: year, p_month: month1, p_lock: lock,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function copyPreviousMonth(userId: string, year: number, month0: number): Promise<number> {
  // Read previous month's work-day records, create entries for the current month at the same weekdays
  const prev = new Date(year, month0 - 1, 1);
  const prevRecords = await listMonthRecords(userId, prev.getFullYear(), prev.getMonth());
  let count = 0;
  for (const r of prevRecords) {
    if (r.day_type && r.day_type !== "work") continue;
    if (!r.clock_in) continue;
    const baseDate = new Date(r.work_date ?? r.clock_in.slice(0, 10));
    // Map to same day-of-month in target month if exists
    const targetDay = baseDate.getDate();
    const lastInTarget = new Date(year, month0 + 1, 0).getDate();
    if (targetDay > lastInTarget) continue;
    const targetDate = `${year}-${String(month0 + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
    const ci = r.clock_in.slice(11, 16);
    const co = r.clock_out ? r.clock_out.slice(11, 16) : null;
    if (!co) continue;
    try {
      await upsertManualEntry({
        user_id: userId,
        date: targetDate,
        clock_in: ci,
        clock_out: co,
        break_minutes: r.break_minutes ?? 0,
        day_type: "work",
      });
      count++;
    } catch { /* skip conflicts */ }
  }
  return count;
}

export async function autoFillMonth(
  userId: string,
  year: number,
  month0: number,
  defaults: { clockIn: string; clockOut: string; breakMinutes: number },
): Promise<number> {
  const cells = buildMonthDays(year, month0);
  const existing = await listMonthRecords(userId, year, month0);
  const have = new Set(existing.map(r => r.work_date ?? r.clock_in?.slice(0, 10)).filter(Boolean));
  let count = 0;
  for (const c of cells) {
    if (c.isWeekend) continue;
    if (have.has(c.date)) continue;
    try {
      await upsertManualEntry({
        user_id: userId,
        date: c.date,
        clock_in: defaults.clockIn,
        clock_out: defaults.clockOut,
        break_minutes: defaults.breakMinutes,
        day_type: "work",
      });
      count++;
    } catch { /* skip */ }
  }
  return count;
}

// ---------- summary for one month ----------
export interface MonthSummary {
  workDays: number;
  totalMinutes: number;
  overtimeMinutes: number;
  breakMinutes: number;
  vacationDays: number;
  sickDays: number;
  absentDays: number;
}

export function summarizeMonth(records: AttendanceRecord[]): MonthSummary {
  let workDays = 0, total = 0, ot = 0, br = 0, vac = 0, sick = 0, absent = 0;
  for (const r of records) {
    const t = (r.day_type ?? "work") as DayType;
    if (t === "vacation") vac++;
    else if (t === "sick") sick++;
    else if (t === "absent") absent++;
    else if (r.clock_out) {
      workDays++;
      const dur = r.duration_minutes ?? 0;
      total += dur;
      ot += Math.max(0, dur - REGULAR_DAY_MINUTES);
      br += r.break_minutes ?? 0;
    }
  }
  return {
    workDays, totalMinutes: total, overtimeMinutes: ot, breakMinutes: br,
    vacationDays: vac, sickDays: sick, absentDays: absent,
  };
}

// ---------- payroll CSV (generic) ----------
export function exportPayrollCsv(
  records: AttendanceRecord[],
  monthLabel: string,
  employeeName?: string,
) {
  const header = ["Date","Day","CheckIn","CheckOut","BreakMinutes","TotalMinutes","DayType","Notes"];
  const rows = records.map(r => {
    const date = r.work_date ?? r.clock_in?.slice(0, 10) ?? "";
    const day = date ? new Date(date).toLocaleDateString("he-IL", { weekday: "short" }) : "";
    return [
      date, day,
      r.clock_in ? r.clock_in.slice(11, 16) : "",
      r.clock_out ? r.clock_out.slice(11, 16) : "",
      String(r.break_minutes ?? 0),
      String(r.duration_minutes ?? 0),
      r.day_type ?? "work",
      (r.notes ?? "").replaceAll(",", " "),
    ].join(",");
  });
  const csv = "\uFEFF" + [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payroll_${employeeName ?? "user"}_${monthLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTimesheetPdf(
  records: AttendanceRecord[],
  monthLabel: string,
  employeeName?: string,
  signed?: boolean,
) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Timesheet ${employeeName ?? ""} - ${monthLabel}`, 14, 14);
  autoTable(doc, {
    startY: 20,
    head: [["Date","In","Out","Break","Total","Type","Notes"]],
    body: records.map(r => [
      r.work_date ?? (r.clock_in ?? "").slice(0,10),
      r.clock_in ? r.clock_in.slice(11, 16) : "-",
      r.clock_out ? r.clock_out.slice(11, 16) : "-",
      formatMinutes(r.break_minutes ?? 0),
      formatMinutes(r.duration_minutes ?? 0),
      r.day_type ?? "work",
      r.notes ?? "",
    ]),
    styles: { fontSize: 9 },
  });
  if (signed) {
    const y = (doc as any).lastAutoTable?.finalY ?? 30;
    doc.setFontSize(10);
    doc.text(`Signed: ${new Date().toLocaleString("he-IL")}`, 14, y + 12);
  }
  doc.save(`timesheet_${employeeName ?? "user"}_${monthLabel}.pdf`);
}

