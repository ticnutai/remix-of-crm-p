// Hook for syncing DataTable with Supabase database
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface SyncedProject {
  id: string;
  name: string;
  client: string;
  client_id: string | null;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget: number;
  spent: number;
  progress: number;
  startDate: string;
  endDate: string | null;
  team: string[];
  category: string;
  rating: number;
  description?: string;
  assigned_to?: string | null;
}

export interface SyncedClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  status: 'active' | 'inactive' | 'pending';
  notes: string;
  created_at: string;
  custom_data?: Record<string, any>;
}

// Map DB status to demo status
const mapDbStatusToDemo = (status: string): SyncedProject['status'] => {
  const mapping: Record<string, SyncedProject['status']> = {
    'planning': 'active',
    'in_progress': 'active',
    'on_hold': 'on-hold',
    'completed': 'completed',
    'cancelled': 'cancelled',
  };
  return mapping[status] || 'active';
};

// Map demo status to DB status
const mapDemoStatusToDb = (status: string): string => {
  const mapping: Record<string, string> = {
    'active': 'in_progress',
    'completed': 'completed',
    'on-hold': 'on_hold',
    'cancelled': 'cancelled',
  };
  return mapping[status] || 'planning';
};

// Map DB priority to demo priority
const mapDbPriorityToDemo = (priority: string): SyncedProject['priority'] => {
  const mapping: Record<string, SyncedProject['priority']> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'urgent': 'critical',
  };
  return mapping[priority] || 'medium';
};

// Map demo priority to DB priority
const mapDemoPriorityToDb = (priority: string): string => {
  const mapping: Record<string, string> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'urgent',
  };
  return mapping[priority] || 'medium';
};

export function useDataTableSync() {
  const { user, isManager } = useAuth();
  
  // Try to load from localStorage for instant display
  const getInitialClients = (): SyncedClient[] => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem('cachedClients');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  };
  
  const getInitialProjects = (): SyncedProject[] => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem('cachedProjects');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  };
  
  const [projects, setProjects] = useState<SyncedProject[]>(getInitialProjects());
  const [clients, setClients] = useState<SyncedClient[]>(getInitialClients());
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch all data from Supabase - Load all records
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch all records - removed limit for complete data
      const [projectsRes, clientsRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, client_id, status, priority, budget, start_date, end_date, description, assigned_to')
          .order('created_at', { ascending: false })
          .limit(5000), // Load all projects
        supabase
          .from('clients')
          .select('id, name, email, phone, company, address, status, notes, created_at, custom_data')
          .order('name')
          .limit(5000), // Load all clients
      ]);
      
      console.log('📊 [useDataTableSync] Loaded:', {
        clients: clientsRes.data?.length || 0,
        projects: projectsRes.data?.length || 0,
      });

      if (clientsRes.data) {
        // Transform clients to ensure no null values for string fields
        const clientsList: SyncedClient[] = clientsRes.data.map((c: any) => ({
          id: c.id,
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
          company: c.company || '',
          address: c.address || '',
          status: c.status || 'active',
          notes: c.notes || '',
          created_at: c.created_at,
          custom_data: c.custom_data || {},
        }));
        setClients(clientsList);
        
        // Cache to localStorage for instant display on next load (async)
        requestIdleCallback(() => {
          try {
            localStorage.setItem('cachedClients', JSON.stringify(clientsList));
          } catch (e) {
            console.error('Failed to cache clients:', e);
          }
        });
        
        // Create a map of client_id -> client_name
        const map: Record<string, string> = {};
        clientsList.forEach(c => {
          map[c.id] = c.name;
        });
        setClientsMap(map);
      }

      if (projectsRes.data) {
        // Transform DB projects to demo format
        const transformedProjects: SyncedProject[] = projectsRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          client: clientsRes.data?.find((c: any) => c.id === p.client_id)?.name || 'ללא לקוח',
          client_id: p.client_id,
          status: mapDbStatusToDemo(p.status),
          priority: mapDbPriorityToDemo(p.priority),
          budget: p.budget || 0,
          spent: 0, // Not in DB, calculated from time entries
          progress: 0, // Could be calculated
          startDate: p.start_date || new Date().toISOString(),
          endDate: p.end_date,
          team: [],
          category: 'פיתוח',
          rating: 3,
          description: p.description,
          assigned_to: p.assigned_to,
        }));
        setProjects(transformedProjects);
        
        // Cache to localStorage for instant display on next load (async)
        requestIdleCallback(() => {
          try {
            localStorage.setItem('cachedProjects', JSON.stringify(transformedProjects));
          } catch (e) {
            console.error('Failed to cache projects:', e);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    }
    setIsLoading(false);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const projectsChannel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const clientsChannel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(clientsChannel);
    };
  }, [user, fetchData]);

  // Update a project
  const updateProject = useCallback(async (projectId: string, columnId: string, newValue: any) => {
    if (!isManager) {
      toast({ title: 'שגיאה', description: 'אין לך הרשאה לעדכן פרויקטים', variant: 'destructive' });
      return false;
    }

    setIsSyncing(true);
    try {
      const payload: Record<string, any> = {};

      // Map column IDs to DB columns
      switch (columnId) {
        case 'name':
          payload.name = newValue;
          break;
        case 'client':
          // Find client by name and update client_id
          const client = clients.find(c => c.name === newValue);
          payload.client_id = client?.id || null;
          break;
        case 'status':
          payload.status = mapDemoStatusToDb(newValue);
          break;
        case 'priority':
          payload.priority = mapDemoPriorityToDb(newValue);
          break;
        case 'budget':
          payload.budget = parseFloat(newValue) || 0;
          break;
        case 'startDate':
          payload.start_date = newValue;
          break;
        case 'endDate':
          payload.end_date = newValue;
          break;
        case 'description':
          payload.description = newValue;
          break;
        default:
          // For other columns, just update locally
          setProjects(prev => prev.map(p => 
            p.id === projectId ? { ...p, [columnId]: newValue } : p
          ));
          setIsSyncing(false);
          return true;
      }

      const { error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', projectId);

      if (error) throw error;

      // Update local state
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, [columnId]: newValue } : p
      ));

      toast({ title: 'עודכן', description: 'הנתונים נשמרו במסד הנתונים' });
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את הפרויקט', variant: 'destructive' });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [clients, isManager]);

  // Add a new project
  const addProject = useCallback(async (name: string, clientName: string) => {
    if (!isManager || !user) {
      toast({ title: 'שגיאה', description: 'אין לך הרשאה להוסיף פרויקטים', variant: 'destructive' });
      return null;
    }

    setIsSyncing(true);
    try {
      // Find or create client
      let clientId: string | null = null;
      if (clientName) {
        const existingClient = clients.find(c => c.name === clientName);
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({ name: clientName, status: 'active', created_by: user.id })
            .select()
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      // Create project
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name,
          client_id: clientId,
          status: 'planning',
          priority: 'medium',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const syncedProject: SyncedProject = {
        id: newProject.id,
        name: newProject.name,
        client: clientName || 'ללא לקוח',
        client_id: clientId,
        status: 'active',
        priority: 'medium',
        budget: 0,
        spent: 0,
        progress: 0,
        startDate: new Date().toISOString(),
        endDate: null,
        team: [],
        category: 'פיתוח',
        rating: 3,
      };

      setProjects(prev => [syncedProject, ...prev]);
      toast({ title: 'נוסף', description: 'הפרויקט נוסף למסד הנתונים' });
      return syncedProject;
    } catch (error) {
      console.error('Error adding project:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן להוסיף את הפרויקט', variant: 'destructive' });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [clients, isManager, user]);

  // Delete a project
  const deleteProject = useCallback(async (projectId: string) => {
    if (!isManager) {
      toast({ title: 'שגיאה', description: 'אין לך הרשאה למחוק פרויקטים', variant: 'destructive' });
      return false;
    }

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast({ title: 'נמחק', description: 'הפרויקט נמחק ממסד הנתונים' });
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן למחוק את הפרויקט', variant: 'destructive' });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isManager]);

  // Update a client
  const updateClient = useCallback(async (clientId: string, columnId: string, newValue: any) => {
    if (!isManager) {
      toast({ title: 'שגיאה', description: 'אין לך הרשאה לעדכן לקוחות', variant: 'destructive' });
      return false;
    }

    setIsSyncing(true);
    try {
      const payload: Record<string, any> = { [columnId]: newValue };

      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.map(c => 
        c.id === clientId ? { ...c, [columnId]: newValue } : c
      ));

      // Update projects that reference this client
      if (columnId === 'name') {
        setProjects(prev => prev.map(p => 
          p.client_id === clientId ? { ...p, client: newValue } : p
        ));
      }

      toast({ title: 'עודכן', description: 'הלקוח נשמר במסד הנתונים' });
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את הלקוח', variant: 'destructive' });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isManager]);

  // Add a new client
  const addClient = useCallback(async (name: string) => {
    if (!isManager || !user) {
      toast({ title: 'שגיאה', description: 'אין לך הרשאה להוסיף לקוחות', variant: 'destructive' });
      return null;
    }

    setIsSyncing(true);
    try {
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({ name, status: 'active', created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      const syncedClient: SyncedClient = {
        id: newClient.id,
        name: newClient.name,
        email: '',
        phone: '',
        company: '',
        address: '',
        status: 'active',
        notes: '',
        created_at: newClient.created_at,
      };

      setClients(prev => [syncedClient, ...prev]);
      setClientsMap(prev => ({ ...prev, [syncedClient.id]: syncedClient.name }));
      toast({ title: 'נוסף', description: 'הלקוח נוסף למסד הנתונים' });
      return syncedClient;
    } catch (error) {
      console.error('Error adding client:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן להוסיף את הלקוח', variant: 'destructive' });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isManager, user]);

  // Delete a client
  const deleteClient = useCallback(async (clientId: string) => {
    if (!isManager) {
      toast({ title: 'שגיאה', description: 'אין לך הרשאה למחוק לקוחות', variant: 'destructive' });
      return false;
    }

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== clientId));
      
      // Update projects that had this client
      setProjects(prev => prev.map(p => 
        p.client_id === clientId ? { ...p, client: 'ללא לקוח', client_id: null } : p
      ));

      toast({ title: 'נמחק', description: 'הלקוח נמחק ממסד הנתונים' });
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן למחוק את הלקוח', variant: 'destructive' });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isManager]);

  // Get available clients for select
  const clientOptions = clients.map(c => ({ value: c.name, label: c.name }));

  return {
    projects,
    clients,
    clientsMap,
    clientOptions,
    isLoading,
    isSyncing,
    fetchData,
    updateProject,
    addProject,
    deleteProject,
    updateClient,
    addClient,
    deleteClient,
  };
}
