// Auto Preload Component - Silently preloads data in background
// tenarch CRM Pro - Performance Optimization
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePrefetchCommonRoutes, usePrefetchData } from "@/hooks/usePrefetch";

export function AutoPreload() {
  const { user } = useAuth();
  const { prefetchAll } = usePrefetchData();

  // Prefetch route components
  usePrefetchCommonRoutes();

  // Prefetch data after user logs in
  useEffect(() => {
    if (user) {
      // Wait for initial render to settle
      const timeout = setTimeout(() => {
        prefetchAll();
      }, 2000);

      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // This component renders nothing - it just runs effects
  return null;
}

export default AutoPreload;
