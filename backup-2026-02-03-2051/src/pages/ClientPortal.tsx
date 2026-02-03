// Client Portal - Main Dashboard
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FolderKanban, MessageSquare, FileText, Bell, LogOut, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
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

export default function ClientPortal() {
  const { user, isClient, isLoading, clientId, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
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
      // Fetch projects for this client
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, status, priority, start_date, end_date')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      // Fetch recent messages
      const { data: messagesData } = await supabase
        .from('client_messages')
        .select('id, message, sender_type, is_read, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent files
      const { data: filesData } = await supabase
        .from('client_files')
        .select('id, file_name, uploader_type, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch project updates
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id);
        const { data: updatesData } = await supabase
          .from('project_updates')
          .select('id, title, content, created_at, project_id')
          .in('project_id', projectIds)
          .eq('visible_to_client', true)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setUpdates(updatesData || []);
      }

      setProjects(projectsData || []);
      setMessages(messagesData || []);
      setFiles(filesData || []);
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
        <div className="container flex h-16 items-center justify-between px-4 flex-row-reverse">
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex-row-reverse">
            יציאה
            <LogOut className="h-4 w-4 mr-2" />
          </Button>
          <div className="flex items-center gap-3 flex-row-reverse">
            <h1 className="text-xl font-semibold">פורטל לקוח</h1>
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TA</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client-portal/projects')}>
            <CardContent className="p-4 flex items-center gap-3 flex-row-reverse">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">פרויקטים</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client-portal/messages')}>
            <CardContent className="p-4 flex items-center gap-3 flex-row-reverse">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                <MessageSquare className="h-5 w-5 text-primary" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">הודעות</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client-portal/files')}>
            <CardContent className="p-4 flex items-center gap-3 flex-row-reverse">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{files.length}</p>
                <p className="text-sm text-muted-foreground">קבצים</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3 flex-row-reverse">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{updates.length}</p>
                <p className="text-sm text-muted-foreground">עדכונים</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-row-reverse">
            <div className="text-right">
              <CardTitle>הפרויקטים שלי</CardTitle>
              <CardDescription>סטטוס והתקדמות הפרויקטים</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/client-portal/projects')}>
              הכל
            </Button>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">אין פרויקטים להצגה</p>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 3).map(project => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 flex-row-reverse">
                    <div className="text-right">
                      <p className="font-medium">{project.name}</p>
                      {project.end_date && (
                        <p className="text-sm text-muted-foreground">
                          תאריך סיום: {format(new Date(project.end_date), 'dd/MM/yyyy', { locale: he })}
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
            <CardHeader className="text-right">
              <CardTitle>עדכונים אחרונים</CardTitle>
              <CardDescription>עדכוני סטטוס מהצוות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {updates.map(update => (
                  <div key={update.id} className="p-3 rounded-lg border text-right">
                    <div className="flex items-center justify-between mb-1 flex-row-reverse">
                      <p className="font-medium">{update.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(update.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </p>
                    </div>
                    {update.content && (
                      <p className="text-sm text-muted-foreground">{update.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
          <Button className="h-auto py-4 flex-row-reverse" onClick={() => navigate('/client-portal/messages')}>
            שלח הודעה
            <MessageSquare className="h-5 w-5 mr-2" />
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-row-reverse" onClick={() => navigate('/client-portal/files')}>
            העלה קובץ
            <FileText className="h-5 w-5 mr-2" />
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-row-reverse" onClick={() => navigate('/client-portal/projects')}>
            צפה בפרויקטים
            <FolderKanban className="h-5 w-5 mr-2" />
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <PortalNavigation unreadMessages={unreadMessages} />
    </div>
  );
}
