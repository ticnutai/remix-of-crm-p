// מקור אמת יחיד לטיפוגרפיה של מסמך A4 — משמש גם את העורך (TipTap) וגם את
// התצוגה/PDF (renderer + Paged.js). בעבר כל אחד הגדיר גופן, גודל, שוליים ורשימות
// בנפרד (11pt מול 16px, rem מול mm), ולכן התצוגה והדפסה לא תאמו לעורך.
import type { DesignPresetConfig } from "./presets/types";

export interface DocTypography {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  textColor: string;
  headingColor: string;
  headingFont: string;
  h1: { size: string; weight: string };
  h2: { size: string; weight: string };
  h3: { size: string; weight: string };
  paragraphGap: string;
}

const firstValue = <T,>(...values: Array<T | null | undefined | "">): T | undefined =>
  values.find((v) => v !== undefined && v !== null && v !== "") as T | undefined;

/** designSettings = הגדרות התבנית + הגדרות העיצוב (כמו ב-serializeTemplate). */
export function resolveDocTypography(opts: {
  designSettings?: Record<string, any> | null;
  preset?: DesignPresetConfig | null;
}): DocTypography {
  const ds = opts.designSettings || {};
  const preset = opts.preset || undefined;
  const basePx = Math.min(28, Math.max(10, Number(firstValue(ds.fontSize, ds.font_size, 16)) || 16));
  const primary = String(firstValue(ds.secondaryColor, ds.secondary_color, "#162C58"));
  return {
    fontFamily: preset?.fonts.body || String(firstValue(ds.fontFamily, ds.font_family, "Heebo, Arial, sans-serif")),
    fontSize: preset?.fonts.size || `${basePx}px`,
    lineHeight: String(preset?.spacing.lineHeight || "1.55"),
    textColor: preset?.colors.text || "#1a1a1a",
    headingColor: preset?.colors.heading || primary,
    headingFont: preset?.fonts.heading || "inherit",
    h1: { size: preset?.headings.h1.size || "20pt", weight: String(preset?.headings.h1.weight || "700") },
    h2: { size: preset?.headings.h2.size || "14pt", weight: String(preset?.headings.h2.weight || "700") },
    h3: { size: "12pt", weight: "700" },
    paragraphGap: preset?.spacing.paragraphGap || "2mm",
  };
}

/**
 * CSS של גוף המסמך תחת scope (למשל ".flow-editor-content" או "body").
 * המידות ביחידות mm/pt — זהות בעורך ובעימוד של Paged.js.
 * `important` — בעורך יש כללי Tailwind/ברירות מחדל שצריך לגבור עליהם.
 */
export function docTypographyCss(scope: string, t: DocTypography, important = false): string {
  const i = important ? " !important" : "";
  const s = (sel: string) => sel.split(",").map((x) => `${scope} ${x.trim()}`).join(", ");
  return `
  ${scope} { font-family: ${t.fontFamily}${i}; font-size: ${t.fontSize}${i}; line-height: ${t.lineHeight}${i}; color: ${t.textColor}; counter-reset: flow-heading; }
  ${s("h1, h2, h3")} { color: ${t.headingColor}; font-family: ${t.headingFont}; margin: 4mm 0 2mm${i}; line-height: 1.3${i}; }
  ${s("h1")} { font-size: ${t.h1.size}${i}; font-weight: ${t.h1.weight}; padding-bottom: 2mm${i}; }
  ${s("h2")} { font-size: ${t.h2.size}${i}; font-weight: ${t.h2.weight}; }
  ${s("h3")} { font-size: ${t.h3.size}${i}; font-weight: ${t.h3.weight}; }
  ${s("p")} { margin: 0 0 ${t.paragraphGap}${i}; }
  ${s("ol, ul")} { margin: 0 0 3mm${i}; padding-inline-start: 6mm${i}; padding-inline-end: 0${i}; list-style-position: outside${i}; direction: rtl; text-align: right; }
  ${s("ol")} { list-style-type: decimal${i}; }
  ${s("ul")} { list-style-type: disc${i}; }
  ${s("ol ol")} { list-style-type: hebrew${i}; }
  ${s("ul ul")} { list-style-type: circle${i}; }
  ${s("li")} { display: list-item${i}; margin: 0 0 1mm${i}; }
  ${s("li > p")} { margin: 0${i}; }
  ${s("li::marker")} { color: ${t.textColor}; font-weight: 600; unicode-bidi: isolate; }
  ${s('h1[data-numbered="true"], h2[data-numbered="true"], h3[data-numbered="true"]')} { counter-increment: flow-heading; }
  ${s('h1[data-numbered="true"]::before, h2[data-numbered="true"]::before, h3[data-numbered="true"]::before')} { content: counter(flow-heading) ". "; }
  `;
}
