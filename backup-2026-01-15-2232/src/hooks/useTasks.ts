import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUndoRedo } from '@/hooks/useUndoRedo';

// Activity logging helper function (no hooks)
const logToActivityLog = async (userId: string | undefined, action: string, entityType: string, entityId: string, details?: Record<string, any>) => {
  try {
    await supabase.from('activity_log').insert({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || null,
      ip_address: null,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_by: string;
  assigned_to: string | null;
  client_id: string | null;
  project_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  client?: { name: string } | null;
  project?: { name: string } | null;
  assignee?: { full_name: string } | null;
  creator?: { full_name: string } | null;
}

export interface TaskInsert {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
  assigned_to?: string | null;
  client_id?: string | null;
  project_id?: string | null;
  tags?: string[];
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { pushAction } = useUndoRedo();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients(name),
        project:projects(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לטעון את המשימות',
        variant: 'destructive',
      });
    } else {
      setTasks((data as Task[]) || []);
    }
    setLoading(false);
  }, [user, toast]);

  const createTask = useCallback(async (task: TaskInsert) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו ליצור את המשימה',
        variant: 'destructive',
      });
      return null;
    }

    const createdTask = data as Task;
    
    // Log activity
    logToActivityLog(user.id, 'create', 'tasks', createdTask.id, { title: task.title });
    
    // Add undo/redo action
    pushAction({
      type: 'create_task',
      description: `יצירת משימה: ${task.title}`,
      undo: async () => {
        await supabase.from('tasks').delete().eq('id', createdTask.id);
        await fetchTasks();
      },
      redo: async () => {
        await supabase.from('tasks').insert({ ...task, created_by: user.id });
        await fetchTasks();
      },
    });

    toast({
      title: 'המשימה נוצרה',
      description: task.title,
    });

    await fetchTasks();
    return createdTask;
  }, [user, toast, fetchTasks, pushAction]);

  const updateTask = useCallback(async (id: string, updates: Partial<TaskInsert>) => {
    // Get original task data for undo
    const originalTask = tasks.find(t => t.id === id);
    if (!originalTask) return false;

    const updateData: Record<string, unknown> = { ...updates };
    
    // If status is being changed to 'completed', set completed_at
    if (updates.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (updates.status && updates.status !== 'completed') {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לעדכן את המשימה',
        variant: 'destructive',
      });
      return false;
    }

    // Log activity
    logToActivityLog(user?.id, 'update', 'tasks', id, { title: originalTask.title, changes: updates });

    // Add undo/redo action
    pushAction({
      type: 'update_task',
      description: `עדכון משימה: ${originalTask.title}`,
      undo: async () => {
        await supabase.from('tasks').update({
          title: originalTask.title,
          description: originalTask.description,
          status: originalTask.status,
          priority: originalTask.priority,
          due_date: originalTask.due_date,
          assigned_to: originalTask.assigned_to,
          client_id: originalTask.client_id,
          project_id: originalTask.project_id,
          tags: originalTask.tags,
          completed_at: originalTask.completed_at,
        }).eq('id', id);
        await fetchTasks();
      },
      redo: async () => {
        await supabase.from('tasks').update(updateData).eq('id', id);
        await fetchTasks();
      },
    });

    toast({
      title: 'המשימה עודכנה',
    });

    await fetchTasks();
    return true;
  }, [toast, fetchTasks, tasks, pushAction]);

  const deleteTask = useCallback(async (id: string) => {
    // Get original task data for undo
    const originalTask = tasks.find(t => t.id === id);
    if (!originalTask) return false;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו למחוק את המשימה',
        variant: 'destructive',
      });
      return false;
    }

    // Log activity
    logToActivityLog(user?.id, 'delete', 'tasks', id, { title: originalTask.title });

    // Add undo/redo action
    pushAction({
      type: 'delete_task',
      description: `מחיקת משימה: ${originalTask.title}`,
      undo: async () => {
        await supabase.from('tasks').insert({
          id: originalTask.id,
          title: originalTask.title,
          description: originalTask.description,
          status: originalTask.status,
          priority: originalTask.priority,
          due_date: originalTask.due_date,
          assigned_to: originalTask.assigned_to,
          client_id: originalTask.client_id,
          project_id: originalTask.project_id,
          tags: originalTask.tags,
          created_by: originalTask.created_by,
          completed_at: originalTask.completed_at,
        });
        await fetchTasks();
      },
      redo: async () => {
        await supabase.from('tasks').delete().eq('id', id);
        await fetchTasks();
      },
    });

    toast({
      title: 'המשימה נמחקה',
    });

    await fetchTasks();
    return true;
  }, [toast, fetchTasks, tasks, pushAction]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
