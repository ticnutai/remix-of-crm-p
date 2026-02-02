// Employees Management Page - e-control CRM Pro
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ColumnDef } from '@/components/DataTable';
import { UniversalDataTable } from '@/components/tables/UniversalDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltipButton } from '@/components/ui/info-tooltip-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { formatPhoneDisplay } from '@/utils/phoneValidation';
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
  Trash2,
  FileText,
  Receipt,
  Printer,
  Calculator,
  Clock,
  Download,
} from 'lucide-react';

// Interface for time entries
interface TimeEntry {
  id: string;
  user_id: string;
  duration_minutes: number;
  start_time: string;
  description?: string;
}

// Interface for payroll calculation
interface PayrollData {
  employee: Employee;
  totalHours: number;
  hourlyRate: number;
  grossAmount: number;
  vatRate: number;
  vatAmount: number;
  netAmount: number;
  entries: TimeEntry[];
}

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
  const { user, isLoading: authLoading, isAdmin, isManager, roles } = useAuth();
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

  // Delete employee dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('employees');

  // Payroll state
  const [payrollMonth, setPayrollMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] = useState<string>('all');
  const [payrollHourlyRate, setPayrollHourlyRate] = useState<string>('');
  const [payrollVatRate, setPayrollVatRate] = useState<string>('17');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // Fetch time entries for payroll
  const fetchTimeEntries = useCallback(async () => {
    setLoadingPayroll(true);
    try {
      const [year, month] = payrollMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      let query = supabase
        .from('time_entries')
        .select('id, user_id, duration_minutes, start_time, description')
        .gte('start_time', startDate)
        .lte('start_time', endDate + 'T23:59:59');

      if (selectedEmployeeForPayroll !== 'all') {
        query = query.eq('user_id', selectedEmployeeForPayroll);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching time entries:', error);
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לטעון את רישומי הזמן',
          variant: 'destructive',
        });
        return;
      }

      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingPayroll(false);
    }
  }, [payrollMonth, selectedEmployeeForPayroll]);

  // Fetch time entries when payroll tab is active
  useEffect(() => {
    if (activeTab === 'payroll') {
      fetchTimeEntries();
    }
  }, [activeTab, fetchTimeEntries]);

  // Calculate payroll data
  const payrollData = useMemo(() => {
    const vatRate = parseFloat(payrollVatRate) || 0;
    
    // Group entries by employee
    const entriesByEmployee: Record<string, TimeEntry[]> = {};
    timeEntries.forEach(entry => {
      if (!entriesByEmployee[entry.user_id]) {
        entriesByEmployee[entry.user_id] = [];
      }
      entriesByEmployee[entry.user_id].push(entry);
    });

    // Calculate payroll for each employee
    const result: PayrollData[] = [];
    
    const employeeList = selectedEmployeeForPayroll === 'all' 
      ? employees 
      : employees.filter(e => e.id === selectedEmployeeForPayroll);

    employeeList.forEach(employee => {
      const employeeEntries = entriesByEmployee[employee.id] || [];
      const totalMinutes = employeeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
      const totalHours = totalMinutes / 60;
      
      // Use custom hourly rate if set, otherwise use employee's rate
      const hourlyRate = payrollHourlyRate 
        ? parseFloat(payrollHourlyRate) 
        : (employee.hourly_rate || 0);
      
      const grossAmount = totalHours * hourlyRate;
      const vatAmount = grossAmount * (vatRate / 100);
      const netAmount = grossAmount + vatAmount;

      if (totalHours > 0 || selectedEmployeeForPayroll !== 'all') {
        result.push({
          employee,
          totalHours,
          hourlyRate,
          grossAmount,
          vatRate,
          vatAmount,
          netAmount,
          entries: employeeEntries,
        });
      }
    });

    return result.sort((a, b) => b.netAmount - a.netAmount);
  }, [employees, timeEntries, payrollHourlyRate, payrollVatRate, selectedEmployeeForPayroll]);

  // Format month display in Hebrew
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                       'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    return `${monthNames[month - 1]} ${year}`;
  };

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

  // Handle delete employee
  const handleDeleteEmployee = async () => {
    if (!deleteDialog.employee) return;
    
    // Prevent deleting self
    if (deleteDialog.employee.id === user?.id) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את המשתמש שלך',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    try {
      // First, delete from user_roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deleteDialog.employee.id);

      if (rolesError) {
        console.error('Error deleting roles:', rolesError);
      }

      // Delete from time_entries (if any)
      const { error: timeError } = await supabase
        .from('time_entries')
        .delete()
        .eq('user_id', deleteDialog.employee.id);

      if (timeError) {
        console.error('Error deleting time_entries:', timeError);
      }

      // Then delete from profiles
      const { error: profileError, data: profileData } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteDialog.employee.id)
        .select();

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        toast({
          title: 'שגיאה',
          description: `לא ניתן למחוק את העובד: ${profileError.message}`,
          variant: 'destructive',
        });
        setIsDeleting(false);
        return;
      }

      // Check if anything was actually deleted
      if (!profileData || profileData.length === 0) {
        toast({
          title: 'שגיאה',
          description: 'המחיקה נחסמה - אין לך הרשאות מספיקות',
          variant: 'destructive',
        });
        setIsDeleting(false);
        return;
      }

      toast({
        title: 'עובד נמחק',
        description: `${deleteDialog.employee.full_name} הוסר בהצלחה`,
      });

      setDeleteDialog({ open: false, employee: null });
      setIsDeleting(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת העובד',
        variant: 'destructive',
      });
      setIsDeleting(false);
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
      cell: (value) => <span dir="ltr" className="font-mono">{formatPhoneDisplay(value)}</span>,
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
        <div className="flex items-center gap-1 min-w-[200px]">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
          >
            עריכה
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setResetPasswordDialog({ open: true, employee: row });
            }}
            title="איפוס סיסמה"
          >
            <KeyRound className="h-4 w-4 ml-1" />
            סיסמה
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialog({ open: true, employee: row });
            }}
            title="מחיקת עובד"
          >
            <Trash2 className="h-4 w-4 ml-1" />
            מחק
          </Button>
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
        { label: 'טלפון', value: formatPhoneDisplay(employee.phone), icon: Phone },
        { label: 'תעריף', value: employee.hourly_rate ? `₪${employee.hourly_rate}` : '-', icon: DollarSign },
      ]}
      actions={[
        ...(isManager ? [{ label: 'ערוך', icon: Edit, onClick: () => handleEditClick(employee) }] : []),
        ...(isManager ? [{ label: 'סיסמה', icon: KeyRound, onClick: () => setResetPasswordDialog({ open: true, employee }) }] : []),
        ...(isManager ? [{ label: 'מחק', icon: Trash2, onClick: () => setDeleteDialog({ open: true, employee }), variant: 'destructive' as const }] : []),
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
      <div className="p-6 md:p-8 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full sm:w-auto bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="employees" className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              <span>עובדים</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Receipt className="h-4 w-4" />
              <span>תלוש שכר</span>
            </TabsTrigger>
          </TabsList>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-8">
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
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-6">
            {/* Payroll Controls */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  הגדרות חישוב שכר
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      חודש
                    </Label>
                    <Input
                      type="month"
                      value={payrollMonth}
                      onChange={(e) => setPayrollMonth(e.target.value)}
                      className="text-center"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      עובד
                    </Label>
                    <Select
                      value={selectedEmployeeForPayroll}
                      onValueChange={setSelectedEmployeeForPayroll}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר עובד" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל העובדים</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      תעריף שעתי (₪)
                    </Label>
                    <Input
                      type="number"
                      value={payrollHourlyRate}
                      onChange={(e) => setPayrollHourlyRate(e.target.value)}
                      placeholder="מתעריף עובד"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">השאר ריק לשימוש בתעריף העובד</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      מע"מ (%)
                    </Label>
                    <Input
                      type="number"
                      value={payrollVatRate}
                      onChange={(e) => setPayrollVatRate(e.target.value)}
                      placeholder="17"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={fetchTimeEntries} disabled={loadingPayroll}>
                    {loadingPayroll && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    <Calculator className="h-4 w-4 ml-2" />
                    חשב
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payroll Summary */}
            {loadingPayroll ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : payrollData.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>לא נמצאו רישומי זמן לתקופה זו</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {payrollData.map((data) => (
                  <Card key={data.employee.id} className="card-elegant overflow-hidden">
                    {/* Payslip Header */}
                    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {data.employee.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{data.employee.full_name}</h3>
                            <p className="text-sm opacity-90">{data.employee.position || data.employee.email}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm opacity-90">תלוש שכר</p>
                          <p className="text-lg font-bold">{formatMonth(payrollMonth)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payslip Body */}
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Work Details */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                            <Clock className="h-5 w-5 text-primary" />
                            פירוט שעות
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">סה"כ שעות עבודה</span>
                              <span className="font-semibold text-lg">{data.totalHours.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">תעריף שעתי</span>
                              <span className="font-semibold">₪{data.hourlyRate.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span>מספר רישומים</span>
                              <span>{data.entries.length}</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                            <DollarSign className="h-5 w-5 text-success" />
                            פירוט תשלום
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">סכום ברוטו</span>
                              <span className="font-semibold">₪{data.grossAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">מע"מ ({data.vatRate}%)</span>
                              <span className="font-semibold text-orange-500">₪{data.vatAmount.toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-border my-2" />
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-lg">סה"כ לתשלום</span>
                              <span className="font-bold text-2xl text-success">₪{data.netAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const printContent = `
                              <html dir="rtl">
                              <head>
                                <title>תלוש שכר - ${data.employee.full_name}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 40px; }
                                  .header { background: linear-gradient(to right, #3b82f6, #60a5fa); color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
                                  .header h1 { margin: 0; font-size: 24px; }
                                  .header p { margin: 4px 0 0; opacity: 0.9; }
                                  .section { margin-bottom: 24px; }
                                  .section h3 { border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px; }
                                  .row { display: flex; justify-content: space-between; padding: 8px 0; }
                                  .total { font-size: 20px; font-weight: bold; color: #22c55e; }
                                  .divider { border-top: 1px solid #e5e7eb; margin: 12px 0; }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <h1>${data.employee.full_name}</h1>
                                  <p>תלוש שכר - ${formatMonth(payrollMonth)}</p>
                                </div>
                                <div class="section">
                                  <h3>פירוט שעות</h3>
                                  <div class="row"><span>סה"כ שעות עבודה</span><span>${data.totalHours.toFixed(2)}</span></div>
                                  <div class="row"><span>תעריף שעתי</span><span>₪${data.hourlyRate.toFixed(2)}</span></div>
                                  <div class="row"><span>מספר רישומים</span><span>${data.entries.length}</span></div>
                                </div>
                                <div class="section">
                                  <h3>פירוט תשלום</h3>
                                  <div class="row"><span>סכום ברוטו</span><span>₪${data.grossAmount.toFixed(2)}</span></div>
                                  <div class="row"><span>מע"מ (${data.vatRate}%)</span><span>₪${data.vatAmount.toFixed(2)}</span></div>
                                  <div class="divider"></div>
                                  <div class="row"><span>סה"כ לתשלום</span><span class="total">₪${data.netAmount.toFixed(2)}</span></div>
                                </div>
                              </body>
                              </html>
                            `;
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(printContent);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }}
                        >
                          <Printer className="h-4 w-4 ml-2" />
                          הדפס
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Total Summary */}
                {payrollData.length > 1 && (
                  <Card className="card-elegant bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">סיכום כולל</h3>
                            <p className="text-sm text-muted-foreground">{payrollData.length} עובדים • {formatMonth(payrollMonth)}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">סה"כ לתשלום</p>
                          <p className="text-3xl font-bold text-primary">
                            ₪{payrollData.reduce((sum, d) => sum + d.netAmount, 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payrollData.reduce((sum, d) => sum + d.totalHours, 0).toFixed(1)} שעות
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
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

      {/* Delete Employee Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDeleteDialog({ open, employee: open ? deleteDialog.employee : null });
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              מחיקת עובד
            </DialogTitle>
            <DialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק את{' '}
              <span className="font-semibold">{deleteDialog.employee?.full_name}</span>?
              <br />
              <span className="text-red-600 font-semibold">פעולה זו היא בלתי הפיכה!</span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, employee: null })}
              disabled={isDeleting}
            >
              ביטול
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteEmployee}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              מחק עובד
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
