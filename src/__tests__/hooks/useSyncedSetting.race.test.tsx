import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Cloud row is OLD (written an hour ago) and still holds the previous value.
let cloudRow: { setting_value: unknown; updated_at: string } | null = null;
const upsert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: cloudRow, error: null }),
          }),
        }),
      }),
      upsert,
    }),
  },
}));

import { useSyncedSetting } from "@/hooks/useSyncedSetting";

describe("useSyncedSetting - stale cloud value", () => {
  beforeEach(() => {
    localStorage.clear();
    upsert.mockClear();
    cloudRow = {
      setting_value: "old",
      updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    };
  });

  it("a component mounted right after a local change does not restore the old cloud value", async () => {
    const first = renderHook(() => useSyncedSetting({ key: "race-key", defaultValue: "old" }));
    await act(async () => {
      first.result.current[1]("new");
    });

    // A second instance mounts (e.g. a tab is opened) and reads the stale cloud row.
    const second = renderHook(() => useSyncedSetting({ key: "race-key", defaultValue: "old" }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(second.result.current[0]).toBe("new");
    expect(first.result.current[0]).toBe("new");
  });

  it("the first change after load is saved to the cloud", async () => {
    // Local storage disagrees with the cloud on load.
    localStorage.setItem("synced::save-key", JSON.stringify("local"));
    const hook = renderHook(() => useSyncedSetting({ key: "save-key", defaultValue: "x", debounceMs: 10 }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    await act(async () => {
      hook.result.current[1]("chosen");
    });
    await waitFor(() => expect(upsert).toHaveBeenCalled());
    expect(upsert.mock.calls[0][0].setting_value).toBe("chosen");
  });
});
