// TimeWheelPicker — compact two-column (hours | minutes) popover time picker.
// RTL-friendly, 1-minute precision, scroll-into-view on open, keyboard nav.
// Designed to replace bulky time <Select> lists or native time inputs.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimeWheelPickerProps {
  value: string; // "HH:mm" or ""
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Trigger style override (background/border/color). */
  triggerStyle?: React.CSSProperties;
  /** Brand colors. */
  accent?: { gold: string; goldLight: string; navy: string; navyDark: string };
  /** Auto-close popover after picking minute (default true). */
  autoCloseOnMinute?: boolean;
  /** Minutes step (default 1). */
  minuteStep?: number;
  ariaLabel?: string;
}

const DEFAULT_ACCENT = {
  gold: "#C5A572",
  goldLight: "#E8D9B8",
  navy: "#1B2A4E",
  navyDark: "#0F1A33",
};

function parse(v: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec((v || "").trim());
  if (!m) return null;
  const h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  const min = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  return { h, m: min };
}

function fmt(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({
  value,
  onChange,
  placeholder = "--:--",
  disabled,
  className,
  triggerStyle,
  accent = DEFAULT_ACCENT,
  autoCloseOnMinute = true,
  minuteStep = 1,
}) => {
  const [open, setOpen] = useState(false);
  const parsed = parse(value);
  const [tmpH, setTmpH] = useState<number>(parsed?.h ?? 9);
  const [tmpM, setTmpM] = useState<number>(parsed?.m ?? 0);
  const hRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<HTMLDivElement>(null);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => {
    const step = Math.max(1, Math.min(30, minuteStep | 0));
    const arr: number[] = [];
    for (let i = 0; i < 60; i += step) arr.push(i);
    return arr;
  }, [minuteStep]);

  // Re-sync local selection when value prop changes externally
  useEffect(() => {
    const p = parse(value);
    if (p) {
      setTmpH(p.h);
      setTmpM(p.m);
    }
  }, [value]);

  // On open, scroll selected items into view
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      hRef.current?.querySelector<HTMLElement>(`[data-h="${tmpH}"]`)?.scrollIntoView({ block: "center" });
      mRef.current?.querySelector<HTMLElement>(`[data-m="${tmpM}"]`)?.scrollIntoView({ block: "center" });
    });
  }, [open, tmpH, tmpM]);

  const commit = (h: number, m: number) => {
    onChange(fmt(h, m));
  };

  const selectHour = (h: number) => {
    setTmpH(h);
    commit(h, tmpM);
  };
  const selectMinute = (m: number) => {
    setTmpM(m);
    commit(tmpH, m);
    if (autoCloseOnMinute) setOpen(false);
  };

  const display = parsed ? fmt(parsed.h, parsed.m) : "";

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="בחר שעה"
          className={cn(
            "flex items-center justify-between gap-2 w-full h-9 px-3 rounded-md border text-sm text-right transition-colors",
            "hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            disabled && "opacity-50 cursor-not-allowed",
            className,
          )}
          style={{
            background: "#FFFFFF",
            borderColor: accent.gold,
            color: accent.navyDark,
            ...triggerStyle,
          }}
        >
          <ChevronDown className="h-4 w-4 opacity-70" />
          <span dir="ltr" className="font-mono tabular-nums">
            {display || <span className="opacity-50">{placeholder}</span>}
          </span>
          <Clock className="h-4 w-4" style={{ color: accent.gold }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        className="p-0 w-auto z-[70]"
        style={{ borderColor: accent.gold }}
      >
        <div className="flex" dir="ltr">
          {/* Hours column */}
          <Column
            ref={hRef}
            label="שעה"
            items={hours}
            selected={tmpH}
            onPick={selectHour}
            dataAttr="h"
            accent={accent}
          />
          {/* Divider */}
          <div className="w-px self-stretch" style={{ background: accent.goldLight }} />
          {/* Minutes column */}
          <Column
            ref={mRef}
            label="דקות"
            items={minutes}
            selected={tmpM}
            onPick={selectMinute}
            dataAttr="m"
            accent={accent}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ColumnProps {
  label: string;
  items: number[];
  selected: number;
  onPick: (n: number) => void;
  dataAttr: "h" | "m";
  accent: NonNullable<TimeWheelPickerProps["accent"]>;
}

const Column = React.forwardRef<HTMLDivElement, ColumnProps>(function Column(
  { label, items, selected, onPick, dataAttr, accent },
  ref,
) {
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 72 }}>
      <div
        className="w-full text-center text-[11px] font-semibold py-1 select-none"
        style={{ color: accent.navyDark, background: accent.goldLight }}
      >
        {label}
      </div>
      <div
        ref={ref}
        className="overflow-y-auto py-1 w-full"
        style={{ height: 224, scrollbarGutter: "stable" }}
        role="listbox"
        aria-label={label}
      >
        {items.map((n) => {
          const isSel = n === selected;
          return (
            <button
              key={n}
              type="button"
              data-h={dataAttr === "h" ? n : undefined}
              data-m={dataAttr === "m" ? n : undefined}
              onClick={() => onPick(n)}
              role="option"
              aria-selected={isSel}
              className={cn(
                "block w-full text-center font-mono tabular-nums text-sm py-1.5 transition-colors",
                isSel ? "font-bold" : "hover:bg-neutral-100",
              )}
              style={
                isSel
                  ? { background: accent.navy, color: "#FFFFFF" }
                  : { color: accent.navyDark }
              }
            >
              {String(n).padStart(2, "0")}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default TimeWheelPicker;
