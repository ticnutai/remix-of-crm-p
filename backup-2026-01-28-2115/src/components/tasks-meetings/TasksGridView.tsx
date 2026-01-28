import React from 'react';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, Trash2, Calendar, User, Briefcase, 
  ArrowUp, ArrowRight, ArrowDown, AlertCircle, MoreVertical 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const priorities = [
  { value: 'low', label: 'נמוכה', icon: ArrowDown, color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'medium', label: 'בינונית', icon: ArrowRight, color: 'text-amber-600', bg: 'bg-amber-100' },
  { value: 'high', label: 'גבוהה', icon: ArrowUp, color: 'text-red-600', bg: 'bg-red-100' },
];

const statuses = [
  { value: 'pending', label: 'ממתין', color: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'בביצוע', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'הושלם', color: 'bg-green-100 text-green-700' },
];

interface TasksGridViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: Task) => void;
}

export function TasksGridView({ tasks, onEdit, onDelete, onToggleComplete }: TasksGridViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>אין משימות להצגה</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tasks.map((task) => {
        const priorityInfo = priorities.find(p => p.value === task.priority) || priorities[1];
        const statusInfo = statuses.find(s => s.value === task.status) || statuses[0];
        const PriorityIcon = priorityInfo.icon;
        const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed';
        const isDueToday = task.due_date && isToday(parseISO(task.due_date));

        return (
          <Card 
            key={task.id}
            className={cn(
              "group hover:shadow-lg transition-all duration-200 overflow-hidden",
              task.status === 'completed' && "opacity-70",
              isOverdue && "ring-2 ring-red-200"
            )}
          >
            {/* Priority Strip */}
            <div className={cn("h-1", priorityInfo.bg)} />
            
            <CardHeader className="pb-2 pt-3">
              <div className="flex items-start justify-between gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit className="h-4 w-4 ml-2" />
                      עריכה
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחיקה
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <h3 className={cn(
                    "font-medium text-sm text-right line-clamp-2",
                    task.status === 'completed' && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h3>
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => onToggleComplete(task)}
                    className="h-4 w-4 shrink-0"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 text-right">
                  {task.description}
                </p>
              )}

              {/* Due Date */}
              {task.due_date && (
                <div className={cn(
                  "flex items-center gap-1 text-xs justify-end",
                  isOverdue && "text-red-600 font-medium",
                  isDueToday && !isOverdue && "text-amber-600"
                )}>
                  {isOverdue && <AlertCircle className="h-3 w-3" />}
                  <Calendar className="h-3 w-3" />
                  <span>{format(parseISO(task.due_date), 'dd/MM HH:mm', { locale: he })}</span>
                </div>
              )}

              {/* Tags */}
              <div className="flex items-center gap-1.5 justify-end flex-wrap">
                <Badge className={cn("text-xs px-1.5 py-0", statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
                <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs", priorityInfo.bg, priorityInfo.color)}>
                  <PriorityIcon className="h-3 w-3" />
                  <span>{priorityInfo.label}</span>
                </div>
              </div>

              {/* Client/Project */}
              <div className="flex items-center gap-1.5 justify-end flex-wrap text-xs text-muted-foreground">
                {task.client?.name && (
                  <span className="flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded">
                    <User className="h-3 w-3" />
                    {task.client.name}
                  </span>
                )}
                {task.project?.name && (
                  <span className="flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded">
                    <Briefcase className="h-3 w-3" />
                    {task.project.name}
                  </span>
                )}
              </div>

              {/* Assignee */}
              {task.assignee?.full_name && (
                <div className="flex items-center gap-1.5 justify-end text-xs text-muted-foreground border-t pt-2">
                  <span>{task.assignee.full_name}</span>
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
