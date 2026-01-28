import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MousePointer, 
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  first_clicked_at: string | null;
  open_count: number;
  click_count: number;
  error_message: string | null;
  reminder_id: string | null;
}

interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  openRate: number;
  clickRate: number;
}

export default function EmailAnalytics() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed: 0,
    openRate: 0,
    clickRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('7d');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchEmailLogs();
    }
  }, [user, timeFilter, statusFilter]);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Apply time filter
      if (timeFilter !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        switch (timeFilter) {
          case '24h':
            startDate.setHours(now.getHours() - 24);
            break;
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      setLogs(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: EmailLog[]) => {
    const total = data.length;
    const sent = data.filter(log => log.status === 'sent' || log.status === 'delivered' || log.status === 'opened' || log.status === 'clicked').length;
    const delivered = data.filter(log => log.status === 'delivered' || log.status === 'opened' || log.status === 'clicked').length;
    const opened = data.filter(log => log.opened_at !== null).length;
    const clicked = data.filter(log => log.first_clicked_at !== null).length;
    const bounced = data.filter(log => log.status === 'bounced').length;
    const failed = data.filter(log => log.status === 'failed').length;
    
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

    setStats({
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      openRate,
      clickRate,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: 'ממתין', variant: 'secondary', icon: Clock },
      sent: { label: 'נשלח', variant: 'default', icon: Send },
      delivered: { label: 'נמסר', variant: 'default', icon: CheckCircle },
      opened: { label: 'נפתח', variant: 'default', icon: Eye },
      clicked: { label: 'נלחץ', variant: 'default', icon: MousePointer },
      bounced: { label: 'החזר', variant: 'destructive', icon: AlertCircle },
      failed: { label: 'נכשל', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loading && logs.length === 0) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">ניתוח אימיילים</h1>
            <p className="text-muted-foreground">מעקב וסטטיסטיקות של אימיילים שנשלחו</p>
          </div>
          <Button onClick={fetchEmailLogs} variant="outline">
            <RefreshCw className="h-4 w-4 ml-2" />
            רענן
          </Button>
        </div>

        <div className="flex gap-4">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 שעות אחרונות</SelectItem>
              <SelectItem value="7d">7 ימים אחרונים</SelectItem>
              <SelectItem value="30d">30 ימים אחרונים</SelectItem>
              <SelectItem value="all">כל הזמן</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="sent">נשלח</SelectItem>
              <SelectItem value="delivered">נמסר</SelectItem>
              <SelectItem value="opened">נפתח</SelectItem>
              <SelectItem value="clicked">נלחץ</SelectItem>
              <SelectItem value="bounced">החזר</SelectItem>
              <SelectItem value="failed">נכשל</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="סה״כ נשלחו"
            value={stats.total}
            subtitle={`${stats.sent} נשלחו בהצלחה`}
            icon={Mail}
          />
          <StatCard
            title="נמסרו"
            value={stats.delivered}
            subtitle={`${((stats.delivered / stats.total) * 100 || 0).toFixed(1)}% שיעור הצלחה`}
            icon={CheckCircle}
          />
          <StatCard
            title="שיעור פתיחה"
            value={`${stats.openRate.toFixed(1)}%`}
            subtitle={`${stats.opened} אימיילים נפתחו`}
            icon={Eye}
          />
          <StatCard
            title="שיעור לחיצה"
            value={`${stats.clickRate.toFixed(1)}%`}
            subtitle={`${stats.clicked} לחיצות`}
            icon={MousePointer}
          />
        </div>

        {stats.bounced > 0 || stats.failed > 0 ? (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                בעיות באימיילים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {stats.bounced > 0 && (
                  <div>
                    <span className="font-medium">החזרים: </span>
                    <span>{stats.bounced}</span>
                  </div>
                )}
                {stats.failed > 0 && (
                  <div>
                    <span className="font-medium">כשלונות: </span>
                    <span>{stats.failed}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Email Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>יומן אימיילים</CardTitle>
            <CardDescription>רשימת כל האימיילים שנשלחו</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>נמען</TableHead>
                  <TableHead>נושא</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>נשלח</TableHead>
                  <TableHead>פעילות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      אין אימיילים להצגה
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.to_email}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{log.subject}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {log.sent_at
                          ? format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm', { locale: he })
                          : format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 text-sm">
                          {log.open_count > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {log.open_count}
                            </Badge>
                          )}
                          {log.click_count > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3" />
                              {log.click_count}
                            </Badge>
                          )}
                          {log.error_message && (
                            <Badge variant="destructive" className="max-w-[150px] truncate" title={log.error_message}>
                              שגיאה
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
