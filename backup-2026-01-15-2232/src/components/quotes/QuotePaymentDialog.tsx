import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Quote } from '@/hooks/useQuotes';

const formSchema = z.object({
  amount: z.number().positive('יש להזין סכום חיובי'),
  payment_method: z.string(),
  notes: z.string().optional(),
});

interface QuotePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  onSubmit: (data: { amount: number; payment_method: string; notes?: string }) => void;
  isLoading?: boolean;
}

const paymentMethods = [
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'credit_card', label: 'כרטיס אשראי' },
  { value: 'cash', label: 'מזומן' },
  { value: 'check', label: "צ'ק" },
  { value: 'bit', label: 'ביט' },
  { value: 'paypal', label: 'PayPal' },
];

export function QuotePaymentDialog({ 
  open, 
  onOpenChange, 
  quote, 
  onSubmit, 
  isLoading 
}: QuotePaymentDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: quote.remaining_amount || 0,
      payment_method: 'bank_transfer',
      notes: '',
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      amount: values.amount,
      payment_method: values.payment_method,
      notes: values.notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת תשלום</DialogTitle>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg mb-4">
          <div className="flex justify-between mb-2">
            <span>סה"כ להצעה:</span>
            <span className="font-medium">{formatCurrency(quote.total_amount)}</span>
          </div>
          <div className="flex justify-between mb-2 text-success">
            <span>שולם:</span>
            <span>{formatCurrency(quote.paid_amount || 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-primary">
            <span>יתרה לתשלום:</span>
            <span>{formatCurrency(quote.remaining_amount || 0)}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סכום התשלום *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      max={quote.remaining_amount || undefined}
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אמצעי תשלום</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea placeholder="הערות לתשלום..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'שומר...' : 'הוסף תשלום'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
