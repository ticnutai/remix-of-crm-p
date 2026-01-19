import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string | null;
  stage: string | null;
}

export function useClients() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, company, status, stage')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  return {
    clients: data || [],
    loading: isLoading,
    error,
  };
}
