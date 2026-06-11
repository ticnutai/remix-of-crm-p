// Smart Dashboard Stats Widget
// ווידג'ט סטטיסטיקות חכמות לדשבורד

import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Settings2,
  ChevronLeft,
  ChevronRight,
  KanbanSquare,
  Folder,
  Bell,
  CalendarDays,
  Star,
} from "lucide-react";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useWidgetLayout } from "./WidgetLayoutManager";

interface SmartStat {
  id: string;
  label: string;
  value: string | number;
  subLabel?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  progress?: number;
  href?: string;
}

type CarouselOptionId =
  | "work-stages"
  | "calendar-board"
  | "files-hub"
  | "reminders-today";

interface SmartDashboardData {
  newClientsThisMonth: number;
  newClientsLastMonth: number;
  tasksDueToday: number;
  tasksDueThisWeek: number;
  openTasks: number;
  completedTasksThisMonth: number;
  meetingsThisWeek: number;
  activeClients: number;
  totalClients: number;
  conversionRate: number;
  overdueTasks: number;
  unpaidInvoices: number;
  leads: number;
  remindersToday: number;
  calendarEventsThisWeek: number;
  filesThisWeek: number;
  openStageTasks: number;
}

interface CarouselOptionConfig {
  id: CarouselOptionId;
  label: string;
  subLabel: string;
  href: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
  value: (data: SmartDashboardData) => number;
}

const SMART_DASHBOARD_STATS_KEY = ["smart-dashboard-stats"] as const;
const SMART_CAROUSEL_WIDGET_ID = "smart-carousel";
const SMART_STAT_WIDGET_IDS: Record<string, string> = {
  "new-clients": "smart-new-clients",
  "tasks-due": "smart-tasks-today",
  "meetings-week": "smart-meetings-week",
  conversion: "smart-conversion-rate",
  overdue: "smart-overdue-tasks",
  completed: "smart-completed-month",
};
const DEFAULT_CAROUSEL_OPTION_IDS: CarouselOptionId[] = [
  "work-stages",
  "calendar-board",
  "files-hub",
];

const SMART_ICON_UNIFIED_CLASS =
  "p-1.5 rounded-lg border border-[#d4af37]/80 bg-[#162d5a] text-[#d4af37] [&_svg]:h-4 [&_svg]:w-4";

const CAROUSEL_OPTIONS: CarouselOptionConfig[] = [
  {
    id: "work-stages",
    label: "שלבי עבודה",
    subLabel: "משימות שלבים פתוחות",
    href: "/clients",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    icon: KanbanSquare,
    value: (data) => data.openStageTasks,
  },
  {
    id: "calendar-board",
    label: "לוח שנה",
    subLabel: "אירועים השבוע",
    href: "/calendar",
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    icon: CalendarDays,
    value: (data) => data.calendarEventsThisWeek,
  },
  {
    id: "files-hub",
    label: "קבצים",
    subLabel: "קבצים חדשים השבוע",
    href: "/files",
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
    icon: Folder,
    value: (data) => data.filesThisWeek,
  },
  {
    id: "reminders-today",
    label: "תזכורות להיום",
    subLabel: "תזכורות פעילות",
    href: "/reminders",
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-500/10",
    icon: Bell,
    value: (data) => data.remindersToday,
  },
];

export function useSmartDashboardStats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const invalidateSmartStats = () => {
      queryClient.invalidateQueries({ queryKey: SMART_DASHBOARD_STATS_KEY });
    };

    // Keep homepage stats synced immediately after CRUD in related modules.
    const channel = supabase
      .channel(`smart-dashboard-stats-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        invalidateSmartStats,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings" },
        invalidateSmartStats,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        invalidateSmartStats,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        invalidateSmartStats,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reminders" },
        invalidateSmartStats,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_events" },
        invalidateSmartStats,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "files" },
        invalidateSmartStats,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_stage_tasks" },
        invalidateSmartStats,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  // Fetch all data needed for smart stats
  const { data, isLoading } = useQuery({
    queryKey: [...SMART_DASHBOARD_STATS_KEY, user?.id],
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

      const [
        { data: clients },
        { data: tasks },
        { data: meetings },
        { data: invoices },
        { data: reminders },
        { data: calendarEvents },
        { data: files },
        { data: stageTasks },
      ] = await Promise.all([
        supabase.from("clients").select("id, name, status, created_at, tags"),
        supabase
          .from("tasks")
          .select("id, status, due_date, created_at, client_id"),
        supabase.from("meetings").select("id, start_time, client_id, created_at"),
        supabase.from("invoices").select("id, status, amount, created_at"),
        supabase.from("reminders").select("id, remind_at, is_dismissed"),
        supabase
          .from("calendar_events")
          .select("id, start_time, is_completed"),
        supabase.from("files").select("id, created_at, is_archived"),
        supabase.from("client_stage_tasks").select("id, completed"),
      ]);

      // New clients this month
      const newClientsThisMonth = (clients || []).filter((c) => {
        const created = new Date(c.created_at);
        return created >= currentMonthStart && created <= currentMonthEnd;
      }).length;

      const newClientsLastMonth = (clients || []).filter((c) => {
        const created = new Date(c.created_at);
        return created >= lastMonthStart && created <= lastMonthEnd;
      }).length;

      // Tasks due today/this week
      const tasksDueToday = (tasks || []).filter((t) => {
        if (!t.due_date || t.status === "completed" || t.status === "done") {
          return false;
        }
        const due = new Date(t.due_date);
        if (Number.isNaN(due.getTime())) return false;
        return due >= todayStart && due <= todayEnd;
      }).length;

      const tasksDueThisWeek = (tasks || []).filter((t) => {
        if (!t.due_date || t.status === "completed" || t.status === "done")
          return false;
        const due = new Date(t.due_date);
        return due >= weekStart && due <= weekEnd;
      }).length;

      // Open tasks
      const openTasks = (tasks || []).filter(
        (t) => t.status !== "completed" && t.status !== "done",
      ).length;

      const completedTasksThisMonth = (tasks || []).filter((t) => {
        if (t.status !== "completed" && t.status !== "done") return false;
        const created = new Date(t.created_at);
        return created >= currentMonthStart && created <= currentMonthEnd;
      }).length;

      // Meetings this week
      const meetingsThisWeek = (meetings || []).filter((m) => {
        const date = new Date(m.start_time);
        return date >= weekStart && date <= weekEnd;
      }).length;

      // Total clients
      const activeClients = (clients || []).filter(
        (c) => c.status === "active",
      ).length;
      const totalClients = (clients || []).length;

      // Conversion rate (leads → active)
      const leads = (clients || []).filter((c) => c.status === "lead").length;
      const conversionRate =
        leads > 0
          ? Math.round((activeClients / (activeClients + leads)) * 100)
          : 100;

      // Overdue tasks
      const overdueTasks = (tasks || []).filter((t) => {
        if (!t.due_date || t.status === "completed" || t.status === "done")
          return false;
        return new Date(t.due_date) < now;
      }).length;

      // Unpaid invoices
      const unpaidInvoices = (invoices || []).filter(
        (i) =>
          i.status === "pending" ||
          i.status === "sent" ||
          i.status === "overdue",
      ).length;

      const remindersToday = (reminders || []).filter((r) => {
        if (r.is_dismissed) return false;
        const remindAt = new Date(r.remind_at);
        if (Number.isNaN(remindAt.getTime())) return false;
        return remindAt >= todayStart && remindAt <= todayEnd;
      }).length;

      const calendarEventsThisWeek = (calendarEvents || []).filter((e) => {
        if (e.is_completed) return false;
        const start = new Date(e.start_time);
        if (Number.isNaN(start.getTime())) return false;
        return start >= weekStart && start <= weekEnd;
      }).length;

      const filesThisWeek = (files || []).filter((f) => {
        if (f.is_archived) return false;
        const createdAt = new Date(f.created_at);
        if (Number.isNaN(createdAt.getTime())) return false;
        return createdAt >= weekStart && createdAt <= weekEnd;
      }).length;

      const openStageTasks = (stageTasks || []).filter((s) => !s.completed)
        .length;

      return {
        newClientsThisMonth,
        newClientsLastMonth,
        tasksDueToday,
        tasksDueThisWeek,
        openTasks,
        completedTasksThisMonth,
        meetingsThisWeek,
        activeClients,
        totalClients,
        conversionRate,
        overdueTasks,
        unpaidInvoices,
        leads,
        remindersToday,
        calendarEventsThisWeek,
        filesThisWeek,
        openStageTasks,
      };
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min
    refetchOnWindowFocus: true,
  });

  const stats = useMemo<SmartStat[]>(() => {
    if (!data) return [];

    return [
      {
        id: "new-clients",
        label: "לקוחות חדשים",
        value: data.newClientsThisMonth,
        subLabel:
          data.newClientsLastMonth > 0
            ? `${data.newClientsThisMonth > data.newClientsLastMonth ? "+" : ""}${data.newClientsThisMonth - data.newClientsLastMonth} מהחודש שעבר`
            : "החודש",
        icon: <UserPlus className="h-5 w-5" />,
        color: "text-blue-600",
        bgColor: "bg-blue-500/10",
        href: "/clients",
      },
      {
        id: "tasks-due",
        label: "משימות להיום",
        value: data.tasksDueToday,
        subLabel: `${data.tasksDueThisWeek} השבוע`,
        icon: <Target className="h-5 w-5" />,
        color: data.tasksDueToday > 0 ? "text-orange-600" : "text-green-600",
        bgColor:
          data.tasksDueToday > 0 ? "bg-orange-500/10" : "bg-green-500/10",
        href: "/tasks",
      },
      {
        id: "meetings-week",
        label: "פגישות השבוע",
        value: data.meetingsThisWeek,
        subLabel: "פגישות מתוכננות",
        icon: <Calendar className="h-5 w-5" />,
        color: "text-purple-600",
        bgColor: "bg-purple-500/10",
        href: "/meetings",
      },
      {
        id: "conversion",
        label: "שיעור המרה",
        value: `${data.conversionRate}%`,
        subLabel: `${data.leads} לידים פעילים`,
        icon: <TrendingUp className="h-5 w-5" />,
        color: data.conversionRate >= 50 ? "text-green-600" : "text-amber-600",
        bgColor:
          data.conversionRate >= 50 ? "bg-green-500/10" : "bg-amber-500/10",
        progress: data.conversionRate,
      },
      {
        id: "overdue",
        label: "משימות באיחור",
        value: data.overdueTasks,
        subLabel: data.overdueTasks > 0 ? "דורש טיפול" : "הכל בזמן!",
        icon:
          data.overdueTasks > 0 ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          ),
        color: data.overdueTasks > 0 ? "text-red-600" : "text-green-600",
        bgColor: data.overdueTasks > 0 ? "bg-red-500/10" : "bg-green-500/10",
      },
      {
        id: "completed",
        label: "הושלמו החודש",
        value: data.completedTasksThisMonth,
        subLabel: `מתוך ${data.openTasks + data.completedTasksThisMonth} משימות`,
        icon: <Star className="h-5 w-5" />,
        color: "text-amber-600",
        bgColor: "bg-amber-500/10",
        progress:
          data.openTasks + data.completedTasksThisMonth > 0
            ? Math.round(
                (data.completedTasksThisMonth /
                  (data.openTasks + data.completedTasksThisMonth)) *
                  100,
              )
            : 0,
      },
    ];
  }, [data]);

  return { stats, isLoading, data: data as SmartDashboardData | undefined };
}

// Smart Stats Grid Component
export function SmartStatsGrid({ className }: { className?: string }) {
  const { stats, isLoading, data } = useSmartDashboardStats();
  const navigate = useNavigate();
  const { isVisible } = useWidgetLayout();
  const [carouselOptionIds, setCarouselOptionIds] = useSyncedSetting<
    CarouselOptionId[]
  >({
    key: "dashboard-smart-carousel-options",
    defaultValue: DEFAULT_CAROUSEL_OPTION_IDS,
  });
  const [carouselIndex, setCarouselIndex] = useSyncedSetting<number>({
    key: "dashboard-smart-carousel-index",
    defaultValue: 0,
  });

  const normalizedCarouselOptionIds = useMemo(() => {
    const allowed = new Set(CAROUSEL_OPTIONS.map((option) => option.id));
    const next: CarouselOptionId[] = [];

    for (const rawId of carouselOptionIds) {
      if (allowed.has(rawId) && !next.includes(rawId)) {
        next.push(rawId);
      }
    }

    return next.length > 0 ? next : DEFAULT_CAROUSEL_OPTION_IDS;
  }, [carouselOptionIds]);

  useEffect(() => {
    if (JSON.stringify(carouselOptionIds) === JSON.stringify(normalizedCarouselOptionIds)) {
      return;
    }
    setCarouselOptionIds(normalizedCarouselOptionIds);
  }, [carouselOptionIds, normalizedCarouselOptionIds, setCarouselOptionIds]);

  useEffect(() => {
    if (carouselIndex < normalizedCarouselOptionIds.length) return;
    setCarouselIndex(0);
  }, [carouselIndex, normalizedCarouselOptionIds.length, setCarouselIndex]);

  const currentCarouselStat = useMemo<SmartStat | null>(() => {
    if (!data || normalizedCarouselOptionIds.length === 0) return null;

    const safeIndex =
      ((carouselIndex % normalizedCarouselOptionIds.length) +
        normalizedCarouselOptionIds.length) %
      normalizedCarouselOptionIds.length;
    const currentId = normalizedCarouselOptionIds[safeIndex];
    const option = CAROUSEL_OPTIONS.find((item) => item.id === currentId);
    if (!option) return null;

    const Icon = option.icon;

    return {
      id: `carousel-${option.id}`,
      label: option.label,
      value: option.value(data),
      subLabel: option.subLabel,
      icon: <Icon className="h-5 w-5" />,
      color: option.color,
      bgColor: option.bgColor,
      href: option.href,
    };
  }, [data, normalizedCarouselOptionIds, carouselIndex]);

  const isCarouselVisible = isVisible(SMART_CAROUSEL_WIDGET_ID);

  const visibleStats = useMemo(() => {
    return stats.filter((stat) => {
      const widgetId = SMART_STAT_WIDGET_IDS[stat.id];
      return widgetId ? isVisible(widgetId) : true;
    });
  }, [isVisible, stats]);

  const hasVisibleSmartWidgets = isCarouselVisible || visibleStats.length > 0;

  const rotateCarousel = (direction: number) => {
    setCarouselIndex((prev) => {
      const total = normalizedCarouselOptionIds.length || 1;
      return (prev + direction + total) % total;
    });
  };

  const toggleCarouselOption = (optionId: CarouselOptionId, checked: boolean) => {
    setCarouselOptionIds((prev) => {
      const unique = Array.from(new Set(prev)).filter((id) =>
        CAROUSEL_OPTIONS.some((option) => option.id === id),
      );

      if (checked) {
        if (unique.includes(optionId)) return unique;
        return [...unique, optionId];
      }

      if (!unique.includes(optionId)) return unique;
      if (unique.length <= 1) return unique;

      return unique.filter((id) => id !== optionId);
    });
  };

  const renderHoverSettingsButton = () => (
    <div className="absolute top-0 left-0 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
            title="בחירת פונקציות לקרוסלה"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rtl">
          <DropdownMenuLabel className="text-right">בחירת פונקציות לקרוסלה</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {CAROUSEL_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={normalizedCarouselOptionIds.includes(option.id)}
              onCheckedChange={(checked) =>
                toggleCarouselOption(option.id, checked === true)
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (!hasVisibleSmartWidgets) {
    return null;
  }

  if (isLoading) {
    const visibleStatCount = Object.values(SMART_STAT_WIDGET_IDS).filter((id) =>
      isVisible(id),
    ).length;
    const loadingCardsCount = Math.max(
      1,
      (isCarouselVisible ? 1 : 0) + visibleStatCount,
    );

    return (
      <div className={cn("group relative", className)} dir="rtl">
        {renderHoverSettingsButton()}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: loadingCardsCount }, (_, i) => i + 1).map(
            (itemId) => (
              <Card key={itemId} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-8 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group relative", className)} dir="rtl">
      {renderHoverSettingsButton()}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {isCarouselVisible && currentCarouselStat && (
          <Card
            key={currentCarouselStat.id}
            className="cursor-pointer border-primary/30 hover:shadow-md transition-shadow"
            onClick={() => navigate(currentCarouselStat.href || "/")}
          >
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={SMART_ICON_UNIFIED_CLASS}
                >
                  {currentCarouselStat.icon}
                </div>
                <div className="text-2xl font-bold">{currentCarouselStat.value}</div>
              </div>

              <div className="text-sm font-medium text-foreground">
                {currentCarouselStat.label}
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="פריט קודם"
                  onClick={(event) => {
                    event.stopPropagation();
                    rotateCarousel(-1);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-[11px] text-muted-foreground truncate max-w-[90px] text-center">
                  {currentCarouselStat.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="פריט הבא"
                  onClick={(event) => {
                    event.stopPropagation();
                    rotateCarousel(1);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {visibleStats.map((stat) => (
          <Card
            key={stat.id}
            className={cn(
              "hover:shadow-md transition-shadow",
              stat.href && "cursor-pointer",
            )}
            onClick={stat.href ? () => navigate(stat.href) : undefined}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={SMART_ICON_UNIFIED_CLASS}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
              <div className="text-sm font-medium text-foreground">
                {stat.label}
              </div>
              {stat.subLabel && (
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.subLabel}
                </div>
              )}
              {stat.progress !== undefined && (
                <Progress value={stat.progress} className="h-1.5 mt-2" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default SmartStatsGrid;
