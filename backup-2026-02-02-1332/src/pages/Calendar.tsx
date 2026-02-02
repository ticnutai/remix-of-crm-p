// Calendar Page - e-control CRM Pro
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  User,
  Loader2,
  Plus,
  CheckSquare,
  Users,
  Bell,
  Video,
  Phone,
  MapPin,
  RefreshCw,
  CloudOff,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { he } from 'date-fns/locale';
import {
  CalendarViewToggle,
  CalendarWeekView,
  CalendarListView,
  CalendarAgendaView,
  CalendarScheduleView,
  GoogleCalendarIndicator,
  GoogleCalendarSettingsDialog,
  type CalendarViewType,
} from '@/components/calendar';

interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  duration_minutes: number | null;
  project_id: string | null;
  client_id: string | null;
  project?: { name: string } | null;
  client?: { name: string } | null;
}

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  priority: string;
}

interface Reminder {
  id: string;
  title: string;
  remind_at: string;
  is_dismissed: boolean;
}

const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

type AddType = 'meeting' | 'task' | 'reminder';

const Calendar = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  // Google Calendar integration
  const { 
    isConnected: isGoogleConnected, 
    isLoading: googleLoading,
    connect: connectGoogle,
    disconnect: disconnectGoogle,
    syncMeetingsToGoogle,
    fetchEvents: fetchGoogleEvents,
  } = useGoogleCalendar();
  
  // View state
  const [viewType, setViewType] = useState<CalendarViewType>(() => {
    const saved = localStorage.getItem('calendar-view-type');
    return (saved as CalendarViewType) || 'month';
  });
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const saved = localStorage.getItem('calendar-month');
    return saved ? new Date(saved) : new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const saved = localStorage.getItem('calendar-selected-date');
    return saved ? new Date(saved) : new Date();
  });
  
  // Save calendar state to localStorage
  useEffect(() => {
    localStorage.setItem('calendar-view-type', viewType);
  }, [viewType]);
  
  useEffect(() => {
    localStorage.setItem('calendar-month', currentMonth.toISOString());
  }, [currentMonth]);
  
  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem('calendar-selected-date', selectedDate.toISOString());
    }
  }, [selectedDate]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<AddType>('meeting');
  const [addDialogDate, setAddDialogDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);
  
  // Google Calendar settings dialog state
  const [googleSettingsOpen, setGoogleSettingsOpen] = useState(false);
  
  // Shared data for forms
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  
  // Form states
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    start_time: '09:00',
    end_time: '10:00',
    location: '',
    meeting_type: 'in_person',
    client_id: '',
    project_id: '',
  });
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    client_id: '',
    project_id: '',
  });
  
  const [reminderForm, setReminderForm] = useState({
    title: '',
    message: '',
    time: '09:00',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const [timeRes, meetingsRes, tasksRes, remindersRes, clientsRes, projectsRes] = await Promise.all([
      supabase
        .from('time_entries')
        .select('id, start_time, end_time, description, duration_minutes, project_id, client_id, project:projects(name), client:clients(name)')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true }),
      supabase
        .from('meetings')
        .select('id, title, start_time, end_time, status')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true }),
      supabase
        .from('tasks')
        .select('id, title, due_date, status, priority')
        .gte('due_date', start.toISOString())
        .lte('due_date', end.toISOString())
        .neq('status', 'completed')
        .order('due_date', { ascending: true }),
      supabase
        .from('reminders')
        .select('id, title, remind_at, is_dismissed')
        .gte('remind_at', start.toISOString())
        .lte('remind_at', end.toISOString())
        .eq('is_dismissed', false)
        .order('remind_at', { ascending: true }),
      supabase.from('clients').select('id, name').order('name'),
      supabase.from('projects').select('id, name').order('name'),
    ]);

    if (timeRes.data) setTimeEntries(timeRes.data as TimeEntry[]);
    if (meetingsRes.data) setMeetings(meetingsRes.data as Meeting[]);
    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (remindersRes.data) setReminders(remindersRes.data as Reminder[]);
    if (clientsRes.data) setClients(clientsRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    
    setLoading(false);
  }, [user, currentMonth]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const getEntriesForDate = (date: Date) => {
    return timeEntries.filter((entry) => isSameDay(parseISO(entry.start_time), date));
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter((m) => isSameDay(parseISO(m.start_time), date));
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((t) => t.due_date && isSameDay(parseISO(t.due_date), date));
  };

  const getRemindersForDate = (date: Date) => {
    return reminders.filter((r) => isSameDay(parseISO(r.remind_at), date));
  };

  const getTotalMinutesForDate = (date: Date) => {
    const entries = getEntriesForDate(date);
    return entries.reduce((total, entry) => total + (entry.duration_minutes || 0), 0);
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  const openAddDialog = (date: Date) => {
    setAddDialogDate(date);
    setAddType('meeting');
    resetForms();
    setAddDialogOpen(true);
  };

  const resetForms = () => {
    setMeetingForm({
      title: '',
      description: '',
      start_time: '09:00',
      end_time: '10:00',
      location: '',
      meeting_type: 'in_person',
      client_id: '',
      project_id: '',
    });
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      client_id: '',
      project_id: '',
    });
    setReminderForm({
      title: '',
      message: '',
      time: '09:00',
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    const dateStr = format(addDialogDate, 'yyyy-MM-dd');
    
    try {
      if (addType === 'meeting') {
        if (!meetingForm.title.trim()) {
          toast({ title: 'שגיאה', description: 'כותרת הפגישה חובה', variant: 'destructive' });
          setSaving(false);
          return;
        }
        
        const { error } = await supabase.from('meetings').insert({
          title: meetingForm.title,
          description: meetingForm.description || null,
          start_time: `${dateStr}T${meetingForm.start_time}:00`,
          end_time: `${dateStr}T${meetingForm.end_time}:00`,
          location: meetingForm.location || null,
          meeting_type: meetingForm.meeting_type,
          client_id: meetingForm.client_id || null,
          project_id: meetingForm.project_id || null,
          created_by: user.id,
          status: 'scheduled',
        });
        
        if (error) throw error;
        toast({ title: 'הפגישה נוצרה', description: meetingForm.title });
      }
      
      if (addType === 'task') {
        if (!taskForm.title.trim()) {
          toast({ title: 'שגיאה', description: 'כותרת המשימה חובה', variant: 'destructive' });
          setSaving(false);
          return;
        }
        
        const { error } = await supabase.from('tasks').insert({
          title: taskForm.title,
          description: taskForm.description || null,
          priority: taskForm.priority,
          due_date: `${dateStr}T23:59:59`,
          client_id: taskForm.client_id || null,
          project_id: taskForm.project_id || null,
          created_by: user.id,
          status: 'pending',
        });
        
        if (error) throw error;
        toast({ title: 'המשימה נוצרה', description: taskForm.title });
      }
      
      if (addType === 'reminder') {
        if (!reminderForm.title.trim()) {
          toast({ title: 'שגיאה', description: 'כותרת התזכורת חובה', variant: 'destructive' });
          setSaving(false);
          return;
        }
        
        const reminderData = {
          title: reminderForm.title,
          message: reminderForm.message || null,
          remind_at: `${dateStr}T${reminderForm.time}:00`,
          user_id: user.id,
          reminder_type: 'browser',
        };
        console.log('Creating reminder with data:', reminderData);
        
        const { data, error } = await supabase.from('reminders').insert(reminderData).select();
        console.log('Reminder insert result:', { data, error });
        
        if (error) throw error;
        toast({ title: 'התזכורת נוצרה', description: reminderForm.title });
      }
      
      setAddDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לשמור', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Sync meetings to Google Calendar
  const handleSyncToGoogle = async () => {
    if (!isGoogleConnected) {
      await connectGoogle();
      return;
    }
    
    // Sync current month's meetings
    const monthMeetings = meetings.filter(m => {
      const meetingDate = parseISO(m.start_time);
      return isSameMonth(meetingDate, currentMonth);
    });
    
    if (monthMeetings.length === 0) {
      toast({
        title: 'אין פגישות לסנכרון',
        description: 'אין פגישות בחודש הנוכחי',
      });
      return;
    }
    
    await syncMeetingsToGoogle(monthMeetings);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (viewType === 'week') {
      setCurrentMonth(direction === 'prev' ? subWeeks(currentMonth, 1) : addWeeks(currentMonth, 1));
    } else {
      setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col gap-4 mb-6">
        {/* Top row: Navigation and view toggle */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate('prev')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate('next')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mr-2">
              {viewType === 'week' 
                ? `שבוע ${format(currentMonth, 'w', { locale: he })} - ${format(currentMonth, 'MMMM yyyy', { locale: he })}`
                : format(currentMonth, 'MMMM yyyy', { locale: he })
              }
            </h2>
          </div>
          
          {/* View Toggle */}
          <CalendarViewToggle view={viewType} onViewChange={setViewType} />
        </div>
        
        {/* Bottom row: Actions */}
        <div className="flex items-center justify-end gap-2">
          {/* Google Calendar Indicator */}
          <GoogleCalendarIndicator
            isConnected={isGoogleConnected}
            isLoading={googleLoading}
            onConnect={connectGoogle}
            onDisconnect={disconnectGoogle}
            onOpenSettings={() => setGoogleSettingsOpen(true)}
          />
          
          {/* Sync button - only show when connected */}
          {isGoogleConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncToGoogle}
              disabled={googleLoading}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">סנכרן</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
            }}
          >
            היום
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {hebrewDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const entries = getEntriesForDate(day);
          const dayMeetings = getMeetingsForDate(day);
          const dayTasks = getTasksForDate(day);
          const dayReminders = getRemindersForDate(day);
          const totalMinutes = getTotalMinutesForDate(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const dayIsToday = isToday(day);
          
          const totalEvents = dayMeetings.length + dayTasks.length + dayReminders.length;

          return (
            <div
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              onDoubleClick={() => openAddDialog(day)}
              className={cn(
                "min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all group",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isCurrentMonth && "bg-card hover:bg-accent/50",
                isSelected && "ring-2 ring-[hsl(45,80%,45%)] bg-[hsl(45,80%,45%)]/10",
                dayIsToday && "border-[hsl(220,60%,25%)] border-2"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    dayIsToday && "bg-[hsl(220,60%,25%)] text-white rounded-full w-6 h-6 flex items-center justify-center"
                  )}
                >
                  {format(day, 'd')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); openAddDialog(day); }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-0.5 text-[10px]">
                {/* Meetings */}
                {dayMeetings.slice(0, 1).map((m) => (
                  <div key={m.id} className="bg-[hsl(220,60%,25%)]/80 text-white rounded px-1 py-0.5 truncate">
                    <Users className="h-2 w-2 inline ml-0.5" />
                    {m.title}
                  </div>
                ))}
                
                {/* Tasks */}
                {dayTasks.slice(0, 1).map((t) => (
                  <div key={t.id} className="bg-primary/20 text-primary rounded px-1 py-0.5 truncate">
                    <CheckSquare className="h-2 w-2 inline ml-0.5" />
                    {t.title}
                  </div>
                ))}
                
                {/* Reminders */}
                {dayReminders.slice(0, 1).map((r) => (
                  <div key={r.id} className="bg-warning/20 text-warning rounded px-1 py-0.5 truncate">
                    <Bell className="h-2 w-2 inline ml-0.5" />
                    {r.title}
                  </div>
                ))}
                
                {/* Time entries */}
                {totalMinutes > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">
                    <Clock className="h-2 w-2 ml-0.5" />
                    {formatMinutes(totalMinutes)}
                  </Badge>
                )}
                
                {totalEvents > 3 && (
                  <div className="text-[9px] text-muted-foreground">
                    +{totalEvents - 3} נוספים
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSelectedDayDetails = () => {
    if (!selectedDate) return null;

    const entries = getEntriesForDate(selectedDate);
    const dayMeetings = getMeetingsForDate(selectedDate);
    const dayTasks = getTasksForDate(selectedDate);
    const dayReminders = getRemindersForDate(selectedDate);
    const totalMinutes = getTotalMinutesForDate(selectedDate);

    const hasEvents = entries.length > 0 || dayMeetings.length > 0 || dayTasks.length > 0 || dayReminders.length > 0;

    return (
      <Card className="mt-6 border-2 border-[hsl(45,80%,45%)]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-[hsl(45,80%,45%)]" />
              {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
            </span>
            <Button size="sm" onClick={() => openAddDialog(selectedDate)} className="btn-gold">
              <Plus className="h-4 w-4 ml-1" />
              הוסף
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasEvents ? (
            <div className="text-center text-muted-foreground py-8">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>אין אירועים ליום זה</p>
              <p className="text-sm mt-1">לחץ פעמיים על יום או לחץ על + להוספה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Meetings */}
              {dayMeetings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    פגישות ({dayMeetings.length})
                  </h4>
                  <div className="space-y-2">
                    {dayMeetings.map((m) => (
                      <div key={m.id} className="p-3 bg-[hsl(220,60%,25%)]/10 rounded-lg">
                        <p className="font-medium">{m.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(m.start_time), 'HH:mm')} - {format(parseISO(m.end_time), 'HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tasks */}
              {dayTasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <CheckSquare className="h-4 w-4" />
                    משימות ({dayTasks.length})
                  </h4>
                  <div className="space-y-2">
                    {dayTasks.map((t) => (
                      <div key={t.id} className="p-3 bg-primary/10 rounded-lg">
                        <p className="font-medium">{t.title}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {t.priority === 'high' ? 'עדיפות גבוהה' : t.priority === 'low' ? 'עדיפות נמוכה' : 'עדיפות בינונית'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Reminders */}
              {dayReminders.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Bell className="h-4 w-4" />
                    תזכורות ({dayReminders.length})
                  </h4>
                  <div className="space-y-2">
                    {dayReminders.map((r) => (
                      <div key={r.id} className="p-3 bg-warning/10 rounded-lg">
                        <p className="font-medium">{r.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(r.remind_at), 'HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Time Entries */}
              {entries.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    רישומי זמן ({formatMinutes(totalMinutes)})
                  </h4>
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div key={entry.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">{entry.description || entry.project?.name || 'עבודה'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(entry.start_time), 'HH:mm')}
                            {entry.end_time && ` - ${format(parseISO(entry.end_time), 'HH:mm')}`}
                          </p>
                        </div>
                        {entry.duration_minutes && (
                          <Badge variant="outline">{formatMinutes(entry.duration_minutes)}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout title="לוח שנה">
      <div className="p-6 md:p-8" dir="rtl">
        {loading ? (
          <Card className="border-2 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {renderHeader()}
            
            {/* Different views based on viewType */}
            {viewType === 'month' && (
              <Card className="border-2 border-border">
                <CardContent className="p-6">
                  {renderDays()}
                  {renderCells()}
                </CardContent>
              </Card>
            )}
            
            {viewType === 'week' && (
              <CalendarWeekView
                currentDate={currentMonth}
                timeEntries={timeEntries}
                meetings={meetings}
                tasks={tasks}
                reminders={reminders}
                onDayClick={setSelectedDate}
                onAddClick={openAddDialog}
              />
            )}
            
            {viewType === 'list' && (
              <CalendarListView
                currentMonth={currentMonth}
                timeEntries={timeEntries}
                meetings={meetings}
                tasks={tasks}
                reminders={reminders}
                onDayClick={setSelectedDate}
              />
            )}
            
            {viewType === 'agenda' && (
              <CalendarAgendaView
                currentMonth={currentMonth}
                timeEntries={timeEntries}
                meetings={meetings}
                tasks={tasks}
                reminders={reminders}
                onDayClick={setSelectedDate}
              />
            )}
            
            {viewType === 'schedule' && (
              <CalendarScheduleView
                currentMonth={currentMonth}
                timeEntries={timeEntries}
                meetings={meetings}
                tasks={tasks}
                reminders={reminders}
                onDayClick={setSelectedDate}
              />
            )}
            
            {viewType === 'month' && renderSelectedDayDetails()}
          </>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 justify-start">
              <Plus className="h-5 w-5" />
              הוסף ל-{format(addDialogDate, 'd בMMMM', { locale: he })}
            </DialogTitle>
          </DialogHeader>
          
          {/* Type Selector */}
          <div className="flex gap-2 border-b pb-4 justify-start">
            <Button
              variant={addType === 'meeting' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAddType('meeting')}
              className={addType === 'meeting' ? 'bg-[hsl(220,60%,25%)]' : ''}
            >
              <Users className="h-4 w-4 ml-1" />
              פגישה
            </Button>
            <Button
              variant={addType === 'task' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAddType('task')}
            >
              <CheckSquare className="h-4 w-4 ml-1" />
              משימה
            </Button>
            <Button
              variant={addType === 'reminder' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAddType('reminder')}
              className={addType === 'reminder' ? 'bg-warning text-warning-foreground' : ''}
            >
              <Bell className="h-4 w-4 ml-1" />
              תזכורת
            </Button>
          </div>
          
          <div className="space-y-4 py-4">
            {/* Meeting Form */}
            {addType === 'meeting' && (
              <>
                <div className="grid gap-2">
                  <Label className="text-right">כותרת *</Label>
                  <Input
                    value={meetingForm.title}
                    onChange={(e) => setMeetingForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="שם הפגישה"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-right">שעת התחלה</Label>
                    <Input
                      type="time"
                      value={meetingForm.start_time}
                      onChange={(e) => setMeetingForm(f => ({ ...f, start_time: e.target.value }))}
                      dir="ltr"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-right">שעת סיום</Label>
                    <Input
                      type="time"
                      value={meetingForm.end_time}
                      onChange={(e) => setMeetingForm(f => ({ ...f, end_time: e.target.value }))}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-right">סוג פגישה</Label>
                  <Select value={meetingForm.meeting_type} onValueChange={(v) => setMeetingForm(f => ({ ...f, meeting_type: v }))}>
                    <SelectTrigger className="text-right"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover" dir="rtl">
                      <SelectItem value="in_person"><Users className="h-4 w-4 inline ml-1" />פגישה פיזית</SelectItem>
                      <SelectItem value="video"><Video className="h-4 w-4 inline ml-1" />שיחת וידאו</SelectItem>
                      <SelectItem value="phone"><Phone className="h-4 w-4 inline ml-1" />שיחת טלפון</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-right">מיקום</Label>
                  <Input
                    value={meetingForm.location}
                    onChange={(e) => setMeetingForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="כתובת או קישור"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-right">לקוח</Label>
                    <Select value={meetingForm.client_id} onValueChange={(v) => setMeetingForm(f => ({ ...f, client_id: v }))}>
                      <SelectTrigger className="text-right"><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
                      <SelectContent className="bg-popover" dir="rtl">
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-right">פרויקט</Label>
                    <Select value={meetingForm.project_id} onValueChange={(v) => setMeetingForm(f => ({ ...f, project_id: v }))}>
                      <SelectTrigger className="text-right"><SelectValue placeholder="בחר פרויקט" /></SelectTrigger>
                      <SelectContent className="bg-popover" dir="rtl">
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-right">תיאור</Label>
                  <Textarea
                    value={meetingForm.description}
                    onChange={(e) => setMeetingForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </>
            )}
            
            {/* Task Form */}
            {addType === 'task' && (
              <>
                <div className="grid gap-2">
                  <Label className="text-right">כותרת *</Label>
                  <Input
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="שם המשימה"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-right">עדיפות</Label>
                  <Select value={taskForm.priority} onValueChange={(v) => setTaskForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger className="text-right"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover" dir="rtl">
                      <SelectItem value="low">נמוכה</SelectItem>
                      <SelectItem value="medium">בינונית</SelectItem>
                      <SelectItem value="high">גבוהה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-right">לקוח</Label>
                    <Select value={taskForm.client_id} onValueChange={(v) => setTaskForm(f => ({ ...f, client_id: v }))}>
                      <SelectTrigger className="text-right"><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
                      <SelectContent className="bg-popover" dir="rtl">
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-right">פרויקט</Label>
                    <Select value={taskForm.project_id} onValueChange={(v) => setTaskForm(f => ({ ...f, project_id: v }))}>
                      <SelectTrigger className="text-right"><SelectValue placeholder="בחר פרויקט" /></SelectTrigger>
                      <SelectContent className="bg-popover" dir="rtl">
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-right">תיאור</Label>
                  <Textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </>
            )}
            
            {/* Reminder Form */}
            {addType === 'reminder' && (
              <>
                <div className="grid gap-2">
                  <Label className="text-right">כותרת *</Label>
                  <Input
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="מה להזכיר?"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-right">שעת תזכורת</Label>
                  <Input
                    type="time"
                    value={reminderForm.time}
                    onChange={(e) => setReminderForm(f => ({ ...f, time: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-right">הודעה נוספת</Label>
                  <Textarea
                    value={reminderForm.message}
                    onChange={(e) => setReminderForm(f => ({ ...f, message: e.target.value }))}
                    rows={2}
                    placeholder="פרטים נוספים..."
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <Button onClick={handleSave} disabled={saving} className="btn-gold">
              {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              שמור
            </Button>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Google Calendar Settings Dialog */}
      <GoogleCalendarSettingsDialog
        open={googleSettingsOpen}
        onOpenChange={setGoogleSettingsOpen}
        onSync={handleSyncToGoogle}
      />
    </AppLayout>
  );
};

export default Calendar;
