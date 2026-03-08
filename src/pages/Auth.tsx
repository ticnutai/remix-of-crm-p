// Authentication Page - טכנולוגיות מתקדמות e-control
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Mail, Lock, User, Loader2 } from 'lucide-react';
import { z } from 'zod';

const REMEMBER_ME_KEY = 'econtrol_remember_email';

const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'הסיסמאות אינן תואמות',
  path: ['confirmPassword'],
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, requestPasswordReset, updatePassword, isLoading, isClient } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [authView, setAuthView] = useState<'auth' | 'forgot' | 'reset'>('auth');

  // Login form state
  const [loginEmail, setLoginEmail] = useState(() => {
    return localStorage.getItem(REMEMBER_ME_KEY) || '';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem(REMEMBER_ME_KEY);
  });

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');

  // Forgot/reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') || searchParams.get('type');

    if (type === 'recovery') {
      setAuthView('reset');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (authView === 'reset') return;

    // Redirect clients to client portal, others to main dashboard
    if (isClient) {
      navigate('/client-portal');
    } else {
      navigate('/');
    }
  }, [user, isClient, navigate, authView]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);
    
    // Save or remove email based on "remember me" checkbox
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, loginEmail);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
    
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'שגיאה בכניסה',
        description: error.message === 'Invalid login credentials' 
          ? 'פרטי ההתחברות שגויים'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'ברוך הבא!',
        description: 'התחברת בהצלחה למערכת',
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      signupSchema.parse({
        email: signupEmail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
        fullName: signupFullName,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'משתמש קיים',
          description: 'כתובת האימייל הזו כבר רשומה במערכת',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'שגיאה בהרשמה',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'נרשמת בהצלחה!',
        description: 'ברוך הבא למערכת tenarch',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      z.object({ email: z.string().email('כתובת אימייל לא תקינה') }).parse({ email: resetEmail });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await requestPasswordReset(resetEmail);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'שגיאה בשליחת איפוס סיסמה',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'נשלח מייל לאיפוס סיסמה',
      description: 'בדוק/י את תיבת המייל ולחץ/י על הקישור כדי לבחור סיסמה חדשה.',
    });

    setAuthView('auth');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      z.object({
        password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
        confirmPassword: z.string(),
      })
        .refine(data => data.password === data.confirmPassword, {
          message: 'הסיסמאות אינן תואמות',
          path: ['confirmPassword'],
        })
        .parse({ password: newPassword, confirmPassword: newPasswordConfirm });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'שגיאה בעדכון סיסמה',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Clear recovery fragment to avoid re-triggering reset view on refresh
    window.history.replaceState(null, '', '/auth');

    toast({
      title: 'הסיסמה עודכנה',
      description: 'אפשר להמשיך להשתמש במערכת.',
    });

    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-lg mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">ten</span>
            <span className="text-foreground">arch</span>
          </h1>
          <p className="text-muted-foreground mt-1">טכנולוגיות מתקדמות</p>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">ברוכים הבאים</CardTitle>
            <CardDescription>
              התחבר או הירשם לניהול הלקוחות והפרויקטים שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authView === 'forgot' ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">אימייל</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your@email.com"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>

                <Button type="submit" className="w-full btn-gold" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  שלח קישור לאיפוס סיסמה
                </Button>

                <Button type="button" variant="link" className="w-full" onClick={() => setAuthView('auth')}>
                  חזרה לכניסה
                </Button>
              </form>
            ) : authView === 'reset' ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">סיסמה חדשה</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                  {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password-confirm">אימות סיסמה חדשה</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={newPasswordConfirm}
                      onChange={e => setNewPasswordConfirm(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" className="w-full btn-gold" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  עדכן סיסמה
                </Button>

                <Button type="button" variant="link" className="w-full" onClick={() => setAuthView('auth')}>
                  חזרה לכניסה
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">כניסה</TabsTrigger>
                  <TabsTrigger value="signup">הרשמה</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                    {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                    {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                    />
                    <Label htmlFor="remember-me" className="text-sm cursor-pointer">
                      זכור אותי במחשב זה
                    </Label>
                  </div>

                  <Button type="submit" className="w-full btn-gold" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    התחבר
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={() => {
                      setResetEmail(loginEmail);
                      setAuthView('forgot');
                    }}
                  >
                    שכחתי סיסמה
                  </Button>
                </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">שם מלא</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="ישראל ישראלי"
                        value={signupFullName}
                        onChange={e => setSignupFullName(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                    {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                    {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">אישור סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={e => setSignupConfirmPassword(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                  </div>

                  <Button type="submit" className="w-full btn-gold" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    הירשם
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 טכנולוגיות מתקדמות tenarch. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  );
}
