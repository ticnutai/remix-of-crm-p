// Optimized Tasks Hook with React Query - tenarch CRM Pro
// Features: Optimistic updates, caching, prefetching, background sync
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types
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

// Query keys for cache management
const TASKS_QUERY_KEY = ['tasks'] as const;
const TASKS_TODAY_KEY = ['tasks', 'today'] as const;
const TASKS_OVERDUE_KEY = ['tasks', 'overdue'] as const;

// Fetch functions
async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      client:clients(name),
      project:projects(name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Task[];
}

async function fetchTodayTasks(): Promise<Task[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      client:clients(name),
      project:projects(name)
    `)
    .gte('due_date', today.toISOString())
    .lt('due_date', tomorrow.toISOString())
    .neq('status', 'completed')
    .order('priority', { ascending: false });

  if (error) throw error;
  return data as Task[];
}

// Main Hook - Optimized with React Query
export function useTasksOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Main tasks query
  const { 
    data: tasks = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchTasks,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Create mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: async (task: TaskInsert) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, created_by: user.id })
        .select(`*, client:clients(name), project:projects(name)`)
        .single();

      if (error) throw error;
      return data as Task;
    },
    // Optimistic update
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);

      // Optimistically add the task
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        ...newTask,
        description: newTask.description ?? null,
        status: newTask.status ?? 'pending',
        priority: newTask.priority ?? 'medium',
        due_date: newTask.due_date ?? null,
        completed_at: null,
        created_by: user?.id ?? '',
        assigned_to: newTask.assigned_to ?? null,
        client_id: newTask.client_id ?? null,
        project_id: newTask.project_id ?? null,
        tags: newTask.tags ?? [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old = []) => [optimisticTask, ...old]);

      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
      toast.error('שגיאה ביצירת המשימה');
    },
    onSuccess: (data) => {
      toast.success(`משימה נוצרה: ${data.title}`);
    },
    onSettled: () => {
      // Always refetch to sync with server
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  // Update mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskInsert> }) => {
      const updateData: Record<string, unknown> = { ...updates };
      
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (updates.status && updates.status !== 'completed') {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { id, updates: updateData };
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);

      // Optimistically update
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old = []) =>
        old.map((task) =>
          task.id === id
            ? { 
                ...task, 
                ...updates,
                completed_at: updates.status === 'completed' 
                  ? new Date().toISOString() 
                  : updates.status ? null : task.completed_at,
                updated_at: new Date().toISOString() 
              }
            : task
        )
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
      toast.error('שגיאה בעדכון המשימה');
    },
    onSuccess: () => {
      toast.success('המשימה עודכנה');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);

      // Optimistically remove
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old = []) =>
        old.filter((task) => task.id !== id)
      );

      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
      toast.error('שגיאה במחיקת המשימה');
    },
    onSuccess: () => {
      toast.success('המשימה נמחקה');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  // Memoized filtered tasks
  const pendingTasks = useMemo(
    () => tasks.filter(t => t.status === 'pending'),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter(t => t.status === 'completed'),
    [tasks]
  );

  const highPriorityTasks = useMemo(
    () => tasks.filter(t => t.priority === 'high' && t.status !== 'completed'),
    [tasks]
  );

  const overdueTasks = useMemo(
    () => tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }),
    [tasks]
  );

  // Callbacks wrapped in useCallback for performance
  const createTask = useCallback(
    (task: TaskInsert) => createMutation.mutateAsync(task),
    [createMutation]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<TaskInsert>) => 
      updateMutation.mutateAsync({ id, updates }),
    [updateMutation]
  );

  const deleteTask = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  );

  const toggleComplete = useCallback(
    (id: string) => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        updateMutation.mutate({
          id,
          updates: { status: task.status === 'completed' ? 'pending' : 'completed' }
        });
      }
    },
    [tasks, updateMutation]
  );

  // Prefetch today's tasks
  const prefetchTodayTasks = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: TASKS_TODAY_KEY,
      queryFn: fetchTodayTasks,
    });
  }, [queryClient]);

  return {
    // Data
    tasks,
    pendingTasks,
    completedTasks,
    highPriorityTasks,
    overdueTasks,
    
    // States
    loading: isLoading,
    error,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Actions
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    refetch,
    fetchTasks: refetch, // Backward compatibility alias
    
    // Prefetching
    prefetchTodayTasks,
  };
}

// Hook for today's tasks only (optimized)
export function useTodayTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: TASKS_TODAY_KEY,
    queryFn: fetchTodayTasks,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export default useTasksOptimized;
