// useTeamMembers - approved profiles for assignment pickers
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
}

async function fetchTeam(): Promise<TeamMember[]> {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id, full_name, email, is_active, approval_status")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data || [])
    .filter((p: any) => p.is_active !== false && (p.approval_status ?? "approved") === "approved")
    .map((p: any) => ({ id: p.id, full_name: p.full_name, email: p.email }));
}

export function useTeamMembers() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: fetchTeam,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  return { members: data, isLoading };
}
