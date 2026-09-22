import { describe, expect, it } from "vitest";
import { applyAutofillToInlines, findAutofillMatches, OBJECT_CHAR } from "./labelAutofill";

const values: Record<string, string> = {
  "parcel.block": "7312",
  "parcel.lot": "49",
  "parcel.plot": "906",
  "parcel.taba": "גז/ 525 27 א",
  "customer.family": "כהן",
  "plan.area": "1,070 מ\"ר",
};
const lookup = (key: string) => values[key];

const fill = (text: string) => {
  const matches = findAutofillMatches(text, lookup);
  let out = "";
  let cursor = 0;
  matches.forEach((m) => {
    out += text.slice(cursor, m.insertAt) + m.text;
    cursor = m.hideTo;
  });
  return out + text.slice(cursor);
};

describe("label autofill", () => {
  it("fills every occurrence of a field label", () => {
    expect(fill("גוש חלקה מגרש")).toBe("גוש 7312 חלקה 49 מגרש 906");
    expect(fill("גוש:\nחלקה:")).toBe("גוש: 7312\nחלקה: 49");
    expect(fill("התוכנית בגוש ובהמשך שוב גוש, וגם חלקה.")).toBe("התוכנית בגוש ובהמשך שוב גוש 7312, וגם חלקה 49.");
  });

  it("replaces underscores after the label", () => {
    expect(fill("גוש: __________")).toBe("גוש: 7312");
    expect(fill("גוש ____ חלקה ____")).toBe("גוש 7312 חלקה 49");
    expect(fill("שטח התכנית: ____")).toBe('שטח התכנית: 1,070 מ"ר');
  });

  it("matches whole words only", () => {
    expect(fill("בגוש 7312 וגושים המגרש")).toBe("בגוש 7312 וגושים המגרש");
  });

  it("does not fill twice when a value is already written", () => {
    expect(fill("גוש 7312")).toBe("גוש 7312");
    expect(fill('התב"ע החלה: גז/ 1')).toBe('התב"ע החלה: גז/ 1');
    expect(fill(`גוש: ${OBJECT_CHAR}`)).toBe(`גוש: ${OBJECT_CHAR}`);
  });

  it("prefers the longer label and accepts Hebrew gershayim", () => {
    expect(fill('התב"ע החלה:')).toBe('התב"ע החלה: גז/ 525 27 א');
    expect(fill("משפחת ____")).toBe("משפחת כהן");
    expect(fill("תב״ע: ____")).toBe("תב״ע: גז/ 525 27 א");
  });

  it("does not fill generic words inside a sentence", () => {
    expect(fill('הצעת מחיר לביצוע שינוי תב"ע בסמכות מקומית')).toBe('הצעת מחיר לביצוע שינוי תב"ע בסמכות מקומית');
    expect(fill('הכנת תב"ע הכוללת תקנון')).toBe('הכנת תב"ע הכוללת תקנון');
    expect(fill('תב"ע:')).toBe('תב"ע: גז/ 525 27 א');
    expect(fill("משפחה: ____")).toBe("משפחה: כהן");
    expect(fill("למשפחה ולחברים משפחה נעימה")).toBe("למשפחה ולחברים משפחה נעימה");
  });

  it("leaves labels without a value untouched", () => {
    expect(fill("טלפון: ____")).toBe("טלפון: ____");
  });

  it("applies to renderer inlines across text nodes", () => {
    const out = applyAutofillToInlines(
      [
        { type: "text", text: "גוש:", bold: true },
        { type: "text", text: " ______ ומגרש" },
        { type: "field", key: "parcel.lot" },
        { type: "text", text: " מגרש" },
      ],
      lookup,
    );
    const flat = out.map((n) => (n.type === "text" ? n.text : `{${n.type}}`)).join("");
    expect(flat).toBe("גוש: 7312 ומגרש{field} מגרש 906");
  });
});
