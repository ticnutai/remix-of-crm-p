import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, Calendar, Percent, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { PaymentStep } from './types';

interface PaymentsEditorProps {
  paymentSteps: PaymentStep[];
  totalAmount: number;
  currency?: string;
  onAddPaymentStep: (step: Omit<PaymentStep, 'id' | 'order'>) => void;
  onUpdatePaymentStep: (id: string, updates: Partial<PaymentStep>) => void;
  onRemovePaymentStep: (id: string) => void;
}

const formatCurrency = (amount: number, currency: string = 'ILS') => {
  const currencyMap: Record<string, string> = {
    ILS: '₪',
    USD: '$',
    EUR: '€',
  };
  const symbol = currencyMap[currency] || '₪';
  return `${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${symbol}`;
};

const defaultNewStep: Omit<PaymentStep, 'id' | 'order'> = {
  description: '',
  percentage: 0,
  amount: 0,
  condition: '',
  dueDate: '',
  status: 'pending',
};

const STATUS_CONFIG = {
  pending: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-700', icon: Calendar },
  paid: { label: 'שולם', color: 'bg-green-100 text-green-700', icon: Check },
  overdue: { label: 'באיחור', color: 'bg-red-100 text-red-700', icon: Calendar },
};

export function PaymentsEditor({
  paymentSteps,
  totalAmount,
  currency = 'ILS',
  onAddPaymentStep,
  onUpdatePaymentStep,
  onRemovePaymentStep,
}: PaymentsEditorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStep, setNewStep] = useState<Omit<PaymentStep, 'id' | 'order'>>(defaultNewStep);
  const [editingStep, setEditingStep] = useState<PaymentStep | null>(null);
  const [usePercentage, setUsePercentage] = useState(true);

  // Calculate totals and remaining
  const { totalPercentage, totalPaid, remaining } = useMemo(() => {
    const percentSum = paymentSteps.reduce((sum, s) => sum + (s.percentage || 0), 0);
    const paidSum = paymentSteps
      .filter((s) => s.status === 'paid')
      .reduce((sum, s) => sum + (s.amount || (totalAmount * (s.percentage || 0)) / 100), 0);
    return {
      totalPercentage: percentSum,
      totalPaid: paidSum,
      remaining: totalAmount - paidSum,
    };
  }, [paymentSteps, totalAmount]);

  const handleAddStep = () => {
    if (!newStep.description.trim()) return;
    
    const step = {
      ...newStep,
      amount: usePercentage 
        ? (totalAmount * (newStep.percentage || 0)) / 100
        : newStep.amount,
    };
    
    onAddPaymentStep(step);
    setNewStep(defaultNewStep);
    setIsAddDialogOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingStep) return;
    onUpdatePaymentStep(editingStep.id, editingStep);
    setEditingStep(null);
  };

  const handleToggleStatus = (step: PaymentStep) => {
    const newStatus = step.status === 'paid' ? 'pending' : 'paid';
    onUpdatePaymentStep(step.id, { 
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date().toISOString() : undefined,
    });
  };

  const StepDialog = ({
    step,
    setStep,
    onSave,
    title,
  }: {
    step: Omit<PaymentStep, 'id' | 'order'>;
    setStep: (step: Omit<PaymentStep, 'id' | 'order'>) => void;
    onSave: () => void;
    title: string;
  }) => (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="description">תיאור התשלום *</Label>
          <Input
            id="description"
            value={step.description}
            onChange={(e) => setStep({ ...step, description: e.target.value })}
            placeholder='לדוגמה: "מקדמה", "עם סיום העבודות"'
          />
        </div>

        <div className="flex items-center gap-2 border rounded-lg p-1">
          <Button
            type="button"
            variant={usePercentage ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 gap-1"
            onClick={() => setUsePercentage(true)}
          >
            <Percent className="h-4 w-4" />
            אחוזים
          </Button>
          <Button
            type="button"
            variant={!usePercentage ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 gap-1"
            onClick={() => setUsePercentage(false)}
          >
            <DollarSign className="h-4 w-4" />
            סכום קבוע
          </Button>
        </div>

        <div className="grid gap-2">
          {usePercentage ? (
            <>
              <Label htmlFor="percentage">אחוז מהסכום הכולל</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={step.percentage}
                  onChange={(e) =>
                    setStep({
                      ...step,
                      percentage: Number(e.target.value),
                      amount: (totalAmount * Number(e.target.value)) / 100,
                    })
                  }
                />
                <span className="text-lg font-medium">%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                = {formatCurrency((totalAmount * (step.percentage || 0)) / 100, currency)}
              </p>
            </>
          ) : (
            <>
              <Label htmlFor="amount">סכום</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={step.amount}
                onChange={(e) =>
                  setStep({
                    ...step,
                    amount: Number(e.target.value),
                    percentage: totalAmount > 0 ? (Number(e.target.value) / totalAmount) * 100 : 0,
                  })
                }
              />
            </>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="condition">תנאי תשלום</Label>
          <Input
            id="condition"
            value={step.condition || ''}
            onChange={(e) => setStep({ ...step, condition: e.target.value })}
            placeholder='לדוגמה: "בחתימה על ההסכם"'
          />
        </div>

        <div className="grid gap-2">
          <Label>תאריך יעד</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-right font-normal',
                  !step.dueDate && 'text-muted-foreground'
                )}
              >
                <Calendar className="ml-2 h-4 w-4" />
                {step.dueDate
                  ? format(new Date(step.dueDate), 'dd/MM/yyyy', { locale: he })
                  : 'בחר תאריך'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={step.dueDate ? new Date(step.dueDate) : undefined}
                onSelect={(date) =>
                  setStep({ ...step, dueDate: date?.toISOString() || '' })
                }
                locale={he}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSave} disabled={!step.description.trim()}>
          שמור
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">לוח תשלומים</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                הוסף תשלום
              </Button>
            </DialogTrigger>
            <DialogContent>
              <StepDialog
                step={newStep}
                setStep={setNewStep}
                onSave={handleAddStep}
                title="הוספת שלב תשלום"
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Progress Summary */}
        {paymentSteps.length > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">התקדמות תשלומים</span>
              <span className="font-medium">
                {formatCurrency(totalPaid, currency)} / {formatCurrency(totalAmount, currency)}
              </span>
            </div>
            <Progress value={(totalPaid / totalAmount) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{((totalPaid / totalAmount) * 100).toFixed(0)}% שולם</span>
              <span>נותר: {formatCurrency(remaining, currency)}</span>
            </div>
          </div>
        )}

        {paymentSteps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>אין שלבי תשלום</p>
            <p className="text-sm mt-1">הוסף שלבי תשלום לפי אבני דרך</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paymentSteps.map((step, index) => {
              const stepAmount = step.amount || (totalAmount * (step.percentage || 0)) / 100;
              const statusInfo = STATUS_CONFIG[step.status || 'pending'];
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'border rounded-lg p-3 bg-background transition-colors',
                    step.status === 'paid' && 'bg-green-50/50 border-green-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleStatus(step)}
                      className={cn(
                        'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        step.status === 'paid'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-muted-foreground/50 hover:border-primary'
                      )}
                    >
                      {step.status === 'paid' && <Check className="h-4 w-4" />}
                    </button>

                    {/* Step Number */}
                    <span className="text-sm text-muted-foreground w-6">
                      {index + 1}.
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-medium',
                            step.status === 'paid' && 'line-through text-muted-foreground'
                          )}
                        >
                          {step.description}
                        </span>
                        <Badge variant="outline" className={cn('text-xs', statusInfo.color)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        {step.percentage && <span>{step.percentage}%</span>}
                        {step.condition && <span>• {step.condition}</span>}
                        {step.dueDate && (
                          <span>
                            • {format(new Date(step.dueDate), 'dd/MM/yyyy', { locale: he })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <span className="font-semibold text-primary whitespace-nowrap">
                      {formatCurrency(stepAmount, currency)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Dialog
                        open={editingStep?.id === step.id}
                        onOpenChange={(open) => setEditingStep(open ? step : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          {editingStep && (
                            <StepDialog
                              step={editingStep}
                              setStep={(s) =>
                                setEditingStep({
                                  ...editingStep,
                                  ...s,
                                } as PaymentStep)
                              }
                              onSave={handleSaveEdit}
                              title="עריכת שלב תשלום"
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת שלב תשלום</AlertDialogTitle>
                            <AlertDialogDescription>
                              האם אתה בטוח שברצונך למחוק את שלב התשלום "{step.description}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRemovePaymentStep(step.id)}>
                              מחק
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total Summary */}
        {paymentSteps.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>סה"כ מתוכנן</span>
              <span className={cn(totalPercentage !== 100 && 'text-orange-500')}>
                {totalPercentage.toFixed(0)}%
              </span>
            </div>
            {totalPercentage !== 100 && (
              <p className="text-xs text-orange-500 mt-1">
                {totalPercentage < 100
                  ? `חסר ${(100 - totalPercentage).toFixed(0)}% לסכום הכולל`
                  : `חריגה של ${(totalPercentage - 100).toFixed(0)}% מהסכום הכולל`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
