// Settings Page - tenarch CRM Pro
import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  User,
  Calendar,
  Palette,
  Shield,
  Bell,
  Save,
  Moon,
  Sun,
  Monitor,
  Loader2,
  Check,
  UserCog,
  Crown,
  Users,
  History,
  Calculator,
  Key,
  Lock,
  Unlock,
  Type,
  Trash2,
  Code2,
  Contact,
  Mail,
  BellRing,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityLogTab } from '@/components/settings/ActivityLogTab';
import { ApiKeysManager } from '@/components/settings/ApiKeysManager';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { AdvancedThemeSettings } from '@/components/settings/AdvancedThemeSettings';
import { TypographySettings } from '@/components/settings/TypographySettings';
import { AdvancedNotificationsSettings } from '@/components/settings/AdvancedNotificationsSettings';
import { GoogleCalendarSettingsMulti } from '@/components/settings/GoogleCalendarSettingsMulti';
import { GoogleContactsSettings } from '@/components/settings/GoogleContactsSettings';
import { DataCleanupTab } from '@/components/settings/DataCleanupTab';
import { DeveloperSettings } from '@/components/settings/DeveloperSettings';
import { EmailTemplateManager } from '@/components/settings/EmailTemplateManager';
import { RateLimitMonitor } from '@/components/settings/RateLimitMonitor';
import { EmailSignatureManager } from '@/components/settings/EmailSignatureManager';
import { usePushNotifications } from '@/lib/push-notifications';
import { SignaturePad, SignatureDisplay, useSignature } from '@/components/signature';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
}

// Push Notifications Settings Component
function PushNotificationsSettings() {
  const { user } = useAuth();
  const { 
    isSupported, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications(user?.id);
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
        setIsSubscribed(false);
        toast({ title: 'התראות Push כובו' });
      } else {
        const result = await subscribe();
        if (result) {
          setIsSubscribed(true);
          toast({ title: 'התראות Push הופעלו בהצלחה' });
        }
      }
    } catch (error) {
      toast({ 
        title: 'שגיאה', 
        description: 'לא הצלחנו לעדכן את הגדרות ההתראות',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card dir="rtl">
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            התראות Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            הדפדפן שלך לא תומך בהתראות Push
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          התראות Push
        </CardTitle>
        <CardDescription>
          קבל התראות בזמן אמת גם כשהאפליקציה סגורה
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>הפעל התראות Push</Label>
            <p className="text-sm text-muted-foreground">
              קבל התראות על משימות, תזכורות ופעילות לקוחות
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>
        
        {isSubscribed && (
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-green-700 dark:text-green-300 text-sm">
            <Check className="inline h-4 w-4 ml-1" />
            התראות Push מופעלות - תקבל התראות גם כשהדפדפן סגור
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user, profile, roles, isAdmin, updateProfile, updatePassword } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { preferences, loading: prefsLoading, saving, savePreferences, resetToDefaults } = useUserPreferences();
  const { toast } = useToast();
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Admin password reset state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserWithRole | null>(null);
  const [adminResetPassword, setAdminResetPassword] = useState('');
  const [adminResetPasswordConfirm, setAdminResetPasswordConfirm] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // VAT settings state
  const [vatRate, setVatRate] = useState('18');
  const [isSavingVat, setIsSavingVat] = useState(false);
  
  // Users & Roles state
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // API Keys access state
  const [showApiKeysCodeInput, setShowApiKeysCodeInput] = useState(false);
  const [apiKeysCode, setApiKeysCode] = useState('');
  const [isApiKeysUnlocked, setIsApiKeysUnlocked] = useState(false);
  const [codeError, setCodeError] = useState('');
  
  const API_ACCESS_CODE = '543211';

  const getTabFromUrl = () => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab || 'profile';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);

  useEffect(() => {
    const onPopState = () => setActiveTab(getTabFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setDepartment(profile.department || '');
      setPosition(profile.position || '');
      setHourlyRate(profile.hourly_rate?.toString() || '');
    }
  }, [profile]);

  // Fetch VAT settings
  useEffect(() => {
    const fetchVatSettings = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('app_settings')
        .select('vat_rate')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setVatRate(data.vat_rate?.toString() || '18');
      }
    };
    fetchVatSettings();
  }, [user]);

  // Fetch users for admin
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name');

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map(p => {
        const roleEntry = userRoles?.find(r => r.user_id === p.id);
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          role: (roleEntry?.role as 'admin' | 'manager' | 'employee') || 'employee',
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: fullName,
        phone,
        department,
        position,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      });

      if (error) throw error;

      toast({
        title: 'הפרופיל עודכן',
        description: 'הפרטים נשמרו בהצלחה',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את הפרופיל',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword.length < 6) {
      toast({
        title: 'סיסמה קצרה מדי',
        description: 'סיסמה חייבת להכיל לפחות 6 תווים',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'הסיסמאות אינן תואמות',
        description: 'ודא/י שהזנת את אותה הסיסמה פעמיים',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    setIsChangingPassword(false);

    if (error) {
      const msg = error.message || 'שגיאה לא ידועה';
      let description = msg;
      if (msg.includes('requires recent login')) {
        description = 'מטעמי אבטחה צריך להתחבר מחדש ואז לנסות שוב.';
      }
      toast({
        title: 'שגיאה בעדכון סיסמה',
        description,
        variant: 'destructive',
      });
      return;
    }

    setNewPassword('');
    setConfirmNewPassword('');
    toast({
      title: 'הסיסמה עודכנה',
      description: 'החלפת הסיסמה בוצעה בהצלחה',
    });
  };

  const handleSaveVatSettings = async () => {
    if (!user) return;
    setIsSavingVat(true);
    try {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('app_settings')
          .update({ vat_rate: parseFloat(vatRate) || 18 })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('app_settings')
          .insert({ user_id: user.id, vat_rate: parseFloat(vatRate) || 18 });
      }

      toast({
        title: 'הגדרות מע"מ נשמרו',
        description: `שיעור המע"מ עודכן ל-${vatRate}%`,
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את הגדרות המע"מ',
        variant: 'destructive',
      });
    } finally {
      setIsSavingVat(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'manager' | 'employee') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: 'התפקיד עודכן',
        description: `התפקיד שונה ל-${newRole === 'admin' ? 'מנהל ראשי' : newRole === 'manager' ? 'מנהל' : 'עובד'}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את התפקיד',
        variant: 'destructive',
      });
    }
  };

  const handleOpenResetPasswordDialog = (userToReset: UserWithRole) => {
    setSelectedUserForReset(userToReset);
    setAdminResetPassword('');
    setAdminResetPasswordConfirm('');
    setResetPasswordDialogOpen(true);
  };

  const handleAdminResetPassword = async () => {
    if (!selectedUserForReset) return;

    if (adminResetPassword.length < 6) {
      toast({
        title: 'סיסמה קצרה מדי',
        description: 'סיסמה חייבת להכיל לפחות 6 תווים',
        variant: 'destructive',
      });
      return;
    }

    if (adminResetPassword !== adminResetPasswordConfirm) {
      toast({
        title: 'הסיסמאות אינן תואמות',
        description: 'ודא/י שהזנת את אותה הסיסמה פעמיים',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      // Call Supabase Admin API to update user password
      // Note: This requires a server-side function with service role key
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: selectedUserForReset.id,
          newPassword: adminResetPassword,
        },
      });

      if (error) throw error;

      toast({
        title: 'הסיסמה אופסה',
        description: `הסיסמה של ${selectedUserForReset.full_name} עודכנה בהצלחה`,
      });

      setResetPasswordDialogOpen(false);
      setSelectedUserForReset(null);
      setAdminResetPassword('');
      setAdminResetPasswordConfirm('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'שגיאה באיפוס סיסמה',
        description: 'לא ניתן לאפס את הסיסמה. ודא שקיימת Edge Function בשם admin-reset-password',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'מנהל ראשי';
      case 'manager': return 'מנהל';
      case 'employee': return 'עובד';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleApiKeysCodeSubmit = () => {
    if (apiKeysCode === API_ACCESS_CODE) {
      setIsApiKeysUnlocked(true);
      setCodeError('');
      setShowApiKeysCodeInput(false);
      toast({
        title: 'נפתחה גישה',
        description: 'כעת תוכל לנהל את מפתחות ה-API',
      });
    } else {
      setCodeError('קוד שגוי');
      setApiKeysCode('');
    }
  };

  const handleApiKeysTabClick = () => {
    if (!isApiKeysUnlocked) {
      setShowApiKeysCodeInput(true);
    }
  };

  return (
    <AppLayout title="הגדרות">
      <div className="p-6 space-y-6 animate-fade-in" dir="rtl">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 justify-end">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">פרופיל</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">פיננסים</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">ערכות נושא</span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">טיפוגרפיה</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">התראות</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">יומן</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Contact className="h-4 w-4" />
              <span className="hidden sm:inline">אנשי קשר</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="email-templates" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">תבניות אימייל</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger 
                value="apikeys" 
                className="flex items-center gap-2"
                onClick={handleApiKeysTabClick}
              >
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">מפתחות</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">תפקידים</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">יומן</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="cleanup" className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">ניקוי נתונים</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="developer" className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Code2 className="h-4 w-4" />
                <span className="hidden sm:inline">פיתוח</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-border-gold/30" dir="rtl">
              <CardHeader className="text-right">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-border-gold">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getInitials(profile?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{profile?.full_name}</CardTitle>
                    <CardDescription>{profile?.email}</CardDescription>
                    <div className="flex gap-2 mt-2">
                      {roles.map(role => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)}>
                          {getRoleLabel(role)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">שם מלא</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="הכנס שם מלא"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">טלפון</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="050-1234567"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">מחלקה</Label>
                    <Input
                      id="department"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="פיתוח / עיצוב / ניהול"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">תפקיד</Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={e => setPosition(e.target.value)}
                      placeholder="מפתח בכיר / מעצב"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">תעריף שעתי (₪)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={e => setHourlyRate(e.target.value)}
                      placeholder="150"
                      dir="ltr"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="btn-gold"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 ml-2" />
                    )}
                    שמור שינויים
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card dir="rtl">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-secondary" />
                  החלפת סיסמה
                </CardTitle>
                <CardDescription>
                  עדכן סיסמה לחשבון שלך
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">סיסמה חדשה</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">אימות סיסמה חדשה</Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={!user || isChangingPassword}
                    className="btn-gold"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Unlock className="h-4 w-4 ml-2" />
                    )}
                    עדכן סיסמה
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Settings Tab */}
          <TabsContent value="finance" className="space-y-6">
            <Card dir="rtl">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-secondary" />
                  הגדרות פיננסיות
                </CardTitle>
                <CardDescription>
                  הגדר את שיעור המע"מ וחישובים נוספים
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="vatRate">שיעור מע"מ (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="vatRate"
                          type="number"
                          value={vatRate}
                          onChange={e => setVatRate(e.target.value)}
                          placeholder="18"
                          className="max-w-[120px]"
                          dir="ltr"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        שיעור המע"מ הנוכחי בישראל הוא 18%
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="p-4 bg-accent/30 rounded-lg">
                    <h4 className="font-medium mb-2">דוגמה לחישוב:</h4>
                    <div className="text-sm space-y-1">
                      <p className="flex justify-between">
                        <span>חשבונית כולל מע"מ:</span>
                        <span className="font-bold">₪118,000</span>
                      </p>
                      <p className="flex justify-between text-muted-foreground">
                        <span>סכום לפני מע"מ ({vatRate}%):</span>
                        <span>₪{Math.round(118000 / (1 + (parseFloat(vatRate) || 18) / 100)).toLocaleString()}</span>
                      </p>
                      <p className="flex justify-between text-muted-foreground">
                        <span>סכום המע"מ:</span>
                        <span>₪{Math.round(118000 - 118000 / (1 + (parseFloat(vatRate) || 18) / 100)).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveVatSettings}
                    disabled={isSavingVat}
                    className="btn-gold"
                  >
                    {isSavingVat ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 ml-2" />
                    )}
                    שמור הגדרות מע"מ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab - Theme Settings */}
          <TabsContent value="appearance" className="space-y-6">
            {/* Light/Dark Mode */}
            <Card dir="rtl">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-secondary" />
                  מצב תצוגה
                </CardTitle>
                <CardDescription>בחר בין מצב בהיר, כהה או אוטומטי</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                      theme === 'light'
                        ? "border-secondary bg-secondary/10"
                        : "border-border hover:border-secondary/50"
                    )}
                  >
                    <div className="p-3 rounded-full bg-amber-50 border border-amber-200">
                      <Sun className="h-6 w-6 text-amber-500" />
                    </div>
                    <span className="font-medium">בהיר</span>
                    {theme === 'light' && (
                      <Check className="h-4 w-4 text-secondary" />
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                      theme === 'dark'
                        ? "border-secondary bg-secondary/10"
                        : "border-border hover:border-secondary/50"
                    )}
                  >
                    <div className="p-3 rounded-full bg-slate-800 border border-slate-600">
                      <Moon className="h-6 w-6 text-slate-200" />
                    </div>
                    <span className="font-medium">כהה</span>
                    {theme === 'dark' && (
                      <Check className="h-4 w-4 text-secondary" />
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                      theme === 'system'
                        ? "border-secondary bg-secondary/10"
                        : "border-border hover:border-secondary/50"
                    )}
                  >
                    <div className="p-3 rounded-full bg-gradient-to-br from-amber-50 to-slate-800 border">
                      <Monitor className="h-6 w-6 text-foreground" />
                    </div>
                    <span className="font-medium">מערכת</span>
                    {theme === 'system' && (
                      <Check className="h-4 w-4 text-secondary" />
                    )}
                  </button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>מצב נוכחי</Label>
                    <p className="text-sm text-muted-foreground">
                      המערכת כרגע במצב {resolvedTheme === 'dark' ? 'כהה' : 'בהיר'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {resolvedTheme === 'dark' ? (
                      <Moon className="h-3 w-3 ml-1" />
                    ) : (
                      <Sun className="h-3 w-3 ml-1" />
                    )}
                    {resolvedTheme === 'dark' ? 'כהה' : 'בהיר'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Theme Presets */}
            {!prefsLoading && (
              <ThemeSettings 
                preferences={preferences} 
                onSave={savePreferences} 
                saving={saving} 
              />
            )}

            {/* Advanced Theme Settings */}
            {!prefsLoading && (
              <AdvancedThemeSettings 
                preferences={preferences} 
                onSave={savePreferences} 
                saving={saving} 
              />
            )}
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            {!prefsLoading && (
              <TypographySettings
                preferences={preferences}
                onSave={savePreferences}
                onReset={resetToDefaults}
                saving={saving}
              />
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {!prefsLoading && (
              <AdvancedNotificationsSettings
                preferences={preferences}
                onSave={savePreferences}
                saving={saving}
              />
            )}
            
            {/* Push Notifications Card */}
            <PushNotificationsSettings />
          </TabsContent>

          {/* Calendar Integration Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <GoogleCalendarSettingsMulti />
          </TabsContent>

          {/* Contacts Import Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <GoogleContactsSettings />
          </TabsContent>

          {/* Email Templates Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="email-templates" className="space-y-6">
              <Card dir="rtl">
                <CardHeader className="text-right">
                  <CardTitle>מגבלות שליחת אימייל</CardTitle>
                  <CardDescription>
                    מעקב אחר מגבלות השליחה השעתיות והיומיות שלך
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RateLimitMonitor />
                </CardContent>
              </Card>
              
              <EmailTemplateManager />
              
              <Card dir="rtl">
                <CardHeader className="text-right">
                  <CardTitle>חתימות אימייל</CardTitle>
                  <CardDescription>
                    נהל חתימות אימייל אישיות וחברה
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailSignatureManager />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* API Keys Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="apikeys" className="space-y-6">`
              <Card dir="rtl">
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-secondary" />
                    ניהול מפתחות API
                    {isApiKeysUnlocked ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        <Unlock className="h-3 w-3 ml-1" />
                        פתוח
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600">
                        <Lock className="h-3 w-3 ml-1" />
                        נעול
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    נהל חיבורים לשירותים חיצוניים כמו Twilio, Resend ועוד
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isApiKeysUnlocked ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                      <div className="p-4 rounded-full bg-muted">
                        <Lock className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold">גישה מוגנת</h3>
                        <p className="text-muted-foreground max-w-md">
                          הזן את קוד הגישה כדי לנהל את מפתחות ה-API והחיבורים לשירותים חיצוניים
                        </p>
                      </div>
                      
                      {showApiKeysCodeInput && (
                        <div className="space-y-4 w-full max-w-xs">
                          <div className="space-y-2">
                            <Label htmlFor="accessCode">קוד גישה</Label>
                            <Input
                              id="accessCode"
                              type="password"
                              value={apiKeysCode}
                              onChange={(e) => {
                                setApiKeysCode(e.target.value);
                                setCodeError('');
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && handleApiKeysCodeSubmit()}
                              placeholder="הזן קוד"
                              className="text-center text-lg tracking-widest"
                              dir="ltr"
                              autoFocus
                            />
                            {codeError && (
                              <p className="text-sm text-destructive text-center">{codeError}</p>
                            )}
                          </div>
                          <Button 
                            onClick={handleApiKeysCodeSubmit} 
                            className="w-full btn-gold"
                          >
                            <Unlock className="h-4 w-4 ml-2" />
                            פתח גישה
                          </Button>
                        </div>
                      )}
                      
                      {!showApiKeysCodeInput && (
                        <Button 
                          onClick={() => setShowApiKeysCodeInput(true)}
                          variant="outline"
                        >
                          <Key className="h-4 w-4 ml-2" />
                          הזן קוד גישה
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ApiKeysManager isUnlocked={isApiKeysUnlocked} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Roles Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="roles" className="space-y-6">
              <Card dir="rtl">
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-secondary" />
                    ניהול תפקידים והרשאות
                  </CardTitle>
                  <CardDescription>
                    שנה תפקידים והרשאות למשתמשים במערכת
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Table dir="rtl">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">משתמש</TableHead>
                          <TableHead className="text-right">אימייל</TableHead>
                          <TableHead className="text-right">תפקיד נוכחי</TableHead>
                          <TableHead className="text-right">שנה תפקיד</TableHead>
                          <TableHead className="text-right">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(u => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getInitials(u.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{u.full_name}</span>
                                {u.id === user?.id && (
                                  <Badge variant="outline" className="text-xs">אתה</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground" dir="ltr">
                              {u.email}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(u.role)}>
                                {u.role === 'admin' && <Crown className="h-3 w-3 ml-1" />}
                                {u.role === 'manager' && <UserCog className="h-3 w-3 ml-1" />}
                                {u.role === 'employee' && <Users className="h-3 w-3 ml-1" />}
                                {getRoleLabel(u.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={u.role}
                                onValueChange={(val: 'admin' | 'manager' | 'employee') => 
                                  handleRoleChange(u.id, val)
                                }
                                disabled={u.id === user?.id}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <Crown className="h-3 w-3" />
                                      מנהל ראשי
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="manager">
                                    <div className="flex items-center gap-2">
                                      <UserCog className="h-3 w-3" />
                                      מנהל
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="employee">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3 w-3" />
                                      עובד
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenResetPasswordDialog(u)}
                                disabled={u.id === user?.id}
                                className="gap-2"
                              >
                                <Lock className="h-3 w-3" />
                                איפוס סיסמה
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Role Permissions Info */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-secondary/30" dir="rtl">
                  <CardHeader className="pb-2 text-right">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-secondary" />
                      מנהל ראשי
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-1">
                      <li>• גישה מלאה לכל המערכת</li>
                      <li>• ניהול משתמשים ותפקידים</li>
                      <li>• מחיקת נתונים</li>
                      <li>• צפייה בכל הדוחות</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card dir="rtl">
                  <CardHeader className="pb-2 text-right">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCog className="h-5 w-5 text-primary" />
                      מנהל
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-1">
                      <li>• ניהול לקוחות ופרויקטים</li>
                      <li>• צפייה ברישומי זמן של כולם</li>
                      <li>• הפקת דוחות</li>
                      <li>• ללא הרשאות מחיקה</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card dir="rtl">
                  <CardHeader className="pb-2 text-right">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      עובד
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-1">
                      <li>• צפייה בפרויקטים משויכים</li>
                      <li>• רישום שעות עבודה</li>
                      <li>• עדכון משימות</li>
                      <li>• ללא גישה לפיננסים</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Admin Password Reset Dialog */}
          <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
            <DialogContent dir="rtl">
              <DialogHeader className="text-right">
                <DialogTitle>איפוס סיסמה למשתמש</DialogTitle>
                <DialogDescription>
                  {selectedUserForReset && (
                    <>הזן סיסמה חדשה עבור {selectedUserForReset.full_name}</>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-reset-password">סיסמה חדשה</Label>
                  <Input
                    id="admin-reset-password"
                    type="password"
                    value={adminResetPassword}
                    onChange={e => setAdminResetPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-reset-password-confirm">אימות סיסמה</Label>
                  <Input
                    id="admin-reset-password-confirm"
                    type="password"
                    value={adminResetPasswordConfirm}
                    onChange={e => setAdminResetPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setResetPasswordDialogOpen(false)}
                  disabled={isResettingPassword}
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleAdminResetPassword}
                  disabled={isResettingPassword}
                  className="btn-gold"
                >
                  {isResettingPassword ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 ml-2" />
                  )}
                  איפוס סיסמה
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Activity Log Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="activity" className="space-y-6">
              <ActivityLogTab isAdmin={isAdmin} />
            </TabsContent>
          )}

          {/* Data Cleanup Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="cleanup" className="space-y-6">
              <DataCleanupTab />
            </TabsContent>
          )}

          {/* Developer Settings Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="developer" className="space-y-6">
              <DeveloperSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}
