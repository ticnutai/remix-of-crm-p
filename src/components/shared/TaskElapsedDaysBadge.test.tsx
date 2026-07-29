import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskElapsedDaysBadge } from "@/components/shared/TaskElapsedDaysBadge";

describe("TaskElapsedDaysBadge", () => {
  it("renders an open task with a red elapsed-days badge", () => {
    const createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    render(
      <TaskElapsedDaysBadge
        createdAt={createdAt.toISOString()}
        completed={false}
      />,
    );

    const badge = screen.getByLabelText("המשימה פתוחה 2 ימים");
    expect(badge.className).toContain("bg-red-600");
    expect(badge.className).not.toContain("border-red");
    expect(badge.textContent).toBe("2");
    expect(badge.querySelector("svg")).toBeNull();
  });

  it("renders a completed task with a frozen green duration", () => {
    render(
      <TaskElapsedDaysBadge
        createdAt="2026-07-20T08:00:00.000Z"
        completedAt="2026-07-24T20:00:00.000Z"
        completed
      />,
    );

    const badge = screen.getByLabelText("המשימה הושלמה בתוך 4 ימים");
    expect(badge.className).toContain("bg-emerald-600");
    expect(badge.className).not.toContain("border-emerald");
    expect(badge.textContent).toBe("4");
    expect(badge.querySelector("svg")).toBeNull();
  });
});
