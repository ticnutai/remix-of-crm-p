// Optimized Meetings Hook with React Query - tenarch CRM Pro
// Features: Optimistic updates, caching, calendar sync
import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { toast } from "sonner";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { createOfflineMutation } from "@/lib/offlineQueryUtils";

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
  is_private?: boolean;
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
  is_private?: boolean;
}

// Query keys
const MEETINGS_KEY = ["meetings"] as const;
const MEETINGS_TODAY_KEY = ["meetings", "today"] as const;
const MEETINGS_WEEK_KEY = ["meetings", "week"] as const;

// Fetch functions — no client-side user filter; RLS handles visibility
// (admins see all non-private rows; others see own rows only)
async function fetchMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      *,
      client:clients(name),
      project:projects(name)
    `,
    )
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Meetings fetch error:", error);
    throw error;
  }
  return data as Meeting[];
}

async function fetchTodayMeetings(): Promise<Meeting[]> {
  const today = new Date();

  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      *,
      client:clients(name),
      project:projects(name)
    `,
    )
    .gte("start_time", startOfDay(today).toISOString())
    .lte("start_time", endOfDay(today).toISOString())
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Today meetings fetch error:", error);
    throw error;
  }
  return data as Meeting[];
}

async function fetchWeekMeetings(): Promise<Meeting[]> {
  const today = new Date();

  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      *,
      client:clients(name),
      project:projects(name)
    `,
    )
    .gte("start_time", startOfWeek(today, { weekStartsOn: 0 }).toISOString())
    .lte("start_time", endOfWeek(today, { weekStartsOn: 0 }).toISOString())
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Week meetings fetch error:", error);
    throw error;
  }
  return data as Meeting[];
}

// Main Hook
export function useMeetingsOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { pushAction } = useUndoRedo();

  // Main meetings query
  const {
    data: meetings = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...MEETINGS_KEY, user?.id],
    queryFn: () => fetchMeetings(),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Create mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: async (meeting: MeetingInsert) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("meetings")
        .insert({ ...meeting, created_by: user.id })
        .select(`*, client:clients(name), project:projects(name)`)
        .single();

      if (error) throw error;
      return data as Meeting;
    },
    onMutate: async (newMeeting) => {
      await queryClient.cancelQueries({ queryKey: MEETINGS_KEY });
      const previousMeetings =
        queryClient.getQueryData<Meeting[]>(MEETINGS_KEY);

      const optimisticMeeting: Meeting = {
        id: `temp-${Date.now()}`,
        ...newMeeting,
        description: newMeeting.description ?? null,
        location: newMeeting.location ?? null,
        meeting_type: newMeeting.meeting_type ?? "in_person",
        status: newMeeting.status ?? "scheduled",
        client_id: newMeeting.client_id ?? null,
        project_id: newMeeting.project_id ?? null,
        created_by: user?.id ?? "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Meeting[]>(MEETINGS_KEY, (old = []) => {
        const updated = [...old, optimisticMeeting];
        return updated.sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        );
      });

      return { previousMeetings };
    },
    onError: (err, _newMeeting, context) => {
      if (context?.previousMeetings) {
        queryClient.setQueryData(MEETINGS_KEY, context.previousMeetings);
      }
      console.error("❌ Meeting creation error:", err);
      toast.error(
        `שגיאה ביצירת הפגישה: ${err instanceof Error ? err.message : "שגיאה לא ידועה"}`,
      );
    },
    onSuccess: (data) => {
      toast.success(`פגישה נוצרה: ${data.title}`);
      pushAction({
        type: 'create_meeting',
        description: `יצירת פגישה: ${data.title}`,
        undo: async () => {
          await supabase.from('meetings').delete().eq('id', data.id);
          queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
        },
        redo: async () => {
          const { client, project, ...meetingData } = data as Meeting & { client?: unknown; project?: unknown };
          await supabase.from('meetings').insert(meetingData);
          queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
        },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_TODAY_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_WEEK_KEY });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: createOfflineMutation<any>(
      "meetings",
      "update",
      async ({
        id,
        updates,
      }: {
        id: string;
        updates: Partial<MeetingInsert>;
      }) => {
        const { error } = await supabase
          .from("meetings")
          .update(updates)
          .eq("id", id);

        if (error) throw error;
        return { id, updates };
      },
    ),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: MEETINGS_KEY });
      const previousMeetings =
        queryClient.getQueryData<Meeting[]>(MEETINGS_KEY);
      const previousMeeting = previousMeetings?.find(m => m.id === id);

      queryClient.setQueryData<Meeting[]>(MEETINGS_KEY, (old = []) =>
        old
          .map((meeting) =>
            meeting.id === id
              ? { ...meeting, ...updates, updated_at: new Date().toISOString() }
              : meeting,
          )
          .sort(
            (a, b) =>
              new Date(a.start_time).getTime() -
              new Date(b.start_time).getTime(),
          ),
      );

      return { previousMeetings, previousMeeting };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMeetings) {
        queryClient.setQueryData(MEETINGS_KEY, context.previousMeetings);
      }
      toast.error("שגיאה בעדכון הפגישה");
    },
    onSuccess: (_data, { id, updates }, context) => {
      toast.success("הפגישה עודכנה");
      if (context?.previousMeeting) {
        const prev = context.previousMeeting;
        const revert = { title: prev.title, description: prev.description, start_time: prev.start_time, end_time: prev.end_time, location: prev.location, meeting_type: prev.meeting_type, status: prev.status, client_id: prev.client_id, project_id: prev.project_id, is_private: prev.is_private };
        pushAction({
          type: 'update_meeting',
          description: `עדכון פגישה: ${prev.title}`,
          undo: async () => {
            await supabase.from('meetings').update(revert).eq('id', id);
            queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
          },
          redo: async () => {
            await supabase.from('meetings').update(updates).eq('id', id);
            queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
          },
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_TODAY_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_WEEK_KEY });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: createOfflineMutation<any>(
      "meetings",
      "delete",
      async (id: any) => {
        const { error } = await supabase
          .from("meetings")
          .delete()
          .eq("id", typeof id === "string" ? id : id.id);

        if (error) throw error;
        return id;
      },
    ),
    onMutate: async (id) => {
      const realId = typeof id === 'string' ? id : (id as { id: string }).id;
      await queryClient.cancelQueries({ queryKey: MEETINGS_KEY });
      const previousMeetings =
        queryClient.getQueryData<Meeting[]>(MEETINGS_KEY);
      const deletedMeeting = previousMeetings?.find(m => m.id === realId);

      queryClient.setQueryData<Meeting[]>(MEETINGS_KEY, (old = []) =>
        old.filter((meeting) => meeting.id !== realId),
      );

      return { previousMeetings, deletedMeeting };
    },
    onError: (_err, _id, context) => {
      if (context?.previousMeetings) {
        queryClient.setQueryData(MEETINGS_KEY, context.previousMeetings);
      }
      toast.error("שגיאה במחיקת הפגישה");
    },
    onSuccess: (_data, _id, context) => {
      toast.success("הפגישה נמחקה");
      if (context?.deletedMeeting) {
        const meeting = context.deletedMeeting;
        const { client, project, ...meetingData } = meeting as Meeting & { client?: unknown; project?: unknown };
        pushAction({
          type: 'delete_meeting',
          description: `מחיקת פגישה: ${meeting.title}`,
          undo: async () => {
            await supabase.from('meetings').insert(meetingData);
            queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
          },
          redo: async () => {
            await supabase.from('meetings').delete().eq('id', meeting.id);
            queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
          },
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_TODAY_KEY });
      queryClient.invalidateQueries({ queryKey: MEETINGS_WEEK_KEY });
    },
  });

  // Memoized filtered meetings
  const upcomingMeetings = useMemo(
    () =>
      meetings.filter(
        (m) => new Date(m.start_time) > new Date() && m.status !== "cancelled",
      ),
    [meetings],
  );

  const todayMeetings = useMemo(() => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    return meetings.filter((m) => {
      const meetingDate = new Date(m.start_time);
      return (
        meetingDate >= start && meetingDate <= end && m.status !== "cancelled"
      );
    });
  }, [meetings]);

  // Callbacks
  const createMeeting = useCallback(
    async (meeting: MeetingInsert): Promise<Meeting> => {
      const result = await createMutation.mutateAsync(meeting);
      return result;
    },
    [createMutation],
  );

  const updateMeeting = useCallback(
    (id: string, updates: Partial<MeetingInsert>) =>
      updateMutation.mutateAsync({ id, updates }),
    [updateMutation],
  );

  const deleteMeeting = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  const cancelMeeting = useCallback(
    (id: string) =>
      updateMutation.mutate({ id, updates: { status: "cancelled" } }),
    [updateMutation],
  );

  // Prefetch functions
  const prefetchTodayMeetings = useCallback(() => {
    if (!user) return;
    queryClient.prefetchQuery({
      queryKey: [...MEETINGS_TODAY_KEY, user.id],
      queryFn: () => fetchTodayMeetings(),
    });
  }, [queryClient, user]);

  const prefetchWeekMeetings = useCallback(() => {
    if (!user) return;
    queryClient.prefetchQuery({
      queryKey: [...MEETINGS_WEEK_KEY, user.id],
      queryFn: () => fetchWeekMeetings(),
    });
  }, [queryClient, user]);

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
    queryKey: [...MEETINGS_TODAY_KEY, user?.id],
    queryFn: () => fetchTodayMeetings(),
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });
}

export function useWeekMeetings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...MEETINGS_WEEK_KEY, user?.id],
    queryFn: () => fetchWeekMeetings(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// Alias for cleaner imports - this IS the main useMeetings hook now
export const useMeetings = useMeetingsOptimized;

export default useMeetingsOptimized;
