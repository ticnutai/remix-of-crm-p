import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { DataTable, ColumnDef } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullPageLoader } from "@/components/ui/loading";
import { PageTransition, FadeIn } from "@/components/ui/page-transition";
import { InfoTooltipButton } from "@/components/ui/info-tooltip-button";
import { formatPhoneDisplay } from "@/utils/phoneValidation";
import {
  RevenueChart,
  ProjectsStatusChart,
  WorkHoursChart,
  WorkHoursTableWidget,
  DashboardThemeProvider,
  useDashboardTheme,
  DashboardSettingsDialog,
  ThemedWidget,
  ThemedStatCard,
  DynamicTableWidget,
  DynamicStatsWidget,
  SmartStatsGrid,
  // Unified Widget System
  WidgetLayoutProvider,
  useWidgetLayout,
  WidgetContainer,
  WidgetGrid,
} from "@/components/dashboard";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useBackupRestore } from "@/hooks/useBackupRestore";
import { useAuth } from "@/hooks/useAuth";
// שימוש ב-hook מאופטם עם React Query וcaching
import { useDashboardData } from "@/hooks/useDashboardDataOptimized";
import { usePrefetchCommonRoutes } from "@/hooks/usePrefetch";
import { DashboardStatsSkeleton } from "@/components/dashboard/DashboardSkeletons";

import {
  Users,
  FolderKanban,
  DollarSign,
  Clock,
  Download,
  Upload,
  Save,
  Settings,
  Sparkles,
  Palette,
  BarChart3,
  Keyboard,
  HardDrive,
  LayoutGrid,
  Bell,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Sample data types
interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "pending";
  totalProjects: number;
  revenue: number;
  lastContact: string;
}

// Sample data
const initialClients: Client[] = [
  {
    id: 1,
    name: "אברהם כהן",
    email: "abraham@example.com",
    phone: "050-1234567",
    status: "active",
    totalProjects: 5,
    revenue: 125000,
    lastContact: "2024-01-15",
  },
  {
    id: 2,
    name: "שרה לוי",
    email: "sarah@example.com",
    phone: "052-2345678",
    status: "active",
    totalProjects: 3,
    revenue: 87000,
    lastContact: "2024-01-20",
  },
  {
    id: 3,
    name: "דוד ישראלי",
    email: "david@example.com",
    phone: "054-3456789",
    status: "pending",
    totalProjects: 1,
    revenue: 15000,
    lastContact: "2024-01-18",
  },
  {
    id: 4,
    name: "רחל גולד",
    email: "rachel@example.com",
    phone: "053-4567890",
    status: "inactive",
    totalProjects: 8,
    revenue: 230000,
    lastContact: "2023-12-01",
  },
  {
    id: 5,
    name: "יעקב מזרחי",
    email: "yaakov@example.com",
    phone: "050-5678901",
    status: "active",
    totalProjects: 12,
    revenue: 450000,
    lastContact: "2024-01-22",
  },
  {
    id: 6,
    name: "מרים אברמוב",
    email: "miriam@example.com",
    phone: "052-6789012",
    status: "active",
    totalProjects: 4,
    revenue: 98000,
    lastContact: "2024-01-19",
  },
  {
    id: 7,
    name: "משה פרידמן",
    email: "moshe@example.com",
    phone: "054-7890123",
    status: "pending",
    totalProjects: 2,
    revenue: 45000,
    lastContact: "2024-01-21",
  },
  {
    id: 8,
    name: "לאה שטרן",
    email: "leah@example.com",
    phone: "053-8901234",
    status: "active",
    totalProjects: 6,
    revenue: 178000,
    lastContact: "2024-01-17",
  },
  {
    id: 9,
    name: "יוסף בן דוד",
    email: "yosef@example.com",
    phone: "050-9012345",
    status: "active",
    totalProjects: 9,
    revenue: 320000,
    lastContact: "2024-01-23",
  },
  {
    id: 10,
    name: "רבקה שמעוני",
    email: "rivka@example.com",
    phone: "052-0123456",
    status: "pending",
    totalProjects: 2,
    revenue: 55000,
    lastContact: "2024-01-16",
  },
];

const clientColumns: ColumnDef<Client>[] = [
  {
    id: "name",
    header: "שם לקוח",
    accessorKey: "name",
    sortable: true,
    editable: true,
    editType: "text",
  },
  {
    id: "email",
    header: "אימייל",
    subHeader: 'כתובת דוא"ל',
    accessorKey: "email",
    sortable: true,
  },
  {
    id: "phone",
    header: "טלפון",
    accessorKey: "phone",
    cell: (value) => (
      <span dir="ltr" className="font-mono">
        {value || "-"}
      </span>
    ),
  },
  {
    id: "status",
    header: "סטטוס",
    accessorKey: "status",
    editable: true,
    editType: "select",
    editOptions: [
      { label: "פעיל", value: "active" },
      { label: "לא פעיל", value: "inactive" },
      { label: "ממתין", value: "pending" },
    ],
    cell: (value) => {
      const config = {
        active: { color: "bg-success text-success-foreground", label: "פעיל" },
        inactive: { color: "bg-muted text-muted-foreground", label: "לא פעיל" },
        pending: {
          color: "bg-warning text-warning-foreground",
          label: "ממתין",
        },
      };
      const { color, label } = config[value as keyof typeof config];
      return <Badge className={color}>{label}</Badge>;
    },
  },
  {
    id: "totalProjects",
    header: "פרויקטים",
    accessorKey: "totalProjects",
    sortable: true,
    summary: "sum",
    align: "center",
  },
  {
    id: "revenue",
    header: "הכנסות",
    subHeader: "₪",
    accessorKey: "revenue",
    sortable: true,
    summary: "sum",
    cell: (value) => (
      <span className="font-semibold text-success">
        ₪{value.toLocaleString("he-IL")}
      </span>
    ),
  },
  {
    id: "lastContact",
    header: "קשר אחרון",
    accessorKey: "lastContact",
    sortable: true,
    cell: (value) => new Date(value).toLocaleDateString("he-IL"),
  },
];

// Dashboard Content Component
function DashboardContent() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, profile } = useAuth();
  const [clients, setClients] = useState(initialClients);
  const { pushAction } = useUndoRedo();
  const { createBackup, backups, exportBackup, restoreBackup } =
    useBackupRestore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Prefetch common routes after dashboard loads
  usePrefetchCommonRoutes();

  const { themeConfig, currentTheme } = useDashboardTheme();
  const { isVisible, getGridClass, layouts, gridGap, setGridGap } =
    useWidgetLayout();

  const {
    isLoading: dashboardLoading,
    isChartsLoading,
    stats,
    revenueData,
    projectsStatusData,
    hoursByEmployee,
    hoursByProject,
  } = useDashboardData();

  const handleCellEdit = useCallback(
    (row: Client, columnId: string, newValue: any) => {
      const oldValue = row[columnId as keyof Client];

      pushAction({
        type: "EDIT_CELL",
        description: `עריכת ${columnId === "name" ? "שם" : columnId === "status" ? "סטטוס" : columnId} של ${row.name}`,
        undo: () => {
          setClients((prev) =>
            prev.map((client) =>
              client.id === row.id
                ? { ...client, [columnId]: oldValue }
                : client,
            ),
          );
        },
        redo: () => {
          setClients((prev) =>
            prev.map((client) =>
              client.id === row.id
                ? { ...client, [columnId]: newValue }
                : client,
            ),
          );
        },
      });

      setClients((prev) =>
        prev.map((client) =>
          client.id === row.id ? { ...client, [columnId]: newValue } : client,
        ),
      );
    },
    [pushAction],
  );

  const handleCreateBackup = useCallback(async () => {
    const backup = await createBackup(
      `גיבוי לקוחות - ${new Date().toLocaleDateString("he-IL")}`,
      { clients },
    );
    if (backup) {
      exportBackup(backup);
    }
  }, [createBackup, exportBackup, clients]);

  const handleRestoreLatest = useCallback(() => {
    if (backups.length === 0) {
      toast({
        title: "אין גיבויים",
        description: "לא נמצאו גיבויים לשחזור",
        variant: "destructive",
      });
      return;
    }
    const backup = restoreBackup(backups[0].id);
    if (backup && backup.data.clients) {
      setClients(backup.data.clients);
    }
  }, [backups, restoreBackup]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <FullPageLoader message="טוען את לוח הבקרה..." />;
  }

  if (!user) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `₪${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₪${(value / 1000).toFixed(0)}K`;
    return `₪${value.toLocaleString("he-IL")}`;
  };

  const isNavyGold = currentTheme === "navy-gold";
  const isModernDark = currentTheme === "modern-dark";

  // Dashboard background style
  const dashboardStyle: React.CSSProperties = {
    background: themeConfig.colors.background,
    minHeight: "100vh",
  };

  return (
    <AppLayout title={`שלום, ${profile?.full_name || "משתמש"}`}>
      <PageTransition>
        <div
          style={dashboardStyle}
          className="relative overflow-hidden z-0"
          dir="rtl"
        >
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-2 sm:space-y-3 md:space-y-4">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between gap-2 flex-row-reverse">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0",
                    isNavyGold &&
                      "bg-gradient-to-br from-[hsl(45,80%,55%)] to-[hsl(45,90%,45%)]",
                    isModernDark &&
                      "bg-gradient-to-br from-[hsl(210,100%,50%)] to-[hsl(210,100%,40%)]",
                  )}
                  style={{
                    backgroundColor:
                      !isNavyGold && !isModernDark
                        ? "hsl(var(--primary))"
                        : undefined,
                  }}
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1
                    className="text-lg sm:text-xl md:text-2xl font-bold truncate"
                    style={{ color: themeConfig.colors.text }}
                  >
                    לוח בקרה
                  </h1>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: themeConfig.colors.textMuted }}
                  >
                    ערכת נושא: {themeConfig.name}
                  </p>
                </div>
              </div>

              {/* Quick Widget Settings Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:scale-105 transition-all"
                style={{
                  borderColor: themeConfig.colors.border,
                  backgroundColor: themeConfig.colors.cardBackground,
                }}
                title="הגדרות וידג'טים"
              >
                <LayoutGrid
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  style={{ color: themeConfig.colors.accent }}
                />
              </Button>
            </div>

            {/* Settings Dialog */}
            <DashboardSettingsDialog
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
            />

            {/* Stats Cards - מציג skeleton בזמן טעינה */}
            {dashboardLoading ? (
              <DashboardStatsSkeleton />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <ThemedStatCard
                  widgetId="stats-clients"
                  title="לקוחות פעילים"
                  value={stats.activeClients.toString()}
                  icon={<Users className="h-6 w-6" />}
                  trend={{
                    value: stats.activeClientsChange,
                    isPositive: stats.activeClientsChange >= 0,
                  }}
                  description="מהחודש שעבר"
                  delay={0.1}
                  onClick={() => navigate("/clients")}
                />
                <ThemedStatCard
                  widgetId="stats-projects"
                  title="פרויקטים פתוחים"
                  value={stats.openProjects.toString()}
                  icon={<FolderKanban className="h-6 w-6" />}
                  trend={{
                    value: stats.openProjectsChange,
                    isPositive: stats.openProjectsChange >= 0,
                  }}
                  description="מהחודש שעבר"
                  delay={0.2}
                  onClick={() => navigate("/projects")}
                />
                <ThemedStatCard
                  widgetId="stats-revenue"
                  title="הכנסות החודש"
                  value={formatCurrency(stats.monthlyRevenue)}
                  icon={<DollarSign className="h-6 w-6" />}
                  trend={{
                    value: stats.monthlyRevenueChange,
                    isPositive: stats.monthlyRevenueChange >= 0,
                  }}
                  description="מהחודש שעבר"
                  delay={0.3}
                  onClick={() => navigate("/finance")}
                />
                <ThemedStatCard
                  widgetId="stats-hours"
                  title="שעות עבודה"
                  value={stats.totalHours.toString()}
                  icon={<Clock className="h-6 w-6" />}
                  trend={{
                    value: stats.totalHoursChange,
                    isPositive: stats.totalHoursChange >= 0,
                  }}
                  description="מהחודש שעבר"
                  delay={0.4}
                  onClick={() => navigate("/time-logs")}
                />
              </div>
            )}

            {/* Smart Stats - Additional Insights */}
            <FadeIn delay={0.42}>
              <SmartStatsGrid />
            </FadeIn>

            {/* Smart Tools Quick Access Card */}
            <FadeIn delay={0.45}>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2"
                style={{
                  borderColor: themeConfig.colors.accent,
                  background: `linear-gradient(135deg, ${themeConfig.colors.cardBackground} 0%, ${themeConfig.colors.background} 100%)`,
                }}
                onClick={() => navigate("/smart-tools")}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${themeConfig.colors.accent} 0%, ${themeConfig.colors.accent} 100%)`,
                      }}
                    >
                      <Bell className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-xl font-bold mb-1 flex items-center gap-2"
                        style={{ color: themeConfig.colors.text }}
                      >
                        🤖 כלים חכמים
                        <Badge variant="secondary" className="text-xs">
                          חדש!
                        </Badge>
                      </h3>
                      <p
                        className="text-sm mb-3"
                        style={{ color: themeConfig.colors.textMuted }}
                      >
                        התראות אוטומטיות וצ'אט AI לשליפת מידע מהיר
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          התראות חכמות
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          צ'אט AI
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ⚡ מהיר ומדויק
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Widget Grid Section - Dynamic Order Based on Layouts */}
            <WidgetGrid>
              {layouts
                .filter((layout) => layout.visible)
                .sort((a, b) => a.order - b.order)
                .map((layout, index) => {
                  const delay = 0.5 + index * 0.05;

                  switch (layout.id) {
                    case "chart-revenue":
                      return (
                        <WidgetContainer
                          key={layout.id}
                          widgetId="chart-revenue"
                        >
                          <FadeIn delay={delay}>
                            <ThemedWidget
                              widgetId="chart-revenue"
                              title="הכנסות"
                              titleIcon={<DollarSign className="h-5 w-5" />}
                              noPadding
                            >
                              <div className="p-4">
                                <RevenueChart
                                  data={revenueData}
                                  isLoading={dashboardLoading}
                                />
                              </div>
                            </ThemedWidget>
                          </FadeIn>
                        </WidgetContainer>
                      );

                    case "dynamic-stats":
                      return (
                        <WidgetContainer
                          key={layout.id}
                          widgetId="dynamic-stats"
                        >
                          <FadeIn delay={delay}>
                            <DynamicStatsWidget widgetId="dynamic-stats" />
                          </FadeIn>
                        </WidgetContainer>
                      );

                    default:
                      // Handle dynamic-stats-1, dynamic-stats-2, etc.
                      if (layout.id.startsWith("dynamic-stats-")) {
                        return (
                          <WidgetContainer
                            key={layout.id}
                            widgetId={layout.id as any}
                          >
                            <FadeIn delay={delay}>
                              <DynamicStatsWidget widgetId={layout.id} />
                            </FadeIn>
                          </WidgetContainer>
                        );
                      }
                      return null;

                    case "chart-projects":
                      return (
                        <WidgetContainer
                          key={layout.id}
                          widgetId="chart-projects"
                        >
                          <FadeIn delay={delay}>
                            <ThemedWidget
                              widgetId="chart-projects"
                              title="סטטוס פרויקטים"
                              titleIcon={<FolderKanban className="h-5 w-5" />}
                              noPadding
                            >
                              <div className="p-4">
                                <ProjectsStatusChart
                                  data={projectsStatusData}
                                  isLoading={dashboardLoading}
                                />
                              </div>
                            </ThemedWidget>
                          </FadeIn>
                        </WidgetContainer>
                      );

                    case "chart-hours":
                      return (
                        <WidgetContainer key={layout.id} widgetId="chart-hours">
                          <FadeIn delay={delay}>
                            <ThemedWidget
                              widgetId="chart-hours"
                              title="שעות עבודה"
                              titleIcon={<Clock className="h-5 w-5" />}
                              noPadding
                            >
                              <div className="p-4">
                                <WorkHoursChart
                                  byEmployee={hoursByEmployee}
                                  byProject={hoursByProject}
                                  isLoading={dashboardLoading}
                                />
                              </div>
                            </ThemedWidget>
                          </FadeIn>
                        </WidgetContainer>
                      );

                    case "table-hours":
                      return (
                        <WidgetContainer key={layout.id} widgetId="table-hours">
                          <FadeIn delay={delay}>
                            <WorkHoursTableWidget
                              isLoading={dashboardLoading}
                            />
                          </FadeIn>
                        </WidgetContainer>
                      );

                    case "table-clients":
                      return (
                        <WidgetContainer
                          key={layout.id}
                          widgetId="table-clients"
                        >
                          <FadeIn delay={delay}>
                            <ThemedWidget
                              widgetId="table-clients"
                              title="נתונים"
                              titleIcon={<Users className="h-5 w-5" />}
                              headerActions={
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRestoreLatest}
                                    className={cn(
                                      isNavyGold &&
                                        "text-white/80 hover:text-white hover:bg-white/10",
                                      isModernDark &&
                                        "text-white/80 hover:text-white hover:bg-white/10",
                                    )}
                                  >
                                    <Upload className="h-4 w-4 ml-1" />
                                    שחזור
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCreateBackup}
                                    className={cn(
                                      isNavyGold &&
                                        "text-white/80 hover:text-white hover:bg-white/10",
                                      isModernDark &&
                                        "text-white/80 hover:text-white hover:bg-white/10",
                                    )}
                                  >
                                    <Download className="h-4 w-4 ml-1" />
                                    גיבוי
                                  </Button>
                                </div>
                              }
                              noPadding
                            >
                              <div className="p-4">
                                <DynamicTableWidget
                                  defaultTableId="clients"
                                  variant={
                                    isNavyGold
                                      ? "gold"
                                      : isModernDark
                                        ? "navy"
                                        : "default"
                                  }
                                />
                              </div>
                            </ThemedWidget>
                          </FadeIn>
                        </WidgetContainer>
                      );

                    case "table-vip":
                      return (
                        <WidgetContainer key={layout.id} widgetId="table-vip">
                          <FadeIn delay={delay}>
                            <ThemedWidget
                              widgetId="table-vip"
                              title="לקוחות VIP - הכנסות מעל ₪100,000"
                              titleIcon={<FolderKanban className="h-5 w-5" />}
                              noPadding
                            >
                              <div className="p-4">
                                <DataTable
                                  data={clients.filter(
                                    (c) => c.revenue > 100000,
                                  )}
                                  columns={clientColumns.filter((c) =>
                                    [
                                      "name",
                                      "status",
                                      "totalProjects",
                                      "revenue",
                                    ].includes(c.id),
                                  )}
                                  variant={
                                    isNavyGold
                                      ? "navy"
                                      : isModernDark
                                        ? "gold"
                                        : "navy"
                                  }
                                  paginated={false}
                                  showSummary
                                />
                              </div>
                            </ThemedWidget>
                          </FadeIn>
                        </WidgetContainer>
                      );

                    case "features-info":
                      // Hidden from grid - rendered as floating icon below
                      return null;
                  }
                })}
            </WidgetGrid>

            {/* Reflection Effect for Navy Gold Theme - absolute, not fixed */}
            {themeConfig.effects.reflection && (
              <div
                className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(180, 180, 180, 0.15), transparent)",
                }}
              />
            )}
          </div>
        </div>

        {/* Floating Features Info Button - Bottom Left */}
        <div className="fixed bottom-4 left-4 z-50">
          <InfoTooltipButton
            buttonClassName={cn(
              "h-10 w-10 rounded-full shadow-lg border-2",
              isNavyGold &&
                "bg-[hsl(45,30%,95%)] border-[hsl(45,80%,50%)] text-[hsl(220,60%,20%)] hover:bg-[hsl(45,30%,90%)]",
              isModernDark &&
                "bg-[hsl(240,10%,15%)] border-[hsl(210,100%,50%)] text-[hsl(210,100%,60%)] hover:bg-[hsl(240,10%,20%)]",
              !isNavyGold &&
                !isModernDark &&
                "bg-card border-border text-muted-foreground hover:bg-muted",
            )}
            triggerIcon={
              <Sparkles
                className="h-5 w-5"
                style={{ color: themeConfig.colors.accent }}
              />
            }
            sections={[
              {
                title: "טבלאות חכמות",
                icon: <BarChart3 className="h-4 w-4" />,
                variant: "default",
                items: [
                  "מיון רב-עמודות (Shift+Click)",
                  "חיפוש גלובלי מהיר",
                  "עריכה ישירה בתא",
                  "שורת סיכום אוטומטית",
                ],
              },
              {
                title: "קיצורי מקלדת",
                icon: <Keyboard className="h-4 w-4" />,
                variant: "secondary",
                items: [
                  "Ctrl+Z - בטל פעולה",
                  "Ctrl+Y - בצע שוב",
                  "Enter - אישור עריכה",
                  "חצים - ניווט בין תאים",
                ],
              },
              {
                title: "גיבוי ושחזור",
                icon: <HardDrive className="h-4 w-4" />,
                variant: "muted",
                items: [
                  "גיבוי אוטומטי לאחסון מקומי",
                  "ייצוא לקובץ JSON",
                  "שחזור מגיבוי",
                  "היסטוריית פעולות",
                ],
              },
            ]}
          />
        </div>

        {/* Settings Dialog */}
        <DashboardSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      </PageTransition>
    </AppLayout>
  );
}

// Main Index Component with Providers (unified - no WidgetManagerProvider needed)
const Index = () => {
  return (
    <DashboardThemeProvider>
      <WidgetLayoutProvider>
        <DashboardContent />
      </WidgetLayoutProvider>
    </DashboardThemeProvider>
  );
};

export default Index;
