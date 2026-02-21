/**
 * useDashboardData - גרסה משופרת עם React Query
 *
 * שיפורים:
 * 1. שימוש ב-React Query עם caching - הנתונים נשמרים ב-cache ל-5 דקות
 * 2. הפרדת קריאות - הסטטיסטיקות נטענות קודם, הגרפים אחר כך
 * 3. Background refetch - עדכון ברקע בלי לחסום את ה-UI
 * 4. Optimistic UI - הצגת נתונים מהקאש מיד
 */

import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { he } from "date-fns/locale";

// Types
interface RevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

interface WorkHoursData {
  name: string;
  hours: number;
}

interface DashboardStats {
  activeClients: number;
  activeClientsChange: number;
  openProjects: number;
  openProjectsChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  totalHours: number;
  totalHoursChange: number;
}

// Constants
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 30 * 60 * 1000; // 30 minutes

const STATUS_TRANSLATIONS: Record<string, string> = {
  planning: "בתכנון",
  "in-progress": "בביצוע",
  in_progress: "בביצוע",
  active: "פעיל",
  completed: "הושלם",
  "on-hold": "מושהה",
  on_hold: "מושהה",
  pending: "ממתין",
  cancelled: "בוטל",
};

const STATUS_COLORS: Record<string, string> = {
  בתכנון: "hsl(199, 89%, 48%)",
  בביצוע: "hsl(45, 70%, 50%)",
  פעיל: "hsl(142, 70%, 45%)",
  הושלם: "hsl(142, 70%, 45%)",
  מושהה: "hsl(0, 84%, 60%)",
  ממתין: "hsl(38, 92%, 50%)",
  בוטל: "hsl(0, 0%, 50%)",
};

const DEFAULT_STATS: DashboardStats = {
  activeClients: 0,
  activeClientsChange: 0,
  openProjects: 0,
  openProjectsChange: 0,
  monthlyRevenue: 0,
  monthlyRevenueChange: 0,
  totalHours: 0,
  totalHoursChange: 0,
};

// Query Keys
export const DASHBOARD_QUERY_KEYS = {
  all: ["dashboard"] as const,
  clients: () => [...DASHBOARD_QUERY_KEYS.all, "clients"] as const,
  projects: () => [...DASHBOARD_QUERY_KEYS.all, "projects"] as const,
  timeEntries: () => [...DASHBOARD_QUERY_KEYS.all, "timeEntries"] as const,
  profiles: () => [...DASHBOARD_QUERY_KEYS.all, "profiles"] as const,
  invoices: () => [...DASHBOARD_QUERY_KEYS.all, "invoices"] as const,
  quotes: () => [...DASHBOARD_QUERY_KEYS.all, "quotes"] as const,
  stats: () => [...DASHBOARD_QUERY_KEYS.all, "stats"] as const,
  charts: () => [...DASHBOARD_QUERY_KEYS.all, "charts"] as const,
};

// Helper: Promise with timeout
const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  name: string,
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${name} timeout after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
};

// Fetchers - פונקציות קטנות לכל קריאת API
const fetchClients = async () => {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, status, created_at");
  if (error) {
    console.error("Dashboard clients fetch error:", error);
    return [];
  }
  return data || [];
};

const fetchProjects = async () => {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, created_at, budget");
  if (error) {
    console.error("Dashboard projects fetch error:", error);
    return [];
  }
  return data || [];
};

const fetchTimeEntries = async () => {
  const threeMonthsAgo = subMonths(new Date(), 3);
  const { data, error } = await supabase
    .from("time_entries")
    .select(
      "id, user_id, project_id, client_id, start_time, end_time, duration_minutes, hourly_rate",
    )
    .gte("start_time", threeMonthsAgo.toISOString());
  if (error) {
    console.error("Dashboard time entries fetch error:", error);
    return [];
  }
  return data || [];
};

const fetchProfiles = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name");
  if (error) {
    console.error("Dashboard profiles fetch error:", error);
    return [];
  }
  return data || [];
};

const fetchInvoices = async () => {
  const sixMonthsAgo = subMonths(new Date(), 6);
  const { data, error } = await supabase
    .from("invoices")
    .select("id, amount, paid_amount, status, issue_date, created_at")
    .gte("created_at", sixMonthsAgo.toISOString());
  if (error) {
    console.error("Dashboard invoices fetch error:", error);
    return [];
  }
  return data || [];
};

const fetchQuotes = async () => {
  const sixMonthsAgo = subMonths(new Date(), 6);
  const { data, error } = await supabase
    .from("quotes")
    .select("id, total_amount, paid_amount, status, issue_date, created_at")
    .gte("created_at", sixMonthsAgo.toISOString());
  if (error) {
    console.error("Dashboard quotes fetch error:", error);
    return [];
  }
  return data || [];
};

// Helper: חישוב תאריכים
function getDateRanges() {
  const currentMonth = new Date();
  return {
    currentMonth,
    currentMonthStart: startOfMonth(currentMonth),
    currentMonthEnd: endOfMonth(currentMonth),
    lastMonthStart: startOfMonth(subMonths(currentMonth, 1)),
    lastMonthEnd: endOfMonth(subMonths(currentMonth, 1)),
  };
}

// Hook לסטטיסטיקות בלבד - נטען ראשון
export function useDashboardStats() {
  const { user } = useAuth();

  const clientsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.clients(),
    queryFn: fetchClients,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  const projectsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.projects(),
    queryFn: fetchProjects,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  const timeEntriesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.timeEntries(),
    queryFn: fetchTimeEntries,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  const invoicesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.invoices(),
    queryFn: fetchInvoices,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  const quotesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.quotes(),
    queryFn: fetchQuotes,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  // חישוב הסטטיסטיקות
  const stats = useMemo<DashboardStats>(() => {
    const clients = clientsQuery.data || [];
    const projects = projectsQuery.data || [];
    const timeEntries = timeEntriesQuery.data || [];
    const invoices = invoicesQuery.data || [];
    const quotes = quotesQuery.data || [];

    if (!clients.length && !projects.length) {
      return DEFAULT_STATS;
    }

    const { currentMonthStart, currentMonthEnd, lastMonthStart, lastMonthEnd } =
      getDateRanges();

    // Active clients
    const activeClients = clients.filter((c) => c.status === "active").length;
    const currentMonthClients = clients.filter((c) => {
      const date = new Date(c.created_at);
      return date >= currentMonthStart && date <= currentMonthEnd;
    }).length;
    const lastMonthClients = clients.filter((c) => {
      const date = new Date(c.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).length;
    const clientsChange =
      lastMonthClients > 0
        ? Math.round(
            ((currentMonthClients - lastMonthClients) / lastMonthClients) * 100,
          )
        : currentMonthClients > 0
          ? 100
          : 0;

    // Open projects
    const openProjects = projects.filter(
      (p) => p.status !== "completed" && p.status !== "cancelled",
    ).length;
    const currentMonthProjects = projects.filter((p) => {
      const date = new Date(p.created_at);
      return date >= currentMonthStart && date <= currentMonthEnd;
    }).length;
    const lastMonthProjects = projects.filter((p) => {
      const date = new Date(p.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).length;
    const projectsChange =
      lastMonthProjects > 0
        ? Math.round(
            ((currentMonthProjects - lastMonthProjects) / lastMonthProjects) *
              100,
          )
        : currentMonthProjects > 0
          ? 100
          : 0;

    // Revenue
    const currentMonthInvoiceRevenue = invoices
      .filter((inv) => {
        const date = new Date(inv.issue_date || inv.created_at);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);

    const lastMonthInvoiceRevenue = invoices
      .filter((inv) => {
        const date = new Date(inv.issue_date || inv.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);

    const currentMonthQuoteRevenue = quotes
      .filter((q) => {
        const date = new Date(q.issue_date || q.created_at);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .reduce((sum, q) => sum + (q.paid_amount || 0), 0);

    const lastMonthQuoteRevenue = quotes
      .filter((q) => {
        const date = new Date(q.issue_date || q.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, q) => sum + (q.paid_amount || 0), 0);

    const totalCurrentRevenue =
      currentMonthInvoiceRevenue + currentMonthQuoteRevenue;
    const totalLastRevenue = lastMonthInvoiceRevenue + lastMonthQuoteRevenue;
    const revenueChange =
      totalLastRevenue > 0
        ? Math.round(
            ((totalCurrentRevenue - totalLastRevenue) / totalLastRevenue) * 100,
          )
        : totalCurrentRevenue > 0
          ? 100
          : 0;

    // Hours
    const currentMonthHours = timeEntries
      .filter((entry) => {
        const date = new Date(entry.start_time);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .reduce((sum, entry) => sum + (entry.duration_minutes || 0) / 60, 0);

    const lastMonthHours = timeEntries
      .filter((entry) => {
        const date = new Date(entry.start_time);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, entry) => sum + (entry.duration_minutes || 0) / 60, 0);

    const hoursChange =
      lastMonthHours > 0
        ? Math.round(
            ((currentMonthHours - lastMonthHours) / lastMonthHours) * 100,
          )
        : currentMonthHours > 0
          ? 100
          : 0;

    return {
      activeClients,
      activeClientsChange: clientsChange,
      openProjects,
      openProjectsChange: projectsChange,
      monthlyRevenue: totalCurrentRevenue,
      monthlyRevenueChange: revenueChange,
      totalHours: Math.round(currentMonthHours),
      totalHoursChange: hoursChange,
    };
  }, [
    clientsQuery.data,
    projectsQuery.data,
    timeEntriesQuery.data,
    invoicesQuery.data,
    quotesQuery.data,
  ]);

  const isLoading =
    clientsQuery.isLoading ||
    projectsQuery.isLoading ||
    timeEntriesQuery.isLoading ||
    invoicesQuery.isLoading ||
    quotesQuery.isLoading;

  const isFetching =
    clientsQuery.isFetching ||
    projectsQuery.isFetching ||
    timeEntriesQuery.isFetching ||
    invoicesQuery.isFetching ||
    quotesQuery.isFetching;

  return {
    stats,
    isLoading,
    isFetching,
  };
}

// Hook לגרפים - נטען אחרי הסטטיסטיקות
export function useDashboardCharts() {
  const { user } = useAuth();

  const projectsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.projects(),
    queryFn: fetchProjects,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
  });

  const timeEntriesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.timeEntries(),
    queryFn: fetchTimeEntries,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
  });

  const profilesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.profiles(),
    queryFn: fetchProfiles,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
  });

  const invoicesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.invoices(),
    queryFn: fetchInvoices,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
  });

  const quotesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.quotes(),
    queryFn: fetchQuotes,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!user,
  });

  // Revenue Data - 6 חודשים אחרונים
  const revenueData = useMemo<RevenueData[]>(() => {
    const invoices = invoicesQuery.data || [];
    const quotes = quotesQuery.data || [];
    const currentMonth = new Date();
    const result: RevenueData[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(currentMonth, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthInvoices = invoices.filter((inv) => {
        const date = new Date(inv.issue_date || inv.created_at);
        return date >= monthStart && date <= monthEnd;
      });
      const invoiceRevenue = monthInvoices.reduce(
        (sum, inv) => sum + (inv.paid_amount || 0),
        0,
      );

      const monthQuotes = quotes.filter((q) => {
        const date = new Date(q.issue_date || q.created_at);
        return date >= monthStart && date <= monthEnd;
      });
      const quoteRevenue = monthQuotes.reduce(
        (sum, q) => sum + (q.paid_amount || 0),
        0,
      );

      result.push({
        month: format(monthDate, "MMM", { locale: he }),
        revenue: invoiceRevenue + quoteRevenue,
        invoices: monthInvoices.length,
      });
    }

    return result;
  }, [invoicesQuery.data, quotesQuery.data]);

  // Projects Status
  const projectsStatusData = useMemo<ProjectStatusData[]>(() => {
    const projects = projectsQuery.data || [];
    const statusCounts: Record<string, number> = {};

    projects.forEach((project) => {
      const translatedStatus =
        STATUS_TRANSLATIONS[project.status || "planning"] ||
        project.status ||
        "בתכנון";
      statusCounts[translatedStatus] =
        (statusCounts[translatedStatus] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] || "hsl(222, 47%, 25%)",
    }));
  }, [projectsQuery.data]);

  // Hours by Employee
  const hoursByEmployee = useMemo<WorkHoursData[]>(() => {
    const timeEntries = timeEntriesQuery.data || [];
    const profiles = profilesQuery.data || [];
    const { currentMonthStart, currentMonthEnd } = getDateRanges();

    const hoursByEmployeeMap: Record<string, number> = {};

    timeEntries
      .filter((entry) => {
        const date = new Date(entry.start_time);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .forEach((entry) => {
        const profile = profiles.find((p) => p.id === entry.user_id);
        const name = profile?.full_name || "לא ידוע";
        hoursByEmployeeMap[name] =
          (hoursByEmployeeMap[name] || 0) + (entry.duration_minutes || 0) / 60;
      });

    return Object.entries(hoursByEmployeeMap)
      .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 7);
  }, [timeEntriesQuery.data, profilesQuery.data]);

  // Hours by Project
  const hoursByProject = useMemo<WorkHoursData[]>(() => {
    const timeEntries = timeEntriesQuery.data || [];
    const projects = projectsQuery.data || [];
    const { currentMonthStart, currentMonthEnd } = getDateRanges();

    const hoursByProjectMap: Record<string, number> = {};

    timeEntries
      .filter((entry) => {
        const date = new Date(entry.start_time);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .forEach((entry) => {
        const project = projects.find((p) => p.id === entry.project_id);
        const name = project?.name || "ללא פרויקט";
        hoursByProjectMap[name] =
          (hoursByProjectMap[name] || 0) + (entry.duration_minutes || 0) / 60;
      });

    return Object.entries(hoursByProjectMap)
      .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 7);
  }, [timeEntriesQuery.data, projectsQuery.data]);

  const isLoading =
    projectsQuery.isLoading ||
    timeEntriesQuery.isLoading ||
    profilesQuery.isLoading ||
    invoicesQuery.isLoading ||
    quotesQuery.isLoading;

  return {
    revenueData,
    projectsStatusData,
    hoursByEmployee,
    hoursByProject,
    isLoading,
  };
}

// Hook משולב לתאימות אחורה - משתמש ב-hooks החדשים
export function useDashboardData() {
  const { stats, isLoading: statsLoading, isFetching } = useDashboardStats();
  const {
    revenueData,
    projectsStatusData,
    hoursByEmployee,
    hoursByProject,
    isLoading: chartsLoading,
  } = useDashboardCharts();

  // Force display after 8 seconds even if still loading
  const [forceLoaded, setForceLoaded] = useState(false);

  useEffect(() => {
    if (statsLoading || chartsLoading) {
      const timer = setTimeout(() => {
        console.log("[Dashboard] Force loading complete after 8 seconds");
        setForceLoaded(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [statsLoading, chartsLoading]);

  return {
    isLoading: forceLoaded ? false : statsLoading,
    isChartsLoading: forceLoaded ? false : chartsLoading,
    isFetching,
    stats,
    revenueData,
    projectsStatusData,
    hoursByEmployee,
    hoursByProject,
  };
}

// Hook לרענון ידני
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.all });
  };
}

// Alias for cleaner imports - this IS the main useDashboardData hook now
export { useDashboardData as useDashboardDataMain };
