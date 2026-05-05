// ThemeEditor — edit existing dialog themes or create new ones.
// Live preview, WCAG AA contrast warnings, save to localStorage + Supabase.
import React, { useEffect, useMemo, useState } from 'react';
import { FloatingDialog } from '@/components/ui/FloatingDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Check, AlertTriangle, RotateCcw, Save, Plus } from 'lucide-react';
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

export function ThemeEditor({ mode, baseId, onClose }: ThemeEditorProps) {
  const { allThemes, saveCustomTheme } = useDialogTheme();
  const baseEntry = allThemes[baseId] || dialogThemes['navy-gold'];
  const baseColors = baseEntry.colors;

  const [name, setName] = useState<string>(() => mode === 'new' ? `${baseEntry.name} — מותאם` : baseEntry.name);
  const [draftId] = useState<string>(() => mode === 'edit' && (baseEntry as any).isCustom ? baseId : `custom-${Date.now()}`);
  const [colors, setColors] = useState<DialogThemeColors>(() => ({ ...baseColors }));

  const setColor = <K extends keyof DialogThemeColors>(key: K, val: string) => {
    setColors((c) => ({ ...c, [key]: val }));
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
      defaultWidth={760}
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 px-1 py-1">
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
                      onReset={() => resetField(f.key)}
                      contrastAgainst={f.against ? (colors as any)[f.against] : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live preview side */}
        <div className="lg:sticky lg:top-1 self-start">
          <div className="text-xs font-semibold text-muted-foreground mb-2">תצוגה מקדימה חיה</div>
          <PreviewPanel colors={resolved} />
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
  contrastAgainst?: string;
}

function ColorRow({ label, value, onChange, onReset, contrastAgainst }: ColorRowProps) {
  const isHex = /^#[0-9a-fA-F]{6}$/.test(value);
  const ratio = contrastAgainst ? contrastRatio(value, contrastAgainst) : null;
  const badge = contrastBadge(ratio);
  return (
    <div className="flex items-center gap-2 p-1.5 rounded border border-border/40 bg-background">
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
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.headerBorder}` }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: colors.iconBg }}>
          <Bell className="h-4 w-4" style={{ color: colors.iconColor }} />
        </div>
        <div className="text-sm font-bold flex-1 truncate" style={{ color: colors.title }}>תצוגה מקדימה</div>
      </div>
      {/* Body */}
      <div className="p-3 space-y-2.5">
        <div>
          <div className="text-xs font-medium mb-1" style={{ color: colors.label }}>תווית שדה</div>
          <input
            placeholder="טקסט בשדה..."
            className="w-full h-8 px-2 rounded text-xs"
            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.inputText }}
          />
          <div className="text-[10px] mt-1" style={{ color: colors.helperText }}>טקסט עזרה</div>
        </div>

        <div className="text-xs leading-relaxed" style={{ color: colors.textOnSurface }}>
          טקסט גוף לדוגמה — האם הוא קריא על הרקע?
        </div>
        <div className="text-[11px]" style={{ color: colors.textMuted }}>טקסט עמום (פחות בולט)</div>

        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
          <span className="px-1.5 py-0.5 rounded" style={{ color: colors.errorText, background: '#fef2f2' }}>שגיאה</span>
          <span className="px-1.5 py-0.5 rounded" style={{ color: colors.successText, background: '#f0fdf4' }}>הצלחה</span>
          <span className="px-1.5 py-0.5 rounded" style={{ color: colors.warningText, background: '#fffbeb' }}>אזהרה</span>
          <span className="px-1.5 py-0.5 rounded" style={{ color: colors.linkColor, background: 'transparent', textDecoration: 'underline' }}>קישור</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: colors.badgeBg, color: colors.badgeText }}>
            <Check className="inline h-2.5 w-2.5 ml-0.5" />
            תווית
          </span>
        </div>

        <div
          className="text-xs px-2 py-1.5 rounded"
          style={{ background: colors.hoverBg, color: colors.textOnSurface }}
        >
          פריט בריחוף
        </div>
      </div>
      {/* Footer */}
      <div className="px-3 py-2 flex justify-end gap-2" style={{ borderTop: `1px solid ${colors.headerBorder}` }}>
        <button
          className="px-2.5 py-1 rounded text-xs"
          style={{ color: colors.cancelText }}
        >
          ביטול
        </button>
        <button
          className="px-2.5 py-1 rounded text-xs font-medium"
          style={{ background: colors.buttonBg, color: colors.buttonText, border: `1px solid ${colors.buttonBorder}` }}
        >
          שמור
        </button>
      </div>
    </div>
  );
}
