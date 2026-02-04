// Google Sheets Integration Hook
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Types
export interface SheetData {
  range: string;
  majorDimension: 'ROWS' | 'COLUMNS';
  values: any[][];
}

export interface GoogleSheetsConfig {
  clientId: string;
  apiKey: string;
  spreadsheetId: string;
  sheetName?: string;
}

// Constants
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const STORAGE_KEY = 'google_sheets_config';

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

export function useGoogleSheets() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<GoogleSheetsConfig | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (e) {
        console.error('Failed to parse Google Sheets config:', e);
      }
    }
    
    // Also check for API keys from settings
    const apiKeys = localStorage.getItem('api_keys');
    if (apiKeys) {
      try {
        const keys = JSON.parse(apiKeys);
        if (keys.GOOGLE_CLIENT_ID && keys.GOOGLE_API_KEY && keys.GOOGLE_SHEETS_SPREADSHEET_ID) {
          setConfig({
            clientId: keys.GOOGLE_CLIENT_ID,
            apiKey: keys.GOOGLE_API_KEY,
            spreadsheetId: keys.GOOGLE_SHEETS_SPREADSHEET_ID,
            sheetName: keys.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1',
          });
        }
      } catch (e) {
        console.error('Failed to parse API keys:', e);
      }
    }
  }, []);

  // Initialize Google API
  const initializeGoogleApi = useCallback(async () => {
    if (!config?.clientId || !config?.apiKey) {
      toast({
        title: 'חסרים פרטי התחברות',
        description: 'יש להגדיר Client ID ו-API Key בהגדרות',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      // Load scripts
      await loadGoogleApiScript();
      await loadGisScript();
      
      // Initialize GAPI
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: config.apiKey,
              discoveryDocs: DISCOVERY_DOCS,
            });
            setGapiInited(true);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });

      // Initialize Token Client
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            console.error('OAuth error:', response);
            return;
          }
          setIsConnected(true);
          toast({
            title: 'מחובר ל-Google Sheets',
            description: 'הסנכרון פעיל',
          });
        },
      });
      
      setTokenClient(client);
      setGisInited(true);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
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

  // Connect to Google Sheets
  const connect = useCallback(async () => {
    if (!gapiInited || !gisInited) {
      const initialized = await initializeGoogleApi();
      if (!initialized) return;
    }

    if (tokenClient) {
      if (window.gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    }
  }, [gapiInited, gisInited, tokenClient, initializeGoogleApi]);

  // Disconnect from Google Sheets
  const disconnect = useCallback(() => {
    const token = window.gapi?.client?.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
    setIsConnected(false);
    toast({
      title: 'התנתקת מ-Google Sheets',
    });
  }, []);

  // Read data from sheet
  const readSheet = useCallback(async (
    range?: string
  ): Promise<any[][] | null> => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר ל-Google Sheets תחילה',
        variant: 'destructive',
      });
      return null;
    }

    if (!config?.spreadsheetId) {
      toast({
        title: 'חסר Spreadsheet ID',
        description: 'יש להגדיר את מזהה הגיליון בהגדרות',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsLoading(true);
      
      const sheetRange = range || `${config.sheetName || 'Sheet1'}!A:Z`;
      
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: sheetRange,
      });

      return response.result.values || [];
    } catch (error: any) {
      console.error('Failed to read sheet:', error);
      toast({
        title: 'שגיאה בקריאת נתונים',
        description: error.message || 'נסה שוב',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, config]);

  // Write data to sheet
  const writeSheet = useCallback(async (
    data: any[][],
    range?: string,
    append: boolean = false
  ): Promise<boolean> => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר ל-Google Sheets תחילה',
        variant: 'destructive',
      });
      return false;
    }

    if (!config?.spreadsheetId) {
      toast({
        title: 'חסר Spreadsheet ID',
        description: 'יש להגדיר את מזהה הגיליון בהגדרות',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      const sheetRange = range || `${config.sheetName || 'Sheet1'}!A1`;
      
      if (append) {
        await window.gapi.client.sheets.spreadsheets.values.append({
          spreadsheetId: config.spreadsheetId,
          range: sheetRange,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            values: data,
          },
        });
      } else {
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: config.spreadsheetId,
          range: sheetRange,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: data,
          },
        });
      }

      toast({
        title: 'נתונים נשמרו',
        description: `${data.length} שורות נכתבו ל-Google Sheets`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Failed to write to sheet:', error);
      toast({
        title: 'שגיאה בכתיבת נתונים',
        description: error.message || 'נסה שוב',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, config]);

  // Append row to sheet
  const appendRow = useCallback(async (row: any[]): Promise<boolean> => {
    return writeSheet([row], undefined, true);
  }, [writeSheet]);

  // Clear sheet
  const clearSheet = useCallback(async (range?: string): Promise<boolean> => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר ל-Google Sheets תחילה',
        variant: 'destructive',
      });
      return false;
    }

    if (!config?.spreadsheetId) {
      return false;
    }

    try {
      setIsLoading(true);
      
      const sheetRange = range || `${config.sheetName || 'Sheet1'}!A:Z`;
      
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: config.spreadsheetId,
        range: sheetRange,
      });

      toast({
        title: 'גיליון נוקה',
        description: 'כל הנתונים נמחקו',
      });
      
      return true;
    } catch (error: any) {
      console.error('Failed to clear sheet:', error);
      toast({
        title: 'שגיאה בניקוי גיליון',
        description: error.message || 'נסה שוב',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, config]);

  // Export table data to Google Sheets
  const exportTableToSheets = useCallback(async (
    headers: string[],
    rows: any[][],
    sheetName?: string
  ): Promise<boolean> => {
    const data = [headers, ...rows];
    
    if (sheetName) {
      // Create new sheet or use existing
      const range = `${sheetName}!A1`;
      return writeSheet(data, range);
    }
    
    return writeSheet(data);
  }, [writeSheet]);

  // Import data from Google Sheets
  const importFromSheets = useCallback(async (
    hasHeaders: boolean = true
  ): Promise<{ headers: string[]; rows: any[][] } | null> => {
    const data = await readSheet();
    if (!data || data.length === 0) {
      return null;
    }

    if (hasHeaders) {
      const [headers, ...rows] = data;
      return { headers, rows };
    }

    return { headers: [], rows: data };
  }, [readSheet]);

  // Sync clients to Google Sheets
  const syncClientsToSheets = useCallback(async (clients: any[]): Promise<boolean> => {
    const headers = ['מזהה', 'שם', 'אימייל', 'טלפון', 'סטטוס', 'תאריך יצירה'];
    const rows = clients.map(client => [
      client.id,
      client.name,
      client.email || '',
      client.phone || '',
      client.status || '',
      client.created_at || '',
    ]);

    return exportTableToSheets(headers, rows, 'לקוחות');
  }, [exportTableToSheets]);

  // Save config
  const saveConfig = useCallback((newConfig: GoogleSheetsConfig) => {
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
    config,
    
    // Actions
    connect,
    disconnect,
    readSheet,
    writeSheet,
    appendRow,
    clearSheet,
    exportTableToSheets,
    importFromSheets,
    syncClientsToSheets,
    saveConfig,
    initializeGoogleApi,
  };
}
