// AI assistant for HR/Payroll: validates data, suggests missing values, explains entitlements.
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AiSuggestion {
  field: string;
  label: string;
  suggested_value: any;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export interface AiAnalysis {
  summary: string;
  missing_critical: string[];
  suggestions: AiSuggestion[];
  rights_alerts: string[]; // e.g. "מגיעה הבראה - 5 ימים"
}

export function useHRAiAssist() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /** Analyze an employee profile and return missing/suggested data + rights alerts */
  const analyzeEmployee = async (
    employee: Record<string, any>,
  ): Promise<AiAnalysis | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("hr-ai-assist", {
        body: { action: "analyze_employee", employee },
      });
      if (error) throw error;
      return data as AiAnalysis;
    } catch (e: any) {
      toast({
        title: "שגיאה בניתוח AI",
        description: e.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /** Free-form Q&A about Israeli payroll law */
  const askPayrollQuestion = async (question: string): Promise<string | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("hr-ai-assist", {
        body: { action: "payroll_question", question },
      });
      if (error) throw error;
      return data.answer as string;
    } catch (e: any) {
      toast({
        title: "שגיאה",
        description: e.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeEmployee, askPayrollQuestion, loading };
}
