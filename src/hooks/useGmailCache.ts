// useGmailCache - React Query caching layer for Gmail emails
import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GmailMessage } from "@/hooks/useGmailIntegration";

const GMAIL_CACHE_KEY = "gmail-messages";
const GMAIL_BODY_CACHE_KEY = "gmail-body";

export function useGmailCache() {
  const queryClient = useQueryClient();
  // In-memory body cache (HTML bodies are large, don't need React Query)
  const bodyCacheRef = useRef<Map<string, string>>(new Map());

  // Cache messages in React Query
  const cacheMessages = useCallback(
    (messages: GmailMessage[], queryKey?: string) => {
      const key = queryKey || "inbox";
      queryClient.setQueryData([GMAIL_CACHE_KEY, key], messages);
    },
    [queryClient],
  );

  // Get cached messages
  const getCachedMessages = useCallback(
    (queryKey?: string): GmailMessage[] | undefined => {
      const key = queryKey || "inbox";
      return queryClient.getQueryData<GmailMessage[]>([
        GMAIL_CACHE_KEY,
        key,
      ]);
    },
    [queryClient],
  );

  // Append more messages to cache (pagination)
  const appendCachedMessages = useCallback(
    (newMessages: GmailMessage[], queryKey?: string) => {
      const key = queryKey || "inbox";
      const existing =
        queryClient.getQueryData<GmailMessage[]>([GMAIL_CACHE_KEY, key]) ||
        [];
      const existingIds = new Set(existing.map((m) => m.id));
      const deduped = newMessages.filter((m) => !existingIds.has(m.id));
      queryClient.setQueryData(
        [GMAIL_CACHE_KEY, key],
        [...existing, ...deduped],
      );
    },
    [queryClient],
  );

  // Optimistically update a single message in cache
  const updateCachedMessage = useCallback(
    (
      messageId: string,
      updater: (msg: GmailMessage) => GmailMessage,
      queryKey?: string,
    ) => {
      const key = queryKey || "inbox";
      queryClient.setQueryData<GmailMessage[]>(
        [GMAIL_CACHE_KEY, key],
        (old) => {
          if (!old) return old;
          return old.map((msg) => (msg.id === messageId ? updater(msg) : msg));
        },
      );
    },
    [queryClient],
  );

  // Optimistically remove a message from cache
  const removeCachedMessage = useCallback(
    (messageId: string, queryKey?: string) => {
      const key = queryKey || "inbox";
      queryClient.setQueryData<GmailMessage[]>(
        [GMAIL_CACHE_KEY, key],
        (old) => {
          if (!old) return old;
          return old.filter((msg) => msg.id !== messageId);
        },
      );
    },
    [queryClient],
  );

  // Cache email body (HTML)
  const cacheBody = useCallback((messageId: string, html: string) => {
    bodyCacheRef.current.set(messageId, html);
    // Keep cache bounded
    if (bodyCacheRef.current.size > 100) {
      const firstKey = bodyCacheRef.current.keys().next().value;
      if (firstKey) bodyCacheRef.current.delete(firstKey);
    }
  }, []);

  // Get cached body
  const getCachedBody = useCallback((messageId: string): string | undefined => {
    return bodyCacheRef.current.get(messageId);
  }, []);

  // Invalidate all Gmail caches
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [GMAIL_CACHE_KEY] });
    bodyCacheRef.current.clear();
  }, [queryClient]);

  // Invalidate specific query
  const invalidateQuery = useCallback(
    (queryKey?: string) => {
      const key = queryKey || "inbox";
      queryClient.invalidateQueries({ queryKey: [GMAIL_CACHE_KEY, key] });
    },
    [queryClient],
  );

  return {
    cacheMessages,
    getCachedMessages,
    appendCachedMessages,
    updateCachedMessage,
    removeCachedMessage,
    cacheBody,
    getCachedBody,
    invalidateAll,
    invalidateQuery,
  };
}
