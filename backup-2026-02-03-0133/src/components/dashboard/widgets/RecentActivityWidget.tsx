// Widget: Recent Activity - פעילות אחרונה
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity,
  UserPlus,
  FolderPlus,
  FileText,
  Receipt,
  CheckCircle,
  MessageSquare,
  Upload,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'client' | 'project' | 'quote' | 'invoice' | 'task' | 'message' | 'file' | 'time_entry';
  action: 'created' | 'updated' | 'completed' | 'sent';
  title: string;
  description?: string;
  created_at: string;
  user_name?: string;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  client: <UserPlus className="h-4 w-4" />,
  project: <FolderPlus className="h-4 w-4" />,
  quote: <FileText className="h-4 w-4" />,
  invoice: <Receipt className="h-4 w-4" />,
  task: <CheckCircle className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  file: <Upload className="h-4 w-4" />,
  time_entry: <Clock className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  client: 'bg-blue-100 text-blue-600',
  project: 'bg-purple-100 text-purple-600',
  quote: 'bg-green-100 text-green-600',
  invoice: 'bg-orange-100 text-orange-600',
  task: 'bg-pink-100 text-pink-600',
  message: 'bg-cyan-100 text-cyan-600',
  file: 'bg-gray-100 text-gray-600',
  time_entry: 'bg-amber-100 text-amber-600',
};

const ACTION_LABELS: Record<string, string> = {
  created: 'נוצר',
  updated: 'עודכן',
  completed: 'הושלם',
  sent: 'נשלח',
};

const TYPE_LABELS: Record<string, string> = {
  client: 'לקוח',
  project: 'פרויקט',
  quote: 'הצעת מחיר',
  invoice: 'חשבונית',
  task: 'משימה',
  message: 'הודעה',
  file: 'קובץ',
  time_entry: 'רשומת זמן',
};

export function RecentActivityWidget() {
  const navigate = useNavigate();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['recent_activity'],
    queryFn: async () => {
      // Fetch recent items from multiple tables
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const [clients, projects, quotes, tasks, invoices] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name, created_at')
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('projects')
          .select('id, name, created_at, updated_at')
          .gte('updated_at', oneDayAgo.toISOString())
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('quotes')
          .select('id, quote_number, status, created_at, updated_at')
          .gte('updated_at', oneDayAgo.toISOString())
          .order('updated_at', { ascending: false })
          .limit(5),
        (supabase as any)
          .from('tasks')
          .select('id, title, status, created_at, updated_at')
          .gte('updated_at', oneDayAgo.toISOString())
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('invoices')
          .select('id, invoice_number, status, created_at')
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const activityItems: ActivityItem[] = [];

      // Process clients
      clients.data?.forEach((c: any) => {
        activityItems.push({
          id: `client-${c.id}`,
          type: 'client',
          action: 'created',
          title: c.name,
          created_at: c.created_at,
        });
      });

      // Process projects
      projects.data?.forEach((p: any) => {
        activityItems.push({
          id: `project-${p.id}`,
          type: 'project',
          action: p.created_at === p.updated_at ? 'created' : 'updated',
          title: p.name,
          created_at: p.updated_at,
        });
      });

      // Process quotes
      quotes.data?.forEach((q: any) => {
        activityItems.push({
          id: `quote-${q.id}`,
          type: 'quote',
          action: q.status === 'sent' ? 'sent' : q.created_at === q.updated_at ? 'created' : 'updated',
          title: `הצעה #${q.quote_number}`,
          created_at: q.updated_at,
        });
      });

      // Process tasks
      tasks.data?.forEach((t: any) => {
        activityItems.push({
          id: `task-${t.id}`,
          type: 'task',
          action: t.status === 'done' ? 'completed' : t.created_at === t.updated_at ? 'created' : 'updated',
          title: t.title,
          created_at: t.updated_at,
        });
      });

      // Process invoices
      invoices.data?.forEach((i: any) => {
        activityItems.push({
          id: `invoice-${i.id}`,
          type: 'invoice',
          action: 'created',
          title: `חשבונית #${i.invoice_number}`,
          created_at: i.created_at,
        });
      });

      // Sort by date
      return activityItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 15);
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const handleClick = (activity: ActivityItem) => {
    const typeRoutes: Record<string, string> = {
      client: '/clients',
      project: '/projects',
      quote: '/quotes',
      invoice: '/finance',
      task: '/tasks',
    };
    const route = typeRoutes[activity.type];
    if (route) navigate(route);
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          פעילות אחרונה
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/activity')}>
          צפה בכל
          <ExternalLink className="h-3 w-3 mr-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-4">טוען...</div>
        ) : activities.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            אין פעילות אחרונה
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleClick(activity)}
                >
                  <div className={`p-2 rounded-full ${ACTIVITY_COLORS[activity.type]}`}>
                    {ACTIVITY_ICONS[activity.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {activity.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{TYPE_LABELS[activity.type]} {ACTION_LABELS[activity.action]}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(activity.created_at), { 
                          addSuffix: true, 
                          locale: he 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivityWidget;
