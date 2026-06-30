// סנכרון אוטומטי של מקטע "לוח תשלומים" בעורך Flow מתוך התבנית.
// כל שינוי ב-payment_schedule / base_price / vat_rate בטאב "תוכן"
// משוקף מיד בעורך, גם אם כבר קיימת טיוטה שמורה.

import type { QuoteTemplate } from "../types";
import { serializeTemplate } from "./serializer";
import { flowDocToEditableHtml } from "./editor/templateToHtml";
import type { ProjectTokenData } from "./projectTokens";

const PAYMENTS_HEADING_RE = /^\s*לוח\s+תשלומים/;

/** בונה רק את ה-HTML של מקטע לוח התשלומים (heading + ol) מהתבנית. */
export function buildPaymentsHtml(
  template: QuoteTemplate,
  opts?: {
    preserveItemStyling?: boolean;
    projectDetails?: ProjectTokenData;
    paymentsLayout?: "list" | "table" | "both";
  },
): string {
  if (!template.payment_schedule || !template.payment_schedule.length) return "";
  const doc = serializeTemplate(template, undefined, {
    preserveItemStyling: opts?.preserveItemStyling,
    projectDetails: opts?.projectDetails,
    keepFieldsAsPlaceholders: true,
    paymentsLayout: opts?.paymentsLayout,
  });
  const payments = doc.sections.find((s) => s.id === "payments");
  if (!payments) return "";
  return flowDocToEditableHtml({ ...doc, sections: [payments] });
}

/** מחתימה ייצוגית של תשלומים — לזיהוי שינויים בטאב "תוכן". */
export function paymentsSignature(template: QuoteTemplate): string {
  return JSON.stringify({
    ps: template.payment_schedule || [],
    bp: template.base_price ?? null,
    vr: template.vat_rate ?? null,
    sv: template.show_vat !== false,
  });
}

/**
 * מחליף בתוך ה-HTML הקיים את מקטע לוח התשלומים בגרסה טרייה מהתבנית.
 * אם המקטע לא קיים — מוסיף בסוף. אם אין תשלומים בתבנית — מסיר את הקיים.
 */
export function syncPaymentsSection(
  html: string,
  template: QuoteTemplate,
  opts?: {
    preserveItemStyling?: boolean;
    projectDetails?: ProjectTokenData;
    paymentsLayout?: "list" | "table" | "both";
  },
): string {
  const fresh = buildPaymentsHtml(template, opts);
  try {
    const dom = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
    const root = dom.getElementById("root");
    if (!root) return fresh ? html + fresh : html;

    // 1) אם קיים גוש תשלומים נגרר — מחליפים את התוכן הפנימי שלו במקום (שמירת מיקום)
    const existingBlock = root.querySelector('[data-payments-block]') as HTMLElement | null;
    if (existingBlock) {
      if (!fresh) {
        existingBlock.remove();
        return root.innerHTML;
      }
      // fresh מגיע כ-<div data-payments-block>...</div>; חולצים את התוכן הפנימי
      const tmp = dom.createElement("div");
      tmp.innerHTML = fresh;
      const freshBlock = tmp.querySelector('[data-payments-block]') as HTMLElement | null;
      existingBlock.innerHTML = freshBlock ? freshBlock.innerHTML : fresh;
      return root.innerHTML;
    }

    // 2) גרסה ישנה ללא גוש — מסירים heading + רשימה/טבלה צמודים
    const headings = Array.from(root.querySelectorAll("h1,h2,h3,h4"));
    const heading = headings.find((h) =>
      PAYMENTS_HEADING_RE.test((h.textContent || "").replace(/\s+/g, " ").trim()),
    );
    if (heading) {
      let next = heading.nextElementSibling;
      heading.remove();
      while (next && (next.tagName === "OL" || next.tagName === "UL" || next.tagName === "TABLE")) {
        const after = next.nextElementSibling;
        next.remove();
        next = after;
      }
    }

    if (!fresh) return root.innerHTML;

    // 3) הוספה ראשונית בסוף — בפעם הבאה כבר יהיה גוש נגרר במיקום שהמשתמש בחר
    const wrap = dom.createElement("div");
    wrap.innerHTML = fresh;
    Array.from(wrap.childNodes).forEach((n) => root.appendChild(n));
    return root.innerHTML;
  } catch {
    return html;
  }
}

