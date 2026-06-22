import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Bell,
  CreditCard,
  Wallet,
  Receipt,
  TrendingUp,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Send,
  Layers,
} from 'lucide-react';
import { useClientPayments, PaymentAlert } from '@/hooks/useClientPayments';
import { format, differenceInDays, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientPaymentsTabProps {
  clientId: string;
  clientName: string;
}

type VatDisplayMode = 'with-vat' | 'without-vat' | 'with-breakdown';

type SavedQuotePaymentEvent = {
  id: string;
  saved_quote_id: string;
  client_id: string;
  step_id: string;
  step_name: string;
  amount_net: number;
  amount_vat: number;
  amount_total: number;
  vat_rate: number;
  payment_date: string;
  notes?: string | null;
  is_full_payment?: boolean | null;
  created_at?: string | null;
};

type QuotePaymentStep = {
  quoteId: string;
  quoteTitle: string;
  stepId: string;
  stepName: string;
  vatRate: number;
  expectedNet: number;
  expectedVat: number;
  expectedTotal: number;
  paidNet: number;
  paidVat: number;
  paidTotal: number;
  remainingNet: number;
  remainingVat: number;
  remainingTotal: number;
  isPaid: boolean;
};

type VatBreakdown = {
  net: number;
  vat: number;
  total: number;
};

const DEFAULT_VAT_RATE = 18;

const formatCurrency = (amount: number): string => {
  return `₪${Math.round(amount).toLocaleString('he-IL')}`;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const getVatBreakdownFromTotal = (totalAmount: number, vatRate: number): VatBreakdown => {
  const total = round2(Number(totalAmount) || 0);
  if (total <= 0) {
    return { net: 0, vat: 0, total: 0 };
  }

  const safeVatRate = Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : DEFAULT_VAT_RATE;
  if (safeVatRate <= 0) {
    return { net: total, vat: 0, total };
  }

  const net = round2(total / (1 + safeVatRate / 100));
  const vat = round2(total - net);
  return { net, vat, total };
};

const getAmountByVatDisplay = (
  displayMode: VatDisplayMode,
  net: number,
  vat: number,
  total: number,
): string => {
  if (displayMode === 'without-vat') {
    return `${formatCurrency(net)} ללא מע"מ`;
  }

  if (displayMode === 'with-vat') {
    return `${formatCurrency(total)} כולל מע"מ`;
  }

  return `${formatCurrency(total)} (ללא מע"מ ${formatCurrency(net)} | מע"מ ${formatCurrency(vat)})`;
};

const PaymentMethodBadge = ({ method }: { method: string }) => {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    cash: { label: 'מזומן', color: 'bg-green-500/20 text-green-600', icon: <Wallet className="h-3 w-3" /> },
    check: { label: 'צ\'ק', color: 'bg-blue-500/20 text-blue-600', icon: <FileText className="h-3 w-3" /> },
    transfer: { label: 'העברה', color: 'bg-purple-500/20 text-purple-600', icon: <ArrowUpRight className="h-3 w-3" /> },
    bank_transfer: { label: 'העברה בנקאית', color: 'bg-purple-500/20 text-purple-600', icon: <ArrowUpRight className="h-3 w-3" /> },
    credit_card: { label: 'אשראי', color: 'bg-orange-500/20 text-orange-600', icon: <CreditCard className="h-3 w-3" /> },
    paypal: { label: 'PayPal', color: 'bg-blue-500/20 text-blue-600', icon: <DollarSign className="h-3 w-3" /> },
    other: { label: 'אחר', color: 'bg-gray-500/20 text-gray-600', icon: <DollarSign className="h-3 w-3" /> },
  };
  
  const { label, color, icon } = config[method] || config.other;
  
  return (
    <Badge className={`${color} border-0 gap-1`}>
      {icon}
      {label}
    </Badge>
  );
};

const InvoiceStatusBadge = ({ status, dueDate }: { status: string; dueDate?: string }) => {
  const isOverdue = dueDate && status !== 'paid' && new Date(dueDate) < new Date();
  
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'טיוטה', color: 'bg-gray-500/20 text-gray-600', icon: <FileText className="h-3 w-3" /> },
    sent: { label: 'נשלח', color: 'bg-blue-500/20 text-blue-600', icon: <Send className="h-3 w-3" /> },
    paid: { label: 'שולם', color: 'bg-green-500/20 text-green-600', icon: <CheckCircle className="h-3 w-3" /> },
    overdue: { label: 'באיחור', color: 'bg-red-500/20 text-red-600', icon: <AlertCircle className="h-3 w-3" /> },
    cancelled: { label: 'בוטל', color: 'bg-gray-500/20 text-gray-500', icon: <AlertCircle className="h-3 w-3" /> },
    partial: { label: 'תשלום חלקי', color: 'bg-yellow-500/20 text-yellow-600', icon: <Clock className="h-3 w-3" /> },
  };
  
  const effectiveStatus = isOverdue ? 'overdue' : status;
  const { label, color, icon } = config[effectiveStatus] || config.draft;
  
  return (
    <Badge className={`${color} border-0 gap-1`}>
      {icon}
      {label}
    </Badge>
  );
};

const AlertCard = ({ alert, amountDisplay }: { alert: PaymentAlert; amountDisplay?: string }) => {
  const getAlertStyle = () => {
    switch (alert.type) {
      case 'overdue':
        return 'border-red-500/50 bg-red-50 dark:bg-red-950/20';
      case 'upcoming':
        return 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20';
      case 'partial':
        return 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-gray-500/50';
    }
  };

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'upcoming':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'partial':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertMessage = () => {
    switch (alert.type) {
      case 'overdue':
        return `באיחור של ${alert.days_overdue} ימים`;
      case 'upcoming':
        return alert.days_remaining === 0 ? 'היום!' : `בעוד ${alert.days_remaining} ימים`;
      case 'partial':
        return 'תשלום חלקי - יתרה לתשלום';
      default:
        return '';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getAlertStyle()} flex items-center gap-3`}>
      {getAlertIcon()}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">{alert.invoice_number}</span>
          <span className="font-bold text-lg">{amountDisplay || formatCurrency(alert.amount)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {getAlertMessage()}
        </div>
      </div>
    </div>
  );
};

export function ClientPaymentsTab({ clientId, clientName }: ClientPaymentsTabProps) {
  const { toast } = useToast();
  const {
    invoices,
    summary,
    isLoading,
    addInvoicePayment,
    getAlerts,
  } = useClientPayments(clientId);

  const [activeSubTab, setActiveSubTab] = useState('paid');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [payerName, setPayerName] = useState('');
  const [vatRate, setVatRate] = useState('18');
  const [includeVat, setIncludeVat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vatDisplayMode, setVatDisplayMode] = useState<VatDisplayMode>('with-breakdown');

  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [savedQuotePaymentEvents, setSavedQuotePaymentEvents] = useState<SavedQuotePaymentEvent[]>([]);
  const [isQuoteDataLoading, setIsQuoteDataLoading] = useState(false);
  const [isQuoteEventsTableMissing, setIsQuoteEventsTableMissing] = useState(false);

  const [isQuotePaymentDialogOpen, setIsQuotePaymentDialogOpen] = useState(false);
  const [quoteEventQuoteId, setQuoteEventQuoteId] = useState('');
  const [quoteEventStepId, setQuoteEventStepId] = useState('');
  const [quoteEventAmount, setQuoteEventAmount] = useState('');
  const [quoteEventVatRate, setQuoteEventVatRate] = useState('18');
  const [quoteEventIncludesVat, setQuoteEventIncludesVat] = useState(true);
  const [quoteEventDate, setQuoteEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [quoteEventNotes, setQuoteEventNotes] = useState('');
  const [quoteEventIsPartial, setQuoteEventIsPartial] = useState(false);
  const [isSavingQuoteEvent, setIsSavingQuoteEvent] = useState(false);

  const [totalsScopeMode, setTotalsScopeMode] = useState<'all-quotes' | 'current-quote'>('all-quotes');
  const [selectedQuoteForTotals, setSelectedQuoteForTotals] = useState('');

  const loadQuotePaymentData = useCallback(async () => {
    if (!clientId) return;

    setIsQuoteDataLoading(true);
    try {
      const [quotesRes, eventsRes] = await Promise.all([
        (supabase as any)
          .from('saved_quotes')
          .select('id, title, base_price, vat_rate, total_with_vat, payment_schedule, updated_at, created_at')
          .eq('client_id', clientId)
          .order('updated_at', { ascending: false }),
        (supabase as any)
          .from('saved_quote_payment_events')
          .select('id, saved_quote_id, client_id, step_id, step_name, amount_net, amount_vat, amount_total, vat_rate, payment_date, notes, is_full_payment, created_at')
          .eq('client_id', clientId)
          .order('payment_date', { ascending: false }),
      ]);

      if (quotesRes.error) throw quotesRes.error;

      const loadedQuotes = quotesRes.data || [];
      setSavedQuotes(loadedQuotes);

      if (!selectedQuoteForTotals && loadedQuotes.length > 0) {
        setSelectedQuoteForTotals(loadedQuotes[0].id);
      }

      if (eventsRes.error) {
        const code = (eventsRes.error as any)?.code;
        if (code === '42P01') {
          setIsQuoteEventsTableMissing(true);
          setSavedQuotePaymentEvents([]);
        } else {
          throw eventsRes.error;
        }
      } else {
        setIsQuoteEventsTableMissing(false);
        setSavedQuotePaymentEvents((eventsRes.data || []) as SavedQuotePaymentEvent[]);
      }
    } catch (error) {
      console.error('Error loading quote payment data:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון נתוני תשלומי הצעות מחיר',
        variant: 'destructive',
      });
    } finally {
      setIsQuoteDataLoading(false);
    }
  }, [clientId, selectedQuoteForTotals, toast]);

  useEffect(() => {
    void loadQuotePaymentData();
  }, [loadQuotePaymentData]);

  const quoteEventTotalsByStep = useMemo(() => {
    const totalsMap = new Map<string, { net: number; vat: number; total: number }>();

    for (const event of savedQuotePaymentEvents) {
      const key = `${event.saved_quote_id}::${event.step_id}`;
      const existing = totalsMap.get(key) || { net: 0, vat: 0, total: 0 };
      totalsMap.set(key, {
        net: round2(existing.net + Number(event.amount_net || 0)),
        vat: round2(existing.vat + Number(event.amount_vat || 0)),
        total: round2(existing.total + Number(event.amount_total || 0)),
      });
    }

    return totalsMap;
  }, [savedQuotePaymentEvents]);

  const quotePaymentSteps = useMemo<QuotePaymentStep[]>(() => {
    const hasEventRows = savedQuotePaymentEvents.length > 0;

    return savedQuotes.flatMap((quote: any) => {
      const schedule = Array.isArray(quote.payment_schedule) ? quote.payment_schedule : [];
      const basePrice = Number(quote.base_price || 0);
      const defaultVatRate = Number(quote.vat_rate || 18);

      return schedule.map((step: any, index: number) => {
        const stepId = String(step.id || `step-${index + 1}`);
        const stepName = String(step.description || step.name || `שלב ${index + 1}`);
        const percentage = Number(step.percentage || 0);
        const vatRate = Number(step.useCustomVat ? step.vatRate : defaultVatRate) || defaultVatRate;

        const expectedNet = round2(basePrice * (percentage / 100));
        const expectedVat = round2(expectedNet * (vatRate / 100));
        const expectedTotal = round2(expectedNet + expectedVat);

        const eventTotals = quoteEventTotalsByStep.get(`${quote.id}::${stepId}`) || {
          net: 0,
          vat: 0,
          total: 0,
        };

        const jsonPaidNet = Number(step.paidAmountNet ?? step.paid_amount_net ?? 0);
        const jsonPaidVat = Number(step.paidAmountVat ?? step.paid_amount_vat ?? 0);
        const jsonPaidTotal = Number(step.paidAmountTotal ?? step.paid_amount_total ?? 0);

        const paidNet = hasEventRows ? eventTotals.net : jsonPaidNet;
        const paidVat = hasEventRows ? eventTotals.vat : jsonPaidVat;
        const paidTotal = hasEventRows ? eventTotals.total : jsonPaidTotal;

        const remainingNet = round2(Math.max(expectedNet - paidNet, 0));
        const remainingVat = round2(Math.max(expectedVat - paidVat, 0));
        const remainingTotal = round2(Math.max(expectedTotal - paidTotal, 0));
        const isPaid = remainingTotal <= 0.01 || Boolean(step.isPaid);

        return {
          quoteId: quote.id,
          quoteTitle: quote.title || 'הצעה ללא כותרת',
          stepId,
          stepName,
          vatRate,
          expectedNet,
          expectedVat,
          expectedTotal,
          paidNet,
          paidVat,
          paidTotal,
          remainingNet,
          remainingVat,
          remainingTotal,
          isPaid,
        };
      });
    });
  }, [savedQuotes, savedQuotePaymentEvents.length, quoteEventTotalsByStep]);

  const quoteMapById = useMemo(() => {
    const map = new Map<string, any>();
    for (const quote of savedQuotes) {
      map.set(quote.id, quote);
    }
    return map;
  }, [savedQuotes]);

  const unpaidQuoteSteps = useMemo(
    () =>
      quotePaymentSteps
        .filter((step) => step.remainingTotal > 0.01)
        .sort((a, b) => a.quoteTitle.localeCompare(b.quoteTitle, 'he')),
    [quotePaymentSteps],
  );

  const paidQuoteEvents = useMemo(
    () =>
      savedQuotePaymentEvents
        .map((event) => ({
          ...event,
          quoteTitle: quoteMapById.get(event.saved_quote_id)?.title || 'הצעה ללא כותרת',
        }))
        .sort(
          (a, b) =>
            new Date(b.payment_date || b.created_at || 0).getTime() -
            new Date(a.payment_date || a.created_at || 0).getTime(),
        ),
    [savedQuotePaymentEvents, quoteMapById],
  );

  const quoteOptions = useMemo(
    () => savedQuotes.map((quote: any) => ({ id: quote.id, title: quote.title || 'הצעה ללא כותרת' })),
    [savedQuotes],
  );

  const quoteStepsForForm = useMemo(
    () => quotePaymentSteps.filter((step) => step.quoteId === quoteEventQuoteId),
    [quoteEventQuoteId, quotePaymentSteps],
  );

  const selectedFormStep = useMemo(
    () => quoteStepsForForm.find((step) => step.stepId === quoteEventStepId) || null,
    [quoteEventStepId, quoteStepsForForm],
  );

  useEffect(() => {
    if (!selectedFormStep || quoteEventIsPartial) return;
    const defaultAmount = quoteEventIncludesVat
      ? selectedFormStep.remainingTotal
      : selectedFormStep.remainingNet;
    setQuoteEventAmount(defaultAmount > 0 ? String(round2(defaultAmount)) : '');
  }, [selectedFormStep, quoteEventIsPartial, quoteEventIncludesVat]);

  const quoteEventVatAmounts = useMemo(() => {
    const enteredAmount = Number(quoteEventAmount) || 0;
    const eventVatRate = Number(quoteEventVatRate) || 0;

    if (enteredAmount <= 0) {
      return { netAmount: 0, vatAmount: 0, totalAmount: 0 };
    }

    if (quoteEventIncludesVat) {
      const netAmount = round2(enteredAmount / (1 + eventVatRate / 100));
      const vatAmount = round2(enteredAmount - netAmount);
      return {
        netAmount,
        vatAmount,
        totalAmount: round2(enteredAmount),
      };
    }

    const netAmount = round2(enteredAmount);
    const vatAmount = round2(netAmount * (eventVatRate / 100));
    return {
      netAmount,
      vatAmount,
      totalAmount: round2(netAmount + vatAmount),
    };
  }, [quoteEventAmount, quoteEventVatRate, quoteEventIncludesVat]);

  const openQuotePaymentDialog = useCallback((step: QuotePaymentStep) => {
    setQuoteEventQuoteId(step.quoteId);
    setQuoteEventStepId(step.stepId);
    setQuoteEventVatRate(String(step.vatRate));
    setQuoteEventIncludesVat(true);
    setQuoteEventIsPartial(false);
    setQuoteEventDate(format(new Date(), 'yyyy-MM-dd'));
    setQuoteEventAmount(String(round2(step.remainingTotal)));
    setQuoteEventNotes('');
    setIsQuotePaymentDialogOpen(true);
  }, []);

  const handleSubmitQuoteStepPayment = async () => {
    if (!quoteEventQuoteId || !quoteEventStepId || !quoteEventDate) return;
    if (!selectedFormStep) return;

    setIsSavingQuoteEvent(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let finalNet = quoteEventVatAmounts.netAmount;
      let finalVat = quoteEventVatAmounts.vatAmount;
      let finalTotal = quoteEventVatAmounts.totalAmount;

      if (!quoteEventIsPartial) {
        finalNet = selectedFormStep.remainingNet;
        finalVat = selectedFormStep.remainingVat;
        finalTotal = selectedFormStep.remainingTotal;
      }

      if (finalTotal <= 0) {
        throw new Error('סכום התשלום חייב להיות גדול מ-0');
      }

      const insertPayload = {
        saved_quote_id: quoteEventQuoteId,
        client_id: clientId,
        step_id: quoteEventStepId,
        step_name: selectedFormStep.stepName,
        amount_net: finalNet,
        amount_vat: finalVat,
        amount_total: finalTotal,
        vat_rate: Number(quoteEventVatRate) || selectedFormStep.vatRate || 18,
        payment_date: quoteEventDate,
        notes: quoteEventNotes || null,
        is_full_payment: !quoteEventIsPartial,
        created_by: user?.id || null,
      };

      const { error: insertEventError } = await (supabase as any)
        .from('saved_quote_payment_events')
        .insert(insertPayload);

      if (insertEventError) {
        const code = (insertEventError as any)?.code;
        if (code === '42P01') {
          setIsQuoteEventsTableMissing(true);
        } else {
          throw insertEventError;
        }
      }

      const targetQuote = quoteMapById.get(quoteEventQuoteId);
      if (targetQuote) {
        const paymentSchedule = Array.isArray(targetQuote.payment_schedule)
          ? [...targetQuote.payment_schedule]
          : [];
        const stepIndex = paymentSchedule.findIndex(
          (step: any) => String(step.id || '') === quoteEventStepId,
        );

        if (stepIndex >= 0) {
          const step = paymentSchedule[stepIndex] || {};
          const prevPaidNet = Number(step.paidAmountNet ?? step.paid_amount_net ?? 0);
          const prevPaidVat = Number(step.paidAmountVat ?? step.paid_amount_vat ?? 0);
          const prevPaidTotal = Number(step.paidAmountTotal ?? step.paid_amount_total ?? 0);

          const nextPaidNet = round2(prevPaidNet + finalNet);
          const nextPaidVat = round2(prevPaidVat + finalVat);
          const nextPaidTotal = round2(prevPaidTotal + finalTotal);
          const nextIsPaid = nextPaidTotal >= selectedFormStep.expectedTotal - 0.01;

          paymentSchedule[stepIndex] = {
            ...step,
            paidAmountNet: nextPaidNet,
            paidAmountVat: nextPaidVat,
            paidAmountTotal: nextPaidTotal,
            paid_amount_net: nextPaidNet,
            paid_amount_vat: nextPaidVat,
            paid_amount_total: nextPaidTotal,
            paidDate: quoteEventDate,
            isPaid: nextIsPaid,
            paymentStatus: nextIsPaid ? 'paid' : 'partial',
          };

          const { error: updateQuoteError } = await (supabase as any)
            .from('saved_quotes')
            .update({ payment_schedule: paymentSchedule })
            .eq('id', quoteEventQuoteId);

          if (updateQuoteError) {
            throw updateQuoteError;
          }
        }
      }

      toast({
        title: 'התשלום נשמר',
        description: `נרשם תשלום עבור ${selectedFormStep.stepName}`,
      });

      setIsQuotePaymentDialogOpen(false);
      await loadQuotePaymentData();
    } catch (error: any) {
      console.error('Error saving quote step payment:', error);
      toast({
        title: 'שגיאה בשמירת תשלום',
        description: error?.message || 'לא ניתן לשמור תשלום כרגע',
        variant: 'destructive',
      });
    } finally {
      setIsSavingQuoteEvent(false);
    }
  };

  const totalsSteps = useMemo(() => {
    if (totalsScopeMode === 'current-quote' && selectedQuoteForTotals) {
      return quotePaymentSteps.filter((step) => step.quoteId === selectedQuoteForTotals);
    }

    return quotePaymentSteps;
  }, [totalsScopeMode, selectedQuoteForTotals, quotePaymentSteps]);

  const totalsSummary = useMemo(() => {
    const expectedNet = round2(totalsSteps.reduce((sum, step) => sum + step.expectedNet, 0));
    const expectedVat = round2(totalsSteps.reduce((sum, step) => sum + step.expectedVat, 0));
    const expectedTotal = round2(totalsSteps.reduce((sum, step) => sum + step.expectedTotal, 0));

    const paidNet = round2(totalsSteps.reduce((sum, step) => sum + step.paidNet, 0));
    const paidVat = round2(totalsSteps.reduce((sum, step) => sum + step.paidVat, 0));
    const paidTotal = round2(totalsSteps.reduce((sum, step) => sum + step.paidTotal, 0));

    const remainingNet = round2(Math.max(expectedNet - paidNet, 0));
    const remainingVat = round2(Math.max(expectedVat - paidVat, 0));
    const remainingTotal = round2(Math.max(expectedTotal - paidTotal, 0));

    const progress = expectedTotal > 0 ? Math.min(100, Math.round((paidTotal / expectedTotal) * 100)) : 0;

    return {
      expectedNet,
      expectedVat,
      expectedTotal,
      paidNet,
      paidVat,
      paidTotal,
      remainingNet,
      remainingVat,
      remainingTotal,
      progress,
    };
  }, [totalsSteps]);

  const alerts = useMemo(() => getAlerts(), [getAlerts]);
  
  const overdueAlerts = alerts.filter(a => a.type === 'overdue');
  const upcomingAlerts = alerts.filter(a => a.type === 'upcoming');

  // Calculate invoice details
  const invoicesWithDetails = useMemo(() => {
    return invoices.map((inv: any) => {
      const paidAmount = (inv.invoice_payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const remainingAmount = Number(inv.amount) - paidAmount;
      const paymentProgress = Number(inv.amount) > 0 ? (paidAmount / Number(inv.amount)) * 100 : 0;
      const isPartiallyPaid = paidAmount > 0 && remainingAmount > 0;

      const paymentVatRates = (inv.invoice_payments || [])
        .map((p: any) => Number(p.vat_rate || 0))
        .filter((rate: number) => rate > 0);
      const effectiveVatRate = paymentVatRates[paymentVatRates.length - 1] || DEFAULT_VAT_RATE;

      const totalBreakdown = getVatBreakdownFromTotal(Number(inv.amount || 0), effectiveVatRate);
      const paidBreakdown = getVatBreakdownFromTotal(paidAmount, effectiveVatRate);
      const remainingBreakdown = getVatBreakdownFromTotal(remainingAmount, effectiveVatRate);
      
      return {
        ...inv,
        paidAmount,
        remainingAmount,
        paymentProgress,
        isPartiallyPaid,
        effectiveVatRate,
        totalNet: totalBreakdown.net,
        totalVat: totalBreakdown.vat,
        totalAmount: totalBreakdown.total,
        paidNet: paidBreakdown.net,
        paidVat: paidBreakdown.vat,
        remainingNet: remainingBreakdown.net,
        remainingVat: remainingBreakdown.vat,
      };
    });
  }, [invoices]);

  const invoiceDetailsById = useMemo(() => {
    const map = new Map<string, any>();
    for (const invoice of invoicesWithDetails) {
      map.set(invoice.id, invoice);
    }
    return map;
  }, [invoicesWithDetails]);

  const getAlertAmountDisplay = useCallback(
    (alert: PaymentAlert) => {
      const invoice = alert.invoice_id ? invoiceDetailsById.get(alert.invoice_id) : null;
      if (invoice) {
        return getAmountByVatDisplay(
          vatDisplayMode,
          Number(invoice.remainingNet || 0),
          Number(invoice.remainingVat || 0),
          Number(invoice.remainingAmount || 0),
        );
      }

      const breakdown = getVatBreakdownFromTotal(Number(alert.amount || 0), DEFAULT_VAT_RATE);
      return getAmountByVatDisplay(vatDisplayMode, breakdown.net, breakdown.vat, breakdown.total);
    },
    [invoiceDetailsById, vatDisplayMode],
  );

  const pendingInvoices = invoicesWithDetails.filter((inv: any) => 
    inv.status !== 'paid' && inv.status !== 'cancelled' && inv.remainingAmount > 0
  );

  const handleOpenPaymentDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.remainingAmount.toString());
    setPaymentMethod('transfer');
    setPaymentNotes('');
    setPayerName('');
    setVatRate('18');
    setIncludeVat(false);
    setIsPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;
    
    setIsSubmitting(true);
    try {
      await addInvoicePayment(
        selectedInvoice.id,
        Number(paymentAmount),
        paymentMethod,
        paymentNotes,
        payerName,
        Number(vatRate)
      );
      setIsPaymentDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate VAT amounts
  const calculateVatAmounts = (amount: number, vatRate: number, includeVat: boolean) => {
    if (!includeVat) {
      return {
        netAmount: amount,
        vatAmount: 0,
        totalAmount: amount,
      };
    }
    
    const vatMultiplier = vatRate / 100;
    const netAmount = amount / (1 + vatMultiplier);
    const vatAmount = amount - netAmount;
    
    return {
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      totalAmount: amount,
    };
  };

  const vatAmounts = calculateVatAmounts(
    Number(paymentAmount) || 0,
    Number(vatRate) || 0,
    includeVat
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">סה"כ שולם</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ממתין לתשלום</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPending)}</p>
              </div>
              <div className="rounded-lg bg-yellow-500/10 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">חוב באיחור</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</p>
              </div>
              <div className="rounded-lg bg-red-500/10 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">תשלום הבא</p>
                <p className="text-lg font-bold">
                  {summary.nextDueDate 
                    ? format(parseISO(summary.nextDueDate), 'dd/MM/yyyy', { locale: he })
                    : 'אין'}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-yellow-500" />
              התראות תשלום
              <Badge variant="secondary" className="mr-2">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.slice(0, 4).map(alert => (
                <AlertCard key={alert.id} alert={alert} amountDisplay={getAlertAmountDisplay(alert)} />
              ))}
            </div>
            {alerts.length > 4 && (
              <Button variant="ghost" className="w-full mt-3" onClick={() => setActiveSubTab('alerts')}>
                הצג עוד {alerts.length - 4} התראות
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed views */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">תצוגת מע"מ</Label>
            <Select
              value={vatDisplayMode}
              onValueChange={(value) => setVatDisplayMode(value as VatDisplayMode)}
            >
              <SelectTrigger className="w-[210px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="with-breakdown">כולל פירוט מע"מ וללא מע"מ</SelectItem>
                <SelectItem value="with-vat">סכומים כולל מע"מ</SelectItem>
                <SelectItem value="without-vat">סכומים ללא מע"מ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground">
            לקוח: {clientName}
          </div>
        </div>

        {isQuoteEventsTableMissing && (
          <Card className="mb-3 border-yellow-500/40 bg-yellow-50/40">
            <CardContent className="p-3 text-sm text-yellow-800">
              טבלת אירועי תשלום להצעות מחיר עדיין לא קיימת במסד הנתונים. כרגע נשמר רק JSON בהצעה.
              כדי להפעיל שמירה כפולה (טבלה + JSON), יש להריץ את המיגרציה החדשה.
            </CardContent>
          </Card>
        )}

        <TabsList className="w-full justify-start">
          <TabsTrigger value="paid" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            שולמו
          </TabsTrigger>
          <TabsTrigger value="totals" className="gap-2">
            <Layers className="h-4 w-4" />
            סיכום תשלומים
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <Receipt className="h-4 w-4" />
            חשבוניות
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <DollarSign className="h-4 w-4" />
            היסטוריית תשלומים
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" />
            לוח זמנים
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            התראות ({alerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paid" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">סימון שלבי תשלום כשולמו</CardTitle>
              <Badge variant="outline">{unpaidQuoteSteps.length} שלבים פתוחים</Badge>
            </CardHeader>
            <CardContent>
              {isQuoteDataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : unpaidQuoteSteps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                  <p>כל שלבי התשלום סומנו כשולמו</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidQuoteSteps.map((step) => (
                    <div key={`${step.quoteId}-${step.stepId}`} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{step.stepName}</p>
                          <p className="text-sm text-muted-foreground">{step.quoteTitle}</p>
                          <p className="text-xs text-muted-foreground mt-1">מע"מ שלב: {step.vatRate}%</p>
                        </div>
                        <Button size="sm" className="gap-1" onClick={() => openQuotePaymentDialog(step)}>
                          <DollarSign className="h-4 w-4" />
                          סמן כשולם
                        </Button>
                      </div>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="rounded bg-muted/40 px-2 py-1">
                          <span className="text-muted-foreground">סה"כ שלב: </span>
                          <span className="font-medium">
                            {getAmountByVatDisplay(vatDisplayMode, step.expectedNet, step.expectedVat, step.expectedTotal)}
                          </span>
                        </div>
                        <div className="rounded bg-muted/40 px-2 py-1">
                          <span className="text-muted-foreground">שולם: </span>
                          <span className="font-medium text-green-700">
                            {getAmountByVatDisplay(vatDisplayMode, step.paidNet, step.paidVat, step.paidTotal)}
                          </span>
                        </div>
                        <div className="rounded bg-muted/40 px-2 py-1">
                          <span className="text-muted-foreground">נותר: </span>
                          <span className="font-medium text-orange-700">
                            {getAmountByVatDisplay(vatDisplayMode, step.remainingNet, step.remainingVat, step.remainingTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">היסטוריית תשלומים שסומנו</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px]">
                {paidQuoteEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>אין תשלומים מסומנים בהצעות המחיר</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paidQuoteEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{event.step_name}</span>
                            <Badge variant="outline" className="text-xs">{event.quoteTitle}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(event.payment_date), 'dd/MM/yyyy', { locale: he })}
                            {event.notes ? ` • ${event.notes}` : ''}
                          </p>
                        </div>
                        <span className="font-bold text-green-700">
                          +{getAmountByVatDisplay(
                            vatDisplayMode,
                            Number(event.amount_net || 0),
                            Number(event.amount_vat || 0),
                            Number(event.amount_total || 0),
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="totals" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">סה"כ תשלום</CardTitle>
              <CardDescription>כמה שולם מתוך הסכום הכולל</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>היקף חישוב</Label>
                  <Select value={totalsScopeMode} onValueChange={(value) => setTotalsScopeMode(value as 'all-quotes' | 'current-quote')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-quotes">כל ההצעות של הלקוח</SelectItem>
                      <SelectItem value="current-quote">הצעה ספציפית</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {totalsScopeMode === 'current-quote' && (
                  <div className="space-y-2">
                    <Label>בחר הצעה</Label>
                    <Select value={selectedQuoteForTotals} onValueChange={setSelectedQuoteForTotals}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר הצעה" />
                      </SelectTrigger>
                      <SelectContent>
                        {quoteOptions.map((quote) => (
                          <SelectItem key={quote.id} value={quote.id}>
                            {quote.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">התקדמות גבייה</span>
                  <span className="font-semibold">{totalsSummary.progress}%</span>
                </div>
                <Progress value={totalsSummary.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 bg-green-50/40">
                  <p className="text-sm text-muted-foreground">שולם</p>
                  <p className="font-bold text-green-700 mt-1">
                    {getAmountByVatDisplay(
                      vatDisplayMode,
                      totalsSummary.paidNet,
                      totalsSummary.paidVat,
                      totalsSummary.paidTotal,
                    )}
                  </p>
                </div>

                <div className="rounded-lg border p-3 bg-orange-50/40">
                  <p className="text-sm text-muted-foreground">נותר</p>
                  <p className="font-bold text-orange-700 mt-1">
                    {getAmountByVatDisplay(
                      vatDisplayMode,
                      totalsSummary.remainingNet,
                      totalsSummary.remainingVat,
                      totalsSummary.remainingTotal,
                    )}
                  </p>
                </div>

                <div className="rounded-lg border p-3 bg-blue-50/40">
                  <p className="text-sm text-muted-foreground">סה"כ לתשלום</p>
                  <p className="font-bold text-blue-700 mt-1">
                    {getAmountByVatDisplay(
                      vatDisplayMode,
                      totalsSummary.expectedNet,
                      totalsSummary.expectedVat,
                      totalsSummary.expectedTotal,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">חשבוניות פתוחות</CardTitle>
              <Badge variant="outline">{pendingInvoices.length} חשבוניות</Badge>
            </CardHeader>
            <CardContent>
              {pendingInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                  <p>אין חשבוניות פתוחות</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvoices.map((invoice: any) => (
                    <div 
                      key={invoice.id}
                      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{invoice.invoice_number}</span>
                            <InvoiceStatusBadge status={invoice.isPartiallyPaid ? 'partial' : invoice.status} dueDate={invoice.due_date} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{invoice.description || 'ללא תיאור'}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold">
                            {getAmountByVatDisplay(
                              vatDisplayMode,
                              Number(invoice.totalNet || 0),
                              Number(invoice.totalVat || 0),
                              Number(invoice.totalAmount || 0),
                            )}
                          </p>
                          {invoice.isPartiallyPaid && (
                            <p className="text-sm text-muted-foreground">
                              יתרה: {getAmountByVatDisplay(
                                vatDisplayMode,
                                Number(invoice.remainingNet || 0),
                                Number(invoice.remainingVat || 0),
                                Number(invoice.remainingAmount || 0),
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Payment Progress */}
                      {invoice.isPartiallyPaid && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">התקדמות תשלום</span>
                            <span className="font-medium">{Math.round(invoice.paymentProgress)}%</span>
                          </div>
                          <Progress value={invoice.paymentProgress} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            הונפק: {format(parseISO(invoice.issue_date), 'dd/MM/yy')}
                          </span>
                          {invoice.due_date && (
                            <span className={`flex items-center gap-1 ${new Date(invoice.due_date) < new Date() ? 'text-red-500' : ''}`}>
                              <Clock className="h-3.5 w-3.5" />
                              תאריך יעד: {format(parseISO(invoice.due_date), 'dd/MM/yy')}
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleOpenPaymentDialog(invoice)}
                          className="gap-1"
                        >
                          <DollarSign className="h-4 w-4" />
                          רשום תשלום
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paid Invoices */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                חשבוניות ששולמו
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {invoicesWithDetails.filter((inv: any) => inv.status === 'paid').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>אין חשבוניות ששולמו</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoicesWithDetails
                      .filter((inv: any) => inv.status === 'paid')
                      .map((invoice: any) => (
                        <div 
                          key={invoice.id}
                          className="p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/20 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <span className="font-medium">{invoice.invoice_number}</span>
                              <p className="text-sm text-muted-foreground">
                                {invoice.paid_date && format(parseISO(invoice.paid_date), 'dd/MM/yyyy', { locale: he })}
                              </p>
                            </div>
                          </div>
                            <span className="font-bold text-green-600">
                              {getAmountByVatDisplay(
                                vatDisplayMode,
                                Number(invoice.totalNet || 0),
                                Number(invoice.totalVat || 0),
                                Number(invoice.totalAmount || 0),
                              )}
                            </span>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">היסטוריית תשלומים</CardTitle>
              <CardDescription>כל התשלומים שהתקבלו מלקוח זה</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {invoices.flatMap((inv: any) => 
                  (inv.invoice_payments || []).map((p: any) => ({
                    ...p,
                    invoice_number: inv.invoice_number,
                  }))
                ).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>אין תשלומים רשומים</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoices
                      .flatMap((inv: any) => 
                        (inv.invoice_payments || []).map((p: any) => ({
                          ...p,
                          invoice_number: inv.invoice_number,
                        }))
                      )
                      .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                      .map((payment: any) => {
                        const paymentVatRate = Number(payment.vat_rate || DEFAULT_VAT_RATE);
                        const paymentBreakdown = getVatBreakdownFromTotal(
                          Number(payment.amount || 0),
                          paymentVatRate,
                        );

                        return (
                          <div 
                            key={payment.id}
                            className="p-3 rounded-lg border bg-card flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="rounded-full bg-green-500/10 p-2">
                                <ArrowDownRight className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{payment.invoice_number}</span>
                                  <PaymentMethodBadge method={payment.payment_method} />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(parseISO(payment.payment_date), 'dd/MM/yyyy', { locale: he })}
                                  {payment.payer_name && ` • ${payment.payer_name}`}
                                  {payment.notes && ` • ${payment.notes}`}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-green-600">
                              +{getAmountByVatDisplay(
                                vatDisplayMode,
                                paymentBreakdown.net,
                                paymentBreakdown.vat,
                                paymentBreakdown.total,
                              )}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                לוח זמנים לחיוב
              </CardTitle>
              <CardDescription>תשלומים עתידיים צפויים</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvoices.filter((inv: any) => inv.due_date).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>אין תשלומים מתוזמנים</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvoices
                    .filter((inv: any) => inv.due_date)
                    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                    .map((invoice: any) => {
                      const daysUntil = differenceInDays(parseISO(invoice.due_date), new Date());
                      const isOverdue = daysUntil < 0;
                      
                      return (
                        <div 
                          key={invoice.id}
                          className={`p-4 rounded-lg border ${isOverdue ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20' : 'bg-card'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`rounded-full p-2 ${isOverdue ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                {isOverdue ? (
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                ) : (
                                  <Calendar className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{invoice.invoice_number}</span>
                                  <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                                    {isOverdue ? `באיחור ${Math.abs(daysUntil)} ימים` : `בעוד ${daysUntil} ימים`}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(parseISO(invoice.due_date), 'EEEE, dd בMMMM yyyy', { locale: he })}
                                </p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className={`text-lg font-bold ${isOverdue ? 'text-red-600' : ''}`}>
                                {getAmountByVatDisplay(
                                  vatDisplayMode,
                                  Number(invoice.remainingNet || 0),
                                  Number(invoice.remainingVat || 0),
                                  Number(invoice.remainingAmount || 0),
                                )}
                              </p>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleOpenPaymentDialog(invoice)}
                                className="mt-1"
                              >
                                רשום תשלום
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-500" />
                כל ההתראות
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                  <p>אין התראות פעילות</p>
                  <p className="text-sm">כל התשלומים מעודכנים</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueAlerts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        באיחור ({overdueAlerts.length})
                      </h4>
                      <div className="space-y-2">
                        {overdueAlerts.map(alert => (
                          <AlertCard key={alert.id} alert={alert} amountDisplay={getAlertAmountDisplay(alert)} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {upcomingAlerts.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-yellow-600 mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        מתקרבים ({upcomingAlerts.length})
                      </h4>
                      <div className="space-y-2">
                        {upcomingAlerts.map(alert => (
                          <AlertCard key={alert.id} alert={alert} amountDisplay={getAlertAmountDisplay(alert)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quote Step Payment Dialog */}
      <Dialog open={isQuotePaymentDialogOpen} onOpenChange={setIsQuotePaymentDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              סימון תשלום לשלב הצעה
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>הצעה</Label>
                <Select value={quoteEventQuoteId} onValueChange={(value) => {
                  setQuoteEventQuoteId(value);
                  const firstStep = quotePaymentSteps.find((step) => step.quoteId === value);
                  setQuoteEventStepId(firstStep?.stepId || '');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר הצעה" />
                  </SelectTrigger>
                  <SelectContent>
                    {quoteOptions.map((quote) => (
                      <SelectItem key={quote.id} value={quote.id}>{quote.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>שלב</Label>
                <Select value={quoteEventStepId} onValueChange={setQuoteEventStepId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר שלב" />
                  </SelectTrigger>
                  <SelectContent>
                    {quoteStepsForForm.map((step) => (
                      <SelectItem key={`${step.quoteId}-${step.stepId}`} value={step.stepId}>
                        {step.stepName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedFormStep && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">יתרה בשלב: </span>
                  <span className="font-medium">
                    {getAmountByVatDisplay(
                      vatDisplayMode,
                      selectedFormStep.remainingNet,
                      selectedFormStep.remainingVat,
                      selectedFormStep.remainingTotal,
                    )}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">מע"מ שלב: {selectedFormStep.vatRate}%</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quote-payment-date">תאריך תשלום</Label>
                <Input
                  id="quote-payment-date"
                  type="date"
                  value={quoteEventDate}
                  onChange={(e) => setQuoteEventDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>מצב תשלום</Label>
                <Select
                  value={quoteEventIsPartial ? 'partial' : 'full'}
                  onValueChange={(value) => setQuoteEventIsPartial(value === 'partial')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">תשלום מלא (ברירת מחדל)</SelectItem>
                    <SelectItem value="partial">תשלום חלקי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quoteEventIncludesVat"
                checked={quoteEventIncludesVat}
                onChange={(e) => setQuoteEventIncludesVat(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="quoteEventIncludesVat" className="cursor-pointer">
                הסכום שהוזן כולל מע"מ
              </Label>
              <Input
                type="number"
                className="w-24 h-8"
                value={quoteEventVatRate}
                onChange={(e) => setQuoteEventVatRate(e.target.value)}
                min="0"
                max="100"
                step="0.5"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-payment-amount">כמה שולם</Label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                <Input
                  id="quote-payment-amount"
                  type="number"
                  value={quoteEventAmount}
                  onChange={(e) => setQuoteEventAmount(e.target.value)}
                  className="pr-8"
                  disabled={!quoteEventIsPartial && !!selectedFormStep}
                />
              </div>
              {!quoteEventIsPartial && (
                <p className="text-xs text-muted-foreground">בתשלום מלא הסכום נקבע אוטומטית ליתרה של השלב.</p>
              )}
            </div>

            {(Number(quoteEventAmount) || 0) > 0 && (
              <div className="rounded-lg border bg-blue-50/40 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ללא מע"מ</span>
                  <span className="font-medium">{formatCurrency(quoteEventVatAmounts.netAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">מע"מ</span>
                  <span className="font-medium">{formatCurrency(quoteEventVatAmounts.vatAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="font-medium">סה"כ</span>
                  <span className="font-bold">{formatCurrency(quoteEventVatAmounts.totalAmount)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quote-payment-notes">הערות</Label>
              <Textarea
                id="quote-payment-notes"
                value={quoteEventNotes}
                onChange={(e) => setQuoteEventNotes(e.target.value)}
                placeholder="הערות אופציונליות..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsQuotePaymentDialogOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleSubmitQuoteStepPayment}
              disabled={
                isSavingQuoteEvent ||
                !quoteEventQuoteId ||
                !quoteEventStepId ||
                !quoteEventDate ||
                (!quoteEventIsPartial && !selectedFormStep) ||
                (quoteEventIsPartial && (Number(quoteEventAmount) || 0) <= 0)
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {isSavingQuoteEvent ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
              שמור תשלום
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              רישום תשלום
            </DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">חשבונית</span>
                  <span className="font-medium">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">יתרה לתשלום</span>
                  <span className="font-bold text-lg">
                    {getAmountByVatDisplay(
                      vatDisplayMode,
                      Number(selectedInvoice.remainingNet || 0),
                      Number(selectedInvoice.remainingVat || 0),
                      Number(selectedInvoice.remainingAmount || 0),
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">סכום תשלום</Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                  <Input
                    id="amount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pr-8"
                    max={selectedInvoice.remainingAmount}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPaymentAmount(selectedInvoice.remainingAmount.toString())}
                  >
                    מלא
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPaymentAmount((selectedInvoice.remainingAmount / 2).toString())}
                  >
                    50%
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="includeVat"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="includeVat" className="cursor-pointer flex items-center gap-2">
                  הסכום כולל מע"מ
                  {includeVat && (
                    <Input
                      type="number"
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                      className="w-20 h-7 text-sm"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                  )}
                  {includeVat && <span className="text-sm text-muted-foreground">%</span>}
                </Label>
              </div>

              {includeVat && Number(paymentAmount) > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">סכום לפני מע"מ:</span>
                    <span className="font-medium">{formatCurrency(vatAmounts.netAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">מע"מ ({vatRate}%):</span>
                    <span className="font-medium">{formatCurrency(vatAmounts.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-blue-200 dark:border-blue-800">
                    <span className="font-medium">סה"כ כולל מע"מ:</span>
                    <span className="font-bold">{formatCurrency(vatAmounts.totalAmount)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>אמצעי תשלום</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">העברה בנקאית</SelectItem>
                      <SelectItem value="credit_card">כרטיס אשראי</SelectItem>
                      <SelectItem value="check">צ'ק</SelectItem>
                      <SelectItem value="cash">מזומן</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payerName">מי שילם</Label>
                  <Input
                    id="payerName"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="שם המשלם"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">הערות (אופציונלי)</Label>
                <Textarea
                  id="notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="הערות נוספות..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleSubmitPayment} 
              disabled={isSubmitting || !paymentAmount || Number(paymentAmount) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
              אשר תשלום
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
