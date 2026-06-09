// Employees Management Page - tenarch CRM Pro
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { ColumnDef } from "@/components/DataTable";
import { UniversalDataTable } from "@/components/tables/UniversalDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltipButton } from "@/components/ui/info-tooltip-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClients } from "@/hooks/useClients";
import { useEmployeeClientAssignments } from "@/hooks/useEmployeeClientAssignments";
import {
  ViewToggle,
  useViewMode,
  GridView,
  ListView,
  CompactView,
  type ViewMode,
} from "@/components/shared/ViewToggle";
import { MobileCard } from "@/components/shared/MobileCard";
import { PullToRefresh } from "@/components/shared/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPhoneDisplay } from "@/utils/phoneValidation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PermissionsMatrix } from "@/components/employees/PermissionsMatrix";
import { UserApprovalsTab } from "@/components/employees/UserApprovalsTab";
import { AddEmployeePanel } from "@/components/employees/AddEmployeePanel";
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
  Pencil,
  Calendar,
  Trash2,
  FileText,
  Receipt,
  Printer,
  Calculator,
  Clock,
  Download,
  UsersRound,
  Search,
  X,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface PayrollRunRecord {
  id: string;
  employee_id: string;
  period_year: number;
  period_month: number;
  worked_hours: number | null;
  overtime_hours_125: number | null;
  overtime_hours_150: number | null;
  gross_total: number | null;
  net_total: number | null;
  status: string;
  created_at: string;
}

interface PayrollEmployeeLink {
  employeeId: string;
  name: string;
  userId: string | null;
  profileId: string | null;
  position: string | null;
  email: string | null;
}

interface PayrollRunView extends PayrollRunRecord {
  employeeDisplayName: string;
  employeeSubtitle: string;
  attendanceUserId: string | null;
}

interface Employee {
  id: string;
  employee_id: string | null;
  user_id: string | null;
  profile_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  role: "admin" | "super_manager" | "manager" | "employee";
  custom_data?: Record<string, any> | null;
}

const roleConfig = {
  admin: {
    label: "אדמין",
    icon: Crown,
    color: "bg-red-600 text-white",
  },
  super_manager: {
    label: "מנהל על",
    icon: Crown,
    color: "bg-destructive text-destructive-foreground",
  },
  manager: {
    label: "מנהל",
    icon: UserCog,
    color: "bg-secondary text-secondary-foreground",
  },
  employee: {
    label: "עובד",
    icon: User,
    color: "bg-muted text-muted-foreground",
  },
};

const defaultRoleConfig = {
  label: "עובד",
  icon: User,
  color: "bg-muted text-muted-foreground",
};
const getRoleConfig = (role: string | undefined | null) =>
  roleConfig[role as keyof typeof roleConfig] ?? defaultRoleConfig;

export default function Employees() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin, isManager, roles } = useAuth();
  const isMobile = useIsMobile();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useViewMode("employees-view-mode", "cards");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    employee: Employee | null;
  }>({
    open: false,
    employee: null,
  });
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    department: "",
    position: "",
    hourly_rate: "",
    is_active: true,
    role: "employee" as "admin" | "super_manager" | "manager" | "employee",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Add employee dialog
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    department: "",
    position: "",
    hourly_rate: "",
    role: "employee" as "admin" | "super_manager" | "manager" | "employee",
  });
  const [isAdding, setIsAdding] = useState(false);

  // Password reset dialog
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{
    open: boolean;
    employee: Employee | null;
  }>({
    open: false,
    employee: null,
  });
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Delete employee dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    employee: Employee | null;
  }>({
    open: false,
    employee: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Client assignment dialog
  const [clientAssignDialog, setClientAssignDialog] = useState<{
    open: boolean;
    employee: Employee | null;
  }>({
    open: false,
    employee: null,
  });
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(
    new Set(),
  );
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isSavingClients, setIsSavingClients] = useState(false);

  // Hooks for clients and assignments
  const { clients: allClients, loading: loadingClients } = useClients();
  const {
    assignments: currentAssignments,
    isLoading: loadingAssignments,
    fetchAssignments,
    fetchAllAssignments,
    setClientAssignments,
  } = useEmployeeClientAssignments();

  // All assignments map: employeeId -> count
  const [allAssignmentsMap, setAllAssignmentsMap] = useState<
    Record<string, number>
  >({});

  // Fetch all assignments on mount to show counts
  useEffect(() => {
    const loadAllAssignments = async () => {
      const all = await fetchAllAssignments();
      const map: Record<string, number> = {};
      (all || []).forEach((a: any) => {
        map[a.employee_id] = (map[a.employee_id] || 0) + 1;
      });
      setAllAssignmentsMap(map);
    };
    if (user) loadAllAssignments();
  }, [user, fetchAllAssignments]);

  // Tab state
  const [activeTab, setActiveTab] = useState("employees");

  // Payroll state
  const [payrollMonth, setPayrollMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] =
    useState<string>("all");
  const [payrollRuns, setPayrollRuns] = useState<PayrollRunRecord[]>([]);
  const [payrollEmployeeLinks, setPayrollEmployeeLinks] = useState<
    Record<string, PayrollEmployeeLink>
  >({});
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // Fetch saved payroll runs only (single source of truth)
  const fetchPayrollRuns = useCallback(async () => {
    setLoadingPayroll(true);
    try {
      const [year, month] = payrollMonth.split("-").map(Number);
      if (!year || !month) {
        setPayrollRuns([]);
        setPayrollEmployeeLinks({});
        return;
      }

      const { data: employeeRows, error: employeeError } = await supabase
        .from("employees")
        .select("id, name, user_id, profile_id, position, email")
        .eq("is_active", true);

      if (employeeError) {
        throw employeeError;
      }

      const linkMap: Record<string, PayrollEmployeeLink> = {};
      (employeeRows || []).forEach((row: any) => {
        linkMap[row.id] = {
          employeeId: row.id,
          name: row.name || "עובד",
          userId: row.user_id ?? null,
          profileId: row.profile_id ?? null,
          position: row.position ?? null,
          email: row.email ?? null,
        };
      });
      setPayrollEmployeeLinks(linkMap);

      let employeeIdsFilter: string[] | null = null;
      if (selectedEmployeeForPayroll !== "all") {
        employeeIdsFilter = Object.values(linkMap)
          .filter(
            (link) =>
              link.userId === selectedEmployeeForPayroll ||
              link.profileId === selectedEmployeeForPayroll,
          )
          .map((link) => link.employeeId);

        if (employeeIdsFilter.length === 0) {
          setPayrollRuns([]);
          return;
        }
      }

      let query = supabase
        .from("payroll_runs")
        .select(
          "id, employee_id, period_year, period_month, worked_hours, overtime_hours_125, overtime_hours_150, gross_total, net_total, status, created_at",
        )
        .eq("period_year", year)
        .eq("period_month", month);

      if (employeeIdsFilter) {
        query = query.in("employee_id", employeeIdsFilter);
      }

      const { data, error } = await query.order("net_total", {
        ascending: false,
      });

      if (error) {
        throw error;
      }

      setPayrollRuns((data || []) as PayrollRunRecord[]);
    } catch (error: any) {
      console.error("Error fetching payroll runs:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון תלושי שכר שמורים",
        variant: "destructive",
      });
    } finally {
      setLoadingPayroll(false);
    }
  }, [payrollMonth, selectedEmployeeForPayroll]);

  // Fetch payroll runs when payroll tab is active
  useEffect(() => {
    if (activeTab === "payroll") {
      fetchPayrollRuns();
    }
  }, [activeTab, fetchPayrollRuns]);

  const payrollRunsView = useMemo<PayrollRunView[]>(() => {
    return payrollRuns
      .map((run) => {
        const link = payrollEmployeeLinks[run.employee_id];
        const matchedProfile = employees.find(
          (employee) =>
            employee.id === link?.userId || employee.id === link?.profileId,
        );

        const employeeDisplayName =
          link?.name || matchedProfile?.full_name || "עובד לא מזוהה";
        const employeeSubtitle =
          link?.position ||
          matchedProfile?.position ||
          link?.email ||
          matchedProfile?.email ||
          "";

        return {
          ...run,
          employeeDisplayName,
          employeeSubtitle,
          attendanceUserId: link?.userId || link?.profileId || null,
        };
      })
      .sort((a, b) => Number(b.net_total || 0) - Number(a.net_total || 0));
  }, [payrollRuns, payrollEmployeeLinks, employees]);

  const payrollSummary = useMemo(() => {
    return payrollRunsView.reduce(
      (acc, run) => {
        acc.totalNet += Number(run.net_total ?? 0);
        acc.totalGross += Number(run.gross_total ?? 0);
        acc.totalHours += Number(run.worked_hours ?? 0);
        return acc;
      },
      { totalNet: 0, totalGross: 0, totalHours: 0 },
    );
  }, [payrollRunsView]);

  // Format month display in Hebrew
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const monthNames = [
      "ינואר",
      "פברואר",
      "מרץ",
      "אפריל",
      "מאי",
      "יוני",
      "יולי",
      "אוגוסט",
      "ספטמבר",
      "אוקטובר",
      "נובמבר",
      "דצמבר",
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const navigateToAttendanceForPayroll = useCallback((employeeId: string) => {
    const [year, month] = payrollMonth.split("-").map(Number);
    const params = new URLSearchParams({
      tab: "timesheet",
      employeeId,
    });

    if (Number.isFinite(year) && Number.isFinite(month)) {
      params.set("year", String(year));
      params.set("month", String(month));
    }

    navigate(`/attendance/admin?${params.toString()}`);
  }, [navigate, payrollMonth]);

  const formatNIS = (value: number | null | undefined) => {
    return `₪${Number(value ?? 0).toFixed(2)}`;
  };

  const getPayrollStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "שולם";
      case "final":
        return "סופי";
      case "draft":
        return "טיוטה";
      case "cancelled":
        return "בוטל";
      default:
        return status;
    }
  };

  const getPayrollStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
      case "final":
        return "default" as const;
      case "draft":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const getEmployeeUserId = (employee: Employee) =>
    employee.user_id || employee.profile_id || null;

  const getEmployeeProfileId = (employee: Employee) =>
    employee.profile_id || employee.user_id || null;

  // Fetch employees with their roles
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profilesRes, employeesRes, rolesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, email, full_name, phone, department, position, hourly_rate, is_active, created_at, custom_data",
          )
          .order("full_name"),
        supabase
          .from("employees")
          .select(
            "id, user_id, profile_id, name, email, phone, department, position, hourly_rate, is_active, created_at",
          ),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profilesRes.error) {
        throw profilesRes.error;
      }
      if (employeesRes.error) {
        throw employeesRes.error;
      }
      if (rolesRes.error) {
        console.error("Error fetching roles:", rolesRes.error);
      }

      const rolePriority: Record<Employee["role"], number> = {
        employee: 1,
        manager: 2,
        super_manager: 3,
        admin: 4,
      };
      const rolesMap: Record<string, Employee["role"]> = {};
      (rolesRes.data || []).forEach((row: any) => {
        const role = row.role as Employee["role"];
        const current = rolesMap[row.user_id] || "employee";
        if ((rolePriority[role] || 0) >= (rolePriority[current] || 0)) {
          rolesMap[row.user_id] = role;
        }
      });

      const employeeRows = (employeesRes.data || []) as Array<{
        id: string;
        user_id: string | null;
        profile_id: string | null;
        name: string | null;
        email: string | null;
        phone: string | null;
        department: string | null;
        position: string | null;
        hourly_rate: number | null;
        is_active: boolean | null;
        created_at: string | null;
      }>;

      const byAuthId = new Map<string, (typeof employeeRows)[number]>();
      employeeRows.forEach((row) => {
        if (row.profile_id) byAuthId.set(row.profile_id, row);
        if (row.user_id) byAuthId.set(row.user_id, row);
      });

      const seenEmployeeIds = new Set<string>();
      const merged: Employee[] = (profilesRes.data || []).map((profile: any) => {
        const linkedEmployee = byAuthId.get(profile.id);
        if (linkedEmployee?.id) {
          seenEmployeeIds.add(linkedEmployee.id);
        }

        const resolvedUserId = linkedEmployee?.user_id || profile.id;

        return {
          id: profile.id,
          employee_id: linkedEmployee?.id || null,
          user_id: resolvedUserId,
          profile_id: linkedEmployee?.profile_id || profile.id,
          email: (linkedEmployee?.email || profile.email || "") as string,
          full_name:
            (linkedEmployee?.name || profile.full_name || profile.email || "ללא שם") as string,
          phone: (linkedEmployee?.phone ?? profile.phone ?? null) as string | null,
          department: (linkedEmployee?.department ?? profile.department ?? null) as string | null,
          position: (linkedEmployee?.position ?? profile.position ?? null) as string | null,
          hourly_rate:
            typeof linkedEmployee?.hourly_rate === "number"
              ? linkedEmployee.hourly_rate
              : (profile.hourly_rate as number | null),
          is_active:
            typeof linkedEmployee?.is_active === "boolean"
              ? linkedEmployee.is_active
              : Boolean(profile.is_active),
          created_at:
            linkedEmployee?.created_at || profile.created_at || new Date().toISOString(),
          role: rolesMap[resolvedUserId] || "employee",
          custom_data: (profile.custom_data as Record<string, any>) || {},
        };
      });

      employeeRows.forEach((row) => {
        if (seenEmployeeIds.has(row.id)) return;
        const authId = row.profile_id || row.user_id || row.id;
        if (merged.some((employee) => employee.id === authId)) return;

        merged.push({
          id: authId,
          employee_id: row.id,
          user_id: row.user_id || null,
          profile_id: row.profile_id || null,
          email: row.email || "",
          full_name: row.name || row.email || "ללא שם",
          phone: row.phone,
          department: row.department,
          position: row.position,
          hourly_rate: row.hourly_rate,
          is_active: row.is_active ?? true,
          created_at: row.created_at || new Date().toISOString(),
          role: (row.user_id ? rolesMap[row.user_id] : undefined) || "employee",
          custom_data: null,
        });
      });

      merged.sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "", "he"),
      );
      setEmployees(merged);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת העובדים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchEmployees();
    }
  }, [user, authLoading, fetchEmployees]);

  const handleEditClick = (employee: Employee) => {
    setEditForm({
      full_name: employee.full_name,
      phone: employee.phone || "",
      department: employee.department || "",
      position: employee.position || "",
      hourly_rate: employee.hourly_rate?.toString() || "",
      is_active: employee.is_active ?? true,
      role: employee.role,
    });
    setEditDialog({ open: true, employee });
  };

  const handleSaveEmployee = async () => {
    if (!editDialog.employee) return;

    setIsSaving(true);

    const targetEmployee = editDialog.employee;
    const userId = getEmployeeUserId(targetEmployee);
    const profileId = getEmployeeProfileId(targetEmployee);
    const parsedHourlyRate = editForm.hourly_rate
      ? parseFloat(editForm.hourly_rate)
      : null;

    let employeeRecordId = targetEmployee.employee_id;

    try {
      const employeePayload = {
        user_id: userId,
        profile_id: profileId,
        name: editForm.full_name,
        email: targetEmployee.email || null,
        phone: editForm.phone || null,
        department: editForm.department || null,
        position: editForm.position || null,
        hourly_rate: parsedHourlyRate,
        is_active: editForm.is_active,
        status: editForm.is_active ? "active" : "inactive",
      };

      if (!employeeRecordId) {
        const orFilters = [
          profileId ? `profile_id.eq.${profileId}` : null,
          userId ? `user_id.eq.${userId}` : null,
        ].filter(Boolean) as string[];

        if (orFilters.length > 0) {
          const { data: existingEmployeeRows, error: existingEmployeeError } =
            await supabase
              .from("employees")
              .select("id")
              .or(orFilters.join(","))
              .limit(1);

          if (existingEmployeeError) {
            throw existingEmployeeError;
          }

          employeeRecordId = existingEmployeeRows?.[0]?.id ?? null;
        }
      }

      if (employeeRecordId) {
        const { error: employeeUpdateError } = await supabase
          .from("employees")
          .update(employeePayload)
          .eq("id", employeeRecordId);
        if (employeeUpdateError) throw employeeUpdateError;
      } else {
        const { error: employeeInsertError } = await supabase
          .from("employees")
          .insert(employeePayload);
        if (employeeInsertError) throw employeeInsertError;
      }

      if (profileId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: editForm.full_name,
            phone: editForm.phone || null,
            is_active: editForm.is_active,
            department: editForm.department || null,
            position: editForm.position || null,
            hourly_rate: parsedHourlyRate,
          })
          .eq("id", profileId);

        if (profileError) {
          throw profileError;
        }
      }

      if (isAdmin && userId && editForm.role !== editDialog.employee.role) {
        await supabase.from("user_roles").delete().eq("user_id", userId);

        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: editForm.role,
        });

        if (roleError) {
          console.error("Error updating role:", roleError);
          toast({
            title: "אזהרה",
            description: "פרטי העובד עודכנו אך לא ניתן לעדכן את ההרשאה",
            variant: "destructive",
          });
        }
      }

      if (!profileId) {
        toast({
          title: "עודכן חלקית",
          description: "הרשומה אינה מקושרת לפרופיל התחברות. עודכנו רק נתוני עובדים.",
        });
      }

      toast({
        title: "העובד עודכן",
        description: "פרטי העובד נשמרו בהצלחה",
      });

      setEditDialog({ open: false, employee: null });
      fetchEmployees();
    } catch (error: any) {
      console.error("Error updating employee:", error);
      toast({
        title: "שגיאה",
        description: error?.message || "לא ניתן לעדכן את פרטי העובד",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!addForm.email || !addForm.full_name) {
      toast({
        title: "שגיאה",
        description: "נא למלא אימייל ושם מלא",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      // Call Edge Function to create employee
      const { data, error } = await supabase.functions.invoke(
        "create-employee",
        {
          body: {
            email: addForm.email,
            full_name: addForm.full_name,
            phone: addForm.phone || null,
            department: addForm.department || null,
            position: addForm.position || null,
            hourly_rate: addForm.hourly_rate
              ? parseFloat(addForm.hourly_rate)
              : null,
            role: addForm.role,
          },
        },
      );

      if (error) {
        console.error("Error creating employee:", error);
        toast({
          title: "שגיאה",
          description: error.message || "לא ניתן ליצור עובד חדש",
          variant: "destructive",
        });
        setIsAdding(false);
        return;
      }

      if (!data?.success) {
        toast({
          title: "שגיאה",
          description: data?.error || "לא ניתן ליצור עובד חדש",
          variant: "destructive",
        });
        setIsAdding(false);
        return;
      }

      const message = data.is_existing_user
        ? `משתמש קיים ${addForm.full_name} נוסף כעובד בהצלחה`
        : `עובד חדש ${addForm.full_name} נוסף בהצלחה. נשלח אליו אימייל לאיפוס סיסמה.`;

      toast({
        title: "עובד נוסף",
        description: message,
      });

      setAddDialog(false);
      setAddForm({
        email: "",
        full_name: "",
        phone: "",
        department: "",
        position: "",
        hourly_rate: "",
        role: "employee",
      });
      setIsAdding(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת העובד",
        variant: "destructive",
      });
      setIsAdding(false);
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async () => {
    if (!deleteDialog.employee) return;

    const targetEmployee = deleteDialog.employee;
    const userId = getEmployeeUserId(targetEmployee);
    const profileId = getEmployeeProfileId(targetEmployee);

    // Prevent deleting self
    if (userId && userId === user?.id) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את המשתמש שלך",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      if (userId) {
        const { error: rolesError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        if (rolesError) {
          console.error("Error deleting roles:", rolesError);
        }
      }

      if (userId) {
        const { error: timeError } = await supabase
          .from("time_entries")
          .delete()
          .eq("user_id", userId);

        if (timeError) {
          console.error("Error deleting time_entries:", timeError);
        }
      }

      if (profileId) {
        await supabase
          .from("employee_client_assignments")
          .delete()
          .eq("employee_id", profileId);
      }

      if (targetEmployee.employee_id) {
        await supabase
          .from("employees")
          .delete()
          .eq("id", targetEmployee.employee_id);
      } else {
        const orFilters = [
          profileId ? `profile_id.eq.${profileId}` : null,
          userId ? `user_id.eq.${userId}` : null,
        ].filter(Boolean) as string[];

        if (orFilters.length > 0) {
          await supabase
            .from("employees")
            .delete()
            .or(orFilters.join(","));
        } else {
          await supabase
            .from("employees")
            .delete()
            .eq("id", targetEmployee.id);
        }
      }

      if (profileId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", profileId);

        if (profileError) {
          console.error("Error deleting profile:", profileError);
          toast({
            title: "שגיאה",
            description: `לא ניתן למחוק את העובד: ${profileError.message}`,
            variant: "destructive",
          });
          setIsDeleting(false);
          return;
        }
      }

      toast({
        title: "עובד נמחק",
        description: `${deleteDialog.employee.full_name} הוסר בהצלחה`,
      });

      setDeleteDialog({ open: false, employee: null });
      setIsDeleting(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת העובד",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!resetPasswordDialog.employee || !newPassword) {
      toast({
        title: "שגיאה",
        description: "נא להזין סיסמה חדשה",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "שגיאה",
        description: "הסיסמה חייבת להכיל לפחות 6 תווים",
        variant: "destructive",
      });
      return;
    }

    const targetUserId = getEmployeeUserId(resetPasswordDialog.employee);
    if (!targetUserId) {
      toast({
        title: "לא ניתן לאפס סיסמה",
        description: "העובד אינו מקושר למשתמש התחברות.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      // Reset password via admin-reset-password edge function (uses Supabase Admin API)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("לא מחובר");

      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: targetUserId,
          newPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "שגיאה בעדכון סיסמה");
      }

      toast({
        title: "הסיסמה אופסה בהצלחה",
        description: `הסיסמה של ${resetPasswordDialog.employee.full_name} עודכנה`,
      });

      setResetPasswordDialog({ open: false, employee: null });
      setNewPassword("");
      setShowPassword(false);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה באיפוס הסיסמה",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Handle open client assignment dialog
  const handleOpenClientAssign = async (employee: Employee) => {
    const profileId = getEmployeeProfileId(employee);
    if (!profileId) {
      toast({
        title: "לא ניתן להקצות לקוחות",
        description: "העובד אינו מקושר לפרופיל התחברות.",
        variant: "destructive",
      });
      return;
    }

    setClientAssignDialog({ open: true, employee });
    setClientSearchQuery("");
    setIsSavingClients(false);

    // Fetch current assignments for this employee
    const current = await fetchAssignments(profileId);
    const ids = new Set<string>((current || []).map((a: any) => a.client_id));
    setSelectedClientIds(ids);
  };

  // Handle save client assignments
  const handleSaveClientAssignments = async () => {
    if (!clientAssignDialog.employee) return;

    setIsSavingClients(true);
    const profileId = getEmployeeProfileId(clientAssignDialog.employee);
    if (!profileId) {
      toast({
        title: "שגיאה",
        description: "לא נמצא פרופיל מקושר לעובד.",
        variant: "destructive",
      });
      setIsSavingClients(false);
      return;
    }

    const success = await setClientAssignments(
      profileId,
      Array.from(selectedClientIds),
      user?.id,
    );

    if (success) {
      toast({
        title: "לקוחות עודכנו",
        description: `הוקצו ${selectedClientIds.size} לקוחות ל${clientAssignDialog.employee.full_name}`,
      });

      // Update the all-assignments map
      setAllAssignmentsMap((prev) => ({
        ...prev,
        [clientAssignDialog.employee!.id]: selectedClientIds.size,
      }));

      setClientAssignDialog({ open: false, employee: null });
    } else {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את הלקוחות המוקצים",
        variant: "destructive",
      });
    }

    setIsSavingClients(false);
  };

  // Toggle a client in the selection
  const toggleClient = (clientId: string) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  // Select/deselect all clients
  const toggleAllClients = () => {
    const filtered = filteredClientsForAssign;
    const allSelected = filtered.every((c) => selectedClientIds.has(c.id));
    if (allSelected) {
      setSelectedClientIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedClientIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  // Filtered clients for the assignment dialog
  const filteredClientsForAssign = useMemo(() => {
    if (!clientSearchQuery.trim()) return allClients;
    const q = clientSearchQuery.toLowerCase();
    return allClients.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.company?.toLowerCase().includes(q),
    );
  }, [allClients, clientSearchQuery]);

  const columns: ColumnDef<Employee>[] = [
    {
      id: "full_name",
      header: "שם מלא",
      accessorKey: "full_name",
      sortable: true,
      cell: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium">
            {value?.charAt(0) || "?"}
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "תפקיד",
      accessorKey: "role",
      sortable: true,
      cell: (value) => {
        const config = getRoleConfig(value as string);
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
      id: "position",
      header: "משרה",
      accessorKey: "position",
      cell: (value) => value || null,
    },
    {
      id: "department",
      header: "מחלקה",
      accessorKey: "department",
      cell: (value) => value || null,
    },
    {
      id: "phone",
      header: "טלפון",
      accessorKey: "phone",
      cell: (value) => (
        <span dir="ltr" className="font-mono">
          {formatPhoneDisplay(value)}
        </span>
      ),
    },
    {
      id: "hourly_rate",
      header: "תעריף שעתי",
      accessorKey: "hourly_rate",
      sortable: true,
      align: "center",
      cell: (value) =>
        value ? (
          <span className="font-medium text-success">₪{value}</span>
        ) : null,
    },
    {
      id: "is_active",
      header: "סטטוס",
      accessorKey: "is_active",
      cell: (value) => (
        <Badge
          variant={value ? "default" : "secondary"}
          className={value ? "bg-success" : ""}
        >
          {value ? "פעיל" : "לא פעיל"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "פעולות",
      accessorKey: "id",
      cell: (_, row) => (
        <div className="flex items-center gap-1 min-w-[260px]">
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
              handleOpenClientAssign(row);
            }}
            title="הקצאת לקוחות"
            className="relative"
          >
            <UsersRound className="h-4 w-4 ml-1" />
            לקוחות
            {(allAssignmentsMap[row.id] || 0) > 0 && (
              <Badge
                variant="secondary"
                className="mr-1 px-1.5 py-0 text-xs min-w-[18px] h-[18px] rounded-full"
              >
                {allAssignmentsMap[row.id]}
              </Badge>
            )}
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
    active: employees.filter((e) => e.is_active).length,
    admins: employees.filter((e) => e.role === "admin").length,
    managers: employees.filter((e) => e.role === "manager").length,
  };

  // Render functions for different view modes
  const renderEmployeeCard = (employee: Employee) => (
    <MobileCard
      key={employee.id}
      title={employee.full_name}
      subtitle={`${getRoleConfig(employee.role).label} • ${employee.email}`}
      status={{
        label: employee.is_active ? "פעיל" : "לא פעיל",
        variant: employee.is_active ? "default" : "secondary",
      }}
      fields={[
        { label: "משרה", value: employee.position || "-", icon: Briefcase },
        { label: "מחלקה", value: employee.department || "-", icon: Building },
        {
          label: "טלפון",
          value: formatPhoneDisplay(employee.phone),
          icon: Phone,
        },
        {
          label: "תעריף",
          value: employee.hourly_rate ? `₪${employee.hourly_rate}` : "-",
          icon: DollarSign,
        },
      ]}
      actions={[
        ...(isManager
          ? [
              {
                label: "ערוך",
                icon: Pencil,
                onClick: () => handleEditClick(employee),
              },
            ]
          : []),
        ...(isManager
          ? [
              {
                label: `לקוחות${(allAssignmentsMap[employee.id] || 0) > 0 ? ` (${allAssignmentsMap[employee.id]})` : ""}`,
                icon: UsersRound,
                onClick: () => handleOpenClientAssign(employee),
              },
            ]
          : []),
        ...(isManager
          ? [
              {
                label: "סיסמה",
                icon: KeyRound,
                onClick: () => setResetPasswordDialog({ open: true, employee }),
              },
            ]
          : []),
        ...(isManager
          ? [
              {
                label: "מחק",
                icon: Trash2,
                onClick: () => setDeleteDialog({ open: true, employee }),
                variant: "destructive" as const,
              },
            ]
          : []),
      ]}
    />
  );

  const renderEmployeeGrid = (employee: Employee) => (
    <Card
      key={employee.id}
      className="card-elegant hover:shadow-lg transition-all cursor-pointer"
      onClick={() => handleEditClick(employee)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium">
              {employee.full_name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">
                {employee.full_name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {employee.email}
              </p>
            </div>
          </div>
          <Badge className={getRoleConfig(employee.role).color}>
            {React.createElement(getRoleConfig(employee.role).icon, {
              className: "h-3 w-3 ml-1",
            })}
            {getRoleConfig(employee.role).label}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {employee.position || "ללא משרה"}
          </span>
          <Badge
            variant={employee.is_active ? "default" : "secondary"}
            className={employee.is_active ? "bg-success" : ""}
          >
            {employee.is_active ? "פעיל" : "לא פעיל"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmployeeList = (employee: Employee) => (
    <div
      key={employee.id}
      className="flex items-center justify-between gap-4 hover:bg-muted/50 p-3 rounded-lg cursor-pointer transition-colors"
      onClick={() => handleEditClick(employee)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium flex-shrink-0">
          {employee.full_name?.charAt(0) || "?"}
        </div>
        <div className="min-w-0">
          <h3 className="font-medium truncate">{employee.full_name}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3" />
              {employee.email}
            </span>
            {employee.position && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {employee.position}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={getRoleConfig(employee.role).color}>
          {getRoleConfig(employee.role).label}
        </Badge>
        <Badge
          variant={employee.is_active ? "default" : "secondary"}
          className={employee.is_active ? "bg-success" : ""}
        >
          {employee.is_active ? "פעיל" : "לא פעיל"}
        </Badge>
      </div>
    </div>
  );

  const renderEmployeeCompact = (employee: Employee) => (
    <div
      key={employee.id}
      className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer transition-colors rounded"
      onClick={() => handleEditClick(employee)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-medium truncate">{employee.full_name}</span>
        <span className="text-sm text-muted-foreground truncate hidden sm:inline">
          ({employee.email})
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className={getRoleConfig(employee.role).color}>
          {getRoleConfig(employee.role).label}
        </Badge>
        <div
          className={`w-2 h-2 rounded-full ${employee.is_active ? "bg-success" : "bg-muted-foreground"}`}
        />
      </div>
    </div>
  );

  if (!authLoading && !user) return null;

  return (
    <AppLayout title="ניהול עובדים">
      <div className="p-6 md:p-8 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full sm:w-auto bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="employees"
              className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              <span>עובדים</span>
            </TabsTrigger>
            <TabsTrigger
              value="payroll"
              className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Receipt className="h-4 w-4" />
              <span>תלוש שכר</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="permissions"
                className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Shield className="h-4 w-4" />
                <span>הרשאות</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger
                value="approvals"
                className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>אישור משתמשים</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        סה"כ עובדים
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.total}
                      </p>
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
                      <p className="text-sm text-muted-foreground mb-1">
                        עובדים פעילים
                      </p>
                      <p className="text-2xl font-bold text-success">
                        {stats.active}
                      </p>
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
                      <p className="text-sm text-muted-foreground mb-1">
                        מנהלים
                      </p>
                      <p className="text-2xl font-bold text-secondary">
                        {stats.managers}
                      </p>
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
                      <p className="text-sm text-muted-foreground mb-1">
                        מנהלים ראשיים
                      </p>
                      <p className="text-2xl font-bold text-destructive">
                        {stats.admins}
                      </p>
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
                    <Button
                      className="btn-gold flex-1 sm:flex-none"
                      onClick={() => setAddDialog(true)}
                    >
                      <UserPlus className="h-4 w-4 ml-2" />
                      {isMobile ? "הוסף" : "הזמן עובד חדש"}
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
              ) : viewMode === "cards" ? (
                <PullToRefresh onRefresh={fetchEmployees}>
                  <div className="space-y-3">
                    {employees.map((employee) => renderEmployeeCard(employee))}
                  </div>
                </PullToRefresh>
              ) : viewMode === "grid" ? (
                <GridView
                  data={employees}
                  renderItem={(employee) => renderEmployeeGrid(employee)}
                  keyExtractor={(employee) => employee.id}
                  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
                  gap={4}
                />
              ) : viewMode === "list" ? (
                <Card>
                  <ListView
                    data={employees}
                    renderItem={(employee) => renderEmployeeList(employee)}
                    keyExtractor={(employee) => employee.id}
                    divided
                  />
                </Card>
              ) : viewMode === "compact" ? (
                <Card>
                  <CompactView
                    data={employees}
                    renderItem={(employee) => renderEmployeeCompact(employee)}
                    keyExtractor={(employee) => employee.id}
                  />
                </Card>
              ) : viewMode === "table" ? (
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
                    title: "מנהל ראשי (Admin)",
                    icon: <Crown className="h-4 w-4" />,
                    variant: "destructive",
                    items: [
                      "גישה מלאה לכל המערכת",
                      "ניהול הרשאות עובדים",
                      "מחיקת לקוחות ופרויקטים",
                      "צפייה בכל רישומי הזמן",
                    ],
                  },
                  {
                    title: "מנהל (Manager)",
                    icon: <UserCog className="h-4 w-4" />,
                    variant: "secondary",
                    items: [
                      "הוספה ועריכת לקוחות",
                      "הוספה ועריכת פרויקטים",
                      "צפייה בכל רישומי הזמן",
                      "עריכת פרטי עובדים",
                    ],
                  },
                  {
                    title: "עובד (Employee)",
                    icon: <User className="h-4 w-4" />,
                    variant: "muted",
                    items: [
                      "צפייה בלקוחות ופרויקטים",
                      "ניהול רישומי הזמן שלו",
                      "עריכת הפרופיל האישי",
                      "שימוש בטיימר",
                    ],
                  },
                ]}
              />
            </div>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  תלושי שכר שמורים (קריאה בלבד)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      ניהול שכר
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/hr")}
                    >
                      פתח ניהול מלא ב-HR
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={fetchPayrollRuns} disabled={loadingPayroll}>
                    {loadingPayroll && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    )}
                    <Download className="h-4 w-4 ml-2" />
                    רענן תלושים
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loadingPayroll ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : payrollRunsView.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>לא נמצאו תלושי שכר שמורים לתקופה זו</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {payrollRunsView.map((run) => (
                  <Card
                    key={run.id}
                    className="card-elegant overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {run.employeeDisplayName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <button
                              type="button"
                              className="text-xl font-bold underline-offset-4 hover:underline text-right"
                              onClick={() =>
                                run.attendanceUserId &&
                                navigateToAttendanceForPayroll(run.attendanceUserId)
                              }
                              title={
                                run.attendanceUserId
                                  ? "פתח נוכחות עובדים לעובד/ת"
                                  : "אין משתמש מקושר לנוכחות"
                              }
                              disabled={!run.attendanceUserId}
                            >
                              {run.employeeDisplayName}
                            </button>
                            <p className="text-sm opacity-90">
                              {run.employeeSubtitle || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm opacity-90">תלוש שכר</p>
                          <p className="text-lg font-bold">
                            {formatMonth(payrollMonth)}
                          </p>
                          <Badge variant={getPayrollStatusVariant(run.status)} className="mt-1">
                            {getPayrollStatusLabel(run.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                            <Clock className="h-5 w-5 text-primary" />
                            פירוט שעות
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                שעות עבודה
                              </span>
                              <span className="font-semibold text-lg">
                                {Number(run.worked_hours ?? 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                נוספות 125%
                              </span>
                              <span className="font-semibold">
                                {Number(run.overtime_hours_125 ?? 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">נוספות 150%</span>
                              <span className="font-semibold">
                                {Number(run.overtime_hours_150 ?? 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span>נוצר בתאריך</span>
                              <span>{new Date(run.created_at).toLocaleDateString("he-IL")}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                            <DollarSign className="h-5 w-5 text-success" />
                            פירוט תשלום
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                סכום ברוטו
                              </span>
                              <span className="font-semibold">
                                {formatNIS(run.gross_total)}
                              </span>
                            </div>
                            <div className="h-px bg-border my-2" />
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-lg">
                                סה"כ לתשלום
                              </span>
                              <span className="font-bold text-2xl text-success">
                                {formatNIS(run.net_total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const printContent = `
                              <html dir="rtl">
                              <head>
                                <title>תלוש שכר - ${run.employeeDisplayName}</title>
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
                                  <h1>${run.employeeDisplayName}</h1>
                                  <p>תלוש שכר - ${formatMonth(payrollMonth)}</p>
                                </div>
                                <div class="section">
                                  <h3>פירוט שעות</h3>
                                  <div class="row"><span>סה"כ שעות עבודה</span><span>${Number(run.worked_hours ?? 0).toFixed(2)}</span></div>
                                  <div class="row"><span>נוספות 125%</span><span>${Number(run.overtime_hours_125 ?? 0).toFixed(2)}</span></div>
                                  <div class="row"><span>נוספות 150%</span><span>${Number(run.overtime_hours_150 ?? 0).toFixed(2)}</span></div>
                                </div>
                                <div class="section">
                                  <h3>פירוט תשלום</h3>
                                  <div class="row"><span>סכום ברוטו</span><span>${formatNIS(run.gross_total)}</span></div>
                                  <div class="divider"></div>
                                  <div class="row"><span>סה"כ לתשלום</span><span class="total">${formatNIS(run.net_total)}</span></div>
                                </div>
                              </body>
                              </html>
                            `;
                            const printWindow = window.open("", "_blank");
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
                        <Button
                          size="sm"
                          onClick={() => navigate("/hr")}
                        >
                          <DollarSign className="h-4 w-4 ml-2" />
                          עריכה ב-HR
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {payrollRunsView.length > 1 && (
                  <Card className="card-elegant bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              סיכום כולל
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {payrollRunsView.length} תלושים •{" "}
                              {formatMonth(payrollMonth)}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">
                            סה"כ לתשלום
                          </p>
                          <p className="text-3xl font-bold text-primary">
                            {formatNIS(payrollSummary.totalNet)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ברוטו {formatNIS(payrollSummary.totalGross)} •{" "}
                            {payrollSummary.totalHours.toFixed(1)} שעות
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Permissions Tab */}
          {isAdmin && (
            <TabsContent value="permissions" className="space-y-6">
              <PermissionsMatrix employees={employees} />
            </TabsContent>
          )}
            {isAdmin && (
            <TabsContent value="approvals" className="space-y-6">
              <UserApprovalsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Add Employee Panel — floating, draggable, resizable */}
      <AddEmployeePanel
        open={addDialog}
        onClose={() => setAddDialog(false)}
        isAdmin={isAdmin}
        isSaving={isAdding}
        onSubmit={async (form) => {
          if (!form.email || !form.full_name) {
            toast({ title: "שגיאה", description: "נא למלא אימייל ושם מלא", variant: "destructive" });
            return;
          }
          setIsAdding(true);
          try {
            const { data, error } = await supabase.functions.invoke("create-employee", {
              body: {
                email: form.email,
                full_name: form.full_name,
                phone: form.phone || null,
                department: form.department || null,
                position: form.position || null,
                hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
                role: form.role,
              },
            });
            if (error || !data?.success) {
              toast({ title: "שגיאה", description: error?.message || data?.error || "לא ניתן ליצור עובד", variant: "destructive" });
              return;
            }
            const msg = data.is_existing_user
              ? `משתמש קיים ${form.full_name} נוסף כעובד`
              : `עובד חדש ${form.full_name} נוסף. נשלח אימייל לאיפוס סיסמה.`;
            toast({ title: "עובד נוסף", description: msg });
            setAddDialog(false);
            fetchEmployees();
          } catch {
            toast({ title: "שגיאה", description: "אירעה שגיאה בהוספת העובד", variant: "destructive" });
          } finally {
            setIsAdding(false);
          }
        }}
      />

      {/* Edit Employee Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) =>
          setEditDialog({ open, employee: open ? editDialog.employee : null })
        }
      >
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              עריכת עובד
            </DialogTitle>
            <DialogDescription>עדכן את פרטי העובד והרשאותיו</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">שם מלא</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, full_name: e.target.value }))
                  }
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
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, phone: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        hourly_rate: e.target.value,
                      }))
                    }
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
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, department: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, position: e.target.value }))
                    }
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
                  onValueChange={(
                    value: "admin" | "super_manager" | "manager" | "employee",
                  ) => setEditForm((f) => ({ ...f, role: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <Shield className="h-4 w-4 ml-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-[10060]">
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-red-600" />
                        אדמין
                      </div>
                    </SelectItem>
                    <SelectItem value="super_manager">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-destructive" />
                        מנהל על
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
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="is_active">עובד פעיל</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, employee: null })}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveEmployee}
              disabled={isSaving}
              className="btn-gold"
            >
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
          setResetPasswordDialog({
            open,
            employee: open ? resetPasswordDialog.employee : null,
          });
          if (!open) {
            setNewPassword("");
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
                  type={showPassword ? "text" : "password"}
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
                setNewPassword("");
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
            setDeleteDialog({
              open,
              employee: open ? deleteDialog.employee : null,
            });
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
              האם אתה בטוח שברצונך למחוק את{" "}
              <span className="font-semibold">
                {deleteDialog.employee?.full_name}
              </span>
              ?
              <br />
              <span className="text-red-600 font-semibold">
                פעולה זו היא בלתי הפיכה!
              </span>
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

      {/* Client Assignment Dialog */}
      <Dialog
        open={clientAssignDialog.open}
        onOpenChange={(open) => {
          if (!isSavingClients) {
            setClientAssignDialog({
              open,
              employee: open ? clientAssignDialog.employee : null,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px] max-h-[85vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              הקצאת לקוחות - {clientAssignDialog.employee?.full_name}
            </DialogTitle>
            <DialogDescription>
              בחר אילו לקוחות העובד יוכל לראות ולנהל
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                placeholder="חיפוש לקוח..."
                className="pr-10"
              />
              {clientSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setClientSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedClientIds.size} לקוחות נבחרו מתוך {allClients.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllClients}
                className="text-xs h-7"
              >
                {filteredClientsForAssign.length > 0 &&
                filteredClientsForAssign.every((c) =>
                  selectedClientIds.has(c.id),
                )
                  ? "בטל הכל"
                  : "בחר הכל"}
              </Button>
            </div>

            {/* Client list */}
            <ScrollArea className="h-[350px] border rounded-md">
              {loadingClients ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredClientsForAssign.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                  <UsersRound className="h-8 w-8 mb-2 opacity-50" />
                  <p>לא נמצאו לקוחות</p>
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {filteredClientsForAssign.map((client) => (
                    <label
                      key={client.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedClientIds.has(client.id)
                          ? "bg-primary/5 border border-primary/20"
                          : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedClientIds.has(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {client.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {client.company && <span>{client.company}</span>}
                          {client.email && (
                            <span className="truncate">{client.email}</span>
                          )}
                          {client.status && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0"
                            >
                              {client.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedClientIds.has(client.id) && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setClientAssignDialog({ open: false, employee: null })
              }
              disabled={isSavingClients}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveClientAssignments}
              disabled={isSavingClients}
              className="btn-gold"
            >
              {isSavingClients && (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              )}
              <CheckCircle2 className="h-4 w-4 ml-2" />
              שמור ({selectedClientIds.size} לקוחות)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
