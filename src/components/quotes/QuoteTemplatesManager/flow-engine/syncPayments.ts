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
  opts?: { preserveItemStyling?: boolean; projectDetails?: ProjectTokenData },
): string {
  const fresh = buildPaymentsHtml(template, opts);
  try {
    const dom = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
    const root = dom.getElementById("root");
    if (!root) return fresh ? html + fresh : html;

    // מצא heading קיים של "לוח תשלומים" + הרשימה שאחריו, והסר.
    const headings = Array.from(root.querySelectorAll("h1,h2,h3,h4"));
    const heading = headings.find((h) =>
      PAYMENTS_HEADING_RE.test((h.textContent || "").replace(/\s+/g, " ").trim()),
    );
    if (heading) {
      const next = heading.nextElementSibling;
      heading.remove();
      if (next && (next.tagName === "OL" || next.tagName === "UL")) next.remove();
    }

    if (!fresh) return root.innerHTML;

    // הוסף את המקטע הטרי בסוף (או במקום הישן אם רוצים — לפשטות, בסוף).
    const wrap = dom.createElement("div");
    wrap.innerHTML = fresh;
    Array.from(wrap.childNodes).forEach((n) => root.appendChild(n));
    return root.innerHTML;
  } catch {
    return html;
  }
}
