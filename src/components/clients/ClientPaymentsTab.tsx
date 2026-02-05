import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useClientPayments, PaymentAlert } from '@/hooks/useClientPayments';
import { format, differenceInDays, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface ClientPaymentsTabProps {
  clientId: string;
  clientName: string;
}

const formatCurrency = (amount: number): string => {
  return `₪${Math.round(amount).toLocaleString('he-IL')}`;
};

const PaymentMethodBadge = ({ method }: { method: string }) => {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    cash: { label: 'מזומן', color: 'bg-green-500/20 text-green-600', icon: <Wallet className="h-3 w-3" /> },
    check: { label: 'צ\'ק', color: 'bg-blue-500/20 text-blue-600', icon: <FileText className="h-3 w-3" /> },
    transfer: { label: 'העברה', color: 'bg-purple-500/20 text-purple-600', icon: <ArrowUpRight className="h-3 w-3" /> },
    credit_card: { label: 'אשראי', color: 'bg-orange-500/20 text-orange-600', icon: <CreditCard className="h-3 w-3" /> },
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

const AlertCard = ({ alert }: { alert: PaymentAlert }) => {
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
          <span className="font-bold text-lg">{formatCurrency(alert.amount)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {getAlertMessage()}
        </div>
      </div>
    </div>
  );
};

export function ClientPaymentsTab({ clientId, clientName }: ClientPaymentsTabProps) {
  const {
    invoices,
    summary,
    isLoading,
    addInvoicePayment,
    getAlerts,
  } = useClientPayments(clientId);

  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const alerts = useMemo(() => getAlerts(), [getAlerts]);
  
  const overdueAlerts = alerts.filter(a => a.type === 'overdue');
  const upcomingAlerts = alerts.filter(a => a.type === 'upcoming');

  // Calculate invoice details
  const invoicesWithDetails = useMemo(() => {
    return invoices.map((inv: any) => {
      const paidAmount = (inv.invoice_payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const remainingAmount = Number(inv.amount) - paidAmount;
      const paymentProgress = (paidAmount / Number(inv.amount)) * 100;
      const isPartiallyPaid = paidAmount > 0 && remainingAmount > 0;
      
      return {
        ...inv,
        paidAmount,
        remainingAmount,
        paymentProgress,
        isPartiallyPaid,
      };
    });
  }, [invoices]);

  const pendingInvoices = invoicesWithDetails.filter((inv: any) => 
    inv.status !== 'paid' && inv.status !== 'cancelled' && inv.remainingAmount > 0
  );

  const handleOpenPaymentDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.remainingAmount.toString());
    setPaymentMethod('transfer');
    setPaymentNotes('');
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
        paymentNotes
      );
      setIsPaymentDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <AlertCard key={alert.id} alert={alert} />
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
        <TabsList className="w-full justify-start">
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
                          <p className="text-lg font-bold">{formatCurrency(invoice.amount)}</p>
                          {invoice.isPartiallyPaid && (
                            <p className="text-sm text-muted-foreground">
                              יתרה: {formatCurrency(invoice.remainingAmount)}
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
                          <span className="font-bold text-green-600">{formatCurrency(invoice.amount)}</span>
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
                      .map((payment: any) => (
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
                                {payment.notes && ` • ${payment.notes}`}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-green-600">+{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
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
                                {formatCurrency(invoice.remainingAmount)}
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
                          <AlertCard key={alert.id} alert={alert} />
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
                          <AlertCard key={alert.id} alert={alert} />
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
                  <span className="font-bold text-lg">{formatCurrency(selectedInvoice.remainingAmount)}</span>
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

              <div className="space-y-2">
                <Label>אמצעי תשלום</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">העברה בנקאית</SelectItem>
                    <SelectItem value="credit_card">כרטיס אשראי</SelectItem>
                    <SelectItem value="check">צ'ק</SelectItem>
                    <SelectItem value="cash">מזומן</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
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
