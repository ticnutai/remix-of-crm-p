// Israeli Workdays Calculator Hook
// חישוב ימי עבודה בישראל - ללא שישי, שבת, חגים וערבי חגים

import { useMemo } from 'react';

// Israeli holidays 2024-2030 (Hebrew calendar dates converted to Gregorian)
// Format: [month (0-indexed), day]
const ISRAELI_HOLIDAYS: Record<number, Array<[number, number]>> = {
  2024: [
    // פסח
    [3, 23], [3, 24], [3, 29], [3, 30],
    // יום העצמאות
    [4, 14],
    // שבועות
    [5, 12], [5, 13],
    // ראש השנה
    [9, 3], [9, 4], [9, 5],
    // יום כיפור
    [9, 12], [9, 13],
    // סוכות
    [9, 17], [9, 18], [9, 23], [9, 24], [9, 25],
  ],
  2025: [
    // פסח
    [3, 13], [3, 14], [3, 19], [3, 20],
    // יום העצמאות
    [4, 1],
    // שבועות
    [5, 2], [5, 3],
    // ראש השנה
    [8, 23], [8, 24], [8, 25],
    // יום כיפור
    [9, 2], [9, 3],
    // סוכות
    [9, 7], [9, 8], [9, 13], [9, 14], [9, 15],
  ],
  2026: [
    // פסח
    [3, 2], [3, 3], [3, 8], [3, 9],
    // יום העצמאות
    [3, 22],
    // שבועות
    [4, 22], [4, 23],
    // ראש השנה
    [8, 12], [8, 13], [8, 14],
    // יום כיפור
    [8, 21], [8, 22],
    // סוכות
    [8, 26], [8, 27], [9, 2], [9, 3], [9, 4],
  ],
  2027: [
    // פסח
    [3, 22], [3, 23], [3, 28], [3, 29],
    // יום העצמאות
    [4, 11],
    // שבועות
    [5, 11], [5, 12],
    // ראש השנה
    [9, 2], [9, 3], [9, 4],
    // יום כיפור
    [9, 11], [9, 12],
    // סוכות
    [9, 16], [9, 17], [9, 22], [9, 23], [9, 24],
  ],
  2028: [
    // פסח
    [3, 11], [3, 12], [3, 17], [3, 18],
    // יום העצמאות
    [4, 2],
    // שבועות
    [4, 31], [5, 1],
    // ראש השנה
    [8, 21], [8, 22], [8, 23],
    // יום כיפור
    [8, 30], [9, 1],
    // סוכות
    [9, 5], [9, 6], [9, 11], [9, 12], [9, 13],
  ],
  2029: [
    // פסח
    [2, 31], [3, 1], [3, 6], [3, 7],
    // יום העצמאות
    [3, 19],
    // שבועות
    [4, 20], [4, 21],
    // ראש השנה
    [8, 10], [8, 11], [8, 12],
    // יום כיפור
    [8, 19], [8, 20],
    // סוכות
    [8, 24], [8, 25], [8, 30], [9, 1], [9, 2],
  ],
  2030: [
    // פסח
    [3, 18], [3, 19], [3, 24], [3, 25],
    // יום העצמאות
    [3, 9],
    // שבועות
    [5, 7], [5, 8],
    // ראש השנה
    [8, 28], [8, 29], [8, 30],
    // יום כיפור
    [9, 7], [9, 8],
    // סוכות
    [9, 12], [9, 13], [9, 18], [9, 19], [9, 20],
  ],
};

// Check if a date is a weekend (Friday or Saturday)
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday = 5, Saturday = 6
}

// Check if a date is an Israeli holiday
function isIsraeliHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const holidays = ISRAELI_HOLIDAYS[year];
  if (!holidays) return false;
  
  return holidays.some(([m, d]) => m === month && d === day);
}

// Check if a date is a workday
export function isWorkday(date: Date): boolean {
  return !isWeekend(date) && !isIsraeliHoliday(date);
}

// Add workdays to a date
export function addWorkdays(startDate: Date, workdays: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < workdays) {
    result.setDate(result.getDate() + 1);
    if (isWorkday(result)) {
      daysAdded++;
    }
  }
  
  return result;
}

// Count workdays between two dates
export function countWorkdaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setDate(current.getDate() + 1); // Start from day after start date
  
  while (current <= endDate) {
    if (isWorkday(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Count workdays from start date until today
export function countWorkdaysPassed(startDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return countWorkdaysBetween(startDate, today);
}

// Calculate deadline date from start date + workdays
export function calculateDeadlineDate(startDate: Date, workdays: number): Date {
  return addWorkdays(startDate, workdays);
}

// Calculate remaining workdays until deadline
export function calculateRemainingWorkdays(startDate: Date, totalWorkdays: number): number {
  const deadlineDate = addWorkdays(startDate, totalWorkdays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (today >= deadlineDate) {
    return 0;
  }
  
  return countWorkdaysBetween(today, deadlineDate);
}

// Get urgency level based on remaining days
export function getUrgencyLevel(remainingDays: number, totalDays: number): 'safe' | 'warning' | 'danger' | 'overdue' {
  if (remainingDays <= 0) return 'overdue';
  
  const percentRemaining = (remainingDays / totalDays) * 100;
  
  if (remainingDays <= 3 || percentRemaining <= 10) return 'danger';
  if (remainingDays <= 7 || percentRemaining <= 25) return 'warning';
  return 'safe';
}

// Format remaining days as Hebrew string
export function formatRemainingDays(remainingDays: number): string {
  if (remainingDays <= 0) return 'פג תוקף!';
  if (remainingDays === 1) return 'יום אחרון!';
  return `${remainingDays} ימי עבודה`;
}

// Custom hook for workday calculations
export function useIsraeliWorkdays() {
  const utils = useMemo(() => ({
    isWorkday,
    addWorkdays,
    countWorkdaysBetween,
    countWorkdaysPassed,
    calculateDeadlineDate,
    calculateRemainingWorkdays,
    getUrgencyLevel,
    formatRemainingDays,
  }), []);

  return utils;
}

export default useIsraeliWorkdays;
