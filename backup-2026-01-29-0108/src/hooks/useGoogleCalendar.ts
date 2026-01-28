// Google Calendar Integration Hook
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Debug logging
const DEBUG = true;
const log = (...args: any[]) => {
  if (DEBUG) {
    console.log('[GoogleCalendar]', ...args);
  }
};
const logError = (...args: any[]) => {
  console.error('[GoogleCalendar ERROR]', ...args);
};

// Types
export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: { email: string }[];
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
  calendarId: string;
}

// Constants
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const STORAGE_KEY = 'google_calendar_config';
const TOKEN_STORAGE_KEY = 'google_calendar_token';

// Default Google OAuth Config
const DEFAULT_CLIENT_ID = '203713636858-0bn66n8rd2gpkkvmhg233hs6ufeaml2s.apps.googleusercontent.com';

// Token storage utilities (outside hook to avoid hook ordering issues)
const saveTokenToStorage = (token: any) => {
  if (token) {
    const tokenData = {
      ...token,
      saved_at: Date.now(),
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
  }
};

const loadTokenFromStorage = (): any | null => {
  try {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
      const tokenData = JSON.parse(savedToken);
      // Check if token is less than 50 minutes old (tokens expire in 1 hour)
      const tokenAge = Date.now() - (tokenData.saved_at || 0);
      const maxAge = 50 * 60 * 1000; // 50 minutes
      if (tokenAge < maxAge) {
        return tokenData;
      } else {
        // Token expired, remove it
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  } catch (e) {
    console.error('Failed to load saved token:', e);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  return null;
};

const clearTokenFromStorage = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

// Load Google API script
const loadGoogleApiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    log('Loading Google API script...');
    if (window.gapi) {
      log('Google API already loaded');
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      log('Google API script loaded successfully');
      resolve();
    };
    script.onerror = (e) => {
      logError('Failed to load Google API script:', e);
      reject(new Error('Failed to load Google API'));
    };
    document.head.appendChild(script);
  });
};

// Load Google Identity Services script
const loadGisScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    log('Loading Google Identity Services script...');
    if (window.google?.accounts) {
      log('Google Identity Services already loaded');
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      log('Google Identity Services script loaded successfully');
      resolve();
    };
    script.onerror = (e) => {
      logError('Failed to load Google Identity Services script:', e);
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.head.appendChild(script);
  });
};

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [config, setConfig] = useState<GoogleCalendarConfig | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [hasTriedAutoConnect, setHasTriedAutoConnect] = useState(false);

  // Log current origin on mount for debugging
  useEffect(() => {
    log('=== Google Calendar Debug Info ===');
    log('Current origin:', window.location.origin);
    log('Current URL:', window.location.href);
    log('Protocol:', window.location.protocol);
    log('Host:', window.location.host);
    log('');
    log('⚠️ Make sure this origin is added to Google Cloud Console:');
    log('   1. Go to https://console.cloud.google.com/apis/credentials');
    log('   2. Click on your OAuth 2.0 Client ID');
    log('   3. Add this to "Authorized JavaScript origins":', window.location.origin);
    log('   4. Add this to "Authorized redirect URIs":', window.location.origin);
    log('================================');
  }, []);

  // Load config from localStorage or use defaults
  useEffect(() => {
    let configToUse: GoogleCalendarConfig | null = null;
    
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        configToUse = JSON.parse(savedConfig);
      } catch (e) {
        console.error('Failed to parse Google Calendar config:', e);
      }
    }
    
    // Also check for API keys from settings
    const apiKeys = localStorage.getItem('api_keys');
    if (apiKeys) {
      try {
        const keys = JSON.parse(apiKeys);
        if (keys.GOOGLE_CLIENT_ID) {
          configToUse = {
            clientId: keys.GOOGLE_CLIENT_ID,
            apiKey: keys.GOOGLE_API_KEY || '',
            calendarId: keys.GOOGLE_CALENDAR_ID || 'primary',
          };
        }
      } catch (e) {
        console.error('Failed to parse API keys:', e);
      }
    }
    
    // Use default client ID if none configured
    if (!configToUse) {
      configToUse = {
        clientId: DEFAULT_CLIENT_ID,
        apiKey: '',
        calendarId: 'primary',
      };
    }
    
    setConfig(configToUse);
  }, []);

  // Initialize Google API
  const initializeGoogleApi = useCallback(async () => {
    log('initializeGoogleApi called');
    log('Current config:', config);
    log('Current origin:', window.location.origin);
    
    if (!config?.clientId) {
      logError('No Client ID configured');
      toast({
        title: 'חסרים פרטי התחברות',
        description: 'יש להגדיר Client ID בהגדרות',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsLoading(true);
      log('Loading scripts...');
      
      // Load scripts
      await loadGoogleApiScript();
      await loadGisScript();
      
      log('Scripts loaded, initializing GAPI client...');
      
      // Initialize GAPI
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', async () => {
          try {
            // Initialize without API key if not provided (OAuth only mode)
            const initConfig: any = {
              discoveryDocs: DISCOVERY_DOCS,
            };
            if (config.apiKey) {
              initConfig.apiKey = config.apiKey;
            }
            log('GAPI init config:', initConfig);
            await window.gapi.client.init(initConfig);
            log('GAPI client initialized successfully');
            setGapiInited(true);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });

      // Initialize Token Client
      log('Initializing Token Client with client_id:', config.clientId);
      log('Scopes:', SCOPES);
      
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: SCOPES,
        error_callback: (error: any) => {
          logError('Token Client error_callback:', error);
          logError('Error type:', error?.type);
          logError('Error message:', error?.message);
          toast({
            title: 'שגיאת OAuth',
            description: `${error?.type || 'Unknown error'}: ${error?.message || 'נסה שוב'}`,
            variant: 'destructive',
          });
        },
        callback: (response: any) => {
          log('OAuth callback received:', response);
          if (response.error) {
            logError('OAuth error in callback:', response);
            logError('Error:', response.error);
            logError('Error description:', response.error_description);
            toast({
              title: 'שגיאת OAuth',
              description: response.error_description || response.error,
              variant: 'destructive',
            });
            return;
          }
          log('OAuth success! Access token received');
          // Save the token
          const token = window.gapi.client.getToken();
          log('Token to save:', token ? 'exists' : 'null');
          saveTokenToStorage(token);
          setIsConnected(true);
          toast({
            title: 'מחובר ל-Google Calendar',
            description: 'הסנכרון פעיל',
          });
        },
      });
      
      log('Token Client created successfully');
      setTokenClient(client);
      setGisInited(true);
      
      // Try to restore saved token
      const savedToken = loadTokenFromStorage();
      log('Saved token found:', savedToken ? 'yes' : 'no');
      if (savedToken) {
        try {
          window.gapi.client.setToken(savedToken);
          setIsConnected(true);
          log('Restored Google Calendar connection from saved token');
        } catch (e) {
          logError('Failed to restore token:', e);
          clearTokenFromStorage();
        }
      }
      
      return true;
    } catch (error) {
      logError('Failed to initialize Google API:', error);
      toast({
        title: 'שגיאה באתחול Google API',
        description: 'נסה שוב מאוחר יותר',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Auto-connect on mount if we have a saved token
  useEffect(() => {
    if (config && !hasTriedAutoConnect && !isConnected) {
      const savedToken = loadTokenFromStorage();
      if (savedToken) {
        setHasTriedAutoConnect(true);
        // Initialize and restore connection
        initializeGoogleApi();
      }
    }
  }, [config, hasTriedAutoConnect, isConnected, initializeGoogleApi]);

  // Connect to Google Calendar
  const connect = useCallback(async () => {
    log('connect() called');
    log('gapiInited:', gapiInited, 'gisInited:', gisInited);
    
    if (!gapiInited || !gisInited) {
      log('Initializing Google API first...');
      const initialized = await initializeGoogleApi();
      if (!initialized) {
        logError('Failed to initialize Google API');
        return;
      }
    }

    if (tokenClient) {
      log('Requesting access token...');
      // Check if we have a valid token
      const existingToken = window.gapi.client.getToken();
      log('Existing token:', existingToken ? 'yes' : 'no');
      
      try {
        if (existingToken === null) {
          // Request access token with consent
          log('Requesting new token with consent prompt');
          tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          // Token exists, try without consent first
          log('Requesting token refresh (no prompt)');
          tokenClient.requestAccessToken({ prompt: '' });
        }
      } catch (e) {
        logError('Error requesting access token:', e);
        toast({
          title: 'שגיאה בהתחברות',
          description: 'נסה שוב',
          variant: 'destructive',
        });
      }
    } else {
      logError('tokenClient is null');
    }
  }, [gapiInited, gisInited, tokenClient, initializeGoogleApi]);

  // Disconnect from Google Calendar
  const disconnect = useCallback(() => {
    const token = window.gapi?.client?.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
    clearTokenFromStorage();
    setIsConnected(false);
    setEvents([]);
    toast({
      title: 'התנתקת מ-Google Calendar',
    });
  }, []);

  // Fetch events from Google Calendar
  const fetchEvents = useCallback(async (
    timeMin: Date = new Date(),
    timeMax?: Date
  ): Promise<GoogleCalendarEvent[]> => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר ל-Google Calendar תחילה',
        variant: 'destructive',
      });
      return [];
    }

    try {
      setIsLoading(true);
      
      const calendarId = config?.calendarId || 'primary';
      const maxDate = timeMax || new Date(timeMin.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const response = await window.gapi.client.calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: maxDate.toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime',
      });

      const fetchedEvents = response.result.items || [];
      setEvents(fetchedEvents);
      return fetchedEvents;
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      toast({
        title: 'שגיאה בטעינת אירועים',
        description: error.message || 'נסה שוב',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, config]);

  // Create event in Google Calendar
  const createEvent = useCallback(async (event: GoogleCalendarEvent): Promise<GoogleCalendarEvent | null> => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר ל-Google Calendar תחילה',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsLoading(true);
      
      const calendarId = config?.calendarId || 'primary';
      const response = await window.gapi.client.calendar.events.insert({
        calendarId,
        resource: event,
      });

      const createdEvent = response.result;
      setEvents(prev => [...prev, createdEvent]);
      
      toast({
        title: 'אירוע נוצר',
        description: `"${event.summary}" נוסף ליומן Google`,
      });
      
      return createdEvent;
    } catch (error: any) {
      console.error('Failed to create event:', error);
      toast({
        title: 'שגיאה ביצירת אירוע',
        description: error.message || 'נסה שוב',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, config]);

  // Update event in Google Calendar
  const updateEvent = useCallback(async (
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent | null> => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר ל-Google Calendar תחילה',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsLoading(true);
      
      const calendarId = config?.calendarId || 'primary';
      const response = await window.gapi.client.calendar.events.patch({
        calendarId,
        eventId,
        resource: event,
      });

      const updatedEvent = response.result;
      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
      
      toast({
        title: 'אירוע עודכן',
        description: 'השינויים נשמרו ביומן Google',
      });
      
      return updatedEvent;
    } catch (error: any) {
      console.error('Failed to update event:', error);
      toast({
        title: 'שגיאה בעדכון אירוע',
        description: error.message || 'נסה שוב',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, config]);

  // Delete event from Google Calendar
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר ל-Google Calendar תחילה',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      const calendarId = config?.calendarId || 'primary';
      await window.gapi.client.calendar.events.delete({
        calendarId,
        eventId,
      });

      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      toast({
        title: 'אירוע נמחק',
        description: 'האירוע הוסר מיומן Google',
      });
      
      return true;
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      toast({
        title: 'שגיאה במחיקת אירוע',
        description: error.message || 'נסה שוב',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, config]);

  // Sync meetings to Google Calendar
  const syncMeetingsToGoogle = useCallback(async (meetings: any[]): Promise<number> => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר ל-Google Calendar תחילה',
        variant: 'destructive',
      });
      return 0;
    }

    let syncedCount = 0;
    
    for (const meeting of meetings) {
      const event: GoogleCalendarEvent = {
        summary: meeting.title,
        description: meeting.notes || '',
        start: {
          dateTime: meeting.start_time,
          timeZone: 'Asia/Jerusalem',
        },
        end: {
          dateTime: meeting.end_time,
          timeZone: 'Asia/Jerusalem',
        },
        location: meeting.location || '',
      };

      const result = await createEvent(event);
      if (result) syncedCount++;
    }

    if (syncedCount > 0) {
      toast({
        title: 'סנכרון הושלם',
        description: `${syncedCount} פגישות סונכרנו ל-Google Calendar`,
      });
    }

    return syncedCount;
  }, [isConnected, createEvent]);

  // Save config
  const saveConfig = useCallback((newConfig: GoogleCalendarConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    
    // Re-initialize with new config
    setGapiInited(false);
    setGisInited(false);
    setIsConnected(false);
  }, []);

  return {
    // State
    isConnected,
    isLoading,
    events,
    config,
    
    // Actions
    connect,
    disconnect,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    syncMeetingsToGoogle,
    saveConfig,
    initializeGoogleApi,
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
