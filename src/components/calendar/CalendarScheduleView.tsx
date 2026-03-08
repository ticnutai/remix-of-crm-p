import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Users,
  CheckSquare,
  Bell,
  Table as TableIcon,
  Calendar,
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

interface CalendarScheduleViewProps {
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

export function CalendarScheduleView({
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
}: CalendarScheduleViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getMeetingsForDate = (date: Date) =>
    meetings.filter((m) => isSameDay(parseISO(m.start_time), date));
  const getTasksForDate = (date: Date) =>
    tasks.filter((t) => t.due_date && isSameDay(parseISO(t.due_date), date));
  const getRemindersForDate = (date: Date) =>
    reminders.filter((r) => isSameDay(parseISO(r.remind_at), date));
  const getEntriesForDate = (date: Date) =>
    timeEntries.filter((e) => isSameDay(parseISO(e.start_time), date));

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins.toString().padStart(2, "0")}`;
  };

  const getTotalMinutesForDate = (date: Date) => {
    const entries = getEntriesForDate(date);
    return entries.reduce(
      (total, entry) => total + (entry.duration_minutes || 0),
      0,
    );
  };

  // Filter days that have at least one event
  const daysWithEvents = days.filter((day) => {
    return (
      getMeetingsForDate(day).length > 0 ||
      getTasksForDate(day).length > 0 ||
      getRemindersForDate(day).length > 0 ||
      getEntriesForDate(day).length > 0
    );
  });

  return (
    <Card className="border-2 border-border overflow-hidden" dir="rtl">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TableIcon className="h-5 w-5 text-[hsl(var(--gold))]" />
          לו״ז - {format(currentMonth, "MMMM yyyy", { locale: he })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <Table dir="rtl">
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="text-right w-[140px]">תאריך</TableHead>
                <TableHead className="text-center w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" />
                    פגישות
                  </div>
                </TableHead>
                <TableHead className="text-center w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    <CheckSquare className="h-4 w-4" />
                    משימות
                  </div>
                </TableHead>
                <TableHead className="text-center w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    <Bell className="h-4 w-4" />
                    תזכורות
                  </div>
                </TableHead>
                <TableHead className="text-center w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    שעות
                  </div>
                </TableHead>
                <TableHead className="text-right">פרטים</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daysWithEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">
                      אין אירועים להצגה החודש
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                daysWithEvents.map((day) => {
                  const dayMeetings = getMeetingsForDate(day);
                  const dayTasks = getTasksForDate(day);
                  const dayReminders = getRemindersForDate(day);
                  const totalMinutes = getTotalMinutesForDate(day);
                  const dayIsToday = isToday(day);

                  // Get first event of each type for details column
                  const firstMeeting = dayMeetings[0];
                  const firstTask = dayTasks[0];

                  return (
                    <TableRow
                      key={day.toString()}
                      className={cn(
                        "cursor-pointer hover:bg-accent/50 transition-colors",
                        dayIsToday &&
                          "bg-[hsl(var(--gold))]/10 hover:bg-[hsl(var(--gold))]/20",
                      )}
                      onClick={() => onDayClick(day)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                              dayIsToday
                                ? "bg-[hsl(var(--navy))] text-white"
                                : "bg-muted",
                            )}
                          >
                            {format(day, "d")}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {format(day, "EEEE", { locale: he })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(day, "d/M", { locale: he })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {dayMeetings.length > 0 ? (
                          <Badge className="bg-[hsl(var(--navy))] text-white">
                            {dayMeetings.length}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {dayTasks.length > 0 ? (
                          <Badge variant="default">{dayTasks.length}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {dayReminders.length > 0 ? (
                          <Badge className="bg-warning text-warning-foreground">
                            {dayReminders.length}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {totalMinutes > 0 ? (
                          <Badge variant="outline" className="font-mono">
                            {formatMinutes(totalMinutes)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right" dir="rtl">
                        <div className="flex flex-wrap gap-1.5 max-w-[340px]">
                          {dayMeetings.map((m) => (
                            <div
                              key={m.id}
                              className="group/badge relative inline-flex items-center gap-1 text-xs bg-[hsl(var(--navy))]/10 border border-[hsl(var(--navy))]/30 rounded-md px-1.5 py-0.5"
                            >
                              <Users className="h-3 w-3 text-[hsl(var(--navy))] shrink-0" />
                              <span className="truncate max-w-[100px]">
                                {m.title}
                              </span>
                              <div className="flex gap-0.5 opacity-0 group-hover/badge:opacity-100 transition-opacity">
                                <button
                                  className="p-0.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditMeeting?.(m);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteMeeting?.(m.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {dayTasks.map((t) => (
                            <div
                              key={t.id}
                              className={cn(
                                "group/badge relative inline-flex items-center gap-1 text-xs border rounded-md px-1.5 py-0.5",
                                t.priority === "high"
                                  ? "border-red-500/50 bg-red-500/10"
                                  : t.priority === "low"
                                    ? "border-green-500/50 bg-green-500/10"
                                    : "border-primary/30 bg-primary/10",
                              )}
                            >
                              <CheckSquare className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[100px]">
                                {t.title}
                              </span>
                              <div className="flex gap-0.5 opacity-0 group-hover/badge:opacity-100 transition-opacity">
                                <button
                                  className="p-0.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTask?.(t);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTask?.(t.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {dayReminders.map((r) => (
                            <div
                              key={r.id}
                              className="group/badge relative inline-flex items-center gap-1 text-xs bg-warning/10 border border-warning/30 rounded-md px-1.5 py-0.5"
                            >
                              <Bell className="h-3 w-3 text-warning shrink-0" />
                              <span className="truncate max-w-[100px]">
                                {r.title}
                              </span>
                              <div className="flex gap-0.5 opacity-0 group-hover/badge:opacity-100 transition-opacity">
                                <button
                                  className="p-0.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditReminder?.(r);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteReminder?.(r.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
