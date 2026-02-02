// Push Notifications Service - tenarch CRM Pro
// שירות התראות Push עם תמיכה ב-Web Push API

import { supabase } from '@/integrations/supabase/client';

// VAPID public key - generate your own for production
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Check if push notifications are supported
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported');
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    // Save subscription to database (using any to bypass type checking for tables not in schema)
    const { error } = await (supabase as any).from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: JSON.stringify(subscription.toJSON().keys),
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,endpoint',
    });

    if (error) {
      console.error('Failed to save push subscription:', error);
    }

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      // Remove from database (using any to bypass type checking)
      await (supabase as any).from('push_subscriptions').delete().match({
        user_id: userId,
        endpoint: subscription.endpoint,
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
}

// Show local notification (without push server)
export function showLocalNotification(payload: PushNotificationPayload): void {
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  const notification = new Notification(payload.title, {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-96x96.png',
    tag: payload.tag,
    data: payload.data,
  });

  notification.onclick = () => {
    window.focus();
    if (payload.data?.url) {
      window.location.href = payload.data.url;
    }
    notification.close();
  };
}

// Schedule a local notification
export function scheduleNotification(
  payload: PushNotificationPayload,
  delayMs: number
): NodeJS.Timeout {
  return setTimeout(() => {
    showLocalNotification(payload);
  }, delayMs);
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Notification types for the CRM
export type CRMNotificationType = 
  | 'task_due'
  | 'meeting_reminder'
  | 'client_inactive'
  | 'quote_expiring'
  | 'invoice_overdue'
  | 'new_message'
  | 'workflow_triggered';

// Create CRM-specific notifications
export function createCRMNotification(
  type: CRMNotificationType,
  data: Record<string, any>
): PushNotificationPayload {
  const notifications: Record<CRMNotificationType, () => PushNotificationPayload> = {
    task_due: () => ({
      title: '⏰ משימה מתקרבת',
      body: `המשימה "${data.title}" צריכה להסתיים היום`,
      tag: `task-${data.id}`,
      data: { url: '/tasks-meetings', type: 'task', id: data.id },
    }),
    meeting_reminder: () => ({
      title: '📅 תזכורת לפגישה',
      body: `הפגישה "${data.title}" מתחילה בעוד ${data.minutes} דקות`,
      tag: `meeting-${data.id}`,
      data: { url: '/calendar', type: 'meeting', id: data.id },
    }),
    client_inactive: () => ({
      title: '👤 לקוח לא פעיל',
      body: `הלקוח "${data.name}" לא היה פעיל ${data.days} ימים`,
      tag: `client-${data.id}`,
      data: { url: `/clients/${data.id}`, type: 'client', id: data.id },
    }),
    quote_expiring: () => ({
      title: '📋 הצעת מחיר פגה',
      body: `ההצעה "${data.quote_number}" פגה בעוד ${data.days} ימים`,
      tag: `quote-${data.id}`,
      data: { url: '/quotes', type: 'quote', id: data.id },
    }),
    invoice_overdue: () => ({
      title: '💰 חשבונית באיחור',
      body: `החשבונית "${data.invoice_number}" באיחור של ${data.days} ימים`,
      tag: `invoice-${data.id}`,
      data: { url: '/finance', type: 'invoice', id: data.id },
    }),
    new_message: () => ({
      title: '💬 הודעה חדשה',
      body: `${data.from}: ${data.preview}`,
      tag: `message-${data.id}`,
      data: { url: '/messages', type: 'message', id: data.id },
    }),
    workflow_triggered: () => ({
      title: '⚡ אוטומציה הופעלה',
      body: `האוטומציה "${data.name}" בוצעה בהצלחה`,
      tag: `workflow-${data.id}`,
      data: { url: '/workflows', type: 'workflow', id: data.id },
    }),
  };

  return notifications[type]();
}

// Hook for managing push notifications in React
export function usePushNotifications(userId: string | undefined) {
  const subscribe = async () => {
    if (!userId) return null;
    return subscribeToPushNotifications(userId);
  };

  const unsubscribe = async () => {
    if (!userId) return false;
    return unsubscribeFromPushNotifications(userId);
  };

  const notify = (type: CRMNotificationType, data: Record<string, any>) => {
    const payload = createCRMNotification(type, data);
    showLocalNotification(payload);
  };

  return {
    isSupported: isPushNotificationSupported(),
    permission: getNotificationPermission(),
    requestPermission: requestNotificationPermission,
    subscribe,
    unsubscribe,
    notify,
    showLocalNotification,
    scheduleNotification,
  };
}
