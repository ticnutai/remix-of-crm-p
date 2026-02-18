/**
 * Multi-account Gmail management
 * Allows adding multiple Gmail accounts and switching between them
 * or viewing all emails merged from all accounts
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GmailAccount {
  id: string;
  email: string;
  displayName: string;
  token: string;
  expiry: number; // timestamp ms
  scopes: string;
  addedAt: string;
  avatarUrl?: string;
}

const GMAIL_ACCOUNTS_KEY = 'gmail_accounts';
const GMAIL_ACTIVE_FILTER_KEY = 'gmail_active_account_filter';
const DEFAULT_CLIENT_ID = '203713636858-0bn66n8rd2gpkkvmhg233hs6ufeaml2s.apps.googleusercontent.com';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/contacts.readonly',
].join(' ');

// Load GIS script
const loadGisScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts) {
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

export function useGmailAccounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // Load accounts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GMAIL_ACCOUNTS_KEY);
      if (stored) {
        const parsed: GmailAccount[] = JSON.parse(stored);
        // Clean expired tokens but keep accounts
        const cleaned = parsed.map(acc => ({
          ...acc,
          token: Date.now() < acc.expiry ? acc.token : '',
        }));
        setAccounts(cleaned);
      }
      const storedFilter = localStorage.getItem(GMAIL_ACTIVE_FILTER_KEY);
      if (storedFilter) {
        setActiveFilter(storedFilter);
      }
    } catch (e) {
      console.error('[GmailAccounts] Error loading accounts:', e);
    }
  }, []);

  // Persist accounts to localStorage
  const saveAccounts = useCallback((accs: GmailAccount[]) => {
    setAccounts(accs);
    localStorage.setItem(GMAIL_ACCOUNTS_KEY, JSON.stringify(accs));
  }, []);

  // Persist active filter
  const setActiveFilterAndSave = useCallback((filter: 'all' | string) => {
    setActiveFilter(filter);
    localStorage.setItem(GMAIL_ACTIVE_FILTER_KEY, filter);
  }, []);

  // Add a new Gmail account (always shows account chooser)
  const addAccount = useCallback(async (): Promise<GmailAccount | null> => {
    if (!user) return null;
    setIsAdding(true);

    try {
      await loadGisScript();

      return new Promise((resolve) => {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: DEFAULT_CLIENT_ID,
          scope: GMAIL_SCOPES,
          callback: async (response: any) => {
            setIsAdding(false);
            if (response.error) {
              console.error('[GmailAccounts] OAuth error:', response);
              toast({
                title: 'שגיאה בהתחברות',
                description: 'לא ניתן להתחבר לחשבון Google',
                variant: 'destructive',
              });
              resolve(null);
              return;
            }

            // Get user info
            let email = '';
            let displayName = '';
            let avatarUrl = '';
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (userInfoRes.ok) {
                const info = await userInfoRes.json();
                email = info.email || '';
                displayName = info.name || info.email || '';
                avatarUrl = info.picture || '';
              }
            } catch (e) {
              console.error('[GmailAccounts] Error getting user info:', e);
            }

            if (!email) {
              toast({
                title: 'שגיאה',
                description: 'לא ניתן לקבל כתובת אימייל מהחשבון',
                variant: 'destructive',
              });
              resolve(null);
              return;
            }

            const expiresIn = response.expires_in || 3600;
            const expiry = Date.now() + (expiresIn - 300) * 1000;

            const newAccount: GmailAccount = {
              id: `gmail_${email.replace(/[@.]/g, '_')}`,
              email,
              displayName,
              token: response.access_token,
              expiry,
              scopes: response.scope || '',
              addedAt: new Date().toISOString(),
              avatarUrl,
            };

            // Check if account already exists - update token
            setAccounts(prev => {
              const existing = prev.findIndex(a => a.email === email);
              let updated: GmailAccount[];
              if (existing >= 0) {
                updated = [...prev];
                updated[existing] = { ...updated[existing], token: response.access_token, expiry, scopes: response.scope || '', avatarUrl };
                toast({
                  title: 'חשבון עודכן',
                  description: `${email} - הטוקן חודש בהצלחה`,
                });
              } else {
                updated = [...prev, newAccount];
                toast({
                  title: 'חשבון נוסף',
                  description: `${email} נוסף בהצלחה`,
                });
              }
              localStorage.setItem(GMAIL_ACCOUNTS_KEY, JSON.stringify(updated));
              return updated;
            });

            // Also save as the primary token if it's the first account
            // (keeps backward compat with useGoogleServices)
            const stored = localStorage.getItem(GMAIL_ACCOUNTS_KEY);
            const existingAccounts = stored ? JSON.parse(stored) : [];
            if (existingAccounts.length === 0) {
              localStorage.setItem('google_services_token', response.access_token);
              localStorage.setItem('google_services_token_expiry', expiry.toString());
              localStorage.setItem('google_services_email', email);
              localStorage.setItem('google_services_scopes', response.scope || '');
            }

            resolve(newAccount);
          },
        });

        // Force account chooser so user can pick a different account
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      });
    } catch (error: any) {
      console.error('[GmailAccounts] Error adding account:', error);
      setIsAdding(false);
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Remove an account
  const removeAccount = useCallback((accountId: string) => {
    setAccounts(prev => {
      const updated = prev.filter(a => a.id !== accountId);
      localStorage.setItem(GMAIL_ACCOUNTS_KEY, JSON.stringify(updated));
      return updated;
    });
    // If the removed account was active, switch to "all"
    if (activeFilter === accountId) {
      setActiveFilterAndSave('all');
    }
    toast({ title: 'חשבון הוסר' });
  }, [activeFilter, setActiveFilterAndSave, toast]);

  // Refresh token for a specific account (silent re-auth)
  const refreshAccountToken = useCallback(async (account: GmailAccount): Promise<string | null> => {
    try {
      await loadGisScript();

      return new Promise((resolve) => {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: DEFAULT_CLIENT_ID,
          scope: GMAIL_SCOPES,
          callback: async (response: any) => {
            if (response.error) {
              console.log(`[GmailAccounts] Silent re-auth failed for ${account.email}`);
              resolve(null);
              return;
            }

            const expiresIn = response.expires_in || 3600;
            const expiry = Date.now() + (expiresIn - 300) * 1000;

            setAccounts(prev => {
              const updated = prev.map(a =>
                a.id === account.id
                  ? { ...a, token: response.access_token, expiry, scopes: response.scope || '' }
                  : a
              );
              localStorage.setItem(GMAIL_ACCOUNTS_KEY, JSON.stringify(updated));
              return updated;
            });

            resolve(response.access_token);
          },
        });

        // Silent re-auth with login hint
        tokenClient.requestAccessToken({
          prompt: '',
          login_hint: account.email,
        });
      });
    } catch {
      return null;
    }
  }, []);

  // Get a valid token for an account (refresh if needed)
  const getValidToken = useCallback(async (account: GmailAccount): Promise<string | null> => {
    // Token still valid
    if (account.token && Date.now() < account.expiry) {
      return account.token;
    }
    // Try silent refresh
    return refreshAccountToken(account);
  }, [refreshAccountToken]);

  // Get the accounts that should be active based on filter
  const getActiveAccounts = useCallback((): GmailAccount[] => {
    if (activeFilter === 'all') {
      return accounts;
    }
    const acc = accounts.find(a => a.id === activeFilter);
    return acc ? [acc] : accounts;
  }, [accounts, activeFilter]);

  // Check if we have any accounts with valid tokens
  const hasAnyConnected = accounts.some(a => a.token && Date.now() < a.expiry);

  return {
    accounts,
    activeFilter,
    setActiveFilter: setActiveFilterAndSave,
    isAdding,
    addAccount,
    removeAccount,
    refreshAccountToken,
    getValidToken,
    getActiveAccounts,
    hasAnyConnected,
  };
}
