// Shared hook for client portal unread counts
// Used by PortalNavigation to show badge counts across all portal pages
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PortalUnreadCounts {
  unreadMessages: number;
  unreadNotifications: number;
  loading: boolean;
  refresh: () => void;
}

export function usePortalUnreadCounts(): PortalUnreadCounts {
  const { clientId, isClient } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!clientId || !isClient) {
      setLoading(false);
      return;
    }

    try {
      const [msgRes, notifRes] = await Promise.all([
        supabase
          .from("client_messages")
          .select("id", { count: "exact", head: true })
          .eq("client_id", clientId)
          .eq("sender_type", "staff")
          .eq("is_read", false),
        supabase
          .from("client_notifications")
          .select("id", { count: "exact", head: true })
          .eq("client_id", clientId)
          .eq("is_read", false),
      ]);

      setUnreadMessages(msgRes.count || 0);
      setUnreadNotifications(notifRes.count || 0);
    } catch (error) {
      console.error("Error fetching portal unread counts:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId, isClient]);

  // Initial fetch
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Realtime subscriptions for live badge updates
  useEffect(() => {
    if (!clientId || !isClient) return;

    const msgChannel = supabase
      .channel("portal-msg-counts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_messages",
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          fetchCounts();
        },
      )
      .subscribe();

    const notifChannel = supabase
      .channel("portal-notif-counts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_notifications",
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          fetchCounts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [clientId, isClient, fetchCounts]);

  return {
    unreadMessages,
    unreadNotifications,
    loading,
    refresh: fetchCounts,
  };
}
