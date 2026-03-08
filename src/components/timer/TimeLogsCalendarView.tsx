// Time Logs Calendar View Component
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  client_id?: string | null;
  project_id?: string | null;
  description?: string | null;
}

interface Client {
  id: string;
  name: string;
}

interface TimeLogsCalendarViewProps {
  timeEntries: TimeEntry[];
  clients: Client[];
  getClientName: (clientId: string | null) => string;
  onDayClick?: (date: Date) => void;
  onAddEntry?: () => void;
}

export function TimeLogsCalendarView({
  timeEntries,
  clients,
  getClientName,
  onDayClick,
  onAddEntry,
}: TimeLogsCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group entries by day
  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    timeEntries.forEach(entry => {
      const day = format(new Date(entry.start_time), 'yyyy-MM-dd');
      if (!map.has(day)) {
        map.set(day, []);
      }
      map.get(day)!.push(entry);
    });
    return map;
  }, [timeEntries]);

  // Calculate total hours per day
  const hoursByDay = useMemo(() => {
    const map = new Map<string, number>();
    entriesByDay.forEach((entries, day) => {
      const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      map.set(day, totalMinutes / 60);
    });
    return map;
  }, [entriesByDay]);

  const weekDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <Card className="border-border bg-card" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">לוח שנה</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: he })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {onAddEntry && (
              <Button onClick={onAddEntry} size="sm" className="gap-2 mr-4">
                <Plus className="h-4 w-4" />
                הוסף
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEntries = entriesByDay.get(dayKey) || [];
            const totalHours = hoursByDay.get(dayKey) || 0;
            const isCurrentMonth = isWithinInterval(day, { start: monthStart, end: monthEnd });
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dayKey}
                onClick={() => onDayClick?.(day)}
                className={cn(
                  "min-h-[80px] p-1 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                  !isCurrentMonth && "opacity-40",
                  isToday && "border-primary bg-primary/5"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday && "text-primary"
                )}>
                  {format(day, 'd')}
                </div>
                {totalHours > 0 && (
                  <Badge variant="secondary" className="text-xs mb-1">
                    {totalHours.toFixed(1)} שעות
                  </Badge>
                )}
                <ScrollArea className="h-[40px]">
                  {dayEntries.slice(0, 2).map(entry => (
                    <div key={entry.id} className="text-xs truncate text-muted-foreground">
                      {getClientName(entry.client_id)}
                    </div>
                  ))}
                  {dayEntries.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEntries.length - 2} נוספים
                    </div>
                  )}
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default TimeLogsCalendarView;
