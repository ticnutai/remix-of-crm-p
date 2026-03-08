import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { TimelineView } from './TimelineView';
import { CalendarView } from './CalendarView';
import {
  Clock,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  LayoutGrid,
  List,
  Table2,
  GanttChartSquare,
  Filter,
  Settings2,
  Plus,
  Download,
  ChevronDown,
  Eye,
  UserCircle,
  Briefcase,
  Timer,
  Target,
  Wallet,
  Calculator,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, isWithinInterval, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Types
interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_billable: boolean | null;
  hourly_rate: number | null;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  hourly_rate?: number;
  avatar_url?: string;
}

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string | null;
  budget_hours?: number;
}

interface TimeAnalyticsDashboardProps {
  timeEntries: TimeEntry[];
  users: User[];
  clients: Client[];
  projects: Project[];
  onAddEntry: () => void;
  defaultHourlyRate?: number;
}

type ViewMode = 'cards' | 'table' | 'chart' | 'timeline' | 'calendar';
type GroupBy = 'user' | 'client' | 'project' | 'date' | 'none';
type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';

// Colors
const COLORS = {
  navy: '#1e3a8a',
  gold: '#D5BC9E',
  gray: '#828388',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const USER_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function TimeAnalyticsDashboard({
  timeEntries,
  users,
  clients,
  projects,
  onAddEntry,
  defaultHourlyRate = 150,
}: TimeAnalyticsDashboardProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [groupBy, setGroupBy] = useState<GroupBy>('user');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [showBillableOnly, setShowBillableOnly] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [timelineDate, setTimelineDate] = useState<Date>(new Date());
  
  // Quick add form
  const [quickAddForm, setQuickAddForm] = useState({
    user_id: '',
    client_id: '',
    project_id: '',
    description: '',
    hours: 0,
    minutes: 0,
    hourly_rate: defaultHourlyRate,
    is_billable: true,
  });

  // Calculate date range
  const getDateRangeValues = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { from: today, to: now };
      }
      case 'week':
        return { from: startOfWeek(now, { locale: he }), to: endOfWeek(now, { locale: he }) };
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'quarter': {
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return { from: quarterStart, to: quarterEnd };
      }
      case 'year':
        return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31) };
      default:
        return { from: undefined, to: undefined };
    }
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    const range = getDateRangeValues();
    
    return timeEntries.filter(entry => {
      // Date filter
      if (range.from && range.to) {
        const entryDate = parseISO(entry.start_time);
        if (!isWithinInterval(entryDate, { start: range.from, end: range.to })) {
          return false;
        }
      }
      
      // User filter
      if (selectedUser !== 'all' && entry.user_id !== selectedUser) {
        return false;
      }
      
      // Client filter
      if (selectedClient !== 'all' && entry.client_id !== selectedClient) {
        return false;
      }
      
      // Billable filter
      if (showBillableOnly && !entry.is_billable) {
        return false;
      }
      
      return true;
    });
  }, [timeEntries, dateRange, selectedUser, selectedClient, showBillableOnly]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMinutes = filteredEntries.reduce((acc, e) => acc + (e.duration_minutes || 0), 0);
    const billableMinutes = filteredEntries.filter(e => e.is_billable).reduce((acc, e) => acc + (e.duration_minutes || 0), 0);
    const totalRevenue = filteredEntries
      .filter(e => e.is_billable)
      .reduce((acc, e) => acc + ((e.duration_minutes || 0) / 60) * (e.hourly_rate || defaultHourlyRate), 0);
    
    return {
      totalMinutes,
      billableMinutes,
      nonBillableMinutes: totalMinutes - billableMinutes,
      totalRevenue,
      avgHoursPerDay: totalMinutes / 60 / Math.max(1, differenceInDays(getDateRangeValues().to || new Date(), getDateRangeValues().from || new Date()) + 1),
      entriesCount: filteredEntries.length,
    };
  }, [filteredEntries, defaultHourlyRate]);

  // Group data by selected criteria
  const groupedData = useMemo(() => {
    const groups = new Map<string, {
      id: string;
      name: string;
      totalMinutes: number;
      billableMinutes: number;
      revenue: number;
      entriesCount: number;
      color: string;
    }>();

    filteredEntries.forEach((entry, index) => {
      let groupId: string;
      let groupName: string;
      let color: string;

      switch (groupBy) {
        case 'user':
          groupId = entry.user_id;
          const user = users.find(u => u.id === entry.user_id);
          groupName = user?.name || 'לא ידוע';
          color = USER_COLORS[users.findIndex(u => u.id === entry.user_id) % USER_COLORS.length];
          break;
        case 'client':
          groupId = entry.client_id || 'none';
          const client = clients.find(c => c.id === entry.client_id);
          groupName = client?.name || 'לא משויך';
          color = USER_COLORS[clients.findIndex(c => c.id === entry.client_id) % USER_COLORS.length];
          break;
        case 'project':
          groupId = entry.project_id || 'none';
          const project = projects.find(p => p.id === entry.project_id);
          groupName = project?.name || 'ללא פרויקט';
          color = USER_COLORS[projects.findIndex(p => p.id === entry.project_id) % USER_COLORS.length];
          break;
        case 'date':
          const date = format(parseISO(entry.start_time), 'yyyy-MM-dd');
          groupId = date;
          groupName = format(parseISO(entry.start_time), 'EEEE, d בMMMM', { locale: he });
          color = COLORS.navy;
          break;
        default:
          groupId = 'all';
          groupName = 'כל הרישומים';
          color = COLORS.navy;
      }

      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          name: groupName,
          totalMinutes: 0,
          billableMinutes: 0,
          revenue: 0,
          entriesCount: 0,
          color,
        });
      }

      const group = groups.get(groupId)!;
      group.totalMinutes += entry.duration_minutes || 0;
      if (entry.is_billable) {
        group.billableMinutes += entry.duration_minutes || 0;
        group.revenue += ((entry.duration_minutes || 0) / 60) * (entry.hourly_rate || defaultHourlyRate);
      }
      group.entriesCount += 1;
    });

    return Array.from(groups.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [filteredEntries, groupBy, users, clients, projects, defaultHourlyRate]);

  // Format helpers
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatHours = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render user summary cards
  const renderUserCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groupedData.map((group) => {
        const percentage = stats.totalMinutes > 0 ? (group.totalMinutes / stats.totalMinutes) * 100 : 0;
        const user = users.find(u => u.id === group.id);
        
        return (
          <Card 
            key={group.id} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2"
            style={{ borderColor: `${group.color}30` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: group.color }}
                  >
                    {group.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription>{group.entriesCount} רישומים</CardDescription>
                  </div>
                </div>
                <Badge 
                  className="text-lg px-3 py-1"
                  style={{ backgroundColor: `${group.color}20`, color: group.color }}
                >
                  {formatDuration(group.totalMinutes)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">אחוז מהסה"כ</span>
                  <span className="font-medium">{percentage.toFixed(1)}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: COLORS.success }}>
                    {formatHours(group.billableMinutes)}
                  </div>
                  <div className="text-xs text-muted-foreground">שעות לחיוב</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: COLORS.navy }}>
                    {formatMoney(group.revenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">הכנסה</div>
                </div>
              </div>

              {/* Daily average */}
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="text-muted-foreground">ממוצע יומי</span>
                <span className="font-medium">
                  {formatHours(group.totalMinutes / Math.max(1, differenceInDays(getDateRangeValues().to || new Date(), getDateRangeValues().from || new Date()) + 1))} שעות
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Render table view
  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">
                {groupBy === 'user' && 'משתמש'}
                {groupBy === 'client' && 'לקוח'}
                {groupBy === 'project' && 'פרויקט'}
                {groupBy === 'date' && 'תאריך'}
                {groupBy === 'none' && 'סה"כ'}
              </TableHead>
              <TableHead className="text-center">רישומים</TableHead>
              <TableHead className="text-center">סה"כ שעות</TableHead>
              <TableHead className="text-center">שעות לחיוב</TableHead>
              <TableHead className="text-center">אחוז לחיוב</TableHead>
              <TableHead className="text-center">הכנסה</TableHead>
              <TableHead className="text-center">אחוז מסה"כ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedData.map((group) => {
              const percentage = stats.totalMinutes > 0 ? (group.totalMinutes / stats.totalMinutes) * 100 : 0;
              const billablePercentage = group.totalMinutes > 0 ? (group.billableMinutes / group.totalMinutes) * 100 : 0;
              
              return (
                <TableRow key={group.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{group.entriesCount}</TableCell>
                  <TableCell className="text-center font-mono">{formatDuration(group.totalMinutes)}</TableCell>
                  <TableCell className="text-center font-mono">{formatDuration(group.billableMinutes)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={billablePercentage >= 70 ? 'default' : 'secondary'}>
                      {billablePercentage.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold" style={{ color: COLORS.success }}>
                    {formatMoney(group.revenue)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="h-2 w-16" />
                      <span className="text-sm">{percentage.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Totals row */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell>סה"כ</TableCell>
              <TableCell className="text-center">{stats.entriesCount}</TableCell>
              <TableCell className="text-center font-mono">{formatDuration(stats.totalMinutes)}</TableCell>
              <TableCell className="text-center font-mono">{formatDuration(stats.billableMinutes)}</TableCell>
              <TableCell className="text-center">
                <Badge>
                  {stats.totalMinutes > 0 ? ((stats.billableMinutes / stats.totalMinutes) * 100).toFixed(0) : 0}%
                </Badge>
              </TableCell>
              <TableCell className="text-center text-lg" style={{ color: COLORS.success }}>
                {formatMoney(stats.totalRevenue)}
              </TableCell>
              <TableCell className="text-center">100%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Render chart view (simple bar visualization)
  const renderChartView = () => {
    const maxMinutes = Math.max(...groupedData.map(g => g.totalMinutes), 1);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            התפלגות שעות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedData.map((group) => {
            const percentage = (group.totalMinutes / maxMinutes) * 100;
            const billablePercentage = group.totalMinutes > 0 ? (group.billableMinutes / group.totalMinutes) * 100 : 0;
            
            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{group.entriesCount} רישומים</span>
                    <Badge className="font-mono">{formatDuration(group.totalMinutes)}</Badge>
                    <span className="font-bold" style={{ color: COLORS.success }}>
                      {formatMoney(group.revenue)}
                    </span>
                  </div>
                </div>
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: `${group.color}30`,
                    }}
                  />
                  <div 
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                    style={{ 
                      width: `${(billablePercentage / 100) * percentage}%`,
                      backgroundColor: group.color,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-sm text-white font-medium drop-shadow">
                      {billablePercentage.toFixed(0)}% לחיוב
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left side - Title and quick actions */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" style={{ color: COLORS.gold }} />
              ניתוח זמנים
            </h2>
            <p className="text-muted-foreground">
              {stats.entriesCount} רישומים • {formatHours(stats.totalMinutes)} שעות • {formatMoney(stats.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Right side - Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {viewMode === 'cards' && <LayoutGrid className="h-4 w-4" />}
                {viewMode === 'table' && <Table2 className="h-4 w-4" />}
                {viewMode === 'chart' && <BarChart3 className="h-4 w-4" />}
                {viewMode === 'timeline' && <GanttChartSquare className="h-4 w-4" />}
                {viewMode === 'calendar' && <Calendar className="h-4 w-4" />}
                תצוגה
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode('cards')}>
                <LayoutGrid className="h-4 w-4 ml-2" />
                כרטיסים
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('table')}>
                <Table2 className="h-4 w-4 ml-2" />
                טבלה
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('chart')}>
                <BarChart3 className="h-4 w-4 ml-2" />
                גרף
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('timeline')}>
                <GanttChartSquare className="h-4 w-4 ml-2" />
                ציר זמן
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('calendar')}>
                <Calendar className="h-4 w-4 ml-2" />
                לוח שנה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Group By Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                קבץ לפי
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setGroupBy('user')}>
                <Users className="h-4 w-4 ml-2" />
                משתמשים
                {groupBy === 'user' && <Badge className="mr-auto">נבחר</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('client')}>
                <Building2 className="h-4 w-4 ml-2" />
                לקוחות
                {groupBy === 'client' && <Badge className="mr-auto">נבחר</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('project')}>
                <Briefcase className="h-4 w-4 ml-2" />
                פרויקטים
                {groupBy === 'project' && <Badge className="mr-auto">נבחר</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('date')}>
                <Calendar className="h-4 w-4 ml-2" />
                תאריכים
                {groupBy === 'date' && <Badge className="mr-auto">נבחר</Badge>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Range Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {dateRange === 'today' && 'היום'}
                {dateRange === 'week' && 'השבוע'}
                {dateRange === 'month' && 'החודש'}
                {dateRange === 'quarter' && 'רבעון'}
                {dateRange === 'year' && 'השנה'}
                {dateRange === 'all' && 'הכל'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDateRange('today')}>היום</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange('week')}>השבוע</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange('month')}>החודש</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange('quarter')}>רבעון</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange('year')}>השנה</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDateRange('all')}>כל הזמנים</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                סינון
                {(selectedUser !== 'all' || selectedClient !== 'all' || showBillableOnly) && (
                  <Badge variant="secondary" className="mr-1">פעיל</Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="p-2 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">משתמש</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="כל המשתמשים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל המשתמשים</SelectItem>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">לקוח</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="כל הלקוחות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הלקוחות</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="billable-filter"
                    checked={showBillableOnly}
                    onChange={(e) => setShowBillableOnly(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="billable-filter" className="text-sm cursor-pointer">
                    לחיוב בלבד
                  </Label>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedUser('all');
                  setSelectedClient('all');
                  setShowBillableOnly(false);
                }}
              >
                נקה סינון
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Entry Button */}
          <Button onClick={() => setIsQuickAddOpen(true)} className="gap-2" style={{ backgroundColor: COLORS.navy }}>
            <Plus className="h-4 w-4" />
            הוסף זמן
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2" style={{ borderColor: `${COLORS.navy}20` }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.navy}15` }}>
                <Clock className="h-6 w-6" style={{ color: COLORS.navy }} />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatHours(stats.totalMinutes)}</div>
                <div className="text-sm text-muted-foreground">סה"כ שעות</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2" style={{ borderColor: `${COLORS.success}20` }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.success}15` }}>
                <Target className="h-6 w-6" style={{ color: COLORS.success }} />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatHours(stats.billableMinutes)}</div>
                <div className="text-sm text-muted-foreground">שעות לחיוב</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2" style={{ borderColor: `${COLORS.gold}40` }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.gold}20` }}>
                <DollarSign className="h-6 w-6" style={{ color: COLORS.gold }} />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatMoney(stats.totalRevenue)}</div>
                <div className="text-sm text-muted-foreground">הכנסה צפויה</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2" style={{ borderColor: `${COLORS.warning}20` }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.warning}15` }}>
                <TrendingUp className="h-6 w-6" style={{ color: COLORS.warning }} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.avgHoursPerDay.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">ממוצע יומי</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === 'cards' && renderUserCards()}
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'chart' && renderChartView()}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(timelineDate, 'd בMMMM yyyy', { locale: he })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={timelineDate}
                  onSelect={(date) => date && setTimelineDate(date)}
                  locale={he}
                />
              </PopoverContent>
            </Popover>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTimelineDate(new Date())}
              >
                היום
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTimelineDate(new Date(timelineDate.getTime() - 86400000))}
              >
                ←
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTimelineDate(new Date(timelineDate.getTime() + 86400000))}
              >
                →
              </Button>
            </div>
          </div>
          <TimelineView
            timeEntries={timeEntries}
            users={users}
            clients={clients}
            projects={projects}
            selectedDate={timelineDate}
          />
        </div>
      )}
      
      {viewMode === 'calendar' && (
        <CalendarView
          timeEntries={timeEntries}
          clients={clients}
          defaultHourlyRate={defaultHourlyRate}
          onDayClick={(date) => {
            setTimelineDate(date);
            setViewMode('timeline');
          }}
        />
      )}

      {/* Quick Add Dialog */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              הוספת רישום זמן
            </DialogTitle>
            <DialogDescription>
              הוסף רישום זמן חדש במהירות
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>משתמש</Label>
                <Select 
                  value={quickAddForm.user_id} 
                  onValueChange={(v) => setQuickAddForm(prev => ({ ...prev, user_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר משתמש" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>לקוח</Label>
                <Select 
                  value={quickAddForm.client_id} 
                  onValueChange={(v) => setQuickAddForm(prev => ({ ...prev, client_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>פרויקט</Label>
              <Select 
                value={quickAddForm.project_id} 
                onValueChange={(v) => setQuickAddForm(prev => ({ ...prev, project_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר פרויקט (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>תיאור</Label>
              <Input
                value={quickAddForm.description}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="מה עשית?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שעות</Label>
                <Input
                  type="number"
                  min="0"
                  value={quickAddForm.hours}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>דקות</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={quickAddForm.minutes}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>תעריף לשעה (₪)</Label>
                <Input
                  type="number"
                  min="0"
                  value={quickAddForm.hourly_rate}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, hourly_rate: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-md w-full justify-center">
                  <input
                    type="checkbox"
                    checked={quickAddForm.is_billable}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, is_billable: e.target.checked }))}
                    className="rounded"
                  />
                  <span>לחיוב</span>
                </label>
              </div>
            </div>

            {quickAddForm.is_billable && quickAddForm.hourly_rate > 0 && (quickAddForm.hours > 0 || quickAddForm.minutes > 0) && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">סכום לחיוב:</span>
                  <span className="text-xl font-bold" style={{ color: COLORS.success }}>
                    {formatMoney((quickAddForm.hours + quickAddForm.minutes / 60) * quickAddForm.hourly_rate)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickAddOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={() => {
                // Here you would call the actual add function
                onAddEntry();
                setIsQuickAddOpen(false);
              }}
              style={{ backgroundColor: COLORS.navy }}
            >
              הוסף רישום
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TimeAnalyticsDashboard;
