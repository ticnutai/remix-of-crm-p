// HTML מהעורך → FlowDocument, כדי שה-renderer הקיים יעמד אותו.
// מקור ה-branding/page נשאר מהתבנית (serializeTemplate משמש לקבלת ה-shell בלבד).

import type { QuoteTemplate } from "../../types";
import { serializeTemplate } from "../serializer";
import type { FlowBlock, FlowDocument, FlowInline } from "../types";

// תגיות שיש להן מטפל ייעודי ב-FlowInline (text/bold/italic/color/field)
const SIMPLE_WRAPPERS = new Set(["strong", "b", "em", "i"]);

function isPlainColorSpan(el: HTMLElement): boolean {
  // span רגיל עם color בלבד — נמופה ל-FlowInline.color
  if (el.tagName.toLowerCase() !== "span") return false;
  if (el.hasAttribute("data-field")) return false;
  const style = el.getAttribute("style") || "";
  if (!style) return false;
  // יש color אבל אין מאפיין אחר משמעותי
  const hasColor = /(^|;)\s*color\s*:/.test(style);
  const hasOther = /(font-|letter-|word-|background|text-decoration|gradient)/i.test(style);
  return hasColor && !hasOther;
}

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

    if (SIMPLE_WRAPPERS.has(tag)) {
      const childInlines = parseInlines(el);
      if (tag === "strong" || tag === "b") {
        childInlines.forEach((n) => n.type === "text" && (n.bold = true));
      } else {
        childInlines.forEach((n) => n.type === "text" && (n.italic = true));
      }
      out.push(...childInlines);
      return;
    }

    if (isPlainColorSpan(el)) {
      const childInlines = parseInlines(el);
      childInlines.forEach((n) => n.type === "text" && (n.color = el.style.color));
      out.push(...childInlines);
      return;
    }

    // כל השאר (u, mark, span עם font-family/font-size/letter-spacing/word-spacing/גרדיאנט וכו') —
    // שמור כ-HTML גולמי כדי שהעיצוב יישמר בתצוגה המקדימה וב-PDF
    if (el.outerHTML) {
      out.push({ type: "raw", html: el.outerHTML });
    } else {
      out.push(...parseInlines(el));
    }
  });
  return out;
}

function elementToBlock(el: HTMLElement): FlowBlock | FlowBlock[] | null {
  const tag = el.tagName.toLowerCase();
  const cls = el.getAttribute("class") || "";
  // מסגרות/הדגשות/ציטוטים → שמור כ-raw כדי שה-class יגיע ל-Paged.js
  if (
    tag === "blockquote" ||
    (tag === "div" && /(^|\s)(flow-frame|flow-callout)(\s|$)/.test(cls))
  ) {
    return { type: "raw", html: el.outerHTML };
  }
  switch (tag) {
    case "h1":
    case "h2":
    case "h3": {
      const level = Number(tag[1]) as 1 | 2 | 3;
      const align = (el.style.textAlign as "right" | "center" | "left") || undefined;
      return { type: "heading", level, content: parseInlines(el), align };
    }
    case "p": {
      const align = (el.style.textAlign as "right" | "center" | "left") || "right";
      const content = parseInlines(el);
      if (!content.length || content.every((n) => n.type === "text" && !n.text.trim())) {
        // שורה ריקה בעורך תופסת שורת טקסט מלאה (<p><br></p>) — משמרים אותו גובה
        // בתצוגה (&nbsp;), אחרת העימוד נשבר במקומות שונים.
        return { type: "paragraph", content: [{ type: "raw", html: "&nbsp;" }], align };
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
      // קווים ניתנים לעריכה: שומרים צבע/עובי/סגנון אם הוגדרו ב-inline style
      const styleAttr = el.getAttribute("style") || "";
      const colorMatch = styleAttr.match(/border(?:-top)?-color\s*:\s*([^;]+)/i);
      const widthMatch = styleAttr.match(/border(?:-top)?-width\s*:\s*([0-9.]+)px/i);
      const styleMatch = styleAttr.match(/border(?:-top)?-style\s*:\s*(solid|dashed|dotted|double)/i);
      return {
        type: "divider",
        color: colorMatch ? colorMatch[1].trim() : undefined,
        thickness: widthMatch ? Number(widthMatch[1]) : undefined,
        style: (styleMatch ? (styleMatch[1].toLowerCase() as any) : undefined),
      };
    }
    case "div": {
      // div כללי (למשל data-payments-block) — נכנס פנימה ומפענח כל ילד כבלוק
      const out: FlowBlock[] = [];
      el.childNodes.forEach((child) => {
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        const r = elementToBlock(child as HTMLElement);
        if (!r) return;
        if (Array.isArray(r)) out.push(...r);
        else out.push(r);
      });
      return out.length ? out : null;
    }
    default:
      return null;
  }
}

export function htmlToFlowDoc(
  html: string,
  template: QuoteTemplate,
  opts?: { designSettings?: any },
): FlowDocument {
  const shell = serializeTemplate(template, undefined, { designSettings: opts?.designSettings });
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
