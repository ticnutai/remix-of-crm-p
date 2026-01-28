// Time Logs Additional Views Components
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Kanban, Users, FileText, List, User, DollarSign, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Smart time formatting utility
const formatDuration = (minutes: number) => {
  if (!minutes || minutes === 0) return '0 דק\'';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  // Under 1 hour: show minutes only
  if (hours === 0) return `${mins} דק'`;
  // Full hours: show H:00
  if (mins === 0) return `${hours}:00`;
  // Hours + minutes: show H:MM
  return `${hours}:${mins.toString().padStart(2, '0')}`;
};

interface TimeEntry {
  id: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  client_id?: string | null;
  project_id?: string | null;
  description?: string | null;
  is_billable?: boolean | null;
  hourly_rate?: number | null;
  user_id?: string;
}

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

// Kanban View - by status/week
interface TimeLogsKanbanViewProps {
  timeEntries: TimeEntry[];
  clients: Client[];
  getClientName: (clientId: string | null) => string;
  onEntryClick?: (entry: TimeEntry) => void;
}

export function TimeLogsKanbanView({
  timeEntries,
  clients,
  getClientName,
  onEntryClick,
}: TimeLogsKanbanViewProps) {
  const today = new Date();
  
  const { thisWeek, lastWeek, older } = useMemo(() => {
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const lastWeekStart = startOfWeek(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
    const lastWeekEnd = endOfWeek(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });

    const thisWeekEntries: TimeEntry[] = [];
    const lastWeekEntries: TimeEntry[] = [];
    const olderEntries: TimeEntry[] = [];

    timeEntries.forEach(entry => {
      const date = new Date(entry.start_time);
      if (isWithinInterval(date, { start: thisWeekStart, end: thisWeekEnd })) {
        thisWeekEntries.push(entry);
      } else if (isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd })) {
        lastWeekEntries.push(entry);
      } else {
        olderEntries.push(entry);
      }
    });

    return { thisWeek: thisWeekEntries, lastWeek: lastWeekEntries, older: olderEntries };
  }, [timeEntries]);

  const KanbanColumn = ({ title, entries, color }: { title: string; entries: TimeEntry[]; color: string }) => {
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    
    return (
      <div className="flex-1 min-w-[280px]">
        <div className={cn("p-3 rounded-t-lg", color)}>
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">{title}</h3>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {entries.length} רשומות | {formatDuration(totalMinutes)}
            </Badge>
          </div>
        </div>
        <ScrollArea className="h-[500px] border border-t-0 rounded-b-lg p-2">
          <div className="space-y-2">
            {entries.map(entry => (
              <Card
                key={entry.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onEntryClick?.(entry)}
              >
                <CardContent className="p-3">
                  <div className="font-medium text-sm">{getClientName(entry.client_id)}</div>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {entry.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{format(new Date(entry.start_time), 'dd/MM HH:mm')}</span>
                    <span>{formatDuration(entry.duration_minutes || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <Card className="border-border bg-card" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Kanban className="h-5 w-5" />
          תצוגת קנבן
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto">
          <KanbanColumn title="השבוע" entries={thisWeek} color="bg-primary" />
          <KanbanColumn title="שבוע שעבר" entries={lastWeek} color="bg-primary/70" />
          <KanbanColumn title="קודם" entries={older} color="bg-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// Grouped View - by client or project
interface TimeLogsGroupedViewProps {
  timeEntries: TimeEntry[];
  clients: Client[];
  projects?: Project[];
  getClientName: (clientId: string | null) => string;
  groupBy?: 'client' | 'project';
}

export function TimeLogsGroupedView({
  timeEntries,
  clients,
  projects = [],
  getClientName,
  groupBy = 'client',
}: TimeLogsGroupedViewProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; entries: TimeEntry[]; totalMinutes: number }>();
    
    timeEntries.forEach(entry => {
      const key = groupBy === 'client' ? entry.client_id : entry.project_id;
      const id = key || 'unassigned';
      
      if (!map.has(id)) {
        let name = 'לא משויך';
        if (groupBy === 'client' && key) {
          name = getClientName(key);
        } else if (groupBy === 'project' && key) {
          name = projects.find(p => p.id === key)?.name || 'פרויקט לא ידוע';
        }
        map.set(id, { name, entries: [], totalMinutes: 0 });
      }
      
      const group = map.get(id)!;
      group.entries.push(entry);
      group.totalMinutes += entry.duration_minutes || 0;
    });

    return Array.from(map.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [timeEntries, clients, projects, groupBy, getClientName]);

  const totalMinutes = grouped.reduce((sum, g) => sum + g.totalMinutes, 0);

  return (
    <Card className="border-border bg-card" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          מקובץ לפי {groupBy === 'client' ? 'לקוח' : 'פרויקט'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {grouped.map(group => {
            const percentage = totalMinutes > 0 ? (group.totalMinutes / totalMinutes) * 100 : 0;
            const hours = group.totalMinutes / 60;
            
            return (
              <div key={group.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="outline">{group.entries.length} רשומות</Badge>
                  </div>
                  <span className="text-sm font-medium">{hours.toFixed(1)} שעות</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}

          {grouped.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              אין רישומים להצגה
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Invoice View - for billing
interface TimeLogsInvoiceViewProps {
  timeEntries: TimeEntry[];
  clients: Client[];
  getClientName: (clientId: string | null) => string;
}

export function TimeLogsInvoiceView({
  timeEntries,
  clients,
  getClientName,
}: TimeLogsInvoiceViewProps) {
  const billableData = useMemo(() => {
    const byClient = new Map<string, { entries: TimeEntry[]; totalMinutes: number; totalAmount: number }>();
    
    timeEntries.filter(e => e.is_billable).forEach(entry => {
      const clientId = entry.client_id || 'unassigned';
      
      if (!byClient.has(clientId)) {
        byClient.set(clientId, { entries: [], totalMinutes: 0, totalAmount: 0 });
      }
      
      const data = byClient.get(clientId)!;
      data.entries.push(entry);
      data.totalMinutes += entry.duration_minutes || 0;
      data.totalAmount += ((entry.duration_minutes || 0) / 60) * (entry.hourly_rate || 0);
    });

    return Array.from(byClient.entries()).map(([clientId, data]) => ({
      clientId,
      clientName: getClientName(clientId === 'unassigned' ? null : clientId),
      ...data,
    }));
  }, [timeEntries, getClientName]);

  const totals = useMemo(() => ({
    minutes: billableData.reduce((sum, d) => sum + d.totalMinutes, 0),
    amount: billableData.reduce((sum, d) => sum + d.totalAmount, 0),
  }), [billableData]);

  return (
    <Card className="border-border bg-card" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          סיכום לחיוב
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right">רשומות</TableHead>
              <TableHead className="text-right">שעות</TableHead>
              <TableHead className="text-right">סכום</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billableData.map(data => (
              <TableRow key={data.clientId}>
                <TableCell className="font-medium">{data.clientName}</TableCell>
                <TableCell>{data.entries.length}</TableCell>
                <TableCell>{(data.totalMinutes / 60).toFixed(1)}</TableCell>
                <TableCell>₪{data.totalAmount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {billableData.length > 0 && (
              <>
                <TableRow>
                  <TableCell colSpan={4}>
                    <Separator />
                  </TableCell>
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell>סה״כ</TableCell>
                  <TableCell>{billableData.reduce((s, d) => s + d.entries.length, 0)}</TableCell>
                  <TableCell>{(totals.minutes / 60).toFixed(1)}</TableCell>
                  <TableCell>₪{totals.amount.toLocaleString()}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>

        {billableData.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            אין רשומות לחיוב
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact View - minimal list
interface TimeLogsCompactViewProps {
  timeEntries: TimeEntry[];
  getClientName: (clientId: string | null) => string;
  onEntryClick?: (entry: TimeEntry) => void;
}

export function TimeLogsCompactView({
  timeEntries,
  getClientName,
  onEntryClick,
}: TimeLogsCompactViewProps) {
  return (
    <Card className="border-border bg-card" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <List className="h-5 w-5" />
          תצוגה מצומצמת
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="divide-y">
            {timeEntries.map(entry => (
              <div
                key={entry.id}
                onClick={() => onEntryClick?.(entry)}
                className="flex items-center justify-between p-3 hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{getClientName(entry.client_id)}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(entry.start_time), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.is_billable && (
                    <DollarSign className="h-4 w-4 text-primary" />
                  )}
                  <Badge variant="secondary">
                    {formatDuration(entry.duration_minutes || 0)}
                  </Badge>
                </div>
              </div>
            ))}

            {timeEntries.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                אין רישומים להצגה
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
