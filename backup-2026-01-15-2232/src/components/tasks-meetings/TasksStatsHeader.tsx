import React from 'react';
import { Task } from '@/hooks/useTasks';
import { Meeting } from '@/hooks/useMeetings';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { isPast, parseISO, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TasksStatsHeaderProps {
  tasks: Task[];
  meetings: Meeting[];
}

export function TasksStatsHeader({ tasks, meetings }: TasksStatsHeaderProps) {
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => 
    t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'completed'
  ).length;
  
  const todayMeetings = meetings.filter(m => isToday(parseISO(m.start_time))).length;
  const tomorrowMeetings = meetings.filter(m => isTomorrow(parseISO(m.start_time))).length;
  
  const completionRate = tasks.length > 0 
    ? Math.round((completedCount / tasks.length) * 100) 
    : 0;

  const stats = [
    {
      label: 'ממתינות',
      value: pendingCount,
      icon: Clock,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'בביצוע',
      value: inProgressCount,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'הושלמו',
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'באיחור',
      value: overdueCount,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      highlight: overdueCount > 0,
    },
    {
      label: 'פגישות היום',
      value: todayMeetings,
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.label}
            className={cn(
              "transition-all hover:shadow-md",
              stat.highlight && "ring-2 ring-red-200"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
