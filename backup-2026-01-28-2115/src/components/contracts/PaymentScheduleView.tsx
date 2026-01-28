import React, { useState } from 'react';
import { format, isPast, isFuture, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentSchedule, useContracts } from '@/hooks/useContracts';
import { cn } from '@/lib/utils';

interface PaymentScheduleViewProps {
  contractId: string;
  paymentSchedules: PaymentSchedule[];
  contractValue: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
  sent: { label: 'נשלח', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Calendar },
  paid: { label: 'שולם', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
  overdue: { label: 'באיחור', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle },
  cancelled: { label: 'בוטל', color: 'bg-muted text-muted-foreground', icon: Clock },
  partial: { label: 'חלקי', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: Clock },
};

export function PaymentScheduleView({ contractId, paymentSchedules, contractValue }: PaymentScheduleViewProps) {
  const { createPaymentSchedule, updatePaymentStatus } = useContracts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [numPayments, setNumPayments] = useState(3);
  const [paymentDates, setPaymentDates] = useState<string[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateSchedule = async () => {
    if (paymentDates.length !== numPayments) return;
    
    const amountPerPayment = Math.round(contractValue / numPayments);
    const payments = paymentDates.map((date, index) => ({
      payment_number: index + 1,
      description: `תשלום ${index + 1} מתוך ${numPayments}`,
      amount: index === numPayments - 1 
        ? contractValue - (amountPerPayment * (numPayments - 1)) // Last payment gets remainder
        : amountPerPayment,
      due_date: date,
    }));

    await createPaymentSchedule.mutateAsync({
      contract_id: contractId,
      payments,
    });
    setIsCreateOpen(false);
  };

  const handleMarkAsPaid = async (payment: PaymentSchedule) => {
    await updatePaymentStatus.mutateAsync({
      id: payment.id,
      status: 'paid',
      paid_amount: payment.amount,
      paid_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  // Generate default dates when numPayments changes
  const generateDefaultDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < numPayments; i++) {
      dates.push(format(addDays(today, (i + 1) * 30), 'yyyy-MM-dd'));
    }
    setPaymentDates(dates);
  };

  React.useEffect(() => {
    generateDefaultDates();
  }, [numPayments]);

  // Check for overdue payments
  const paymentsWithStatus = paymentSchedules.map(p => {
    if (p.status === 'paid' || p.status === 'cancelled') return p;
    if (isPast(new Date(p.due_date))) {
      return { ...p, displayStatus: 'overdue' as const };
    }
    return { ...p, displayStatus: p.status };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">לוח תשלומים</CardTitle>
        {paymentSchedules.length === 0 && (
          <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 ml-1" />
            צור לוח תשלומים
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {paymentSchedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>לא נוצר עדיין לוח תשלומים לחוזה זה</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>תיאור</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>תאריך יעד</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsWithStatus.map((payment) => {
                const displayStatus = 'displayStatus' in payment ? payment.displayStatus : payment.status;
                const status = statusConfig[displayStatus] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isOverdue = displayStatus === 'overdue';

                return (
                  <TableRow 
                    key={payment.id}
                    className={cn(isOverdue && 'bg-red-50 dark:bg-red-900/10')}
                  >
                    <TableCell className="font-medium">{payment.payment_number}</TableCell>
                    <TableCell>{payment.description || `תשלום ${payment.payment_number}`}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: he })}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('gap-1', status.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.status !== 'paid' && payment.status !== 'cancelled' && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleMarkAsPaid(payment)}
                          disabled={updatePaymentStatus.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 ml-1" />
                          שולם
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>יצירת לוח תשלומים</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>מספר תשלומים</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={numPayments}
                onChange={(e) => setNumPayments(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">סכום לכל תשלום (בערך)</p>
              <p className="text-lg font-bold">{formatCurrency(contractValue / numPayments)}</p>
            </div>

            <div className="space-y-2">
              <Label>תאריכי תשלום</Label>
              {paymentDates.map((date, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-20">תשלום {index + 1}:</span>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      const newDates = [...paymentDates];
                      newDates[index] = e.target.value;
                      setPaymentDates(newDates);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                ביטול
              </Button>
              <Button 
                onClick={handleCreateSchedule}
                disabled={createPaymentSchedule.isPending}
              >
                {createPaymentSchedule.isPending ? 'יוצר...' : 'צור לוח תשלומים'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
