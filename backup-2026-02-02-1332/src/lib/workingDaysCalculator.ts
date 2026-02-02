// Working Days Calculator - מחשבון ימי עבודה
// Supports Israeli calendar: excludes Fridays, Saturdays, and Jewish holidays

import { addDays, differenceInDays, isAfter, isBefore, isSameDay, startOfDay, format, getYear } from 'date-fns';

// Israeli holidays - מועדים ישראליים וערבי חג
// These dates are fixed by Hebrew calendar, here we provide approximate Gregorian dates for common years
// For production, consider using a proper Hebrew calendar library

interface Holiday {
  name: string;
  nameHe: string;
  isEve?: boolean; // ערב חג
}

// Function to get holidays for a specific year
// Note: These are approximations - in production use a Hebrew calendar library
function getIsraeliHolidays(year: number): Map<string, Holiday> {
  const holidays = new Map<string, Holiday>();
  
  // 2024-2027 holidays (approximate Gregorian dates)
  const holidaysByYear: Record<number, Array<{ date: string; name: string; nameHe: string; isEve?: boolean }>> = {
    2024: [
      // פסח
      { date: '2024-04-22', name: 'Passover Eve', nameHe: 'ערב פסח', isEve: true },
      { date: '2024-04-23', name: 'Passover 1', nameHe: 'פסח א' },
      { date: '2024-04-24', name: 'Passover 2', nameHe: 'פסח ב' },
      { date: '2024-04-29', name: 'Passover 7', nameHe: 'פסח ז' },
      { date: '2024-04-30', name: 'Passover 8', nameHe: 'פסח ח' },
      // יום העצמאות
      { date: '2024-05-13', name: 'Independence Eve', nameHe: 'ערב עצמאות', isEve: true },
      { date: '2024-05-14', name: 'Independence Day', nameHe: 'יום העצמאות' },
      // שבועות
      { date: '2024-06-11', name: 'Shavuot Eve', nameHe: 'ערב שבועות', isEve: true },
      { date: '2024-06-12', name: 'Shavuot', nameHe: 'שבועות' },
      // ראש השנה
      { date: '2024-10-02', name: 'Rosh Hashanah Eve', nameHe: 'ערב ראש השנה', isEve: true },
      { date: '2024-10-03', name: 'Rosh Hashanah 1', nameHe: 'ראש השנה א' },
      { date: '2024-10-04', name: 'Rosh Hashanah 2', nameHe: 'ראש השנה ב' },
      // יום כיפור
      { date: '2024-10-11', name: 'Yom Kippur Eve', nameHe: 'ערב יום כיפור', isEve: true },
      { date: '2024-10-12', name: 'Yom Kippur', nameHe: 'יום כיפור' },
      // סוכות
      { date: '2024-10-16', name: 'Sukkot Eve', nameHe: 'ערב סוכות', isEve: true },
      { date: '2024-10-17', name: 'Sukkot 1', nameHe: 'סוכות א' },
      { date: '2024-10-23', name: 'Shemini Atzeret Eve', nameHe: 'ערב שמיני עצרת', isEve: true },
      { date: '2024-10-24', name: 'Simchat Torah', nameHe: 'שמחת תורה' },
    ],
    2025: [
      // פסח
      { date: '2025-04-12', name: 'Passover Eve', nameHe: 'ערב פסח', isEve: true },
      { date: '2025-04-13', name: 'Passover 1', nameHe: 'פסח א' },
      { date: '2025-04-14', name: 'Passover 2', nameHe: 'פסח ב' },
      { date: '2025-04-19', name: 'Passover 7', nameHe: 'פסח ז' },
      { date: '2025-04-20', name: 'Passover 8', nameHe: 'פסח ח' },
      // יום העצמאות
      { date: '2025-05-01', name: 'Independence Eve', nameHe: 'ערב עצמאות', isEve: true },
      { date: '2025-05-02', name: 'Independence Day', nameHe: 'יום העצמאות' },
      // שבועות
      { date: '2025-06-01', name: 'Shavuot Eve', nameHe: 'ערב שבועות', isEve: true },
      { date: '2025-06-02', name: 'Shavuot', nameHe: 'שבועות' },
      // ראש השנה
      { date: '2025-09-22', name: 'Rosh Hashanah Eve', nameHe: 'ערב ראש השנה', isEve: true },
      { date: '2025-09-23', name: 'Rosh Hashanah 1', nameHe: 'ראש השנה א' },
      { date: '2025-09-24', name: 'Rosh Hashanah 2', nameHe: 'ראש השנה ב' },
      // יום כיפור
      { date: '2025-10-01', name: 'Yom Kippur Eve', nameHe: 'ערב יום כיפור', isEve: true },
      { date: '2025-10-02', name: 'Yom Kippur', nameHe: 'יום כיפור' },
      // סוכות
      { date: '2025-10-06', name: 'Sukkot Eve', nameHe: 'ערב סוכות', isEve: true },
      { date: '2025-10-07', name: 'Sukkot 1', nameHe: 'סוכות א' },
      { date: '2025-10-13', name: 'Shemini Atzeret Eve', nameHe: 'ערב שמיני עצרת', isEve: true },
      { date: '2025-10-14', name: 'Simchat Torah', nameHe: 'שמחת תורה' },
    ],
    2026: [
      // פסח
      { date: '2026-04-01', name: 'Passover Eve', nameHe: 'ערב פסח', isEve: true },
      { date: '2026-04-02', name: 'Passover 1', nameHe: 'פסח א' },
      { date: '2026-04-03', name: 'Passover 2', nameHe: 'פסח ב' },
      { date: '2026-04-08', name: 'Passover 7', nameHe: 'פסח ז' },
      { date: '2026-04-09', name: 'Passover 8', nameHe: 'פסח ח' },
      // יום העצמאות
      { date: '2026-04-21', name: 'Independence Eve', nameHe: 'ערב עצמאות', isEve: true },
      { date: '2026-04-22', name: 'Independence Day', nameHe: 'יום העצמאות' },
      // שבועות
      { date: '2026-05-21', name: 'Shavuot Eve', nameHe: 'ערב שבועות', isEve: true },
      { date: '2026-05-22', name: 'Shavuot', nameHe: 'שבועות' },
      // ראש השנה
      { date: '2026-09-11', name: 'Rosh Hashanah Eve', nameHe: 'ערב ראש השנה', isEve: true },
      { date: '2026-09-12', name: 'Rosh Hashanah 1', nameHe: 'ראש השנה א' },
      { date: '2026-09-13', name: 'Rosh Hashanah 2', nameHe: 'ראש השנה ב' },
      // יום כיפור
      { date: '2026-09-20', name: 'Yom Kippur Eve', nameHe: 'ערב יום כיפור', isEve: true },
      { date: '2026-09-21', name: 'Yom Kippur', nameHe: 'יום כיפור' },
      // סוכות
      { date: '2026-09-25', name: 'Sukkot Eve', nameHe: 'ערב סוכות', isEve: true },
      { date: '2026-09-26', name: 'Sukkot 1', nameHe: 'סוכות א' },
      { date: '2026-10-02', name: 'Shemini Atzeret Eve', nameHe: 'ערב שמיני עצרת', isEve: true },
      { date: '2026-10-03', name: 'Simchat Torah', nameHe: 'שמחת תורה' },
    ],
    2027: [
      // פסח
      { date: '2027-04-21', name: 'Passover Eve', nameHe: 'ערב פסח', isEve: true },
      { date: '2027-04-22', name: 'Passover 1', nameHe: 'פסח א' },
      { date: '2027-04-23', name: 'Passover 2', nameHe: 'פסח ב' },
      { date: '2027-04-28', name: 'Passover 7', nameHe: 'פסח ז' },
      { date: '2027-04-29', name: 'Passover 8', nameHe: 'פסח ח' },
      // יום העצמאות
      { date: '2027-05-11', name: 'Independence Eve', nameHe: 'ערב עצמאות', isEve: true },
      { date: '2027-05-12', name: 'Independence Day', nameHe: 'יום העצמאות' },
      // שבועות
      { date: '2027-06-10', name: 'Shavuot Eve', nameHe: 'ערב שבועות', isEve: true },
      { date: '2027-06-11', name: 'Shavuot', nameHe: 'שבועות' },
      // ראש השנה
      { date: '2027-10-01', name: 'Rosh Hashanah Eve', nameHe: 'ערב ראש השנה', isEve: true },
      { date: '2027-10-02', name: 'Rosh Hashanah 1', nameHe: 'ראש השנה א' },
      { date: '2027-10-03', name: 'Rosh Hashanah 2', nameHe: 'ראש השנה ב' },
      // יום כיפור
      { date: '2027-10-10', name: 'Yom Kippur Eve', nameHe: 'ערב יום כיפור', isEve: true },
      { date: '2027-10-11', name: 'Yom Kippur', nameHe: 'יום כיפור' },
      // סוכות
      { date: '2027-10-15', name: 'Sukkot Eve', nameHe: 'ערב סוכות', isEve: true },
      { date: '2027-10-16', name: 'Sukkot 1', nameHe: 'סוכות א' },
      { date: '2027-10-22', name: 'Shemini Atzeret Eve', nameHe: 'ערב שמיני עצרת', isEve: true },
      { date: '2027-10-23', name: 'Simchat Torah', nameHe: 'שמחת תורה' },
    ],
  };

  const yearHolidays = holidaysByYear[year] || [];
  for (const h of yearHolidays) {
    holidays.set(h.date, { name: h.name, nameHe: h.nameHe, isEve: h.isEve });
  }

  return holidays;
}

// Check if a date is a weekend (Friday or Saturday in Israel)
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday = 5, Saturday = 6
}

// Check if a date is a holiday or holiday eve
export function isHoliday(date: Date, includeEves: boolean = true): boolean {
  const year = getYear(date);
  const holidays = getIsraeliHolidays(year);
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const holiday = holidays.get(dateStr);
  if (!holiday) return false;
  
  if (includeEves) return true;
  return !holiday.isEve;
}

// Get holiday info for a date
export function getHolidayInfo(date: Date): Holiday | null {
  const year = getYear(date);
  const holidays = getIsraeliHolidays(year);
  const dateStr = format(date, 'yyyy-MM-dd');
  return holidays.get(dateStr) || null;
}

// Check if a date is a working day
export function isWorkingDay(date: Date, includeHolidayEves: boolean = true): boolean {
  if (isWeekend(date)) return false;
  if (isHoliday(date, includeHolidayEves)) return false;
  return true;
}

export interface DayCounterResult {
  totalDays: number; // סה"כ ימים רגילים
  workingDays: number; // ימי עבודה בלבד
  weekendDays: number; // ימי סופ"ש
  holidayDays: number; // ימי חג
  fromDate: Date;
  toDate: Date;
  isOverdue: boolean; // האם עבר הזמן
  daysRemaining: number; // ימים שנותרו (עבודה)
  daysRemainingTotal: number; // ימים שנותרו (סה"כ)
}

// Calculate days elapsed from a start date to today (or a target date)
export function calculateDayCounter(
  startDate: Date | string,
  targetDate?: Date | string,
  targetWorkingDays?: number
): DayCounterResult {
  const start = startOfDay(typeof startDate === 'string' ? new Date(startDate) : startDate);
  const now = startOfDay(new Date());
  const end = targetDate 
    ? startOfDay(typeof targetDate === 'string' ? new Date(targetDate) : targetDate)
    : now;

  let workingDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  let current = start;

  // Count from start to end
  while (isBefore(current, end) || isSameDay(current, end)) {
    if (isWeekend(current)) {
      weekendDays++;
    } else if (isHoliday(current, true)) {
      holidayDays++;
    } else {
      workingDays++;
    }
    current = addDays(current, 1);
  }

  const totalDays = differenceInDays(end, start) + 1;

  // Calculate remaining days if target is provided
  let isOverdue = false;
  let daysRemaining = 0;
  let daysRemainingTotal = 0;

  if (targetWorkingDays !== undefined) {
    // Target is in working days
    daysRemaining = targetWorkingDays - workingDays;
    isOverdue = daysRemaining < 0;
    
    // Calculate total days remaining
    if (!isOverdue) {
      let remaining = daysRemaining;
      let tempDate = end;
      while (remaining > 0) {
        tempDate = addDays(tempDate, 1);
        if (isWorkingDay(tempDate, true)) {
          remaining--;
        }
        daysRemainingTotal++;
      }
    }
  } else if (targetDate) {
    // Target is a specific date
    daysRemainingTotal = differenceInDays(end, now);
    isOverdue = daysRemainingTotal < 0;
    
    // Count remaining working days
    if (!isOverdue) {
      let tempDate = now;
      while (isBefore(tempDate, end)) {
        tempDate = addDays(tempDate, 1);
        if (isWorkingDay(tempDate, true)) {
          daysRemaining++;
        }
      }
    }
  }

  return {
    totalDays: Math.abs(totalDays),
    workingDays,
    weekendDays,
    holidayDays,
    fromDate: start,
    toDate: end,
    isOverdue,
    daysRemaining: Math.abs(daysRemaining),
    daysRemainingTotal: Math.abs(daysRemainingTotal),
  };
}

// Calculate target date from start date and number of working days
export function calculateTargetDate(startDate: Date | string, workingDays: number): Date {
  const start = startOfDay(typeof startDate === 'string' ? new Date(startDate) : startDate);
  let current = start;
  let daysCount = 0;

  while (daysCount < workingDays) {
    current = addDays(current, 1);
    if (isWorkingDay(current, true)) {
      daysCount++;
    }
  }

  return current;
}

// Format day counter for display
export function formatDayCounter(result: DayCounterResult, showDetails: boolean = false): string {
  if (showDetails) {
    return `${result.workingDays} ימי עבודה (${result.totalDays} סה"כ)`;
  }
  return `${result.workingDays} י"ע`;
}

// Get color based on remaining days
export function getDayCounterColor(result: DayCounterResult, warningThreshold: number = 5): string {
  if (result.isOverdue) return 'destructive';
  if (result.daysRemaining <= warningThreshold) return 'warning';
  return 'default';
}
