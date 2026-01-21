// My Day Page - e-control CRM Pro
// Shows today's meetings, tasks, reminders and schedule
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DisplayOptions, HoverItemWrapper, ViewType } from '@/components/ui/display-options';
import {
  Calendar,
  CheckSquare,
  Clock,
  Bell,
  Loader2,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Users,
  Video,
  Phone,
  MapPin,
  Briefcase,
  User,
  Sun,
  Sunrise,
  CheckCircle2,
  Circle,
  AlertCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { format, isToday, parseISO, isBefore, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  client?: { name: string } | null;
  project?: { name: string } | null;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_type: string;
  status: string;
  client?: { name: string } | null;
  project?: { name: string } | null;
}

interface Reminder {
  id: string;
  title: string;
  message: string | null;
  remind_at: string;
  is_dismissed: boolean;
  client?: { name: string } | null;
}

interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  description: string | null;
  project?: { name: string } | null;
  client?: { name: string } | null;
}

const priorityIcons = {
  low: ArrowDown,
  medium: ArrowRight,
  high: ArrowUp,
};

const priorityColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
};

const meetingTypeIcons = {
  in_person: Users,
  video: Video,
  phone: Phone,
};

export default function MyDay() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [meetingsView, setMeetingsView] = useState<ViewType>(() => {
    return (localStorage.getItem('myday-meetings-view') as ViewType) || 'list';
  });
  const [tasksView, setTasksView] = useState<ViewType>(() => {
    return (localStorage.getItem('myday-tasks-view') as ViewType) || 'list';
  });
  
  // Save view preferences to localStorage
  useEffect(() => {
    localStorage.setItem('myday-meetings-view', meetingsView);
  }, [meetingsView]);
  
  useEffect(() => {
    localStorage.setItem('myday-tasks-view', tasksView);
  }, [tasksView]);

  // Delete handlers
  const handleDeleteMeeting = async (id: string) => {
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) {
      toast.error('שגיאה במחיקת הפגישה');
    } else {
      setMeetings(meetings.filter(m => m.id !== id));
      toast.success('הפגישה נמחקה');
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error('שגיאה במחיקת המשימה');
    } else {
      setTasks(tasks.filter(t => t.id !== id));
      toast.success('המשימה נמחקה');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) {
      toast.error('שגיאה במחיקת התזכורת');
    } else {
      setReminders(reminders.filter(r => r.id !== id));
      toast.success('התזכורת נמחקה');
    }
  };

  const fetchTodayData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();

    const [tasksRes, meetingsRes, remindersRes, timeRes] = await Promise.all([
      // Tasks due today or overdue
      supabase
        .from('tasks')
        .select('id, title, description, status, priority, due_date, client:clients(name), project:projects(name)')
        .or(`due_date.lte.${todayEnd},status.neq.completed`)
        .neq('status', 'completed')
        .order('priority', { ascending: false }),
      
      // Meetings today
      supabase
        .from('meetings')
        .select('id, title, description, start_time, end_time, location, meeting_type, status, client:clients(name), project:projects(name)')
        .gte('start_time', todayStart)
        .lte('start_time', todayEnd)
        .order('start_time', { ascending: true }),
      
      // Reminders for today
      supabase
        .from('reminders')
        .select('id, title, message, remind_at, is_dismissed, client:clients(name)')
        .gte('remind_at', todayStart)
        .lte('remind_at', todayEnd)
        .eq('is_dismissed', false)
        .order('remind_at', { ascending: true }),
      
      // Time entries today
      supabase
        .from('time_entries')
        .select('id, start_time, end_time, duration_minutes, description, project:projects(name), client:clients(name)')
        .gte('start_time', todayStart)
        .lte('start_time', todayEnd)
        .order('start_time', { ascending: true }),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (meetingsRes.data) setMeetings(meetingsRes.data as Meeting[]);
    if (remindersRes.data) setReminders(remindersRes.data as Reminder[]);
    if (timeRes.data) setTimeEntries(timeRes.data as TimeEntry[]);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchTodayData();
    }
  }, [user, authLoading, navigate, fetchTodayData]);

  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return `${date.getHours()}:${date.getMinutes()}`;
  };
  
  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'בוקר טוב', icon: Sunrise };
    if (hour < 17) return { text: 'צהריים טובים', icon: Sun };
    return { text: 'ערב טוב', icon: Sun };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingMeetings = meetings.filter(m => m.status === 'scheduled').length;
  const totalTimeMinutes = timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout title="היום שלי">
      <div className="p-6 md:p-8 space-y-8">
        {/* Greeting Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[hsl(45,80%,50%)] to-[hsl(45,90%,40%)] flex items-center justify-center shadow-lg">
              <GreetingIcon className="h-7 w-7 text-[hsl(220,60%,15%)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{greeting.text}!</h1>
              <p className="text-muted-foreground">
                {format(new Date(), "EEEE, d בMMMM yyyy", { locale: he })}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-elegant">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">משימות</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingMeetings}</p>
                <p className="text-sm text-muted-foreground">פגישות</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Bell className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reminders.length}</p>
                <p className="text-sm text-muted-foreground">תזכורות</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatMinutes(totalTimeMinutes)}</p>
                <p className="text-sm text-muted-foreground">שעות היום</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule (Meetings) */}
          <Card className="border-2 border-[hsl(45,80%,45%)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-[hsl(45,80%,45%)]" />
                  לוח הפגישות היום
                </CardTitle>
                <DisplayOptions
                  viewType={meetingsView}
                  onViewTypeChange={setMeetingsView}
                  availableViewTypes={['list', 'cards', 'grid']}
                />
              </div>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>אין פגישות מתוכננות להיום</p>
                </div>
              ) : (
                <div className={cn(
                  meetingsView === 'grid' ? "grid grid-cols-2 gap-3" : "space-y-3"
                )}>
                  {meetings.map((meeting) => {
                    const MeetingIcon = meetingTypeIcons[meeting.meeting_type as keyof typeof meetingTypeIcons] || Users;
                    return (
                      <HoverItemWrapper
                        key={meeting.id}
                        onClick={() => navigate(`/meetings?id=${meeting.id}`)}
                        onEdit={() => navigate(`/meetings?edit=${meeting.id}`)}
                        onDelete={() => handleDeleteMeeting(meeting.id)}
                        className="rounded-lg"
                      >
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex flex-col items-center text-center min-w-[60px]">
                            <span className="text-lg font-bold text-[hsl(220,60%,25%)]">
                              {formatTime(meeting.start_time)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(meeting.end_time)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <MeetingIcon className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium truncate">{meeting.title}</p>
                            </div>
                            {meeting.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {meeting.location}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {meeting.client?.name && (
                                <Badge variant="outline" className="text-xs">
                                  <User className="h-3 w-3 ml-1" />
                                  {meeting.client.name}
                                </Badge>
                              )}
                              {meeting.project?.name && (
                                <Badge variant="secondary" className="text-xs">
                                  <Briefcase className="h-3 w-3 ml-1" />
                                  {meeting.project.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </HoverItemWrapper>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card className="border-2 border-[hsl(220,60%,25%)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckSquare className="h-5 w-5 text-[hsl(220,60%,25%)]" />
                  משימות לביצוע
                </CardTitle>
                <DisplayOptions
                  viewType={tasksView}
                  onViewTypeChange={setTasksView}
                  availableViewTypes={['list', 'cards', 'grid']}
                />
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>אין משימות פתוחות</p>
                </div>
              ) : (
                <div className={cn(
                  tasksView === 'grid' ? "grid grid-cols-2 gap-2" : "space-y-2"
                )}>
                  {tasks.slice(0, 6).map((task) => {
                    const PriorityIcon = priorityIcons[task.priority as keyof typeof priorityIcons] || ArrowRight;
                    const priorityColor = priorityColors[task.priority as keyof typeof priorityColors] || 'text-gray-600';
                    const isOverdue = task.due_date && isBefore(parseISO(task.due_date), startOfDay(new Date()));
                    
                    return (
                      <HoverItemWrapper
                        key={task.id}
                        onClick={() => navigate(`/tasks?id=${task.id}`)}
                        onEdit={() => navigate(`/tasks?edit=${task.id}`)}
                        onDelete={() => handleDeleteTask(task.id)}
                        className="rounded-lg"
                      >
                        <div className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                          isOverdue ? "bg-destructive/10" : "bg-muted/50 hover:bg-muted"
                        )}>
                          <div className={cn("shrink-0", priorityColor)}>
                            <PriorityIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {task.due_date && (
                                <span className={cn(
                                  "text-xs flex items-center gap-1",
                                  isOverdue ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(task.due_date), 'dd/MM')}
                                  {isOverdue && <AlertCircle className="h-3 w-3" />}
                                </span>
                              )}
                              {task.client?.name && (
                                <span className="text-xs text-muted-foreground">
                                  • {task.client.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant={task.status === 'in_progress' ? 'default' : 'secondary'}
                            className="shrink-0 text-xs"
                          >
                            {task.status === 'pending' ? 'ממתין' : task.status === 'in_progress' ? 'בביצוע' : 'הושלם'}
                          </Badge>
                        </div>
                      </HoverItemWrapper>
                    );
                  })}
                  {tasks.length > 6 && (
                    <Button variant="ghost" className="w-full" onClick={() => navigate('/tasks')}>
                      עוד {tasks.length - 6} משימות...
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-warning" />
                תזכורות להיום
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reminders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>אין תזכורות להיום</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.map((reminder) => (
                    <HoverItemWrapper
                      key={reminder.id}
                      onClick={() => navigate(`/reminders?id=${reminder.id}`)}
                      onEdit={() => navigate(`/reminders?edit=${reminder.id}`)}
                      onDelete={() => handleDeleteReminder(reminder.id)}
                      className="rounded-lg"
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                        <div className="p-2 rounded-lg bg-warning/20">
                          <Bell className="h-4 w-4 text-warning" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{reminder.title}</p>
                          {reminder.message && (
                            <p className="text-sm text-muted-foreground mt-1">{reminder.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(reminder.remind_at)}
                          </p>
                        </div>
                      </div>
                    </HoverItemWrapper>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Logged */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-success" />
                זמן שנרשם היום
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>לא נרשם זמן עבודה היום</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {entry.description || entry.project?.name || 'עבודה'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(entry.start_time)}
                          {entry.end_time && ` - ${formatTime(entry.end_time)}`}
                        </p>
                      </div>
                      {entry.duration_minutes && (
                        <Badge variant="outline" className="font-mono">
                          {formatMinutes(entry.duration_minutes)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
