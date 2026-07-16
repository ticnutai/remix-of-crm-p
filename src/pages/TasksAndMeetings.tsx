import React, { useState, useEffect, useRef } from "react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  useTasksOptimized as useTasks,
  Task,
  TaskInsert,
} from "@/hooks/useTasksOptimized";
import {
  useMeetingsOptimized as useMeetings,
  Meeting,
  MeetingInsert,
} from "@/hooks/useMeetingsOptimized";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  CheckSquare,
  Calendar,
  Search,
  Filter,
  ClipboardList,
  Loader2,
  Bell,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Eye,
  EyeOff,
  CheckSquare2,
  CheckCheck,
  Pencil,
  Trash2,
} from "lucide-react";
import { sortItems, SortField, SortOrder } from "@/utils/sortAndDedup";
import { useReminders, Reminder } from "@/hooks/useReminders";
import { useProfileNames } from "@/hooks/useProfileNames";
import { EventPreviewDialog } from "@/components/tasks-meetings/EventPreviewDialog";
import { isPast as isDatePast, isFuture } from "date-fns";
import {
  TasksViewToggle,
  TasksListView,
  TasksGridView,
  TasksKanbanView,
  TasksCalendarView,
  TasksTimelineView,
  TasksStatsHeader,
  MeetingsListView,
  RemindersTabContent,
  ViewType,
} from "@/components/tasks-meetings";
import { QuickAddTask } from "@/components/layout/sidebar-tasks/QuickAddTask";
import { QuickAddMeeting } from "@/components/layout/sidebar-tasks/QuickAddMeeting";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import { DedupToggleButton } from "@/components/DedupToggleButton";
import { UserFilterMenu, useUserFilter } from "@/components/shared/UserFilterMenu";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { parseISO } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const HOVER_DIALOG_SETTINGS_KEY = "tasks-meetings-hover-dialog-settings";
const COLUMN_SETTINGS_KEY = "tasks-meetings-column-settings";

type ColumnKey = "tasks" | "meetings" | "reminders";
type ColumnSortField = "time" | "name" | "priority" | "user" | "created";
type ColumnSortConfig = {
  field: ColumnSortField;
  order: SortOrder;
};

const DEFAULT_COLUMN_SORT_CONFIG: Record<ColumnKey, ColumnSortConfig> = {
  tasks: { field: "time", order: "asc" },
  meetings: { field: "time", order: "asc" },
  reminders: { field: "time", order: "asc" },
};

const DEFAULT_COLUMN_HOVER_PREVIEW: Record<ColumnKey, boolean> = {
  tasks: true,
  meetings: true,
  reminders: true,
};

type HoverDialogSettings = {
  openDelayMs: number;
  closeDelayMs: number;
};

type DeleteTarget = {
  type: "task" | "meeting" | "reminder";
  id: string;
};

const DEFAULT_HOVER_DIALOG_SETTINGS: HoverDialogSettings = {
  openDelayMs: 200,
  closeDelayMs: 150,
};

const TasksAndMeetings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    fetchTasks,
  } = useTasks();
  const {
    meetings,
    loading: meetingsLoading,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    fetchMeetings,
  } = useMeetings();
  const {
    reminders,
    loading: remindersLoading,
    deleteReminder,
    dismissReminder,
  } = useReminders();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "all",
  );
  const [taskView, setTaskView] = useSyncedSetting<ViewType>({ key: "tasks-meetings-view", defaultValue: "list" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useSyncedSetting<string>({ key: "tasks-status-filter", defaultValue: "all" });
  const [priorityFilter, setPriorityFilter] = useSyncedSetting<string>({ key: "tasks-priority-filter", defaultValue: "all" });
  const [sortBy, setSortBy] = useSyncedSetting<SortField>({ key: "tasks-sort-by", defaultValue: "event_date" });
  const [sortOrder, setSortOrder] = useSyncedSetting<SortOrder>({ key: "tasks-sort-order", defaultValue: "desc" });
  const { isAdmin } = usePermissions();
  const userFilter = useUserFilter();


  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [reminderEditOpen, setReminderEditOpen] = useState(false);

  // Preview dialog
  const [previewEvent, setPreviewEvent] = useState<any>(null);
  const [previewType, setPreviewType] = useState<"task" | "meeting" | "reminder">("task");
  const [previewAnchorPoint, setPreviewAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [isPreviewPinned, setIsPreviewPinned] = useState(false);
  const [hoverDialogSettings, setHoverDialogSettings] = useState<HoverDialogSettings>(
    DEFAULT_HOVER_DIALOG_SETTINGS,
  );
  const [columnSortConfig, setColumnSortConfig] = useSyncedSetting<
    Record<ColumnKey, ColumnSortConfig>
  >({ key: "tasks-meetings-column-sort", defaultValue: DEFAULT_COLUMN_SORT_CONFIG });
  const [columnHoverPreviewEnabled, setColumnHoverPreviewEnabled] = useSyncedSetting<
    Record<ColumnKey, boolean>
  >({ key: "tasks-meetings-column-hover", defaultValue: DEFAULT_COLUMN_HOVER_PREVIEW });
  const hoverOpenTimerRef = useRef<number | null>(null);
  const hoverCloseTimerRef = useRef<number | null>(null);

  // Shared data
  const [clients, setClients] = useState<
    {
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
    }[]
  >([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    try {
      const rawSettings = localStorage.getItem(HOVER_DIALOG_SETTINGS_KEY);
      if (!rawSettings) return;
      const parsed = JSON.parse(rawSettings) as Partial<HoverDialogSettings>;
      const nextOpen =
        typeof parsed.openDelayMs === "number"
          ? Math.min(1000, Math.max(0, parsed.openDelayMs))
          : DEFAULT_HOVER_DIALOG_SETTINGS.openDelayMs;
      const nextClose =
        typeof parsed.closeDelayMs === "number"
          ? Math.min(1000, Math.max(0, parsed.closeDelayMs))
          : DEFAULT_HOVER_DIALOG_SETTINGS.closeDelayMs;
      setHoverDialogSettings({ openDelayMs: nextOpen, closeDelayMs: nextClose });
    } catch {
      setHoverDialogSettings(DEFAULT_HOVER_DIALOG_SETTINGS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      HOVER_DIALOG_SETTINGS_KEY,
      JSON.stringify(hoverDialogSettings),
    );
  }, [hoverDialogSettings]);

  // columnSortConfig & columnHoverPreviewEnabled are now cloud-synced
  // via useSyncedSetting (cross-device persistence).


  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, projectsRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name, email, phone, whatsapp")
          .order("name"),
        supabase.from("projects").select("id, name").order("name"),
      ]);
      if (clientsRes.data) setClients(clientsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    };
    if (user) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Scope filter helpers (admin can see all; others always see only their own)
  const ownsTask = (t: Task) => !user || t.created_by === user.id || t.assigned_to === user.id;
  const ownsMeeting = (m: Meeting) =>
    !user || m.created_by === user.id || (((m as any).attendees as string[] | undefined) || []).includes(user.id);
  const ownsReminder = (r: Reminder) => !user || r.user_id === user.id;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (!isAdmin && !ownsTask(task)) return false;
    if (isAdmin && !userFilter.matches(task, "tasks")) return false;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "overdue"
        ? task.due_date &&
          isDatePast(parseISO(task.due_date)) &&
          task.status !== "completed"
        : task.status === statusFilter);
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filter meetings
  const filteredMeetings = meetings.filter((meeting) => {
    if (!isAdmin && !ownsMeeting(meeting)) return false;
    if (isAdmin && !userFilter.matches(meeting, "meetings")) return false;
    return (
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter reminders by scope (used inside RemindersTabContent below)
  const scopedReminders = reminders.filter((r) => {
    if (!isAdmin && !ownsReminder(r)) return false;
    if (isAdmin && !userFilter.matches(r, "reminders")) return false;
    return true;
  });

  // Sort tasks
  const sortedTasks = sortItems(
    filteredTasks,
    sortBy,
    sortOrder,
    (task, field) => {
      switch (field) {
        case "created_at":
          return task.created_at;
        case "event_date":
          return task.due_date;
        case "title":
          return task.title;
        default:
          return null;
      }
    },
  );

  // Sort meetings
  const sortedMeetings = sortItems(
    filteredMeetings,
    sortBy,
    sortOrder,
    (meeting, field) => {
      switch (field) {
        case "created_at":
          return meeting.created_at;
        case "event_date":
          return meeting.start_time;
        case "title":
          return meeting.title;
        default:
          return null;
      }
    },
  );

  const [selectionMode, setSelectionMode] = useState<Record<ColumnKey, boolean>>({
    tasks: false,
    meetings: false,
    reminders: false,
  });
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<string[]>([]);
  const [selectedReminderIds, setSelectedReminderIds] = useState<string[]>([]);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredMeetingId, setHoveredMeetingId] = useState<string | null>(null);
  const [hoveredReminderId, setHoveredReminderId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);
  const [showTinyTaskNumbers, setShowTinyTaskNumbers] = useState(false);
  const [showTinyMeetingNumbers, setShowTinyMeetingNumbers] = useState(false);
  const [showTinyReminderNumbers, setShowTinyReminderNumbers] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);

  const clearSelection = (column: ColumnKey) => {
    setSelectionMode((prev) => ({ ...prev, [column]: false }));
    if (column === "tasks") setSelectedTaskIds([]);
    if (column === "meetings") setSelectedMeetingIds([]);
    if (column === "reminders") setSelectedReminderIds([]);
  };

  const activateSelectionMode = (column: ColumnKey) => {
    setSelectionMode((prev) => ({ ...prev, [column]: true }));
  };

  const toggleTaskSelection = (taskId: string) => {
    activateSelectionMode("tasks");
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  };

  const toggleMeetingSelection = (meetingId: string) => {
    activateSelectionMode("meetings");
    setSelectedMeetingIds((prev) =>
      prev.includes(meetingId)
        ? prev.filter((id) => id !== meetingId)
        : [...prev, meetingId],
    );
  };

  const toggleReminderSelection = (reminderId: string) => {
    activateSelectionMode("reminders");
    setSelectedReminderIds((prev) =>
      prev.includes(reminderId)
        ? prev.filter((id) => id !== reminderId)
        : [...prev, reminderId],
    );
  };

  const selectAllInColumn = (column: ColumnKey) => {
    activateSelectionMode(column);
    if (column === "tasks") setSelectedTaskIds(sortedTasksForAllColumn.tasks.map((task) => task.id));
    if (column === "meetings") {
      setSelectedMeetingIds(sortedTasksForAllColumn.meetings.map((meeting) => meeting.id));
    }
    if (column === "reminders") {
      setSelectedReminderIds(sortedTasksForAllColumn.reminders.map((reminder) => reminder.id));
    }
  };

  // Collect all created_by ids to resolve to names for sorting "by user"
  const allCreatorIds = [
    ...sortedTasks.map((t) => t.created_by),
    ...sortedMeetings.map((m) => m.created_by),
    ...reminders.map((r: any) => r.created_by),
  ];
  const resolveUserName = useProfileNames(allCreatorIds);

  const sortedTasksForAllColumn = {
    tasks: [...sortedTasks].sort((a, b) => {
      const config = columnSortConfig.tasks;
      const direction = config.order === "asc" ? 1 : -1;

      if (config.field === "name") {
        return a.title.localeCompare(b.title, "he") * direction;
      }

      if (config.field === "user") {
        return (
          resolveUserName(a.created_by).localeCompare(
            resolveUserName(b.created_by),
            "he",
          ) * direction
        );
      }

      if (config.field === "priority") {
        const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const rankA = priorityRank[a.priority || "medium"] ?? 1;
        const rankB = priorityRank[b.priority || "medium"] ?? 1;
        return (rankA - rankB) * direction;
      }

      if (config.field === "created") {
        const cA = new Date(a.created_at).getTime();
        const cB = new Date(b.created_at).getTime();
        return (cA - cB) * direction;
      }

      const timeA = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      return (timeA - timeB) * direction;
    }),
    meetings: [...sortedMeetings].sort((a, b) => {
      const config = columnSortConfig.meetings;
      const direction = config.order === "asc" ? 1 : -1;

      if (config.field === "name") {
        return a.title.localeCompare(b.title, "he") * direction;
      }

      if (config.field === "user") {
        return (
          resolveUserName(a.created_by).localeCompare(
            resolveUserName(b.created_by),
            "he",
          ) * direction
        );
      }

      if (config.field === "created") {
        const cA = new Date(a.created_at).getTime();
        const cB = new Date(b.created_at).getTime();
        return (cA - cB) * direction;
      }

      const timeA = new Date(a.start_time).getTime();
      const timeB = new Date(b.start_time).getTime();
      return (timeA - timeB) * direction;
    }),
    reminders: [...scopedReminders].sort((a, b) => {
      const config = columnSortConfig.reminders;
      const direction = config.order === "asc" ? 1 : -1;

      if (config.field === "name") {
        return a.title.localeCompare(b.title, "he") * direction;
      }

      if (config.field === "user") {
        return (
          resolveUserName((a as any).created_by).localeCompare(
            resolveUserName((b as any).created_by),
            "he",
          ) * direction
        );
      }

      if (config.field === "priority") {
        const isAOverdue = isDatePast(new Date(a.remind_at)) && !a.is_dismissed;
        const isBOverdue = isDatePast(new Date(b.remind_at)) && !b.is_dismissed;
        const rankA = isAOverdue ? 0 : a.is_dismissed ? 2 : 1;
        const rankB = isBOverdue ? 0 : b.is_dismissed ? 2 : 1;
        return (rankA - rankB) * direction;
      }

      if (config.field === "created") {
        const cA = new Date(a.created_at).getTime();
        const cB = new Date(b.created_at).getTime();
        return (cA - cB) * direction;
      }

      const timeA = new Date(a.remind_at).getTime();
      const timeB = new Date(b.remind_at).getTime();
      return (timeA - timeB) * direction;
    }),
  };

  const getSortFieldLabel = (field: ColumnSortField) => {
    if (field === "time") return "זמן";
    if (field === "name") return "שם";
    if (field === "user") return "משתמש";
    if (field === "created") return "יצירה";
    return "עדיפות";
  };


  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const clearPreviewTimers = () => {
    if (hoverOpenTimerRef.current) {
      window.clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }
    if (hoverCloseTimerRef.current) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const openPreview = (
    event: any,
    type: "task" | "meeting" | "reminder",
    pinned: boolean,
    anchorPoint?: { x: number; y: number } | null,
  ) => {
    clearPreviewTimers();
    setPreviewEvent(event);
    setPreviewType(type);
    setPreviewAnchorPoint(anchorPoint || null);
    setIsPreviewPinned(pinned);
  };

  const getPreviewAnchorFromElement = (element: HTMLElement | null) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: rect.right + 8,
      y: rect.top,
    };
  };

  const queuePreviewOpen = (
    event: any,
    type: "task" | "meeting" | "reminder",
    anchorPoint?: { x: number; y: number } | null,
  ) => {
    if (isPreviewPinned) return;

    if (hoverCloseTimerRef.current) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }

    if (hoverOpenTimerRef.current) {
      window.clearTimeout(hoverOpenTimerRef.current);
    }

    hoverOpenTimerRef.current = window.setTimeout(() => {
      setPreviewEvent(event);
      setPreviewType(type);
      setPreviewAnchorPoint(anchorPoint || null);
      setIsPreviewPinned(false);
      hoverOpenTimerRef.current = null;
    }, hoverDialogSettings.openDelayMs);
  };

  const queuePreviewClose = () => {
    if (isPreviewPinned) return;

    if (hoverOpenTimerRef.current) {
      window.clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }

    if (hoverCloseTimerRef.current) {
      window.clearTimeout(hoverCloseTimerRef.current);
    }

    hoverCloseTimerRef.current = window.setTimeout(() => {
      if (!isPreviewPinned) {
        setPreviewEvent(null);
      }
      hoverCloseTimerRef.current = null;
    }, hoverDialogSettings.closeDelayMs);
  };

  const handleTouchPreview = (
    column: ColumnKey,
    itemId: string,
    event: any,
    type: "task" | "meeting" | "reminder",
  ) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = window.setTimeout(() => {
      if (selectionMode[column]) {
        if (column === "tasks") toggleTaskSelection(itemId);
        if (column === "meetings") toggleMeetingSelection(itemId);
        if (column === "reminders") toggleReminderSelection(itemId);
      } else {
        openPreview(event, type, false);
      }
    }, 450);
  };

  const handleBulkTaskComplete = async () => {
    await Promise.all(
      selectedTaskIds.map((taskId) => updateTask(taskId, { status: "completed" })),
    );
    clearSelection("tasks");
  };

  const handleBulkTaskDelete = async () => {
    if (!confirm(`למחוק ${selectedTaskIds.length} משימות?`)) return;
    await Promise.all(selectedTaskIds.map((taskId) => deleteTask(taskId)));
    clearSelection("tasks");
  };

  const handleBulkMeetingComplete = async () => {
    await Promise.all(
      selectedMeetingIds.map((meetingId) =>
        updateMeeting(meetingId, { status: "completed" }),
      ),
    );
    clearSelection("meetings");
  };

  const handleBulkMeetingDelete = async () => {
    if (!confirm(`למחוק ${selectedMeetingIds.length} פגישות?`)) return;
    await Promise.all(selectedMeetingIds.map((meetingId) => deleteMeeting(meetingId)));
    clearSelection("meetings");
  };

  const handleBulkReminderDismiss = async () => {
    await Promise.all(
      selectedReminderIds.map((reminderId) => dismissReminder(reminderId)),
    );
    clearSelection("reminders");
  };

  const handleBulkReminderDelete = async () => {
    if (!confirm(`למחוק ${selectedReminderIds.length} תזכורות?`)) return;
    await Promise.all(
      selectedReminderIds.map((reminderId) => deleteReminder(reminderId)),
    );
    clearSelection("reminders");
  };

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isPreviewPinned) {
          setPreviewEvent(null);
          setIsPreviewPinned(false);
          clearPreviewTimers();
          return;
        }
        setSelectionMode({ tasks: false, meetings: false, reminders: false });
        setSelectedTaskIds([]);
        setSelectedMeetingIds([]);
        setSelectedReminderIds([]);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isPreviewPinned]);

  useEffect(() => {
    return () => {
      clearPreviewTimers();
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Handlers
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    setPendingDelete({ type: "task", id });
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTask(task.id, { status: newStatus });
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setMeetingDialogOpen(true);
  };

  const handleDeleteMeeting = async (id: string) => {
    setPendingDelete({ type: "meeting", id });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    if (pendingDelete.type === "task") {
      await deleteTask(pendingDelete.id);
      setSelectedTaskIds((prev) => prev.filter((id) => id !== pendingDelete.id));
    } else if (pendingDelete.type === "meeting") {
      await deleteMeeting(pendingDelete.id);
      setSelectedMeetingIds((prev) => prev.filter((id) => id !== pendingDelete.id));
    } else {
      await deleteReminder(pendingDelete.id);
      setSelectedReminderIds((prev) => prev.filter((id) => id !== pendingDelete.id));
    }

    setPendingDelete(null);
  };

  const handleCreateTask = async (task: TaskInsert) => {
    if (editingTask) {
      await updateTask(editingTask.id, task);
      return { ...editingTask, ...task } as Task;
    } else {
      const createdTask = await createTask(task);
      // Make the task the user just created immediately discoverable in both
      // the compact "all" column and the full tasks tab. The compact column
      // only renders 20 rows, so a due-date sort can otherwise hide a
      // successfully-created task outside the visible window.
      setColumnSortConfig((prev) => ({
        ...prev,
        tasks: { field: "created", order: "desc" },
      }));
      setSortBy("created_at");
      setSortOrder("desc");
      setStatusFilter("all");
      setPriorityFilter("all");
      setSearchQuery("");
      setTaskDialogOpen(false);
      setEditingTask(null);
      return createdTask;
    }
    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleCreateMeeting = async (meeting: MeetingInsert) => {
    let meetingId: string | undefined;

    if (editingMeeting) {
      await updateMeeting(editingMeeting.id, meeting);
      meetingId = editingMeeting.id;
    } else {
      const created = await createMeeting(meeting);
      meetingId = created.id;
    }

    setMeetingDialogOpen(false);
    setEditingMeeting(null);
    return { id: meetingId };
  };

  if (!authLoading && !user) return null;

  return (
    <AppLayout title="משימות, פגישות ותזכורות">
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                משימות, פגישות ותזכורות
              </h1>
              <p className="text-muted-foreground text-sm">
                ניהול משימות, פגישות ותזכורות במקום אחד
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DedupToggleButton />
            <Button className="gap-2" onClick={() => setTaskDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              משימה חדשה
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setMeetingDialogOpen(true)}
            >
              <Calendar className="h-4 w-4" />
              פגישה חדשה
            </Button>
            <AddReminderDialog
              trigger={
                <Button variant="outline" className="gap-2">
                  <Bell className="h-4 w-4" />
                  תזכורת חדשה
                </Button>
              }
            />

            <QuickAddTask
              open={taskDialogOpen}
              onOpenChange={(open) => {
                setTaskDialogOpen(open);
                if (!open) setEditingTask(null);
              }}
              onSubmit={handleCreateTask}
              clients={clients}
            />
            <QuickAddMeeting
              open={meetingDialogOpen}
              onOpenChange={(open) => {
                setMeetingDialogOpen(open);
                if (!open) setEditingMeeting(null);
              }}
              onSubmit={handleCreateMeeting}
              editingMeeting={editingMeeting}
              clients={clients}
              initialData={
                editingMeeting
                  ? {
                      title: editingMeeting.title,
                      description: editingMeeting.description || "",
                      clientId: editingMeeting.client_id || undefined,
                      date: new Date(editingMeeting.start_time),
                      startTime: format(
                        new Date(editingMeeting.start_time),
                        "HH:mm",
                      ),
                      endTime: format(new Date(editingMeeting.end_time), "HH:mm"),
                      location: editingMeeting.location || "",
                      meetingType: editingMeeting.meeting_type || "in_person",
                    }
                  : undefined
              }
            />
          </div>
        </div>

        {/* Stats */}
        <TasksStatsHeader tasks={filteredTasks} meetings={filteredMeetings} />

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
          dir="rtl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="w-fit mr-auto">
              <TabsTrigger value="all" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                הכול
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                משימות ({filteredTasks.length})
              </TabsTrigger>
              <TabsTrigger value="meetings" className="gap-2">
                <Calendar className="h-4 w-4" />
                פגישות ({filteredMeetings.length})
              </TabsTrigger>
              <TabsTrigger value="reminders" className="gap-2">
                <Bell className="h-4 w-4" />
                תזכורות
              </TabsTrigger>
            </TabsList>

            {activeTab === "tasks" && (
              <TasksViewToggle view={taskView} onViewChange={setTaskView} />
            )}
            {isAdmin && (
              <UserFilterMenu align="end" showLabel />
            )}
          </div>

          {/* Filters - hide on "all" tab */}
          {activeTab !== "all" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>

              {activeTab === "tasks" && (
                <>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 ml-2" />
                      <SelectValue placeholder="סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="pending">ממתין</SelectItem>
                      <SelectItem value="in_progress">בביצוע</SelectItem>
                      <SelectItem value="completed">הושלם</SelectItem>
                      <SelectItem value="overdue">באיחור</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="עדיפות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="high">גבוהה</SelectItem>
                      <SelectItem value="medium">בינונית</SelectItem>
                      <SelectItem value="low">נמוכה</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {activeTab !== "reminders" && (
                <>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as SortField)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <ArrowUpDown className="h-4 w-4 ml-2" />
                      <SelectValue placeholder="מיון" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">תאריך יצירה</SelectItem>
                      <SelectItem value="event_date">
                        {activeTab === "tasks" ? "תאריך יעד" : "מועד פגישה"}
                      </SelectItem>
                      <SelectItem value="title">שם</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
                    title={sortOrder === "asc" ? "סדר עולה (א → ת)" : "סדר יורד (ת → א)"}
                  >
                    {sortOrder === "asc" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ALL Content - 3 columns */}
          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              {/* Tasks Column */}
              <div className="rounded-xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-3 py-3 bg-gradient-to-l from-primary/10 to-primary/5 border-b">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">משימות</h3>
                    <button
                      type="button"
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                        showTinyTaskNumbers
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/15 text-primary hover:bg-primary/25"
                      }`}
                      title={
                        showTinyTaskNumbers
                          ? "הסתר מספרים ליד המשימות"
                          : "הצג מספר קטן ליד כל משימה"
                      }
                      onClick={() => setShowTinyTaskNumbers((prev) => !prev)}
                    >
                      {filteredTasks.length}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Select
                      value={columnSortConfig.tasks.field}
                      onValueChange={(value) =>
                        setColumnSortConfig((prev) => ({
                          ...prev,
                          tasks: { ...prev.tasks, field: value as ColumnSortField },
                        }))
                      }
                    >
                      <SelectTrigger className="h-6 w-[72px] text-[10px] px-1.5">
                        <div className="flex items-center gap-0.5">
                          <Filter className="h-2.5 w-2.5" />
                          <span>{getSortFieldLabel(columnSortConfig.tasks.field)}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">זמן</SelectItem>
                        <SelectItem value="name">שם</SelectItem>
                        <SelectItem value="user">משתמש</SelectItem>
                        <SelectItem value="priority">עדיפות</SelectItem>
                        <SelectItem value="created">יצירה</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="כיוון מיון"
                      onClick={() =>
                        setColumnSortConfig((prev) => ({
                          ...prev,
                          tasks: {
                            ...prev.tasks,
                            order: prev.tasks.order === "asc" ? "desc" : "asc",
                          },
                        }))
                      }
                    >
                      {columnSortConfig.tasks.order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={columnHoverPreviewEnabled.tasks ? "ghost" : "outline"}
                      className="h-7 w-7 p-0"
                      title={columnHoverPreviewEnabled.tasks ? "כבה הובר בעמודה" : "הפעל הובר בעמודה"}
                      onClick={() =>
                        setColumnHoverPreviewEnabled((prev) => ({
                          ...prev,
                          tasks: !prev.tasks,
                        }))
                      }
                    >
                      {columnHoverPreviewEnabled.tasks ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    {selectedTaskIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="בחר הכל"
                      onClick={() => selectAllInColumn("tasks")}
                    >
                      <CheckSquare2 className="h-3.5 w-3.5" />
                    </Button>
                    )}
                    <button
                      type="button"
                      className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/80 hover:scale-110 transition-all duration-150"
                      title="הוסף משימה"
                      onClick={() => setTaskDialogOpen(true)}
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>

                {selectionMode.tasks && (
                  <div className="px-3 py-2 border-b bg-primary/5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 font-medium text-primary">
                      <CheckCheck className="h-3.5 w-3.5" />
                      {selectedTaskIds.length} נבחרו
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => selectAllInColumn("tasks")}>בחר הכל</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkTaskComplete} disabled={selectedTaskIds.length === 0}>השלם</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkTaskDelete} disabled={selectedTaskIds.length === 0}>מחק</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => clearSelection("tasks")}>בטל בחירה</Button>
                    </div>
                  </div>
                )}

                <div className="max-h-[500px] overflow-y-auto overflow-x-hidden p-2 space-y-1.5">
                  {tasksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : sortedTasks.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">אין משימות</p>
                  ) : (
                    sortedTasksForAllColumn.tasks.slice(0, 20).map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group text-right"
                        onMouseLeave={() => {
                          setHoveredTaskId(null);
                          queuePreviewClose();
                        }}
                        onMouseEnter={(event) => {
                          setHoveredTaskId(task.id);
                          if (!selectionMode.tasks && columnHoverPreviewEnabled.tasks) {
                            const anchorPoint = getPreviewAnchorFromElement(
                              event.currentTarget as HTMLElement,
                            );
                            queuePreviewOpen(task, "task", anchorPoint);
                          }
                        }}
                        onTouchStart={() =>
                          handleTouchPreview("tasks", task.id, task, "task")
                        }
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onClick={() => {
                          if (selectionMode.tasks) {
                            toggleTaskSelection(task.id);
                          }
                        }}
                      >
                        {showTinyTaskNumbers && (
                          <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] leading-[18px] text-center font-medium">
                            {index + 1}
                          </span>
                        )}
                        <button
                          className={`shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                            task.status === "completed"
                              ? "bg-green-500 border-green-500 text-white opacity-100"
                              : "border-muted-foreground/40 hover:border-primary opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.tasks) {
                              handleToggleComplete(task);
                            }
                          }}
                        >
                          {task.status === "completed" && <span className="text-[10px]">✓</span>}
                        </button>
                        <div
                          className="flex-1 min-w-0 text-right cursor-pointer"
                          onClick={() => {
                            if (selectionMode.tasks) {
                              toggleTaskSelection(task.id);
                              return;
                            }
                            handleEditTask(task);
                          }}
                        >
                          <p className={`text-xs font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          {hoveredTaskId === task.id && task.created_at && (() => {
                            const days = (Date.now() - new Date(task.created_at).getTime()) / 86400000;
                            const color = days < 7 ? "text-green-600" : days < 14 ? "text-amber-500" : "text-red-500";
                            return (
                              <p className="text-[10px] mt-0.5 flex items-center gap-1.5">
                                <span className={color}>{new Date(task.created_at).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })}</span>
                                {task.status === "completed" && task.completed_at && (
                                  <span className="text-green-600">{new Date(task.completed_at).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })}</span>
                                )}
                              </p>
                            );
                          })()}
                          {task.due_date && (
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(task.due_date).toLocaleDateString("he-IL")}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
                            selectedTaskIds.includes(task.id)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/40"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleTaskSelection(task.id);
                          }}
                          onDoubleClick={(event) => {
                            event.stopPropagation();
                            clearSelection("tasks");
                          }}
                          title="דאבל-קליק לביטול בחירה"
                        >
                          {selectedTaskIds.includes(task.id) && (
                            <span className="text-[10px]">✓</span>
                          )}
                        </button>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.tasks) handleEditTask(task);
                          }}
                          title="עריכה"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.tasks) handleDeleteTask(task.id);
                          }}
                          title="מחיקה"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.tasks) {
                              const row = event.currentTarget.closest(".group") as HTMLElement | null;
                              const anchorPoint = getPreviewAnchorFromElement(row);
                              openPreview(task, "task", true, anchorPoint);
                            }
                          }}
                          title="תצוגה מקדימה"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <span className={`shrink-0 h-2 w-2 rounded-full ${
                          task.priority === "high" ? "bg-red-500" :
                          task.priority === "medium" ? "bg-yellow-500" : "bg-green-400"
                        }`} />
                      </div>
                    ))
                  )}
                </div>
                {filteredTasks.length > 20 && (
                  <div className="border-t px-3 py-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("tasks")}>
                      הצג את כל {filteredTasks.length} המשימות
                    </Button>
                  </div>
                )}
              </div>

              {/* Meetings Column */}
              <div className="rounded-xl border-2 border-blue-500/20 bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-3 py-3 bg-gradient-to-l from-blue-500/10 to-blue-500/5 border-b">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <h3 className="font-bold text-sm text-foreground">פגישות</h3>
                    <button
                      type="button"
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                        showTinyMeetingNumbers
                          ? "bg-blue-500 text-white"
                          : "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25"
                      }`}
                      title={showTinyMeetingNumbers ? "הסתר מספרים" : "הצג מספר קטן ליד כל פגישה"}
                      onClick={() => setShowTinyMeetingNumbers((prev) => !prev)}
                    >
                      {filteredMeetings.length}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Select
                      value={columnSortConfig.meetings.field}
                      onValueChange={(value) =>
                        setColumnSortConfig((prev) => ({
                          ...prev,
                          meetings: { ...prev.meetings, field: value as ColumnSortField },
                        }))
                      }
                    >
                      <SelectTrigger className="h-6 w-[72px] text-[10px] px-1.5">
                        <div className="flex items-center gap-0.5">
                          <Filter className="h-2.5 w-2.5" />
                          <span>{getSortFieldLabel(columnSortConfig.meetings.field)}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">זמן</SelectItem>
                        <SelectItem value="name">שם</SelectItem>
                        <SelectItem value="user">משתמש</SelectItem>
                        <SelectItem value="priority" disabled>עדיפות</SelectItem>
                        <SelectItem value="created">יצירה</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="כיוון מיון"
                      onClick={() =>
                        setColumnSortConfig((prev) => ({
                          ...prev,
                          meetings: {
                            ...prev.meetings,
                            order: prev.meetings.order === "asc" ? "desc" : "asc",
                          },
                        }))
                      }
                    >
                      {columnSortConfig.meetings.order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={columnHoverPreviewEnabled.meetings ? "ghost" : "outline"}
                      className="h-7 w-7 p-0"
                      title={columnHoverPreviewEnabled.meetings ? "כבה הובר בעמודה" : "הפעל הובר בעמודה"}
                      onClick={() =>
                        setColumnHoverPreviewEnabled((prev) => ({
                          ...prev,
                          meetings: !prev.meetings,
                        }))
                      }
                    >
                      {columnHoverPreviewEnabled.meetings ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    {selectedMeetingIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="בחר הכל"
                      onClick={() => selectAllInColumn("meetings")}
                    >
                      <CheckSquare2 className="h-3.5 w-3.5" />
                    </Button>
                    )}
                    <button
                      type="button"
                      className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md hover:bg-blue-400 hover:scale-110 transition-all duration-150"
                      title="הוסף פגישה"
                      onClick={() => setMeetingDialogOpen(true)}
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>

                {selectionMode.meetings && (
                  <div className="px-3 py-2 border-b bg-blue-500/5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 font-medium text-blue-600">
                      <CheckCheck className="h-3.5 w-3.5" />
                      {selectedMeetingIds.length} נבחרו
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => selectAllInColumn("meetings")}>בחר הכל</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkMeetingComplete} disabled={selectedMeetingIds.length === 0}>סמן כהושלם</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkMeetingDelete} disabled={selectedMeetingIds.length === 0}>מחק</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => clearSelection("meetings")}>בטל בחירה</Button>
                    </div>
                  </div>
                )}

                <div className="max-h-[500px] overflow-y-auto overflow-x-hidden p-2 space-y-1.5">
                  {meetingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : sortedMeetings.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">אין פגישות</p>
                  ) : (
                    sortedTasksForAllColumn.meetings.slice(0, 20).map((meeting, index) => (
                      <div
                        key={meeting.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group text-right"
                        onMouseEnter={(event) => {
                          setHoveredMeetingId(meeting.id);
                          if (!selectionMode.meetings && columnHoverPreviewEnabled.meetings) {
                            const anchorPoint = getPreviewAnchorFromElement(
                              event.currentTarget as HTMLElement,
                            );
                            queuePreviewOpen(meeting, "meeting", anchorPoint);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredMeetingId(null);
                          queuePreviewClose();
                        }}
                        onTouchStart={() =>
                          handleTouchPreview("meetings", meeting.id, meeting, "meeting")
                        }
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onClick={() => {
                          if (selectionMode.meetings) {
                            toggleMeetingSelection(meeting.id);
                          }
                        }}
                      >
                        <button
                          type="button"
                          className={`shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
                            selectedMeetingIds.includes(meeting.id)
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-muted-foreground/40"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleMeetingSelection(meeting.id);
                          }}
                          onDoubleClick={(event) => {
                            event.stopPropagation();
                            clearSelection("meetings");
                          }}
                          title="דאבל-קליק לביטול בחירה"
                        >
                          {selectedMeetingIds.includes(meeting.id) && (
                            <span className="text-[10px]">✓</span>
                          )}
                        </button>
                        {showTinyMeetingNumbers && (
                          <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-600 text-[10px] leading-[18px] text-center font-medium">
                            {index + 1}
                          </span>
                        )}
                        <div
                          className="flex-1 min-w-0 text-right cursor-pointer"
                          onClick={() => {
                            if (selectionMode.meetings) {
                              toggleMeetingSelection(meeting.id);
                              return;
                            }
                            handleEditMeeting(meeting);
                          }}
                        >
                          <p className="text-xs font-medium truncate">{meeting.title}</p>
                          {hoveredMeetingId === meeting.id && meeting.created_at && (() => {
                            const days = (Date.now() - new Date(meeting.created_at).getTime()) / 86400000;
                            const color = days < 7 ? "text-green-600" : days < 14 ? "text-amber-500" : "text-red-500";
                            return (
                              <p className={`text-[10px] ${color} mt-0.5`}>
                                {new Date(meeting.created_at).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                              </p>
                            );
                          })()}
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(meeting.start_time).toLocaleDateString("he-IL")} · {new Date(meeting.start_time).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </p>
                        </div>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.meetings) handleEditMeeting(meeting);
                          }}
                          title="עריכה"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.meetings) handleDeleteMeeting(meeting.id);
                          }}
                          title="מחיקה"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.meetings) {
                              const row = event.currentTarget.closest(".group") as HTMLElement | null;
                              const anchorPoint = getPreviewAnchorFromElement(row);
                              openPreview(meeting, "meeting", true, anchorPoint);
                            }
                          }}
                          title="תצוגה מקדימה"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {filteredMeetings.length > 20 && (
                  <div className="border-t px-3 py-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("meetings")}>
                      הצג את כל {filteredMeetings.length} הפגישות
                    </Button>
                  </div>
                )}
              </div>

              {/* Reminders Column - simple list like the others */}
              <div className="rounded-xl border-2 border-amber-500/20 bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-3 py-3 bg-gradient-to-l from-amber-500/10 to-amber-500/5 border-b">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <h3 className="font-bold text-sm text-foreground">תזכורות</h3>
                    <button
                      type="button"
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                        showTinyReminderNumbers
                          ? "bg-amber-500 text-white"
                          : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25"
                      }`}
                      title={showTinyReminderNumbers ? "הסתר מספרים" : "הצג מספר קטן ליד כל תזכורת"}
                      onClick={() => setShowTinyReminderNumbers((prev) => !prev)}
                    >
                      {scopedReminders.length}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Select
                      value={columnSortConfig.reminders.field}
                      onValueChange={(value) =>
                        setColumnSortConfig((prev) => ({
                          ...prev,
                          reminders: { ...prev.reminders, field: value as ColumnSortField },
                        }))
                      }
                    >
                      <SelectTrigger className="h-6 w-[72px] text-[10px] px-1.5">
                        <div className="flex items-center gap-0.5">
                          <Filter className="h-2.5 w-2.5" />
                          <span>{getSortFieldLabel(columnSortConfig.reminders.field)}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">זמן</SelectItem>
                        <SelectItem value="name">שם</SelectItem>
                        <SelectItem value="user">משתמש</SelectItem>
                        <SelectItem value="priority">עדיפות</SelectItem>
                        <SelectItem value="created">יצירה</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="כיוון מיון"
                      onClick={() =>
                        setColumnSortConfig((prev) => ({
                          ...prev,
                          reminders: {
                            ...prev.reminders,
                            order: prev.reminders.order === "asc" ? "desc" : "asc",
                          },
                        }))
                      }
                    >
                      {columnSortConfig.reminders.order === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={columnHoverPreviewEnabled.reminders ? "ghost" : "outline"}
                      className="h-7 w-7 p-0"
                      title={columnHoverPreviewEnabled.reminders ? "כבה הובר בעמודה" : "הפעל הובר בעמודה"}
                      onClick={() =>
                        setColumnHoverPreviewEnabled((prev) => ({
                          ...prev,
                          reminders: !prev.reminders,
                        }))
                      }
                    >
                      {columnHoverPreviewEnabled.reminders ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    {selectedReminderIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="בחר הכל"
                      onClick={() => selectAllInColumn("reminders")}
                    >
                      <CheckSquare2 className="h-3.5 w-3.5" />
                    </Button>
                    )}
                    <AddReminderDialog
                      trigger={
                        <button
                          type="button"
                          className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md hover:bg-amber-400 hover:scale-110 transition-all duration-150"
                          title="הוסף תזכורת"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      }
                    />
                  </div>
                </div>

                {selectionMode.reminders && (
                  <div className="px-3 py-2 border-b bg-amber-500/5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 font-medium text-amber-700">
                      <CheckCheck className="h-3.5 w-3.5" />
                      {selectedReminderIds.length} נבחרו
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => selectAllInColumn("reminders")}>בחר הכל</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkReminderDismiss} disabled={selectedReminderIds.length === 0}>סמן כטופל</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkReminderDelete} disabled={selectedReminderIds.length === 0}>מחק</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => clearSelection("reminders")}>בטל בחירה</Button>
                    </div>
                  </div>
                )}

                <div className="max-h-[500px] overflow-y-auto overflow-x-hidden p-2 space-y-1.5">
                  {remindersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                    </div>
                  ) : scopedReminders.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">אין תזכורות</p>
                  ) : (
                    sortedTasksForAllColumn.reminders.slice(0, 20).map((reminder, index) => (
                      <div
                        key={reminder.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group text-right"
                        onMouseEnter={(event) => {
                          setHoveredReminderId(reminder.id);
                          if (!selectionMode.reminders && columnHoverPreviewEnabled.reminders) {
                            const anchorPoint = getPreviewAnchorFromElement(
                              event.currentTarget as HTMLElement,
                            );
                            queuePreviewOpen(reminder, "reminder", anchorPoint);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredReminderId(null);
                          queuePreviewClose();
                        }}
                        onTouchStart={() =>
                          handleTouchPreview("reminders", reminder.id, reminder, "reminder")
                        }
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onClick={() => {
                          if (selectionMode.reminders) {
                            toggleReminderSelection(reminder.id);
                          }
                        }}
                      >
                        <button
                          type="button"
                          className={`shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
                            selectedReminderIds.includes(reminder.id)
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "border-muted-foreground/40"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleReminderSelection(reminder.id);
                          }}
                          onDoubleClick={(event) => {
                            event.stopPropagation();
                            clearSelection("reminders");
                          }}
                          title="דאבל-קליק לביטול בחירה"
                        >
                          {selectedReminderIds.includes(reminder.id) && (
                            <span className="text-[10px]">✓</span>
                          )}
                        </button>
                        {showTinyReminderNumbers && (
                          <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-600 text-[10px] leading-[18px] text-center font-medium">
                            {index + 1}
                          </span>
                        )}
                        <div
                          className="flex-1 min-w-0 text-right cursor-pointer"
                          onClick={() => {
                            if (selectionMode.reminders) {
                              toggleReminderSelection(reminder.id);
                              return;
                            }
                            setActiveTab("reminders");
                          }}
                        >
                          <p className={`text-xs font-medium truncate ${reminder.is_dismissed ? "line-through text-muted-foreground" : ""}`}>
                            {reminder.title}
                          </p>
                          {hoveredReminderId === reminder.id && reminder.created_at && (() => {
                            const days = (Date.now() - new Date(reminder.created_at).getTime()) / 86400000;
                            const color = days < 7 ? "text-green-600" : days < 14 ? "text-amber-500" : "text-red-500";
                            return (
                              <p className={`text-[10px] ${color} mt-0.5`}>
                                {new Date(reminder.created_at).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                              </p>
                            );
                          })()}
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(reminder.remind_at), "dd/MM/yyyy · HH:mm:ss", { locale: he })}
                          </p>
                        </div>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.reminders) {
                              setEditingReminder(reminder);
                              setReminderEditOpen(true);
                            }
                          }}
                          title="עריכה"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.reminders) {
                              setPendingDelete({ type: "reminder", id: reminder.id });
                            }
                          }}
                          title="מחיקה"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectionMode.reminders) {
                              const row = event.currentTarget.closest(".group") as HTMLElement | null;
                              const anchorPoint = getPreviewAnchorFromElement(row);
                              openPreview(reminder, "reminder", true, anchorPoint);
                            }
                          }}
                          title="תצוגה מקדימה"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <span className={`shrink-0 h-2 w-2 rounded-full ${
                          reminder.is_dismissed ? "bg-muted-foreground" :
                          reminder.is_sent ? "bg-green-500" :
                          isDatePast(new Date(reminder.remind_at)) ? "bg-red-500" : "bg-amber-500"
                        }`} />
                      </div>
                    ))
                  )}
                </div>
                {scopedReminders.length > 20 && (
                  <div className="border-t px-3 py-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("reminders")}>
                      הצג את כל {scopedReminders.length} התזכורות
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tasks Content */}
          <TabsContent value="tasks" className="mt-4">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {taskView === "list" && (
                  <TasksListView
                    tasks={sortedTasks}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                  />
                )}
                {taskView === "grid" && (
                  <TasksGridView
                    tasks={sortedTasks}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                  />
                )}
                {taskView === "kanban" && (
                  <TasksKanbanView
                    tasks={sortedTasks}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                  />
                )}
                {taskView === "calendar" && (
                  <TasksCalendarView
                    tasks={sortedTasks}
                    meetings={sortedMeetings}
                    onTaskClick={handleEditTask}
                    onMeetingClick={handleEditMeeting}
                  />
                )}
                {taskView === "timeline" && (
                  <TasksTimelineView
                    tasks={sortedTasks}
                    meetings={sortedMeetings}
                    onTaskEdit={handleEditTask}
                    onTaskDelete={handleDeleteTask}
                    onMeetingEdit={handleEditMeeting}
                    onMeetingDelete={handleDeleteMeeting}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Meetings Content */}
          <TabsContent value="meetings" className="mt-4">
            {meetingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <MeetingsListView
                meetings={sortedMeetings}
                onEdit={handleEditMeeting}
                onDelete={handleDeleteMeeting}
                sortOrder={sortOrder}
              />
            )}
          </TabsContent>

          {/* Reminders Content */}
          <TabsContent value="reminders" className="mt-4">
            <RemindersTabContent />
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <EventPreviewDialog
          open={!!previewEvent}
          anchorPoint={previewAnchorPoint}
          pinned={isPreviewPinned}
          onPinToggle={() => {
            if (!previewEvent) return;
            setIsPreviewPinned((prev) => !prev);
          }}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewEvent(null);
              setPreviewAnchorPoint(null);
              setIsPreviewPinned(false);
              clearPreviewTimers();
            }
          }}
          event={previewEvent}
          type={previewType}
          hoverOpenDelayMs={hoverDialogSettings.openDelayMs}
          hoverCloseDelayMs={hoverDialogSettings.closeDelayMs}
          onHoverDelaysChange={(nextOpenDelayMs, nextCloseDelayMs) => {
            setHoverDialogSettings({
              openDelayMs: Math.min(1000, Math.max(0, nextOpenDelayMs)),
              closeDelayMs: Math.min(1000, Math.max(0, nextCloseDelayMs)),
            });
          }}
          onPointerEnter={clearPreviewTimers}
          onPointerLeave={queuePreviewClose}
          onEdit={() => {
            if (previewType === "task") handleEditTask(previewEvent);
            else if (previewType === "meeting") handleEditMeeting(previewEvent);
            else {
              setEditingReminder(previewEvent);
              setReminderEditOpen(true);
            }
          }}
        />

        {/* Reminder Edit Dialog */}
        <AddReminderDialog
          editingReminder={editingReminder}
          open={reminderEditOpen}
          onOpenChange={(o) => {
            setReminderEditOpen(o);
            if (!o) setEditingReminder(null);
          }}
        />

        <AlertDialog
          open={!!pendingDelete}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null);
          }}
        >
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingDelete?.type === "task"
                  ? "מחיקת משימה"
                  : pendingDelete?.type === "meeting"
                    ? "מחיקת פגישה"
                    : "מחיקת תזכורת"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                האם אתה בטוח שברצונך למחוק? לא ניתן לבטל פעולה זו.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default TasksAndMeetings;
