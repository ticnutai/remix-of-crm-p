import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileText,
  RefreshCcw,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useAllClientsPayments, ClientDebt, PaymentAlert } from '@/hooks/useClientPayments';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('he-IL');
};

// Alert Card Component
function AlertCard({ alert }: { alert: PaymentAlert }) {
  const navigate = useNavigate();
  
  const getAlertStyle = () => {
    switch (alert.type) {
      case 'overdue':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          text: `באיחור ${alert.days_overdue} ימים`,
        };
      case 'upcoming':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
          text: alert.days_remaining === 0 ? 'היום!' : `${alert.days_remaining} ימים`,
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: <FileText className="h-5 w-5 text-blue-600" />,
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          text: 'התראה',
        };
    }
  };

  const style = getAlertStyle();

  return (
    <div className={cn('p-4 rounded-lg border', style.bg)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {style.icon}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {alert.client_name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              חשבונית #{alert.invoice_number}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              תאריך יעד: {formatDate(alert.due_date)}
            </p>
          </div>
        </div>
        <div className="text-left">
          <Badge className={style.badge}>{style.text}</Badge>
          <p className="font-bold text-gray-900 dark:text-white mt-2">
            {formatCurrency(alert.amount)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-xs"
            onClick={() => navigate(`/client-profile/${alert.client_id}`)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            לפרופיל
          </Button>
        </div>
      </div>
    </div>
  );
}

// Debt Row Component
function DebtRow({ debt }: { debt: ClientDebt }) {
  const navigate = useNavigate();
  const paidPercent = debt.total_invoiced > 0 
    ? (debt.total_paid / debt.total_invoiced) * 100 
    : 0;

  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={() => navigate(`/client-profile/${debt.client_id}`)}
    >
      <TableCell className="font-medium">{debt.client_name}</TableCell>
      <TableCell className="text-left">{formatCurrency(debt.total_invoiced)}</TableCell>
      <TableCell className="text-left">{formatCurrency(debt.total_paid)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={paidPercent} className="w-20 h-2" />
          <span className="text-xs text-gray-500">{Math.round(paidPercent)}%</span>
        </div>
      </TableCell>
      <TableCell className="text-left font-bold text-orange-600">
        {formatCurrency(debt.outstanding)}
      </TableCell>
      <TableCell className="text-left">
        {debt.overdue_amount > 0 ? (
          <span className="text-red-600 font-semibold">
            {formatCurrency(debt.overdue_amount)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell>
        {debt.overdue_days && debt.overdue_days > 0 ? (
          <Badge variant="destructive">{debt.overdue_days} ימים</Badge>
        ) : debt.next_due_date ? (
          <Badge variant="outline">{formatDate(debt.next_due_date)}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function Payments() {
  const { debts, alerts, totals, isLoading, refresh } = useAllClientsPayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOverdue, setFilterOverdue] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('outstanding');

  // Filter and sort debts
  const filteredDebts = useMemo(() => {
    let result = [...debts];

    // Search filter
    if (searchTerm) {
      result = result.filter(d =>
        d.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Overdue filter
    if (filterOverdue === 'overdue') {
      result = result.filter(d => d.overdue_amount > 0);
    } else if (filterOverdue === 'current') {
      result = result.filter(d => d.overdue_amount === 0);
    }

    // Sort
    switch (sortBy) {
      case 'outstanding':
        result.sort((a, b) => b.outstanding - a.outstanding);
        break;
      case 'overdue':
        result.sort((a, b) => b.overdue_amount - a.overdue_amount);
        break;
      case 'name':
        result.sort((a, b) => a.client_name.localeCompare(b.client_name, 'he'));
        break;
      case 'days':
        result.sort((a, b) => (b.overdue_days || 0) - (a.overdue_days || 0));
        break;
    }

    return result;
  }, [debts, searchTerm, filterOverdue, sortBy]);

  // Separate alerts by type
  const overdueAlerts = alerts.filter(a => a.type === 'overdue');
  const upcomingAlerts = alerts.filter(a => a.type === 'upcoming');

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Wallet className="h-8 w-8 text-green-600" />
              מערכת תשלומים כללית
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              סקירה כללית של תשלומים וחובות לקוחות
            </p>
          </div>
          <Button onClick={refresh} disabled={isLoading} variant="outline">
            <RefreshCcw className={cn('h-4 w-4 ml-2', isLoading && 'animate-spin')} />
            רענן נתונים
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <FileText className="h-8 w-8 opacity-70" />
                <div className="text-left">
                  <p className="text-xs opacity-80">סה"כ הופק</p>
                  <p className="text-xl font-bold">{formatCurrency(totals.totalInvoiced)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 opacity-70" />
                <div className="text-left">
                  <p className="text-xs opacity-80">שולם</p>
                  <p className="text-xl font-bold">{formatCurrency(totals.totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 opacity-70" />
                <div className="text-left">
                  <p className="text-xs opacity-80">יתרה לתשלום</p>
                  <p className="text-xl font-bold">{formatCurrency(totals.totalOutstanding)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-8 w-8 opacity-70" />
                <div className="text-left">
                  <p className="text-xs opacity-80">באיחור</p>
                  <p className="text-xl font-bold">{formatCurrency(totals.totalOverdue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 opacity-70" />
                <div className="text-left">
                  <p className="text-xs opacity-80">לקוחות עם חוב</p>
                  <p className="text-xl font-bold">{totals.clientsWithDebt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="debts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="debts" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              חובות לקוחות
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              באיחור ({overdueAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              קרוב ({upcomingAlerts.length})
            </TabsTrigger>
          </TabsList>

          {/* Debts Tab */}
          <TabsContent value="debts">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-lg">חובות לפי לקוח</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="חיפוש לקוח..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-9 w-48"
                      />
                    </div>
                    <Select value={filterOverdue} onValueChange={setFilterOverdue}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">הכל</SelectItem>
                        <SelectItem value="overdue">באיחור בלבד</SelectItem>
                        <SelectItem value="current">שוטף בלבד</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outstanding">לפי יתרה</SelectItem>
                        <SelectItem value="overdue">לפי איחור</SelectItem>
                        <SelectItem value="days">לפי ימי איחור</SelectItem>
                        <SelectItem value="name">לפי שם</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">טוען...</div>
                ) : filteredDebts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm || filterOverdue !== 'all' 
                      ? 'לא נמצאו תוצאות' 
                      : 'אין חובות פתוחים 🎉'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>לקוח</TableHead>
                          <TableHead className="text-left">סה"כ הופק</TableHead>
                          <TableHead className="text-left">שולם</TableHead>
                          <TableHead>התקדמות</TableHead>
                          <TableHead className="text-left">יתרה</TableHead>
                          <TableHead className="text-left">באיחור</TableHead>
                          <TableHead>סטטוס</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDebts.map((debt) => (
                          <DebtRow key={debt.client_id} debt={debt} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overdue Tab */}
          <TabsContent value="overdue">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  תשלומים באיחור ({overdueAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    אין תשלומים באיחור 🎉
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {overdueAlerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  תשלומים קרובים ({upcomingAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    אין תשלומים קרובים (7 ימים הקרובים)
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingAlerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
