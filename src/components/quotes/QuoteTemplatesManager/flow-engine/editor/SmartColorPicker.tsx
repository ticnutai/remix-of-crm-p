// SmartColorPicker — בורר צבעים משוכלל: 3 קטגוריות, שמירה בענן, Eyedropper, ניהול ושינוי גודל
import React, { useRef, useState } from "react";
import {
  Pipette,
  X,
  Star,
  Plus,
  Settings,
  Trash2,
  Type as TypeIcon,
  Highlighter,
  Underline as UnderlineIcon,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  onRemove?: () => void;
  size?: number;
}

function Swatch({ color, onPick, onRemove, size = 28 }: SwatchProps) {
  return (
    <div className="group relative" style={{ width: size, height: size }}>
      <button
        type="button"
        onClick={onPick}
        className="block h-full w-full rounded-md border border-border shadow-sm transition-transform duration-150 hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{ backgroundColor: color }}
        title={color}
      />
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -left-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow group-hover:flex"
          title="הסר"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// --- Manage Dialog ---
function ManageColorsDialog({
  open,
  onOpenChange,
  activeCategory,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeCategory: ColorCategory;
}) {
  const [cat, setCat] = useState<ColorCategory>(activeCategory);
  const { colors, save, remove } = useSavedColors(cat);
  const [newColor, setNewColor] = useState("#162C58");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            ניהול צבעים שמורים
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/60 p-1">
          {(Object.keys(CATEGORY_LABEL) as ColorCategory[]).map((c) => {
            const TabIcon = CATEGORY_ICON[c];
            const active = cat === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TabIcon className="h-3.5 w-3.5" />
                {CATEGORY_LABEL[c]}
              </button>
            );
          })}
        </div>

        {/* Add row */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
          <input
            type="color"
            value={isValidHex(newColor) ? newColor : "#000000"}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-9 w-11 cursor-pointer rounded-md border border-border bg-background"
          />
          <input
            type="text"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="#RRGGBB"
            dir="ltr"
            className="h-9 flex-1 rounded-md border border-border bg-background px-2 text-left font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            disabled={!isValidHex(newColor)}
            onClick={() => save(newColor)}
            className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            הוסף
          </button>
        </div>

        {/* List */}
        <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border p-2">
          {colors.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              אין צבעים שמורים בקטגוריה זו
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {colors.map((s) => (
                <div
                  key={s.id}
                  className="group relative flex flex-col items-center gap-1 rounded-md border border-border p-1.5"
                >
                  <div
                    className="h-10 w-full rounded-md border border-border"
                    style={{ backgroundColor: s.color }}
                  />
                  <span dir="ltr" className="font-mono text-[10px] text-muted-foreground">
                    {s.color}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                    title="מחק"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Picker ---
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
  const [manageOpen, setManageOpen] = useState(false);

  // --- Resize state ---
  const [size, setSize] = useState({ w: 300, h: 460 });
  const containerRef = useRef<HTMLDivElement>(null);
  const MIN_W = 260;
  const MAX_W = 560;
  const MIN_H = 380;
  const MAX_H = 720;

  const startResize = (
    e: React.PointerEvent,
    dir: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.w;
    const startH = size.h;
    (e.target as Element).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      let dw = 0;
      let dh = 0;
      if (dir.includes("e")) dw = ev.clientX - startX;
      if (dir.includes("w")) dw = startX - ev.clientX;
      if (dir.includes("s")) dh = ev.clientY - startY;
      if (dir.includes("n")) dh = startY - ev.clientY;
      setSize({
        w: Math.min(MAX_W, Math.max(MIN_W, startW + dw)),
        h: Math.min(MAX_H, Math.max(MIN_H, startH + dh)),
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

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

  const handleClass =
    "absolute bg-transparent hover:bg-primary/20 transition-colors";

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden"
      style={{ width: size.w, height: size.h }}
      dir="rtl"
    >
      <div className="h-full overflow-y-auto pb-1 pl-2 pr-2 pt-1">
        {/* Header: tabs + settings */}
        <div className="mb-2 flex items-center gap-1">
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-lg bg-muted/60 p-1">
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
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="ניהול צבעים שמורים"
            aria-label="ניהול צבעים שמורים"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            פלטה
          </span>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS[tab].map((c) => (
            <Swatch
              key={c}
              color={c}
              onPick={() => pick(c)}
            />
          ))}
        </div>

        {/* Saved */}
        <div className="mt-3 mb-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
            שמורים ({saved.length})
          </span>
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="text-[10px] text-muted-foreground underline-offset-2 hover:underline"
          >
            נהל
          </button>
        </div>
        {saved.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
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
            לחץ '+' כדי להוסיף צבע לשמורים
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
              disabled={!isValidHex(custom)}
              onClick={() => save(custom)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-amber-950 ring-1 ring-amber-600/40 transition-colors hover:bg-amber-500 disabled:opacity-50"
              title="הוסף לשמורים"
              aria-label="הוסף לשמורים"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
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

      {/* === Resize handles === */}
      {/* edges */}
      <div
        className={`${handleClass} top-0 left-1 right-1 h-1 cursor-n-resize`}
        onPointerDown={(e) => startResize(e, "n")}
      />
      <div
        className={`${handleClass} bottom-0 left-1 right-1 h-1 cursor-s-resize`}
        onPointerDown={(e) => startResize(e, "s")}
      />
      <div
        className={`${handleClass} left-0 top-1 bottom-1 w-1 cursor-w-resize`}
        onPointerDown={(e) => startResize(e, "w")}
      />
      <div
        className={`${handleClass} right-0 top-1 bottom-1 w-1 cursor-e-resize`}
        onPointerDown={(e) => startResize(e, "e")}
      />
      {/* corners */}
      <div
        className={`${handleClass} top-0 left-0 h-2 w-2 cursor-nw-resize`}
        onPointerDown={(e) => startResize(e, "nw")}
      />
      <div
        className={`${handleClass} top-0 right-0 h-2 w-2 cursor-ne-resize`}
        onPointerDown={(e) => startResize(e, "ne")}
      />
      <div
        className={`${handleClass} bottom-0 left-0 h-2 w-2 cursor-sw-resize`}
        onPointerDown={(e) => startResize(e, "sw")}
      />
      <div
        className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"
        onPointerDown={(e) => startResize(e, "se")}
        title="גרור לשינוי גודל"
      >
        <svg viewBox="0 0 10 10" className="h-full w-full text-muted-foreground/60">
          <path d="M0 10 L10 0 M4 10 L10 4 M8 10 L10 8" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </div>

      <ManageColorsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        activeCategory={tab}
      />
    </div>
  );
}
