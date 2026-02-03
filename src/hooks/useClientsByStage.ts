// Hook to fetch clients grouped by stage name
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
}

export interface StageGroup {
  stage_name: string;
  stage_icon: string | null;
  clients: ClientInStage[];
}

export function useClientsByStage() {
  const [stageGroups, setStageGroups] = useState<StageGroup[]>([]);
  const [allStageNames, setAllStageNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all unique stage names (not duplicated - same name = same stage)
      const { data: stageNamesData, error: stageNamesError } = await supabase
        .from('client_stages')
        .select('stage_name, stage_icon')
        .order('sort_order');

      if (stageNamesError) throw stageNamesError;

      // Get unique stage names
      const uniqueStageNames = new Map<string, string | null>();
      stageNamesData?.forEach(stage => {
        if (!uniqueStageNames.has(stage.stage_name)) {
          uniqueStageNames.set(stage.stage_name, stage.stage_icon);
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
          task_id: task.task_id,
          title: task.title,
          is_completed: task.is_completed,
          sort_order: task.sort_order,
        });
        tasksByStageId.set(task.stage_id, existing);
      });

      // Group clients by stage name (same stage name = same logical stage)
      const groupedByName = new Map<string, { icon: string | null; clients: ClientInStage[] }>();

      stagesData?.forEach(stage => {
        if (!stage.clients) return;

        const client = stage.clients as any;
        const tasks = tasksByStageId.get(stage.stage_id) || [];
        const completedTasks = tasks.filter(t => t.is_completed).length;
        const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        const clientData: ClientInStage = {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          status: client.status,
          stage_id: stage.stage_id,
          stage_progress: progress,
          tasks,
        };

        const existing = groupedByName.get(stage.stage_name);
        if (existing) {
          // Avoid duplicates - same client in same stage name
          if (!existing.clients.some(c => c.id === client.id)) {
            existing.clients.push(clientData);
          }
        } else {
          groupedByName.set(stage.stage_name, {
            icon: stage.stage_icon,
            clients: [clientData],
          });
        }
      });

      // Convert to array
      const groups: StageGroup[] = Array.from(groupedByName.entries()).map(([name, data]) => ({
        stage_name: name,
        stage_icon: data.icon,
        clients: data.clients.sort((a, b) => a.name.localeCompare(b.name, 'he')),
      }));

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
