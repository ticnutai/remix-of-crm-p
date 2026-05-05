import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Palette, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type DialogThemeId = string; // built-in IDs + arbitrary custom IDs

export interface DialogThemeColors {
  // ---- Surfaces ----
  background: string;
  backgroundGradient: string;
  border: string;
  borderSub: string;
  headerBorder: string;
  // ---- Primary text contexts ----
  title: string;
  label: string;
  text: string;
  // ---- Inputs ----
  inputBg: string;
  inputBorder: string;
  inputText: string;
  // ---- Buttons ----
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
  // ---- Icons ----
  iconColor: string;
  iconBg: string;
  // ---- Cancel ----
  cancelText: string;
  // ---- Extended (all optional, fallback to existing) ----
  /** Body/secondary text on the dialog surface. Falls back to `text`. */
  textOnSurface?: string;
  /** Less important text (hints, placeholders, captions). */
  textMuted?: string;
  /** Helper text below inputs. */
  helperText?: string;
  /** Error messages. */
  errorText?: string;
  /** Success messages. */
  successText?: string;
  /** Warning messages. */
  warningText?: string;
  /** Inline links / interactive text. */
  linkColor?: string;
  /** Divider/separator color. */
  dividerColor?: string;
  /** Badge background. */
  badgeBg?: string;
  /** Badge text. */
  badgeText?: string;
  /** Hover background for list items. */
  hoverBg?: string;
  /** Focus ring color. */
  focusRing?: string;
  /** Calendar selected day background. Falls back to `border`. */
  calendarSelectedBg?: string;
  /** Calendar selected day text. Falls back to `buttonText`. */
  calendarSelectedText?: string;
  /** Scrollbar thumb. */
  scrollThumb?: string;
  // ---- Quick chips (date picker, etc.) ----
  /** Chip background (inactive). Falls back to `inputBg`. */
  chipBg?: string;
  /** Chip text (inactive). Falls back to `text`. */
  chipText?: string;
  /** Chip border (inactive). Falls back to `borderSub`. */
  chipBorder?: string;
  /** Active chip background. Falls back to `border`. */
  chipActiveBg?: string;
  /** Active chip text. Falls back to `buttonText`. */
  chipActiveText?: string;
  /** Active chip border. Falls back to `border`. */
  chipActiveBorder?: string;
  /** "Clear" chip background. Falls back to `inputBg`. */
  chipClearBg?: string;
  /** "Clear" chip text. Falls back to `errorText` / red. */
  chipClearText?: string;
  /** "Clear" chip border. Falls back to a soft red. */
  chipClearBorder?: string;
  // ---- Hebrew (Jewish) calendar date display ----
  /** Hebrew month/year subtitle in calendar. Falls back to `border`. */
  hebrewDateText?: string;
  /** Hebrew day numeral inside each calendar cell. Falls back to `border`. */
  hebrewDayText?: string;
  // ---- Inner section blocks (e.g. "תזכורת וסנכרון" panel inside dialogs) ----
  /** Background of an inner grouped section panel. Falls back to a soft tint of `border`. */
  sectionBg?: string;
  /** Border of an inner section panel. Falls back to a soft tint of `border`. */
  sectionBorder?: string;
  /** Title text inside an inner section. Falls back to `title`. */
  sectionTitle?: string;
  /** Label/sub-label text inside an inner section. Falls back to `label`. */
  sectionLabel?: string;
}

export const dialogThemes: Record<DialogThemeId, { name: string; colors: DialogThemeColors }> = {
  'navy-gold': {
    name: 'כחול כהה',
    colors: {
      background: '#162C58',
      backgroundGradient: 'linear-gradient(135deg, #162C58 0%, #0F1F3D 100%)',
      border: '#d8ac27',
      borderSub: 'rgba(216,172,39,0.25)',
      headerBorder: 'rgba(216,172,39,0.19)',
      title: '#e8c85a',
      label: '#e8c85a',
      text: '#e8c85a',
      inputBg: 'rgba(30,58,110,0.31)',
      inputBorder: 'rgba(216,172,39,0.25)',
      inputText: '#e8c85a',
      buttonBg: 'rgba(216,172,39,0.15)',
      buttonText: '#d8ac27',
      buttonBorder: '#d8ac27',
      iconColor: '#d8ac27',
      iconBg: 'rgba(216,172,39,0.13)',
      cancelText: '#e8c85a',
    },
  },
  'white-gold': {
    name: 'לבן אלגנטי',
    colors: {
      background: '#FFFFFF',
      backgroundGradient: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8F2 100%)',
      border: '#c9a227',
      borderSub: 'rgba(201,162,39,0.3)',
      headerBorder: 'rgba(201,162,39,0.25)',
      title: '#162C58',
      label: '#162C58',
      text: '#162C58',
      inputBg: '#F7F5EE',
      inputBorder: 'rgba(201,162,39,0.4)',
      inputText: '#162C58',
      buttonBg: '#162C58',
      buttonText: '#FFFFFF',
      buttonBorder: '#162C58',
      iconColor: '#162C58',
      iconBg: 'rgba(22,44,88,0.08)',
      cancelText: '#162C58',
    },
  },
  'dark-elegant': {
    name: 'כהה אלגנטי',
    colors: {
      background: '#1A1A2E',
      backgroundGradient: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
      border: '#C4A35A',
      borderSub: 'rgba(196,163,90,0.25)',
      headerBorder: 'rgba(196,163,90,0.2)',
      title: '#E8D5A3',
      label: '#E8D5A3',
      text: '#D4C5A0',
      inputBg: 'rgba(255,255,255,0.06)',
      inputBorder: 'rgba(196,163,90,0.3)',
      inputText: '#E8D5A3',
      buttonBg: '#C4A35A',
      buttonText: '#1A1A2E',
      buttonBorder: '#C4A35A',
      iconColor: '#C4A35A',
      iconBg: 'rgba(196,163,90,0.12)',
      cancelText: '#D4C5A0',
    },
  },
  'soft-blue': {
    name: 'כחול רך',
    colors: {
      background: '#F0F4FA',
      backgroundGradient: 'linear-gradient(135deg, #F0F4FA 0%, #E3EAF5 100%)',
      border: '#3B6EB5',
      borderSub: 'rgba(59,110,181,0.2)',
      headerBorder: 'rgba(59,110,181,0.15)',
      title: '#1E3A5F',
      label: '#1E3A5F',
      text: '#2C4A6E',
      inputBg: '#FFFFFF',
      inputBorder: 'rgba(59,110,181,0.3)',
      inputText: '#1E3A5F',
      buttonBg: '#1E3A5F',
      buttonText: '#FFFFFF',
      buttonBorder: '#1E3A5F',
      iconColor: '#1E3A5F',
      iconBg: 'rgba(30,58,95,0.08)',
      cancelText: '#2C4A6E',
    },
  },
};

const DIALOG_THEME_KEY = 'dialog-color-theme';
const DIALOG_CUSTOM_THEMES_KEY = 'dialog-custom-themes';
const SUPABASE_SETTING_KEY = 'dialog::custom-themes';
const DIALOG_VIEWPORT_MARGIN = 24;

// ---- Custom theme storage ----
export interface CustomThemeEntry { id: string; name: string; colors: DialogThemeColors }

function loadCustomThemesLocal(): CustomThemeEntry[] {
  try {
    const raw = localStorage.getItem(DIALOG_CUSTOM_THEMES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((t) => t && typeof t.id === 'string' && t.colors);
  } catch {
    return [];
  }
}

function saveCustomThemesLocal(list: CustomThemeEntry[]) {
  try { localStorage.setItem(DIALOG_CUSTOM_THEMES_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/** Resolve a theme's colors with fallbacks for new optional fields. */
export function resolveTheme(c: DialogThemeColors): Required<DialogThemeColors> {
  return {
    ...c,
    textOnSurface: c.textOnSurface ?? c.text,
    textMuted: c.textMuted ?? withAlpha(c.text, 0.65),
    helperText: c.helperText ?? withAlpha(c.text, 0.7),
    errorText: c.errorText ?? '#ef4444',
    successText: c.successText ?? '#22c55e',
    warningText: c.warningText ?? '#f59e0b',
    linkColor: c.linkColor ?? c.border,
    dividerColor: c.dividerColor ?? c.headerBorder,
    badgeBg: c.badgeBg ?? c.iconBg,
    badgeText: c.badgeText ?? c.iconColor,
    hoverBg: c.hoverBg ?? withAlpha(c.border, 0.12),
    focusRing: c.focusRing ?? c.border,
    calendarSelectedBg: c.calendarSelectedBg ?? c.border,
    calendarSelectedText: c.calendarSelectedText ?? c.buttonText,
    scrollThumb: c.scrollThumb ?? withAlpha(c.border, 0.5),
    chipBg: c.chipBg ?? '#FFFFFF',
    chipText: c.chipText ?? c.text,
    chipBorder: c.chipBorder ?? withAlpha(c.border, 0.4),
    chipActiveBg: c.chipActiveBg ?? c.border,
    chipActiveText: c.chipActiveText ?? c.buttonText,
    chipActiveBorder: c.chipActiveBorder ?? c.border,
    chipClearBg: c.chipClearBg ?? '#FFFFFF',
    chipClearText: c.chipClearText ?? (c.errorText ?? '#ef4444'),
    chipClearBorder: c.chipClearBorder ?? '#fecaca',
    hebrewDateText: c.hebrewDateText ?? c.border,
    hebrewDayText: c.hebrewDayText ?? c.border,
    sectionBg: c.sectionBg ?? withAlpha(c.border, 0.18),
    sectionBorder: c.sectionBorder ?? withAlpha(c.border, 0.4),
    sectionTitle: c.sectionTitle ?? c.title,
    sectionLabel: c.sectionLabel ?? c.label,
  };
}

function withAlpha(hexOrRgb: string, a: number): string {
  // Cheap helper: if hex like #RRGGBB add alpha; otherwise return as-is.
  const m = /^#([0-9a-fA-F]{6})$/.exec(hexOrRgb);
  if (!m) return hexOrRgb;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${a})`;
}

export function useDialogTheme() {
  const { user } = useAuth();
  const [customThemes, setCustomThemes] = useState<CustomThemeEntry[]>(() => loadCustomThemesLocal());
  const [themeId, setThemeIdState] = useState<DialogThemeId>(() => {
    const saved = localStorage.getItem(DIALOG_THEME_KEY);
    return saved || 'navy-gold';
  });

  // Load custom themes from cloud (overrides local on success)
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', SUPABASE_SETTING_KEY)
          .maybeSingle();
        const v = (data as any)?.setting_value;
        if (alive && Array.isArray(v)) {
          const valid = v.filter((t: any) => t && typeof t.id === 'string' && t.colors);
          setCustomThemes(valid);
          saveCustomThemesLocal(valid);
        }
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  const setThemeId = useCallback((id: DialogThemeId) => {
    setThemeIdState(id);
    try { localStorage.setItem(DIALOG_THEME_KEY, id); } catch { /* ignore */ }
  }, []);

  const persistCustomThemes = useCallback(async (list: CustomThemeEntry[]) => {
    setCustomThemes(list);
    saveCustomThemesLocal(list);
    if (!user?.id) return;
    try {
      await supabase.from('user_settings').upsert(
        {
          user_id: user.id,
          setting_key: SUPABASE_SETTING_KEY,
          setting_value: list as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,setting_key' },
      );
    } catch { /* ignore */ }
  }, [user?.id]);

  const saveCustomTheme = useCallback(async (entry: CustomThemeEntry) => {
    const next = [...customThemes];
    const idx = next.findIndex((t) => t.id === entry.id);
    if (idx >= 0) next[idx] = entry; else next.push(entry);
    await persistCustomThemes(next);
  }, [customThemes, persistCustomThemes]);

  const deleteCustomTheme = useCallback(async (id: string) => {
    await persistCustomThemes(customThemes.filter((t) => t.id !== id));
    if (themeId === id) setThemeId('navy-gold');
  }, [customThemes, persistCustomThemes, themeId, setThemeId]);

  const allThemes: Record<string, { name: string; colors: DialogThemeColors; isCustom?: boolean }> = {
    ...dialogThemes,
    ...Object.fromEntries(customThemes.map((t) => [t.id, { name: t.name, colors: t.colors, isCustom: true }])),
  };

  const themeMeta = allThemes[themeId] || dialogThemes['navy-gold'];
  const colors = themeMeta.colors;

  return {
    themeId,
    /** Theme colors with all extended fields resolved (fallbacks applied). */
    theme: resolveTheme(colors),
    /** Raw colors as stored (for editing). */
    rawColors: colors,
    setThemeId,
    customThemes,
    allThemes,
    saveCustomTheme,
    deleteCustomTheme,
    isCurrentCustom: !!themeMeta.isCustom,
  };
}

// --- Resize hook for dialog ---
export function useDialogResize(initialWidth = 500, minWidth = 350, minHeight = 300) {
  const [size, setSize] = useState<{ width: number; height: number | null }>({ width: initialWidth, height: null });
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = containerRef.current?.offsetWidth || size.width;
    const startHeight = containerRef.current?.offsetHeight || size.height || 400;

    const onMouseMove = (ev: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      const maxWidth = Math.max(minWidth, window.innerWidth - DIALOG_VIEWPORT_MARGIN * 2);
      const maxHeight = Math.max(minHeight, window.innerHeight - DIALOG_VIEWPORT_MARGIN * 2);

      if (direction.includes('e')) newWidth = Math.max(minWidth, startWidth + (ev.clientX - startX));
      if (direction.includes('w')) newWidth = Math.max(minWidth, startWidth - (ev.clientX - startX));
      if (direction.includes('s')) newHeight = Math.max(minHeight, startHeight + (ev.clientY - startY));
      if (direction.includes('n')) newHeight = Math.max(minHeight, startHeight - (ev.clientY - startY));

      setSize({
        width: Math.min(newWidth, maxWidth),
        height: Math.min(newHeight, maxHeight),
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = direction.length === 2 ? `${direction}-resize` : `${direction}-resize`;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [size, minWidth, minHeight]);

  return { size, containerRef, startResize };
}

// --- Theme Switcher ---
interface DialogThemeSwitcherProps {
  currentTheme: DialogThemeId;
  onThemeChange: (id: DialogThemeId) => void;
}

export function DialogThemeSwitcher({ currentTheme, onThemeChange }: DialogThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'edit' | 'new'>('new');
  const [editorBaseId, setEditorBaseId] = useState<string>('navy-gold');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const { allThemes, deleteCustomTheme } = useDialogTheme();

  const safeCurrent = allThemes[currentTheme] || dialogThemes['navy-gold'];

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isOpen]);

  const openEditorForCurrent = () => {
    setEditorBaseId(currentTheme);
    setEditorMode('edit');
    setEditorOpen(true);
    setIsOpen(false);
  };
  const openEditorAsNew = () => {
    setEditorBaseId(currentTheme);
    setEditorMode('new');
    setEditorOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-110"
        style={{
          background: safeCurrent.colors.iconBg,
          border: `1.5px solid ${safeCurrent.colors.border}40`,
        }}
        title="שנה ערכת צבעים"
      >
        <Palette className="h-3.5 w-3.5" style={{ color: safeCurrent.colors.iconColor }} />
      </button>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[600]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[601] rounded-lg shadow-xl p-2 min-w-[220px] max-h-[60vh] overflow-y-auto border"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              background: '#FFFFFF',
              borderColor: '#E0E0E0',
            }}
            dir="rtl"
          >
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              ערכות מובנות
            </div>
            {(Object.entries(dialogThemes) as [string, typeof dialogThemes[DialogThemeId]][]).map(([id, t]) => (
              <button
                key={id}
                type="button"
                onClick={() => { onThemeChange(id); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-right text-sm transition-colors",
                  currentTheme === id ? "bg-blue-50 font-bold" : "hover:bg-gray-50"
                )}
              >
                <div className="flex gap-1">
                  <span className="w-4 h-4 rounded-full border" style={{ background: t.colors.background, borderColor: t.colors.border }} />
                  <span className="w-4 h-4 rounded-full border" style={{ background: t.colors.border, borderColor: t.colors.border }} />
                </div>
                <span style={{ color: '#333' }}>{t.name}</span>
              </button>
            ))}

            {Object.entries(allThemes).filter(([, t]) => (t as any).isCustom).length > 0 && (
              <>
                <div className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  ערכות שלי
                </div>
                {Object.entries(allThemes)
                  .filter(([, t]) => (t as any).isCustom)
                  .map(([id, t]) => (
                    <div key={id} className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => { onThemeChange(id); setIsOpen(false); }}
                        className={cn(
                          "flex-1 flex items-center gap-2.5 px-3 py-2 rounded-md text-right text-sm transition-colors",
                          currentTheme === id ? "bg-blue-50 font-bold" : "hover:bg-gray-50"
                        )}
                      >
                        <div className="flex gap-1">
                          <span className="w-4 h-4 rounded-full border" style={{ background: t.colors.background, borderColor: t.colors.border }} />
                          <span className="w-4 h-4 rounded-full border" style={{ background: t.colors.border, borderColor: t.colors.border }} />
                        </div>
                        <span style={{ color: '#333' }} className="truncate">{t.name}</span>
                      </button>
                      <button
                        type="button"
                        title="ערוך ערכה"
                        onClick={() => { setEditorBaseId(id); setEditorMode('edit'); setEditorOpen(true); setIsOpen(false); }}
                        className="px-2 rounded-md hover:bg-gray-100"
                      >
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        title="מחק ערכה"
                        onClick={() => { if (confirm(`למחוק את "${t.name}"?`)) deleteCustomTheme(id); }}
                        className="px-2 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
              </>
            )}

            <div className="border-t border-gray-200 mt-2 pt-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={openEditorForCurrent}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-right text-sm hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-600" />
                <span style={{ color: '#333' }}>ערוך ערכה נוכחית</span>
              </button>
              <button
                type="button"
                onClick={openEditorAsNew}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-right text-sm hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5 text-gray-600" />
                <span style={{ color: '#333' }}>צור ערכה חדשה</span>
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}

      {editorOpen && (
        <React.Suspense fallback={null}>
          <ThemeEditorLazy
            mode={editorMode}
            baseId={editorBaseId}
            onClose={(savedId) => {
              setEditorOpen(false);
              if (savedId) onThemeChange(savedId);
            }}
          />
        </React.Suspense>
      )}
    </>
  );
}

// Lazy import to avoid circular dependency between switcher and editor.
const ThemeEditorLazy = React.lazy(() => import('./ThemeEditor').then((m) => ({ default: m.ThemeEditor })));

// --- Resize handles component ---
export function ResizeHandles({ onResize }: { onResize: (dir: string, e: React.MouseEvent) => void }) {
  const handleStyle = "absolute opacity-0 hover:opacity-100 transition-opacity";
  const dotStyle = "bg-amber-500/50 rounded-full";

  return (
    <>
      {/* Edges */}
      <div className={`${handleStyle} left-0 top-2 bottom-2 w-1.5 cursor-w-resize`} onMouseDown={(e) => onResize('w', e)}>
        <div className={`${dotStyle} w-1 h-6 absolute top-1/2 -translate-y-1/2 left-0.5`} />
      </div>
      <div className={`${handleStyle} right-0 top-2 bottom-2 w-1.5 cursor-e-resize`} onMouseDown={(e) => onResize('e', e)}>
        <div className={`${dotStyle} w-1 h-6 absolute top-1/2 -translate-y-1/2 right-0.5`} />
      </div>
      <div className={`${handleStyle} bottom-0 left-2 right-2 h-1.5 cursor-s-resize`} onMouseDown={(e) => onResize('s', e)}>
        <div className={`${dotStyle} h-1 w-6 absolute left-1/2 -translate-x-1/2 bottom-0.5`} />
      </div>
      {/* Corners */}
      <div className={`${handleStyle} right-0 bottom-0 w-4 h-4 cursor-se-resize`} onMouseDown={(e) => onResize('se', e)}>
        <div className={`${dotStyle} w-2 h-2 absolute bottom-1 right-1`} />
      </div>
      <div className={`${handleStyle} left-0 bottom-0 w-4 h-4 cursor-sw-resize`} onMouseDown={(e) => onResize('sw', e)}>
        <div className={`${dotStyle} w-2 h-2 absolute bottom-1 left-1`} />
      </div>
    </>
  );
}
