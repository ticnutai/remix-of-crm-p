import { describe, expect, it } from "vitest";
import {
  getPostponePresetDate,
  toDateTimeLocalValue,
} from "./activityPostponements";

describe("activity postponement helpers", () => {
  it("creates tomorrow and next-week presets without changing the time", () => {
    const now = new Date(2026, 6, 29, 14, 35);
    expect(getPostponePresetDate("tomorrow", now)).toEqual(
      new Date(2026, 6, 30, 14, 35),
    );
    expect(getPostponePresetDate("week", now)).toEqual(
      new Date(2026, 7, 5, 14, 35),
    );
  });

  it("formats a local value for the datetime input", () => {
    expect(toDateTimeLocalValue(new Date(2026, 6, 29, 9, 7))).toBe(
      "2026-07-29T09:07",
    );
  });
});

