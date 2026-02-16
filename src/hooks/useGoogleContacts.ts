// Hook for Google Contacts integration
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGoogleServices } from "./useGoogleServices";

export interface GoogleContact {
  resourceName: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  photoUrl?: string;
}

export function useGoogleContacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getAccessToken, isLoading: isGettingToken } = useGoogleServices();
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch contacts
  const fetchContacts = useCallback(
    async (pageSize: number = 100) => {
      if (!user) return [];

      setIsLoading(true);
      try {
        const token = await getAccessToken(["contacts"]);
        if (!token) {
          console.warn('[GoogleContacts] No token returned from getAccessToken');
          setIsLoading(false);
          return [];
        }

        // Debug: log token info and scopes
        const savedScopes = localStorage.getItem('google_services_scopes') || '';
        console.log('[GoogleContacts] Token obtained. Saved scopes:', savedScopes);
        console.log('[GoogleContacts] Has contacts.readonly:', savedScopes.includes('contacts.readonly'));

        // Debug: validate token with tokeninfo endpoint
        try {
          const tokenInfoResp = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
          const tokenInfo = await tokenInfoResp.json();
          console.log('[GoogleContacts] Token info:', tokenInfo);
          console.log('[GoogleContacts] Token scopes:', tokenInfo.scope);
          if (tokenInfo.scope && !tokenInfo.scope.includes('contacts.readonly')) {
            console.warn('[GoogleContacts] ⚠️ Token does NOT have contacts.readonly scope!');
          }
        } catch (e) {
          console.log('[GoogleContacts] Could not validate token:', e);
        }

        console.log('[GoogleContacts] Fetching People API...');
        const response = await fetch(
          `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations,photos&pageSize=${pageSize}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        console.log('[GoogleContacts] People API response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData?.error?.message || `HTTP ${response.status}`;
          const errorDetails = errorData?.error?.details || [];
          console.error("[GoogleContacts] People API error FULL response:", JSON.stringify(errorData, null, 2));
          console.error("[GoogleContacts] Error details:", errorDetails);

          // Check if it's a "API not enabled" error
          const isApiNotEnabled = errorMsg.includes('not been used') || 
            errorMsg.includes('has not been enabled') ||
            errorMsg.includes('PERMISSION_DENIED') ||
            errorData?.error?.status === 'PERMISSION_DENIED';

          toast({
            title: "שגיאה בטעינת אנשי קשר",
            description:
              isApiNotEnabled
                ? "People API לא מופעל! יש להפעיל אותו ב-Google Cloud Console → APIs & Services → Enable APIs → חפש People API → Enable"
                : response.status === 403
                  ? `אין הרשאה: ${errorMsg}`
                  : errorMsg,
            variant: "destructive",
          });
          setIsLoading(false);
          return [];
        }

        const data = await response.json();

        const formattedContacts: GoogleContact[] = (data.connections || []).map(
          (person: any) => ({
            resourceName: person.resourceName,
            name: person.names?.[0]?.displayName || "ללא שם",
            email: person.emailAddresses?.[0]?.value,
            phone: person.phoneNumbers?.[0]?.value,
            company: person.organizations?.[0]?.name,
            photoUrl: person.photos?.[0]?.url,
          }),
        );

        setContacts(formattedContacts);
        setIsLoading(false);

        if (formattedContacts.length === 0) {
          toast({
            title: "לא נמצאו אנשי קשר",
            description: "חשבון Google זה לא מכיל אנשי קשר, או שהם לא שותפו.",
          });
        } else {
          toast({
            title: `נטענו ${formattedContacts.length} אנשי קשר`,
          });
        }

        return formattedContacts;
      } catch (error: any) {
        console.error("Error fetching contacts:", error);
        toast({
          title: "שגיאה בטעינת אנשי קשר",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return [];
      }
    },
    [user, getAccessToken, toast],
  );

  // Import contact as client
  const importContactAsClient = useCallback(
    async (contact: GoogleContact): Promise<string | null> => {
      if (!user) return null;

      setIsImporting(true);
      try {
        // Check if client with same email already exists
        if (contact.email) {
          const { data: existing } = await supabase
            .from("clients")
            .select("id")
            .eq("email", contact.email)
            .maybeSingle();

          if (existing) {
            toast({
              title: "לקוח קיים",
              description: `לקוח עם המייל ${contact.email} כבר קיים במערכת`,
              variant: "destructive",
            });
            setIsImporting(false);
            return existing.id;
          }
        }

        // Create new client
        const { data, error } = await supabase
          .from("clients")
          .insert({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            source: "google_contacts",
            status: "active",
          })
          .select("id")
          .single();

        if (error) throw error;

        // Track sync
        await supabase.from("google_contacts_sync").insert({
          user_id: user.id,
          google_contact_id: contact.resourceName,
          client_id: data.id,
          sync_status: "synced",
        });

        toast({
          title: "איש הקשר יובא בהצלחה",
          description: contact.name,
        });

        setIsImporting(false);
        return data.id;
      } catch (error: any) {
        console.error("Error importing contact:", error);
        toast({
          title: "שגיאה בייבוא איש הקשר",
          description: error.message,
          variant: "destructive",
        });
        setIsImporting(false);
        return null;
      }
    },
    [user, toast],
  );

  // Import multiple contacts
  const importMultipleContacts = useCallback(
    async (contactsToImport: GoogleContact[]): Promise<number> => {
      if (!user || contactsToImport.length === 0) return 0;

      setIsImporting(true);
      let importedCount = 0;

      try {
        for (const contact of contactsToImport) {
          const result = await importContactAsClient(contact);
          if (result) {
            importedCount++;
          }
        }

        toast({
          title: "הייבוא הושלם",
          description: `יובאו ${importedCount} אנשי קשר`,
        });

        setIsImporting(false);
        return importedCount;
      } catch (error: any) {
        console.error("Error importing contacts:", error);
        setIsImporting(false);
        return importedCount;
      }
    },
    [user, importContactAsClient, toast],
  );

  // Search contacts
  const searchContacts = useCallback(
    (query: string): GoogleContact[] => {
      if (!query) return contacts;

      const lowerQuery = query.toLowerCase();
      return contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(lowerQuery) ||
          contact.email?.toLowerCase().includes(lowerQuery) ||
          contact.company?.toLowerCase().includes(lowerQuery),
      );
    },
    [contacts],
  );

  return {
    contacts,
    isLoading: isLoading || isGettingToken,
    isImporting,
    fetchContacts,
    importContactAsClient,
    importMultipleContacts,
    searchContacts,
  };
}
