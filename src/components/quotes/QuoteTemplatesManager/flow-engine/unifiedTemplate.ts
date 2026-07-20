import type { QuoteTemplate } from "../types";

export type RichPaymentStep = {
  id: string;
  name?: string;
  percentage: number;
  description?: string;
  vatRate?: number;
  useCustomVat?: boolean;
  linkSource?: "stage_template" | "quote_template";
  templateStageId?: string;
  templateStageName?: string;
  templateTaskId?: string;
  templateTaskName?: string;
  quoteTemplateStageId?: string;
  quoteTemplateStageName?: string;
  quoteTemplateItemId?: string;
  quoteTemplateItemText?: string;
  triggerMode?: "manual" | "date" | "task_completion";
  triggerDate?: string | null;
};

/**
 * The old free-form Flow editor stored a complete HTML document in design settings.
 * Keeping it after structured fields change makes an old snapshot override payments,
 * stages and branding. Structured data is now the canonical source.
 */
export function stripLegacyFlowOverrides<T extends Record<string, any> | null | undefined>(settings: T): T {
  if (!settings || typeof settings !== "object") return settings;
  const next = { ...settings } as Record<string, any>;
  delete next.flowV2OverrideHtml;
  delete next.flow_v2_override_html;
  return next as T;
}

/**
 * Older document imports sometimes parsed the VAT summary row as an additional
 * payment (for example 100% of real milestones + an 18% "VAT" milestone), and
 * copied the historical calculated amount into the milestone name. Repair only
 * that unambiguous legacy shape so genuine custom schedules stay untouched.
 */
export function normalizeLegacyPaymentSteps<T extends RichPaymentStep>(
  steps: T[],
  defaultVatRate?: number,
): T[] {
  const cleanTrailingAmount = (value?: string) =>
    value?.replace(/\s*₪\s*[\d,.]+\s*$/u, "").trim();
  const total = steps.reduce((sum, step) => sum + (Number(step.percentage) || 0), 0);
  const vatRate = Number(defaultVatRate);
  const legacyVatIndex = steps.findIndex((step) => {
    const label = String(step.description || step.name || "")
      .replace(/[\s"'׳״()]/g, "")
      .toLowerCase();
    const percentage = Number(step.percentage) || 0;
    const leavesOneHundred = Math.abs(total - percentage - 100) < 0.01;
    const matchesVatRate = !Number.isFinite(vatRate) || Math.abs(percentage - vatRate) < 0.01;
    return total > 100 && leavesOneHundred && matchesVatRate &&
      (label.startsWith("מעמ") || label.startsWith("vat"));
  });

  return steps
    .filter((_, index) => index !== legacyVatIndex)
    .map((step) => ({
      ...step,
      ...(step.name ? { name: cleanTrailingAmount(step.name) } : {}),
      ...(step.description ? { description: cleanTrailingAmount(step.description) } : {}),
    } as T));
}

export function toPaymentSchedule(steps: RichPaymentStep[]) {
  return steps.map((step) => ({
    id: step.id,
    percentage: Number(step.percentage) || 0,
    description: step.description || step.name || "",
    vatRate: step.vatRate,
    useCustomVat: Boolean(step.useCustomVat),
    linkSource: step.linkSource || "stage_template",
    templateStageId: step.templateStageId || null,
    templateStageName: step.templateStageName || null,
    templateTaskId: step.templateTaskId || null,
    templateTaskName: step.templateTaskName || null,
    quoteTemplateStageId: step.quoteTemplateStageId || null,
    quoteTemplateStageName: step.quoteTemplateStageName || null,
    quoteTemplateItemId: step.quoteTemplateItemId || null,
    quoteTemplateItemText: step.quoteTemplateItemText || null,
    triggerMode: step.triggerMode || "manual",
    triggerDate: step.triggerDate || null,
  }));
}

function normalizedLabel(value: unknown) {
  return String(value || "")
    .replace(/\s*₪\s*[\d,.]+\s*$/u, "")
    .replace(/[\s"'׳״():%₪,.\-–—]/g, "")
    .toLowerCase();
}

/**
 * Word/PDF imports used to turn a rendered payment table into ordinary stage
 * and cost rows. Once a real payment_schedule exists, those rows display the
 * same schedule a second time with stale calculated amounts. Remove only the
 * unmistakable imported shape: a stage named "סדר/לוח תשלומים" and matching
 * monetary rows. Normal project stages and cost items are left untouched.
 */
export function stripLegacyPaymentContent<T extends QuoteTemplate>(
  template: T,
  paymentSteps: RichPaymentStep[],
): T {
  if (!paymentSteps.length) return template;

  const isLegacyPaymentStage = (name: unknown) =>
    /^(?:סדר|לוח)\s*תשלומים$/u.test(String(name || "").trim());
  const isLegacyPaymentMarker = (text: unknown) =>
    /^(?:סדר|לוח)\s*תשלומים$/u.test(String(text || "").trim());
  const hasLegacyPaymentContent = (template.stages || []).some((stage) =>
    isLegacyPaymentStage(stage.name) ||
    (stage.items || []).some((item) => isLegacyPaymentMarker(item.text)));
  if (!hasLegacyPaymentContent) return template;

  const paymentLabels = paymentSteps
    .flatMap((step) => [step.description, step.name])
    .map(normalizedLabel)
    .filter(Boolean);
  const isLegacyPaymentItem = (item: any) => {
    const raw = String(item?.description || "").trim();
    const label = normalizedLabel(raw);
    const hasMoneyOrPercentage = /[%₪]/u.test(raw);
    const isSummary = /^(?:סה["״]?כ|מע["״]?מ)/u.test(raw);
    const matchesPayment = paymentLabels.some((paymentLabel) =>
      label === paymentLabel || label.startsWith(paymentLabel));
    return isSummary || (hasMoneyOrPercentage && matchesPayment);
  };

  return {
    ...template,
    stages: (template.stages || [])
      .filter((stage) => !isLegacyPaymentStage(stage.name))
      .map((stage) => {
        const items = stage.items || [];
        const start = items.findIndex((item) => isLegacyPaymentMarker(item.text));
        if (start < 0) return stage;

        let lastSummaryOffset = -1;
        items.slice(start).forEach((item, index) => {
          if (/^סה["״]?כ\s*כולל\s*מע["״]?מ/u.test(String(item.text || "").trim())) {
            lastSummaryOffset = index;
          }
        });
        const end = lastSummaryOffset >= 0 ? start + lastSummaryOffset : start;
        return { ...stage, items: [...items.slice(0, start), ...items.slice(end + 1)] };
      }),
    items: (template.items || []).filter((item) => !isLegacyPaymentItem(item)),
  } as T;
}

/**
 * Early OnlyOffice imports treated every number next to prose as a cost item
 * (parcel numbers and "up to 3 alternatives" included). When structured price
 * tiers exist they are the canonical price source, so the generated item table
 * is discarded and the contractual fee sentence is synchronized to base_price.
 */
export function normalizeLegacyImportedPricing<T extends QuoteTemplate>(
  template: T,
  basePrice: number,
  pricingTiers: any[],
): T {
  const isOnlyOfficeImport = /הומר\s+ממסמך\s+OnlyOffice/iu.test(String(template.description || ""));
  if (!isOnlyOfficeImport || !pricingTiers.length) return template;

  const formattedPrice = (Number(basePrice) || 0).toLocaleString("he-IL");
  const syncFee = (text: string) => text.replace(
    /(שכר\s*טרחה\s*עבור\s*מכלול\s*השירותים[^₪]*₪\s*)[\d,.]+/u,
    `$1${formattedPrice}`,
  );

  return {
    ...template,
    items: [],
    stages: (template.stages || []).map((stage) => ({
      ...stage,
      items: (stage.items || []).map((item) => ({
        ...item,
        text: syncFee(String(item.text || "")),
      })),
    })),
  } as T;
}

export function buildUnifiedTemplate(input: {
  template: QuoteTemplate;
  paymentSteps: RichPaymentStep[];
  designSettings: Record<string, any>;
  textBoxes: any[];
  upgrades: any[];
  pricingTiers: any[];
  selectedTier?: string;
  basePrice: number;
}): QuoteTemplate {
  const { template, paymentSteps, designSettings, textBoxes, upgrades, pricingTiers, selectedTier, basePrice } = input;
  const normalizedPaymentSteps = normalizeLegacyPaymentSteps(paymentSteps, Number(template.vat_rate));
  const pricingNormalizedTemplate = normalizeLegacyImportedPricing(template, basePrice, pricingTiers);
  const normalizedTemplate = stripLegacyPaymentContent(pricingNormalizedTemplate, normalizedPaymentSteps);
  return {
    ...normalizedTemplate,
    base_price: Number(basePrice) || 0,
    payment_schedule: toPaymentSchedule(normalizedPaymentSteps) as any,
    design_settings: stripLegacyFlowOverrides(designSettings) as any,
    text_boxes: textBoxes,
    upgrades,
    pricing_tiers: pricingTiers,
    ...(selectedTier ? { selected_tier: selectedTier } : {}),
  } as QuoteTemplate;
}
