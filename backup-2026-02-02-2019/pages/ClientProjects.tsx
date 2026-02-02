// Client Portal - Projects Page
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowRight, Calendar, DollarSign, Clock } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { he } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
}

interface ProjectUpdate {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  project_id: string;
}

export default function ClientProjects() {
  const { user, isClient, isLoading, clientId } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [updates, setUpdates] = useState<Record<string, ProjectUpdate[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    } else if (!isLoading && user && !isClient) {
      navigate('/');
    }
  }, [isLoading, user, isClient, navigate]);

  useEffect(() => {
    if (clientId) {
      fetchProjects();
    }
  }, [clientId]);

  const fetchProjects = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('id, name, description, status, priority, start_date, end_date, budget')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(projectsData || []);

      // Fetch updates for each project
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id);
        const { data: updatesData } = await supabase
          .from('project_updates')
          .select('*')
          .in('project_id', projectIds)
          .eq('visible_to_client', true)
          .order('created_at', { ascending: false });

        if (updatesData) {
          const groupedUpdates: Record<string, ProjectUpdate[]> = {};
          updatesData.forEach(update => {
            if (!groupedUpdates[update.project_id]) {
              groupedUpdates[update.project_id] = [];
            }
            groupedUpdates[update.project_id].push(update);
          });
          setUpdates(groupedUpdates);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
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

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; className: string }> = {
      'low': { label: 'נמוכה', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'medium': { label: 'בינונית', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'high': { label: 'גבוהה', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };
    const config = priorityMap[priority] || { label: priority, className: '' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const getProjectProgress = (project: Project) => {
    if (!project.start_date || !project.end_date) return null;
    if (project.status === 'completed') return 100;
    if (project.status === 'cancelled') return 0;
    
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const today = new Date();
    
    if (today < start) return 0;
    if (today > end) return 100;
    
    const totalDays = differenceInDays(end, start);
    const passedDays = differenceInDays(today, start);
    
    return Math.round((passedDays / totalDays) * 100);
  };

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
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-4 px-4 flex-row-reverse justify-end">
          <h1 className="text-xl font-semibold text-right">הפרויקטים שלי</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/client-portal')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 space-y-6">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">אין פרויקטים להצגה</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map(project => {
              const progress = getProjectProgress(project);
              const isExpanded = selectedProject === project.id;
              const projectUpdates = updates[project.id] || [];

              return (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedProject(isExpanded ? null : project.id)}
                  >
                    <div className="flex items-start justify-between gap-4 flex-row-reverse">
                      <div className="space-y-1 text-right">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {project.description && (
                          <CardDescription className="line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-row-reverse">
                        {getStatusBadge(project.status || 'planning')}
                        {getPriorityBadge(project.priority || 'medium')}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Project Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {project.start_date && (
                        <div className="flex items-center gap-2 flex-row-reverse text-right">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>התחלה: {format(new Date(project.start_date), 'dd/MM/yyyy', { locale: he })}</span>
                        </div>
                      )}
                      {project.end_date && (
                        <div className="flex items-center gap-2 flex-row-reverse text-right">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>סיום: {format(new Date(project.end_date), 'dd/MM/yyyy', { locale: he })}</span>
                        </div>
                      )}
                      {project.budget && (
                        <div className="flex items-center gap-2 flex-row-reverse text-right">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>תקציב: ₪{project.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {progress !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm flex-row-reverse">
                          <span className="text-muted-foreground">התקדמות זמן</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Updates Section */}
                    {isExpanded && projectUpdates.length > 0 && (
                      <div className="pt-4 border-t space-y-3">
                        <h4 className="font-medium text-sm text-right">עדכונים אחרונים</h4>
                        {projectUpdates.slice(0, 5).map(update => (
                          <div key={update.id} className="p-3 rounded-lg bg-muted/50 text-right">
                            <div className="flex items-center justify-between mb-1 flex-row-reverse">
                              <p className="font-medium text-sm">{update.title}</p>
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
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
