import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// Activity logging helper function (no hooks)
const logToActivityLog = async (userId: string | undefined, action: string, entityType: string, entityId: string, details?: Record<string, any>) => {
  try {
    await supabase.from('activity_log').insert({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || null,
      ip_address: null,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

export interface QuoteItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  project_id?: string;
  title: string;
  description?: string;
  items: QuoteItem[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  issue_date: string;
  valid_until?: string;
  signed_date?: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'converted' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid';
  signed_by?: string;
  signature_data?: string;
  signed_pdf_url?: string;
  notes?: string;
  terms_and_conditions?: string;
  sent_at?: string;
  viewed_at?: string;
  converted_to_invoice_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  clients?: { name: string; email?: string; phone?: string };
  projects?: { name: string };
}

export interface QuotePayment {
  id: string;
  quote_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface QuoteFormData {
  client_id: string;
  project_id?: string;
  title: string;
  description?: string;
  items: QuoteItem[];
  vat_rate: number;
  valid_until?: string;
  notes?: string;
  terms_and_conditions?: string;
}

export function useQuotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all quotes
  const { data: quotes = [], isLoading, refetch } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          clients:client_id(name, email, phone),
          projects:project_id(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(q => ({
        ...q,
        items: (Array.isArray(q.items) ? q.items : []) as unknown as QuoteItem[]
      })) as Quote[];
    },
    enabled: !!user,
  });

  // Generate quote number
  const generateQuoteNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`);
    
    const number = (count || 0) + 1;
    return `Q${year}-${String(number).padStart(4, '0')}`;
  };

  // Create quote
  const createQuote = useMutation({
    mutationFn: async (formData: QuoteFormData) => {
      if (!user) throw new Error('Not authenticated');
      
      const quoteNumber = await generateQuoteNumber();
      const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
      const vatAmount = subtotal * (formData.vat_rate / 100);
      const totalAmount = subtotal + vatAmount;

      const { data, error } = await supabase
        .from('quotes')
        .insert([{
          quote_number: quoteNumber,
          client_id: formData.client_id,
          project_id: formData.project_id || null,
          title: formData.title,
          description: formData.description,
          items: JSON.parse(JSON.stringify(formData.items)),
          subtotal,
          vat_rate: formData.vat_rate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          valid_until: formData.valid_until || null,
          notes: formData.notes,
          terms_and_conditions: formData.terms_and_conditions,
          created_by: user.id,
          status: 'draft',
          payment_status: 'pending',
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logToActivityLog(user?.id, 'create', 'quotes', data.id, { title: data.title, quote_number: data.quote_number });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'הצעת המחיר נוצרה בהצלחה' });
    },
    onError: (error: Error) => {
      toast({ title: 'שגיאה ביצירת הצעת מחיר', description: error.message, variant: 'destructive' });
    },
  });

  // Update quote
  const updateQuote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quote> & { id: string }) => {
      // Recalculate totals if items changed
      if (updates.items) {
        const subtotal = updates.items.reduce((sum, item) => sum + item.total, 0);
        const vatRate = updates.vat_rate || quotes.find(q => q.id === id)?.vat_rate || 18;
        const vatAmount = subtotal * (vatRate / 100);
        updates.subtotal = subtotal;
        updates.vat_amount = vatAmount;
        updates.total_amount = subtotal + vatAmount;
      }

      const updateData: Record<string, unknown> = { ...updates };
      if (updates.items) {
        updateData.items = JSON.parse(JSON.stringify(updates.items));
      }
      delete updateData.id;

      const { data, error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logToActivityLog(user?.id, 'update', 'quotes', data.id, { title: data.title });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'הצעת המחיר עודכנה' });
    },
    onError: (error: Error) => {
      toast({ title: 'שגיאה בעדכון הצעת מחיר', description: error.message, variant: 'destructive' });
    },
  });

  // Delete quote
  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      logToActivityLog(user?.id, 'delete', 'quotes', id, {});
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'הצעת המחיר נמחקה' });
    },
    onError: (error: Error) => {
      toast({ title: 'שגיאה במחיקת הצעת מחיר', description: error.message, variant: 'destructive' });
    },
  });

  // Send quote (update status)
  const sendQuote = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logToActivityLog(user?.id, 'send', 'quotes', data.id, { title: data.title });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'הצעת המחיר נשלחה' });
    },
  });

  // Add payment to quote
  const addPayment = useMutation({
    mutationFn: async ({ quote_id, amount, payment_method, notes }: {
      quote_id: string;
      amount: number;
      payment_method?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('quote_payments')
        .insert({
          quote_id,
          amount,
          payment_method: payment_method || 'bank_transfer',
          notes,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Update payment status based on amounts
      const quote = quotes.find(q => q.id === quote_id);
      if (quote) {
        const newPaidAmount = (quote.paid_amount || 0) + amount;
        const newStatus = newPaidAmount >= quote.total_amount ? 'paid' : 'partial';
        
        await supabase
          .from('quotes')
          .update({ payment_status: newStatus })
          .eq('id', quote_id);
      }

      return data;
    },
    onSuccess: (data) => {
      logToActivityLog(user?.id, 'payment', 'quotes', data.quote_id, { amount: data.amount, payment_method: data.payment_method });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-payments'] });
      toast({ title: 'התשלום נוסף בהצלחה' });
    },
  });

  // Convert quote to invoice
  const convertToInvoice = useMutation({
    mutationFn: async (quoteId: string) => {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) throw new Error('Quote not found');
      if (!user) throw new Error('Not authenticated');
      
      // Generate invoice number
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`);
      
      const invoiceNumber = `INV${year}-${String((count || 0) + 1).padStart(4, '0')}`;

      // Create invoice in local database
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: quote.client_id,
          project_id: quote.project_id || null,
          amount: quote.total_amount,
          description: quote.title + (quote.description ? `\n${quote.description}` : ''),
          issue_date: new Date().toISOString().split('T')[0],
          due_date: quote.valid_until || null,
          status: 'pending',
          created_by: user.id,
          paid_amount: quote.paid_amount || 0,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Try to create invoice in Green Invoice
      let greenInvoiceId = null;
      try {
        const clientName = quote.clients?.name || 'לקוח';
        const response = await supabase.functions.invoke('green-invoice', {
          body: {
            action: 'create_invoice',
            invoice: {
              id: invoice.id,
              invoice_number: invoiceNumber,
              client_name: clientName,
              amount: quote.total_amount,
              description: quote.title,
              issue_date: new Date().toISOString().split('T')[0],
              due_date: quote.valid_until || null,
            },
          },
        });

        if (response.data?.success && response.data?.data?.id) {
          greenInvoiceId = response.data.data.id;
          // Update invoice with Green Invoice ID
          await supabase
            .from('invoices')
            .update({ green_invoice_id: greenInvoiceId })
            .eq('id', invoice.id);
        }
      } catch (greenError) {
        console.warn('Failed to create Green Invoice, continuing without it:', greenError);
      }

      // Update quote status to converted
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ 
          status: 'converted',
          converted_to_invoice_id: invoice.id 
        })
        .eq('id', quoteId);

      if (updateError) throw updateError;

      return { invoice, greenInvoiceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ 
        title: 'הצעת המחיר הומרה לחשבונית',
        description: data.greenInvoiceId 
          ? 'החשבונית נוצרה גם ב-Green Invoice' 
          : 'החשבונית נוצרה במערכת המקומית'
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'שגיאה בהמרה לחשבונית', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Statistics
  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    signed: quotes.filter(q => q.status === 'signed').length,
    converted: quotes.filter(q => q.status === 'converted').length,
    totalValue: quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0),
    paidValue: quotes.reduce((sum, q) => sum + (q.paid_amount || 0), 0),
    pendingValue: quotes.reduce((sum, q) => sum + (q.remaining_amount || 0), 0),
  };

  return {
    quotes,
    isLoading,
    refetch,
    createQuote,
    updateQuote,
    deleteQuote,
    sendQuote,
    addPayment,
    convertToInvoice,
    stats,
    generateQuoteNumber,
  };
}
