// דשבורד אנליטיקס מלא
// גרפים, סטטיסטיקות וניתוח נתונים

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { he } from 'date-fns/locale';

// צבעים לגרפים
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, change, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
            {Math.abs(change)}% מהחודש הקודם
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('12months');

  // שליפת נתוני הכנסות
  const { data: revenueData = [] } = useQuery({
    queryKey: ['analytics-revenue', timeRange],
    queryFn: async () => {
      const months = timeRange === '12months' ? 12 : timeRange === '6months' ? 6 : 3;
      const data = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const { data: payments } = await (supabase as any)
          .from('contract_payments')
          .select('amount, status')
          .gte('due_date', start.toISOString())
          .lte('due_date', end.toISOString());
        
        const paid = payments?.filter((p: any) => p.status === 'paid')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
        const pending = payments?.filter((p: any) => p.status === 'pending')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
        
        data.push({
          month: format(date, 'MMM', { locale: he }),
          paid,
          pending,
          total: paid + pending,
        });
      }
      
      return data;
    },
  });

  // שליפת סטטוס פרויקטים
  const { data: projectStats } = useQuery({
    queryKey: ['analytics-projects'],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('status');
      
      const statusCount: Record<string, number> = {};
      projects?.forEach((p) => {
        const status = p.status || 'לא ידוע';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      
      return Object.entries(statusCount).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });

  // שליפת סטטיסטיקות כלליות
  const { data: generalStats } = useQuery({
    queryKey: ['analytics-general'],
    queryFn: async () => {
      const now = new Date();
      const thisMonth = startOfMonth(now);
      const lastMonth = startOfMonth(subMonths(now, 1));
      
      // לקוחות
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      
      const { count: newClientsThisMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString());
      
      const { count: newClientsLastMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', thisMonth.toISOString());
      
      // פרויקטים פעילים
      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .not('status', 'eq', 'הושלם');
      
      // חוזים פעילים
      const { count: activeContracts } = await (supabase as any)
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      // תשלומים באיחור
      const { count: overduePayments } = await (supabase as any)
        .from('contract_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('due_date', now.toISOString());
      
      // סה"כ הכנסות החודש
      const { data: monthPayments } = await (supabase as any)
        .from('contract_payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_date', thisMonth.toISOString());
      
      const revenueThisMonth = monthPayments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
      
      // חישוב אחוז שינוי
      const clientChange = newClientsLastMonth ? 
        Math.round(((newClientsThisMonth || 0) - newClientsLastMonth) / newClientsLastMonth * 100) : 0;
      
      return {
        totalClients: totalClients || 0,
        newClientsThisMonth: newClientsThisMonth || 0,
        clientChange,
        activeProjects: activeProjects || 0,
        activeContracts: activeContracts || 0,
        overduePayments: overduePayments || 0,
        revenueThisMonth,
      };
    },
  });

  // שליפת שעות עבודה
  const { data: timeData = [] } = useQuery({
    queryKey: ['analytics-time'],
    queryFn: async () => {
      const data = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const { data: entries } = await supabase
          .from('time_entries')
          .select('duration_minutes')
          .gte('start_time', format(date, 'yyyy-MM-dd'))
          .lt('start_time', format(subDays(date, -1), 'yyyy-MM-dd'));
        
        const minutes = entries?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
        
        data.push({
          day: format(date, 'EEEE', { locale: he }),
          hours: Math.round(minutes / 60 * 10) / 10, // המרה לשעות
        });
      }
      
      return data;
    },
  });

  // שליפת התפלגות לקוחות לפי מקור
  const { data: clientsBySource = [] } = useQuery({
    queryKey: ['analytics-clients-source'],
    queryFn: async () => {
      const { data: clients } = await supabase
        .from('clients')
        .select('source');
      
      const sourceCount: Record<string, number> = {};
      clients?.forEach((c) => {
        const source = c.source || 'לא צוין';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });
      
      return Object.entries(sourceCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }));
    },
  });

  return (
    <div className="space-y-4 p-4" dir="rtl">
      {/* כותרת ובחירת טווח */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            דשבורד אנליטיקס
          </h2>
          <p className="text-muted-foreground">סקירה כללית של הביצועים העסקיים</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">3 חודשים</SelectItem>
            <SelectItem value="6months">6 חודשים</SelectItem>
            <SelectItem value="12months">12 חודשים</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* כרטיסי סטטיסטיקה */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="סה״כ לקוחות"
          value={generalStats?.totalClients || 0}
          change={generalStats?.clientChange}
          icon={<Users className="h-4 w-4" />}
          description={`${generalStats?.newClientsThisMonth || 0} חדשים החודש`}
        />
        <StatCard
          title="פרויקטים פעילים"
          value={generalStats?.activeProjects || 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          title="הכנסות החודש"
          value={`₪${(generalStats?.revenueThisMonth || 0).toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="תשלומים באיחור"
          value={generalStats?.overduePayments || 0}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* גרפים */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">הכנסות</TabsTrigger>
          <TabsTrigger value="projects">פרויקטים</TabsTrigger>
          <TabsTrigger value="time">שעות עבודה</TabsTrigger>
          <TabsTrigger value="clients">לקוחות</TabsTrigger>
        </TabsList>

        {/* גרף הכנסות */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>הכנסות לפי חודש</CardTitle>
              <CardDescription>
                סכומים שהתקבלו וממתינים לתשלום
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `₪${value.toLocaleString()}`}
                    labelFormatter={(label) => `חודש: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="paid"
                    name="שולם"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name="ממתין"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* גרף פרויקטים */}
        <TabsContent value="projects">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>התפלגות סטטוס פרויקטים</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStats || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStats?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>סיכום פרויקטים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectStats?.map((status, index) => (
                    <div key={status.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{status.name}</span>
                      </div>
                      <Badge variant="secondary">{status.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* גרף שעות עבודה */}
        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>שעות עבודה - 7 ימים אחרונים</CardTitle>
              <CardDescription>
                מעקב אחרי זמן עבודה יומי
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value} שעות`} />
                  <Bar dataKey="hours" name="שעות" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* גרף לקוחות */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>לקוחות לפי עיר</CardTitle>
              <CardDescription>
                התפלגות לקוחות לפי מקור
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={clientsBySource} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="לקוחות" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboard;
