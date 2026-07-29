import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  MessageSquareText,
  Pencil,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  type ActivityEntityType,
  type ActivityPostponement,
  getPostponePresetDate,
  toDateTimeLocalValue,
} from "@/lib/activityPostponements";
import { toast } from "sonner";

const FOLLOW_UP_QUERY_KEY = ["activity-postponements"] as const;

async function fetchActivityPostponements(): Promise<ActivityPostponement[]> {
  const { data, error } = await (supabase as any)
    .from("activity_postponements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ActivityPostponement[];
}

type ActivityFollowUpActionsProps = {
  entityType: ActivityEntityType;
  entityId: string;
  title: string;
  scheduledAt?: string | null;
  completed?: boolean;
  showComplete?: boolean;
  compact?: boolean;
  className?: string;
  onChanged?: () => void | Promise<void>;
};

export function ActivityFollowUpActions({
  entityType,
  entityId,
  title,
  scheduledAt,
  completed = false,
  showComplete = true,
  compact = false,
  className,
  onChanged,
}: ActivityFollowUpActionsProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("new");
  const [postponedTo, setPostponedTo] = useState("");
  const [reason, setReason] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingReason, setEditingReason] = useState("");
  const [editingNextAction, setEditingNextAction] = useState("");

  const { data: allPostponements = [] } = useQuery({
    queryKey: FOLLOW_UP_QUERY_KEY,
    queryFn: fetchActivityPostponements,
    staleTime: 30_000,
  });

  const history = useMemo(
    () =>
      allPostponements
        .filter(
          (entry) =>
            entry.entity_type === entityType && entry.entity_id === entityId,
        )
        .sort((a, b) => b.sequence_no - a.sequence_no),
    [allPostponements, entityId, entityType],
  );

  useEffect(() => {
    if (!open) return;
    const startingPoint = scheduledAt ? new Date(scheduledAt) : new Date();
    const validStartingPoint = Number.isNaN(startingPoint.getTime())
      ? new Date()
      : startingPoint;
    setPostponedTo(
      toDateTimeLocalValue(getPostponePresetDate("tomorrow", validStartingPoint)),
    );
    setReason("");
    setNextAction("");
    setEditingId(null);
    setTab(history.length > 0 ? "history" : "new");
  }, [history.length, open, scheduledAt]);

  const refreshRelatedViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: FOLLOW_UP_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["meetings"] }),
      queryClient.invalidateQueries({ queryKey: ["reminders"] }),
      queryClient.invalidateQueries({ queryKey: ["client-stages"] }),
    ]);
    await onChanged?.();
  };

  const choosePreset = (preset: "tomorrow" | "week") => {
    const base = scheduledAt ? new Date(scheduledAt) : new Date();
    const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
    setPostponedTo(toDateTimeLocalValue(getPostponePresetDate(preset, safeBase)));
  };

  const handlePostpone = async () => {
    if (!postponedTo || !reason.trim()) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).rpc("postpone_activity", {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_postponed_to: new Date(postponedTo).toISOString(),
        p_reason: reason.trim(),
        p_next_action: nextAction.trim() || null,
      });
      if (error) throw error;
      await refreshRelatedViews();
      toast.success("הפריט נדחה והסיבה נשמרה בהיסטוריה");
      setReason("");
      setNextAction("");
      setTab("history");
    } catch (error: any) {
      toast.error(error?.message || "לא ניתן לשמור את הדחייה");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const { error } = await (supabase as any).rpc("set_activity_completed", {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_completed: !completed,
      });
      if (error) throw error;
      await refreshRelatedViews();
      toast.success(completed ? "הפריט הוחזר לטיפול" : "הפריט סומן כהושלם");
    } catch (error: any) {
      toast.error(error?.message || "לא ניתן לעדכן את מצב ההשלמה");
    } finally {
      setCompleting(false);
    }
  };

  const startEditing = (entry: ActivityPostponement) => {
    setEditingId(entry.id);
    setEditingReason(entry.reason);
    setEditingNextAction(entry.next_action || "");
  };

  const saveHistoryEdit = async (entryId: string) => {
    if (!editingReason.trim()) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("activity_postponements")
        .update({
          reason: editingReason.trim(),
          next_action: editingNextAction.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entryId);
      if (error) throw error;
      await refreshRelatedViews();
      setEditingId(null);
      toast.success("ההערה עודכנה");
    } catch (error: any) {
      toast.error(error?.message || "לא ניתן לעדכן את ההערה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)} dir="rtl">
      {showComplete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            compact ? "h-7 w-7" : "h-8 w-8",
            completed
              ? "text-emerald-600 hover:text-emerald-700"
              : "text-muted-foreground hover:text-emerald-600",
          )}
          onClick={(event) => {
            event.stopPropagation();
            void handleComplete();
          }}
          disabled={completing}
          title={completed ? "החזר לטיפול" : "סמן כהושלם"}
          aria-label={completed ? `החזר לטיפול — ${title}` : `סמן כהושלם — ${title}`}
        >
          {completing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "relative text-muted-foreground hover:text-amber-600",
          compact ? "h-7 w-7" : "h-8 w-8",
        )}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        title="דחייה, סיבה והיסטוריה"
        aria-label={`דחייה והערות — ${title}${history.length ? ` — ${history.length}` : ""}`}
      >
        <MessageSquareText className="h-4 w-4" />
        {history.length > 0 && (
          <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
            {history.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[88vh] overflow-hidden sm:max-w-xl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-right">
              <Clock3 className="h-5 w-5 text-amber-600" />
              מעקב ודחיות — {title}
            </DialogTitle>
            <DialogDescription className="text-right">
              כל דחייה נשמרת כרשומה נפרדת ואינה מוחקת את הסיבות הקודמות.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab} dir="rtl" className="min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">דחייה חדשה</TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                היסטוריה ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => choosePreset("tomorrow")}>
                  למחר
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => choosePreset("week")}>
                  לעוד שבוע
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`postpone-date-${entityId}`}>מועד חדש</Label>
                <Input
                  id={`postpone-date-${entityId}`}
                  type="datetime-local"
                  value={postponedTo}
                  onChange={(event) => setPostponedTo(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`postpone-reason-${entityId}`}>למה לא הושלם? *</Label>
                <Textarea
                  id={`postpone-reason-${entityId}`}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="כתוב את הסיבה לדחייה..."
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`postpone-action-${entityId}`}>מה נדרש לעשות?</Label>
                <Textarea
                  id={`postpone-action-${entityId}`}
                  value={nextAction}
                  onChange={(event) => setNextAction(event.target.value)}
                  placeholder="הפעולה הבאה הנדרשת כדי להשלים..."
                  rows={2}
                />
              </div>
              <DialogFooter className="flex-row-reverse gap-2">
                <Button onClick={() => void handlePostpone()} disabled={saving || !postponedTo || !reason.trim()}>
                  {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  שמור דחייה
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="history" className="mt-4 max-h-[55vh] space-y-3 overflow-y-auto pl-1">
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  עדיין אין דחיות לפריט זה.
                </div>
              ) : (
                history.map((entry) => (
                  <section key={entry.id} className="rounded-xl border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                          {entry.sequence_no}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          נדחה ל־{format(new Date(entry.postponed_to), "dd/MM/yyyy HH:mm", { locale: he })}
                        </span>
                      </div>
                      {editingId !== entry.id && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(entry)} title="עריכת ההערה">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {editingId === entry.id ? (
                      <div className="space-y-2">
                        <Textarea value={editingReason} onChange={(event) => setEditingReason(event.target.value)} rows={2} />
                        <Textarea value={editingNextAction} onChange={(event) => setEditingNextAction(event.target.value)} rows={2} placeholder="מה נדרש לעשות?" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => void saveHistoryEdit(entry.id)} disabled={saving || !editingReason.trim()}>
                            <Save className="ml-1 h-3.5 w-3.5" /> שמור
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>ביטול</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <p><span className="font-semibold">הסיבה:</span> {entry.reason}</p>
                        {entry.next_action && <p><span className="font-semibold">נדרש לעשות:</span> {entry.next_action}</p>}
                        <p className="text-xs text-muted-foreground">
                          נרשם ב־{format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                        </p>
                      </div>
                    )}
                  </section>
                ))
              )}
              <Button variant="outline" className="w-full" onClick={() => setTab("new")}>
                הוסף דחייה נוספת
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
