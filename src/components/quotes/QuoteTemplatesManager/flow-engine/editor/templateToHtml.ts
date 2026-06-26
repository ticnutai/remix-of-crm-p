// המרה חד-פעמית: QuoteTemplate → HTML זורם נקי לעורך.
// משתמש ב-serializer הקיים כדי להישאר עקבי, ואז ממיר FlowDocument ל-HTML פשוט.

import type { QuoteTemplate } from "../../types";
import { serializeTemplate } from "../serializer";
import type { FlowBlock, FlowDocument, FlowInline } from "../types";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function inlineToHtml(node: FlowInline): string {
  if (node.type === "field") {
    return `<span data-field="${esc(node.key)}">{{${esc(node.key)}}}</span>`;
  }
  if (node.type === "raw") {
    return node.html;
  }
  // טקסט: אם מכיל {{...}} — פיצול לצ׳יפס שדה דינמי
  const parts: string[] = [];
  const regex = /\{\{\s*([^}\s]+)\s*\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(node.text)) !== null) {
    if (m.index > last) parts.push(esc(node.text.slice(last, m.index)));
    parts.push(`<span data-field="${esc(m[1])}">{{${esc(m[1])}}}</span>`);
    last = m.index + m[0].length;
  }
  if (last < node.text.length) parts.push(esc(node.text.slice(last)));
  let html = parts.join("");
  if (node.bold) html = `<strong>${html}</strong>`;
  if (node.italic) html = `<em>${html}</em>`;
  if (node.color) html = `<span style="color:${esc(node.color)}">${html}</span>`;
  return html;
}

function blockToHtml(block: FlowBlock): string {
  switch (block.type) {
    case "heading":
      return `<h${block.level}>${block.content.map(inlineToHtml).join("")}</h${block.level}>`;
    case "paragraph":
      return `<p style="text-align:${block.align || "right"}">${block.content.map(inlineToHtml).join("")}</p>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      return `<${tag}>${block.items.map((line) => `<li>${line.map(inlineToHtml).join("")}</li>`).join("")}</${tag}>`;
    }
    case "table": {
      const head = `<thead><tr>${block.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`;
      const body = `<tbody>${block.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      return `<table>${head}${body}</table>`;
    }
    case "spacer":
      return `<p>&nbsp;</p>`;
    case "divider":
      return `<hr />`;
    case "page-break":
      return `<hr data-pagebreak="1" />`;
  }
}

export function flowDocToEditableHtml(doc: FlowDocument): string {
  return doc.sections
    .map((s) => s.blocks.map(blockToHtml).join(""))
    .join("");
}

export function templateToEditableHtml(template: QuoteTemplate): string {
  const doc = serializeTemplate(template);
  return flowDocToEditableHtml(doc);
}
