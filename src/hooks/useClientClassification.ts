// Client Classification Hook - Smart filtering and consultant assignment
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Consultant } from "./useConsultants";

export interface ClientConsultant {
  id: string;
  client_id: string;
  consultant_id: string;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "active" | "inactive" | "completed";
  notes: string | null;
  created_at: string;
  consultant?: Consultant;
}

export interface ClientClassification {
  classification: string | null; // VIP, רגיל, פוטנציאלי
  industry: string | null; // ענף
  source: string | null; // מקור הגעה
  tags: string[] | null;
}

export interface ClientFilter {
  consultantId?: string;
  classification?: string;
  industry?: string;
  source?: string;
  tag?: string;
  status?: string;
}

// Predefined classification options
export const CLASSIFICATION_OPTIONS = [
  { value: "vip", label: "VIP", color: "bg-yellow-500" },
  { value: "regular", label: "רגיל", color: "bg-blue-500" },
  { value: "potential", label: "פוטנציאלי", color: "bg-green-500" },
  { value: "inactive", label: "לא פעיל", color: "bg-gray-500" },
];

export const INDUSTRY_OPTIONS = [
  'נדל"ן',
  "בנייה",
  "הייטק",
  "פיננסים",
  "רפואה",
  "משפט",
  "חינוך",
  "מסעדנות",
  "קמעונאות",
  "יצור",
  "שירותים",
  "אחר",
];

export const SOURCE_OPTIONS = [
  "המלצה",
  "אינטרנט",
  "פרסום",
  "לקוח קיים",
  "רשתות חברתיות",
  "אירוע",
  "אחר",
];

export function useClientClassification() {
  const [clientConsultants, setClientConsultants] = useState<
    Record<string, ClientConsultant[]>
  >({});
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all consultants
  const fetchConsultants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("consultants")
        .select("*")
        .order("name");

      if (error) throw error;
      setConsultants(data || []);
    } catch (err) {
      console.error("Error fetching consultants:", err);
    }
  }, []);

  // Fetch client-consultant relationships
  const fetchClientConsultants = useCallback(async (clientIds?: string[]) => {
    try {
      let query = supabase.from("client_consultants").select(`
          *,
          consultant:consultants(*)
        `);

      if (clientIds && clientIds.length > 0) {
        query = query.in("client_id", clientIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by client_id
      const grouped: Record<string, ClientConsultant[]> = {};
      (data || []).forEach((item) => {
        if (!grouped[item.client_id]) {
          grouped[item.client_id] = [];
        }
        grouped[item.client_id].push(item as ClientConsultant);
      });

      setClientConsultants(grouped);
    } catch (err) {
      console.error("Error fetching client consultants:", err);
    }
  }, []);

  // Assign consultant to client
  const assignConsultant = useCallback(
    async (
      clientId: string,
      consultantId: string,
      role?: string,
      notes?: string,
    ) => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("client_consultants")
          .upsert(
            {
              client_id: clientId,
              consultant_id: consultantId,
              role,
              notes,
              status: "active",
            },
            {
              onConflict: "client_id,consultant_id",
            },
          )
          .select(
            `
          *,
          consultant:consultants(*)
        `,
          )
          .single();

        if (error) throw error;

        // Update local state
        setClientConsultants((prev) => ({
          ...prev,
          [clientId]: [
            ...(prev[clientId] || []).filter(
              (c) => c.consultant_id !== consultantId,
            ),
            data as ClientConsultant,
          ],
        }));

        toast({
          title: "✅ יועץ שויך",
          description: "היועץ שויך ללקוח בהצלחה",
        });

        return data;
      } catch (err: any) {
        console.error("Error assigning consultant:", err);
        toast({
          title: "❌ שגיאה",
          description: err.message || "שגיאה בשיוך היועץ",
          variant: "destructive",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Remove consultant from client
  const removeConsultant = useCallback(
    async (clientId: string, consultantId: string) => {
      try {
        setLoading(true);

        const { error } = await supabase
          .from("client_consultants")
          .delete()
          .eq("client_id", clientId)
          .eq("consultant_id", consultantId);

        if (error) throw error;

        // Update local state
        setClientConsultants((prev) => ({
          ...prev,
          [clientId]: (prev[clientId] || []).filter(
            (c) => c.consultant_id !== consultantId,
          ),
        }));

        toast({
          title: "✅ יועץ הוסר",
          description: "היועץ הוסר מהלקוח בהצלחה",
        });
      } catch (err: any) {
        console.error("Error removing consultant:", err);
        toast({
          title: "❌ שגיאה",
          description: err.message || "שגיאה בהסרת היועץ",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Update client classification
  const updateClientClassification = useCallback(
    async (clientId: string, classification: Partial<ClientClassification>) => {
      try {
        setLoading(true);

        const { error } = await supabase
          .from("clients")
          .update(classification)
          .eq("id", clientId);

        if (error) throw error;

        toast({
          title: "✅ סיווג עודכן",
          description: "פרטי הסיווג עודכנו בהצלחה",
        });

        return true;
      } catch (err: any) {
        console.error("Error updating classification:", err);
        toast({
          title: "❌ שגיאה",
          description: err.message || "שגיאה בעדכון הסיווג",
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Get clients by consultant
  const getClientsByConsultant = useCallback(async (consultantId: string) => {
    try {
      const { data, error } = await supabase
        .from("client_consultants")
        .select(
          `
          client_id,
          role,
          status,
          client:clients(*)
        `,
        )
        .eq("consultant_id", consultantId)
        .eq("status", "active");

      if (error) throw error;

      return (
        data?.map((item) => ({
          ...(item as any).client,
          consultantRole: item.role,
          consultantStatus: item.status,
        })) || []
      );
    } catch (err) {
      console.error("Error fetching clients by consultant:", err);
      return [];
    }
  }, []);

  // Get consultants for a client
  const getConsultantsForClient = useCallback(
    (clientId: string): ClientConsultant[] => {
      return clientConsultants[clientId] || [];
    },
    [clientConsultants],
  );

  // Filter clients by criteria
  const filterClients = useCallback(async (filter: ClientFilter) => {
    try {
      let query = supabase.from("clients").select("*");

      // Filter by classification
      if (filter.classification) {
        query = query.eq("classification", filter.classification);
      }

      // Filter by industry
      if (filter.industry) {
        query = query.eq("industry", filter.industry);
      }

      // Filter by source
      if (filter.source) {
        query = query.eq("source", filter.source);
      }

      // Filter by status
      if (filter.status) {
        query = query.eq("status", filter.status);
      }

      // Filter by tag
      if (filter.tag) {
        query = query.contains("tags", [filter.tag]);
      }

      const { data: clients, error } = await query;

      if (error) throw error;

      // If filtering by consultant, we need to join with client_consultants
      if (filter.consultantId) {
        const { data: consultantClients, error: ccError } = await supabase
          .from("client_consultants")
          .select("client_id")
          .eq("consultant_id", filter.consultantId)
          .eq("status", "active");

        if (ccError) throw ccError;

        const clientIds = new Set(
          consultantClients?.map((c) => c.client_id) || [],
        );
        return (clients || []).filter((c) => clientIds.has(c.id));
      }

      return clients || [];
    } catch (err) {
      console.error("Error filtering clients:", err);
      // Return null on error so the caller knows the filter failed
      // (as opposed to returning [] which looks like "no matches")
      return null;
    }
  }, []);

  // Initialize
  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);

  return {
    consultants,
    clientConsultants,
    loading,
    fetchConsultants,
    fetchClientConsultants,
    assignConsultant,
    removeConsultant,
    updateClientClassification,
    getClientsByConsultant,
    getConsultantsForClient,
    filterClients,
  };
}
