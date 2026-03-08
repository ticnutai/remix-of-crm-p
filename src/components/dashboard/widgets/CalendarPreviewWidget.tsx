// Widget: Calendar Preview - תצוגה מקדימה של יומן
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, MapPin, Users, ExternalLink, Video } from 'lucide-react';
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: string;
  meeting_url?: string;
  client_id?: string;
  client?: { name: string };
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: 'bg-blue-500',
  deadline: 'bg-red-500',
  reminder: 'bg-yellow-500',
  task: 'bg-green-500',
  holiday: 'bg-purple-500',
  other: 'bg-gray-500',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: 'פגישה',
  deadline: 'דדליין',
  reminder: 'תזכורת',
  task: 'משימה',
  holiday: 'חג',
  other: 'אחר',
};

export function CalendarPreviewWidget() {
  const navigate = useNavigate();
  const today = new Date();
  const endDate = addDays(today, 7);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['upcoming_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          id,
          title,
          start_time,
          end_time,
          event_type,
          location,
          meeting_url,
          client_id,
          clients:client_id(name)
        `)
        .gte('start_time', startOfDay(today).toISOString())
        .lte('start_time', endOfDay(endDate).toISOString())
        .order('start_time', { ascending: true })
        .limit(10);
      
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        client: e.clients,
      })) as CalendarEvent[];
    }
  });

  const formatEventDate = (date: Date) => {
    if (isToday(date)) return 'היום';
    if (isTomorrow(date)) return 'מחר';
    return format(date, 'EEEE, d בMMMM', { locale: he });
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm');
  };

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = startOfDay(new Date(event.start_time)).toISOString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);

  const todayEvents = events.filter(e => isToday(new Date(e.start_time)));

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          יומן קרוב
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
          צפה בכל
          <ExternalLink className="h-3 w-3 mr-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Today Summary */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <span className="text-sm font-medium">היום</span>
          <Badge variant={todayEvents.length > 0 ? 'default' : 'secondary'}>
            {todayEvents.length} אירועים
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-4">טוען...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            אין אירועים ב-7 הימים הקרובים
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-4">
              {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                <div key={date}>
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    {formatEventDate(new Date(date))}
                  </div>
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/calendar?event=${event.id}`)}
                      >
                        <div className={`w-1 h-full min-h-[40px] rounded-full ${EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.other}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {event.title}
                            </span>
                            {event.meeting_url && (
                              <Video className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(event.start_time)}
                              {event.end_time && ` - ${formatTime(event.end_time)}`}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                          {event.client?.name && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Users className="h-3 w-3" />
                              {event.client.name}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarPreviewWidget;
