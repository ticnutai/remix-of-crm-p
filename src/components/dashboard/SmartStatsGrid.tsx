// Smart Dashboard Stats Widget
// ווידג'ט סטטיסטיקות חכמות לדשבורד

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  UserPlus,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Star,
} from "lucide-react";
import {
  differenceInDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";

interface SmartStat {
  id: string;
  label: string;
  value: string | number;
  subLabel?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  progress?: number;
}

export function useSmartDashboardStats() {
  // Fetch all data needed for smart stats
  const { data, isLoading } = useQuery({
    queryKey: ["smart-dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
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
      ] = await Promise.all([
        supabase.from("clients").select("id, name, status, created_at, tags"),
        supabase
          .from("tasks")
          .select("id, status, due_date, created_at, client_id"),
        supabase.from("meetings").select("id, date, client_id, created_at"),
        supabase.from("invoices").select("id, status, amount, created_at"),
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
      const todayStr = now.toISOString().split("T")[0];
      const tasksDueToday = (tasks || []).filter(
        (t) =>
          t.due_date === todayStr &&
          t.status !== "completed" &&
          t.status !== "done",
      ).length;

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
        const date = new Date(m.date);
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
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min
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
      },
      {
        id: "meetings-week",
        label: "פגישות השבוע",
        value: data.meetingsThisWeek,
        subLabel: "פגישות מתוכננות",
        icon: <Calendar className="h-5 w-5" />,
        color: "text-purple-600",
        bgColor: "bg-purple-500/10",
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

  return { stats, isLoading, data };
}

// Smart Stats Grid Component
export function SmartStatsGrid({ className }: { className?: string }) {
  const { stats, isLoading } = useSmartDashboardStats();

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3",
          className,
        )}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3",
        className,
      )}
      dir="rtl"
    >
      {stats.map((stat) => (
        <Card key={stat.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("p-2 rounded-lg", stat.bgColor, stat.color)}>
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
  );
}

export default SmartStatsGrid;
