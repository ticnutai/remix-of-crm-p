/**
 * Smart Alerts System - מערכת התראות חכמות
 * בודק תנאים שונים ומתריע על דברים חשובים
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SmartAlert {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  category:
    | "client"
    | "project"
    | "payment"
    | "contract"
    | "task"
    | "meeting"
    | "stage"
    | "deadline"
    | "reminder";
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  data?: any;
  createdAt: Date;
  priority: 1 | 2 | 3; // 1 = high, 2 = medium, 3 = low
  dismissedAt?: Date | null;
}

export interface AlertSettings {
  enabledCategories: string[];
  enableBrowserNotifications: boolean;
  checkIntervalMinutes: number;
  inactiveClientDays: number;
  pendingLeadDays: number;
  contractExpiryDays: number;
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  enabledCategories: [
    "client",
    "project",
    "payment",
    "contract",
    "task",
    "meeting",
    "stage",
    "deadline",
    "reminder",
  ],
  enableBrowserNotifications: false,
  checkIntervalMinutes: 5,
  inactiveClientDays: 30,
  pendingLeadDays: 7,
  contractExpiryDays: 30,
};

export interface AlertStats {
  total: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  urgent: number;
}

export function useSmartAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("dismissed-alerts");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [settings, setSettings] = useState<AlertSettings>(() => {
    const saved = localStorage.getItem("alert-settings");
    return saved
      ? { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_ALERT_SETTINGS;
  });
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    byCategory: {},
    byType: {},
    urgent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // פונקציה לעדכון הגדרות
  const updateSettings = useCallback((newSettings: Partial<AlertSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("alert-settings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // פונקציה לסימון התראה כנקראה
  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => {
      const updated = new Set(prev);
      updated.add(alertId);
      localStorage.setItem("dismissed-alerts", JSON.stringify([...updated]));
      return updated;
    });
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  // פונקציה לניקוי כל ההתראות שנסגרו
  const clearDismissedAlerts = useCallback(() => {
    setDismissedAlerts(new Set());
    localStorage.removeItem("dismissed-alerts");
  }, []);

  /**
   * בדיקת לקוחות לא פעילים (30+ ימים)
   */
  const checkInactiveClients = useCallback(async (): Promise<SmartAlert[]> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, updated_at")
      .lt("updated_at", thirtyDaysAgo.toISOString())
      .eq("status", "active")
      .limit(10);

    return (clients || []).map((client) => ({
      id: `inactive-client-${client.id}`,
      type: "warning" as const,
      category: "client" as const,
      title: "לקוח לא פעיל",
      message: `${client.name} לא עודכן ב-30+ ימים`,
      actionLabel: "פתח לקוח",
      actionUrl: `/clients/${client.id}`,
      data: client,
      createdAt: new Date(),
      priority: 2,
    }));
  }, []);

  /**
   * בדיקת פרויקטים שעוברים תקציב
   */
  const checkProjectBudgets = useCallback(async (): Promise<SmartAlert[]> => {
    const { data: projects } = await supabase
      .from("projects")
      .select(
        `
        id, 
        name, 
        budget,
        time_entries(duration_minutes, hourly_rate)
      `,
      )
      .not("budget", "is", null)
      .eq("status", "active");

    const overBudgetProjects = (projects || []).filter((project) => {
      const totalCost = (project.time_entries || []).reduce(
        (sum: number, entry: any) => {
          return (
            sum +
            ((entry.duration_minutes || 0) / 60) * (entry.hourly_rate || 0)
          );
        },
        0,
      );
      return totalCost > (project.budget || 0);
    });

    return overBudgetProjects.map((project) => ({
      id: `budget-${project.id}`,
      type: "danger" as const,
      category: "project" as const,
      title: "פרויקט חורג מתקציב!",
      message: `${project.name} עבר את התקציב המאושר`,
      actionLabel: "צפה בפרויקט",
      actionUrl: `/projects/${project.id}`,
      data: project,
      createdAt: new Date(),
      priority: 1,
    }));
  }, []);

  /**
   * בדיקת חוזים שמסתיימים בקרוב (30 ימים)
   */
  const checkExpiringContracts = useCallback(async (): Promise<
    SmartAlert[]
  > => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: contracts } = await supabase
      .from("contracts")
      .select("id, title, end_date, clients(name)")
      .not("end_date", "is", null)
      .lte("end_date", thirtyDaysFromNow.toISOString())
      .eq("status", "active");

    return (contracts || []).map((contract) => ({
      id: `expiring-contract-${contract.id}`,
      type: "warning" as const,
      category: "contract" as const,
      title: "חוזה מסתיים בקרוב",
      message: `${contract.title} מסתיים ב-${new Date(contract.end_date).toLocaleDateString("he-IL")}`,
      actionLabel: "צפה בחוזה",
      actionUrl: `/contracts/${contract.id}`,
      data: contract,
      createdAt: new Date(),
      priority: 1,
    }));
  }, []);

  /**
   * בדיקת תשלומים שמתעכבים
   */
  const checkOverduePayments = useCallback(async (): Promise<SmartAlert[]> => {
    const today = new Date();

    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, amount, due_date, clients(name)")
      .eq("status", "pending")
      .lt("due_date", today.toISOString());

    return (invoices || []).map((invoice) => ({
      id: `overdue-payment-${invoice.id}`,
      type: "danger" as const,
      category: "payment" as const,
      title: "תשלום באיחור",
      message: `חשבונית ${invoice.invoice_number} באיחור - ₪${invoice.amount || 0}`,
      actionLabel: "צפה בחשבונית",
      actionUrl: `/invoices/${invoice.id}`,
      data: invoice,
      createdAt: new Date(),
      priority: 1,
    }));
  }, []);

  /**
   * בדיקת משימות שעברו מועד
   */
  const checkOverdueTasks = useCallback(async (): Promise<SmartAlert[]> => {
    const today = new Date();

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, due_date, clients(name), projects(name)")
      .not("due_date", "is", null)
      .lt("due_date", today.toISOString())
      .neq("status", "completed")
      .limit(20);

    return (tasks || []).map((task) => ({
      id: `overdue-task-${task.id}`,
      type: "warning" as const,
      category: "task" as const,
      title: "משימה באיחור",
      message: `${task.title} - מועד יעד: ${new Date(task.due_date).toLocaleDateString("he-IL")}`,
      actionLabel: "פתח משימה",
      actionUrl: `/tasks/${task.id}`,
      data: task,
      createdAt: new Date(),
      priority: 2,
    }));
  }, []);

  /**
   * בדיקת פגישות להיום
   */
  const checkTodayMeetings = useCallback(async (): Promise<SmartAlert[]> => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const { data: meetings } = await supabase
      .from("meetings")
      .select("id, title, start_time, clients(name)")
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString())
      .eq("status", "scheduled");

    return (meetings || []).map((meeting) => ({
      id: `today-meeting-${meeting.id}`,
      type: "info" as const,
      category: "meeting" as const,
      title: "פגישה היום",
      message: `${meeting.title} ב-${new Date(meeting.start_time).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`,
      actionLabel: "צפה בפגישה",
      actionUrl: `/meetings/${meeting.id}`,
      data: meeting,
      createdAt: new Date(),
      priority: 2,
    }));
  }, []);

  /**
   * בדיקת לידים שממתינים (7+ ימים)
   */
  const checkPendingLeads = useCallback(async (): Promise<SmartAlert[]> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: leads } = await supabase
      .from("clients")
      .select("id, name, created_at")
      .eq("status", "pending")
      .lt("created_at", sevenDaysAgo.toISOString())
      .limit(10);

    return (leads || []).map((lead) => ({
      id: `pending-lead-${lead.id}`,
      type: "warning" as const,
      category: "client" as const,
      title: "ליד ממתין",
      message: `${lead.name} ממתין למעקב 7+ ימים`,
      actionLabel: "פתח ליד",
      actionUrl: `/clients/${lead.id}`,
      data: lead,
      createdAt: new Date(),
      priority: 2,
    }));
  }, []);

  /**
   * בדיקת שלבים תקועים (14+ ימים ללא התקדמות)
   */
  const checkStuckStages = useCallback(async (): Promise<SmartAlert[]> => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: stages } = await supabase
      .from("client_stages")
      .select("id, stage_name, client_id, updated_at, clients(name)")
      .lt("updated_at", fourteenDaysAgo.toISOString())
      .limit(10);

    return (stages || []).map((stage) => ({
      id: `stuck-stage-${stage.id}`,
      type: "warning" as const,
      category: "stage" as const,
      title: "שלב תקוע",
      message: `${stage.stage_name} של ${(stage as any).clients?.name || "לקוח"} לא עודכן 14+ ימים`,
      actionLabel: "פתח לקוח",
      actionUrl: `/clients/${stage.client_id}`,
      data: stage,
      createdAt: new Date(),
      priority: 2,
    }));
  }, []);

  /**
   * בדיקת תזכורות שלא נקראו
   */
  const checkUnreadReminders = useCallback(async (): Promise<SmartAlert[]> => {
    const { data: reminders } = await supabase
      .from("reminders")
      .select("id, title, remind_at, entity_type, entity_id")
      .eq("is_dismissed", false)
      .lte("remind_at", new Date().toISOString())
      .limit(20);

    return (reminders || []).map((reminder) => ({
      id: `unread-reminder-${reminder.id}`,
      type: "info" as const,
      category: "reminder" as const,
      title: "תזכורת",
      message: reminder.title,
      actionLabel: reminder.entity_type === "client" ? "פתח לקוח" : "צפה",
      actionUrl:
        reminder.entity_type === "client"
          ? `/clients/${reminder.entity_id}`
          : undefined,
      data: reminder,
      createdAt: new Date(reminder.remind_at),
      priority: 2,
    }));
  }, []);

  /**
   * בדיקת דדליינים קרובים (7 ימים)
   */
  const checkUpcomingDeadlines = useCallback(async (): Promise<
    SmartAlert[]
  > => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const today = new Date();

    // Check client deadlines
    const { data: deadlines } = await supabase
      .from("client_deadlines")
      .select("id, title, deadline_date, client_id, clients(name)")
      .gte("deadline_date", today.toISOString())
      .lte("deadline_date", sevenDaysFromNow.toISOString())
      .eq("is_completed", false)
      .limit(20);

    return (deadlines || []).map((deadline) => {
      const daysUntil = Math.ceil(
        (new Date(deadline.deadline_date).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return {
        id: `deadline-${deadline.id}`,
        type: daysUntil <= 2 ? ("danger" as const) : ("warning" as const),
        category: "deadline" as const,
        title:
          daysUntil === 0
            ? "דדליין היום!"
            : daysUntil === 1
              ? "דדליין מחר!"
              : `דדליין בעוד ${daysUntil} ימים`,
        message: `${deadline.title} - ${(deadline as any).clients?.name || "לקוח"}`,
        actionLabel: "פתח לקוח",
        actionUrl: `/clients/${deadline.client_id}`,
        data: deadline,
        createdAt: new Date(),
        priority: daysUntil <= 2 ? 1 : 2,
      };
    });
  }, []);

  /**
   * בדיקת שלבים ללא משימות
   */
  const checkStagesWithoutTasks = useCallback(async (): Promise<
    SmartAlert[]
  > => {
    const { data: stages } = await supabase
      .from("client_stages")
      .select(
        `
        id, 
        stage_name, 
        client_id, 
        clients(name),
        client_stage_tasks(id)
      `,
      )
      .limit(50);

    const emptyStages = (stages || []).filter(
      (s) =>
        !(s as any).client_stage_tasks ||
        (s as any).client_stage_tasks.length === 0,
    );

    // Group by client to avoid too many alerts
    const clientsMap = new Map<string, { clientName: string; count: number }>();
    emptyStages.forEach((stage) => {
      const existing = clientsMap.get(stage.client_id);
      if (existing) {
        existing.count++;
      } else {
        clientsMap.set(stage.client_id, {
          clientName: (stage as any).clients?.name || "לקוח",
          count: 1,
        });
      }
    });

    return Array.from(clientsMap.entries())
      .filter(([_, data]) => data.count >= 2) // Only alert if 2+ empty stages
      .slice(0, 5)
      .map(([clientId, data]) => ({
        id: `empty-stages-${clientId}`,
        type: "info" as const,
        category: "stage" as const,
        title: "שלבים ריקים",
        message: `${data.clientName} - ${data.count} שלבים ללא משימות`,
        actionLabel: "פתח לקוח",
        actionUrl: `/clients/${clientId}`,
        data: { clientId, count: data.count },
        createdAt: new Date(),
        priority: 3,
      }));
  }, []);

  /**
   * הרצת כל הבדיקות
   */
  const runAllChecks = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [
        inactiveClients,
        projectBudgets,
        expiringContracts,
        overduePayments,
        overdueTasks,
        todayMeetings,
        pendingLeads,
        stuckStages,
        unreadReminders,
        upcomingDeadlines,
        stagesWithoutTasks,
      ] = await Promise.all([
        settings.enabledCategories.includes("client")
          ? checkInactiveClients()
          : [],
        settings.enabledCategories.includes("project")
          ? checkProjectBudgets()
          : [],
        settings.enabledCategories.includes("contract")
          ? checkExpiringContracts()
          : [],
        settings.enabledCategories.includes("payment")
          ? checkOverduePayments()
          : [],
        settings.enabledCategories.includes("task") ? checkOverdueTasks() : [],
        settings.enabledCategories.includes("meeting")
          ? checkTodayMeetings()
          : [],
        settings.enabledCategories.includes("client")
          ? checkPendingLeads()
          : [],
        settings.enabledCategories.includes("stage") ? checkStuckStages() : [],
        settings.enabledCategories.includes("reminder")
          ? checkUnreadReminders()
          : [],
        settings.enabledCategories.includes("deadline")
          ? checkUpcomingDeadlines()
          : [],
        settings.enabledCategories.includes("stage")
          ? checkStagesWithoutTasks()
          : [],
      ]);

      let allAlerts = [
        ...inactiveClients,
        ...projectBudgets,
        ...expiringContracts,
        ...overduePayments,
        ...overdueTasks,
        ...todayMeetings,
        ...pendingLeads,
        ...stuckStages,
        ...unreadReminders,
        ...upcomingDeadlines,
        ...stagesWithoutTasks,
      ];

      // Filter out dismissed alerts
      allAlerts = allAlerts.filter((alert) => !dismissedAlerts.has(alert.id));

      // מיון לפי עדיפות ותאריך
      allAlerts.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      setAlerts(allAlerts);

      // חישוב סטטיסטיקות
      const newStats: AlertStats = {
        total: allAlerts.length,
        byCategory: {},
        byType: {},
        urgent: 0,
      };

      allAlerts.forEach((alert) => {
        newStats.byCategory[alert.category] =
          (newStats.byCategory[alert.category] || 0) + 1;
        newStats.byType[alert.type] = (newStats.byType[alert.type] || 0) + 1;
        if (alert.priority === 1) {
          newStats.urgent++;
        }
      });

      setStats(newStats);
      setLastCheck(new Date());
    } catch (error) {
      console.error("Error running smart alerts checks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    user?.id,
    checkInactiveClients,
    checkProjectBudgets,
    checkExpiringContracts,
    checkOverduePayments,
    checkOverdueTasks,
    checkTodayMeetings,
    checkPendingLeads,
    checkStuckStages,
    checkUnreadReminders,
    checkUpcomingDeadlines,
    checkStagesWithoutTasks,
    settings.enabledCategories,
    dismissedAlerts,
  ]);

  /**
   * בדיקה אוטומטית לפי הגדרות
   */
  useEffect(() => {
    if (!user) return;

    // בדיקה ראשונית
    runAllChecks();

    // בדיקה לפי הגדרות (ברירת מחדל 5 דקות)
    const interval = setInterval(
      () => {
        runAllChecks();
      },
      settings.checkIntervalMinutes * 60 * 1000,
    );

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, settings.checkIntervalMinutes]);

  /**
   * התראה בדפדפן (Browser Notification)
   */
  const sendBrowserNotification = useCallback((alert: SmartAlert) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(alert.title, {
        body: alert.message,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
      });
    }
  }, []);

  /**
   * בקשת הרשאה להתראות
   */
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  return {
    alerts,
    stats,
    isLoading,
    lastCheck,
    settings,
    dismissedAlerts,
    runAllChecks,
    dismissAlert,
    clearDismissedAlerts,
    updateSettings,
    sendBrowserNotification,
    requestNotificationPermission,
  };
}
