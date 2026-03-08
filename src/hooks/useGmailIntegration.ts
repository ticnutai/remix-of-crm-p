// Hook for Gmail integration
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useGoogleServices } from './useGoogleServices';

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

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
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
  const fetchEmails = useCallback(async (
    maxResults: number = 20, 
    pageToken?: string,
    query?: string
  ) => {
    if (!user) return [];

    const isLoadMore = !!pageToken;
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const token = await getAccessToken(['gmail']);
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
        headers: { Authorization: `Bearer ${token}` } 
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
      const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: any) => {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return msgResponse.json();
      });

      const messagesData = await Promise.all(messagePromises);

      const formattedMessages: GmailMessage[] = messagesData.map((msg: any) => {
        const headers = msg.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';
        const fromHeader = getHeader('From');
        const fromMatch = fromHeader.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);

        return {
          id: msg.id,
          threadId: msg.threadId,
          subject: getHeader('Subject'),
          from: fromMatch?.[2] || fromHeader,
          fromName: fromMatch?.[1] || fromMatch?.[2] || fromHeader,
          to: getHeader('To').split(',').map((t: string) => t.trim()),
          date: getHeader('Date'),
          snippet: msg.snippet || '',
          isRead: !msg.labelIds?.includes('UNREAD'),
          isStarred: msg.labelIds?.includes('STARRED'),
          labels: msg.labelIds || [],
        };
      });

      // If loading more, append to existing messages
      if (isLoadMore) {
        setMessages(prev => [...prev, ...formattedMessages]);
      } else {
        setMessages(formattedMessages);
      }
      
      setIsLoading(false);
      setIsLoadingMore(false);
      return formattedMessages;
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      toast({
        title: 'שגיאה בטעינת מיילים',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      setIsLoadingMore(false);
      return [];
    }
  }, [user, getAccessToken, toast]);

  // Load more emails (pagination)
  const loadMoreEmails = useCallback(async () => {
    if (!nextPageToken || isLoadingMore) return [];
    return fetchEmails(20, nextPageToken);
  }, [nextPageToken, isLoadingMore, fetchEmails]);

  // Search emails by date range
  const searchByDateRange = useCallback(async (startDate: Date, endDate?: Date) => {
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
  }, [fetchEmails]);

  // Send email
  const sendEmail = useCallback(async (params: SendEmailParams): Promise<boolean> => {
    if (!user) return false;

    setIsSending(true);
    try {
      const token = await getAccessToken(['gmail']);
      if (!token) {
        setIsSending(false);
        return false;
      }

      // Build raw email
      const emailLines = [
        `To: ${params.to}`,
        `Subject: ${params.subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        params.body,
      ];

      if (params.cc) {
        emailLines.splice(1, 0, `Cc: ${params.cc}`);
      }
      if (params.bcc) {
        emailLines.splice(params.cc ? 2 : 1, 0, `Bcc: ${params.bcc}`);
      }

      const raw = btoa(emailLines.join('\r\n'))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast({
        title: 'המייל נשלח בהצלחה',
      });

      setIsSending(false);
      return true;
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'שגיאה בשליחת המייל',
        description: error.message,
        variant: 'destructive',
      });
      setIsSending(false);
      return false;
    }
  }, [user, getAccessToken, toast]);

  // Link email to client
  const linkEmailToClient = useCallback(async (
    messageId: string,
    clientId: string,
    message: GmailMessage
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('email_messages').upsert({
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
      }, { onConflict: 'user_id,gmail_message_id' });

      if (error) throw error;

      toast({
        title: 'המייל קושר ללקוח בהצלחה',
      });

      return true;
    } catch (error: any) {
      console.error('Error linking email:', error);
      toast({
        title: 'שגיאה בקישור המייל',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

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
  };
}
