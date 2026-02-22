/**
 * ScheduledMessagesList - View and cancel scheduled messages
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Trash2, Loader2, CalendarClock } from "lucide-react";
import { format, isPast } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ScheduledMsg {
  id: string;
  conversation_id: string;
  conversation_title: string | null;
  content: string;
  scheduled_at: string;
  sender_name: string | null;
}

interface ScheduledMessagesListProps {
  open: boolean;
  onClose: () => void;
  conversationId?: string | null; // if given: filter by conv
}

export function ScheduledMessagesList({
  open,
  onClose,
  conversationId,
}: ScheduledMessagesListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [msgs, setMsgs] = useState<ScheduledMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchScheduled = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase
        .from("chat_scheduled_messages_view" as any)
        .select("*")
        .eq("sender_id", user.id);
      if (conversationId) q = q.eq("conversation_id", conversationId);
      const { data } = await q.order("scheduled_at");
      setMsgs((data || []) as ScheduledMsg[]);
    } finally {
      setLoading(false);
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (open) fetchScheduled();
  }, [open, fetchScheduled]);

  const cancelMsg = async (id: string) => {
    setRemoving(id);
    await supabase.from("chat_scheduled_messages").delete().eq("id", id);
    setMsgs((prev) => prev.filter((m) => m.id !== id));
    toast({ title: "🗑️ הודעה מתוזמנת בוטלה" });
    setRemoving(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock size={18} />
            הודעות מתוזמנות
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <CalendarClock size={40} className="text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">אין הודעות מתוזמנות</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-2 pr-1">
              {msgs.map((m) => {
                const scheduled = new Date(m.scheduled_at);
                const overdue = isPast(scheduled);
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border ${overdue ? "border-amber-200 bg-amber-50" : "bg-muted/30"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed line-clamp-3">
                          {m.content}
                        </p>
                        {!conversationId && m.conversation_title && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            📁 {m.conversation_title}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => cancelMsg(m.id)}
                        disabled={removing === m.id}
                      >
                        {removing === m.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock
                        size={11}
                        className={
                          overdue ? "text-amber-600" : "text-muted-foreground"
                        }
                      />
                      <span
                        className={`text-[11px] font-medium ${overdue ? "text-amber-600" : "text-muted-foreground"}`}
                      >
                        {format(scheduled, "EEEE, dd/MM/yyyy HH:mm", {
                          locale: he,
                        })}
                      </span>
                      {overdue && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 px-1 bg-amber-100 text-amber-700"
                        >
                          ממתין לשליחה
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
