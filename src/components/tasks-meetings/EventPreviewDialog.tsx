import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import {
  Pencil,
  Calendar,
  Clock,
  MapPin,
  Bell,
  FileText,
  Flag,
  Eye,
  EyeOff,
  X,
  Minus,
  Plus,
  SlidersHorizontal,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface EventPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
  type: "task" | "meeting" | "reminder";
  anchorPoint?: { x: number; y: number } | null;
  hoverOpenDelayMs: number;
  hoverCloseDelayMs: number;
  onHoverDelaysChange?: (openDelayMs: number, closeDelayMs: number) => void;
  pinned?: boolean;
  onPinToggle?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onEdit?: () => void;
}

const DIALOG_UI_SETTINGS_KEY = "tasks-meetings-preview-dialog-ui";
const NAVY = "#162C58";
const GOLD = "#D4A843";
const MIN_DIALOG_WIDTH = 320;
const MAX_DIALOG_WIDTH = 640;
const DIALOG_WIDTH_STEP = 24;

const clampDelay = (value: number) => Math.min(1000, Math.max(0, value));
const clampWidth = (value: number) => Math.min(MAX_DIALOG_WIDTH, Math.max(MIN_DIALOG_WIDTH, value));

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
  anchorPoint,
  hoverOpenDelayMs,
  hoverCloseDelayMs,
  onHoverDelaysChange,
  pinned = false,
  onPinToggle,
  onPointerEnter,
  onPointerLeave,
  onEdit,
}: EventPreviewDialogProps) {
  const [dialogWidth, setDialogWidth] = useState(420);
  const [dialogHeight, setDialogHeight] = useState<number | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const resizingRef = useRef<{ edge: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((edge: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = contentRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    resizingRef.current = { edge, startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height };

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const { edge: ed, startX, startY, startW, startH } = resizingRef.current;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (ed.includes("e")) setDialogWidth(clampWidth(startW + dx));
      if (ed.includes("w")) setDialogWidth(clampWidth(startW - dx));
      if (ed.includes("s")) setDialogHeight(Math.max(200, startH + dy));
      if (ed.includes("n")) setDialogHeight(Math.max(200, startH - dy));
    };
    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DIALOG_UI_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { width?: number };
      if (typeof parsed.width === "number") {
        setDialogWidth(clampWidth(parsed.width));
      }
    } catch {
      setDialogWidth(420);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DIALOG_UI_SETTINGS_KEY,
      JSON.stringify({ width: dialogWidth }),
    );
  }, [dialogWidth]);

  const anchoredStyle = useMemo(() => {
    if (!anchorPoint) return undefined;
    const margin = 12;
    const responsiveWidth = Math.min(dialogWidth, window.innerWidth - margin * 2);
    const maxLeft = Math.max(margin, window.innerWidth - responsiveWidth - margin);
    const left = Math.min(Math.max(anchorPoint.x, margin), maxLeft);
    const maxTop = Math.max(margin, window.innerHeight - 560 - margin);
    const top = Math.min(Math.max(anchorPoint.y, margin), maxTop);
    return {
      left: `${left}px`,
      top: `${top}px`,
      transform: "none",
      width: `${responsiveWidth}px`,
    } as const;
  }, [anchorPoint, dialogWidth]);

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

  const setPresetSize = (preset: "small" | "medium" | "large") => {
    if (preset === "small") setDialogWidth(360);
    if (preset === "medium") setDialogWidth(420);
    if (preset === "large") setDialogWidth(520);
  };

  const setDelayPreset = (openDelay: number, closeDelay: number) => {
    onHoverDelaysChange?.(clampDelay(openDelay), clampDelay(closeDelay));
  };

  const handleStyle = "absolute z-20 opacity-0 hover:opacity-100 transition-opacity";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          ref={contentRef}
          className={cn(
            "fixed left-[50%] top-[50%] z-[401] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border-2 bg-white p-6 text-right shadow-lg duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-lg overflow-y-auto",
            anchoredStyle && "max-w-none",
          )}
          style={{
            borderColor: GOLD,
            color: NAVY,
            maxHeight: dialogHeight ? `${dialogHeight}px` : "90vh",
            ...(anchoredStyle ?? {
              width: `${Math.min(dialogWidth, window.innerWidth - 24)}px`,
            }),
          }}
          dir="rtl"
          onMouseEnter={onPointerEnter}
          onMouseLeave={onPointerLeave}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          {/* Resize handles */}
          <div className={cn(handleStyle, "left-0 top-0 bottom-0 w-1.5 cursor-w-resize")} style={{ background: `${GOLD}66` }} onMouseDown={(e) => startResize("w", e)} />
          <div className={cn(handleStyle, "right-0 top-0 bottom-0 w-1.5 cursor-e-resize")} style={{ background: `${GOLD}66` }} onMouseDown={(e) => startResize("e", e)} />
          <div className={cn(handleStyle, "left-0 right-0 bottom-0 h-1.5 cursor-s-resize")} style={{ background: `${GOLD}66` }} onMouseDown={(e) => startResize("s", e)} />
          <div className={cn(handleStyle, "left-0 right-0 top-0 h-1.5 cursor-n-resize")} style={{ background: `${GOLD}66` }} onMouseDown={(e) => startResize("n", e)} />
          {/* Corner handles */}
          <div className={cn(handleStyle, "right-0 bottom-0 w-3 h-3 cursor-se-resize")} style={{ background: `${GOLD}88` }} onMouseDown={(e) => startResize("se", e)} />
          <div className={cn(handleStyle, "left-0 bottom-0 w-3 h-3 cursor-sw-resize")} style={{ background: `${GOLD}88` }} onMouseDown={(e) => startResize("sw", e)} />
        <div className="flex flex-col space-y-1.5 text-center sm:text-right">
          <DialogPrimitive.Title className="flex items-center gap-2 text-right text-lg font-semibold leading-none tracking-tight" style={{ color: NAVY }}>
            {type === "task" && <FileText className="h-5 w-5" style={{ color: NAVY }} />}
            {type === "meeting" && <Calendar className="h-5 w-5" style={{ color: NAVY }} />}
            {type === "reminder" && <Bell className="h-5 w-5" style={{ color: NAVY }} />}
            <span className="truncate">{event.title}</span>
          </DialogPrimitive.Title>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <Badge
            variant={pinned ? "default" : "outline"}
            className="text-xs"
            style={pinned ? { backgroundColor: NAVY, color: "#fff" } : { borderColor: GOLD, color: NAVY }}
          >
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
                  <Button variant="outline" size="sm" className="h-8 gap-1.5" style={{ borderColor: GOLD, color: NAVY }}>
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
                style={{ color: NAVY }}
              >
                {pinned ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: `${GOLD}99` }}>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setDialogWidth((prev) => clampWidth(prev - DIALOG_WIDTH_STEP))}
              title="הקטן דיאלוג"
              style={{ color: NAVY }}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setDialogWidth((prev) => clampWidth(prev + DIALOG_WIDTH_STEP))}
              title="הגדל דיאלוג"
              style={{ color: NAVY }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPresetSize("small")} style={{ borderColor: GOLD, color: NAVY }}>קטן</Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPresetSize("medium")} style={{ borderColor: GOLD, color: NAVY }}>בינוני</Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPresetSize("large")} style={{ borderColor: GOLD, color: NAVY }}>גדול</Button>
          </div>
        </div>

        <div className="space-y-4 mt-2">
          {/* Task fields */}
          {type === "task" && (
            <>
              {event.description && (
                <div className="space-y-1">
                  <p className="text-xs font-medium" style={{ color: NAVY }}>תיאור</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: NAVY }}>{event.description}</p>
                </div>
              )}
              {event.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" style={{ color: NAVY }} />
                  <span style={{ color: NAVY }}>{formatDate(event.due_date)}</span>
                </div>
              )}
              {event.status && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: NAVY }}>סטטוס:</span>
                  <Badge variant="outline" style={{ borderColor: GOLD, color: NAVY }}>{statusLabels[event.status] || event.status}</Badge>
                </div>
              )}
              {event.priority && (
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4" style={{ color: NAVY }} />
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
                  <p className="text-xs font-medium" style={{ color: NAVY }}>תיאור</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: NAVY }}>{event.description}</p>
                </div>
              )}
              {event.start_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" style={{ color: NAVY }} />
                  <span style={{ color: NAVY }}>{formatDate(event.start_time)}</span>
                  {event.end_time && (
                    <span style={{ color: NAVY }}>
                      — {format(new Date(event.end_time), "HH:mm", { locale: he })}
                    </span>
                  )}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" style={{ color: NAVY }} />
                  <span style={{ color: NAVY }}>{event.location}</span>
                </div>
              )}
            </>
          )}

          {/* Reminder fields */}
          {type === "reminder" && (
            <>
              {event.message && (
                <div className="space-y-1">
                  <p className="text-xs font-medium" style={{ color: NAVY }}>הודעה</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: NAVY }}>{event.message}</p>
                </div>
              )}
              {event.remind_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" style={{ color: NAVY }} />
                  <span style={{ color: NAVY }}>{formatDate(event.remind_at)}</span>
                </div>
              )}
              {event.reminder_type && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: NAVY }}>סוג:</span>
                  <Badge variant="outline" style={{ borderColor: GOLD, color: NAVY }}>{reminderTypeLabels[event.reminder_type] || event.reminder_type}</Badge>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: NAVY }}>סטטוס:</span>
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
            <div className="text-xs pt-2 border-t" style={{ color: NAVY, borderColor: `${GOLD}66` }}>
              נוצר: {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
            </div>
          )}
        </div>

        {onEdit && (
          <div className="flex justify-start mt-4">
            <Button
              onClick={() => {
                onEdit();
                onOpenChange(false);
              }}
              className="gap-2"
              style={{ backgroundColor: NAVY, color: "#fff" }}
            >
              <Pencil className="h-4 w-4" />
              עריכה
            </Button>
          </div>
        )}

        {settingsOpen && (
          <div className="absolute left-2 top-12 z-10 w-[280px] rounded-md border bg-white p-3 shadow-md" style={{ borderColor: GOLD }}>
            <div className="mb-2 text-xs font-semibold" style={{ color: NAVY }}>
              הגדרות Hover (ms)
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min={0}
                max={1000}
                value={hoverOpenDelayMs}
                onChange={(event) =>
                  onHoverDelaysChange?.(
                    clampDelay(Number(event.target.value || 0)),
                    hoverCloseDelayMs,
                  )
                }
                className="h-8 w-full rounded border px-2 text-xs"
                style={{ borderColor: `${GOLD}99`, color: NAVY }}
                aria-label="זמן פתיחה במילישניות"
                title="זמן פתיחת דיאלוג בהובר (0-1000ms)"
              />
              <span className="text-xs" style={{ color: NAVY }}>פתיחה</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min={0}
                max={1000}
                value={hoverCloseDelayMs}
                onChange={(event) =>
                  onHoverDelaysChange?.(
                    hoverOpenDelayMs,
                    clampDelay(Number(event.target.value || 0)),
                  )
                }
                className="h-8 w-full rounded border px-2 text-xs"
                style={{ borderColor: `${GOLD}99`, color: NAVY }}
                aria-label="זמן סגירה במילישניות"
                title="זמן סגירת דיאלוג בהובר (0-1000ms)"
              />
              <span className="text-xs" style={{ color: NAVY }}>סגירה</span>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setDelayPreset(200, 150)} style={{ borderColor: GOLD, color: NAVY }}>200/150</Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setDelayPreset(300, 200)} style={{ borderColor: GOLD, color: NAVY }}>300/200</Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setDelayPreset(400, 250)} style={{ borderColor: GOLD, color: NAVY }}>400/250</Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setDelayPreset(200, 150)}
                style={{ borderColor: GOLD, color: NAVY }}
              >
                איפוס
              </Button>
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute left-12 top-4 h-7 w-7 p-0"
          title="הגדרות hover"
          onClick={() => setSettingsOpen((prev) => !prev)}
          style={{ color: NAVY }}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <DialogPrimitive.Close className="absolute left-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">סגור</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
