// My Day Page - tenarch CRM Pro
// Shows today's meetings, tasks, reminders and schedule
import React, { useState, useEffect, useCallback, forwardRef } from "react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DisplayOptions,
  HoverItemWrapper,
  ViewType,
} from "@/components/ui/display-options";
import { QuickAddTask } from "@/components/layout/sidebar-tasks/QuickAddTask";
import { QuickAddMeeting } from "@/components/layout/sidebar-tasks/QuickAddMeeting";
import { DedupToggleButton } from "@/components/DedupToggleButton";
import { UserFilterMenu, useUserFilter } from "@/components/shared/UserFilterMenu";
import { useDedup } from "@/contexts/DedupContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CheckSquare,
  Clock,
  Bell,
  Loader2,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Users,
  Video,
  Phone,
  MapPin,
  Briefcase,
  User,
  Sun,
  Sunrise,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
} from "lucide-react";
import {
  addDays,
  format,
  parseISO,
  isBefore,
  isSameDay,
  startOfDay,
  endOfDay,
} from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  created_by?: string | null;
  assigned_to?: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  client?: { name: string } | null;
  project?: { name: string } | null;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  created_by?: string | null;
  assigned_to?: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_type: string;
  status: string;
  client?: { name: string } | null;
  project?: { name: string } | null;
}

interface Reminder {
  id: string;
  title: string;
  message: string | null;
  user_id?: string | null;
  remind_at: string;
  is_dismissed: boolean;
  client?: { name: string } | null;
}

interface TimeEntry {
  id: string;
  user_id?: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  description: string | null;
  project?: { name: string } | null;
  client?: { name: string } | null;
}

const priorityIcons = {
  low: ArrowDown,
  medium: ArrowRight,
  high: ArrowUp,
};

const priorityColors = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-red-600",
};

const meetingTypeIcons = {
  in_person: Users,
  video: Video,
  phone: Phone,
};

const floatingAddButtonClass =
  "absolute left-3 bottom-3 h-7 w-7 rounded-full border border-[hsl(45,80%,45%)] bg-[hsl(45,100%,96%)] text-[hsl(45,80%,38%)] shadow-[0_6px_14px_hsl(45_80%_45%_/_0.24)] hover:bg-[hsl(45,95%,91%)] hover:scale-105 active:scale-95 transition-all duration-200 z-10";

const getTaskStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "ממתין";
    case "in_progress":
      return "בביצוע";
    case "completed":
      return "הושלם";
    default:
      return status;
  }
};

export default function MyDay() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isManager } = useAuth();
  const {
    value: userFilterValue,
    targetId: userFilterTargetId,
    matches: userFilterMatches,
  } = useUserFilter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [meetingsView, setMeetingsView] = useSyncedSetting<ViewType>({ key: "myday-meetings-view", defaultValue: "list" });
  const [tasksView, setTasksView] = useSyncedSetting<ViewType>({ key: "myday-tasks-view", defaultValue: "list" });

  const showUserFilter = isManager;
  const createTargetUserId =
    showUserFilter && userFilterValue !== "all" && userFilterTargetId
      ? userFilterTargetId
      : (user?.id ?? null);

  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);

  // Clients for dropdowns
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (data) setClients(data);
    };
    if (user) fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Delete handlers
  const handleDeleteMeeting = async (id: string) => {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקת הפגישה");
    } else {
      setMeetings(meetings.filter((m) => m.id !== id));
      toast.success("הפגישה נמחקה");
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקת המשימה");
    } else {
      setTasks(tasks.filter((t) => t.id !== id));
      toast.success("המשימה נמחקה");
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקת התזכורת");
    } else {
      setReminders(reminders.filter((r) => r.id !== id));
      toast.success("התזכורת נמחקה");
    }
  };

  // Create handlers
  const handleCreateTask = async (taskData: any) => {
    console.log("🟢 [MyDay] handleCreateTask called");
    console.log(
      "🟢 [MyDay] Raw taskData from form:",
      JSON.stringify(taskData, null, 2),
    );
    console.log("🟢 [MyDay] Current user:", user?.id, user?.email);

    // Build the insert payload — tasks table requires created_by, NOT user_id
    const { user_id, ...cleanData } = taskData; // strip user_id if form sent it
    const insertPayload = {
      ...cleanData,
      created_by: createTargetUserId,
      assigned_to:
        cleanData.assigned_to ??
        (showUserFilter && userFilterValue !== "all" ? userFilterTargetId : null),
    };

    console.log(
      "🟢 [MyDay] Insert payload (after fix):",
      JSON.stringify(insertPayload, null, 2),
    );
    console.log("🟢 [MyDay] Payload keys:", Object.keys(insertPayload));

    const { data, error } = await supabase
      .from("tasks")
      .insert(insertPayload)
      .select();

    console.log("🟢 [MyDay] Supabase response - data:", data);
    console.log("🟢 [MyDay] Supabase response - error:", error);
    if (error) {
      console.error(
        "❌ [MyDay] Task creation FAILED:",
        error.message,
        error.details,
        error.hint,
        error.code,
      );
      toast.error("שגיאה ביצירת המשימה");
    } else {
      console.log("✅ [MyDay] Task created successfully:", data);
      toast.success("המשימה נוצרה בהצלחה");
      fetchDayData();
      setTaskDialogOpen(false);
    }
  };

  const handleCreateMeeting = async (meetingData: any) => {
    console.log("🔵 [MyDay] handleCreateMeeting called");
    console.log(
      "🔵 [MyDay] Raw meetingData from form:",
      JSON.stringify(meetingData, null, 2),
    );
    console.log("🔵 [MyDay] Current user:", user?.id, user?.email);

    // Build the insert payload — meetings table requires created_by, NOT user_id
    const { user_id, ...cleanData } = meetingData; // strip user_id if form sent it
    const insertPayload = {
      ...cleanData,
      created_by: createTargetUserId,
    };

    console.log(
      "🔵 [MyDay] Insert payload (after fix):",
      JSON.stringify(insertPayload, null, 2),
    );
    console.log("🔵 [MyDay] Payload keys:", Object.keys(insertPayload));

    const { data, error } = await supabase
      .from("meetings")
      .insert(insertPayload)
      .select();

    console.log("🔵 [MyDay] Supabase response - data:", data);
    console.log("🔵 [MyDay] Supabase response - error:", error);

    if (error) {
      console.error(
        "❌ [MyDay] Meeting creation FAILED:",
        error.message,
        error.details,
        error.hint,
        error.code,
      );
      toast.error(`שגיאה ביצירת הפגישה: ${error.message}`);
    } else {
      console.log("✅ [MyDay] Meeting created successfully:", data);
      toast.success("הפגישה נוצרה בהצלחה");
      fetchDayData();
      setMeetingDialogOpen(false);
    }
  };

  const handleCreateReminder = async (reminderData: any) => {
    console.log("🟡 [MyDay] handleCreateReminder called");
    console.log(
      "🟡 [MyDay] Raw reminderData from form:",
      JSON.stringify(reminderData, null, 2),
    );
    console.log("🟡 [MyDay] Current user:", user?.id, user?.email);

    // Sanitize payload — reminders table uses 'message' NOT 'description'
    const { user_id, description, ...cleanData } = reminderData;
    // Convert remind_at to proper ISO (form sends local time like "2026-02-10T23:50")
    let remindAt = cleanData.remind_at;
    if (remindAt && !remindAt.endsWith("Z") && !remindAt.includes("+")) {
      remindAt = new Date(remindAt).toISOString();
    }
    const insertPayload = {
      ...cleanData,
      remind_at: remindAt,
      message: description || cleanData.message || null,
      user_id: createTargetUserId,
    };

    console.log(
      "🟡 [MyDay] Reminder insert payload:",
      JSON.stringify(insertPayload, null, 2),
    );
    console.log("🟡 [MyDay] Payload keys:", Object.keys(insertPayload));

    const { data, error } = await supabase
      .from("reminders")
      .insert(insertPayload)
      .select();

    console.log("🟡 [MyDay] Reminder response - data:", data);
    console.log("🟡 [MyDay] Reminder response - error:", error);
    if (error) {
      console.error(
        "❌ [MyDay] Reminder creation FAILED:",
        error.message,
        error.details,
        error.hint,
        error.code,
      );
      toast.error(`שגיאה ביצירת התזכורת: ${error.message}`);
    } else {
      console.log("✅ [MyDay] Reminder created successfully:", data);
      toast.success("התזכורת נוצרה בהצלחה");
      fetchDayData();
      setReminderDialogOpen(false);
    }
  };

  const handleCreateTimeEntry = async (timeData: any) => {
    console.log("🟠 [MyDay] handleCreateTimeEntry called");
    console.log(
      "🟠 [MyDay] Raw timeData from form:",
      JSON.stringify(timeData, null, 2),
    );
    console.log("🟠 [MyDay] Current user:", user?.id, user?.email);

    // Sanitize: time_entries requires user_id + start_time
    const { created_by, ...cleanData } = timeData; // strip created_by if form sent it
    // Convert start_time/end_time to proper ISO if they're local time strings
    if (
      cleanData.start_time &&
      !cleanData.start_time.endsWith("Z") &&
      !cleanData.start_time.includes("+")
    ) {
      cleanData.start_time = new Date(cleanData.start_time).toISOString();
    }
    if (
      cleanData.end_time &&
      !cleanData.end_time.endsWith("Z") &&
      !cleanData.end_time.includes("+")
    ) {
      cleanData.end_time = new Date(cleanData.end_time).toISOString();
    }
    const insertPayload = {
      ...cleanData,
      user_id: createTargetUserId,
    };

    console.log(
      "🟠 [MyDay] TimeEntry insert payload:",
      JSON.stringify(insertPayload, null, 2),
    );
    console.log("🟠 [MyDay] Payload keys:", Object.keys(insertPayload));

    const { data, error } = await supabase
      .from("time_entries")
      .insert(insertPayload)
      .select();

    console.log("🟠 [MyDay] TimeEntry response - data:", data);
    console.log("🟠 [MyDay] TimeEntry response - error:", error);
    if (error) {
      console.error(
        "❌ [MyDay] TimeEntry creation FAILED:",
        error.message,
        error.details,
        error.hint,
        error.code,
      );
      toast.error(`שגיאה ברישום הזמן: ${error.message}`);
    } else {
      console.log("✅ [MyDay] TimeEntry created successfully:", data);
      toast.success("הזמן נרשם בהצלחה");
      fetchDayData();
      setTimeDialogOpen(false);
    }
  };

  const fetchDayData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const day = parseISO(selectedDate);
    const dayStart = startOfDay(day).toISOString();
    const dayEnd = endOfDay(day).toISOString();
    const isTodayRange = isSameDay(day, new Date());

    console.log("📊 [MyDay] fetchDayData range:", dayStart, "->", dayEnd);

    let tasksQuery = supabase
      .from("tasks")
      .select(
        "id, title, description, created_by, assigned_to, status, priority, due_date, created_at, client:clients(name), project:projects(name)",
      )
      .neq("status", "completed");

    // On "today" keep overdue open tasks visible. On any other selected date,
    // show only tasks whose due date belongs to that day.
    tasksQuery = isTodayRange
      ? tasksQuery.lte("due_date", dayEnd)
      : tasksQuery.gte("due_date", dayStart).lte("due_date", dayEnd);

    const [tasksRes, meetingsRes, remindersRes, timeRes] = await Promise.all([
      tasksQuery.order("priority", { ascending: false }),

      // Meetings on the selected day (RLS-scoped, then user-filtered client-side)
      supabase
        .from("meetings")
        .select(
          "id, title, description, created_by, assigned_to, start_time, end_time, location, meeting_type, status, client:clients(name), project:projects(name)",
        )
        .gte("start_time", dayStart)
        .lte("start_time", dayEnd)
        .order("start_time", { ascending: true }),

      // Reminders on the selected day (RLS-scoped, then user-filtered client-side)
      supabase
        .from("reminders")
        .select(
          "id, title, message, user_id, remind_at, is_dismissed, client:clients(name)",
        )
        .gte("remind_at", dayStart)
        .lte("remind_at", dayEnd)
        .eq("is_dismissed", false)
        .order("remind_at", { ascending: true }),

      // Time entries on the selected day
      supabase
        .from("time_entries")
        .select(
          "id, user_id, start_time, end_time, duration_minutes, description, project:projects(name), client:clients(name)",
        )
        .gte("start_time", dayStart)
        .lte("start_time", dayEnd)
        .order("start_time", { ascending: true }),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (meetingsRes.data) setMeetings(meetingsRes.data as Meeting[]);
    if (remindersRes.data) {
      console.log(
        "📊 [MyDay] Reminders fetched:",
        remindersRes.data.length,
        remindersRes.data,
      );
      setReminders(remindersRes.data as Reminder[]);
    } else {
      console.warn(
        "⚠️ [MyDay] Reminders query returned no data, error:",
        remindersRes.error,
      );
    }
    if (timeRes.data) setTimeEntries(timeRes.data as TimeEntry[]);

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, user?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchDayData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, navigate, selectedDate]);

  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return `${date.getHours()}:${date.getMinutes()}`;
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "בוקר טוב", icon: Sunrise };
    if (hour < 17) return { text: "צהריים טובים", icon: Sun };
    return { text: "ערב טוב", icon: Sun };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const { showDuplicates } = useDedup();
  const selectedDayDate = parseISO(selectedDate);
  const isViewingToday = isSameDay(selectedDayDate, new Date());
  const selectedDayLabel = format(selectedDayDate, "EEEE, d בMMMM yyyy", {
    locale: he,
  });
  const selectedDayShortLabel = isViewingToday
    ? "היום"
    : format(selectedDayDate, "dd/MM/yyyy");
  const moveSelectedDate = (amount: number) => {
    setSelectedDate(format(addDays(selectedDayDate, amount), "yyyy-MM-dd"));
  };

  const filteredTasks = React.useMemo(() => {
    if (!showUserFilter || !userFilterTargetId) return tasks;
    return tasks.filter((task) => userFilterMatches(task, "tasks"));
  }, [tasks, showUserFilter, userFilterTargetId, userFilterMatches]);

  const filteredMeetings = React.useMemo(() => {
    if (!showUserFilter || !userFilterTargetId) return meetings;
    return meetings.filter((meeting) => userFilterMatches(meeting, "meetings"));
  }, [meetings, showUserFilter, userFilterTargetId, userFilterMatches]);

  const visibleReminders = React.useMemo(() => {
    if (!showUserFilter || !userFilterTargetId) return reminders;
    return reminders.filter((reminder) => userFilterMatches(reminder, "reminders"));
  }, [reminders, showUserFilter, userFilterTargetId, userFilterMatches]);

  const visibleTimeEntries = React.useMemo(() => {
    if (!showUserFilter || !userFilterTargetId) return timeEntries;
    return timeEntries.filter((entry) => entry.user_id === userFilterTargetId);
  }, [timeEntries, showUserFilter, userFilterTargetId]);

  // Client-side dedup for meetings and tasks (extra safety layer)
  const visibleMeetings = React.useMemo(() => {
    if (showDuplicates) return filteredMeetings;
    const seen = new Map<string, (typeof meetings)[0]>();
    filteredMeetings.forEach((m) => {
      const key = `${m.title.trim().toLowerCase()}|${m.start_time?.slice(0, 16) ?? ""}`;
      if (!seen.has(key)) seen.set(key, m);
    });
    return Array.from(seen.values());
  }, [filteredMeetings, showDuplicates]);

  const visibleTasks = React.useMemo(() => {
    if (showDuplicates) return filteredTasks;
    const seen = new Map<string, (typeof tasks)[0]>();
    filteredTasks.forEach((t) => {
      const key = `${t.title.trim().toLowerCase()}|${(t.due_date ?? "").slice(0, 10)}`;
      if (!seen.has(key)) seen.set(key, t);
    });
    return Array.from(seen.values());
  }, [filteredTasks, showDuplicates]);
  const totalTasks = visibleTasks.length;
  const pendingMeetings = visibleMeetings.filter(
    (m) => m.status === "scheduled",
  ).length;
  const totalTimeMinutes = visibleTimeEntries.reduce(
    (sum, e) => sum + (e.duration_minutes || 0),
    0,
  );

  if (!authLoading && !user) return null;

  return (
    <AppLayout title="היום שלי">
      <div className="p-6 md:p-8 space-y-8">
        {/* Greeting Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[hsl(45,80%,50%)] to-[hsl(45,90%,40%)] flex items-center justify-center shadow-lg">
              <GreetingIcon className="h-7 w-7 text-[hsl(220,60%,15%)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {greeting.text}!
              </h1>
              <p className="text-muted-foreground">
                {selectedDayLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" dir="rtl">
            <div className="flex items-center gap-1 rounded-xl border-2 border-[hsl(45,80%,45%)] bg-background p-1 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                title="היום הקודם"
                onClick={() => moveSelectedDate(-1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <label className="relative flex min-w-[170px] cursor-pointer items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm font-semibold text-foreground">
                <CalendarDays className="h-4 w-4 text-[hsl(45,80%,40%)]" />
                <span>{selectedDayShortLabel}</span>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    if (event.target.value) {
                      setSelectedDate(event.target.value);
                    }
                  }}
                  aria-label="בחירת תאריך להצגה"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                title="היום הבא"
                onClick={() => moveSelectedDate(1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {!isViewingToday && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 border-[hsl(45,80%,45%)]"
                  onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
                >
                  חזרה להיום
                </Button>
              )}
            </div>
            {showUserFilter && <UserFilterMenu align="end" />}
            <DedupToggleButton />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card dir="rtl" className="card-elegant">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">משימות</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingMeetings}</p>
                <p className="text-sm text-muted-foreground">פגישות</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Bell className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visibleReminders.length}</p>
                <p className="text-sm text-muted-foreground">תזכורות</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatMinutes(totalTimeMinutes)}
                </p>
                <p className="text-sm text-muted-foreground">
                  שעות {selectedDayShortLabel}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selected day's schedule (meetings) */}
          <Card className="border-2 border-[hsl(45,80%,45%)] relative">
            <Button
              size="icon"
              onClick={() => setMeetingDialogOpen(true)}
              className={floatingAddButtonClass}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <CardHeader className="pb-14">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-[hsl(45,80%,45%)]" />
                  פגישות · {selectedDayShortLabel}
                </CardTitle>
                <DisplayOptions
                  viewType={meetingsView}
                  onViewTypeChange={setMeetingsView}
                  availableViewTypes={["list", "cards", "grid"]}
                />
              </div>
            </CardHeader>
            <CardContent>
              {visibleMeetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>אין פגישות מתוכננות בתאריך זה</p>
                </div>
              ) : (
                <div
                  className={cn(
                    meetingsView === "grid"
                      ? "grid grid-cols-2 gap-3"
                      : "space-y-3",
                  )}
                >
                  {visibleMeetings.map((meeting) => {
                    const MeetingIcon =
                      meetingTypeIcons[
                        meeting.meeting_type as keyof typeof meetingTypeIcons
                      ] || Users;
                    return (
                      <HoverItemWrapper
                        key={meeting.id}
                        onClick={() => navigate(`/meetings?id=${meeting.id}`)}
                        onEdit={() => navigate(`/meetings?edit=${meeting.id}`)}
                        onDelete={() => handleDeleteMeeting(meeting.id)}
                        className="rounded-lg"
                      >
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex flex-col items-center text-center min-w-[60px]">
                            <span className="text-lg font-bold text-[hsl(220,60%,25%)]">
                              {formatTime(meeting.start_time)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(meeting.end_time)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <MeetingIcon className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium truncate">
                                {meeting.title}
                              </p>
                            </div>
                            {meeting.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {meeting.location}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {meeting.client?.name && (
                                <Badge variant="outline" className="text-xs">
                                  <User className="h-3 w-3 ml-1" />
                                  {meeting.client.name}
                                </Badge>
                              )}
                              {meeting.project?.name && (
                                <Badge variant="secondary" className="text-xs">
                                  <Briefcase className="h-3 w-3 ml-1" />
                                  {meeting.project.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </HoverItemWrapper>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card className="border-2 border-[hsl(45,80%,45%)] relative">
            <Button
              size="icon"
              onClick={() => setTaskDialogOpen(true)}
              className={floatingAddButtonClass}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <CardHeader className="pb-14">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckSquare className="h-5 w-5 text-[hsl(220,60%,25%)]" />
                  משימות · {selectedDayShortLabel}
                </CardTitle>
                <DisplayOptions
                  viewType={tasksView}
                  onViewTypeChange={setTasksView}
                  availableViewTypes={["list", "cards", "grid"]}
                />
              </div>
            </CardHeader>
            <CardContent>
              {visibleTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>אין משימות פתוחות</p>
                </div>
              ) : (
                <div
                  className={cn(
                    tasksView === "grid"
                      ? "grid grid-cols-2 gap-2"
                      : "space-y-2",
                  )}
                >
                  {visibleTasks.slice(0, 6).map((task) => {
                    const PriorityIcon =
                      priorityIcons[
                        task.priority as keyof typeof priorityIcons
                      ] || ArrowRight;
                    const priorityColor =
                      priorityColors[
                        task.priority as keyof typeof priorityColors
                      ] || "text-gray-600";
                    const isOverdue =
                      task.due_date &&
                      isBefore(parseISO(task.due_date), startOfDay(new Date()));

                    return (
                      <HoverItemWrapper
                        key={task.id}
                        onClick={() => navigate(`/tasks?id=${task.id}`)}
                        onEdit={() => navigate(`/tasks?edit=${task.id}`)}
                        onDelete={() => handleDeleteTask(task.id)}
                        className="rounded-lg"
                      >
                        <div
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-colors",
                            isOverdue
                              ? "bg-destructive/10"
                              : "bg-muted/50 hover:bg-muted",
                          )}
                        >
                          <div className={cn("shrink-0", priorityColor)}>
                            <PriorityIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {task.due_date && (
                                <span
                                  className={cn(
                                    "text-xs flex items-center gap-1",
                                    isOverdue
                                      ? "text-destructive"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(task.due_date), "dd/MM")}
                                  {isOverdue && (
                                    <AlertCircle className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                              {task.client?.name && (
                                <Badge
                                  variant="outline"
                                  className="h-5 max-w-full gap-1 px-1.5 text-[10px]"
                                >
                                  <User className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {task.client.name}
                                  </span>
                                </Badge>
                              )}
                              {task.created_at && (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <CalendarDays className="h-3 w-3" />
                                  נוצרה{" "}
                                  {format(
                                    parseISO(task.created_at),
                                    "dd/MM/yyyy",
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              task.status === "in_progress"
                                ? "default"
                                : "secondary"
                            }
                            className="shrink-0 text-xs"
                          >
                            {getTaskStatusLabel(task.status)}
                          </Badge>
                        </div>
                      </HoverItemWrapper>
                    );
                  })}
                  {visibleTasks.length > 6 && (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => navigate("/tasks")}
                    >
                      עוד {visibleTasks.length - 6} משימות...
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card className="border-2 border-[hsl(45,80%,45%)] relative">
            <Button
              size="icon"
              onClick={() => setReminderDialogOpen(true)}
              className={floatingAddButtonClass}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <CardHeader className="pb-14">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-warning" />
                תזכורות · {selectedDayShortLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visibleReminders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>אין תזכורות בתאריך זה</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleReminders.map((reminder) => (
                    <HoverItemWrapper
                      key={reminder.id}
                      onClick={() =>
                        navigate(
                          `/tasks-meetings?tab=reminders&id=${reminder.id}`,
                        )
                      }
                      onEdit={() =>
                        navigate(
                          `/tasks-meetings?tab=reminders&edit=${reminder.id}`,
                        )
                      }
                      onDelete={() => handleDeleteReminder(reminder.id)}
                      className="rounded-lg"
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                        <div className="p-2 rounded-lg bg-warning/20">
                          <Bell className="h-4 w-4 text-warning" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{reminder.title}</p>
                          {reminder.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {reminder.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(reminder.remind_at)}
                          </p>
                          {reminder.client?.name && (
                            <Badge
                              variant="outline"
                              className="mt-2 h-6 max-w-full gap-1 bg-background/70 px-2 text-[10px]"
                            >
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {reminder.client.name}
                              </span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </HoverItemWrapper>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Logged */}
          <Card className="border-2 border-[hsl(45,80%,45%)] relative">
            <Button
              size="icon"
              onClick={() => setTimeDialogOpen(true)}
              className={floatingAddButtonClass}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <CardHeader className="pb-14">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-success" />
                זמן שנרשם · {selectedDayShortLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visibleTimeEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>לא נרשם זמן עבודה בתאריך זה</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleTimeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {entry.description || entry.project?.name || "עבודה"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(entry.start_time)}
                          {entry.end_time && ` - ${formatTime(entry.end_time)}`}
                        </p>
                      </div>
                      {entry.duration_minutes !== null && (
                        <Badge variant="outline" className="font-mono">
                          {formatMinutes(entry.duration_minutes)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <QuickAddTask
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          onSubmit={handleCreateTask}
          clients={clients}
        />

        <QuickAddMeeting
          open={meetingDialogOpen}
          onOpenChange={setMeetingDialogOpen}
          onSubmit={handleCreateMeeting}
          clients={clients}
        />

        <ReminderDialog
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          onSubmit={handleCreateReminder}
          clients={clients}
        />

        <TimeEntryDialog
          open={timeDialogOpen}
          onOpenChange={setTimeDialogOpen}
          onSubmit={handleCreateTimeEntry}
          clients={clients}
        />
      </div>
    </AppLayout>
  );
}

// Simple Reminder Dialog Component
const ReminderDialog = forwardRef<HTMLDivElement, any>(function ReminderDialog(
  { open, onOpenChange, onSubmit, clients },
  _ref,
) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [clientId, setClientId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !remindAt) {
      toast.error("נא למלא את כל השדות החובה");
      return;
    }
    setIsSubmitting(true);
    await onSubmit({
      title,
      message,
      remind_at: remindAt,
      client_id: clientId || null,
    });
    setIsSubmitting(false);
    setTitle("");
    setMessage("");
    setRemindAt("");
    setClientId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning" />
            תזכורת חדשה
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reminder-title">כותרת *</Label>
            <Input
              id="reminder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת התזכורת"
            />
          </div>
          <div>
            <Label htmlFor="reminder-message">הודעה</Label>
            <Textarea
              id="reminder-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="תוכן התזכורת"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="reminder-date">תאריך ושעה *</Label>
            <Input
              id="reminder-date"
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reminder-client">לקוח (אופציונלי)</Label>
            <select
              id="reminder-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">בחר לקוח</option>
              {clients.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "צור תזכורת"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// Simple Time Entry Dialog Component
const TimeEntryDialog = forwardRef<HTMLDivElement, any>(
  function TimeEntryDialog({ open, onOpenChange, onSubmit, clients }, _ref) {
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [clientId, setClientId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!startTime) {
        toast.error("נא למלא שעת התחלה");
        return;
      }

      let durationMinutes = null;
      if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      }

      setIsSubmitting(true);
      await onSubmit({
        description,
        start_time: startTime,
        end_time: endTime || null,
        duration_minutes: durationMinutes,
        client_id: clientId || null,
      });
      setIsSubmitting(false);
      setDescription("");
      setStartTime("");
      setEndTime("");
      setClientId("");
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-success" />
              רישום זמן חדש
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="time-description">תיאור</Label>
              <Textarea
                id="time-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="תיאור העבודה"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="time-start">שעת התחלה *</Label>
              <Input
                id="time-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="time-end">שעת סיום</Label>
              <Input
                id="time-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="time-client">לקוח (אופציונלי)</Label>
              <select
                id="time-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">בחר לקוח</option>
                {clients.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "רשום זמן"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
