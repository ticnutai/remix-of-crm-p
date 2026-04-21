/**
 * InlineReminderSection - Compact reminder creation section for dialogs (QuickAddTask, QuickAddMeeting)
 * Includes: reminder time presets, notification methods, ringtone, recurring, calendar sync
 */
import React, { useState, useRef, useEffect } from "react";
import { useReminders } from "@/hooks/useReminders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bell,
  Volume2,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Upload,
} from "lucide-react";
import { addMinutes, addHours } from "date-fns";
import { toast } from "sonner";

// Sidebar colors (matches the dialog theme)
const sidebarColors = {
  navy: "#162C58",
  gold: "#d8ac27",
  goldLight: "#e8c85a",
  goldDark: "#b8941f",
  navyLight: "#1E3A6E",
  navyDark: "#0F1F3D",
};

// Readable input/trigger style: white bg + dark text + gold border (fixes "text swallowed" issue)
const brandedInputStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderColor: sidebarColors.gold,
  color: sidebarColors.navyDark,
};

const reminderMethods = [
  { value: "browser", label: "דפדפן", emoji: "🔔" },
  { value: "popup", label: "פופ-אפ", emoji: "📢" },
  { value: "email", label: "אימייל", emoji: "📧" },
  { value: "sms", label: "SMS", emoji: "💬" },
  { value: "whatsapp", label: "וואטסאפ", emoji: "📱" },
  { value: "voice", label: "קולי", emoji: "🔊" },
];

const quickReminders = [
  { label: "5 דק׳ לפני", minutes: -5 },
  { label: "15 דק׳", minutes: -15 },
  { label: "30 דק׳", minutes: -30 },
  { label: "שעה לפני", minutes: -60 },
  { label: "יום לפני", minutes: -1440 },
];

const RINGTONES = [
  {
    id: "default",
    name: "ברירת מחדל",
    url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
  },
  {
    id: "chime",
    name: "צליל פעמון",
    url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3",
  },
  {
    id: "bell",
    name: "פעמון קלאסי",
    url: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3",
  },
  {
    id: "alert",
    name: "התראה חדה",
    url: "https://assets.mixkit.co/active_storage/sfx/2872/2872-preview.mp3",
  },
  {
    id: "gentle",
    name: "עדין",
    url: "https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3",
  },
  {
    id: "urgent",
    name: "דחוף",
    url: "https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3",
  },
  {
    id: "melody",
    name: "מלודי",
    url: "https://assets.mixkit.co/active_storage/sfx/2875/2875-preview.mp3",
  },
  {
    id: "digital",
    name: "דיגיטלי",
    url: "https://assets.mixkit.co/active_storage/sfx/2876/2876-preview.mp3",
  },
  {
    id: "soft",
    name: "רך ונעים",
    url: "https://assets.mixkit.co/active_storage/sfx/2877/2877-preview.mp3",
  },
];

const recurringOptions = [
  { value: "none", label: "ללא" },
  { value: "daily", label: "יומי" },
  { value: "weekly", label: "שבועי" },
  { value: "monthly", label: "חודשי" },
];

interface InlineReminderSectionProps {
  entityType: "task" | "meeting";
  entityTitle: string;
  entityDate?: Date;
  entityDescription?: string;
  entityLocation?: string;
  submitMode?: "immediate" | "deferred";
  onReminderConfigChange?: (config: InlineReminderConfig | null) => void;
}

export interface InlineReminderConfig {
  title: string;
  message?: string;
  remind_at: string;
  reminder_type: string;
  is_recurring?: boolean;
  recurring_interval?: string;
}

export function InlineReminderSection({
  entityType,
  entityTitle,
  entityDate,
  entityDescription,
  entityLocation,
  submitMode = "immediate",
  onReminderConfigChange,
}: InlineReminderSectionProps) {
  const { createReminder } = useReminders();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(["browser"]);
  const [reminderTime, setReminderTime] = useState<string>("");
  const [quickPreset, setQuickPreset] = useState<number | null>(-15);
  const [ringtone, setRingtone] = useState("default");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("none");
  const [recurringCount, setRecurringCount] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const toggleMethod = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  };

  const playRingtone = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(url);
    audioRef.current.play().catch(() => {});
  };

  const getReminderDateTime = (): Date | null => {
    if (quickPreset !== null && entityDate) {
      return addMinutes(entityDate, quickPreset);
    }
    if (reminderTime) {
      return new Date(reminderTime);
    }
    return null;
  };

  const handleCreateReminder = async () => {
    const remindAt = getReminderDateTime();
    if (!remindAt || !entityTitle) {
      toast.error("יש לבחור זמן תזכורת ולהזין כותרת");
      return;
    }

    setIsCreating(true);
    try {
      await createReminder({
        title: `תזכורת: ${entityTitle}`,
        message: entityDescription || undefined,
        remind_at: remindAt.toISOString(),
        reminder_type: selectedMethods[0] || "browser",
        entity_type: entityType,
      } as any);
      toast.success("תזכורת נוצרה בהצלחה! 🔔");
    } catch {
      toast.error("שגיאה ביצירת תזכורת");
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (submitMode !== "deferred" || !onReminderConfigChange) return;

    if (!expanded) {
      onReminderConfigChange(null);
      return;
    }

    const remindAt = getReminderDateTime();
    if (!remindAt || !entityTitle.trim()) {
      onReminderConfigChange(null);
      return;
    }

    onReminderConfigChange({
      title: `תזכורת: ${entityTitle}`,
      message: entityDescription || undefined,
      remind_at: remindAt.toISOString(),
      reminder_type: selectedMethods[0] || "browser",
      is_recurring: isRecurring,
      recurring_interval:
        isRecurring && recurringInterval !== "none"
          ? recurringInterval
          : undefined,
    });
  }, [
    submitMode,
    onReminderConfigChange,
    expanded,
    entityTitle,
    entityDescription,
    selectedMethods,
    isRecurring,
    recurringInterval,
    reminderTime,
    quickPreset,
    entityDate,
  ]);

  const handleCalendarSync = () => {
    if (!entityDate || !entityTitle) {
      toast.error("חסרים פרטים לסנכרון לוח שנה");
      return;
    }

    const start = entityDate;
    const end = addHours(entityDate, 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmtDate = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CRM//NONSGML v1.0//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmtDate(start)}`,
      `DTEND:${fmtDate(end)}`,
      `SUMMARY:${entityTitle}`,
      entityDescription
        ? `DESCRIPTION:${entityDescription.replace(/\n/g, "\\n")}`
        : "",
      entityLocation ? `LOCATION:${entityLocation}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entityTitle.replace(/[^\w\u0590-\u05FF\s-]/g, "")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("קובץ לוח שנה הורד בהצלחה 📅");
  };

  // Collapsed state — single button
  if (!expanded) {
    return (
      <button
        type="button"
        className="flex items-center gap-2 w-full py-2.5 px-3 rounded-lg border text-sm transition-all hover:opacity-80"
        style={{
          background: `${sidebarColors.navyLight}30`,
          borderColor: `${sidebarColors.gold}30`,
          color: sidebarColors.goldLight,
        }}
        onClick={() => setExpanded(true)}
      >
        <Bell className="h-4 w-4" style={{ color: sidebarColors.gold }} />
        <span>הוסף תזכורת וסנכרון לוח שנה</span>
        <ChevronDown className="h-3.5 w-3.5 mr-auto" />
      </button>
    );
  }

  // Expanded state — full section
  return (
    <div
      className="space-y-3 rounded-lg p-3"
      style={{
        background: `${sidebarColors.navyLight}30`,
        border: `1px solid ${sidebarColors.gold}30`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" style={{ color: sidebarColors.gold }} />
          <span
            className="text-sm font-medium"
            style={{ color: sidebarColors.goldLight }}
          >
            תזכורת וסנכרון
          </span>
        </div>
        <button
          type="button"
          className="p-1 hover:opacity-70 transition-opacity"
          onClick={() => setExpanded(false)}
          style={{ color: sidebarColors.goldLight }}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {/* Quick time presets */}
      <div>
        <Label
          className="text-[11px] mb-1.5 block"
          style={{ color: sidebarColors.goldLight }}
        >
          מתי להזכיר?
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {quickReminders.map((preset) => (
            <button
              key={preset.minutes}
              type="button"
              onClick={() => {
                setQuickPreset(preset.minutes);
                setReminderTime("");
              }}
              className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                quickPreset === preset.minutes
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
              style={{
                background:
                  quickPreset === preset.minutes
                    ? undefined
                    : `${sidebarColors.navyLight}50`,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom datetime */}
      <div>
        <Label
          className="text-[11px] mb-1 block"
          style={{ color: sidebarColors.goldLight }}
        >
          או בחר זמן מדויק
        </Label>
        <Input
          type="datetime-local"
          value={reminderTime}
          onChange={(e) => {
            setReminderTime(e.target.value);
            setQuickPreset(null);
          }}
          className="text-xs h-8"
          style={brandedInputStyle}
        />
      </div>

      {/* Reminder methods */}
      <div>
        <Label
          className="text-[11px] mb-1.5 block"
          style={{ color: sidebarColors.goldLight }}
        >
          אמצעי התראה (ניתן לבחור כמה)
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {reminderMethods.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => toggleMethod(method.value)}
              className={`px-2 py-1 text-[10px] rounded-md border transition-colors flex items-center gap-1 ${
                selectedMethods.includes(method.value)
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
              style={{
                background: selectedMethods.includes(method.value)
                  ? undefined
                  : `${sidebarColors.navyLight}50`,
              }}
            >
              <span>{method.emoji}</span>
              <span>{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ringtone selector */}
      <div className="flex items-center gap-2">
        <Volume2
          className="h-3 w-3 shrink-0"
          style={{ color: sidebarColors.gold }}
        />
        <select
          value={ringtone}
          onChange={(e) => setRingtone(e.target.value)}
          className="text-[11px] rounded px-2 py-1 flex-1 cursor-pointer"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${sidebarColors.gold}`,
            color: sidebarColors.navyDark,
          }}
        >
          {RINGTONES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            const selected = RINGTONES.find((r) => r.id === ringtone);
            if (selected) playRingtone(selected.url);
          }}
          className="p-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: sidebarColors.gold }}
          title="השמע"
        >
          <Volume2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Recurring option */}
      <div className="flex items-center gap-2 flex-wrap">
        <Checkbox
          id="inline-recurring"
          checked={isRecurring}
          onCheckedChange={(v) => setIsRecurring(!!v)}
          className="h-3.5 w-3.5"
        />
        <label
          htmlFor="inline-recurring"
          className="text-[11px] cursor-pointer"
          style={{ color: sidebarColors.goldLight }}
        >
          תזכורת חוזרת
        </label>
        {isRecurring && (
          <>
            <select
              value={recurringInterval}
              onChange={(e) => setRecurringInterval(e.target.value)}
              className="text-[10px] rounded px-1.5 py-0.5 cursor-pointer"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${sidebarColors.gold}`,
                color: sidebarColors.navyDark,
              }}
            >
              {recurringOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              max={50}
              value={recurringCount}
              onChange={(e) => setRecurringCount(parseInt(e.target.value) || 1)}
              className="w-14 h-6 text-[10px]"
              style={brandedInputStyle}
            />
            <span
              className="text-[10px]"
              style={{ color: sidebarColors.goldLight }}
            >
              פעמים
            </span>
          </>
        )}
      </div>

      {/* Action buttons */}
      {submitMode === "immediate" ? (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="flex-1 gap-1.5 text-xs h-8"
            style={{ background: sidebarColors.gold, color: sidebarColors.navy }}
            onClick={handleCreateReminder}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5" />
                צור תזכורת
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            style={{
              borderColor: `${sidebarColors.gold}40`,
              color: sidebarColors.goldLight,
            }}
            onClick={handleCalendarSync}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            סנכרון
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span style={{ color: `${sidebarColors.goldLight}CC` }}>
            התזכורת תישמר אוטומטית יחד עם הפגישה
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            style={{
              borderColor: `${sidebarColors.gold}40`,
              color: sidebarColors.goldLight,
            }}
            onClick={handleCalendarSync}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            סנכרון
          </Button>
        </div>
      )}
    </div>
  );
}
