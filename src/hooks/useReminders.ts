import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import {
  playNotificationSound,
  requestNotificationPermission as requestDesktopPermission,
  showDesktopNotification,
} from "@/services/chatNotifications";

// Activity logging helper function (no hooks)
const logToActivityLog = async (
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>,
) => {
  try {
    await supabase.from("activity_log").insert({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || null,
      ip_address: null,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

export interface Reminder {
  id: string;
  title: string;
  message: string | null;
  remind_at: string;
  reminder_type: string;
  is_sent: boolean;
  is_dismissed: boolean;
  entity_type: string | null;
  entity_id: string | null;
  user_id: string;
  created_at: string;
}

export interface ReminderInsert {
  title: string;
  message?: string | null;
  remind_at: string;
  reminder_type?: string;
  entity_type?: string | null;
  entity_id?: string | null;
  recipient_email?: string;
  recipient_phone?: string;
  is_recurring?: boolean;
  recurring_interval?: string;
}

// Decode literal unicode escapes stored in DB (e.g. \u05de → מ)
function decodeUnicode(str: string | null | undefined): string | null {
  if (!str) return str ?? null;
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

function decodeReminder(r: Reminder): Reminder {
  return {
    ...r,
    title: decodeUnicode(r.title) ?? r.title,
    message: decodeUnicode(r.message),
  };
}

// Module-level lock: prevents duplicate notifications when multiple
// hook instances run checkReminders simultaneously
let _checkInProgress = false;

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { pushAction } = useUndoRedo();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(Date.now());

  const initNotificationPermission = useCallback(async () => {
    await requestDesktopPermission();
  }, []);

  const fetchReminders = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("remind_at", { ascending: true });

    if (error) {
      console.error("Error fetching reminders:", error);
    } else {
      setReminders(((data as Reminder[]) || []).map(decodeReminder));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const createReminder = useCallback(
    async (reminder: ReminderInsert) => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("reminders")
        .insert({
          ...reminder,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating reminder:", error);
        toast({
          title: "שגיאה",
          description: "לא הצלחנו ליצור את התזכורת",
          variant: "destructive",
        });
        return null;
      }

      const createdReminder = data as Reminder;

      // Log activity
      logToActivityLog(user.id, "create", "reminders", createdReminder.id, {
        title: reminder.title,
      });

      // Add undo/redo action
      pushAction({
        type: "create_reminder",
        description: `יצירת תזכורת: ${reminder.title}`,
        undo: async () => {
          await supabase
            .from("reminders")
            .delete()
            .eq("id", createdReminder.id);
          await fetchReminders();
        },
        redo: async () => {
          await supabase
            .from("reminders")
            .insert({ ...reminder, user_id: user.id });
          await fetchReminders();
        },
      });

      toast({
        title: "התזכורת נוצרה",
        description: reminder.title,
      });

      await fetchReminders();
      return createdReminder;
    },
    [user, toast, fetchReminders, pushAction],
  );

  const dismissReminder = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("reminders")
        .update({ is_dismissed: true })
        .eq("id", id);

      if (error) {
        console.error("Error dismissing reminder:", error);
        return false;
      }

      setActiveReminders((prev) => prev.filter((r) => r.id !== id));
      await fetchReminders();
      return true;
    },
    [fetchReminders],
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      // Get original reminder data for undo
      const originalReminder = reminders.find((r) => r.id === id);

      const { error } = await supabase.from("reminders").delete().eq("id", id);

      if (error) {
        console.error("Error deleting reminder:", error);
        toast({
          title: "שגיאה",
          description: "לא הצלחנו למחוק את התזכורת",
          variant: "destructive",
        });
        return false;
      }

      // Log activity
      if (originalReminder) {
        logToActivityLog(user?.id, "delete", "reminders", id, {
          title: originalReminder.title,
        });
      }

      // Add undo/redo action if we have the original data
      if (originalReminder) {
        pushAction({
          type: "delete_reminder",
          description: `מחיקת תזכורת: ${originalReminder.title}`,
          undo: async () => {
            await supabase.from("reminders").insert({
              id: originalReminder.id,
              title: originalReminder.title,
              message: originalReminder.message,
              remind_at: originalReminder.remind_at,
              reminder_type: originalReminder.reminder_type,
              entity_type: originalReminder.entity_type,
              entity_id: originalReminder.entity_id,
              user_id: originalReminder.user_id,
              is_sent: originalReminder.is_sent,
              is_dismissed: originalReminder.is_dismissed,
            });
            await fetchReminders();
          },
          redo: async () => {
            await supabase.from("reminders").delete().eq("id", id);
            await fetchReminders();
          },
        });
      }

      toast({
        title: "התזכורת נמחקה",
      });

      await fetchReminders();
      return true;
    },
    [toast, fetchReminders, reminders, pushAction],
  );

  // Speak reminder using browser's speech synthesis
  const speakReminder = useCallback((reminder: Reminder) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        `תזכורת: ${reminder.title}. ${reminder.message || ""}`,
      );
      utterance.lang = "he-IL";
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, []);

  // Send email reminder
  const sendEmailReminder = useCallback(
    async (reminder: Reminder, userEmail: string) => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "send-reminder-email",
          {
            body: {
              to: userEmail,
              title: reminder.title,
              message: reminder.message,
            },
          },
        );

        if (error) {
          console.error("Error sending email reminder:", error);
          return false;
        }

        console.log("Email reminder sent:", data);
        return true;
      } catch (error) {
        console.error("Error sending email reminder:", error);
        return false;
      }
    },
    [],
  );

  // Check for due reminders
  const checkReminders = useCallback(async () => {
    if (!user) return;
    // Prevent concurrent execution across hook instances (race condition guard)
    if (_checkInProgress) return;
    _checkInProgress = true;
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_sent", false)
        .eq("is_dismissed", false)
        .lte("remind_at", now);

    if (!error && data && data.length > 0) {
      const newReminders = data as Reminder[];

      // Show notifications and mark as sent
      for (const reminder of newReminders) {
        // Play sound for ALL reminder types
        playNotificationSound();

        // Show desktop push notification for all types
        showDesktopNotification(
          `⏰ ${reminder.title}`,
          reminder.message || "הגיע הזמן!",
        );

        if (reminder.reminder_type === "voice") {
          speakReminder(reminder);
        }

        if (reminder.reminder_type === "email" && user.email) {
          await sendEmailReminder(reminder, user.email);
        }

        // Show toast for all types
        toast({
          title: "⏰ " + reminder.title,
          description: reminder.message || "הגיע הזמן!",
          duration: 10000,
        });

        // Mark as sent
        await supabase
          .from("reminders")
          .update({ is_sent: true })
          .eq("id", reminder.id);
      }

      // Add to active reminders for popup display
      setActiveReminders((prev) => [...prev, ...newReminders]);
      await fetchReminders();
    }
    } finally {
      _checkInProgress = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.id,
    toast,
    speakReminder,
    sendEmailReminder,
    fetchReminders,
  ]);

  // Request notification permission on mount
  useEffect(() => {
    initNotificationPermission();
  }, [initNotificationPermission]);

  // Fetch reminders on mount
  useEffect(() => {
    if (user) {
      fetchReminders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Realtime subscription: refresh + check on any DB change ──
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`reminders-realtime-${user.id}-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reminders",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchReminders();
          // Also check for due reminders immediately (catches "remind now" scenarios)
          checkReminders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Check reminders every 30 seconds + drift monitor
  useEffect(() => {
    if (!user) return;

    checkReminders();
    lastCheckRef.current = Date.now();
    checkIntervalRef.current = setInterval(() => {
      lastCheckRef.current = Date.now();
      checkReminders();
    }, 30000);

    // Drift monitor: detect missed intervals (tab sleep / background throttle)
    const driftMonitor = setInterval(() => {
      const elapsed = Date.now() - lastCheckRef.current;
      // If more than 45s since last check, interval was likely throttled — force re-check
      if (elapsed > 45000) {
        console.log("[Reminders] Drift detected, forcing re-check");
        lastCheckRef.current = Date.now();
        checkReminders();
      }
    }, 5000);

    // Also re-check when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastCheckRef.current;
        if (elapsed > 35000) {
          console.log("[Reminders] Tab visible after sleep, re-checking");
          lastCheckRef.current = Date.now();
          checkReminders();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      clearInterval(driftMonitor);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Update reminder
  const updateReminder = useCallback(
    async (id: string, updates: Partial<ReminderInsert>) => {
      try {
        const { error } = await supabase
          .from("reminders")
          .update(updates)
          .eq("id", id);

        if (error) throw error;

        await fetchReminders();
        toast({ title: "תזכורת עודכנה" });
        return true;
      } catch (error) {
        console.error("Error updating reminder:", error);
        toast({ title: "שגיאה בעדכון תזכורת", variant: "destructive" });
        return false;
      }
    },
    [fetchReminders, toast],
  );

  return {
    reminders,
    activeReminders,
    loading,
    fetchReminders,
    createReminder,
    updateReminder,
    dismissReminder,
    deleteReminder,
    requestNotificationPermission: initNotificationPermission,
  };
}
