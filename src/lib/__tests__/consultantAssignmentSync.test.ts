import { describe, expect, it } from "vitest";
import { consultantProfessionMatchesTaskTitle } from "../consultantAssignmentSync";

describe("consultantProfessionMatchesTaskTitle", () => {
  it("matches a specific profession inside a stage task title", () => {
    expect(
      consultantProfessionMatchesTaskTitle(
        "מודד",
        "קבלת תכנית מדידה מהמודד",
      ),
    ).toBe(true);
    expect(
      consultantProfessionMatchesTaskTitle(
        "יועץ ניקוז",
        "קבלת אישור יועץ ניקוז",
      ),
    ).toBe(true);
  });

  it("matches a generic consultant to a specific consultant task", () => {
    expect(
      consultantProfessionMatchesTaskTitle("יועץ", "אישור יועץ אקוסטיקה"),
    ).toBe(true);
  });

  it("does not mix unrelated professions", () => {
    expect(
      consultantProfessionMatchesTaskTitle("מהנדס", "קבלת מדידה מהמודד"),
    ).toBe(false);
  });
});
