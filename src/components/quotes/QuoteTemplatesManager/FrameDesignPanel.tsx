// פאנל עיצוב מסגרות, רקעים, כותרות, header/footer
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Frame, Layers, Type as TypeIcon, PanelTop, PanelBottom, Sparkles, Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BorderConfig,
  BorderStyle,
  ShadowLevel,
  BackgroundConfig,
  SectionTitleConfig,
  FixedHeaderConfig,
  FixedFooterConfig,
  FrameDesignSettings,
  PageSizeConfig,
  PageSizePreset,
  PageOrientation,
  DEFAULT_BORDER,
  DEFAULT_BACKGROUND,
  DEFAULT_SECTION_TITLE,
  DEFAULT_FIXED_HEADER,
  DEFAULT_FIXED_FOOTER,
  DEFAULT_FRAME_SETTINGS,
  DEFAULT_PAGE_SIZE,
  BORDER_PRESETS,
} from "./frameStyles";

const STYLE_OPTIONS: { value: BorderStyle; label: string }[] = [
  { value: "none", label: "ללא" },
  { value: "solid", label: "רציף" },
  { value: "dashed", label: "מקווקו" },
  { value: "dotted", label: "נקודות" },
  { value: "double", label: "כפול" },
  { value: "groove", label: "מובלט (פנים)" },
  { value: "ridge", label: "מובלט (חוץ)" },
  { value: "decorative-gold", label: "פינות זהב דקורטיביות" },
  { value: "shadow-only", label: "צל בלבד (ללא קו)" },
];

const SHADOW_OPTIONS: { value: ShadowLevel; label: string }[] = [
  { value: "none", label: "ללא" },
  { value: "sm", label: "קטן" },
  { value: "md", label: "בינוני" },
  { value: "lg", label: "גדול" },
  { value: "xl", label: "ענק" },
  { value: "glow-gold", label: "זוהר זהב" },
];

function BorderEditor({
  label,
  value,
  onChange,
  onApplyToAll,
}: {
  label: string;
  value?: BorderConfig;
  onChange: (b: BorderConfig) => void;
  onApplyToAll?: (b: BorderConfig) => void;
}) {
  const cfg = { ...DEFAULT_BORDER, ...(value || {}) };
  const update = (patch: Partial<BorderConfig>) => onChange({ ...cfg, ...patch });

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Frame className="h-4 w-4" />
          {label}
        </h4>
        {onApplyToAll && (
          <Button variant="ghost" size="sm" onClick={() => onApplyToAll(cfg)}>
            <Copy className="h-3 w-3 ml-1" /> החל על כולם
          </Button>
        )}
      </div>

      {/* פרסטים */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">פרסטים</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {BORDER_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => onChange({ ...cfg, ...p.cfg })}
              className="px-2 py-1.5 text-[11px] rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">סגנון</Label>
          <Select value={cfg.style} onValueChange={(v) => update({ style: v as BorderStyle })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STYLE_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">צל</Label>
          <Select value={cfg.shadow} onValueChange={(v) => update({ shadow: v as ShadowLevel })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SHADOW_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs">עובי: {cfg.width}px</Label>
        <Slider value={[cfg.width]} onValueChange={([v]) => update({ width: v })} min={0} max={10} step={1} className="mt-2" />
      </div>

      <div>
        <Label className="text-xs">פינות מעוגלות: {cfg.radius}px</Label>
        <Slider value={[cfg.radius]} onValueChange={([v]) => update({ radius: v })} min={0} max={32} step={1} className="mt-2" />
      </div>

      <div>
        <Label className="text-xs">ריווח פנימי: {cfg.padding}px</Label>
        <Slider value={[cfg.padding]} onValueChange={([v]) => update({ padding: v })} min={0} max={40} step={2} className="mt-2" />
      </div>

      <div>
        <Label className="text-xs">צבע</Label>
        <div className="flex items-center gap-2 mt-1">
          <input type="color" value={cfg.color} onChange={(e) => update({ color: e.target.value })} className="w-9 h-9 rounded cursor-pointer border-0" />
          <Input value={cfg.color} onChange={(e) => update({ color: e.target.value })} className="flex-1 font-mono text-xs h-9" />
        </div>
      </div>

      {/* תצוגה מקדימה */}
      <div className="pt-2">
        <Label className="text-xs text-muted-foreground mb-1.5 block">תצוגה מקדימה</Label>
        <div
          className="h-16 bg-background flex items-center justify-center text-xs text-muted-foreground relative overflow-hidden"
          style={{
            border: cfg.style === "shadow-only" || cfg.style === "decorative-gold" || cfg.style === "none"
              ? "none" : `${cfg.width}px ${cfg.style} ${cfg.color}`,
            borderRadius: `${cfg.radius}px`,
            boxShadow:
              cfg.shadow === "none" ? "none"
              : cfg.shadow === "sm" ? "0 1px 2px rgba(0,0,0,0.08)"
              : cfg.shadow === "md" ? "0 4px 12px rgba(0,0,0,0.08)"
              : cfg.shadow === "lg" ? "0 10px 30px rgba(0,0,0,0.12)"
              : cfg.shadow === "xl" ? "0 20px 50px rgba(0,0,0,0.18)"
              : `0 0 24px ${cfg.color}66, 0 0 8px ${cfg.color}aa`,
          }}
        >
          {cfg.style === "decorative-gold" && (
            <>
              <span className="absolute top-0 right-0" style={{ width: 16, height: 16, borderTop: `2px solid ${cfg.color}`, borderRight: `2px solid ${cfg.color}` }} />
              <span className="absolute top-0 left-0" style={{ width: 16, height: 16, borderTop: `2px solid ${cfg.color}`, borderLeft: `2px solid ${cfg.color}` }} />
              <span className="absolute bottom-0 right-0" style={{ width: 16, height: 16, borderBottom: `2px solid ${cfg.color}`, borderRight: `2px solid ${cfg.color}` }} />
              <span className="absolute bottom-0 left-0" style={{ width: 16, height: 16, borderBottom: `2px solid ${cfg.color}`, borderLeft: `2px solid ${cfg.color}` }} />
            </>
          )}
          תוכן
        </div>
      </div>
    </div>
  );
}

function BackgroundEditor({ value, onChange }: { value?: BackgroundConfig; onChange: (b: BackgroundConfig) => void }) {
  const cfg = { ...DEFAULT_BACKGROUND, ...(value || {}) };
  const update = (patch: Partial<BackgroundConfig>) => onChange({ ...cfg, ...patch });
  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
      <h4 className="font-semibold text-sm flex items-center gap-2"><Layers className="h-4 w-4" />רקע ההצעה</h4>
      <div>
        <Label className="text-xs">סוג רקע</Label>
        <Select value={cfg.type} onValueChange={(v: any) => update({ type: v })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">ללא (שקוף)</SelectItem>
            <SelectItem value="solid">צבע אחיד</SelectItem>
            <SelectItem value="gradient">גרדיאנט</SelectItem>
            <SelectItem value="paper">טקסטורת נייר</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {cfg.type !== "none" && cfg.type !== "paper" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{cfg.type === "gradient" ? "צבע 1" : "צבע"}</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={cfg.color1} onChange={(e) => update({ color1: e.target.value })} className="w-9 h-9 rounded cursor-pointer border-0" />
              <Input value={cfg.color1} onChange={(e) => update({ color1: e.target.value })} className="flex-1 font-mono text-xs h-9" />
            </div>
          </div>
          {cfg.type === "gradient" && (
            <div>
              <Label className="text-xs">צבע 2</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={cfg.color2 || cfg.color1} onChange={(e) => update({ color2: e.target.value })} className="w-9 h-9 rounded cursor-pointer border-0" />
                <Input value={cfg.color2 || ""} onChange={(e) => update({ color2: e.target.value })} className="flex-1 font-mono text-xs h-9" />
              </div>
            </div>
          )}
        </div>
      )}
      {cfg.type === "gradient" && (
        <div>
          <Label className="text-xs">כיוון</Label>
          <Select value={cfg.direction || "135deg"} onValueChange={(v: any) => update({ direction: v })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="to bottom">מלמעלה למטה</SelectItem>
              <SelectItem value="to right">מצד לצד</SelectItem>
              <SelectItem value="135deg">אלכסון (135°)</SelectItem>
              <SelectItem value="to bottom right">פינתי</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {cfg.type === "paper" && (
        <div>
          <Label className="text-xs">טון נייר</Label>
          <Select value={cfg.paperTone || "ivory"} onValueChange={(v: any) => update({ paperTone: v })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ivory">שנהב</SelectItem>
              <SelectItem value="warm">חמים</SelectItem>
              <SelectItem value="cool">קריר</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function SectionTitleEditor({ value, onChange }: { value?: SectionTitleConfig; onChange: (c: SectionTitleConfig) => void }) {
  const cfg = { ...DEFAULT_SECTION_TITLE, ...(value || {}) };
  const update = (patch: Partial<SectionTitleConfig>) => onChange({ ...cfg, ...patch });
  const styles: { value: SectionTitleConfig["style"]; label: string }[] = [
    { value: "plain", label: "פשוט" },
    { value: "gold-bar", label: "סרגל זהב צד" },
    { value: "gold-underline", label: "קו תחתון" },
    { value: "filled", label: "רקע מלא" },
    { value: "boxed", label: "מסגרת" },
  ];
  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
      <h4 className="font-semibold text-sm flex items-center gap-2"><TypeIcon className="h-4 w-4" />סגנון כותרות סקציות</h4>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {styles.map((s) => (
          <button key={s.value} onClick={() => update({ style: s.value })}
            className={cn("px-2 py-2 text-[11px] rounded-md border transition-colors",
              cfg.style === s.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">צבע סרגל/הדגשה</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={cfg.barColor} onChange={(e) => update({ barColor: e.target.value })} className="w-9 h-9 rounded cursor-pointer border-0" />
            <Input value={cfg.barColor} onChange={(e) => update({ barColor: e.target.value })} className="flex-1 font-mono text-xs h-9" />
          </div>
        </div>
        <div>
          <Label className="text-xs">צבע טקסט</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={cfg.textColor} onChange={(e) => update({ textColor: e.target.value })} className="w-9 h-9 rounded cursor-pointer border-0" />
            <Input value={cfg.textColor} onChange={(e) => update({ textColor: e.target.value })} className="flex-1 font-mono text-xs h-9" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FixedBarEditor({
  label, icon, value, onChange, isFooter
}: {
  label: string; icon: React.ReactNode;
  value?: FixedHeaderConfig | FixedFooterConfig;
  onChange: (v: any) => void;
  isFooter?: boolean;
}) {
  const defaults = isFooter ? DEFAULT_FIXED_FOOTER : DEFAULT_FIXED_HEADER;
  const cfg: any = { ...defaults, ...(value || {}) };
  const update = (patch: any) => onChange({ ...cfg, ...patch });
  return (
    <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">{icon}{label}</h4>
        <Switch checked={cfg.enabled} onCheckedChange={(v) => update({ enabled: v })} />
      </div>
      {cfg.enabled && (
        <>
          <div>
            <Label className="text-xs">טקסט</Label>
            <Input value={cfg.text} onChange={(e) => update({ text: e.target.value })} className="h-9 text-sm" placeholder={isFooter ? "טקסט תחתית (לדוגמה: כל הזכויות שמורות)" : "טקסט עליון"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">רקע</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={cfg.bgColor} onChange={(e) => update({ bgColor: e.target.value })} className="w-9 h-9 rounded cursor-pointer border-0" />
                <Input value={cfg.bgColor} onChange={(e) => update({ bgColor: e.target.value })} className="flex-1 font-mono text-xs h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">צבע טקסט</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={cfg.textColor} onChange={(e) => update({ textColor: e.target.value })} className="w-9 h-9 rounded cursor-pointer border-0" />
                <Input value={cfg.textColor} onChange={(e) => update({ textColor: e.target.value })} className="flex-1 font-mono text-xs h-9" />
              </div>
            </div>
          </div>
          {isFooter ? (
            <div className="flex items-center gap-2">
              <Switch checked={(cfg as FixedFooterConfig).showPageNumbers} onCheckedChange={(v) => update({ showPageNumbers: v })} />
              <Label className="text-xs">הצג מספרי עמודים</Label>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Switch checked={(cfg as FixedHeaderConfig).showLogo} onCheckedChange={(v) => update({ showLogo: v })} />
              <Label className="text-xs">הצג לוגו בכותרת קבועה</Label>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ======================== גודל עמוד ========================

const PAGE_PRESETS: { value: PageSizePreset; label: string; dim: string }[] = [
  { value: "A3", label: "A3", dim: "297×420" },
  { value: "A4", label: "A4", dim: "210×297" },
  { value: "A5", label: "A5", dim: "148×210" },
  { value: "letter", label: "Letter", dim: "216×279" },
  { value: "legal", label: "Legal", dim: "216×356" },
  { value: "custom", label: "מותאם", dim: "מ\"מ" },
];

function PageSizeEditor({
  value,
  onChange,
}: {
  value?: PageSizeConfig;
  onChange: (p: PageSizeConfig) => void;
}) {
  const cfg: PageSizeConfig = { ...DEFAULT_PAGE_SIZE, ...(value || {}) };
  const upd = (patch: Partial<PageSizeConfig>) => onChange({ ...cfg, ...patch });

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <h4 className="font-semibold text-sm">גודל עמוד</h4>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PAGE_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => upd({ preset: p.value })}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border p-2 text-xs transition-colors",
              cfg.preset === p.value
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border hover:border-primary/50 text-muted-foreground"
            )}
          >
            <span className="font-bold text-sm">{p.label}</span>
            <span className="text-[10px] opacity-70">{p.dim}</span>
          </button>
        ))}
      </div>

      {/* Custom dimensions */}
      {cfg.preset === "custom" && (
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Label className="text-xs mb-1 block">רוחב (מ"מ)</Label>
            <Input
              type="number"
              min={50}
              max={1000}
              value={cfg.customWidthMm ?? 210}
              onChange={(e) => upd({ customWidthMm: Number(e.target.value) })}
              className="h-8 text-sm"
            />
          </div>
          <span className="text-muted-foreground mt-4">×</span>
          <div className="flex-1">
            <Label className="text-xs mb-1 block">גובה (מ"מ)</Label>
            <Input
              type="number"
              min={50}
              max={1500}
              value={cfg.customHeightMm ?? 297}
              onChange={(e) => upd({ customHeightMm: Number(e.target.value) })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Orientation */}
      <div>
        <Label className="text-xs mb-2 block">כיוון</Label>
        <div className="flex gap-2">
          {(["portrait", "landscape"] as PageOrientation[]).map((o) => (
            <button
              key={o}
              onClick={() => upd({ orientation: o })}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors flex-1 justify-center",
                cfg.orientation === o
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "inline-block border-2 border-current rounded-sm",
                  o === "portrait" ? "w-3 h-4" : "w-4 h-3"
                )}
              />
              {o === "portrait" ? "עומד" : "רוחב"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ======================== פאנל ראשי ========================

export interface FrameDesignPanelProps {
  value: FrameDesignSettings;
  onChange: (v: FrameDesignSettings) => void;
  /** In the A4 template editor, page size and header/footer are managed elsewhere. */
  flowMode?: boolean;
}

export function FrameDesignPanel({ value, onChange, flowMode = false }: FrameDesignPanelProps) {
  const v: FrameDesignSettings = { ...DEFAULT_FRAME_SETTINGS, ...(value || {}) };
  const set = (patch: Partial<FrameDesignSettings>) => onChange({ ...v, ...patch });
  const applyBorderToAll = (b: BorderConfig) => set({ documentBorder: b, stageBorder: b, summaryBorder: b });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">
          {flowMode ? "מסגרת עמוד, רקע וכותרות" : "מסגרות, רקע וכותרות"}
        </h3>
      </div>

      {/* גודל עמוד — מעל ה-Tabs כי זה הגדרת יסוד */}
      {!flowMode && <PageSizeEditor value={v.pageSize} onChange={(p) => set({ pageSize: p })} />}

      <Tabs defaultValue="borders" className="w-full">
        <TabsList className={`w-full grid ${flowMode ? "grid-cols-3" : "grid-cols-4"}`}>
          <TabsTrigger value="borders" className="text-xs"><Frame className="h-3.5 w-3.5 ml-1" />מסגרות</TabsTrigger>
          <TabsTrigger value="bg" className="text-xs"><Layers className="h-3.5 w-3.5 ml-1" />רקע</TabsTrigger>
          <TabsTrigger value="titles" className="text-xs"><TypeIcon className="h-3.5 w-3.5 ml-1" />כותרות</TabsTrigger>
          {!flowMode && <TabsTrigger value="bars" className="text-xs"><PanelTop className="h-3.5 w-3.5 ml-1" />Header/Footer</TabsTrigger>}
        </TabsList>

        <TabsContent value="borders" className="mt-4 space-y-4">
          <BorderEditor
            label={flowMode ? "מסגרת עמוד A4" : "מסגרת ראשית להצעה"}
            value={v.documentBorder}
            onChange={(b) => set({ documentBorder: b })}
            onApplyToAll={flowMode ? undefined : applyBorderToAll}
          />
          {!flowMode && <BorderEditor label="מסגרת לכל שלב" value={v.stageBorder} onChange={(b) => set({ stageBorder: b })} />}
          {!flowMode && <BorderEditor label="מסגרת לסיכום מחיר" value={v.summaryBorder} onChange={(b) => set({ summaryBorder: b })} />}
        </TabsContent>

        <TabsContent value="bg" className="mt-4">
          <BackgroundEditor value={v.background} onChange={(b) => set({ background: b })} />
        </TabsContent>

        <TabsContent value="titles" className="mt-4">
          <SectionTitleEditor value={v.sectionTitle} onChange={(c) => set({ sectionTitle: c })} />
        </TabsContent>

        {!flowMode && (
          <TabsContent value="bars" className="mt-4 space-y-4">
            <FixedBarEditor label="כותרת עליונה קבועה" icon={<PanelTop className="h-4 w-4" />} value={v.fixedHeader} onChange={(h) => set({ fixedHeader: h })} />
            <FixedBarEditor label="כותרת תחתונה קבועה (Footer)" icon={<PanelBottom className="h-4 w-4" />} value={v.fixedFooter} onChange={(f) => set({ fixedFooter: f })} isFooter />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
