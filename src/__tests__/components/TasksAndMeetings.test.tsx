/**
 * TasksAndMeetings – Component Button Tests
 * Tests buttons: new task, new meeting, tabs, view toggle, per-task actions
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/tasks-meetings" }),
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

const mockCreateTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();

vi.mock("@/hooks/useTasksOptimized", () => ({
  useTasksOptimized: () => ({
    tasks: [
      {
        id: "t1",
        title: "משימה 1",
        description: "תיאור",
        status: "pending",
        priority: "high",
        due_date: "2026-12-01",
        user_id: "u1",
        client_id: null,
        completed: false,
        created_at: "2026-01-01",
      },
      {
        id: "t2",
        title: "משימה 2",
        description: "",
        status: "completed",
        priority: "low",
        due_date: "2026-11-01",
        user_id: "u1",
        client_id: null,
        completed: true,
        created_at: "2026-01-02",
      },
    ],
    loading: false,
    createTask: mockCreateTask,
    updateTask: mockUpdateTask,
    deleteTask: mockDeleteTask,
    fetchTasks: vi.fn(),
  }),
}));

const mockDeleteMeeting = vi.fn();

vi.mock("@/hooks/useMeetingsOptimized", () => ({
  useMeetingsOptimized: () => ({
    meetings: [
      {
        id: "m1",
        title: "פגישה 1",
        description: "",
        start_time: "2026-12-01T10:00:00",
        end_time: "2026-12-01T11:00:00",
        meeting_type: "video",
        location: "Zoom",
        notes: "",
        user_id: "u1",
        client_id: null,
        created_at: "2026-01-01",
      },
    ],
    loading: false,
    createMeeting: vi.fn(),
    updateMeeting: vi.fn(),
    deleteMeeting: mockDeleteMeeting,
    fetchMeetings: vi.fn(),
  }),
}));

vi.mock("@/components/layout", () => ({
  AppLayout: ({ children, title }: any) => (
    <div data-testid="app-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// Mock sub-views with correct prop names matching the real component
vi.mock("@/components/tasks-meetings", () => ({
  TasksViewToggle: ({ view, onViewChange }: any) => (
    <div data-testid="view-toggle">
      <button data-testid="view-list" onClick={() => onViewChange("list")}>
        רשימה
      </button>
      <button data-testid="view-kanban" onClick={() => onViewChange("kanban")}>
        קנבן
      </button>
    </div>
  ),
  TasksListView: ({ tasks, onEdit, onDelete, onToggleComplete }: any) => (
    <div data-testid="tasks-list-view">
      {(tasks || []).map((t: any) => (
        <div key={t.id} data-testid={`task-row-${t.id}`}>
          <span>{t.title}</span>
          <button data-testid={`edit-task-${t.id}`} onClick={() => onEdit(t)}>
            ערוך
          </button>
          <button
            data-testid={`delete-task-${t.id}`}
            onClick={() => onDelete(t.id)}
          >
            מחק
          </button>
          <button
            data-testid={`toggle-task-${t.id}`}
            onClick={() => onToggleComplete(t)}
          >
            סיום
          </button>
        </div>
      ))}
    </div>
  ),
  TasksGridView: ({ tasks, onEdit, onDelete, onToggleComplete }: any) => (
    <div data-testid="tasks-grid">Grid</div>
  ),
  TasksKanbanView: ({ tasks }: any) => (
    <div data-testid="tasks-kanban">Kanban</div>
  ),
  TasksCalendarView: () => <div data-testid="tasks-calendar">Cal</div>,
  TasksTimelineView: () => <div data-testid="tasks-timeline">TL</div>,
  TasksStatsHeader: () => <div data-testid="tasks-stats">Stats</div>,
  MeetingsListView: ({ meetings, onEdit, onDelete }: any) => (
    <div data-testid="meetings-list-view">
      {(meetings || []).map((m: any) => (
        <div key={m.id} data-testid={`meeting-row-${m.id}`}>
          <span>{m.title}</span>
          <button
            data-testid={`edit-meeting-${m.id}`}
            onClick={() => onEdit(m)}
          >
            ערוך
          </button>
          <button
            data-testid={`delete-meeting-${m.id}`}
            onClick={() => onDelete(m.id)}
          >
            מחק
          </button>
        </div>
      ))}
    </div>
  ),
}));

// Mock QuickAddTask – capture props to verify editingTask
let capturedTaskProps: any = {};
vi.mock("@/components/layout/sidebar-tasks/QuickAddTask", () => ({
  QuickAddTask: (props: any) => {
    capturedTaskProps = props;
    return props.open ? (
      <div data-testid="task-dialog">
        <span data-testid="task-dialog-mode">
          {props.editingTask ? `edit:${props.editingTask.title}` : "new"}
        </span>
        <button
          data-testid="close-task-dialog"
          onClick={() => props.onOpenChange(false)}
        >
          סגור
        </button>
      </div>
    ) : null;
  },
}));

let capturedMeetingProps: any = {};
vi.mock("@/components/layout/sidebar-tasks/QuickAddMeeting", () => ({
  QuickAddMeeting: (props: any) => {
    capturedMeetingProps = props;
    return props.open ? (
      <div data-testid="meeting-dialog">
        <span data-testid="meeting-dialog-mode">
          {props.editingMeeting ? `edit:${props.editingMeeting.title}` : "new"}
        </span>
        <button
          data-testid="close-meeting-dialog"
          onClick={() => props.onOpenChange(false)}
        >
          סגור
        </button>
      </div>
    ) : null;
  },
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
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

import TasksAndMeetings from "@/pages/TasksAndMeetings";

describe("TasksAndMeetings – Button Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    capturedTaskProps = {};
    capturedMeetingProps = {};
  });

  it("renders the page", () => {
    render(<TasksAndMeetings />);
    expect(screen.getByTestId("app-layout")).toBeDefined();
  });

  // ── New Task ──
  it('"משימה חדשה" opens task dialog in NEW mode', async () => {
    render(<TasksAndMeetings />);
    // There are two buttons with "משימה חדשה" text – get the main button (not inside dialog)
    const btns = screen.getAllByText("משימה חדשה");
    const mainBtn = btns.find(
      (b) =>
        b.tagName === "BUTTON" && !b.closest('[data-testid="task-dialog"]'),
    );
    expect(mainBtn).toBeDefined();
    await user.click(mainBtn!);
    expect(screen.getByTestId("task-dialog")).toBeDefined();
    expect(screen.getByTestId("task-dialog-mode").textContent).toBe("new");
  });

  // ── New Meeting ──
  it('"פגישה חדשה" opens meeting dialog in NEW mode', async () => {
    render(<TasksAndMeetings />);
    const btns = screen.getAllByText("פגישה חדשה");
    const mainBtn = btns.find(
      (b) =>
        b.tagName === "BUTTON" && !b.closest('[data-testid="meeting-dialog"]'),
    );
    expect(mainBtn).toBeDefined();
    await user.click(mainBtn!);
    expect(screen.getByTestId("meeting-dialog")).toBeDefined();
    expect(screen.getByTestId("meeting-dialog-mode").textContent).toBe("new");
  });

  // ── Tab Switching ──
  it("Switching to meetings tab shows meetings list", async () => {
    render(<TasksAndMeetings />);
    const meetingsTab = screen.getByRole("tab", { name: /פגישות/ });
    await user.click(meetingsTab);
    await waitFor(() => {
      expect(screen.getByTestId("meetings-list-view")).toBeDefined();
    });
  });

  it("Switching back to tasks tab shows tasks list", async () => {
    render(<TasksAndMeetings />);
    await user.click(screen.getByRole("tab", { name: /פגישות/ }));
    await user.click(screen.getByRole("tab", { name: /משימות/ }));
    await waitFor(() => {
      expect(screen.getByTestId("tasks-list-view")).toBeDefined();
    });
  });

  // ── View Toggle ──
  it("View toggle kanban button works", async () => {
    render(<TasksAndMeetings />);
    await user.click(screen.getByTestId("view-kanban"));
    // After clicking, kanban view should render
    await waitFor(() => {
      expect(screen.getByTestId("tasks-kanban")).toBeDefined();
    });
  });

  // ── Edit Task ──
  it("Edit task button opens the task dialog", async () => {
    render(<TasksAndMeetings />);
    await user.click(screen.getByTestId("edit-task-t1"));
    await waitFor(() => {
      expect(screen.getByTestId("task-dialog")).toBeDefined();
    });
  });

  // ── Delete Task ──
  it("Delete task (with confirm) calls deleteTask", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TasksAndMeetings />);
    await user.click(screen.getByTestId("delete-task-t1"));
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeleteTask).toHaveBeenCalledWith("t1");
    confirmSpy.mockRestore();
  });

  it("Delete task cancelled does NOT call deleteTask", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<TasksAndMeetings />);
    await user.click(screen.getByTestId("delete-task-t1"));
    expect(mockDeleteTask).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  // ── Toggle Complete ──
  it("Toggle complete calls updateTask with new status", async () => {
    render(<TasksAndMeetings />);
    await user.click(screen.getByTestId("toggle-task-t1"));
    expect(mockUpdateTask).toHaveBeenCalledWith("t1", { status: "completed" });
  });

  // ── Edit Meeting ──
  it("Edit meeting opens the meeting dialog", async () => {
    render(<TasksAndMeetings />);
    // Switch to meetings tab first
    await user.click(screen.getByRole("tab", { name: /פגישות/ }));
    await waitFor(() => screen.getByTestId("meetings-list-view"));
    await user.click(screen.getByTestId("edit-meeting-m1"));
    await waitFor(() => {
      expect(screen.getByTestId("meeting-dialog")).toBeDefined();
    });
  });

  // ── Delete Meeting ──
  it("Delete meeting (with confirm) calls deleteMeeting", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TasksAndMeetings />);
    await user.click(screen.getByRole("tab", { name: /פגישות/ }));
    await waitFor(() => screen.getByTestId("meetings-list-view"));
    await user.click(screen.getByTestId("delete-meeting-m1"));
    expect(mockDeleteMeeting).toHaveBeenCalledWith("m1");
    confirmSpy.mockRestore();
  });

  // ── Close Dialogs ──
  it("Closing task dialog hides it", async () => {
    render(<TasksAndMeetings />);
    const btns = screen.getAllByText("משימה חדשה");
    await user.click(btns.find((b) => b.tagName === "BUTTON")!);
    expect(screen.getByTestId("task-dialog")).toBeDefined();
    await user.click(screen.getByTestId("close-task-dialog"));
    expect(screen.queryByTestId("task-dialog")).toBeNull();
  });
});
