// Auto Reminders System – Configurable reminders for inactive clients
// מערכת תזכורות אוטומטיות – תזכורות מותאמות ללקוחות לא פעילים

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";

export interface ReminderConfig {
  enabled: boolean;
  thresholds: ReminderThreshold[];
  checkIntervalMinutes: number;
  enableBrowserNotifications: boolean;
  enableInAppAlerts: boolean;
  mutedClientIds: string[];
}

export interface ReminderThreshold {
  days: number;
  label: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface ClientReminder {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  daysSinceActivity: number;
  threshold: ReminderThreshold;
  lastNotified?: Date;
}

const DEFAULT_THRESHOLDS: ReminderThreshold[] = [
  {
    days: 14,
    label: "שבועיים",
    severity: "info",
    message: "לקוח ללא פעילות 14 יום - מומלץ ליצור קשר",
  },
  {
    days: 30,
    label: "חודש",
    severity: "warning",
    message: "לקוח ללא פעילות חודש - דורש תשומת לב",
  },
  {
    days: 60,
    label: "חודשיים",
    severity: "warning",
    message: "לקוח ללא פעילות חודשיים - סכנת נטישה",
  },
  {
    days: 90,
    label: "רבעון",
    severity: "critical",
    message: "לקוח ללא פעילות 3 חודשים - קריטי!",
  },
];

const STORAGE_KEY = "auto_reminders_config";
const NOTIFIED_KEY = "auto_reminders_notified";

function loadConfig(): ReminderConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    enabled: true,
    thresholds: DEFAULT_THRESHOLDS,
    checkIntervalMinutes: 60,
    enableBrowserNotifications: false,
    enableInAppAlerts: true,
    mutedClientIds: [],
  };
}

function saveConfig(config: ReminderConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function loadNotified(): Record<string, number> {
  try {
    const saved = localStorage.getItem(NOTIFIED_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

function saveNotified(notified: Record<string, number>) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
}

export function useAutoReminders() {
  const [config, setConfig] = useState<ReminderConfig>(loadConfig);
  const [reminders, setReminders] = useState<ClientReminder[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const updateConfig = useCallback((updates: Partial<ReminderConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  const addThreshold = useCallback((threshold: ReminderThreshold) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        thresholds: [...prev.thresholds, threshold].sort(
          (a, b) => a.days - b.days,
        ),
      };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  const removeThreshold = useCallback((days: number) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        thresholds: prev.thresholds.filter((t) => t.days !== days),
      };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  const muteClient = useCallback((clientId: string) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        mutedClientIds: [...new Set([...prev.mutedClientIds, clientId])],
      };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  const unmuteClient = useCallback((clientId: string) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        mutedClientIds: prev.mutedClientIds.filter((id) => id !== clientId),
      };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;

    if (Notification.permission === "granted") return true;

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }, []);

  const sendBrowserNotification = useCallback((reminder: ClientReminder) => {
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;

    new Notification(`תזכורת: ${reminder.clientName}`, {
      body: reminder.threshold.message,
      icon: "/icons/icon.svg",
      tag: `reminder-${reminder.clientId}`,
      dir: "rtl",
      lang: "he",
    });
  }, []);

  const checkReminders = useCallback(async () => {
    if (!config.enabled || isChecking) return;

    setIsChecking(true);

    try {
      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, name, phone, email, status, created_at");

      if (clientsError) throw clientsError;

      // Fetch recent activities
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("client_id, start_time")
        .order("start_time", { ascending: false });

      const { data: tasks } = await supabase
        .from("tasks")
        .select("client_id, updated_at");

      // Calculate last activity per client
      const lastActivity = new Map<string, Date>();

      for (const entry of timeEntries || []) {
        if (entry.client_id) {
          const date = new Date(entry.start_time);
          const current = lastActivity.get(entry.client_id);
          if (!current || date > current)
            lastActivity.set(entry.client_id, date);
        }
      }

      for (const task of tasks || []) {
        if (task.client_id) {
          const date = new Date(task.updated_at);
          const current = lastActivity.get(task.client_id);
          if (!current || date > current)
            lastActivity.set(task.client_id, date);
        }
      }

      const now = new Date();
      const notified = loadNotified();
      const newReminders: ClientReminder[] = [];

      for (const client of clients || []) {
        if (client.status === "inactive") continue;
        if (config.mutedClientIds.includes(client.id)) continue;

        const activity =
          lastActivity.get(client.id) || new Date(client.created_at);
        const daysSince = differenceInDays(now, activity);

        // Find the highest matching threshold
        const matchingThreshold = [...config.thresholds]
          .reverse()
          .find((t) => daysSince >= t.days);

        if (matchingThreshold) {
          const reminderKey = `${client.id}-${matchingThreshold.days}`;
          const lastNotifiedTime = notified[reminderKey];

          // Only notify once per day per threshold
          const shouldNotify =
            !lastNotifiedTime ||
            Date.now() - lastNotifiedTime > 24 * 60 * 60 * 1000;

          const reminder: ClientReminder = {
            clientId: client.id,
            clientName: client.name || "ללא שם",
            clientPhone: client.phone,
            clientEmail: client.email,
            daysSinceActivity: daysSince,
            threshold: matchingThreshold,
            lastNotified: lastNotifiedTime
              ? new Date(lastNotifiedTime)
              : undefined,
          };

          newReminders.push(reminder);

          if (shouldNotify) {
            notified[reminderKey] = Date.now();

            if (config.enableBrowserNotifications) {
              sendBrowserNotification(reminder);
            }

            if (config.enableInAppAlerts && !lastNotifiedTime) {
              toast({
                title: `⏰ ${reminder.clientName}`,
                description: matchingThreshold.message,
                variant:
                  matchingThreshold.severity === "critical"
                    ? "destructive"
                    : "default",
              });
            }
          }
        }
      }

      saveNotified(notified);
      setReminders(
        newReminders.sort((a, b) => b.daysSinceActivity - a.daysSinceActivity),
      );
    } catch (err) {
      console.error("[AutoReminders] Error checking reminders:", err);
    } finally {
      setIsChecking(false);
    }
  }, [config, isChecking, toast, sendBrowserNotification]);

  // Auto-check on mount and interval
  useEffect(() => {
    if (!config.enabled) return;

    // Check immediately
    checkReminders();

    // Set up interval
    intervalRef.current = setInterval(
      checkReminders,
      config.checkIntervalMinutes * 60 * 1000,
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.enabled, config.checkIntervalMinutes]);

  return {
    config,
    reminders,
    isChecking,
    updateConfig,
    addThreshold,
    removeThreshold,
    muteClient,
    unmuteClient,
    checkReminders,
    requestNotificationPermission,
    criticalCount: reminders.filter((r) => r.threshold.severity === "critical")
      .length,
    warningCount: reminders.filter((r) => r.threshold.severity === "warning")
      .length,
    totalCount: reminders.length,
  };
}
