import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Types
interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_billable: boolean | null;
  hourly_rate: number | null;
}

interface Client {
  id: string;
  name: string;
}

interface CalendarViewProps {
  timeEntries: TimeEntry[];
  clients: Client[];
  defaultHourlyRate?: number;
  onDayClick?: (date: Date) => void;
}

// Colors
const COLORS = {
  navy: '#1e3a8a',
  gold: '#D5BC9E',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const weekDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export function CalendarView({
  timeEntries,
  clients,
  defaultHourlyRate = 150,
  onDayClick,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { locale: he });
    const calendarEnd = endOfWeek(monthEnd, { locale: he });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const grouped = new Map<string, {
      entries: TimeEntry[];
      totalMinutes: number;
      billableMinutes: number;
      revenue: number;
    }>();
    
    timeEntries.forEach(entry => {
      const dateKey = format(parseISO(entry.start_time), 'yyyy-MM-dd');
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          entries: [],
          totalMinutes: 0,
          billableMinutes: 0,
          revenue: 0,
        });
      }
      
      const day = grouped.get(dateKey)!;
      day.entries.push(entry);
      day.totalMinutes += entry.duration_minutes || 0;
      if (entry.is_billable) {
        day.billableMinutes += entry.duration_minutes || 0;
        day.revenue += ((entry.duration_minutes || 0) / 60) * (entry.hourly_rate || defaultHourlyRate);
      }
    });
    
    return grouped;
  }, [timeEntries, defaultHourlyRate]);

  // Calculate month stats
  const monthStats = useMemo(() => {
    let totalMinutes = 0;
    let billableMinutes = 0;
    let revenue = 0;
    let workDays = 0;
    
    calendarDays.forEach(day => {
      if (!isSameMonth(day, currentMonth)) return;
      
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayData = entriesByDate.get(dateKey);
      
      if (dayData && dayData.totalMinutes > 0) {
        totalMinutes += dayData.totalMinutes;
        billableMinutes += dayData.billableMinutes;
        revenue += dayData.revenue;
        workDays++;
      }
    });
    
    return { totalMinutes, billableMinutes, revenue, workDays };
  }, [calendarDays, currentMonth, entriesByDate]);

  // Get client name
  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'לא משויך';
    return clients.find(c => c.id === clientId)?.name || 'לא ידוע';
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // Format money
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get day intensity (for background color)
  const getDayIntensity = (minutes: number) => {
    if (minutes === 0) return 0;
    if (minutes < 120) return 1; // Less than 2 hours
    if (minutes < 240) return 2; // 2-4 hours
    if (minutes < 360) return 3; // 4-6 hours
    if (minutes < 480) return 4; // 6-8 hours
    return 5; // 8+ hours
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: COLORS.gold }} />
            לוח שנה
          </CardTitle>
          
          <div className="flex items-center gap-4">
            {/* Month navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-32 text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: he })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                היום
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Month Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: COLORS.navy }}>
              {formatDuration(monthStats.totalMinutes)}
            </div>
            <div className="text-sm text-muted-foreground">סה"כ שעות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: COLORS.success }}>
              {formatDuration(monthStats.billableMinutes)}
            </div>
            <div className="text-sm text-muted-foreground">שעות לחיוב</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: COLORS.gold }}>
              {formatMoney(monthStats.revenue)}
            </div>
            <div className="text-sm text-muted-foreground">הכנסה</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: COLORS.warning }}>
              {monthStats.workDays}
            </div>
            <div className="text-sm text-muted-foreground">ימי עבודה</div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => (
              <div
                key={i}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            <TooltipProvider>
              {calendarDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayData = entriesByDate.get(dateKey);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const intensity = getDayIntensity(dayData?.totalMinutes || 0);
                
                const intensityColors = [
                  'bg-background',
                  'bg-blue-100 dark:bg-blue-950',
                  'bg-blue-200 dark:bg-blue-900',
                  'bg-blue-300 dark:bg-blue-800',
                  'bg-blue-400 dark:bg-blue-700',
                  'bg-blue-500 dark:bg-blue-600',
                ];
                
                return (
                  <Tooltip key={dateKey}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onDayClick?.(day)}
                        className={cn(
                          'relative p-2 rounded-lg transition-all hover:ring-2 hover:ring-primary/50 min-h-[80px] text-right',
                          intensityColors[intensity],
                          !isCurrentMonth && 'opacity-40',
                          isToday(day) && 'ring-2 ring-primary',
                        )}
                      >
                        <div className={cn(
                          'text-sm font-medium',
                          isToday(day) && 'text-primary font-bold',
                          intensity >= 4 && 'text-white',
                        )}>
                          {format(day, 'd')}
                        </div>
                        
                        {dayData && dayData.totalMinutes > 0 && (
                          <div className="mt-1 space-y-1">
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs font-mono",
                                intensity >= 4 && "bg-white/20 text-white"
                              )}
                            >
                              {formatDuration(dayData.totalMinutes)}
                            </Badge>
                            {dayData.revenue > 0 && (
                              <div className={cn(
                                "text-xs",
                                intensity >= 4 ? "text-white/80" : "text-muted-foreground"
                              )}>
                                {formatMoney(dayData.revenue)}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    
                    {dayData && dayData.entries.length > 0 && (
                      <TooltipContent side="right" className="max-w-xs" dir="rtl">
                        <div className="space-y-2">
                          <div className="font-medium border-b pb-1">
                            {format(day, 'EEEE, d בMMMM', { locale: he })}
                          </div>
                          <ScrollArea className="max-h-48">
                            <div className="space-y-1">
                              {dayData.entries.slice(0, 5).map(entry => (
                                <div 
                                  key={entry.id}
                                  className="flex items-center justify-between text-sm gap-2"
                                >
                                  <span className="truncate">
                                    {entry.description || getClientName(entry.client_id)}
                                  </span>
                                  <Badge variant="outline" className="shrink-0">
                                    {formatDuration(entry.duration_minutes || 0)}
                                  </Badge>
                                </div>
                              ))}
                              {dayData.entries.length > 5 && (
                                <div className="text-xs text-muted-foreground text-center">
                                  +{dayData.entries.length - 5} נוספים
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                          <div className="border-t pt-2 flex items-center justify-between">
                            <span className="text-sm font-medium">סה"כ:</span>
                            <div className="text-left">
                              <div className="font-mono">
                                {formatDuration(dayData.totalMinutes)}
                              </div>
                              {dayData.revenue > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {formatMoney(dayData.revenue)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>

        {/* Intensity Legend */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">פחות</span>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={cn(
                'w-4 h-4 rounded',
                i === 0 && 'bg-background border',
                i === 1 && 'bg-blue-100 dark:bg-blue-950',
                i === 2 && 'bg-blue-200 dark:bg-blue-900',
                i === 3 && 'bg-blue-300 dark:bg-blue-800',
                i === 4 && 'bg-blue-400 dark:bg-blue-700',
                i === 5 && 'bg-blue-500 dark:bg-blue-600',
              )}
            />
          ))}
          <span className="text-sm text-muted-foreground">יותר</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default CalendarView;
