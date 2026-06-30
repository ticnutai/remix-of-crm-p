// דיאלוג עריכה/יצירה של ערכת עיצוב — Live Preview + 5 טאבים מסודרים.
// טאבים: טיפוגרפיה · צבעים · כותרות · בלוקים · סטריפים.

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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles,
  Type,
  Palette,
  Heading1,
  Layout,
  Layers,
  Image as ImageIcon,
  Frame,
  Check,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import type {
  DesignPreset,
  DesignPresetConfig,
  HeadingStyle,
  PresetStrips,
  StripMode,
} from "./types";
import { DEFAULT_PRESET_CONFIG } from "./types";
import { buildPresetExtraCss } from "./presetExtras";
import { listBrandAssets, type FlowBrandAsset } from "../brandAssetLibrary";

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
  "Alef, sans-serif",
  "Secular One, sans-serif",
  "Miriam Libre, sans-serif",
  "Noto Sans Hebrew, sans-serif",
  "David Libre, serif",
  "Frank Ruhl Libre, serif",
  "Noto Serif Hebrew, serif",
  "Bellefair, serif",
  "Suez One, serif",
  "Arial, sans-serif",
];

export default function PresetEditorDialog({ open, onOpenChange, preset, onSave }: Props) {
  const isBuiltin = !!preset?.is_builtin;
  const mode: "create" | "update" = preset && !isBuiltin ? "update" : "create";

  const [name, setName] = useState("");
  const [cfg, setCfg] = useState<DesignPresetConfig>(DEFAULT_PRESET_CONFIG);
  const [saving, setSaving] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const [assets, setAssets] = useState<FlowBrandAsset[]>([]);

  useEffect(() => {
    if (open) {
      setName(preset ? (isBuiltin ? `עותק של ${preset.name}` : preset.name) : "ערכה חדשה");
      // ממזגים עם ברירת מחדל מלאה כדי לא לאבד שדות חדשים
      const D = DEFAULT_PRESET_CONFIG;
      const c = (preset?.config || {}) as any;
      setCfg({
        fonts: { ...D.fonts, ...(c.fonts || {}) },
        colors: { ...D.colors, ...(c.colors || {}) },
        spacing: { ...D.spacing, ...(c.spacing || {}) },
        headings: {
          h1: { ...D.headings.h1, ...((c.headings || {}).h1 || {}) },
          h2: { ...D.headings.h2, ...((c.headings || {}).h2 || {}) },
          h3: { ...(D.headings.h3 || {}), ...((c.headings || {}).h3 || {}) },
        },
        page: { ...D.page, ...(c.page || {}) },
        table: { ...(D.table || {}), ...(c.table || {}) },
        blocks: {
          paragraphFrame: { ...(D.blocks?.paragraphFrame || {}), ...((c.blocks || {}).paragraphFrame || {}) },
          callout: { ...(D.blocks?.callout || {}), ...((c.blocks || {}).callout || {}) },
          blockquote: { ...(D.blocks?.blockquote || {}), ...((c.blocks || {}).blockquote || {}) },
          divider: { ...(D.blocks?.divider || {}), ...((c.blocks || {}).divider || {}) },
        },
        strips: { ...(D.strips || {}), ...(c.strips || {}) },
      });
    }
  }, [open, preset, isBuiltin]);

  // Brand assets for the Strips tab
  useEffect(() => {
    if (!open) return;
    listBrandAssets()
      .then((list) => setAssets(list.filter((a) => a.kind === "strip" || a.kind === "bundle")))
      .catch(() => setAssets([]));
  }, [open]);

  const patch = (path: string, value: any) => {
    setCfg((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as any;
      const segs = path.split(".");
      let obj = next;
      for (let i = 0; i < segs.length - 1; i++) {
        if (obj[segs[i]] === undefined || obj[segs[i]] === null) obj[segs[i]] = {};
        obj = obj[segs[i]];
      }
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

  const h1: HeadingStyle = cfg.headings.h1;
  const h2: HeadingStyle = cfg.headings.h2;
  const h3: HeadingStyle = cfg.headings.h3 || ({} as HeadingStyle);
  const blocks = cfg.blocks || {};
  const strips: PresetStrips = cfg.strips || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1280px] w-[96vw] h-[92vh] flex flex-col p-0" dir="rtl">
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

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-0 overflow-hidden">
          {/* Controls panel */}
          <div className="overflow-y-auto border-l bg-muted/20 p-5 space-y-4">
            <Field label="שם הערכה">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>

            <Tabs defaultValue="typography" className="w-full">
              <TabsList className="grid grid-cols-5 w-full h-auto">
                <TabsTrigger value="typography" className="text-[11px] gap-1 px-1 py-2 flex-col">
                  <Type className="h-3.5 w-3.5" /> טיפו'
                </TabsTrigger>
                <TabsTrigger value="colors" className="text-[11px] gap-1 px-1 py-2 flex-col">
                  <Palette className="h-3.5 w-3.5" /> צבעים
                </TabsTrigger>
                <TabsTrigger value="headings" className="text-[11px] gap-1 px-1 py-2 flex-col">
                  <Heading1 className="h-3.5 w-3.5" /> כותרות
                </TabsTrigger>
                <TabsTrigger value="blocks" className="text-[11px] gap-1 px-1 py-2 flex-col">
                  <Frame className="h-3.5 w-3.5" /> בלוקים
                </TabsTrigger>
                <TabsTrigger value="strips" className="text-[11px] gap-1 px-1 py-2 flex-col">
                  <Layers className="h-3.5 w-3.5" /> סטריפים
                </TabsTrigger>
              </TabsList>

              {/* ---------- TYPOGRAPHY ---------- */}
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

              {/* ---------- COLORS ---------- */}
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

                <div className="pt-3 border-t mt-3 space-y-2">
                  <Label className="text-xs font-semibold">טבלאות</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="רקע כותרת">
                      <ColorInput value={cfg.table?.headerBg || ""} onChange={(v) => patch("table.headerBg", v)} />
                    </Field>
                    <Field label="טקסט כותרת">
                      <ColorInput value={cfg.table?.headerText || "#ffffff"} onChange={(v) => patch("table.headerText", v)} />
                    </Field>
                    <Field label="מסגרת">
                      <ColorInput value={cfg.table?.borderColor || "#dddddd"} onChange={(v) => patch("table.borderColor", v)} />
                    </Field>
                    <Field label="זברה (זוגיות)">
                      <ColorInput value={cfg.table?.rowAltBg || ""} onChange={(v) => patch("table.rowAltBg", v)} />
                    </Field>
                  </div>
                </div>
              </TabsContent>

              {/* ---------- HEADINGS ---------- */}
              <TabsContent value="headings" className="space-y-4 mt-4">
                <HeadingEditor
                  label="H1 — כותרת ראשית"
                  value={h1}
                  onChange={(k, v) => patch(`headings.h1.${k}`, v)}
                />
                <HeadingEditor
                  label="H2 — כותרת משנה"
                  value={h2}
                  onChange={(k, v) => patch(`headings.h2.${k}`, v)}
                />
                <HeadingEditor
                  label="H3 — תת־כותרת"
                  value={h3}
                  onChange={(k, v) => patch(`headings.h3.${k}`, v)}
                />
              </TabsContent>

              {/* ---------- BLOCKS ---------- */}
              <TabsContent value="blocks" className="space-y-4 mt-4">
                {/* Paragraph frame */}
                <Section title="מסגרת לפסקה">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">מסגרת פעילה</Label>
                    <Switch
                      checked={!!blocks.paragraphFrame?.enabled}
                      onCheckedChange={(v) => patch("blocks.paragraphFrame.enabled", v)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="צבע מסגרת">
                      <ColorInput value={blocks.paragraphFrame?.borderColor || ""} onChange={(v) => patch("blocks.paragraphFrame.borderColor", v)} />
                    </Field>
                    <Field label="רוחב מסגרת">
                      <Input value={blocks.paragraphFrame?.borderWidth || "1px"} onChange={(e) => patch("blocks.paragraphFrame.borderWidth", e.target.value)} />
                    </Field>
                    <Field label="סגנון">
                      <Select
                        value={blocks.paragraphFrame?.borderStyle || "solid"}
                        onChange={(v) => patch("blocks.paragraphFrame.borderStyle", v)}
                        options={["solid", "dashed", "dotted", "double"]}
                      />
                    </Field>
                    <Field label="רדיוס">
                      <Input value={blocks.paragraphFrame?.radius || "6px"} onChange={(e) => patch("blocks.paragraphFrame.radius", e.target.value)} />
                    </Field>
                    <Field label="רקע">
                      <ColorInput value={blocks.paragraphFrame?.bg || ""} onChange={(v) => patch("blocks.paragraphFrame.bg", v)} />
                    </Field>
                    <Field label="ריפוד">
                      <Input value={blocks.paragraphFrame?.padding || "3mm 4mm"} onChange={(e) => patch("blocks.paragraphFrame.padding", e.target.value)} />
                    </Field>
                  </div>
                </Section>

                {/* Callout */}
                <Section title="בלוק הדגשה (Callout)">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="רקע">
                      <ColorInput value={blocks.callout?.bg || ""} onChange={(v) => patch("blocks.callout.bg", v)} />
                    </Field>
                    <Field label="צבע טקסט">
                      <ColorInput value={blocks.callout?.text || ""} onChange={(v) => patch("blocks.callout.text", v)} />
                    </Field>
                    <Field label="צבע פס צד">
                      <ColorInput value={blocks.callout?.accent || ""} onChange={(v) => patch("blocks.callout.accent", v)} />
                    </Field>
                    <Field label="רדיוס">
                      <Input value={blocks.callout?.radius || "6px"} onChange={(e) => patch("blocks.callout.radius", e.target.value)} />
                    </Field>
                    <Field label="ריפוד">
                      <Input value={blocks.callout?.padding || "3mm 4mm"} onChange={(e) => patch("blocks.callout.padding", e.target.value)} />
                    </Field>
                  </div>
                </Section>

                {/* Blockquote */}
                <Section title="ציטוט">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="צבע פס צד">
                      <ColorInput value={blocks.blockquote?.borderColor || ""} onChange={(v) => patch("blocks.blockquote.borderColor", v)} />
                    </Field>
                    <Field label="רוחב פס">
                      <Input value={blocks.blockquote?.borderWidth || "3px"} onChange={(e) => patch("blocks.blockquote.borderWidth", e.target.value)} />
                    </Field>
                    <Field label="צבע טקסט">
                      <ColorInput value={blocks.blockquote?.text || ""} onChange={(v) => patch("blocks.blockquote.text", v)} />
                    </Field>
                    <Field label="רקע">
                      <ColorInput value={blocks.blockquote?.bg || ""} onChange={(v) => patch("blocks.blockquote.bg", v)} />
                    </Field>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">נטוי (Italic)</Label>
                    <Switch
                      checked={blocks.blockquote?.italic !== false}
                      onCheckedChange={(v) => patch("blocks.blockquote.italic", v)}
                    />
                  </div>
                </Section>

                {/* Divider */}
                <Section title="קו מפריד">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="סגנון">
                      <Select
                        value={blocks.divider?.style || "solid"}
                        onChange={(v) => patch("blocks.divider.style", v)}
                        options={["solid", "dashed", "dotted", "double", "gradient"]}
                      />
                    </Field>
                    <Field label="צבע">
                      <ColorInput value={blocks.divider?.color || ""} onChange={(v) => patch("blocks.divider.color", v)} />
                    </Field>
                    <Field label="עובי">
                      <Input value={blocks.divider?.thickness || "1px"} onChange={(e) => patch("blocks.divider.thickness", e.target.value)} />
                    </Field>
                    <Field label="רוחב">
                      <Input value={blocks.divider?.width || "100%"} onChange={(e) => patch("blocks.divider.width", e.target.value)} />
                    </Field>
                  </div>
                </Section>
              </TabsContent>

              {/* ---------- STRIPS ---------- */}
              <TabsContent value="strips" className="space-y-4 mt-4">
                <div className="rounded-md border bg-background p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">דריסת הסטריפים של המסמך</Label>
                    <p className="text-[11px] text-muted-foreground">
                      כשמופעל — הערכה דורסת את הסטריפ של המסמך לפי הבחירה כאן.
                    </p>
                  </div>
                  <Switch
                    checked={!!strips.override}
                    onCheckedChange={(v) => patch("strips.override", v)}
                  />
                </div>

                {strips.override && (
                  <>
                    <StripPicker
                      title="סטריפ עליון"
                      mode={(strips.headerMode as StripMode) || "inherit"}
                      url={strips.headerStripUrl || null}
                      heightPx={strips.headerStripHeightPx ?? 150}
                      assets={assets}
                      onModeChange={(m) => patch("strips.headerMode", m)}
                      onUrlChange={(u, id) => {
                        patch("strips.headerStripUrl", u);
                        patch("strips.headerAssetId", id || null);
                      }}
                      onHeightChange={(h) => patch("strips.headerStripHeightPx", h)}
                    />
                    <StripPicker
                      title="סטריפ תחתון"
                      mode={(strips.footerMode as StripMode) || "inherit"}
                      url={strips.footerStripUrl || null}
                      heightPx={strips.footerStripHeightPx ?? 90}
                      assets={assets}
                      onModeChange={(m) => patch("strips.footerMode", m)}
                      onUrlChange={(u, id) => {
                        patch("strips.footerStripUrl", u);
                        patch("strips.footerAssetId", id || null);
                      }}
                      onHeightChange={(h) => patch("strips.footerStripHeightPx", h)}
                    />
                    <Field label="רקע מאחורי הסטריפ">
                      <ColorInput value={strips.bgColor || "#ffffff"} onChange={(v) => patch("strips.bgColor", v)} />
                    </Field>
                  </>
                )}
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

/* =================== Helpers / Subcomponents =================== */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium">{label}</Label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3 space-y-2">
      <Label className="text-xs font-semibold block">{title}</Label>
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
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 font-mono text-xs h-9" />
      {value && (
        <div
          className="h-6 w-6 rounded-full border shadow-inner shrink-0"
          style={{ background: value }}
          aria-hidden
        />
      )}
    </div>
  );
}

function HeadingEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: HeadingStyle;
  onChange: (key: keyof HeadingStyle, value: any) => void;
}) {
  return (
    <Section title={label}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="גודל">
          <Input value={value.size || ""} onChange={(e) => onChange("size", e.target.value)} />
        </Field>
        <Field label="עובי">
          <Select
            value={value.weight || "700"}
            onChange={(v) => onChange("weight", v)}
            options={["300", "400", "500", "600", "700", "800", "900"]}
          />
        </Field>
        <Field label="צבע טקסט">
          <ColorInput value={value.color || ""} onChange={(v) => onChange("color", v)} />
        </Field>
        <Field label="רקע">
          <ColorInput value={value.bg || ""} onChange={(v) => onChange("bg", v)} />
        </Field>
        <Field label="יישור">
          <Select
            value={value.align || "right"}
            onChange={(v) => onChange("align", v)}
            options={["right", "center", "left", "justify"]}
          />
        </Field>
        <Field label="מרווח עליון">
          <Input value={value.marginTop ?? ""} onChange={(e) => onChange("marginTop", e.target.value)} />
        </Field>
        <Field label="מרווח תחתון">
          <Input value={value.marginBottom ?? ""} onChange={(e) => onChange("marginBottom", e.target.value)} />
        </Field>
        <Field label="ריפוד פנימי">
          <Input value={value.padding || ""} onChange={(e) => onChange("padding", e.target.value)} />
        </Field>
        <Field label="מסגרת תחתונה">
          <Input
            value={value.borderBottom || ""}
            onChange={(e) => onChange("borderBottom", e.target.value)}
            placeholder="2px solid #d8ac27"
          />
        </Field>
        <Field label="ריווח אותיות">
          <Input value={value.letterSpacing || ""} onChange={(e) => onChange("letterSpacing", e.target.value)} placeholder="0.02em" />
        </Field>
      </div>
      <div className="flex items-center justify-between pt-1">
        <Label className="text-xs">UPPERCASE</Label>
        <Switch checked={!!value.uppercase} onCheckedChange={(v) => onChange("uppercase", v)} />
      </div>
    </Section>
  );
}

function StripPicker({
  title,
  mode,
  url,
  heightPx,
  assets,
  onModeChange,
  onUrlChange,
  onHeightChange,
}: {
  title: string;
  mode: StripMode;
  url: string | null;
  heightPx: number;
  assets: FlowBrandAsset[];
  onModeChange: (m: StripMode) => void;
  onUrlChange: (url: string | null, assetId?: string) => void;
  onHeightChange: (h: number) => void;
}) {
  return (
    <Section title={title}>
      <div className="grid grid-cols-3 gap-1">
        <ModeButton active={mode === "inherit"} onClick={() => onModeChange("inherit")} label="מהמסמך" />
        <ModeButton active={mode === "custom"} onClick={() => onModeChange("custom")} label="מהספרייה" icon={<ImageIcon className="h-3 w-3" />} />
        <ModeButton active={mode === "none"} onClick={() => { onModeChange("none"); onUrlChange(null); }} label="ריק" icon={<Ban className="h-3 w-3" />} />
      </div>

      {mode === "custom" && (
        <>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pt-2">
            {assets.length === 0 && (
              <div className="col-span-3 text-[11px] text-muted-foreground text-center py-3">
                אין נכסי מותג בספרייה. צור סטריפ ב-"סטריפים" ושמור.
              </div>
            )}
            {assets.map((a) => {
              const src = a.stripUrl || a.stripDataUrl || "";
              if (!src) return null;
              const selected = url === src;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onUrlChange(src, a.id)}
                  className={`relative rounded border overflow-hidden bg-white hover:border-primary transition ${selected ? "border-primary ring-2 ring-primary" : "border-muted"}`}
                  title={a.name}
                >
                  <img src={src} alt={a.name} className="w-full h-12 object-cover" />
                  {selected && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="text-[9px] truncate px-1 py-0.5 bg-muted/40 text-foreground">{a.name}</div>
                </button>
              );
            })}
          </div>
          <Field label={`גובה (px) — נוכחי: ${heightPx}`}>
            <Input
              type="number"
              min={20}
              max={400}
              value={heightPx}
              onChange={(e) => onHeightChange(Number(e.target.value) || 0)}
            />
          </Field>
        </>
      )}
    </Section>
  );
}

function ModeButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1 text-[11px] py-2 rounded border transition ${
        active ? "border-primary bg-primary/10 text-primary font-semibold" : "border-input bg-background hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* =================== Live Preview HTML =================== */

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
  const strips = p.strips;
  const showHeaderStrip = !!(strips?.override && strips?.headerMode === "custom" && strips?.headerStripUrl);
  const showFooterStrip = !!(strips?.override && strips?.footerMode === "custom" && strips?.footerStripUrl);
  const stripBg = strips?.bgColor || "#ffffff";
  const headerStripH = strips?.headerStripHeightPx || 150;
  const footerStripH = strips?.footerStripHeightPx || 90;
  const pf = p.blocks?.paragraphFrame;
  const pframeOn = !!pf?.enabled;

  // ה-CSS המורחב משותף ל-PDF, לעורך ולתצוגה הזאת
  const extra = buildPresetExtraCss(p, "");

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
  .strip-top { width: 100%; height: ${headerStripH}px; background: ${stripBg}; overflow: hidden; margin: -${p.page.margin} -${p.page.margin} 6mm; padding: 0; }
  .strip-top img { width: 100%; height: 100%; object-fit: fill; display: block; }
  .strip-bottom { width: 100%; height: ${footerStripH}px; background: ${stripBg}; overflow: hidden; margin: 6mm -${p.page.margin} -${p.page.margin}; padding: 0; }
  .strip-bottom img { width: 100%; height: 100%; object-fit: fill; display: block; }
  .running-header {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 3mm; margin-bottom: 6mm;
    border-bottom: 2px solid ${accent};
    font-size: 9pt; color: ${muted};
  }
  .running-header .rh-name { color: ${heading}; font-weight: 700; font-size: 11pt; font-family: ${p.fonts.heading}; }
  p { margin: 0 0 ${p.spacing.paragraphGap}; }
  ${pframeOn ? `p { 
    border: ${pf?.borderWidth || "1px"} ${pf?.borderStyle || "solid"} ${pf?.borderColor || accent};
    border-radius: ${pf?.radius || "6px"};
    background: ${pf?.bg || "transparent"};
    padding: ${pf?.padding || "3mm 4mm"};
  }` : ""}
  .fld {
    display: inline-block; padding: 0 4px; border-radius: 3px;
    background: ${accent}22; color: ${heading}; font-size: 0.92em;
  }
  ul { margin: 0 0 3mm; padding-inline-start: 6mm; }
  ul li { margin-bottom: 1mm; }
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
  ${extra}
</style>
</head>
<body>
  <div class="doc">
    ${showHeaderStrip ? `<div class="strip-top"><img src="${strips!.headerStripUrl}" alt="header" /></div>` : `
    <div class="running-header">
      <span class="rh-name">סטודיו לדוגמה — אדריכלות ועיצוב פנים</span>
      <span>הצעת מחיר #2026-104</span>
    </div>`}

    <h1>הצעת מחיר — תכנון אדריכלי</h1>

    <p>
      לכבוד <span class="fld">שם הלקוח</span>, מצורפת בזאת הצעת מחיר עבור פרויקט
      <span class="fld">כתובת הפרויקט</span>. ההצעה כוללת את כל שלבי התכנון
      מהתכנון הראשוני ועד קבלת היתר הבנייה.
    </p>

    <h2>תיאור העבודה</h2>
    <ul>
      <li>מדידה וסקר שטח מקיף</li>
      <li>תכנון אדריכלי מפורט וגרמושקה</li>
      <li>ליווי מקצועי עד קבלת היתר</li>
      <li>תיאום מול יועצים וגורמי תכנון</li>
    </ul>

    <h3>הערות מקצועיות</h3>
    <div class="flow-callout">
      <strong>חשוב לדעת</strong>
      תוקף ההצעה: 30 יום. המחירים אינם כוללים אגרות ותשלומים לרשויות.
    </div>

    <blockquote>
      "תכנון איכותי הוא ההשקעה הטובה ביותר עבור הפרויקט שלכם."
    </blockquote>

    <hr />

    <h2>לוח תשלומים</h2>
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

    ${showFooterStrip ? `<div class="strip-bottom"><img src="${strips!.footerStripUrl}" alt="footer" /></div>` : `
    <div class="running-footer">
      <span>tel: 050-0000000 · mail@example.com</span>
      <span>עמוד 1</span>
    </div>`}
  </div>
</body>
</html>`;
}
