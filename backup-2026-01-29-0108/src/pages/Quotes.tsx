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
  FileSignature,
  Building2,
  Calendar,
  AlertCircle,
  PenTool,
  Download,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuotes, Quote, QuoteFormData } from '@/hooks/useQuotes';
import { useContracts, Contract, ContractFormData } from '@/hooks/useContracts';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { QuotePaymentDialog } from '@/components/quotes/QuotePaymentDialog';
import { ContractForm } from '@/components/contracts/ContractForm';
import { ContractDetails } from '@/components/contracts/ContractDetails';
import { ContractTemplatesManager } from '@/components/contracts/ContractTemplatesManager';
import { QuoteEditorSheet } from '@/components/quotes/QuoteDocumentEditor/QuoteEditorSheet';
import { QuoteTemplatesManager } from '@/components/quotes/QuoteTemplatesManager';
import { cn } from '@/lib/utils';
import { ClipboardList, Settings2 } from 'lucide-react';
import { exportQuoteToPDF } from '@/lib/pdf-export';
import { SignatureDialog, SignatureData } from '@/components/signature';
import { toast } from '@/hooks/use-toast';

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

const contractStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'טיוטה', color: 'bg-muted text-muted-foreground', icon: FileText },
  active: { label: 'פעיל', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
  completed: { label: 'הושלם', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: FileCheck },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: Trash2 },
  terminated: { label: 'הופסק', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
};

export default function Quotes() {
  // Quotes hooks and state
  const { quotes, isLoading: quotesLoading, stats: quotesStats, createQuote, updateQuote, deleteQuote, sendQuote, addPayment, convertToInvoice } = useQuotes();
  
  // Contracts hooks and state
  const { contracts, isLoading: contractsLoading, stats: contractsStats, createContract, updateContract, deleteContract } = useContracts();
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('quotes-active-tab') || 'quotes';
  });
  
  // Quotes state
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem('quotes-search') || '';
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return localStorage.getItem('quotes-status-filter') || 'all';
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [paymentQuote, setPaymentQuote] = useState<Quote | null>(null);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const [convertQuoteId, setConvertQuoteId] = useState<string | null>(null);
  
  // Contracts state
  const [contractSearchTerm, setContractSearchTerm] = useState(() => {
    return localStorage.getItem('contracts-search') || '';
  });
  const [contractStatusFilter, setContractStatusFilter] = useState<string>(() => {
    return localStorage.getItem('contracts-status-filter') || 'all';
  });
  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);
  const [convertToContractQuote, setConvertToContractQuote] = useState<Quote | null>(null);
  const [terminatingContractId, setTerminatingContractId] = useState<string | null>(null);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [advancedEditorQuote, setAdvancedEditorQuote] = useState<Quote | null>(null);
  const [isAdvancedEditorOpen, setIsAdvancedEditorOpen] = useState(false);
  
  // Signature state
  const [signatureQuote, setSignatureQuote] = useState<Quote | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  
  // Save filters to localStorage
  React.useEffect(() => {
    localStorage.setItem('quotes-active-tab', activeTab);
  }, [activeTab]);
  
  React.useEffect(() => {
    localStorage.setItem('quotes-search', searchTerm);
  }, [searchTerm]);
  
  React.useEffect(() => {
    localStorage.setItem('quotes-status-filter', statusFilter);
  }, [statusFilter]);
  
  React.useEffect(() => {
    localStorage.setItem('contracts-search', contractSearchTerm);
  }, [contractSearchTerm]);
  
  React.useEffect(() => {
    localStorage.setItem('contracts-status-filter', contractStatusFilter);
  }, [contractStatusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Quotes filtering
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Contracts filtering
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.title.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
      contract.contract_number.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
      contract.clients?.name?.toLowerCase().includes(contractSearchTerm.toLowerCase());
    
    const matchesStatus = contractStatusFilter === 'all' || contract.status === contractStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Quote handlers
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
  
  // PDF Export handler
  const handleExportQuotePDF = (quote: Quote) => {
    exportQuoteToPDF({
      id: quote.id,
      quoteNumber: quote.quote_number,
      clientName: quote.clients?.name || 'לקוח',
      clientEmail: quote.clients?.email,
      clientPhone: quote.clients?.phone,
      items: quote.items || [],
      subtotal: quote.subtotal || 0,
      discount: quote.discount || 0,
      vat: quote.vat || 0,
      total: quote.total_amount,
      validUntil: quote.valid_until,
      notes: quote.notes,
      terms: quote.terms,
    });
    toast({
      title: 'ייצוא PDF',
      description: 'ההצעה מיוצאת ל-PDF...',
    });
  };
  
  // Signature handler
  const handleSignQuote = async (signature: SignatureData) => {
    if (!signatureQuote) return;
    
    // Update quote status to signed
    await updateQuote.mutateAsync({
      id: signatureQuote.id,
      status: 'signed',
      // Store signature data in metadata or a dedicated field
    });
    
    toast({
      title: 'הצעה נחתמה',
      description: `ההצעה ${signatureQuote.quote_number} נחתמה בהצלחה`,
    });
    
    setSignatureQuote(null);
    setIsSignatureDialogOpen(false);
  };
  
  // Contract handlers
  const handleCreateContract = async (data: ContractFormData) => {
    await createContract.mutateAsync(data);
    setIsContractFormOpen(false);
    setConvertToContractQuote(null);
  };

  const handleUpdateContract = async (data: ContractFormData) => {
    if (!editingContract) return;
    await updateContract.mutateAsync({ id: editingContract.id, ...data });
    setEditingContract(null);
  };

  const handleDeleteContract = async () => {
    if (!deleteContractId) return;
    await deleteContract.mutateAsync(deleteContractId);
    setDeleteContractId(null);
  };
  
  const handleConvertToContract = (quote: Quote) => {
    setConvertToContractQuote(quote);
    setIsContractFormOpen(true);
    setActiveTab('contracts');
  };
  
  const handleActivateContract = async (contractId: string) => {
    await updateContract.mutateAsync({ id: contractId, status: 'active' });
  };
  
  const handleCompleteContract = async (contractId: string) => {
    await updateContract.mutateAsync({ id: contractId, status: 'completed' });
  };
  
  const handleTerminateContract = async () => {
    if (!terminatingContractId) return;
    await updateContract.mutateAsync({ 
      id: terminatingContractId, 
      status: 'terminated',
      terminated_at: new Date().toISOString(),
    });
    setTerminatingContractId(null);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">הצעות מחיר וחוזים</h1>
            <p className="text-muted-foreground">ניהול הצעות מחיר, חוזים ולוחות תשלומים</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="quotes" className="gap-2">
              <FileText className="h-4 w-4" />
              הצעות מחיר
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2">
              <FileSignature className="h-4 w-4" />
              חוזים
            </TabsTrigger>
            <TabsTrigger value="ready-templates" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              תבניות מוכנות
            </TabsTrigger>
            <TabsTrigger value="template-manager" className="gap-2">
              <Settings2 className="h-4 w-4" />
              ניהול תבניות
            </TabsTrigger>
          </TabsList>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6 mt-6">
            {/* Quotes Header */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdvancedEditorOpen(true)}>
                <PenTool className="h-4 w-4 ml-2" />
                עורך מתקדם
              </Button>
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
                      <p className="text-2xl font-bold">{quotesStats.total}</p>
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
                      <p className="text-2xl font-bold">{quotesStats.sent}</p>
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
                      <p className="text-2xl font-bold">{quotesStats.signed}</p>
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
                      <p className="text-2xl font-bold">{formatCurrency(quotesStats.paidValue)}</p>
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
                    {quotesLoading ? (
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
                                  <DropdownMenuItem onClick={() => {
                                    setAdvancedEditorQuote(quote);
                                    setIsAdvancedEditorOpen(true);
                                  }}>
                                    <PenTool className="h-4 w-4 ml-2" />
                                    עורך מתקדם
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditingQuote(quote)}>
                                    <Pencil className="h-4 w-4 ml-2" />
                                    עריכה מהירה
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExportQuotePDF(quote)}>
                                    <Download className="h-4 w-4 ml-2" />
                                    ייצוא PDF
                                  </DropdownMenuItem>
                                  {quote.status !== 'signed' && quote.status !== 'cancelled' && (
                                    <DropdownMenuItem onClick={() => {
                                      setSignatureQuote(quote);
                                      setIsSignatureDialogOpen(true);
                                    }}>
                                      <FileSignature className="h-4 w-4 ml-2" />
                                      חתום על ההצעה
                                    </DropdownMenuItem>
                                  )}
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
                                    <>
                                      <DropdownMenuItem onClick={() => setConvertQuoteId(quote.id)}>
                                        <ArrowRightLeft className="h-4 w-4 ml-2" />
                                        המר לחשבונית
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleConvertToContract(quote)}>
                                        <FileSignature className="h-4 w-4 ml-2" />
                                        המר לחוזה
                                      </DropdownMenuItem>
                                    </>
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
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6 mt-6">
            {/* Contracts Header */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTemplateManagerOpen(true)}>
                <FileText className="h-4 w-4 ml-2" />
                ניהול תבניות
              </Button>
              <Button onClick={() => setIsContractFormOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                חוזה חדש
              </Button>
            </div>
            
            {/* Contracts Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileSignature className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">סה"כ חוזים</p>
                      <p className="text-2xl font-bold">{contractsStats.total}</p>
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
                      <p className="text-sm text-muted-foreground">פעילים</p>
                      <p className="text-2xl font-bold">{contractsStats.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <FileCheck className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">הושלמו</p>
                      <p className="text-2xl font-bold">{contractsStats.completed}</p>
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
                      <p className="text-sm text-muted-foreground">ערך כולל</p>
                      <p className="text-2xl font-bold">{formatCurrency(contractsStats.totalValue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contracts Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש חוזים..."
                  value={contractSearchTerm}
                  onChange={(e) => setContractSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={contractStatusFilter} onValueChange={setContractStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  {Object.entries(contractStatusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contracts Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>מספר חוזה</TableHead>
                      <TableHead>לקוח</TableHead>
                      <TableHead>כותרת</TableHead>
                      <TableHead>ערך</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>תאריך התחלה</TableHead>
                      <TableHead>תאריך סיום</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          טוען חוזים...
                        </TableCell>
                      </TableRow>
                    ) : filteredContracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          לא נמצאו חוזים
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredContracts.map((contract) => {
                        const status = contractStatusConfig[contract.status || 'draft'] || contractStatusConfig.draft;
                        const StatusIcon = status.icon;

                        return (
                          <TableRow key={contract.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono font-medium">
                              {contract.contract_number}
                            </TableCell>
                            <TableCell>{contract.clients?.name || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {contract.title}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(contract.contract_value)}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('gap-1', status.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: he })}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {contract.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setViewingContract(contract)}>
                                    <Eye className="h-4 w-4 ml-2" />
                                    צפייה ולוח תשלומים
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditingContract(contract)}>
                                    <Pencil className="h-4 w-4 ml-2" />
                                    עריכה
                                  </DropdownMenuItem>
                                  {contract.status === 'draft' && (
                                    <DropdownMenuItem onClick={() => handleActivateContract(contract.id)}>
                                      <Send className="h-4 w-4 ml-2" />
                                      הפעל חוזה
                                    </DropdownMenuItem>
                                  )}
                                  {contract.status === 'active' && (
                                    <DropdownMenuItem onClick={() => handleCompleteContract(contract.id)}>
                                      <CheckCircle2 className="h-4 w-4 ml-2" />
                                      סמן כהושלם
                                    </DropdownMenuItem>
                                  )}
                                  {contract.status === 'active' && (
                                    <DropdownMenuItem onClick={() => setTerminatingContractId(contract.id)}>
                                      <AlertCircle className="h-4 w-4 ml-2" />
                                      הפסק חוזה
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => setDeleteContractId(contract.id)}
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
          </TabsContent>

          {/* Ready Templates Tab - תבניות מוכנות */}
          <TabsContent value="ready-templates" className="space-y-6 mt-6">
            <QuoteTemplatesManager />
          </TabsContent>

          {/* Template Manager Tab - ניהול תבניות */}
          <TabsContent value="template-manager" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">ניהול תבניות חוזים</h2>
                  <p className="text-muted-foreground">עריכה והגדרת תבניות חוזים</p>
                </div>
                <Button onClick={() => setIsTemplateManagerOpen(true)}>
                  <Settings2 className="h-4 w-4 ml-2" />
                  פתח מנהל תבניות חוזים
                </Button>
              </div>
              <Card>
                <CardContent className="py-12 text-center">
                  <Settings2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    לחץ על הכפתור למעלה לניהול תבניות חוזים
                  </p>
                  <p className="text-sm text-muted-foreground">
                    תבניות הצעות מחיר מנוהלות בטאב "תבניות מוכנות"
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quote Create/Edit Form Dialog */}
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

      {/* Delete Quote Confirmation */}
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
      
      {/* Contract Create/Edit Form Dialog */}
      <ContractForm
        open={isContractFormOpen || !!editingContract}
        onOpenChange={(open) => {
          if (!open) {
            setIsContractFormOpen(false);
            setEditingContract(null);
            setConvertToContractQuote(null);
          }
        }}
        onSubmit={editingContract ? handleUpdateContract : handleCreateContract}
        initialData={editingContract || undefined}
        quoteData={convertToContractQuote ? {
          client_id: convertToContractQuote.client_id,
          title: convertToContractQuote.title,
          contract_value: convertToContractQuote.total_amount,
          quote_id: convertToContractQuote.id,
        } : undefined}
        isLoading={createContract.isPending || updateContract.isPending}
      />
      
      {/* Contract Details Dialog */}
      {viewingContract && (
        <ContractDetails
          contract={viewingContract}
          open={!!viewingContract}
          onOpenChange={(open) => !open && setViewingContract(null)}
        />
      )}

      {/* Delete Contract Confirmation */}
      <AlertDialog open={!!deleteContractId} onOpenChange={(open) => !open && setDeleteContractId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את החוזה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו לא ניתנת לביטול. החוזה ולוח התשלומים שלו יימחקו לצמיתות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContract} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Terminate Contract Confirmation */}
      <AlertDialog open={!!terminatingContractId} onOpenChange={(open) => !open && setTerminatingContractId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>הפסקת חוזה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך להפסיק חוזה זה? החוזה יסומן כמופסק ולא ניתן יהיה להפעילו מחדש.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleTerminateContract} className="bg-orange-600 text-white hover:bg-orange-700">
              הפסק חוזה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Contract Templates Manager */}
      <ContractTemplatesManager
        open={isTemplateManagerOpen}
        onOpenChange={setIsTemplateManagerOpen}
      />

      {/* Advanced Quote Editor Sheet */}
      <QuoteEditorSheet
        open={isAdvancedEditorOpen}
        onOpenChange={setIsAdvancedEditorOpen}
        quote={advancedEditorQuote}
        onSaved={() => {
          setAdvancedEditorQuote(null);
        }}
      />
      
      {/* Digital Signature Dialog */}
      <SignatureDialog
        open={isSignatureDialogOpen}
        onOpenChange={setIsSignatureDialogOpen}
        onSign={handleSignQuote}
        documentTitle={signatureQuote?.title || 'הצעת מחיר'}
        signerName={signatureQuote?.clients?.name}
        signerEmail={signatureQuote?.clients?.email}
      />
    </AppLayout>
  );
}
