// Client Portal - Settings/Profile Page (Enhanced)
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Phone, Lock, LogOut, Shield, CheckCircle, Sun, Moon, Monitor, Bell, BellOff, Save, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import PortalNavigation from '@/components/client-portal/PortalNavigation';

export default function ClientSettings() {
  const { user, profile, isClient, isLoading, signOut, updatePassword, updateProfile } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification preferences (local storage for now)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageSound, setMessageSound] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Load notification prefs from localStorage
  useEffect(() => {
    const prefs = localStorage.getItem('portal-notification-prefs');
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        setEmailNotifications(parsed.email ?? true);
        setPushNotifications(parsed.push ?? true);
        setMessageSound(parsed.sound ?? true);
      } catch { /* ignore */ }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({ title: 'שם מלא הוא שדה חובה', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      if (error) throw error;
      toast({ title: 'הפרופיל עודכן בהצלחה' });
      setEditingProfile(false);
    } catch {
      toast({ title: 'שגיאה בעדכון הפרופיל', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'הסיסמה חייבת להכיל לפחות 6 תווים', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'הסיסמאות לא תואמות', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      toast({ title: 'הסיסמה עודכנה בהצלחה' });
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast({ title: 'שגיאה בעדכון הסיסמה', variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotificationPrefs = (key: string, value: boolean) => {
    const newPrefs = {
      email: key === 'email' ? value : emailNotifications,
      push: key === 'push' ? value : pushNotifications,
      sound: key === 'sound' ? value : messageSound,
    };
    localStorage.setItem('portal-notification-prefs', JSON.stringify(newPrefs));
    if (key === 'email') setEmailNotifications(value);
    if (key === 'push') setPushNotifications(value);
    if (key === 'sound') setMessageSound(value);
    toast({ title: 'העדפות ההתראות עודכנו' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">הגדרות</h1>
        </div>
      </header>

      <main className="container px-4 py-4 space-y-4">
        {/* Profile Info & Edit */}
        <Card>
          <CardHeader className="text-right pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                פרטים אישיים
              </CardTitle>
              {!editingProfile && (
                <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
                  <Pencil className="h-4 w-4 ml-1" />
                  עריכה
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!editingProfile ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground font-bold text-lg">
                      {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{profile?.full_name || 'משתמש'}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{user?.email}</span>
                    </p>
                    {profile?.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {profile.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>חשבון מאובטח</span>
                  <CheckCircle className="h-3.5 w-3.5 text-primary mr-auto" />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">שם מלא</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="השם המלא שלך"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">טלפון</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="מספר טלפון"
                    className="mt-1"
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-1"
                  >
                    {savingProfile ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                    שמור
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingProfile(false);
                      setFullName(profile?.full_name || '');
                      setPhone(profile?.phone || '');
                    }}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme / Appearance */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {resolvedTheme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              מראה
            </CardTitle>
            <CardDescription className="text-xs">בחר את ערכת הנושא המועדפת עליך</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light' as const, label: 'בהיר', icon: <Sun className="h-4 w-4" /> },
                { value: 'dark' as const, label: 'כהה', icon: <Moon className="h-4 w-4" /> },
                { value: 'system' as const, label: 'מערכת', icon: <Monitor className="h-4 w-4" /> },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setTheme(option.value)}
                >
                  {option.icon}
                  <span className="text-xs">{option.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              העדפות התראות
            </CardTitle>
            <CardDescription className="text-xs">התאם אישית את ההתראות שלך</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email-notif" className="text-sm">התראות אימייל</Label>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={(v) => handleSaveNotificationPrefs('email', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {pushNotifications ? <Bell className="h-4 w-4 text-muted-foreground" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                <Label htmlFor="push-notif" className="text-sm">התראות דחיפה</Label>
              </div>
              <Switch
                id="push-notif"
                checked={pushNotifications}
                onCheckedChange={(v) => handleSaveNotificationPrefs('push', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="msg-sound" className="text-sm">צליל הודעות</Label>
              </div>
              <Switch
                id="msg-sound"
                checked={messageSound}
                onCheckedChange={(v) => handleSaveNotificationPrefs('sound', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              שינוי סיסמה
            </CardTitle>
            <CardDescription className="text-xs">עדכן את סיסמת הכניסה שלך</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">סיסמה חדשה</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="סיסמה חדשה (מינימום 6 תווים)"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">אימות סיסמה</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="הקלד שוב את הסיסמה"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {changingPassword && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
              עדכן סיסמה
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="p-4">
            <Button variant="destructive" onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 ml-2" />
              התנתק
            </Button>
          </CardContent>
        </Card>
      </main>

      <PortalNavigation />
    </div>
  );
}
