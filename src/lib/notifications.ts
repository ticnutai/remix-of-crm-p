// מערכת תזכורות והתראות
// ניהול התראות על תשלומים, דדליינים ופגישות

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
  | "payment_due" // תשלום מתקרב
  | "payment_overdue" // תשלום באיחור
  | "deadline" // דדליין
  | "meeting" // פגישה
  | "contract_expiry" // חוזה עומד לפוג
  | "task" // משימה
  | "system" // הודעת מערכת
  | "custom"; // מותאם אישית

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  is_read: boolean;
  is_dismissed?: boolean;
  action_url?: string | null;
  entity_type?: string;
  entity_id?: string;
  scheduled_for?: string;
  sent_at?: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  action_url?: string;
  entity_type?: string;
  entity_id?: string;
  scheduled_for?: string;
  metadata?: Record<string, any>;
}

// אפשרויות סנוז (בדקות)
export const SNOOZE_OPTIONS = [
  { label: "5 דקות", minutes: 5 },
  { label: "15 דקות", minutes: 15 },
  { label: "30 דקות", minutes: 30 },
  { label: "שעה", minutes: 60 },
  { label: "3 שעות", minutes: 180 },
  { label: "מחר", minutes: 1440 },
] as const;

// תרגום סוגי התראות
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  payment_due: "תשלום מתקרב",
  payment_overdue: "תשלום באיחור",
  deadline: "דדליין",
  meeting: "פגישה",
  contract_expiry: "חוזה עומד לפוג",
  task: "משימה",
  system: "הודעת מערכת",
  custom: "התראה",
};

// צבעים לפי עדיפות
export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

// אייקונים לפי סוג
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  payment_due: "💰",
  payment_overdue: "⚠️",
  deadline: "📅",
  meeting: "🗓️",
  contract_expiry: "📄",
  task: "✅",
  system: "🔔",
  custom: "📌",
};

// ============================================================================
// API Functions
// ============================================================================

// יצירת התראה חדשה
export async function createNotification(
  data: CreateNotificationData,
): Promise<Notification | null> {
  try {
    // שמירת entity_type/entity_id/priority ב-metadata לצורך סנכרון
    const metadata: Record<string, any> = { ...data.metadata };
    if (data.entity_type) metadata.entity_type = data.entity_type;
    if (data.entity_id) metadata.entity_id = data.entity_id;
    if (data.priority) metadata.priority = data.priority;

    const { data: result, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          message: data.message,
          action_url: data.action_url,
          is_read: false,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return result as unknown as Notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
}

// שליפת התראות למשתמש
export async function getNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    type?: NotificationType;
  } = {},
): Promise<Notification[]> {
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (options.unreadOnly) {
      query = query.eq("is_read", false);
    }
    if (options.type) {
      query = query.eq("type", options.type as string);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    // שחזור priority ו-entity מ-metadata כי אין להם עמודות ב-DB
    return (data || []).map((n: any) => {
      const meta = n.metadata as Record<string, any> | null;
      return {
        ...n,
        priority: meta?.priority || "medium",
        entity_type: meta?.entity_type,
        entity_id: meta?.entity_id,
      } as Notification;
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
}

// סימון כנקראה
export async function markAsRead(notificationId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
}

// סימון הכל כנקרא
export async function markAllAsRead(userId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

// מחיקת התראה (סימון כנמחק)
export async function dismissNotification(
  notificationId: string,
): Promise<void> {
  // Since is_dismissed doesn't exist in the table, we delete the notification instead
  await supabase.from("notifications").delete().eq("id", notificationId);
}

// ספירת התראות שלא נקראו
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error counting unread notifications:", error);
      return 0;
    }
    return data?.length || 0;
  } catch (err) {
    console.error("Error in getUnreadCount:", err);
    return 0;
  }
}

// סנוז התראה - עדכון metadata עם זמן סנוז
export async function snoozeNotification(
  notificationId: string,
  minutes: number,
): Promise<void> {
  const snoozeUntil = new Date();
  snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

  await supabase
    .from("notifications")
    .update({
      is_read: true,
      metadata: {
        snoozed: true,
        snooze_until: snoozeUntil.toISOString(),
        snooze_minutes: minutes,
      },
    })
    .eq("id", notificationId);
}

// עדכון התראה
export async function updateNotification(
  notificationId: string,
  updates: { title?: string; message?: string },
): Promise<void> {
  await supabase.from("notifications").update(updates).eq("id", notificationId);
}

// ביטול תזכורת לישות (פגישה/משימה) - מסנכרן בכל המקומות
// מוחק את ההתראה + מסמן reminders קשורים כ-dismissed
export async function dismissEntityReminders(
  userId: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  // 1. מחיקת notifications שמקושרים לישות
  const { data: notifs } = await supabase
    .from("notifications")
    .select("id, metadata")
    .eq("user_id", userId);

  if (notifs) {
    const relatedIds = notifs
      .filter((n) => {
        const meta = n.metadata as Record<string, any> | null;
        return meta?.entity_type === entityType && meta?.entity_id === entityId;
      })
      .map((n) => n.id);

    if (relatedIds.length > 0) {
      await supabase.from("notifications").delete().in("id", relatedIds);
    }
  }

  // 2. סימון reminders קשורים כ-dismissed
  await supabase
    .from("reminders")
    .update({ is_dismissed: true })
    .eq("user_id", userId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
}

// ============================================================================
// תזכורות אוטומטיות
// ============================================================================

// בדיקת תשלומים קרובים
export async function checkUpcomingPayments(userId: string): Promise<void> {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // שליפת תשלומים שמועד פירעון בשבוע הקרוב
  const { data: payments } = await supabase
    .from("payment_schedules")
    .select(
      `
      *,
      contracts (
        id,
        title,
        client_id,
        clients (name)
      )
    `,
    )
    .eq("status", "pending")
    .gte("due_date", today.toISOString().split("T")[0])
    .lte("due_date", nextWeek.toISOString().split("T")[0]);

  if (!payments?.length) return;

  for (const payment of payments) {
    const daysUntil = Math.ceil(
      (new Date(payment.due_date).getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    await createNotification({
      user_id: userId,
      type: "payment_due",
      title: `תשלום מתקרב - ${(payment as any).contracts?.clients?.name}`,
      message: `תשלום של ₪${payment.amount?.toLocaleString("he-IL")} צפוי בעוד ${daysUntil} ימים`,
      priority: daysUntil <= 2 ? "high" : "medium",
      action_url: `/contracts/${(payment as any).contracts?.id}`,
      entity_type: "payment",
      entity_id: payment.id,
    });
  }
}

// בדיקת תשלומים באיחור
export async function checkOverduePayments(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const { data: payments } = await supabase
    .from("payment_schedules")
    .select(
      `
      *,
      contracts (
        id,
        title,
        client_id,
        clients (name)
      )
    `,
    )
    .eq("status", "pending")
    .lt("due_date", today);

  if (!payments?.length) return;

  for (const payment of payments) {
    const daysOverdue = Math.ceil(
      (new Date().getTime() - new Date(payment.due_date).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    await createNotification({
      user_id: userId,
      type: "payment_overdue",
      title: `⚠️ תשלום באיחור - ${(payment as any).contracts?.clients?.name}`,
      message: `תשלום של ₪${payment.amount?.toLocaleString("he-IL")} באיחור של ${daysOverdue} ימים`,
      priority: "urgent",
      action_url: `/contracts/${(payment as any).contracts?.id}`,
      entity_type: "payment",
      entity_id: payment.id,
    });
  }
}

// בדיקת חוזים שעומדים לפוג
export async function checkExpiringContracts(userId: string): Promise<void> {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setDate(nextMonth.getDate() + 30);

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*, clients (name)")
    .in("status", ["active", "pending"])
    .gte("end_date", today.toISOString().split("T")[0])
    .lte("end_date", nextMonth.toISOString().split("T")[0]);

  if (!contracts?.length) return;

  for (const contract of contracts) {
    const daysUntil = Math.ceil(
      (new Date(contract.end_date!).getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    await createNotification({
      user_id: userId,
      type: "contract_expiry",
      title: `חוזה עומד לפוג - ${(contract as any).clients?.name}`,
      message: `החוזה "${contract.title}" יסתיים בעוד ${daysUntil} ימים`,
      priority: daysUntil <= 7 ? "high" : "medium",
      action_url: `/contracts/${contract.id}`,
      entity_type: "contract",
      entity_id: contract.id,
    });
  }
}

// הפעלת כל הבדיקות
export async function runAllChecks(userId: string): Promise<void> {
  await Promise.all([
    checkUpcomingPayments(userId),
    checkOverduePayments(userId),
    checkExpiringContracts(userId),
  ]);
}
