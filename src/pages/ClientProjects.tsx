// Client Portal - Projects Page
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowRight, Calendar, DollarSign, Clock, CheckCircle2, Circle, AlertCircle, PlayCircle } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { he } from 'date-fns/locale';
import PortalNavigation from '@/components/client-portal/PortalNavigation';

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
    <div dir="rtl" className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold text-right flex-1">התיקים שלי</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-4 space-y-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">אין תיקים להצגה</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map(project => {
              const progress = getProjectProgress(project);
              const isExpanded = selectedProject === project.id;
              const projectUpdates = updates[project.id] || [];
              
              // Define project stages based on status
              const stages = [
                { id: 'intake', label: 'קבלת תיק', completed: true },
                { id: 'planning', label: 'תכנון', completed: ['planning', 'active', 'on_hold', 'completed'].includes(project.status) },
                { id: 'active', label: 'בטיפול', completed: ['active', 'on_hold', 'completed'].includes(project.status) },
                { id: 'review', label: 'בדיקה', completed: project.status === 'completed' },
                { id: 'completed', label: 'הושלם', completed: project.status === 'completed' },
              ];
              
              const currentStageIndex = stages.findIndex(s => !s.completed);
              const activeStage = currentStageIndex > 0 ? stages[currentStageIndex - 1] : stages[0];

              return (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
                    onClick={() => setSelectedProject(isExpanded ? null : project.id)}
                  >
                    <div className="flex items-start justify-between gap-4 flex-row-reverse">
                      <div className="space-y-1 text-right flex-1">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        {project.description && (
                          <CardDescription className="line-clamp-1 text-sm">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(project.status || 'planning')}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    {/* Progress Steps - Always visible */}
                    <div className="px-2">
                      <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-3 right-3 left-3 h-0.5 bg-muted z-0" />
                        <div 
                          className="absolute top-3 right-3 h-0.5 bg-primary z-0 transition-all duration-500"
                          style={{ 
                            width: `${Math.max(0, (stages.filter(s => s.completed).length - 1) / (stages.length - 1) * 100)}%`
                          }}
                        />
                        
                        {/* Steps */}
                        {stages.map((stage, index) => {
                          const isActive = !stage.completed && (index === 0 || stages[index - 1].completed);
                          return (
                            <div key={stage.id} className="relative z-10 flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                stage.completed 
                                  ? 'bg-primary text-primary-foreground' 
                                  : isActive
                                    ? 'bg-primary/20 border-2 border-primary text-primary'
                                    : 'bg-muted text-muted-foreground'
                              }`}>
                                {stage.completed ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : isActive ? (
                                  <PlayCircle className="h-4 w-4" />
                                ) : (
                                  <Circle className="h-3 w-3" />
                                )}
                              </div>
                              <span className={`text-[10px] mt-1 text-center whitespace-nowrap ${
                                stage.completed || isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                              }`}>
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <>
                        {/* Project Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                          {project.start_date && (
                            <div className="flex items-center gap-2 flex-row-reverse text-right">
                              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-xs">התחלה: {format(new Date(project.start_date), 'dd/MM/yy', { locale: he })}</span>
                            </div>
                          )}
                          {project.end_date && (
                            <div className="flex items-center gap-2 flex-row-reverse text-right">
                              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className={`text-xs ${isPast(new Date(project.end_date)) && project.status !== 'completed' ? 'text-destructive' : ''}`}>
                                סיום: {format(new Date(project.end_date), 'dd/MM/yy', { locale: he })}
                              </span>
                            </div>
                          )}
                          {project.budget && (
                            <div className="flex items-center gap-2 flex-row-reverse text-right col-span-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-xs">תקציב: ₪{project.budget.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Time Progress Bar */}
                        {progress !== null && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs flex-row-reverse">
                              <span className="text-muted-foreground">התקדמות זמן</span>
                              <span className={progress > 100 ? 'text-destructive font-medium' : ''}>{Math.min(progress, 100)}%</span>
                            </div>
                            <Progress value={Math.min(progress, 100)} className="h-1.5" />
                          </div>
                        )}

                        {/* Updates Section */}
                        {projectUpdates.length > 0 && (
                          <div className="pt-3 border-t space-y-2">
                            <h4 className="font-medium text-sm text-right flex items-center gap-2 flex-row-reverse">
                              <AlertCircle className="h-4 w-4 text-primary" />
                              עדכונים אחרונים
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {projectUpdates.slice(0, 5).map(update => (
                                <div key={update.id} className="p-2 rounded-lg bg-muted/50 text-right">
                                  <div className="flex items-center justify-between mb-0.5 flex-row-reverse">
                                    <p className="font-medium text-xs">{update.title}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {format(new Date(update.created_at), 'dd/MM HH:mm', { locale: he })}
                                    </p>
                                  </div>
                                  {update.content && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{update.content}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <PortalNavigation />
    </div>
  );
}
