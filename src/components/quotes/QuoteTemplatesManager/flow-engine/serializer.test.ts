import { describe, expect, it } from "vitest";
import { serializeTemplate } from "./serializer";

describe("serializeTemplate A4 flow", () => {
  it("does not duplicate a custom header logo into the footer", () => {
    const doc = serializeTemplate({
      id: "template-1",
      name: "הצעה",
      stages: [],
      items: [],
      payment_schedule: [],
      design_settings: {
        logoUrl: "header-only.png",
        logoPosition: "custom-strip",
      },
    } as any);

    expect(doc.branding.headerStripUrl).toBe("header-only.png");
    expect(doc.branding.footerStripUrl).toBeUndefined();
    expect(doc.page.size).toBe("A4");
  });

  it("allows a long payment schedule to split safely between A4 pages", () => {
    const doc = serializeTemplate({
      id: "template-2",
      name: "הצעה",
      stages: [],
      items: [],
      base_price: 100_000,
      vat_rate: 18,
      payment_schedule: Array.from({ length: 30 }, (_, index) => ({
        id: `payment-${index}`,
        description: `תשלום ${index + 1}`,
        percentage: 100 / 30,
      })),
      design_settings: {},
    } as any);

    const payments = doc.sections.find((section) => section.id === "payments");
    expect(payments).toBeDefined();
    expect(payments?.keepTogether).not.toBe(true);
  });
});
