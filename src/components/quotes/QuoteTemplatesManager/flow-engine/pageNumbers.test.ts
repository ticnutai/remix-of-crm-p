import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_NUMBER_SETTINGS,
  normalizePageNumberSettings,
  pageNumberHorizontalCss,
  pageNumberShapeCss,
  pageNumberText,
} from "./pageNumbers";

describe("page number settings", () => {
  it("uses a clean bottom-center default", () => {
    expect(normalizePageNumberSettings()).toEqual(DEFAULT_PAGE_NUMBER_SETTINGS);
    expect(pageNumberHorizontalCss("bottom-center")).toContain("left:50%");
    expect(pageNumberShapeCss(DEFAULT_PAGE_NUMBER_SETTINGS)).toContain("background:transparent");
  });

  it("normalizes unsafe or out-of-range persisted values", () => {
    expect(normalizePageNumberSettings({
      fontSizePx: 80,
      color: "red",
      backgroundColor: "javascript:alert(1)",
      fontFamily: "url(bad)",
    })).toMatchObject({
      fontSizePx: 32,
      color: DEFAULT_PAGE_NUMBER_SETTINGS.color,
      backgroundColor: DEFAULT_PAGE_NUMBER_SETTINGS.backgroundColor,
      fontFamily: DEFAULT_PAGE_NUMBER_SETTINGS.fontFamily,
    });
  });

  it("supports the three number text formats", () => {
    expect(pageNumberText("page", "3")).toBe("עמוד 3");
    expect(pageNumberText("number", "3")).toBe("3");
    expect(pageNumberText("dash", "3")).toBe("— 3 —");
  });

  it("keeps compact shapes number-only", () => {
    expect(normalizePageNumberSettings({ shape: "circle", format: "page" }).format).toBe("number");
    expect(normalizePageNumberSettings({ shape: "square", format: "dash" }).format).toBe("number");
  });
});
