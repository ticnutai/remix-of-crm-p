import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
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

// ---- Module-level shared store so every useDialogTheme() consumer sees the same value ----
const themeStore = (() => {
  let themeId: DialogThemeId = (typeof localStorage !== 'undefined' && localStorage.getItem(DIALOG_THEME_KEY)) || 'navy-gold';
  let customThemes: CustomThemeEntry[] = loadCustomThemesLocal();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
    getThemeId: () => themeId,
    getCustomThemes: () => customThemes,
    setThemeId(id: DialogThemeId) {
      if (themeId === id) return;
      themeId = id;
      emit();
    },
    setCustomThemes(list: CustomThemeEntry[]) {
      customThemes = list;
      emit();
    },
  };
})();

export function useDialogTheme() {
  const { user } = useAuth();
  const themeId = useSyncExternalStore(themeStore.subscribe, themeStore.getThemeId, themeStore.getThemeId);
  const customThemes = useSyncExternalStore(themeStore.subscribe, themeStore.getCustomThemes, themeStore.getCustomThemes);

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
          themeStore.setCustomThemes(valid);
          saveCustomThemesLocal(valid);
        }
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  const setThemeId = useCallback((id: DialogThemeId) => {
    // eslint-disable-next-line no-console
    console.log('[ThemeSwitcher] setThemeId', id);
    themeStore.setThemeId(id);
    try { localStorage.setItem(DIALOG_THEME_KEY, id); } catch { /* ignore */ }
  }, []);

  const persistCustomThemes = useCallback(async (list: CustomThemeEntry[]) => {
    themeStore.setCustomThemes(list);
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

const MENU_WIDTH = 240;
const MENU_MARGIN = 8; // min distance from viewport edge

/** Compute the best (top, left) for the dropdown so it stays fully on-screen. */
function calcMenuPos(btn: HTMLButtonElement): { top: number; left: number } {
  const r = btn.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Prefer opening below the button; flip up if too close to the bottom.
  const spaceBelow = vh - r.bottom;
  const top = spaceBelow > 200 ? r.bottom + 6 : r.top - 6; // flip-up handled by transform below
  const flipUp = spaceBelow <= 200;

  // Prefer aligning the right edge of the menu with the right edge of the button (RTL).
  let left = r.right - MENU_WIDTH;
  left = Math.max(MENU_MARGIN, Math.min(left, vw - MENU_WIDTH - MENU_MARGIN));

  return { top: flipUp ? r.top : top, left };
}

interface DialogThemeSwitcherProps {
  currentTheme: DialogThemeId;
  onThemeChange: (id: DialogThemeId) => void;
}

export function DialogThemeSwitcher({ currentTheme, onThemeChange }: DialogThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'edit' | 'new'>('new');
  const [editorBaseId, setEditorBaseId] = useState<string>('navy-gold');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const { allThemes, deleteCustomTheme } = useDialogTheme();

  const safeCurrent = allThemes[currentTheme] || dialogThemes['navy-gold'];

  // While the menu is open, track the trigger's screen position every frame
  // so the dropdown stays anchored even when the host dialog is dragged.
  useEffect(() => {
    if (!isOpen) return;
    let rafId: number;
    let lastTop = -1;
    let lastLeft = -1;

    const tick = () => {
      const btn = buttonRef.current;
      if (btn) {
        const { top, left } = calcMenuPos(btn);
        const flipped = window.innerHeight - btn.getBoundingClientRect().bottom <= 200;
        if (top !== lastTop || left !== lastLeft) {
          lastTop = top;
          lastLeft = left;
          setMenuPos({ top, left });
          setFlipUp(flipped);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const close = useCallback(() => setIsOpen(false), []);

  const selectTheme = useCallback((id: string) => {
    onThemeChange(id);
    setIsOpen(false);
  }, [onThemeChange]);

  const openEditor = useCallback((mode: 'edit' | 'new', baseId: string) => {
    setEditorBaseId(baseId);
    setEditorMode(mode);
    setEditorOpen(true);
    setIsOpen(false);
  }, []);

  const customThemes = Object.entries(allThemes).filter(([, t]) => (t as any).isCustom);

  return (
    <>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        data-testid="dialog-theme-switcher-trigger"
        data-no-drag
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2"
        style={{
          background: safeCurrent.colors.iconBg,
          border: `1.5px solid ${safeCurrent.colors.border}40`,
        }}
        title="שנה ערכת נושא"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Palette className="h-3.5 w-3.5" style={{ color: safeCurrent.colors.iconColor }} />
      </button>

      {/* Dropdown menu — portalled to body so it escapes any overflow:hidden parent */}
      {isOpen && createPortal(
        <>
          {/* Backdrop: captures outside clicks without blocking pointer events on the menu */}
          <div
            className="fixed inset-0 z-[1600]"
            onClick={close}
          />

          {/* Menu panel */}
          <div
            data-testid="dialog-theme-switcher-menu"
            role="listbox"
            dir="rtl"
            className="fixed z-[1601] rounded-xl shadow-2xl border overflow-hidden"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: MENU_WIDTH,
              maxHeight: '60vh',
              overflowY: 'auto',
              background: '#fff',
              borderColor: '#e5e7eb',
              // Animate origin based on whether we flipped up or down
              transformOrigin: flipUp ? 'bottom left' : 'top left',
            }}
            // Stop propagation so drag handlers behind this don't fire
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Built-in themes */}
            <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              ערכות מובנות
            </div>
            <div className="px-1 pb-1">
              {(Object.entries(dialogThemes) as [string, { name: string; colors: DialogThemeColors }][]).map(([id, t]) => (
                <ThemeRow
                  key={id}
                  id={id}
                  name={t.name}
                  colors={t.colors}
                  isActive={currentTheme === id}
                  onSelect={selectTheme}
                />
              ))}
            </div>

            {/* Custom themes */}
            {customThemes.length > 0 && (
              <>
                <div className="mx-3 border-t border-gray-100" />
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  ערכות שלי
                </div>
                <div className="px-1 pb-1">
                  {customThemes.map(([id, t]) => (
                    <ThemeRow
                      key={id}
                      id={id}
                      name={t.name}
                      colors={t.colors}
                      isActive={currentTheme === id}
                      onSelect={selectTheme}
                      onEdit={() => openEditor('edit', id)}
                      onDelete={() => {
                        if (window.confirm(`למחוק את "${t.name}"?`)) deleteCustomTheme(id);
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Footer actions */}
            <div className="mx-3 border-t border-gray-100" />
            <div className="px-1 py-1">
              <button
                type="button"
                onClick={() => openEditor('edit', currentTheme)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-right text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                ערוך ערכה נוכחית
              </button>
              <button
                type="button"
                onClick={() => openEditor('new', currentTheme)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-right text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                צור ערכה חדשה
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}

      {/* Lazy-loaded theme editor */}
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

// ---------------------------------------------------------------------------
// ThemeRow — a single selectable row inside the dropdown
// ---------------------------------------------------------------------------
interface ThemeRowProps {
  id: string;
  name: string;
  colors: DialogThemeColors;
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function ThemeRow({ id, name, colors, isActive, onSelect, onEdit, onDelete }: ThemeRowProps) {
  return (
    <div className={cn('flex items-stretch rounded-lg', isActive && 'bg-blue-50')}>
      <button
        type="button"
        role="option"
        aria-selected={isActive}
        onClick={() => onSelect(id)}
        className={cn(
          'flex-1 flex items-center gap-2.5 px-3 py-2 text-right text-sm transition-colors rounded-lg',
          isActive ? 'font-semibold text-blue-700' : 'text-gray-700 hover:bg-gray-50',
        )}
      >
        {/* Two-dot color swatch */}
        <span className="flex gap-1 shrink-0">
          <span className="w-4 h-4 rounded-full border" style={{ background: colors.background, borderColor: colors.border }} />
          <span className="w-4 h-4 rounded-full border" style={{ background: colors.border, borderColor: colors.border }} />
        </span>
        <span className="truncate">{name}</span>
      </button>

      {onEdit && (
        <button
          type="button"
          title="ערוך ערכה"
          onClick={onEdit}
          className="px-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5 text-gray-400" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          title="מחק ערכה"
          onClick={onDelete}
          className="px-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </button>
      )}
    </div>
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
