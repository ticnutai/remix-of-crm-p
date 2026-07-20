// Flow Engine — Layer 3: Renderer
// קלט: FlowDocument זורם.
// פלט: מסמך HTML עצמאי שמוזן ל-iframe ועובר את Paged.js polyfill.
//
// העיקרון: HTML זורם לחלוטין. הסטריפים והלוגו מוגדרים אך ורק דרך
// `position: running()` ו-`@page` — ככה Paged.js מטפל בהם אוטומטית בכל עמוד,
// בלי clip-path, בלי safe masks, בלי overlays.

import type { FlowBlock, FlowDocument, FlowInline } from "./types";
import type { DesignPresetConfig } from "./presets/types";
import { buildPresetExtraCss } from "./presets/presetExtras";
import { clampFlowNumber, FLOW_STRIP_LIMITS } from "./stripSettings";

const PX_TO_MM = 25.4 / 96;

function pxToMm(value: number, fallback: number) {
  const safe = Number.isFinite(value) ? value : fallback;
  return Math.max(0, safe * PX_TO_MM);
}

function mmCss(value: number) {
  return Number(value.toFixed(3));
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export type RendererMergeData = Record<string, string | number | undefined | null>;

let CURRENT_MERGE: RendererMergeData | undefined;

function resolveFieldKey(key: string): string | undefined {
  if (!CURRENT_MERGE) return undefined;
  const v = CURRENT_MERGE[key];
  if (v === undefined || v === null || v === "") return undefined;
  return String(v);
}

function renderInline(node: FlowInline): string {
  if (node.type === "field") {
    const resolved = resolveFieldKey(node.key);
    if (resolved !== undefined) {
      return esc(resolved);
    }
    return `<span class="fld">{{${esc(node.key)}}}</span>`;
  }
  if (node.type === "raw") {
    return node.html;
  }
  let html = esc(node.text);
  if (node.bold) html = `<strong>${html}</strong>`;
  if (node.italic) html = `<em>${html}</em>`;
  if (node.color) html = `<span style="color:${esc(node.color)}">${html}</span>`;
  return html;
}

function renderInlines(nodes: FlowInline[]): string {
  return nodes.map(renderInline).join("");
}

function renderBlock(block: FlowBlock): string {
  switch (block.type) {
    case "heading": {
      const align = block.align ? ` style="text-align:${block.align}"` : "";
      return `<h${block.level} class="flow-h flow-h${block.level}"${align}>${renderInlines(block.content)}</h${block.level}>`;
    }
    case "paragraph":
      return `<p class="flow-p" style="text-align:${block.align || "right"}">${renderInlines(block.content)}</p>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .map((line) => `<li>${renderInlines(line)}</li>`)
        .join("");
      return `<${tag} class="flow-list">${items}</${tag}>`;
    }
    case "table": {
      const head = `<thead><tr>${block.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`;
      const body = `<tbody>${block.rows
        .map(
          (row) =>
            `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`,
        )
        .join("")}</tbody>`;
      const klass = block.breakable ? "flow-table breakable" : "flow-table";
      return `<table class="${klass}">${head}${body}</table>`;
    }
    case "spacer":
      return `<div class="flow-spacer" style="height:${block.mm}mm"></div>`;
    case "divider": {
      const color = block.color || "#d8ac27";
      const thickness = Math.max(1, Math.round(block.thickness || 1));
      const style = block.style || "solid";
      return `<hr class="flow-divider" style="border:0;border-top:${thickness}px ${style} ${color};margin:4mm 0;" />`;
    }
    case "raw":
      return resolveRawFields(block.html);
    case "page-break":
      return `<div class="flow-pagebreak"></div>`;
  }
}

function resolveRawFields(html: string): string {
  if (!html) return "";
  // מחליף <span data-field="key">…</span> בערך שנפתר (או משאיר כפי שהיה)
  return html.replace(
    /<span\b[^>]*\bdata-field=("|')([^"']+)\1[^>]*>([\s\S]*?)<\/span>/gi,
    (match, _q, key, inner) => {
      const resolved = resolveFieldKey(key);
      if (resolved !== undefined) return esc(resolved);
      // Fallback — משאיר את הטקסט שהיה בתוך ה-span (למשל {{key}} או שם השדה)
      return inner || `{{${esc(key)}}}`;
    },
  );
}



function pageSizeCss(page: FlowDocument["page"]): string {
  if (page.size === "none") {
    return "auto";
  }
  if (page.size === "custom") {
    const width = Math.max(50, page.customSizeMm?.width || 210);
    const height = Math.max(50, page.customSizeMm?.height || 297);
    return `${width}mm ${height}mm`;
  }
  return `${page.size}${page.orientation === "landscape" ? " landscape" : ""}`;
}

export function renderFlowToHtml(
  doc: FlowDocument,
  preset?: DesignPresetConfig,
  mergeData?: RendererMergeData,
): string {
  CURRENT_MERGE = mergeData;
  try {
  return _renderFlowToHtmlInner(doc, preset);
  } finally {
    CURRENT_MERGE = undefined;
  }
}

function _renderFlowToHtmlInner(doc: FlowDocument, preset?: DesignPresetConfig): string {
  const { branding: origBranding, page, sections } = doc;
  // Apply preset strip overrides (preset wins over document branding when override=true)
  const stripCfg = preset?.strips;
  const overrideStrips = !!stripCfg?.override;
  const headerMode = overrideStrips ? (stripCfg?.headerMode || "inherit") : "inherit";
  const footerMode = overrideStrips ? (stripCfg?.footerMode || "inherit") : "inherit";
  const branding = overrideStrips
    ? {
        ...origBranding,
        headerStripUrl:
          headerMode === "none" ? "" : headerMode === "custom" ? (stripCfg?.headerStripUrl || origBranding.headerStripUrl) : origBranding.headerStripUrl,
        footerStripUrl:
          footerMode === "none" ? "" : footerMode === "custom" ? (stripCfg?.footerStripUrl || origBranding.footerStripUrl) : origBranding.footerStripUrl,
        headerStripHeight:
          headerMode === "custom" && stripCfg?.headerStripHeightPx ? stripCfg.headerStripHeightPx : (origBranding as any).headerStripHeight,
        footerStripHeight:
          footerMode === "custom" && stripCfg?.footerStripHeightPx ? stripCfg.footerStripHeightPx : (origBranding as any).footerStripHeight,
        stripBgColor: stripCfg?.bgColor || (origBranding as any).stripBgColor,
      }
    : origBranding;
  const m = page.marginMm;
  const hasHeaderStrip = Boolean(branding.headerStripUrl);
  const hasFooterStrip = Boolean(branding.footerStripUrl);
  const headerStripHeightPx = hasHeaderStrip
    ? clampFlowNumber(
        branding.headerStripHeight,
        FLOW_STRIP_LIMITS.headerHeightPx.fallback,
        FLOW_STRIP_LIMITS.headerHeightPx.min,
        FLOW_STRIP_LIMITS.headerHeightPx.max,
      )
    : 0;
  const footerStripHeightPx = hasFooterStrip
    ? clampFlowNumber(
        branding.footerStripHeight,
        FLOW_STRIP_LIMITS.footerHeightPx.fallback,
        FLOW_STRIP_LIMITS.footerHeightPx.min,
        FLOW_STRIP_LIMITS.footerHeightPx.max,
      )
    : 0;
  const headerStripMm = pxToMm(headerStripHeightPx, 150);
  const footerStripMm = pxToMm(footerStripHeightPx, 90);
  const headerContentGapPx = clampFlowNumber(
    branding.headerStripContentGapPx,
    FLOW_STRIP_LIMITS.contentGapPx.fallback,
    FLOW_STRIP_LIMITS.contentGapPx.min,
    FLOW_STRIP_LIMITS.contentGapPx.max,
  );
  const footerContentGapPx = clampFlowNumber(
    branding.footerStripContentGapPx,
    FLOW_STRIP_LIMITS.contentGapPx.fallback,
    FLOW_STRIP_LIMITS.contentGapPx.min,
    FLOW_STRIP_LIMITS.contentGapPx.max,
  );
  const headerContentGapMm = hasHeaderStrip ? pxToMm(headerContentGapPx, 18) : 0;
  const footerContentGapMm = hasFooterStrip ? pxToMm(footerContentGapPx, 18) : 0;
  const headerStripWidthPercent = clampFlowNumber(
    branding.headerStripWidthPercent,
    FLOW_STRIP_LIMITS.widthPercent.fallback,
    FLOW_STRIP_LIMITS.widthPercent.min,
    FLOW_STRIP_LIMITS.widthPercent.max,
  );
  const footerStripWidthPercent = clampFlowNumber(
    branding.footerStripWidthPercent,
    FLOW_STRIP_LIMITS.widthPercent.fallback,
    FLOW_STRIP_LIMITS.widthPercent.min,
    FLOW_STRIP_LIMITS.widthPercent.max,
  );
  const topMargin = hasHeaderStrip ? headerStripMm + headerContentGapMm : m.top;
  const pageNumberReserveMm = page.showPageNumbers && hasFooterStrip ? 7 : 0;
  const bottomMargin = hasFooterStrip
    ? footerStripMm + footerContentGapMm + pageNumberReserveMm
    : m.bottom;
  const stripBgColor = branding.stripBgColor || "#ffffff";

  const sectionsHtml = sections
    .map((sec) => {
      const cls = sec.keepTogether ? "flow-section keep" : "flow-section";
      return `<section class="${cls}" data-section="${esc(sec.id)}">${sec.blocks.map(renderBlock).join("")}</section>`;
    })
    .join("");

  const headerHtml = `
    <div class="running-header ${hasHeaderStrip ? "strip" : ""}">
      ${hasHeaderStrip
        ? `<img class="strip-img" src="${esc(branding.headerStripUrl || "")}" alt="header strip" />`
        : `${branding.logoUrl ? `<img src="${esc(branding.logoUrl)}" alt="logo" />` : ""}
      <div class="rh-text">
        <div class="rh-name">${esc(branding.companyName)}</div>
        ${branding.companySubtitle ? `<div class="rh-sub">${esc(branding.companySubtitle)}</div>` : ""}
      </div>`}
    </div>`;

  const footerHtml = `
    <div class="running-footer ${hasFooterStrip ? "strip" : ""}">
      ${hasFooterStrip
        ? `<img class="strip-img" src="${esc(branding.footerStripUrl || "")}" alt="footer strip" />`
        : `<div class="rf-line">${esc(branding.contactLine || "")}</div>`}
    </div>`;

  return `<!doctype html>
<html dir="rtl" lang="he" class="${hasHeaderStrip ? "flow-has-header-strip" : ""} ${hasFooterStrip ? "flow-has-footer-strip" : ""}">
<head>
<meta charset="utf-8" />
<title>${esc(doc.title)}</title>
<style>
  /* ===== Paged Media setup ===== */
  @page {
    size: ${pageSizeCss(page)};
    margin: ${mmCss(topMargin)}mm 0mm ${mmCss(bottomMargin)}mm 0mm;
    @top-center { content: element(runHeader); }
    @bottom-center { content: element(runFooter); }
  }
  ${page.showPageNumbers ? `
  .pagedjs_sheet { position: relative; }
  .pagedjs_sheet::after {
    content: "עמוד " attr(data-page-number);
    position: absolute;
    bottom: ${mmCss(hasFooterStrip ? footerStripMm + 2 : 4)}mm;
    right: 6mm;
    z-index: 9999;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 38px;
    height: 20px;
    padding: 0 8px;
    border: 1px solid rgba(22, 44, 88, 0.16);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.84);
    color: #162c58;
    font-family: ${branding.fontFamily};
    font-size: 11px;
    line-height: 1;
    white-space: nowrap;
    pointer-events: none;
  }` : ""}

  /* ===== Running elements (header/footer חוזרים בכל עמוד) ===== */
  .running-header {
    position: running(runHeader);
    display: flex; align-items: center; gap: 12px;
    border-bottom: 2px solid ${branding.accentColor};
    padding: 4mm 0;
    direction: rtl;
  }
  .running-header img { max-height: 16mm; width: auto; }
  .running-header.strip {
    display: block;
    width: 100%;
     height: ${mmCss(headerStripMm)}mm;
    margin-left: 0;
    margin-right: 0;
    overflow: hidden;
    padding: 0;
    border-bottom: 0;
    background: ${stripBgColor};
  }
  .running-header.strip .strip-img {
    display: block;
    width: ${headerStripWidthPercent}%;
     height: ${mmCss(headerStripMm)}mm;
    margin-left: auto;
    margin-right: auto;
    max-height: none;
    object-fit: fill;
    object-position: center;
  }
  .flow-has-header-strip .pagedjs_margin-top,
  .flow-has-header-strip .pagedjs_margin-top-center {
    grid-column: 1 / -1 !important;
    width: var(--pagedjs-pagebox-width) !important;
    max-width: none !important;
  }
  .rh-name { font-weight: 700; color: ${branding.primaryColor}; font-size: 12pt; }
  .rh-sub  { color: #555; font-size: 9pt; }

  .running-footer {
    position: running(runFooter);
    border-top: 1px solid ${branding.accentColor};
    padding: 3mm 0; text-align: center;
    color: #666; font-size: 9pt; direction: rtl;
  }
  .running-footer.strip {
    width: 100%;
     height: ${mmCss(footerStripMm)}mm;
    margin-left: 0;
    margin-right: 0;
    overflow: hidden;
    padding: 0;
    border-top: 0;
    background: ${stripBgColor};
  }
  .running-footer.strip .strip-img {
    display: block;
    width: ${footerStripWidthPercent}%;
     height: ${mmCss(footerStripMm)}mm;
    margin-left: auto;
    margin-right: auto;
    object-fit: fill;
    object-position: center;
  }
  .flow-has-footer-strip .pagedjs_margin-bottom,
  .flow-has-footer-strip .pagedjs_margin-bottom-center {
    grid-column: 1 / -1 !important;
    width: var(--pagedjs-pagebox-width) !important;
    max-width: none !important;
  }


  /* ===== Document body (זורם) ===== */
  html, body {
    margin: 0; padding: 0;
    font-family: ${branding.fontFamily};
    color: #1a1a1a;
    direction: rtl;
    text-align: right;
    font-size: 11pt;
    line-height: 1.55;
    /* קריטי: שומר על צבעים, רקעים וגרדיאנטים בהדפסה ל-PDF */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }
  /* גרדיאנטים, רקעים וצבעי טקסט נשמרים בכל אלמנט */
  *, *::before, *::after {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* ספאן עם גרדיאנט טקסט (data-gradient) — fallback בטוח גם אם clip לא נתמך */
  span[data-gradient] {
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    color: transparent !important;
  }

  .flow-section { break-inside: auto; margin-bottom: 6mm; }
  .flow-section.keep { break-inside: avoid; }
  .pagedjs_pages,
  .pagedjs_page,
  .pagedjs_sheet,
  .pagedjs_pagebox,
  .pagedjs_area,
  .pagedjs_page_content,
  .pagedjs_page_content > div {
    direction: ltr;
  }
  .flow-doc,
  .flow-section {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-wrap: break-word;
  }
  .flow-doc {
    direction: rtl;
    text-align: right;
    padding-left: ${m.left}mm;
    padding-right: ${m.right}mm;
  }
  .flow-doc *,
  .flow-doc *::before,
  .flow-doc *::after {
    box-sizing: border-box;
    max-width: 100%;
  }
  .flow-doc img,
  .flow-doc svg,
  .flow-doc canvas,
  .flow-doc video {
    display: block;
    max-width: 100% !important;
    height: auto !important;
  }
  .flow-doc pre,
  .flow-doc code {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .flow-h { color: ${branding.primaryColor}; margin: 4mm 0 2mm; break-after: avoid; }
  .flow-h1 { font-size: 20pt; padding-bottom: 2mm; }
  .flow-h2 { font-size: 14pt; }
  .flow-h3 { font-size: 12pt; }

  .flow-p { margin: 0 0 2mm; orphans: 3; widows: 3; direction: rtl; text-align: right; }
  .flow-list { margin: 0 0 3mm; padding-inline-start: 6mm; direction: rtl; text-align: right; }
  .flow-list li { margin-bottom: 1mm; }

  .flow-table { width: 100% !important; max-width: 100% !important; table-layout: fixed; border-collapse: collapse; margin: 2mm 0 4mm; direction: rtl; }
  .flow-table th, .flow-table td {
    border: 1px solid #ddd; padding: 2mm 3mm; text-align: right; font-size: 10pt;
    overflow-wrap: anywhere; word-break: normal;
  }
  .flow-table th { background: ${branding.primaryColor}; color: #fff; }
  .flow-table.breakable { break-inside: auto; }
  .flow-table thead { display: table-header-group; } /* חוזר בכל עמוד */
  .flow-table tr { break-inside: avoid; }

  .flow-divider { border: 0; border-top: 1px dashed #ccc; margin: 4mm 0; }
  .flow-pagebreak { break-after: page; }

  /* Baseline styling for frames/callouts/blockquote (preset extras override below) */
  .flow-frame {
    border: 1px solid ${branding.accentColor};
    border-radius: 6px;
    padding: 3mm 4mm;
    margin: 3mm 0;
    background: transparent;
  }
  .flow-frame > :last-child { margin-bottom: 0; }
  .flow-callout {
    background: ${branding.accentColor}1a;
    border: 1px solid ${branding.accentColor};
    border-right: 4px solid ${branding.accentColor};
    padding: 3mm 4mm;
    border-radius: 6px;
    margin: 3mm 0;
  }
  .flow-callout > :last-child { margin-bottom: 0; }
  blockquote {
    border-right: 3px solid ${branding.accentColor};
    padding: 1mm 4mm;
    margin: 3mm 0;
    color: #555;
    font-style: italic;
    background: transparent;
  }
  blockquote > :last-child { margin-bottom: 0; }

  .fld {
    display: inline-block; padding: 0 4px; border-radius: 3px;
    background: ${branding.accentColor}22; color: ${branding.primaryColor};
    font-size: 0.92em;
  }
  ${preset ? `
  /* ===== Design Preset override ===== */
  body { font-family: ${preset.fonts.body}; font-size: ${preset.fonts.size}; line-height: ${preset.spacing.lineHeight}; color: ${preset.colors.text}; }
  .flow-h { color: ${preset.colors.heading}; font-family: ${preset.fonts.heading}; }
  .flow-h1 { font-size: ${preset.headings.h1.size}; font-weight: ${preset.headings.h1.weight}; }
  .flow-h2 { font-size: ${preset.headings.h2.size}; font-weight: ${preset.headings.h2.weight}; }
  .flow-p { margin: 0 0 ${preset.spacing.paragraphGap}; }
  .flow-table th, .flow-table td { border-color: ${preset.table?.borderColor || "#ddd"}; padding: ${preset.table?.padding || "2mm 3mm"}; font-size: ${preset.table?.fontSize || "10pt"}; }
  .flow-table th { background: ${preset.table?.headerBg || preset.colors.heading}; color: ${preset.table?.headerText || "#fff"}; }
  ${preset.table?.rowAltBg ? `.flow-table tbody tr:nth-child(even) td { background: ${preset.table.rowAltBg}; }` : ""}
  .flow-table tbody tr:last-child td { font-weight: 700; background: ${preset.colors.accent}22; }
  .rh-name { color: ${preset.colors.heading}; }
  .running-header { border-bottom-color: ${preset.colors.accent}; }
  .running-footer { border-top-color: ${preset.colors.accent}; color: ${preset.colors.muted}; }
  .fld { background: ${preset.colors.accent}22; color: ${preset.colors.heading}; }
  ` : `.flow-table tbody tr:last-child td { font-weight: 700; background: ${branding.accentColor}22; }`}
  ${buildPresetExtraCss(preset, "")}
</style>
</head>
<body>
${headerHtml}
${footerHtml}
<main class="flow-doc">
${sectionsHtml}
</main>
</body>
</html>`;
}
