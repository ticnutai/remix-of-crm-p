// Additional Email Actions Hook
import { useCallback } from 'react';
import { useGoogleServices } from './useGoogleServices';
import { useToast } from './use-toast';

export function useEmailActions() {
  const { getAccessToken } = useGoogleServices();
  const { toast } = useToast();

  // Archive email
  const archiveEmail = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const token = await getAccessToken(['gmail']);
      if (!token) return false;

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            removeLabelIds: ['INBOX'],
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to archive email');

      toast({
        title: 'המייל הועבר לארכיון',
      });

      return true;
    } catch (error: any) {
      console.error('Error archiving email:', error);
      toast({
        title: 'שגיאה בהעברה לארכיון',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [getAccessToken, toast]);

  // Delete email (move to trash)
  const deleteEmail = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const token = await getAccessToken(['gmail']);
      if (!token) return false;

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete email');

      toast({
        title: 'המייל נמחק',
        description: 'המייל הועבר לסל המיחזור',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting email:', error);
      toast({
        title: 'שגיאה במחיקת המייל',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [getAccessToken, toast]);

  // Toggle star
  const toggleStar = useCallback(async (messageId: string, isStarred: boolean): Promise<boolean> => {
    try {
      const token = await getAccessToken(['gmail']);
      if (!token) return false;

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            isStarred
              ? { removeLabelIds: ['STARRED'] }
              : { addLabelIds: ['STARRED'] }
          ),
        }
      );

      if (!response.ok) throw new Error('Failed to toggle star');

      return true;
    } catch (error: any) {
      console.error('Error toggling star:', error);
      toast({
        title: 'שגיאה בעדכון',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [getAccessToken, toast]);

  // Mark as read/unread
  const markAsRead = useCallback(async (messageId: string, markRead: boolean = true): Promise<boolean> => {
    try {
      const token = await getAccessToken(['gmail']);
      if (!token) return false;

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            markRead
              ? { removeLabelIds: ['UNREAD'] }
              : { addLabelIds: ['UNREAD'] }
          ),
        }
      );

      if (!response.ok) throw new Error('Failed to mark as read');

      return true;
    } catch (error: any) {
      console.error('Error marking as read:', error);
      toast({
        title: 'שגיאה בעדכון',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [getAccessToken, toast]);

  return {
    archiveEmail,
    deleteEmail,
    toggleStar,
    markAsRead,
  };
}
