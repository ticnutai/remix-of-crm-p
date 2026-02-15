// Hook for Gmail integration
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGoogleServices } from "./useGoogleServices";

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromName: string;
  to: string[];
  date: string;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
}

export interface EmailAttachment {
  name: string;
  type: string; // MIME type
  data: string; // base64 encoded
  size: number;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  attachments?: EmailAttachment[];
  inReplyTo?: string; // Message-ID for threading
  references?: string; // References header for threading
  scheduledAt?: Date; // For scheduled send
}

export function useGmailIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getAccessToken, isLoading: isGettingToken } = useGoogleServices();
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch recent emails with optional pagination and date query
  const fetchEmails = useCallback(
    async (maxResults: number = 20, pageToken?: string, query?: string) => {
      if (!user) return [];

      const isLoadMore = !!pageToken;
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const token = await getAccessToken(["gmail"]);
        if (!token) {
          setIsLoading(false);
          setIsLoadingMore(false);
          return [];
        }

        // Build URL with optional pageToken and query
        let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
        if (pageToken) {
          url += `&pageToken=${pageToken}`;
        }
        if (query) {
          url += `&q=${encodeURIComponent(query)}`;
        }

        // Get message list
        const listResponse = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const listData = await listResponse.json();

        // Save next page token for pagination
        setNextPageToken(listData.nextPageToken || null);

        if (!listData.messages) {
          if (!isLoadMore) setMessages([]);
          setIsLoading(false);
          setIsLoadingMore(false);
          return [];
        }

        // Get full message details
        const messagePromises = listData.messages
          .slice(0, maxResults)
          .map(async (msg: any) => {
            const msgResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            return msgResponse.json();
          });

        const messagesData = await Promise.all(messagePromises);

        const formattedMessages: GmailMessage[] = messagesData.map(
          (msg: any) => {
            const headers = msg.payload?.headers || [];
            const getHeader = (name: string) =>
              headers.find((h: any) => h.name === name)?.value || "";
            const fromHeader = getHeader("From");
            const fromMatch = fromHeader.match(
              /^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/,
            );

            return {
              id: msg.id,
              threadId: msg.threadId,
              subject: getHeader("Subject"),
              from: fromMatch?.[2] || fromHeader,
              fromName: fromMatch?.[1] || fromMatch?.[2] || fromHeader,
              to: getHeader("To")
                .split(",")
                .map((t: string) => t.trim()),
              date: getHeader("Date"),
              snippet: msg.snippet || "",
              isRead: !msg.labelIds?.includes("UNREAD"),
              isStarred: msg.labelIds?.includes("STARRED"),
              labels: msg.labelIds || [],
            };
          },
        );

        // If loading more, append to existing messages
        if (isLoadMore) {
          setMessages((prev) => [...prev, ...formattedMessages]);
        } else {
          setMessages(formattedMessages);
        }

        setIsLoading(false);
        setIsLoadingMore(false);
        return formattedMessages;
      } catch (error: any) {
        console.error("Error fetching emails:", error);
        toast({
          title: "שגיאה בטעינת מיילים",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        setIsLoadingMore(false);
        return [];
      }
    },
    [user, getAccessToken, toast],
  );

  // Load more emails (pagination)
  const loadMoreEmails = useCallback(async () => {
    if (!nextPageToken || isLoadingMore) return [];
    return fetchEmails(20, nextPageToken);
  }, [nextPageToken, isLoadingMore, fetchEmails]);

  // Search emails by date range
  const searchByDateRange = useCallback(
    async (startDate: Date, endDate?: Date) => {
      // Format dates for Gmail query
      // Use before: (exclusive, so add 1 day) and after: for the range
      const startFormatted = `${startDate.getFullYear()}/${startDate.getMonth() + 1}/${startDate.getDate()}`;

      // If only startDate is provided, search for emails from that specific date
      if (!endDate) {
        // Create end date as the day after startDate
        const nextDay = new Date(startDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const endFormatted = `${nextDay.getFullYear()}/${nextDay.getMonth() + 1}/${nextDay.getDate()}`;
        const query = `after:${startFormatted} before:${endFormatted}`;
        return fetchEmails(50, undefined, query);
      }

      // For a date range, get emails between startDate and endDate (inclusive)
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      const endFormatted = `${endDatePlusOne.getFullYear()}/${endDatePlusOne.getMonth() + 1}/${endDatePlusOne.getDate()}`;
      const query = `after:${startFormatted} before:${endFormatted}`;

      return fetchEmails(50, undefined, query);
    },
    [fetchEmails],
  );

  // UTF-8 safe base64url encoder
  const utf8ToBase64url = useCallback((str: string): string => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }, []);

  // Build multipart MIME message with attachments
  const buildMimeMessage = useCallback((params: SendEmailParams): string => {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const hasAttachments = params.attachments && params.attachments.length > 0;

    const headers: string[] = [
      `To: ${params.to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
      "MIME-Version: 1.0",
    ];

    if (params.cc) headers.push(`Cc: ${params.cc}`);
    if (params.bcc) headers.push(`Bcc: ${params.bcc}`);
    if (params.inReplyTo) headers.push(`In-Reply-To: ${params.inReplyTo}`);
    if (params.references) headers.push(`References: ${params.references}`);

    if (hasAttachments) {
      headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

      const parts: string[] = [
        ...headers,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: base64",
        "",
        btoa(unescape(encodeURIComponent(params.body))),
      ];

      for (const att of params.attachments!) {
        parts.push(
          `--${boundary}`,
          `Content-Type: ${att.type}; name="${att.name}"`,
          `Content-Disposition: attachment; filename="${att.name}"`,
          "Content-Transfer-Encoding: base64",
          "",
          att.data,
        );
      }
      parts.push(`--${boundary}--`);
      return parts.join("\r\n");
    } else {
      headers.push("Content-Type: text/html; charset=utf-8");
      headers.push("Content-Transfer-Encoding: base64");
      return [
        ...headers,
        "",
        btoa(unescape(encodeURIComponent(params.body))),
      ].join("\r\n");
    }
  }, []);

  // Send email with attachment support
  const sendEmail = useCallback(
    async (params: SendEmailParams): Promise<boolean> => {
      if (!user) return false;

      // Handle scheduled send
      if (params.scheduledAt && params.scheduledAt > new Date()) {
        const scheduled = JSON.parse(
          localStorage.getItem("scheduled_emails") || "[]",
        );
        scheduled.push({
          ...params,
          scheduledAt: params.scheduledAt.toISOString(),
        });
        localStorage.setItem("scheduled_emails", JSON.stringify(scheduled));
        toast({
          title: "המייל תוזמן בהצלחה",
          description: `ישלח ב-${params.scheduledAt.toLocaleString("he-IL")}`,
        });
        return true;
      }

      setIsSending(true);
      try {
        const token = await getAccessToken(["gmail"]);
        if (!token) {
          setIsSending(false);
          return false;
        }

        const mimeMessage = buildMimeMessage(params);
        const raw = utf8ToBase64url(mimeMessage);

        const response = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw }),
          },
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || "Failed to send email");
        }

        toast({ title: "המייל נשלח בהצלחה" });
        setIsSending(false);
        return true;
      } catch (error: any) {
        console.error("Error sending email:", error);
        toast({
          title: "שגיאה בשליחת המייל",
          description: error.message,
          variant: "destructive",
        });
        setIsSending(false);
        return false;
      }
    },
    [user, getAccessToken, toast, buildMimeMessage, utf8ToBase64url],
  );

  // Get attachment data from a received email
  const getAttachment = useCallback(
    async (messageId: string, attachmentId: string): Promise<string | null> => {
      try {
        const token = await getAccessToken(["gmail"]);
        if (!token) return null;
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error("Failed to fetch attachment");
        const data = await response.json();
        // Gmail returns base64url, convert to standard base64
        return data.data?.replace(/-/g, "+").replace(/_/g, "/") || null;
      } catch (error) {
        console.error("Error fetching attachment:", error);
        return null;
      }
    },
    [getAccessToken],
  );

  // Get full message details (including body and attachments list)
  const getFullMessage = useCallback(
    async (messageId: string) => {
      try {
        const token = await getAccessToken(["gmail"]);
        if (!token) return null;
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error("Failed to fetch message");
        return response.json();
      } catch (error) {
        console.error("Error fetching full message:", error);
        return null;
      }
    },
    [getAccessToken],
  );

  // Get all messages in a thread
  const getThread = useCallback(
    async (threadId: string): Promise<GmailMessage[]> => {
      try {
        const token = await getAccessToken(["gmail"]);
        if (!token) return [];
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date&metadataHeaders=Message-ID`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error("Failed to fetch thread");
        const data = await response.json();
        if (!data.messages) return [];
        return data.messages.map((msg: any) => {
          const headers = msg.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find(
              (h: any) => h.name.toLowerCase() === name.toLowerCase(),
            )?.value || "";
          const fromHeader = getHeader("From");
          const fromMatch = fromHeader.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
          return {
            id: msg.id,
            threadId: msg.threadId,
            subject: getHeader("Subject"),
            from: fromMatch?.[2] || fromHeader,
            fromName: fromMatch?.[1] || fromMatch?.[2] || fromHeader,
            to: getHeader("To")
              .split(",")
              .map((t: string) => t.trim()),
            date: getHeader("Date"),
            snippet: msg.snippet || "",
            isRead: !msg.labelIds?.includes("UNREAD"),
            isStarred: msg.labelIds?.includes("STARRED"),
            labels: msg.labelIds || [],
            messageId: getHeader("Message-ID"),
          };
        });
      } catch (error) {
        console.error("Error fetching thread:", error);
        return [];
      }
    },
    [getAccessToken],
  );

  // Extract HTML body from full message payload
  const extractHtmlBody = useCallback((payload: any): string => {
    if (!payload) return "";
    // Direct body
    if (payload.mimeType === "text/html" && payload.body?.data) {
      const decoded = payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
      try {
        return decodeURIComponent(escape(atob(decoded)));
      } catch {
        return atob(decoded);
      }
    }
    // Multipart — look for text/html
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/html" && part.body?.data) {
          const decoded = part.body.data.replace(/-/g, "+").replace(/_/g, "/");
          try {
            return decodeURIComponent(escape(atob(decoded)));
          } catch {
            return atob(decoded);
          }
        }
        if (part.parts) {
          const nested = extractHtmlBody(part) as string;
          if (nested) return nested;
        }
      }
      // Fallback to text/plain
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          const decoded = part.body.data.replace(/-/g, "+").replace(/_/g, "/");
          try {
            return decodeURIComponent(escape(atob(decoded)));
          } catch {
            return atob(decoded);
          }
        }
      }
    }
    // Direct text/plain
    if (payload.mimeType === "text/plain" && payload.body?.data) {
      const decoded = payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
      try {
        return decodeURIComponent(escape(atob(decoded)));
      } catch {
        return atob(decoded);
      }
    }
    return "";
  }, []);

  // Report as spam
  const reportSpam = useCallback(
    async (messageId: string): Promise<boolean> => {
      try {
        const token = await getAccessToken(["gmail"]);
        if (!token) return false;
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              addLabelIds: ["SPAM"],
              removeLabelIds: ["INBOX"],
            }),
          },
        );
        if (!response.ok) throw new Error("Failed to report spam");
        toast({ title: "דווח כספאם בהצלחה" });
        return true;
      } catch (error) {
        console.error("Error reporting spam:", error);
        toast({ title: "שגיאה בדיווח ספאם", variant: "destructive" });
        return false;
      }
    },
    [getAccessToken, toast],
  );

  // Batch modify messages (archive/delete/star multiple)
  const batchModify = useCallback(
    async (
      messageIds: string[],
      addLabels: string[],
      removeLabels: string[],
    ): Promise<boolean> => {
      try {
        const token = await getAccessToken(["gmail"]);
        if (!token) return false;
        const response = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ids: messageIds,
              addLabelIds: addLabels,
              removeLabelIds: removeLabels,
            }),
          },
        );
        if (!response.ok) throw new Error("Batch modify failed");
        return true;
      } catch (error) {
        console.error("Error batch modifying:", error);
        return false;
      }
    },
    [getAccessToken],
  );

  // Link email to client
  const linkEmailToClient = useCallback(
    async (messageId: string, clientId: string, message: GmailMessage) => {
      if (!user) return false;

      try {
        const { error } = await supabase.from("email_messages").upsert(
          {
            user_id: user.id,
            gmail_message_id: messageId,
            thread_id: message.threadId,
            subject: message.subject,
            from_email: message.from,
            from_name: message.fromName,
            to_emails: message.to,
            body_preview: message.snippet,
            received_at: new Date(message.date).toISOString(),
            is_read: message.isRead,
            is_starred: message.isStarred,
            labels: message.labels,
            client_id: clientId,
          },
          { onConflict: "user_id,gmail_message_id" },
        );

        if (error) throw error;

        toast({
          title: "המייל קושר ללקוח בהצלחה",
        });

        return true;
      } catch (error: any) {
        console.error("Error linking email:", error);
        toast({
          title: "שגיאה בקישור המייל",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast],
  );

  return {
    messages,
    isLoading: isLoading || isGettingToken,
    isLoadingMore,
    isSending,
    hasMore: !!nextPageToken,
    fetchEmails,
    loadMoreEmails,
    searchByDateRange,
    sendEmail,
    linkEmailToClient,
    getAttachment,
    getFullMessage,
    getThread,
    extractHtmlBody,
    reportSpam,
    batchModify,
  };
}
