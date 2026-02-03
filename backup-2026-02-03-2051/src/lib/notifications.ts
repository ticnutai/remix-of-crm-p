// מערכת תזכורות והתראות
// ניהול התראות על תשלומים, דדליינים ופגישות

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 
  | 'payment_due'      // תשלום מתקרב
  | 'payment_overdue'  // תשלום באיחור
  | 'deadline'         // דדליין
  | 'meeting'          // פגישה
  | 'contract_expiry'  // חוזה עומד לפוג
  | 'task'             // משימה
  | 'system'           // הודעת מערכת
  | 'custom';          // מותאם אישית

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

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
}

// תרגום סוגי התראות
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  payment_due: 'תשלום מתקרב',
  payment_overdue: 'תשלום באיחור',
  deadline: 'דדליין',
  meeting: 'פגישה',
  contract_expiry: 'חוזה עומד לפוג',
  task: 'משימה',
  system: 'הודעת מערכת',
  custom: 'התראה',
};

// צבעים לפי עדיפות
export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

// אייקונים לפי סוג
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  payment_due: '💰',
  payment_overdue: '⚠️',
  deadline: '📅',
  meeting: '🗓️',
  contract_expiry: '📄',
  task: '✅',
  system: '🔔',
  custom: '📌',
};

// ============================================================================
// API Functions
// ============================================================================

// יצירת התראה חדשה
export async function createNotification(data: CreateNotificationData): Promise<Notification | null> {
  try {
    const { data: result, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        action_url: data.action_url,
        is_read: false,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return result as unknown as Notification;
  } catch (err) {
    console.error('Error creating notification:', err);
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
  } = {}
): Promise<Notification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (options.unreadOnly) {
      query = query.eq('is_read', false);
    }
    if (options.type) {
      query = query.eq('type', options.type as string);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as Notification[];
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

// סימון כנקראה
export async function markAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

// סימון הכל כנקרא
export async function markAllAsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

// מחיקת התראה (סימון כנמחק)
export async function dismissNotification(notificationId: string): Promise<void> {
  // Since is_dismissed doesn't exist in the table, we delete the notification instead
  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
}

// ספירת התראות שלא נקראו
export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await (supabase as any)
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  return count || 0;
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
    .from('payment_schedules')
    .select(`
      *,
      contracts (
        id,
        title,
        client_id,
        clients (name)
      )
    `)
    .eq('status', 'pending')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', nextWeek.toISOString().split('T')[0]);
  
  if (!payments?.length) return;
  
  for (const payment of payments) {
    const daysUntil = Math.ceil(
      (new Date(payment.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    await createNotification({
      user_id: userId,
      type: 'payment_due',
      title: `תשלום מתקרב - ${(payment as any).contracts?.clients?.name}`,
      message: `תשלום של ₪${payment.amount?.toLocaleString('he-IL')} צפוי בעוד ${daysUntil} ימים`,
      priority: daysUntil <= 2 ? 'high' : 'medium',
      action_url: `/contracts/${(payment as any).contracts?.id}`,
      entity_type: 'payment',
      entity_id: payment.id,
    });
  }
}

// בדיקת תשלומים באיחור
export async function checkOverduePayments(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: payments } = await supabase
    .from('payment_schedules')
    .select(`
      *,
      contracts (
        id,
        title,
        client_id,
        clients (name)
      )
    `)
    .eq('status', 'pending')
    .lt('due_date', today);
  
  if (!payments?.length) return;
  
  for (const payment of payments) {
    const daysOverdue = Math.ceil(
      (new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    await createNotification({
      user_id: userId,
      type: 'payment_overdue',
      title: `⚠️ תשלום באיחור - ${(payment as any).contracts?.clients?.name}`,
      message: `תשלום של ₪${payment.amount?.toLocaleString('he-IL')} באיחור של ${daysOverdue} ימים`,
      priority: 'urgent',
      action_url: `/contracts/${(payment as any).contracts?.id}`,
      entity_type: 'payment',
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
    .from('contracts')
    .select('*, clients (name)')
    .in('status', ['active', 'pending'])
    .gte('end_date', today.toISOString().split('T')[0])
    .lte('end_date', nextMonth.toISOString().split('T')[0]);
  
  if (!contracts?.length) return;
  
  for (const contract of contracts) {
    const daysUntil = Math.ceil(
      (new Date(contract.end_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    await createNotification({
      user_id: userId,
      type: 'contract_expiry',
      title: `חוזה עומד לפוג - ${(contract as any).clients?.name}`,
      message: `החוזה "${contract.title}" יסתיים בעוד ${daysUntil} ימים`,
      priority: daysUntil <= 7 ? 'high' : 'medium',
      action_url: `/contracts/${contract.id}`,
      entity_type: 'contract',
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
