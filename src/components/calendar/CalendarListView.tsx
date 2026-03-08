import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Users,
  CheckSquare,
  Bell,
  Briefcase,
  Calendar,
  ChevronLeft,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
} from "date-fns";
import { he } from "date-fns/locale";

interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  duration_minutes: number | null;
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

interface CalendarListViewProps {
  currentMonth: Date;
  timeEntries: TimeEntry[];
  meetings: Meeting[];
  tasks: Task[];
  reminders: Reminder[];
  onDayClick: (date: Date) => void;
  onDeleteMeeting?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onDeleteReminder?: (id: string) => void;
  onEditMeeting?: (meeting: Meeting) => void;
  onEditTask?: (task: Task) => void;
  onEditReminder?: (reminder: Reminder) => void;
}

export function CalendarListView({
  currentMonth,
  timeEntries,
  meetings,
  tasks,
  reminders,
  onDayClick,
  onDeleteMeeting,
  onDeleteTask,
  onDeleteReminder,
  onEditMeeting,
  onEditTask,
  onEditReminder,
}: CalendarListViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter((m) => isSameDay(parseISO(m.start_time), date));
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(
      (t) => t.due_date && isSameDay(parseISO(t.due_date), date),
    );
  };

  const getRemindersForDate = (date: Date) => {
    return reminders.filter((r) => isSameDay(parseISO(r.remind_at), date));
  };

  const getEntriesForDate = (date: Date) => {
    return timeEntries.filter((e) => isSameDay(parseISO(e.start_time), date));
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins.toString().padStart(2, "0")}`;
  };

  // Filter days that have events
  const daysWithEvents = days.filter((day) => {
    return (
      getMeetingsForDate(day).length > 0 ||
      getTasksForDate(day).length > 0 ||
      getRemindersForDate(day).length > 0 ||
      getEntriesForDate(day).length > 0
    );
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      case "low":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "היום";
    if (isTomorrow(date)) return "מחר";
    return format(date, "EEEE", { locale: he });
  };

  return (
    <Card className="border-2 border-border" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-[hsl(var(--gold))]" />
          רשימת אירועים - {format(currentMonth, "MMMM yyyy", { locale: he })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pl-4" dir="rtl">
          {daysWithEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-12" dir="rtl">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">אין אירועים החודש</p>
            </div>
          ) : (
            <div className="space-y-6">
              {daysWithEvents.map((day) => {
                const dayMeetings = getMeetingsForDate(day);
                const dayTasks = getTasksForDate(day);
                const dayReminders = getRemindersForDate(day);
                const dayEntries = getEntriesForDate(day);
                const dayIsToday = isToday(day);
                const dayIsPast = isPast(day) && !dayIsToday;

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-lg",
                      dayIsToday &&
                        "ring-2 ring-[hsl(var(--gold))] bg-[hsl(var(--gold))]/5",
                      dayIsPast && "opacity-60",
                    )}
                    onClick={() => onDayClick(day)}
                  >
                    {/* Date Header */}
                    <div
                      className={cn(
                        "flex items-center justify-between px-4 py-3",
                        dayIsToday
                          ? "bg-[hsl(var(--navy))] text-white"
                          : "bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex flex-col items-center justify-center",
                            dayIsToday ? "bg-white/20" : "bg-background",
                          )}
                        >
                          <span className="text-xl font-bold">
                            {format(day, "d")}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{getDateLabel(day)}</p>
                          <p
                            className={cn(
                              "text-sm",
                              dayIsToday
                                ? "text-white/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {format(day, "d בMMMM", { locale: he })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={dayIsToday ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {dayMeetings.length +
                          dayTasks.length +
                          dayReminders.length}{" "}
                        אירועים
                      </Badge>
                    </div>

                    {/* Events */}
                    <div className="p-4 space-y-2 bg-card">
                      {/* Meetings */}
                      {dayMeetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="group/item flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--navy))]/10 hover:bg-[hsl(var(--navy))]/20 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--navy))] flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{meeting.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(meeting.start_time), "HH:mm")} -{" "}
                              {format(parseISO(meeting.end_time), "HH:mm")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditMeeting?.(meeting);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMeeting?.(meeting.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Tasks */}
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className="group/item flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                            <CheckSquare className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{task.title}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                getPriorityColor(task.priority),
                              )}
                            >
                              {task.priority === "high"
                                ? "עדיפות גבוהה"
                                : task.priority === "low"
                                  ? "עדיפות נמוכה"
                                  : "עדיפות בינונית"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask?.(task);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask?.(task.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Reminders */}
                      {dayReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="group/item flex items-center gap-3 p-3 rounded-lg bg-warning/10 hover:bg-warning/20 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-10 h-10 rounded-lg bg-warning flex items-center justify-center shrink-0">
                            <Bell className="h-5 w-5 text-warning-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{reminder.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(reminder.remind_at), "HH:mm")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditReminder?.(reminder);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteReminder?.(reminder.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Time Entries */}
                      {dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {entry.description ||
                                entry.project?.name ||
                                "עבודה"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(entry.start_time), "HH:mm")}
                              {entry.end_time &&
                                ` - ${format(parseISO(entry.end_time), "HH:mm")}`}
                            </p>
                          </div>
                          {entry.duration_minutes && (
                            <Badge variant="outline">
                              {formatMinutes(entry.duration_minutes)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
