// Client Portal - Settings/Profile Page
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Mail, Phone, Lock, LogOut, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PortalNavigation from '@/components/client-portal/PortalNavigation';

export default function ClientSettings() {
  const { user, profile, isClient, isLoading, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        {/* Profile Info */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              פרטים אישיים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{profile?.full_name || 'משתמש'}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>חשבון מאובטח</span>
              <CheckCircle className="h-3.5 w-3.5 text-primary mr-auto" />
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
