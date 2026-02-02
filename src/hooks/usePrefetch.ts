// Prefetch hook for better navigation performance
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Map of routes to their lazy-loaded components
const routePreloaders: Record<string, () => Promise<any>> = {
  '/': () => import('@/pages/Index'),
  '/clients': () => import('@/pages/Clients'),
  '/datatable-pro': () => import('@/pages/DataTablePro'),
  '/finance': () => import('@/pages/Finance'),
  '/quotes': () => import('@/pages/Quotes'),
  '/settings': () => import('@/pages/Settings'),
  '/calendar': () => import('@/pages/Calendar'),
  '/time-logs': () => import('@/pages/TimeLogs'),
  '/my-day': () => import('@/pages/MyDay'),
  '/dashboard': () => import('@/pages/Dashboard'),
  '/tasks-meetings': () => import('@/pages/TasksAndMeetings'),
  '/reminders': () => import('@/pages/Reminders'),
};

// Cache to track what's already been prefetched
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a specific route's component
 */
export function prefetchRoute(route: string): void {
  if (prefetchedRoutes.has(route)) return;
  
  const preloader = routePreloaders[route];
  if (preloader) {
    prefetchedRoutes.add(route);
    // Use requestIdleCallback for non-critical prefetch
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => preloader());
    } else {
      setTimeout(() => preloader(), 100);
    }
  }
}

/**
 * Prefetch multiple routes
 */
export function prefetchRoutes(routes: string[]): void {
  routes.forEach(prefetchRoute);
}

/**
 * Hook to prefetch routes on hover
 */
export function usePrefetchOnHover(route: string) {
  const handleMouseEnter = useCallback(() => {
    prefetchRoute(route);
  }, [route]);

  return { onMouseEnter: handleMouseEnter };
}

/**
 * Hook to prefetch common routes after initial load
 */
export function usePrefetchCommonRoutes() {
  useEffect(() => {
    // Wait for initial render to complete
    const timeoutId = setTimeout(() => {
      // Prefetch most common routes
      prefetchRoutes([
        '/clients',
        '/datatable-pro', 
        '/finance',
        '/my-day',
        '/tasks-meetings',
      ]);
    }, 2000); // Wait 2 seconds after mount

    return () => clearTimeout(timeoutId);
  }, []);
}

// Query keys for data prefetching
const QUERY_KEYS = {
  clients: ['clients-list'],
  tasks: ['tasks'],
  meetings: ['meetings'],
  reminders: ['reminders'],
} as const;

// Data fetch functions
const fetchFunctions = {
  clients: async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name, email, phone, company, status')
      .order('name')
      .limit(100);
    return data;
  },
  tasks: async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, client:clients(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    return data;
  },
  meetings: async () => {
    const { data } = await supabase
      .from('meetings')
      .select('*, client:clients(name)')
      .order('start_time')
      .limit(50);
    return data;
  },
};

/**
 * Hook to prefetch data using React Query
 */
export function usePrefetchData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchClients = useCallback(() => {
    if (!user) return;
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.clients,
      queryFn: fetchFunctions.clients,
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, user]);

  const prefetchTasks = useCallback(() => {
    if (!user) return;
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.tasks,
      queryFn: fetchFunctions.tasks,
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, user]);

  const prefetchMeetings = useCallback(() => {
    if (!user) return;
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.meetings,
      queryFn: fetchFunctions.meetings,
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, user]);

  const prefetchAll = useCallback(() => {
    prefetchClients();
    prefetchTasks();
    prefetchMeetings();
  }, [prefetchClients, prefetchTasks, prefetchMeetings]);

  return { prefetchClients, prefetchTasks, prefetchMeetings, prefetchAll };
}

/**
 * Auto-prefetch data after login
 */
export function useAutoPreloadData() {
  const { user } = useAuth();
  const { prefetchAll } = usePrefetchData();

  useEffect(() => {
    if (user) {
      const timeout = setTimeout(prefetchAll, 1500);
      return () => clearTimeout(timeout);
    }
  }, [user, prefetchAll]);
}

export default usePrefetchOnHover;
