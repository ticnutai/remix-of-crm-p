// Hook to fetch clients grouped by their ACTIVE stage (first incomplete stage)
// Each client can only be in ONE active stage at a time
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ClientStageTask {
  task_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
}

export interface ClientInStage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string | null;
  stage_id: string;
  stage_progress: number;
  tasks: ClientStageTask[];
  // Additional info about all stages
  total_stages: number;
  completed_stages: number;
}

export interface StageGroup {
  stage_name: string;
  stage_icon: string | null;
  clients: ClientInStage[];
  sort_order: number; // Keep track of stage order
}

// Helper to check if a stage is completed (all tasks done, or no tasks = incomplete)
function isStageCompleted(tasks: ClientStageTask[]): boolean {
  if (tasks.length === 0) return false; // Stage with no tasks is not completed
  return tasks.every(t => t.is_completed);
}

export function useClientsByStage() {
  const [stageGroups, setStageGroups] = useState<StageGroup[]>([]);
  const [allStageNames, setAllStageNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all unique stage names (for display order)
      const { data: stageNamesData, error: stageNamesError } = await supabase
        .from('client_stages')
        .select('stage_name, stage_icon, sort_order')
        .order('sort_order');

      if (stageNamesError) throw stageNamesError;

      // Get unique stage names with their order
      const uniqueStageNames = new Map<string, { icon: string | null; sort_order: number }>();
      stageNamesData?.forEach(stage => {
        if (!uniqueStageNames.has(stage.stage_name)) {
          uniqueStageNames.set(stage.stage_name, { 
            icon: stage.stage_icon,
            sort_order: stage.sort_order 
          });
        }
      });

      setAllStageNames(Array.from(uniqueStageNames.keys()));

      // Fetch all stages with their client info
      const { data: stagesData, error: stagesError } = await supabase
        .from('client_stages')
        .select(`
          stage_id,
          stage_name,
          stage_icon,
          client_id,
          sort_order,
          clients (
            id,
            name,
            email,
            phone,
            company,
            status
          )
        `)
        .order('sort_order');

      if (stagesError) throw stagesError;

      // Fetch all tasks for all stages
      const { data: tasksData, error: tasksError } = await supabase
        .from('client_stage_tasks')
        .select('*')
        .order('sort_order');

      if (tasksError) throw tasksError;

      // Group tasks by stage_id
      const tasksByStageId = new Map<string, ClientStageTask[]>();
      tasksData?.forEach(task => {
        const existing = tasksByStageId.get(task.stage_id) || [];
        existing.push({
          task_id: task.id,
          title: task.title,
          is_completed: task.completed,
          sort_order: task.sort_order,
        });
        tasksByStageId.set(task.stage_id, existing);
      });

      // Group stages by client_id to find the active stage for each client
      const stagesByClientId = new Map<string, Array<{
        stage_id: string;
        stage_name: string;
        stage_icon: string | null;
        sort_order: number;
        client: any;
        tasks: ClientStageTask[];
      }>>();

      stagesData?.forEach(stage => {
        if (!stage.clients) return;
        
        const clientId = (stage.clients as any).id;
        const tasks = tasksByStageId.get(stage.stage_id) || [];
        
        const existing = stagesByClientId.get(clientId) || [];
        existing.push({
          stage_id: stage.stage_id,
          stage_name: stage.stage_name,
          stage_icon: stage.stage_icon,
          sort_order: stage.sort_order,
          client: stage.clients,
          tasks,
        });
        stagesByClientId.set(clientId, existing);
      });

      // Now find the ACTIVE stage for each client (first incomplete stage)
      // and group clients by their active stage name
      const groupedByName = new Map<string, { 
        icon: string | null; 
        clients: ClientInStage[];
        sort_order: number;
      }>();

      stagesByClientId.forEach((clientStages, clientId) => {
        // Sort stages by sort_order
        const sortedStages = clientStages.sort((a, b) => a.sort_order - b.sort_order);
        
        // Find the first incomplete stage (= the active stage)
        // A stage is complete if it has tasks AND all tasks are completed
        let activeStage = sortedStages.find(stage => !isStageCompleted(stage.tasks));
        
        // If all stages are completed, put client in last stage (or skip)
        if (!activeStage) {
          // All stages completed - put in last stage or create "הושלם" group
          activeStage = sortedStages[sortedStages.length - 1];
          if (!activeStage) return; // No stages at all
        }

        const client = activeStage.client;
        const tasks = activeStage.tasks;
        const completedTasks = tasks.filter(t => t.is_completed).length;
        const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        // Count completed stages for the client
        const completedStagesCount = sortedStages.filter(s => isStageCompleted(s.tasks)).length;

        const clientData: ClientInStage = {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          status: client.status,
          stage_id: activeStage.stage_id,
          stage_progress: progress,
          tasks,
          total_stages: sortedStages.length,
          completed_stages: completedStagesCount,
        };

        const existing = groupedByName.get(activeStage.stage_name);
        if (existing) {
          // Avoid duplicates
          if (!existing.clients.some(c => c.id === client.id)) {
            existing.clients.push(clientData);
          }
        } else {
          groupedByName.set(activeStage.stage_name, {
            icon: activeStage.stage_icon,
            clients: [clientData],
            sort_order: activeStage.sort_order,
          });
        }
      });

      // Convert to array and sort by stage order
      const groups: StageGroup[] = Array.from(groupedByName.entries())
        .map(([name, data]) => ({
          stage_name: name,
          stage_icon: data.icon,
          clients: data.clients.sort((a, b) => a.name.localeCompare(b.name, 'he')),
          sort_order: data.sort_order,
        }))
        .sort((a, b) => a.sort_order - b.sort_order);

      setStageGroups(groups);
    } catch (error) {
      console.error('Error fetching clients by stage:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את הלקוחות לפי שלבים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get clients for a specific stage name
  const getClientsByStage = useCallback((stageName: string): ClientInStage[] => {
    const group = stageGroups.find(g => g.stage_name === stageName);
    return group?.clients || [];
  }, [stageGroups]);

  // Get stage group by name
  const getStageGroup = useCallback((stageName: string): StageGroup | undefined => {
    return stageGroups.find(g => g.stage_name === stageName);
  }, [stageGroups]);

  return {
    stageGroups,
    allStageNames,
    loading,
    getClientsByStage,
    getStageGroup,
    refresh: fetchData,
  };
}
