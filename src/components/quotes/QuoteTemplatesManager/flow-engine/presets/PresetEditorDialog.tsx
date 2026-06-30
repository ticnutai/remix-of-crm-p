// דיאלוג עריכה/יצירה של ערכת עיצוב — עם תצוגה מקדימה חיה (Live Preview).
// פאנל שמאל: בקרים. פאנל ימין: מסמך לדוגמה שמתעדכן בזמן אמת לפי השינויים.

import React, { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Type, Palette, Heading1, Table as TableIcon, Layout } from "lucide-react";
import { toast } from "sonner";
import type { DesignPreset, DesignPresetConfig } from "./types";
import { DEFAULT_PRESET_CONFIG } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
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
  const [liveMode, setLiveMode] = useState(true);

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

  const previewHtml = useMemo(() => buildPreviewHtml(cfg), [cfg]);

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
      <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] flex flex-col p-0" dir="rtl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {mode === "create" ? "ערכה חדשה" : "עריכת ערכה"}
              {liveMode && (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  מצב עיצוב חי
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={liveMode ? "default" : "outline"}
                onClick={() => setLiveMode((v) => !v)}
              >
                {liveMode ? "כבה תצוגה חיה" : "הפעל תצוגה חיה"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-0 overflow-hidden">
          {/* Controls panel */}
          <div className="overflow-y-auto border-l bg-muted/20 p-5 space-y-4">
            <Field label="שם הערכה">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>

            <Tabs defaultValue="typography" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="typography" className="text-xs gap-1">
                  <Type className="h-3 w-3" /> טיפוגרפיה
                </TabsTrigger>
                <TabsTrigger value="colors" className="text-xs gap-1">
                  <Palette className="h-3 w-3" /> צבעים
                </TabsTrigger>
                <TabsTrigger value="headings" className="text-xs gap-1">
                  <Heading1 className="h-3 w-3" /> כותרות
                </TabsTrigger>
                <TabsTrigger value="tables" className="text-xs gap-1">
                  <TableIcon className="h-3 w-3" /> טבלאות
                </TabsTrigger>
              </TabsList>

              <TabsContent value="typography" className="space-y-3 mt-4">
                <Field label="פונט גוף">
                  <Select value={cfg.fonts.body} onChange={(v) => patch("fonts.body", v)} options={FONT_OPTIONS} />
                </Field>
                <Field label="פונט כותרות">
                  <Select value={cfg.fonts.heading} onChange={(v) => patch("fonts.heading", v)} options={FONT_OPTIONS} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="גודל טקסט בסיס">
                    <Input value={cfg.fonts.size} onChange={(e) => patch("fonts.size", e.target.value)} />
                  </Field>
                  <Field label="גובה שורה">
                    <Input value={cfg.spacing.lineHeight} onChange={(e) => patch("spacing.lineHeight", e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="מרווח בין פסקאות">
                    <Input value={cfg.spacing.paragraphGap} onChange={(e) => patch("spacing.paragraphGap", e.target.value)} />
                  </Field>
                  <Field label="שולי עמוד">
                    <Input value={cfg.page.margin} onChange={(e) => patch("page.margin", e.target.value)} />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="colors" className="space-y-3 mt-4">
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
              </TabsContent>

              <TabsContent value="headings" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
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
                </div>
              </TabsContent>

              <TabsContent value="tables" className="space-y-3 mt-4">
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
                <div className="grid grid-cols-2 gap-3">
                  <Field label="גודל טקסט בטבלה">
                    <Input value={cfg.table?.fontSize || "10pt"} onChange={(e) => patch("table.fontSize", e.target.value)} />
                  </Field>
                  <Field label="ריפוד תאים (padding)">
                    <Input value={cfg.table?.padding || "2mm 3mm"} onChange={(e) => patch("table.padding", e.target.value)} />
                  </Field>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live preview panel */}
          <div className="flex flex-col overflow-hidden bg-muted/40">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-background/60">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layout className="h-3.5 w-3.5" />
                <span>תצוגה מקדימה — הצעת מחיר לדוגמה</span>
              </div>
              <span className="text-[10px] text-muted-foreground">A4 · RTL</span>
            </div>
            <div className="flex-1 overflow-auto p-6 flex justify-center">
              {liveMode ? (
                <iframe
                  key="live-preview"
                  srcDoc={previewHtml}
                  title="Design preset live preview"
                  className="bg-white shadow-xl rounded-sm"
                  style={{ width: "210mm", minHeight: "297mm", border: "0" }}
                />
              ) : (
                <div className="text-sm text-muted-foreground self-center">
                  התצוגה החיה כבויה
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t">
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
      <Label className="text-xs font-medium">{label}</Label>
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
        <option key={o} value={o} style={{ fontFamily: o }}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff";
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={safe}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 font-mono text-xs" />
      {value && (
        <div
          className="h-6 w-6 rounded-full border shadow-inner"
          style={{ background: value }}
          aria-hidden
        />
      )}
    </div>
  );
}

/** מסמך לדוגמה שמדמה הצעת מחיר אמיתית, מעוצב לפי cfg. */
function buildPreviewHtml(p: DesignPresetConfig): string {
  const accent = p.colors.accent;
  const heading = p.colors.heading;
  const text = p.colors.text;
  const muted = p.colors.muted;
  const headerBg = p.table?.headerBg || heading;
  const headerText = p.table?.headerText || "#ffffff";
  const border = p.table?.borderColor || "#dddddd";
  const rowAlt = p.table?.rowAltBg || "transparent";
  const tFontSize = p.table?.fontSize || "10pt";
  const tPad = p.table?.padding || "2mm 3mm";

  return `<!doctype html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #fff;
    color: ${text};
    font-family: ${p.fonts.body};
    font-size: ${p.fonts.size};
    line-height: ${p.spacing.lineHeight};
    direction: rtl;
  }
  .doc { padding: ${p.page.margin}; }
  .running-header {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 3mm; margin-bottom: 6mm;
    border-bottom: 2px solid ${accent};
    font-size: 9pt; color: ${muted};
  }
  .running-header .rh-name { color: ${heading}; font-weight: 700; font-size: 11pt; font-family: ${p.fonts.heading}; }
  h1.flow-h1 {
    margin: 0 0 4mm;
    font-family: ${p.fonts.heading};
    color: ${heading};
    font-size: ${p.headings.h1.size};
    font-weight: ${p.headings.h1.weight};
    border-bottom: 2px solid ${accent};
    padding-bottom: 2mm;
  }
  h2.flow-h2 {
    margin: 6mm 0 3mm;
    font-family: ${p.fonts.heading};
    color: ${heading};
    font-size: ${p.headings.h2.size};
    font-weight: ${p.headings.h2.weight};
  }
  p.flow-p { margin: 0 0 ${p.spacing.paragraphGap}; }
  .fld {
    display: inline-block; padding: 0 4px; border-radius: 3px;
    background: ${accent}22; color: ${heading}; font-size: 0.92em;
  }
  .flow-list { margin: 0 0 3mm; padding-inline-start: 6mm; }
  .flow-list li { margin-bottom: 1mm; }
  table.flow-table { width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; font-size: ${tFontSize}; }
  table.flow-table th, table.flow-table td {
    border: 1px solid ${border}; padding: ${tPad}; text-align: right;
  }
  table.flow-table th { background: ${headerBg}; color: ${headerText}; font-weight: 700; }
  table.flow-table tbody tr:nth-child(even) td { background: ${rowAlt}; }
  table.flow-table tbody tr:last-child td { font-weight: 700; background: ${accent}22; }
  .running-footer {
    margin-top: 8mm; padding-top: 3mm;
    border-top: 1px solid ${accent};
    font-size: 9pt; color: ${muted};
    display: flex; justify-content: space-between;
  }
</style>
</head>
<body>
  <div class="doc">
    <div class="running-header">
      <span class="rh-name">סטודיו לדוגמה — אדריכלות ועיצוב פנים</span>
      <span>הצעת מחיר #2026-104</span>
    </div>

    <h1 class="flow-h1">הצעת מחיר — תכנון אדריכלי</h1>

    <p class="flow-p">
      לכבוד <span class="fld">שם הלקוח</span>, מצורפת בזאת הצעת מחיר עבור פרויקט
      <span class="fld">כתובת הפרויקט</span>, גוש <span class="fld">12345</span> חלקה <span class="fld">67</span>.
      ההצעה כוללת את כל שלבי התכנון מהתכנון הראשוני ועד קבלת היתר הבנייה.
    </p>

    <h2 class="flow-h2">תיאור העבודה</h2>
    <ul class="flow-list">
      <li>מדידה וסקר שטח מקיף</li>
      <li>תכנון אדריכלי מפורט וגרמושקה</li>
      <li>ליווי מקצועי עד קבלת היתר</li>
      <li>תיאום מול יועצים וגורמי תכנון</li>
    </ul>

    <h2 class="flow-h2">לוח תשלומים</h2>
    <table class="flow-table">
      <thead>
        <tr>
          <th>שלב</th>
          <th>תיאור</th>
          <th>אחוז</th>
          <th>סכום (₪)</th>
          <th>כולל מע״מ (₪)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>חתימת חוזה</td><td>25%</td><td>5,000</td><td>5,850</td></tr>
        <tr><td>2</td><td>תכנון מוקדם</td><td>25%</td><td>5,000</td><td>5,850</td></tr>
        <tr><td>3</td><td>הגשת גרמושקה</td><td>30%</td><td>6,000</td><td>7,020</td></tr>
        <tr><td>4</td><td>קבלת היתר</td><td>20%</td><td>4,000</td><td>4,680</td></tr>
        <tr><td colspan="2">סה״כ</td><td>100%</td><td>20,000</td><td>23,400</td></tr>
      </tbody>
    </table>

    <p class="flow-p">
      תוקף ההצעה: 30 יום מתאריך הנפקתה. המחירים אינם כוללים אגרות ותשלומים לרשויות.
    </p>

    <div class="running-footer">
      <span>tel: 050-0000000 · mail@example.com</span>
      <span>עמוד 1</span>
    </div>
  </div>
</body>
</html>`;
}
