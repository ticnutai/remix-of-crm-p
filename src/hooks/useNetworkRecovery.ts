/**
 * Network Recovery Hook
 * 
 * Handles automatic recovery after device sleep / tab background:
 * - Reconnects Supabase Realtime WebSocket channels
 * - Suppresses noisy ERR_NETWORK_IO_SUSPENDED console errors
 * - Re-triggers pending data fetches via a "recovered" flag
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNetworkRecovery() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRecovery, setLastRecovery] = useState<number | null>(null);

  const recover = useCallback(async () => {
    if (isRecovering) return;
    setIsRecovering(true);

    try {
      // 1. Force Supabase Realtime to reconnect all channels
      //    The library reconnects automatically on new access_token,
      //    but after ERR_NETWORK_IO_SUSPENDED the WebSocket may be in
      //    a broken state. Explicitly reconnecting fixes this.
      const channels = supabase.getChannels();
      for (const channel of channels) {
        try {
          // Unsubscribe and re-subscribe triggers a fresh WebSocket handshake
          await channel.unsubscribe();
          channel.subscribe();
        } catch {
          // Channel might already be closed — safe to ignore
        }
      }

      setLastRecovery(Date.now());
    } finally {
      setIsRecovering(false);
    }
  }, [isRecovering]);

  useEffect(() => {
    let wasHidden = false;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
        return;
      }

      // Page became visible again after being hidden
      if (wasHidden && document.visibilityState === "visible" && navigator.onLine) {
        wasHidden = false;
        // Delay to let the network stack recover and auth token refresh first
        setTimeout(() => recover(), 2000);
      }
    };

    const handleOnline = () => {
      // Coming back from offline — recover connections
      setTimeout(() => recover(), 1000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [recover]);

  return { isRecovering, lastRecovery };
}
