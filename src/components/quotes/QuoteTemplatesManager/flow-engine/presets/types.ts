// Flow Engine — Design Presets
// אובייקט עיצוב יחיד שמוחל כ-CSS variables על העורך, ה-Preview וה-PDF.
// אינו נוגע בתוכן (TipTap doc) — רק בצבעים/פונטים/מרווחים/בלוקים/סטריפים.

export interface HeadingStyle {
  size: string;
  weight: string;
  family?: string;
  color?: string;
  bg?: string;
  borderBottom?: string; // CSS shorthand e.g. "2px solid #d8ac27" or ""
  align?: "right" | "left" | "center" | "justify";
  padding?: string; // e.g. "0 0 2mm 0"
  marginTop?: string;
  marginBottom?: string;
  uppercase?: boolean;
  letterSpacing?: string;
}

export interface BlockStyles {
  paragraphFrame?: {
    enabled?: boolean;
    borderColor?: string;
    borderWidth?: string; // "1px"
    borderStyle?: "solid" | "dashed" | "dotted" | "double";
    radius?: string; // "6px"
    bg?: string;
    padding?: string;
    marginY?: string;
  };
  callout?: {
    bg?: string;
    border?: string; // shorthand
    text?: string;
    accent?: string;
    padding?: string;
    radius?: string;
    iconColor?: string;
  };
  blockquote?: {
    borderColor?: string;
    borderWidth?: string;
    text?: string;
    bg?: string;
    italic?: boolean;
    padding?: string;
    radius?: string;
  };
  divider?: {
    style?: "solid" | "dashed" | "double" | "dotted" | "gradient";
    color?: string;
    thickness?: string; // "1px"
    width?: string; // "100%" or "60%"
  };
}

export type StripMode = "inherit" | "custom" | "none";

export interface PresetStrips {
  override?: boolean; // אם דולק — דורסת את הסטריפים של המסמך
  headerMode?: StripMode;
  footerMode?: StripMode;
  headerStripUrl?: string | null;
  footerStripUrl?: string | null;
  headerStripHeightPx?: number;
  footerStripHeightPx?: number;
  headerAssetId?: string | null;
  footerAssetId?: string | null;
  bgColor?: string;
}

export interface DesignPresetConfig {
  fonts: {
    body: string;
    heading: string;
    size: string;
  };
  colors: {
    text: string;
    heading: string;
    accent: string;
    muted: string;
  };
  spacing: {
    lineHeight: string;
    paragraphGap: string;
  };
  headings: {
    h1: HeadingStyle;
    h2: HeadingStyle;
    h3?: HeadingStyle;
  };
  page: {
    margin: string;
  };
  table?: {
    headerBg?: string;
    headerText?: string;
    borderColor?: string;
    rowAltBg?: string;
    fontSize?: string;
    padding?: string;
  };
  blocks?: BlockStyles;
  strips?: PresetStrips;
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
    h1: {
      size: "24px",
      weight: "700",
      color: "#162C58",
      borderBottom: "2px solid #d8ac27",
      padding: "0 0 2mm 0",
      align: "right",
      marginTop: "0",
      marginBottom: "4mm",
    },
    h2: {
      size: "19px",
      weight: "700",
      color: "#162C58",
      borderBottom: "",
      padding: "",
      align: "right",
      marginTop: "6mm",
      marginBottom: "3mm",
    },
    h3: {
      size: "16px",
      weight: "600",
      color: "#162C58",
      align: "right",
      marginTop: "4mm",
      marginBottom: "2mm",
    },
  },
  page: { margin: "20mm" },
  table: {
    headerBg: "#162C58",
    headerText: "#ffffff",
    borderColor: "#dddddd",
    rowAltBg: "",
    fontSize: "10pt",
    padding: "2mm 3mm",
  },
  blocks: {
    paragraphFrame: {
      enabled: false,
      borderColor: "#d8ac27",
      borderWidth: "1px",
      borderStyle: "solid",
      radius: "6px",
      bg: "#fffaf0",
      padding: "3mm 4mm",
      marginY: "3mm",
    },
    callout: {
      bg: "#fff8e1",
      border: "1px solid #d8ac27",
      text: "#5a4500",
      accent: "#d8ac27",
      padding: "3mm 4mm",
      radius: "6px",
      iconColor: "#d8ac27",
    },
    blockquote: {
      borderColor: "#d8ac27",
      borderWidth: "3px",
      text: "#444444",
      bg: "transparent",
      italic: true,
      padding: "1mm 4mm",
      radius: "0",
    },
    divider: {
      style: "solid",
      color: "#d8ac27",
      thickness: "1px",
      width: "100%",
    },
  },
  strips: {
    override: false,
    headerMode: "inherit",
    footerMode: "inherit",
    headerStripUrl: null,
    footerStripUrl: null,
    headerStripHeightPx: 150,
    footerStripHeightPx: 90,
    bgColor: "#ffffff",
  },
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
    --flow-table-header-bg: ${p.table?.headerBg || p.colors.heading};
    --flow-table-header-text: ${p.table?.headerText || "#ffffff"};
    --flow-table-border: ${p.table?.borderColor || "#dddddd"};
    --flow-table-row-alt: ${p.table?.rowAltBg || "transparent"};
    --flow-table-font-size: ${p.table?.fontSize || "10pt"};
    --flow-table-padding: ${p.table?.padding || "2mm 3mm"};
  `;
}
