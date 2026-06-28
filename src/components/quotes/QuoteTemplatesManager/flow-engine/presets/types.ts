// Flow Engine — Design Presets
// אובייקט עיצוב יחיד שמוחל כ-CSS variables על העורך, ה-Preview וה-PDF.
// אינו נוגע בתוכן (TipTap doc) — רק בצבעים/פונטים/מרווחים.

export interface DesignPresetConfig {
  fonts: {
    body: string;
    heading: string;
    size: string; // e.g. "14px"
  };
  colors: {
    text: string;
    heading: string;
    accent: string;
    muted: string;
  };
  spacing: {
    lineHeight: string; // e.g. "1.7"
    paragraphGap: string; // e.g. "12px"
  };
  headings: {
    h1: { size: string; weight: string };
    h2: { size: string; weight: string };
  };
  page: {
    margin: string; // CSS length (e.g. "20mm")
  };
}

export interface DesignPreset {
  id: string;
  name: string;
  is_builtin: boolean;
  user_id?: string | null;
  config: DesignPresetConfig;
}

export const DEFAULT_PRESET_CONFIG: DesignPresetConfig = {
  fonts: {
    body: "Heebo, sans-serif",
    heading: "Heebo, sans-serif",
    size: "14px",
  },
  colors: {
    text: "#1a1a1a",
    heading: "#162C58",
    accent: "#d8ac27",
    muted: "#666666",
  },
  spacing: { lineHeight: "1.7", paragraphGap: "12px" },
  headings: {
    h1: { size: "24px", weight: "700" },
    h2: { size: "19px", weight: "700" },
  },
  page: { margin: "20mm" },
};

/** מחזיר block CSS שמחיל את הערכה דרך CSS variables על scope נתון. */
export function presetToCssVars(p: DesignPresetConfig): string {
  return `
    --flow-font-body: ${p.fonts.body};
    --flow-font-heading: ${p.fonts.heading};
    --flow-font-size: ${p.fonts.size};
    --flow-color-text: ${p.colors.text};
    --flow-color-heading: ${p.colors.heading};
    --flow-color-accent: ${p.colors.accent};
    --flow-color-muted: ${p.colors.muted};
    --flow-line-height: ${p.spacing.lineHeight};
    --flow-paragraph-gap: ${p.spacing.paragraphGap};
    --flow-h1-size: ${p.headings.h1.size};
    --flow-h1-weight: ${p.headings.h1.weight};
    --flow-h2-size: ${p.headings.h2.size};
    --flow-h2-weight: ${p.headings.h2.weight};
    --flow-page-margin: ${p.page.margin};
  `;
}
