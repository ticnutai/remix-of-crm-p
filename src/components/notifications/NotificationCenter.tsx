// קומפוננטת מרכז התראות
// תצוגת התראות עם סינון, סנוז, מחיקה, עריכה וסנכרון

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Pencil,
  Trash2,
  Clock,
  Volume2,
  VolumeX,
  AlarmClockOff,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Notification,
  NotificationType,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  snoozeNotification,
  updateNotification,
  dismissEntityReminders,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_ICONS,
  PRIORITY_COLORS,
  SNOOZE_OPTIONS,
} from "@/lib/notifications";
import { formatDistanceToNow, format } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// Sound Management
// ============================================================================
const NOTIFICATION_SOUND_KEY = "notification_sound_enabled";

function getNotificationSoundEnabled(): boolean {
  const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY);
  return stored !== "false"; // default = enabled
}

function playNotificationSound() {
  if (!getNotificationSoundEnabled()) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
}

// ============================================================================
// Component
// ============================================================================
export function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [soundEnabled, setSoundEnabled] = useState(getNotificationSoundEnabled);
  const [editingNotification, setEditingNotification] =
    useState<Notification | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const prevUnreadRef = useRef(0);

  // שליפת התראות מ-notifications table
  const { data: dbNotifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user?.id || "", { limit: 50 }),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // שליפת תזכורות ופגישות ישירות (כמו שהיה ב-AppHeader)
  const { data: liveItems = [] } = useQuery<Notification[]>({
    queryKey: ["notifications-live", user?.id],
    queryFn: async () => {
      const items: Notification[] = [];
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // תזכורות קרובות
      const { data: reminders } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_dismissed", false)
        .lte("remind_at", tomorrow.toISOString())
        .order("remind_at", { ascending: true })
        .limit(15);

      reminders?.forEach((r) => {
        items.push({
          id: r.id,
          user_id: r.user_id,
          type: "task" as NotificationType,
          title: r.title,
          message: r.message || "תזכורת",
          is_read: r.is_sent || false,
          created_at: r.remind_at,
          metadata: {
            entity_type: "reminder",
            entity_id: r.id,
            source: "reminders",
          },
          priority: "medium",
        } as Notification);
      });

      // פגישות קרובות
      const { data: meetings } = await supabase
        .from("meetings")
        .select("*")
        .eq("created_by", user!.id)
        .gte("start_time", now.toISOString())
        .lte("start_time", tomorrow.toISOString())
        .order("start_time", { ascending: true })
        .limit(10);

      meetings?.forEach((m) => {
        items.push({
          id: m.id,
          user_id: m.created_by,
          type: "meeting" as NotificationType,
          title: m.title,
          message: `פגישה ב-${format(new Date(m.start_time), "HH:mm", { locale: he })}`,
          is_read: false,
          created_at: m.start_time,
          metadata: {
            entity_type: "meeting",
            entity_id: m.id,
            source: "meetings",
          },
          priority: "medium",
        } as Notification);
      });

      return items;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // מיזוג - notifications table + reminders + meetings, ללא כפילויות
  const notifications = React.useMemo(() => {
    const seen = new Set<string>();
    const all: Notification[] = [];

    // תחילה reminders/meetings (חיים מה-DB)
    for (const item of liveItems) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }

    // אח"כ notifications table
    for (const item of dbNotifications) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }

    // מיון לפי תאריך (חדש ראשון)
    all.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return all;
  }, [dbNotifications, liveItems]);

  // ספירת לא נקראו (כולל live items)
  const unreadCount = React.useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // צליל על התראה חדשה
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && prevUnreadRef.current > 0) {
      playNotificationSound();
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem(NOTIFICATION_SOUND_KEY, String(newVal));
    toast({ title: newVal ? "🔔 צלילים מופעלים" : "🔕 צלילים מושתקים" });
  }, [soundEnabled, toast]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-live"] });
  }, [queryClient]);

  // סימון כנקראה (handles both notifications and reminders)
  const handleMarkRead = useCallback(
    async (notification: Notification) => {
      const meta = notification.metadata as Record<string, any> | null;
      if (meta?.source === "reminders") {
        await supabase
          .from("reminders")
          .update({ is_sent: true })
          .eq("id", notification.id);
      } else if (meta?.source !== "meetings") {
        await markAsRead(notification.id);
      }
      invalidateAll();
    },
    [invalidateAll],
  );

  // סימון הכל כנקרא
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(user?.id || ""),
    onSuccess: invalidateAll,
  });

  // מחיקה
  const deleteMutation = useMutation({
    mutationFn: dismissNotification,
    onSuccess: () => {
      invalidateAll();
      toast({ title: "🗑️ התראה נמחקה" });
    },
  });

  // סנוז - handles both notifications table entries and live reminders
  const snoozeMutation = useMutation({
    mutationFn: async ({
      id,
      minutes,
      source,
    }: {
      id: string;
      minutes: number;
      source?: string;
    }) => {
      const snoozeUntil = new Date();
      snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

      if (source === "reminders") {
        // עדכון remind_at של התזכורת
        await supabase
          .from("reminders")
          .update({ remind_at: snoozeUntil.toISOString(), is_sent: false })
          .eq("id", id);
      } else if (source !== "meetings") {
        await snoozeNotification(id, minutes);
      }
    },
    onSuccess: (_, { minutes }) => {
      invalidateAll();
      const label =
        SNOOZE_OPTIONS.find((o) => o.minutes === minutes)?.label ||
        `${minutes} דקות`;
      toast({ title: `⏰ נדחה ל-${label}` });
    },
  });

  // עריכה
  const editMutation = useMutation({
    mutationFn: ({
      id,
      title,
      message,
    }: {
      id: string;
      title: string;
      message: string;
    }) => updateNotification(id, { title, message }),
    onSuccess: () => {
      invalidateAll();
      setEditingNotification(null);
      toast({ title: "✏️ התראה עודכנה" });
    },
  });

  // ביטול תזכורות לישות (סנכרון) - מוחק התראה + משהו את כל ה-reminders הקשורים
  const dismissEntityMutation = useMutation({
    mutationFn: ({
      entityType,
      entityId,
    }: {
      entityType: string;
      entityId: string;
    }) => dismissEntityReminders(user?.id || "", entityType, entityId),
    onSuccess: () => {
      invalidateAll();
      // רענון גם את ה-reminders בכל הטאבים
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["today-data"] });
      toast({ title: "🔕 כל התזכורות לישות זו בוטלו" });
    },
  });

  // לחיצה על התראה
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    }
  };

  // פתיחת עריכה
  const handleEditOpen = (notification: Notification) => {
    setEditingNotification(notification);
    setEditTitle(notification.title);
    setEditMessage(notification.message);
  };

  const handleEditSave = () => {
    if (editingNotification) {
      editMutation.mutate({
        id: editingNotification.id,
        title: editTitle,
        message: editMessage,
      });
    }
  };

  // מחיקה + ביטול reminders קשורים
  const handleDelete = async (notification: Notification) => {
    const meta = notification.metadata as Record<string, any> | null;
    const source = meta?.source;

    if (source === "reminders") {
      // dismiss reminder
      await supabase
        .from("reminders")
        .update({ is_dismissed: true })
        .eq("id", notification.id);
      invalidateAll();
      toast({ title: "🗑️ תזכורת בוטלה" });
    } else if (source === "meetings") {
      // silently remove from list (can't delete meetings, just dismiss)
      invalidateAll();
      toast({ title: "🗑️ פגישה הוסרה מההתראות" });
    } else {
      // מחיקת notification מה-DB
      deleteMutation.mutate(notification.id);
    }

    // אם יש entity משויך, בטל גם reminders קשורים
    if (meta?.entity_type && meta?.entity_id) {
      dismissEntityMutation.mutate({
        entityType: meta.entity_type,
        entityId: meta.entity_id,
      });
    }
  };

  // ביטול כל תזכורות לישות
  const handleDismissEntity = (notification: Notification) => {
    const meta = notification.metadata as Record<string, any> | null;
    const entityType = meta?.entity_type || notification.type;
    const entityId = meta?.entity_id || notification.id;

    dismissEntityMutation.mutate({ entityType, entityId });
    // גם מחיקת ההתראה הנוכחית
    deleteMutation.mutate(notification.id);
  };

  // סינון לפי טאב — סנוז מוסתר אם עדיין בתוקף
  const now = new Date();
  const filteredNotifications = notifications.filter((n) => {
    // הסתר snoozed שעדיין בתוקף
    const meta = n.metadata as Record<string, any> | null;
    if (meta?.snoozed && meta?.snooze_until) {
      if (new Date(meta.snooze_until) > now) return false;
    }

    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.is_read;
    if (activeTab === "payments")
      return n.type === "payment_due" || n.type === "payment_overdue";
    if (activeTab === "deadlines")
      return n.type === "deadline" || n.type === "contract_expiry";
    return true;
  });

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                variant="destructive"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="end" dir="rtl">
          {/* כותרת */}
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">התראות</h3>
            <div className="flex items-center gap-1">
              {/* Sound toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={toggleSound}
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {soundEnabled ? "השתק צלילים" : "הפעל צלילים"}
                </TooltipContent>
              </Tooltip>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => markAllReadMutation.mutate()}
                >
                  <CheckCheck className="h-3 w-3 ml-1" />
                  סמן הכל
                </Button>
              )}
            </div>
          </div>

          {/* טאבים */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-xs"
              >
                הכל
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-xs"
              >
                לא נקראו
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="mr-1 text-xs h-4 px-1">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-xs"
              >
                תשלומים
              </TabsTrigger>
              <TabsTrigger
                value="deadlines"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-xs"
              >
                דדליינים
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[400px]">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-2 opacity-50" />
                    <p>אין התראות</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => {
                      const meta = notification.metadata as Record<
                        string,
                        any
                      > | null;
                      const hasEntity = !!(
                        meta?.entity_type && meta?.entity_id
                      );

                      return (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-muted/50 transition-colors group ${
                            !notification.is_read ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* אייקון סוג */}
                            <div
                              className="text-2xl flex-shrink-0 cursor-pointer"
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                            >
                              {NOTIFICATION_ICONS[
                                notification.type as NotificationType
                              ] || "📌"}
                            </div>

                            {/* תוכן */}
                            <div className="flex-1 min-w-0">
                              <div
                                className="cursor-pointer"
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                              >
                                <p
                                  className={`text-sm ${!notification.is_read ? "font-bold" : "font-medium"}`}
                                >
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                  {notification.message}
                                </p>
                              </div>

                              {/* Badge + time */}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${PRIORITY_COLORS[notification.priority || "medium"]}`}
                                >
                                  {NOTIFICATION_TYPE_LABELS[
                                    notification.type as NotificationType
                                  ] || "התראה"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(
                                    new Date(notification.created_at),
                                    {
                                      addSuffix: true,
                                      locale: he,
                                    },
                                  )}
                                </span>
                              </div>

                              {/* === Action Buttons Row === */}
                              <div className="flex items-center gap-1 mt-2 opacity-60 group-hover:opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                {/* Mark read/unread */}
                                {!notification.is_read && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkRead(notification);
                                        }}
                                      >
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>סמן כנקרא</TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Edit */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditOpen(notification);
                                      }}
                                    >
                                      <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>עריכה</TooltipContent>
                                </Tooltip>

                                {/* Snooze dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      title="סנוז"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="direction-rtl">
                                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                      הזכר לי שוב...
                                    </div>
                                    <DropdownMenuSeparator />
                                    {SNOOZE_OPTIONS.map((option) => (
                                      <DropdownMenuItem
                                        key={option.minutes}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          snoozeMutation.mutate({
                                            id: notification.id,
                                            minutes: option.minutes,
                                            source: (
                                              notification.metadata as Record<
                                                string,
                                                any
                                              >
                                            )?.source,
                                          });
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Clock className="h-3.5 w-3.5 ml-2" />
                                        {option.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Dismiss entity reminders (sync across tabs) */}
                                {(hasEntity ||
                                  notification.type === "meeting" ||
                                  notification.type === "task") && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDismissEntity(notification);
                                        }}
                                      >
                                        <AlarmClockOff className="h-3.5 w-3.5 text-purple-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      בטל כל תזכורות לפריט זה
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Delete */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(notification);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>מחק</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      {/* === Edit Dialog === */}
      <Dialog
        open={!!editingNotification}
        onOpenChange={(v) => !v && setEditingNotification(null)}
      >
        <DialogContent dir="rtl" className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>עריכת התראה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">כותרת</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="כותרת ההתראה"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">הודעה</label>
              <Textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder="תוכן ההתראה"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingNotification(null)}
            >
              ביטול
            </Button>
            <Button onClick={handleEditSave} disabled={editMutation.isPending}>
              {editMutation.isPending ? "שומר..." : "שמור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default NotificationCenter;
