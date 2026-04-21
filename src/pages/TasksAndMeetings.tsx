import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { sortItems, SortField, SortOrder } from "@/utils/sortAndDedup";
import { useReminders, Reminder } from "@/hooks/useReminders";
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
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { parseISO } from "date-fns";

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
  const { reminders, loading: remindersLoading } = useReminders();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "all",
  );
  const [taskView, setTaskView] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortField>("event_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Preview dialog
  const [previewEvent, setPreviewEvent] = useState<any>(null);
  const [previewType, setPreviewType] = useState<"task" | "meeting" | "reminder">("task");

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

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
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
    return (
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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

  // Handlers
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm("האם למחוק את המשימה?")) {
      await deleteTask(id);
    }
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
    if (confirm("האם למחוק את הפגישה?")) {
      await deleteMeeting(id);
    }
  };

  const handleCreateTask = async (task: TaskInsert) => {
    if (editingTask) {
      await updateTask(editingTask.id, task);
    } else {
      await createTask(task);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

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
        <TasksStatsHeader tasks={tasks} meetings={meetings} />

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
                משימות ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="meetings" className="gap-2">
                <Calendar className="h-4 w-4" />
                פגישות ({meetings.length})
              </TabsTrigger>
              <TabsTrigger value="reminders" className="gap-2">
                <Bell className="h-4 w-4" />
                תזכורות
              </TabsTrigger>
            </TabsList>

            {activeTab === "tasks" && (
              <TasksViewToggle view={taskView} onViewChange={setTaskView} />
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Tasks Column */}
              <div className="rounded-xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-primary/10 to-primary/5 border-b">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">משימות</h3>
                    <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">{tasks.length}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setTaskDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="max-h-[500px] overflow-y-auto overflow-x-hidden p-2 space-y-1.5">
                  {tasksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : sortedTasks.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">אין משימות</p>
                  ) : (
                    sortedTasks.slice(0, 20).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group text-right"
                      >
                        <button
                          className={`shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                            task.status === "completed"
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-muted-foreground/40 hover:border-primary"
                          }`}
                          onClick={() => handleToggleComplete(task)}
                        >
                          {task.status === "completed" && <span className="text-[10px]">✓</span>}
                        </button>
                        <div className="flex-1 min-w-0 text-right cursor-pointer" onClick={() => handleEditTask(task)}>
                          <p className={`text-xs font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          {task.due_date && (
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(task.due_date).toLocaleDateString("he-IL")}
                            </p>
                          )}
                        </div>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => { setPreviewEvent(task); setPreviewType("task"); }}
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
                {tasks.length > 20 && (
                  <div className="border-t px-3 py-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("tasks")}>
                      הצג את כל {tasks.length} המשימות
                    </Button>
                  </div>
                )}
              </div>

              {/* Meetings Column */}
              <div className="rounded-xl border-2 border-blue-500/20 bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-blue-500/10 to-blue-500/5 border-b">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <h3 className="font-bold text-sm text-foreground">פגישות</h3>
                    <span className="text-xs bg-blue-500/15 text-blue-600 px-2 py-0.5 rounded-full font-medium">{meetings.length}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setMeetingDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="max-h-[500px] overflow-y-auto overflow-x-hidden p-2 space-y-1.5">
                  {meetingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : sortedMeetings.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">אין פגישות</p>
                  ) : (
                    sortedMeetings.slice(0, 20).map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group text-right"
                      >
                        <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <div className="flex-1 min-w-0 text-right cursor-pointer" onClick={() => handleEditMeeting(meeting)}>
                          <p className="text-xs font-medium truncate">{meeting.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(meeting.start_time).toLocaleDateString("he-IL")} · {new Date(meeting.start_time).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => { setPreviewEvent(meeting); setPreviewType("meeting"); }}
                          title="תצוגה מקדימה"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {meetings.length > 20 && (
                  <div className="border-t px-3 py-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("meetings")}>
                      הצג את כל {meetings.length} הפגישות
                    </Button>
                  </div>
                )}
              </div>

              {/* Reminders Column - simple list like the others */}
              <div className="rounded-xl border-2 border-amber-500/20 bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-amber-500/10 to-amber-500/5 border-b">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <h3 className="font-bold text-sm text-foreground">תזכורות</h3>
                    <span className="text-xs bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full font-medium">{reminders.length}</span>
                  </div>
                  <AddReminderDialog
                    trigger={
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                </div>
                <div className="max-h-[500px] overflow-y-auto overflow-x-hidden p-2 space-y-1.5">
                  {remindersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                    </div>
                  ) : reminders.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">אין תזכורות</p>
                  ) : (
                    reminders.slice(0, 20).map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group text-right"
                      >
                        <Bell className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0 text-right cursor-pointer" onClick={() => setActiveTab("reminders")}>
                          <p className={`text-xs font-medium truncate ${reminder.is_dismissed ? "line-through text-muted-foreground" : ""}`}>
                            {reminder.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(reminder.remind_at), "dd/MM/yyyy · HH:mm", { locale: he })}
                          </p>
                        </div>
                        <button
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => { setPreviewEvent(reminder); setPreviewType("reminder"); }}
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
                {reminders.length > 20 && (
                  <div className="border-t px-3 py-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("reminders")}>
                      הצג את כל {reminders.length} התזכורות
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
          onOpenChange={(open) => { if (!open) setPreviewEvent(null); }}
          event={previewEvent}
          type={previewType}
          onEdit={() => {
            if (previewType === "task") handleEditTask(previewEvent);
            else if (previewType === "meeting") handleEditMeeting(previewEvent);
            else setActiveTab("reminders");
          }}
        />
      </div>
    </AppLayout>
  );
};

export default TasksAndMeetings;
