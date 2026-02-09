// Hook to fetch all clients' consultants for table display with bi-directional sync
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Consultant {
  id: string;
  name: string;
  profession: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
}

export interface ClientConsultantInfo {
  client_id: string;
  consultant_ids: string[];
  consultant_names: string[];
  consultants: Consultant[];
  primary_consultant_id: string | null;
  primary_consultant_name: string | null;
}

export interface ConsultantOption {
  id: string;
  name: string;
  profession: string | null;
  company: string | null;
}

// Hook for managing client-consultant relationships in table view
export function useClientConsultantsTable() {
  const [clientConsultants, setClientConsultants] = useState<Map<string, ClientConsultantInfo>>(new Map());
  const [allConsultants, setAllConsultants] = useState<ConsultantOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all consultants and client-consultant relationships
  const fetchClientConsultants = useCallback(async () => {
    try {
      // Get all consultants
      const { data: consultantsData, error: consultantsError } = await supabase
        .from('consultants')
        .select('*')
        .order('name');

      if (consultantsError) throw consultantsError;

      const consultantsMap = new Map<string, Consultant>();
      (consultantsData || []).forEach(c => {
        consultantsMap.set(c.id, {
          id: c.id,
          name: c.name,
          profession: c.profession,
          company: c.company,
          phone: c.phone,
          email: c.email,
        });
      });

      // Set all consultants for dropdown
      setAllConsultants((consultantsData || []).map(c => ({
        id: c.id,
        name: c.name,
        profession: c.profession,
        company: c.company,
      })));

      // Get all client-consultant relationships
      const { data: relationships, error: relError } = await supabase
        .from('client_consultants')
        .select('*')
        .eq('status', 'active');

      if (relError) throw relError;

      // Build client consultants map
      const clientMap = new Map<string, ClientConsultantInfo>();
      
      // Group relationships by client
      const relsByClient = new Map<string, typeof relationships>();
      (relationships || []).forEach(rel => {
        const list = relsByClient.get(rel.client_id) || [];
        list.push(rel);
        relsByClient.set(rel.client_id, list);
      });

      // Build info for each client
      relsByClient.forEach((rels, clientId) => {
        const clientConsultantsList: Consultant[] = [];
        const consultantIds: string[] = [];
        const consultantNames: string[] = [];

        rels.forEach(rel => {
          const consultant = consultantsMap.get(rel.consultant_id);
          if (consultant) {
            clientConsultantsList.push(consultant);
            consultantIds.push(consultant.id);
            consultantNames.push(consultant.name);
          }
        });

        // Primary consultant is the first one (or could be based on role)
        const primary = clientConsultantsList[0] || null;

        clientMap.set(clientId, {
          client_id: clientId,
          consultant_ids: consultantIds,
          consultant_names: consultantNames,
          consultants: clientConsultantsList,
          primary_consultant_id: primary?.id || null,
          primary_consultant_name: primary?.name || null,
        });
      });

      setClientConsultants(clientMap);

    } catch (error) {
      console.error('Error fetching client consultants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign consultant to client (bi-directional sync)
  const assignConsultantToClient = useCallback(async (clientId: string, consultantId: string, role?: string) => {
    try {
      const { error } = await supabase
        .from('client_consultants')
        .upsert({
          client_id: clientId,
          consultant_id: consultantId,
          role: role || null,
          status: 'active',
        }, {
          onConflict: 'client_id,consultant_id'
        });

      if (error) throw error;

      // Refresh data
      await fetchClientConsultants();
      return true;
    } catch (error) {
      console.error('Error assigning consultant:', error);
      return false;
    }
  }, [fetchClientConsultants]);

  // Remove consultant from client
  const removeConsultantFromClient = useCallback(async (clientId: string, consultantId: string) => {
    try {
      const { error } = await supabase
        .from('client_consultants')
        .delete()
        .eq('client_id', clientId)
        .eq('consultant_id', consultantId);

      if (error) throw error;

      // Refresh data
      await fetchClientConsultants();
      return true;
    } catch (error) {
      console.error('Error removing consultant:', error);
      return false;
    }
  }, [fetchClientConsultants]);

  // Update client's consultants (replace all)
  const updateClientConsultants = useCallback(async (clientId: string, consultantIds: string[]) => {
    try {
      // First remove all existing relationships
      await supabase
        .from('client_consultants')
        .delete()
        .eq('client_id', clientId);

      // Then add new ones
      if (consultantIds.length > 0) {
        const inserts = consultantIds.map(consultantId => ({
          client_id: clientId,
          consultant_id: consultantId,
          status: 'active',
        }));

        const { error } = await supabase
          .from('client_consultants')
          .insert(inserts);

        if (error) throw error;
      }

      // Refresh data
      await fetchClientConsultants();
      return true;
    } catch (error) {
      console.error('Error updating client consultants:', error);
      return false;
    }
  }, [fetchClientConsultants]);

  // Set single consultant for client (replaces all existing)
  const setClientConsultant = useCallback(async (clientId: string, consultantName: string) => {
    try {
      // Find consultant by name
      const consultant = allConsultants.find(c => c.name === consultantName);
      
      if (!consultant) {
        console.warn('Consultant not found:', consultantName);
        return false;
      }

      return await updateClientConsultants(clientId, [consultant.id]);
    } catch (error) {
      console.error('Error setting client consultant:', error);
      return false;
    }
  }, [allConsultants, updateClientConsultants]);

  // Update multiple clients' consultants at once
  const updateMultipleClientsConsultant = useCallback(async (clientIds: string[], consultantName: string) => {
    let successCount = 0;
    let failCount = 0;

    for (const clientId of clientIds) {
      const success = await setClientConsultant(clientId, consultantName);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Refresh data once after all updates
    await fetchClientConsultants();

    return { successCount, failCount };
  }, [setClientConsultant, fetchClientConsultants]);

  // Initial fetch
  useEffect(() => {
    fetchClientConsultants();
  }, [fetchClientConsultants]);

  // Subscribe to realtime changes
  useEffect(() => {
    const consultantsChannel = supabase
      .channel('client_consultants_table_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_consultants' }, () => {
        fetchClientConsultants();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultants' }, () => {
        fetchClientConsultants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(consultantsChannel);
    };
  }, [fetchClientConsultants]);

  const getClientConsultantsInfo = useCallback((clientId: string) => clientConsultants.get(clientId) || null, [clientConsultants]);

  return {
    clientConsultants,
    allConsultants,
    loading,
    fetchClientConsultants,
    assignConsultantToClient,
    removeConsultantFromClient,
    updateClientConsultants,
    setClientConsultant,
    updateMultipleClientsConsultant,
    getClientConsultantsInfo,
  };
}
