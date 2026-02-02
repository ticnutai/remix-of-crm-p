import React, { useState } from 'react';
import { Task } from '@/hooks/useTasksOptimized';
import { Meeting } from '@/hooks/useMeetingsOptimized';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, ChevronLeft, CheckSquare, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TasksCalendarViewProps {
  tasks: Task[];
  meetings: Meeting[];
  onTaskClick: (task: Task) => void;
  onMeetingClick: (meeting: Meeting) => void;
}

export function TasksCalendarView({ tasks, meetings, onTaskClick, onMeetingClick }: TasksCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get items for selected date
  const selectedDateTasks = selectedDate 
    ? tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), selectedDate))
    : [];
  
  const selectedDateMeetings = selectedDate
    ? meetings.filter(m => isSameDay(parseISO(m.start_time), selectedDate))
    : [];

  // Get dates with items for highlighting
  const datesWithTasks = tasks
    .filter(t => t.due_date)
    .map(t => parseISO(t.due_date!));
  
  const datesWithMeetings = meetings.map(m => parseISO(m.start_time));

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: he })}
              </h2>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={he}
              className="w-full"
              modifiers={{
                hasTasks: datesWithTasks,
                hasMeetings: datesWithMeetings,
              }}
              modifiersStyles={{
                hasTasks: {
                  fontWeight: 'bold',
                },
                hasMeetings: {
                  fontWeight: 'bold',
                },
              }}
              components={{
                DayContent: ({ date }) => {
                  const dayTasks = tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), date));
                  const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.start_time), date));
                  const hasItems = dayTasks.length > 0 || dayMeetings.length > 0;
                  
                  return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <span>{date.getDate()}</span>
                      {hasItems && (
                        <div className="absolute bottom-0 flex gap-0.5">
                          {dayTasks.length > 0 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                          {dayMeetings.length > 0 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />

            {/* Legend */}
            <div className="flex items-center gap-4 justify-center mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>משימות</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>פגישות</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 text-right flex items-center gap-2 justify-end">
              {selectedDate ? format(selectedDate, 'EEEE, d בMMMM', { locale: he }) : 'בחר תאריך'}
              <CalendarIcon className="h-4 w-4" />
            </h3>

            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {/* Tasks */}
                {selectedDateTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1 justify-end">
                      משימות ({selectedDateTasks.length})
                      <CheckSquare className="h-3 w-3" />
                    </h4>
                    <div className="space-y-2">
                      {selectedDateTasks.map((task) => (
                        <Card 
                          key={task.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => onTaskClick(task)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant={task.status === 'completed' ? 'secondary' : 'default'}
                                className="text-xs"
                              >
                                {task.status === 'completed' ? 'הושלם' : 
                                 task.status === 'in_progress' ? 'בביצוע' : 'ממתין'}
                              </Badge>
                              <span className={cn(
                                "text-sm font-medium",
                                task.status === 'completed' && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </span>
                            </div>
                            {task.due_date && (
                              <p className="text-xs text-muted-foreground text-right mt-1">
                                {format(parseISO(task.due_date), 'HH:mm', { locale: he })}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meetings */}
                {selectedDateMeetings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1 justify-end">
                      פגישות ({selectedDateMeetings.length})
                      <Clock className="h-3 w-3" />
                    </h4>
                    <div className="space-y-2">
                      {selectedDateMeetings.map((meeting) => (
                        <Card 
                          key={meeting.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-r-2 border-r-amber-500"
                          onClick={() => onMeetingClick(meeting)}
                        >
                          <CardContent className="p-3">
                            <div className="text-right">
                              <span className="text-sm font-medium">{meeting.title}</span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(parseISO(meeting.start_time), 'HH:mm', { locale: he })} - 
                                {format(parseISO(meeting.end_time), 'HH:mm', { locale: he })}
                              </p>
                              {meeting.location && (
                                <p className="text-xs text-muted-foreground">{meeting.location}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDateTasks.length === 0 && selectedDateMeetings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>אין אירועים ביום זה</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
