// Google Calendar Settings Dialog
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeftRight, ArrowRight, Clock, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface GoogleCalendarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync?: () => void;
}

interface Settings {
  sync_direction: 'one_way' | 'two_way';
  auto_sync_enabled: boolean;
  auto_sync_interval: number;
}

const defaultSettings: Settings = {
  sync_direction: 'one_way',
  auto_sync_enabled: false,
  auto_sync_interval: 30,
};

export const GoogleCalendarSettingsDialog: React.FC<GoogleCalendarSettingsDialogProps> = ({
  open,
  onOpenChange,
  onSync,
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !open) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('google_calendar_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings({
            sync_direction: data.sync_direction as 'one_way' | 'two_way',
            auto_sync_enabled: data.auto_sync_enabled ?? false,
            auto_sync_interval: data.auto_sync_interval ?? 30,
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, open]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('google_calendar_settings')
        .upsert({
          user_id: user.id,
          sync_direction: settings.sync_direction,
          auto_sync_enabled: settings.auto_sync_enabled,
          auto_sync_interval: settings.auto_sync_interval,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'הגדרות נשמרו',
        description: 'הגדרות הסנכרון עודכנו בהצלחה',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את ההגדרות',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 justify-start">
            <RefreshCw className="h-5 w-5" />
            הגדרות Google Calendar
          </DialogTitle>
          <DialogDescription className="text-right">
            הגדר את אופן הסנכרון בין המערכת ליומן Google
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Sync Direction */}
            <div className="space-y-3">
              <Label className="text-base font-medium">כיוון סנכרון</Label>
              <RadioGroup
                value={settings.sync_direction}
                onValueChange={(value: 'one_way' | 'two_way') => 
                  setSettings(s => ({ ...s, sync_direction: value }))
                }
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <RadioGroupItem value="one_way" id="one_way" />
                  <Label htmlFor="one_way" className="flex items-center gap-2 cursor-pointer">
                    <ArrowRight className="h-4 w-4" />
                    <div>
                      <p className="font-medium">חד-צדדי</p>
                      <p className="text-xs text-muted-foreground">
                        פגישות מהמערכת ל-Google בלבד
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <RadioGroupItem value="two_way" id="two_way" />
                  <Label htmlFor="two_way" className="flex items-center gap-2 cursor-pointer">
                    <ArrowLeftRight className="h-4 w-4" />
                    <div>
                      <p className="font-medium">דו-צדדי</p>
                      <p className="text-xs text-muted-foreground">
                        סנכרון בשני הכיוונים - המערכת ⟷ Google
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Auto Sync */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">סנכרון אוטומטי</Label>
                  <p className="text-xs text-muted-foreground">
                    סנכרן את היומן באופן אוטומטי
                  </p>
                </div>
                <Switch
                  checked={settings.auto_sync_enabled}
                  onCheckedChange={(checked) => 
                    setSettings(s => ({ ...s, auto_sync_enabled: checked }))
                  }
                />
              </div>

              {settings.auto_sync_enabled && (
                <div className="space-y-2">
                  <Label className="text-sm text-right">תדירות סנכרון</Label>
                  <Select
                    value={settings.auto_sync_interval.toString()}
                    onValueChange={(value) => 
                      setSettings(s => ({ ...s, auto_sync_interval: parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="5">כל 5 דקות</SelectItem>
                      <SelectItem value="15">כל 15 דקות</SelectItem>
                      <SelectItem value="30">כל 30 דקות</SelectItem>
                      <SelectItem value="60">כל שעה</SelectItem>
                      <SelectItem value="120">כל שעתיים</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Manual Sync */}
            {onSync && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">סנכרון ידני</Label>
                  <p className="text-xs text-muted-foreground">
                    סנכרן עכשיו את כל הפגישות
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={onSync}>
                  <RefreshCw className="h-4 w-4 ml-2" />
                  סנכרן עכשיו
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            שמור הגדרות
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
