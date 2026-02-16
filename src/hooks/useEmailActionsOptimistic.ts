// useEmailActionsOptimistic - Wraps email actions with optimistic cache updates
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEmailActions } from "./useEmailActions";
import { useGmailCache } from "./useGmailCache";
import { GmailMessage } from "./useGmailIntegration";
import { useToast } from "./use-toast";

const GMAIL_CACHE_KEY = "gmail-messages";

export function useEmailActionsOptimistic() {
  const { archiveEmail, deleteEmail, toggleStar, markAsRead } =
    useEmailActions();
  const queryClient = useQueryClient();
  const cache = useGmailCache();
  const { toast } = useToast();

  // Optimistic archive - removes from cache immediately, rolls back on error
  const archiveEmailOptimistic = useCallback(
    async (messageId: string) => {
      // Snapshot previous state for rollback
      const previousData = queryClient.getQueryData<GmailMessage[]>([
        GMAIL_CACHE_KEY,
        "inbox",
      ]);

      // Optimistic: remove from cache
      cache.removeCachedMessage(messageId);

      const success = await archiveEmail(messageId);
      if (!success && previousData) {
        // Rollback on failure
        queryClient.setQueryData([GMAIL_CACHE_KEY, "inbox"], previousData);
        toast({
          title: "שגיאה - השינוי בוטל",
          variant: "destructive",
        });
      }
      return success;
    },
    [archiveEmail, queryClient, cache, toast],
  );

  // Optimistic delete - removes from cache immediately
  const deleteEmailOptimistic = useCallback(
    async (messageId: string) => {
      const previousData = queryClient.getQueryData<GmailMessage[]>([
        GMAIL_CACHE_KEY,
        "inbox",
      ]);

      cache.removeCachedMessage(messageId);

      const success = await deleteEmail(messageId);
      if (!success && previousData) {
        queryClient.setQueryData([GMAIL_CACHE_KEY, "inbox"], previousData);
        toast({
          title: "שגיאה - השינוי בוטל",
          variant: "destructive",
        });
      }
      return success;
    },
    [deleteEmail, queryClient, cache, toast],
  );

  // Optimistic star toggle - updates star state in cache immediately
  const toggleStarOptimistic = useCallback(
    async (messageId: string, isStarred: boolean) => {
      const previousData = queryClient.getQueryData<GmailMessage[]>([
        GMAIL_CACHE_KEY,
        "inbox",
      ]);

      // Optimistic: toggle star in cache
      cache.updateCachedMessage(messageId, (msg) => ({
        ...msg,
        isStarred: !isStarred,
      }));

      const success = await toggleStar(messageId, isStarred);
      if (!success && previousData) {
        queryClient.setQueryData([GMAIL_CACHE_KEY, "inbox"], previousData);
      }
      return success;
    },
    [toggleStar, queryClient, cache],
  );

  // Optimistic mark as read/unread
  const markAsReadOptimistic = useCallback(
    async (messageId: string, read: boolean = true) => {
      const previousData = queryClient.getQueryData<GmailMessage[]>([
        GMAIL_CACHE_KEY,
        "inbox",
      ]);

      // Optimistic: update read state in cache
      cache.updateCachedMessage(messageId, (msg) => ({
        ...msg,
        isRead: read,
      }));

      const success = await markAsRead(messageId, read);
      if (!success && previousData) {
        queryClient.setQueryData([GMAIL_CACHE_KEY, "inbox"], previousData);
      }
      return success;
    },
    [markAsRead, queryClient, cache],
  );

  return {
    archiveEmail: archiveEmailOptimistic,
    deleteEmail: deleteEmailOptimistic,
    toggleStar: toggleStarOptimistic,
    markAsRead: markAsReadOptimistic,
  };
}
