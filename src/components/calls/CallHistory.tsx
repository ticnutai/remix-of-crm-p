import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Plus,
  Clock,
  Calendar,
  User,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface CallLog {
  id: string;
  client_id?: string;
  contact_name?: string;
  phone_number: string;
  call_type: 'incoming' | 'outgoing' | 'missed';
  call_status: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  recorded_by?: string;
  created_at: string;
  client?: { name: string };
}

const CALL_TYPES = {
  incoming: { label: 'נכנסת', icon: PhoneIncoming, color: 'text-green-600' },
  outgoing: { label: 'יוצאת', icon: PhoneOutgoing, color: 'text-blue-600' },
  missed: { label: 'לא נענתה', icon: PhoneMissed, color: 'text-red-600' },
};

function formatDuration(seconds?: number): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function useCallLogs() {
  return useQuery({
    queryKey: ['call_logs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('call_logs')
        .select(`*, client:clients(name)`)
        .order('started_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as CallLog[];
    }
  });
}

export function CallHistory() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  const { clients } = useClients();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: callLogs = [], isLoading } = useCallLogs();
  
  const [formData, setFormData] = useState({
    phone_number: '',
    contact_name: '',
    client_id: '',
    call_type: 'outgoing' as const,
    call_status: 'completed',
    started_at: new Date().toISOString().slice(0, 16),
    duration_seconds: 0,
    notes: '',
    follow_up_required: false,
    follow_up_date: '',
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await (supabase as any).from('call_logs').insert({
        ...data,
        client_id: data.client_id || null,
        follow_up_date: data.follow_up_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call_logs'] });
      toast({ title: 'השיחה נרשמה בהצלחה' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'שגיאה ברישום השיחה', variant: 'destructive' });
    }
  });
  
  const resetForm = () => {
    setFormData({
      phone_number: '',
      contact_name: '',
      client_id: '',
      call_type: 'outgoing',
      call_status: 'completed',
      started_at: new Date().toISOString().slice(0, 16),
      duration_seconds: 0,
      notes: '',
      follow_up_required: false,
      follow_up_date: '',
    });
  };
  
  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setFormData({
      ...formData,
      client_id: clientId,
      contact_name: client?.name || '',
      phone_number: client?.phone || formData.phone_number,
    });
  };
  
  const filteredLogs = callLogs.filter((log) => {
    const matchesSearch = 
      log.phone_number.includes(searchQuery) ||
      log.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || log.call_type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Phone className="h-6 w-6" />
          היסטוריית שיחות
        </h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              רשום שיחה
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>רישום שיחה חדשה</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }} className="space-y-4">
              <Select value={formData.client_id} onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר לקוח (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ללא לקוח</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="שם איש קשר"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
                <Input
                  placeholder="מספר טלפון"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={formData.call_type}
                  onValueChange={(v: any) => setFormData({ ...formData, call_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="סוג שיחה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">נכנסת</SelectItem>
                    <SelectItem value="outgoing">יוצאת</SelectItem>
                    <SelectItem value="missed">לא נענתה</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={formData.call_status}
                  onValueChange={(v) => setFormData({ ...formData, call_status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">הושלמה</SelectItem>
                    <SelectItem value="no_answer">אין מענה</SelectItem>
                    <SelectItem value="busy">תפוס</SelectItem>
                    <SelectItem value="voicemail">תא קולי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">תאריך ושעה</label>
                  <Input
                    type="datetime-local"
                    value={formData.started_at}
                    onChange={(e) => setFormData({ ...formData, started_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">משך (דקות)</label>
                  <Input
                    type="number"
                    min="0"
                    value={Math.floor(formData.duration_seconds / 60)}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      duration_seconds: parseInt(e.target.value) * 60 
                    })}
                  />
                </div>
              </div>
              
              <Textarea
                placeholder="הערות מהשיחה..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.follow_up_required}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      follow_up_required: e.target.checked 
                    })}
                  />
                  <span className="text-sm">נדרש מעקב</span>
                </label>
                {formData.follow_up_required && (
                  <Input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    className="w-40"
                  />
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'שומר...' : 'שמור'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="חיפוש לפי שם, טלפון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="סוג שיחה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="incoming">נכנסות</SelectItem>
            <SelectItem value="outgoing">יוצאות</SelectItem>
            <SelectItem value="missed">לא נענו</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Call List */}
      {isLoading ? (
        <div className="text-center py-8">טוען...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          אין שיחות להצגה
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const callType = CALL_TYPES[log.call_type];
            const CallIcon = callType.icon;
            
            return (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full bg-muted ${callType.color}`}>
                      <CallIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {log.contact_name || log.client?.name || 'לא ידוע'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {callType.label}
                        </Badge>
                        {log.follow_up_required && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 ml-1" />
                            נדרש מעקב
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span dir="ltr">{log.phone_number}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.started_at).toLocaleDateString('he-IL')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.started_at).toLocaleTimeString('he-IL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <span>{formatDuration(log.duration_seconds)}</span>
                      </div>
                      {log.notes && (
                        <p className="text-sm mt-2 text-muted-foreground flex items-start gap-1">
                          <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                          {log.notes}
                        </p>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`tel:${log.phone_number}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CallHistory;
