import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  Users,
  CheckSquare,
  Bell,
  LayoutGrid,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
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

interface CalendarAgendaViewProps {
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

type EventItem = {
  id: string;
  type: "meeting" | "task" | "reminder" | "time";
  time: Date;
  endTime?: Date;
  title: string;
  subtitle?: string;
  priority?: string;
  raw?: Meeting | Task | Reminder;
};

export function CalendarAgendaView({
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
}: CalendarAgendaViewProps) {
  // Combine all events into a single timeline
  const getAllEvents = (): EventItem[] => {
    const events: EventItem[] = [];

    meetings.forEach((m) => {
      events.push({
        id: m.id,
        type: "meeting",
        time: parseISO(m.start_time),
        endTime: parseISO(m.end_time),
        title: m.title,
        subtitle: m.status,
        raw: m,
      });
    });

    tasks.forEach((t) => {
      if (t.due_date) {
        events.push({
          id: t.id,
          type: "task",
          time: parseISO(t.due_date),
          title: t.title,
          priority: t.priority,
          raw: t,
        });
      }
    });

    reminders.forEach((r) => {
      events.push({
        id: r.id,
        type: "reminder",
        time: parseISO(r.remind_at),
        title: r.title,
        raw: r,
      });
    });

    timeEntries.forEach((e) => {
      events.push({
        id: e.id,
        type: "time",
        time: parseISO(e.start_time),
        endTime: e.end_time ? parseISO(e.end_time) : undefined,
        title: e.description || e.project?.name || "עבודה",
        subtitle: e.client?.name,
      });
    });

    return events.sort((a, b) => a.time.getTime() - b.time.getTime());
  };

  const allEvents = getAllEvents();

  // Group events by date
  const eventsByDate = allEvents.reduce(
    (acc, event) => {
      const dateKey = format(event.time, "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    },
    {} as Record<string, EventItem[]>,
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return Users;
      case "task":
        return CheckSquare;
      case "reminder":
        return Bell;
      case "time":
        return Clock;
      default:
        return Clock;
    }
  };

  const getEventColor = (type: string, priority?: string) => {
    switch (type) {
      case "meeting":
        return "bg-[hsl(var(--navy))] text-white";
      case "task":
        if (priority === "high") return "bg-red-500 text-white";
        if (priority === "low") return "bg-green-500 text-white";
        return "bg-primary text-primary-foreground";
      case "reminder":
        return "bg-warning text-warning-foreground";
      case "time":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted";
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    if (!end) return "";
    const mins = differenceInMinutes(end, start);
    const hrs = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hrs === 0) return `${minutes} דקות`;
    if (minutes === 0) return `${hrs} שעות`;
    return `${hrs}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="border-2 border-border" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutGrid className="h-5 w-5 text-[hsl(var(--gold))]" />
          אג׳נדה - {format(currentMonth, "MMMM yyyy", { locale: he })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pl-4" dir="rtl">
          {Object.keys(eventsByDate).length === 0 ? (
            <div className="text-center text-muted-foreground py-12" dir="rtl">
              <LayoutGrid className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">אין אירועים להצגה</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              {/* Timeline line - positioned on the right for RTL */}
              <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(var(--gold))] via-border to-transparent" />

              {Object.entries(eventsByDate).map(([dateKey, events]) => {
                const date = new Date(dateKey);
                const dayIsToday = isToday(date);

                return (
                  <div key={dateKey} className="relative pb-8">
                    {/* Date marker */}
                    <div
                      className={cn(
                        "sticky top-0 z-10 flex items-center gap-3 py-2 cursor-pointer",
                        "bg-gradient-to-l from-background via-background to-transparent",
                      )}
                      onClick={() => onDayClick(date)}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-md",
                          dayIsToday
                            ? "bg-[hsl(var(--gold))] text-white"
                            : "bg-card border-2 border-border",
                        )}
                      >
                        <span className="text-lg font-bold">
                          {format(date, "d")}
                        </span>
                        <span className="text-[10px]">
                          {format(date, "EEE", { locale: he })}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">
                          {dayIsToday
                            ? "היום"
                            : format(date, "EEEE", { locale: he })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {events.length} אירועים
                        </p>
                      </div>
                    </div>

                    {/* Events for this date */}
                    <div className="mr-16 space-y-3 mt-2">
                      {events.map((event) => {
                        const Icon = getEventIcon(event.type);
                        return (
                          <div
                            key={`${event.type}-${event.id}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-md transition-all group/event"
                          >
                            <div
                              className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                getEventColor(event.type, event.priority),
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate text-sm">{event.title}</h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(event.time, "HH:mm")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {event.endTime && (
                                  <Badge variant="outline" className="text-xs h-4 px-1">
                                    {formatDuration(event.time, event.endTime)}
                                  </Badge>
                                )}
                                {event.subtitle && (
                                  <span className="text-xs text-muted-foreground truncate">{event.subtitle}</span>
                                )}
                                {event.priority && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs h-4 px-1",
                                      event.priority === "high" && "border-red-500 text-red-500",
                                      event.priority === "low" && "border-green-500 text-green-500",
                                    )}
                                  >
                                    {event.priority === "high" ? "גבוהה" : event.priority === "low" ? "נמוכה" : "בינונית"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* Edit/Delete buttons on hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover/event:opacity-100 transition-opacity shrink-0">
                              {event.type !== "time" && (
                                <>
                                  <Button
                                    size="icon" variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (event.type === "meeting") onEditMeeting?.(event.raw as Meeting);
                                      else if (event.type === "task") onEditTask?.(event.raw as Task);
                                      else if (event.type === "reminder") onEditReminder?.(event.raw as Reminder);
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon" variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (event.type === "meeting") onDeleteMeeting?.(event.id);
                                      else if (event.type === "task") onDeleteTask?.(event.id);
                                      else if (event.type === "reminder") onDeleteReminder?.(event.id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
