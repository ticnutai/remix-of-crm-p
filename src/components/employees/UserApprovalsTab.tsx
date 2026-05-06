// UserApprovalsTab — embedded in Employees page (admin only)
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, UserX, Clock, Mail, User as UserIcon } from 'lucide-react';

type AppRole = 'admin' | 'super_manager' | 'manager' | 'employee' | 'client';

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  approval_status: string;
  created_at: string;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'מנהל מערכת (Admin)',
  super_manager: 'מנהל בכיר',
  manager: 'מנהל',
  employee: 'עובד',
  client: 'לקוח',
};

export function UserApprovalsTab() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id, email, full_name, approval_status, created_at')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'שגיאה בטעינה', description: error.message, variant: 'destructive' });
    } else {
      setUsers((data || []) as PendingUser[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const approve = async (userId: string) => {
    const role = selectedRoles[userId] || 'employee';
    setBusyId(userId);
    const { error } = await (supabase as any).rpc('approve_user', {
      _user_id: userId,
      _role: role,
    });
    setBusyId(null);
    if (error) {
      toast({ title: 'שגיאה באישור', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'המשתמש אושר', description: `תפקיד: ${ROLE_LABELS[role]}` });
      fetchPending();
    }
  };

  const reject = async (userId: string) => {
    setBusyId(userId);
    const { error } = await (supabase as any).rpc('reject_user', { _user_id: userId });
    setBusyId(null);
    if (error) {
      toast({ title: 'שגיאה בדחייה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'המשתמש נדחה' });
      fetchPending();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              אישור משתמשים חדשים
            </CardTitle>
            <CardDescription>
              משתמשים שנרשמו (כולל באמצעות Google) ממתינים לאישור והגדרת תפקיד
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{users.length} ממתינים</Badge>
            <Button variant="ghost" size="sm" onClick={fetchPending} disabled={loading}>
              <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : 'opacity-0'}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">אין בקשות ממתינות</p>
        ) : (
          users.map(u => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-9 w-9 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{u.full_name || u.email}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3" />{u.email}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(u.created_at).toLocaleDateString('he-IL')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={selectedRoles[u.id] || 'employee'}
                  onValueChange={(v) => setSelectedRoles(p => ({ ...p, [u.id]: v as AppRole }))}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rtl">
                    {(Object.keys(ROLE_LABELS) as AppRole[]).map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => approve(u.id)}
                  disabled={busyId === u.id}
                >
                  {busyId === u.id && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                  אישור
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reject(u.id)}
                  disabled={busyId === u.id}
                  className="text-destructive"
                >
                  <UserX className="h-3.5 w-3.5 ml-1" />
                  דחייה
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
