// Employees Management Page - e-control CRM Pro
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ColumnDef } from '@/components/DataTable';
import { UniversalDataTable } from '@/components/tables/UniversalDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltipButton } from '@/components/ui/info-tooltip-button';
import { ViewToggle, useViewMode, GridView, ListView, CompactView, type ViewMode } from '@/components/shared/ViewToggle';
import { MobileCard } from '@/components/shared/MobileCard';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Shield,
  Loader2,
  Mail,
  Phone,
  Building,
  Briefcase,
  DollarSign,
  Crown,
  UserCog,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Edit,
  Calendar,
} from 'lucide-react';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  role: 'admin' | 'manager' | 'employee';
  custom_data?: Record<string, any> | null;
}

const roleConfig = {
  admin: { label: 'מנהל ראשי', icon: Crown, color: 'bg-destructive text-destructive-foreground' },
  manager: { label: 'מנהל', icon: UserCog, color: 'bg-secondary text-secondary-foreground' },
  employee: { label: 'עובד', icon: User, color: 'bg-muted text-muted-foreground' },
};

export default function Employees() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin, isManager } = useAuth();
  const isMobile = useIsMobile();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useViewMode('employees-view-mode', 'cards');
  const [editDialog, setEditDialog] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  });
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    department: '',
    position: '',
    hourly_rate: '',
    is_active: true,
    role: 'employee' as 'admin' | 'manager' | 'employee',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Add employee dialog
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    department: '',
    position: '',
    hourly_rate: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
  });
  const [isAdding, setIsAdding] = useState(false);

  // Password reset dialog
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch employees with their roles
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת העובדים',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Fetch roles for all users
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Combine profiles with roles
    const rolesMap: Record<string, 'admin' | 'manager' | 'employee'> = {};
    (roles || []).forEach(r => {
      // If user has multiple roles, prioritize admin > manager > employee
      const currentRole = rolesMap[r.user_id];
      if (!currentRole || 
          (r.role === 'admin') || 
          (r.role === 'manager' && currentRole === 'employee')) {
        rolesMap[r.user_id] = r.role as 'admin' | 'manager' | 'employee';
      }
    });

    const employeesWithRoles: Employee[] = (profiles || []).map(profile => ({
      ...profile,
      role: rolesMap[profile.id] || 'employee',
      custom_data: (profile.custom_data as Record<string, any>) || {},
    }));

    setEmployees(employeesWithRoles);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleEditClick = (employee: Employee) => {
    setEditForm({
      full_name: employee.full_name,
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      hourly_rate: employee.hourly_rate?.toString() || '',
      is_active: employee.is_active ?? true,
      role: employee.role,
    });
    setEditDialog({ open: true, employee });
  };

  const handleSaveEmployee = async () => {
    if (!editDialog.employee) return;
    
    setIsSaving(true);

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        phone: editForm.phone || null,
        department: editForm.department || null,
        position: editForm.position || null,
        hourly_rate: editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : null,
        is_active: editForm.is_active,
      })
      .eq('id', editDialog.employee.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את פרטי העובד',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    // Update role if admin and role changed
    if (isAdmin && editForm.role !== editDialog.employee.role) {
      // Delete existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editDialog.employee.id);

      // Insert new role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: editDialog.employee.id,
          role: editForm.role,
        });

      if (roleError) {
        console.error('Error updating role:', roleError);
        toast({
          title: 'אזהרה',
          description: 'פרטי העובד עודכנו אך לא ניתן לעדכן את ההרשאה',
          variant: 'destructive',
        });
      }
    }

    toast({
      title: 'העובד עודכן',
      description: 'פרטי העובד נשמרו בהצלחה',
    });

    setEditDialog({ open: false, employee: null });
    setIsSaving(false);
    fetchEmployees();
  };

  const handleAddEmployee = async () => {
    if (!addForm.email || !addForm.full_name) {
      toast({
        title: 'שגיאה',
        description: 'נא למלא אימייל ושם מלא',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    try {
      // Call Edge Function to create employee
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: {
          email: addForm.email,
          full_name: addForm.full_name,
          phone: addForm.phone || null,
          department: addForm.department || null,
          position: addForm.position || null,
          hourly_rate: addForm.hourly_rate ? parseFloat(addForm.hourly_rate) : null,
          role: addForm.role,
        },
      });

      if (error) {
        console.error('Error creating employee:', error);
        toast({
          title: 'שגיאה',
          description: error.message || 'לא ניתן ליצור עובד חדש',
          variant: 'destructive',
        });
        setIsAdding(false);
        return;
      }

      if (!data?.success) {
        toast({
          title: 'שגיאה',
          description: data?.error || 'לא ניתן ליצור עובד חדש',
          variant: 'destructive',
        });
        setIsAdding(false);
        return;
      }

      const message = data.is_existing_user 
        ? `משתמש קיים ${addForm.full_name} נוסף כעובד בהצלחה`
        : `עובד חדש ${addForm.full_name} נוסף בהצלחה. נשלח אליו אימייל לאיפוס סיסמה.`;

      toast({
        title: 'עובד נוסף',
        description: message,
      });

      setAddDialog(false);
      setAddForm({
        email: '',
        full_name: '',
        phone: '',
        department: '',
        position: '',
        hourly_rate: '',
        role: 'employee',
      });
      setIsAdding(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהוספת העובד',
        variant: 'destructive',
      });
      setIsAdding(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!resetPasswordDialog.employee || !newPassword) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין סיסמה חדשה',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'שגיאה',
        description: 'הסיסמה חייבת להכיל לפחות 6 תווים',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: resetPasswordDialog.employee.id,
          newPassword: newPassword,
        },
      });

      if (error) {
        console.error('Error resetting password:', error);
        toast({
          title: 'שגיאה',
          description: error.message || 'לא ניתן לאפס את הסיסמה',
          variant: 'destructive',
        });
        setIsResetting(false);
        return;
      }

      if (data?.error) {
        toast({
          title: 'שגיאה',
          description: data.error,
          variant: 'destructive',
        });
        setIsResetting(false);
        return;
      }

      toast({
        title: 'הסיסמה אופסה בהצלחה',
        description: `הסיסמה של ${resetPasswordDialog.employee.full_name} עודכנה`,
      });

      setResetPasswordDialog({ open: false, employee: null });
      setNewPassword('');
      setShowPassword(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה באיפוס הסיסמה',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const columns: ColumnDef<Employee>[] = [
    {
      id: 'full_name',
      header: 'שם מלא',
      accessorKey: 'full_name',
      sortable: true,
      cell: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium">
            {value?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'תפקיד',
      accessorKey: 'role',
      sortable: true,
      cell: (value) => {
        const config = roleConfig[value as keyof typeof roleConfig];
        const Icon = config.icon;
        return (
          <Badge className={config.color}>
            <Icon className="h-3 w-3 ml-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'position',
      header: 'משרה',
      accessorKey: 'position',
      cell: (value) => value || null,
    },
    {
      id: 'department',
      header: 'מחלקה',
      accessorKey: 'department',
      cell: (value) => value || null,
    },
    {
      id: 'phone',
      header: 'טלפון',
      accessorKey: 'phone',
      cell: (value) => value || null,
    },
    {
      id: 'hourly_rate',
      header: 'תעריף שעתי',
      accessorKey: 'hourly_rate',
      sortable: true,
      align: 'center',
      cell: (value) => value ? (
        <span className="font-medium text-success">₪{value}</span>
      ) : null,
    },
    {
      id: 'is_active',
      header: 'סטטוס',
      accessorKey: 'is_active',
      cell: (value) => (
        <Badge variant={value ? 'default' : 'secondary'} className={value ? 'bg-success' : ''}>
          {value ? 'פעיל' : 'לא פעיל'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'פעולות',
      accessorKey: 'id',
      cell: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
            disabled={!isManager}
          >
            עריכה
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setResetPasswordDialog({ open: true, employee: row });
              }}
              title="איפוס סיסמה"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Stats
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.is_active).length,
    admins: employees.filter(e => e.role === 'admin').length,
    managers: employees.filter(e => e.role === 'manager').length,
  };

  // Render functions for different view modes
  const renderEmployeeCard = (employee: Employee) => (
    <MobileCard
      key={employee.id}
      title={employee.full_name}
      subtitle={`${roleConfig[employee.role].label} • ${employee.email}`}
      status={{
        label: employee.is_active ? 'פעיל' : 'לא פעיל',
        variant: employee.is_active ? 'default' : 'secondary'
      }}
      fields={[
        { label: 'משרה', value: employee.position || '-', icon: Briefcase },
        { label: 'מחלקה', value: employee.department || '-', icon: Building },
        { label: 'טלפון', value: employee.phone || '-', icon: Phone },
        { label: 'תעריף', value: employee.hourly_rate ? `₪${employee.hourly_rate}` : '-', icon: DollarSign },
      ]}
      actions={[
        ...(isManager ? [{ label: 'ערוך', icon: Edit, onClick: () => handleEditClick(employee) }] : []),
        ...(isAdmin ? [{ label: 'סיסמה', icon: KeyRound, onClick: () => setResetPasswordDialog({ open: true, employee }) }] : []),
      ]}
    />
  );

  const renderEmployeeGrid = (employee: Employee) => (
    <Card key={employee.id} className="card-elegant hover:shadow-lg transition-all cursor-pointer" onClick={() => handleEditClick(employee)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium">
              {employee.full_name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">{employee.full_name}</h3>
              <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
            </div>
          </div>
          <Badge className={roleConfig[employee.role].color}>
            {React.createElement(roleConfig[employee.role].icon, { className: 'h-3 w-3 ml-1' })}
            {roleConfig[employee.role].label}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{employee.position || 'ללא משרה'}</span>
          <Badge variant={employee.is_active ? 'default' : 'secondary'} className={employee.is_active ? 'bg-success' : ''}>
            {employee.is_active ? 'פעיל' : 'לא פעיל'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmployeeList = (employee: Employee) => (
    <div key={employee.id} className="flex items-center justify-between gap-4 hover:bg-muted/50 p-3 rounded-lg cursor-pointer transition-colors" onClick={() => handleEditClick(employee)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium flex-shrink-0">
          {employee.full_name?.charAt(0) || '?'}
        </div>
        <div className="min-w-0">
          <h3 className="font-medium truncate">{employee.full_name}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{employee.email}</span>
            {employee.position && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{employee.position}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={roleConfig[employee.role].color}>
          {roleConfig[employee.role].label}
        </Badge>
        <Badge variant={employee.is_active ? 'default' : 'secondary'} className={employee.is_active ? 'bg-success' : ''}>
          {employee.is_active ? 'פעיל' : 'לא פעיל'}
        </Badge>
      </div>
    </div>
  );

  const renderEmployeeCompact = (employee: Employee) => (
    <div key={employee.id} className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer transition-colors rounded" onClick={() => handleEditClick(employee)}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-medium truncate">{employee.full_name}</span>
        <span className="text-sm text-muted-foreground truncate hidden sm:inline">({employee.email})</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className={roleConfig[employee.role].color}>{roleConfig[employee.role].label}</Badge>
        <div className={`w-2 h-2 rounded-full ${employee.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
      </div>
    </div>
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout title="ניהול עובדים">
      <div className="p-6 md:p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">סה"כ עובדים</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">עובדים פעילים</p>
                  <p className="text-2xl font-bold text-success">{stats.active}</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10 text-success">
                  <User className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">מנהלים</p>
                  <p className="text-2xl font-bold text-secondary">{stats.managers}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/10 text-secondary">
                  <UserCog className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">מנהלים ראשיים</p>
                  <p className="text-2xl font-bold text-destructive">{stats.admins}</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive">
                  <Crown className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employees Section */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              רשימת עובדים
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ViewToggle
                currentView={viewMode}
                onViewChange={setViewMode}
                isMobile={isMobile}
                showLabel={!isMobile}
              />
              {isAdmin && (
                <Button className="btn-gold flex-1 sm:flex-none" onClick={() => setAddDialog(true)}>
                  <UserPlus className="h-4 w-4 ml-2" />
                  {isMobile ? 'הוסף' : 'הזמן עובד חדש'}
                </Button>
              )}
            </div>
          </div>

          {/* View Mode Content */}
          {employees.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                לא נמצאו עובדים
              </CardContent>
            </Card>
          ) : viewMode === 'cards' ? (
            <PullToRefresh onRefresh={fetchEmployees}>
              <div className="space-y-3">
                {employees.map(employee => renderEmployeeCard(employee))}
              </div>
            </PullToRefresh>
          ) : viewMode === 'grid' ? (
            <GridView
              data={employees}
              renderItem={(employee) => renderEmployeeGrid(employee)}
              keyExtractor={(employee) => employee.id}
              columns={{ mobile: 1, tablet: 2, desktop: 3 }}
              gap={4}
            />
          ) : viewMode === 'list' ? (
            <Card>
              <ListView
                data={employees}
                renderItem={(employee) => renderEmployeeList(employee)}
                keyExtractor={(employee) => employee.id}
                divided
              />
            </Card>
          ) : viewMode === 'compact' ? (
            <Card>
              <CompactView
                data={employees}
                renderItem={(employee) => renderEmployeeCompact(employee)}
                keyExtractor={(employee) => employee.id}
              />
            </Card>
          ) : viewMode === 'table' ? (
            <UniversalDataTable
              tableName="profiles"
              data={employees}
              setData={setEmployees}
              baseColumns={columns}
              variant="gold"
              paginated
              pageSize={10}
              pageSizeOptions={[5, 10, 25]}
              globalSearch
              columnToggle
              striped
              showSummary={!isMobile}
              exportable={!isMobile}
              filterable={!isMobile}
              emptyMessage="לא נמצאו עובדים"
              canAddColumns={isManager && !isMobile}
              canDeleteColumns={isAdmin && !isMobile}
            />
          ) : null}
        </div>

        {/* Permissions Info - Compact with tooltip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>מערכת הרשאות</span>
          </div>
          <InfoTooltipButton
            sections={[
              {
                title: 'מנהל ראשי (Admin)',
                icon: <Crown className="h-4 w-4" />,
                variant: 'destructive',
                items: [
                  'גישה מלאה לכל המערכת',
                  'ניהול הרשאות עובדים',
                  'מחיקת לקוחות ופרויקטים',
                  'צפייה בכל רישומי הזמן',
                ],
              },
              {
                title: 'מנהל (Manager)',
                icon: <UserCog className="h-4 w-4" />,
                variant: 'secondary',
                items: [
                  'הוספה ועריכת לקוחות',
                  'הוספה ועריכת פרויקטים',
                  'צפייה בכל רישומי הזמן',
                  'עריכת פרטי עובדים',
                ],
              },
              {
                title: 'עובד (Employee)',
                icon: <User className="h-4 w-4" />,
                variant: 'muted',
                items: [
                  'צפייה בלקוחות ופרויקטים',
                  'ניהול רישומי הזמן שלו',
                  'עריכת הפרופיל האישי',
                  'שימוש בטיימר',
                ],
              },
            ]}
          />
        </div>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              הוספת עובד חדש
            </DialogTitle>
            <DialogDescription>
              הזן את פרטי העובד החדש. ישלח אליו אימייל לאיפוס סיסמה.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add_email">אימייל *</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="add_email"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className="pr-10"
                  dir="ltr"
                  placeholder="employee@example.com"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add_full_name">שם מלא *</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="add_full_name"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add_phone">טלפון</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="add_phone"
                    value={addForm.phone}
                    onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="add_hourly_rate">תעריף שעתי (₪)</Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="add_hourly_rate"
                    type="number"
                    value={addForm.hourly_rate}
                    onChange={(e) => setAddForm(f => ({ ...f, hourly_rate: e.target.value }))}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add_department">מחלקה</Label>
                <div className="relative">
                  <Building className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="add_department"
                    value={addForm.department}
                    onChange={(e) => setAddForm(f => ({ ...f, department: e.target.value }))}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="add_position">משרה</Label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="add_position"
                    value={addForm.position}
                    onChange={(e) => setAddForm(f => ({ ...f, position: e.target.value }))}
                    className="pr-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add_role">הרשאה</Label>
              <Select
                value={addForm.role}
                onValueChange={(value: 'admin' | 'manager' | 'employee') => setAddForm(f => ({ ...f, role: value }))}
              >
                <SelectTrigger className="bg-background">
                  <Shield className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-destructive" />
                      מנהל ראשי
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-secondary" />
                      מנהל
                    </div>
                  </SelectItem>
                  <SelectItem value="employee">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      עובד
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddEmployee} disabled={isAdding} className="btn-gold">
              {isAdding && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              הוסף עובד
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, employee: open ? editDialog.employee : null })}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              עריכת עובד
            </DialogTitle>
            <DialogDescription>
              עדכן את פרטי העובד והרשאותיו
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">שם מלא</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">טלפון</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hourly_rate">תעריף שעתי (₪)</Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={editForm.hourly_rate}
                    onChange={(e) => setEditForm(f => ({ ...f, hourly_rate: e.target.value }))}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">מחלקה</Label>
                <div className="relative">
                  <Building className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="department"
                    value={editForm.department}
                    onChange={(e) => setEditForm(f => ({ ...f, department: e.target.value }))}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">משרה</Label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="position"
                    value={editForm.position}
                    onChange={(e) => setEditForm(f => ({ ...f, position: e.target.value }))}
                    className="pr-10"
                  />
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="grid gap-2">
                <Label htmlFor="role">הרשאה</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: 'admin' | 'manager' | 'employee') => setEditForm(f => ({ ...f, role: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <Shield className="h-4 w-4 ml-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-destructive" />
                        מנהל ראשי
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-secondary" />
                        מנהל
                      </div>
                    </SelectItem>
                    <SelectItem value="employee">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        עובד
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="is_active">עובד פעיל</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, employee: null })}>
              ביטול
            </Button>
            <Button onClick={handleSaveEmployee} disabled={isSaving} className="btn-gold">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog 
        open={resetPasswordDialog.open} 
        onOpenChange={(open) => {
          setResetPasswordDialog({ open, employee: open ? resetPasswordDialog.employee : null });
          if (!open) {
            setNewPassword('');
            setShowPassword(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              איפוס סיסמה
            </DialogTitle>
            <DialogDescription>
              הזן סיסמה חדשה עבור {resetPasswordDialog.employee?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_password">סיסמה חדשה</Label>
              <div className="relative">
                <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new_password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10 pl-10"
                  dir="ltr"
                  placeholder="סיסמה חדשה (לפחות 6 תווים)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                הסיסמה חייבת להכיל לפחות 6 תווים
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setResetPasswordDialog({ open: false, employee: null });
                setNewPassword('');
                setShowPassword(false);
              }}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={isResetting || newPassword.length < 6}
              className="btn-gold"
            >
              {isResetting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              אפס סיסמה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
