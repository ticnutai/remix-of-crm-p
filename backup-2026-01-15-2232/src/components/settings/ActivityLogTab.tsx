// Activity Log Tab Component
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  History,
  Search,
  Calendar as CalendarIcon,
  RefreshCw,
  User,
  FileText,
  Users,
  Briefcase,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  Loader2,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@/components/DataTable/types';

interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
  user_name?: string;
}

interface ActivityLogTabProps {
  isAdmin: boolean;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4 text-green-500" />,
  insert: <Plus className="h-4 w-4 text-green-500" />,
  update: <Pencil className="h-4 w-4 text-blue-500" />,
  delete: <Trash2 className="h-4 w-4 text-red-500" />,
  view: <Eye className="h-4 w-4 text-muted-foreground" />,
  login: <LogIn className="h-4 w-4 text-secondary" />,
  logout: <LogOut className="h-4 w-4 text-muted-foreground" />,
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  clients: <Users className="h-4 w-4" />,
  projects: <Briefcase className="h-4 w-4" />,
  time_entries: <Clock className="h-4 w-4" />,
  profiles: <User className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
};

const ACTION_LABELS: Record<string, string> = {
  create: 'יצירה',
  insert: 'הוספה',
  update: 'עדכון',
  delete: 'מחיקה',
  view: 'צפייה',
  login: 'התחברות',
  logout: 'התנתקות',
};

const ENTITY_LABELS: Record<string, string> = {
  clients: 'לקוחות',
  projects: 'פרויקטים',
  time_entries: 'רישומי זמן',
  profiles: 'פרופילים',
  user: 'משתמש',
};

export function ActivityLogTab({ isAdmin }: ActivityLogTabProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  // Fetch activity logs
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('activity_log')
        .select('*')
        .gte('created_at', startOfDay(dateRange.from).toISOString())
        .lte('created_at', endOfDay(dateRange.to).toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (selectedAction !== 'all') {
        query = query.eq('action', selectedAction);
      }

      if (selectedEntity !== 'all') {
        query = query.eq('entity_type', selectedEntity);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user profiles for display names
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name');

      if (error) throw error;

      const profileMap: Record<string, string> = {};
      data?.forEach(p => {
        profileMap[p.id] = p.full_name;
      });
      setProfiles(profileMap);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [dateRange, selectedAction, selectedEntity]);

  // Enrich logs with user names
  const enrichedLogs = useMemo(() => {
    return logs.map(log => ({
      ...log,
      user_name: log.user_id ? profiles[log.user_id] || 'משתמש לא ידוע' : 'מערכת',
    }));
  }, [logs, profiles]);

  // Filter by search
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return enrichedLogs;
    
    const term = searchTerm.toLowerCase();
    return enrichedLogs.filter(log =>
      log.user_name?.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.entity_type.toLowerCase().includes(term) ||
      JSON.stringify(log.details).toLowerCase().includes(term)
    );
  }, [enrichedLogs, searchTerm]);

  // Columns for DataTable
  const columns: ColumnDef<ActivityLogEntry>[] = [
    {
      id: 'created_at',
      header: 'תאריך ושעה',
      accessorKey: 'created_at',
      cell: (value) => (
        <div className="text-sm">
          <div>{format(new Date(value), 'dd/MM/yyyy', { locale: he })}</div>
          <div className="text-muted-foreground text-xs">
            {format(new Date(value), 'HH:mm:ss')}
          </div>
        </div>
      ),
    },
    {
      id: 'user_name',
      header: 'משתמש',
      accessorKey: 'user_name',
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
      cell: (value) => (
        <div className="flex items-center gap-2">
          {ACTION_ICONS[value] || <FileText className="h-4 w-4" />}
          <Badge variant={
            value === 'delete' ? 'destructive' :
            value === 'create' || value === 'insert' ? 'default' :
            'secondary'
          }>
            {ACTION_LABELS[value] || value}
          </Badge>
        </div>
      ),
    },
    {
      id: 'entity_type',
      header: 'ישות',
      accessorKey: 'entity_type',
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
        
        const details = typeof value === 'string' ? JSON.parse(value) : value;
        const summary = Object.entries(details)
          .slice(0, 2)
          .map(([key, val]) => `${key}: ${String(val).substring(0, 20)}`)
          .join(', ');
        
        return (
          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
            {summary || '-'}
          </span>
        );
      },
    },
    {
      id: 'ip_address',
      header: 'כתובת IP',
      accessorKey: 'ip_address',
      cell: (value) => (
        <span className="text-sm text-muted-foreground font-mono" dir="ltr">
          {value || '-'}
        </span>
      ),
    },
  ];

  // Unique actions and entities for filters
  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(l => l.action));
    return Array.from(actions);
  }, [logs]);

  const uniqueEntities = useMemo(() => {
    const entities = new Set(logs.map(l => l.entity_type));
    return Array.from(entities);
  }, [logs]);

  return (
    <Card dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-secondary" />
              יומן פעילות
            </CardTitle>
            <CardDescription>
              צפייה בכל הפעולות שבוצעו במערכת
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="mr-2">רענן</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">סינון:</span>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9"
            />
          </div>

          {/* Action Filter */}
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="פעולה" />
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

          {/* Entity Filter */}
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="ישות" />
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

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px] justify-start">
                <CalendarIcon className="h-4 w-4 ml-2" />
                {format(dateRange.from, 'dd/MM', { locale: he })} - {format(dateRange.to, 'dd/MM', { locale: he })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                locale={he}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {(searchTerm || selectedAction !== 'all' || selectedEntity !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedAction('all');
                setSelectedEntity('all');
              }}
            >
              <X className="h-4 w-4 ml-1" />
              נקה סינון
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>סה"כ: {filteredLogs.length} רשומות</span>
          {selectedAction !== 'all' && (
            <Badge variant="secondary">{ACTION_LABELS[selectedAction] || selectedAction}</Badge>
          )}
          {selectedEntity !== 'all' && (
            <Badge variant="secondary">{ENTITY_LABELS[selectedEntity] || selectedEntity}</Badge>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredLogs}
          columns={columns}
          variant="navy"
          paginated
          pageSize={15}
          pageSizeOptions={[10, 15, 25, 50]}
          filterable={false}
          globalSearch={false}
          loading={isLoading}
          emptyMessage="לא נמצאו רשומות ביומן הפעילות"
        />
      </CardContent>
    </Card>
  );
}