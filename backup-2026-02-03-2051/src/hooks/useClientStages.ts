import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ClientStageTask {
  id: string;
  client_id: string;
  stage_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Styling options
  background_color?: string | null;
  text_color?: string | null;
  is_bold?: boolean;
  // Timer/Working days tracking
  started_at?: string | null;
  target_working_days?: number | null;
  timer_display_style?: number;
}

export interface ClientStage {
  id: string;
  client_id: string;
  stage_id: string;
  stage_name: string;
  stage_icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  tasks?: ClientStageTask[];
  // Timer/Working days tracking for stages
  started_at?: string | null;
  target_working_days?: number | null;
  timer_display_style?: number;
  // Folder assignment
  folder_id?: string | null;
}

// Helper function to remove duplicate tasks (same stage_id + title)
// Keeps the oldest task (by created_at) and marks newer duplicates for deletion
function removeDuplicateTasks(tasks: ClientStageTask[]): ClientStageTask[] {
  const seen = new Map<string, ClientStageTask>();
  const duplicateIds: string[] = [];
  
  // Sort by created_at to keep oldest
  const sorted = [...tasks].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  for (const task of sorted) {
    const key = `${task.stage_id}:${task.title.trim().toLowerCase()}`;
    if (seen.has(key)) {
      // This is a duplicate - mark for deletion
      duplicateIds.push(task.id);
    } else {
      seen.set(key, task);
    }
  }
  
  // Delete duplicates from database in background
  if (duplicateIds.length > 0) {
    console.log(`Found ${duplicateIds.length} duplicate tasks, removing...`);
    supabase
      .from('client_stage_tasks')
      .delete()
      .in('id', duplicateIds)
      .then(({ error }) => {
        if (error) {
          console.error('Error removing duplicate tasks:', error);
        } else {
          console.log(`Removed ${duplicateIds.length} duplicate tasks`);
        }
      });
  }
  
  // Return unique tasks only
  return Array.from(seen.values());
}

export function useClientStages(clientId: string) {
  const [stages, setStages] = useState<ClientStage[]>([]);
  const [tasks, setTasks] = useState<ClientStageTask[]>([]);
  const [loading, setLoading] = useState(true);

  // No default stages - user will add them manually or from templates
  // Initialize stages - just fetch existing, don't create defaults
  const initializeStages = async () => {
    try {
      const { data: existingStages, error: fetchError } = await supabase
        .from('client_stages')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order');

      if (fetchError) throw fetchError;

      // Return existing stages (could be empty - that's ok now)
      return existingStages || [];
    } catch (error: unknown) {
      console.error('Error loading stages:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את שלבי הלקוח',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Load stages and tasks
  const loadData = async () => {
    setLoading(true);
    try {
      const loadedStages = await initializeStages();
      setStages(loadedStages);

      // Load tasks
      const { data: loadedTasks, error: tasksError } = await supabase
        .from('client_stage_tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order');

      if (tasksError) throw tasksError;
      
      // Remove duplicates (same stage_id + title) - keep oldest
      const uniqueTasks = removeDuplicateTasks(loadedTasks || []);
      setTasks(uniqueTasks);
    } catch (error: unknown) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new task
  const addTask = async (stageId: string, title: string) => {
    try {
      const maxSortOrder = tasks
        .filter(t => t.stage_id === stageId)
        .reduce((max, t) => Math.max(max, t.sort_order), -1);

      const { data, error } = await supabase
        .from('client_stage_tasks')
        .insert({
          client_id: clientId,
          stage_id: stageId,
          title,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [...prev, data]);
      toast({
        title: 'הצלחה',
        description: 'המשימה נוספה בהצלחה',
      });
      return data;
    } catch (error: unknown) {
      console.error('Error adding task:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף משימה',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Add multiple tasks
  const addBulkTasks = async (stageId: string, titles: string[]) => {
    try {
      const maxSortOrder = tasks
        .filter(t => t.stage_id === stageId)
        .reduce((max, t) => Math.max(max, t.sort_order), -1);

      const tasksToInsert = titles.map((title, index) => ({
        client_id: clientId,
        stage_id: stageId,
        title: title.trim(),
        sort_order: maxSortOrder + 1 + index,
      }));

      const { data, error } = await supabase
        .from('client_stage_tasks')
        .insert(tasksToInsert)
        .select();

      if (error) throw error;

      setTasks(prev => [...prev, ...data]);
      toast({
        title: 'הצלחה',
        description: `${data.length} משימות נוספו בהצלחה`,
      });
      return data;
    } catch (error: unknown) {
      console.error('Error adding bulk tasks:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף משימות',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newCompleted = !task.completed;
      const { error } = await supabase
        .from('client_stage_tasks')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : null,
              }
            : t
        )
      );
    } catch (error: unknown) {
      console.error('Error toggling task:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן משימה',
        variant: 'destructive',
      });
    }
  };

  // Update task title
  const updateTask = async (taskId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('client_stage_tasks')
        .update({ title })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, title } : t)));
      toast({
        title: 'הצלחה',
        description: 'המשימה עודכנה בהצלחה',
      });
    } catch (error: unknown) {
      console.error('Error updating task:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן משימה',
        variant: 'destructive',
      });
    }
  };

  // Update task completion date (for managers)
  const updateTaskCompletedDate = async (taskId: string, completedAt: string | null) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // If setting a date, mark as completed. If clearing, mark as not completed.
      const completed = completedAt !== null;
      
      const { error } = await supabase
        .from('client_stage_tasks')
        .update({
          completed,
          completed_at: completedAt,
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                completed,
                completed_at: completedAt,
              }
            : t
        )
      );
      toast({
        title: 'הצלחה',
        description: 'תאריך ההשלמה עודכן בהצלחה',
      });
    } catch (error: unknown) {
      console.error('Error updating task completion date:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן תאריך',
        variant: 'destructive',
      });
    }
  };

  // Update task styling (background color, text color, bold)
  const updateTaskStyle = async (
    taskId: string, 
    style: { background_color?: string | null; text_color?: string | null; is_bold?: boolean }
  ) => {
    try {
      const { error } = await supabase
        .from('client_stage_tasks')
        .update(style as any)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, ...style }
            : t
        )
      );
    } catch (error: unknown) {
      console.error('Error updating task style:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן עיצוב',
        variant: 'destructive',
      });
    }
  };

  // Start task timer - sets started_at and target_working_days
  const startTaskTimer = async (taskId: string, targetDays: number) => {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('client_stage_tasks')
        .update({
          started_at: now,
          target_working_days: targetDays,
        } as any)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                started_at: now,
                target_working_days: targetDays,
              }
            : t
        )
      );
      toast({
        title: 'הצלחה',
        description: `טיימר הופעל - ${targetDays} ימי עבודה`,
      });
    } catch (error: unknown) {
      console.error('Error starting task timer:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להפעיל טיימר',
        variant: 'destructive',
      });
    }
  };

  // Stop/clear task timer
  const stopTaskTimer = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('client_stage_tasks')
        .update({
          started_at: null,
          target_working_days: null,
        } as any)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                started_at: null,
                target_working_days: null,
              }
            : t
        )
      );
      toast({
        title: 'הצלחה',
        description: 'הטיימר הופסק',
      });
    } catch (error: unknown) {
      console.error('Error stopping task timer:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להפסיק טיימר',
        variant: 'destructive',
      });
    }
  };

  // Update task timer settings
  const updateTaskTimer = async (taskId: string, targetDays: number) => {
    try {
      const { error } = await supabase
        .from('client_stage_tasks')
        .update({
          target_working_days: targetDays,
        } as any)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                target_working_days: targetDays,
              }
            : t
        )
      );
    } catch (error: unknown) {
      console.error('Error updating task timer:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן טיימר',
        variant: 'destructive',
      });
    }
  };

  // Cycle task timer display style (1-5)
  const cycleTaskTimerStyle = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const currentStyle = task?.timer_display_style || 1;
    const newStyle = currentStyle >= 5 ? 1 : currentStyle + 1;
    
    try {
      const { error } = await supabase
        .from('client_stage_tasks')
        .update({ timer_display_style: newStyle } as any)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, timer_display_style: newStyle }
            : t
        )
      );
    } catch (error: unknown) {
      console.error('Error cycling task timer style:', error);
    }
  };

  // Start stage timer - sets started_at and target_working_days for a stage
  const startStageTimer = async (stageId: string, targetDays: number) => {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('client_stages')
        .update({
          started_at: now,
          target_working_days: targetDays,
        } as any)
        .eq('stage_id', stageId)
        .eq('client_id', clientId);

      if (error) throw error;

      setStages(prev =>
        prev.map(s =>
          s.stage_id === stageId
            ? {
                ...s,
                started_at: now,
                target_working_days: targetDays,
              }
            : s
        )
      );
      toast({
        title: 'הצלחה',
        description: `טיימר שלב הופעל - ${targetDays} ימי עבודה`,
      });
    } catch (error: unknown) {
      console.error('Error starting stage timer:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להפעיל טיימר לשלב',
        variant: 'destructive',
      });
    }
  };

  // Stop/clear stage timer
  const stopStageTimer = async (stageId: string) => {
    try {
      const { error } = await supabase
        .from('client_stages')
        .update({
          started_at: null,
          target_working_days: null,
        } as any)
        .eq('stage_id', stageId)
        .eq('client_id', clientId);

      if (error) throw error;

      setStages(prev =>
        prev.map(s =>
          s.stage_id === stageId
            ? {
                ...s,
                started_at: null,
                target_working_days: null,
              }
            : s
        )
      );
      toast({
        title: 'הצלחה',
        description: 'טיימר השלב הופסק',
      });
    } catch (error: unknown) {
      console.error('Error stopping stage timer:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להפסיק טיימר שלב',
        variant: 'destructive',
      });
    }
  };

  // Cycle stage timer display style (1-5)
  const cycleStageTimerStyle = async (stageId: string) => {
    const stage = stages.find(s => s.stage_id === stageId);
    const currentStyle = stage?.timer_display_style || 1;
    const newStyle = currentStyle >= 5 ? 1 : currentStyle + 1;
    
    try {
      const { error } = await supabase
        .from('client_stages')
        .update({ timer_display_style: newStyle } as any)
        .eq('stage_id', stageId)
        .eq('client_id', clientId);

      if (error) throw error;

      setStages(prev =>
        prev.map(s =>
          s.stage_id === stageId
            ? { ...s, timer_display_style: newStyle }
            : s
        )
      );
    } catch (error: unknown) {
      console.error('Error cycling stage timer style:', error);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('client_stage_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({
        title: 'הצלחה',
        description: 'המשימה נמחקה בהצלחה',
      });
    } catch (error: unknown) {
      console.error('Error deleting task:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק משימה',
        variant: 'destructive',
      });
    }
  };

  // Bulk delete tasks
  const bulkDeleteTasks = async (taskIds: string[]) => {
    try {
      const { error } = await supabase
        .from('client_stage_tasks')
        .delete()
        .in('id', taskIds);

      if (error) throw error;

      setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
      toast({
        title: 'הצלחה',
        description: `${taskIds.length} משימות נמחקו בהצלחה`,
      });
    } catch (error: unknown) {
      console.error('Error bulk deleting tasks:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק משימות',
        variant: 'destructive',
      });
    }
  };

  // Add a new stage
  const addStage = async (stageName: string, stageIcon: string = 'Phone') => {
    try {
      const maxSortOrder = stages.reduce((max, s) => Math.max(max, s.sort_order), -1);
      const stageId = `custom_${Date.now()}`;

      const { data, error } = await supabase
        .from('client_stages')
        .insert({
          client_id: clientId,
          stage_id: stageId,
          stage_name: stageName,
          stage_icon: stageIcon,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setStages(prev => [...prev, data]);
      toast({
        title: 'הצלחה',
        description: 'השלב נוסף בהצלחה',
      });
      return data;
    } catch (error: unknown) {
      console.error('Error adding stage:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף שלב',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete stage
  const deleteStage = async (stageId: string) => {
    try {
      // First delete all tasks in this stage
      await supabase
        .from('client_stage_tasks')
        .delete()
        .eq('stage_id', stageId)
        .eq('client_id', clientId);

      // Then delete the stage
      const { error } = await supabase
        .from('client_stages')
        .delete()
        .eq('stage_id', stageId)
        .eq('client_id', clientId);

      if (error) throw error;

      setStages(prev => prev.filter(s => s.stage_id !== stageId));
      setTasks(prev => prev.filter(t => t.stage_id !== stageId));
      toast({
        title: 'הצלחה',
        description: 'השלב נמחק בהצלחה',
      });
    } catch (error: unknown) {
      console.error('Error deleting stage:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק שלב',
        variant: 'destructive',
      });
    }
  };

  // Bulk delete stages
  const bulkDeleteStages = async (stageIds: string[]) => {
    try {
      // First delete all tasks in these stages
      for (const stageId of stageIds) {
        await supabase
          .from('client_stage_tasks')
          .delete()
          .eq('stage_id', stageId)
          .eq('client_id', clientId);
      }

      // Then delete the stages
      for (const stageId of stageIds) {
        await supabase
          .from('client_stages')
          .delete()
          .eq('stage_id', stageId)
          .eq('client_id', clientId);
      }

      setStages(prev => prev.filter(s => !stageIds.includes(s.stage_id)));
      setTasks(prev => prev.filter(t => !stageIds.includes(t.stage_id)));
      toast({
        title: 'הצלחה',
        description: `${stageIds.length} שלבים נמחקו בהצלחה`,
      });
    } catch (error: unknown) {
      console.error('Error bulk deleting stages:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק שלבים',
        variant: 'destructive',
      });
    }
  };

  // Reorder tasks within a stage
  const reorderTasks = async (stageId: string, taskIds: string[]) => {
    try {
      // Update local state immediately for smooth UX
      setTasks(prev => {
        const otherTasks = prev.filter(t => t.stage_id !== stageId);
        const stageTasks = prev.filter(t => t.stage_id === stageId);
        const reorderedTasks = taskIds.map((id, index) => {
          const task = stageTasks.find(t => t.id === id);
          return task ? { ...task, sort_order: index } : null;
        }).filter(Boolean) as ClientStageTask[];
        return [...otherTasks, ...reorderedTasks];
      });

      // Update in database
      const updates = taskIds.map((id, index) => 
        supabase
          .from('client_stage_tasks')
          .update({ sort_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);
    } catch (error: unknown) {
      console.error('Error reordering tasks:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשנות סדר משימות',
        variant: 'destructive',
      });
      // Reload data on error to restore correct state
      await loadData();
    }
  };

  // Update stage name
  const updateStage = async (stageId: string, stageName: string, stageIcon?: string) => {
    try {
      const updateData: { stage_name: string; stage_icon?: string } = { stage_name: stageName };
      if (stageIcon) {
        updateData.stage_icon = stageIcon;
      }

      const { error } = await supabase
        .from('client_stages')
        .update(updateData)
        .eq('stage_id', stageId)
        .eq('client_id', clientId);

      if (error) throw error;

      setStages(prev => prev.map(s => 
        s.stage_id === stageId 
          ? { ...s, stage_name: stageName, ...(stageIcon && { stage_icon: stageIcon }) } 
          : s
      ));
      toast({
        title: 'הצלחה',
        description: 'השלב עודכן בהצלחה',
      });
    } catch (error: unknown) {
      console.error('Error updating stage:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן שלב',
        variant: 'destructive',
      });
    }
  };

  // Copy a stage with all its tasks (returns data for clipboard)
  const copyStageData = (stageId: string) => {
    const stage = stages.find(s => s.stage_id === stageId);
    if (!stage) return null;
    
    const stageTasks = tasks.filter(t => t.stage_id === stageId);
    return {
      stage_name: stage.stage_name,
      stage_icon: stage.stage_icon,
      tasks: stageTasks.map(t => ({ title: t.title, completed: t.completed })),
    };
  };

  // Paste a stage from clipboard data
  const pasteStageData = async (stageData: { stage_name: string; stage_icon: string | null; tasks: { title: string; completed: boolean }[] }) => {
    try {
      const maxSortOrder = stages.reduce((max, s) => Math.max(max, s.sort_order), -1);
      const stageId = `custom_${Date.now()}`;

      // Create the stage
      const { data: newStage, error: stageError } = await supabase
        .from('client_stages')
        .insert({
          client_id: clientId,
          stage_id: stageId,
          stage_name: `${stageData.stage_name} (עותק)`,
          stage_icon: stageData.stage_icon || 'Phone',
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single();

      if (stageError) throw stageError;

      // Create tasks
      if (stageData.tasks.length > 0) {
        const newTasks = stageData.tasks.map((task, index) => ({
          client_id: clientId,
          stage_id: stageId,
          title: task.title,
          completed: false, // Always start as uncompleted
          sort_order: index,
        }));

        const { error: tasksError } = await supabase
          .from('client_stage_tasks')
          .insert(newTasks);

        if (tasksError) throw tasksError;
      }

      toast({
        title: 'הצלחה',
        description: `השלב "${stageData.stage_name}" הודבק עם ${stageData.tasks.length} משימות`,
      });

      await loadData();
      return true;
    } catch (error: unknown) {
      console.error('Error pasting stage:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להדביק שלב',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Reorder stages
  const reorderStages = async (stageIds: string[]) => {
    try {
      // Update local state immediately for smooth UX
      setStages(prev => {
        const reorderedStages = stageIds.map((stageId, index) => {
          const stage = prev.find(s => s.stage_id === stageId);
          return stage ? { ...stage, sort_order: index } : null;
        }).filter(Boolean) as ClientStage[];
        return reorderedStages;
      });

      // Update in database
      const updates = stageIds.map((stageId, index) => 
        supabase
          .from('client_stages')
          .update({ sort_order: index })
          .eq('stage_id', stageId)
          .eq('client_id', clientId)
      );

      await Promise.all(updates);
    } catch (error: unknown) {
      console.error('Error reordering stages:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשנות סדר שלבים',
        variant: 'destructive',
      });
      // Reload data on error to restore correct state
      await loadData();
    }
  };

  // Load data on mount and subscribe to realtime changes
  useEffect(() => {
    if (clientId) {
      loadData();
      
      // Subscribe to realtime changes on stages
      const stagesChannel = supabase
        .channel(`client_stages_${clientId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'client_stages',
            filter: `client_id=eq.${clientId}`,
          },
          (payload) => {
            console.log('Stage change received:', payload);
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as ClientStage;
              setStages(prev =>
                prev.map(s => s.stage_id === updated.stage_id ? { ...s, ...updated } : s)
              );
            } else if (payload.eventType === 'INSERT') {
              const inserted = payload.new as ClientStage;
              setStages(prev => {
                if (prev.some(s => s.stage_id === inserted.stage_id)) return prev;
                return [...prev, inserted].sort((a, b) => a.sort_order - b.sort_order);
              });
            } else if (payload.eventType === 'DELETE') {
              const deleted = payload.old as ClientStage;
              setStages(prev => prev.filter(s => s.stage_id !== deleted.stage_id));
            }
          }
        )
        .subscribe();
      
      // Subscribe to realtime changes on tasks
      const tasksChannel = supabase
        .channel(`client_stage_tasks_${clientId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'client_stage_tasks',
            filter: `client_id=eq.${clientId}`,
          },
          (payload) => {
            console.log('Task change received:', payload);
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as ClientStageTask;
              setTasks(prev =>
                prev.map(t => t.id === updated.id ? { ...t, ...updated } : t)
              );
            } else if (payload.eventType === 'INSERT') {
              const inserted = payload.new as ClientStageTask;
              setTasks(prev => {
                if (prev.some(t => t.id === inserted.id)) return prev;
                return [...prev, inserted];
              });
            } else if (payload.eventType === 'DELETE') {
              const deleted = payload.old as ClientStageTask;
              setTasks(prev => prev.filter(t => t.id !== deleted.id));
            }
          }
        )
        .subscribe();
      
      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(stagesChannel);
        supabase.removeChannel(tasksChannel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Group tasks by stage
  const stagesWithTasks = stages.map(stage => ({
    ...stage,
    tasks: tasks.filter(t => t.stage_id === stage.stage_id),
  }));

  // Assign stage to a folder (or remove from folder by passing null)
  const assignStageToFolder = async (stageId: string, folderId: string | null) => {
    try {
      const stage = stages.find(s => s.stage_id === stageId);
      if (!stage) {
        console.error('Stage not found:', stageId);
        return;
      }

      const { error } = await supabase
        .from('client_stages')
        .update({ folder_id: folderId } as any)
        .eq('id', stage.id);

      if (error) throw error;

      setStages(prev =>
        prev.map(s =>
          s.stage_id === stageId
            ? { ...s, folder_id: folderId }
            : s
        )
      );
      
      toast({
        title: 'הצלחה',
        description: folderId ? 'השלב סווג לתיקייה' : 'השלב הוסר מהתיקייה',
      });
    } catch (error: unknown) {
      console.error('Error assigning stage to folder:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לסווג שלב לתיקייה',
        variant: 'destructive',
      });
    }
  };

  // Get stages filtered by folder
  const getStagesByFolder = (folderId: string | null) => {
    return stagesWithTasks.filter(s => s.folder_id === folderId);
  };

  // ============================================
  // TEMPLATE FUNCTIONS
  // ============================================

  // Save current stages and tasks as a template
  const saveAsTemplate = async (
    templateName: string, 
    includeTaskContent: boolean = false,
    description?: string
  ) => {
    try {
      // Create the template
      const { data: template, error: templateError } = await supabase
        .from('stage_templates')
        .insert({
          name: templateName,
          description: description || null,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Add stages to template
      const stagesToInsert = stages.map((stage, index) => ({
        template_id: template.id,
        stage_name: stage.stage_name,
        stage_icon: stage.stage_icon,
        sort_order: index,
        // Include timer settings if they exist
        target_working_days: stage.target_working_days || null,
      }));

      const { data: templateStages, error: stagesError } = await supabase
        .from('stage_template_stages')
        .insert(stagesToInsert)
        .select();

      if (stagesError) throw stagesError;

      // Create mapping of old stage_id to new template_stage.id
      const stageIdMap = new Map<string, string>();
      stages.forEach((stage, index) => {
        if (templateStages && templateStages[index]) {
          stageIdMap.set(stage.stage_id, templateStages[index].id);
        }
      });

      // Add tasks to template
      const tasksToInsert: any[] = [];
      for (const stage of stagesWithTasks) {
        const templateStageId = stageIdMap.get(stage.stage_id);
        if (!templateStageId || !stage.tasks) continue;

        for (const task of stage.tasks) {
          tasksToInsert.push({
            template_stage_id: templateStageId,
            title: task.title,
            sort_order: task.sort_order,
            // Include full content if requested
            ...(includeTaskContent && {
              background_color: task.background_color || null,
              text_color: task.text_color || null,
              is_bold: task.is_bold || false,
              target_working_days: task.target_working_days || null,
              // Store completed state and date in metadata
              metadata: {
                completed: task.completed,
                completed_at: task.completed_at,
                started_at: task.started_at,
              }
            }),
          });
        }
      }

      if (tasksToInsert.length > 0) {
        const { error: tasksError } = await supabase
          .from('stage_template_tasks')
          .insert(tasksToInsert);

        if (tasksError) throw tasksError;
      }

      toast({
        title: 'הצלחה',
        description: `התבנית "${templateName}" נשמרה בהצלחה עם ${stages.length} שלבים ו-${tasksToInsert.length} משימות`,
      });

      return template;
    } catch (error: unknown) {
      console.error('Error saving template:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור תבנית',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Load saved templates list
  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('stage_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      console.error('Error loading templates:', error);
      return [];
    }
  };

  // Apply a template to this client (adds stages and tasks)
  const applyTemplate = async (templateId: string, includeContent: boolean = false) => {
    try {
      // Get template stages
      const { data: templateStages, error: stagesError } = await supabase
        .from('stage_template_stages')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order');

      if (stagesError) throw stagesError;
      if (!templateStages || templateStages.length === 0) {
        toast({
          title: 'התבנית ריקה',
          description: 'לא נמצאו שלבים בתבנית זו',
          variant: 'destructive',
        });
        return false;
      }

      // Get current max sort order
      const currentMaxOrder = stages.reduce((max, s) => Math.max(max, s.sort_order), -1);

      // Create stages for this client
      const stagesToInsert = templateStages.map((ts, index) => ({
        client_id: clientId,
        stage_id: `template_${templateId}_${ts.id}_${Date.now()}`,
        stage_name: ts.stage_name,
        stage_icon: ts.stage_icon,
        sort_order: currentMaxOrder + 1 + index,
        target_working_days: ts.target_working_days || null,
      }));

      const { data: newStages, error: insertStagesError } = await supabase
        .from('client_stages')
        .insert(stagesToInsert)
        .select();

      if (insertStagesError) throw insertStagesError;

      // Create mapping of template_stage.id to new client stage_id
      const stageIdMap = new Map<string, string>();
      templateStages.forEach((ts, index) => {
        if (newStages && newStages[index]) {
          stageIdMap.set(ts.id, newStages[index].stage_id);
        }
      });

      // Get template tasks
      const templateStageIds = templateStages.map(ts => ts.id);
      const { data: templateTasks, error: tasksError } = await supabase
        .from('stage_template_tasks')
        .select('*')
        .in('template_stage_id', templateStageIds)
        .order('sort_order');

      if (tasksError) throw tasksError;

      // Create tasks for this client
      if (templateTasks && templateTasks.length > 0) {
        const tasksToInsert = templateTasks.map(tt => {
          const clientStageId = stageIdMap.get(tt.template_stage_id);
          const metadata = (tt as any).metadata || {};
          
          return {
            client_id: clientId,
            stage_id: clientStageId,
            title: tt.title,
            sort_order: tt.sort_order,
            completed: includeContent && metadata.completed ? true : false,
            completed_at: includeContent && metadata.completed_at ? metadata.completed_at : null,
            // Include styling if present and includeContent is true
            ...(includeContent && {
              background_color: tt.background_color || null,
              text_color: tt.text_color || null,
              is_bold: tt.is_bold || false,
              target_working_days: tt.target_working_days || null,
              started_at: metadata.started_at || null,
            }),
          };
        });

        const { error: insertTasksError } = await supabase
          .from('client_stage_tasks')
          .insert(tasksToInsert);

        if (insertTasksError) throw insertTasksError;
      }

      // Reload data
      await loadData();

      toast({
        title: 'הצלחה',
        description: `התבנית הוחלה בהצלחה - ${templateStages.length} שלבים ו-${templateTasks?.length || 0} משימות`,
      });

      return true;
    } catch (error: unknown) {
      console.error('Error applying template:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להחיל תבנית',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete a template
  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('stage_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'התבנית נמחקה בהצלחה',
      });
      return true;
    } catch (error: unknown) {
      console.error('Error deleting template:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק תבנית',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    stages: stagesWithTasks,
    loading,
    addTask,
    addBulkTasks,
    toggleTask,
    updateTask,
    updateTaskCompletedDate,
    updateTaskStyle,
    startTaskTimer,
    stopTaskTimer,
    updateTaskTimer,
    cycleTaskTimerStyle,
    startStageTimer,
    stopStageTimer,
    cycleStageTimerStyle,
    deleteTask,
    bulkDeleteTasks,
    addStage,
    updateStage,
    deleteStage,
    bulkDeleteStages,
    reorderTasks,
    reorderStages,
    copyStageData,
    pasteStageData,
    assignStageToFolder,
    getStagesByFolder,
    // Template functions
    saveAsTemplate,
    loadTemplates,
    applyTemplate,
    deleteTemplate,
    refresh: loadData,
  };
}
