import { describe, expect, it } from "vitest";
import { FLOW_STRIP_LIMITS, resolveFlowStripSettings } from "./stripSettings";

describe("resolveFlowStripSettings", () => {
  it("never reuses a header logo as a footer strip", () => {
    const resolved = resolveFlowStripSettings({
      logoUrl: "data:image/png;base64,HEADER",
      logoPosition: "custom-strip",
    });

    expect(resolved.headerUrl).toContain("HEADER");
    expect(resolved.footerUrl).toBeUndefined();
  });

  it("keeps explicit header and footer assets independent", () => {
    const resolved = resolveFlowStripSettings({
      headerStripUrl: "header.png",
      footerStripUrl: "footer.png",
    });

    expect(resolved.headerUrl).toBe("header.png");
    expect(resolved.footerUrl).toBe("footer.png");
  });

  it("clamps unsafe dimensions so the A4 content area cannot be consumed", () => {
    const resolved = resolveFlowStripSettings({
      headerStripUrl: "header.png",
      footerStripUrl: "footer.png",
      headerStripHeight: 9_999,
      footerStripHeight: 9_999,
      headerStripWidthPercent: 500,
      footerStripWidthPercent: -20,
      headerStripContentGapPx: 500,
    });

    expect(resolved.headerHeightPx).toBe(FLOW_STRIP_LIMITS.headerHeightPx.max);
    expect(resolved.footerHeightPx).toBe(FLOW_STRIP_LIMITS.footerHeightPx.max);
    expect(resolved.headerWidthPercent).toBe(FLOW_STRIP_LIMITS.widthPercent.max);
    expect(resolved.footerWidthPercent).toBe(FLOW_STRIP_LIMITS.widthPercent.min);
    expect(resolved.headerContentGapPx).toBe(FLOW_STRIP_LIMITS.contentGapPx.max);
  });

  it("keeps independent content gaps above and below the document body", () => {
    const resolved = resolveFlowStripSettings({
      headerStripUrl: "header.png",
      footerStripUrl: "footer.png",
      headerStripContentGapPx: 24,
      footerStripContentGapPx: 42,
    });

    expect(resolved.headerContentGapPx).toBe(24);
    expect(resolved.footerContentGapPx).toBe(42);
  });
});
