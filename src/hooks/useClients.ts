import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  status: string | null;
  stage: string | null;
}

const CLIENTS_QUERY_KEY = ['clients-list'] as const;

export function useClients() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, company, address, status, stage')
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching clients:', error);
        throw error;
      }
      return data as Client[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Invalidate cache function
  const invalidateClients = () => {
    queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
  };

  return {
    clients: data || [],
    loading: isLoading,
    error,
    refetch,
    invalidateClients,
  };
}
