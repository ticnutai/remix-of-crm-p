import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  format,
  addDays,
  addHours,
  addMinutes,
  isBefore,
  isAfter,
} from "date-fns";
import { he } from "date-fns/locale";
import {
  Bell,
  Plus,
  Trash2,
  Check,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BellRing,
} from "lucide-react";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  remind_at: string;
  reminder_type: string;
  is_completed: boolean;
  is_snoozed: boolean;
  snooze_until?: string;
  related_type?: string;
  related_id?: string;
  created_at: string;
}

const REMINDER_TYPES = {
  task: { label: "משימה", color: "bg-blue-100 text-blue-700" },
  meeting: { label: "פגישה", color: "bg-green-100 text-green-700" },
  call: { label: "שיחה", color: "bg-yellow-100 text-yellow-700" },
  deadline: { label: "דדליין", color: "bg-red-100 text-red-700" },
  followup: { label: "מעקב", color: "bg-purple-100 text-purple-700" },
  other: { label: "אחר", color: "bg-gray-100 text-gray-700" },
};

function useReminders() {
  return useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reminders")
        .select("*")
        .order("remind_at", { ascending: true });
      if (error) throw error;
      return data as Reminder[];
    },
  });
}

export function RemindersManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">(
    "pending",
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: reminders = [], isLoading } = useReminders();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reminder_type: "task",
    remind_date: format(new Date(), "yyyy-MM-dd"),
    remind_time: format(addHours(new Date(), 1), "HH:mm"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const remind_at = new Date(
        `${data.remind_date}T${data.remind_time}`,
      ).toISOString();
      const { error } = await (supabase as any).from("reminders").insert({
        title: data.title,
        message: data.description || null,
        reminder_type: data.reminder_type,
        remind_at,
        user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({ title: "התזכורת נוצרה בהצלחה" });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        reminder_type: "task",
        remind_date: format(new Date(), "yyyy-MM-dd"),
        remind_time: format(addHours(new Date(), 1), "HH:mm"),
      });
    },
    onError: () => {
      toast({ title: "שגיאה ביצירת התזכורת", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({
      id,
      is_completed,
    }: {
      id: string;
      is_completed: boolean;
    }) => {
      const { error } = await (supabase as any)
        .from("reminders")
        .update({ is_completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, minutes }: { id: string; minutes: number }) => {
      const snooze_until = addMinutes(new Date(), minutes).toISOString();
      const { error } = await (supabase as any)
        .from("reminders")
        .update({ is_snoozed: true, snooze_until })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({ title: "התזכורת הונדתה" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("reminders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({ title: "התזכורת נמחקה" });
    },
  });

  // Filter reminders
  const filteredReminders = reminders.filter((reminder) => {
    if (filter === "pending") return !reminder.is_completed;
    if (filter === "completed") return reminder.is_completed;
    return true;
  });

  // Group by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = addDays(today, 1);

  const overdueReminders = filteredReminders.filter(
    (r) => !r.is_completed && isBefore(new Date(r.remind_at), today),
  );
  const todayReminders = filteredReminders.filter((r) => {
    const date = new Date(r.remind_at);
    return !isBefore(date, today) && isBefore(date, tomorrow);
  });
  const upcomingReminders = filteredReminders.filter((r) =>
    isAfter(new Date(r.remind_at), tomorrow),
  );
  const completedReminders = filteredReminders.filter((r) => r.is_completed);

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const typeConfig =
      REMINDER_TYPES[reminder.reminder_type as keyof typeof REMINDER_TYPES] ||
      REMINDER_TYPES.other;
    const isOverdue =
      !reminder.is_completed &&
      isBefore(new Date(reminder.remind_at), new Date());

    return (
      <Card
        className={`${reminder.is_completed ? "opacity-60" : ""} ${isOverdue ? "border-red-300" : ""}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={reminder.is_completed}
              onCheckedChange={(checked) =>
                completeMutation.mutate({
                  id: reminder.id,
                  is_completed: !!checked,
                })
              }
              className="mt-1"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-medium ${reminder.is_completed ? "line-through" : ""}`}
                >
                  {reminder.title}
                </span>
                <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                {isOverdue && <Badge variant="destructive">באיחור</Badge>}
              </div>

              {reminder.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {reminder.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Clock className="h-3 w-3" />
                {format(
                  new Date(reminder.remind_at),
                  "EEEE, d בMMMM בשעה HH:mm",
                  { locale: he },
                )}
              </div>
            </div>

            <div className="flex gap-1">
              {!reminder.is_completed && (
                <Select
                  onValueChange={(v) =>
                    snoozeMutation.mutate({
                      id: reminder.id,
                      minutes: parseInt(v),
                    })
                  }
                >
                  <SelectTrigger className="w-auto h-8 px-2">
                    <Clock className="h-3 w-3" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="15">הנדה ל-15 דקות</SelectItem>
                    <SelectItem value="30">הנדה ל-30 דקות</SelectItem>
                    <SelectItem value="60">הנדה לשעה</SelectItem>
                    <SelectItem value="1440">הנדה למחר</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (confirm("האם למחוק את התזכורת?")) {
                    deleteMutation.mutate(reminder.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ReminderGroup = ({
    title,
    reminders,
    icon: Icon,
    iconColor,
  }: {
    title: string;
    reminders: Reminder[];
    icon: any;
    iconColor: string;
  }) => {
    if (reminders.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <h2 className="font-semibold">{title}</h2>
          <Badge variant="outline">{reminders.length}</Badge>
        </div>
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          תזכורות
        </h1>

        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">פעילות</SelectItem>
              <SelectItem value="completed">הושלמו</SelectItem>
              <SelectItem value="all">הכל</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                תזכורת חדשה
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>יצירת תזכורת</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(formData);
                }}
                className="space-y-4"
              >
                <Input
                  placeholder="כותרת התזכורת"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />

                <Textarea
                  placeholder="פרטים נוספים (אופציונלי)"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />

                <div>
                  <label className="text-sm font-medium">סוג</label>
                  <Select
                    value={formData.reminder_type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, reminder_type: v })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REMINDER_TYPES).map(
                        ([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">תאריך</label>
                    <Input
                      type="date"
                      value={formData.remind_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          remind_date: e.target.value,
                        })
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">שעה</label>
                    <Input
                      type="time"
                      value={formData.remind_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          remind_time: e.target.value,
                        })
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "יוצר..." : "צור תזכורת"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">טוען...</div>
      ) : filteredReminders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BellRing className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">אין תזכורות</h3>
            <p className="text-muted-foreground mt-1">
              צור תזכורת חדשה כדי לא לפספס דברים חשובים
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ReminderGroup
            title="באיחור"
            reminders={overdueReminders}
            icon={AlertTriangle}
            iconColor="text-red-500"
          />
          <ReminderGroup
            title="היום"
            reminders={todayReminders}
            icon={Calendar}
            iconColor="text-blue-500"
          />
          <ReminderGroup
            title="בקרוב"
            reminders={upcomingReminders}
            icon={Clock}
            iconColor="text-green-500"
          />
          {filter !== "pending" && (
            <ReminderGroup
              title="הושלמו"
              reminders={completedReminders}
              icon={CheckCircle2}
              iconColor="text-gray-400"
            />
          )}
        </>
      )}
    </div>
  );
}

export default RemindersManager;
