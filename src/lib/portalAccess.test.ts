import { describe, expect, it } from "vitest";
import {
  isValidIsraeliPhone,
  normalizeIsraeliPhone,
  toWhatsAppPhone,
} from "./portalAccess";

describe("portal phone helpers", () => {
  it.each([
    ["050-285 7658", "0502857658"],
    ["+972 50-285-7658", "0502857658"],
    ["972502857658", "0502857658"],
    ["00972-50-285-7658", "0502857658"],
    ["502857658", "0502857658"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeIsraeliPhone(input)).toBe(expected);
  });

  it("validates a normalized Israeli phone", () => {
    expect(isValidIsraeliPhone("+972 50-285-7658")).toBe(true);
    expect(isValidIsraeliPhone("1234")).toBe(false);
  });

  it("creates a WhatsApp-compatible international number", () => {
    expect(toWhatsAppPhone("0502857658")).toBe("972502857658");
  });
});

