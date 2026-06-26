// Flow Engine — Layer 3: Renderer
// קלט: FlowDocument זורם.
// פלט: מסמך HTML עצמאי שמוזן ל-iframe ועובר את Paged.js polyfill.
//
// העיקרון: HTML זורם לחלוטין. הסטריפים והלוגו מוגדרים אך ורק דרך
// `position: running()` ו-`@page` — ככה Paged.js מטפל בהם אוטומטית בכל עמוד,
// בלי clip-path, בלי safe masks, בלי overlays.

import type { FlowBlock, FlowDocument, FlowInline } from "./types";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function renderInline(node: FlowInline): string {
  if (node.type === "field") {
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

export function renderFlowToHtml(doc: FlowDocument): string {
  const { branding, page, sections } = doc;
  const m = page.marginMm;

  const sectionsHtml = sections
    .map((sec) => {
      const cls = sec.keepTogether ? "flow-section keep" : "flow-section";
      return `<section class="${cls}" data-section="${esc(sec.id)}">${sec.blocks.map(renderBlock).join("")}</section>`;
    })
    .join("");

  const headerHtml = `
    <div class="running-header">
      ${branding.logoUrl ? `<img src="${esc(branding.logoUrl)}" alt="logo" />` : ""}
      <div class="rh-text">
        <div class="rh-name">${esc(branding.companyName)}</div>
        ${branding.companySubtitle ? `<div class="rh-sub">${esc(branding.companySubtitle)}</div>` : ""}
      </div>
    </div>`;

  const footerHtml = `
    <div class="running-footer">
      <div class="rf-line">${esc(branding.contactLine || "")}</div>
    </div>`;

  return `<!doctype html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<title>${esc(doc.title)}</title>
<style>
  /* ===== Paged Media setup ===== */
  @page {
    size: ${page.size};
    margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm;
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
  .rh-name { font-weight: 700; color: ${branding.primaryColor}; font-size: 12pt; }
  .rh-sub  { color: #555; font-size: 9pt; }

  .running-footer {
    position: running(runFooter);
    border-top: 1px solid ${branding.accentColor};
    padding: 3mm 0; text-align: center;
    color: #666; font-size: 9pt; direction: rtl;
  }

  /* ===== Document body (זורם) ===== */
  html, body {
    margin: 0; padding: 0;
    font-family: ${branding.fontFamily};
    color: #1a1a1a;
    direction: rtl;
    font-size: 11pt;
    line-height: 1.55;
  }

  .flow-section { break-inside: auto; margin-bottom: 6mm; }
  .flow-section.keep { break-inside: avoid; }

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
