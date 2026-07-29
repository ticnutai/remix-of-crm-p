import { describe, expect, it } from "vitest";
import { buildStageTaskElapsedStartMap } from "./stageTaskElapsed";

const stages = [
  {
    stageId: "stage-1",
    sortOrder: 0,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-03T08:00:00.000Z",
  },
  {
    stageId: "stage-2",
    sortOrder: 1,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-05T08:00:00.000Z",
  },
];

describe("buildStageTaskElapsedStartMap", () => {
  it("counts only tasks in the current stage and hides future-stage tasks", () => {
    const result = buildStageTaskElapsedStartMap(stages, [
      {
        id: "current",
        stageId: "stage-1",
        completed: false,
        createdAt: "2026-07-02T08:00:00.000Z",
      },
      {
        id: "future",
        stageId: "stage-2",
        completed: false,
        createdAt: "2026-07-02T08:00:00.000Z",
      },
    ]);

    expect(result.current).toBe("2026-07-02T08:00:00.000Z");
    expect(result.future).toBeUndefined();
  });

  it("starts the next stage when the previous stage was completed", () => {
    const result = buildStageTaskElapsedStartMap(stages, [
      {
        id: "completed",
        stageId: "stage-1",
        completed: true,
        createdAt: "2026-07-01T08:00:00.000Z",
        completedAt: "2026-07-10T10:00:00.000Z",
      },
      {
        id: "now-current",
        stageId: "stage-2",
        completed: false,
        createdAt: "2026-07-02T08:00:00.000Z",
      },
    ]);

    expect(result.completed).toBe("2026-07-01T08:00:00.000Z");
    expect(result["now-current"]).toBe("2026-07-10T10:00:00.000Z");
  });

  it("uses a later task creation date when a task is added after activation", () => {
    const result = buildStageTaskElapsedStartMap(stages, [
      {
        id: "completed",
        stageId: "stage-1",
        completed: true,
        createdAt: "2026-07-01T08:00:00.000Z",
        completedAt: "2026-07-10T10:00:00.000Z",
      },
      {
        id: "added-later",
        stageId: "stage-2",
        completed: false,
        createdAt: "2026-07-14T09:00:00.000Z",
      },
    ]);

    expect(result["added-later"]).toBe("2026-07-14T09:00:00.000Z");
  });
});
