// רשימת הצעות מחיר לטעינה לעורך

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  DollarSign,
  CheckCircle,
  Clock,
  Send,
  X,
  ArrowRight,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Pencil,
  Plus,
  FolderOpen,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Quote } from '@/hooks/useQuotes';

interface QuotesListProps {
  quotes: Quote[];
  isLoading: boolean;
  selectedQuoteId?: string;
  onSelect: (quote: Quote) => void;
  onNew: () => void;
  collapsed?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'טיוטה', color: 'bg-muted text-muted-foreground', icon: Clock },
  sent: { label: 'נשלח', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send },
  viewed: { label: 'נצפה', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Eye },
  signed: { label: 'חתום', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  converted: { label: 'הומר', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: FileCheck },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: X },
};

export function QuotesList({
  quotes,
  isLoading,
  selectedQuoteId,
  onSelect,
  onNew,
  collapsed = false,
}: QuotesListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'client'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredQuotes = useMemo(() => {
    let result = [...quotes];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(q => 
        q.quote_number.toLowerCase().includes(searchLower) ||
        q.title.toLowerCase().includes(searchLower) ||
        q.clients?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(q => q.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'amount':
          comparison = (a.total_amount || 0) - (b.total_amount || 0);
          break;
        case 'client':
          comparison = (a.clients?.name || '').localeCompare(b.clients?.name || '');
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [quotes, search, statusFilter, sortBy, sortOrder]);

  if (collapsed) {
    return (
      <div className="w-14 bg-card border-l flex flex-col items-center py-4 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onNew}>
              <Plus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">הצעה חדשה</TooltipContent>
        </Tooltip>
        <Separator className="w-8" />
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center text-muted-foreground text-xs">
              <FolderOpen className="h-5 w-5" />
              <span>{quotes.length}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">{quotes.length} הצעות מחיר</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-l flex flex-col" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            הצעות מחיר
          </h3>
          <Button size="sm" onClick={onNew}>
            <Plus className="h-4 w-4 ml-1" />
            חדש
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי מספר, כותרת או לקוח..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="draft">טיוטה</SelectItem>
              <SelectItem value="sent">נשלח</SelectItem>
              <SelectItem value="signed">חתום</SelectItem>
              <SelectItem value="converted">הומר</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">תאריך</SelectItem>
              <SelectItem value="amount">סכום</SelectItem>
              <SelectItem value="client">לקוח</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'desc' ? (
              <SortDesc className="h-4 w-4" />
            ) : (
              <SortAsc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">לא נמצאו הצעות מחיר</p>
            <Button variant="link" onClick={onNew} className="mt-2">
              צור הצעה חדשה
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {filteredQuotes.map((quote) => {
              const status = statusConfig[quote.status] || statusConfig.draft;
              const StatusIcon = status.icon;
              const isSelected = selectedQuoteId === quote.id;

              return (
                <button
                  key={quote.id}
                  onClick={() => onSelect(quote)}
                  className={cn(
                    'w-full text-right p-3 rounded-lg mb-2 transition-all',
                    'hover:bg-accent/50 border',
                    isSelected 
                      ? 'bg-primary/10 border-primary/30 shadow-sm' 
                      : 'bg-card border-transparent hover:border-border'
                  )}
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-primary">
                        {quote.quote_number}
                      </span>
                      <Badge className={cn('text-xs px-2 py-0', status.color)}>
                        <StatusIcon className="h-3 w-3 ml-1" />
                        {status.label}
                      </Badge>
                    </div>
                    {isSelected && (
                      <ArrowRight className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-medium text-sm truncate mb-2">
                    {quote.title}
                  </h4>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{quote.clients?.name || 'לא משויך'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(quote.created_at), 'dd/MM/yyyy', { locale: he })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>
                          ₪{(quote.total_amount || 0).toLocaleString('he-IL')}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer stats */}
      <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{filteredQuotes.length} מתוך {quotes.length} הצעות</span>
          <span className="font-medium">
            סה״כ: ₪{filteredQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0).toLocaleString('he-IL')}
          </span>
        </div>
      </div>
    </div>
  );
}
