import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  name: string;
  client_id: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
}

export function useProjects() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_id, status, start_date, end_date')
        .order('name');
      
      if (error) throw error;
      return data as Project[];
    },
  });

  return {
    projects: data || [],
    loading: isLoading,
    error,
  };
}
