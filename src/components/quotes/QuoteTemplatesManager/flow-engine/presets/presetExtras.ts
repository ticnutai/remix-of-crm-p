// Helper: ייצור CSS משותף לעורך, לתצוגה המקדימה ול-PDF על בסיס DesignPresetConfig
// משמש גם את FlowEditor (סקאופ: .flow-editor-content) וגם את renderer (סקאופ: ריק = global).

import type { DesignPresetConfig, HeadingStyle } from "./types";

function headingCss(scope: string, tag: "h1" | "h2" | "h3", s: HeadingStyle | undefined, fallbackColor: string, fallbackFamily: string): string {
  if (!s) return "";
  const sel = `${scope}${tag}`;
  const lines: string[] = [];
  if (s.size) lines.push(`font-size: ${s.size};`);
  if (s.weight) lines.push(`font-weight: ${s.weight};`);
  if (s.family) lines.push(`font-family: ${s.family};`);
  else lines.push(`font-family: ${fallbackFamily};`);
  lines.push(`color: ${s.color || fallbackColor};`);
  if (s.bg) lines.push(`background: ${s.bg};`);
  lines.push(`border-bottom: ${s.borderBottom || "0"};`);
  if (s.padding) lines.push(`padding: ${s.padding};`);
  if (s.align) lines.push(`text-align: ${s.align};`);
  if (s.marginTop !== undefined) lines.push(`margin-top: ${s.marginTop};`);
  if (s.marginBottom !== undefined) lines.push(`margin-bottom: ${s.marginBottom};`);
  if (s.uppercase) lines.push(`text-transform: uppercase;`);
  if (s.letterSpacing) lines.push(`letter-spacing: ${s.letterSpacing};`);
  return `${sel} { ${lines.join(" ")} }`;
}

/**
 * CSS משותף: כותרות מתקדמות, מסגרת לפסקה, callout, blockquote, divider.
 * @param scope קידומת לסלקטור (לדוגמה ".flow-editor-content " לעורך, "" ל-PDF).
 */
export function buildPresetExtraCss(p: DesignPresetConfig | undefined, scope = ""): string {
  if (!p) return "";
  const sp = scope ? `${scope} ` : "";
  const headingColor = p.colors.heading;
  const headingFamily = p.fonts.heading;

  const h1Css = headingCss(sp, "h1", p.headings.h1, headingColor, headingFamily);
  const h2Css = headingCss(sp, "h2", p.headings.h2, headingColor, headingFamily);
  const h3Css = headingCss(sp, "h3", p.headings.h3, headingColor, headingFamily);

  const b = p.blocks || {};
  const pf = b.paragraphFrame;
  const co = b.callout;
  const bq = b.blockquote;
  const dv = b.divider;

  const frameCss =
    pf?.enabled
      ? `${sp}p.flow-frame, ${sp}.flow-frame {
          border: ${pf.borderWidth || "1px"} ${pf.borderStyle || "solid"} ${pf.borderColor || p.colors.accent};
          border-radius: ${pf.radius || "6px"};
          background: ${pf.bg || "transparent"};
          padding: ${pf.padding || "3mm 4mm"};
          margin: ${pf.marginY || "3mm"} 0;
        }`
      : "";

  const calloutCss = `${sp}.flow-callout {
      background: ${co?.bg || "#fff8e1"};
      border: ${co?.border || "1px solid " + p.colors.accent};
      border-${scope ? "right" : "right"}: 4px solid ${co?.accent || p.colors.accent};
      color: ${co?.text || p.colors.text};
      padding: ${co?.padding || "3mm 4mm"};
      border-radius: ${co?.radius || "6px"};
      margin: 3mm 0;
    }
    ${sp}.flow-callout > strong:first-child { color: ${co?.accent || p.colors.accent}; display: block; margin-bottom: 1mm; }`;

  const bqCss = `${sp}blockquote, ${sp}.flow-quote {
      border-${scope ? "right" : "right"}: ${bq?.borderWidth || "3px"} solid ${bq?.borderColor || p.colors.accent};
      color: ${bq?.text || p.colors.muted};
      background: ${bq?.bg || "transparent"};
      font-style: ${bq?.italic === false ? "normal" : "italic"};
      padding: ${bq?.padding || "1mm 4mm"};
      border-radius: ${bq?.radius || "0"};
      margin: 3mm 0;
    }`;

  const dividerStyle = dv?.style || "solid";
  const dividerColor = dv?.color || p.colors.accent;
  const dividerThickness = dv?.thickness || "1px";
  const dividerWidth = dv?.width || "100%";
  const hrCss =
    dividerStyle === "gradient"
      ? `${sp}hr, ${sp}.flow-divider {
          border: 0;
          height: ${dividerThickness};
          background: linear-gradient(to left, transparent, ${dividerColor}, transparent);
          width: ${dividerWidth};
          margin: 4mm auto;
        }`
      : `${sp}hr, ${sp}.flow-divider {
          border: 0;
          border-top: ${dividerThickness} ${dividerStyle} ${dividerColor};
          width: ${dividerWidth};
          margin: 4mm auto;
        }`;

  return [h1Css, h2Css, h3Css, frameCss, calloutCss, bqCss, hrCss].filter(Boolean).join("\n");
}
