import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import { Pencil, Calendar, Clock, MapPin, Bell, FileText, Flag, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface EventPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
  type: "task" | "meeting" | "reminder";
  pinned?: boolean;
  onPinToggle?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onEdit?: () => void;
}

const priorityLabels: Record<string, string> = {
  high: "גבוהה",
  medium: "בינונית",
  low: "נמוכה",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const statusLabels: Record<string, string> = {
  pending: "ממתין",
  in_progress: "בביצוע",
  completed: "הושלם",
};

const reminderTypeLabels: Record<string, string> = {
  browser: "התראת דפדפן",
  popup: "חלון קופץ",
  email: "אימייל",
  voice: "הקראה קולית",
};

export function EventPreviewDialog({
  open,
  onOpenChange,
  event,
  type,
  pinned = false,
  onPinToggle,
  onPointerEnter,
  onPointerLeave,
  onEdit,
}: EventPreviewDialogProps) {
  if (!event) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE, d בMMMM yyyy · HH:mm", { locale: he });
    } catch {
      return dateStr;
    }
  };

  const reminderDefaultAt =
    event.start_time || event.due_date || event.remind_at
      ? format(new Date(event.start_time || event.due_date || event.remind_at), "yyyy-MM-dd'T'HH:mm")
      : "";

  const reminderTitle =
    type === "meeting"
      ? `תזכורת לפגישה: ${event.title}`
      : type === "task"
        ? `תזכורת למשימה: ${event.title}`
        : `תזכורת: ${event.title}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        dir="rtl"
        onMouseEnter={onPointerEnter}
        onMouseLeave={onPointerLeave}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            {type === "task" && <FileText className="h-5 w-5 text-primary" />}
            {type === "meeting" && <Calendar className="h-5 w-5 text-blue-500" />}
            {type === "reminder" && <Bell className="h-5 w-5 text-amber-500" />}
            <span className="truncate">{event.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 mt-1">
          <Badge variant={pinned ? "default" : "outline"} className="text-xs">
            {pinned ? "מצב עינית פעיל" : "תצוגה מקדימה"}
          </Badge>
          <div className="flex items-center gap-2">
            {pinned && (
              <AddReminderDialog
                entityType={type}
                entityId={event.id}
                initialValues={{
                  title: reminderTitle,
                  message: event.description || "",
                  remind_at: reminderDefaultAt,
                  client_id: event.client_id || undefined,
                }}
                trigger={
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <Bell className="h-3.5 w-3.5" />
                    תזכורת
                  </Button>
                }
              />
            )}
            {onPinToggle && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={onPinToggle}
                title={pinned ? "בטל קיבוע" : "קבע דיאלוג"}
              >
                {pinned ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 mt-2">
          {/* Task fields */}
          {type === "task" && (
            <>
              {event.description && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">תיאור</p>
                  <p className="text-sm whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
              {event.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(event.due_date)}</span>
                </div>
              )}
              {event.status && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">סטטוס:</span>
                  <Badge variant="outline">{statusLabels[event.status] || event.status}</Badge>
                </div>
              )}
              {event.priority && (
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className={priorityColors[event.priority]}>
                    {priorityLabels[event.priority] || event.priority}
                  </Badge>
                </div>
              )}
            </>
          )}

          {/* Meeting fields */}
          {type === "meeting" && (
            <>
              {event.description && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">תיאור</p>
                  <p className="text-sm whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
              {event.start_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(event.start_time)}</span>
                  {event.end_time && (
                    <span className="text-muted-foreground">
                      — {format(new Date(event.end_time), "HH:mm", { locale: he })}
                    </span>
                  )}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
            </>
          )}

          {/* Reminder fields */}
          {type === "reminder" && (
            <>
              {event.message && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">הודעה</p>
                  <p className="text-sm whitespace-pre-wrap">{event.message}</p>
                </div>
              )}
              {event.remind_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(event.remind_at)}</span>
                </div>
              )}
              {event.reminder_type && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">סוג:</span>
                  <Badge variant="outline">{reminderTypeLabels[event.reminder_type] || event.reminder_type}</Badge>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">סטטוס:</span>
                {event.is_dismissed ? (
                  <Badge variant="secondary">בוטלה</Badge>
                ) : event.is_sent ? (
                  <Badge className="bg-green-600 text-white">נשלחה</Badge>
                ) : (
                  <Badge variant="outline">ממתינה</Badge>
                )}
              </div>
            </>
          )}

          {event.created_at && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              נוצר: {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
            </div>
          )}
        </div>

        {onEdit && (
          <div className="flex justify-start mt-4">
            <Button onClick={() => { onEdit(); onOpenChange(false); }} className="gap-2">
              <Pencil className="h-4 w-4" />
              עריכה
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
