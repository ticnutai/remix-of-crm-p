// Optimized Components with React.memo - tenarch CRM Pro
// Performance-focused components that prevent unnecessary re-renders
import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  CheckSquare,
  Clock,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Users,
  Video,
  Phone,
  MapPin,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ===== Task Card Component =====
interface TaskCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  clientName?: string | null;
  onComplete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

const priorityConfig = {
  low: { icon: ArrowDown, color: 'text-green-600', bgColor: 'bg-green-500/10' },
  medium: { icon: ArrowRight, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' },
  high: { icon: ArrowUp, color: 'text-red-600', bgColor: 'bg-red-500/10' },
};

const statusConfig = {
  pending: { label: 'ממתין', color: 'bg-yellow-500/20 text-yellow-700' },
  in_progress: { label: 'בביצוע', color: 'bg-blue-500/20 text-blue-700' },
  completed: { label: 'הושלם', color: 'bg-green-500/20 text-green-700' },
};

export const TaskCard = memo(function TaskCard({
  id,
  title,
  description,
  status,
  priority,
  dueDate,
  clientName,
  onComplete,
  onEdit,
  onDelete,
  onClick,
}: TaskCardProps) {
  const PriorityIcon = priorityConfig[priority as keyof typeof priorityConfig]?.icon || ArrowRight;
  const priorityColor = priorityConfig[priority as keyof typeof priorityConfig]?.color || 'text-gray-500';
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  const isCompleted = status === 'completed';
  const isOverdue = useMemo(() => {
    if (!dueDate || isCompleted) return false;
    return new Date(dueDate) < new Date();
  }, [dueDate, isCompleted]);

  const handleComplete = useCallback(() => {
    onComplete?.(id);
  }, [id, onComplete]);

  const handleEdit = useCallback(() => {
    onEdit?.(id);
  }, [id, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(id);
  }, [id, onDelete]);

  const handleClick = useCallback(() => {
    onClick?.(id);
  }, [id, onClick]);

  const formattedDate = useMemo(() => {
    if (!dueDate) return null;
    return format(new Date(dueDate), 'd בMMMM', { locale: he });
  }, [dueDate]);

  return (
    <div
      className={cn(
        "group relative p-3 rounded-lg border bg-card hover:shadow-md transition-all duration-200",
        isCompleted && "opacity-60",
        isOverdue && "border-red-300 bg-red-50/50",
        onClick && "cursor-pointer"
      )}
      onClick={onClick ? handleClick : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {onComplete && (
            <button
              onClick={(e) => { e.stopPropagation(); handleComplete(); }}
              className={cn(
                "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                isCompleted 
                  ? "bg-green-500 border-green-500 text-white" 
                  : "border-muted-foreground/30 hover:border-primary"
              )}
            >
              {isCompleted && <CheckCircle2 className="h-3 w-3" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium text-sm truncate",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {title}
            </h4>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", statusInfo.color)}>
                {statusInfo.label}
              </Badge>
              <div className={cn("flex items-center gap-1", priorityColor)}>
                <PriorityIcon className="h-3 w-3" />
              </div>
              {formattedDate && (
                <span className={cn(
                  "text-xs flex items-center gap-1",
                  isOverdue ? "text-red-600" : "text-muted-foreground"
                )}>
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </span>
              )}
              {clientName && (
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  • {clientName}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {onEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 ml-2" />
                  עריכה
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחיקה
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
});

// ===== Meeting Card Component =====
interface MeetingCardProps {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  meetingType: string;
  status: string;
  clientName?: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onClick?: (id: string) => void;
}

const meetingTypeConfig = {
  in_person: { icon: Users, color: 'text-blue-600', label: 'פגישה פיזית' },
  video: { icon: Video, color: 'text-purple-600', label: 'שיחת וידאו' },
  phone: { icon: Phone, color: 'text-green-600', label: 'שיחת טלפון' },
};

export const MeetingCard = memo(function MeetingCard({
  id,
  title,
  description,
  startTime,
  endTime,
  location,
  meetingType,
  status,
  clientName,
  onEdit,
  onDelete,
  onCancel,
  onClick,
}: MeetingCardProps) {
  const typeConfig = meetingTypeConfig[meetingType as keyof typeof meetingTypeConfig] || meetingTypeConfig.in_person;
  const TypeIcon = typeConfig.icon;
  
  const isCancelled = status === 'cancelled';
  const isPast = useMemo(() => new Date(endTime) < new Date(), [endTime]);
  const isOngoing = useMemo(() => {
    const now = new Date();
    return new Date(startTime) <= now && new Date(endTime) >= now;
  }, [startTime, endTime]);

  const handleEdit = useCallback(() => onEdit?.(id), [id, onEdit]);
  const handleDelete = useCallback(() => onDelete?.(id), [id, onDelete]);
  const handleCancel = useCallback(() => onCancel?.(id), [id, onCancel]);
  const handleClick = useCallback(() => onClick?.(id), [id, onClick]);

  const timeRange = useMemo(() => {
    const start = format(new Date(startTime), 'HH:mm');
    const end = format(new Date(endTime), 'HH:mm');
    return `${start} - ${end}`;
  }, [startTime, endTime]);

  const dateStr = useMemo(() => {
    return format(new Date(startTime), 'EEEE, d בMMMM', { locale: he });
  }, [startTime]);

  return (
    <div
      className={cn(
        "group relative p-3 rounded-lg border bg-card hover:shadow-md transition-all duration-200",
        isCancelled && "opacity-50 bg-gray-50",
        isPast && !isCancelled && "opacity-70",
        isOngoing && "border-primary ring-2 ring-primary/20",
        onClick && "cursor-pointer"
      )}
      onClick={onClick ? handleClick : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            typeConfig.color,
            "bg-current/10"
          )}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium text-sm truncate",
              isCancelled && "line-through"
            )}>
              {title}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeRange}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{dateStr}</span>
            </div>
            {location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {typeConfig.label}
              </Badge>
              {isOngoing && (
                <Badge className="text-xs bg-green-500 text-white animate-pulse">
                  עכשיו
                </Badge>
              )}
              {isCancelled && (
                <Badge variant="destructive" className="text-xs">
                  בוטלה
                </Badge>
              )}
              {clientName && (
                <span className="text-xs text-muted-foreground truncate">
                  • {clientName}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {(onEdit || onDelete || onCancel) && !isCancelled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {onEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 ml-2" />
                  עריכה
                </DropdownMenuItem>
              )}
              {onCancel && (
                <DropdownMenuItem onClick={handleCancel} className="text-orange-600">
                  <Calendar className="h-4 w-4 ml-2" />
                  ביטול
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחיקה
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
});

// ===== Stats Card Component =====
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            "text-xs mt-1",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}% מהחודש שעבר
          </p>
        )}
      </CardContent>
    </Card>
  );
});

// ===== Empty State Component =====
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = memo(function EmptyState({
  icon: Icon = CheckSquare,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
});

// ===== List wrapper with virtualization hint =====
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  emptyState?: React.ReactNode;
}

export const OptimizedList = memo(function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  emptyState,
}: OptimizedListProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}) as <T>(props: OptimizedListProps<T>) => React.ReactElement;

export default {
  TaskCard,
  MeetingCard,
  StatsCard,
  EmptyState,
  OptimizedList,
};
