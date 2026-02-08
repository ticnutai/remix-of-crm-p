import React from 'react';
import { Task } from '@/hooks/useTasksOptimized';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pencil, Trash2, Calendar, User, 
  ArrowUp, ArrowRight, ArrowDown, Clock, CheckCircle2, Circle
} from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';

const priorities = [
  { value: 'low', icon: ArrowDown, color: 'text-green-600' },
  { value: 'medium', icon: ArrowRight, color: 'text-amber-500' },
  { value: 'high', icon: ArrowUp, color: 'text-red-500' },
];

const columns = [
  { id: 'pending', title: 'ממתין', icon: Circle, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'in_progress', title: 'בביצוע', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'completed', title: 'הושלם', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
];

interface TasksKanbanViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

interface DraggableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function DraggableTaskCard({ task, onEdit, onDelete }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const priorityInfo = priorities.find(p => p.value === task.priority) || priorities[1];
  const PriorityIcon = priorityInfo.icon;
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing group hover:shadow-md transition-shadow",
        isDragging && "opacity-50",
        isOverdue && "ring-1 ring-red-300"
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
          <h4 className={cn(
            "text-sm font-medium text-right flex-1 line-clamp-2",
            task.status === 'completed' && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>
        </div>

        <div className="flex items-center gap-2 justify-end flex-wrap">
          <PriorityIcon className={cn("h-3 w-3", priorityInfo.color)} />
          {task.due_date && (
            <span className={cn(
              "text-xs flex items-center gap-1",
              isOverdue && "text-red-600",
              isToday(parseISO(task.due_date)) && !isOverdue && "text-amber-600"
            )}>
              <Calendar className="h-3 w-3" />
              {format(parseISO(task.due_date), 'dd/MM', { locale: he })}
            </span>
          )}
        </div>

        {(task.client?.name || task.assignee?.full_name) && (
          <div className="flex items-center gap-2 justify-end text-xs text-muted-foreground pt-1 border-t">
            {task.assignee?.full_name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assignee.full_name}
              </span>
            )}
            {task.client?.name && (
              <Badge variant="outline" className="text-xs py-0 px-1">
                {task.client.name}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DroppableColumnProps {
  column: typeof columns[0];
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function DroppableColumn({ column, tasks, onEdit, onDelete }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const Icon = column.icon;

  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <Card className={cn("h-full", column.bg)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <Badge variant="secondary" className="font-normal">
              {tasks.length}
            </Badge>
            <div className={cn("flex items-center gap-2", column.color)}>
              {column.title}
              <Icon className="h-4 w-4" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div
              ref={setNodeRef}
              className={cn(
                "space-y-2 min-h-[100px] p-1 rounded-lg transition-colors",
                isOver && "bg-primary/10"
              )}
            >
              {tasks.map((task) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  אין משימות
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export function TasksKanbanView({ tasks, onEdit, onDelete, onStatusChange }: TasksKanbanViewProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== newStatus && columns.some(c => c.id === newStatus)) {
      onStatusChange(taskId, newStatus);
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" dir="rtl">
        {columns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            tasks={tasks.filter(t => t.status === column.id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <Card className="shadow-xl">
            <CardContent className="p-3">
              <h4 className="text-sm font-medium">{activeTask.title}</h4>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
