// Flow Engine — Shared theme resolver
// מקור-אמת יחיד לעיצוב שמוזן *גם* לעורך (FlowEditor) *וגם* לתצוגה/PDF (renderer.ts).
//
// הבעיה שנפתרת כאן: כשלא נבחרה ערכת עיצוב (preset), כל מנוע נפל ל-fallback
// אחר — העורך ל-`hsl(var(--primary))` וה-renderer ל-`branding.primaryColor` —
// ולכן אותו מסמך נראה שונה בין "עריכה" ל"תצוגה מקדימה". הפתרון: כשאין preset
// שני הצדדים נופלים לאותו `DEFAULT_PRESET_CONFIG`, כשצבעי המותג מוטמעים מעליו.

import { DEFAULT_PRESET_CONFIG, type DesignPresetConfig } from "./presets/types";

export interface FlowBrandColors {
  /** צבע כותרות ראשי (navy כברירת מחדל) — נגזר מ-secondaryColor של התבנית. */
  primaryColor?: string;
  /** צבע הדגשה (gold כברירת מחדל) — נגזר מ-primaryColor של התבנית. */
  accentColor?: string;
  /** צבע טקסט גוף. */
  textColor?: string;
}

function firstValue<T>(...values: Array<T | null | undefined | "">): T | undefined {
  return values.find((value) => value !== undefined && value !== null && value !== "") as T | undefined;
}

/**
 * נגזרת צבעי המותג מתוך design_settings (ממוזג תבנית + הצעה).
 * חייב להישאר תואם ל-serializer.ts כדי שהעורך והתצוגה יגזרו אותם ערכים.
 */
export function resolveBrandColors(ds: Record<string, any> | undefined | null): FlowBrandColors {
  const s = ds || {};
  return {
    primaryColor: firstValue(s.secondaryColor, s.secondary_color, "#162C58"),
    accentColor: firstValue(s.primaryColor, s.primary_color, s.accentColor, s.accent_color, "#d8ac27"),
    textColor: firstValue(s.textColor, s.text_color),
  };
}

/**
 * מחזיר את ה-DesignPresetConfig האפקטיבי שיש להזין לשני המנועים.
 * - אם נבחרה ערכת עיצוב מפורשת — היא מנצחת ומוחזרת כמות שהיא.
 * - אחרת — DEFAULT_PRESET_CONFIG כשצבעי המותג (כותרת/הדגשה/טקסט) מוטמעים מעליו,
 *   כך שהעורך והתצוגה זהים וגם משקפים את מיתוג התבנית.
 */
export function resolveFlowTheme(
  preset?: DesignPresetConfig,
  brand?: FlowBrandColors,
): DesignPresetConfig {
  if (preset) return preset;

  const base = DEFAULT_PRESET_CONFIG;
  const heading = brand?.primaryColor || base.colors.heading;
  const accent = brand?.accentColor || base.colors.accent;
  const text = brand?.textColor || base.colors.text;

  const overlayHeading = (h: typeof base.headings.h1) => ({
    ...h,
    color: heading,
    ...(h.borderBottom ? { borderBottom: `2px solid ${accent}` } : {}),
  });

  return {
    ...base,
    colors: { ...base.colors, heading, accent, text },
    headings: {
      h1: overlayHeading(base.headings.h1),
      h2: overlayHeading(base.headings.h2),
      h3: base.headings.h3 ? overlayHeading(base.headings.h3) : undefined,
    },
    table: {
      ...(base.table || {}),
      headerBg: brand?.primaryColor || base.table?.headerBg,
    },
  };
}
