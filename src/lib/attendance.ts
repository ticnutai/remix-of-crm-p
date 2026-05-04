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
  // joined
  profile?: { full_name: string; email: string } | null;
}

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
  if (error) throw error;
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
  // Manager view — fetch all + join profiles
  const { data, error } = await supabase
    .from("attendance_records" as any)
    .select("*, profile:profiles!attendance_records_user_id_fkey(full_name,email)")
    .gte("clock_in", fromIso)
    .lte("clock_in", toIso)
    .order("clock_in", { ascending: false });
  if (error) {
    // fallback if FK alias not detected
    const { data: data2, error: e2 } = await supabase
      .from("attendance_records" as any)
      .select("*")
      .gte("clock_in", fromIso)
      .lte("clock_in", toIso)
      .order("clock_in", { ascending: false });
    if (e2) throw e2;
    return (data2 ?? []) as AttendanceRecord[];
  }
  return (data ?? []) as AttendanceRecord[];
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

export function summarizeByUser(records: AttendanceRecord[]): UserSummary[] {
  const map = new Map<string, UserSummary>();
  for (const r of records) {
    const key = r.user_id;
    let s = map.get(key);
    if (!s) {
      s = {
        user_id: key,
        full_name: r.profile?.full_name ?? r.user_id.slice(0, 8),
        email: r.profile?.email ?? "",
        shifts: 0, total_minutes: 0, break_minutes: 0,
        overtime_minutes: 0, missing_clock_outs: 0,
      };
      map.set(key, s);
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
  return Array.from(map.values()).sort((a, b) => b.total_minutes - a.total_minutes);
}

export function findMissingDays(
  records: AttendanceRecord[],
  from: Date,
  to: Date,
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
