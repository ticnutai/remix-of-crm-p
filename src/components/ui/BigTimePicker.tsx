// BigTimePicker — drop-in replacement for <Input type="time" />.
// Uses FloatingDialog (non-modal, draggable, resizable) so the picker
// never blocks the page and the user can position/resize it anywhere.
//
// Features:
// - Two large scrollable wheels (hours 0-23, minutes 0-59 step 1)
// - Big HH:MM live preview
// - "Now" + customizable quick presets (persisted in localStorage)
// - Add / remove your own preset times with an inline editor

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { FloatingDialog } from "@/components/ui/FloatingDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BigTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}

const PRESETS_KEY = "big-time-picker:quick-presets";
const DEFAULT_PRESETS = ["08:00", "09:00", "12:00", "17:00"];

function parse(v: string | undefined): { h: number; m: number } | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{1,2})/.exec(v.trim());
  if (!m) return null;
  return {
    h: Math.max(0, Math.min(23, parseInt(m[1], 10))),
    m: Math.max(0, Math.min(59, parseInt(m[2], 10))),
  };
}

function fmt(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function loadPresets(): string[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return DEFAULT_PRESETS;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.every((s) => typeof s === "string" && /^\d{2}:\d{2}$/.test(s))) {
      return arr;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PRESETS;
}

function savePresets(arr: string[]) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent("big-time-picker:presets-changed"));
  } catch {
    /* ignore */
  }
}

export const BigTimePicker: React.FC<BigTimePickerProps> = ({
  value,
  onChange,
  id,
  className,
  disabled,
  placeholder = "--:--",
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const parsed = parse(value);
  const [h, setH] = useState<number>(parsed?.h ?? 9);
  const [m, setM] = useState<number>(parsed?.m ?? 0);
  const [presets, setPresets] = useState<string[]>(() => loadPresets());
  const [editPresets, setEditPresets] = useState(false);
  const [newPreset, setNewPreset] = useState("");

  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  useEffect(() => {
    const p = parse(value);
    if (p) {
      setH(p.h);
      setM(p.m);
    }
  }, [value]);

  useEffect(() => {
    const onChg = () => setPresets(loadPresets());
    window.addEventListener("big-time-picker:presets-changed", onChg);
    window.addEventListener("storage", onChg);
    return () => {
      window.removeEventListener("big-time-picker:presets-changed", onChg);
      window.removeEventListener("storage", onChg);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      hoursRef.current
        ?.querySelector<HTMLElement>(`[data-h="${h}"]`)
        ?.scrollIntoView({ block: "center" });
      minutesRef.current
        ?.querySelector<HTMLElement>(`[data-m="${m}"]`)
        ?.scrollIntoView({ block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, [open, h, m]);

  const commit = useCallback(
    (newH: number, newM: number) => {
      onChange?.(fmt(newH, newM));
    },
    [onChange],
  );

  const handleConfirm = () => {
    commit(h, m);
    setOpen(false);
  };

  const handleNow = () => {
    const now = new Date();
    const nh = now.getHours();
    const nm = now.getMinutes();
    setH(nh);
    setM(nm);
    commit(nh, nm);
  };

  const handleQuick = (t: string) => {
    const p = parse(t);
    if (p) {
      setH(p.h);
      setM(p.m);
      commit(p.h, p.m);
      setOpen(false);
    }
  };

  const addPreset = () => {
    const p = parse(newPreset);
    if (!p) return;
    const t = fmt(p.h, p.m);
    if (presets.includes(t)) {
      setNewPreset("");
      return;
    }
    const next = [...presets, t].sort();
    setPresets(next);
    savePresets(next);
    setNewPreset("");
  };

  const removePreset = (t: string) => {
    const next = presets.filter((x) => x !== t);
    setPresets(next);
    savePresets(next);
  };

  const addCurrentAsPreset = () => {
    const t = fmt(h, m);
    if (presets.includes(t)) return;
    const next = [...presets, t].sort();
    setPresets(next);
    savePresets(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !editPresets) {
      e.preventDefault();
      handleConfirm();
    }
  };

  const display = parsed ? fmt(parsed.h, parsed.m) : "";

  return (
    <>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={rest["aria-label"] || "בחר שעה"}
        onClick={() => !disabled && setOpen(true)}
        className={cn(
          "flex items-center justify-between gap-2 h-9 px-3 rounded-md border bg-background text-sm",
          "hover:bg-accent/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "transition-colors w-full",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        <span dir="ltr" className="font-mono tabular-nums flex-1 text-center">
          {display || <span className="text-muted-foreground">{placeholder}</span>}
        </span>
      </button>

      <FloatingDialog
        open={open}
        onOpenChange={setOpen}
        storageKey="big-time-picker"
        title="בחירת שעה"
        defaultWidth={460}
        defaultHeight={560}
        minWidth={340}
        minHeight={420}
        contentClassName="p-0"
      >
        <div
          className="flex flex-col h-full w-full"
          onKeyDown={onKeyDown}
          dir="rtl"
        >
          <div className="px-4 py-3 text-center border-b bg-muted/30 shrink-0">
            <div
              dir="ltr"
              className="font-mono tabular-nums text-5xl font-bold tracking-wider text-primary leading-none"
              aria-live="polite"
            >
              {fmt(h, m)}
            </div>
          </div>

          <div className="flex-1 min-h-0 px-3 py-3">
            <div className="grid grid-cols-2 gap-3 h-full" dir="ltr">
              <Column
                ref={hoursRef}
                label="שעה"
                items={hours}
                selected={h}
                onPick={setH}
                dataAttr="h"
              />
              <Column
                ref={minutesRef}
                label="דקות"
                items={minutes}
                selected={m}
                onPick={setM}
                dataAttr="m"
              />
            </div>
          </div>

          <div className="px-3 pb-2 border-t pt-2 shrink-0" data-no-drag>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-muted-foreground">קיצורים</span>
              <button
                type="button"
                onClick={() => setEditPresets((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {editPresets ? "סיום" : "ערוך"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleNow}
              >
                עכשיו
              </Button>
              {presets.map((t) => (
                <div key={t} className="relative">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => !editPresets && handleQuick(t)}
                    className="font-mono tabular-nums"
                    disabled={editPresets}
                  >
                    {t}
                  </Button>
                  {editPresets && (
                    <button
                      type="button"
                      onClick={() => removePreset(t)}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80"
                      aria-label={`הסר ${t}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editPresets && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={newPreset}
                  onChange={(e) => setNewPreset(e.target.value)}
                  placeholder="HH:MM"
                  className="h-8 w-24 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPreset();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={addPreset}
                >
                  <Plus className="h-3.5 w-3.5 ml-1" />
                  הוסף
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={addCurrentAsPreset}
                  title="הוסף את הזמן הנוכחי כקיצור"
                >
                  + נוכחי ({fmt(h, m)})
                </Button>
              </div>
            )}
          </div>

          <div className="px-3 py-2.5 border-t flex justify-between gap-2 bg-muted/30 shrink-0" data-no-drag>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
            >
              נקה
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                ביטול
              </Button>
              <Button type="button" size="sm" onClick={handleConfirm}>
                אישור
              </Button>
            </div>
          </div>
        </div>
      </FloatingDialog>
    </>
  );
};

interface ColumnProps {
  label: string;
  items: number[];
  selected: number;
  onPick: (n: number) => void;
  dataAttr: "h" | "m";
}

const Column = React.forwardRef<HTMLDivElement, ColumnProps>(function Column(
  { label, items, selected, onPick, dataAttr },
  ref,
) {
  return (
    <div className="flex flex-col items-stretch border rounded-md overflow-hidden bg-card h-full">
      <div className="text-center text-xs font-semibold py-1.5 bg-muted text-muted-foreground select-none shrink-0">
        {label}
      </div>
      <div
        ref={ref}
        className="overflow-y-auto py-1 flex-1 min-h-0"
        role="listbox"
        aria-label={label}
        data-no-drag
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
                "block w-full text-center font-mono tabular-nums py-1.5 text-lg transition-colors",
                isSel
                  ? "bg-primary text-primary-foreground font-bold"
                  : "hover:bg-accent text-foreground",
              )}
            >
              {String(n).padStart(2, "0")}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default BigTimePicker;
