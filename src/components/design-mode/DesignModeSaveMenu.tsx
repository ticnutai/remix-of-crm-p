import { useMemo, useState } from 'react';
import { ChevronDown, FilePlus, Save, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCloudPreferences } from '@/hooks/useCloudPreferences';
import { useCommunityThemes } from '@/hooks/useCommunityThemes';
import { toast } from 'sonner';
import { type DesignOverride } from '@/lib/designOverrides';
import { useDesignMode } from './DesignModeProvider';

const CUSTOM_THEMES_KEY = 'ten-arch-custom-themes';
const ACTIVE_CUSTOM_THEME_KEY = 'ten-arch-active-custom-theme-id';

interface CustomThemeRecord {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  primaryHex: string;
  secondaryHex: string;
  elementOverrides?: DesignOverride[];
}

function loadCustomThemes(): CustomThemeRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomThemeRecord[]) : [];
  } catch {
    return [];
  }
}

function hslStringToHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(
    /^(?:hsl\()?\s*(\d+(?:\.\d+)?)\s*[ ,]\s*(\d+(?:\.\d+)?)%\s*[ ,]\s*(\d+(?:\.\d+)?)%\s*\)?$/i,
  );

  if (!match) return fallback;

  const h = Number(match[1]);
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (channel: number) => {
    const value = Math.round((channel + m) * 255);
    return value.toString(16).padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function readCssVar(name: string, fallback: string): string {
  const root = getComputedStyle(document.documentElement);
  const value = root.getPropertyValue(name).trim();
  return value || fallback;
}

function createThemeFromCurrentDesign(name: string, overrides: DesignOverride[]): CustomThemeRecord {
  const primary = readCssVar('--primary', '220 45% 18%');
  const secondary = readCssVar('--secondary', '43 45% 60%');

  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    primary,
    secondary,
    primaryHex: hslStringToHex(primary, '#1b2541'),
    secondaryHex: hslStringToHex(secondary, '#c9a962'),
    elementOverrides: overrides,
  };
}

export function DesignModeSaveMenu() {
  const { overrides, clearAll } = useDesignMode();
  const { saveToCloud } = useCloudPreferences();
  const { publishTheme, isAdmin } = useCommunityThemes();
  const [busy, setBusy] = useState(false);

  const customThemes = useMemo(() => loadCustomThemes(), [busy, overrides.length]);
  const activeCustomThemeId = localStorage.getItem(ACTIVE_CUSTOM_THEME_KEY);
  const activeCustomTheme = customThemes.find((theme) => theme.id === activeCustomThemeId) || null;

  const hasChanges = overrides.length > 0;

  const persistThemes = (themes: CustomThemeRecord[]) => {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
    void saveToCloud();
  };

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info('אין שינויים לשמירה');
      return;
    }

    if (!activeCustomTheme) {
      toast.info('אין ערכה מותאמת פעילה, עובר ל"שמור כערכה חדשה"');
      await handleSaveAsNew();
      return;
    }

    setBusy(true);
    try {
      const nextThemes = customThemes.map((theme) => {
        if (theme.id !== activeCustomTheme.id) return theme;
        return {
          ...theme,
          elementOverrides: [...overrides],
        };
      });

      persistThemes(nextThemes);
      clearAll();
      toast.success(`השינויים נשמרו בערכה "${activeCustomTheme.name}"`);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!hasChanges) {
      toast.info('אין שינויים לשמירה');
      return;
    }

    const suggested = activeCustomTheme ? `${activeCustomTheme.name} (לייב)` : 'ערכת עיצוב חיה חדשה';
    const name = window.prompt('שם הערכה החדשה:', suggested);
    if (!name?.trim()) return;

    setBusy(true);
    try {
      const newTheme = createThemeFromCurrentDesign(name.trim(), [...overrides]);
      const nextThemes = [...customThemes, newTheme];

      persistThemes(nextThemes);
      localStorage.setItem(ACTIVE_CUSTOM_THEME_KEY, newTheme.id);
      clearAll();
      toast.success(`נוצרה ערכה חדשה: "${newTheme.name}"`);
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!isAdmin) {
      toast.error('רק מנהל מערכת יכול לפרסם ערכות לכל המשתמשים');
      return;
    }

    const snapshot = activeCustomTheme ?? createThemeFromCurrentDesign('ערכת קהילה חדשה', [...overrides]);
    const suggested = activeCustomTheme ? activeCustomTheme.name : 'ערכת קהילה חדשה';
    const name = window.prompt('שם הערכה לפרסום לכל המשתמשים:', suggested);
    if (!name?.trim()) return;

    setBusy(true);
    try {
      const result = await publishTheme({
        name: name.trim(),
        primary: snapshot.primary,
        secondary: snapshot.secondary,
        primaryHex: snapshot.primaryHex,
        secondaryHex: snapshot.secondaryHex,
        elementOverrides: [...overrides],
      });

      if (!result.ok) {
        toast.error(result.error ?? 'פרסום הערכה נכשל');
        return;
      }

      toast.success(`הערכה פורסמה לקהילה${result.slug ? ` (${result.slug})` : ''}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={busy} className="gap-1" title="אפשרויות שמירה לערכה">
          <Save className="h-3.5 w-3.5" />
          שמור
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[250px]">
        <DropdownMenuLabel className="text-right text-[11px] text-muted-foreground">
          {activeCustomTheme ? `ערכה פעילה: ${activeCustomTheme.name}` : 'אין ערכה מותאמת פעילה'}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSave}
          disabled={busy || !hasChanges}
          className="flex flex-row-reverse items-center justify-between gap-2"
        >
          <Save className="h-4 w-4" />
          <div className="text-right">
            <div>שמור לערכה הפעילה</div>
            <div className="text-[10px] text-muted-foreground">{overrides.length} שינויים</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleSaveAsNew}
          disabled={busy || !hasChanges}
          className="flex flex-row-reverse items-center justify-between gap-2"
        >
          <FilePlus className="h-4 w-4" />
          <div className="text-right">
            <div>שמור כערכה חדשה</div>
            <div className="text-[10px] text-muted-foreground">יוצר ערכה עם ה-overrides הנוכחיים</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handlePublish}
          disabled={busy || !isAdmin}
          className="flex flex-row-reverse items-center justify-between gap-2"
        >
          <UploadCloud className="h-4 w-4 text-yellow-600" />
          <div className="text-right">
            <div>פרסם לקהילה</div>
            <div className="text-[10px] text-muted-foreground">
              {isAdmin ? 'מעלה לטבלת community_themes' : 'זמין רק למנהל מערכת'}
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
