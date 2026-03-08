// Hook to fetch all clients' current stage for table display
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClientStageInfo {
  client_id: string;
  current_stage_id: string | null;
  current_stage_name: string | null;
  current_stage_icon: string | null;
  stages_count: number;
  completed_tasks: number;
  total_tasks: number;
}

export interface StageOption {
  stage_id: string;
  stage_name: string;
  stage_icon: string | null;
}

// All available stages grouped by template usage
export function useClientStagesTable() {
  const [clientStages, setClientStages] = useState<
    Map<string, ClientStageInfo>
  >(new Map());
  const [allStages, setAllStages] = useState<StageOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all stages for all clients
  const fetchClientStages = useCallback(async () => {
    try {
      // Get all client stages
      const { data: stages, error: stagesError } = await supabase
        .from("client_stages")
        .select("*")
        .order("sort_order", { ascending: true });

      if (stagesError) throw stagesError;

      // Get all tasks to calculate completion
      const { data: tasks, error: tasksError } = await supabase
        .from("client_stage_tasks")
        .select("client_id, stage_id, completed");

      if (tasksError) throw tasksError;

      // Build client stages map
      const clientMap = new Map<string, ClientStageInfo>();

      // Group stages by client
      const stagesByClient = new Map<string, typeof stages>();
      (stages || []).forEach((stage) => {
        const list = stagesByClient.get(stage.client_id) || [];
        list.push(stage);
        stagesByClient.set(stage.client_id, list);
      });

      // Calculate tasks completion per client
      const tasksByClient = new Map<
        string,
        { completed: number; total: number }
      >();
      (tasks || []).forEach((task) => {
        const stats = tasksByClient.get(task.client_id) || {
          completed: 0,
          total: 0,
        };
        stats.total++;
        if (task.completed) stats.completed++;
        tasksByClient.set(task.client_id, stats);
      });

      // Build info for each client
      stagesByClient.forEach((clientStages, clientId) => {
        // Current stage is the first stage (lowest sort_order) that has incomplete tasks
        // Or if all complete, the last stage
        const sortedStages = clientStages.sort(
          (a, b) => a.sort_order - b.sort_order,
        );

        // Get tasks for this client grouped by stage
        const clientTasks = (tasks || []).filter(
          (t) => t.client_id === clientId,
        );
        const tasksByStage = new Map<
          string,
          { completed: number; total: number }
        >();
        clientTasks.forEach((t) => {
          const stats = tasksByStage.get(t.stage_id) || {
            completed: 0,
            total: 0,
          };
          stats.total++;
          if (t.completed) stats.completed++;
          tasksByStage.set(t.stage_id, stats);
        });

        // Find current stage - first incomplete stage, or last stage if all complete
        let currentStage = sortedStages[0]; // Default to first
        for (const stage of sortedStages) {
          const stats = tasksByStage.get(stage.stage_id);
          if (!stats || stats.completed < stats.total) {
            // This stage has incomplete tasks - it's the current stage
            currentStage = stage;
            break;
          }
        }

        // If all stages complete, show last stage
        const allComplete = sortedStages.every((s) => {
          const stats = tasksByStage.get(s.stage_id);
          return stats && stats.completed === stats.total && stats.total > 0;
        });
        if (allComplete && sortedStages.length > 0) {
          currentStage = sortedStages[sortedStages.length - 1];
        }

        const taskStats = tasksByClient.get(clientId) || {
          completed: 0,
          total: 0,
        };

        clientMap.set(clientId, {
          client_id: clientId,
          current_stage_id: currentStage?.stage_id || null,
          current_stage_name: currentStage?.stage_name || null,
          current_stage_icon: currentStage?.stage_icon || null,
          stages_count: sortedStages.length,
          completed_tasks: taskStats.completed,
          total_tasks: taskStats.total,
        });
      });

      setClientStages(clientMap);

      // Build unique stage names for dropdown options
      const uniqueStages = new Map<string, StageOption>();
      (stages || []).forEach((stage) => {
        if (!uniqueStages.has(stage.stage_name)) {
          uniqueStages.set(stage.stage_name, {
            stage_id: stage.stage_id,
            stage_name: stage.stage_name,
            stage_icon: stage.stage_icon,
          });
        }
      });
      setAllStages(Array.from(uniqueStages.values()));
    } catch (error) {
      console.error("Error fetching client stages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update client's current stage
  const updateClientStage = useCallback(
    async (clientId: string, newStageName: string) => {
      try {
        // Get client's stages
        const { data: stages, error } = await supabase
          .from("client_stages")
          .select("*")
          .eq("client_id", clientId)
          .order("sort_order", { ascending: true });

        if (error) throw error;

        if (!stages || stages.length === 0) {
          // No stages exist - create a new one with this name
          const newStageId = `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await supabase.from("client_stages").insert({
            client_id: clientId,
            stage_id: newStageId,
            stage_name: newStageName,
            stage_icon: "FolderOpen",
            sort_order: 0,
          });
        } else {
          // Check if stage with this name already exists for this client
          const existingStage = stages.find(
            (s) => s.stage_name === newStageName,
          );

          if (existingStage) {
            // Stage with this name exists - mark previous stages as complete
            const targetOrder = existingStage.sort_order;
            const previousStages = stages.filter(
              (s) => s.sort_order < targetOrder,
            );

            for (const prevStage of previousStages) {
              await supabase
                .from("client_stage_tasks")
                .update({
                  completed: true,
                  completed_at: new Date().toISOString(),
                })
                .eq("client_id", clientId)
                .eq("stage_id", prevStage.stage_id)
                .eq("completed", false);
            }
          } else {
            // Stage doesn't exist - UPDATE the current stage's name (replace, not add)
            // Find the current stage (first incomplete or first stage)
            const { data: tasks } = await supabase
              .from("client_stage_tasks")
              .select("stage_id, completed")
              .eq("client_id", clientId);

            const tasksByStage = new Map<
              string,
              { completed: number; total: number }
            >();
            (tasks || []).forEach((t) => {
              const stats = tasksByStage.get(t.stage_id) || {
                completed: 0,
                total: 0,
              };
              stats.total++;
              if (t.completed) stats.completed++;
              tasksByStage.set(t.stage_id, stats);
            });

            // Find current stage - first incomplete, or first if all complete
            let currentStage = stages[0];
            for (const stage of stages) {
              const stats = tasksByStage.get(stage.stage_id);
              if (!stats || stats.completed < stats.total) {
                currentStage = stage;
                break;
              }
            }

            // Update the current stage's name to the new name
            const { error: updateError } = await supabase
              .from("client_stages")
              .update({ stage_name: newStageName })
              .eq("stage_id", currentStage.stage_id)
              .eq("client_id", clientId);

            if (updateError) throw updateError;
          }
        }

        // Refresh data
        await fetchClientStages();
        return true;
      } catch (error) {
        console.error("Error updating client stage:", error);
        return false;
      }
    },
    [fetchClientStages],
  );

  // Update multiple clients' stages at once
  const updateMultipleClientsStage = useCallback(
    async (clientIds: string[], newStageName: string) => {
      let successCount = 0;
      let failCount = 0;

      for (const clientId of clientIds) {
        const success = await updateClientStage(clientId, newStageName);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Refresh data once after all updates
      await fetchClientStages();

      return { successCount, failCount };
    },
    [updateClientStage, fetchClientStages],
  );

  // Initial fetch
  useEffect(() => {
    fetchClientStages();
  }, [fetchClientStages]);

  // Subscribe to realtime changes
  useEffect(() => {
    const stagesChannel = supabase
      .channel("client_stages_table_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_stages" },
        () => {
          fetchClientStages();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_stage_tasks" },
        () => {
          fetchClientStages();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stagesChannel);
    };
  }, [fetchClientStages]);

  const getClientStageInfo = useCallback(
    (clientId: string) => clientStages.get(clientId) || null,
    [clientStages],
  );

  return {
    clientStages,
    allStages,
    loading,
    fetchClientStages,
    updateClientStage,
    updateMultipleClientsStage,
    getClientStageInfo,
  };
}
