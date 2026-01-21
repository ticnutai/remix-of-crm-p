// History Page - Undo/Redo Actions & Activity Log
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  History as HistoryIcon, 
  Undo2, 
  Redo2, 
  Search, 
  Calendar as CalendarIcon,
  User,
  FileText,
  Trash2,
  Edit,
  Eye,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Filter,
  X,
  Clock,
  Activity,
  AlertCircle,
  CheckSquare,
  Users,
  Briefcase,
  DollarSign,
  Bell,
  MessageSquare,
  FolderOpen,
  Settings,
  Download,
  Upload,
  Mail,
  Link,
  Archive,
  Copy,
  Move,
  Share,
  Lock,
  Unlock,
  Star,
  Tag
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@/components/DataTable/types';

interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
  user_name?: string;
}

// Icons and labels mappings
const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4 text-green-500" />,
  update: <Edit className="h-4 w-4 text-blue-500" />,
  delete: <Trash2 className="h-4 w-4 text-red-500" />,
  view: <Eye className="h-4 w-4 text-muted-foreground" />,
  login: <LogIn className="h-4 w-4 text-primary" />,
  logout: <LogOut className="h-4 w-4 text-muted-foreground" />,
  export: <Download className="h-4 w-4 text-purple-500" />,
  import: <Upload className="h-4 w-4 text-purple-500" />,
  send: <Mail className="h-4 w-4 text-blue-500" />,
  complete: <CheckSquare className="h-4 w-4 text-green-500" />,
  archive: <Archive className="h-4 w-4 text-amber-500" />,
  restore: <RefreshCw className="h-4 w-4 text-green-500" />,
  duplicate: <Copy className="h-4 w-4 text-blue-500" />,
  move: <Move className="h-4 w-4 text-blue-500" />,
  share: <Share className="h-4 w-4 text-indigo-500" />,
  lock: <Lock className="h-4 w-4 text-red-500" />,
  unlock: <Unlock className="h-4 w-4 text-green-500" />,
  assign: <Users className="h-4 w-4 text-blue-500" />,
  comment: <MessageSquare className="h-4 w-4 text-blue-500" />,
  status_change: <RefreshCw className="h-4 w-4 text-amber-500" />,
  payment: <DollarSign className="h-4 w-4 text-green-500" />,
  reminder: <Bell className="h-4 w-4 text-amber-500" />,
  link: <Link className="h-4 w-4 text-blue-500" />,
  star: <Star className="h-4 w-4 text-yellow-500" />,
  tag: <Tag className="h-4 w-4 text-purple-500" />,
  settings: <Settings className="h-4 w-4 text-gray-500" />,
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  clients: <User className="h-4 w-4" />,
  projects: <Briefcase className="h-4 w-4" />,
  time_entries: <Clock className="h-4 w-4" />,
  profiles: <User className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  tasks: <CheckSquare className="h-4 w-4" />,
  meetings: <Users className="h-4 w-4" />,
  quotes: <FileText className="h-4 w-4" />,
  reminders: <Bell className="h-4 w-4" />,
  invoices: <DollarSign className="h-4 w-4" />,
  payments: <DollarSign className="h-4 w-4" />,
  files: <FolderOpen className="h-4 w-4" />,
  documents: <FileText className="h-4 w-4" />,
  messages: <MessageSquare className="h-4 w-4" />,
  comments: <MessageSquare className="h-4 w-4" />,
  notes: <FileText className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  custom_tables: <FileText className="h-4 w-4" />,
  backups: <Archive className="h-4 w-4" />,
  employees: <Users className="h-4 w-4" />,
  reports: <FileText className="h-4 w-4" />,
  tags: <Tag className="h-4 w-4" />,
};

const ACTION_LABELS: Record<string, string> = {
  create: 'יצירה',
  update: 'עדכון',
  delete: 'מחיקה',
  view: 'צפייה',
  login: 'התחברות',
  logout: 'התנתקות',
  export: 'ייצוא',
  import: 'ייבוא',
  send: 'שליחה',
  complete: 'השלמה',
  archive: 'ארכוב',
  restore: 'שחזור',
  duplicate: 'שכפול',
  move: 'העברה',
  share: 'שיתוף',
  lock: 'נעילה',
  unlock: 'ביטול נעילה',
  assign: 'הקצאה',
  comment: 'תגובה',
  status_change: 'שינוי סטטוס',
  payment: 'תשלום',
  reminder: 'תזכורת',
  link: 'קישור',
  star: 'סימון כוכב',
  tag: 'תיוג',
  settings: 'הגדרות',
};

const ENTITY_LABELS: Record<string, string> = {
  clients: 'לקוחות',
  projects: 'פרויקטים',
  time_entries: 'רישומי זמן',
  profiles: 'פרופילים',
  user: 'משתמש',
  tasks: 'משימות',
  meetings: 'פגישות',
  quotes: 'הצעות מחיר',
  reminders: 'תזכורות',
  invoices: 'חשבוניות',
  payments: 'תשלומים',
  files: 'קבצים',
  documents: 'מסמכים',
  messages: 'הודעות',
  comments: 'תגובות',
  notes: 'הערות',
  settings: 'הגדרות',
  custom_tables: 'טבלאות מותאמות',
  backups: 'גיבויים',
  employees: 'עובדים',
  reports: 'דוחות',
  tags: 'תגיות',
};

export default function History() {
  const { canUndo, canRedo, pastActions, futureActions, undo, redo, clearHistory } = useUndoRedo();
  
  // Activity log state
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  
  // Ref for cleanup
  const isMountedRef = useRef(true);

  // Stats
  const todayCount = useMemo(() => {
    const today = startOfDay(new Date());
    return logs.filter(log => new Date(log.created_at) >= today).length;
  }, [logs]);

  const weekCount = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    return logs.filter(log => new Date(log.created_at) >= weekAgo).length;
  }, [logs]);

  // Fetch profiles for user names
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name');
      if (data) {
        const profileMap: Record<string, string> = {};
        data.forEach(p => { profileMap[p.id] = p.full_name; });
        setProfiles(profileMap);
      }
    };
    fetchProfiles();
  }, []);

  // Fetch activity logs with useCallback for proper dependency tracking
  const fetchLogs = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (dateFrom) {
        query = query.gte('created_at', startOfDay(dateFrom).toISOString());
      }
      if (dateTo) {
        query = query.lte('created_at', endOfDay(dateTo).toISOString());
      }
      if (selectedAction !== 'all') {
        query = query.eq('action', selectedAction);
      }
      if (selectedEntity !== 'all') {
        query = query.eq('entity_type', selectedEntity);
      }

      const { data, error: fetchError } = await query;
      
      if (!isMountedRef.current) return;
      
      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      if (isMountedRef.current) {
        setError('שגיאה בטעינת יומן הפעילות. נסה לרענן את העמוד.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedAction, selectedEntity, dateFrom, dateTo]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch logs when filters change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Realtime subscription for new activity
  useEffect(() => {
    const channel = supabase
      .channel('activity_log_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => {
          if (isMountedRef.current) {
            setLogs(prev => [payload.new as ActivityLogEntry, ...prev].slice(0, 500));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Enrich logs with user names
  const enrichedLogs = useMemo(() => {
    return logs.map(log => ({
      ...log,
      user_name: log.user_id ? profiles[log.user_id] || 'משתמש לא ידוע' : 'מערכת',
    }));
  }, [logs, profiles]);

  // Filter by search term
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return enrichedLogs;
    const term = searchTerm.toLowerCase();
    return enrichedLogs.filter(log => 
      log.user_name?.toLowerCase().includes(term) ||
      ACTION_LABELS[log.action]?.toLowerCase().includes(term) ||
      ENTITY_LABELS[log.entity_type]?.toLowerCase().includes(term) ||
      JSON.stringify(log.details)?.toLowerCase().includes(term)
    );
  }, [enrichedLogs, searchTerm]);

  // Unique values for filters
  const uniqueActions = useMemo(() => [...new Set(logs.map(l => l.action))], [logs]);
  const uniqueEntities = useMemo(() => [...new Set(logs.map(l => l.entity_type))], [logs]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAction('all');
    setSelectedEntity('all');
    setDateFrom(subDays(new Date(), 7));
    setDateTo(new Date());
  };

  const hasActiveFilters = searchTerm || selectedAction !== 'all' || selectedEntity !== 'all';

  // Table columns
  const columns: ColumnDef<ActivityLogEntry>[] = [
    {
      id: 'created_at',
      header: 'תאריך ושעה',
      accessorKey: 'created_at',
      width: 160,
      cell: (value) => (
        <span className="text-sm">
          {format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: he })}
        </span>
      ),
    },
    {
      id: 'user_name',
      header: 'משתמש',
      accessorKey: 'user_name',
      width: 150,
      cell: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{value || 'מערכת'}</span>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'פעולה',
      accessorKey: 'action',
      width: 120,
      cell: (value) => (
        <div className="flex items-center gap-2">
          {ACTION_ICONS[value] || <Activity className="h-4 w-4" />}
          <Badge variant={value === 'delete' ? 'destructive' : value === 'create' ? 'default' : 'secondary'}>
            {ACTION_LABELS[value] || value}
          </Badge>
        </div>
      ),
    },
    {
      id: 'entity_type',
      header: 'ישות',
      accessorKey: 'entity_type',
      width: 130,
      cell: (value) => (
        <div className="flex items-center gap-2">
          {ENTITY_ICONS[value] || <FileText className="h-4 w-4" />}
          <span>{ENTITY_LABELS[value] || value}</span>
        </div>
      ),
    },
    {
      id: 'details',
      header: 'פרטים',
      accessorKey: 'details',
      cell: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        const detailsStr = JSON.stringify(value);
        return (
          <span className="text-sm text-muted-foreground truncate max-w-[300px] block" title={detailsStr}>
            {detailsStr.length > 50 ? detailsStr.substring(0, 50) + '...' : detailsStr}
          </span>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <HistoryIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">היסטוריה</h1>
              <p className="text-muted-foreground text-sm">צפייה בפעולות אחרונות ויומן פעילות</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">פעולות היום</p>
                  <p className="text-2xl font-bold">{todayCount}</p>
                </div>
                <Activity className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">פעולות השבוע</p>
                  <p className="text-2xl font-bold">{weekCount}</p>
                </div>
                <Clock className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">פעולות לביטול</p>
                  <p className="text-2xl font-bold">{pastActions.length}</p>
                </div>
                <Undo2 className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="undo-redo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="undo-redo" className="gap-2">
              <Undo2 className="h-4 w-4" />
              בטל/בצע שוב
              {pastActions.length > 0 && (
                <Badge variant="secondary" className="mr-1">{pastActions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity-log" className="gap-2">
              <Activity className="h-4 w-4" />
              יומן פעילות
            </TabsTrigger>
          </TabsList>

          {/* Undo/Redo Tab */}
          <TabsContent value="undo-redo">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">פעולות אחרונות</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo}>
                    <Undo2 className="h-4 w-4 ml-1" />
                    בטל
                  </Button>
                  <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo}>
                    <Redo2 className="h-4 w-4 ml-1" />
                    בצע שוב
                  </Button>
                  {pastActions.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory}>
                      <Trash2 className="h-4 w-4 ml-1" />
                      נקה היסטוריה
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pastActions.length === 0 && futureActions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Undo2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>אין פעולות בהיסטוריה</p>
                    <p className="text-sm">פעולות שתבצע יופיעו כאן</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Future actions (can redo) */}
                    {futureActions.map((action, idx) => (
                      <div key={action.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 opacity-60">
                        <div className="flex items-center gap-3">
                          <Redo2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{action.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {`${action.timestamp.getHours()}:${action.timestamp.getMinutes()}:${action.timestamp.getSeconds()}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">ניתן לבצע שוב</Badge>
                      </div>
                    ))}
                    
                    {/* Past actions (can undo) */}
                    {[...pastActions].reverse().map((action, idx) => (
                      <div key={action.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded bg-primary/10">
                            <Activity className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{action.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {`${action.timestamp.getHours()}:${action.timestamp.getMinutes()}:${action.timestamp.getSeconds()}`} • {action.type}
                            </p>
                          </div>
                        </div>
                        {idx === pastActions.length - 1 && (
                          <Button variant="ghost" size="sm" onClick={undo}>
                            <Undo2 className="h-4 w-4 ml-1" />
                            בטל
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity-log">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">יומן פעילות מלא</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchLogs}>
                      <RefreshCw className="h-4 w-4 ml-1" />
                      רענן
                    </Button>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="חיפוש..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-9"
                      />
                    </div>

                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="סוג פעולה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל הפעולות</SelectItem>
                        {uniqueActions.map(action => (
                          <SelectItem key={action} value={action}>
                            {ACTION_LABELS[action] || action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="סוג ישות" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל הישויות</SelectItem>
                        {uniqueEntities.map(entity => (
                          <SelectItem key={entity} value={entity}>
                            {ENTITY_LABELS[entity] || entity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {dateFrom ? format(dateFrom, 'dd/MM') : 'מ-'} - {dateTo ? format(dateTo, 'dd/MM') : 'עד'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" align="start">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-2">מתאריך</p>
                            <Calendar
                              mode="single"
                              selected={dateFrom}
                              onSelect={setDateFrom}
                              className="pointer-events-auto"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">עד תאריך</p>
                            <Calendar
                              mode="single"
                              selected={dateTo}
                              onSelect={setDateTo}
                              className="pointer-events-auto"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 ml-1" />
                        נקה סינונים
                      </Button>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{filteredLogs.length} רשומות</span>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="gap-1">
                        <Filter className="h-3 w-3" />
                        סינון פעיל
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="flex items-center gap-3 p-4 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchLogs}>
                      <RefreshCw className="h-4 w-4 ml-1" />
                      נסה שוב
                    </Button>
                  </div>
                )}
                <DataTable
                  data={filteredLogs}
                  columns={columns}
                  paginated
                  pageSize={15}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
