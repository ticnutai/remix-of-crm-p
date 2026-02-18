// Optimized Meetings Hook with React Query - tenarch CRM Pro
// Features: Optimistic updates, caching, calendar sync
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

// Types
export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_type: string;
  status: string;
  client_id: string | null;
  project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: { name: string } | null;
  project?: { name: string } | null;
}

export interface MeetingInsert {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  meeting_type?: string;
  status?: string;
  client_id?: string | null;
  project_id?: string | null;
}

// Query keys
const MEETINGS_KEY = ['meetings'] as const;
const MEETINGS_TODAY_KEY = ['meetings', 'today'] as const;
const MEETINGS_WEEK_KEY = ['meetings', 'week'] as const;

// Fetch functions
async function fetchMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      client:clients(name),
      project:projects(name)
    `)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Meetings fetch error:', error);
    return [];
  }
  return data as Meeting[];
}

async function fetchTodayMeetings(): Promise<Meeting[]> {
  const today = new Date();
  
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      client:clients(name),
      project:projects(name)
    `)
    .gte('start_time', startOfDay(today).toISOString())
    .lte('start_time', endOfDay(today).toISOString())
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Today meetings fetch error:', error);
    return [];
  }
  return data as Meeting[];
}

async function fetchWeekMeetings(): Promise<Meeting[]> {
  const today = new Date();
  
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      client:clients(name),
      project:projects(name)
    `)
    .gte('start_time', startOfWeek(today, { weekStartsOn: 0 }).toISOString())
    .lte('start_time', endOfWeek(today, { weekStartsOn: 0 }).toISOString())
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Week meetings fetch error:', error);
    return [];
  }
  return data as Meeting[];
}

// Main Hook
export function useMeetingsOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Main meetings query
  const { 
    data: meetings = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: MEETINGS_KEY,
    queryFn: fetchMeetings,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Create mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: async (meeting: MeetingInsert) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('meetings')
        .insert({ ...meeting, created_by: user.id })
        .select(`*, client:clients(name), project:projects(name)`)
        .single();

      if (error) throw error;
      return data as Meeting;
    },
    onMutate: async (newMeeting) => {
      await queryClient.cancelQueries({ queryKey: MEETINGS_KEY });
      const previousMeetings = queryClient.getQueryData<Meeting[]>(MEETINGS_KEY);

      const optimisticMeeting: Meeting = {
        id: `temp-${Date.now()}`,
        ...newMeeting,
        description: newMeeting.description ?? null,
        location: newMeeting.location ?? null,
        meeting_type: newMeeting.meeting_type ?? 'in_person',
        status: newMeeting.status ?? 'scheduled',
        client_id: newMeeting.client_id ?? null,
        project_id: newMeeting.project_id ?? null,
        created_by: user?.id ?? '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Meeting[]>(MEETINGS_KEY, (old = []) => {
        const updated = [...old, optimisticMeeting];
        return updated.sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
      });

      return { previousMeetings };
    },
    onError: (err, _newMeeting, context) => {
      if (context?.previousMeetings) {
        queryClient.setQueryData(MEETINGS_KEY, context.previousMeetings);
      }
      console.error('❌ Meeting creation error:', err);
      toast.error(`שגיאה ביצירת הפגישה: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
    },
    onSuccess: (data) => {
      toast.success(`פגישה נוצרה: ${data.title}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_TODAY_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_WEEK_KEY });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MeetingInsert> }) => {
      const { error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { id, updates };
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: MEETINGS_KEY });
      const previousMeetings = queryClient.getQueryData<Meeting[]>(MEETINGS_KEY);

      queryClient.setQueryData<Meeting[]>(MEETINGS_KEY, (old = []) =>
        old.map((meeting) =>
          meeting.id === id
            ? { ...meeting, ...updates, updated_at: new Date().toISOString() }
            : meeting
        ).sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
      );

      return { previousMeetings };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMeetings) {
        queryClient.setQueryData(MEETINGS_KEY, context.previousMeetings);
      }
      toast.error('שגיאה בעדכון הפגישה');
    },
    onSuccess: () => {
      toast.success('הפגישה עודכנה');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_TODAY_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_WEEK_KEY });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: MEETINGS_KEY });
      const previousMeetings = queryClient.getQueryData<Meeting[]>(MEETINGS_KEY);

      queryClient.setQueryData<Meeting[]>(MEETINGS_KEY, (old = []) =>
        old.filter((meeting) => meeting.id !== id)
      );

      return { previousMeetings };
    },
    onError: (_err, _id, context) => {
      if (context?.previousMeetings) {
        queryClient.setQueryData(MEETINGS_KEY, context.previousMeetings);
      }
      toast.error('שגיאה במחיקת הפגישה');
    },
    onSuccess: () => {
      toast.success('הפגישה נמחקה');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_TODAY_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_WEEK_KEY });
    },
  });

  // Memoized filtered meetings
  const upcomingMeetings = useMemo(
    () => meetings.filter(m => 
      new Date(m.start_time) > new Date() && m.status !== 'cancelled'
    ),
    [meetings]
  );

  const todayMeetings = useMemo(
    () => {
      const today = new Date();
      const start = startOfDay(today);
      const end = endOfDay(today);
      return meetings.filter(m => {
        const meetingDate = new Date(m.start_time);
        return meetingDate >= start && meetingDate <= end && m.status !== 'cancelled';
      });
    },
    [meetings]
  );

  // Callbacks
  const createMeeting = useCallback(
    (meeting: MeetingInsert) => createMutation.mutateAsync(meeting),
    [createMutation]
  );

  const updateMeeting = useCallback(
    (id: string, updates: Partial<MeetingInsert>) => 
      updateMutation.mutateAsync({ id, updates }),
    [updateMutation]
  );

  const deleteMeeting = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  );

  const cancelMeeting = useCallback(
    (id: string) => updateMutation.mutate({ id, updates: { status: 'cancelled' } }),
    [updateMutation]
  );

  // Prefetch functions
  const prefetchTodayMeetings = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: MEETINGS_TODAY_KEY,
      queryFn: fetchTodayMeetings,
    });
  }, [queryClient]);

  const prefetchWeekMeetings = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: MEETINGS_WEEK_KEY,
      queryFn: fetchWeekMeetings,
    });
  }, [queryClient]);

  return {
    // Data
    meetings,
    upcomingMeetings,
    todayMeetings,
    
    // States
    loading: isLoading,
    error,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Actions
    createMeeting,
    updateMeeting,
    deleteMeeting,
    cancelMeeting,
    refetch,
    fetchMeetings: refetch, // Backward compatibility alias
    
    // Prefetching
    prefetchTodayMeetings,
    prefetchWeekMeetings,
  };
}

// Specialized hooks
export function useTodayMeetings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: MEETINGS_TODAY_KEY,
    queryFn: fetchTodayMeetings,
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });
}

export function useWeekMeetings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: MEETINGS_WEEK_KEY,
    queryFn: fetchWeekMeetings,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// Alias for cleaner imports - this IS the main useMeetings hook now
export const useMeetings = useMeetingsOptimized;

export default useMeetingsOptimized;
