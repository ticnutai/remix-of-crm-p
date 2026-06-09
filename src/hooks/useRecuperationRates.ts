// Hook to load recuperation daily rates from DB
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RecuperationRate {
  id: string;
  year: number;
  sector: string;
  daily_rate: number;
}

export function useRecuperationRates() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["payroll-recuperation-rates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payroll_recuperation_rates")
        .select("id, year, sector, daily_rate")
        .order("year", { ascending: false });
      if (error) throw error;
      return data as RecuperationRate[];
    },
    staleTime: 30 * 60 * 1000,
  });

  const getRate = (year: number, sector: string = "private"): number => {
    const exact = data.find((r) => r.year === year && r.sector === sector);
    if (exact) return Number(exact.daily_rate);
    const latest = data.find((r) => r.sector === sector);
    return latest ? Number(latest.daily_rate) : 471;
  };

  return { rates: data, isLoading, getRate };
}
