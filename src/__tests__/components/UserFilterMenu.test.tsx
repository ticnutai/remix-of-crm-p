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

describe("useUserFilter (multi-select)", () => {
  beforeEach(() => {
    stored = {};
  });

  it("shows everything by default", () => {
    const { result } = renderHook(() => useUserFilter());
    expect(result.current.isAll).toBe(true);
    expect(result.current.matches(task(DANA), "tasks")).toBe(true);
  });

  it("supports me plus other users together", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.toggleUser("mine"));
    act(() => result.current.toggleUser(DANA));
    expect(result.current.targetIds.sort()).toEqual([DANA, ME].sort());
    expect(result.current.matches(task(ME), "tasks")).toBe(true);
    expect(result.current.matches(task(DANA), "tasks")).toBe(true);
    expect(result.current.matches(task(YOSSI), "tasks")).toBe(false);
    expect(result.current.matches(task(YOSSI, DANA), "tasks")).toBe(true);
    expect(result.current.targetId).toBeNull();
  });

  it("toggling a user twice removes them", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.toggleUser(DANA));
    act(() => result.current.toggleUser(YOSSI));
    act(() => result.current.toggleUser(DANA));
    expect(result.current.targetIds).toEqual([YOSSI]);
    expect(result.current.targetId).toBe(YOSSI);
  });

  it("picking yourself from the list is the same as 'mine'", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.toggleUser(ME));
    expect(result.current.isOnlyMine).toBe(true);
    act(() => result.current.toggleUser("mine"));
    expect(result.current.isAll).toBe(true);
  });

  it("matches meetings through attendees", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.setValue([DANA, YOSSI]));
    const meeting = { created_by: ME, assigned_to: null, attendees: [YOSSI] };
    expect(result.current.matches(meeting, "meetings")).toBe(true);
  });

  it("reminders match only by owner", () => {
    const { result } = renderHook(() => useUserFilter());
    act(() => result.current.setValue([DANA]));
    expect(result.current.matches({ user_id: DANA }, "reminders")).toBe(true);
    expect(result.current.matches({ user_id: YOSSI }, "reminders")).toBe(false);
  });

  it("reads older single-value settings", () => {
    stored = { "global-user-filter": "mine" };
    const a = renderHook(() => useUserFilter());
    expect(a.result.current.isOnlyMine).toBe(true);

    stored = { "global-user-filter": DANA };
    const b = renderHook(() => useUserFilter());
    expect(b.result.current.targetIds).toEqual([DANA]);

    stored = { "global-user-filter": "all" };
    const c = renderHook(() => useUserFilter());
    expect(c.result.current.isAll).toBe(true);
  });
});
