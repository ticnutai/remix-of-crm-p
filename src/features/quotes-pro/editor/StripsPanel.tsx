// Quotes Pro — פאנל עריכת סטריפים (פס עליון/תחתון החוזר בכל עמוד)
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { LogoUploadField } from "./LogoUploadField";
import type { QPStrip, QPStrips } from "../model/types";

interface Props {
  strips: QPStrips;
  onChange: (strips: QPStrips) => void;
}

function StripEditor({
  title,
  strip,
  isFooter,
  onChange,
}: {
  title: string;
  strip: QPStrip;
  isFooter?: boolean;
  onChange: (s: QPStrip) => void;
}) {
  const set = (patch: Partial<QPStrip>) => onChange({ ...strip, ...patch });
  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        <Switch checked={strip.enabled} onCheckedChange={(v) => set({ enabled: v })} />
      </div>

      {strip.enabled && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">גובה: {strip.height} מ״מ</Label>
            <Slider
              min={8}
              max={60}
              step={1}
              value={[strip.height]}
              onValueChange={([v]) => set({ height: v })}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">צבע רקע</Label>
            <div className="flex items-center gap-2">
              <Input value={strip.bgColor} onChange={(e) => set({ bgColor: e.target.value })} className="h-8 w-24 text-xs font-mono" />
              <input type="color" value={strip.bgColor} onChange={(e) => set({ bgColor: e.target.value })} className="h-8 w-8 rounded border cursor-pointer p-0" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">טקסט בפס</Label>
            <Input value={strip.text || ""} onChange={(e) => set({ text: e.target.value })} className="h-8" placeholder="לדוגמה: שם החברה / סלוגן" />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">צבע טקסט</Label>
            <input type="color" value={strip.textColor || "#ffffff"} onChange={(e) => set({ textColor: e.target.value })} className="h-8 w-8 rounded border cursor-pointer p-0" />
          </div>

          <LogoUploadField value={strip.logoUrl} onChange={(v) => set({ logoUrl: v })} />


          {strip.logoUrl && (
            <div>
              <Label className="text-xs text-muted-foreground">גובה לוגו: {strip.logoHeight || 36}px</Label>
              <Slider min={16} max={120} step={2} value={[strip.logoHeight || 36]} onValueChange={([v]) => set({ logoHeight: v })} className="mt-1" />
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">יישור</Label>
            <select
              className="h-8 rounded-md border bg-background px-2 text-sm"
              value={strip.logoAlign || "right"}
              onChange={(e) => set({ logoAlign: e.target.value as QPStrip["logoAlign"] })}
            >
              <option value="right">ימין</option>
              <option value="center">מרכז</option>
              <option value="left">שמאל</option>
            </select>
          </div>

          {isFooter && (
            <div className="flex items-center gap-2">
              <Switch checked={!!strip.showPageNumber} onCheckedChange={(v) => set({ showPageNumber: v })} />
              <Label className="text-sm">הצג מספור עמודים</Label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StripsPanel({ strips, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground">
        פסים — חוזרים בכל עמוד (כותרת עליונה / תחתונה)
      </div>
      <StripEditor
        title="פס עליון"
        strip={strips.header}
        onChange={(header) => onChange({ ...strips, header })}
      />
      <StripEditor
        title="פס תחתון"
        strip={strips.footer}
        isFooter
        onChange={(footer) => onChange({ ...strips, footer })}
      />
    </div>
  );
}
