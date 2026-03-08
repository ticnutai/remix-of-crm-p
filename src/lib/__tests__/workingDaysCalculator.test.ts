/**
 * Working Days Calculator Tests - בדיקות מחשבון ימי עבודה
 * כולל: סופ"ש ישראלי, חגים, חיבוש ימי עבודה
 */
import { describe, it, expect } from "vitest";
import {
  isWeekend,
  isHoliday,
  getHolidayInfo,
  isWorkingDay,
  calculateDayCounter,
  calculateTargetDate,
  formatDayCounter,
  getDayCounterColor,
} from "@/lib/workingDaysCalculator";

describe("Working Days Calculator", () => {
  // ==================== isWeekend ====================
  describe("isWeekend", () => {
    it("should return true for Friday", () => {
      // 2026-02-20 is a Friday
      expect(isWeekend(new Date(2026, 1, 20))).toBe(true);
    });

    it("should return true for Saturday", () => {
      // 2026-02-21 is a Saturday
      expect(isWeekend(new Date(2026, 1, 21))).toBe(true);
    });

    it("should return false for Sunday-Thursday", () => {
      // 2026-02-22 is a Sunday
      expect(isWeekend(new Date(2026, 1, 22))).toBe(false);
      // 2026-02-23 is a Monday
      expect(isWeekend(new Date(2026, 1, 23))).toBe(false);
      // 2026-02-24 is a Tuesday
      expect(isWeekend(new Date(2026, 1, 24))).toBe(false);
      // 2026-02-25 is a Wednesday
      expect(isWeekend(new Date(2026, 1, 25))).toBe(false);
      // 2026-02-26 is a Thursday
      expect(isWeekend(new Date(2026, 1, 26))).toBe(false);
    });
  });

  // ==================== isHoliday ====================
  describe("isHoliday", () => {
    it("should detect Rosh Hashanah 2026", () => {
      expect(isHoliday(new Date(2026, 8, 12))).toBe(true); // Sep 12
    });

    it("should detect Independence Day 2026", () => {
      expect(isHoliday(new Date(2026, 3, 22))).toBe(true); // Apr 22
    });

    it("should detect holiday eve", () => {
      // ערב ראש השנה 2026 - Sep 11
      expect(isHoliday(new Date(2026, 8, 11), true)).toBe(true);
    });

    it("should exclude eve when requested", () => {
      // ערב ראש השנה 2026 - Sep 11
      expect(isHoliday(new Date(2026, 8, 11), false)).toBe(false);
    });

    it("should return false for regular days", () => {
      expect(isHoliday(new Date(2026, 1, 22))).toBe(false); // Feb 22 - regular Sunday
    });

    it("should detect Yom Kippur 2025", () => {
      expect(isHoliday(new Date(2025, 9, 2))).toBe(true); // Oct 2
    });
  });

  // ==================== getHolidayInfo ====================
  describe("getHolidayInfo", () => {
    it("should return holiday info", () => {
      const info = getHolidayInfo(new Date(2026, 8, 12)); // Rosh Hashanah 1
      expect(info).not.toBeNull();
      expect(info?.nameHe).toContain("ראש השנה");
    });

    it("should return null for non-holidays", () => {
      expect(getHolidayInfo(new Date(2026, 1, 22))).toBeNull();
    });

    it("should mark eves correctly", () => {
      const info = getHolidayInfo(new Date(2026, 8, 11)); // Rosh Hashanah Eve
      expect(info?.isEve).toBe(true);
    });
  });

  // ==================== isWorkingDay ====================
  describe("isWorkingDay", () => {
    it("should return true for regular weekday", () => {
      // 2026-02-22 is a Sunday (working day in Israel)
      expect(isWorkingDay(new Date(2026, 1, 22))).toBe(true);
    });

    it("should return false for Friday", () => {
      expect(isWorkingDay(new Date(2026, 1, 20))).toBe(false);
    });

    it("should return false for Saturday", () => {
      expect(isWorkingDay(new Date(2026, 1, 21))).toBe(false);
    });

    it("should return false for holidays", () => {
      // Independence Day 2026
      expect(isWorkingDay(new Date(2026, 3, 22))).toBe(false);
    });
  });

  // ==================== calculateDayCounter ====================
  describe("calculateDayCounter", () => {
    it("should count working days in a week", () => {
      // Sun Feb 22 to Thu Feb 26 = 5 days, all working days
      const result = calculateDayCounter(
        new Date(2026, 1, 22), // Sunday
        new Date(2026, 1, 26), // Thursday
      );
      expect(result.workingDays).toBe(5);
      expect(result.weekendDays).toBe(0);
      expect(result.totalDays).toBe(5);
    });

    it("should count weekends correctly", () => {
      // Sun Feb 22 to Sat Feb 28 = 7 days (5 working + 2 weekend)
      const result = calculateDayCounter(
        new Date(2026, 1, 22), // Sunday
        new Date(2026, 1, 28), // Saturday
      );
      expect(result.workingDays).toBe(5);
      expect(result.weekendDays).toBe(2);
      expect(result.totalDays).toBe(7);
    });

    it("should accept string dates", () => {
      const result = calculateDayCounter("2026-02-22", "2026-02-26");
      expect(result.workingDays).toBeGreaterThan(0);
    });

    it("should detect overdue with target working days", () => {
      // If target is 3 working days but 5 have passed
      const result = calculateDayCounter(
        new Date(2026, 1, 22), // Sunday
        new Date(2026, 1, 26), // Thursday (5 working days)
        3,
      );
      expect(result.isOverdue).toBe(true);
    });
  });

  // ==================== calculateTargetDate ====================
  describe("calculateTargetDate", () => {
    it("should skip weekends", () => {
      // Starting Sunday Feb 22, 2026 + 6 working days should skip Fri+Sat
      const target = calculateTargetDate(new Date(2026, 1, 22), 6);
      // 5 days Sun-Thu, then skip Fri+Sat, then Mon Mar 2
      expect(target.getDay()).not.toBe(5); // Not Friday
      expect(target.getDay()).not.toBe(6); // Not Saturday
    });

    it("should calculate 0 working days as same day", () => {
      const start = new Date(2026, 1, 22);
      const target = calculateTargetDate(start, 0);
      // 0 working days = start date itself
      expect(target.getTime()).toBe(start.getTime());
    });

    it("should handle 1 working day", () => {
      // Sunday Feb 22 + 1 = Monday Feb 23
      const target = calculateTargetDate(new Date(2026, 1, 22), 1);
      expect(target.getDate()).toBe(23);
    });

    it("should skip holidays", () => {
      // Starting near a holiday, should skip it
      const target = calculateTargetDate(new Date(2026, 3, 21), 2); // Apr 21 (eve independence)
      // Should skip Apr 21 (eve) and Apr 22 (independence day)
      const info = getHolidayInfo(target);
      expect(info).toBeNull(); // Target should not be a holiday
    });
  });

  // ==================== formatDayCounter ====================
  describe("formatDayCounter", () => {
    it("should format with short label", () => {
      const result = calculateDayCounter(
        new Date(2026, 1, 22),
        new Date(2026, 1, 26),
      );
      const formatted = formatDayCounter(result);
      expect(formatted).toContain('י"ע');
    });

    it("should format with details", () => {
      const result = calculateDayCounter(
        new Date(2026, 1, 22),
        new Date(2026, 1, 26),
      );
      const formatted = formatDayCounter(result, true);
      expect(formatted).toContain("ימי עבודה");
      expect(formatted).toContain('סה"כ');
    });
  });

  // ==================== getDayCounterColor ====================
  describe("getDayCounterColor", () => {
    it("should return destructive for overdue", () => {
      const result = calculateDayCounter(
        new Date(2026, 1, 22),
        new Date(2026, 1, 26),
        3, // target 3 but 5 passed
      );
      expect(getDayCounterColor(result)).toBe("destructive");
    });

    it("should return default when many days remaining", () => {
      const result: any = {
        isOverdue: false,
        daysRemaining: 20,
      };
      expect(getDayCounterColor(result)).toBe("default");
    });

    it("should return warning when few days remaining", () => {
      const result: any = {
        isOverdue: false,
        daysRemaining: 3,
      };
      expect(getDayCounterColor(result)).toBe("warning");
    });
  });
});
