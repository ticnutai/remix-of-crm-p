// Hook for managing employee-client assignments
// Allows admins/managers to define which clients each employee can see

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  isTableAvailable,
  markTableUnavailable,
} from "@/lib/supabaseTableCheck";

interface EmployeeClientAssignment {
  id: string;
  employee_id: string;
  client_id: string;
  assigned_by: string | null;
  notes: string | null;
  created_at: string;
}

const TABLE_NAME = "employee_client_assignments";

export function useEmployeeClientAssignments() {
  const [assignments, setAssignments] = useState<EmployeeClientAssignment[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all assignments for a specific employee
  const fetchAssignments = useCallback(async (employeeId: string) => {
    if (!isTableAvailable(TABLE_NAME)) {
      setAssignments([]);
      return [];
    }

    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from(TABLE_NAME as any) as any)
        .select("*")
        .eq("employee_id", employeeId);

      if (error) {
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist")
        ) {
          markTableUnavailable(TABLE_NAME);
          setAssignments([]);
          return [];
        }
        console.error("Error fetching employee client assignments:", error);
        setAssignments([]);
        return [];
      }

      setAssignments(data || []);
      return data || [];
    } catch (err) {
      console.error("Error:", err);
      setAssignments([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all assignments (for all employees) — used for summary display
  const fetchAllAssignments = useCallback(async () => {
    if (!isTableAvailable(TABLE_NAME)) {
      return [];
    }

    try {
      const { data, error } = await (
        supabase.from(TABLE_NAME as any) as any
      ).select("*");

      if (error) {
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist")
        ) {
          markTableUnavailable(TABLE_NAME);
          return [];
        }
        console.error("Error fetching all assignments:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Error:", err);
      return [];
    }
  }, []);

  // Assign a client to an employee
  const assignClient = useCallback(
    async (
      employeeId: string,
      clientId: string,
      assignedBy?: string,
      notes?: string,
    ) => {
      if (!isTableAvailable(TABLE_NAME)) return false;

      try {
        const { error } = await (
          supabase.from(TABLE_NAME as any) as any
        ).insert({
          employee_id: employeeId,
          client_id: clientId,
          assigned_by: assignedBy || null,
          notes: notes || null,
        });

        if (error) {
          if (
            error.code === "42P01" ||
            error.message?.includes("does not exist")
          ) {
            markTableUnavailable(TABLE_NAME);
            return false;
          }
          // Ignore unique constraint violation (already assigned)
          if (error.code === "23505") return true;
          console.error("Error assigning client:", error);
          return false;
        }

        return true;
      } catch (err) {
        console.error("Error:", err);
        return false;
      }
    },
    [],
  );

  // Remove a client assignment from an employee
  const removeClient = useCallback(
    async (employeeId: string, clientId: string) => {
      if (!isTableAvailable(TABLE_NAME)) return false;

      try {
        const { error } = await (supabase.from(TABLE_NAME as any) as any)
          .delete()
          .eq("employee_id", employeeId)
          .eq("client_id", clientId);

        if (error) {
          if (
            error.code === "42P01" ||
            error.message?.includes("does not exist")
          ) {
            markTableUnavailable(TABLE_NAME);
            return false;
          }
          console.error("Error removing client assignment:", error);
          return false;
        }

        return true;
      } catch (err) {
        console.error("Error:", err);
        return false;
      }
    },
    [],
  );

  // Batch update: set exactly these client IDs for an employee
  const setClientAssignments = useCallback(
    async (employeeId: string, clientIds: string[], assignedBy?: string) => {
      if (!isTableAvailable(TABLE_NAME)) {
        toast({
          title: "טבלת הקצאת לקוחות לא זמינה",
          description: "יש להריץ את המיגרציה קודם",
          variant: "destructive",
        });
        return false;
      }

      try {
        // First delete all existing assignments for this employee
        const { error: deleteError } = await (
          supabase.from(TABLE_NAME as any) as any
        )
          .delete()
          .eq("employee_id", employeeId);

        if (deleteError) {
          if (
            deleteError.code === "42P01" ||
            deleteError.message?.includes("does not exist")
          ) {
            markTableUnavailable(TABLE_NAME);
            return false;
          }
          console.error("Error clearing assignments:", deleteError);
          return false;
        }

        // Then insert new assignments
        if (clientIds.length > 0) {
          const rows = clientIds.map((clientId) => ({
            employee_id: employeeId,
            client_id: clientId,
            assigned_by: assignedBy || null,
          }));

          const { error: insertError } = await (
            supabase.from(TABLE_NAME as any) as any
          ).insert(rows);

          if (insertError) {
            console.error("Error inserting assignments:", insertError);
            return false;
          }
        }

        // Refresh local state
        await fetchAssignments(employeeId);
        return true;
      } catch (err) {
        console.error("Error:", err);
        return false;
      }
    },
    [fetchAssignments],
  );

  return {
    assignments,
    isLoading,
    fetchAssignments,
    fetchAllAssignments,
    assignClient,
    removeClient,
    setClientAssignments,
  };
}
