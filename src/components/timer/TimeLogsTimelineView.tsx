// Time Logs Timeline View Component
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  user_id?: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  client_id?: string | null;
  project_id?: string | null;
  description?: string | null;
  is_billable?: boolean | null;
}

interface Client {
  id: string;
  name: string;
}

interface UserInfo {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

interface TimeLogsTimelineViewProps {
  timeEntries: TimeEntry[];
  clients: Client[];
  users?: UserInfo[];
  getClientName: (clientId: string | null) => string;
  onEntryClick?: (entry: TimeEntry) => void;
}

export function TimeLogsTimelineView({
  timeEntries,
  clients,
  users = [],
  getClientName,
  onEntryClick,
}: TimeLogsTimelineViewProps) {
  // Get user info helper
  const getUserInfo = (userId: string | undefined) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };
  // Group entries by day
  const entriesByDay = useMemo(() => {
    const grouped = new Map<string, TimeEntry[]>();
    
    // Sort by start time descending
    const sorted = [...timeEntries].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

    sorted.forEach(entry => {
      const day = format(new Date(entry.start_time), 'yyyy-MM-dd');
      if (!grouped.has(day)) {
        grouped.set(day, []);
      }
      grouped.get(day)!.push(entry);
    });

    return Array.from(grouped.entries()).map(([day, entries]) => ({
      date: parseISO(day),
      entries,
      totalMinutes: entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0),
    }));
  }, [timeEntries]);

  // Smart time formatting
  const formatDuration = (minutes: number | null) => {
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

  return (
    <Card className="border-border bg-card" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          ציר זמן
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="relative pr-8">
            {/* Timeline line */}
            <div className="absolute right-3 top-0 bottom-0 w-px bg-border" />

            {entriesByDay.map(({ date, entries, totalMinutes }) => (
              <div key={date.toISOString()} className="mb-6">
                {/* Day header */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Timeline dot */}
                  <div className="absolute right-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  
                  <div className="flex-1 flex items-center justify-between">
                    <h3 className="font-medium">
                      {isSameDay(date, new Date()) 
                        ? 'היום' 
                        : format(date, 'EEEE, d MMMM', { locale: he })}
                    </h3>
                    <Badge variant="outline">
                      {formatDuration(totalMinutes)}
                    </Badge>
                  </div>
                </div>

                {/* Day entries */}
                <div className="space-y-2 mr-6">
                  {entries.map(entry => (
                    <div
                      key={entry.id}
                      onClick={() => onEntryClick?.(entry)}
                      className={cn(
                        "p-3 rounded-lg border bg-card/50 cursor-pointer hover:bg-accent/50 transition-colors",
                        entry.is_billable && "border-l-4 border-l-primary"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{getClientName(entry.client_id)}</span>
                            {/* User display */}
                            {(() => {
                              const userInfo = getUserInfo(entry.user_id);
                              if (!userInfo) return null;
                              return (
                                <span className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                  {userInfo.avatar_url ? (
                                    <img src={userInfo.avatar_url} alt="" className="h-3 w-3 rounded-full" />
                                  ) : (
                                    <span className="h-3 w-3 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px] font-bold">
                                      {userInfo.name.charAt(0)}
                                    </span>
                                  )}
                                  {userInfo.name}
                                </span>
                              );
                            })()}
                          </div>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {entry.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {format(parseISO(entry.start_time), 'H:mm')}
                            {entry.end_time && (
                              <span className="text-muted-foreground">
                                {' - '}
                                {format(parseISO(entry.end_time), 'H:mm')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDuration(entry.duration_minutes)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {entriesByDay.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                אין רישומי זמן להצגה
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default TimeLogsTimelineView;
