// Quotes Pro — הרכבת מסמך HTML מלא (theme + page + blocks)
import { QP_FONTS } from "../model/types";
import type { QPDocument, QPStrip, QPTheme } from "../model/types";
import { renderBlocks, esc } from "./renderBlock";

// מפתחות legacy → font stacks
const LEGACY_FONT_STACKS: Record<string, string> = {
  default: "'Assistant','Rubik','Heebo',Arial,sans-serif",
  modern: "'Rubik','Heebo',sans-serif",
  classic: "'Frank Ruhl Libre','David Libre',serif",
  elegant: "'Heebo','Assistant',serif",
};

/** מחזיר font-family CSS מתוך ערך ה-theme (מפתח legacy או stack מלא) */
function resolveFontStack(family: string): string {
  return LEGACY_FONT_STACKS[family] || family || LEGACY_FONT_STACKS.default;
}

/** href ל-Google Fonts עבור הגופן הנבחר (null אם אינו Google font) */
export function googleFontHref(family: string): string | null {
  const opt = QP_FONTS.find((f) => f.value === family);
  return opt?.google
    ? `https://fonts.googleapis.com/css2?family=${opt.google}:wght@400;500;700&display=swap`
    : null;
}

/** בונה <link> ל-Google Fonts עבור הגופן הנבחר (אם הוא Google font) */
function googleFontsLink(family: string): string {
  const href = googleFontHref(family);
  if (!href) return "";
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${href}" rel="stylesheet">`;
}

/** HTML של פס בודד (כותרת/פוטר) */
function stripBandHtml(strip: QPStrip, side: "header" | "footer"): string {
  if (!strip.enabled) return "";
  const justify =
    strip.logoAlign === "center" ? "center" : strip.logoAlign === "left" ? "flex-start" : "flex-end";
  const logo = strip.logoUrl
    ? `<img src="${esc(strip.logoUrl)}" style="height:${strip.logoHeight || 36}px;object-fit:contain" />`
    : "";
  const text = strip.text
    ? `<span style="color:${strip.textColor || "#fff"};font-weight:600">${esc(strip.text)}</span>`
    : "";
  return `<div class="qp-strip qp-strip-${side}" style="height:${strip.height}mm;background:${strip.bgColor};color:${strip.textColor || "#fff"};justify-content:${justify}">${logo}${text}</div>`;
}

/** מחזיר את ה-HTML של הפסים (לשימוש בהזרקה לכל עמוד בתצוגת A4) */
export function getStripBands(doc: QPDocument): { header: string; footer: string } {
  return {
    header: stripBandHtml(doc.strips.header, "header"),
    footer: stripBandHtml(doc.strips.footer, "footer"),
  };
}

/** CSS למיקום הפסים — קבועים, חוזרים בכל עמוד מודפס */
function stripsCss(doc: QPDocument): string {
  const { header, footer } = doc.strips;
  if (!header.enabled && !footer.enabled) return "";
  return `
.qp-strip{position:fixed;left:0;right:0;display:flex;align-items:center;gap:12px;padding:0 ${doc.page.margins.right}mm;z-index:50;overflow:hidden;}
.qp-strip-header{top:0;}
.qp-strip-footer{bottom:${footer.showPageNumber ? 7 : 0}mm;}
`;
}

const FONT_SIZES: Record<QPTheme["fontScale"], string> = {
  small: "13px",
  medium: "15px",
  large: "17px",
};

function backgroundCss(theme: QPTheme): string {
  switch (theme.backgroundPattern) {
    case "dots":
      return "background-image:radial-gradient(#0001 1px,transparent 1px);background-size:14px 14px;";
    case "lines":
      return "background-image:repeating-linear-gradient(0deg,#0000,#0000 13px,#0000000a 14px);";
    case "grid":
      return "background-image:linear-gradient(#0000000a 1px,transparent 1px),linear-gradient(90deg,#0000000a 1px,transparent 1px);background-size:18px 18px;";
    default:
      return "";
  }
}

/** CSS גלובלי הנגזר מה-theme + הגדרות עמוד (משמש גם לתצוגה וגם לעימוד) */
export function buildDocumentCss(doc: QPDocument): string {
  const t = doc.theme;
  const m = doc.page.margins;
  const tableBorder =
    t.tableStyle === "bordered" || t.tableStyle === "modern"
      ? "1px solid #e3e3e3"
      : "none";
  return `
:root { --qp-primary:${t.primaryColor}; --qp-secondary:${t.secondaryColor}; --qp-accent:${t.accentColor}; }
.qp-doc {
  font-family:${resolveFontStack(t.fontFamily)};
  font-size:${FONT_SIZES[t.fontScale]};
  color:#1a1a1a;
  direction:rtl;
  ${backgroundCss(t)}
}
.qp-block { padding:6px 0; }
.qp-doc h2 { font-size:1.25em; }
.qp-table th, .qp-table td { padding:8px 10px; border:${tableBorder}; }
${t.tableStyle === "striped" ? ".qp-table tbody tr:nth-child(even){background:#0000000a;}" : ""}
.qp-rich p { margin:0 0 8px; }
${t.watermark ? `.qp-doc::before{content:"${t.watermark.text}";position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-size:80px;color:${t.primaryColor};opacity:${t.watermark.opacity};transform:rotate(-30deg);pointer-events:none;z-index:0;}` : ""}
${stripsCss(doc)}
@page {
  size: A4 ${doc.page.orientation};
  margin: ${m.top + (doc.strips.header.enabled ? doc.strips.header.height : 0)}mm ${m.right}mm ${m.bottom + (doc.strips.footer.enabled ? doc.strips.footer.height : 0) + (doc.strips.footer.showPageNumber ? 7 : 0)}mm ${m.left}mm;
  ${doc.strips.footer.showPageNumber ? `@bottom-center { content: "עמוד " counter(page) " מתוך " counter(pages); font-size:9px; color:#888; }` : ""}
}
`;
}

/** מסמך HTML מלא ועצמאי (לתצוגה ב-iframe / ייצוא) */
export function composeDocumentHtml(doc: QPDocument): string {
  const css = buildDocumentCss(doc);
  const body = renderBlocks(doc);
  const header = stripBandHtml(doc.strips.header, "header");
  const footer = stripBandHtml(doc.strips.footer, "footer");
  // ריווח מסך כדי שתוכן לא יוסתר מאחורי הפסים בתצוגה רציפה (iframe)
  const padTop = doc.page.margins.top + (doc.strips.header.enabled ? doc.strips.header.height : 0);
  const padBottom = doc.page.margins.top + (doc.strips.footer.enabled ? doc.strips.footer.height : 0);
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${googleFontsLink(doc.theme.fontFamily)}
<style>
*{box-sizing:border-box;}
body{margin:0;background:#fff;}
.qp-page{max-width:210mm;margin:0 auto;padding:${padTop}mm ${doc.page.margins.right}mm ${padBottom}mm;}
${css}
</style>
</head>
<body>
${header}
<div class="qp-doc"><div class="qp-page">${body}</div></div>
${footer}
</body>
</html>`;
}
