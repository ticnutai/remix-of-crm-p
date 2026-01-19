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
}

export function useClientStages(clientId: string) {
  const [stages, setStages] = useState<ClientStage[]>([]);
  const [tasks, setTasks] = useState<ClientStageTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Default stages configuration
  const DEFAULT_STAGES = [
    { stage_id: 'contact', stage_name: 'התקשרות לקוח', stage_icon: 'Phone', sort_order: 0 },
    { stage_id: 'info', stage_name: 'תיק מידע', stage_icon: 'FolderOpen', sort_order: 1 },
    { stage_id: 'submission', stage_name: 'הגשה', stage_icon: 'Send', sort_order: 2 },
    { stage_id: 'control', stage_name: 'בקרה מרחבית', stage_icon: 'MapPin', sort_order: 3 },
  ];

  // Initialize stages if they don't exist
  const initializeStages = async () => {
    try {
      const { data: existingStages, error: fetchError } = await supabase
        .from('client_stages')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order');

      if (fetchError) throw fetchError;

      // If no stages exist, create default ones
      if (!existingStages || existingStages.length === 0) {
        const stagesToInsert = DEFAULT_STAGES.map(stage => ({
          client_id: clientId,
          ...stage,
        }));

        const { data: newStages, error: insertError } = await supabase
          .from('client_stages')
          .insert(stagesToInsert)
          .select();

        if (insertError) throw insertError;
        return newStages || [];
      }

      return existingStages;
    } catch (error: unknown) {
      console.error('Error initializing stages:', error);
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
      setTasks(loadedTasks || []);
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

  // Load data on mount
  useEffect(() => {
    if (clientId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Group tasks by stage
  const stagesWithTasks = stages.map(stage => ({
    ...stage,
    tasks: tasks.filter(t => t.stage_id === stage.stage_id),
  }));

  return {
    stages: stagesWithTasks,
    loading,
    addTask,
    addBulkTasks,
    toggleTask,
    updateTask,
    deleteTask,
    bulkDeleteTasks,
    addStage,
    updateStage,
    deleteStage,
    reorderTasks,
    reorderStages,
    refresh: loadData,
  };
}
