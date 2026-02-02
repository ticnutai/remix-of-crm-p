import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  client_id?: string;
  location?: string;
  color: string;
  client?: { name: string };
}

const EVENT_TYPES = {
  meeting: { label: 'פגישה', color: '#667eea' },
  deadline: { label: 'דדליין', color: '#ef4444' },
  reminder: { label: 'תזכורת', color: '#f59e0b' },
  task: { label: 'משימה', color: '#10b981' },
  holiday: { label: 'חופשה', color: '#8b5cf6' },
  other: { label: 'אחר', color: '#6b7280' },
};

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

function useCalendarEvents(year: number, month: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  return useQuery({
    queryKey: ['calendar_events', year, month],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('calendar_events')
        .select(`*, client:clients(name)`)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time');
      if (error) throw error;
      return data as CalendarEvent[];
    }
  });
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [view, setView] = useState<'month' | 'week'>('month');
  
  const { clients } = useClients();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const { data: events = [], isLoading } = useCalendarEvents(year, month);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_time: '',
    end_time: '',
    all_day: false,
    client_id: '',
    location: '',
    color: '#667eea',
  });
  
  const createEvent = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await (supabase as any)
        .from('calendar_events')
        .insert({
          ...data,
          client_id: data.client_id || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast({ title: 'האירוע נוצר בהצלחה' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'שגיאה ביצירת האירוע', variant: 'destructive' });
    }
  });
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'meeting',
      start_time: '',
      end_time: '',
      all_day: false,
      client_id: '',
      location: '',
      color: '#667eea',
    });
  };
  
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  }, [year, month]);
  
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };
  
  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().slice(0, 16);
    setFormData({ ...formData, start_time: dateStr });
    setIsDialogOpen(true);
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            יומן
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[150px] text-center">
              {MONTHS_HE[month]} {year}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            היום
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                אירוע חדש
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-md">
              <DialogHeader>
                <DialogTitle>אירוע חדש</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                createEvent.mutate(formData);
              }} className="space-y-4">
                <Input
                  placeholder="כותרת האירוע"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                
                <Textarea
                  placeholder="תיאור"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={formData.event_type}
                    onValueChange={(v) => setFormData({ 
                      ...formData, 
                      event_type: v,
                      color: EVENT_TYPES[v as keyof typeof EVENT_TYPES]?.color || '#667eea'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="סוג אירוע" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={formData.client_id}
                    onValueChange={(v) => setFormData({ ...formData, client_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="לקוח" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ללא לקוח</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">התחלה</label>
                    <Input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">סיום</label>
                    <Input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
                
                <Input
                  placeholder="מיקום"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={createEvent.isPending}>
                    {createEvent.isPending ? 'שומר...' : 'צור אירוע'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ביטול
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-7 border-b">
            {DAYS_HE.map((day) => (
              <div key={day} className="p-3 text-center font-medium text-sm bg-muted/50">
                {day}
              </div>
            ))}
          </div>
          
          {/* Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dayEvents = getEventsForDate(date);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(date)}
                  className={`
                    min-h-[100px] p-2 border-b border-l cursor-pointer hover:bg-muted/50 transition-colors
                    ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''}
                    ${isToday(date) ? 'bg-primary/10' : ''}
                    ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isToday(date) ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''}
                  `}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded truncate"
                        style={{ backgroundColor: event.color + '20', color: event.color }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} נוספים
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CalendarView;
