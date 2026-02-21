/**
 * Dashboard (Index) – Component Button Tests
 * The dashboard uses DashboardThemeProvider with deeply nested context,
 * so we test the DashboardContent component via mocked providers.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/" }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com" },
    profile: { full_name: "Test User" },
    isAdmin: true,
    isLoading: false,
    roles: ["admin"],
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/useUndoRedo", () => ({
  useUndoRedo: () => ({
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    pastActions: [],
  }),
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
}));

vi.mock("@/hooks/useBackupRestore", () => ({
  useBackupRestore: () => ({
    createBackup: vi.fn(),
    restoreLatest: vi.fn(),
    backups: [],
    isProcessing: false,
    lastBackupDate: null,
    restoreBackup: vi.fn(),
    exportBackup: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDashboardDataOptimized", () => ({
  useDashboardData: () => ({
    clients: [
      {
        id: "1",
        contact_name: "לקוח 1",
        email: "a@t.com",
        phone: "050-1",
        status: "active",
      },
      {
        id: "2",
        contact_name: "לקוח 2",
        email: "b@t.com",
        phone: "050-2",
        status: "active",
      },
    ],
    projects: [{ id: "1", name: "פ1", status: "active" }],
    timeEntries: [],
    profiles: [],
    invoices: [],
    quotes: [],
    stats: {
      activeClients: 2,
      activeClientsChange: 10,
      openProjects: 1,
      openProjectsChange: 0,
      monthlyRevenue: 5000,
      monthlyRevenueChange: 5,
      totalHours: 120,
      totalHoursChange: -3,
    },
    revenueData: [],
    projectsStatusData: [],
    hoursByEmployee: [],
    hoursByProject: [],
    isLoading: false,
    isChartsLoading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/usePrefetch", () => ({
  usePrefetchCommonRoutes: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  AppLayout: ({ children }: any) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

// Mock the dashboard module with full themeConfig structure
vi.mock("@/components/dashboard", () => ({
  RevenueChart: () => <div>Chart</div>,
  ProjectsStatusChart: () => <div>Chart</div>,
  WorkHoursChart: () => <div>Chart</div>,
  WorkHoursTableWidget: () => <div>Table</div>,
  DashboardThemeProvider: ({ children }: any) => <>{children}</>,
  useDashboardTheme: () => ({
    dashboardTheme: "default",
    currentTheme: "default",
    setDashboardTheme: vi.fn(),
    setTheme: vi.fn(),
    themeConfig: {
      name: "Default",
      description: "Default theme",
      colors: {
        background: "#ffffff",
        cardBackground: "#ffffff",
        border: "#e5e7eb",
        text: "#111827",
        textSecondary: "#6b7280",
        accent: "#3b82f6",
        accentHover: "#2563eb",
      },
      effects: {
        glow: false,
        reflection: false,
        gradient: false,
        roundedCorners: "lg",
        shadow: "md",
      },
    },
  }),
  DashboardSettingsDialog: ({ open }: any) =>
    open ? <div data-testid="settings-dialog">Settings</div> : null,
  ThemedWidget: ({ children, title }: any) => (
    <div data-testid={`widget-${title}`}>{children}</div>
  ),
  ThemedStatCard: ({ title, value, onClick }: any) => (
    <button data-testid={`stat-${title}`} onClick={onClick}>
      {title}: {value}
    </button>
  ),
  DynamicTableWidget: () => <div>TW</div>,
  DynamicStatsWidget: () => <div>SW</div>,
  SmartStatsGrid: () => <div>SSG</div>,
  WidgetLayoutProvider: ({ children }: any) => <>{children}</>,
  useWidgetLayout: () => ({
    layouts: [],
    isVisible: vi.fn(() => true),
    getGridClass: vi.fn(() => ""),
    gridGap: "md",
    gapX: 16,
    gapY: 16,
    toggleWidget: vi.fn(),
    moveWidget: vi.fn(),
    resetLayout: vi.fn(),
    resetAll: vi.fn(),
    swapWidgets: vi.fn(),
    cycleSize: vi.fn(),
    setSize: vi.fn(),
    toggleVisibility: vi.fn(),
    toggleCollapse: vi.fn(),
    setGridGap: vi.fn(),
    setGapX: vi.fn(),
    setGapY: vi.fn(),
    autoArrangeWidgets: vi.fn(),
    balanceRow: vi.fn(),
    equalizeHeights: false,
    autoExpand: false,
    setEqualizeHeights: vi.fn(),
    setAutoExpand: vi.fn(),
    dashboardTheme: "default",
    setDashboardTheme: vi.fn(),
    isLoading: false,
    isSaving: false,
    getLayout: vi.fn(),
  }),
  WidgetContainer: ({ children }: any) => <div>{children}</div>,
  WidgetGrid: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/dashboard/DashboardSkeletons", () => ({
  DashboardStatsSkeleton: () => <div>Loading...</div>,
}));

vi.mock("@/components/ui/page-transition", () => ({
  PageTransition: ({ children }: any) => <>{children}</>,
  FadeIn: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/components/ui/loading", () => ({
  FullPageLoader: () => <div>Loading...</div>,
}));

vi.mock("@/components/ui/info-tooltip-button", () => ({
  InfoTooltipButton: ({ title }: any) => (
    <button data-testid="info-tooltip">{title}</button>
  ),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/components/DataTable", () => ({ DataTable: () => <div>DT</div> }));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("@/components/search/GlobalSearch", () => ({
  GlobalSearch: () => null,
  SearchButton: () => <button>search</button>,
}));

vi.mock("@/components/shared/TextCustomizerButton", () => ({
  TextCustomizerButton: () => <span>TC</span>,
}));

vi.mock("@/components/notifications/NotificationCenter", () => ({
  NotificationCenter: () => <span>NC</span>,
}));

vi.mock("@/components/pwa/SyncStatusIndicator", () => ({
  SyncStatusIndicator: () => <span>Sync</span>,
}));

import Index from "@/pages/Index";

describe("Dashboard (Index) – Button Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard", () => {
    render(<Index />);
    expect(screen.getByTestId("app-layout")).toBeDefined();
  });

  it("Active clients stat navigates to /clients", async () => {
    render(<Index />);
    const card = screen.getByTestId("stat-לקוחות פעילים");
    await user.click(card);
    expect(mockNavigate).toHaveBeenCalledWith("/clients");
  });

  it("Open projects stat navigates to /projects", async () => {
    render(<Index />);
    await user.click(screen.getByTestId("stat-פרויקטים פתוחים"));
    expect(mockNavigate).toHaveBeenCalledWith("/projects");
  });

  it("Revenue stat navigates to /finance", async () => {
    render(<Index />);
    await user.click(screen.getByTestId("stat-הכנסות החודש"));
    expect(mockNavigate).toHaveBeenCalledWith("/finance");
  });

  it("Work hours stat navigates to /time-logs", async () => {
    render(<Index />);
    await user.click(screen.getByTestId("stat-שעות עבודה"));
    expect(mockNavigate).toHaveBeenCalledWith("/time-logs");
  });
});
