import React from 'react';
import { Task } from '@/hooks/useTasksOptimized';
import { Meeting } from '@/hooks/useMeetingsOptimized';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckSquare, Calendar, Clock, User, Pencil, Trash2,
  ArrowUp, ArrowRight, ArrowDown
} from 'lucide-react';
import { format, parseISO, isPast, isToday, isTomorrow, isThisWeek, isThisMonth, startOfDay, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  type: 'task' | 'meeting';
  title: string;
  date: Date;
  data: Task | Meeting;
}

interface TasksTimelineViewProps {
  tasks: Task[];
  meetings: Meeting[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (id: string) => void;
  onMeetingEdit: (meeting: Meeting) => void;
  onMeetingDelete: (id: string) => void;
}

const priorities = [
  { value: 'low', icon: ArrowDown, color: 'text-green-600' },
  { value: 'medium', icon: ArrowRight, color: 'text-amber-500' },
  { value: 'high', icon: ArrowUp, color: 'text-red-500' },
];

export function TasksTimelineView({ 
  tasks, 
  meetings, 
  onTaskEdit, 
  onTaskDelete,
  onMeetingEdit,
  onMeetingDelete 
}: TasksTimelineViewProps) {
  // Combine and sort items
  const timelineItems: TimelineItem[] = [
    ...tasks
      .filter(t => t.due_date)
      .map(t => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        date: parseISO(t.due_date!),
        data: t,
      })),
    ...meetings.map(m => ({
      id: m.id,
      type: 'meeting' as const,
      title: m.title,
      date: parseISO(m.start_time),
      data: m,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group by date section
  const groups: { label: string; items: TimelineItem[] }[] = [];
  
  const addToGroup = (label: string, item: TimelineItem) => {
    const existing = groups.find(g => g.label === label);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  };

  timelineItems.forEach(item => {
    const today = startOfDay(new Date());
    const itemDate = startOfDay(item.date);
    const daysDiff = differenceInDays(itemDate, today);

    if (daysDiff < 0) {
      addToGroup('באיחור', item);
    } else if (daysDiff === 0) {
      addToGroup('היום', item);
    } else if (daysDiff === 1) {
      addToGroup('מחר', item);
    } else if (daysDiff <= 7) {
      addToGroup('השבוע', item);
    } else if (daysDiff <= 30) {
      addToGroup('החודש', item);
    } else {
      addToGroup('בהמשך', item);
    }
  });

  const getGroupColor = (label: string) => {
    switch (label) {
      case 'באיחור': return 'border-red-500 bg-red-50';
      case 'היום': return 'border-amber-500 bg-amber-50';
      case 'מחר': return 'border-blue-500 bg-blue-50';
      case 'השבוע': return 'border-primary bg-primary/5';
      default: return 'border-muted-foreground/30 bg-muted/30';
    }
  };

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>אין אירועים להצגה</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="relative pr-8" dir="rtl">
        {/* Timeline Line */}
        <div className="absolute right-3 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Group Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background z-10",
                  getGroupColor(group.label).split(' ')[0]
                )}>
                  <div className="w-2 h-2 rounded-full bg-current" />
                </div>
                <h3 className={cn(
                  "font-semibold px-3 py-1 rounded-full text-sm",
                  getGroupColor(group.label)
                )}>
                  {group.label} ({group.items.length})
                </h3>
              </div>

              {/* Items */}
              <div className="space-y-3 mr-6">
                {group.items.map((item) => {
                  const isTask = item.type === 'task';
                  const task = isTask ? (item.data as Task) : null;
                  const meeting = !isTask ? (item.data as Meeting) : null;
                  const priorityInfo = task ? priorities.find(p => p.value === task.priority) : null;
                  const PriorityIcon = priorityInfo?.icon;

                  return (
                    <Card 
                      key={item.id}
                      className={cn(
                        "group hover:shadow-md transition-all",
                        isTask ? "border-r-4 border-r-primary" : "border-r-4 border-r-amber-500"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          {/* Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => isTask ? onTaskEdit(task!) : onMeetingEdit(meeting!)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => isTask ? onTaskDelete(task!.id) : onMeetingDelete(meeting!.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>

                          {/* Content */}
                          <div className="flex-1 text-right">
                            <div className="flex items-center gap-2 justify-end mb-1">
                              {isTask ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Calendar className="h-4 w-4 text-amber-500" />
                              )}
                              <h4 className={cn(
                                "font-medium",
                                task?.status === 'completed' && "line-through text-muted-foreground"
                              )}>
                                {item.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground justify-end">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(item.date, 'HH:mm', { locale: he })}
                              </span>
                              <span>
                                {format(item.date, 'EEEE, d/M', { locale: he })}
                              </span>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-2 mt-2 justify-end flex-wrap">
                              {isTask && (
                                <>
                                  {PriorityIcon && (
                                    <PriorityIcon className={cn("h-3.5 w-3.5", priorityInfo?.color)} />
                                  )}
                                  <Badge 
                                    variant={task?.status === 'completed' ? 'secondary' : 'outline'}
                                    className="text-xs"
                                  >
                                    {task?.status === 'completed' ? 'הושלם' : 
                                     task?.status === 'in_progress' ? 'בביצוע' : 'ממתין'}
                                  </Badge>
                                  {task?.client?.name && (
                                    <Badge variant="outline" className="text-xs">
                                      <User className="h-3 w-3 ml-1" />
                                      {task.client.name}
                                    </Badge>
                                  )}
                                </>
                              )}
                              {!isTask && meeting?.location && (
                                <Badge variant="outline" className="text-xs">
                                  {meeting.location}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
