/**
 * Time Format Utils Tests - בדיקות עיצוב זמנים
 */
import { describe, it, expect } from "vitest";
import {
  formatDurationNoLeadingZeros,
  formatTimeNoLeadingZeros,
  formatTimeWithSecondsNoLeadingZeros,
  formatTimeRangeNoLeadingZeros,
} from "@/lib/time-format-utils";

describe("Time Format Utils", () => {
  describe("formatDurationNoLeadingZeros", () => {
    it("should format minutes to H:M", () => {
      expect(formatDurationNoLeadingZeros(65)).toBe("1:5");
      expect(formatDurationNoLeadingZeros(120)).toBe("2:0");
      expect(formatDurationNoLeadingZeros(90)).toBe("1:30");
    });

    it("should handle zero minutes", () => {
      expect(formatDurationNoLeadingZeros(0)).toBe("0:0");
    });

    it("should handle null/undefined", () => {
      expect(formatDurationNoLeadingZeros(null)).toBe("0:0");
      expect(formatDurationNoLeadingZeros(undefined)).toBe("0:0");
    });

    it("should handle large durations", () => {
      expect(formatDurationNoLeadingZeros(600)).toBe("10:0");
      expect(formatDurationNoLeadingZeros(1440)).toBe("24:0"); // 1 day
    });

    it("should handle single-digit minutes", () => {
      expect(formatDurationNoLeadingZeros(61)).toBe("1:1");
      expect(formatDurationNoLeadingZeros(5)).toBe("0:5");
    });
  });

  describe("formatTimeNoLeadingZeros", () => {
    it("should format date to H:M without leading zeros", () => {
      const result = formatTimeNoLeadingZeros("2024-01-15T09:05:00");
      expect(result).toBe("9:5");
    });

    it("should handle afternoon times", () => {
      const result = formatTimeNoLeadingZeros("2024-01-15T14:30:00");
      expect(result).toBe("14:30");
    });

    it("should handle midnight", () => {
      const result = formatTimeNoLeadingZeros("2024-01-15T00:00:00");
      expect(result).toBe("0:0");
    });

    it("should accept Date objects", () => {
      const date = new Date(2024, 0, 15, 9, 5);
      expect(formatTimeNoLeadingZeros(date)).toBe("9:5");
    });
  });

  describe("formatTimeWithSecondsNoLeadingZeros", () => {
    it("should format date to H:M:S without leading zeros", () => {
      const result = formatTimeWithSecondsNoLeadingZeros("2024-01-15T09:05:03");
      expect(result).toBe("9:5:3");
    });

    it("should handle zero seconds", () => {
      const result = formatTimeWithSecondsNoLeadingZeros("2024-01-15T14:30:00");
      expect(result).toBe("14:30:0");
    });
  });

  describe("formatTimeRangeNoLeadingZeros", () => {
    it("should format time range", () => {
      const result = formatTimeRangeNoLeadingZeros(
        "2024-01-15T09:05:00",
        "2024-01-15T10:30:00",
      );
      expect(result).toBe("9:5 - 10:30");
    });

    it("should handle same-hour ranges", () => {
      const result = formatTimeRangeNoLeadingZeros(
        "2024-01-15T14:00:00",
        "2024-01-15T14:45:00",
      );
      expect(result).toBe("14:0 - 14:45");
    });
  });
});
