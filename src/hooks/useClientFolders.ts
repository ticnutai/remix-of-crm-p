import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ClientFolder {
  id: string;
  client_id: string;
  folder_name: string;
  folder_icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ClientFolderStage {
  id: string;
  folder_id: string;
  stage_name: string;
  stage_icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  tasks?: ClientFolderTask[];
}

export interface ClientFolderTask {
  id: string;
  stage_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  background_color?: string | null;
  text_color?: string | null;
  is_bold?: boolean;
  started_at?: string | null;
  target_working_days?: number | null;
  timer_display_style?: number;
}

// Default stages for new folders
const DEFAULT_FOLDER_STAGES = [
  { stage_name: 'שלב 1', stage_icon: 'FileText', sort_order: 0 },
  { stage_name: 'שלב 2', stage_icon: 'Clock', sort_order: 1 },
  { stage_name: 'שלב 3', stage_icon: 'CheckCircle', sort_order: 2 },
];

export function useClientFolders(clientId: string) {
  const [folders, setFolders] = useState<ClientFolder[]>([]);
  const [stages, setStages] = useState<ClientFolderStage[]>([]);
  const [tasks, setTasks] = useState<ClientFolderTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Load folders for client
  const loadFolders = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);

      // Load folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('client_folders')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order');

      if (foldersError) throw foldersError;

      setFolders(foldersData || []);

      // Set active folder to first one if not set
      if (foldersData && foldersData.length > 0 && !activeFolderId) {
        setActiveFolderId(foldersData[0].id);
      }
    } catch (error: any) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId, activeFolderId]);

  // Load stages and tasks for active folder
  const loadStagesAndTasks = useCallback(async () => {
    if (!activeFolderId) {
      setStages([]);
      setTasks([]);
      return;
    }

    try {
      // Load stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('client_folder_stages')
        .select('*')
        .eq('folder_id', activeFolderId)
        .order('sort_order');

      if (stagesError) throw stagesError;

      setStages(stagesData || []);

      // Load tasks for all stages in folder
      if (stagesData && stagesData.length > 0) {
        const stageIds = stagesData.map(s => s.id);
        const { data: tasksData, error: tasksError } = await supabase
          .from('client_folder_tasks')
          .select('*')
          .in('stage_id', stageIds)
          .order('sort_order');

        if (tasksError) throw tasksError;

        setTasks(tasksData || []);
      } else {
        setTasks([]);
      }
    } catch (error: any) {
      console.error('Error loading stages and tasks:', error);
    }
  }, [activeFolderId]);

  // Initial load
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // Load stages when active folder changes
  useEffect(() => {
    loadStagesAndTasks();
  }, [loadStagesAndTasks]);

  // Add new folder
  const addFolder = async (folderName: string, folderIcon: string = 'Folder') => {
    if (!clientId) return null;

    try {
      const newSortOrder = folders.length;

      const { data: newFolder, error } = await supabase
        .from('client_folders')
        .insert({
          client_id: clientId,
          folder_name: folderName,
          folder_icon: folderIcon,
          sort_order: newSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default stages for the folder
      const stagesToInsert = DEFAULT_FOLDER_STAGES.map(stage => ({
        folder_id: newFolder.id,
        ...stage,
      }));

      const { error: stagesError } = await supabase
        .from('client_folder_stages')
        .insert(stagesToInsert);

      if (stagesError) {
        console.error('Error creating default stages:', stagesError);
      }

      toast({
        title: 'התיקייה נוצרה בהצלחה',
        description: `"${folderName}" נוספה ללקוח`,
      });

      await loadFolders();
      setActiveFolderId(newFolder.id);
      return newFolder;
    } catch (error: any) {
      console.error('Error adding folder:', error);
      toast({
        title: 'שגיאה ביצירת תיקייה',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update folder
  const updateFolder = async (folderId: string, updates: { folder_name?: string; folder_icon?: string }) => {
    try {
      const { error } = await supabase
        .from('client_folders')
        .update(updates)
        .eq('id', folderId);

      if (error) throw error;

      toast({
        title: 'התיקייה עודכנה',
      });

      await loadFolders();
    } catch (error: any) {
      console.error('Error updating folder:', error);
      toast({
        title: 'שגיאה בעדכון תיקייה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Delete folder
  const deleteFolder = async (folderId: string) => {
    try {
      // Delete tasks first
      const stageIds = stages.filter(s => s.id).map(s => s.id);
      if (stageIds.length > 0) {
        await supabase
          .from('client_folder_tasks')
          .delete()
          .in('stage_id', stageIds);
      }

      // Delete stages
      await supabase
        .from('client_folder_stages')
        .delete()
        .eq('folder_id', folderId);

      // Delete folder
      const { error } = await supabase
        .from('client_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast({
        title: 'התיקייה נמחקה',
      });

      // Reset active folder
      if (activeFolderId === folderId) {
        const remaining = folders.filter(f => f.id !== folderId);
        setActiveFolderId(remaining.length > 0 ? remaining[0].id : null);
      }

      await loadFolders();
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast({
        title: 'שגיאה במחיקת תיקייה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Reorder folders
  const reorderFolders = async (newOrder: ClientFolder[]) => {
    try {
      const updates = newOrder.map((folder, index) => ({
        id: folder.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('client_folders')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setFolders(newOrder.map((f, i) => ({ ...f, sort_order: i })));
    } catch (error: any) {
      console.error('Error reordering folders:', error);
      await loadFolders();
    }
  };

  // Add stage to folder
  const addStage = async (stageName: string, stageIcon: string = 'FileText') => {
    if (!activeFolderId) return null;

    try {
      const newSortOrder = stages.length;

      const { data: newStage, error } = await supabase
        .from('client_folder_stages')
        .insert({
          folder_id: activeFolderId,
          stage_name: stageName,
          stage_icon: stageIcon,
          sort_order: newSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'השלב נוסף בהצלחה',
      });

      await loadStagesAndTasks();
      return newStage;
    } catch (error: any) {
      console.error('Error adding stage:', error);
      toast({
        title: 'שגיאה בהוספת שלב',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update stage
  const updateStage = async (stageId: string, updates: { stage_name?: string; stage_icon?: string }) => {
    try {
      const { error } = await supabase
        .from('client_folder_stages')
        .update(updates)
        .eq('id', stageId);

      if (error) throw error;

      await loadStagesAndTasks();
    } catch (error: any) {
      console.error('Error updating stage:', error);
      toast({
        title: 'שגיאה בעדכון שלב',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Delete stage
  const deleteStage = async (stageId: string) => {
    try {
      // Delete tasks first
      await supabase
        .from('client_folder_tasks')
        .delete()
        .eq('stage_id', stageId);

      // Delete stage
      const { error } = await supabase
        .from('client_folder_stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;

      toast({
        title: 'השלב נמחק',
      });

      await loadStagesAndTasks();
    } catch (error: any) {
      console.error('Error deleting stage:', error);
      toast({
        title: 'שגיאה במחיקת שלב',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Add task
  const addTask = async (stageId: string, title: string) => {
    try {
      const stageTasks = tasks.filter(t => t.stage_id === stageId);
      const newSortOrder = stageTasks.length;

      const { data: newTask, error } = await supabase
        .from('client_folder_tasks')
        .insert({
          stage_id: stageId,
          title,
          completed: false,
          sort_order: newSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      await loadStagesAndTasks();
      return newTask;
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: 'שגיאה בהוספת משימה',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Add bulk tasks
  const addBulkTasks = async (stageId: string, titles: string[]) => {
    try {
      const stageTasks = tasks.filter(t => t.stage_id === stageId);
      let sortOrder = stageTasks.length;

      const tasksToInsert = titles.map(title => ({
        stage_id: stageId,
        title: title.trim(),
        completed: false,
        sort_order: sortOrder++,
      }));

      const { error } = await supabase
        .from('client_folder_tasks')
        .insert(tasksToInsert);

      if (error) throw error;

      toast({
        title: `${titles.length} משימות נוספו`,
      });

      await loadStagesAndTasks();
    } catch (error: any) {
      console.error('Error adding bulk tasks:', error);
      toast({
        title: 'שגיאה בהוספת משימות',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const newCompleted = !task.completed;
      const { error } = await supabase
        .from('client_folder_tasks')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;

      await loadStagesAndTasks();
    } catch (error: any) {
      console.error('Error toggling task:', error);
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<ClientFolderTask>) => {
    try {
      const { error } = await supabase
        .from('client_folder_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      await loadStagesAndTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'שגיאה בעדכון משימה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('client_folder_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await loadStagesAndTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: 'שגיאה במחיקת משימה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Reorder stages
  const reorderStages = async (newOrder: ClientFolderStage[]) => {
    try {
      const updates = newOrder.map((stage, index) => ({
        id: stage.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('client_folder_stages')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setStages(newOrder);
    } catch (error: any) {
      console.error('Error reordering stages:', error);
      await loadStagesAndTasks();
    }
  };

  // Reorder tasks
  const reorderTasks = async (stageId: string, newOrder: ClientFolderTask[]) => {
    try {
      const updates = newOrder.map((task, index) => ({
        id: task.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('client_folder_tasks')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      // Update local state
      setTasks(prev => {
        const otherTasks = prev.filter(t => t.stage_id !== stageId);
        return [...otherTasks, ...newOrder];
      });
    } catch (error: any) {
      console.error('Error reordering tasks:', error);
      await loadStagesAndTasks();
    }
  };

  // Duplicate folder (copy all stages and tasks)
  const duplicateFolder = async (folderId: string, newName: string) => {
    try {
      const sourceFolder = folders.find(f => f.id === folderId);
      if (!sourceFolder) return null;

      // Create new folder
      const newFolder = await addFolder(newName, sourceFolder.folder_icon);
      if (!newFolder) return null;

      // Get source stages
      const { data: sourceStages } = await supabase
        .from('client_folder_stages')
        .select('*')
        .eq('folder_id', folderId)
        .order('sort_order');

      if (!sourceStages) return newFolder;

      // Copy each stage and its tasks
      for (const sourceStage of sourceStages) {
        // Create new stage
        const { data: newStage, error: stageError } = await supabase
          .from('client_folder_stages')
          .insert({
            folder_id: newFolder.id,
            stage_name: sourceStage.stage_name,
            stage_icon: sourceStage.stage_icon,
            sort_order: sourceStage.sort_order,
          })
          .select()
          .single();

        if (stageError || !newStage) continue;

        // Get source tasks for this stage
        const { data: sourceTasks } = await supabase
          .from('client_folder_tasks')
          .select('*')
          .eq('stage_id', sourceStage.id)
          .order('sort_order');

        if (sourceTasks && sourceTasks.length > 0) {
          // Copy tasks
          const tasksToInsert = sourceTasks.map(task => ({
            stage_id: newStage.id,
            title: task.title,
            completed: false, // Reset completion status
            sort_order: task.sort_order,
            background_color: task.background_color,
            text_color: task.text_color,
            is_bold: task.is_bold,
            target_working_days: task.target_working_days,
          }));

          await supabase
            .from('client_folder_tasks')
            .insert(tasksToInsert);
        }
      }

      toast({
        title: 'התיקייה שוכפלה בהצלחה',
      });

      await loadFolders();
      setActiveFolderId(newFolder.id);
      return newFolder;
    } catch (error: any) {
      console.error('Error duplicating folder:', error);
      toast({
        title: 'שגיאה בשכפול תיקייה',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Get stages with tasks
  const stagesWithTasks = stages.map(stage => ({
    ...stage,
    tasks: tasks.filter(t => t.stage_id === stage.id),
  }));

  return {
    folders,
    stages: stagesWithTasks,
    activeFolderId,
    setActiveFolderId,
    loading,
    // Folder operations
    addFolder,
    updateFolder,
    deleteFolder,
    duplicateFolder,
    reorderFolders,
    // Stage operations
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
    // Task operations
    addTask,
    addBulkTasks,
    toggleTask,
    updateTask,
    deleteTask,
    reorderTasks,
    // Refresh
    refresh: loadFolders,
  };
}
