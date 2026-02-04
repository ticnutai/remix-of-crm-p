import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, 
  Calendar, 
  CreditCard,
  History,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Invoice, InvoicePayment, formatCurrency } from '@/hooks/useFinanceCalculations';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface PartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onPaymentAdded: () => void;
}

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'credit_card', label: 'כרטיס אשראי' },
  { value: 'check', label: 'צ\'ק' },
  { value: 'cash', label: 'מזומן' },
  { value: 'other', label: 'אחר' },
];

export default function PartialPaymentDialog({ 
  open, 
  onOpenChange, 
  invoice, 
  onPaymentAdded 
}: PartialPaymentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'bank_transfer',
    notes: '',
  });

  useEffect(() => {
    if (open && invoice) {
      fetchPayments();
      setFormData({
        amount: invoice.remaining_amount?.toString() || invoice.amount.toString(),
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'bank_transfer',
        notes: '',
      });
    }
  }, [open, invoice]);

  const fetchPayments = async () => {
    if (!invoice) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!invoice || !user || !formData.amount) {
      toast({ title: 'נא למלא סכום תשלום', variant: 'destructive' });
      return;
    }

    const paymentAmount = parseFloat(formData.amount);
    const remaining = invoice.remaining_amount ?? invoice.amount - (invoice.paid_amount || 0);

    if (paymentAmount <= 0) {
      toast({ title: 'סכום התשלום חייב להיות גדול מ-0', variant: 'destructive' });
      return;
    }

    if (paymentAmount > remaining) {
      toast({ 
        title: 'סכום התשלום גדול מהיתרה', 
        description: `היתרה לתשלום היא ${formatCurrency(remaining)}`,
        variant: 'destructive' 
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: invoice.id,
          amount: paymentAmount,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          notes: formData.notes || null,
          created_by: user.id,
        });

      if (error) throw error;

      // Update invoice status if fully paid
      const newPaidAmount = (invoice.paid_amount || 0) + paymentAmount;
      const newStatus = newPaidAmount >= invoice.amount ? 'paid' : 'partially_paid';

      await supabase
        .from('invoices')
        .update({ 
          status: newStatus,
          paid_date: newStatus === 'paid' ? formData.payment_date : null,
        })
        .eq('id', invoice.id);

      toast({ title: 'התשלום נוסף בהצלחה' });
      onPaymentAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'שגיאה בהוספת תשלום', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!invoice) return null;

  const remaining = invoice.remaining_amount ?? invoice.amount - (invoice.paid_amount || 0);
  const paidPercentage = ((invoice.paid_amount || 0) / invoice.amount) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            ניהול תשלומים - #{invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice summary */}
          <div className="p-4 bg-accent/30 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">לקוח:</span>
              <span className="font-medium">{invoice.client_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">סה"כ חשבונית:</span>
              <span className="font-bold">{formatCurrency(invoice.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">שולם:</span>
              <span className="font-medium text-green-600">{formatCurrency(invoice.paid_amount || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">יתרה לתשלום:</span>
              <span className="font-bold text-primary">{formatCurrency(remaining)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
            <div className="text-center text-xs text-muted-foreground">
              {Math.round(paidPercentage)}% שולם
            </div>
          </div>

          {/* Payment history */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <History className="h-4 w-4" />
                היסטוריית תשלומים
              </div>
              <ScrollArea className="h-[120px]">
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label || payment.payment_method}
                        </Badge>
                        <span className="text-muted-foreground">
                          {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: he })}
                        </span>
                      </div>
                      <span className="font-medium text-green-600">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Add payment form */}
          {remaining > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm">הוספת תשלום חדש</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>סכום (₪)</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    max={remaining}
                  />
                </div>
                <div className="space-y-2">
                  <Label>תאריך תשלום</Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>אמצעי תשלום</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>הערות</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="הערות לתשלום..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
          {remaining > 0 && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              הוסף תשלום
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
