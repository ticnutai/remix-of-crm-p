// Inactive Clients Alert System - tenarch CRM Pro
// מערכת התראות על לקוחות ללא פעילות

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserX,
  Clock,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Bell,
  RefreshCw,
  MessageSquare,
  FileText,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Types
export interface InactiveClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  lastActivity?: Date;
  lastActivityType?: string;
  daysSinceActivity: number;
  totalRevenue?: number;
  openTasks?: number;
  status?: string;
}

export interface InactiveClientsConfig {
  daysThreshold: number;
  enableEmailAlerts?: boolean;
  enablePushAlerts?: boolean;
  excludeStatuses?: string[];
}

// Hook to get inactive clients
export function useInactiveClients(config: InactiveClientsConfig = { daysThreshold: 30 }) {
  const [clients, setClients] = useState<InactiveClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInactiveClients = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - config.daysThreshold);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) throw clientsError;

      // Fetch recent activities (time entries, tasks, etc.)
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('client_id, start_time')
        .order('start_time', { ascending: false });

      if (timeError) throw timeError;

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('client_id, created_at, updated_at');

      if (tasksError) throw tasksError;

      // Calculate last activity for each client
      const clientActivity = new Map<string, Date>();

      // Process time entries
      for (const entry of timeEntries || []) {
        if (entry.client_id) {
          const currentLast = clientActivity.get(entry.client_id);
          const entryDate = new Date(entry.start_time);
          if (!currentLast || entryDate > currentLast) {
            clientActivity.set(entry.client_id, entryDate);
          }
        }
      }

      // Process tasks
      for (const task of tasks || []) {
        if (task.client_id) {
          const currentLast = clientActivity.get(task.client_id);
          const taskDate = new Date(task.updated_at || task.created_at);
          if (!currentLast || taskDate > currentLast) {
            clientActivity.set(task.client_id, taskDate);
          }
        }
      }

      // Filter inactive clients
      const inactiveClients: InactiveClient[] = [];

      for (const client of clientsData || []) {
        // Skip if client status is in excluded list
        if (config.excludeStatuses?.includes(client.status)) continue;

        const lastActivity = clientActivity.get(client.id);
        const daysSinceActivity = lastActivity 
          ? differenceInDays(new Date(), lastActivity)
          : differenceInDays(new Date(), new Date(client.created_at));

        if (daysSinceActivity >= config.daysThreshold) {
          inactiveClients.push({
            id: client.id,
            name: client.name || 'ללא שם',
            email: client.email,
            phone: client.phone,
            company: client.company,
            lastActivity: lastActivity || new Date(client.created_at),
            lastActivityType: lastActivity ? 'פעילות' : 'יצירה',
            daysSinceActivity,
            status: client.status,
          });
        }
      }

      // Sort by days since activity (most inactive first)
      inactiveClients.sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);

      setClients(inactiveClients);
    } catch (err) {
      console.error('Error fetching inactive clients:', err);
      setError('שגיאה בטעינת לקוחות לא פעילים');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInactiveClients();
  }, [config.daysThreshold]);

  return {
    clients,
    isLoading,
    error,
    refresh: fetchInactiveClients,
    count: clients.length,
  };
}

// Main Inactive Clients Alert Component
interface InactiveClientsAlertProps {
  className?: string;
  showFullList?: boolean;
  maxItems?: number;
  daysThreshold?: number;
}

export function InactiveClientsAlert({
  className,
  showFullList = false,
  maxItems = 5,
  daysThreshold = 30,
}: InactiveClientsAlertProps) {
  const [selectedThreshold, setSelectedThreshold] = useState(daysThreshold.toString());
  const [selectedClient, setSelectedClient] = useState<InactiveClient | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  const { clients, isLoading, error, refresh, count } = useInactiveClients({
    daysThreshold: parseInt(selectedThreshold),
  });

  const navigate = useNavigate();

  const displayedClients = showFullList ? clients : clients.slice(0, maxItems);

  const getUrgencyLevel = (days: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (days >= 90) return 'critical';
    if (days >= 60) return 'high';
    if (days >= 45) return 'medium';
    return 'low';
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/10 text-red-700 border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-700 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30';
      default: return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
    }
  };

  const getUrgencyBadge = (level: string) => {
    const labels = {
      critical: 'קריטי',
      high: 'גבוה',
      medium: 'בינוני',
      low: 'נמוך',
    };
    return labels[level as keyof typeof labels] || 'לא ידוע';
  };

  const handleClientAction = (client: InactiveClient, action: string) => {
    switch (action) {
      case 'view':
        navigate(`/client-profile/${client.id}`);
        break;
      case 'call':
        if (client.phone) {
          window.open(`tel:${client.phone}`, '_self');
        }
        break;
      case 'email':
        if (client.email) {
          window.open(`mailto:${client.email}`, '_self');
        }
        break;
      case 'task':
        navigate(`/tasks/new?client_id=${client.id}`);
        break;
    }
    setActionDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)} dir="rtl">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("w-full", className)} dir="rtl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-full">
              <UserX className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">לקוחות ללא פעילות</CardTitle>
              <CardDescription>
                {count} לקוחות ללא פעילות מעל {selectedThreshold} יום
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedThreshold} onValueChange={setSelectedThreshold}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">14 יום</SelectItem>
                <SelectItem value="30">30 יום</SelectItem>
                <SelectItem value="60">60 יום</SelectItem>
                <SelectItem value="90">90 יום</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-500">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="text-lg font-medium">מצוין!</p>
              <p>אין לקוחות ללא פעילות מעל {selectedThreshold} יום</p>
            </div>
          ) : (
            <ScrollArea className={showFullList ? "h-96" : "h-auto"}>
              <div className="space-y-3">
                {displayedClients.map((client) => {
                  const urgency = getUrgencyLevel(client.daysSinceActivity);
                  
                  return (
                    <div
                      key={client.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                        getUrgencyColor(urgency)
                      )}
                      onClick={() => {
                        setSelectedClient(client);
                        setActionDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {client.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            {client.company && (
                              <p className="text-sm opacity-75">{client.company}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge variant="outline" className={getUrgencyColor(urgency)}>
                            {getUrgencyBadge(urgency)}
                          </Badge>
                          <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {client.daysSinceActivity} ימים
                          </p>
                        </div>
                      </div>
                      
                      {client.lastActivity && (
                        <p className="text-xs mt-2 opacity-60">
                          פעילות אחרונה: {formatDistanceToNow(client.lastActivity, { 
                            addSuffix: true, 
                            locale: he 
                          })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {!showFullList && clients.length > maxItems && (
            <Button 
              variant="ghost" 
              className="w-full mt-4"
              onClick={() => navigate('/clients?filter=inactive')}
            >
              הצג את כל {count} הלקוחות
              <ExternalLink className="h-4 w-4 mr-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>פעולות ללקוח: {selectedClient?.name}</DialogTitle>
            <DialogDescription>
              לקוח ללא פעילות {selectedClient?.daysSinceActivity} ימים
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleClientAction(selectedClient!, 'view')}
            >
              <ExternalLink className="h-4 w-4" />
              צפה בכרטיס
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleClientAction(selectedClient!, 'call')}
              disabled={!selectedClient?.phone}
            >
              <Phone className="h-4 w-4" />
              התקשר
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleClientAction(selectedClient!, 'email')}
              disabled={!selectedClient?.email}
            >
              <Mail className="h-4 w-4" />
              שלח מייל
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleClientAction(selectedClient!, 'task')}
            >
              <FileText className="h-4 w-4" />
              צור משימה
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionDialogOpen(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Dashboard Widget for Inactive Clients
export function InactiveClientsWidget({ className }: { className?: string }) {
  const { count, clients } = useInactiveClients({ daysThreshold: 30 });

  if (count === 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg",
      className
    )} dir="rtl">
      <Bell className="h-5 w-5 text-orange-600" />
      <div className="flex-1">
        <p className="font-medium text-orange-800">
          {count} לקוחות ללא פעילות
        </p>
        <p className="text-sm text-orange-600">
          מומלץ ליצור קשר עם לקוחות אלו
        </p>
      </div>
      <Button size="sm" variant="outline" className="border-orange-500/50 text-orange-700">
        צפה
      </Button>
    </div>
  );
}

export default InactiveClientsAlert;
