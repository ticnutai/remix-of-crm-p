// Hook לניהול צדדים לחוזה (מזמינים מרובים)
// מערכת תמיכה במספר מזמינים/ספקים/ערבים לחוזה

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// Types
// ============================================================================

export type PartyType = 'orderer' | 'provider' | 'guarantor' | 'witness';

export interface ContractParty {
  id: string;
  contract_id: string;
  party_type: PartyType;
  name: string;
  id_number?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gush?: string | null;
  helka?: string | null;
  migrash?: string | null;
  display_order: number;
  is_primary: boolean;
  linked_client_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractPartyFormData {
  party_type: PartyType;
  name: string;
  id_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  gush?: string;
  helka?: string;
  migrash?: string;
  display_order?: number;
  is_primary?: boolean;
  linked_client_id?: string;
}

// תרגום סוגי צדדים
export const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  orderer: 'מזמין',
  provider: 'ספק/קבלן',
  guarantor: 'ערב',
  witness: 'עד',
};

// ============================================================================
// Hook
// ============================================================================

export function useContractParties(contractId?: string) {
  const queryClient = useQueryClient();

  // שליפת צדדים לחוזה
  const { data: parties = [], isLoading, refetch } = useQuery({
    queryKey: ['contract-parties', contractId],
    queryFn: async () => {
      if (!contractId) return [];
      
      // @ts-ignore - טבלה חדשה
      const { data, error } = await (supabase as any)
        .from('contract_parties')
        .select('*')
        .eq('contract_id', contractId)
        .order('display_order');
      
      if (error) throw error;
      return (data || []) as ContractParty[];
    },
    enabled: !!contractId,
  });

  // הוספת צד
  const addParty = useMutation({
    mutationFn: async (data: ContractPartyFormData & { contract_id: string }) => {
      // קבלת סדר הבא
      const maxOrder = parties.reduce((max, p) => Math.max(max, p.display_order), 0);
      
      // @ts-ignore
      const { data: result, error } = await (supabase as any)
        .from('contract_parties')
        .insert([{
          ...data,
          display_order: data.display_order ?? maxOrder + 1,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-parties', contractId] });
      toast({ title: 'הצד נוסף בהצלחה' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'שגיאה בהוספת צד', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // עדכון צד
  const updateParty = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContractParty> & { id: string }) => {
      const updateData = { ...updates };
      delete (updateData as any).id;
      delete (updateData as any).created_at;
      delete (updateData as any).updated_at;
      
      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from('contract_parties')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-parties', contractId] });
      toast({ title: 'הצד עודכן' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'שגיאה בעדכון צד', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // מחיקת צד
  const deleteParty = useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from('contract_parties')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-parties', contractId] });
      toast({ title: 'הצד הוסר' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'שגיאה בהסרת צד', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // שינוי סדר
  const reorderParties = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        display_order: index + 1,
      }));
      
      for (const update of updates) {
        // @ts-ignore
        await (supabase as any)
          .from('contract_parties')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-parties', contractId] });
    },
  });

  // יצירת צדדים מלקוח
  const createFromClient = useMutation({
    mutationFn: async ({ 
      contract_id, 
      client 
    }: { 
      contract_id: string; 
      client: {
        id: string;
        name: string;
        id_number?: string | null;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        gush?: string | null;
        helka?: string | null;
        migrash?: string | null;
      };
    }) => {
      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from('contract_parties')
        .insert([{
          contract_id,
          party_type: 'orderer',
          name: client.name,
          id_number: client.id_number,
          phone: client.phone,
          email: client.email,
          address: client.address,
          gush: client.gush,
          helka: client.helka,
          migrash: client.migrash,
          display_order: 1,
          is_primary: true,
          linked_client_id: client.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-parties', contractId] });
    },
  });

  // סינון לפי סוג
  const orderers = parties.filter(p => p.party_type === 'orderer');
  const providers = parties.filter(p => p.party_type === 'provider');
  const guarantors = parties.filter(p => p.party_type === 'guarantor');
  const witnesses = parties.filter(p => p.party_type === 'witness');

  return {
    parties,
    orderers,
    providers,
    guarantors,
    witnesses,
    isLoading,
    refetch,
    addParty,
    updateParty,
    deleteParty,
    reorderParties,
    createFromClient,
  };
}

// ============================================================================
// פונקציות עזר
// ============================================================================

// יצירת HTML עבור רשימת צדדים
export function generatePartiesHtml(
  parties: ContractParty[], 
  type: PartyType = 'orderer'
): string {
  const filtered = parties.filter(p => p.party_type === type);
  
  if (filtered.length === 0) return '';
  
  return filtered.map(p => {
    let html = `<div style="margin-bottom: 10px;">`;
    html += `<p><strong>${p.name}</strong>`;
    if (p.id_number) html += ` | ת.ז.: ${p.id_number}`;
    if (p.phone) html += ` | טלפון: ${p.phone}`;
    html += '</p>';
    if (p.address) html += `<p>כתובת: ${p.address}</p>`;
    if (p.gush || p.helka || p.migrash) {
      html += `<p>גוש: ${p.gush || '-'} | חלקה: ${p.helka || '-'} | מגרש: ${p.migrash || '-'}</p>`;
    }
    html += '</div>';
    return html;
  }).join('');
}

// יצירת HTML עבור חתימות
export function generateSignaturesHtml(
  parties: ContractParty[], 
  type: PartyType = 'orderer'
): string {
  const filtered = parties.filter(p => p.party_type === type);
  
  if (filtered.length === 0) return '';
  
  return filtered.map(p => `
    <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <p>שם: <strong>${p.name}</strong></p>
      <p>ת.ז.: ${p.id_number || '_____________'}</p>
      <p style="margin-top: 15px;">חתימה: _______________________</p>
      <p>תאריך: _______________________</p>
    </div>
  `).join('');
}
