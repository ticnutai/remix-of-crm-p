import { describe, expect, it } from "vitest";
import { DEFAULT_QUOTE_BASE_PRICE, resolveQuoteBasePrice } from "./quotePricing";

describe("resolveQuoteBasePrice", () => {
  it("uses the editor default when no price was persisted", () => {
    expect(resolveQuoteBasePrice({ basePrice: 0 })).toBe(DEFAULT_QUOTE_BASE_PRICE);
    expect(resolveQuoteBasePrice({ basePrice: null })).toBe(DEFAULT_QUOTE_BASE_PRICE);
  });

  it("prefers the selected pricing tier", () => {
    expect(resolveQuoteBasePrice({
      basePrice: 30_000,
      selectedTier: "מורחב",
      pricingTiers: [{ name: "מורחב", price: 42_000 }],
    })).toBe(42_000);
  });

  it("uses an explicit positive price without a selected tier", () => {
    expect(resolveQuoteBasePrice({ basePrice: 30_000 })).toBe(30_000);
  });
});
