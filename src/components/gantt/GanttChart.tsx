// Gantt Chart View Component - tenarch CRM Pro
// תצוגת Gantt לפרויקטים ומשימות

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Calendar,
  Briefcase,
  CheckSquare,
  User,
} from 'lucide-react';
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  differenceInDays,
  isWithinInterval,
  isSameDay,
  parseISO,
  isToday,
} from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface GanttTask {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  progress?: number; // 0-100
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignee?: string;
  color?: string;
  parent_id?: string; // for subtasks
  type?: 'project' | 'task' | 'milestone';
}

interface GanttChartProps {
  tasks: GanttTask[];
  onTaskClick?: (task: GanttTask) => void;
  className?: string;
}

type ViewMode = 'day' | 'week' | 'month';

const STATUS_COLORS = {
  pending: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  overdue: 'bg-red-500',
};

const TYPE_ICONS = {
  project: Briefcase,
  task: CheckSquare,
  milestone: Calendar,
};

export function GanttChart({ tasks, onTaskClick, className }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoom, setZoom] = useState(1);

  // Calculate date range based on tasks or default to current month
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end };
    }

    const dates = tasks.flatMap(t => [parseISO(t.start_date), parseISO(t.end_date)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add some padding
    return {
      start: subDays(minDate, 7),
      end: addDays(maxDate, 7),
    };
  }, [tasks, currentDate]);

  // Generate timeline columns based on view mode
  const timelineColumns = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
      case 'week':
        return eachWeekOfInterval({ start: dateRange.start, end: dateRange.end }, { locale: he });
      case 'month':
        const months: Date[] = [];
        let current = startOfMonth(dateRange.start);
        while (current <= dateRange.end) {
          months.push(current);
          current = addMonths(current, 1);
        }
        return months;
      default:
        return [];
    }
  }, [viewMode, dateRange]);

  // Calculate column width based on zoom
  const columnWidth = useMemo(() => {
    const baseWidth = viewMode === 'day' ? 40 : viewMode === 'week' ? 100 : 150;
    return baseWidth * zoom;
  }, [viewMode, zoom]);

  // Calculate task position and width
  const getTaskStyle = (task: GanttTask) => {
    const start = parseISO(task.start_date);
    const end = parseISO(task.end_date);
    const totalDays = differenceInDays(dateRange.end, dateRange.start);
    const startOffset = differenceInDays(start, dateRange.start);
    const duration = differenceInDays(end, start) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const amount = viewMode === 'day' ? 7 : viewMode === 'week' ? 4 : 1;
    const fn = direction === 'prev' 
      ? (viewMode === 'month' ? subMonths : subWeeks)
      : (viewMode === 'month' ? addMonths : addWeeks);
    setCurrentDate(fn(currentDate, amount));
  };

  const formatColumnHeader = (date: Date) => {
    switch (viewMode) {
      case 'day':
        return format(date, 'd', { locale: he });
      case 'week':
        return format(date, 'dd/MM', { locale: he });
      case 'month':
        return format(date, 'MMMM yyyy', { locale: he });
      default:
        return '';
    }
  };

  const formatColumnSubHeader = (date: Date) => {
    switch (viewMode) {
      case 'day':
        return format(date, 'EEE', { locale: he });
      case 'week':
        return `שבוע ${format(date, 'w', { locale: he })}`;
      default:
        return '';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)} dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            תצוגת Gantt
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Navigation */}
            <Button variant="outline" size="icon" onClick={() => handleNavigate('prev')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleNavigate('next')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* View Mode */}
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="day">יומי</SelectItem>
                <SelectItem value="week">שבועי</SelectItem>
                <SelectItem value="month">חודשי</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Zoom */}
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="w-full" dir="ltr">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b bg-muted/50 sticky top-0 z-10">
              {/* Task Names Column */}
              <div className="w-[250px] flex-shrink-0 p-3 font-medium border-l bg-background">
                משימה / פרויקט
              </div>
              
              {/* Timeline Columns */}
              <div className="flex-1 flex">
                {timelineColumns.map((date, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 border-l text-sm",
                      isToday(date) && "bg-primary/10",
                      isSameDay(date, new Date()) && "border-primary border-2"
                    )}
                    style={{ width: columnWidth, minWidth: columnWidth }}
                  >
                    <span className="font-medium">{formatColumnHeader(date)}</span>
                    {viewMode !== 'month' && (
                      <span className="text-xs text-muted-foreground">
                        {formatColumnSubHeader(date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                אין משימות להצגה
              </div>
            ) : (
              tasks.map((task) => {
                const TypeIcon = TYPE_ICONS[task.type || 'task'];
                const statusColor = STATUS_COLORS[task.status || 'pending'];
                const style = getTaskStyle(task);
                
                return (
                  <div key={task.id} className="flex border-b hover:bg-muted/30 transition-colors">
                    {/* Task Name */}
                    <div 
                      className="w-[250px] flex-shrink-0 p-3 border-l flex items-center gap-2 cursor-pointer hover:bg-muted/50"
                      onClick={() => onTaskClick?.(task)}
                    >
                      <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate font-medium">{task.name}</span>
                      {task.assignee && (
                        <Badge variant="secondary" className="text-xs mr-auto">
                          <User className="h-3 w-3 ml-1" />
                          {task.assignee}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Gantt Bar */}
                    <div className="flex-1 relative h-12">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {timelineColumns.map((date, i) => (
                          <div
                            key={i}
                            className={cn(
                              "border-l h-full",
                              isToday(date) && "bg-primary/5"
                            )}
                            style={{ width: columnWidth, minWidth: columnWidth }}
                          />
                        ))}
                      </div>
                      
                      {/* Task Bar */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "absolute top-2 h-8 rounded-md cursor-pointer transition-all hover:scale-y-110",
                                task.color || statusColor
                              )}
                              style={style}
                              onClick={() => onTaskClick?.(task)}
                            >
                              {/* Progress bar */}
                              {task.progress !== undefined && task.progress < 100 && (
                                <div
                                  className="absolute inset-y-0 right-0 bg-black/20 rounded-l-md"
                                  style={{ width: `${100 - task.progress}%` }}
                                />
                              )}
                              
                              {/* Task name on bar (if wide enough) */}
                              <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium px-2 truncate">
                                {task.name}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent dir="rtl" className="max-w-[300px]">
                            <div className="space-y-1">
                              <p className="font-bold">{task.name}</p>
                              <p className="text-sm">
                                {format(parseISO(task.start_date), 'dd/MM/yyyy', { locale: he })} - {format(parseISO(task.end_date), 'dd/MM/yyyy', { locale: he })}
                              </p>
                              {task.progress !== undefined && (
                                <p className="text-sm">התקדמות: {task.progress}%</p>
                              )}
                              {task.assignee && (
                                <p className="text-sm">אחראי: {task.assignee}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Helper hook to convert projects/tasks to Gantt format
export function useGanttTasks(
  projects: Array<{
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }>,
  tasks: Array<{
    id: string;
    title: string;
    due_date?: string;
    status?: string;
    project_id?: string;
    assignee?: { full_name: string };
  }>
): GanttTask[] {
  return useMemo(() => {
    const ganttTasks: GanttTask[] = [];
    
    // Add projects
    projects.forEach(project => {
      if (project.start_date && project.end_date) {
        ganttTasks.push({
          id: project.id,
          name: project.name,
          start_date: project.start_date,
          end_date: project.end_date,
          type: 'project',
          status: project.status === 'completed' ? 'completed' : 
                  project.status === 'in_progress' ? 'in_progress' : 'pending',
          color: 'bg-primary',
        });
      }
    });
    
    // Add tasks
    tasks.forEach(task => {
      if (task.due_date) {
        // Tasks are typically single-day items
        ganttTasks.push({
          id: task.id,
          name: task.title,
          start_date: task.due_date,
          end_date: task.due_date,
          type: 'task',
          parent_id: task.project_id || undefined,
          assignee: task.assignee?.full_name,
          status: task.status === 'done' ? 'completed' :
                  task.status === 'in_progress' ? 'in_progress' : 'pending',
        });
      }
    });
    
    return ganttTasks.sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  }, [projects, tasks]);
}
