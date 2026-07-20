import { describe, expect, it } from "vitest";
import {
  buildUnifiedTemplate,
  normalizeLegacyPaymentSteps,
  normalizeLegacyImportedPricing,
  stripLegacyPaymentContent,
  stripLegacyFlowOverrides,
} from "./unifiedTemplate";

describe("unified quote template", () => {
  it("removes stale HTML overrides without changing other design settings", () => {
    expect(stripLegacyFlowOverrides({ primaryColor: "#123", flowV2OverrideHtml: "old", flow_v2_override_html: "older" }))
      .toEqual({ primaryColor: "#123" });
  });

  it("uses current payment data and preserves its task assignment", () => {
    const result = buildUnifiedTemplate({
      template: { id: "t", name: "T", category: "other", items: [], stages: [], payment_schedule: [], timeline: [], important_notes: [], validity_days: 30, design_settings: {}, show_vat: true, vat_rate: 18, base_price: 1, is_active: true, created_at: "", updated_at: "" } as any,
      paymentSteps: [{ id: "p", name: "תשלום מקדמה", percentage: 25, templateStageId: "s", templateTaskId: "task" }],
      designSettings: { primaryColor: "#abc", flowV2OverrideHtml: "stale" },
      textBoxes: [{ id: "tb" }], upgrades: [{ id: "u" }], pricingTiers: [{ name: "זהב", price: 5000 }], selectedTier: "זהב", basePrice: 5000,
    });
    expect(result.base_price).toBe(5000);
    expect(result.payment_schedule[0]).toMatchObject({ description: "תשלום מקדמה", percentage: 25, templateStageId: "s", templateTaskId: "task" });
    expect((result.design_settings as any).flowV2OverrideHtml).toBeUndefined();
    expect(result.text_boxes).toEqual([{ id: "tb" }]);
  });

  it("repairs a legacy VAT summary that was imported as a payment milestone", () => {
    const result = normalizeLegacyPaymentSteps([
      { id: "a", name: "חתימת חוזה ₪7,500", percentage: 25 },
      { id: "b", name: "המשך עבודה ₪22,500", percentage: 75 },
      { id: "vat", name: 'מע"מ () ₪5,400', percentage: 18 },
    ], 18);

    expect(result).toHaveLength(2);
    expect(result.reduce((sum, step) => sum + step.percentage, 0)).toBe(100);
    expect(result.map((step) => step.name)).toEqual(["חתימת חוזה", "המשך עבודה"]);
  });

  it("does not remove a genuine payment schedule just because it exceeds 100%", () => {
    const result = normalizeLegacyPaymentSteps([
      { id: "a", name: "מקדמה", percentage: 60 },
      { id: "b", name: "יתרה", percentage: 60 },
    ], 18);

    expect(result).toHaveLength(2);
  });

  it("removes a duplicated imported payment table while preserving real scope and costs", () => {
    const template = {
      stages: [
        { id: "scope", name: "שלבי העבודה", items: [{ id: "s1", text: "תכנון" }] },
        { id: "legacy-payments", name: "סדר תשלומים", items: [{ id: "p1", text: "חתימת חוזה 25% ₪7,500" }] },
      ],
      items: [
        { id: "real", description: "הדמיה", quantity: 1, unit: "יח׳", unit_price: 1_000, total: 1_000 },
        { id: "legacy-row", description: "חתימת חוזה 25% ₪7,500", quantity: 1, unit: "", unit_price: 7_500, total: 7_500 },
        { id: "legacy-total", description: 'סה״כ כולל מע״מ ₪35,400', quantity: 1, unit: "", unit_price: 35_400, total: 35_400 },
      ],
    } as any;

    const result = stripLegacyPaymentContent(template, [
      { id: "payment", name: "חתימת חוזה", percentage: 25 },
    ]);

    expect(result.stages.map((stage: any) => stage.id)).toEqual(["scope"]);
    expect(result.items.map((item: any) => item.id)).toEqual(["real"]);
  });

  it("removes an inline imported payment table embedded in a larger stage", () => {
    const template = {
      stages: [{
        id: "contract",
        name: "תנאי ההתקשרות",
        items: [
          { id: "before", text: "שכר הטרחה ישולם כדלקמן" },
          { id: "marker", text: "סדר תשלומים" },
          { id: "header", text: "שלב אחוז סכום" },
          { id: "row", text: "חתימת חוזה 25% ₪7,500" },
          { id: "total", text: 'סה״כ כולל מע״מ ₪35,400' },
          { id: "after", text: "חתימת הצדדים" },
        ],
      }],
      items: [{ id: "legacy-row", description: "חתימת חוזה % ₪", unit_price: 7_500 }],
    } as any;

    const result = stripLegacyPaymentContent(template, [
      { id: "payment", name: "חתימת חוזה", percentage: 25 },
    ]);

    expect(result.stages[0].items.map((item: any) => item.id)).toEqual(["before", "after"]);
    expect(result.items).toEqual([]);
  });

  it("does not infer legacy content without a dedicated imported payment stage", () => {
    const template = {
      stages: [{ id: "scope", name: "שלבי העבודה", items: [] }],
      items: [{ id: "deposit", description: "חתימת חוזה 25% ₪7,500" }],
    } as any;

    expect(stripLegacyPaymentContent(template, [
      { id: "payment", name: "חתימת חוזה", percentage: 25 },
    ])).toBe(template);
  });

  it("replaces auto-parsed OnlyOffice costs with structured pricing", () => {
    const template = {
      description: "הומר ממסמך OnlyOffice: הצעה ישנה",
      stages: [{
        id: "terms",
        name: "תנאים",
        items: [{ id: "fee", text: 'שכר טרחה עבור מכלול השירותים ע״פ הסכם זה: ₪ 42,000' }],
      }],
      items: [
        { id: "parcel", description: "בגוש חלקה מגרש", unit_price: 573 },
        { id: "fee", description: "שכר טרחה עבור מכלול השירותים", unit_price: 42_000 },
      ],
    } as any;

    const result = normalizeLegacyImportedPricing(template, 35_000, [{ name: "מתקדם", price: 35_000 }]);

    expect(result.items).toEqual([]);
    expect(result.stages[0].items[0].text).toContain("₪ 35,000");
    expect(result.stages[0].items[0].text).not.toContain("42,000");
  });
});
