// Hook to fetch clients grouped by their assigned consultants
// Checks both client_consultants AND task_consultants tables
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ConsultantClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string | null;
}

export interface Consultant {
  id: string;
  name: string;
  profession: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
}

export interface ConsultantGroup {
  consultant: Consultant;
  clients: ConsultantClient[];
}

export function useClientsByConsultant() {
  const [consultantGroups, setConsultantGroups] = useState<ConsultantGroup[]>([]);
  const [allConsultants, setAllConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all consultants
      const { data: consultantsData, error: consultantsError } = await supabase
        .from('consultants')
        .select('*')
        .order('name');

      if (consultantsError) throw consultantsError;

      const consultants: Consultant[] = (consultantsData || []).map(c => ({
        id: c.id,
        name: c.name,
        profession: c.profession || 'יועץ',
        specialty: c.specialty,
        phone: c.phone,
        email: c.email,
        company: c.company,
      }));

      setAllConsultants(consultants);

      // Group clients by consultant
      const groupedByConsultant = new Map<string, ConsultantClient[]>();

      // 1. First check client_consultants table
      const { data: clientConsultantsData, error: ccError } = await supabase
        .from('client_consultants')
        .select(`
          consultant_id,
          clients (
            id,
            name,
            email,
            phone,
            company,
            status
          )
        `);

      if (!ccError && clientConsultantsData) {
        clientConsultantsData.forEach((cc) => {
          if (!cc.clients) return;
          
          const client = cc.clients as any;
          const consultantId = cc.consultant_id;

          const clientData: ConsultantClient = {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
            status: client.status,
          };

          const existing = groupedByConsultant.get(consultantId) || [];
          if (!existing.some(c => c.id === client.id)) {
            existing.push(clientData);
          }
          groupedByConsultant.set(consultantId, existing);
        });
      }

      // 2. Also check task_consultants table (consultants assigned to tasks)
      // Get tasks with consultants, then get the client_id from client_stage_tasks
      const { data: taskConsultantsData, error: tcError } = await supabase
        .from('task_consultants')
        .select(`
          consultant_id,
          task_id
        `);

      if (!tcError && taskConsultantsData && taskConsultantsData.length > 0) {
        // Get unique task IDs
        const taskIds = [...new Set(taskConsultantsData.map(tc => tc.task_id))];
        
        // Get client_stage_tasks to find which clients these tasks belong to
        const { data: tasksData } = await supabase
          .from('client_stage_tasks')
          .select('id, client_id')
          .in('id', taskIds);

        if (tasksData) {
          // Create a map of task_id -> client_id
          const taskToClient = new Map<string, string>();
          tasksData.forEach(t => taskToClient.set(t.id, t.client_id));

          // Get all unique client IDs
          const clientIds = [...new Set(tasksData.map(t => t.client_id))];
          
          // Fetch client details
          const { data: clientsData } = await supabase
            .from('clients')
            .select('id, name, email, phone, company, status')
            .in('id', clientIds);

          if (clientsData) {
            const clientsMap = new Map(clientsData.map(c => [c.id, c]));

            // Add to consultant groups
            taskConsultantsData.forEach(tc => {
              const clientId = taskToClient.get(tc.task_id);
              if (!clientId) return;
              
              const client = clientsMap.get(clientId);
              if (!client) return;

              const clientData: ConsultantClient = {
                id: client.id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                company: client.company,
                status: client.status,
              };

              const existing = groupedByConsultant.get(tc.consultant_id) || [];
              if (!existing.some(c => c.id === client.id)) {
                existing.push(clientData);
              }
              groupedByConsultant.set(tc.consultant_id, existing);
            });
          }
        }
      }

      // Create consultant groups (only consultants with clients)
      const groups: ConsultantGroup[] = [];
      
      consultants.forEach(consultant => {
        const clients = groupedByConsultant.get(consultant.id);
        if (clients && clients.length > 0) {
          groups.push({
            consultant,
            clients: clients.sort((a, b) => a.name.localeCompare(b.name, 'he')),
          });
        }
      });

      // Sort groups by number of clients (most first)
      groups.sort((a, b) => b.clients.length - a.clients.length);

      setConsultantGroups(groups);
    } catch (error) {
      console.error('Error fetching clients by consultant:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את הלקוחות לפי יועצים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get clients for a specific consultant
  const getClientsByConsultant = useCallback((consultantId: string): ConsultantClient[] => {
    const group = consultantGroups.find(g => g.consultant.id === consultantId);
    return group?.clients || [];
  }, [consultantGroups]);

  // Get total number of clients with consultants
  const totalClientsWithConsultants = consultantGroups.reduce(
    (sum, g) => sum + g.clients.length, 
    0
  );

  return {
    consultantGroups,
    allConsultants,
    loading,
    getClientsByConsultant,
    totalClientsWithConsultants,
    refresh: fetchData,
  };
}
