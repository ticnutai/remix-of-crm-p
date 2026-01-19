// Hook for managing multiple Google Calendar accounts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type SyncDirection = 'to_google' | 'from_google' | 'both';

export interface GoogleCalendarAccount {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  calendar_id: string;
  sync_direction: SyncDirection;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarAccountInsert {
  email: string;
  display_name?: string | null;
  calendar_id?: string;
  sync_direction?: SyncDirection;
  is_active?: boolean;
}

// Constants
const SCOPES = [
  // Calendar
  'https://www.googleapis.com/auth/calendar',
  // User Info
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  // Gmail
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  // Drive
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  // Contacts
  'https://www.googleapis.com/auth/contacts.readonly',
  // Sheets
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ');
const DEFAULT_CLIENT_ID = '203713636858-0bn66n8rd2gpkkvmhg233hs6ufeaml2s.apps.googleusercontent.com';

// Load Google Identity Services script
const loadGisScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

// Load Google API script
const loadGoogleApiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google API'));
    document.head.appendChild(script);
  });
};

export function useGoogleCalendarAccounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<GoogleCalendarAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch accounts from database
  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('google_calendar_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts((data || []).map(account => ({
        ...account,
        sync_direction: account.sync_direction as SyncDirection,
      })));
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'שגיאה בטעינת חשבונות',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Add a new Google account
  const addAccount = useCallback(async (syncDirection: SyncDirection = 'both') => {
    if (!user) {
      toast({
        title: 'שגיאה',
        description: 'יש להתחבר למערכת תחילה',
        variant: 'destructive',
      });
      return null;
    }

    setIsConnecting(true);
    try {
      await loadGisScript();
      await loadGoogleApiScript();

      // Initialize GAPI
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });

      return new Promise<GoogleCalendarAccount | null>((resolve) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: DEFAULT_CLIENT_ID,
          scope: SCOPES,
          callback: async (response: any) => {
            if (response.error) {
              console.error('OAuth error:', response);
              toast({
                title: 'שגיאה בהתחברות',
                description: 'לא ניתן להתחבר לחשבון Google',
                variant: 'destructive',
              });
              setIsConnecting(false);
              resolve(null);
              return;
            }

            try {
              // Get user info
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              });
              const userInfo = await userInfoResponse.json();

              // Check if account already exists
              const existing = accounts.find(a => a.email === userInfo.email);
              if (existing) {
                toast({
                  title: 'החשבון כבר קיים',
                  description: `${userInfo.email} כבר מחובר`,
                  variant: 'destructive',
                });
                setIsConnecting(false);
                resolve(null);
                return;
              }

              // Save to database
              const { data, error } = await supabase
                .from('google_calendar_accounts')
                .insert({
                  user_id: user.id,
                  email: userInfo.email,
                  display_name: userInfo.name || userInfo.email,
                  calendar_id: 'primary',
                  sync_direction: syncDirection,
                  is_active: true,
                })
                .select()
                .single();

              if (error) throw error;

              toast({
                title: 'החשבון נוסף בהצלחה',
                description: `${userInfo.email} מחובר כעת`,
              });

              await fetchAccounts();
              setIsConnecting(false);
              resolve({
                ...data,
                sync_direction: data.sync_direction as SyncDirection,
              });
            } catch (error: any) {
              console.error('Error saving account:', error);
              toast({
                title: 'שגיאה בשמירת החשבון',
                description: error.message,
                variant: 'destructive',
              });
              setIsConnecting(false);
              resolve(null);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    } catch (error: any) {
      console.error('Error connecting account:', error);
      toast({
        title: 'שגיאה בחיבור החשבון',
        description: error.message,
        variant: 'destructive',
      });
      setIsConnecting(false);
      return null;
    }
  }, [user, accounts, toast, fetchAccounts]);

  // Update account settings
  const updateAccount = useCallback(async (
    accountId: string, 
    updates: Partial<Pick<GoogleCalendarAccount, 'sync_direction' | 'calendar_id' | 'is_active'>>
  ) => {
    try {
      const { error } = await supabase
        .from('google_calendar_accounts')
        .update(updates)
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: 'ההגדרות נשמרו',
      });

      await fetchAccounts();
      return true;
    } catch (error: any) {
      console.error('Error updating account:', error);
      toast({
        title: 'שגיאה בעדכון ההגדרות',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchAccounts]);

  // Remove account
  const removeAccount = useCallback(async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('google_calendar_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: 'החשבון הוסר',
      });

      await fetchAccounts();
      return true;
    } catch (error: any) {
      console.error('Error removing account:', error);
      toast({
        title: 'שגיאה בהסרת החשבון',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchAccounts]);

  // Update last sync time
  const updateLastSync = useCallback(async (accountId: string) => {
    try {
      await supabase
        .from('google_calendar_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', accountId);
      await fetchAccounts();
    } catch (error) {
      console.error('Error updating last sync:', error);
    }
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    isConnecting,
    addAccount,
    updateAccount,
    removeAccount,
    fetchAccounts,
    updateLastSync,
  };
}

// Type declarations for Google API
declare global {
  interface Window {
    gapi: any;
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          revoke: (token: string) => void;
        };
      };
    };
  }
}
