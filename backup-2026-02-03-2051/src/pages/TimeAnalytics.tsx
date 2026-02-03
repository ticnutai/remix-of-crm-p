// Time Analytics Page - tenarch CRM Pro
// Professional time log analysis with insights and recommendations
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  User,
  Calendar,
  Loader2,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  eachDayOfInterval,
  parseISO,
  differenceInDays,
} from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  description: string | null;
  is_billable: boolean | null;
  hourly_rate: number | null;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  project?: { name: string } | null;
  client?: { name: string } | null;
  user?: { full_name: string } | null;
}

interface Employee {
  id: string;
  full_name: string;
  hourly_rate: number | null;
}

interface Project {
  id: string;
  name: string;
  budget: number | null;
  client?: { name: string } | null;
}

const COLORS = ['#1e3a5f', '#b48c32', '#2d5a88', '#d4a845', '#4a7aa7', '#8b7355', '#3d6b8f'];

const periodOptions = [
  { value: '7', label: 'שבוע אחרון' },
  { value: '14', label: 'שבועיים' },
  { value: '30', label: 'חודש אחרון' },
  { value: '90', label: '3 חודשים' },
];

export default function TimeAnalytics() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const days = parseInt(selectedPeriod);
    const startDate = subDays(new Date(), days);

    let timeQuery = supabase
      .from('time_entries')
      .select(`
        id, start_time, end_time, duration_minutes, description, is_billable, hourly_rate, user_id, project_id, client_id,
        project:projects(name),
        client:clients(name)
      `)
      .gte('start_time', startDate.toISOString())
      .order('start_time', { ascending: true });

    if (!isManager) {
      timeQuery = timeQuery.eq('user_id', user.id);
    } else if (selectedEmployee !== 'all') {
      timeQuery = timeQuery.eq('user_id', selectedEmployee);
    }

    const [timeRes, employeesRes, projectsRes] = await Promise.all([
      timeQuery,
      isManager ? supabase.from('profiles').select('id, full_name, hourly_rate').order('full_name') : Promise.resolve({ data: [] }),
      supabase.from('projects').select('id, name, budget, client:clients(name)').order('name'),
    ]);

    if (timeRes.data) setTimeEntries(timeRes.data as TimeEntry[]);
    if (employeesRes.data) setEmployees(employeesRes.data as Employee[]);
    if (projectsRes.data) setProjects(projectsRes.data as Project[]);

    setLoading(false);
  }, [user, isManager, selectedPeriod, selectedEmployee]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate, fetchData]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalMinutes = timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const billableMinutes = timeEntries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const billableRate = totalMinutes > 0 ? (billableMinutes / totalMinutes) * 100 : 0;
    
    // Revenue calculation
    const totalRevenue = timeEntries.reduce((sum, e) => {
      if (e.is_billable && e.duration_minutes && e.hourly_rate) {
        return sum + (e.duration_minutes / 60) * e.hourly_rate;
      }
      return sum;
    }, 0);

    // By project
    const byProject: Record<string, { name: string; minutes: number; revenue: number }> = {};
    timeEntries.forEach(e => {
      const key = e.project_id || 'no-project';
      const name = e.project?.name || 'ללא פרויקט';
      if (!byProject[key]) byProject[key] = { name, minutes: 0, revenue: 0 };
      byProject[key].minutes += e.duration_minutes || 0;
      if (e.is_billable && e.hourly_rate) {
        byProject[key].revenue += ((e.duration_minutes || 0) / 60) * e.hourly_rate;
      }
    });

    // By client
    const byClient: Record<string, { name: string; minutes: number }> = {};
    timeEntries.forEach(e => {
      const key = e.client_id || 'no-client';
      const name = e.client?.name || 'ללא לקוח';
      if (!byClient[key]) byClient[key] = { name, minutes: 0 };
      byClient[key].minutes += e.duration_minutes || 0;
    });

    // By employee (if manager)
    const byEmployee: Record<string, { name: string; minutes: number; revenue: number }> = {};
    timeEntries.forEach(e => {
      const key = e.user_id;
      const emp = employees.find(emp => emp.id === key);
      const name = emp?.full_name || 'לא ידוע';
      if (!byEmployee[key]) byEmployee[key] = { name, minutes: 0, revenue: 0 };
      byEmployee[key].minutes += e.duration_minutes || 0;
      if (e.is_billable && e.hourly_rate) {
        byEmployee[key].revenue += ((e.duration_minutes || 0) / 60) * e.hourly_rate;
      }
    });

    // Daily trend
    const days = parseInt(selectedPeriod);
    const startDate = subDays(new Date(), days);
    const dailyData = eachDayOfInterval({ start: startDate, end: new Date() }).map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEntries = timeEntries.filter(e => format(parseISO(e.start_time), 'yyyy-MM-dd') === dayStr);
      const minutes = dayEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      return {
        date: format(day, 'dd/MM', { locale: he }),
        fullDate: dayStr,
        hours: Math.round(minutes / 60 * 10) / 10,
        minutes,
      };
    });

    // Weekly comparison
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const thisWeekMinutes = timeEntries
      .filter(e => parseISO(e.start_time) >= thisWeekStart)
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const lastWeekMinutes = timeEntries
      .filter(e => {
        const date = parseISO(e.start_time);
        return date >= lastWeekStart && date < thisWeekStart;
      })
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const weeklyChange = lastWeekMinutes > 0 
      ? ((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100 
      : 0;

    // Average daily hours
    const activeDays = new Set(timeEntries.map(e => format(parseISO(e.start_time), 'yyyy-MM-dd'))).size;
    const avgDailyMinutes = activeDays > 0 ? totalMinutes / activeDays : 0;

    return {
      totalMinutes,
      billableMinutes,
      billableRate,
      totalRevenue,
      byProject: Object.values(byProject).sort((a, b) => b.minutes - a.minutes),
      byClient: Object.values(byClient).sort((a, b) => b.minutes - a.minutes),
      byEmployee: Object.values(byEmployee).sort((a, b) => b.minutes - a.minutes),
      dailyData,
      thisWeekMinutes,
      lastWeekMinutes,
      weeklyChange,
      avgDailyMinutes,
      activeDays,
    };
  }, [timeEntries, employees, selectedPeriod]);

  // Insights and recommendations
  const insights = useMemo(() => {
    const recommendations: { type: 'success' | 'warning' | 'info'; text: string }[] = [];

    // Billable rate insight
    if (analytics.billableRate < 70) {
      recommendations.push({
        type: 'warning',
        text: `שיעור השעות לחיוב נמוך (${analytics.billableRate.toFixed(0)}%). שקול לסקור פרויקטים לא לחיוב.`,
      });
    } else {
      recommendations.push({
        type: 'success',
        text: `שיעור שעות לחיוב מצוין: ${analytics.billableRate.toFixed(0)}%`,
      });
    }

    // Weekly trend
    if (analytics.weeklyChange < -20) {
      recommendations.push({
        type: 'warning',
        text: `ירידה של ${Math.abs(analytics.weeklyChange).toFixed(0)}% בשעות עבודה לעומת שבוע קודם`,
      });
    } else if (analytics.weeklyChange > 20) {
      recommendations.push({
        type: 'info',
        text: `עלייה של ${analytics.weeklyChange.toFixed(0)}% בשעות עבודה לעומת שבוע קודם`,
      });
    }

    // Top project concentration
    if (analytics.byProject.length > 0) {
      const topProject = analytics.byProject[0];
      const topProjectPercent = (topProject.minutes / analytics.totalMinutes) * 100;
      if (topProjectPercent > 60) {
        recommendations.push({
          type: 'info',
          text: `${topProjectPercent.toFixed(0)}% מהזמן מוקדש לפרויקט "${topProject.name}" - שקול גיוון`,
        });
      }
    }

    // Average daily hours
    const avgDailyHours = analytics.avgDailyMinutes / 60;
    if (avgDailyHours > 9) {
      recommendations.push({
        type: 'warning',
        text: `ממוצע יומי גבוה: ${avgDailyHours.toFixed(1)} שעות. שמור על איזון עבודה-חיים`,
      });
    } else if (avgDailyHours < 6 && analytics.activeDays > 5) {
      recommendations.push({
        type: 'info',
        text: `ממוצע יומי: ${avgDailyHours.toFixed(1)} שעות. יש מקום להגדלת הפרודוקטיביות`,
      });
    }

    return recommendations;
  }, [analytics]);

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  const formatHours = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout title="ניתוח לוגי זמן">
      <div className="p-6 md:p-8 space-y-8" dir="rtl">
        {/* Header with filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:flex-row-reverse">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 flex-row-reverse">
              <BarChart3 className="h-7 w-7 text-[hsl(45,80%,45%)]" />
              ניתוח לוגי זמן
            </h1>
            <p className="text-muted-foreground">תובנות והמלצות מבוססות נתונים</p>
          </div>
          <div className="flex items-center gap-3 flex-row-reverse">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover" dir="rtl">
                {periodOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isManager && employees.length > 0 && (
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="כל העובדים" />
                </SelectTrigger>
                <SelectContent className="bg-popover" dir="rtl">
                  <SelectItem value="all">כל העובדים</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card dir="rtl" className="card-elegant">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3 flex-row-reverse">
                <Clock className="h-5 w-5 text-primary" />
                {analytics.weeklyChange !== 0 && (
                  <div className={cn(
                    "flex items-center text-xs font-medium",
                    analytics.weeklyChange > 0 ? "text-success" : "text-destructive"
                  )}>
                    {analytics.weeklyChange > 0 ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
                    {Math.abs(analytics.weeklyChange).toFixed(0)}%
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold">{formatMinutes(analytics.totalMinutes)}</p>
              <p className="text-sm text-muted-foreground">סה"כ שעות</p>
            </CardContent>
          </Card>

          <Card dir="rtl" className="card-elegant">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3 flex-row-reverse">
                <DollarSign className="h-5 w-5 text-success" />
                <Badge variant="outline" className="text-xs">{analytics.billableRate.toFixed(0)}%</Badge>
              </div>
              <p className="text-3xl font-bold">{formatMinutes(analytics.billableMinutes)}</p>
              <p className="text-sm text-muted-foreground">שעות לחיוב</p>
            </CardContent>
          </Card>

          <Card dir="rtl" className="card-elegant">
            <CardContent className="p-5">
              <div className="flex items-center mb-3">
                <Target className="h-5 w-5 text-[hsl(45,80%,45%)]" />
              </div>
              <p className="text-3xl font-bold">₪{analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">הכנסה משוערת</p>
            </CardContent>
          </Card>

          <Card dir="rtl" className="card-elegant">
            <CardContent className="p-5">
              <div className="flex items-center mb-3">
                <Activity className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-3xl font-bold">{formatHours(analytics.avgDailyMinutes)}</p>
              <p className="text-sm text-muted-foreground">ממוצע יומי (שעות)</p>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card dir="rtl" className="border-2 border-[hsl(45,80%,45%)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-[hsl(45,80%,45%)]" />
              תובנות והמלצות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    insight.type === 'success' && "bg-success/10 border-success/20",
                    insight.type === 'warning' && "bg-warning/10 border-warning/20",
                    insight.type === 'info' && "bg-primary/10 border-primary/20"
                  )}
                >
                  {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />}
                  {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />}
                  {insight.type === 'info' && <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                  <p className="text-sm">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <Tabs defaultValue="trend" className="space-y-6" dir="rtl">
          <TabsList>
            <TabsTrigger value="trend" className="gap-2">
              <Activity className="h-4 w-4" />
              מגמה יומית
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Briefcase className="h-4 w-4" />
              פרויקטים
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <User className="h-4 w-4" />
              לקוחות
            </TabsTrigger>
            {isManager && (
              <TabsTrigger value="employees" className="gap-2">
                <Users className="h-4 w-4" />
                עובדים
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="trend">
            <Card>
              <CardHeader>
                <CardTitle>שעות עבודה יומיות</CardTitle>
                <CardDescription>התפלגות שעות לפי ימים בתקופה הנבחרת</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        formatter={(value: number) => [`${value} שעות`, 'שעות']}
                        labelFormatter={(label) => `תאריך: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stroke="hsl(220, 60%, 25%)"
                        fill="hsl(220, 60%, 25%)"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>שעות לפי פרויקט</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.byProject.slice(0, 7)} layout="vertical" margin={{ right: 100, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={12} reversed />
                        <YAxis type="category" dataKey="name" width={100} fontSize={12} orientation="right" />
                        <Tooltip formatter={(value: number) => [formatMinutes(value), 'זמן']} />
                        <Bar dataKey="minutes" fill="hsl(220, 60%, 25%)" radius={[4, 0, 0, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>התפלגות פרויקטים</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.byProject.slice(0, 6)}
                          dataKey="minutes"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {analytics.byProject.slice(0, 6).map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatMinutes(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>שעות לפי לקוח</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.byClient.slice(0, 10)} margin={{ right: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} reversed />
                      <YAxis fontSize={12} orientation="right" />
                      <Tooltip formatter={(value: number) => [formatMinutes(value), 'זמן']} />
                      <Bar dataKey="minutes" fill="hsl(45, 80%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isManager && (
            <TabsContent value="employees">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>שעות לפי עובד</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.byEmployee} layout="vertical" margin={{ right: 100, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" fontSize={12} reversed />
                          <YAxis type="category" dataKey="name" width={100} fontSize={12} orientation="right" />
                          <Tooltip formatter={(value: number) => [formatMinutes(value), 'זמן']} />
                          <Bar dataKey="minutes" fill="hsl(220, 60%, 35%)" radius={[4, 0, 0, 4]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>הכנסה לפי עובד</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.byEmployee.map((emp, i) => (
                        <div key={i} className="flex items-center justify-between flex-row-reverse">
                          <div className="flex items-center gap-3 flex-row-reverse">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{emp.name}</p>
                              <p className="text-sm text-muted-foreground">{formatMinutes(emp.minutes)} שעות</p>
                            </div>
                          </div>
                          <p className="font-bold text-success">₪{emp.revenue.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}
