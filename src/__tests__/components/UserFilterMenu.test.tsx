import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";

const ME = "user-me";
const DANA = "user-dana";
const YOSSI = "user-yossi";

let stored: Record<string, unknown> = {};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: ME } }),
}));

vi.mock("@/hooks/useTeamMembers", () => ({
  useTeamMembers: () => ({ members: [], isLoading: false }),
}));

vi.mock("@/hooks/useSyncedSetting", () => ({
  useSyncedSetting: ({ key, defaultValue }: { key: string; defaultValue: unknown }) => {
    const [v, setV] = useState(key in stored ? stored[key] : defaultValue);
    return [v, (next: unknown) => { stored[key] = next; setV(next); }];
  },
}));

import { useUserFilter } from "@/components/shared/UserFilterMenu";

const task = (created_by: string | null, assigned_to: string | null = null) => ({ created_by, assigned_to });

describe("useUserFilter (three modes)", () => {
  beforeEach(() => {
    stored = {};
  });

  it("shows everything by default", () => {
    const { result } = renderHook(() => useUserFilter());
    expect(result.current.mode).toBe("all");
    expect(result.current.isAll).toBe(true);
    expect(result.current.matches(task(DANA), "tasks")).toBe(true);
  });

  it("'mine' mode shows only my items", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.setMode("mine"));
    expect(result.current.isOnlyMine).toBe(true);
    expect(result.current.matches(task(ME), "tasks")).toBe(true);
    expect(result.current.matches(task(DANA), "tasks")).toBe(false);
  });

  it("multi mode supports me plus other users together", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.setMode("multi"));
    act(() => result.current.toggleUser("mine"));
    act(() => result.current.toggleUser(DANA));
    expect(result.current.targetIds.sort()).toEqual([DANA, ME].sort());
    expect(result.current.matches(task(ME), "tasks")).toBe(true);
    expect(result.current.matches(task(DANA), "tasks")).toBe(true);
    expect(result.current.matches(task(YOSSI), "tasks")).toBe(false);
    expect(result.current.matches(task(YOSSI, DANA), "tasks")).toBe(true);
    expect(result.current.targetId).toBeNull();
  });

  it("going back to multi mode restores the users picked before", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.setMode("multi"));
    act(() => result.current.toggleUser(DANA));
    act(() => result.current.toggleUser(YOSSI));
    act(() => result.current.setMode("mine"));
    expect(result.current.targetIds).toEqual([ME]);
    act(() => result.current.setMode("all"));
    expect(result.current.isAll).toBe(true);
    act(() => result.current.setMode("multi"));
    expect(result.current.targetIds.sort()).toEqual([DANA, YOSSI].sort());
  });

  it("multi mode with nobody ticked shows everyone", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.setMode("multi"));
    expect(result.current.isAll).toBe(true);
    expect(result.current.matches(task(DANA), "tasks")).toBe(true);
  });

  it("toggling a user twice removes them; picking yourself equals 'mine'", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.toggleUser(DANA));
    expect(result.current.mode).toBe("multi");
    act(() => result.current.toggleUser(ME));
    act(() => result.current.toggleUser(DANA));
    expect(result.current.multiUsers).toEqual(["mine"]);
    expect(result.current.targetId).toBe(ME);
  });

  it("matches meetings through attendees and reminders only by owner", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.setValue([DANA, YOSSI]));
    expect(result.current.mode).toBe("multi");
    expect(result.current.matches({ created_by: ME, attendees: [YOSSI] }, "meetings")).toBe(true);
    expect(result.current.matches({ user_id: DANA }, "reminders")).toBe(true);
    expect(result.current.matches({ user_id: ME }, "reminders")).toBe(false);
  });

  it("reads settings saved by older versions", () => {
    stored = { "global-user-filter": "mine" };
    expect(renderHook(() => useUserFilter()).result.current.mode).toBe("mine");

    stored = { "global-user-filter": DANA };
    const b = renderHook(() => useUserFilter()).result.current;
    expect(b.mode).toBe("multi");
    expect(b.targetIds).toEqual([DANA]);

    stored = { "global-user-filter": [DANA, "mine"] };
    expect(renderHook(() => useUserFilter()).result.current.targetIds.sort()).toEqual([DANA, ME].sort());

    stored = { "global-user-filter": "all" };
    expect(renderHook(() => useUserFilter()).result.current.isAll).toBe(true);
  });
});
