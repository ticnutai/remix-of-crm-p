import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, FileSignature, Search, Plus, Calendar, DollarSign,
  ArrowUpDown, Eye, Pencil, PenTool, Download, MoreHorizontal,
  Clock, CheckCircle2, Send, X as XIcon, FileCheck, ArrowRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ClientQuotesContractsTabProps {
  clientId: string;
  clientName: string;
}

const quoteStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'טיוטה', color: 'bg-muted text-muted-foreground', icon: Clock },
  sent: { label: 'נשלח', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send },
  viewed: { label: 'נצפה', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Eye },
  signed: { label: 'חתום', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  converted: { label: 'הומר לחוזה', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: FileCheck },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XIcon },
};

const contractStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'טיוטה', color: 'bg-muted text-muted-foreground' },
  active: { label: 'פעיל', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'הושלם', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

type SortField = 'date' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

export function ClientQuotesContractsTab({ clientId, clientName }: ClientQuotesContractsTabProps) {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState('quotes');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Fetch quotes for this client
  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['client-quotes', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch contracts for this client
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['client-contracts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filteredQuotes = useMemo(() => {
    let result = [...quotes];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(q =>
        q.quote_number?.toLowerCase().includes(s) ||
        q.title?.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(q => q.status === statusFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === 'amount') cmp = (a.total_amount || 0) - (b.total_amount || 0);
      else if (sortField === 'status') cmp = (a.status || '').localeCompare(b.status || '');
      return sortOrder === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [quotes, search, statusFilter, sortField, sortOrder]);

  const filteredContracts = useMemo(() => {
    let result = [...contracts];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c =>
        c.contract_number?.toLowerCase().includes(s) ||
        c.title?.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === 'amount') cmp = (a.contract_value || 0) - (b.contract_value || 0);
      else if (sortField === 'status') cmp = (a.status || '').localeCompare(b.status || '');
      return sortOrder === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [contracts, search, statusFilter, sortField, sortOrder]);

  const formatCurrency = (amount: number) => `₪${(amount || 0).toLocaleString('he-IL')}`;

  const totalQuotesValue = quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  const totalContractsValue = contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">הצעות מחיר</p>
              <p className="text-lg font-bold">{quotes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FileSignature className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">חוזים</p>
              <p className="text-lg font-bold">{contracts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">סה״כ הצעות</p>
              <p className="text-lg font-bold">{formatCurrency(totalQuotesValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">סה״כ חוזים</p>
              <p className="text-lg font-bold">{formatCurrency(totalContractsValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={(v) => { setSubTab(v); setStatusFilter('all'); setSearch(''); }}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TabsList>
            <TabsTrigger value="quotes" className="gap-1.5">
              <FileText className="h-4 w-4" />
              הצעות מחיר ({quotes.length})
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-1.5">
              <FileSignature className="h-4 w-4" />
              חוזים ({contracts.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate(`/document-editor?type=quote&client=${clientId}`)}>
              <Plus className="h-4 w-4 ml-1" />
              הצעה חדשה
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9">
              <Filter className="h-3.5 w-3.5 ml-1" />
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              {subTab === 'quotes' ? (
                <>
                  <SelectItem value="draft">טיוטה</SelectItem>
                  <SelectItem value="sent">נשלח</SelectItem>
                  <SelectItem value="signed">חתום</SelectItem>
                  <SelectItem value="converted">הומר</SelectItem>
                  <SelectItem value="cancelled">בוטל</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="draft">טיוטה</SelectItem>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                  <SelectItem value="cancelled">בוטל</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-28 h-9">
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">תאריך</SelectItem>
              <SelectItem value="amount">סכום</SelectItem>
              <SelectItem value="status">סטטוס</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Quotes Table */}
        <TabsContent value="quotes" className="mt-3">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>מספר</TableHead>
                    <TableHead>כותרת</TableHead>
                    <TableHead>סכום</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>תאריך</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotesLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">טוען...</TableCell></TableRow>
                  ) : filteredQuotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>אין הצעות מחיר ללקוח זה</p>
                        <Button variant="link" size="sm" onClick={() => navigate(`/document-editor?type=quote&client=${clientId}`)}>
                          צור הצעה חדשה
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotes.map((quote) => {
                      const status = quoteStatusConfig[quote.status] || quoteStatusConfig.draft;
                      const StatusIcon = status.icon;
                      return (
                        <TableRow
                          key={quote.id}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => navigate(`/document-editor?type=quote&id=${quote.id}&client=${clientId}`)}
                        >
                          <TableCell className="font-mono font-medium text-sm">{quote.quote_number}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{quote.title}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(quote.total_amount)}</TableCell>
                          <TableCell>
                            <Badge className={cn('gap-1 text-xs', status.color)}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(quote.created_at), 'dd/MM/yyyy', { locale: he })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/document-editor?type=quote&id=${quote.id}&client=${clientId}`);
                                }}>
                                  <PenTool className="h-4 w-4 ml-2" />
                                  עורך מתקדם
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/quotes`);
                                }}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  צפה בדף הצעות
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

        {/* Contracts Table */}
        <TabsContent value="contracts" className="mt-3">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>מספר חוזה</TableHead>
                    <TableHead>כותרת</TableHead>
                    <TableHead>ערך</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>תאריך התחלה</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">טוען...</TableCell></TableRow>
                  ) : filteredContracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <FileSignature className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>אין חוזים ללקוח זה</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContracts.map((contract) => {
                      const status = contractStatusConfig[contract.status] || contractStatusConfig.draft;
                      return (
                        <TableRow
                          key={contract.id}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => navigate(`/quotes`)}
                        >
                          <TableCell className="font-mono font-medium text-sm">{contract.contract_number}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{contract.title}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(contract.contract_value)}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-xs', status.color)}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: he }) : '-'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate('/quotes'); }}>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
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
      </Tabs>
    </div>
  );
}
