import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Search, Calendar, TrendingUp, TrendingDown, Wallet, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { BankTransactionsImport } from './BankTransactionsImport';
import * as XLSX from 'xlsx';
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
} from "@/components/ui/alert-dialog";

interface BankTransaction {
  id: string;
  transaction_date: string;
  value_date: string | null;
  description: string;
  reference_number: string | null;
  debit: number;
  credit: number;
  balance: number | null;
  bank_name: string | null;
  account_number: string | null;
  category: string | null;
  notes: string | null;
  source_file: string | null;
  is_reconciled: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: 'income', label: 'הכנסה', color: 'bg-green-500' },
  { value: 'expense', label: 'הוצאה', color: 'bg-red-500' },
  { value: 'transfer', label: 'העברה', color: 'bg-blue-500' },
  { value: 'salary', label: 'משכורת', color: 'bg-purple-500' },
  { value: 'supplier', label: 'ספק', color: 'bg-orange-500' },
  { value: 'tax', label: 'מס', color: 'bg-yellow-500' },
  { value: 'other', label: 'אחר', color: 'bg-gray-500' },
];

export function BankTransactionsView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'current' | 'last' | 'all'>('current');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['bank-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!user,
  });

  const dateFilteredTransactions = useMemo(() => {
    if (dateRange === 'all') return transactions;
    
    const now = new Date();
    const start = dateRange === 'current' 
      ? startOfMonth(now)
      : startOfMonth(subMonths(now, 1));
    const end = dateRange === 'current'
      ? endOfMonth(now)
      : endOfMonth(subMonths(now, 1));

    return transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= start && date <= end;
    });
  }, [transactions, dateRange]);

  const filteredTransactions = useMemo(() => {
    let result = dateFilteredTransactions;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(term) ||
        t.reference_number?.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    return result;
  }, [dateFilteredTransactions, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const totalDebit = filteredTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    const totalCredit = filteredTransactions.reduce((sum, t) => sum + (t.credit || 0), 0);
    const latestBalance = filteredTransactions.find(t => t.balance !== null)?.balance || 0;

    return { totalDebit, totalCredit, latestBalance, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('התנועה נמחקה');
      refetch();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('שגיאה במחיקת התנועה');
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('כל התנועות נמחקו');
      refetch();
    } catch (error) {
      console.error('Error deleting all transactions:', error);
      toast.error('שגיאה במחיקת התנועות');
    }
  };

  const handleCategoryChange = async (id: string, category: string) => {
    try {
      const { error } = await supabase
        .from('bank_transactions')
        .update({ category })
        .eq('id', id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('שגיאה בעדכון הקטגוריה');
    }
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
      'תאריך': format(new Date(t.transaction_date), 'dd/MM/yyyy'),
      'תיאור': t.description,
      'אסמכתא': t.reference_number || '',
      'חובה': t.debit || '',
      'זכות': t.credit || '',
      'יתרה': t.balance || '',
      'קטגוריה': CATEGORIES.find(c => c.value === t.category)?.label || '',
      'בנק': t.bank_name || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תנועות בנק');
    XLSX.writeFile(wb, `bank_transactions_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast.success('הקובץ הורד בהצלחה');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה"כ זכות</p>
                <p className="text-xl font-bold text-green-600">
                  ₪{stats.totalCredit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה"כ חובה</p>
                <p className="text-xl font-bold text-red-600">
                  ₪{stats.totalDebit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">יתרה אחרונה</p>
                <p className="text-xl font-bold">
                  ₪{stats.latestBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">מספר תנועות</p>
                <p className="text-xl font-bold">{stats.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">תנועות בנק</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <BankTransactionsImport onImportComplete={refetch} />
              
              {transactions.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 ml-1" />
                    ייצוא
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 ml-1" />
                        מחק הכל
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>האם למחוק את כל התנועות?</AlertDialogTitle>
                        <AlertDialogDescription>
                          פעולה זו תמחק את כל {transactions.length} התנועות ולא ניתן לשחזר אותן.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll}>מחק הכל</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי תיאור או אסמכתא..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={dateRange} onValueChange={(v: 'current' | 'last' | 'all') => setDateRange(v)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">חודש נוכחי</SelectItem>
                <SelectItem value="last">חודש קודם</SelectItem>
                <SelectItem value="all">כל התקופה</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">אין תנועות להצגה</p>
              <p className="text-sm mt-1">ייבא קובץ Excel מחשבונית ירוקה להתחלה</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">תאריך</TableHead>
                    <TableHead>תיאור</TableHead>
                    <TableHead className="w-[100px]">אסמכתא</TableHead>
                    <TableHead className="w-[100px] text-left">חובה</TableHead>
                    <TableHead className="w-[100px] text-left">זכות</TableHead>
                    <TableHead className="w-[100px] text-left">יתרה</TableHead>
                    <TableHead className="w-[120px]">קטגוריה</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(transaction.transaction_date), 'dd/MM/yy', { locale: he })}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate" title={transaction.description}>
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {transaction.reference_number || '-'}
                      </TableCell>
                      <TableCell className="text-destructive font-medium text-left">
                        {transaction.debit > 0 ? `₪${transaction.debit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium text-left">
                        {transaction.credit > 0 ? `₪${transaction.credit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-left">
                        {transaction.balance !== null ? `₪${transaction.balance.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.category || ''}
                          onValueChange={(v) => handleCategoryChange(transaction.id, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="בחר..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                <Badge variant="secondary" className={`${cat.color} text-white text-xs`}>
                                  {cat.label}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
