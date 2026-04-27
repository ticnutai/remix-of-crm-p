// QuickAddMeeting - Quick Add Meeting Dialog for Sidebar
import React, { useState, useEffect, forwardRef } from "react";
import { Meeting, MeetingInsert } from "@/hooks/useMeetingsOptimized";
import { useReminders } from "@/hooks/useReminders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Users,
  Video,
  Phone,
  MapPin,
  Clock,
  Loader2,
  Calendar as CalendarIcon2,
  UserPlus,
  X,
  Search,
  RefreshCw,
  Keyboard,
  Lock,
  Unlock,
} from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { NotificationOptions } from "./NotificationOptions";
import {
  InlineReminderSection,
  InlineReminderConfig,
} from "@/components/reminders/InlineReminderSection";
import { LocationPicker } from "@/components/location/LocationPicker";
import { useDialogTheme, DialogThemeSwitcher, useDialogResize, ResizeHandles } from "@/components/shared/DialogThemeSwitcher";
import { useUserPreferences } from "@/hooks/useUserPreferences";

// Dynamic sidebar colors based on theme
function getSidebarColors(theme: ReturnType<typeof useDialogTheme>['theme']) {
  return {
    navy: theme.background,
    gold: theme.border,
    goldLight: theme.label,
    goldDark: theme.buttonBorder,
    navyLight: theme.inputBg,
    navyDark: theme.background,
  };
}

// Readable input/trigger style: white bg + dark text + gold border (fixes "text swallowed" issue)
const brandedInputStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderColor: "#d8ac27",
  color: "#0F1F3D",
};
const brandedInputClass = "placeholder:text-slate-400";

// Meeting type options
const meetingTypes = [
  {
    value: "in_person",
    label: "פגישה פיזית",
    icon: Users,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500",
  },
  {
    value: "video",
    label: "שיחת וידאו",
    icon: Video,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500",
  },
  {
    value: "phone",
    label: "שיחת טלפון",
    icon: Phone,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500",
  },
];

// Time input modes
type TimeInputMode = "dropdown" | "text" | "clock" | "spinners";
const TIME_MODES: TimeInputMode[] = ["dropdown", "text", "clock", "spinners"];
const TIME_MODE_LS_KEY = "meeting-time-input-mode";

// Time options
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return {
    value: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    label: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
  };
});

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

interface QuickAddMeetingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (meeting: MeetingInsert) => Promise<{ id?: string } | void>;
  editingMeeting?: Meeting | null;
  clients?: Client[];
  initialData?: {
    title?: string;
    description?: string;
    clientId?: string;
    date?: Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    meetingType?: string;
  };
}

export const QuickAddMeeting = forwardRef<HTMLDivElement, QuickAddMeetingProps>(
  function QuickAddMeeting(
    {
      open,
      onOpenChange,
      onSubmit,
      editingMeeting = null,
      clients = [],
      initialData,
    },
    _ref,
  ) {
    const { themeId, theme, setThemeId } = useDialogTheme();
    const sidebarColors = getSidebarColors(theme);
    const { size, containerRef, startResize } = useDialogResize(500);
    const { createReminder, updateReminder, reminders } = useReminders();
    const { preferences, savePreferences: saveUserPrefs } = useUserPreferences();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [meetingType, setMeetingType] = useState<string>("in_person");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [location, setLocation] = useState("");
    const [clientIds, setClientIds] = useState<string[]>([]);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const [dateText, setDateText] = useState<string>(format(new Date(), "dd/MM/yyyy"));
    const [dateError, setDateError] = useState<string | null>(null);

    const parseManualDate = (value: string): Date | null => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const dmy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
      if (dmy) {
        const [, d, m, y] = dmy;
        const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
        const dt = new Date(year, parseInt(m, 10) - 1, parseInt(d, 10));
        if (!isNaN(dt.getTime())) return dt;
      }
      const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (ymd) {
        const [, y, m, d] = ymd;
        const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        if (!isNaN(dt.getTime())) return dt;
      }
      return null;
    };

    const handleManualDateChange = (value: string) => {
      setDateText(value);
      if (!value.trim()) {
        setDateError("יש להזין תאריך");
        return;
      }
      const parsed = parseManualDate(value);
      if (parsed) {
        setDate(parsed);
        setDateError(null);
      } else {
        setDateError("פורמט: יום/חודש/שנה (לדוגמה 25/12/2025)");
      }
    };
    const [reminderConfig, setReminderConfig] =
      useState<InlineReminderConfig | null>(null);

    // ── time input mode (synced: Supabase ui_preferences + localStorage fallback) ──
    const [timeMode, setTimeMode] = useState<TimeInputMode>(
      () => (localStorage.getItem(TIME_MODE_LS_KEY) as TimeInputMode) || "dropdown",
    );
    // Sync from Supabase once preferences load
    useEffect(() => {
      const cloud = ((preferences as unknown as Record<string, unknown>)?.ui_preferences as Record<string, unknown> | null)?.meeting_time_input_mode as TimeInputMode | undefined;
      if (cloud && TIME_MODES.includes(cloud)) {
        setTimeMode(cloud);
        localStorage.setItem(TIME_MODE_LS_KEY, cloud);
      }
    }, [(preferences as unknown as Record<string, unknown>)?.ui_preferences]);
    const [manualPopoverOpen, setManualPopoverOpen] = useState(false);
    const [manualBothText, setManualBothText] = useState("");

    // Load initial data when dialog opens
    useEffect(() => {
      if (open && initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setMeetingType(initialData.meetingType || "in_person");
        const initDate = initialData.date || new Date();
        setDate(initDate);
        setDateText(format(initDate, "dd/MM/yyyy"));
        setDateError(null);
        setStartTime(initialData.startTime || "09:00");
        setEndTime(initialData.endTime || "10:00");
        setLocation(initialData.location || "");
        setClientIds(initialData.clientId ? [initialData.clientId] : []);
      }
    }, [open, initialData]);

    // Hydrate is_private from editing meeting
    useEffect(() => {
      if (open && editingMeeting) {
        setIsPrivate(Boolean((editingMeeting as any).is_private));
      }
    }, [open, editingMeeting]);

    const resetForm = () => {
      setTitle("");
      setDescription("");
      setMeetingType("in_person");
      setDate(new Date());
      setStartTime("09:00");
      setEndTime("10:00");
      setLocation("");
      setClientIds([]);
      setReminderConfig(null);
      setIsPrivate(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !date) return;

      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      const startDateTime = setMinutes(setHours(date, startHour), startMin);
      const endDateTime = setMinutes(setHours(date, endHour), endMin);

      setIsSubmitting(true);
      try {
        const createdMeeting = await onSubmit({
          title: title.trim(),
          description: description.trim() || null,
          meeting_type: meetingType,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location: location.trim() || null,
          client_id: clientIds.length > 0 ? clientIds[0] : null,
          status: "scheduled",
          is_private: isPrivate,
        });

        const meetingId = editingMeeting?.id ?? (createdMeeting as any)?.id;

        if (reminderConfig && meetingId) {
          const linkedReminder = reminders.find(
            (r) => r.entity_type === "meeting" && r.entity_id === meetingId,
          );

          if (linkedReminder) {
            await updateReminder(linkedReminder.id, {
              title: reminderConfig.title,
              message: reminderConfig.message,
              remind_at: reminderConfig.remind_at,
              reminder_type: reminderConfig.reminder_type,
              is_recurring: reminderConfig.is_recurring,
              recurring_interval: reminderConfig.recurring_interval,
              entity_type: "meeting",
              entity_id: meetingId,
            } as any);
          } else {
            await createReminder({
              ...reminderConfig,
              entity_type: "meeting",
              entity_id: meetingId,
            });
          }
        }

        resetForm();
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleStartTimeChange = (newStartTime: string) => {
      // Preserve the existing gap between start and end times
      const [oldH, oldM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const gapMins = (endH * 60 + endM) - (oldH * 60 + oldM);
      const [newH, newM] = newStartTime.split(":").map(Number);
      const newEndTotal = newH * 60 + newM + gapMins;
      if (newEndTotal >= 0 && newEndTotal < 24 * 60) {
        const eH = Math.floor(newEndTotal / 60);
        const eM = newEndTotal % 60;
        setEndTime(`${eH.toString().padStart(2, "0")}:${eM.toString().padStart(2, "0")}`);
      }
      setStartTime(newStartTime);
    };

    const cycleTimeMode = () => {
      const next = TIME_MODES[(TIME_MODES.indexOf(timeMode) + 1) % TIME_MODES.length];
      setTimeMode(next);
      localStorage.setItem(TIME_MODE_LS_KEY, next);
      // Persist to Supabase (merge into existing ui_preferences)
      const existing = ((preferences as unknown as Record<string, unknown>)?.ui_preferences as Record<string, unknown> | null) ?? {};
      saveUserPrefs({ ui_preferences: { ...existing, meeting_time_input_mode: next } } as any);
    };

    const parseTimeStr = (s: string): string | null => {
      const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      const h = parseInt(m[1]), min = parseInt(m[2]);
      if (h < 0 || h > 23 || min < 0 || min > 59) return null;
      return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
    };

    const applyManualBoth = () => {
      const parts = manualBothText.split(/[\s\-\u2013]+/).filter(Boolean);
      const s = parts[0] ? parseTimeStr(parts[0]) : null;
      const e = parts[1] ? parseTimeStr(parts[1]) : null;
      if (s) handleStartTimeChange(s);
      if (e) setEndTime(e);
      setManualPopoverOpen(false);
      setManualBothText("");
    };

    const renderTimeInput = (value: string, onChange: (v: string) => void) => {
      const [valH, valM] = value.split(":").map(Number);
      const modeEmoji: Record<TimeInputMode, string> = {
        dropdown: "📅", text: "⌨️", clock: "🕐", spinners: "🔢",
      };
      const modeTitle: Record<TimeInputMode, string> = {
        dropdown: "רשימה נפתחת", text: "הקלדה חופשית",
        clock: "שעון (גלגל)", spinners: "ספינרים",
      };
      const toggleBtn = (
        <button
          type="button"
          onClick={cycleTimeMode}
          title={`מצב: ${modeEmoji[timeMode]} ${modeTitle[timeMode]} — לחץ להחלפה`}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-5 h-5 rounded hover:opacity-70 transition-opacity"
          style={{ color: sidebarColors.gold }}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      );

      if (timeMode === "dropdown") {
        return (
          <div className="relative">
            {toggleBtn}
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="text-right pl-8" style={brandedInputStyle}>
                <Clock className="h-4 w-4 ml-auto" style={{ color: sidebarColors.gold }} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }

      if (timeMode === "text") {
        return (
          <div className="relative">
            {toggleBtn}
            <div className="relative">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={(e) => { const p = parseTimeStr(e.target.value); if (p) onChange(p); }}
                placeholder="09:30"
                className="w-full h-9 pr-9 pl-8 rounded-md border text-sm text-right"
                style={brandedInputStyle}
              />
              <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: sidebarColors.gold }} />
            </div>
          </div>
        );
      }

      if (timeMode === "clock") {
        return (
          <div className="relative">
            {toggleBtn}
            <input
              type="time"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-9 px-3 pl-8 rounded-md border text-sm"
              style={brandedInputStyle}
            />
          </div>
        );
      }

      // spinners mode
      return (
        <div className="relative">
          {toggleBtn}
          <div
            className="flex items-center gap-1 h-9 pr-2 pl-8 rounded-md border"
            style={{ background: brandedInputStyle.background, borderColor: brandedInputStyle.borderColor }}
          >
            <input
              type="number" min={0} max={23} value={valH}
              onChange={(e) => {
                const h = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                onChange(`${h.toString().padStart(2, "0")}:${valM.toString().padStart(2, "0")}`);
              }}
              className="w-10 h-7 px-1 text-center rounded text-sm bg-transparent border-0 focus:outline-none"
              style={{ color: brandedInputStyle.color }}
            />
            <span className="font-bold" style={{ color: sidebarColors.gold }}>:</span>
            <input
              type="number" min={0} max={59} value={valM}
              onChange={(e) => {
                const m = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                onChange(`${valH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
              }}
              className="w-10 h-7 px-1 text-center rounded text-sm bg-transparent border-0 focus:outline-none"
              style={{ color: brandedInputStyle.color }}
            />
            <Clock className="h-4 w-4 mr-auto" style={{ color: sidebarColors.gold }} />
          </div>
        </div>
      );
    };

    const toggleClient = (id: string) => {
      setClientIds(prev =>
        prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      );
    };

    const removeClient = (id: string) => {
      setClientIds(prev => prev.filter(c => c !== id));
    };

    const selectedClients = clients.filter(c => clientIds.includes(c.id));

    return (
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent
          ref={containerRef}
          className="p-0 overflow-visible navy-gold-dialog"
          dir="rtl"
          onKeyDown={(e) => { if (e.key === 'Escape') onOpenChange(false); }}
          style={{
            background: theme.backgroundGradient,
            border: `2px solid ${theme.border}`,
            width: `${size.width}px`,
            maxWidth: '90vw',
            ...(size.height ? { height: `${size.height}px`, maxHeight: '90vh' } : {}),
          }}
        >
          <ResizeHandles onResize={startResize} />
          <DialogHeader
            className="px-5 pt-5 pb-3"
            style={{ borderBottom: `1px solid ${theme.headerBorder}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ background: theme.iconBg }}
              >
                <CalendarIcon2
                  className="h-5 w-5"
                  style={{ color: theme.iconColor }}
                />
              </div>
              <DialogTitle
                className="text-lg font-bold flex-1"
                style={{ color: theme.title }}
              >
                {editingMeeting ? "עריכת פגישה" : "פגישה חדשה"}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setIsPrivate((p) => !p)}
                title={isPrivate ? "פרטי — רק את/ה רואה פגישה זו (גם אדמין לא)" : "לחץ כדי לסמן כפרטי"}
                aria-pressed={isPrivate}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all"
                style={{
                  background: isPrivate ? `${sidebarColors.gold}25` : "transparent",
                  borderColor: isPrivate ? sidebarColors.gold : `${sidebarColors.gold}40`,
                  color: isPrivate ? sidebarColors.gold : sidebarColors.goldLight,
                }}
              >
                {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                <span>פרטי</span>
              </button>
              <DialogThemeSwitcher currentTheme={themeId} onThemeChange={setThemeId} />
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(85vh - 120px)' }}>
            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 gold-scrollbar">
              {/* Title */}
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  כותרת הפגישה *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="נושא הפגישה"
                  className={cn("text-right", brandedInputClass)}
                  style={brandedInputStyle}
                  autoFocus
                />
              </div>

              {/* Meeting Type Selection */}
              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  סוג הפגישה
                </Label>
                <div className="flex gap-2">
                  {meetingTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = meetingType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setMeetingType(type.value)}
                        className={cn(
                          "flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 transition-all",
                          isSelected ? type.borderColor : "border-transparent",
                          isSelected ? type.bgColor : "",
                          type.color,
                        )}
                        style={{
                          background: isSelected
                            ? undefined
                            : `${sidebarColors.navyLight}50`,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date - Manual input + Broad calendar */}
              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  תאריך *
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={dateText}
                    onChange={(e) => handleManualDateChange(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className={cn("flex-1 text-right")}
                    style={brandedInputStyle}
                    inputMode="numeric"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="px-3 gap-2 shrink-0"
                    style={{ ...brandedInputStyle, color: sidebarColors.navyDark }}
                    title="בחר מלוח שנה"
                    onClick={() => setIsCalendarOpen((v) => !v)}
                    aria-expanded={isCalendarOpen}
                  >
                    <CalendarIcon className="h-4 w-4" style={{ color: sidebarColors.gold }} />
                    <span className="text-xs">לוח</span>
                  </Button>
                </div>
                {isCalendarOpen && (
                  <div
                    className="mt-3 w-[340px] max-w-full min-w-[300px] max-h-[48vh] resize overflow-auto rounded-lg border-2 bg-background p-2 shadow-xl"
                    style={{ borderColor: sidebarColors.gold }}
                    data-no-drag
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        setDateText(newDate ? format(newDate, "dd/MM/yyyy") : "");
                        setDateError(null);
                        setIsCalendarOpen(false);
                      }}
                      locale={he}
                      captionLayout="dropdown-buttons"
                      fromYear={2000}
                      toYear={2100}
                      showOutsideDays
                      initialFocus
                      className="p-2 pointer-events-auto"
                    />
                  </div>
                )}
                {dateError && (
                  <p className="text-xs" style={{ color: "#ef4444" }}>{dateError}</p>
                )}
                {date && !dateError && (
                  <p className="text-xs" style={{ color: sidebarColors.goldLight }}>
                    {format(date, "EEEE, d בMMMM yyyy", { locale: he })}
                  </p>
                )}
              </div>


              {/* Time Range */}
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>
                      שעת התחלה
                    </Label>
                    {renderTimeInput(startTime, handleStartTimeChange)}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium" style={{ color: sidebarColors.goldLight }}>
                      שעת סיום
                    </Label>
                    {renderTimeInput(endTime, setEndTime)}
                  </div>
                </div>

                {/* Manual time entry popover */}
                <div className="flex justify-center pt-0.5">
                  <Popover open={manualPopoverOpen} onOpenChange={setManualPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-dashed hover:opacity-80 transition-opacity"
                        style={{ borderColor: `${sidebarColors.gold}60`, color: sidebarColors.gold }}
                      >
                        <Keyboard className="h-3 w-3" />
                        הכנסה ידנית
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" dir="rtl" align="center">
                      <div className="space-y-2">
                        <p className="text-xs font-medium">הכנס שעות ידנית</p>
                        <p className="text-[10px] text-gray-400">פורמט: 09:30 10:30 (התחלה סיום)</p>
                        <input
                          autoFocus
                          type="text"
                          value={manualBothText}
                          onChange={(e) => setManualBothText(e.target.value)}
                          placeholder="09:30 10:30"
                          className="w-full text-sm h-8 px-2 rounded border"
                          style={brandedInputStyle}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyManualBoth(); } }}
                        />
                        <button
                          type="button"
                          onClick={applyManualBoth}
                          className="w-full text-xs py-1 rounded font-medium"
                          style={{ background: sidebarColors.gold, color: "#0F1F3D" }}
                        >
                          הגדר
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  {meetingType === "video"
                    ? "קישור לפגישה"
                    : meetingType === "phone"
                      ? "מספר טלפון"
                      : "מיקום"}
                </Label>
                {meetingType === "in_person" ? (
                  <LocationPicker
                    value={location}
                    onChange={setLocation}
                    clientIds={clientIds}
                    placeholder="בחר או הקלד מיקום"
                    iconColor={sidebarColors.gold}
                    inputStyle={brandedInputStyle}
                  />
                ) : (
                  <div className="relative">
                    <MapPin
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: sidebarColors.gold }}
                    />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={
                        meetingType === "video"
                          ? "https://meet.google.com/..."
                          : "050-000-0000"
                      }
                      className={cn("text-right pr-10", brandedInputClass)}
                      style={brandedInputStyle}
                    />
                  </div>
                )}
              </div>

              {/* Client Assignment - Multi Select */}
              <div className="space-y-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  שיוך ללקוחות
                </Label>
                {/* Selected clients chips */}
                {selectedClients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClients.map(client => (
                      <div
                        key={client.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: `${sidebarColors.gold}20`,
                          border: `1px solid ${sidebarColors.gold}50`,
                          color: sidebarColors.goldLight,
                        }}
                      >
                        <span>{client.name}</span>
                        <button
                          type="button"
                          onClick={() => removeClient(client.id)}
                          className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Popover open={isClientPickerOpen} onOpenChange={setIsClientPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start gap-2"
                      style={{
                        ...brandedInputStyle,
                        color: selectedClients.length > 0 ? sidebarColors.navyDark : "#64748b",
                      }}
                    >
                      <UserPlus className="h-4 w-4 ml-auto" style={{ color: sidebarColors.gold }} />
                      {selectedClients.length > 0 ? `${selectedClients.length} לקוחות נבחרו — הוסף עוד` : "בחר לקוח או איש קשר"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[320px] p-0 overflow-hidden"
                    align="start"
                    style={{
                      background: sidebarColors.navy,
                      border: `1px solid ${sidebarColors.gold}40`,
                    }}
                  >
                    <div className="p-2 border-b" style={{ borderColor: `${sidebarColors.gold}30` }}>
                      <div className="relative">
                        <Search className="absolute right-2.5 top-2.5 h-4 w-4" style={{ color: `${sidebarColors.goldLight}60` }} />
                        <Input
                          placeholder="חיפוש לקוח..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className={cn("pr-9 text-right text-sm", brandedInputClass)}
                          style={brandedInputStyle}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1 gold-scrollbar">
                      {clients
                        .filter(c =>
                          !clientSearch ||
                          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          c.phone?.includes(clientSearch)
                        )
                        .map(client => {
                          const isSelected = clientIds.includes(client.id);
                          return (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => toggleClient(client.id)}
                              className={cn(
                                "w-full text-right px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                                isSelected ? "bg-white/15" : "hover:bg-white/10"
                              )}
                              style={{ color: sidebarColors.goldLight }}
                            >
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{
                                  background: isSelected ? `${sidebarColors.gold}40` : `${sidebarColors.gold}25`,
                                  color: sidebarColors.gold,
                                }}
                              >
                                {isSelected ? "✓" : client.name.charAt(0)}
                              </div>
                              <div className="flex-1 text-right">
                                <div className="font-medium">{client.name}</div>
                                {client.email && (
                                  <div className="text-xs opacity-60">{client.email}</div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      {clients.filter(c =>
                        !clientSearch ||
                        c.name.toLowerCase().includes(clientSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="text-center py-4 text-sm" style={{ color: `${sidebarColors.goldLight}60` }}>
                          לא נמצאו לקוחות
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Reminder & Calendar Sync */}
              <InlineReminderSection
                entityType="meeting"
                entityTitle={title}
                entityDate={date}
                entityDescription={description}
                entityLocation={location}
                submitMode="deferred"
                onReminderConfigChange={setReminderConfig}
              />

              {/* Notification Options */}
              {clients.length > 0 && clientIds.length > 0 && (
                <NotificationOptions
                  type="meeting"
                  clients={clients}
                  selectedClientIds={clientIds}
                  onClientChange={(id) => {
                    if (!clientIds.includes(id)) {
                      setClientIds(prev => [...prev, id]);
                    }
                  }}
                  details={{
                    title,
                    description,
                    date: date
                      ? format(date, "PPP", { locale: he })
                      : undefined,
                    time: `${startTime} - ${endTime}`,
                    location,
                  }}
                  disabled={isSubmitting}
                />
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  הערות (אופציונלי)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="פרטים נוספים על הפגישה..."
                  rows={2}
                  className={cn("text-right resize-none", brandedInputClass)}
                  style={brandedInputStyle}
                />
              </div>
            </div>

            <DialogFooter
              className="px-5 py-4 gap-2"
              style={{ borderTop: `1px solid ${theme.headerBorder}` }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                style={{ color: theme.cancelText }}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || !date || isSubmitting}
                className="gap-2"
                style={{
                  background: theme.buttonBg,
                  color: theme.buttonText,
                  border: `1px solid ${theme.buttonBorder}`,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <CalendarIcon2 className="h-4 w-4" />
                    {editingMeeting ? "עדכן פגישה" : "צור פגישה"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
);

export default QuickAddMeeting;
