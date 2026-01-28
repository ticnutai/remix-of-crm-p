// Prefetch hook for better navigation performance
import { useCallback, useEffect } from 'react';

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
      ]);
    }, 2000); // Wait 2 seconds after mount

    return () => clearTimeout(timeoutId);
  }, []);
}

export default usePrefetchOnHover;
