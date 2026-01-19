import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  FileText,
  Calendar,
  User,
  Building,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Contract, useContracts } from '@/hooks/useContracts';
import { PaymentScheduleView } from './PaymentScheduleView';
import { cn } from '@/lib/utils';

interface ContractDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'טיוטה', color: 'bg-muted text-muted-foreground', icon: FileText },
  active: { label: 'פעיל', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
  completed: { label: 'הושלם', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: CheckCircle2 },
  terminated: { label: 'בוטל', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: XCircle },
  expired: { label: 'פג תוקף', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: Clock },
};

const contractTypeLabels: Record<string, string> = {
  fixed_price: 'מחיר קבוע',
  hourly: 'לפי שעה',
  milestone: 'אבני דרך',
  retainer: 'ריטיינר',
};

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: 'העברה בנקאית',
  credit_card: 'כרטיס אשראי',
  check: "צ'ק",
  cash: 'מזומן',
};

export function ContractDetails({ open, onOpenChange, contract }: ContractDetailsProps) {
  const { usePaymentSchedules } = useContracts();
  const { data: paymentSchedules = [] } = usePaymentSchedules(contract.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const status = statusConfig[contract.status] || statusConfig.active;
  const StatusIcon = status.icon;

  const totalPaid = paymentSchedules.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  const totalPending = contract.contract_value - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{contract.title}</DialogTitle>
            <Badge className={cn('gap-1', status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono">{contract.contract_number}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm">לקוח</span>
                </div>
                <p className="font-medium">{contract.clients?.name || '-'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Building className="h-4 w-4" />
                  <span className="text-sm">סוג חוזה</span>
                </div>
                <p className="font-medium">{contractTypeLabels[contract.contract_type]}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">ערך החוזה</span>
                </div>
                <p className="font-medium text-lg">{formatCurrency(contract.contract_value)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">תקופה</span>
                </div>
                <p className="font-medium text-sm">
                  {format(new Date(contract.start_date), 'dd/MM/yy', { locale: he })}
                  {contract.end_date && ` - ${format(new Date(contract.end_date), 'dd/MM/yy', { locale: he })}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">סיכום תשלומים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">סה"כ חוזה</p>
                  <p className="text-xl font-bold">{formatCurrency(contract.contract_value)}</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">שולם</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-orange-600 dark:text-orange-400">ממתין</p>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalPending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            {contract.payment_method && (
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">אמצעי תשלום</p>
                <p className="font-medium">{paymentMethodLabels[contract.payment_method] || contract.payment_method}</p>
              </div>
            )}
            {contract.payment_terms && (
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">תנאי תשלום</p>
                <p className="font-medium">{contract.payment_terms}</p>
              </div>
            )}
          </div>

          {/* Advance Payment */}
          {contract.advance_payment_required && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">נדרש תשלום מקדמה</span>
                  <span className="text-lg font-bold mr-auto">
                    {formatCurrency(contract.advance_payment_amount || 0)}
                  </span>
                  <Badge variant={contract.advance_payment_status === 'received' ? 'default' : 'secondary'}>
                    {contract.advance_payment_status === 'received' ? 'התקבל' : 
                     contract.advance_payment_status === 'waived' ? 'בוטל' : 'ממתין'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Schedule */}
          <PaymentScheduleView 
            contractId={contract.id}
            paymentSchedules={paymentSchedules}
            contractValue={contract.contract_value}
          />

          {/* Description & Notes */}
          {(contract.description || contract.notes) && (
            <>
              <Separator />
              <div className="space-y-4">
                {contract.description && (
                  <div>
                    <h4 className="font-medium mb-2">תיאור</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{contract.description}</p>
                  </div>
                )}
                {contract.notes && (
                  <div>
                    <h4 className="font-medium mb-2">הערות</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{contract.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Terms */}
          {contract.terms_and_conditions && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">תנאים והגבלות</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.terms_and_conditions}</p>
              </div>
            </>
          )}

          {/* Meta */}
          <Separator />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>נחתם: {format(new Date(contract.signed_date), 'dd/MM/yyyy', { locale: he })}</span>
            <span>נוצר: {format(new Date(contract.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
