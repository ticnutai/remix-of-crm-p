import React, { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  FileText,
  Plus,
  Search,
  Send,
  Eye,
  Pencil,
  Trash2,
  CreditCard,
  ArrowRightLeft,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  FileCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuotes, Quote, QuoteFormData } from '@/hooks/useQuotes';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { QuotePaymentDialog } from '@/components/quotes/QuotePaymentDialog';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'טיוטה', color: 'bg-muted text-muted-foreground', icon: FileText },
  sent: { label: 'נשלח', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Send },
  viewed: { label: 'נצפה', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: Eye },
  signed: { label: 'נחתם', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
  converted: { label: 'הומר לחשבונית', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: FileCheck },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: Trash2 },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'ממתין', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  partial: { label: 'חלקי', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  paid: { label: 'שולם', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
};

export default function Quotes() {
  const { quotes, isLoading, stats, createQuote, updateQuote, deleteQuote, sendQuote, addPayment, convertToInvoice } = useQuotes();
  
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem('quotes-search') || '';
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return localStorage.getItem('quotes-status-filter') || 'all';
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Save filters to localStorage
  React.useEffect(() => {
    localStorage.setItem('quotes-search', searchTerm);
  }, [searchTerm]);
  
  React.useEffect(() => {
    localStorage.setItem('quotes-status-filter', statusFilter);
  }, [statusFilter]);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [paymentQuote, setPaymentQuote] = useState<Quote | null>(null);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const [convertQuoteId, setConvertQuoteId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateQuote = async (data: QuoteFormData) => {
    await createQuote.mutateAsync(data);
    setIsFormOpen(false);
  };

  const handleUpdateQuote = async (data: QuoteFormData) => {
    if (!editingQuote) return;
    await updateQuote.mutateAsync({ id: editingQuote.id, ...data });
    setEditingQuote(null);
  };

  const handleDeleteQuote = async () => {
    if (!deleteQuoteId) return;
    await deleteQuote.mutateAsync(deleteQuoteId);
    setDeleteQuoteId(null);
  };

  const handleConvertToInvoice = async () => {
    if (!convertQuoteId) return;
    await convertToInvoice.mutateAsync(convertQuoteId);
    setConvertQuoteId(null);
  };

  const handleAddPayment = async (data: { amount: number; payment_method: string; notes?: string }) => {
    if (!paymentQuote) return;
    await addPayment.mutateAsync({ quote_id: paymentQuote.id, ...data });
    setPaymentQuote(null);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">הצעות מחיר</h1>
            <p className="text-muted-foreground">ניהול הצעות מחיר, מעקב תשלומים וחתימות</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            הצעה חדשה
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ הצעות</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ממתינות</p>
                  <p className="text-2xl font-bold">{stats.sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">נחתמו</p>
                  <p className="text-2xl font-bold">{stats.signed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <CreditCard className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">שולם</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.paidValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש הצעות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              {Object.entries(statusConfig).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quotes Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>מספר הצעה</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>כותרת</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תשלום</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      טוען הצעות...
                    </TableCell>
                  </TableRow>
                ) : filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      לא נמצאו הצעות מחיר
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => {
                    const status = statusConfig[quote.status] || statusConfig.draft;
                    const paymentStatus = paymentStatusConfig[quote.payment_status] || paymentStatusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={quote.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-medium">
                          {quote.quote_number}
                        </TableCell>
                        <TableCell>{quote.clients?.name || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {quote.title}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(quote.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('gap-1', status.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentStatus.color}>
                            {paymentStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(quote.created_at), 'dd/MM/yyyy', { locale: he })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingQuote(quote)}>
                                <Pencil className="h-4 w-4 ml-2" />
                                עריכה
                              </DropdownMenuItem>
                              {quote.status === 'draft' && (
                                <DropdownMenuItem onClick={() => sendQuote.mutate(quote.id)}>
                                  <Send className="h-4 w-4 ml-2" />
                                  שלח ללקוח
                                </DropdownMenuItem>
                              )}
                              {quote.status !== 'cancelled' && quote.payment_status !== 'paid' && (
                                <DropdownMenuItem onClick={() => setPaymentQuote(quote)}>
                                  <CreditCard className="h-4 w-4 ml-2" />
                                  הוסף תשלום
                                </DropdownMenuItem>
                              )}
                              {(quote.status === 'signed' || quote.status === 'sent' || quote.status === 'viewed') && !quote.converted_to_invoice_id && (
                                <DropdownMenuItem onClick={() => setConvertQuoteId(quote.id)}>
                                  <ArrowRightLeft className="h-4 w-4 ml-2" />
                                  המר לחשבונית
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteQuoteId(quote.id)}
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                מחק
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form Dialog */}
      <QuoteForm
        open={isFormOpen || !!editingQuote}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingQuote(null);
          }
        }}
        onSubmit={editingQuote ? handleUpdateQuote : handleCreateQuote}
        initialData={editingQuote || undefined}
        isLoading={createQuote.isPending || updateQuote.isPending}
      />

      {/* Payment Dialog */}
      {paymentQuote && (
        <QuotePaymentDialog
          open={!!paymentQuote}
          onOpenChange={(open) => !open && setPaymentQuote(null)}
          quote={paymentQuote}
          onSubmit={handleAddPayment}
          isLoading={addPayment.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuoteId} onOpenChange={(open) => !open && setDeleteQuoteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את ההצעה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו לא ניתנת לביטול. ההצעה תימחק לצמיתות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuote} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Invoice Confirmation */}
      <AlertDialog open={!!convertQuoteId} onOpenChange={(open) => !open && setConvertQuoteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>המרה לחשבונית</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תיצור חשבונית חדשה מהצעת המחיר ותסנכרן עם Green Invoice.
              הצעת המחיר תסומן כ"הומרה לחשבונית".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConvertToInvoice}
              disabled={convertToInvoice.isPending}
            >
              {convertToInvoice.isPending ? 'ממיר...' : 'המר לחשבונית'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
