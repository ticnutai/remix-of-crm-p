// Widget: Performance Metrics - מדדי ביצועים
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

interface Metric {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  icon: React.ReactNode;
  color: string;
}

export function PerformanceMetricsWidget() {
  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['performance_metrics'],
    queryFn: async () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      
      // Fetch all needed data
      const [
        invoicesThisMonth,
        invoicesLastMonth,
        clientsThisMonth,
        clientsLastMonth,
        tasksCompleted,
        tasksLastMonth,
        quotesApproved,
        quotesLastMonth,
      ] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_amount')
          .eq('status', 'paid')
          .gte('issue_date', startOfMonth.toISOString()),
        supabase
          .from('invoices')
          .select('total_amount')
          .eq('status', 'paid')
          .gte('issue_date', startOfLastMonth.toISOString())
          .lte('issue_date', endOfLastMonth.toISOString()),
        supabase
          .from('clients')
          .select('id')
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('clients')
          .select('id')
          .gte('created_at', startOfLastMonth.toISOString())
          .lte('created_at', endOfLastMonth.toISOString()),
        (supabase as any)
          .from('tasks')
          .select('id')
          .eq('status', 'done')
          .gte('updated_at', startOfMonth.toISOString()),
        (supabase as any)
          .from('tasks')
          .select('id')
          .eq('status', 'done')
          .gte('updated_at', startOfLastMonth.toISOString())
          .lte('updated_at', endOfLastMonth.toISOString()),
        supabase
          .from('quotes')
          .select('id')
          .eq('status', 'approved')
          .gte('updated_at', startOfMonth.toISOString()),
        supabase
          .from('quotes')
          .select('id')
          .eq('status', 'approved')
          .gte('updated_at', startOfLastMonth.toISOString())
          .lte('updated_at', endOfLastMonth.toISOString()),
      ]);

      // Calculate metrics
      const revenueThis = invoicesThisMonth.data?.reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0) || 0;
      const revenueLast = invoicesLastMonth.data?.reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0) || 0;
      const revenueTrend = revenueLast > 0 ? Math.round(((revenueThis - revenueLast) / revenueLast) * 100) : 0;

      const clientsThis = clientsThisMonth.data?.length || 0;
      const clientsLast = clientsLastMonth.data?.length || 0;
      const clientsTrend = clientsLast > 0 ? Math.round(((clientsThis - clientsLast) / clientsLast) * 100) : 0;

      const tasksThis = tasksCompleted.data?.length || 0;
      const tasksLast = tasksLastMonth.data?.length || 0;
      const tasksTrend = tasksLast > 0 ? Math.round(((tasksThis - tasksLast) / tasksLast) * 100) : 0;

      const quotesThis = quotesApproved.data?.length || 0;
      const quotesLast = quotesLastMonth.data?.length || 0;
      const quotesTrend = quotesLast > 0 ? Math.round(((quotesThis - quotesLast) / quotesLast) * 100) : 0;

      // Define targets (can be customizable in the future)
      const targets = {
        revenue: 50000,
        clients: 5,
        tasks: 20,
        quotes: 10,
      };

      return [
        {
          id: 'revenue',
          label: 'הכנסות החודש',
          value: revenueThis,
          target: targets.revenue,
          unit: '₪',
          trend: revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : 'stable',
          trendValue: Math.abs(revenueTrend),
          icon: <DollarSign className="h-4 w-4" />,
          color: 'text-green-500',
        },
        {
          id: 'clients',
          label: 'לקוחות חדשים',
          value: clientsThis,
          target: targets.clients,
          unit: '',
          trend: clientsTrend > 0 ? 'up' : clientsTrend < 0 ? 'down' : 'stable',
          trendValue: Math.abs(clientsTrend),
          icon: <Users className="h-4 w-4" />,
          color: 'text-blue-500',
        },
        {
          id: 'tasks',
          label: 'משימות שהושלמו',
          value: tasksThis,
          target: targets.tasks,
          unit: '',
          trend: tasksTrend > 0 ? 'up' : tasksTrend < 0 ? 'down' : 'stable',
          trendValue: Math.abs(tasksTrend),
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-purple-500',
        },
        {
          id: 'quotes',
          label: 'הצעות שאושרו',
          value: quotesThis,
          target: targets.quotes,
          unit: '',
          trend: quotesTrend > 0 ? 'up' : quotesTrend < 0 ? 'down' : 'stable',
          trendValue: Math.abs(quotesTrend),
          icon: <Target className="h-4 w-4" />,
          color: 'text-orange-500',
        },
      ] as Metric[];
    }
  });

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="h-3 w-3 text-green-500" />;
    if (trend === 'down') return <ArrowDownRight className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  const formatValue = (metric: Metric) => {
    if (metric.unit === '₪') {
      return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        maximumFractionDigits: 0,
      }).format(metric.value);
    }
    return `${metric.value}${metric.unit}`;
  };

  const formatTarget = (metric: Metric) => {
    if (metric.unit === '₪') {
      return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        maximumFractionDigits: 0,
      }).format(metric.target);
    }
    return `${metric.target}${metric.unit}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground py-4">טוען...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          מדדי ביצועים - החודש
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const progress = Math.min(100, Math.round((metric.value / metric.target) * 100));
            const isComplete = progress >= 100;
            
            return (
              <div key={metric.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={metric.color}>{metric.icon}</div>
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-xs ${
                      metric.trend === 'up' ? 'text-green-500' : 
                      metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {metric.trendValue}%
                    </span>
                  </div>
                </div>
                
                <div className="text-2xl font-bold">
                  {formatValue(metric)}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>יעד: {formatTarget(metric)}</span>
                    <Badge variant={isComplete ? 'default' : 'secondary'} className="text-xs">
                      {progress}%
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceMetricsWidget;
