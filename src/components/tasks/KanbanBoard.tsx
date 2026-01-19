import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks, Task } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  GripVertical, 
  Calendar, 
  User, 
  Tag, 
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const COLUMNS = [
  { id: 'todo', title: 'לביצוע', color: 'bg-slate-100', icon: Circle },
  { id: 'in_progress', title: 'בתהליך', color: 'bg-blue-100', icon: Clock },
  { id: 'review', title: 'לבדיקה', color: 'bg-yellow-100', icon: AlertCircle },
  { id: 'done', title: 'הושלם', color: 'bg-green-100', icon: CheckCircle2 },
];

const PRIORITIES = {
  low: { label: 'נמוכה', color: 'bg-slate-200 text-slate-700' },
  medium: { label: 'בינונית', color: 'bg-blue-200 text-blue-700' },
  high: { label: 'גבוהה', color: 'bg-orange-200 text-orange-700' },
  urgent: { label: 'דחוף', color: 'bg-red-200 text-red-700' },
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const priority = PRIORITIES[task.priority as keyof typeof PRIORITIES] || PRIORITIES.medium;
  
  return (
    <Card className="mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="h-4 w-4 ml-2" />
                עריכה
              </DropdownMenuItem>
              {task.status !== 'done' && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'done')}>
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  סמן כהושלם
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                מחיקה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge className={`text-[10px] ${priority.color}`}>
            {priority.label}
          </Badge>
          {task.client?.name && (
            <Badge variant="outline" className="text-[10px]">
              {task.client.name}
            </Badge>
          )}
        </div>
        
        {(task.due_date || task.assigned_to) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString('he-IL')}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface KanbanColumnProps {
  column: typeof COLUMNS[0];
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDrop: (taskId: string, status: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  column, 
  tasks, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onDrop 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const Icon = column.icon;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDrop(taskId, column.id);
    }
  };
  
  return (
    <div 
      className={`flex-1 min-w-[280px] max-w-[350px] rounded-lg p-3 ${column.color} ${
        isDragOver ? 'ring-2 ring-primary' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4" />
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <Badge variant="secondary" className="mr-auto text-xs">
          {tasks.length}
        </Badge>
      </div>
      
      <div className="space-y-2 min-h-[200px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('taskId', task.id);
            }}
          >
            <TaskCard
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export function KanbanBoard() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    client_id: '',
    project_id: '',
    due_date: '',
  });
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      client_id: '',
      project_id: '',
      due_date: '',
    });
    setEditingTask(null);
  };
  
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      client_id: task.client_id || '',
      project_id: task.project_id || '',
      due_date: task.due_date || '',
    });
    setIsDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
        toast({ title: 'המשימה עודכנה בהצלחה' });
      } else {
        await createTask(formData);
        toast({ title: 'המשימה נוצרה בהצלחה' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'שגיאה בשמירת המשימה', variant: 'destructive' });
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את המשימה?')) return;
    try {
      await deleteTask(id);
      toast({ title: 'המשימה נמחקה' });
    } catch (error) {
      toast({ title: 'שגיאה במחיקת המשימה', variant: 'destructive' });
    }
  };
  
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateTask(id, { status });
      toast({ title: 'הסטטוס עודכן' });
    } catch (error) {
      toast({ title: 'שגיאה בעדכון הסטטוס', variant: 'destructive' });
    }
  };
  
  const handleDrop = async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      toast({ title: 'שגיאה בעדכון המשימה', variant: 'destructive' });
    }
  };
  
  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };
  
  if (loading) {
    return <div className="flex justify-center p-8">טוען...</div>;
  }
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">לוח משימות</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              משימה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'עריכת משימה' : 'משימה חדשה'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="כותרת המשימה"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="תיאור (אופציונלי)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="עדיפות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוכה</SelectItem>
                    <SelectItem value="medium">בינונית</SelectItem>
                    <SelectItem value="high">גבוהה</SelectItem>
                    <SelectItem value="urgent">דחוף</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">לביצוע</SelectItem>
                    <SelectItem value="in_progress">בתהליך</SelectItem>
                    <SelectItem value="review">לבדיקה</SelectItem>
                    <SelectItem value="done">הושלם</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={formData.client_id}
                  onValueChange={(v) => setFormData({ ...formData, client_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ללא לקוח</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTask ? 'עדכן' : 'צור משימה'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}

export default KanbanBoard;
