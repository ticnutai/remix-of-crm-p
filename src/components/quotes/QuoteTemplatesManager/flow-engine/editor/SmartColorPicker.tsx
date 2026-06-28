// SmartColorPicker — בורר צבעים משוכלל עם 3 קטגוריות, צבעים שמורים בענן ו-Eyedropper
import React, { useState } from "react";
import { Pipette, Trash2, Plus, Type as TypeIcon, Highlighter, Underline as UnderlineIcon } from "lucide-react";
import { useSavedColors, type ColorCategory } from "./useSavedColors";

interface Props {
  category: ColorCategory;
  onPick: (color: string) => void;
  onClear: () => void;
}

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
  text: "צבע טקסט",
  highlight: "רקע מתחת לטקסט",
  underline: "צבע קו תחתון",
};

const CATEGORY_ICON: Record<ColorCategory, React.ComponentType<{ className?: string }>> = {
  text: TypeIcon,
  highlight: Highlighter,
  underline: UnderlineIcon,
};

function isValidHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
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
  const [custom, setCustom] = useState("#000000");

  const pick = (c: string) => {
    onPick(c, tab);
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
        pick(res.sRGBHex);
        save(res.sRGBHex);
      }
    } catch {
      /* user cancelled */
    }
  };

  const Icon = CATEGORY_ICON[tab];

  return (
    <div className="w-72 select-none" dir="rtl">
      {/* Tabs */}
      <div className="mb-2 grid grid-cols-3 gap-1 rounded-md bg-muted/50 p-1">
        {(Object.keys(CATEGORY_LABEL) as ColorCategory[]).map((c) => {
          const TabIcon = CATEGORY_ICON[c];
          const active = tab === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setTab(c)}
              className={`flex items-center justify-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={CATEGORY_LABEL[c]}
            >
              <TabIcon className="h-3 w-3" />
              <span>{CATEGORY_LABEL[c].split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="h-3 w-3" />
        {CATEGORY_LABEL[tab]}
      </div>

      {/* Presets */}
      <div className="grid grid-cols-8 gap-1.5">
        {PRESETS[tab].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => pick(c)}
            className="h-6 w-6 rounded border border-border transition-transform hover:scale-110"
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      {/* Saved colors */}
      {saved.length > 0 && (
        <>
          <div className="mt-3 mb-1 text-[11px] font-medium text-muted-foreground">שמורים</div>
          <div className="grid grid-cols-8 gap-1.5">
            {saved.map((s) => (
              <div key={s.id} className="group relative">
                <button
                  type="button"
                  onClick={() => pick(s.color)}
                  className="h-6 w-6 rounded border border-border transition-transform hover:scale-110"
                  style={{ backgroundColor: s.color }}
                  title={s.color}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(s.id);
                  }}
                  className="absolute -left-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow group-hover:flex"
                  title="הסר"
                >
                  <Trash2 className="h-2 w-2" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Custom input */}
      <div className="mt-3 rounded-md border border-border p-2">
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">צבע מותאם</div>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={isValidHex(custom) ? custom : "#000000"}
            onChange={(e) => setCustom(e.target.value)}
            className="h-7 w-9 cursor-pointer rounded border border-border"
            title="בחר צבע"
          />
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="#RRGGBB"
            className="h-7 flex-1 rounded border border-border bg-background px-2 text-left text-xs font-mono"
            dir="ltr"
          />
          <button
            type="button"
            onClick={handleEyedropper}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-border hover:bg-muted"
            title="Eyedropper — זיהוי צבע מהמסך"
          >
            <Pipette className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            disabled={!isValidHex(custom)}
            onClick={() => {
              pick(custom);
              save(custom);
            }}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            החל ושמור
          </button>
          <button
            type="button"
            disabled={!isValidHex(custom)}
            onClick={() => pick(custom)}
            className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted disabled:opacity-50"
          >
            החל בלבד
          </button>
        </div>
      </div>

      {/* Clear */}
      <button
        type="button"
        onClick={() => onClear(tab)}
        className="mt-2 w-full rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
      >
        איפוס {CATEGORY_LABEL[tab]}
      </button>
    </div>
  );
}
