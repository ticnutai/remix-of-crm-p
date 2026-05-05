// ThemeEditor — edit existing dialog themes or create new ones.
// Live preview, WCAG AA contrast warnings, save to localStorage + Supabase.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FloatingDialog } from '@/components/ui/FloatingDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Check, AlertTriangle, RotateCcw, Save, Plus, Calendar, Clock, MessageSquare, Tag } from 'lucide-react';
import {
  DialogThemeColors,
  dialogThemes,
  resolveTheme,
  useDialogTheme,
} from './DialogThemeSwitcher';

interface ThemeEditorProps {
  mode: 'edit' | 'new';
  baseId: string;
  onClose: (savedId?: string) => void;
}

// ---- Color helpers ----
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(c1: string, c2: string): number | null {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  if (!a || !b) return null;
  const L1 = relLuminance(a);
  const L2 = relLuminance(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

function contrastBadge(ratio: number | null): { label: string; color: string } {
  if (ratio == null) return { label: '—', color: '#888' };
  if (ratio >= 7) return { label: `AAA ${ratio.toFixed(1)}:1`, color: '#16a34a' };
  if (ratio >= 4.5) return { label: `AA ${ratio.toFixed(1)}:1`, color: '#22c55e' };
  if (ratio >= 3) return { label: `נמוך ${ratio.toFixed(1)}:1`, color: '#f59e0b' };
  return { label: `כושל ${ratio.toFixed(1)}:1`, color: '#ef4444' };
}

// ---- Field grouping ----
interface FieldDef { key: keyof DialogThemeColors; label: string; group: string; against?: keyof DialogThemeColors }

const FIELDS: FieldDef[] = [
  // Surfaces
  { key: 'background', label: 'רקע ראשי', group: 'משטחים' },
  { key: 'backgroundGradient', label: 'גרדיאנט רקע (CSS)', group: 'משטחים' },
  { key: 'border', label: 'מסגרת ראשית', group: 'משטחים' },
  { key: 'borderSub', label: 'מסגרת משנית', group: 'משטחים' },
  { key: 'headerBorder', label: 'מסגרת כותרת', group: 'משטחים' },
  { key: 'dividerColor', label: 'קו מפריד', group: 'משטחים' },
  // Text on surface
  { key: 'title', label: 'כותרת', group: 'טקסט על רקע', against: 'background' },
  { key: 'label', label: 'תוויות שדות', group: 'טקסט על רקע', against: 'background' },
  { key: 'text', label: 'טקסט גוף', group: 'טקסט על רקע', against: 'background' },
  { key: 'textOnSurface', label: 'טקסט משני על רקע', group: 'טקסט על רקע', against: 'background' },
  { key: 'textMuted', label: 'טקסט עמום', group: 'טקסט על רקע', against: 'background' },
  { key: 'helperText', label: 'טקסט עזרה', group: 'טקסט על רקע', against: 'background' },
  { key: 'cancelText', label: 'טקסט ביטול', group: 'טקסט על רקע', against: 'background' },
  // Status
  { key: 'errorText', label: 'שגיאה', group: 'מצבים', against: 'background' },
  { key: 'successText', label: 'הצלחה', group: 'מצבים', against: 'background' },
  { key: 'warningText', label: 'אזהרה', group: 'מצבים', against: 'background' },
  { key: 'linkColor', label: 'קישור', group: 'מצבים', against: 'background' },
  // Inputs
  { key: 'inputBg', label: 'רקע שדה', group: 'שדות' },
  { key: 'inputBorder', label: 'מסגרת שדה', group: 'שדות' },
  { key: 'inputText', label: 'טקסט בשדה', group: 'שדות', against: 'inputBg' },
  // Buttons
  { key: 'buttonBg', label: 'רקע כפתור', group: 'כפתורים' },
  { key: 'buttonText', label: 'טקסט כפתור', group: 'כפתורים', against: 'buttonBg' },
  { key: 'buttonBorder', label: 'מסגרת כפתור', group: 'כפתורים' },
  // Icons
  { key: 'iconBg', label: 'רקע אייקון', group: 'אייקונים' },
  { key: 'iconColor', label: 'צבע אייקון', group: 'אייקונים', against: 'iconBg' },
  // Badges + extras
  { key: 'badgeBg', label: 'רקע תווית', group: 'תוויות' },
  { key: 'badgeText', label: 'טקסט תווית', group: 'תוויות', against: 'badgeBg' },
  { key: 'hoverBg', label: 'רקע ריחוף', group: 'תוויות' },
  { key: 'focusRing', label: 'טבעת פוקוס', group: 'תוויות' },
  { key: 'calendarSelectedBg', label: 'יום נבחר בלוח', group: 'תוויות' },
  { key: 'calendarSelectedText', label: 'טקסט יום נבחר', group: 'תוויות', against: 'calendarSelectedBg' },
  { key: 'scrollThumb', label: 'גלילה (thumb)', group: 'תוויות' },
];

const GROUPS = ['משטחים', 'טקסט על רקע', 'מצבים', 'שדות', 'כפתורים', 'אייקונים', 'תוויות'];

// Map each color field → which section in the live preview to scroll into view.
const FIELD_TO_PREVIEW_SECTION: Partial<Record<keyof DialogThemeColors, string>> = {
  background: 'header',
  backgroundGradient: 'header',
  border: 'header',
  borderSub: 'body',
  headerBorder: 'header',
  dividerColor: 'tabs',
  title: 'header',
  label: 'inputs',
  text: 'body',
  textOnSurface: 'body',
  textMuted: 'body',
  helperText: 'inputs',
  cancelText: 'footer',
  errorText: 'statuses',
  successText: 'statuses',
  warningText: 'statuses',
  linkColor: 'statuses',
  inputBg: 'inputs',
  inputBorder: 'inputs',
  inputText: 'inputs',
  buttonBg: 'footer',
  buttonText: 'footer',
  buttonBorder: 'footer',
  iconBg: 'header',
  iconColor: 'header',
  badgeBg: 'badges',
  badgeText: 'badges',
  hoverBg: 'tabs',
  focusRing: 'inputs',
  calendarSelectedBg: 'calendar',
  calendarSelectedText: 'calendar',
  scrollThumb: 'scroll',
};

export function ThemeEditor({ mode, baseId, onClose }: ThemeEditorProps) {
  const { allThemes, saveCustomTheme } = useDialogTheme();
  const baseEntry = allThemes[baseId] || dialogThemes['navy-gold'];
  const baseColors = baseEntry.colors;

  const [name, setName] = useState<string>(() => mode === 'new' ? `${baseEntry.name} — מותאם` : baseEntry.name);
  const [draftId] = useState<string>(() => mode === 'edit' && (baseEntry as any).isCustom ? baseId : `custom-${Date.now()}`);
  const [colors, setColors] = useState<DialogThemeColors>(() => ({ ...baseColors }));

  const previewScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollPreviewToSection = (section: string) => {
    const root = previewScrollRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(`[data-preview-section="${section}"]`);
    if (!target) return;
    // Compute offset relative to scroll container
    const top = target.offsetTop - 12;
    root.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const setColor = <K extends keyof DialogThemeColors>(key: K, val: string) => {
    setColors((c) => ({ ...c, [key]: val }));
    const section = FIELD_TO_PREVIEW_SECTION[key];
    if (section) {
      // run after paint
      requestAnimationFrame(() => scrollPreviewToSection(section));
    }
  };

  const resetField = (key: keyof DialogThemeColors) => {
    setColors((c) => ({ ...c, [key]: (baseColors as any)[key] ?? '' }));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    await saveCustomTheme({ id: draftId, name: name.trim(), colors });
    onClose(draftId);
  };

  const resolved = useMemo(() => resolveTheme(colors), [colors]);

  return (
    <FloatingDialog
      open={true}
      onOpenChange={(o) => { if (!o) onClose(); }}
      storageKey="theme-editor"
      defaultWidth={920}
      minWidth={520}
      minHeight={520}
      title={
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: '#FEF3C7' }}>
            <Bell className="h-5 w-5" style={{ color: '#B45309' }} />
          </div>
          <span className="text-base font-bold flex-1 truncate" style={{ color: '#0F1F3D' }}>
            {mode === 'new' ? 'ערכת צבעים חדשה' : `עריכת ערכה: ${baseEntry.name}`}
          </span>
        </div>
      }
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onClose()}>ביטול</Button>
          <Button type="button" onClick={handleSave} disabled={!name.trim()} className="gap-2">
            {mode === 'new' ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {mode === 'new' ? 'צור ערכה' : 'שמור שינויים'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(360px,420px)] gap-4 px-1 py-1">
        {/* Editor side */}
        <div className="space-y-4 min-w-0">
          <div className="space-y-1">
            <Label className="text-sm font-medium">שם הערכה</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: ערב גרדיאנט" />
          </div>

          {GROUPS.map((g) => {
            const fields = FIELDS.filter((f) => f.group === g);
            if (fields.length === 0) return null;
            return (
              <div key={g} className="rounded-lg border border-border/70 p-3">
                <div className="text-sm font-bold mb-2 text-foreground">{g}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fields.map((f) => (
                    <ColorRow
                      key={f.key as string}
                      label={f.label}
                      value={(colors as any)[f.key] ?? ''}
                      onChange={(v) => setColor(f.key, v)}
                      onReset={() => {
                        resetField(f.key);
                        const section = FIELD_TO_PREVIEW_SECTION[f.key];
                        if (section) requestAnimationFrame(() => scrollPreviewToSection(section));
                      }}
                      onFocus={() => {
                        const section = FIELD_TO_PREVIEW_SECTION[f.key];
                        if (section) scrollPreviewToSection(section);
                      }}
                      contrastAgainst={f.against ? (colors as any)[f.against] : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live preview side — sticky, with its own scroll, shows the full mock dialog */}
        <div className="lg:sticky lg:top-1 self-start">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-muted-foreground">תצוגה מקדימה חיה</div>
            <div className="text-[10px] text-muted-foreground/70">גלילה אוטומטית למקטע ששונה</div>
          </div>
          <div
            ref={previewScrollRef}
            className="overflow-y-auto overflow-x-hidden pr-1"
            style={{ maxHeight: 'calc(100vh - 220px)', minHeight: 320 }}
          >
            <PreviewPanel colors={resolved} />
          </div>
        </div>
      </div>
    </FloatingDialog>
  );
}

// ---- Color row ----
interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  onFocus?: () => void;
  contrastAgainst?: string;
}

function ColorRow({ label, value, onChange, onReset, onFocus, contrastAgainst }: ColorRowProps) {
  const isHex = /^#[0-9a-fA-F]{6}$/.test(value);
  const ratio = contrastAgainst ? contrastRatio(value, contrastAgainst) : null;
  const badge = contrastBadge(ratio);
  return (
    <div
      className="flex items-center gap-2 p-1.5 rounded border border-border/40 bg-background"
      onFocusCapture={onFocus}
      onMouseEnter={onFocus}
    >
      <input
        type="color"
        value={isHex ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border cursor-pointer shrink-0"
        title={label}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{label}</div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs font-mono mt-0.5"
          dir="ltr"
        />
      </div>
      {ratio != null && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap"
          style={{ background: `${badge.color}22`, color: badge.color }}
          title={`ניגודיות מול הרקע (WCAG)`}
        >
          {ratio < 4.5 && <AlertTriangle className="inline h-2.5 w-2.5 mr-0.5" />}
          {badge.label}
        </span>
      )}
      <button
        type="button"
        onClick={onReset}
        title="אפס לערך מקורי"
        className="p-1 rounded hover:bg-muted"
      >
        <RotateCcw className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}

// ---- Live preview ----
function PreviewPanel({ colors }: { colors: Required<DialogThemeColors> }) {
  return (
    <div
      className="rounded-xl border-2 overflow-hidden shadow-lg"
      style={{ borderColor: colors.border, background: colors.backgroundGradient || colors.background }}
      dir="rtl"
    >
      {/* ===== Header ===== */}
      <div
        data-preview-section="header"
        className="px-3 py-2.5 flex items-center gap-2"
        style={{ borderBottom: `1px solid ${colors.headerBorder}` }}
      >
        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: colors.iconBg }}>
          <Bell className="h-4 w-4" style={{ color: colors.iconColor }} />
        </div>
        <div className="text-sm font-bold flex-1 truncate" style={{ color: colors.title }}>תזכורת חדשה</div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: colors.badgeBg, color: colors.badgeText }}>
          חדש
        </span>
      </div>

      {/* ===== Tabs ===== */}
      <div
        data-preview-section="tabs"
        className="flex items-center gap-1 px-3 pt-2"
        style={{ borderBottom: `1px solid ${colors.dividerColor}` }}
      >
        {['פרטים', 'שיוך', 'התראות'].map((t, i) => (
          <button
            key={t}
            className="px-2.5 py-1.5 text-[11px] font-medium rounded-t"
            style={{
              color: i === 0 ? colors.title : colors.textMuted,
              background: i === 0 ? colors.hoverBg : 'transparent',
              borderBottom: i === 0 ? `2px solid ${colors.focusRing}` : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ===== Body ===== */}
      <div data-preview-section="body" className="p-3 space-y-3">
        {/* ----- Inputs ----- */}
        <div data-preview-section="inputs" className="space-y-2.5">
          <div>
            <div className="text-[11px] font-medium mb-1" style={{ color: colors.label }}>כותרת התזכורת</div>
            <input
              defaultValue="פגישה עם לקוח"
              className="w-full h-8 px-2 rounded text-xs outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.inputText,
                boxShadow: `0 0 0 2px ${colors.focusRing}33`,
              }}
            />
            <div className="text-[10px] mt-1" style={{ color: colors.helperText }}>זה נראה כפוקוס פעיל</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] font-medium mb-1 flex items-center gap-1" style={{ color: colors.label }}>
                <Calendar className="h-3 w-3" /> תאריך
              </div>
              <input
                defaultValue="05/05/2026"
                className="w-full h-8 px-2 rounded text-xs"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.inputText }}
              />
            </div>
            <div>
              <div className="text-[11px] font-medium mb-1 flex items-center gap-1" style={{ color: colors.label }}>
                <Clock className="h-3 w-3" /> שעה
              </div>
              <input
                defaultValue="14:30"
                className="w-full h-8 px-2 rounded text-xs"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.inputText }}
              />
            </div>
          </div>
        </div>

        {/* ----- Mini calendar ----- */}
        <div data-preview-section="calendar">
          <div className="text-[11px] font-medium mb-1" style={{ color: colors.label }}>בחירת יום</div>
          <div
            className="rounded-lg p-2"
            style={{ background: colors.background, border: `1px solid ${colors.borderSub}` }}
          >
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['ש', 'ו', 'ה', 'ד', 'ג', 'ב', 'א'].map((d) => (
                <div key={d} className="text-center text-[9px] font-semibold" style={{ color: colors.textMuted }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: 21 }, (_, i) => i + 1).map((day) => {
                const selected = day === 5;
                return (
                  <div
                    key={day}
                    className="aspect-square flex items-center justify-center text-[10px] rounded font-medium"
                    style={{
                      background: selected ? colors.calendarSelectedBg : 'transparent',
                      color: selected ? colors.calendarSelectedText : colors.textOnSurface,
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ----- Body text ----- */}
        <div className="space-y-1">
          <div className="text-[11px] font-medium mb-1 flex items-center gap-1" style={{ color: colors.label }}>
            <MessageSquare className="h-3 w-3" /> הערות
          </div>
          <div className="text-xs leading-relaxed" style={{ color: colors.text }}>
            טקסט גוף ראשי — תיאור מפורט של התזכורת.
          </div>
          <div className="text-xs leading-relaxed" style={{ color: colors.textOnSurface }}>
            טקסט משני על משטח — האם הוא קריא?
          </div>
          <div className="text-[11px]" style={{ color: colors.textMuted }}>טקסט עמום (פחות בולט)</div>
        </div>

        {/* ----- Statuses ----- */}
        <div data-preview-section="statuses" className="space-y-1.5">
          <div className="text-[11px] font-medium" style={{ color: colors.label }}>הודעות מערכת</div>
          <div className="text-[11px] flex items-center gap-1" style={{ color: colors.errorText }}>
            <AlertTriangle className="h-3 w-3" /> שגיאה: שדה חובה חסר
          </div>
          <div className="text-[11px] flex items-center gap-1" style={{ color: colors.successText }}>
            <Check className="h-3 w-3" /> נשמר בהצלחה
          </div>
          <div className="text-[11px]" style={{ color: colors.warningText }}>
            ⚠ שים לב: התאריך בעבר
          </div>
          <div className="text-[11px]">
            <a style={{ color: colors.linkColor, textDecoration: 'underline' }}>פתח עזרה</a>
          </div>
        </div>

        {/* ----- Badges ----- */}
        <div data-preview-section="badges" className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1" style={{ background: colors.badgeBg, color: colors.badgeText }}>
            <Tag className="h-2.5 w-2.5" /> עדיפות גבוהה
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: colors.badgeBg, color: colors.badgeText }}>
            דחוף
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: colors.badgeBg, color: colors.badgeText }}>
            <Check className="inline h-2.5 w-2.5 ml-0.5" />הושלם
          </span>
        </div>

        {/* ----- Hover row ----- */}
        <div
          className="text-xs px-2 py-1.5 rounded"
          style={{ background: colors.hoverBg, color: colors.textOnSurface }}
        >
          פריט ברשימה בריחוף
        </div>

        {/* ----- Scrollbar sample ----- */}
        <div data-preview-section="scroll">
          <div className="text-[11px] font-medium mb-1" style={{ color: colors.label }}>גלילה</div>
          <div
            className="h-16 rounded text-[10px] p-2 overflow-y-auto"
            style={{
              background: colors.inputBg,
              border: `1px solid ${colors.borderSub}`,
              color: colors.textOnSurface,
              scrollbarColor: `${colors.scrollThumb} transparent`,
            }}
          >
            <div style={{ height: 80 }}>
              שורה 1<br />שורה 2<br />שורה 3<br />שורה 4<br />שורה 5<br />שורה 6
            </div>
          </div>
        </div>
      </div>

      {/* ===== Footer ===== */}
      <div
        data-preview-section="footer"
        className="px-3 py-2.5 flex justify-end gap-2"
        style={{ borderTop: `1px solid ${colors.headerBorder}` }}
      >
        <button
          className="px-3 py-1.5 rounded text-xs font-medium"
          style={{ color: colors.cancelText }}
        >
          ביטול
        </button>
        <button
          className="px-3 py-1.5 rounded text-xs font-bold"
          style={{ background: colors.buttonBg, color: colors.buttonText, border: `1px solid ${colors.buttonBorder}` }}
        >
          שמור תזכורת
        </button>
      </div>
    </div>
  );
}
