// SmartColorPicker — בורר צבעים משוכלל: 3 קטגוריות, שמירה בענן, Eyedropper
import React, { useState } from "react";
import {
  Pipette,
  X,
  Star,
  Type as TypeIcon,
  Highlighter,
  Underline as UnderlineIcon,
  Check,
} from "lucide-react";
import { useSavedColors, type ColorCategory } from "./useSavedColors";

const PRESETS: Record<ColorCategory, string[]> = {
  text: [
    "#000000", "#1f2937", "#374151", "#6b7280",
    "#dc2626", "#ea580c", "#d97706", "#ca8a04",
    "#16a34a", "#0891b2", "#2563eb", "#7c3aed",
    "#db2777", "#162C58", "#d8ac27", "#ffffff",
  ],
  highlight: [
    "#fef08a", "#fde68a", "#fecaca", "#fed7aa",
    "#bbf7d0", "#a7f3d0", "#bfdbfe", "#ddd6fe",
    "#fbcfe8", "#e5e7eb", "#fff59d", "#d8ac2733",
  ],
  underline: [
    "#dc2626", "#ea580c", "#d97706", "#16a34a",
    "#0891b2", "#2563eb", "#7c3aed", "#db2777",
    "#162C58", "#d8ac27", "#000000", "#6b7280",
  ],
};

const CATEGORY_LABEL: Record<ColorCategory, string> = {
  text: "טקסט",
  highlight: "רקע",
  underline: "קו תחתון",
};

const CATEGORY_ICON: Record<ColorCategory, React.ComponentType<{ className?: string }>> = {
  text: TypeIcon,
  highlight: Highlighter,
  underline: UnderlineIcon,
};

function isValidHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
}

interface SwatchProps {
  color: string;
  onPick: () => void;
  onSave?: () => void;
  onRemove?: () => void;
  saved?: boolean;
}

function Swatch({ color, onPick, onSave, onRemove, saved }: SwatchProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onPick}
        className="block h-7 w-7 rounded-md border border-border shadow-sm transition-transform duration-150 hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{ backgroundColor: color }}
        title={color}
      />
      {onSave && !saved && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-md ring-1 ring-amber-600/40 transition-transform hover:scale-125"
          title="שמור צבע"
          aria-label="שמור צבע"
        >
          <Star className="h-2.5 w-2.5 fill-current" />
        </button>
      )}
      {saved && !onRemove && (
        <span
          className="absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
          title="שמור"
        >
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -left-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow group-hover:flex"
          title="הסר"
        >
          <X className="h-2 w-2" />
        </button>
      )}
    </div>
  );
}

export default function SmartColorPicker({
  initialCategory = "text",
  onPick,
  onClear,
}: {
  initialCategory?: ColorCategory;
  onPick: (color: string, category: ColorCategory) => void;
  onClear: (category: ColorCategory) => void;
}) {
  const [tab, setTab] = useState<ColorCategory>(initialCategory);
  const { colors: saved, save, remove } = useSavedColors(tab);
  const [custom, setCustom] = useState("#162C58");

  const pick = (c: string) => onPick(c, tab);
  const pickAndSave = (c: string) => {
    onPick(c, tab);
    save(c);
  };

  const handleEyedropper = async () => {
    const w = window as any;
    if (!w.EyeDropper) {
      window.alert("Eyedropper נתמך רק ב-Chrome/Edge עדכניים");
      return;
    }
    try {
      const res = await new w.EyeDropper().open();
      if (res?.sRGBHex) {
        setCustom(res.sRGBHex);
        pickAndSave(res.sRGBHex);
      }
    } catch {
      /* user cancelled */
    }
  };

  const Icon = CATEGORY_ICON[tab];
  const isSaved = (c: string) =>
    saved.some((s) => s.color.toLowerCase() === c.toLowerCase());

  return (
    <div className="w-[280px] select-none" dir="rtl">
      {/* Tabs */}
      <div className="mb-2 grid grid-cols-3 gap-1 rounded-lg bg-muted/60 p-1">
        {(Object.keys(CATEGORY_LABEL) as ColorCategory[]).map((c) => {
          const TabIcon = CATEGORY_ICON[c];
          const active = tab === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setTab(c)}
              className={`flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TabIcon className="h-3 w-3" />
              <span>{CATEGORY_LABEL[c]}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          פלטה
        </span>
        <span className="text-[10px] opacity-60">ריחוף = ⭐ לשמירה</span>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-8 gap-1.5">
        {PRESETS[tab].map((c) => (
          <Swatch
            key={c}
            color={c}
            onPick={() => pick(c)}
            onSave={() => save(c)}
            saved={isSaved(c)}
          />
        ))}
      </div>

      {/* Saved — תמיד מוצג, עם מצב ריק ברור */}
      <div className="mt-3 mb-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          שמורים ({saved.length})
        </span>
      </div>
      {saved.length > 0 ? (
        <div className="grid grid-cols-8 gap-1.5">
          {saved.map((s) => (
            <Swatch
              key={s.id}
              color={s.color}
              onPick={() => pick(s.color)}
              onRemove={() => remove(s.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-2 py-2 text-center text-[10.5px] text-muted-foreground">
          אין צבעים שמורים. לחץ ⭐ על צבע, או "החל ושמור" למטה
        </div>
      )}

      {/* Custom input */}
      <div className="mt-3 rounded-lg border border-border bg-muted/30 p-2">
        <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">
          צבע מותאם אישית
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={isValidHex(custom) ? custom : "#000000"}
            onChange={(e) => setCustom(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded-md border border-border bg-background"
            title="בחר צבע"
          />
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="#RRGGBB"
            className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-left font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            dir="ltr"
          />
          <button
            type="button"
            onClick={handleEyedropper}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-muted"
            title="Eyedropper — זיהוי צבע מהמסך"
          >
            <Pipette className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            disabled={!isValidHex(custom)}
            onClick={() => pickAndSave(custom)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Star className="h-3 w-3" />
            החל ושמור
          </button>
          <button
            type="button"
            disabled={!isValidHex(custom)}
            onClick={() => pick(custom)}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-[11px] transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Check className="h-3 w-3" />
            החל
          </button>
        </div>
      </div>

      {/* Clear */}
      <button
        type="button"
        onClick={() => onClear(tab)}
        className="mt-2 w-full rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        איפוס {CATEGORY_LABEL[tab]}
      </button>
    </div>
  );
}
