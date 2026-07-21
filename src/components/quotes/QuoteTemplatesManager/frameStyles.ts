// מערכת עיצוב מסגרות, רקעים, כותרות, header/footer קבועים
// משמש את ה-HTML generator בעורך התבניות

// ======================== גודל עמוד ========================

export type PageSizePreset = "A3" | "A4" | "A5" | "letter" | "legal" | "custom";
export type PageOrientation = "portrait" | "landscape";

export interface PageSizeConfig {
  preset: PageSizePreset;
  orientation: PageOrientation;
  customWidthMm?: number;
  customHeightMm?: number;
}

export const DEFAULT_PAGE_SIZE: PageSizeConfig = {
  preset: "A4",
  orientation: "portrait",
};

/** Returns CSS size string for @page { size: ... } and pixel preview dimensions */
export function getPageDimensions(cfg: PageSizeConfig | undefined): {
  widthMm: number;
  heightMm: number;
  cssSize: string;
} {
  const c: PageSizeConfig = { ...DEFAULT_PAGE_SIZE, ...(cfg || {}) };
  const RAW: Record<PageSizePreset, [number, number]> = {
    A3: [297, 420],
    A4: [210, 297],
    A5: [148, 210],
    letter: [216, 279],
    legal: [216, 356],
    custom: [c.customWidthMm ?? 210, c.customHeightMm ?? 297],
  };
  const [pw, ph] = RAW[c.preset];
  const [widthMm, heightMm] =
    c.orientation === "portrait" ? [pw, ph] : [ph, pw];
  const cssSize =
    c.preset === "custom"
      ? `${widthMm}mm ${heightMm}mm`
      : `${c.preset} ${c.orientation}`;
  return { widthMm, heightMm, cssSize };
}

// ======================== סגנון גבול ========================

export type BorderStyle =
  | "none"
  | "solid"
  | "dashed"
  | "dotted"
  | "double"
  | "groove"
  | "ridge"
  | "decorative-gold"
  | "shadow-only";

export type ShadowLevel = "none" | "sm" | "md" | "lg" | "xl" | "glow-gold";

export interface BorderInsets {
  /** מרווח מקצה העמוד בכל צד — במ״מ. 0 = צמוד לקצה. */
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_INSETS: BorderInsets = { top: 4, right: 4, bottom: 4, left: 4 };

export interface BorderConfig {
  style: BorderStyle;
  width: number;
  color: string;
  radius: number;
  padding: number;
  shadow: ShadowLevel;
  decorativeCorners?: boolean;
  /** מרחקים מקצה העמוד בכל צד (מ״מ) — עבור מסגרת המסמך. ברירת מחדל 4mm. */
  insets?: BorderInsets;
}

export interface BackgroundConfig {
  type: "solid" | "gradient" | "paper" | "none";
  color1: string;
  color2?: string;
  direction?: "to bottom" | "to bottom right" | "to right" | "135deg";
  paperTone?: "warm" | "cool" | "ivory";
}

export interface SectionTitleConfig {
  style: "plain" | "gold-bar" | "gold-underline" | "filled" | "boxed";
  barColor: string;
  textColor: string;
}

export interface FixedHeaderConfig {
  enabled: boolean;
  text: string;
  showLogo: boolean;
  bgColor: string;
  textColor: string;
}

export interface FixedFooterConfig {
  enabled: boolean;
  text: string;
  showPageNumbers: boolean;
  bgColor: string;
  textColor: string;
}

export interface FrameDesignSettings {
  documentBorder?: BorderConfig;
  stageBorder?: BorderConfig;
  summaryBorder?: BorderConfig;
  background?: BackgroundConfig;
  sectionTitle?: SectionTitleConfig;
  fixedHeader?: FixedHeaderConfig;
  fixedFooter?: FixedFooterConfig;
  pageSize?: PageSizeConfig;
}

export const DEFAULT_BORDER: BorderConfig = {
  style: "solid",
  width: 1,
  color: "#d8ac27",
  radius: 12,
  padding: 24,
  shadow: "md",
  decorativeCorners: false,
};

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: "solid",
  color1: "#f5f5f5",
};

export const DEFAULT_SECTION_TITLE: SectionTitleConfig = {
  style: "gold-bar",
  barColor: "#d8ac27",
  textColor: "#162C58",
};

export const DEFAULT_FIXED_HEADER: FixedHeaderConfig = {
  enabled: false,
  text: "",
  showLogo: false,
  bgColor: "#ffffff",
  textColor: "#162C58",
};

export const DEFAULT_FIXED_FOOTER: FixedFooterConfig = {
  enabled: false,
  text: "",
  showPageNumbers: false,
  bgColor: "#ffffff",
  textColor: "#666666",
};

// פרסטים מוכנים — מסגרות
export const BORDER_PRESETS: Array<{ name: string; cfg: BorderConfig }> = [
  { name: "ללא", cfg: { ...DEFAULT_BORDER, style: "none", width: 0, shadow: "none" } },
  { name: "קלאסי", cfg: { ...DEFAULT_BORDER, style: "solid", width: 1, color: "#e5e7eb", shadow: "md" } },
  { name: "יוקרתי זהב", cfg: { ...DEFAULT_BORDER, style: "double", width: 4, color: "#d8ac27", shadow: "lg" } },
  { name: "מודרני", cfg: { ...DEFAULT_BORDER, style: "shadow-only", width: 0, radius: 16, shadow: "xl" } },
  { name: "מינימלי", cfg: { ...DEFAULT_BORDER, style: "solid", width: 1, color: "#162C58", radius: 0, shadow: "none" } },
  { name: "קישוטי זהב", cfg: { ...DEFAULT_BORDER, style: "decorative-gold", width: 2, color: "#d8ac27", radius: 0, padding: 32, shadow: "none", decorativeCorners: true } },
  { name: "מקווקו", cfg: { ...DEFAULT_BORDER, style: "dashed", width: 2, color: "#d8ac27", shadow: "none" } },
  { name: "נקודות", cfg: { ...DEFAULT_BORDER, style: "dotted", width: 2, color: "#162C58", shadow: "none" } },
];

function shadowCSS(level: ShadowLevel, color: string): string {
  switch (level) {
    case "none": return "none";
    case "sm": return "0 1px 2px rgba(0,0,0,0.08)";
    case "md": return "0 4px 12px rgba(0,0,0,0.08)";
    case "lg": return "0 10px 30px rgba(0,0,0,0.12)";
    case "xl": return "0 20px 50px rgba(0,0,0,0.18)";
    case "glow-gold": return `0 0 24px ${color}66, 0 0 8px ${color}aa`;
  }
}

export function borderToCss(cfg: BorderConfig | undefined): string {
  const b = { ...DEFAULT_BORDER, ...(cfg || {}) };
  const isShadowOnly = b.style === "shadow-only";
  const isDecorative = b.style === "decorative-gold";
  const cssBorder = isShadowOnly || isDecorative || b.style === "none"
    ? "none"
    : `${b.width}px ${b.style} ${b.color}`;
  return [
    `border: ${cssBorder};`,
    `border-radius: ${b.radius}px;`,
    `padding: ${b.padding}px;`,
    `box-shadow: ${shadowCSS(b.shadow, b.color)};`,
    isDecorative ? "position: relative;" : "",
  ].filter(Boolean).join(" ");
}

// SVG פינות זהב דקורטיביות — מוטמע inline לצורך תאימות PDF
function cornerSvg(color: string, position: "tl" | "tr" | "bl" | "br"): string {
  const rotate = { tl: 0, tr: 90, br: 180, bl: 270 }[position];
  const placement = {
    tl: "top: -2px; right: -2px;",
    tr: "top: -2px; left: -2px;",
    bl: "bottom: -2px; right: -2px;",
    br: "bottom: -2px; left: -2px;",
  }[position];
  // RTL: top-left visually = top-right in HTML; we use position labels for clarity
  const svg = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${rotate}deg);">
    <path d="M2 2 L2 18 M2 2 L18 2" stroke="${color}" stroke-width="2" fill="none"/>
    <path d="M2 6 L6 6 L6 2" stroke="${color}" stroke-width="1.2" fill="none" opacity="0.6"/>
    <circle cx="2" cy="2" r="2.5" fill="${color}"/>
  </svg>`;
  return `<span style="position: absolute; ${placement} pointer-events: none; line-height: 0;">${svg}</span>`;
}

export function decorativeCornersHtml(cfg: BorderConfig | undefined): string {
  const b = { ...DEFAULT_BORDER, ...(cfg || {}) };
  if (b.style !== "decorative-gold" && !b.decorativeCorners) return "";
  return [cornerSvg(b.color, "tl"), cornerSvg(b.color, "tr"), cornerSvg(b.color, "bl"), cornerSvg(b.color, "br")].join("");
}

export function backgroundToBodyCss(bg: BackgroundConfig | undefined): string {
  const b = { ...DEFAULT_BACKGROUND, ...(bg || {}) };
  if (b.type === "none") return "background: transparent;";
  if (b.type === "solid") return `background: ${b.color1};`;
  if (b.type === "gradient") {
    const dir = b.direction || "135deg";
    return `background: linear-gradient(${dir}, ${b.color1}, ${b.color2 || b.color1});`;
  }
  if (b.type === "paper") {
    const tone = { warm: "#faf6ee", cool: "#f3f6fa", ivory: "#fffef8" }[b.paperTone || "ivory"];
    // טקסטורת נייר עדינה ע"י SVG inline
    const noise = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0.7 0 0 0 0 0.6 0 0 0 0 0.4 0 0 0 0.04 0'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>")`;
    return `background-color: ${tone}; background-image: ${noise};`;
  }
  return "";
}

export function sectionTitleHtml(text: string, cfg: SectionTitleConfig | undefined, extraStyle = ""): string {
  const c = { ...DEFAULT_SECTION_TITLE, ...(cfg || {}) };
  const safeText = text;
  switch (c.style) {
    case "plain":
      return `<h2 style="color: ${c.textColor}; ${extraStyle}">${safeText}</h2>`;
    case "gold-bar":
      return `<h2 style="color: ${c.textColor}; border-right: 4px solid ${c.barColor}; padding-right: 12px; ${extraStyle}">${safeText}</h2>`;
    case "gold-underline":
      return `<h2 style="color: ${c.textColor}; border-bottom: 2px solid ${c.barColor}; padding-bottom: 6px; display: inline-block; ${extraStyle}">${safeText}</h2>`;
    case "filled":
      return `<h2 style="background: ${c.barColor}; color: ${c.textColor === "#162C58" ? "#fff" : c.textColor}; padding: 10px 16px; border-radius: 6px; display: inline-block; ${extraStyle}">${safeText}</h2>`;
    case "boxed":
      return `<h2 style="color: ${c.textColor}; border: 2px solid ${c.barColor}; padding: 8px 14px; border-radius: 4px; display: inline-block; ${extraStyle}">${safeText}</h2>`;
  }
}

export function fixedHeaderHtml(cfg: FixedHeaderConfig | undefined, logoUrl?: string): string {
  if (!cfg?.enabled) return "";
  const logo = cfg.showLogo && logoUrl
    ? `<img src="${logoUrl}" alt="" style="height: 28px; vertical-align: middle; margin-left: 12px;">`
    : "";
  return `<div class="quote-fixed-header" style="position: sticky; top: 0; z-index: 50; background: ${cfg.bgColor}; color: ${cfg.textColor}; padding: 8px 24px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${logo}<span>${cfg.text || ""}</span></div>`;
}

export function fixedFooterHtml(cfg: FixedFooterConfig | undefined): string {
  if (!cfg?.enabled) return "";
  const pages = cfg.showPageNumbers ? `<span style="float: left;">עמוד <span class="page-num"></span></span>` : "";
  return `<div class="quote-fixed-footer" style="position: sticky; bottom: 0; z-index: 50; background: ${cfg.bgColor}; color: ${cfg.textColor}; padding: 8px 24px; border-top: 1px solid #e5e7eb; font-size: 12px;">${pages}<span>${cfg.text || ""}</span></div>`;
}

export const DEFAULT_FRAME_SETTINGS: FrameDesignSettings = {
  documentBorder: { ...DEFAULT_BORDER, padding: 0, style: "none", width: 0, shadow: "lg", radius: 0 },
  stageBorder: { ...DEFAULT_BORDER, style: "solid", width: 1, color: "#e5e7eb", radius: 12, padding: 16, shadow: "sm" },
  summaryBorder: { ...DEFAULT_BORDER, style: "solid", width: 1, color: "#d8ac27", radius: 12, padding: 16, shadow: "md" },
  background: { ...DEFAULT_BACKGROUND },
  sectionTitle: { ...DEFAULT_SECTION_TITLE },
  fixedHeader: { ...DEFAULT_FIXED_HEADER },
  fixedFooter: { ...DEFAULT_FIXED_FOOTER },
  pageSize: { ...DEFAULT_PAGE_SIZE },
};
