// Google Calendar Settings Component
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Link2,
  Link2Off,
  ExternalLink,
  Settings,
  Upload,
} from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function GoogleCalendarSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    isConnected,
    isLoading,
    config,
    connect,
    disconnect,
    saveConfig,
    fetchEvents,
    syncMeetingsToGoogle,
  } = useGoogleCalendar();

  const [calendarId, setCalendarId] = useState('primary');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [meetingsCount, setMeetingsCount] = useState<number | null>(null);

  useEffect(() => {
    if (config?.calendarId) {
      setCalendarId(config.calendarId);
    }
  }, [config]);

  // Fetch meetings count when connected
  useEffect(() => {
    const fetchMeetingsCount = async () => {
      if (!user) return;
      const { count } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);
      setMeetingsCount(count || 0);
    };
    fetchMeetingsCount();
  }, [user]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      toast({
        title: 'שגיאה בהתחברות',
        description: 'לא ניתן להתחבר ל-Google Calendar',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: 'התנתקת',
      description: 'החיבור ל-Google Calendar הופסק',
    });
  };

  const handleSaveCalendarId = () => {
    if (config) {
      saveConfig({
        ...config,
        calendarId,
      });
      toast({
        title: 'הגדרות נשמרו',
        description: 'מזהה היומן עודכן',
      });
    }
  };

  const handleTestConnection = async () => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר תחילה',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await fetchEvents(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      toast({
        title: 'החיבור תקין',
        description: `נמצאו ${result.length} אירועים בשבוע הקרוב`,
      });
    } catch (error) {
      toast({
        title: 'שגיאה בבדיקת החיבור',
        description: 'לא ניתן לטעון אירועים',
        variant: 'destructive',
      });
    }
  };

  const handleSyncMeetings = async () => {
    if (!isConnected) {
      toast({
        title: 'לא מחובר',
        description: 'יש להתחבר ל-Google Calendar תחילה',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'שגיאה',
        description: 'יש להתחבר למערכת',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      // Fetch meetings from the database that are in the future
      const now = new Date().toISOString();
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('created_by', user.id)
        .gte('start_time', now)
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }

      if (!meetings || meetings.length === 0) {
        toast({
          title: 'אין פגישות לסנכרון',
          description: 'לא נמצאו פגישות עתידיות במערכת',
        });
        return;
      }

      const syncedCount = await syncMeetingsToGoogle(meetings);
      
      if (syncedCount > 0) {
        toast({
          title: 'הסנכרון הושלם',
          description: `${syncedCount} פגישות סונכרנו ל-Google Calendar`,
        });
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'שגיאה בסנכרון',
        description: error.message || 'לא ניתן לסנכרן את הפגישות',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-border-gold/30" dir="rtl">
      <CardHeader className="text-right">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Calendar className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Google Calendar</CardTitle>
              <CardDescription>סנכרון פגישות ואירועים עם יומן Google</CardDescription>
            </div>
          </div>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={isConnected ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {isConnected ? (
              <>
                <CheckCircle className="h-3 w-3 ml-1" />
                מחובר
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 ml-1" />
                לא מחובר
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isConnected ? (
            <>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 ml-2" />
                )}
                בדוק חיבור
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1"
              >
                <Link2Off className="h-4 w-4 ml-2" />
                התנתק
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 ml-2" />
              )}
              התחבר ל-Google Calendar
            </Button>
          )}
        </div>

        {/* Connection Info */}
        {isConnected && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">החיבור פעיל</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              הפגישות שלך יסונכרנו אוטומטית עם יומן Google
            </p>
          </div>
        )}

        {/* Sync Meetings Section */}
        {isConnected && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">סנכרון פגישות</h3>
                  <p className="text-sm text-muted-foreground">
                    העלה את כל הפגישות העתידיות מהמערכת ל-Google Calendar
                  </p>
                  {meetingsCount !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      סה"כ {meetingsCount} פגישות במערכת
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleSyncMeetings}
                disabled={isSyncing || isLoading}
                className="w-full sm:w-auto"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 ml-2" />
                )}
                {isSyncing ? 'מסנכרן פגישות...' : 'סנכרן פגישות ל-Google Calendar'}
              </Button>
            </div>
          </>
        )}

        <Separator />

        {/* Advanced Settings Toggle */}
        <Button
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            הגדרות מתקדמות
          </span>
          <span>{showAdvanced ? '▲' : '▼'}</span>
        </Button>

        {showAdvanced && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="calendarId">מזהה יומן</Label>
              <div className="flex gap-2">
                <Input
                  id="calendarId"
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  placeholder="primary"
                  className="flex-1"
                />
                <Button onClick={handleSaveCalendarId} size="sm">
                  שמור
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                השאר "primary" לשימוש ביומן הראשי שלך, או הזן מזהה יומן ספציפי
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>הגדרת Redirect URIs ב-Google Cloud</Label>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>כדי שהחיבור יעבוד, יש להוסיף את הכתובות הבאות ב-Google Cloud Console:</p>
                <div className="p-3 rounded bg-background border font-mono text-xs break-all">
                  {window.location.origin}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
              >
                <ExternalLink className="h-4 w-4 ml-2" />
                פתח Google Cloud Console
              </Button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">מה אפשר לעשות עם Google Calendar?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>לסנכרן את הפגישות מה-CRM ליומן Google</li>
            <li>לראות אירועים מ-Google Calendar ביומן שלך</li>
            <li>ליצור פגישות חדשות ישירות ב-Google Calendar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
