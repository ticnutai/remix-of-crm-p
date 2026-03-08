import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  client_id: string;
  contract_id?: string | null;
  invoice_id?: string | null;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'check' | 'transfer' | 'credit_card' | 'other';
  reference_number?: string | null;
  description?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  receipt_number?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ClientDebt {
  client_id: string;
  client_name: string;
  total_invoiced: number;
  total_paid: number;
  outstanding: number;
  overdue_amount: number;
  next_due_date?: string;
  overdue_days?: number;
}

export interface PaymentAlert {
  id: string;
  type: 'upcoming' | 'overdue' | 'partial' | 'reminder';
  client_id: string;
  client_name: string;
  amount: number;
  due_date: string;
  days_remaining?: number;
  days_overdue?: number;
  invoice_id?: string;
  invoice_number?: string;
}

export interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  upcomingPayments: number;
  lastPaymentDate?: string;
  nextDueDate?: string;
}

export function useClientPayments(clientId?: string) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    upcomingPayments: 0,
  });

  // Fetch payments data
  const fetchPayments = useCallback(async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    try {
      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch invoices for this client
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, invoice_payments(*)')
        .eq('client_id', clientId)
        .order('issue_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Calculate summary
      const now = new Date();
      const totalPaid = (invoicesData || [])
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + Number(inv.amount || 0), 0);
      
      const pendingInvoices = (invoicesData || []).filter((inv: any) => 
        inv.status !== 'paid' && inv.status !== 'cancelled'
      );
      
      const totalPending = pendingInvoices.reduce((sum: number, inv: any) => {
        const paidAmount = (inv.invoice_payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        return sum + (Number(inv.amount || 0) - paidAmount);
      }, 0);
      
      const overdueInvoices = pendingInvoices.filter((inv: any) => 
        inv.due_date && new Date(inv.due_date) < now
      );
      
      const totalOverdue = overdueInvoices.reduce((sum: number, inv: any) => {
        const paidAmount = (inv.invoice_payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        return sum + (Number(inv.amount || 0) - paidAmount);
      }, 0);

      const upcomingPayments = pendingInvoices.filter((inv: any) =>
        inv.due_date && new Date(inv.due_date) > now && 
        new Date(inv.due_date) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      ).length;

      const sortedPaidInvoices = (invoicesData || [])
        .filter((inv: any) => inv.paid_date)
        .sort((a: any, b: any) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime());

      const sortedDueInvoices = pendingInvoices
        .filter((inv: any) => inv.due_date)
        .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      setPayments((paymentsData || []) as Payment[]);
      setInvoices(invoicesData || []);
      setSummary({
        totalPaid,
        totalPending,
        totalOverdue,
        upcomingPayments,
        lastPaymentDate: sortedPaidInvoices[0]?.paid_date,
        nextDueDate: sortedDueInvoices[0]?.due_date,
      });

    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון נתוני תשלומים',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, toast]);

  // Add payment
  const addPayment = useCallback(async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'תשלום נוסף',
        description: 'התשלום נרשם בהצלחה',
      });

      await fetchPayments();
      return data;
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף תשלום',
        variant: 'destructive',
      });
      throw error;
    }
  }, [fetchPayments, toast]);

  // Add invoice payment (partial payment)
  const addInvoicePayment = useCallback(async (
    invoiceId: string, 
    amount: number, 
    paymentMethod: string, 
    notes?: string,
    payerName?: string,
    vatRate?: number
  ) => {
    try {
      const { data, error } = await supabase
        .from('invoice_payments')
        .insert([{
          invoice_id: invoiceId,
          amount,
          payment_method: paymentMethod,
          notes,
          payer_name: payerName,
          vat_rate: vatRate || 17,
          payment_date: new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (error) throw error;

      // Check if invoice is fully paid
      const { data: invoice } = await supabase
        .from('invoices')
        .select('amount, invoice_payments(*)')
        .eq('id', invoiceId)
        .single();

      if (invoice) {
        const totalPaid = (invoice.invoice_payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        if (totalPaid >= Number(invoice.amount)) {
          await supabase
            .from('invoices')
            .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
            .eq('id', invoiceId);
        }
      }

      toast({
        title: 'תשלום נרשם',
        description: `תשלום של ₪${amount.toLocaleString()} נרשם בהצלחה`,
      });

      await fetchPayments();
      return data;
    } catch (error) {
      console.error('Error adding invoice payment:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לרשום תשלום',
        variant: 'destructive',
      });
      throw error;
    }
  }, [fetchPayments, toast]);

  // Delete payment
  const deletePayment = useCallback(async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: 'תשלום נמחק',
        description: 'התשלום הוסר בהצלחה',
      });

      await fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק תשלום',
        variant: 'destructive',
      });
      throw error;
    }
  }, [fetchPayments, toast]);

  // Get payment alerts
  const getAlerts = useCallback((): PaymentAlert[] => {
    const now = new Date();
    const alerts: PaymentAlert[] = [];

    // Check overdue invoices
    invoices
      .filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.due_date)
      .forEach((inv: any) => {
        const dueDate = new Date(inv.due_date);
        const paidAmount = (inv.invoice_payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        const remaining = Number(inv.amount) - paidAmount;
        
        if (remaining <= 0) return;

        const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
          // Overdue
          alerts.push({
            id: `overdue-${inv.id}`,
            type: 'overdue',
            client_id: inv.client_id,
            client_name: '',
            amount: remaining,
            due_date: inv.due_date,
            days_overdue: Math.abs(daysDiff),
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
          });
        } else if (daysDiff <= 7) {
          // Upcoming in 7 days
          alerts.push({
            id: `upcoming-${inv.id}`,
            type: 'upcoming',
            client_id: inv.client_id,
            client_name: '',
            amount: remaining,
            due_date: inv.due_date,
            days_remaining: daysDiff,
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
          });
        }

        // Check for partial payments
        if (paidAmount > 0 && remaining > 0) {
          alerts.push({
            id: `partial-${inv.id}`,
            type: 'partial',
            client_id: inv.client_id,
            client_name: '',
            amount: remaining,
            due_date: inv.due_date,
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
          });
        }
      });

    return alerts.sort((a, b) => {
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (a.type !== 'overdue' && b.type === 'overdue') return 1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [invoices]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    invoices,
    summary,
    isLoading,
    fetchPayments,
    addPayment,
    addInvoicePayment,
    deletePayment,
    getAlerts,
  };
}

// Hook for all clients payments overview
export function useAllClientsPayments() {
  const { toast } = useToast();
  const [debts, setDebts] = useState<ClientDebt[]>([]);
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    clientsWithDebt: 0,
  });

  const fetchAllDebts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all invoices with client info
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients(id, name),
          invoice_payments(*)
        `)
        .neq('status', 'cancelled');

      if (invoicesError) throw invoicesError;

      const now = new Date();
      const clientDebtsMap = new Map<string, ClientDebt>();

      (invoicesData || []).forEach((inv: any) => {
        if (!inv.clients) return;
        
        const clientId = inv.clients.id;
        const clientName = inv.clients.name;
        const invoiceAmount = Number(inv.amount || 0);
        const paidAmount = (inv.invoice_payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        const isPaid = inv.status === 'paid' || paidAmount >= invoiceAmount;
        const remaining = Math.max(0, invoiceAmount - paidAmount);
        const isOverdue = !isPaid && inv.due_date && new Date(inv.due_date) < now;

        const existing = clientDebtsMap.get(clientId) || {
          client_id: clientId,
          client_name: clientName,
          total_invoiced: 0,
          total_paid: 0,
          outstanding: 0,
          overdue_amount: 0,
          next_due_date: undefined,
          overdue_days: undefined,
        };

        existing.total_invoiced += invoiceAmount;
        existing.total_paid += isPaid ? invoiceAmount : paidAmount;
        existing.outstanding += remaining;
        if (isOverdue) {
          existing.overdue_amount += remaining;
          const daysOverdue = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
          if (!existing.overdue_days || daysOverdue > existing.overdue_days) {
            existing.overdue_days = daysOverdue;
          }
        }
        if (!isPaid && inv.due_date && new Date(inv.due_date) >= now) {
          if (!existing.next_due_date || new Date(inv.due_date) < new Date(existing.next_due_date)) {
            existing.next_due_date = inv.due_date;
          }
        }

        clientDebtsMap.set(clientId, existing);
      });

      const debtsArray = Array.from(clientDebtsMap.values())
        .filter(d => d.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding);

      // Build alerts
      const alertsList: PaymentAlert[] = [];
      (invoicesData || []).forEach((inv: any) => {
        if (!inv.clients || inv.status === 'paid' || inv.status === 'cancelled') return;
        
        const paidAmount = (inv.invoice_payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        const remaining = Number(inv.amount) - paidAmount;
        if (remaining <= 0) return;

        if (inv.due_date) {
          const daysDiff = Math.floor((new Date(inv.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 0) {
            alertsList.push({
              id: `overdue-${inv.id}`,
              type: 'overdue',
              client_id: inv.clients.id,
              client_name: inv.clients.name,
              amount: remaining,
              due_date: inv.due_date,
              days_overdue: Math.abs(daysDiff),
              invoice_id: inv.id,
              invoice_number: inv.invoice_number,
            });
          } else if (daysDiff <= 7) {
            alertsList.push({
              id: `upcoming-${inv.id}`,
              type: 'upcoming',
              client_id: inv.clients.id,
              client_name: inv.clients.name,
              amount: remaining,
              due_date: inv.due_date,
              days_remaining: daysDiff,
              invoice_id: inv.id,
              invoice_number: inv.invoice_number,
            });
          }
        }
      });

      setDebts(debtsArray);
      const sortedAlerts = [...alertsList].sort((a, b) => {
        if (a.type === 'overdue' && b.type !== 'overdue') return -1;
        if (a.type !== 'overdue' && b.type === 'overdue') return 1;
        return (b.days_overdue || 0) - (a.days_overdue || 0);
      });
      setAlerts(sortedAlerts);
      setTotals({
        totalInvoiced: Array.from(clientDebtsMap.values()).reduce((s, d) => s + d.total_invoiced, 0),
        totalPaid: Array.from(clientDebtsMap.values()).reduce((s, d) => s + d.total_paid, 0),
        totalOutstanding: debtsArray.reduce((s, d) => s + d.outstanding, 0),
        totalOverdue: debtsArray.reduce((s, d) => s + d.overdue_amount, 0),
        clientsWithDebt: debtsArray.length,
      });

    } catch (error) {
      console.error('Error fetching debts:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון נתוני חובות',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllDebts();
  }, [fetchAllDebts]);

  return {
    debts,
    alerts,
    totals,
    isLoading,
    refresh: fetchAllDebts,
  };
}
