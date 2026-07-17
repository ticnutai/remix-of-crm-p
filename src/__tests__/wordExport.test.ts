import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { createQuoteDocx } from "@/components/quotes/QuoteTemplatesManager/wordExport";

describe("quote Word export", () => {
  it("creates a valid RTL DOCX with stages and payments", async () => {
    const blob = await createQuoteDocx({
      title: "הצעת מחיר לבדיקה",
      companyName: "חברת בדיקה",
      companyPhone: "050-0000000",
      primaryColor: "#B8860B",
      projectDetails: { clientName: "לקוח בדיקה", address: "כתובת בדיקה" },
      stages: [{ name: "שלב ראשון", items: [{ text: "משימת בדיקה" }] }],
      paymentSteps: [{ name: "תשלום ראשון", percentage: 25 }],
      textBoxes: [],
      basePrice: 10000,
      vatRate: 18,
      pageSize: { orientation: "portrait", widthMm: 210, heightMm: 297 },
    });

    expect(blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");

    const zip = await JSZip.loadAsync(bytes);
    const documentXml = await zip.file("word/document.xml")!.async("string");
    const settingsXml = await zip.file("word/settings.xml")!.async("string");
    expect(documentXml).toContain("הצעת מחיר לבדיקה");
    expect(documentXml).toContain("שלב ראשון");
    expect(documentXml).toContain("תשלום ראשון");
    expect(documentXml).toContain("w:bidi");
    expect(settingsXml).toBeTruthy();
  });
});
