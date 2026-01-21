// Time Logs Page - e-control CRM Pro
import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { ColumnDef } from '@/components/DataTable';
import { UniversalDataTable } from '@/components/tables/UniversalDataTable';
import { TimeAnalyticsDashboard } from '@/components/timer/TimeAnalyticsDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  User,
  Briefcase,
  Calendar as CalendarIcon,
  Filter,
  Search,
  Download,
  BarChart3,
  Timer,
  Users,
  TrendingUp,
  DollarSign,
  X,
  Save,
  ChevronDown,
  LayoutGrid,
  List,
  Map as MapIcon,
  Grid3x3,
  Layers,
  FileText,
  Minimize2,
} from 'lucide-react';
import { TimeLogsCalendarView } from '@/components/timer/TimeLogsCalendarView';
import { TimeLogsTimelineView } from '@/components/timer/TimeLogsTimelineView';
import { TimeLogsHeatmapView } from '@/components/timer/TimeLogsHeatmapView';
import { 
  TimeLogsKanbanView, 
  TimeLogsGroupedView, 
  TimeLogsInvoiceView, 
  TimeLogsCompactView 
} from '@/components/timer/TimeLogsAdditionalViews';
import { TimeLogsModernTable } from '@/components/timer/TimeLogsModernTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO, differenceInMinutes } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
}

// Inline editing state
interface EditingCell {
  entryId: string;
  field: 'description' | 'client_id' | 'project_id' | 'duration' | 'is_billable' | 'start_date' | 'start_time';
}

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string | null;
}

interface ClientSummary {
  client_id: string;
  client_name: string;
  total_minutes: number;
  total_entries: number;
  billable_minutes: number;
}

type DateFilter = 'today' | 'week' | 'month' | 'custom' | 'all';
type ViewMode = 'list' | 'table' | 'calendar' | 'timeline' | 'heatmap' | 'kanban' | 'grouped' | 'invoice' | 'compact';

export default function TimeLogs() {
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  
  // Debug logging
  console.log('[TimeLogs] Component mounted/rendered', { user: user?.email, isAdmin, isManager });
  
  // Data state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; hourly_rate?: number; avatar_url?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'list' | 'summary'>('list');
  
  // View mode state - persisted to localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('timelogs-view-mode') as ViewMode) || 'list');
  
  // Filter state - persisted to localStorage
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('timelogs-search') || '');
  const [selectedClient, setSelectedClient] = useState<string>(() => localStorage.getItem('timelogs-client') || 'all');
  const [selectedProject, setSelectedProject] = useState<string>(() => localStorage.getItem('timelogs-project') || 'all');
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => (localStorage.getItem('timelogs-date-filter') as DateFilter) || 'all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(() => {
    const saved = localStorage.getItem('timelogs-custom-range');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          from: parsed.from ? new Date(parsed.from) : startOfMonth(new Date()),
          to: parsed.to ? new Date(parsed.to) : endOfMonth(new Date()),
        };
      } catch { /* ignore */ }
    }
    return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
  });
  const [showBillableOnly, setShowBillableOnly] = useState(() => localStorage.getItem('timelogs-billable') === 'true');
  
  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('timelogs-search', searchTerm);
  }, [searchTerm]);
  
  useEffect(() => {
    localStorage.setItem('timelogs-view-mode', viewMode);
  }, [viewMode]);
  
  useEffect(() => {
    localStorage.setItem('timelogs-client', selectedClient);
  }, [selectedClient]);
  
  useEffect(() => {
    localStorage.setItem('timelogs-project', selectedProject);
  }, [selectedProject]);
  
  useEffect(() => {
    localStorage.setItem('timelogs-date-filter', dateFilter);
  }, [dateFilter]);
  
  useEffect(() => {
    localStorage.setItem('timelogs-custom-range', JSON.stringify({
      from: customDateRange.from?.toISOString(),
      to: customDateRange.to?.toISOString(),
    }));
  }, [customDateRange]);
  
  useEffect(() => {
    localStorage.setItem('timelogs-billable', String(showBillableOnly));
  }, [showBillableOnly]);
  
  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>('');
  
  // Form state for adding/editing
  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    description: '',
    log_date: new Date(),
    duration_hours: 0,
    duration_minutes: 0,
    is_billable: true,
    hourly_rate: 0,
  });

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      console.log('🟢 [TimeLogs] fetchData called', { user: user?.email });
      if (!user) {
        console.log('🟡 [TimeLogs] No user, skipping fetch');
        return;
      }
      
      setIsLoading(true);
      
      try {
        console.log('🟢 [TimeLogs] Fetching time entries and related data...');
        const [entriesRes, clientsRes, projectsRes, usersRes] = await Promise.all([
          supabase
            .from('time_entries')
            .select('*')
            .order('start_time', { ascending: false }),
          supabase.from('clients').select('id, name').order('name'),
          supabase.from('projects').select('id, name, client_id').order('name'),
          supabase.from('profiles').select('id, full_name, email, avatar_url'),
        ]);
        
        console.log('🟢 [TimeLogs] Query results:', {
          entries: entriesRes.data?.length || 0,
          entriesError: entriesRes.error,
          entriesData: entriesRes.data?.slice(0, 3), // First 3 entries
        });
        
        if (entriesRes.data) setTimeEntries(entriesRes.data as TimeEntry[]);
        if (clientsRes.data) setClients(clientsRes.data);
        if (projectsRes.data) setProjects(projectsRes.data);
        if (usersRes.data) {
          setUsers(usersRes.data.map(u => ({
            id: u.id,
            name: u.full_name || u.email || 'משתמש',
            email: u.email || '',
            avatar_url: u.avatar_url,
          })));
        }
        
        console.log('✅ [TimeLogs] Data fetched successfully', {
          entries: entriesRes.data?.length || 0,
          clients: clientsRes.data?.length || 0,
          projects: projectsRes.data?.length || 0,
          users: usersRes.data?.length || 0,
        });
      } catch (error) {
        console.error('🔴 [TimeLogs] Error fetching data:', error);
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לטעון את הנתונים',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [user, toast]);

  // Real-time subscription for time entries
  useEffect(() => {
    if (!user) return;

    console.log('🔔 [TimeLogs] Setting up real-time subscription');

    const channel = supabase
      .channel('time-entries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
        },
        (payload) => {
          console.log('🔔 [TimeLogs] Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('➕ [TimeLogs] New entry inserted:', payload.new);
            setTimeEntries((prev) => [payload.new as TimeEntry, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('✏️ [TimeLogs] Entry updated:', payload.new);
            setTimeEntries((prev) =>
              prev.map((entry) =>
                entry.id === (payload.new as TimeEntry).id ? (payload.new as TimeEntry) : entry
              )
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ [TimeLogs] Entry deleted:', payload.old);
            setTimeEntries((prev) =>
              prev.filter((entry) => entry.id !== (payload.old as TimeEntry).id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 [TimeLogs] Subscription status:', status);
      });

    return () => {
      console.log('🔕 [TimeLogs] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Get client name by ID
  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'לא משויך';
    return clients.find(c => c.id === clientId)?.name || 'לא ידוע';
  };

  // Get project name by ID
  const getProjectName = (projectId: string | null) => {
    if (!projectId) return '-';
    return projects.find(p => p.id === projectId)?.name || 'לא ידוע';
  };

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { from: today, to: new Date() };
      case 'week':
        return { from: startOfWeek(now, { locale: he }), to: endOfWeek(now, { locale: he }) };
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'custom':
        return customDateRange;
      case 'all':
      default:
        return { from: undefined, to: undefined };
    }
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    const dateRange = getDateRange();
    
    return timeEntries.filter(entry => {
      // Date filter
      if (dateRange.from && dateRange.to) {
        const entryDate = parseISO(entry.start_time);
        if (!isWithinInterval(entryDate, { start: dateRange.from, end: dateRange.to })) {
          return false;
        }
      }
      
      // Client filter
      if (selectedClient !== 'all' && entry.client_id !== selectedClient) {
        return false;
      }
      
      // Project filter
      if (selectedProject !== 'all' && entry.project_id !== selectedProject) {
        return false;
      }
      
      // Billable filter
      if (showBillableOnly && !entry.is_billable) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const clientName = getClientName(entry.client_id).toLowerCase();
        const projectName = getProjectName(entry.project_id).toLowerCase();
        const description = (entry.description || '').toLowerCase();
        
        if (!clientName.includes(search) && !projectName.includes(search) && !description.includes(search)) {
          return false;
        }
      }
      
      return true;
    });
  }, [timeEntries, dateFilter, customDateRange, selectedClient, selectedProject, showBillableOnly, searchTerm, clients, projects]);

  // Calculate summaries by client
  const clientSummaries = useMemo(() => {
    const summaries = new Map<string, ClientSummary>();
    
    filteredEntries.forEach(entry => {
      const clientId = entry.client_id || 'unassigned';
      const clientName = entry.client_id ? getClientName(entry.client_id) : 'לא משויך';
      
      if (!summaries.has(clientId)) {
        summaries.set(clientId, {
          client_id: clientId,
          client_name: clientName,
          total_minutes: 0,
          total_entries: 0,
          billable_minutes: 0,
        });
      }
      
      const summary = summaries.get(clientId)!;
      summary.total_minutes += entry.duration_minutes || 0;
      summary.total_entries += 1;
      if (entry.is_billable) {
        summary.billable_minutes += entry.duration_minutes || 0;
      }
    });
    
    return Array.from(summaries.values()).sort((a, b) => b.total_minutes - a.total_minutes);
  }, [filteredEntries, clients]);

  // Total stats
  const totalStats = useMemo(() => {
    const total = filteredEntries.reduce((acc, entry) => {
      acc.minutes += entry.duration_minutes || 0;
      acc.entries += 1;
      if (entry.is_billable) {
        acc.billable += entry.duration_minutes || 0;
      }
      return acc;
    }, { minutes: 0, entries: 0, billable: 0 });
    
    return total;
  }, [filteredEntries]);

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} דקות`;
    if (mins === 0) return `${hours} שעות`;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // Format duration short
  const formatDurationShort = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // Toggle billable status
  const toggleBillable = async (entry: TimeEntry) => {
    const { error } = await supabase
      .from('time_entries')
      .update({ is_billable: !entry.is_billable })
      .eq('id', entry.id);
    if (!error) {
      setTimeEntries(prev => prev.map(e => 
        e.id === entry.id ? { ...e, is_billable: !e.is_billable } : e
      ));
    }
  };

  // DataTable columns definition
  const columns: ColumnDef<TimeEntry>[] = [
    {
      id: 'start_time',
      header: 'תאריך',
      accessorKey: 'start_time',
      width: 100,
      sortable: true,
      editable: true,
      editType: 'date',
      cell: (value) => (
        <div className="flex flex-col gap-0.5">
          <div>{format(parseISO(value), 'dd/MM/yy', { locale: he })}</div>
          <div className="text-xs text-muted-foreground">
            {format(parseISO(value), 'HH:mm', { locale: he })}
          </div>
        </div>
      ),
    },
    {
      id: 'client_id',
      header: 'לקוח',
      accessorKey: 'client_id',
      width: 180,
      sortable: true,
      filterable: true,
      editable: true,
      editType: 'select',
      editOptions: clients.map(c => ({ value: c.id, label: c.name })),
      cell: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {getClientName(value)}
        </div>
      ),
    },
    {
      id: 'project_id',
      header: 'פרויקט',
      accessorKey: 'project_id',
      width: 120,
      filterable: true,
      editable: true,
      editType: 'select',
      editOptions: projects.map(p => ({ value: p.id, label: p.name })),
      cell: (value) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          {getProjectName(value)}
        </div>
      ),
    },
    {
      id: 'description',
      header: 'תיאור',
      accessorKey: 'description',
      width: 220,
      filterable: true,
      editable: true,
      editType: 'text',
      cell: (value) => (
        <span className="block truncate max-w-[200px]">
          {value || 'לחץ להוספת תיאור...'}
        </span>
      ),
    },
    {
      id: 'duration_minutes',
      header: 'משך',
      accessorKey: 'duration_minutes',
      width: 80,
      sortable: true,
      summary: 'sum',
      align: 'center',
      cell: (value, row) => (
        <Badge variant={row.is_running ? "default" : "secondary"}>
          {formatDurationShort(value || 0)}
        </Badge>
      ),
    },
    {
      id: 'is_billable',
      header: 'לחיוב',
      accessorKey: 'is_billable',
      width: 80,
      align: 'center',
      cell: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBillable(row);
          }}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {value ? (
            <Badge className="bg-success/20 text-success hover:bg-success/30">כן</Badge>
          ) : (
            <Badge variant="outline" className="hover:bg-muted">לא</Badge>
          )}
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'פעולות',
      accessorKey: 'id',
      width: 100,
      cell: (_, row) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(row);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          {(isAdmin || isManager) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>מחיקת רישום</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם למחוק את רישום הזמן? פעולה זו לא ניתנת לביטול.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      console.log('🗑️ [TimeLogs] Delete button clicked in AlertDialog', { rowId: row.id });
                      handleDeleteEntry(row.id);
                    }}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    מחק
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ),
    },
  ];

  // Reset form
  const resetForm = () => {
    setFormData({
      client_id: '',
      project_id: '',
      description: '',
      log_date: new Date(),
      duration_hours: 0,
      duration_minutes: 0,
      is_billable: true,
      hourly_rate: 0,
    });
  };

  // Handle add entry
  const handleAddEntry = async () => {
    if (!user) return;
    
    const totalMinutes = (formData.duration_hours * 60) + formData.duration_minutes;
    
    if (totalMinutes <= 0) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין משך זמן',
        variant: 'destructive',
      });
      return;
    }
    
    const startTime = new Date(formData.log_date);
    startTime.setHours(9, 0, 0, 0);
    
    const endTime = new Date(startTime.getTime() + totalMinutes * 60 * 1000);
    
    // Note: duration_minutes is a generated column - only set start_time and end_time
    const { error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        description: formData.description || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_billable: formData.is_billable,
        hourly_rate: formData.hourly_rate || null,
        is_running: false,
      });
    
    if (error) {
      console.error('Error adding entry:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף את הרישום',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'רישום נוסף',
      description: 'רישום הזמן נוסף בהצלחה',
    });
    
    // Refresh
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .order('start_time', { ascending: false });
    
    if (data) setTimeEntries(data as TimeEntry[]);
    
    setIsAddDialogOpen(false);
    resetForm();
  };

  // Handle edit entry
  const handleEditEntry = async () => {
    if (!editingEntry) return;
    
    const totalMinutes = (formData.duration_hours * 60) + formData.duration_minutes;
    
    // Calculate end_time based on start_time and duration
    // duration_minutes is a generated column, so we update end_time instead
    const startTime = new Date(editingEntry.start_time);
    const endTime = new Date(startTime.getTime() + totalMinutes * 60 * 1000);
    
    const { error } = await supabase
      .from('time_entries')
      .update({
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        description: formData.description || null,
        end_time: endTime.toISOString(),
        is_billable: formData.is_billable,
        hourly_rate: formData.hourly_rate || null,
      })
      .eq('id', editingEntry.id);
    
    if (error) {
      console.error('Error updating entry:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את הרישום',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'רישום עודכן',
      description: 'רישום הזמן עודכן בהצלחה',
    });
    
    // Refresh
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .order('start_time', { ascending: false });
    
    if (data) setTimeEntries(data as TimeEntry[]);
    
    setIsEditDialogOpen(false);
    setEditingEntry(null);
    resetForm();
  };

  // Handle delete entry
  const handleDeleteEntry = async (id: string) => {
    console.log('🗑️ [TimeLogs] handleDeleteEntry called', { id, isAdmin, isManager });
    
    // Check permissions - only admins can delete
    if (!isAdmin && !isManager) {
      console.log('🔴 [TimeLogs] User not authorized to delete');
      toast({
        title: 'אין הרשאה',
        description: 'רק מנהלים יכולים למחוק רישומי זמן',
        variant: 'destructive',
      });
      return;
    }

    console.log('🗑️ [TimeLogs] Attempting to delete entry...');
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('🔴 [TimeLogs] Error deleting entry:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את הרישום',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('✅ [TimeLogs] Entry deleted successfully');
    toast({
      title: 'רישום נמחק',
      description: 'רישום הזמן נמחק בהצלחה',
    });
    
    setTimeEntries(prev => prev.filter(e => e.id !== id));
  };

  // Open edit dialog
  const openEditDialog = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      client_id: entry.client_id || '',
      project_id: entry.project_id || '',
      description: entry.description || '',
      log_date: new Date(entry.start_time),
      duration_hours: Math.floor((entry.duration_minutes || 0) / 60),
      duration_minutes: (entry.duration_minutes || 0) % 60,
      is_billable: entry.is_billable ?? true,
      hourly_rate: entry.hourly_rate || 0,
    });
    setIsEditDialogOpen(true);
  };

  // Inline edit handlers
  const startInlineEdit = (entryId: string, field: EditingCell['field'], currentValue: string) => {
    setEditingCell({ entryId, field });
    setInlineEditValue(currentValue);
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setInlineEditValue('');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    const entry = timeEntries.find(e => e.id === editingCell.entryId);
    if (!entry) return;

    let updateData: Record<string, any> = {};
    
    switch (editingCell.field) {
      case 'description':
        updateData = { description: inlineEditValue || null };
        break;
      case 'client_id':
        updateData = { client_id: inlineEditValue || null };
        break;
      case 'project_id':
        updateData = { project_id: inlineEditValue || null };
        break;
      case 'duration':
        // duration_minutes is a generated column, so we need to update end_time instead
        const [hrs, mins] = inlineEditValue.split(':').map(Number);
        const totalMins = (hrs || 0) * 60 + (mins || 0);
        if (entry) {
          const startTime = new Date(entry.start_time);
          const newEndTime = new Date(startTime.getTime() + totalMins * 60 * 1000);
          updateData = { end_time: newEndTime.toISOString() };
        }
        break;
      case 'is_billable':
        updateData = { is_billable: inlineEditValue === 'true' };
        break;
      case 'start_date':
        // Update the date while keeping the same time
        if (entry && inlineEditValue) {
          const oldStart = new Date(entry.start_time);
          const [year, month, day] = inlineEditValue.split('-').map(Number);
          const newStart = new Date(oldStart);
          newStart.setFullYear(year, month - 1, day);
          
          // Also update end_time to maintain the same duration
          if (entry.end_time) {
            const oldEnd = new Date(entry.end_time);
            const durationMs = oldEnd.getTime() - oldStart.getTime();
            const newEnd = new Date(newStart.getTime() + durationMs);
            updateData = { start_time: newStart.toISOString(), end_time: newEnd.toISOString() };
          } else {
            updateData = { start_time: newStart.toISOString() };
          }
        }
        break;
      case 'start_time':
        // Update the time while keeping the same date
        if (entry && inlineEditValue) {
          const oldStart = new Date(entry.start_time);
          const [hours, minutes] = inlineEditValue.split(':').map(Number);
          const newStart = new Date(oldStart);
          newStart.setHours(hours, minutes, 0, 0);
          
          // Also update end_time to maintain the same duration
          if (entry.end_time) {
            const oldEnd = new Date(entry.end_time);
            const durationMs = oldEnd.getTime() - oldStart.getTime();
            const newEnd = new Date(newStart.getTime() + durationMs);
            updateData = { start_time: newStart.toISOString(), end_time: newEnd.toISOString() };
          } else {
            updateData = { start_time: newStart.toISOString() };
          }
        }
        break;
    }

    const { error } = await supabase
      .from('time_entries')
      .update(updateData)
      .eq('id', editingCell.entryId);

    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן',
        variant: 'destructive',
      });
    } else {
      setTimeEntries(prev => prev.map(e => 
        e.id === editingCell.entryId ? { ...e, ...updateData } : e
      ));
      toast({
        title: 'עודכן',
        description: 'הרישום עודכן בהצלחה',
      });
    }
    
    cancelInlineEdit();
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['תאריך', 'לקוח', 'פרויקט', 'תיאור', 'משך (דקות)', 'לחיוב'];
    const rows = filteredEntries.map(entry => [
      format(parseISO(entry.start_time), 'dd/MM/yyyy'),
      getClientName(entry.client_id),
      getProjectName(entry.project_id),
      entry.description || '',
      entry.duration_minutes || 0,
      entry.is_billable ? 'כן' : 'לא',
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'יצוא הושלם',
      description: 'קובץ CSV נשמר בהצלחה',
    });
  };

  return (
    <AppLayout title="לוגי זמן">
      <div className="p-4 space-y-3 animate-fade-in overflow-hidden isolate">
        {/* Running Timer Alert */}
        {timeEntries.some(e => e.is_running) && (
          <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-500/20 animate-pulse">
                    <Timer className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                      🕐 טיימר פועל כרגע
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {timeEntries.find(e => e.is_running)?.description || 'ללא תיאור'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300">
                  פעיל
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDurationShort(totalStats.minutes)}</p>
                  <p className="text-sm text-muted-foreground">סה"כ שעות</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-secondary/10">
                  <Timer className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.entries}</p>
                  <p className="text-sm text-muted-foreground">רישומים</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDurationShort(totalStats.billable)}</p>
                  <p className="text-sm text-muted-foreground">לחיוב</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{clientSummaries.length}</p>
                  <p className="text-sm text-muted-foreground">לקוחות פעילים</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                סינון וחיפוש
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    console.log('🔄 [TimeLogs] Manual refresh triggered');
                    setIsLoading(true);
                    try {
                      const { data, error } = await supabase
                        .from('time_entries')
                        .select('*')
                        .order('start_time', { ascending: false });
                      
                      if (error) throw error;
                      
                      console.log('✅ [TimeLogs] Manual refresh completed', { entries: data?.length });
                      setTimeEntries(data as TimeEntry[]);
                      toast({
                        title: 'רענון הושלם',
                        description: `נטענו ${data?.length || 0} רישומי זמן`,
                      });
                    } catch (error) {
                      console.error('🔴 [TimeLogs] Refresh error:', error);
                      toast({
                        title: 'שגיאה',
                        description: 'לא ניתן לרענן את הנתונים',
                        variant: 'destructive',
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  <Timer className="h-4 w-4 ml-2" />
                  {isLoading ? 'טוען...' : 'רענן'}
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 ml-2" />
                  ייצוא
                </Button>
                <Button className="btn-gold" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף רישום
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger>
                  <CalendarIcon className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="תקופה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">היום</SelectItem>
                  <SelectItem value="week">השבוע</SelectItem>
                  <SelectItem value="month">החודש</SelectItem>
                  <SelectItem value="all">הכל</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Client Filter */}
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <User className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="לקוח" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הלקוחות</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Billable Filter */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="billable-only"
                  checked={showBillableOnly}
                  onCheckedChange={(checked) => setShowBillableOnly(checked as boolean)}
                />
                <Label htmlFor="billable-only" className="cursor-pointer text-sm">
                  לחיוב בלבד
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Unified Header with Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex-1 flex flex-col" dir="rtl">
          {/* Unified Header Bar */}
          <div className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg p-3 mb-3">
            {/* Right side - Title and Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[hsl(45,80%,55%)]" />
                <h2 className="text-lg font-bold text-foreground">רישומי זמן</h2>
              </div>
              <Badge 
                className="bg-[hsl(45,80%,55%)]/20 text-[hsl(45,80%,55%)] border-[hsl(45,80%,55%)]/30 font-bold"
              >
                {filteredEntries.length} רישומים
              </Badge>
            </div>

            {/* Center - Tabs */}
            <TabsList className="bg-muted/50 border border-border p-1 gap-1">
              <TabsTrigger 
                value="list" 
                className="data-[state=active]:bg-[hsl(222,47%,20%)] data-[state=active]:text-[hsl(45,80%,55%)] data-[state=active]:shadow-md px-4 py-2 text-sm font-medium transition-all"
              >
                רשימה
              </TabsTrigger>
              <TabsTrigger 
                value="summary" 
                className="data-[state=active]:bg-[hsl(222,47%,20%)] data-[state=active]:text-[hsl(45,80%,55%)] data-[state=active]:shadow-md px-4 py-2 text-sm font-medium transition-all"
              >
                סיכום לפי לקוח
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-[hsl(222,47%,20%)] data-[state=active]:text-[hsl(45,80%,55%)] data-[state=active]:shadow-md px-4 py-2 text-sm font-medium transition-all"
              >
                ניתוח מתקדם
              </TabsTrigger>
            </TabsList>

            {/* Left side - View Mode Selector (only for list tab) */}
            {activeTab === 'list' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 border-border">
                    {viewMode === 'list' && <List className="h-4 w-4" />}
                    {viewMode === 'table' && <Grid3x3 className="h-4 w-4" />}
                    {viewMode === 'calendar' && <CalendarIcon className="h-4 w-4" />}
                    {viewMode === 'timeline' && <BarChart3 className="h-4 w-4" />}
                    {viewMode === 'heatmap' && <MapIcon className="h-4 w-4" />}
                    {viewMode === 'kanban' && <LayoutGrid className="h-4 w-4" />}
                    {viewMode === 'grouped' && <Layers className="h-4 w-4" />}
                    {viewMode === 'invoice' && <FileText className="h-4 w-4" />}
                    {viewMode === 'compact' && <Minimize2 className="h-4 w-4" />}
                    תצוגה
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>בחר תצוגה</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4 ml-2" />
                    רשימה
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('table')}>
                    <Grid3x3 className="h-4 w-4 ml-2" />
                    טבלה מתקדמת
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('calendar')}>
                    <CalendarIcon className="h-4 w-4 ml-2" />
                    לוח שנה
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('timeline')}>
                    <BarChart3 className="h-4 w-4 ml-2" />
                    ציר זמן
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('heatmap')}>
                    <MapIcon className="h-4 w-4 ml-2" />
                    מפת חום
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('kanban')}>
                    <LayoutGrid className="h-4 w-4 ml-2" />
                    קנבן
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('grouped')}>
                    <Layers className="h-4 w-4 ml-2" />
                    מקובץ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('invoice')}>
                    <FileText className="h-4 w-4 ml-2" />
                    חיוב
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('compact')}>
                    <Minimize2 className="h-4 w-4 ml-2" />
                    מצומצם
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-2 flex-1">
            <TimeAnalyticsDashboard
              timeEntries={timeEntries}
              users={users}
              clients={clients}
              projects={projects}
              onAddEntry={() => { resetForm(); setIsAddDialogOpen(true); }}
              defaultHourlyRate={150}
            />
          </TabsContent>

          {/* List Tab - Maximum space for table */}
          <TabsContent value="list" className="mt-2 flex-1">
            {viewMode === 'list' && (
              <TimeLogsModernTable
                timeEntries={filteredEntries}
                clients={clients}
                projects={projects}
                onEdit={openEditDialog}
                onDelete={handleDeleteEntry}
                onDuplicate={(entry) => {
                  // Open add dialog with pre-filled data
                  setFormData({
                    client_id: entry.client_id || '',
                    project_id: entry.project_id || '',
                    description: entry.description || '',
                    log_date: new Date(),
                    duration_hours: Math.floor((entry.duration_minutes || 0) / 60),
                    duration_minutes: (entry.duration_minutes || 0) % 60,
                    is_billable: entry.is_billable ?? true,
                    hourly_rate: entry.hourly_rate || 0,
                  });
                  setIsAddDialogOpen(true);
                }}
                loading={isLoading}
                canDelete={isAdmin || isManager}
              />
            )}

            {viewMode === 'table' && (
              <UniversalDataTable
                tableName="time_entries"
                data={filteredEntries}
                setData={setTimeEntries}
                baseColumns={columns}
                canAddColumns={isManager || isAdmin}
                canDeleteColumns={isAdmin}
                variant="navy"
                paginated={false}
                pageSize={100}
                globalSearch
                striped
                columnToggle
                showSummary
                exportable
                filterable
                loading={isLoading}
                emptyMessage="אין רישומי זמן"
                onCellEdit={async (row, columnId, newValue) => {
                  const updateData: Record<string, any> = { [columnId]: newValue };
                  
                  // Special handling for start_time - update end_time to maintain duration
                  if (columnId === 'start_time' && row.end_time) {
                    const oldStart = new Date(row.start_time);
                    const oldEnd = new Date(row.end_time);
                    const durationMs = oldEnd.getTime() - oldStart.getTime();
                    const newStart = new Date(newValue);
                    const newEnd = new Date(newStart.getTime() + durationMs);
                    updateData.start_time = newStart.toISOString();
                    updateData.end_time = newEnd.toISOString();
                  }
                  
                  const { error } = await supabase
                    .from('time_entries')
                    .update(updateData)
                    .eq('id', row.id);
                    
                  if (!error) {
                    setTimeEntries(prev => prev.map(e => 
                      e.id === row.id ? { ...e, ...updateData } : e
                    ));
                    toast({ title: 'עודכן', description: 'הרישום עודכן בהצלחה' });
                  } else {
                    toast({ title: 'שגיאה', description: 'לא ניתן לעדכן', variant: 'destructive' });
                  }
                }}
              />
            )}

            {viewMode === 'calendar' && (
              <TimeLogsCalendarView
                timeEntries={filteredEntries}
                clients={clients}
                getClientName={getClientName}
                onDayClick={(date) => {
                  // Filter to clicked day
                  toast({
                    title: 'יום נבחר',
                    description: format(date, 'dd MMMM yyyy', { locale: he }),
                  });
                }}
                onAddEntry={() => { resetForm(); setIsAddDialogOpen(true); }}
              />
            )}

            {viewMode === 'timeline' && (
              <TimeLogsTimelineView
                timeEntries={filteredEntries}
                clients={clients}
                getClientName={getClientName}
                onEntryClick={openEditDialog}
              />
            )}

            {viewMode === 'heatmap' && (
              <TimeLogsHeatmapView
                timeEntries={filteredEntries}
                onDayClick={(date) => {
                  toast({
                    title: 'יום נבחר',
                    description: format(date, 'dd MMMM yyyy', { locale: he }),
                  });
                }}
              />
            )}

            {viewMode === 'kanban' && (
              <TimeLogsKanbanView
                timeEntries={filteredEntries}
                clients={clients}
                getClientName={getClientName}
                onEntryClick={openEditDialog}
              />
            )}

            {viewMode === 'grouped' && (
              <TimeLogsGroupedView
                timeEntries={filteredEntries}
                clients={clients}
                projects={projects}
                getClientName={getClientName}
              />
            )}

            {viewMode === 'invoice' && (
              <TimeLogsInvoiceView
                timeEntries={filteredEntries}
                clients={clients}
                getClientName={getClientName}
              />
            )}

            {viewMode === 'compact' && (
              <TimeLogsCompactView
                timeEntries={filteredEntries}
                getClientName={getClientName}
                onEntryClick={openEditDialog}
              />
            )}
          </TabsContent>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-2 flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                  סיכום שעות לפי לקוח
                </CardTitle>
                <CardDescription>
                  התפלגות שעות העבודה לפי לקוחות בתקופה הנבחרת
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientSummaries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">אין נתונים להצגה</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientSummaries.map((summary, index) => {
                      const percentage = totalStats.minutes > 0 
                        ? (summary.total_minutes / totalStats.minutes) * 100 
                        : 0;
                      
                      return (
                        <div key={summary.client_id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                index === 0 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                              )}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{summary.client_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {summary.total_entries} רישומים
                                </p>
                              </div>
                            </div>
                            <div className="text-end">
                              <p className="font-mono font-bold text-lg">
                                {formatDuration(summary.total_minutes)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {summary.billable_minutes > 0 && `${formatDuration(summary.billable_minutes)} לחיוב`}
                              </p>
                            </div>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Entry Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת רישום זמן</DialogTitle>
              <DialogDescription>
                הזן את פרטי רישום הזמן הידני
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Client */}
              <div className="space-y-2">
                <Label>לקוח</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Project */}
              <div className="space-y-2">
                <Label>פרויקט (אופציונלי)</Label>
                <Select value={formData.project_id} onValueChange={(v) => setFormData(prev => ({ ...prev, project_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר פרויקט" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects
                      .filter(p => !formData.client_id || p.client_id === formData.client_id)
                      .map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date */}
              <div className="space-y-2">
                <Label>תאריך</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-right">
                      <CalendarIcon className="h-4 w-4 ml-2" />
                      {format(formData.log_date, 'dd/MM/yyyy', { locale: he })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.log_date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, log_date: date }))}
                      locale={he}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Duration */}
              <div className="space-y-2">
                <Label>משך זמן</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
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
                        min={0}
                        max={59}
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                        className="text-center"
                      />
                      <span className="text-sm text-muted-foreground">דקות</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label>תיאור (אופציונלי)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור העבודה..."
                  rows={3}
                />
              </div>
              
              {/* Billable */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-billable"
                  checked={formData.is_billable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_billable: checked as boolean }))}
                />
                <Label htmlFor="is-billable" className="cursor-pointer">
                  לחיוב
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleAddEntry} className="btn-gold">
                <Save className="h-4 w-4 ml-2" />
                שמור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Entry Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>עריכת רישום זמן</DialogTitle>
              <DialogDescription>
                ערוך את פרטי רישום הזמן
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Client */}
              <div className="space-y-2">
                <Label>לקוח</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Project */}
              <div className="space-y-2">
                <Label>פרויקט (אופציונלי)</Label>
                <Select value={formData.project_id} onValueChange={(v) => setFormData(prev => ({ ...prev, project_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר פרויקט" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects
                      .filter(p => !formData.client_id || p.client_id === formData.client_id)
                      .map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Duration */}
              <div className="space-y-2">
                <Label>משך זמן</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
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
                        min={0}
                        max={59}
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                        className="text-center"
                      />
                      <span className="text-sm text-muted-foreground">דקות</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label>תיאור (אופציונלי)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור העבודה..."
                  rows={3}
                />
              </div>
              
              {/* Billable */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-is-billable"
                  checked={formData.is_billable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_billable: checked as boolean }))}
                />
                <Label htmlFor="edit-is-billable" className="cursor-pointer">
                  לחיוב
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingEntry(null); }}>
                ביטול
              </Button>
              <Button onClick={handleEditEntry} className="btn-gold">
                <Save className="h-4 w-4 ml-2" />
                עדכן
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
