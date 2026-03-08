import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Mail, 
  Monitor,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FinancialAlert, formatCurrency } from '@/hooks/useFinanceCalculations';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface AlertsSettingsProps {
  invoices: { id: string; invoice_number: string; amount: number; status: string; due_date: string | null }[];
}

export default function AlertsSettings({ invoices }: AlertsSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    overdueEnabled: true,
    reminderEnabled: true,
    summaryEnabled: true,
    channel: 'browser' as 'browser' | 'email' | 'both',
  });

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('triggered_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts((data as FinancialAlert[]) || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('financial_alerts')
        .update({ status: 'dismissed' })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (error: any) {
      toast({ title: 'שגיאה בביטול התראה', description: error.message, variant: 'destructive' });
    }
  };

  const generateOverdueAlerts = async () => {
    if (!user) return;

    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    
    for (const invoice of overdueInvoices) {
      // Check if alert already exists
      const existingAlert = alerts.find(a => 
        a.invoice_id === invoice.id && 
        a.type === 'overdue_invoice' && 
        a.status !== 'dismissed'
      );

      if (!existingAlert) {
        await supabase.from('financial_alerts').insert({
          user_id: user.id,
          type: 'overdue_invoice',
          invoice_id: invoice.id,
          message: `חשבונית #${invoice.invoice_number} בסך ${formatCurrency(invoice.amount)} באיחור`,
          channel: settings.channel,
          status: 'pending',
        });
      }
    }

    toast({ title: 'התראות נוצרו בהצלחה' });
    fetchAlerts();
  };

  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue_invoice':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'collection_reminder':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'monthly_summary':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'overdue_invoice':
        return 'חשבונית באיחור';
      case 'collection_reminder':
        return 'תזכורת גבייה';
      case 'monthly_summary':
        return 'סיכום חודשי';
      case 'budget_exceeded':
        return 'חריגת תקציב';
      default:
        return type;
    }
  };

  return (
    <Card className="border-2 border-orange-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              התראות פיננסיות
            </CardTitle>
            <CardDescription>הגדרות התראות ורשימת התראות פעילות</CardDescription>
          </div>
          {pendingAlerts.length > 0 && (
            <Badge variant="destructive">
              {pendingAlerts.length} התראות ממתינות
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Settings */}
        <div className="p-4 bg-accent/30 rounded-lg space-y-4">
          <h4 className="font-medium text-sm">הגדרות התראות</h4>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <Label>התראות על חשבוניות באיחור</Label>
              </div>
              <Switch 
                checked={settings.overdueEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, overdueEnabled: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <Label>תזכורות גבייה</Label>
              </div>
              <Switch 
                checked={settings.reminderEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, reminderEnabled: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Label>סיכום חודשי</Label>
              </div>
              <Switch 
                checked={settings.summaryEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, summaryEnabled: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.channel === 'email' ? (
                  <Mail className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                <Label>ערוץ התראות</Label>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={settings.channel === 'browser' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setSettings(prev => ({ ...prev, channel: 'browser' }))}
                >
                  <Monitor className="h-3 w-3" />
                </Button>
                <Button
                  variant={settings.channel === 'email' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setSettings(prev => ({ ...prev, channel: 'email' }))}
                >
                  <Mail className="h-3 w-3" />
                </Button>
                <Button
                  variant={settings.channel === 'both' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setSettings(prev => ({ ...prev, channel: 'both' }))}
                >
                  שניהם
                </Button>
              </div>
            </div>
          </div>

          {overdueCount > 0 && settings.overdueEnabled && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateOverdueAlerts}
              className="w-full mt-2"
            >
              <AlertCircle className="h-4 w-4 ml-2 text-red-500" />
              צור התראות ל-{overdueCount} חשבוניות באיחור
            </Button>
          )}
        </div>

        {/* Alerts list */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            התראות אחרונות
          </h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>אין התראות</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`flex items-start justify-between p-3 border rounded-lg ${
                      alert.status === 'dismissed' ? 'opacity-50 bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getAlertTypeLabel(alert.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(alert.triggered_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </span>
                        </div>
                        {alert.message && (
                          <p className="text-sm">{alert.message}</p>
                        )}
                      </div>
                    </div>
                    {alert.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
