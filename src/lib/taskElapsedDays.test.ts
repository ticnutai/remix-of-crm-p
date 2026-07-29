import { describe, expect, it } from "vitest";
import { getTaskElapsedDays } from "@/lib/taskElapsedDays";

describe("getTaskElapsedDays", () => {
  it("counts open-task days until today", () => {
    expect(
      getTaskElapsedDays({
        createdAt: "2026-07-20T08:00:00.000Z",
        completed: false,
        now: new Date("2026-07-29T08:00:00.000Z"),
      }),
    ).toBe(9);
  });

  it("freezes completed-task days at completion time", () => {
    expect(
      getTaskElapsedDays({
        createdAt: "2026-07-20T08:00:00.000Z",
        completedAt: "2026-07-24T20:00:00.000Z",
        completed: true,
        now: new Date("2026-08-10T08:00:00.000Z"),
      }),
    ).toBe(4);
  });

  it("uses the last update only for completed legacy tasks without completed_at", () => {
    expect(
      getTaskElapsedDays({
        createdAt: "2026-07-20T08:00:00.000Z",
        updatedAt: "2026-07-22T08:00:00.000Z",
        completed: true,
      }),
    ).toBe(2);
  });
});
