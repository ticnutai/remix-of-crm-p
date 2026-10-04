import { afterEach, describe, expect, it } from "vitest";
import { customDataValues, customFieldTokenMap, setRegisteredCustomFields } from "./customFieldRegistry";
import { clientUpdatesFromQuote, quoteValuesFromClient } from "./clientSyncedFields";
import { applyProjectTokens } from "@/components/quotes/QuoteTemplatesManager/flow-engine/projectTokens";

afterEach(() => setRegisteredCustomFields([]));

describe("custom field registry", () => {
  it("keeps only plain custom_data values", () => {
    expect(
      customDataValues({ area: "120", count: 3, phone_labels: { primary: "x" }, empty: "" }),
    ).toEqual({ area: "120", count: "3" });
  });

  it("maps registered labels to values", () => {
    setRegisteredCustomFields([{ key: "area", label: "שטח מגרש" }]);
    expect(customFieldTokenMap({ area: "500" })).toEqual({ "שטח מגרש": "500" });
  });

  it("fills a custom field in quote text by its label, not as a bare word", () => {
    setRegisteredCustomFields([{ key: "area", label: "שטח מגרש" }]);
    const pd = { customData: { area: "500" } };
    expect(applyProjectTokens("[שטח מגרש]", pd)).toBe("500");
    expect(applyProjectTokens("שטח מגרש ____", pd)).toBe("שטח מגרש 500");
    // A bare label is ordinary text — left alone
    expect(applyProjectTokens("שטח מגרש גדול", pd)).toBe("שטח מגרש גדול");
  });

  it("fills the new built-in fields in quote text", () => {
    const pd = { minhalContract: "12/345-א", newTaba: 'גז/ 600' };
    expect(applyProjectTokens("[מספר חוזה מנהל]", pd)).toBe("12/345-א");
    expect(applyProjectTokens("[מספר תב״ע חדשה]", pd)).toBe("גז/ 600");
  });
});

describe("client synced fields", () => {
  it("writes only non-empty quote values back to the client", () => {
    expect(clientUpdatesFromQuote({ minhalContract: " 12/3 ", newTaba: "" })).toEqual({
      minhal_contract_number: "12/3",
    });
  });

  it("reads client columns into quote values", () => {
    expect(quoteValuesFromClient({ minhal_contract_number: "7", new_taba_number: null })).toEqual({
      minhalContract: "7",
      newTaba: "",
    });
  });
});
