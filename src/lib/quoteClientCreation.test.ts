import { describe, expect, it } from "vitest";
import {
  buildAtomicQuoteClientRequest,
  formatIls,
  isExpiredAuthError,
} from "./quoteClientCreation";

describe("atomic quote client creation", () => {
  it("keeps the same idempotency key and gives missing steps stable IDs", () => {
    const request = buildAtomicQuoteClientRequest({
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      client: { name: "לקוח בדיקה" },
      quote: { base_price: 35_000, vat_rate: 18 },
      paymentSchedule: [{ percentage: "25" }, { id: "final", percentage: 75 }],
    });

    expect(request.idempotency_key).toBe("11111111-1111-4111-8111-111111111111");
    expect(request.payment_schedule).toEqual([
      { id: "step-1", percentage: 25 },
      { id: "final", percentage: 75 },
    ]);
  });

  it("rejects a zero-price quote before sending it to the database", () => {
    expect(() => buildAtomicQuoteClientRequest({
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      client: { name: "לקוח" },
      quote: { base_price: 0 },
      paymentSchedule: [],
    })).toThrow("QUOTE_PRICE_MUST_BE_POSITIVE");
  });

  it("recognizes expired authentication and preserves currency cents", () => {
    expect(isExpiredAuthError({ message: "AUTH_SESSION_EXPIRED" })).toBe(true);
    expect(formatIls(10_237.5)).toMatch(/10,237\.50/);
  });
});
