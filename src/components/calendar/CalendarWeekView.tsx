import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Users, CheckSquare, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  isSameDay,
  isToday,
  parseISO,
  setHours,
  startOfDay,
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

interface CalendarWeekViewProps {
  currentDate: Date;
  timeEntries: TimeEntry[];
  meetings: Meeting[];
  tasks: Task[];
  reminders: Reminder[];
  onDayClick: (date: Date) => void;
  onAddClick: (date: Date) => void;
}

const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

export function CalendarWeekView({
  currentDate,
  timeEntries,
  meetings,
  tasks,
  reminders,
  onDayClick,
  onAddClick,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

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

  const getMeetingStyle = (meeting: Meeting) => {
    const startHour = parseISO(meeting.start_time).getHours();
    const endHour = parseISO(meeting.end_time).getHours();
    const startMin = parseISO(meeting.start_time).getMinutes();
    const endMin = parseISO(meeting.end_time).getMinutes();

    const top = (((startHour - 7) * 60 + startMin) / 60) * 48; // 48px per hour
    const height = Math.max(
      (((endHour - startHour) * 60 + (endMin - startMin)) / 60) * 48,
      24,
    );

    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <Card className="border-2 border-border overflow-hidden" dir="rtl">
      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-8 border-b bg-muted/30">
          <div className="p-3 text-center text-sm font-medium text-muted-foreground border-e">
            שעה
          </div>
          {days.map((day, idx) => (
            <div
              key={day.toString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "p-3 text-center cursor-pointer hover:bg-accent/50 transition-colors border-e last:border-e-0",
                isToday(day) && "bg-[hsl(var(--navy))]/10",
              )}
            >
              <div className="text-xs text-muted-foreground">
                {hebrewDays[idx]}
              </div>
              <div
                className={cn(
                  "text-lg font-bold mt-1",
                  isToday(day) &&
                    "bg-[hsl(var(--navy))] text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto",
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <ScrollArea className="h-[600px]" dir="rtl">
          <div className="grid grid-cols-8" dir="rtl">
            {/* Time column */}
            <div className="border-e">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 border-b text-xs text-muted-foreground text-center py-1 bg-muted/20"
                >
                  {hour.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const dayMeetings = getMeetingsForDate(day);
              const dayTasks = getTasksForDate(day);
              const dayReminders = getRemindersForDate(day);

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "border-e last:border-e-0 relative",
                    isToday(day) && "bg-[hsl(var(--gold))]/5",
                  )}
                  onClick={() => onDayClick(day)}
                >
                  {/* Hour slots */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-12 border-b border-dashed border-border/50 group hover:bg-accent/30 cursor-pointer"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity absolute end-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddClick(day);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {/* Meetings overlay */}
                  {dayMeetings.map((meeting) => {
                    const style = getMeetingStyle(meeting);
                    return (
                      <div
                        key={meeting.id}
                        className="absolute inset-x-1 bg-[hsl(var(--navy))] text-white rounded-md px-2 py-1 text-xs overflow-hidden shadow-md z-10 cursor-pointer hover:opacity-90"
                        style={style}
                      >
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 shrink-0" />
                          <span className="truncate font-medium">
                            {meeting.title}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-75">
                          {format(parseISO(meeting.start_time), "HH:mm")}
                        </div>
                      </div>
                    );
                  })}

                  {/* All day events (tasks/reminders) at top */}
                  {(dayTasks.length > 0 || dayReminders.length > 0) && (
                    <div className="absolute top-0 inset-x-1 space-y-1 z-20">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className="bg-primary/80 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded truncate"
                        >
                          <CheckSquare className="h-2.5 w-2.5 inline ml-0.5" />
                          {task.title}
                        </div>
                      ))}
                      {dayReminders.slice(0, 1).map((reminder) => (
                        <div
                          key={reminder.id}
                          className="bg-warning/80 text-warning-foreground text-[10px] px-1.5 py-0.5 rounded truncate"
                        >
                          <Bell className="h-2.5 w-2.5 inline ml-0.5" />
                          {reminder.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
