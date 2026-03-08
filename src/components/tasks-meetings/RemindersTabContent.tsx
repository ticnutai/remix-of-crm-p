// RemindersTabContent - Reminders tab for Tasks & Meetings page
import React, { useState, useMemo } from "react";
import { useReminders, Reminder } from "@/hooks/useReminders";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import {
  sortItems,
  processDedup,
  getDedupKey,
  SortField,
  SortOrder,
} from "@/utils/sortAndDedup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Trash2,
  Check,
  Clock,
  Mail,
  Volume2,
  BellRing,
  Plus,
  Search,
  AlarmClockPlus,
  MoreHorizontal,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowUpDown,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  format,
  isPast,
  isFuture,
  isToday,
  addMinutes,
  addHours,
} from "date-fns";
import { he } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const reminderTypeIcons: Record<string, React.ReactNode> = {
  browser: <BellRing className="h-4 w-4" />,
  popup: <Bell className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  voice: <Volume2 className="h-4 w-4" />,
};

const reminderTypeLabels: Record<string, string> = {
  browser: "התראת דפדפן",
  popup: "חלון קופץ",
  email: "אימייל",
  voice: "הקראה קולית",
};

const priorityConfig = {
  high: {
    label: "גבוהה",
    icon: ArrowUp,
    color: "text-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  medium: {
    label: "בינונית",
    icon: ArrowRight,
    color: "text-yellow-500",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  low: {
    label: "נמוכה",
    icon: ArrowDown,
    color: "text-green-500",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
};

export function RemindersTabContent() {
  const {
    reminders,
    loading,
    deleteReminder,
    dismissReminder,
    updateReminder,
  } = useReminders();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reminderSortBy, setReminderSortBy] = useState<SortField>("event_date");
  const [reminderSortOrder, setReminderSortOrder] = useState<SortOrder>("asc");
  const [expandedDedupGroups, setExpandedDedupGroups] = useState<Set<string>>(
    new Set(),
  );

  const toggleDedupGroup = (groupKey: string) => {
    setExpandedDedupGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const filteredReminders = reminders.filter(
    (r) =>
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.message?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort reminders
  const sortedReminders = sortItems(
    filteredReminders,
    reminderSortBy,
    reminderSortOrder,
    (r, field) => {
      switch (field) {
        case "created_at":
          return r.created_at;
        case "event_date":
          return r.remind_at;
        case "title":
          return r.title;
        default:
          return null;
      }
    },
  );

  const pendingReminders = sortedReminders.filter(
    (r) => !r.is_sent && !r.is_dismissed && isFuture(new Date(r.remind_at)),
  );
  const todayReminders = sortedReminders.filter((r) =>
    isToday(new Date(r.remind_at)),
  );
  const overdueReminders = sortedReminders.filter(
    (r) => !r.is_sent && !r.is_dismissed && isPast(new Date(r.remind_at)),
  );
  const pastReminders = sortedReminders.filter(
    (r) => r.is_sent || r.is_dismissed,
  );

  // Dedup helper
  const dedupReminders = (items: Reminder[]) =>
    processDedup(
      items,
      (r) => getDedupKey(r.remind_at, r.title),
      expandedDedupGroups,
    );

  const handleDelete = async () => {
    if (deleteId) {
      await deleteReminder(deleteId);
      setDeleteId(null);
    }
  };

  const handleSnooze = async (reminder: Reminder, minutes: number) => {
    const newTime = addMinutes(new Date(), minutes);
    try {
      await supabase
        .from("reminders")
        .update({
          remind_at: newTime.toISOString(),
          is_sent: false,
          is_dismissed: false,
        })
        .eq("id", reminder.id);
      toast.success(
        `תזכורת נדחתה ל-${format(newTime, "HH:mm", { locale: he })}`,
      );
      // Refresh handled by useReminders
      window.location.reload(); // Simple refresh for now
    } catch {
      toast.error("שגיאה בדחיית התזכורת");
    }
  };

  const getStatusBadge = (reminder: Reminder) => {
    if (reminder.is_dismissed) return <Badge variant="secondary">בוטלה</Badge>;
    if (reminder.is_sent)
      return <Badge className="bg-green-600 text-white">נשלחה</Badge>;
    if (isPast(new Date(reminder.remind_at)))
      return <Badge variant="destructive">באיחור</Badge>;
    if (isToday(new Date(reminder.remind_at)))
      return <Badge className="bg-[hsl(45,80%,45%)] text-white">היום</Badge>;
    return <Badge variant="outline">ממתינה</Badge>;
  };

  const getPriorityBadge = (reminder: Reminder) => {
    // Use entity_type field as priority indicator if set, otherwise default to medium
    const priority = (reminder as any).priority || "medium";
    const config =
      priorityConfig[priority as keyof typeof priorityConfig] ||
      priorityConfig.medium;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.badge}>
        <Icon className="h-3 w-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const ReminderRow = ({
    reminder,
    dupInfo,
  }: {
    reminder: Reminder;
    dupInfo?: { count: number; key: string };
  }) => (
    <TableRow key={reminder.id} className="group">
      <TableCell>
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium">{reminder.title}</p>
            {reminder.message && (
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {reminder.message}
              </p>
            )}
          </div>
          {dupInfo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleDedupGroup(dupInfo.key)}
              className="h-6 gap-1 text-xs text-amber-600 hover:text-amber-700 shrink-0"
              title={
                expandedDedupGroups.has(dupInfo.key)
                  ? "הסתר כפולים"
                  : "הצג הכל"
              }
            >
              <Layers className="h-3 w-3" />
              <span>{dupInfo.count}</span>
              {expandedDedupGroups.has(dupInfo.key) ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(reminder.remind_at), "dd/MM/yyyy HH:mm", {
              locale: he,
            })}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {reminderTypeIcons[reminder.reminder_type] || (
            <Bell className="h-4 w-4" />
          )}
          <span className="text-sm">
            {reminderTypeLabels[reminder.reminder_type] ||
              reminder.reminder_type}
          </span>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(reminder)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {/* Snooze dropdown */}
          {!reminder.is_dismissed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="נודניק"
                >
                  <AlarmClockPlus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSnooze(reminder, 5)}>
                  <Clock className="h-4 w-4 ml-2" />5 דקות
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(reminder, 15)}>
                  <Clock className="h-4 w-4 ml-2" />
                  15 דקות
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(reminder, 30)}>
                  <Clock className="h-4 w-4 ml-2" />
                  30 דקות
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(reminder, 60)}>
                  <Clock className="h-4 w-4 ml-2" />
                  שעה
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleSnooze(reminder, 60 * 24)}
                >
                  <Clock className="h-4 w-4 ml-2" />
                  מחר
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Dismiss */}
          {!reminder.is_dismissed && !reminder.is_sent && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => dismissReminder(reminder.id)}
              title="סמן כבוטלה"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteId(reminder.id)}
            title="מחק"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const ReminderTable = ({ items }: { items: Reminder[] }) => {
    const { visible, dupMap } = dedupReminders(items);
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>כותרת</TableHead>
            <TableHead>זמן</TableHead>
            <TableHead>סוג</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                אין תזכורות
              </TableCell>
            </TableRow>
          ) : (
            visible.map((reminder) => (
              <ReminderRow
                key={reminder.id}
                reminder={reminder}
                dupInfo={dupMap.get(reminder.id)}
              />
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search, sort and add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש תזכורות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select
            value={reminderSortBy}
            onValueChange={(v) => setReminderSortBy(v as SortField)}
          >
            <SelectTrigger className="w-[150px]">
              <ArrowUpDown className="h-4 w-4 ml-2" />
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">תאריך יצירה</SelectItem>
              <SelectItem value="event_date">מועד תזכורת</SelectItem>
              <SelectItem value="title">שם</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setReminderSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            title={
              reminderSortOrder === "asc"
                ? "סדר עולה"
                : "סדר יורד"
            }
          >
            {reminderSortOrder === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <AddReminderDialog
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              תזכורת חדשה
            </Button>
          }
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">
              {pendingReminders.length}
            </p>
            <p className="text-xs text-muted-foreground">ממתינות</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[hsl(45,80%,45%)]">
              {todayReminders.length}
            </p>
            <p className="text-xs text-muted-foreground">היום</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">
              {overdueReminders.length}
            </p>
            <p className="text-xs text-muted-foreground">באיחור</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{reminders.length}</p>
            <p className="text-xs text-muted-foreground">סה״כ</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert */}
      {overdueReminders.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              יש {overdueReminders.length} תזכורות באיחור שדורשות טיפול
            </span>
          </CardContent>
        </Card>
      )}

      {/* Sub-tabs */}
      <Tabs
        defaultValue={overdueReminders.length > 0 ? "overdue" : "pending"}
        dir="rtl"
      >
        <TabsList>
          {overdueReminders.length > 0 && (
            <TabsTrigger value="overdue" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              באיחור ({overdueReminders.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            ממתינות ({pendingReminders.length})
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2">
            <Bell className="h-4 w-4" />
            היום ({todayReminders.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <Check className="h-4 w-4" />
            היסטוריה ({pastReminders.length})
          </TabsTrigger>
        </TabsList>

        {overdueReminders.length > 0 && (
          <TabsContent value="overdue" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ReminderTable items={overdueReminders} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ReminderTable items={pendingReminders} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ReminderTable items={todayReminders} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ReminderTable items={pastReminders} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת תזכורת</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את התזכורת? לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
