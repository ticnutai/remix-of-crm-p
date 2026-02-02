// SidebarTaskItem - Mini Task Card for Sidebar
import React, { useState } from 'react';
import { Task } from '@/hooks/useTasksOptimized';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Clock,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  Building,
} from 'lucide-react';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';

// Sidebar colors
const sidebarColors = {
  navy: '#162C58',
  gold: '#D4A843',
  goldLight: '#E8D1B4',
  goldDark: '#B8923A',
  navyLight: '#1E3A6E',
  navyDark: '#0F1F3D',
};

// Priority configuration
const priorityConfig = {
  high: {
    label: 'גבוהה',
    icon: ArrowUp,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
  },
  medium: {
    label: 'בינונית',
    icon: ArrowRight,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
  },
  low: {
    label: 'נמוכה',
    icon: ArrowDown,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
  },
};

// Status configuration
const statusConfig = {
  pending: { label: 'ממתין', color: 'text-gray-400' },
  in_progress: { label: 'בביצוע', color: 'text-blue-400' },
  completed: { label: 'הושלם', color: 'text-green-400' },
};

interface SidebarTaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function SidebarTaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: SidebarTaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isCompleted = task.status === 'completed';
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const PriorityIcon = priority.icon;
  
  // Date calculations
  const dueDate = task.due_date ? parseISO(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isCompleted;
  const isDueToday = dueDate && isToday(dueDate);
  const isDueTomorrow = dueDate && isTomorrow(dueDate);
  
  // Format due date
  const formatDueDate = () => {
    if (!dueDate) return null;
    if (isDueToday) return 'היום';
    if (isDueTomorrow) return 'מחר';
    return format(dueDate, 'd MMM', { locale: he });
  };

  return (
    <div
      className={cn(
        "group relative p-2.5 rounded-lg transition-all duration-200 cursor-pointer",
        "border border-transparent",
        isCompleted && "opacity-60",
        isOverdue && !isCompleted && "border-red-500/30 bg-red-500/5",
        !isOverdue && !isCompleted && "hover:bg-[#D4A843]/10",
      )}
      style={{
        background: isHovered && !isOverdue ? `${sidebarColors.gold}10` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <div className="pt-0.5">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggleComplete(task)}
            className={cn(
              "h-4 w-4 rounded border-2 transition-colors",
              isCompleted 
                ? "border-green-500 bg-green-500" 
                : `border-[${sidebarColors.gold}] hover:border-[${sidebarColors.gold}]`
            )}
            style={{
              borderColor: isCompleted ? undefined : sidebarColors.gold,
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p
            className={cn(
              "text-sm font-medium text-right leading-tight truncate transition-all",
              isCompleted && "line-through text-gray-500"
            )}
            style={{ color: isCompleted ? undefined : sidebarColors.goldLight }}
          >
            {task.title}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-end gap-2 mt-1.5 flex-wrap">
            {/* Client name */}
            {task.client?.name && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span 
                    className="text-xs flex items-center gap-1 truncate max-w-[80px]"
                    style={{ color: `${sidebarColors.goldLight}80` }}
                  >
                    <Building className="h-3 w-3" />
                    {task.client.name}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{task.client.name}</TooltipContent>
              </Tooltip>
            )}

            {/* Due date */}
            {dueDate && (
              <span 
                className={cn(
                  "text-xs flex items-center gap-1",
                  isOverdue && "text-red-400 font-medium",
                  isDueToday && !isOverdue && "text-yellow-400",
                )}
                style={{ 
                  color: !isOverdue && !isDueToday ? `${sidebarColors.goldLight}80` : undefined 
                }}
              >
                <Clock className="h-3 w-3" />
                {formatDueDate()}
              </span>
            )}

            {/* Priority badge */}
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-1.5 text-[10px] gap-1",
                priority.bgColor,
                priority.borderColor,
                priority.color
              )}
            >
              <PriorityIcon className="h-3 w-3" />
              {priority.label}
            </Badge>
          </div>
        </div>

        {/* Actions dropdown - visible on hover */}
        <div className={cn(
          "absolute left-1 top-1 opacity-0 transition-opacity",
          isHovered && "opacity-100"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                style={{ 
                  color: sidebarColors.goldLight,
                  background: `${sidebarColors.gold}20`,
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="left" className="w-32">
              <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2 cursor-pointer">
                <Pencil className="h-3.5 w-3.5" />
                <span>עריכה</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(task)} 
                className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>מחיקה</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default SidebarTaskItem;
