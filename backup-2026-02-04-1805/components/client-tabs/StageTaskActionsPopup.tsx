// StageTaskActionsPopup - Popup for managing reminders, tasks, and meetings linked to a stage task
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  CheckSquare,
  Calendar,
  Plus,
  Trash2,
  Edit,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Video,
  Phone,
  Users,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTasksOptimized as useTasks, Task, TaskInsert } from '@/hooks/useTasksOptimized';
import { useMeetingsOptimized as useMeetings, Meeting, MeetingInsert } from '@/hooks/useMeetingsOptimized';
import { useReminders, Reminder, ReminderInsert } from '@/hooks/useReminders';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface StageTaskActionsPopupProps {
  stageTaskId: string;
  stageTaskTitle: string;
  clientId: string;
  clientName?: string;
  trigger?: React.ReactNode;
}

// Helper to check if there are any linked items
export function useStageTaskLinks(stageTaskId: string, clientId: string) {
  const { tasks } = useTasks();
  const { meetings } = useMeetings();
  const { reminders } = useReminders();

  const linkedTasks = useMemo(() => 
    tasks.filter(t => t.client_id === clientId && t.description?.includes(`[stage_task:${stageTaskId}]`)),
    [tasks, clientId, stageTaskId]
  );

  const linkedMeetings = useMemo(() => 
    meetings.filter(m => m.client_id === clientId && m.description?.includes(`[stage_task:${stageTaskId}]`)),
    [meetings, clientId, stageTaskId]
  );

  const linkedReminders = useMemo(() => 
    reminders.filter(r => 
      r.entity_type === 'client_stage_task' && r.entity_id === stageTaskId
    ),
    [reminders, stageTaskId]
  );

  return {
    linkedTasks,
    linkedMeetings,
    linkedReminders,
    hasLinks: linkedTasks.length > 0 || linkedMeetings.length > 0 || linkedReminders.length > 0,
    totalCount: linkedTasks.length + linkedMeetings.length + linkedReminders.length,
  };
}

export function StageTaskActionsPopup({
  stageTaskId,
  stageTaskTitle,
  clientId,
  clientName,
  trigger,
}: StageTaskActionsPopupProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('reminders');
  
  // Hooks
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const { meetings, createMeeting, updateMeeting, deleteMeeting } = useMeetings();
  const { reminders, createReminder, updateReminder, deleteReminder } = useReminders();

  // Filter linked items
  const linkedTasks = useMemo(() => 
    tasks.filter(t => t.client_id === clientId && t.description?.includes(`[stage_task:${stageTaskId}]`)),
    [tasks, clientId, stageTaskId]
  );

  const linkedMeetings = useMemo(() => 
    meetings.filter(m => m.client_id === clientId && m.description?.includes(`[stage_task:${stageTaskId}]`)),
    [meetings, clientId, stageTaskId]
  );

  const linkedReminders = useMemo(() => 
    reminders.filter(r => r.entity_type === 'client_stage_task' && r.entity_id === stageTaskId),
    [reminders, stageTaskId]
  );

  // Form states
  const [taskForm, setTaskForm] = useState<Partial<TaskInsert>>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: null,
  });
  
  const [meetingForm, setMeetingForm] = useState<Partial<MeetingInsert>>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    meeting_type: 'in_person',
    location: '',
  });
  
  const [reminderForm, setReminderForm] = useState<Partial<ReminderInsert>>({
    title: '',
    message: '',
    remind_at: '',
    is_recurring: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  // Reset forms when dialog opens
  useEffect(() => {
    if (open) {
      setTaskForm({
        title: `משימה: ${stageTaskTitle}`,
        description: `[stage_task:${stageTaskId}]`,
        priority: 'medium',
        due_date: null,
      });
      setMeetingForm({
        title: `פגישה: ${stageTaskTitle}`,
        description: `[stage_task:${stageTaskId}]`,
        start_time: '',
        end_time: '',
        meeting_type: 'in_person',
        location: '',
      });
      setReminderForm({
        title: `תזכורת: ${stageTaskTitle}`,
        message: '',
        remind_at: '',
        is_recurring: false,
      });
      setEditingId(null);
    }
  }, [open, stageTaskId, stageTaskTitle]);

  // Handlers
  const handleCreateTask = async () => {
    if (!taskForm.title?.trim()) return;
    
    await createTask({
      title: taskForm.title,
      description: taskForm.description || `[stage_task:${stageTaskId}]`,
      status: 'pending',
      priority: taskForm.priority || 'medium',
      due_date: taskForm.due_date,
      client_id: clientId,
      project_id: null,
      assigned_to: user?.id || null,
      tags: [],
    });

    setTaskForm({
      title: '',
      description: `[stage_task:${stageTaskId}]`,
      priority: 'medium',
      due_date: null,
    });
  };

  const handleCreateMeeting = async () => {
    if (!meetingForm.title?.trim() || !meetingForm.start_time || !meetingForm.end_time) {
      toast({ title: 'שגיאה', description: 'יש למלא כותרת, שעת התחלה וסיום', variant: 'destructive' });
      return;
    }
    
    await createMeeting({
      title: meetingForm.title,
      description: meetingForm.description || `[stage_task:${stageTaskId}]`,
      start_time: meetingForm.start_time,
      end_time: meetingForm.end_time,
      meeting_type: meetingForm.meeting_type || 'in_person',
      location: meetingForm.location || '',
      client_id: clientId,
      project_id: null,
    });

    setMeetingForm({
      title: '',
      description: `[stage_task:${stageTaskId}]`,
      start_time: '',
      end_time: '',
      meeting_type: 'in_person',
      location: '',
    });
  };

  const handleCreateReminder = async () => {
    if (!reminderForm.title?.trim() || !reminderForm.remind_at) {
      toast({ title: 'שגיאה', description: 'יש למלא כותרת ותאריך תזכורת', variant: 'destructive' });
      return;
    }
    
    await createReminder({
      title: reminderForm.title,
      message: reminderForm.message || '',
      remind_at: reminderForm.remind_at,
      is_recurring: reminderForm.is_recurring || false,
      recurring_interval: null,
      entity_type: 'client_stage_task',
      entity_id: stageTaskId,
    });

    setReminderForm({
      title: '',
      message: '',
      remind_at: '',
      is_recurring: false,
    });
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('למחוק את המשימה?')) {
      await deleteTask(id);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (confirm('למחוק את הפגישה?')) {
      await deleteMeeting(id);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (confirm('למחוק את התזכורת?')) {
      await deleteReminder(id);
    }
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  const priorityLabels: Record<string, string> = {
    low: 'נמוכה',
    medium: 'בינונית',
    high: 'גבוהה',
  };

  const meetingTypeIcons: Record<string, React.ReactNode> = {
    in_person: <Users className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
    phone: <Phone className="h-4 w-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Bell className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <span>ניהול פעולות:</span>
            <Badge variant="outline">{stageTaskTitle}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reminders" className="gap-2">
              <Bell className="h-4 w-4" />
              תזכורות ({linkedReminders.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              משימות ({linkedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-2">
              <Calendar className="h-4 w-4" />
              פגישות ({linkedMeetings.length})
            </TabsTrigger>
          </TabsList>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            {/* Add Reminder Form */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">תזכורת חדשה</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">כותרת</Label>
                  <Input
                    value={reminderForm.title || ''}
                    onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                    placeholder="כותרת התזכורת"
                    className="h-9"
                  />
                  {/* Quick preset buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['התקשר ללקוח', 'שלח הצעת מחיר', 'מעקב פרויקט', 'תשלום', 'פגישה', 'בדיקה'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReminderForm({ ...reminderForm, title: preset })}
                        className="px-3 py-1 text-xs rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-900 font-medium shadow-sm hover:shadow transition-all"
                        style={{ borderColor: '#d4a843' }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">תאריך ושעה</Label>
                  <Input
                    type="datetime-local"
                    value={reminderForm.remind_at || ''}
                    onChange={(e) => setReminderForm({ ...reminderForm, remind_at: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">הודעה (אופציונלי)</Label>
                <Textarea
                  value={reminderForm.message || ''}
                  onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
                  placeholder="תוכן התזכורת..."
                  rows={2}
                />
              </div>
              <Button onClick={handleCreateReminder} size="sm" className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                הוסף תזכורת
              </Button>
            </div>

            {/* Reminders List */}
            <ScrollArea className="h-[250px]">
              {linkedReminders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>אין תזכורות</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedReminders.map((reminder) => (
                    <div 
                      key={reminder.id}
                      className={cn(
                        "p-3 rounded-lg border bg-card",
                        reminder.is_dismissed && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{reminder.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(reminder.remind_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                            {isPast(parseISO(reminder.remind_at)) && !reminder.is_dismissed && (
                              <Badge variant="destructive" className="text-xs">עבר</Badge>
                            )}
                          </div>
                          {reminder.message && (
                            <p className="text-sm mt-2 text-muted-foreground">{reminder.message}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="h-8 w-8 p-0 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            {/* Add Task Form */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">משימה חדשה</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">כותרת</Label>
                  <Input
                    value={taskForm.title || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="כותרת המשימה"
                    className="h-9"
                  />
                  {/* Quick preset buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['לשלוח הצעה', 'להכין חוזה', 'לאשר תכנית', 'לבדוק פרטים', 'לעקוב', 'לסיים'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTaskForm({ ...taskForm, title: preset })}
                        className="px-3 py-1 text-xs rounded-xl border-2 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-blue-100 text-slate-800 font-medium shadow-sm hover:shadow transition-all"
                        style={{ borderColor: '#d4a843' }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">עדיפות</Label>
                  <Select
                    value={taskForm.priority || 'medium'}
                    onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">נמוכה</SelectItem>
                      <SelectItem value="medium">בינונית</SelectItem>
                      <SelectItem value="high">גבוהה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">תאריך יעד (אופציונלי)</Label>
                <Input
                  type="datetime-local"
                  value={taskForm.due_date || ''}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value || null })}
                  className="h-9"
                />
              </div>
              <Button onClick={handleCreateTask} size="sm" className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                הוסף משימה
              </Button>
            </div>

            {/* Tasks List */}
            <ScrollArea className="h-[250px]">
              {linkedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>אין משימות</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedTasks.map((task) => (
                    <div 
                      key={task.id}
                      className={cn(
                        "p-3 rounded-lg border bg-card",
                        task.status === 'completed' && "opacity-50 bg-green-50 dark:bg-green-950/20"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className={cn(
                              "font-medium",
                              task.status === 'completed' && "line-through"
                            )}>
                              {task.title}
                            </span>
                            <Badge className={cn("text-xs", priorityColors[task.priority])}>
                              {priorityLabels[task.priority]}
                            </Badge>
                          </div>
                          {task.due_date && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(task.due_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                              {isPast(parseISO(task.due_date)) && task.status !== 'completed' && (
                                <Badge variant="destructive" className="text-xs">באיחור</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-8 w-8 p-0 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="space-y-4">
            {/* Add Meeting Form */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">פגישה חדשה</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">כותרת</Label>
                  <Input
                    value={meetingForm.title || ''}
                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                    placeholder="כותרת הפגישה"
                    className="h-9"
                  />
                  {/* Quick preset buttons */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['פגישת היכרות', 'הצגת הצעה', 'סיור באתר', 'חתימת חוזה', 'פגישת סיכום', 'ייעוץ'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMeetingForm({ ...meetingForm, title: preset })}
                        className="px-3 py-1 text-xs rounded-xl border-2 bg-gradient-to-r from-slate-50 to-green-50 hover:from-green-50 hover:to-green-100 text-slate-800 font-medium shadow-sm hover:shadow transition-all"
                        style={{ borderColor: '#d4a843' }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">סוג פגישה</Label>
                  <Select
                    value={meetingForm.meeting_type || 'in_person'}
                    onValueChange={(value) => setMeetingForm({ ...meetingForm, meeting_type: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">פגישה פיזית</SelectItem>
                      <SelectItem value="video">שיחת וידאו</SelectItem>
                      <SelectItem value="phone">שיחת טלפון</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">התחלה</Label>
                  <Input
                    type="datetime-local"
                    value={meetingForm.start_time || ''}
                    onChange={(e) => setMeetingForm({ ...meetingForm, start_time: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">סיום</Label>
                  <Input
                    type="datetime-local"
                    value={meetingForm.end_time || ''}
                    onChange={(e) => setMeetingForm({ ...meetingForm, end_time: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">מיקום / לינק (אופציונלי)</Label>
                <Input
                  value={meetingForm.location || ''}
                  onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                  placeholder="כתובת או לינק לפגישה"
                  className="h-9"
                />
              </div>
              <Button onClick={handleCreateMeeting} size="sm" className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                הוסף פגישה
              </Button>
            </div>

            {/* Meetings List */}
            <ScrollArea className="h-[250px]">
              {linkedMeetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>אין פגישות</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedMeetings.map((meeting) => (
                    <div 
                      key={meeting.id}
                      className={cn(
                        "p-3 rounded-lg border bg-card",
                        meeting.status === 'completed' && "opacity-50",
                        meeting.status === 'cancelled' && "opacity-30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {meetingTypeIcons[meeting.meeting_type]}
                            <span className="font-medium">{meeting.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {meeting.status === 'scheduled' && 'מתוכנן'}
                              {meeting.status === 'completed' && 'הושלם'}
                              {meeting.status === 'cancelled' && 'בוטל'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(meeting.start_time), 'dd/MM/yyyy HH:mm', { locale: he })}
                            {' - '}
                            {format(parseISO(meeting.end_time), 'HH:mm', { locale: he })}
                          </div>
                          {meeting.location && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3" />
                              {meeting.location}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="h-8 w-8 p-0 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Icon indicator component for showing if a stage task has linked items
export function StageTaskIndicator({ 
  stageTaskId, 
  clientId,
  onClick,
}: { 
  stageTaskId: string; 
  clientId: string;
  onClick?: () => void;
}) {
  const { hasLinks, totalCount, linkedTasks, linkedMeetings, linkedReminders } = useStageTaskLinks(stageTaskId, clientId);

  if (!hasLinks) return null;

  return (
    <div 
      className="flex items-center gap-1 cursor-pointer"
      onClick={onClick}
    >
      {linkedReminders.length > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-xs bg-purple-50 text-purple-700 border-purple-200">
          <Bell className="h-3 w-3 ml-1" />
          {linkedReminders.length}
        </Badge>
      )}
      {linkedTasks.length > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-xs bg-blue-50 text-blue-700 border-blue-200">
          <CheckSquare className="h-3 w-3 ml-1" />
          {linkedTasks.length}
        </Badge>
      )}
      {linkedMeetings.length > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-xs bg-green-50 text-green-700 border-green-200">
          <Calendar className="h-3 w-3 ml-1" />
          {linkedMeetings.length}
        </Badge>
      )}
    </div>
  );
}
