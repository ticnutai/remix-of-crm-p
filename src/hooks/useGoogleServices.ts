// Unified hook for all Google services
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type GoogleService =
  | "calendar"
  | "gmail"
  | "drive"
  | "contacts"
  | "sheets";

export interface GoogleAccountWithScopes {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  scopes: string[];
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

const SCOPES_MAP: Record<GoogleService, string[]> = {
  calendar: ["https://www.googleapis.com/auth/calendar"],
  gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
  ],
  drive: [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
  contacts: ["https://www.googleapis.com/auth/contacts.readonly"],
  sheets: ["https://www.googleapis.com/auth/spreadsheets"],
};

const DEFAULT_CLIENT_ID =
  "203713636858-0bn66n8rd2gpkkvmhg233hs6ufeaml2s.apps.googleusercontent.com";
const TOKEN_STORAGE_KEY = "google_services_token";
const TOKEN_EXPIRY_KEY = "google_services_token_expiry";
const EMAIL_STORAGE_KEY = "google_services_email";

// Token storage utilities
const saveTokenToStorage = (
  token: string,
  expiresIn: number,
  email?: string,
) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  // Save expiry time (current time + expires_in seconds - 5 minute buffer)
  const expiryTime = Date.now() + (expiresIn - 300) * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  // Save email for future silent re-auth
  if (email) {
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
  }
};

const loadTokenFromStorage = (): string | null => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) return null;

  // Check if token is still valid
  if (Date.now() > parseInt(expiry)) {
    // Token expired, clear it but keep the email for hint
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  }

  return token;
};

const loadSavedEmail = (): string | null => {
  return localStorage.getItem(EMAIL_STORAGE_KEY);
};

const clearTokenFromStorage = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  // Keep email for next silent re-auth
};

// Load Google Identity Services script
const loadGisScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
};

// Get access token for a specific service
export function useGoogleServices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    loadTokenFromStorage(),
  );
  const [isConnected, setIsConnected] = useState(
    () => !!loadTokenFromStorage(),
  );

  // Check token validity on mount and when user changes
  // Also try silent re-auth if token expired but we have saved email
  useEffect(() => {
    const savedToken = loadTokenFromStorage();
    if (savedToken) {
      setAccessToken(savedToken);
      setIsConnected(true);
    } else {
      setAccessToken(null);
      setIsConnected(false);

      // If we have a saved email, try silent re-auth on mount
      const savedEmail = loadSavedEmail();
      if (savedEmail && user) {
        // Auto-reconnect silently in the background
        (async () => {
          try {
            await loadGisScript();
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: DEFAULT_CLIENT_ID,
              scope: [
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
                ...SCOPES_MAP.gmail,
              ].join(" "),
              callback: async (response: any) => {
                if (response.error) {
                  console.log(
                    "[GoogleServices] Silent re-auth failed, user will need to click connect",
                  );
                  return;
                }
                const expiresIn = response.expires_in || 3600;
                saveTokenToStorage(
                  response.access_token,
                  expiresIn,
                  savedEmail,
                );
                setAccessToken(response.access_token);
                setIsConnected(true);
                console.log(
                  "[GoogleServices] Silent re-auth successful for",
                  savedEmail,
                );
              },
            });
            // Try silent auth with login_hint
            tokenClient.requestAccessToken({
              prompt: "",
              login_hint: savedEmail,
            });
          } catch (e) {
            console.log("[GoogleServices] Silent re-auth setup failed:", e);
          }
        })();
      }
    }
  }, [user]);

  const getAccessToken = useCallback(
    async (
      services: GoogleService[],
      forceRefresh = false,
    ): Promise<string | null> => {
      if (!user) {
        toast({
          title: "שגיאה",
          description: "יש להתחבר למערכת תחילה",
          variant: "destructive",
        });
        return null;
      }

      // Try to use saved token first (unless force refresh)
      if (!forceRefresh) {
        const savedToken = loadTokenFromStorage();
        if (savedToken) {
          setAccessToken(savedToken);
          setIsConnected(true);
          return savedToken;
        }
      }

      setIsLoading(true);
      try {
        await loadGisScript();

        // Build scopes from requested services
        const requestedScopes = [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
          ...services.flatMap((s) => SCOPES_MAP[s]),
        ].join(" ");

        return new Promise((resolve) => {
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: DEFAULT_CLIENT_ID,
            scope: requestedScopes,
            callback: async (response: any) => {
              if (response.error) {
                console.error("OAuth error:", response);
                toast({
                  title: "שגיאה בהתחברות",
                  description: "לא ניתן להתחבר לחשבון Google",
                  variant: "destructive",
                });
                setIsLoading(false);
                setIsConnected(false);
                resolve(null);
                return;
              }

              // Get user email for future silent re-auth
              let userEmail: string | undefined;
              try {
                const userInfoResponse = await fetch(
                  "https://www.googleapis.com/oauth2/v2/userinfo",
                  {
                    headers: {
                      Authorization: `Bearer ${response.access_token}`,
                    },
                  },
                );
                if (userInfoResponse.ok) {
                  const userInfo = await userInfoResponse.json();
                  userEmail = userInfo.email;
                }
              } catch (e) {
                console.log("[GoogleServices] Could not fetch user email:", e);
              }

              // Save token to localStorage (with email for future silent re-auth)
              const expiresIn = response.expires_in || 3600; // Default 1 hour
              saveTokenToStorage(response.access_token, expiresIn, userEmail);

              setAccessToken(response.access_token);
              setIsConnected(true);
              setIsLoading(false);

              toast({
                title: "התחברת בהצלחה",
                description: userEmail
                  ? `מחובר כ-${userEmail}`
                  : "חשבון Google מחובר",
              });

              resolve(response.access_token);
            },
          });

          // Use login_hint with saved email for seamless re-auth (no account chooser)
          const savedEmail = loadSavedEmail();
          if (savedEmail) {
            tokenClient.requestAccessToken({
              prompt: "",
              login_hint: savedEmail,
            });
          } else {
            // First time - will show account chooser
            tokenClient.requestAccessToken({ prompt: "" });
          }
        });
      } catch (error: any) {
        console.error("Error getting access token:", error);
        toast({
          title: "שגיאה",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return null;
      }
    },
    [user, toast],
  );

  const disconnect = useCallback(() => {
    clearTokenFromStorage();
    setAccessToken(null);
    setIsConnected(false);
    toast({
      title: "התנתקת",
      description: "חשבון Google נותק",
    });
  }, [toast]);

  return {
    isLoading,
    isConnected,
    accessToken,
    getAccessToken,
    disconnect,
  };
}
