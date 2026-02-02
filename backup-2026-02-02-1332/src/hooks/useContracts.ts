import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Contract {
  id: string;
  contract_number: string;
  quote_id?: string;
  client_id: string;
  project_id?: string;
  title: string;
  description?: string;
  contract_type: 'fixed_price' | 'hourly' | 'milestone' | 'retainer';
  contract_value: number;
  currency: string;
  start_date: string;
  end_date?: string;
  signed_date: string;
  payment_terms?: string;
  payment_method?: string;
  advance_payment_required: boolean;
  advance_payment_amount?: number;
  advance_payment_status: 'pending' | 'received' | 'waived';
  status: 'draft' | 'active' | 'completed' | 'terminated' | 'expired';
  termination_reason?: string;
  terminated_at?: string;
  contract_pdf_url?: string;
  signed_contract_pdf_url?: string;
  signature_data?: string;
  signed_by_client?: string;
  signed_by_company?: string;
  terms_and_conditions?: string;
  special_clauses?: string;
  notes?: string;
  tags?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  clients?: { name: string; email?: string; phone?: string };
  projects?: { name: string };
  quotes?: { quote_number: string; title: string };
}

export interface PaymentSchedule {
  id: string;
  contract_id: string;
  invoice_id?: string;
  payment_number: number;
  description?: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  paid_date?: string;
  paid_amount: number;
  reminder_sent_at?: string;
  reminder_count: number;
  next_reminder_date?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractFormData {
  client_id: string;
  project_id?: string;
  quote_id?: string;
  template_id?: string;
  title: string;
  description?: string;
  contract_type: 'fixed_price' | 'hourly' | 'milestone' | 'retainer';
  contract_value: number;
  start_date: string;
  end_date?: string;
  signed_date: string;
  payment_terms?: string;
  payment_method?: string;
  advance_payment_required?: boolean;
  advance_payment_amount?: number;
  terms_and_conditions?: string;
  special_clauses?: string;
  notes?: string;
  // שלבי תשלום מתבנית
  generated_payment_schedule?: Array<{
    payment_number: number;
    description: string;
    amount: number;
    due_date: string;
  }>;
}

export interface PaymentScheduleFormData {
  contract_id: string;
  payments: {
    payment_number: number;
    description?: string;
    amount: number;
    due_date: string;
  }[];
}

export function useContracts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all contracts
  const { data: contracts = [], isLoading, refetch } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          clients:client_id(name, email, phone),
          projects:project_id(name),
          quotes:quote_id(quote_number, title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!user,
  });

  // Fetch payment schedules for a contract
  const usePaymentSchedules = (contractId: string) => {
    return useQuery({
      queryKey: ['payment-schedules', contractId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('payment_schedules')
          .select('*')
          .eq('contract_id', contractId)
          .order('payment_number', { ascending: true });
        
        if (error) throw error;
        return data as PaymentSchedule[];
      },
      enabled: !!contractId,
    });
  };

  // Generate contract number
  const generateContractNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`);
    
    const number = (count || 0) + 1;
    return `C${year}-${String(number).padStart(4, '0')}`;
  };

  // Create contract
  const createContract = useMutation({
    mutationFn: async (formData: ContractFormData) => {
      if (!user) throw new Error('Not authenticated');
      
      const contractNumber = await generateContractNumber();

      const { data, error } = await supabase
        .from('contracts')
        .insert([{
          contract_number: contractNumber,
          client_id: formData.client_id,
          project_id: formData.project_id || null,
          quote_id: formData.quote_id || null,
          template_id: formData.template_id || null,
          title: formData.title,
          description: formData.description,
          contract_type: formData.contract_type,
          contract_value: formData.contract_value,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          signed_date: formData.signed_date,
          payment_terms: formData.payment_terms,
          payment_method: formData.payment_method || 'bank_transfer',
          advance_payment_required: formData.advance_payment_required || false,
          advance_payment_amount: formData.advance_payment_amount || null,
          terms_and_conditions: formData.terms_and_conditions,
          special_clauses: formData.special_clauses,
          notes: formData.notes,
          created_by: user.id,
          status: 'active',
        }])
        .select()
        .single();
      
      if (error) throw error;

      // יצירת שלבי תשלום מתבנית אם קיימים
      if (formData.generated_payment_schedule && formData.generated_payment_schedule.length > 0) {
        const paymentsToInsert = formData.generated_payment_schedule.map(p => ({
          contract_id: data.id,
          payment_number: p.payment_number,
          description: p.description,
          amount: p.amount,
          due_date: p.due_date,
          status: 'pending',
          paid_amount: 0,
          reminder_count: 0,
        }));

        await supabase
          .from('payment_schedules')
          .insert(paymentsToInsert);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', data.id] });
      toast({ title: 'החוזה נוצר בהצלחה' });
    },
    onError: (error: Error) => {
      toast({ title: 'שגיאה ביצירת חוזה', description: error.message, variant: 'destructive' });
    },
  });

  // Update contract
  const updateContract = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      delete updateData.id;
      delete updateData.clients;
      delete updateData.projects;
      delete updateData.quotes;

      const { data, error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'החוזה עודכן' });
    },
    onError: (error: Error) => {
      toast({ title: 'שגיאה בעדכון חוזה', description: error.message, variant: 'destructive' });
    },
  });

  // Delete contract
  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'החוזה נמחק' });
    },
    onError: (error: Error) => {
      toast({ title: 'שגיאה במחיקת חוזה', description: error.message, variant: 'destructive' });
    },
  });

  // Create payment schedule
  const createPaymentSchedule = useMutation({
    mutationFn: async (formData: PaymentScheduleFormData) => {
      const paymentsToInsert = formData.payments.map(p => ({
        contract_id: formData.contract_id,
        payment_number: p.payment_number,
        description: p.description,
        amount: p.amount,
        due_date: p.due_date,
        status: 'pending',
        paid_amount: 0,
        reminder_count: 0,
      }));

      const { data, error } = await supabase
        .from('payment_schedules')
        .insert(paymentsToInsert)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', variables.contract_id] });
      toast({ title: 'לוח התשלומים נוצר בהצלחה' });
    },
    onError: (error: Error) => {
      toast({ title: 'שגיאה ביצירת לוח תשלומים', description: error.message, variant: 'destructive' });
    },
  });

  // Update payment status
  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, status, paid_amount, paid_date }: {
      id: string;
      status: PaymentSchedule['status'];
      paid_amount?: number;
      paid_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .update({ 
          status, 
          paid_amount: paid_amount || 0,
          paid_date: paid_date || null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', data.contract_id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'סטטוס התשלום עודכן' });
    },
  });

  // Convert quote to contract
  const convertQuoteToContract = useMutation({
    mutationFn: async ({ quoteId, contractData }: { 
      quoteId: string; 
      contractData: Omit<ContractFormData, 'quote_id'> 
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const contractNumber = await generateContractNumber();

      // Create the contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert([{
          contract_number: contractNumber,
          quote_id: quoteId,
          client_id: contractData.client_id,
          project_id: contractData.project_id || null,
          title: contractData.title,
          description: contractData.description,
          contract_type: contractData.contract_type,
          contract_value: contractData.contract_value,
          start_date: contractData.start_date,
          end_date: contractData.end_date || null,
          signed_date: contractData.signed_date,
          payment_terms: contractData.payment_terms,
          payment_method: contractData.payment_method || 'bank_transfer',
          advance_payment_required: contractData.advance_payment_required || false,
          advance_payment_amount: contractData.advance_payment_amount || null,
          terms_and_conditions: contractData.terms_and_conditions,
          special_clauses: contractData.special_clauses,
          notes: contractData.notes,
          created_by: user.id,
          status: 'active',
        }])
        .select()
        .single();
      
      if (contractError) throw contractError;

      // Update the quote to mark it as converted to contract
      await supabase
        .from('quotes')
        .update({ converted_to_contract_id: contract.id })
        .eq('id', quoteId);

      return contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'הצעת המחיר הומרה לחוזה בהצלחה' });
    },
    onError: (error: Error) => {
      toast({ title: 'שגיאה בהמרה לחוזה', description: error.message, variant: 'destructive' });
    },
  });

  // Statistics
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    completed: contracts.filter(c => c.status === 'completed').length,
    terminated: contracts.filter(c => c.status === 'terminated').length,
    totalValue: contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0),
    activeValue: contracts
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + (c.contract_value || 0), 0),
  };

  return {
    contracts,
    isLoading,
    refetch,
    usePaymentSchedules,
    createContract,
    updateContract,
    deleteContract,
    createPaymentSchedule,
    updatePaymentStatus,
    convertQuoteToContract,
    generateContractNumber,
    stats,
  };
}
