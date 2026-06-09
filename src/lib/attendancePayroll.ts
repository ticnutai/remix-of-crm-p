export type OvertimeMode = "manual" | "auto" | "none";

export interface AttendanceRecordLite {
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
}

export interface AttendanceHoursSummary {
  entriesCount: number;
  daysCount: number;
  totalMinutes: number;
  totalHours: number;
  regularMinutes: number;
  regularHours: number;
  overtime125Minutes: number;
  overtime125Hours: number;
  overtime150Minutes: number;
  overtime150Hours: number;
}

const REGULAR_DAILY_MINUTES = Math.round(8.6 * 60);
const OVERTIME_125_LIMIT_MINUTES = 120;

export function getMonthIsoWindow(year: number, month: number): {
  from: string;
  to: string;
} {
  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)).toISOString();
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
  return { from, to };
}

function toSafePositiveMinutes(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value > 0 ? value : 0;
}

export function summarizeAttendanceHours(
  records: AttendanceRecordLite[],
): AttendanceHoursSummary {
  const validRecords = records.filter(
    (record) =>
      !!record.user_id &&
      !!record.clock_in &&
      !!record.clock_out &&
      toSafePositiveMinutes(record.duration_minutes) > 0,
  );

  const dayMinutes = new Map<string, number>();
  let totalMinutes = 0;

  validRecords.forEach((record) => {
    const minutes = toSafePositiveMinutes(record.duration_minutes);
    const dayKey = String(record.clock_in).slice(0, 10);
    totalMinutes += minutes;
    dayMinutes.set(dayKey, (dayMinutes.get(dayKey) || 0) + minutes);
  });

  let regularMinutes = 0;
  let overtime125Minutes = 0;
  let overtime150Minutes = 0;

  dayMinutes.forEach((minutesForDay) => {
    regularMinutes += Math.min(minutesForDay, REGULAR_DAILY_MINUTES);
    const extraMinutes = Math.max(0, minutesForDay - REGULAR_DAILY_MINUTES);
    overtime125Minutes += Math.min(extraMinutes, OVERTIME_125_LIMIT_MINUTES);
    overtime150Minutes += Math.max(0, extraMinutes - OVERTIME_125_LIMIT_MINUTES);
  });

  const toHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

  return {
    entriesCount: validRecords.length,
    daysCount: dayMinutes.size,
    totalMinutes,
    totalHours: toHours(totalMinutes),
    regularMinutes,
    regularHours: toHours(regularMinutes),
    overtime125Minutes,
    overtime125Hours: toHours(overtime125Minutes),
    overtime150Minutes,
    overtime150Hours: toHours(overtime150Minutes),
  };
}

export function summarizeAttendanceByUser(
  records: AttendanceRecordLite[],
): Record<string, AttendanceHoursSummary> {
  const grouped = new Map<string, AttendanceRecordLite[]>();

  records.forEach((record) => {
    if (!record.user_id) return;
    const current = grouped.get(record.user_id) || [];
    current.push(record);
    grouped.set(record.user_id, current);
  });

  const result: Record<string, AttendanceHoursSummary> = {};
  grouped.forEach((userRecords, userId) => {
    result[userId] = summarizeAttendanceHours(userRecords);
  });

  return result;
}
