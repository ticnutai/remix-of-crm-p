// HTML מהעורך → FlowDocument, כדי שה-renderer הקיים יעמד אותו.
// מקור ה-branding/page נשאר מהתבנית (serializeTemplate משמש לקבלת ה-shell בלבד).

import type { QuoteTemplate } from "../../types";
import { serializeTemplate } from "../serializer";
import type { FlowBlock, FlowDocument, FlowInline } from "../types";

function parseInlines(node: Node): FlowInline[] {
  const out: FlowInline[] = [];
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const txt = child.textContent || "";
      if (txt) out.push({ type: "text", text: txt });
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "span" && el.hasAttribute("data-field")) {
      out.push({ type: "field", key: el.getAttribute("data-field") || "" });
      return;
    }
    const childInlines = parseInlines(el);
    if (tag === "strong" || tag === "b") {
      childInlines.forEach((n) => n.type === "text" && (n.bold = true));
    }
    if (tag === "em" || tag === "i") {
      childInlines.forEach((n) => n.type === "text" && (n.italic = true));
    }
    if (tag === "span" && el.style?.color) {
      childInlines.forEach((n) => n.type === "text" && (n.color = el.style.color));
    }
    out.push(...childInlines);
  });
  return out;
}

function elementToBlock(el: HTMLElement): FlowBlock | FlowBlock[] | null {
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case "h1":
    case "h2":
    case "h3": {
      const level = Number(tag[1]) as 1 | 2 | 3;
      return { type: "heading", level, content: parseInlines(el) };
    }
    case "p": {
      const align = (el.style.textAlign as "right" | "center" | "left") || "right";
      const content = parseInlines(el);
      if (!content.length || content.every((n) => n.type === "text" && !n.text.trim())) {
        return { type: "spacer", mm: 2 };
      }
      return { type: "paragraph", content, align };
    }
    case "ul":
    case "ol": {
      const items: FlowInline[][] = [];
      el.querySelectorAll(":scope > li").forEach((li) => items.push(parseInlines(li)));
      return { type: "list", ordered: tag === "ol", items };
    }
    case "table": {
      const headers: string[] = [];
      el.querySelectorAll(":scope > thead > tr > th").forEach((th) =>
        headers.push(th.textContent || ""),
      );
      const rows: string[][] = [];
      el.querySelectorAll(":scope > tbody > tr").forEach((tr) => {
        const row: string[] = [];
        tr.querySelectorAll(":scope > td").forEach((td) => row.push(td.textContent || ""));
        rows.push(row);
      });
      return { type: "table", headers, rows, breakable: true };
    }
    case "hr": {
      if (el.getAttribute("data-pagebreak") === "1") return { type: "page-break" };
      return { type: "divider" };
    }
    default:
      return null;
  }
}

export function htmlToFlowDoc(html: string, template: QuoteTemplate): FlowDocument {
  const shell = serializeTemplate(template);
  const parser = new DOMParser();
  const dom = parser.parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = dom.getElementById("root");
  const blocks: FlowBlock[] = [];
  if (root) {
    root.childNodes.forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const res = elementToBlock(child as HTMLElement);
      if (!res) return;
      if (Array.isArray(res)) blocks.push(...res);
      else blocks.push(res);
    });
  }
  return {
    ...shell,
    sections: [{ id: "edited", blocks }],
  };
}
