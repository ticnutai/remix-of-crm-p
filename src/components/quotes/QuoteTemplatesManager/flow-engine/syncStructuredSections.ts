import type { QuoteTemplate } from "../types";
import { templateToEditableHtml } from "./editor/templateToHtml";
import type { ProjectTokenData } from "./projectTokens";

type SyncOptions = {
  preserveItemStyling?: boolean;
  projectDetails?: ProjectTokenData;
  paymentsLayout?: "list" | "table" | "both";
};

function protectedKey(element: Element) {
  if (element.hasAttribute("data-payments-block")) return "payments";
  return element.getAttribute("data-computed-block") || "";
}

function protectedElements(root: Element) {
  return Array.from(root.querySelectorAll("[data-payments-block],[data-computed-block]"));
}

/** Refresh calculated sections without touching user-edited prose or formatting. */
export function syncStructuredSections(
  html: string,
  template: QuoteTemplate,
  opts?: SyncOptions,
): string {
  const freshHtml = templateToEditableHtml(template, {
    preserveItemStyling: opts?.preserveItemStyling,
    projectDetails: opts?.projectDetails,
    keepFieldsAsPlaceholders: true,
    paymentsLayout: opts?.paymentsLayout,
    lockComputedSections: true,
  });

  try {
    const parser = new DOMParser();
    const currentDocument = parser.parseFromString(`<div id="root">${html}</div>`, "text/html");
    const freshDocument = parser.parseFromString(`<div id="root">${freshHtml}</div>`, "text/html");
    const currentRoot = currentDocument.getElementById("root");
    const freshRoot = freshDocument.getElementById("root");
    if (!currentRoot || !freshRoot) return freshHtml;

    const freshByKey = new Map(
      protectedElements(freshRoot).map((element) => [protectedKey(element), element]),
    );
    const currentByKey = new Map(
      protectedElements(currentRoot).map((element) => [protectedKey(element), element]),
    );

    currentByKey.forEach((element, key) => {
      const fresh = freshByKey.get(key);
      if (!fresh) {
        element.remove();
        return;
      }
      element.replaceWith(currentDocument.importNode(fresh, true));
    });

    freshByKey.forEach((element, key) => {
      if (!currentByKey.has(key)) currentRoot.appendChild(currentDocument.importNode(element, true));
    });

    return currentRoot.innerHTML;
  } catch {
    return html || freshHtml;
  }
}

export function structuredSectionsSignature(template: QuoteTemplate) {
  return JSON.stringify({
    items: template.items || [],
    payments: template.payment_schedule || [],
    basePrice: template.base_price ?? null,
    vatRate: template.vat_rate ?? null,
    showVat: template.show_vat !== false,
    pricingTiers: (template as any).pricing_tiers || [],
    selectedTier: (template as any).selected_tier || null,
    upgrades: (template as any).upgrades || [],
  });
}
