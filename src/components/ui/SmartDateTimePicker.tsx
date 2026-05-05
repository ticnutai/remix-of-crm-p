// SmartDateTimePicker — RTL Hebrew date+time picker with quick chips,
// full-month no-scroll grid, optional time, past-date warning, keyboard nav.
// Designed for QuickAddTask / QuickAddMeeting and re-usable elsewhere.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Clock, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const HEB_DAYS_FULL = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HEB_DAYS_SHORT = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
const HEB_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function ymd(d: Date) {
  return format(d, "yyyy-MM-dd");
}
function isSameDay(a: Date | null | undefined, b: Date | null | undefined) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfDay(d: Date) {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function nextWeekday(from: Date, target: number) {
  const r = new Date(from);
  while (r.getDay() !== target) r.setDate(r.getDate() + 1);
  return r;
}

export interface SmartDateTimePickerProps {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  /** if true, show time inputs (HH:mm) */
  showTime?: boolean;
  time?: string; // "HH:mm"
  onTimeChange?: (t: string) => void;
  /** label above the picker */
  label?: string;
  /** required marker on label */
  required?: boolean;
  /** color tokens (gold/navy palette) */
  accent?: {
    gold: string;
    goldLight: string;
    navy: string;
    navyDark: string;
  };
  /** hide quick chips */
  hideChips?: boolean;
  /** error message to display under picker */
  error?: string | null;
  /** placeholder for date input */
  placeholder?: string;
  /** allow clearing */
  allowClear?: boolean;
}

const DEFAULT_ACCENT = {
  gold: "#d8ac27",
  goldLight: "#facc15",
  navy: "#0F1F3D",
  navyDark: "#0a1628",
};

export const SmartDateTimePicker: React.FC<SmartDateTimePickerProps> = ({
  value,
  onChange,
  showTime = false,
  time,
  onTimeChange,
  label,
  required,
  accent = DEFAULT_ACCENT,
  hideChips = false,
  error,
  placeholder = "dd/mm/yyyy",
  allowClear = true,
}) => {
  const today = startOfDay(new Date());
  const [textValue, setTextValue] = useState<string>(value ? format(value, "dd/MM/yyyy") : "");
  const [viewMonth, setViewMonth] = useState<Date>(value ? startOfDay(new Date(value.getFullYear(), value.getMonth(), 1)) : startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [localError, setLocalError] = useState<string | null>(null);
  const [focusedDay, setFocusedDay] = useState<Date | null>(value ? startOfDay(value) : null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Keep text input in sync if value changes externally
  useEffect(() => {
    setTextValue(value ? format(value, "dd/MM/yyyy") : "");
    if (value) {
      setViewMonth(startOfDay(new Date(value.getFullYear(), value.getMonth(), 1)));
      setFocusedDay(startOfDay(value));
    }
  }, [value]);

  // Build month grid: 6 weeks × 7 days, RTL (Sun rightmost)
  const monthCells = useMemo(() => {
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startDow = firstOfMonth.getDay(); // 0=Sun
    const gridStart = addDays(firstOfMonth, -startDow);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));
    return cells;
  }, [viewMonth]);

  const parseManual = (input: string): Date | null => {
    if (!input.trim()) return null;
    const m = input.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (!m) return null;
    let [, d, mo, y] = m;
    let yy = parseInt(y, 10);
    if (y.length === 2) yy = 2000 + yy;
    const dt = new Date(yy, parseInt(mo, 10) - 1, parseInt(d, 10));
    if (isNaN(dt.getTime()) || dt.getMonth() !== parseInt(mo, 10) - 1) return null;
    return dt;
  };

  const handleManualChange = (v: string) => {
    setTextValue(v);
    if (!v.trim()) {
      onChange(undefined);
      setLocalError(null);
      return;
    }
    const parsed = parseManual(v);
    if (parsed) {
      onChange(parsed);
      setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      setFocusedDay(startOfDay(parsed));
      setLocalError(null);
    } else if (v.length >= 8) {
      setLocalError("פורמט תאריך לא תקין (dd/mm/yyyy)");
    }
  };

  const selectDate = (d: Date) => {
    const sd = startOfDay(d);
    onChange(sd);
    setTextValue(format(sd, "dd/MM/yyyy"));
    setFocusedDay(sd);
    setLocalError(null);
  };

  const isPast = value ? startOfDay(value) < today : false;
  const isPastWithTime = (() => {
    if (!value) return false;
    if (!showTime || !time) return isPast;
    const [hh, mm] = time.split(":").map(Number);
    if (isNaN(hh) || isNaN(mm)) return isPast;
    const dt = new Date(value); dt.setHours(hh, mm, 0, 0);
    return dt < new Date();
  })();

  const handleKey = (e: React.KeyboardEvent) => {
    if (!focusedDay) return;
    let next: Date | null = null;
    if (e.key === "ArrowLeft") next = addDays(focusedDay, 1); // RTL: left = next day
    else if (e.key === "ArrowRight") next = addDays(focusedDay, -1);
    else if (e.key === "ArrowUp") next = addDays(focusedDay, -7);
    else if (e.key === "ArrowDown") next = addDays(focusedDay, 7);
    else if (e.key === "Enter" || e.key === " ") { selectDate(focusedDay); e.preventDefault(); return; }
    else if (e.key.toLowerCase() === "t") next = today;
    else if (e.key.toLowerCase() === "m") next = addDays(today, 1);
    else if (e.key === "PageUp") { setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)); e.preventDefault(); return; }
    else if (e.key === "PageDown") { setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)); e.preventDefault(); return; }
    if (next) {
      setFocusedDay(next);
      if (next.getMonth() !== viewMonth.getMonth() || next.getFullYear() !== viewMonth.getFullYear()) {
        setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1));
      }
      e.preventDefault();
    }
  };

  const chips = [
    { label: "היום", date: today },
    { label: "מחר", date: addDays(today, 1) },
    { label: "ראשון הבא", date: nextWeekday(addDays(today, 1), 0) },
    { label: "בעוד שבוע", date: addDays(today, 7) },
  ];

  const displayError = error ?? localError;

  return (
    <div className="space-y-2" dir="rtl">
      {label && (
        <Label className="text-sm font-medium" style={{ color: accent.goldLight }}>
          {label}{required && <span className="text-red-400 mr-1">*</span>}
        </Label>
      )}

      {/* Quick chips */}
      {!hideChips && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const active = isSameDay(value, c.date);
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => selectDate(c.date)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? accent.gold : "#FFFFFF",
                  color: active ? accent.navyDark : accent.navy,
                  border: `1px solid ${active ? accent.gold : `${accent.gold}60`}`,
                }}
              >
                {c.label}
              </button>
            );
          })}
          {allowClear && value && (
            <button
              type="button"
              onClick={() => { onChange(undefined); setTextValue(""); setLocalError(null); }}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1"
              style={{ background: "#FFFFFF", color: "#ef4444", border: "1px solid #fecaca" }}
            >
              <X className="h-3 w-3" /> נקה
            </button>
          )}
        </div>
      )}

      {/* Manual input + time */}
      <div className="flex gap-2">
        <Input
          value={textValue}
          onChange={(e) => handleManualChange(e.target.value)}
          placeholder={placeholder}
          dir="ltr"
          inputMode="numeric"
          className="flex-1 text-center"
          style={{ background: "#FFFFFF", borderColor: accent.gold, color: accent.navyDark }}
        />
        {showTime && (
          <div className="flex items-center gap-1.5 px-2 rounded-md" style={{ background: "#FFFFFF", border: `1px solid ${accent.gold}` }}>
            <Clock className="h-4 w-4" style={{ color: accent.gold }} />
            <Input
              type="time"
              value={time ?? ""}
              onChange={(e) => onTimeChange?.(e.target.value)}
              dir="ltr"
              className="border-0 p-0 w-[90px] text-center bg-transparent focus-visible:ring-0"
              style={{ color: accent.navyDark }}
            />
          </div>
        )}
      </div>

      {/* Calendar — full width, no scroll */}
      <div
        className="rounded-lg border-2 p-2"
        style={{ background: "#FFFFFF", borderColor: `${accent.gold}80` }}
        onKeyDown={handleKey}
        tabIndex={0}
        role="grid"
        aria-label="לוח בחירת תאריך"
        ref={gridRef}
      >
        {/* Header: month/year + navigation */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="p-1 rounded hover:bg-slate-100"
            aria-label="חודש קודם"
          >
            <ChevronRight className="h-4 w-4" style={{ color: accent.navy }} />
          </button>
          <div className="flex items-center gap-2">
            <select
              value={viewMonth.getMonth()}
              onChange={(e) => setViewMonth(new Date(viewMonth.getFullYear(), parseInt(e.target.value, 10), 1))}
              className="text-sm font-medium bg-transparent border-0 outline-none cursor-pointer"
              style={{ color: accent.navyDark }}
            >
              {HEB_MONTHS.map((m, i) => (<option key={m} value={i}>{m}</option>))}
            </select>
            <select
              value={viewMonth.getFullYear()}
              onChange={(e) => setViewMonth(new Date(parseInt(e.target.value, 10), viewMonth.getMonth(), 1))}
              className="text-sm font-medium bg-transparent border-0 outline-none cursor-pointer"
              style={{ color: accent.navyDark }}
            >
              {Array.from({ length: 21 }, (_, i) => today.getFullYear() - 5 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1)); selectDate(today); }}
              className="text-xs px-2 py-1 rounded font-medium"
              style={{ background: `${accent.gold}25`, color: accent.navyDark, border: `1px solid ${accent.gold}80` }}
            >
              היום
            </button>
          </div>
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="p-1 rounded hover:bg-slate-100"
            aria-label="חודש הבא"
          >
            <ChevronLeft className="h-4 w-4" style={{ color: accent.navy }} />
          </button>
        </div>

        {/* Weekday header — RTL: Sun rightmost */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {HEB_DAYS_SHORT.map((d, i) => (
            <div
              key={d}
              className="text-center text-[11px] font-semibold py-1"
              style={{ color: i === 5 || i === 6 ? "#94a3b8" : accent.navy }}
              title={HEB_DAYS_FULL[i]}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {monthCells.map((d, i) => {
            const inMonth = d.getMonth() === viewMonth.getMonth();
            const isToday = isSameDay(d, today);
            const isSelected = isSameDay(d, value);
            const isFocused = isSameDay(d, focusedDay);
            const isPastDay = startOfDay(d) < today;
            const dow = d.getDay();
            const isWeekend = dow === 5 || dow === 6;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDate(d)}
                onMouseEnter={() => setFocusedDay(d)}
                tabIndex={isFocused ? 0 : -1}
                aria-selected={isSelected}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "aspect-square w-full flex items-center justify-center text-sm rounded-md transition-all relative",
                  "hover:scale-105 active:scale-95",
                )}
                style={{
                  background: isSelected
                    ? accent.navy
                    : isToday
                    ? `${accent.gold}30`
                    : isFocused
                    ? `${accent.gold}15`
                    : "transparent",
                  color: isSelected
                    ? "#FFFFFF"
                    : !inMonth
                    ? "#cbd5e1"
                    : isWeekend
                    ? "#94a3b8"
                    : isPastDay
                    ? "#94a3b8"
                    : accent.navyDark,
                  fontWeight: isToday || isSelected ? 700 : 500,
                  border: isToday && !isSelected ? `1.5px solid ${accent.gold}` : "1px solid transparent",
                  outline: isFocused && !isSelected ? `2px solid ${accent.gold}80` : "none",
                  outlineOffset: -2,
                }}
              >
                {d.getDate()}
                {isToday && (
                  <span
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: isSelected ? "#FFFFFF" : accent.gold }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected summary */}
      {value && !displayError && (
        <div className="flex items-center justify-between text-xs px-1">
          <span style={{ color: accent.goldLight }}>
            {format(value, "EEEE, d בMMMM yyyy", { locale: he })}
            {showTime && time && ` בשעה ${time}`}
          </span>
          {isPastWithTime && (
            <span className="flex items-center gap-1 text-amber-500 font-medium">
              <AlertTriangle className="h-3 w-3" /> תאריך/שעה בעבר
            </span>
          )}
        </div>
      )}

      {displayError && (
        <p className="text-xs text-red-400">{displayError}</p>
      )}
    </div>
  );
};

export default SmartDateTimePicker;
