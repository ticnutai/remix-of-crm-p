import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
} from 'recharts';
import {
  FileBarChart,
  Plus,
  Trash2,
  Download,
  RefreshCcw,
  BarChart3,
  LineChartIcon,
  PieChartIcon,
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  description?: string;
  report_type: string;
  config: {
    dataSource: string;
    chartType: string;
    dateRange: string;
    groupBy?: string;
  };
  created_at: string;
}

const DATA_SOURCES = {
  quotes: 'הצעות מחיר',
  contracts: 'חוזים',
  projects: 'פרויקטים',
  clients: 'לקוחות',
  tasks: 'משימות',
  invoices: 'חשבוניות',
};

const CHART_TYPES = {
  bar: { label: 'עמודות', icon: BarChart3 },
  line: { label: 'קו', icon: LineChartIcon },
  pie: { label: 'עוגה', icon: PieChartIcon },
};

const DATE_RANGES = {
  week: 'שבוע אחרון',
  month: 'חודש אחרון',
  quarter: 'רבעון אחרון',
  year: 'שנה אחרונה',
  all: 'הכל',
};

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function useReports() {
  return useQuery({
    queryKey: ['custom_reports'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('custom_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Report[];
    }
  });
}

function useReportData(dataSource: string, dateRange: string) {
  return useQuery({
    queryKey: ['report_data', dataSource, dateRange],
    queryFn: async () => {
      // Get date filter
      const now = new Date();
      let startDate = null;
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }
      
      let query = (supabase as any).from(dataSource).select('*');
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!dataSource
  });
}

function ReportChart({ report }: { report: Report }) {
  const { data = [], isLoading } = useReportData(report.config.dataSource, report.config.dateRange);
  
  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">טוען נתונים...</div>;
  }
  
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">אין נתונים להצגה</div>;
  }
  
  // Process data based on source
  let chartData: Array<{ name: string; value: number }> = [];
  
  if (report.config.dataSource === 'quotes') {
    const byStatus: Record<string, number> = {};
    data.forEach((item: any) => {
      const status = item.status || 'draft';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    chartData = Object.entries(byStatus).map(([name, value]) => ({
      name: name === 'draft' ? 'טיוטה' : name === 'sent' ? 'נשלח' : name === 'approved' ? 'אושר' : name,
      value,
    }));
  } else if (report.config.dataSource === 'contracts') {
    const byStatus: Record<string, number> = {};
    data.forEach((item: any) => {
      const status = item.status || 'draft';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    chartData = Object.entries(byStatus).map(([name, value]) => ({
      name: name === 'draft' ? 'טיוטה' : name === 'active' ? 'פעיל' : name === 'completed' ? 'הושלם' : name,
      value,
    }));
  } else if (report.config.dataSource === 'tasks') {
    const byStatus: Record<string, number> = {};
    data.forEach((item: any) => {
      const status = item.status || 'todo';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    chartData = Object.entries(byStatus).map(([name, value]) => ({
      name: name === 'todo' ? 'לביצוע' : name === 'in_progress' ? 'בעבודה' : name === 'done' ? 'הושלם' : name,
      value,
    }));
  } else {
    // Group by month for other sources
    const byMonth: Record<string, number> = {};
    data.forEach((item: any) => {
      const month = new Date(item.created_at).toLocaleDateString('he-IL', { month: 'short' });
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
    chartData = Object.entries(byMonth).map(([name, value]) => ({ name, value }));
  }
  
  const renderChart = () => {
    switch (report.config.chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.name} (${entry.value})`}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };
  
  return <div className="pt-4">{renderChart()}</div>;
}

export function ReportBuilder() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: reports = [], isLoading } = useReports();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataSource: 'quotes',
    chartType: 'bar',
    dateRange: 'month',
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await (supabase as any).from('custom_reports').insert({
        name: data.name,
        description: data.description,
        report_type: 'chart',
        config: {
          dataSource: data.dataSource,
          chartType: data.chartType,
          dateRange: data.dateRange,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_reports'] });
      toast({ title: 'הדוח נוצר בהצלחה' });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        dataSource: 'quotes',
        chartType: 'bar',
        dateRange: 'month',
      });
    },
    onError: () => {
      toast({ title: 'שגיאה ביצירת הדוח', variant: 'destructive' });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('custom_reports')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_reports'] });
      toast({ title: 'הדוח נמחק' });
    }
  });
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChart className="h-6 w-6" />
          דוחות מותאמים
        </h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              דוח חדש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>יצירת דוח חדש</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }} className="space-y-4">
              <Input
                placeholder="שם הדוח"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              
              <Input
                placeholder="תיאור (אופציונלי)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              
              <div>
                <label className="text-sm font-medium">מקור נתונים</label>
                <Select
                  value={formData.dataSource}
                  onValueChange={(v) => setFormData({ ...formData, dataSource: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATA_SOURCES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">סוג תרשים</label>
                <div className="flex gap-2 mt-1">
                  {Object.entries(CHART_TYPES).map(([key, { label, icon: Icon }]) => (
                    <Button
                      key={key}
                      type="button"
                      variant={formData.chartType === key ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, chartType: key })}
                      className="flex-1"
                    >
                      <Icon className="h-4 w-4 ml-1" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">טווח זמן</label>
                <Select
                  value={formData.dateRange}
                  onValueChange={(v) => setFormData({ ...formData, dateRange: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATE_RANGES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'יוצר...' : 'צור דוח'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">טוען...</div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileBarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">אין דוחות</h3>
            <p className="text-muted-foreground mt-1">
              צור דוח מותאם אישית כדי לעקוב אחרי הנתונים שחשובים לך
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{report.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['report_data'] })}>
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('האם למחוק את הדוח?')) {
                        deleteMutation.mutate(report.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 text-sm text-muted-foreground mb-2">
                  <span>{DATA_SOURCES[report.config.dataSource as keyof typeof DATA_SOURCES]}</span>
                  <span>•</span>
                  <span>{DATE_RANGES[report.config.dateRange as keyof typeof DATE_RANGES]}</span>
                </div>
                <ReportChart report={report} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportBuilder;
