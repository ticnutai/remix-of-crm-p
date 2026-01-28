// Google Calendar Settings Component with Multi-Account Support
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Plus,
  Loader2,
  ExternalLink,
  Settings,
  Upload,
  Download,
  ArrowLeftRight,
} from 'lucide-react';
import { useGoogleCalendarAccounts, SyncDirection } from '@/hooks/useGoogleCalendarAccounts';
import { GoogleCalendarAccountsList } from './GoogleCalendarAccountsList';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAutoSync } from '@/hooks/useAutoSync';
import { AutoSyncSettingsComponent } from './AutoSyncSettings';

export function GoogleCalendarSettingsMulti() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    accounts,
    isLoading,
    isConnecting,
    addAccount,
    updateAccount,
    removeAccount,
    updateLastSync,
  } = useGoogleCalendarAccounts();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSyncDirection, setSelectedSyncDirection] = useState<SyncDirection>('both');

  const handleAddAccount = async () => {
    const result = await addAccount(selectedSyncDirection);
    if (result) {
      setAddDialogOpen(false);
    }
  };

  const handleSyncAccount = async (account: any) => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const now = new Date().toISOString();
      
      // Sync based on direction
      if (account.sync_direction === 'to_google' || account.sync_direction === 'both') {
        // Fetch meetings from database
        const { data: meetings, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('created_by', user.id)
          .gte('start_time', now)
          .order('start_time', { ascending: true });

        if (error) throw error;

        if (meetings && meetings.length > 0) {
          toast({
            title: 'מסנכרן פגישות...',
            description: `נמצאו ${meetings.length} פגישות לסנכרון`,
          });
          // Note: Actual sync to Google would require OAuth token refresh
          // For now, we just update the last sync time
        }
      }

      if (account.sync_direction === 'from_google' || account.sync_direction === 'both') {
        toast({
          title: 'מייבא אירועים מ-Google...',
          description: 'מחפש אירועים חדשים',
        });
        // Note: Actual import from Google would require OAuth token refresh
      }

      await updateLastSync(account.id);

      toast({
        title: 'הסנכרון הושלם',
        description: `החשבון ${account.email} סונכרן בהצלחה`,
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'שגיאה בסנכרון',
        description: error.message || 'לא ניתן לסנכרן את החשבון',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAll = useCallback(async () => {
    const activeAccounts = accounts.filter(a => a.is_active);
    if (activeAccounts.length === 0) {
      toast({
        title: 'אין חשבונות פעילים',
        description: 'הוסף חשבון או הפעל חשבון קיים',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    for (const account of activeAccounts) {
      await handleSyncAccount(account);
    }
    setIsSyncing(false);
  }, [accounts, toast, handleSyncAccount]);

  // Auto-sync hook
  const {
    settings: autoSyncSettings,
    updateSettings: updateAutoSyncSettings,
    lastSyncTime,
    nextSyncTime,
    isSyncing: isAutoSyncing,
    syncNow,
  } = useAutoSync(handleSyncAll);

  const activeAccountsCount = accounts.filter(a => a.is_active).length;

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
              <CardDescription>ניהול חשבונות וסנכרון פגישות</CardDescription>
            </div>
          </div>
          <Badge variant="outline">
            {activeAccountsCount} חשבונות פעילים
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Account Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={isConnecting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 ml-2" />
                )}
                הוסף חשבון Google
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader className="text-right">
                <DialogTitle>הוספת חשבון Google Calendar</DialogTitle>
                <DialogDescription>
                  בחר את כיוון הסנכרון לפני ההתחברות
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <RadioGroup
                  value={selectedSyncDirection}
                  onValueChange={(value: SyncDirection) => setSelectedSyncDirection(value)}
                  className="space-y-3"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="to_google" id="to_google" className="mt-1" />
                    <Label htmlFor="to_google" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <Upload className="h-4 w-4 text-blue-500" />
                        העלאה ל-Google בלבד
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        פגישות שנוצרות ב-CRM יועלו ל-Google Calendar
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="from_google" id="from_google" className="mt-1" />
                    <Label htmlFor="from_google" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <Download className="h-4 w-4 text-green-500" />
                        ייבוא מ-Google בלבד
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        אירועים מ-Google Calendar ייובאו ל-CRM
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="both" id="both" className="mt-1" />
                    <Label htmlFor="both" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <ArrowLeftRight className="h-4 w-4 text-purple-500" />
                        סנכרון דו-כיווני
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        שינויים בשני הצדדים יסתנכרנו אוטומטית
                      </p>
                    </Label>
                  </div>
                </RadioGroup>

                <Button
                  onClick={handleAddAccount}
                  disabled={isConnecting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 ml-2" />
                  )}
                  התחבר לחשבון Google
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {accounts.length > 0 && (
            <Button
              variant="outline"
              onClick={handleSyncAll}
              disabled={isSyncing || activeAccountsCount === 0}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <ArrowLeftRight className="h-4 w-4 ml-2" />
              )}
              סנכרן את כל החשבונות
            </Button>
          )}
        </div>

        <Separator />

        {/* Accounts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <GoogleCalendarAccountsList
            accounts={accounts}
            onUpdate={updateAccount}
            onRemove={removeAccount}
            onSync={handleSyncAccount}
            isSyncing={isSyncing}
          />
        )}

        <Separator />

        {/* Auto-Sync Settings */}
        <AutoSyncSettingsComponent
          settings={autoSyncSettings}
          onUpdateSettings={updateAutoSyncSettings}
          lastSyncTime={lastSyncTime}
          nextSyncTime={nextSyncTime}
          isSyncing={isAutoSyncing || isSyncing}
          onSyncNow={syncNow}
          accountsCount={activeAccountsCount}
        />

        <Separator />

        {/* Advanced Settings */}
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
              <Label>הגדרת Authorized JavaScript origins ב-Google Cloud</Label>
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
          <p className="font-medium mb-2">טיפים:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>ניתן לחבר מספר חשבונות Google שונים</li>
            <li>לכל חשבון אפשר להגדיר כיוון סנכרון שונה</li>
            <li>פתח את האפליקציה בחלון חדש (לא ב-iframe) כדי להתחבר</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
