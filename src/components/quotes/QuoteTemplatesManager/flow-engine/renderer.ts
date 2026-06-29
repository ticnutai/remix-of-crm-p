// Flow Engine — Layer 3: Renderer
// קלט: FlowDocument זורם.
// פלט: מסמך HTML עצמאי שמוזן ל-iframe ועובר את Paged.js polyfill.
//
// העיקרון: HTML זורם לחלוטין. הסטריפים והלוגו מוגדרים אך ורק דרך
// `position: running()` ו-`@page` — ככה Paged.js מטפל בהם אוטומטית בכל עמוד,
// בלי clip-path, בלי safe masks, בלי overlays.

import type { FlowBlock, FlowDocument, FlowInline } from "./types";
import type { DesignPresetConfig } from "./presets/types";

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
    case "heading":
      return `<h${block.level} class="flow-h flow-h${block.level}">${renderInlines(block.content)}</h${block.level}>`;
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
    case "divider":
      return `<hr class="flow-divider" />`;
    case "page-break":
      return `<div class="flow-pagebreak"></div>`;
  }
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
  const { branding, page, sections } = doc;
  const m = page.marginMm;
  const hasHeaderStrip = Boolean(branding.headerStripUrl);
  const hasFooterStrip = Boolean(branding.footerStripUrl);
  const headerStripMm = Math.max(8, Math.round((Number(branding.headerStripHeight) || 150) * 0.264583));
  const footerStripMm = Math.max(8, Math.round((Number(branding.footerStripHeight) || 90) * 0.264583));
  const headerStripWidthPercent = Math.max(20, Math.min(100, Math.round(Number(branding.headerStripWidthPercent) || 100)));
  const footerStripWidthPercent = Math.max(20, Math.min(100, Math.round(Number(branding.footerStripWidthPercent) || 100)));
  const topMargin = Math.max(m.top, hasHeaderStrip ? headerStripMm + 6 : m.top);
  const bottomMargin = Math.max(m.bottom, hasFooterStrip ? footerStripMm + 5 : m.bottom);
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
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<title>${esc(doc.title)}</title>
<style>
  /* ===== Paged Media setup ===== */
  @page {
    size: ${pageSizeCss(page)};
    margin: ${topMargin}mm ${m.right}mm ${bottomMargin}mm ${m.left}mm;
    @top-center { content: element(runHeader); }
    @bottom-center { content: element(runFooter); }
    ${page.showPageNumbers ? `@bottom-left { content: counter(page) " / " counter(pages); font-family: ${branding.fontFamily}; font-size: 9pt; color: #888; }` : ""}
  }

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
    width: calc(100% + ${m.left + m.right}mm);
    height: ${headerStripMm}mm;
    margin-left: -${m.left}mm;
    margin-right: -${m.right}mm;
    overflow: hidden;
    padding: 0;
    border-bottom: 0;
    background: ${stripBgColor};
  }
  .running-header.strip .strip-img {
    display: block;
    width: ${headerStripWidthPercent}%;
    height: ${headerStripMm}mm;
    margin-left: auto;
    margin-right: auto;
    max-height: none;
    object-fit: fill;
    object-position: center;
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
    width: calc(100% + ${m.left + m.right}mm);
    height: ${footerStripMm}mm;
    margin-left: -${m.left}mm;
    margin-right: -${m.right}mm;
    overflow: hidden;
    padding: 0;
    border-top: 0;
    background: ${stripBgColor};
  }
  .running-footer.strip .strip-img {
    display: block;
    width: ${footerStripWidthPercent}%;
    height: ${footerStripMm}mm;
    margin-left: auto;
    margin-right: auto;
    object-fit: fill;
    object-position: center;
  }

  /* ===== Document body (זורם) ===== */
  html, body {
    margin: 0; padding: 0;
    font-family: ${branding.fontFamily};
    color: #1a1a1a;
    direction: ltr;
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
  }

  .flow-h { color: ${branding.primaryColor}; margin: 4mm 0 2mm; break-after: avoid; }
  .flow-h1 { font-size: 20pt; border-bottom: 2px solid ${branding.accentColor}; padding-bottom: 2mm; }
  .flow-h2 { font-size: 14pt; }
  .flow-h3 { font-size: 12pt; }

  .flow-p { margin: 0 0 2mm; orphans: 3; widows: 3; }
  .flow-list { margin: 0 0 3mm; padding-inline-start: 6mm; }
  .flow-list li { margin-bottom: 1mm; }

  .flow-table { width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; }
  .flow-table th, .flow-table td {
    border: 1px solid #ddd; padding: 2mm 3mm; text-align: right; font-size: 10pt;
  }
  .flow-table th { background: ${branding.primaryColor}; color: #fff; }
  .flow-table.breakable { break-inside: auto; }
  .flow-table thead { display: table-header-group; } /* חוזר בכל עמוד */
  .flow-table tr { break-inside: avoid; }

  .flow-divider { border: 0; border-top: 1px dashed #ccc; margin: 4mm 0; }
  .flow-pagebreak { break-after: page; }

  .fld {
    display: inline-block; padding: 0 4px; border-radius: 3px;
    background: ${branding.accentColor}22; color: ${branding.primaryColor};
    font-size: 0.92em;
  }
  ${preset ? `
  /* ===== Design Preset override ===== */
  body { font-family: ${preset.fonts.body}; font-size: ${preset.fonts.size}; line-height: ${preset.spacing.lineHeight}; color: ${preset.colors.text}; }
  .flow-h { color: ${preset.colors.heading}; font-family: ${preset.fonts.heading}; }
  .flow-h1 { font-size: ${preset.headings.h1.size}; font-weight: ${preset.headings.h1.weight}; border-bottom-color: ${preset.colors.accent}; }
  .flow-h2 { font-size: ${preset.headings.h2.size}; font-weight: ${preset.headings.h2.weight}; }
  .flow-p { margin: 0 0 ${preset.spacing.paragraphGap}; }
  .flow-table th { background: ${preset.colors.heading}; }
  .rh-name { color: ${preset.colors.heading}; }
  .running-header { border-bottom-color: ${preset.colors.accent}; }
  .running-footer { border-top-color: ${preset.colors.accent}; color: ${preset.colors.muted}; }
  .fld { background: ${preset.colors.accent}22; color: ${preset.colors.heading}; }
  ` : ""}
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
