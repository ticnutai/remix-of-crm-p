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
} from "lucide-react";
import { sortItems, SortField, SortOrder } from "@/utils/sortAndDedup";
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
import { isPast, parseISO } from "date-fns";

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

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "tasks",
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
          isPast(parseISO(task.due_date)) &&
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
    if (editingMeeting) {
      await updateMeeting(editingMeeting.id, meeting);
    } else {
      await createMeeting(meeting);
    }
    setMeetingDialogOpen(false);
    setEditingMeeting(null);
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
              clients={clients}
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
            <TabsList className="w-fit">
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

          {/* Filters */}
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
                  title={sortOrder === "asc" ? "סדר עולה" : "סדר יורד"}
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
              />
            )}
          </TabsContent>

          {/* Reminders Content */}
          <TabsContent value="reminders" className="mt-4">
            <RemindersTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TasksAndMeetings;
