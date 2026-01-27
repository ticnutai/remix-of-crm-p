import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { he } from 'date-fns/locale';

interface RevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

interface WorkHoursData {
  name: string;
  hours: number;
}

interface DashboardStats {
  activeClients: number;
  activeClientsChange: number;
  openProjects: number;
  openProjectsChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  totalHours: number;
  totalHoursChange: number;
}

const STATUS_TRANSLATIONS: Record<string, string> = {
  'planning': 'בתכנון',
  'in-progress': 'בביצוע',
  'in_progress': 'בביצוע',
  'active': 'פעיל',
  'completed': 'הושלם',
  'on-hold': 'מושהה',
  'on_hold': 'מושהה',
  'pending': 'ממתין',
  'cancelled': 'בוטל',
};

const STATUS_COLORS: Record<string, string> = {
  'בתכנון': 'hsl(199, 89%, 48%)',
  'בביצוע': 'hsl(45, 70%, 50%)',
  'פעיל': 'hsl(142, 70%, 45%)',
  'הושלם': 'hsl(142, 70%, 45%)',
  'מושהה': 'hsl(0, 84%, 60%)',
  'ממתין': 'hsl(38, 92%, 50%)',
  'בוטל': 'hsl(0, 0%, 50%)',
};

export function useDashboardData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [projectsStatusData, setProjectsStatusData] = useState<ProjectStatusData[]>([]);
  const [hoursByEmployee, setHoursByEmployee] = useState<WorkHoursData[]>([]);
  const [hoursByProject, setHoursByProject] = useState<WorkHoursData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    activeClientsChange: 0,
    openProjects: 0,
    openProjectsChange: 0,
    monthlyRevenue: 0,
    monthlyRevenueChange: 0,
    totalHours: 0,
    totalHoursChange: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        // Fetch all data in parallel
        const [
          clientsResponse,
          projectsResponse,
          timeEntriesResponse,
          profilesResponse,
          invoicesResponse,
          quotesResponse,
        ] = await Promise.all([
          supabase.from('clients').select('id, name, status, created_at'),
          supabase.from('projects').select('id, name, status, created_at, budget'),
          supabase.from('time_entries').select('id, user_id, project_id, client_id, start_time, end_time, duration_minutes, hourly_rate, description'),
          supabase.from('profiles').select('id, full_name'),
          supabase.from('invoices').select('id, amount, paid_amount, status, issue_date, created_at'),
          supabase.from('quotes').select('id, total_amount, paid_amount, status, issue_date, created_at'),
        ]);

        const clients = clientsResponse.data || [];
        const projects = projectsResponse.data || [];
        const timeEntries = timeEntriesResponse.data || [];
        const profiles = profilesResponse.data || [];
        const invoices = invoicesResponse.data || [];
        const quotes = quotesResponse.data || [];

        // Date calculations
        const currentMonth = new Date();
        const currentMonthStart = startOfMonth(currentMonth);
        const currentMonthEnd = endOfMonth(currentMonth);
        const lastMonthStart = startOfMonth(subMonths(currentMonth, 1));
        const lastMonthEnd = endOfMonth(subMonths(currentMonth, 1));

        // Calculate active clients
        const activeClients = clients.filter(c => c.status === 'active').length;
        
        // Calculate clients change (new clients this month vs last month)
        const currentMonthClients = clients.filter(c => {
          const date = new Date(c.created_at);
          return date >= currentMonthStart && date <= currentMonthEnd;
        }).length;
        const lastMonthClients = clients.filter(c => {
          const date = new Date(c.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        }).length;
        const clientsChange = lastMonthClients > 0 
          ? Math.round(((currentMonthClients - lastMonthClients) / lastMonthClients) * 100)
          : currentMonthClients > 0 ? 100 : 0;

        // Calculate open projects
        const openProjects = projects.filter(p => 
          p.status !== 'completed' && p.status !== 'cancelled'
        ).length;
        
        // Calculate projects change
        const currentMonthProjects = projects.filter(p => {
          const date = new Date(p.created_at);
          return date >= currentMonthStart && date <= currentMonthEnd;
        }).length;
        const lastMonthProjects = projects.filter(p => {
          const date = new Date(p.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        }).length;
        const projectsChange = lastMonthProjects > 0 
          ? Math.round(((currentMonthProjects - lastMonthProjects) / lastMonthProjects) * 100)
          : currentMonthProjects > 0 ? 100 : 0;

        // Calculate monthly revenue from invoices
        const currentMonthInvoices = invoices.filter(inv => {
          const date = new Date(inv.issue_date || inv.created_at);
          return date >= currentMonthStart && date <= currentMonthEnd;
        });
        const lastMonthInvoices = invoices.filter(inv => {
          const date = new Date(inv.issue_date || inv.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        });

        const currentMonthRevenue = currentMonthInvoices.reduce((sum, inv) => 
          sum + (inv.paid_amount || 0), 0);
        const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => 
          sum + (inv.paid_amount || 0), 0);

        // Also add paid quotes
        const currentMonthQuotes = quotes.filter(q => {
          const date = new Date(q.issue_date || q.created_at);
          return date >= currentMonthStart && date <= currentMonthEnd;
        });
        const lastMonthQuotes = quotes.filter(q => {
          const date = new Date(q.issue_date || q.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        });

        const currentMonthQuoteRevenue = currentMonthQuotes.reduce((sum, q) => 
          sum + (q.paid_amount || 0), 0);
        const lastMonthQuoteRevenue = lastMonthQuotes.reduce((sum, q) => 
          sum + (q.paid_amount || 0), 0);

        const totalCurrentRevenue = currentMonthRevenue + currentMonthQuoteRevenue;
        const totalLastRevenue = lastMonthRevenue + lastMonthQuoteRevenue;

        const revenueChange = totalLastRevenue > 0 
          ? Math.round(((totalCurrentRevenue - totalLastRevenue) / totalLastRevenue) * 100)
          : totalCurrentRevenue > 0 ? 100 : 0;

        // Calculate work hours
        const currentMonthEntries = timeEntries.filter(entry => {
          const date = new Date(entry.start_time);
          return date >= currentMonthStart && date <= currentMonthEnd;
        });
        const lastMonthEntries = timeEntries.filter(entry => {
          const date = new Date(entry.start_time);
          return date >= lastMonthStart && date <= lastMonthEnd;
        });

        const currentMonthHours = currentMonthEntries.reduce((sum, entry) => 
          sum + (entry.duration_minutes || 0) / 60, 0);
        const lastMonthHours = lastMonthEntries.reduce((sum, entry) => 
          sum + (entry.duration_minutes || 0) / 60, 0);

        const hoursChange = lastMonthHours > 0
          ? Math.round(((currentMonthHours - lastMonthHours) / lastMonthHours) * 100)
          : currentMonthHours > 0 ? 100 : 0;

        setStats({
          activeClients,
          activeClientsChange: clientsChange,
          openProjects,
          openProjectsChange: projectsChange,
          monthlyRevenue: totalCurrentRevenue,
          monthlyRevenueChange: revenueChange,
          totalHours: Math.round(currentMonthHours),
          totalHoursChange: hoursChange,
        });

        // Calculate revenue by month (last 6 months)
        const revenueByMonth: RevenueData[] = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(currentMonth, i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          
          // Revenue from invoices
          const monthInvoices = invoices.filter(inv => {
            const date = new Date(inv.issue_date || inv.created_at);
            return date >= monthStart && date <= monthEnd;
          });
          const invoiceRevenue = monthInvoices.reduce((sum, inv) => 
            sum + (inv.paid_amount || 0), 0);
          
          // Revenue from quotes
          const monthQuotes = quotes.filter(q => {
            const date = new Date(q.issue_date || q.created_at);
            return date >= monthStart && date <= monthEnd;
          });
          const quoteRevenue = monthQuotes.reduce((sum, q) => 
            sum + (q.paid_amount || 0), 0);

          revenueByMonth.push({
            month: format(monthDate, 'MMM', { locale: he }),
            revenue: invoiceRevenue + quoteRevenue,
            invoices: monthInvoices.length,
          });
        }
        setRevenueData(revenueByMonth);

        // Calculate projects by status
        const statusCounts: Record<string, number> = {};
        projects.forEach(project => {
          const translatedStatus = STATUS_TRANSLATIONS[project.status || 'planning'] || project.status || 'בתכנון';
          statusCounts[translatedStatus] = (statusCounts[translatedStatus] || 0) + 1;
        });

        const projectStatusData = Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value,
          color: STATUS_COLORS[name] || 'hsl(222, 47%, 25%)',
        }));
        setProjectsStatusData(projectStatusData);

        // Calculate hours by employee (current month)
        const hoursByEmployeeMap: Record<string, number> = {};
        currentMonthEntries.forEach(entry => {
          const profile = profiles.find(p => p.id === entry.user_id);
          const name = profile?.full_name || 'לא ידוע';
          hoursByEmployeeMap[name] = (hoursByEmployeeMap[name] || 0) + (entry.duration_minutes || 0) / 60;
        });

        const employeeHours = Object.entries(hoursByEmployeeMap)
          .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
          .sort((a, b) => b.hours - a.hours)
          .slice(0, 7);
        setHoursByEmployee(employeeHours);

        // Calculate hours by project (current month)
        const hoursByProjectMap: Record<string, number> = {};
        currentMonthEntries.forEach(entry => {
          const project = projects.find(p => p.id === entry.project_id);
          const name = project?.name || 'ללא פרויקט';
          hoursByProjectMap[name] = (hoursByProjectMap[name] || 0) + (entry.duration_minutes || 0) / 60;
        });

        const projectHours = Object.entries(hoursByProjectMap)
          .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
          .sort((a, b) => b.hours - a.hours)
          .slice(0, 7);
        setHoursByProject(projectHours);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Set up realtime subscriptions for live updates (debounced)
    let updateTimeout: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        fetchDashboardData();
      }, 2000); // Wait 2 seconds before refetching
    };

    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, debouncedFetch)
      .subscribe();

    return () => {
      clearTimeout(updateTimeout);
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    isLoading,
    stats,
    revenueData,
    projectsStatusData,
    hoursByEmployee,
    hoursByProject,
  };
}
