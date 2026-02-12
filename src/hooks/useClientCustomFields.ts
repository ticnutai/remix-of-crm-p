import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
// Use 'any' table reference since this table isn't in generated types yet
const customFieldsTable = () =>
  supabase.from("client_custom_field_definitions" as any);
export interface CustomFieldDefinition {
  id: string;
  user_id: string;
  field_key: string;
  label: string;
  field_type:
    | "text"
    | "number"
    | "date"
    | "select"
    | "email"
    | "phone"
    | "textarea";
  options: string[];
  placeholder: string;
  is_required: boolean;
  sort_order: number;
  section: string;
  created_at: string;
  updated_at: string;
}

export type CustomFieldValues = Record<string, string>;

export interface NewFieldDefinition {
  label: string;
  field_type: CustomFieldDefinition["field_type"];
  options?: string[];
  placeholder?: string;
  is_required?: boolean;
  section?: string;
}

/**
 * Hook for managing client custom field definitions and values.
 * Field definitions are per-user, field values are stored in clients.custom_data.
 */
export function useClientCustomFields() {
  const { user } = useAuth();
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a safe field_key from label
  const labelToKey = (label: string): string => {
    return (
      label
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "") || `field_${Date.now()}`
    );
  };

  // Fetch all custom field definitions for current user
  const fetchDefinitions = useCallback(async () => {
    // Get user from active session to avoid stale closure
    let userId = user?.id;
    if (!userId) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        userId = sessionData?.session?.user?.id;
      } catch (_e) {
        /* session check failed */
      }
    }
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await customFieldsTable()
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      setDefinitions(
        (data || []).map((d: any) => ({
          ...d,
          options: Array.isArray(d.options) ? d.options : [],
        })),
      );
    } catch (err) {
      console.error("Error fetching custom field definitions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  // Add a new field definition
  const addField = useCallback(
    async (
      field: NewFieldDefinition,
    ): Promise<CustomFieldDefinition | null> => {
      // Get user from active session to avoid stale closure
      let userId = user?.id;
      if (!userId) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          userId = sessionData?.session?.user?.id;
        } catch (_e) {
          /* session check failed */
        }
      }
      if (!userId) {
        console.error("addField: no user id available");
        toast({
          title: "שגיאה",
          description: "יש להתחבר מחדש",
          variant: "destructive",
        });
        return null;
      }

      const field_key = labelToKey(field.label);

      // Check for duplicate via DB to avoid stale local state
      try {
        const { data: dupCheck } = await customFieldsTable()
          .select("id")
          .eq("user_id", userId)
          .eq("field_key", field_key)
          .maybeSingle();

        if (dupCheck) {
          toast({
            title: "שגיאה",
            description: "שדה עם שם זהה כבר קיים",
            variant: "destructive",
          });
          return null;
        }
      } catch (_e) {
        // If duplicate check fails, continue and let the insert handle it
      }

      // Get max sort_order from current definitions
      const maxOrder =
        definitions.length > 0
          ? Math.max(...definitions.map((d) => d.sort_order))
          : 0;

      try {
        const { data, error } = await customFieldsTable()
          .insert({
            user_id: userId,
            field_key,
            label: field.label.trim(),
            field_type: field.field_type,
            options: field.options || [],
            placeholder: field.placeholder || "",
            is_required: field.is_required || false,
            section: field.section || "custom",
            sort_order: maxOrder + 1,
          })
          .select()
          .single();

        if (error) throw error;

        const record = data as any;
        const newDef: CustomFieldDefinition = {
          ...record,
          options: Array.isArray(record.options) ? record.options : [],
        };

        setDefinitions((prev) => [...prev, newDef]);
        toast({ title: "שדה נוסף בהצלחה" });
        return newDef;
      } catch (err) {
        console.error("Error adding custom field:", err);
        toast({
          title: "שגיאה",
          description: "לא ניתן להוסיף שדה",
          variant: "destructive",
        });
        return null;
      }
    },
    [user?.id, definitions],
  );

  // Update a field definition
  const updateField = useCallback(
    async (
      fieldId: string,
      updates: Partial<
        Pick<
          CustomFieldDefinition,
          | "label"
          | "field_type"
          | "options"
          | "placeholder"
          | "is_required"
          | "sort_order"
        >
      >,
    ): Promise<boolean> => {
      try {
        const { error } = await customFieldsTable()
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", fieldId);

        if (error) throw error;

        setDefinitions((prev) =>
          prev.map((d) => (d.id === fieldId ? { ...d, ...updates } : d)),
        );
        return true;
      } catch (err) {
        console.error("Error updating custom field:", err);
        toast({
          title: "שגיאה",
          description: "לא ניתן לעדכן שדה",
          variant: "destructive",
        });
        return false;
      }
    },
    [],
  );

  // Delete a field definition
  const deleteField = useCallback(async (fieldId: string): Promise<boolean> => {
    try {
      const { error } = await customFieldsTable().delete().eq("id", fieldId);

      if (error) throw error;

      setDefinitions((prev) => prev.filter((d) => d.id !== fieldId));
      toast({ title: "שדה נמחק" });
      return true;
    } catch (err) {
      console.error("Error deleting custom field:", err);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק שדה",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  // Parse custom_data from a client record into CustomFieldValues
  const parseCustomData = useCallback(
    (customData: any): CustomFieldValues => {
      if (!customData || typeof customData !== "object") return {};
      const values: CustomFieldValues = {};
      for (const def of definitions) {
        values[def.field_key] = customData[def.field_key]?.toString() || "";
      }
      return values;
    },
    [definitions],
  );

  // Build custom_data object to save back to client
  const buildCustomData = useCallback(
    (values: CustomFieldValues): Record<string, any> => {
      const data: Record<string, any> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== "") {
          data[key] = value;
        }
      }
      return data;
    },
    [],
  );

  return {
    definitions,
    isLoading,
    addField,
    updateField,
    deleteField,
    fetchDefinitions,
    parseCustomData,
    buildCustomData,
  };
}
