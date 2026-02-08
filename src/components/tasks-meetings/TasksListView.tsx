import React from 'react';
import { Task } from '@/hooks/useTasksOptimized';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Pencil, Trash2, Calendar, User, Briefcase, 
  ArrowUp, ArrowRight, ArrowDown, AlertCircle, GripVertical 
} from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const priorities = [
  { value: 'low', label: 'נמוכה', icon: ArrowDown, color: 'text-green-600' },
  { value: 'medium', label: 'בינונית', icon: ArrowRight, color: 'text-amber-500' },
  { value: 'high', label: 'גבוהה', icon: ArrowUp, color: 'text-red-500' },
];

const statuses = [
  { value: 'pending', label: 'ממתין', color: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'בביצוע', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'הושלם', color: 'bg-green-100 text-green-700' },
];

interface TasksListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: Task) => void;
  onReorder?: (tasks: Task[]) => void;
}

interface SortableTaskItemProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: Task) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  index,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityInfo = priorities.find(p => p.value === task.priority) || priorities[1];
  const statusInfo = statuses.find(s => s.value === task.status) || statuses[0];
  const PriorityIcon = priorityInfo.icon;
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed';
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:shadow-md transition-all duration-200 border-r-4",
        task.status === 'completed' && "opacity-60 border-r-green-500",
        task.status === 'in_progress' && "border-r-blue-500",
        task.status === 'pending' && "border-r-slate-300",
        isOverdue && "border-r-red-500 bg-red-50/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-row-reverse">
          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(task)} className="h-8 w-8">
              <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="h-8 w-8">
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 text-right">
            <div className="flex items-center gap-2 justify-end mb-1 flex-row-reverse">
              <Badge variant="outline" className="text-xs font-mono">
                #{index + 1}
              </Badge>
              <PriorityIcon className={cn("h-4 w-4", priorityInfo.color)} />
              <h3 className={cn(
                "font-medium text-foreground",
                task.status === 'completed' && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground justify-end flex-wrap">
              {task.assignee?.full_name && (
                <span className="flex items-center gap-1">
                  {task.assignee.full_name}
                  <User className="h-3 w-3" />
                </span>
              )}
              {task.due_date && (
                <span className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-red-600 font-medium",
                  isDueToday && !isOverdue && "text-amber-600"
                )}>
                  {format(parseISO(task.due_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                  <Calendar className="h-3 w-3" />
                  {isOverdue && <AlertCircle className="h-3 w-3" />}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 justify-end flex-wrap">
              {task.project?.name && (
                <Badge variant="secondary" className="text-xs">
                  <Briefcase className="h-3 w-3 ml-1" />
                  {task.project.name}
                </Badge>
              )}
              {task.client?.name && (
                <Badge variant="secondary" className="text-xs">
                  <User className="h-3 w-3 ml-1" />
                  {task.client.name}
                </Badge>
              )}
              <Badge className={cn("text-xs", statusInfo.color)}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Checkbox & Drag Handle */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={() => onToggleComplete(task)}
              className="h-5 w-5"
            />
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function TasksListView({ tasks, onEdit, onDelete, onToggleComplete, onReorder }: TasksListViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorder) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      onReorder(arrayMove(tasks, oldIndex, newIndex));
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>אין משימות להצגה</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
