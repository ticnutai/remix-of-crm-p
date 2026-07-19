import { describe, expect, it } from "vitest";
import { buildPaymentMap, paymentTaskKey } from "./useClientPaymentLinks";

describe("quote payment links", () => {
  it("shows the gross payment amount that is displayed on the client task", () => {
    const map = buildPaymentMap([
      {
        title: "הצעת מחיר",
        status: "draft",
        base_price: 30_000,
        total_with_vat: 35_400,
        payment_schedule: [
          {
            id: "deposit",
            percentage: 10,
            templateStageName: "התקשרות לקוח",
            templateTaskName: "תשלום א' מקדמה",
          },
        ],
      },
    ]);

    expect(map.get(paymentTaskKey("התקשרות לקוח", "תשלום א' מקדמה"))?.amount).toBe(3_540);
  });

  it("normalizes whitespace and letter casing in legacy name-based links", () => {
    const map = buildPaymentMap([
      {
        title: "Quote",
        base_price: 10_000,
        payment_schedule: [
          {
            percentage: 25,
            templateStageName: " Stage ",
            templateTaskName: " TASK ",
          },
        ],
      },
    ]);

    expect(map.get(paymentTaskKey("stage", "task"))?.amount).toBe(2_500);
  });
});
