// Client Portal - Main Dashboard
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FolderKanban, MessageSquare, FileText, Bell, LogOut, CheckCircle, Clock, AlertCircle, CalendarDays, Settings, CreditCard } from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import PortalNavigation from '@/components/client-portal/PortalNavigation';

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  start_date: string | null;
  end_date: string | null;
}

interface Message {
  id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

interface ClientFile {
  id: string;
  file_name: string;
  uploader_type: string;
  created_at: string;
}

interface ProjectUpdate {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  project_id: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
}

interface Notification {
  id: string;
  title: string;
  is_read: boolean;
}

export default function ClientPortal() {
  const { user, isClient, isLoading, clientId, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    } else if (!isLoading && user && !isClient) {
      navigate('/');
    }
  }, [isLoading, user, isClient, navigate]);

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  const fetchData = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const [projectsRes, messagesRes, filesRes, meetingsRes, notificationsRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, status, priority, start_date, end_date')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('client_messages')
          .select('id, message, sender_type, is_read, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('client_files')
          .select('id, file_name, uploader_type, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('calendar_events')
          .select('id, title, start_time, end_time, location')
          .eq('client_id', clientId)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(3),
        supabase
          .from('client_notifications')
          .select('id, title, is_read')
          .eq('client_id', clientId)
          .eq('is_read', false)
          .limit(10),
      ]);

      setProjects(projectsRes.data || []);
      setMessages(messagesRes.data || []);
      setFiles(filesRes.data || []);
      setUpcomingMeetings(meetingsRes.data || []);
      setNotifications(notificationsRes.data || []);

      // Fetch project updates
      if (projectsRes.data && projectsRes.data.length > 0) {
        const projectIds = projectsRes.data.map(p => p.id);
        const { data: updatesData } = await supabase
          .from('project_updates')
          .select('id, title, content, created_at, project_id')
          .in('project_id', projectIds)
          .eq('visible_to_client', true)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setUpdates(updatesData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'planning': { label: 'תכנון', variant: 'outline' },
      'active': { label: 'פעיל', variant: 'default' },
      'on_hold': { label: 'בהמתנה', variant: 'secondary' },
      'completed': { label: 'הושלם', variant: 'default' },
      'cancelled': { label: 'בוטל', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const unreadMessages = messages.filter(m => !m.is_read && m.sender_type === 'staff').length;
  const unreadNotifications = notifications.length;

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/client-portal/settings')}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 ml-1" />
              יציאה
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-lg font-semibold">שלום, {profile?.full_name || 'לקוח'} 👋</h1>
              <p className="text-xs text-muted-foreground">ברוך הבא לפורטל הלקוח</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {(profile?.full_name || '?')[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 space-y-5">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client-portal/projects')}>
            <CardContent className="p-3 text-center">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                <FolderKanban className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="text-xl font-bold">{projects.length}</p>
              <p className="text-[10px] text-muted-foreground">תיקים</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client-portal/messages')}>
            <CardContent className="p-3 text-center relative">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1 relative">
                <MessageSquare className="h-4.5 w-4.5 text-primary" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold">{messages.length}</p>
              <p className="text-[10px] text-muted-foreground">הודעות</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client-portal/files')}>
            <CardContent className="p-3 text-center">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                <FileText className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="text-xl font-bold">{files.length}</p>
              <p className="text-[10px] text-muted-foreground">קבצים</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client-portal/meetings')}>
            <CardContent className="p-3 text-center">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                <CalendarDays className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="text-xl font-bold">{upcomingMeetings.length}</p>
              <p className="text-[10px] text-muted-foreground">פגישות</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client-portal/notifications')}>
            <CardContent className="p-3 text-center relative">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1 relative">
                <Bell className="h-4.5 w-4.5 text-primary" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold">{unreadNotifications}</p>
              <p className="text-[10px] text-muted-foreground">התראות</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                <AlertCircle className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="text-xl font-bold">{updates.length}</p>
              <p className="text-[10px] text-muted-foreground">עדכונים</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Meetings */}
        {upcomingMeetings.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="text-right">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  פגישות קרובות
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/client-portal/meetings')}>
                הכל
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(meeting.start_time), 'EEEE dd/MM, HH:mm', { locale: he })}
                      </p>
                    </div>
                    {isToday(new Date(meeting.start_time)) && (
                      <Badge variant="default" className="text-xs">היום</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="text-right">
              <CardTitle className="text-base">הפרויקטים שלי</CardTitle>
              <CardDescription className="text-xs">סטטוס והתקדמות</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/client-portal/projects')}>
              הכל
            </Button>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">אין פרויקטים להצגה</p>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 3).map(project => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{project.name}</p>
                      {project.end_date && (
                        <p className="text-xs text-muted-foreground">
                          סיום: {format(new Date(project.end_date), 'dd/MM/yyyy', { locale: he })}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(project.status || 'planning')}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Updates */}
        {updates.length > 0 && (
          <Card>
            <CardHeader className="text-right pb-2">
              <CardTitle className="text-base">עדכונים אחרונים</CardTitle>
              <CardDescription className="text-xs">עדכוני סטטוס מהצוות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {updates.map(update => (
                  <div key={update.id} className="p-3 rounded-lg border text-right">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{update.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(update.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </p>
                    </div>
                    {update.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{update.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-20">
          <Button className="h-auto py-3" onClick={() => navigate('/client-portal/messages')}>
            <MessageSquare className="h-4 w-4 ml-1" />
            שלח הודעה
          </Button>
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate('/client-portal/files')}>
            <FileText className="h-4 w-4 ml-1" />
            העלה קובץ
          </Button>
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate('/client-portal/meetings')}>
            <CalendarDays className="h-4 w-4 ml-1" />
            בקש פגישה
          </Button>
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate('/client-portal/payments')}>
            <CreditCard className="h-4 w-4 ml-1" />
            תשלומים
          </Button>
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate('/client-portal/projects')}>
            <FolderKanban className="h-4 w-4 ml-1" />
            צפה בתיקים
          </Button>
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate('/client-portal/settings')}>
            <Settings className="h-4 w-4 ml-1" />
            הגדרות
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <PortalNavigation />
    </div>
  );
}
