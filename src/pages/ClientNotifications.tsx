// Client Portal - Notifications & Reminders Page
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, BellOff, CheckCheck, Info, AlertTriangle, MessageSquare, CalendarDays, FileText, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import PortalNavigation from '@/components/client-portal/PortalNavigation';

interface ClientNotification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export default function ClientNotifications() {
  const { user, isClient, isLoading, clientId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
    else if (!isLoading && user && !isClient) navigate('/');
  }, [isLoading, user, isClient, navigate]);

  useEffect(() => {
    if (clientId) fetchNotifications();
  }, [clientId]);

  // Realtime subscription for live notification updates
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('client-notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'client_notifications',
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as ClientNotification, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'client_notifications',
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        setNotifications(prev =>
          prev.map(n => n.id === (payload.new as ClientNotification).id ? payload.new as ClientNotification : n)
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'client_notifications',
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        setNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const fetchNotifications = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_notifications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('client_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!clientId) return;
    await supabase
      .from('client_notifications')
      .update({ is_read: true })
      .eq('client_id', clientId)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast({ title: 'כל ההתראות סומנו כנקראו' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'meeting': return <CalendarDays className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'meeting': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'file': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'warning': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">התראות</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount} חדשות</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 ml-1" />
              סמן הכל כנקרא
            </Button>
          )}
        </div>
      </header>

      <main className="container px-4 py-4 space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">אין התראות</p>
              <p className="text-xs text-muted-foreground mt-1">כאן יופיעו עדכונים מהצוות</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.is_read ? 'border-primary/30 bg-primary/5' : ''
                }`}
                onClick={() => {
                  if (!notification.is_read) markAsRead(notification.id);
                  if (notification.action_url) navigate(notification.action_url);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                        </div>
                        {!notification.is_read && (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: he })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <PortalNavigation />
    </div>
  );
}
