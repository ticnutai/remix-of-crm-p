import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Clock,
  Calendar,
  GanttChartSquare,
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, differenceInMinutes, addMinutes, isSameDay } from 'date-fns';
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
}

interface TimelineViewProps {
  timeEntries: TimeEntry[];
  users: User[];
  clients: Client[];
  projects: Project[];
  selectedDate: Date;
}

// Colors
const COLORS = {
  navy: '#1e3a8a',
  gold: '#D5BC9E',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const USER_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function TimelineView({
  timeEntries,
  users,
  clients,
  projects,
  selectedDate,
}: TimelineViewProps) {
  // Hours of the day (6 AM to 10 PM)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  
  // Filter entries for selected date
  const dayEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      const entryDate = parseISO(entry.start_time);
      return isSameDay(entryDate, selectedDate);
    });
  }, [timeEntries, selectedDate]);

  // Group entries by user
  const entriesByUser = useMemo(() => {
    const grouped = new Map<string, TimeEntry[]>();
    
    dayEntries.forEach(entry => {
      const userId = entry.user_id;
      if (!grouped.has(userId)) {
        grouped.set(userId, []);
      }
      grouped.get(userId)!.push(entry);
    });
    
    return grouped;
  }, [dayEntries]);

  // Get client name
  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'לא משויך';
    return clients.find(c => c.id === clientId)?.name || 'לא ידוע';
  };

  // Get project name
  const getProjectName = (projectId: string | null) => {
    if (!projectId) return '';
    return projects.find(p => p.id === projectId)?.name || '';
  };

  // Calculate position and width for entry
  const getEntryStyle = (entry: TimeEntry) => {
    const startTime = parseISO(entry.start_time);
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const duration = (entry.duration_minutes || 0) / 60;
    
    // Position relative to 6 AM
    const left = ((startHour - 6) / 16) * 100;
    const width = (duration / 16) * 100;
    
    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  };

  // Get user color
  const getUserColor = (userId: string) => {
    const index = users.findIndex(u => u.id === userId);
    return USER_COLORS[index % USER_COLORS.length];
  };

  // Calculate total minutes for user
  const getUserTotalMinutes = (userId: string) => {
    return (entriesByUser.get(userId) || []).reduce((acc, e) => acc + (e.duration_minutes || 0), 0);
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const activeUsers = Array.from(entriesByUser.keys());

  return (
    <Card dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GanttChartSquare className="h-5 w-5" style={{ color: COLORS.gold }} />
            תצוגת ציר זמן
          </CardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">אין רישומי זמן ביום זה</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Time header */}
            <div className="flex">
              <div className="w-32 shrink-0" /> {/* Space for user names */}
              <div className="flex-1 flex">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="flex-1 text-center text-xs text-muted-foreground border-r border-dashed first:border-r-0"
                    style={{ minWidth: '40px' }}
                  >
                    {hour}:00
                  </div>
                ))}
              </div>
              <div className="w-20 shrink-0 text-center text-xs text-muted-foreground">
                סה"כ
              </div>
            </div>

            {/* Users and their entries */}
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {activeUsers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  const userEntries = entriesByUser.get(userId) || [];
                  const userColor = getUserColor(userId);
                  const totalMinutes = getUserTotalMinutes(userId);
                  
                  return (
                    <div key={userId} className="flex items-center gap-2 group">
                      {/* User info */}
                      <div className="w-32 shrink-0 flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                          style={{ backgroundColor: userColor }}
                        >
                          {user?.name.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium truncate">
                          {user?.name || 'לא ידוע'}
                        </span>
                      </div>
                      
                      {/* Timeline */}
                      <div className="flex-1 relative h-10 bg-muted/30 rounded-lg">
                        {/* Hour grid lines */}
                        {hours.map((_, i) => (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 border-r border-dashed border-muted"
                            style={{ left: `${(i / 16) * 100}%` }}
                          />
                        ))}
                        
                        {/* Entries */}
                        <TooltipProvider>
                          {userEntries.map(entry => {
                            const style = getEntryStyle(entry);
                            
                            return (
                              <Tooltip key={entry.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-90 transition-opacity"
                                    style={{
                                      ...style,
                                      backgroundColor: entry.is_billable ? userColor : `${userColor}60`,
                                      border: entry.is_billable ? 'none' : `2px dashed ${userColor}`,
                                    }}
                                  >
                                    <span className="text-white text-xs px-1 truncate block leading-8">
                                      {entry.description || getClientName(entry.client_id)}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs" dir="rtl">
                                  <div className="space-y-1">
                                    <div className="font-medium">{getClientName(entry.client_id)}</div>
                                    {getProjectName(entry.project_id) && (
                                      <div className="text-sm text-muted-foreground">
                                        {getProjectName(entry.project_id)}
                                      </div>
                                    )}
                                    {entry.description && (
                                      <div className="text-sm">{entry.description}</div>
                                    )}
                                    <div className="flex items-center justify-between text-sm pt-1 border-t">
                                      <span>{formatDuration(entry.duration_minutes || 0)}</span>
                                      <Badge variant={entry.is_billable ? 'default' : 'secondary'} className="text-xs">
                                        {entry.is_billable ? 'לחיוב' : 'לא לחיוב'}
                                      </Badge>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </TooltipProvider>
                      </div>
                      
                      {/* Total */}
                      <div className="w-20 shrink-0 text-center">
                        <Badge
                          variant="secondary"
                          className="font-mono"
                          style={{ 
                            backgroundColor: `${userColor}20`,
                            color: userColor,
                          }}
                        >
                          {formatDuration(totalMinutes)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Legend */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm text-muted-foreground">לחיוב</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-dashed border-blue-500 bg-blue-500/30" />
                <span className="text-sm text-muted-foreground">לא לחיוב</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TimelineView;
