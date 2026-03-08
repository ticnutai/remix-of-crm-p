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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Users,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Search,
  Check,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  position: string | null;
}

interface Permission {
  id: string;
  table_id: string;
  user_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  profile?: Profile;
}

interface ManagePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  tableName: string;
}

export function ManagePermissionsDialog({
  open,
  onOpenChange,
  tableId,
  tableName,
}: ManagePermissionsDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Fetch permissions and profiles
  useEffect(() => {
    if (open && tableId) {
      fetchData();
    }
  }, [open, tableId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch existing permissions
      const { data: permData, error: permError } = await supabase
        .from('custom_table_permissions')
        .select('*')
        .eq('table_id', tableId);

      if (permError) throw permError;

      // Fetch all profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, position')
        .eq('is_active', true)
        .order('full_name');

      if (profileError) throw profileError;

      // Map permissions with profiles
      const permissionsWithProfiles = (permData || []).map(perm => ({
        ...perm,
        profile: profileData?.find(p => p.id === perm.user_id),
      }));

      setPermissions(permissionsWithProfiles);
      setProfiles(profileData || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את ההרשאות',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedUserId) return;

    // Check if permission already exists
    if (permissions.some(p => p.user_id === selectedUserId)) {
      toast({
        title: 'שגיאה',
        description: 'למשתמש זה כבר יש הרשאות לטבלה',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_table_permissions')
        .insert({
          table_id: tableId,
          user_id: selectedUserId,
          can_view: true,
          can_edit: false,
          can_delete: false,
        })
        .select()
        .single();

      if (error) throw error;

      const profile = profiles.find(p => p.id === selectedUserId);
      setPermissions(prev => [...prev, { ...data, profile }]);
      setSelectedUserId('');

      toast({
        title: 'נוסף',
        description: 'ההרשאה נוספה בהצלחה',
      });
    } catch (error: any) {
      console.error('Error adding permission:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן להוסיף הרשאה',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePermission = async (
    permissionId: string,
    field: 'can_view' | 'can_edit' | 'can_delete',
    value: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('custom_table_permissions')
        .update({ [field]: value })
        .eq('id', permissionId);

      if (error) throw error;

      setPermissions(prev =>
        prev.map(p =>
          p.id === permissionId ? { ...p, [field]: value } : p
        )
      );
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן לעדכן הרשאה',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('custom_table_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      setPermissions(prev => prev.filter(p => p.id !== permissionId));

      toast({
        title: 'הוסר',
        description: 'ההרשאה הוסרה בהצלחה',
      });
    } catch (error: any) {
      console.error('Error removing permission:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן להסיר הרשאה',
        variant: 'destructive',
      });
    }
  };

  // Filter profiles that don't already have permissions
  const availableProfiles = profiles.filter(
    p => !permissions.some(perm => perm.user_id === p.id)
  );

  const filteredAvailableProfiles = searchTerm
    ? availableProfiles.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableProfiles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ניהול הרשאות - {tableName}
          </DialogTitle>
          <DialogDescription>
            הגדר מי יכול לצפות, לערוך ולמחוק נתונים בטבלה זו
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new permission */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>הוסף משתמש</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר משתמש להוספה..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredAvailableProfiles.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      אין משתמשים זמינים
                    </div>
                  ) : (
                    filteredAvailableProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {profile.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{profile.full_name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({profile.email})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddPermission} disabled={!selectedUserId}>
              <Plus className="h-4 w-4 ml-1" />
              הוסף
            </Button>
          </div>

          {/* Permissions list */}
          <div className="border rounded-lg">
            <div className="p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">משתמשים עם הרשאות</span>
                <Badge variant="secondary">{permissions.length}</Badge>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">טוען...</p>
              </div>
            ) : permissions.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">אין הרשאות מוגדרות</p>
                <p className="text-sm text-muted-foreground">
                  מנהלים יכולים לגשת תמיד. הוסף משתמשים נוספים כאן.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">משתמש</TableHead>
                      <TableHead className="text-center w-[80px]">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-4 w-4" />
                          צפייה
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[80px]">
                        <div className="flex items-center justify-center gap-1">
                          <Edit2 className="h-4 w-4" />
                          עריכה
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[80px]">
                        <div className="flex items-center justify-center gap-1">
                          <Trash2 className="h-4 w-4" />
                          מחיקה
                        </div>
                      </TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map(permission => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {permission.profile?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {permission.profile?.full_name || 'משתמש לא ידוע'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {permission.profile?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_view}
                            onCheckedChange={(checked) =>
                              handleUpdatePermission(permission.id, 'can_view', !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_edit}
                            onCheckedChange={(checked) =>
                              handleUpdatePermission(permission.id, 'can_edit', !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_delete}
                            onCheckedChange={(checked) =>
                              handleUpdatePermission(permission.id, 'can_delete', !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemovePermission(permission.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>

          {/* Info */}
          <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">שים לב:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>מנהלים ואדמינים תמיד יכולים לגשת לכל הטבלאות</li>
              <li>יוצר הטבלה יכול תמיד לגשת אליה</li>
              <li>הרשאת עריכה כוללת גם הוספת רשומות</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
