// Auto Reminders Settings Component
// הגדרות תזכורות אוטומטיות

import React, { useState } from "react";
import { useAutoReminders, ReminderThreshold } from "@/hooks/useAutoReminders";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

export function AutoRemindersSettings() {
  const {
    config,
    reminders,
    isChecking,
    updateConfig,
    addThreshold,
    removeThreshold,
    muteClient,
    checkReminders,
    requestNotificationPermission,
    criticalCount,
    warningCount,
    totalCount,
  } = useAutoReminders();

  const navigate = useNavigate();
  const [newDays, setNewDays] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newSeverity, setNewSeverity] = useState<
    "info" | "warning" | "critical"
  >("warning");

  const handleAddThreshold = () => {
    const days = parseInt(newDays);
    if (isNaN(days) || days <= 0 || !newLabel) return;

    addThreshold({
      days,
      label: newLabel,
      severity: newSeverity,
      message: `לקוח ללא פעילות ${days} יום`,
    });

    setNewDays("");
    setNewLabel("");
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      updateConfig({ enableBrowserNotifications: true });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-700 border-red-500/30";
      case "warning":
        return "bg-orange-500/10 text-orange-700 border-orange-500/30";
      default:
        return "bg-blue-500/10 text-blue-700 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Main Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  config.enabled ? "bg-green-500/10" : "bg-muted",
                )}
              >
                {config.enabled ? (
                  <Bell className="h-5 w-5 text-green-600" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">תזכורות אוטומטיות</CardTitle>
                <CardDescription>
                  קבל תזכורות על לקוחות שלא הייתה פעילות מולם
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>
        </CardHeader>

        {config.enabled && (
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-xs text-muted-foreground">
                  סה"כ תזכורות
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {warningCount}
                </div>
                <div className="text-xs text-orange-600">אזהרות</div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {criticalCount}
                </div>
                <div className="text-xs text-red-600">קריטיים</div>
              </div>
            </div>

            {/* Notification Settings */}
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                ערוצי התראה
              </h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label>התראות בדפדפן</Label>
                </div>
                {config.enableBrowserNotifications ? (
                  <Switch
                    checked={true}
                    onCheckedChange={() =>
                      updateConfig({ enableBrowserNotifications: false })
                    }
                  />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEnableNotifications}
                  >
                    הפעל
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <Label>התראות באפליקציה</Label>
                </div>
                <Switch
                  checked={config.enableInAppAlerts}
                  onCheckedChange={(val) =>
                    updateConfig({ enableInAppAlerts: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label>תדירות בדיקה</Label>
                </div>
                <Select
                  value={config.checkIntervalMinutes.toString()}
                  onValueChange={(val) =>
                    updateConfig({ checkIntervalMinutes: parseInt(val) })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 דקות</SelectItem>
                    <SelectItem value="60">שעה</SelectItem>
                    <SelectItem value="120">שעתיים</SelectItem>
                    <SelectItem value="360">6 שעות</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Thresholds */}
      {config.enabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ספי זמן לתזכורות</CardTitle>
            <CardDescription>
              הגדר אחרי כמה ימים ללא פעילות תקבל תזכורת
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.thresholds.map((threshold) => (
              <div
                key={threshold.days}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  getSeverityColor(threshold.severity),
                )}
              >
                <div className="flex items-center gap-3">
                  {getSeverityIcon(threshold.severity)}
                  <div>
                    <div className="font-medium">
                      {threshold.label} ({threshold.days} ימים)
                    </div>
                    <div className="text-xs opacity-75">
                      {threshold.message}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeThreshold(threshold.days)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Add new threshold */}
            <Separator />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">ימים</Label>
                <Input
                  type="number"
                  placeholder="45"
                  value={newDays}
                  onChange={(e) => setNewDays(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">תווית</Label>
                <Input
                  placeholder="חודש וחצי"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="w-28">
                <Label className="text-xs">חומרה</Label>
                <Select
                  value={newSeverity}
                  onValueChange={(v) => setNewSeverity(v as any)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">מידע</SelectItem>
                    <SelectItem value="warning">אזהרה</SelectItem>
                    <SelectItem value="critical">קריטי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={handleAddThreshold} className="h-9">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Reminders */}
      {config.enabled && reminders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                תזכורות פעילות ({reminders.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkReminders}
                disabled={isChecking}
              >
                <RefreshCw
                  className={cn("h-4 w-4 ml-1", isChecking && "animate-spin")}
                />
                בדוק עכשיו
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {reminders.slice(0, 20).map((reminder) => (
                  <div
                    key={reminder.clientId}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow",
                      getSeverityColor(reminder.threshold.severity),
                    )}
                    onClick={() =>
                      navigate(`/client-profile/${reminder.clientId}`)
                    }
                  >
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(reminder.threshold.severity)}
                      <div>
                        <div className="font-medium">{reminder.clientName}</div>
                        <div className="text-xs opacity-75">
                          {reminder.daysSinceActivity} ימים ללא פעילות
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {reminder.threshold.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          muteClient(reminder.clientId);
                        }}
                        title="השתק תזכורות ללקוח זה"
                      >
                        <VolumeX className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AutoRemindersSettings;
