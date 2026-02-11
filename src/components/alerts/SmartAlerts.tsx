/**
 * Smart Alerts Component - תצוגת התראות חכמות
 * כולל הגדרות, סגירת התראות, וסינון לפי קטגוריה
 */

import { useState } from "react";
import { useSmartAlerts, DEFAULT_ALERT_SETTINGS } from "@/hooks/useSmartAlerts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  BellOff,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  Users,
  FolderKanban,
  DollarSign,
  FileText,
  CheckSquare,
  Calendar,
  TrendingUp,
  Clock,
  Settings,
  X,
  Layers,
  Target,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  client: "לקוחות",
  project: "פרויקטים",
  payment: "תשלומים",
  contract: "חוזים",
  task: "משימות",
  meeting: "פגישות",
  stage: "שלבים",
  deadline: "דדליינים",
  reminder: "תזכורות",
};

export function SmartAlerts() {
  const navigate = useNavigate();
  const {
    alerts,
    stats,
    isLoading,
    lastCheck,
    settings,
    runAllChecks,
    dismissAlert,
    updateSettings,
    requestNotificationPermission,
  } = useSmartAlerts();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    "Notification" in window && Notification.permission === "granted",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const handleEnableNotifications = async () => {
    await requestNotificationPermission();
    setNotificationsEnabled(Notification.permission === "granted");
  };

  const toggleCategory = (category: string) => {
    const newCategories = settings.enabledCategories.includes(category)
      ? settings.enabledCategories.filter((c) => c !== category)
      : [...settings.enabledCategories, category];
    updateSettings({ enabledCategories: newCategories });
  };

  const typeConfig = {
    danger: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950",
      border: "border-red-200 dark:border-red-800",
      badge: "destructive",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950",
      border: "border-orange-200 dark:border-orange-800",
      badge: "warning" as any,
    },
    info: {
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950",
      border: "border-blue-200 dark:border-blue-800",
      badge: "secondary",
    },
    success: {
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950",
      border: "border-green-200 dark:border-green-800",
      badge: "success" as any,
    },
  };

  const categoryIcons: Record<string, any> = {
    client: Users,
    project: FolderKanban,
    payment: DollarSign,
    contract: FileText,
    task: CheckSquare,
    meeting: Calendar,
    stage: Layers,
    deadline: Target,
    reminder: BellRing,
  };

  // Filter alerts by selected category
  const filteredAlerts = categoryFilter
    ? alerts.filter((a) => a.category === categoryFilter)
    : alerts;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold">התראות חכמות</h2>
            <p className="text-sm text-muted-foreground">
              {lastCheck
                ? `עדכון אחרון: ${lastCheck.toLocaleTimeString("he-IL")}`
                : "טוען..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Dialog */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 ml-2" />
                הגדרות
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-lg">
              <DialogHeader className="text-right">
                <DialogTitle>הגדרות התראות</DialogTitle>
                <DialogDescription>
                  התאם אילו התראות תקבל ומתי
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Enabled Categories */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    קטגוריות פעילות
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(categoryLabels).map(([key, label]) => {
                      const Icon = categoryIcons[key];
                      const isEnabled =
                        settings.enabledCategories.includes(key);
                      return (
                        <Button
                          key={key}
                          variant={isEnabled ? "default" : "outline"}
                          size="sm"
                          className="gap-2 justify-start"
                          onClick={() => toggleCategory(key)}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Check Interval */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      תדירות בדיקה
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      כל {settings.checkIntervalMinutes} דקות
                    </span>
                  </div>
                  <Slider
                    value={[settings.checkIntervalMinutes]}
                    onValueChange={([value]) =>
                      updateSettings({ checkIntervalMinutes: value })
                    }
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Browser Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">
                      התראות דפדפן
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      קבל התראות גם כשהמסך מוסתר
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleEnableNotifications}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {!notificationsEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableNotifications}
            >
              <BellOff className="h-4 w-4 ml-2" />
              הפעל התראות
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={runAllChecks}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4 ml-2", isLoading && "animate-spin")}
            />
            רענן
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card
          className={cn(
            "cursor-pointer transition-all",
            !categoryFilter && "ring-2 ring-primary",
          )}
          onClick={() => setCategoryFilter(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ התראות</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">דחופות</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.urgent}
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all",
            categoryFilter === "payment" && "ring-2 ring-orange-500",
          )}
          onClick={() =>
            setCategoryFilter(categoryFilter === "payment" ? null : "payment")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">תשלומים</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byCategory.payment || 0}
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all",
            categoryFilter === "deadline" && "ring-2 ring-purple-500",
          )}
          onClick={() =>
            setCategoryFilter(categoryFilter === "deadline" ? null : "deadline")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">דדליינים</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byCategory.deadline || 0}
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all",
            categoryFilter === "meeting" && "ring-2 ring-blue-500",
          )}
          onClick={() =>
            setCategoryFilter(categoryFilter === "meeting" ? null : "meeting")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פגישות היום</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byCategory.meeting || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const Icon = categoryIcons[key];
          const count = stats.byCategory[key] || 0;
          if (count === 0) return null;
          return (
            <Button
              key={key}
              variant={categoryFilter === key ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() =>
                setCategoryFilter(categoryFilter === key ? null : key)
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <Badge variant="secondary" className="mr-1">
                {count}
              </Badge>
            </Button>
          );
        })}
        {categoryFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryFilter(null)}
            className="gap-1"
          >
            <X className="h-3.5 w-3.5" />
            נקה סינון
          </Button>
        )}
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            רשימת התראות
            {categoryFilter && (
              <Badge variant="outline" className="mr-2">
                {categoryLabels[categoryFilter]} בלבד
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && alerts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
              <h3 className="text-lg font-semibold mb-1">כל הכבוד! 🎉</h3>
              <p className="text-muted-foreground">
                {categoryFilter
                  ? `אין התראות ב${categoryLabels[categoryFilter]}`
                  : "אין התראות פעילות כרגע"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pl-4">
              <div className="space-y-3">
                {filteredAlerts.map((alert) => {
                  const config = typeConfig[alert.type];
                  const Icon = config.icon;
                  const CategoryIcon = categoryIcons[alert.category] || Bell;

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all hover:shadow-md text-right group",
                        config.bg,
                        config.border,
                      )}
                    >
                      <div className="flex items-start gap-3 flex-row-reverse">
                        <div className={cn("mt-0.5", config.color)}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 space-y-2 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => dismissAlert(alert.id)}
                              title="סגור התראה"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <Badge
                              variant={config.badge as any}
                              className="text-xs"
                            >
                              {alert.priority === 1 && "🔥 דחוף"}
                              {alert.priority === 2 && "חשוב"}
                              {alert.priority === 3 && "רגיל"}
                            </Badge>
                            <h4 className="font-semibold">{alert.title}</h4>
                          </div>

                          <p className="text-sm text-muted-foreground text-right">
                            {alert.message}
                          </p>

                          <div className="flex items-center gap-2 justify-end flex-row-reverse">
                            {alert.actionUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(alert.actionUrl!)}
                              >
                                {alert.actionLabel || "פתח"}
                              </Button>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1 flex-row-reverse">
                              <Clock className="h-3 w-3" />
                              {alert.createdAt.toLocaleTimeString("he-IL")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
