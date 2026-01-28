// Time Logs Heatmap View Component
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfWeek, addDays, subWeeks, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  start_time: string;
  duration_minutes?: number | null;
}

interface TimeLogsHeatmapViewProps {
  timeEntries: TimeEntry[];
  onDayClick?: (date: Date) => void;
  weeks?: number;
}

export function TimeLogsHeatmapView({
  timeEntries,
  onDayClick,
  weeks = 12,
}: TimeLogsHeatmapViewProps) {
  // Calculate hours per day
  const hoursByDay = useMemo(() => {
    const map = new Map<string, number>();
    timeEntries.forEach(entry => {
      const day = format(new Date(entry.start_time), 'yyyy-MM-dd');
      const current = map.get(day) || 0;
      map.set(day, current + (entry.duration_minutes || 0) / 60);
    });
    return map;
  }, [timeEntries]);

  // Generate weeks
  const weeksData = useMemo(() => {
    const today = new Date();
    const result: Date[][] = [];
    
    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(today, w), { weekStartsOn: 0 });
      const weekDays: Date[] = [];
      for (let d = 0; d < 7; d++) {
        weekDays.push(addDays(weekStart, d));
      }
      result.push(weekDays);
    }
    
    return result;
  }, [weeks]);

  // Get color based on hours
  const getHeatColor = (hours: number) => {
    if (hours === 0) return 'bg-muted';
    if (hours < 2) return 'bg-primary/20';
    if (hours < 4) return 'bg-primary/40';
    if (hours < 6) return 'bg-primary/60';
    if (hours < 8) return 'bg-primary/80';
    return 'bg-primary';
  };

  // Calculate max and total
  const { maxHours, totalHours } = useMemo(() => {
    let max = 0;
    let total = 0;
    hoursByDay.forEach(hours => {
      if (hours > max) max = hours;
      total += hours;
    });
    return { maxHours: max, totalHours: total };
  }, [hoursByDay]);

  const weekDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

  return (
    <Card className="border-border bg-card" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">מפת חום</CardTitle>
          <div className="text-sm text-muted-foreground">
            סה״כ {totalHours.toFixed(1)} שעות | מקסימום ביום: {maxHours.toFixed(1)} שעות
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Day labels */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-6">
            {weekDays.map(day => (
              <div key={day} className="h-4 flex items-center">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-1">
              {weeksData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {/* Month label on first day of month */}
                  <div className="h-5 text-xs text-muted-foreground">
                    {week[0].getDate() <= 7 && format(week[0], 'MMM', { locale: he })}
                  </div>
                  {week.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const hours = hoursByDay.get(dayKey) || 0;
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={dayKey}
                        onClick={() => onDayClick?.(day)}
                        className={cn(
                          "w-4 h-4 rounded-sm cursor-pointer transition-all hover:scale-125",
                          getHeatColor(hours),
                          isToday && "ring-2 ring-primary ring-offset-1"
                        )}
                        title={`${format(day, 'dd/MM/yyyy')}: ${hours.toFixed(1)} שעות`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
          <span>פחות</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-sm bg-muted" />
            <div className="w-4 h-4 rounded-sm bg-primary/20" />
            <div className="w-4 h-4 rounded-sm bg-primary/40" />
            <div className="w-4 h-4 rounded-sm bg-primary/60" />
            <div className="w-4 h-4 rounded-sm bg-primary/80" />
            <div className="w-4 h-4 rounded-sm bg-primary" />
          </div>
          <span>יותר</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default TimeLogsHeatmapView;
