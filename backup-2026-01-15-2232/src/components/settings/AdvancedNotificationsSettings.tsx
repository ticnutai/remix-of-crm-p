// Advanced Notifications Settings Component
import { useState, useEffect } from 'react';
import { Bell, Mail, Phone, MessageCircle, Clock, Volume2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { UserPreferences } from '@/hooks/useUserPreferences';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface AdvancedNotificationsSettingsProps {
  preferences: UserPreferences;
  onSave: (prefs: Partial<UserPreferences>) => Promise<void>;
  saving: boolean;
}

export function AdvancedNotificationsSettings({ preferences, onSave, saving }: AdvancedNotificationsSettingsProps) {
  // Local state for contact details to prevent re-render on every keystroke
  const [email, setEmail] = useState(preferences.notification_email || '');
  const [phone, setPhone] = useState(preferences.notification_phone || '');
  const [whatsapp, setWhatsapp] = useState(preferences.notification_whatsapp || '');

  // Update local state when preferences change externally
  useEffect(() => {
    setEmail(preferences.notification_email || '');
    setPhone(preferences.notification_phone || '');
    setWhatsapp(preferences.notification_whatsapp || '');
  }, [preferences.notification_email, preferences.notification_phone, preferences.notification_whatsapp]);

  const updateChannel = (key: keyof typeof preferences.channels, value: boolean) => {
    onSave({
      channels: { ...preferences.channels, [key]: value }
    });
  };

  const updateNotificationType = (key: keyof typeof preferences.notification_types, value: boolean) => {
    onSave({
      notification_types: { ...preferences.notification_types, [key]: value }
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Contact Details */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-primary" />
            פרטי התקשרות להתראות
          </CardTitle>
          <CardDescription>
            הזן את הפרטים שבהם תרצה לקבל התראות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                מייל
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => onSave({ notification_email: email || null })}
                placeholder="email@example.com"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                SMS
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => onSave({ notification_phone: phone || null })}
                placeholder="050-0000000"
                disabled={saving}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                onBlur={() => onSave({ notification_whatsapp: whatsapp || null })}
                placeholder="050-0000000"
                disabled={saving}
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5 text-primary" />
            ערוצי התראות
          </CardTitle>
          <CardDescription>
            בחר באילו ערוצים תרצה לקבל התראות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">דפדפן (Push)</p>
                  <p className="text-sm text-muted-foreground">התראות בזמן אמת בדפדפן</p>
                </div>
              </div>
              <Switch
                checked={preferences.channels.browser}
                onCheckedChange={(checked) => updateChannel('browser', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">מייל</p>
                  <p className="text-sm text-muted-foreground">התראות לכתובת המייל</p>
                </div>
              </div>
              <Switch
                checked={preferences.channels.email}
                onCheckedChange={(checked) => updateChannel('email', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-muted-foreground">הודעות טקסט לנייד</p>
                </div>
              </div>
              <Switch
                checked={preferences.channels.sms}
                onCheckedChange={(checked) => updateChannel('sms', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">הודעות ל-WhatsApp</p>
                </div>
              </div>
              <Switch
                checked={preferences.channels.whatsapp}
                onCheckedChange={(checked) => updateChannel('whatsapp', checked)}
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Frequency */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">תדירות תזכורות</CardTitle>
          <CardDescription>
            כמה פעמים לשלוח תזכורת לפני שמוותרים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={preferences.reminder_frequency}
            onValueChange={(value) => value && onSave({ reminder_frequency: value as 'once' | '3times' | '5times' })}
            className="justify-start"
          >
            <ToggleGroupItem value="once" className="px-6">פעם אחת</ToggleGroupItem>
            <ToggleGroupItem value="3times" className="px-6">3 פעמים</ToggleGroupItem>
            <ToggleGroupItem value="5times" className="px-6">5 פעמים</ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            שעות שקט
          </CardTitle>
          <CardDescription>
            לא יישלחו התראות בין השעות שהגדרת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>משעה</Label>
              <Input
                type="time"
                value={preferences.quiet_hours_start || '22:00'}
                onChange={(e) => onSave({ quiet_hours_start: e.target.value })}
                disabled={saving}
                className="w-32"
              />
            </div>
            <div className="pt-6">עד</div>
            <div className="space-y-2">
              <Label>שעה</Label>
              <Input
                type="time"
                value={preferences.quiet_hours_end || '07:00'}
                onChange={(e) => onSave({ quiet_hours_end: e.target.value })}
                disabled={saving}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">סוגי התראות</CardTitle>
          <CardDescription>
            בחר אילו התראות לקבל
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Finance */}
          <div>
            <h4 className="font-semibold mb-3 text-primary">💰 חשבוניות ופיננסים</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>חשבונית באיחור</span>
                <Switch
                  checked={preferences.notification_types.invoice_overdue}
                  onCheckedChange={(checked) => updateNotificationType('invoice_overdue', checked)}
                  disabled={saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>תשלום התקבל</span>
                <Switch
                  checked={preferences.notification_types.payment_received}
                  onCheckedChange={(checked) => updateNotificationType('payment_received', checked)}
                  disabled={saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>סיכום חודשי</span>
                <Switch
                  checked={preferences.notification_types.monthly_summary}
                  onCheckedChange={(checked) => updateNotificationType('monthly_summary', checked)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Projects */}
          <div>
            <h4 className="font-semibold mb-3 text-primary">📋 פרויקטים ומשימות</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>דד-ליין מתקרב</span>
                <Switch
                  checked={preferences.notification_types.deadline_approaching}
                  onCheckedChange={(checked) => updateNotificationType('deadline_approaching', checked)}
                  disabled={saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>עדכון סטטוס פרויקט</span>
                <Switch
                  checked={preferences.notification_types.status_update}
                  onCheckedChange={(checked) => updateNotificationType('status_update', checked)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Clients */}
          <div>
            <h4 className="font-semibold mb-3 text-primary">👥 לקוחות</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>הודעה חדשה מלקוח</span>
                <Switch
                  checked={preferences.notification_types.new_message}
                  onCheckedChange={(checked) => updateNotificationType('new_message', checked)}
                  disabled={saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>קובץ הועלה</span>
                <Switch
                  checked={preferences.notification_types.file_uploaded}
                  onCheckedChange={(checked) => updateNotificationType('file_uploaded', checked)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* System */}
          <div>
            <h4 className="font-semibold mb-3 text-primary">⚙️ מערכת</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>עדכוני מערכת</span>
                <Switch
                  checked={preferences.notification_types.system_updates}
                  onCheckedChange={(checked) => updateNotificationType('system_updates', checked)}
                  disabled={saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>סיכום שבועי</span>
                <Switch
                  checked={preferences.notification_types.weekly_summary}
                  onCheckedChange={(checked) => updateNotificationType('weekly_summary', checked)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button disabled={saving} className="gap-2">
          <Bell className="h-4 w-4" />
          {saving ? 'שומר...' : 'ההגדרות נשמרות אוטומטית'}
        </Button>
      </div>
    </div>
  );
}
