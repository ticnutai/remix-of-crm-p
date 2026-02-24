// Client Portal - Meetings & Appointments Page
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, CalendarDays, Clock, MapPin, Plus, Video, Phone, Users, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { format, isFuture, isPast, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import PortalNavigation from '@/components/client-portal/PortalNavigation';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  event_type: string | null;
  is_completed: boolean | null;
}

interface MeetingRequest {
  id: string;
  title: string;
  description: string | null;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  meeting_type: string;
  status: string;
  staff_response: string | null;
  created_at: string;
}

export default function ClientMeetings() {
  const { user, isClient, isLoading, clientId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [requests, setRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    preferred_date: '',
    preferred_time_slot: '',
    meeting_type: 'in_person'
  });

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
    else if (!isLoading && user && !isClient) navigate('/');
  }, [isLoading, user, isClient, navigate]);

  useEffect(() => {
    if (clientId) fetchData();
  }, [clientId]);

  const fetchData = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [eventsRes, requestsRes] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('id, title, description, start_time, end_time, location, event_type, is_completed')
          .eq('client_id', clientId)
          .order('start_time', { ascending: true }),
        supabase
          .from('client_meeting_requests')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
      ]);

      setEvents(eventsRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!clientId || !user || !newRequest.title.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('client_meeting_requests').insert({
        client_id: clientId,
        requested_by: user.id,
        title: newRequest.title,
        description: newRequest.description || null,
        preferred_date: newRequest.preferred_date ? new Date(newRequest.preferred_date).toISOString() : null,
        preferred_time_slot: newRequest.preferred_time_slot || null,
        meeting_type: newRequest.meeting_type,
        status: 'pending'
      });

      if (error) throw error;

      toast({ title: 'בקשת הפגישה נשלחה', description: 'הצוות יחזור אליך בהקדם' });
      setShowNewRequest(false);
      setNewRequest({ title: '', description: '', preferred_date: '', preferred_time_slot: '', meeting_type: 'in_person' });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לשלוח את הבקשה', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const upcomingEvents = events.filter(e => isFuture(new Date(e.start_time)) || isToday(new Date(e.start_time)));
  const pastEvents = events.filter(e => isPast(new Date(e.start_time)) && !isToday(new Date(e.start_time)));

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'ממתין לאישור', variant: 'outline' },
      approved: { label: 'אושר', variant: 'default' },
      declined: { label: 'נדחה', variant: 'destructive' },
      completed: { label: 'הושלם', variant: 'secondary' },
    };
    const config = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'שיחת וידאו';
      case 'phone': return 'שיחת טלפון';
      default: return 'פגישה פרונטלית';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-semibold">פגישות ותיאומים</h1>
          <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 ml-1" />
                בקש פגישה
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>בקשת פגישה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">נושא הפגישה *</label>
                  <Input
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="למשל: דיון בהתקדמות הפרויקט"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">פירוט</label>
                  <Textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="פרטים נוספים..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">תאריך מועדף</label>
                    <Input
                      type="date"
                      value={newRequest.preferred_date}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, preferred_date: e.target.value }))}
                      className="mt-1"
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">שעה מועדפת</label>
                    <Select
                      value={newRequest.preferred_time_slot}
                      onValueChange={(v) => setNewRequest(prev => ({ ...prev, preferred_time_slot: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="בחר שעה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">בוקר (08:00-12:00)</SelectItem>
                        <SelectItem value="afternoon">צהריים (12:00-16:00)</SelectItem>
                        <SelectItem value="evening">אחה"צ (16:00-20:00)</SelectItem>
                        <SelectItem value="flexible">גמיש</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">סוג פגישה</label>
                  <Select
                    value={newRequest.meeting_type}
                    onValueChange={(v) => setNewRequest(prev => ({ ...prev, meeting_type: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">
                        <span className="flex items-center gap-2"><Users className="h-4 w-4" /> פגישה פרונטלית</span>
                      </SelectItem>
                      <SelectItem value="video">
                        <span className="flex items-center gap-2"><Video className="h-4 w-4" /> שיחת וידאו</span>
                      </SelectItem>
                      <SelectItem value="phone">
                        <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> שיחת טלפון</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex-row-reverse gap-2">
                <Button onClick={handleSubmitRequest} disabled={submitting || !newRequest.title.trim()}>
                  {submitting && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
                  שלח בקשה
                </Button>
                <Button variant="outline" onClick={() => setShowNewRequest(false)}>ביטול</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{upcomingEvents.length}</p>
              <p className="text-xs text-muted-foreground">פגישות קרובות</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{requests.filter(r => r.status === 'pending').length}</p>
              <p className="text-xs text-muted-foreground">ממתינות לאישור</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{pastEvents.length}</p>
              <p className="text-xs text-muted-foreground">פגישות שהיו</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              פגישות קרובות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">אין פגישות מתוכננות</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {format(new Date(event.start_time), 'EEEE, dd/MM/yyyy', { locale: he })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(event.start_time), 'HH:mm', { locale: he })}
                            {event.end_time && ` - ${format(new Date(event.end_time), 'HH:mm', { locale: he })}`}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {isToday(new Date(event.start_time)) && (
                        <Badge variant="default" className="text-xs shrink-0">היום</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting Requests */}
        {requests.length > 0 && (
          <Card>
            <CardHeader className="text-right pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                בקשות פגישה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.map(req => (
                  <div key={req.id} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{req.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {getMeetingTypeIcon(req.meeting_type)}
                          <span>{getMeetingTypeLabel(req.meeting_type)}</span>
                          {req.preferred_date && (
                            <>
                              <span>•</span>
                              <span>{format(new Date(req.preferred_date), 'dd/MM/yyyy', { locale: he })}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                    {req.description && (
                      <p className="text-xs text-muted-foreground mb-2">{req.description}</p>
                    )}
                    {req.staff_response && (
                      <div className="p-2 rounded bg-muted/50 text-xs">
                        <span className="font-medium">תגובת הצוות:</span> {req.staff_response}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">
                      נשלח {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <Card>
            <CardHeader className="text-right pb-2">
              <CardTitle className="text-base text-muted-foreground">היסטוריית פגישות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pastEvents.slice(0, 10).map(event => (
                  <div key={event.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                    <div>
                      <p className="font-medium text-xs">{event.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(event.start_time), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </p>
                    </div>
                    {event.is_completed ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <PortalNavigation />
    </div>
  );
}
