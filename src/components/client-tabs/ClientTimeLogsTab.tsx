// ClientTimeLogsTab - Time Logs view for Client Profile
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Clock,
  Calendar as CalendarIcon,
  BarChart3,
  List,
  Table as TableIcon,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  DollarSign,
  Timer,
  User,
  Briefcase,
  FileText,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  ArrowUpDown,
  TrendingUp,
  Play,
  Pause,
  Copy,
  Loader2,
  RefreshCw,
  XCircle,
  CheckCircle,
  FolderKanban,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, differenceInMinutes, subDays, subMonths, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { he } from 'date-fns/locale';

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
  is_running: boolean | null;
  tags: string[] | null;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  project_name?: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string | null;
}

interface User {
  id: string;
  name: string;
  avatar_url?: string;
}

type ViewMode = 'table' | 'list' | 'summary';
type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type SortField = 'date' | 'duration' | 'project' | 'user';
type SortDirection = 'asc' | 'desc';

// Colors for chart-like elements
const colors = {
  primary: '#162C58',
  gold: '#D4A843',
  goldLight: '#E8D1B4',
  success: '#22c55e',
  warning: '#eab308',
};

interface ClientTimeLogsTabProps {
  clientId: string;
  clientName: string;
}

export function ClientTimeLogsTab({ clientId, clientName }: ClientTimeLogsTabProps) {
  const { toast } = useToast();
  const { user, isAdmin, isManager } = useAuth();
  
  // Data state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [showBillableOnly, setShowBillableOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Expanded groups
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  // Custom date range
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TimeEntry | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    project_id: '',
    description: '',
    log_date: new Date(),
    start_hour: new Date().getHours(),
    start_minute: new Date().getMinutes(),
    duration_hours: 0,
    duration_minutes: 0,
    is_billable: true,
    hourly_rate: 0,
  });
  
  const canEdit = isAdmin || isManager;
  
  // Fetch data
  const fetchData = useCallback(async () => {
    if (!clientId) return;
    
    console.log('[ClientTimeLogsTab] Fetching time entries for clientId:', clientId);
    
    setIsLoading(true);
    try {
      // Fetch time entries and profiles separately (no FK on user_id to profiles)
      const [entriesRes, profilesRes, projectsRes] = await Promise.all([
        supabase
          .from('time_entries')
          .select(`
            *,
            projects:project_id(id, name)
          `)
          .eq('client_id', clientId)
          .order('start_time', { ascending: false }),
        supabase.from('profiles').select('id, full_name, avatar_url'),
        supabase
          .from('projects')
          .select('id, name, client_id')
          .eq('client_id', clientId)
          .order('name')
      ]);
      
      console.log('[ClientTimeLogsTab] Query result:', { 
        count: entriesRes.data?.length || 0, 
        error: entriesRes.error,
        firstEntry: entriesRes.data?.[0]
      });
      
      if (entriesRes.error) throw entriesRes.error;
      
      // Create maps for quick lookup
      const userMap = new Map<string, { full_name?: string; avatar_url?: string }>();
      (profilesRes.data || []).forEach(p => {
        userMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
      });
      
      // Transform data
      const entries: TimeEntry[] = (entriesRes.data || []).map(entry => {
        const userProfile = userMap.get(entry.user_id);
        return {
          ...entry,
          user_name: userProfile?.full_name || 'לא ידוע',
          user_avatar: userProfile?.avatar_url,
          project_name: (entry.projects as { name?: string } | null)?.name || null,
        };
      });
      
      setTimeEntries(entries);
      setProjects(projectsRes.data || []);
      
      // Set users from profiles data
      setUsers((profilesRes.data || []).map(u => ({
        id: u.id,
        name: u.full_name || 'לא ידוע',
        avatar_url: u.avatar_url,
      })));
      
      // Auto-expand first date group
      if (entries.length > 0) {
        const firstDate = format(parseISO(entries[0].start_time), 'yyyy-MM-dd');
        setExpandedDates(new Set([firstDate]));
      }
    } catch (error) {
      console.error('Error fetching time logs:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון לוגי זמן',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = [...timeEntries];
    
    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(entry => {
        const entryDate = parseISO(entry.start_time);
        switch (timeFilter) {
          case 'today':
            return isToday(entryDate);
          case 'week':
            return isThisWeek(entryDate, { weekStartsOn: 0 });
          case 'month':
            return isThisMonth(entryDate);
          case 'custom':
            if (customDateRange.from && customDateRange.to) {
              return isWithinInterval(entryDate, {
                start: customDateRange.from,
                end: customDateRange.to,
              });
            }
            return true;
          default:
            return true;
        }
      });
    }
    
    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(e => e.project_id === selectedProject);
    }
    
    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(e => e.user_id === selectedUser);
    }
    
    // Billable filter
    if (showBillableOnly) {
      filtered = filtered.filter(e => e.is_billable);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.description?.toLowerCase().includes(query) ||
        e.project_name?.toLowerCase().includes(query) ||
        e.user_name?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          break;
        case 'duration':
          comparison = (a.duration_minutes || 0) - (b.duration_minutes || 0);
          break;
        case 'project':
          comparison = (a.project_name || '').localeCompare(b.project_name || '');
          break;
        case 'user':
          comparison = (a.user_name || '').localeCompare(b.user_name || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [timeEntries, timeFilter, selectedProject, selectedUser, showBillableOnly, searchQuery, customDateRange, sortField, sortDirection]);
  
  // Group entries by date
  const entriesByDate = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      const date = format(parseISO(entry.start_time), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, TimeEntry[]>);
  }, [filteredEntries]);
  
  // Group entries by project
  const entriesByProject = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      const projectId = entry.project_id || 'no-project';
      if (!acc[projectId]) {
        acc[projectId] = {
          name: entry.project_name || 'ללא פרויקט',
          entries: [],
          totalMinutes: 0,
          billableMinutes: 0,
        };
      }
      acc[projectId].entries.push(entry);
      acc[projectId].totalMinutes += entry.duration_minutes || 0;
      if (entry.is_billable) {
        acc[projectId].billableMinutes += entry.duration_minutes || 0;
      }
      return acc;
    }, {} as Record<string, { name: string; entries: TimeEntry[]; totalMinutes: number; billableMinutes: number }>);
  }, [filteredEntries]);
  
  // Statistics
  const stats = useMemo(() => {
    const totalMinutes = filteredEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const billableMinutes = filteredEntries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const totalEntries = filteredEntries.length;
    const uniqueProjects = new Set(filteredEntries.map(e => e.project_id).filter(Boolean)).size;
    const uniqueUsers = new Set(filteredEntries.map(e => e.user_id)).size;
    
    // Calculate estimated value (assuming average rate)
    const entriesWithRate = filteredEntries.filter(e => e.hourly_rate && e.is_billable);
    const totalValue = entriesWithRate.reduce((sum, e) => {
      const hours = (e.duration_minutes || 0) / 60;
      return sum + (hours * (e.hourly_rate || 0));
    }, 0);
    
    return {
      totalMinutes,
      billableMinutes,
      nonBillableMinutes: totalMinutes - billableMinutes,
      totalEntries,
      uniqueProjects,
      uniqueUsers,
      totalValue,
      billablePercentage: totalMinutes > 0 ? (billableMinutes / totalMinutes) * 100 : 0,
    };
  }, [filteredEntries]);
  
  // Helpers
  const formatDuration = (minutes: number) => {
    if (!minutes) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };
  
  const formatDurationLong = (minutes: number) => {
    if (!minutes) return '0 דקות';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} דקות`;
    if (mins === 0) return `${hours} שעות`;
    return `${hours} שעות ו-${mins} דקות`;
  };
  
  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'HH:mm', { locale: he });
  };
  
  const formatDateFull = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE, dd MMMM yyyy', { locale: he });
  };
  
  const formatDateShort = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: he });
  };
  
  // Handlers
  const handleAddEntry = async () => {
    if (!user) return;
    
    const startTime = new Date(formData.log_date);
    startTime.setHours(formData.start_hour, formData.start_minute, 0, 0);
    
    const totalMinutes = formData.duration_hours * 60 + formData.duration_minutes;
    const endTime = new Date(startTime.getTime() + totalMinutes * 60000);
    
    const { error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        client_id: clientId,
        project_id: formData.project_id && formData.project_id !== 'none' ? formData.project_id : null,
        description: formData.description || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: totalMinutes,
        is_billable: formData.is_billable,
        hourly_rate: formData.hourly_rate || null,
      });
    
    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף לוג זמן',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'הצלחה',
        description: 'לוג הזמן נוסף בהצלחה',
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    }
  };
  
  const handleUpdateEntry = async () => {
    if (!editingEntry) return;
    
    const startTime = new Date(formData.log_date);
    startTime.setHours(formData.start_hour, formData.start_minute, 0, 0);
    
    const totalMinutes = formData.duration_hours * 60 + formData.duration_minutes;
    const endTime = new Date(startTime.getTime() + totalMinutes * 60000);
    
    const { error } = await supabase
      .from('time_entries')
      .update({
        project_id: formData.project_id && formData.project_id !== 'none' ? formData.project_id : null,
        description: formData.description || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: totalMinutes,
        is_billable: formData.is_billable,
        hourly_rate: formData.hourly_rate || null,
      })
      .eq('id', editingEntry.id);
    
    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן לוג זמן',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'הצלחה',
        description: 'לוג הזמן עודכן בהצלחה',
      });
      setEditingEntry(null);
      resetForm();
      fetchData();
    }
  };
  
  const handleDeleteEntry = async () => {
    if (!deleteConfirm) return;
    
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', deleteConfirm.id);
    
    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק לוג זמן',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'הצלחה',
        description: 'לוג הזמן נמחק בהצלחה',
      });
      setDeleteConfirm(null);
      fetchData();
    }
  };
  
  const handleExport = () => {
    const headers = ['תאריך', 'שעה', 'פרויקט', 'תיאור', 'משך (דקות)', 'לחיוב', 'משתמש'];
    const rows = filteredEntries.map(entry => [
      formatDateShort(entry.start_time),
      formatTime(entry.start_time),
      entry.project_name || 'ללא פרויקט',
      entry.description || '',
      entry.duration_minutes || 0,
      entry.is_billable ? 'כן' : 'לא',
      entry.user_name || '',
    ]);
    
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-logs-${clientName}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'הצלחה',
      description: 'הקובץ הורד בהצלחה',
    });
  };
  
  const resetForm = () => {
    const now = new Date();
    setFormData({
      project_id: '',
      description: '',
      log_date: now,
      start_hour: now.getHours(),
      start_minute: now.getMinutes(),
      duration_hours: 0,
      duration_minutes: 0,
      is_billable: true,
      hourly_rate: 0,
    });
  };
  
  const openEditDialog = (entry: TimeEntry) => {
    const entryDate = parseISO(entry.start_time);
    setEditingEntry(entry);
    setFormData({
      project_id: entry.project_id || '',
      description: entry.description || '',
      log_date: entryDate,
      start_hour: entryDate.getHours(),
      start_minute: entryDate.getMinutes(),
      duration_hours: Math.floor((entry.duration_minutes || 0) / 60),
      duration_minutes: (entry.duration_minutes || 0) % 60,
      is_billable: entry.is_billable ?? true,
      hourly_rate: entry.hourly_rate || 0,
    });
  };
  
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Filter label
  const filterLabels: Record<TimeFilter, string> = {
    all: 'כל הזמן',
    today: 'היום',
    week: 'השבוע',
    month: 'החודש',
    custom: 'טווח מותאם',
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4A843]" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-[#162C58] to-[#1e3a6e] text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm opacity-80">סה"כ שעות</p>
                <p className="text-xl font-bold">{formatDuration(stats.totalMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#D4A843] to-[#b8923a] text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm opacity-80">לחיוב</p>
                <p className="text-xl font-bold">{formatDuration(stats.billableMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">פרויקטים</p>
                <p className="text-xl font-bold">{stats.uniqueProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">שווי משוער</p>
                <p className="text-xl font-bold">₪{stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Billable Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">אחוז שעות לחיוב</span>
            <span className="text-sm text-muted-foreground">{stats.billablePercentage.toFixed(0)}%</span>
          </div>
          <Progress value={stats.billablePercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatDuration(stats.billableMinutes)} לחיוב</span>
            <span>{formatDuration(stats.nonBillableMinutes)} לא לחיוב</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Filters & Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            
            {/* Time Filter */}
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-[140px]">
                <CalendarIcon className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(filterLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Custom Date Range */}
            {timeFilter === 'custom' && (
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {customDateRange.from && customDateRange.to
                      ? `${format(customDateRange.from, 'dd/MM')} - ${format(customDateRange.to, 'dd/MM')}`
                      : 'בחר טווח'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent dir="rtl" className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => {
                      setCustomDateRange({ from: range?.from, to: range?.to });
                      if (range?.from && range?.to) {
                        setIsDatePickerOpen(false);
                      }
                    }}
                    locale={he}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
            
            {/* Project Filter */}
            {projects.length > 0 && (
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[160px]">
                  <Briefcase className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הפרויקטים</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Billable Toggle */}
            <Button
              variant={showBillableOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowBillableOnly(!showBillableOnly)}
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              לחיוב בלבד
            </Button>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* View Mode */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 w-8 p-0"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'summary' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('summary')}
                className="h-8 w-8 p-0"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Actions */}
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              ייצוא
            </Button>
            
            {canEdit && (
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="gap-2 bg-[#D4A843] hover:bg-[#b8923a]">
                <Plus className="h-4 w-4" />
                הוסף לוג
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">אין לוגי זמן להצגה</p>
              {canEdit && (
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  הוסף לוג ראשון
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Table View */}
              {viewMode === 'table' && (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('date')}>
                          <div className="flex items-center gap-1">
                            תאריך
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">שעה</TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('project')}>
                          <div className="flex items-center gap-1">
                            פרויקט
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">תיאור</TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('duration')}>
                          <div className="flex items-center gap-1">
                            משך
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('user')}>
                          <div className="flex items-center gap-1">
                            משתמש
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">לחיוב</TableHead>
                        {canEdit && <TableHead className="text-right w-[50px]">פעולות</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map(entry => (
                        <TableRow key={entry.id} className="group hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {formatDateShort(entry.start_time)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatTime(entry.start_time)}
                            {entry.end_time && ` - ${formatTime(entry.end_time)}`}
                          </TableCell>
                          <TableCell>
                            {entry.project_name ? (
                              <Badge variant="outline" className="gap-1">
                                <Briefcase className="h-3 w-3" />
                                {entry.project_name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {entry.description || '-'}
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {formatDuration(entry.duration_minutes || 0)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                {entry.user_name?.charAt(0)}
                              </div>
                              <span className="text-sm">{entry.user_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.is_billable ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <DollarSign className="h-3 w-3 ml-1" />
                                כן
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                לא
                              </Badge>
                            )}
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(entry)} className="gap-2">
                                    <Edit className="h-4 w-4" />
                                    עריכה
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeleteConfirm(entry)}
                                    className="gap-2 text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    מחיקה
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
              
              {/* List View (Grouped by Date) */}
              {viewMode === 'list' && (
                <ScrollArea className="h-[500px]">
                  <div className="divide-y">
                    {Object.entries(entriesByDate)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([date, entries]) => {
                        const dateTotal = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
                        const isExpanded = expandedDates.has(date);
                        
                        return (
                          <div key={date}>
                            {/* Date Header */}
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedDates);
                                if (isExpanded) {
                                  newExpanded.delete(date);
                                } else {
                                  newExpanded.add(date);
                                }
                                setExpandedDates(newExpanded);
                              }}
                              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <CalendarIcon className="h-4 w-4 text-[#D4A843]" />
                                <span className="font-medium">{formatDateFull(date)}</span>
                                <Badge variant="secondary">{entries.length} רשומות</Badge>
                              </div>
                              <div className="font-mono font-bold text-[#162C58]">
                                {formatDuration(dateTotal)}
                              </div>
                            </button>
                            
                            {/* Entries */}
                            {isExpanded && (
                              <div className="bg-muted/30 divide-y divide-muted">
                                {entries.map(entry => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-4 pr-12 hover:bg-muted/50 group"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="text-sm text-muted-foreground font-mono w-24">
                                        {formatTime(entry.start_time)}
                                        {entry.end_time && ` - ${formatTime(entry.end_time)}`}
                                      </div>
                                      <div>
                                        <p className="font-medium">{entry.description || 'ללא תיאור'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          {entry.project_name && (
                                            <Badge variant="outline" className="gap-1 text-xs">
                                              <Briefcase className="h-3 w-3" />
                                              {entry.project_name}
                                            </Badge>
                                          )}
                                          <span className="text-xs text-muted-foreground">{entry.user_name}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-left">
                                        <p className="font-mono font-bold">{formatDuration(entry.duration_minutes || 0)}</p>
                                        {entry.is_billable && (
                                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                            <DollarSign className="h-3 w-3" />
                                          </Badge>
                                        )}
                                      </div>
                                      {canEdit && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem onClick={() => openEditDialog(entry)} className="gap-2">
                                                <Edit className="h-4 w-4" />
                                                עריכה
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => setDeleteConfirm(entry)}
                                                className="gap-2 text-red-600"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                                מחיקה
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              )}
              
              {/* Summary View (By Project) */}
              {viewMode === 'summary' && (
                <ScrollArea className="h-[500px]">
                  <div className="p-4 space-y-4">
                    {Object.entries(entriesByProject)
                      .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
                      .map(([projectId, data]) => {
                        const percentage = stats.totalMinutes > 0
                          ? (data.totalMinutes / stats.totalMinutes) * 100
                          : 0;
                        const isExpanded = expandedProjects.has(projectId);
                        
                        return (
                          <Card key={projectId}>
                            <CardContent className="p-4">
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedProjects);
                                  if (isExpanded) {
                                    newExpanded.delete(projectId);
                                  } else {
                                    newExpanded.add(projectId);
                                  }
                                  setExpandedProjects(newExpanded);
                                }}
                                className="w-full"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <div className="p-2 rounded-lg bg-blue-100">
                                      <Briefcase className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">{data.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {data.entries.length} רשומות
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <p className="font-mono font-bold text-lg">{formatDuration(data.totalMinutes)}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDuration(data.billableMinutes)} לחיוב
                                    </p>
                                  </div>
                                </div>
                                
                                <Progress value={percentage} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1 text-left">
                                  {percentage.toFixed(1)}% מסה"כ
                                </p>
                              </button>
                              
                              {/* Project Entries */}
                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t space-y-2">
                                  {data.entries.map(entry => (
                                    <div
                                      key={entry.id}
                                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                          {formatDateShort(entry.start_time)}
                                        </span>
                                        <span className="text-sm">{entry.description || 'ללא תיאור'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm">
                                          {formatDuration(entry.duration_minutes || 0)}
                                        </span>
                                        {entry.is_billable && (
                                          <DollarSign className="h-3 w-3 text-green-600" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || !!editingEntry} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingEntry(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'עריכת לוג זמן' : 'הוספת לוג זמן'}</DialogTitle>
            <DialogDescription>
              {editingEntry ? 'ערוך את פרטי הלוג' : 'הזן את פרטי לוג הזמן החדש'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Project */}
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label>פרויקט (אופציונלי)</Label>
                <Select value={formData.project_id} onValueChange={(v) => setFormData(prev => ({ ...prev, project_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר פרויקט" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא פרויקט</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Description */}
            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="מה עשית?"
                rows={2}
              />
            </div>
            
            {/* Date */}
            <div className="space-y-2">
              <Label>תאריך</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(formData.log_date, 'PPP', { locale: he })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent dir="rtl" className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.log_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, log_date: date }))}
                    locale={he}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Start Time */}
            <div className="space-y-2">
              <Label>שעת התחלה</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={formData.start_hour}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_hour: parseInt(e.target.value) || 0 }))}
                  className="w-16 text-center"
                />
                <span>:</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={formData.start_minute}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_minute: parseInt(e.target.value) || 0 }))}
                  className="w-16 text-center"
                />
              </div>
            </div>
            
            {/* Duration */}
            <div className="space-y-2">
              <Label>משך זמן</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 0 }))}
                      className="text-center"
                    />
                    <span className="text-sm text-muted-foreground">שעות</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: Math.min(59, parseInt(e.target.value) || 0) }))}
                      className="text-center"
                    />
                    <span className="text-sm text-muted-foreground">דקות</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Billable & Rate */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_billable"
                  checked={formData.is_billable}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_billable: e.target.checked }))}
                  className="rounded"
                  aria-label="לחיוב"
                />
                <Label htmlFor="is_billable" className="cursor-pointer">לחיוב</Label>
              </div>
              
              {formData.is_billable && (
                <div className="flex items-center gap-2 flex-1">
                  <Label className="shrink-0">תעריף לשעה:</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">₪</span>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setEditingEntry(null);
              resetForm();
            }}>
              ביטול
            </Button>
            <Button onClick={editingEntry ? handleUpdateEntry : handleAddEntry} className="gap-2 bg-[#D4A843] hover:bg-[#b8923a]">
              {editingEntry ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>מחיקת לוג זמן</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק לוג זמן זה? פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDeleteEntry}>
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClientTimeLogsTab;
