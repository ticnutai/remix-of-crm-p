// useStageDataTypeSync - Hook to sync stage completion with data types
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StageDataTypeSyncOptions {
  clientId: string;
  onStageUpdate?: () => void;
}

export function useStageDataTypeSync({ clientId, onStageUpdate }: StageDataTypeSyncOptions) {
  const { user } = useAuth();

  // Create a data type for a stage
  const createStageDataType = useCallback(async (
    stageId: string, 
    stageName: string,
    stageRowId: string
  ) => {
    if (!user) return null;

    try {
      // Check if data type already exists
      const { data: existing } = await supabase
        .from('data_types')
        .select('id')
        .eq('name', `client_stage_${stageId}`)
        .single();

      if (existing) {
        // Update the stage with the existing data_type_id
        await supabase
          .from('client_stages')
          .update({ data_type_id: existing.id })
          .eq('id', stageRowId);
        return existing.id;
      }

      // Create new data type for this stage
      const { data: dataType, error } = await supabase
        .from('data_types')
        .insert({
          name: `client_stage_${stageId}`,
          display_name: stageName,
          source_type: 'custom',
          type_mode: 'options',
          icon: 'CheckSquare',
          color: '#22c55e',
          options: [
            { value: 'pending', label: 'בתהליך', color: '#6b7280' },
            { value: 'completed', label: 'הושלם', color: '#22c55e' }
          ],
          description: `סוג נתון לשלב: ${stageName}`,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update the stage with the new data_type_id
      await supabase
        .from('client_stages')
        .update({ data_type_id: dataType.id })
        .eq('id', stageRowId);

      return dataType.id;
    } catch (error) {
      console.error('Error creating stage data type:', error);
      return null;
    }
  }, [user]);

  // Delete a data type for a stage
  const deleteStageDataType = useCallback(async (stageId: string) => {
    try {
      const { error } = await supabase
        .from('data_types')
        .delete()
        .eq('name', `client_stage_${stageId}`);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting stage data type:', error);
    }
  }, []);

  // Update stage completion status
  const updateStageCompletion = useCallback(async (
    stageRowId: string,
    isCompleted: boolean
  ) => {
    try {
      await supabase
        .from('client_stages')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', stageRowId);
    } catch (error) {
      console.error('Error updating stage completion:', error);
    }
  }, []);

  // Check and sync all stages for a client
  const syncStagesWithDataTypes = useCallback(async () => {
    if (!clientId || !user) return;

    try {
      // Get all stages for this client
      const { data: stages, error } = await supabase
        .from('client_stages')
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;

      // For each stage, ensure it has a data type
      for (const stage of stages || []) {
        if (!stage.data_type_id) {
          await createStageDataType(stage.stage_id, stage.stage_name, stage.id);
        }
      }

      onStageUpdate?.();
    } catch (error) {
      console.error('Error syncing stages with data types:', error);
    }
  }, [clientId, user, createStageDataType, onStageUpdate]);

  // Listen for realtime changes on client_stages
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`stage-sync-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_stages',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          console.log('Stage change detected:', payload);
          onStageUpdate?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_stage_tasks',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          console.log('Task change detected:', payload);
          onStageUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, onStageUpdate]);

  return {
    createStageDataType,
    deleteStageDataType,
    updateStageCompletion,
    syncStagesWithDataTypes,
  };
}

// Hook to get clients by stage status
export function useClientsByStage(stageId: string, status: 'pending' | 'completed') {
  const fetchClients = useCallback(async () => {
    try {
      const isCompleted = status === 'completed';
      
      const { data, error } = await supabase
        .from('client_stages')
        .select(`
          client_id,
          clients!inner(id, name, company, email, phone, status)
        `)
        .eq('stage_id', stageId)
        .eq('is_completed', isCompleted);

      if (error) throw error;

      // Extract unique clients
      const clients = data?.map((item: any) => item.clients) || [];
      return clients;
    } catch (error) {
      console.error('Error fetching clients by stage:', error);
      return [];
    }
  }, [stageId, status]);

  return { fetchClients };
}
