// Consultants Hook - Manage consultants (יועצים, מהנדסים, אדריכלים)
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Consultant {
  id: string;
  name: string;
  profession: string; // יועץ, מהנדס, אדריכל
  license_number: string | null;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  specialty: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskConsultant {
  id: string;
  task_id: string;
  consultant_id: string;
  keyword: string;
  keyword_context: string | null;
  notes: string | null;
  created_at: string;
  consultant?: Consultant;
}

// Keywords to detect in task titles
export const CONSULTANT_KEYWORDS = [
  "יועץ",
  "מהנדס",
  "אדריכל",
  "מודד",
  "יועץ ניקוז",
  "יועץ אקוסטיקה",
];

// Check if a task title contains consultant keywords
export function detectConsultantKeywords(
  title: string,
): { keyword: string; context: string }[] {
  const results: { keyword: string; context: string }[] = [];

  for (const keyword of CONSULTANT_KEYWORDS) {
    const regex = new RegExp(`(${keyword}\\s*\\S*)`, "gi");
    const matches = title.match(regex);
    if (matches) {
      matches.forEach((match) => {
        results.push({
          keyword,
          context: match.trim(),
        });
      });
    }
  }

  return results;
}

export function useConsultants() {
  const { toast } = useToast();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all consultants
  const loadConsultants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("consultants")
        .select("*")
        .order("name");

      if (error) throw error;
      setConsultants((data as Consultant[]) || []);
    } catch (error) {
      console.error("Error loading consultants:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConsultants();
  }, [loadConsultants]);

  // Add a new consultant
  const addConsultant = async (
    consultant: Omit<Consultant, "id" | "created_at" | "updated_at">,
  ) => {
    try {
      const { data, error } = await supabase
        .from("consultants")
        .insert(consultant)
        .select()
        .single();

      if (error) throw error;

      setConsultants((prev) =>
        [...prev, data as Consultant].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      toast({
        title: "הצלחה",
        description: `${consultant.profession} "${consultant.name}" נוסף בהצלחה`,
      });
      return data as Consultant;
    } catch (error) {
      console.error("Error adding consultant:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף יועץ",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update consultant
  const updateConsultant = async (id: string, updates: Partial<Consultant>) => {
    try {
      const { data, error } = await supabase
        .from("consultants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setConsultants((prev) =>
        prev.map((c) => (c.id === id ? (data as Consultant) : c)),
      );
      toast({
        title: "הצלחה",
        description: "פרטי היועץ עודכנו",
      });
      return data as Consultant;
    } catch (error) {
      console.error("Error updating consultant:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן יועץ",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete consultant
  const deleteConsultant = async (id: string) => {
    try {
      const { error } = await supabase
        .from("consultants")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setConsultants((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "הצלחה",
        description: "היועץ נמחק",
      });
    } catch (error) {
      console.error("Error deleting consultant:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק יועץ",
        variant: "destructive",
      });
    }
  };

  return {
    consultants,
    loading,
    addConsultant,
    updateConsultant,
    deleteConsultant,
    refresh: loadConsultants,
  };
}

// Hook for managing task-consultant relationships
export function useTaskConsultants(taskId: string) {
  const { toast } = useToast();
  const [taskConsultants, setTaskConsultants] = useState<TaskConsultant[]>([]);
  const [loading, setLoading] = useState(true);

  // Load consultants for this task
  const loadTaskConsultants = useCallback(async () => {
    if (!taskId) return;

    try {
      const { data, error } = await supabase
        .from("task_consultants")
        .select(
          `
          *,
          consultant:consultants(*)
        `,
        )
        .eq("task_id", taskId);

      if (error) throw error;
      setTaskConsultants((data as TaskConsultant[]) || []);
    } catch (error) {
      console.error("Error loading task consultants:", error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadTaskConsultants();
  }, [loadTaskConsultants]);

  // Link consultant to task
  const linkConsultant = async (
    consultantId: string,
    keyword: string,
    keywordContext?: string,
  ) => {
    try {
      const { data, error } = await supabase
        .from("task_consultants")
        .insert({
          task_id: taskId,
          consultant_id: consultantId,
          keyword,
          keyword_context: keywordContext,
        })
        .select(
          `
          *,
          consultant:consultants(*)
        `,
        )
        .single();

      if (error) throw error;

      setTaskConsultants((prev) => [...prev, data as TaskConsultant]);
      toast({
        title: "הצלחה",
        description: "היועץ קושר למשימה",
      });
      return data as TaskConsultant;
    } catch (error) {
      console.error("Error linking consultant:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לקשר יועץ למשימה",
        variant: "destructive",
      });
      return null;
    }
  };

  // Unlink consultant from task
  const unlinkConsultant = async (taskConsultantId: string) => {
    try {
      const { error } = await supabase
        .from("task_consultants")
        .delete()
        .eq("id", taskConsultantId);

      if (error) throw error;

      setTaskConsultants((prev) =>
        prev.filter((tc) => tc.id !== taskConsultantId),
      );
      toast({
        title: "הצלחה",
        description: "היועץ הוסר מהמשימה",
      });
    } catch (error) {
      console.error("Error unlinking consultant:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להסיר יועץ",
        variant: "destructive",
      });
    }
  };

  // Get consultant for a specific keyword
  const getConsultantForKeyword = (
    keyword: string,
  ): TaskConsultant | undefined => {
    return taskConsultants.find(
      (tc) =>
        tc.keyword.toLowerCase() === keyword.toLowerCase() ||
        tc.keyword_context?.toLowerCase().includes(keyword.toLowerCase()),
    );
  };

  return {
    taskConsultants,
    loading,
    linkConsultant,
    unlinkConsultant,
    getConsultantForKeyword,
    refresh: loadTaskConsultants,
  };
}
