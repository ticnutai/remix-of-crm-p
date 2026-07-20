import { describe, expect, it } from "vitest";
import { syncStructuredSections } from "./syncStructuredSections";

const template = (price: number) => ({
  id: "t",
  name: "הצעה",
  category: "other",
  stages: [{ id: "s", name: "תוכן", items: [{ id: "i", text: "טקסט מקורי" }] }],
  items: [],
  payment_schedule: [{ id: "p", description: "מקדמה", percentage: 50 }],
  timeline: [],
  important_notes: [],
  validity_days: 30,
  design_settings: {},
  show_vat: true,
  vat_rate: 18,
  base_price: price,
  is_active: true,
  created_at: "",
  updated_at: "",
  pricing_tiers: [{ name: "בסיס", price }],
  selected_tier: "בסיס",
}) as any;

describe("syncStructuredSections", () => {
  it("preserves edited prose and refreshes protected prices and payments", () => {
    const initial = syncStructuredSections("<h2>טקסט שערכתי</h2>", template(10_000));
    const updated = syncStructuredSections(initial, template(20_000));

    expect(updated).toContain("טקסט שערכתי");
    expect(updated).toContain("20,000");
    expect(updated).not.toContain("<td>₪10,000</td>");
    expect(updated).toContain('data-flow-protected="1"');
    expect(updated).toContain('data-payments-block="1"');
  });
});
