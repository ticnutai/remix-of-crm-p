// Quotes Pro — פאנל עיצוב (theme) + ערכות שמורות
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Palette, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listThemes, saveThemePreset } from "../data/api";
import { QP_FONTS } from "../model/types";
import type { QPTheme, QPThemePreset } from "../model/types";

interface Props {
  theme: QPTheme;
  onChange: (theme: QPTheme) => void;
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-24 text-xs font-mono"
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded border cursor-pointer p-0"
        />
      </div>
    </div>
  );
}

function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm min-w-[8rem]"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ThemePanel({ theme, onChange }: Props) {
  const { toast } = useToast();
  const [presets, setPresets] = useState<QPThemePreset[]>([]);
  const [presetName, setPresetName] = useState("");

  const set = (patch: Partial<QPTheme>) => onChange({ ...theme, ...patch });

  const refresh = () => listThemes().then(setPresets).catch(() => {});
  useEffect(() => {
    refresh();
  }, []);

  const handleSavePreset = async () => {
    const name = presetName.trim();
    if (!name) return;
    try {
      await saveThemePreset({ name, theme });
      setPresetName("");
      toast({ title: "ערכת העיצוב נשמרה" });
      refresh();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Palette className="h-3.5 w-3.5" /> צבעים
        </div>
        <ColorRow label="ראשי" value={theme.primaryColor} onChange={(v) => set({ primaryColor: v })} />
        <ColorRow label="משני" value={theme.secondaryColor} onChange={(v) => set({ secondaryColor: v })} />
        <ColorRow label="הדגשה" value={theme.accentColor} onChange={(v) => set({ accentColor: v })} />
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="text-xs font-semibold text-muted-foreground">טיפוגרפיה ופריסה</div>
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground">גופן</Label>
          <select
            className="h-8 rounded-md border bg-background px-2 text-sm min-w-[10rem]"
            value={theme.fontFamily}
            onChange={(e) => set({ fontFamily: e.target.value })}
          >
            {QP_FONTS.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value === "default" ? undefined : f.value }}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <SelectRow
          label="גודל גופן"
          value={theme.fontScale}
          onChange={(v) => set({ fontScale: v })}
          options={[
            { value: "small", label: "קטן" },
            { value: "medium", label: "בינוני" },
            { value: "large", label: "גדול" },
          ]}
        />
        <SelectRow
          label="סגנון טבלה"
          value={theme.tableStyle}
          onChange={(v) => set({ tableStyle: v })}
          options={[
            { value: "simple", label: "פשוט" },
            { value: "striped", label: "פסים" },
            { value: "bordered", label: "מסגרת" },
            { value: "modern", label: "מודרני" },
          ]}
        />
        <SelectRow
          label="רקע"
          value={theme.backgroundPattern}
          onChange={(v) => set({ backgroundPattern: v })}
          options={[
            { value: "none", label: "ללא" },
            { value: "dots", label: "נקודות" },
            { value: "lines", label: "קווים" },
            { value: "grid", label: "רשת" },
          ]}
        />
        <SelectRow
          label="פוטר"
          value={theme.footer}
          onChange={(v) => set({ footer: v })}
          options={[
            { value: "minimal", label: "מינימלי" },
            { value: "detailed", label: "מפורט" },
            { value: "branded", label: "ממותג" },
          ]}
        />
      </div>

      {/* Presets */}
      <div className="space-y-2 border-t pt-3">
        <div className="text-xs font-semibold text-muted-foreground">ערכות שמורות</div>
        <div className="flex gap-2">
          <Input
            placeholder="שם הערכה"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="h-8"
          />
          <Button size="sm" variant="outline" onClick={handleSavePreset} className="shrink-0">
            <Save className="h-4 w-4 ml-1" />
            שמור
          </Button>
        </div>
        {presets.length > 0 && (
          <div className="space-y-1">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onChange({ ...p.theme });
                  toast({ title: `הוחלה הערכה "${p.name}"` });
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded border hover:bg-muted text-sm"
              >
                <span className="flex gap-1">
                  <span className="h-4 w-4 rounded-full" style={{ background: p.theme.primaryColor }} />
                  <span className="h-4 w-4 rounded-full" style={{ background: p.theme.secondaryColor }} />
                  <span className="h-4 w-4 rounded-full" style={{ background: p.theme.accentColor }} />
                </span>
                <span className="flex-1 text-right truncate">{p.name}</span>
                <Check className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
