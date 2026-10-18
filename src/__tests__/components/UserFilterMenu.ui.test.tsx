import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";

// Shared in-memory store so every hook instance sees the same values,
// like the real synced settings do.
let stored: Record<string, unknown> = {};
const listeners = new Set<() => void>();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));

vi.mock("@/hooks/useTeamMembers", () => ({
  useTeamMembers: () => ({
    members: [
      { id: "me", full_name: "יעקב", email: "me@x" },
      { id: "mali", full_name: "מלי", email: "mali@x" },
      { id: "esti", full_name: "אסתי", email: "esti@x" },
      { id: "hana", full_name: "חנה", email: "hana@x" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useSyncedSetting", () => ({
  useSyncedSetting: ({ key, defaultValue }: { key: string; defaultValue: unknown }) => {
    const [, force] = useState(0);
    useEffect(() => {
      const l = () => force((n) => n + 1);
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    }, []);
    const value = key in stored ? stored[key] : defaultValue;
    return [value, (next: unknown) => {
      stored[key] = next;
      listeners.forEach((l) => l());
    }];
  },
}));

import { UserFilterMenu } from "@/components/shared/UserFilterMenu";

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTitle(/סינון לפי משתמש/));
  return await screen.findByRole("menu");
};

describe("UserFilterMenu - three tabs", () => {
  beforeEach(() => {
    stored = {};
  });

  it("shows the user list only in the multi-select tab and restores the previous selection", async () => {
    const user = userEvent.setup();
    render(<UserFilterMenu showLabel />);
    let menu = await openMenu(user);

    // Three tabs, "כולם" active by default, no user list.
    const tabs = within(menu).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["רק שלי", "כולם", "בחירה מרובה"]);
    expect((within(menu).getByRole("tab", { name: /כולם/ })).getAttribute("aria-selected")).toBe("true");
    expect(within(menu).queryByText("מלי")).toBeNull();

    // Multi-select: the list appears; tick me + Mali + Esti.
    await user.click(within(menu).getByRole("tab", { name: /בחירה מרובה/ }));
    menu = screen.getByRole("menu");
    await user.click(within(menu).getByRole("menuitemcheckbox", { name: "אני" }));
    await user.click(within(menu).getByRole("menuitemcheckbox", { name: "מלי" }));
    await user.click(within(menu).getByRole("menuitemcheckbox", { name: "אסתי" }));
    // The menu stays open while ticking.
    menu = screen.getByRole("menu");
    expect(within(menu).getByText("נבחרו 3")).toBeTruthy();

    // Switch to "only mine": the list disappears.
    await user.click(within(menu).getByRole("tab", { name: /רק שלי/ }));
    menu = screen.getByRole("menu");
    expect(within(menu).queryByRole("menuitemcheckbox", { name: "מלי" })).toBeNull();
    expect((screen.getByTitle(/סינון לפי משתמש/)).getAttribute("title")).toBe("סינון לפי משתמש: רק שלי");

    // Back to multi-select: the same three users are still ticked.
    await user.click(within(menu).getByRole("tab", { name: /בחירה מרובה/ }));
    menu = screen.getByRole("menu");
    const checked = within(menu)
      .getAllByRole("menuitemcheckbox")
      .filter((el) => el.getAttribute("aria-checked") === "true")
      .map((el) => el.textContent);
    expect(checked.sort()).toEqual(["אני", "אסתי", "מלי"].sort());
    expect((screen.getByTitle(/סינון לפי משתמש/)).getAttribute("title")).toBe("סינון לפי משתמש: 3 משתמשים");
  });

  it("the list scrolls inside one area that fits the screen", async () => {
    const user = userEvent.setup();
    render(<UserFilterMenu />);
    const menu = await openMenu(user);
    expect(menu.className).toContain("max-h-[min(80vh,var(--radix-dropdown-menu-content-available-height))]");
    expect(menu.className).toContain("overflow-y-auto");
    // No second, nested scroll area inside the menu.
    expect(menu.querySelector(".overflow-y-auto")).toBeNull();
  });

  it("search filters the user list", async () => {
    const user = userEvent.setup();
    stored = { "global-user-filter-mode": "multi" };
    render(<UserFilterMenu />);
    const menu = await openMenu(user);
    await user.type(within(menu).getByPlaceholderText("חיפוש משתמש..."), "חנה");
    await waitFor(() => expect(within(screen.getByRole("menu")).queryByText("מלי")).toBeNull());
    expect(within(screen.getByRole("menu")).getByText("חנה")).toBeTruthy();
  });
});
