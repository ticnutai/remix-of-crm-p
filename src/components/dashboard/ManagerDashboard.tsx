import React, { useState, useEffect } from 'react';
import { useSyncedSetting } from '@/hooks/useSyncedSetting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Briefcase,
  Bell,
  BarChart3,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { InactiveClientsAlert, InactiveClientsWidget } from '@/components/alerts';
import { RevenueForecastChart } from '@/components/analytics';
import { usePushNotifications } from '@/lib/push-notifications';
import {
  WeeklyGoalsWidget,
  QuickActionsWidget,
  CalendarPreviewWidget,
  RecentActivityWidget,
  PerformanceMetricsWidget,
} from './widgets';

const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

function KPICard({ title, value, change, icon, color = 'bg-primary' }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm mt-1 ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(change)}%
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color} text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== localStorage cache helpers =====
const LS_STATS_KEY = 'dashboard_stats_cache_v1';
const LS_REVENUE_KEY = 'dashboard_revenue_cache_v1';

function readLS<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}
function writeLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard_stats'],
    // טעינה מיידית מ-localStorage כדי להציג את כל הדשבורד בבת אחת
    initialData: () => readLS<any>(LS_STATS_KEY),
    initialDataUpdatedAt: () => {
      const raw = localStorage.getItem(LS_STATS_KEY + ':ts');
      return raw ? Number(raw) : 0;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      
      const [
        clientsRes,
        projectsRes,
        invoicesThisMonth,
        invoicesLastMonth,
        quotesRes,
        tasksRes,
        contractsRes,
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id, status, budget'),
        supabase.from('invoices')
          .select('amount, status')
          .gte('issue_date', startOfMonth.toISOString()),
        supabase.from('invoices')
          .select('amount, status')
          .gte('issue_date', startOfLastMonth.toISOString())
          .lte('issue_date', endOfLastMonth.toISOString()),
        supabase.from('quotes')
          .select('id, status')
          .gte('created_at', startOfMonth.toISOString()),
        (supabase as any).from('tasks')
          .select('id, status, priority, due_date'),
        (supabase as any).from('contracts')
          .select('id, status, contract_value'),
      ]);
      
      const totalClients = clientsRes.count || 0;
      const activeProjects = projectsRes.data?.filter(p => p.status === 'active').length || 0;
      
      const revenueThisMonth = invoicesThisMonth.data
        ?.filter((i: any) => i.status === 'paid')
        .reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0;
      
      const revenueLastMonth = invoicesLastMonth.data
        ?.filter((i: any) => i.status === 'paid')
        .reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0;
      
      const revenueChange = revenueLastMonth > 0 
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : 0;
      
      const pendingQuotes = quotesRes.data?.filter(q => q.status === 'pending').length || 0;
      const pendingTasks = tasksRes.data?.filter((t: any) => t.status !== 'done').length || 0;
      const overdueTasks = tasksRes.data?.filter((t: any) => 
        t.status !== 'done' && t.due_date && new Date(t.due_date) < today
      ).length || 0;
      
      const activeContracts = contractsRes.data?.filter((c: any) => c.status === 'active').length || 0;
      const contractsValue = contractsRes.data
        ?.filter((c: any) => c.status === 'active')
        .reduce((sum: number, c: any) => sum + (c.contract_value || 0), 0) || 0;
      
      const result = {
        totalClients,
        activeProjects,
        revenueThisMonth,
        revenueChange,
        pendingQuotes,
        pendingTasks,
        overdueTasks,
        activeContracts,
        contractsValue,
        tasksByStatus: [
          { name: 'לביצוע', value: tasksRes.data?.filter((t: any) => t.status === 'todo').length || 0 },
          { name: 'בתהליך', value: tasksRes.data?.filter((t: any) => t.status === 'in_progress').length || 0 },
          { name: 'לבדיקה', value: tasksRes.data?.filter((t: any) => t.status === 'review').length || 0 },
          { name: 'הושלם', value: tasksRes.data?.filter((t: any) => t.status === 'done').length || 0 },
        ],
        tasksByPriority: [
          { name: 'נמוכה', value: tasksRes.data?.filter((t: any) => t.priority === 'low').length || 0 },
          { name: 'בינונית', value: tasksRes.data?.filter((t: any) => t.priority === 'medium').length || 0 },
          { name: 'גבוהה', value: tasksRes.data?.filter((t: any) => t.priority === 'high').length || 0 },
          { name: 'דחוף', value: tasksRes.data?.filter((t: any) => t.priority === 'urgent').length || 0 },
        ],
      };

      // write-through cache
      writeLS(LS_STATS_KEY, result);
      localStorage.setItem(LS_STATS_KEY + ':ts', String(Date.now()));
      return result;
    }
  });
}

function useRevenueChart() {
  return useQuery({
    queryKey: ['revenue_chart'],
    initialData: () => readLS<{ name: string; revenue: number }[]>(LS_REVENUE_KEY),
    initialDataUpdatedAt: () => {
      const raw = localStorage.getItem(LS_REVENUE_KEY + ':ts');
      return raw ? Number(raw) : 0;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const now = new Date();
      const rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount, issue_date, status')
        .eq('status', 'paid')
        .gte('issue_date', rangeStart.toISOString())
        .lte('issue_date', rangeEnd.toISOString());

      const months: { name: string; revenue: number; key: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: `${d.getFullYear()}-${d.getMonth()}`,
          name: d.toLocaleDateString('he-IL', { month: 'short' }),
          revenue: 0,
        });
      }
      (invoices || []).forEach((inv: any) => {
        const d = new Date(inv.issue_date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const bucket = months.find((m) => m.key === key);
        if (bucket) bucket.revenue += inv.amount || 0;
      });
      const result = months.map(({ name, revenue }) => ({ name, revenue }));
      writeLS(LS_REVENUE_KEY, result);
      localStorage.setItem(LS_REVENUE_KEY + ':ts', String(Date.now()));
      return result;
    }
  });
}


export function ManagerDashboard() {
  const { data: stats } = useDashboardStats();
  const { data: revenueData = [] } = useRevenueChart();
  const { isSupported, subscribe } = usePushNotifications(undefined);
  const [showForecast, setShowForecast] = useSyncedSetting<boolean>({ key: 'dashboard-show-forecast', defaultValue: false });
  const [dashboardView, setDashboardView] = useSyncedSetting<'full' | 'compact'>({ key: 'dashboard-view', defaultValue: 'full' });
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Convert revenue data for forecast
  const revenueHistoryForForecast = revenueData.map((item, index) => ({
    date: new Date(new Date().setMonth(new Date().getMonth() - (revenueData.length - 1 - index))),
    revenue: item.revenue,
  }));
  
  // לא חוסמים את כל הדשבורד על טעינת stats — מציגים שלד מיידי
  // עם optional chaining (stats?.) במקום מסך טעינה ריק

  
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">דשבורד מנהל</h1>
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={dashboardView === 'full' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDashboardView('full')}
              className="h-8 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={dashboardView === 'compact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDashboardView('compact')}
              className="h-8 px-2"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
          {/* Push Notifications Enable Button */}
          {isSupported && (
            <Button variant="outline" size="sm" onClick={() => subscribe()} className="gap-2">
              <Bell className="h-4 w-4" />
              הפעל התראות
            </Button>
          )}
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('he-IL', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
      
      {/* Quick Actions - Always visible */}
      <QuickActionsWidget />
      
      {/* Performance Metrics */}
      <PerformanceMetricsWidget />
      
      {/* Inactive Clients Alert Widget */}
      <InactiveClientsWidget />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="הכנסות החודש"
          value={formatCurrency(stats?.revenueThisMonth || 0)}
          change={stats?.revenueChange}
          icon={<DollarSign className="h-6 w-6" />}
          color="bg-green-600"
        />
        <KPICard
          title="לקוחות"
          value={stats?.totalClients || 0}
          icon={<Users className="h-6 w-6" />}
          color="bg-blue-600"
        />
        <KPICard
          title="פרויקטים פעילים"
          value={stats?.activeProjects || 0}
          icon={<Briefcase className="h-6 w-6" />}
          color="bg-purple-600"
        />
        <KPICard
          title="חוזים פעילים"
          value={stats?.activeContracts || 0}
          icon={<FileText className="h-6 w-6" />}
          color="bg-orange-600"
        />
      </div>
      
      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">הצעות ממתינות</p>
              <p className="text-xl font-bold">{stats?.pendingQuotes || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">משימות פתוחות</p>
              <p className="text-xl font-bold">{stats?.pendingTasks || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">משימות באיחור</p>
              <p className="text-xl font-bold">{stats?.overdueTasks || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>הכנסות - 6 חודשים אחרונים</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'הכנסות']}
                />
                <Bar dataKey="revenue" fill="#667eea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>משימות לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.tasksByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  {stats?.tasksByStatus?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Revenue Forecast Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contracts Value */}
        <Card>
          <CardHeader>
            <CardTitle>שווי חוזים פעילים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(stats?.contractsValue || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              סה"כ {stats?.activeContracts || 0} חוזים פעילים
            </p>
          </CardContent>
        </Card>
        
        {/* Revenue Forecast Toggle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              תחזית הכנסות
            </CardTitle>
            <Button 
              variant={showForecast ? "default" : "outline"}
              size="sm"
              onClick={() => setShowForecast(!showForecast)}
            >
              {showForecast ? 'הסתר' : 'הצג'}
            </Button>
          </CardHeader>
          {!showForecast && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                לחץ להצגת תחזית הכנסות עתידיות מבוססת נתונים היסטוריים
              </p>
            </CardContent>
          )}
        </Card>
      </div>
      
      {/* Revenue Forecast Full Component */}
      {showForecast && revenueHistoryForForecast.length > 0 && (
        <RevenueForecastChart 
          historicalData={revenueHistoryForForecast}
          forecastMonths={6}
        />
      )}
      
      {/* New Dashboard Widgets Grid */}
      {dashboardView === 'full' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WeeklyGoalsWidget />
          <CalendarPreviewWidget />
          <RecentActivityWidget />
        </div>
      )}
      
      {/* Inactive Clients Full List */}
      <InactiveClientsAlert maxItems={5} daysThreshold={30} />
    </div>
  );
}

export default ManagerDashboard;
