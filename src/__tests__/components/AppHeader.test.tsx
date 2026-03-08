/**
 * AppHeader – Component Button Tests
 * Verifies every button renders and fires the correct handler
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ──────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockSetTheme = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/" }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock("@/hooks/useUndoRedo", () => ({
  useUndoRedo: () => ({
    canUndo: true,
    canRedo: true,
    undo: mockUndo,
    redo: mockRedo,
    pastActions: [
      { id: "1", description: "פעולה 1" },
      { id: "2", description: "פעולה 2" },
    ],
  }),
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
    resolvedTheme: "light",
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { email: "test@test.com" },
    profile: { full_name: "Test User" },
    signOut: mockSignOut,
    roles: [],
    isAdmin: true,
    isLoading: false,
  }),
}));

vi.mock("@/components/search/GlobalSearch", () => ({
  GlobalSearch: ({ open }: any) =>
    open ? <div data-testid="global-search-dialog">Search</div> : null,
  SearchButton: ({ onClick }: any) => (
    <button data-testid="search-btn" onClick={onClick}>
      חיפוש
    </button>
  ),
}));

vi.mock("@/components/shared/TextCustomizerButton", () => ({
  TextCustomizerButton: () => <button data-testid="text-customizer">T</button>,
}));

vi.mock("@/components/notifications/NotificationCenter", () => ({
  NotificationCenter: () => <div data-testid="notif">NC</div>,
}));

vi.mock("@/components/pwa/SyncStatusIndicator", () => ({
  SyncStatusIndicator: () => <div data-testid="sync">S</div>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span>{children}</span>,
}));

import { AppHeader } from "@/components/layout/AppHeader";

describe("AppHeader – Button Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the header title", () => {
    render(<AppHeader title="tenarch CRM Pro" />);
    expect(screen.getByText("tenarch CRM Pro")).toBeDefined();
  });

  it("Search button opens GlobalSearch dialog", async () => {
    render(<AppHeader />);
    await user.click(screen.getByTestId("search-btn"));
    expect(screen.getByTestId("global-search-dialog")).toBeDefined();
  });

  it("Mobile menu button calls onMobileMenuToggle", async () => {
    const mockToggle = vi.fn();
    render(<AppHeader isMobile={true} onMobileMenuToggle={mockToggle} />);
    await user.click(screen.getByLabelText("תפריט"));
    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it("Mobile menu not rendered when isMobile=false", () => {
    render(<AppHeader isMobile={false} />);
    expect(screen.queryByLabelText("תפריט")).toBeNull();
  });

  it("Theme toggle button is present and clickable", async () => {
    render(<AppHeader />);
    const themeBtn = screen.getByLabelText("שנה ערכת נושא");
    await user.click(themeBtn);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("Animation toggle button renders", () => {
    render(<AppHeader />);
    const animBtn =
      screen.queryByLabelText("כבה אנימציות") ||
      screen.queryByLabelText("הפעל אנימציות");
    expect(animBtn).not.toBeNull();
  });

  it("User menu shows user name on desktop", () => {
    render(<AppHeader />);
    expect(screen.getByText("Test User")).toBeDefined();
  });

  it("User menu → הגדרות navigates to /settings", async () => {
    render(<AppHeader />);
    await user.click(screen.getByText("Test User"));
    await user.click(await screen.findByText("הגדרות"));
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
  });

  it("User menu → פרופיל navigates to /employees", async () => {
    render(<AppHeader />);
    await user.click(screen.getByText("Test User"));
    await user.click(await screen.findByText("פרופיל"));
    expect(mockNavigate).toHaveBeenCalledWith("/employees");
  });

  it("User menu → היסטוריה navigates to /history", async () => {
    render(<AppHeader />);
    await user.click(screen.getByText("Test User"));
    await user.click(await screen.findByText("היסטוריה"));
    expect(mockNavigate).toHaveBeenCalledWith("/history");
  });

  it("User menu → יציאה calls signOut", async () => {
    render(<AppHeader />);
    await user.click(screen.getByText("Test User"));
    await user.click(await screen.findByText("יציאה"));
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("History badge shows past actions count", () => {
    render(<AppHeader />);
    expect(screen.getByText("2")).toBeDefined();
  });
});
