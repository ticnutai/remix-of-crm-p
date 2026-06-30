// דיאלוג עריכה/יצירה של ערכת עיצוב. עובד על עותק מקומי, שומר בלחיצה.

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { DesignPreset, DesignPresetConfig } from "./types";
import { DEFAULT_PRESET_CONFIG } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** ערכה לעריכה. null = יצירת ערכה חדשה. ערכה is_builtin תפתח כ"שכפול חדש". */
  preset: DesignPreset | null;
  onSave: (name: string, config: DesignPresetConfig, mode: "create" | "update") => Promise<void>;
}

const FONT_OPTIONS = [
  "Heebo, sans-serif",
  "Assistant, sans-serif",
  "Rubik, sans-serif",
  "Frank Ruhl Libre, serif",
  "Noto Sans Hebrew, sans-serif",
  "Arial, sans-serif",
];

export default function PresetEditorDialog({ open, onOpenChange, preset, onSave }: Props) {
  const isBuiltin = !!preset?.is_builtin;
  const mode: "create" | "update" = preset && !isBuiltin ? "update" : "create";

  const [name, setName] = useState("");
  const [cfg, setCfg] = useState<DesignPresetConfig>(DEFAULT_PRESET_CONFIG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(preset ? (isBuiltin ? `עותק של ${preset.name}` : preset.name) : "ערכה חדשה");
      setCfg(preset ? preset.config : DEFAULT_PRESET_CONFIG);
    }
  }, [open, preset, isBuiltin]);

  const patch = (path: string, value: string) => {
    setCfg((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as any;
      const segs = path.split(".");
      let obj = next;
      for (let i = 0; i < segs.length - 1; i++) obj = obj[segs[i]];
      obj[segs[segs.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("שם הערכה חובה");
      return;
    }
    setSaving(true);
    try {
      await onSave(name.trim(), cfg, mode);
      toast.success(mode === "create" ? "ערכה נוצרה" : "ערכה עודכנה");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "ערכה חדשה" : "עריכת ערכה"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="שם הערכה">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <Separator className="md:col-span-2" />

          <Field label="פונט גוף">
            <Select value={cfg.fonts.body} onChange={(v) => patch("fonts.body", v)} options={FONT_OPTIONS} />
          </Field>
          <Field label="פונט כותרות">
            <Select value={cfg.fonts.heading} onChange={(v) => patch("fonts.heading", v)} options={FONT_OPTIONS} />
          </Field>
          <Field label="גודל טקסט בסיס">
            <Input value={cfg.fonts.size} onChange={(e) => patch("fonts.size", e.target.value)} />
          </Field>
          <Field label="גובה שורה">
            <Input value={cfg.spacing.lineHeight} onChange={(e) => patch("spacing.lineHeight", e.target.value)} />
          </Field>

          <Separator className="md:col-span-2" />

          <Field label="צבע טקסט">
            <ColorInput value={cfg.colors.text} onChange={(v) => patch("colors.text", v)} />
          </Field>
          <Field label="צבע כותרות">
            <ColorInput value={cfg.colors.heading} onChange={(v) => patch("colors.heading", v)} />
          </Field>
          <Field label="צבע הדגשה (Accent)">
            <ColorInput value={cfg.colors.accent} onChange={(v) => patch("colors.accent", v)} />
          </Field>
          <Field label="צבע משני (Muted)">
            <ColorInput value={cfg.colors.muted} onChange={(v) => patch("colors.muted", v)} />
          </Field>

          <Separator className="md:col-span-2" />

          <Field label="גודל H1">
            <Input value={cfg.headings.h1.size} onChange={(e) => patch("headings.h1.size", e.target.value)} />
          </Field>
          <Field label="עובי H1">
            <Input value={cfg.headings.h1.weight} onChange={(e) => patch("headings.h1.weight", e.target.value)} />
          </Field>
          <Field label="גודל H2">
            <Input value={cfg.headings.h2.size} onChange={(e) => patch("headings.h2.size", e.target.value)} />
          </Field>
          <Field label="עובי H2">
            <Input value={cfg.headings.h2.weight} onChange={(e) => patch("headings.h2.weight", e.target.value)} />
          </Field>

          <Field label="מרווח בין פסקאות">
            <Input value={cfg.spacing.paragraphGap} onChange={(e) => patch("spacing.paragraphGap", e.target.value)} />
          </Field>
          <Field label="שולי עמוד">
            <Input value={cfg.page.margin} onChange={(e) => patch("page.margin", e.target.value)} />
          </Field>

          <Separator className="md:col-span-2" />
          <div className="md:col-span-2 text-sm font-semibold text-muted-foreground">עיצוב טבלאות</div>

          <Field label="צבע רקע כותרת טבלה">
            <ColorInput value={cfg.table?.headerBg || ""} onChange={(v) => patch("table.headerBg", v)} />
          </Field>
          <Field label="צבע טקסט כותרת טבלה">
            <ColorInput value={cfg.table?.headerText || "#ffffff"} onChange={(v) => patch("table.headerText", v)} />
          </Field>
          <Field label="צבע מסגרת">
            <ColorInput value={cfg.table?.borderColor || "#dddddd"} onChange={(v) => patch("table.borderColor", v)} />
          </Field>
          <Field label="פס רקע לשורות זוגיות (Zebra)">
            <ColorInput value={cfg.table?.rowAltBg || ""} onChange={(v) => patch("table.rowAltBg", v)} />
          </Field>
          <Field label="גודל טקסט בטבלה">
            <Input value={cfg.table?.fontSize || "10pt"} onChange={(e) => patch("table.fontSize", e.target.value)} />
          </Field>
          <Field label="ריפוד תאים (padding)">
            <Input value={cfg.table?.padding || "2mm 3mm"} onChange={(e) => patch("table.padding", e.target.value)} />
          </Field>
        </div>


        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {mode === "create" ? "צור ערכה" : "שמור שינויים"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
    </div>
  );
}
