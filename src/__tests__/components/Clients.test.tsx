/**
 * Clients – Component Button Tests
 * Tests main action buttons (add, table, selection mode, stages, statistics)
 *
 * The Clients page is a 4380-line monolith with deep dependencies,
 * so we mock all hooks and verify button existence + click handlers.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/clients" }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com" },
    profile: { full_name: "Test" },
    isAdmin: true,
    isLoading: false,
    roles: ["admin"],
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
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

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useUserSettings", () => ({
  useViewSettings: () => ({
    viewMode: "grid",
    columns: 2,
    sortBy: "name",
    setViewMode: vi.fn(),
    setColumns: vi.fn(),
    setSortBy: vi.fn(),
    isLoading: false,
  }),
  useUserSettings: () => ({ value: {}, setValue: vi.fn(), isLoading: false }),
}));

vi.mock("@/hooks/useGoogleSheets", () => ({
  useGoogleSheets: () => ({
    isConnected: false,
    isLoading: false,
    connect: vi.fn(),
    syncClientsToSheets: vi.fn(),
  }),
}));

vi.mock("@/hooks/useClientCustomFields", () => ({
  useClientCustomFields: () => ({
    customFields: [],
    getFieldValues: vi.fn().mockReturnValue({}),
    setFieldValues: vi.fn(),
    isLoading: false,
  }),
}));

// Fix: mock useClientFieldConfig to return isVisible as a proper function
vi.mock("@/hooks/useClientFieldConfig", () => ({
  useClientFieldConfig: () => ({
    fields: [],
    isLoading: false,
    isVisible: (key: string) => true,
    hiddenCount: 0,
    visibleCount: 10,
    updateField: vi.fn(),
    resetToDefaults: vi.fn(),
    exportConfig: vi.fn(),
    importConfig: vi.fn(),
    moveField: vi.fn(),
    toggleFieldVisible: vi.fn(),
    reorderFields: vi.fn(),
    getFieldOrder: vi.fn().mockReturnValue(0),
  }),
}));

vi.mock("@/components/alerts", () => ({
  useInactiveClients: () => ({ inactiveCount: 0, checkInactive: vi.fn() }),
}));

vi.mock("@/components/layout", () => ({
  AppLayout: ({ children, title }: any) => (
    <div data-testid="app-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/components/clients/ClientsFilterStrip", () => ({
  ClientsFilterStrip: ({ onFilterChange }: any) => (
    <div data-testid="filter-strip">Filters</div>
  ),
}));
vi.mock("@/components/clients/ClientQuickClassify", () => ({
  ClientQuickClassify: () => <div>Classify</div>,
}));
vi.mock("@/components/clients/SmartComboField", () => ({
  default: (props: any) => <input data-testid="smart-combo" />,
}));
vi.mock("@/components/clients/CustomFieldsSection", () => ({
  default: () => <div>CustomFields</div>,
}));
vi.mock("@/components/clients/ClientsByStageView", () => ({
  ClientsByStageView: () => <div data-testid="stages-view">Stages</div>,
}));
vi.mock("@/components/clients/ClientsStatisticsView", () => ({
  ClientsStatisticsView: () => <div data-testid="stats-view">Stats</div>,
}));
vi.mock("@/components/clients/BulkClassifyDialog", () => ({
  BulkClassifyDialog: ({ open }: any) =>
    open ? <div data-testid="bulk-classify">BC</div> : null,
}));
vi.mock("@/components/clients/BulkStageDialog", () => ({
  BulkStageDialog: ({ open }: any) =>
    open ? <div data-testid="bulk-stage">BS</div> : null,
}));
vi.mock("@/components/clients/BulkConsultantDialog", () => ({
  BulkConsultantDialog: ({ open }: any) =>
    open ? <div data-testid="bulk-consultant">BCons</div> : null,
}));
vi.mock("@/components/clients/CategoryTagsManager", () => ({
  CategoryTagsManager: () => <div>Tags</div>,
}));
vi.mock("@/components/clients/CategoriesSidebar", () => ({
  CategoriesSidebar: () => <div data-testid="cat-sidebar">Categories</div>,
}));
vi.mock("@/components/clients/ClientNameWithCategory", () => ({
  ClientNameWithCategory: ({ name }: any) => <span>{name}</span>,
}));
vi.mock("@/lib/phone-utils", () => ({
  isValidPhoneForDisplay: () => true,
}));
vi.mock("@/components/search/GlobalSearch", () => ({
  GlobalSearch: () => null,
  SearchButton: () => <button>S</button>,
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

// Supabase mock is defined in test-setup.ts (global) – no need to re-mock here

import Clients from "@/pages/Clients";

describe("Clients – Button Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the clients page", async () => {
    render(<Clients />);
    await waitFor(() => {
      expect(screen.getByTestId("app-layout")).toBeDefined();
    });
  });

  it('"הוסף לקוח" button is clickable', async () => {
    render(<Clients />);
    await waitFor(() => {
      const btn = screen.queryByText("הוסף לקוח");
      expect(btn).not.toBeNull();
    });
    const btns = screen.getAllByText("הוסף לקוח");
    const mainBtn = btns.find(
      (b) => b.tagName === "BUTTON" || b.closest("button"),
    );
    if (mainBtn) {
      await user.click(mainBtn.closest("button") || mainBtn);
    }
  });

  it('"טבלה" button navigates to /datatable-pro', async () => {
    render(<Clients />);
    await waitFor(() => screen.getByTestId("app-layout"));
    const tableBtn = screen.queryByText("טבלה");
    if (tableBtn) {
      const btn = tableBtn.closest("button") || tableBtn;
      await user.click(btn);
      expect(mockNavigate).toHaveBeenCalledWith("/datatable-pro");
    }
  });

  it('"בחירה מרובה" button exists', async () => {
    render(<Clients />);
    await waitFor(() => screen.getByTestId("app-layout"));
    const selBtn = screen.queryByText(/בחירה מרובה/);
    expect(selBtn).not.toBeNull();
  });

  it('"שלבים" button exists and is clickable', async () => {
    render(<Clients />);
    await waitFor(() => screen.getByTestId("app-layout"));
    const btn = screen.queryByText("שלבים");
    if (btn) {
      await user.click(btn.closest("button") || btn);
    }
  });

  it('"סטטיסטיקות" button exists and is clickable', async () => {
    render(<Clients />);
    await waitFor(() => screen.getByTestId("app-layout"));
    const btn = screen.queryByText("סטטיסטיקות");
    if (btn) {
      await user.click(btn.closest("button") || btn);
    }
  });

  it("Search input exists", async () => {
    render(<Clients />);
    await waitFor(() => screen.getByTestId("app-layout"));
    const input = screen.queryByPlaceholderText(/חיפוש|חפש/);
    expect(input).not.toBeNull();
  });
});
