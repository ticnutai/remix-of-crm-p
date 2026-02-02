import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, differenceInMinutes } from 'date-fns';

export interface EmployeeTimeStats {
  hoursThisWeek: number;
  hoursThisMonth: number;
  billableHoursThisMonth: number;
  totalEntries: number;
}

export interface SyncedEmployee {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  department: string;
  position: string;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  avatar_url: string;
  role: 'admin' | 'manager' | 'employee' | 'client';
  // Time stats
  hoursThisWeek: number;
  hoursThisMonth: number;
  billableHoursThisMonth: number;
  totalEntries: number;
}

export function useEmployeesSync() {
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  
  // Try to load from localStorage for instant display
  const getInitialEmployees = (): SyncedEmployee[] => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem('cachedEmployees');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  };
  
  const [employees, setEmployees] = useState<SyncedEmployee[]>(getInitialEmployees());
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Calculate time stats from time entries
  const calculateTimeStats = useCallback((
    timeEntries: Array<{
      user_id: string;
      start_time: string;
      end_time: string | null;
      duration_minutes: number | null;
      is_billable: boolean | null;
      is_running: boolean | null;
    }>
  ): Record<string, EmployeeTimeStats> => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const statsMap: Record<string, EmployeeTimeStats> = {};

    timeEntries.forEach((entry) => {
      const userId = entry.user_id;
      const startTime = new Date(entry.start_time);
      
      // Calculate duration
      let durationMinutes = entry.duration_minutes || 0;
      if (entry.is_running && !entry.end_time) {
        durationMinutes = differenceInMinutes(now, startTime);
      } else if (entry.end_time && !entry.duration_minutes) {
        durationMinutes = differenceInMinutes(new Date(entry.end_time), startTime);
      }

      if (!statsMap[userId]) {
        statsMap[userId] = {
          hoursThisWeek: 0,
          hoursThisMonth: 0,
          billableHoursThisMonth: 0,
          totalEntries: 0,
        };
      }

      statsMap[userId].totalEntries++;

      // Check if entry is within this week
      if (startTime >= weekStart && startTime <= weekEnd) {
        statsMap[userId].hoursThisWeek += durationMinutes / 60;
      }

      // Check if entry is within this month
      if (startTime >= monthStart && startTime <= monthEnd) {
        statsMap[userId].hoursThisMonth += durationMinutes / 60;
        if (entry.is_billable) {
          statsMap[userId].billableHoursThisMonth += durationMinutes / 60;
        }
      }
    });

    return statsMap;
  }, []);

  // Fetch employees from profiles + user_roles + time_entries
  const fetchEmployees = useCallback(async () => {
    if (!user) {
      setEmployees([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch profiles, roles, and time entries in parallel
      const [profilesResult, rolesResult, timeEntriesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true }),
        supabase
          .from('user_roles')
          .select('user_id, role'),
        supabase
          .from('time_entries')
          .select('user_id, start_time, end_time, duration_minutes, is_billable, is_running')
          .gte('start_time', startOfMonth(new Date()).toISOString())
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;
      // Time entries might fail for non-managers, that's ok
      
      const profiles = profilesResult.data || [];
      const roles = rolesResult.data || [];
      const timeEntries = timeEntriesResult.data || [];

      // Create a map of user_id to role
      const rolesMap: Record<string, 'admin' | 'manager' | 'employee' | 'client'> = {};
      roles.forEach((r) => {
        rolesMap[r.user_id] = r.role as 'admin' | 'manager' | 'employee' | 'client';
      });

      // Calculate time stats
      const timeStats = calculateTimeStats(timeEntries);

      // Combine profiles with roles and stats, filter out clients
      const syncedEmployees: SyncedEmployee[] = profiles
        .map((profile) => {
          const stats = timeStats[profile.id] || {
            hoursThisWeek: 0,
            hoursThisMonth: 0,
            billableHoursThisMonth: 0,
            totalEntries: 0,
          };

          return {
            id: profile.id,
            email: profile.email || '',
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            department: profile.department || '',
            position: profile.position || '',
            hourly_rate: profile.hourly_rate || 0,
            is_active: profile.is_active ?? true,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            avatar_url: profile.avatar_url || '',
            role: rolesMap[profile.id] || 'employee',
            hoursThisWeek: Math.round(stats.hoursThisWeek * 10) / 10,
            hoursThisMonth: Math.round(stats.hoursThisMonth * 10) / 10,
            billableHoursThisMonth: Math.round(stats.billableHoursThisMonth * 10) / 10,
            totalEntries: stats.totalEntries,
          };
        })
        .filter((emp) => emp.role !== 'client'); // Filter out clients from employees list

      setEmployees(syncedEmployees);
      
      // Cache to localStorage for instant display on next load
      try {
        localStorage.setItem('cachedEmployees', JSON.stringify(syncedEmployees));
      } catch (e) {
        console.error('Failed to cache employees:', e);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'שגיאה בטעינת עובדים',
        description: 'לא ניתן לטעון את רשימת העובדים',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, calculateTimeStats]);

  // Initial fetch
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchEmployees();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          fetchEmployees();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_entries' },
        () => {
          fetchEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchEmployees]);

  // Update employee field
  const updateEmployee = useCallback(
    async (employeeId: string, field: string, value: any) => {
      // Permission check
      if (!isManager && !isAdmin) {
        toast({
          title: 'אין הרשאה',
          description: 'רק מנהלים יכולים לערוך עובדים',
          variant: 'destructive',
        });
        return false;
      }

      // Role and hourly_rate can only be changed by admin
      if ((field === 'role' || field === 'hourly_rate') && !isAdmin) {
        toast({
          title: 'אין הרשאה',
          description: 'רק מנהל ראשי יכול לשנות שדה זה',
          variant: 'destructive',
        });
        return false;
      }

      try {
        setIsSyncing(true);

        if (field === 'role') {
          // Update user_roles table
          const { error } = await supabase
            .from('user_roles')
            .update({ role: value })
            .eq('user_id', employeeId);

          if (error) throw error;
        } else {
          // Update profiles table
          const { error } = await supabase
            .from('profiles')
            .update({ [field]: value })
            .eq('id', employeeId);

          if (error) throw error;
        }

        // Update local state optimistically
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === employeeId ? { ...emp, [field]: value } : emp
          )
        );

        toast({
          title: 'עודכן בהצלחה',
          description: 'השינויים נשמרו במסד הנתונים',
        });

        return true;
      } catch (error) {
        console.error('Error updating employee:', error);
        toast({
          title: 'שגיאה בעדכון',
          description: 'לא ניתן לעדכן את העובד',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [isManager, isAdmin, toast]
  );

  return {
    employees,
    isLoading,
    isSyncing,
    fetchEmployees,
    updateEmployee,
    isManager,
    isAdmin,
  };
}
