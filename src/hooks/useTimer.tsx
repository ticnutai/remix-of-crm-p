// Smart Timer System - tenarch CRM Pro
import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_billable: boolean;
  hourly_rate: number | null;
  is_running: boolean;
  tags: string[] | null;
}

interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  elapsed: number; // in seconds
  currentEntry: TimeEntry | null;
  pausedAt: Date | null; // tracks when timer was paused so resume offset can be calculated
}

interface TimerContextType {
  timerState: TimerState;
  startTimer: (
    projectId?: string,
    clientId?: string,
    description?: string,
    tags?: string[],
  ) => Promise<void>;
  stopTimer: () => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  saveEntry: (notes?: string, options?: { is_billable?: boolean; hourly_rate?: number | null }) => Promise<void>;
  updateDescription: (description: string) => Promise<void>;
  updateTags: (tags: string[]) => Promise<void>;
  updateBillable: (is_billable: boolean) => Promise<void>;
  updateHourlyRate: (hourly_rate: number | null) => Promise<void>;
  todayEntries: TimeEntry[];
  todayTotal: number; // in minutes
  weekTotal: number; // in minutes
  isLoading: boolean;
  refreshEntries: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsed: 0,
    currentEntry: null,
    pausedAt: null,
  });
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate today total from entries
  const todayTotal = todayEntries.reduce((sum, entry) => {
    if (entry.duration_minutes) return sum + entry.duration_minutes;
    if (entry.is_running && entry.start_time) {
      const start = new Date(entry.start_time);
      const now = new Date();
      return sum + Math.floor((now.getTime() - start.getTime()) / 60000);
    }
    return sum;
  }, 0);

  // Fetch running entry on mount
  const fetchRunningEntry = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_running", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching running entry:", error);
      return;
    }

    if (data) {
      const startTime = new Date(data.start_time);
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);

      setTimerState({
        isRunning: true,
        startTime,
        elapsed,
        currentEntry: data as TimeEntry,
        pausedAt: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch today's entries
  const fetchTodayEntries = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_time", today.toISOString())
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error fetching today entries:", error);
      return;
    }

    setTodayEntries((data || []) as TimeEntry[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch week total
  const fetchWeekTotal = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("time_entries")
      .select("duration_minutes")
      .eq("user_id", user.id)
      .gte("start_time", startOfWeek.toISOString())
      .not("duration_minutes", "is", null);

    if (error) {
      console.error("Error fetching week total:", error);
      return;
    }

    const total = (data || []).reduce(
      (sum, entry) => sum + (entry.duration_minutes || 0),
      0,
    );
    setWeekTotal(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Refresh all entries
  const refreshEntries = useCallback(async () => {
    await Promise.all([fetchTodayEntries(), fetchWeekTotal()]);
  }, [fetchTodayEntries, fetchWeekTotal]);

  // Initialize
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        fetchRunningEntry(),
        fetchTodayEntries(),
        fetchWeekTotal(),
      ]).finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Subscribe to real-time changes in time_entries
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("timer-time-entries-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_entries",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedEntry = payload.old as TimeEntry;
            // Remove from todayEntries if it's there
            setTodayEntries((prev) =>
              prev.filter((e) => e.id !== deletedEntry.id),
            );
            // Refresh week total
            fetchWeekTotal();
          } else if (payload.eventType === "INSERT") {
            // Refresh both
            fetchTodayEntries();
            fetchWeekTotal();
          } else if (payload.eventType === "UPDATE") {
            const updatedEntry = payload.new as TimeEntry;
            // Update in todayEntries if it exists there
            setTodayEntries((prev) =>
              prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)),
            );
            fetchWeekTotal();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isRunning && timerState.startTime) {
      interval = setInterval(() => {
        setTimerState((prev) => ({
          ...prev,
          elapsed: Math.floor((Date.now() - prev.startTime!.getTime()) / 1000),
        }));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.startTime]);

  const startTimer = async (
    projectId?: string,
    clientId?: string,
    description?: string,
    tags?: string[],
  ) => {
    if (!user) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי להשתמש בטיימר",
        variant: "destructive",
      });
      return;
    }

    const startTime = new Date();

    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        client_id: clientId || null,
        description: description || null,
        start_time: startTime.toISOString(),
        is_running: true,
        is_billable: true,
        hourly_rate: profile?.hourly_rate || null,
        tags: tags || null,
      })
      .select()
      .single();

    if (error) {
      console.error("🔴 [useTimer] Error starting timer:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להפעיל את הטיימר",
        variant: "destructive",
      });
      return;
    }

    setTimerState({
      isRunning: true,
      startTime,
      elapsed: 0,
      currentEntry: data as TimeEntry,
      pausedAt: null,
    });

    toast({
      title: "הטיימר הופעל",
      description: "מעקב זמן התחיל",
    });

    await refreshEntries();
  };

  const stopTimer = async () => {
    if (!timerState.currentEntry) {
      return;
    }

    // Round down to nearest 30 seconds (half-minute)
    const roundedElapsed = Math.floor(timerState.elapsed / 30) * 30;
    const durationMinutes = roundedElapsed / 60; // e.g. 1.5 for 90 seconds

    // Adjust end_time so generated duration_minutes column is correct
    const startTime = timerState.currentEntry.start_time;
    const endTime = new Date(
      new Date(startTime).getTime() + roundedElapsed * 1000,
    );

    // Note: duration_minutes is a generated column - only update end_time and is_running
    const { data, error } = await supabase
      .from("time_entries")
      .update({
        end_time: endTime.toISOString(),
        is_running: false,
      })
      .eq("id", timerState.currentEntry.id)
      .select();

    if (error) {
      console.error("🔴 [useTimer] Error stopping timer:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעצור את הטיימר",
        variant: "destructive",
      });
      return;
    }

    setTimerState({
      isRunning: false,
      startTime: null,
      elapsed: 0,
      currentEntry: null,
      pausedAt: null,
    });

    toast({
      title: "הטיימר נעצר",
      description: `זמן שנרשם: ${formatDuration(durationMinutes)}`,
    });

    await refreshEntries();
  };

  const pauseTimer = () => {
    // Local pause - doesn't update DB. Records pausedAt so resume can skip the paused duration.
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      pausedAt: new Date(),
    }));
  };

  const resumeTimer = () => {
    if (timerState.currentEntry) {
      setTimerState((prev) => {
        // Shift startTime forward by the pause duration so elapsed stays at the value it was when paused
        if (prev.pausedAt && prev.startTime) {
          const pauseDuration = Date.now() - prev.pausedAt.getTime();
          const newStartTime = new Date(
            prev.startTime.getTime() + pauseDuration,
          );
          return {
            ...prev,
            isRunning: true,
            pausedAt: null,
            startTime: newStartTime,
          };
        }
        return { ...prev, isRunning: true, pausedAt: null };
      });
    }
  };

  const resetTimer = () => {
    // Reset without saving - delete the current entry if exists
    if (timerState.currentEntry) {
      supabase
        .from("time_entries")
        .delete()
        .eq("id", timerState.currentEntry.id)
        .then(() => {
          refreshEntries();
        });
    }

    setTimerState({
      isRunning: false,
      startTime: null,
      elapsed: 0,
      currentEntry: null,
      pausedAt: null,
    });

    toast({
      title: "הטיימר אופס",
      description: "הזמן לא נשמר",
    });
  };

  const saveEntry = async (notes?: string, options?: { is_billable?: boolean; hourly_rate?: number | null }) => {
    if (!timerState.currentEntry) {
      return;
    }

    // Round down to nearest 30 seconds (half-minute)
    const roundedElapsed = Math.floor(timerState.elapsed / 30) * 30;
    const durationMinutes = roundedElapsed / 60; // e.g. 1.5 for 90 seconds

    // Adjust end_time so generated duration_minutes column is correct
    const startTime = timerState.currentEntry.start_time;
    const endTime = new Date(
      new Date(startTime).getTime() + roundedElapsed * 1000,
    );

    // Combine existing description with notes if provided
    const updatedDescription = notes
      ? `${timerState.currentEntry.description || ""} | ${notes}`.trim()
      : timerState.currentEntry.description;

    const updateData: Record<string, unknown> = {
      end_time: endTime.toISOString(),
      is_running: false,
      description: updatedDescription,
    };

    // Apply billable/rate options if provided
    if (options?.is_billable !== undefined) {
      updateData.is_billable = options.is_billable;
    }
    if (options?.hourly_rate !== undefined) {
      updateData.hourly_rate = options.hourly_rate;
    }

    // Note: duration_minutes is a generated column - only update end_time, is_running, and description
    const { data, error } = await supabase
      .from("time_entries")
      .update(updateData)
      .eq("id", timerState.currentEntry.id)
      .select();

    if (error) {
      console.error("🔴 [useTimer] Error saving entry:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את הרישום",
        variant: "destructive",
      });
      return;
    }

    setTimerState({
      isRunning: false,
      startTime: null,
      elapsed: 0,
      currentEntry: null,
      pausedAt: null,
    });

    toast({
      title: "נשמר בהצלחה",
      description: `זמן שנרשם: ${formatDuration(durationMinutes)}`,
    });

    await refreshEntries();
  };

  const updateDescription = async (description: string) => {
    if (!timerState.currentEntry) return;

    const { error } = await supabase
      .from("time_entries")
      .update({ description })
      .eq("id", timerState.currentEntry.id);

    if (error) {
      console.error("Error updating description:", error);
      return;
    }

    setTimerState((prev) => ({
      ...prev,
      currentEntry: prev.currentEntry
        ? { ...prev.currentEntry, description }
        : null,
    }));
  };

  const updateTags = async (tags: string[]) => {
    if (!timerState.currentEntry) return;

    const { error } = await supabase
      .from("time_entries")
      .update({ tags })
      .eq("id", timerState.currentEntry.id);

    if (error) {
      console.error("Error updating tags:", error);
      return;
    }

    setTimerState((prev) => ({
      ...prev,
      currentEntry: prev.currentEntry ? { ...prev.currentEntry, tags } : null,
    }));
  };

  const updateBillable = async (is_billable: boolean) => {
    if (!timerState.currentEntry) return;

    const { error } = await supabase
      .from("time_entries")
      .update({ is_billable })
      .eq("id", timerState.currentEntry.id);

    if (error) {
      console.error("Error updating billable:", error);
      return;
    }

    setTimerState((prev) => ({
      ...prev,
      currentEntry: prev.currentEntry
        ? { ...prev.currentEntry, is_billable }
        : null,
    }));
  };

  const updateHourlyRate = async (hourly_rate: number | null) => {
    if (!timerState.currentEntry) return;

    const { error } = await supabase
      .from("time_entries")
      .update({ hourly_rate })
      .eq("id", timerState.currentEntry.id);

    if (error) {
      console.error("Error updating hourly rate:", error);
      return;
    }

    setTimerState((prev) => ({
      ...prev,
      currentEntry: prev.currentEntry
        ? { ...prev.currentEntry, hourly_rate }
        : null,
    }));
  };

  return (
    <TimerContext.Provider
      value={{
        timerState,
        startTimer,
        stopTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        saveEntry,
        updateDescription,
        updateTags,
        updateBillable,
        updateHourlyRate,
        todayEntries,
        todayTotal,
        weekTotal,
        isLoading,
        refreshEntries,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}

// Helper function - shows half-minute precision
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  // Format: show .30 for half minutes
  const wholeMinutes = Math.floor(mins);
  const hasHalf = mins % 1 !== 0;
  const minStr = hasHalf ? `${wholeMinutes}.30` : `${wholeMinutes}`;
  if (hours === 0) return `${minStr} דקות`;
  return `${hours} שעות ו-${minStr} דקות`;
}
