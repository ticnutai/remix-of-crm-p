import { describe, expect, it } from "vitest";
import { renderFlowToHtml } from "./renderer";
import type { FlowDocument } from "./types";

function documentFixture(): FlowDocument {
  return {
    title: "בדיקת A4",
    branding: {
      logoUrl: null,
      headerStripUrl: "header.png",
      footerStripUrl: "footer.png",
      headerStripHeight: 150,
      footerStripHeight: 90,
      headerStripWidthPercent: 100,
      footerStripWidthPercent: 100,
      headerStripContentGapPx: 18,
      footerStripContentGapPx: 18,
      companyName: "חברה",
      primaryColor: "#162c58",
      accentColor: "#d8ac27",
      fontFamily: "Heebo, Arial, sans-serif",
    },
    page: {
      size: "A4",
      orientation: "portrait",
      marginMm: { top: 32, right: 18, bottom: 28, left: 18 },
      showPageNumbers: true,
    },
    sections: [
      {
        id: "content",
        blocks: [{ type: "paragraph", content: [{ type: "text", text: "טקסט בעברית" }] }],
      },
    ],
  };
}

describe("renderFlowToHtml", () => {
  it("uses one RTL A4 paged-media document with running header and footer", () => {
    const html = renderFlowToHtml(documentFixture());

    expect(html).toContain('<html dir="rtl" lang="he"');
    expect(html).toMatch(/@page\s*\{[\s\S]*?size:\s*A4;/);
    expect(html).toContain("position: running(runHeader)");
    expect(html).toContain("position: running(runFooter)");
    expect(html).toContain('@top-center { content: element(runHeader); }');
    expect(html).toContain('@bottom-center { content: element(runFooter); }');
    expect(html).toContain('.pagedjs_sheet::after');
    expect(html).toContain('class="strip-img" src="header.png"');
    expect(html).toContain('class="strip-img" src="footer.png"');
  });

  it("constrains imported content to the printable A4 width", () => {
    const fixture = documentFixture();
    fixture.sections.push({
      id: "costs",
      blocks: [{
        type: "table",
        headers: ["תיאור", "כמות", "יחידה", "מחיר ליח׳", "סה״כ"],
        rows: [["תיאור ארוך מאוד של שירות", "1", "יח׳", "42,000", "42,000"]],
      }],
    });
    const html = renderFlowToHtml(fixture);

    expect(html).toContain(".flow-doc *");
    expect(html).toContain("max-width: 100% !important");
    expect(html).toContain("table-layout: fixed");
    expect(html).toContain("overflow-wrap: anywhere");
    expect(html).toContain(".flow-list li {");
    expect(html).toContain("page-break-inside: avoid");
    expect(html).toContain("align-items: flex-end !important");
    expect(html).toContain('<col style="width:46.000%" />');
    expect(html).toContain('<col style="width:15.000%" />');
    expect(html).toContain("overflow-x: hidden");
  });

  it("moves the body margins when logo spacing changes without image strips", () => {
    const fixture = documentFixture();
    fixture.branding.headerStripUrl = null;
    fixture.branding.footerStripUrl = null;
    fixture.branding.headerStripContentGapPx = 42;
    fixture.branding.footerStripContentGapPx = 42;

    const html = renderFlowToHtml(fixture);

    expect(html).toContain("margin: 38.35mm 0mm 34.35mm 0mm");
  });

  it("applies the unified design-tab frame, background and typography to A4", () => {
    const fixture = documentFixture();
    fixture.branding.baseFontSizePx = 19;
    fixture.branding.frameDesign = {
      documentBorder: {
        style: "solid",
        width: 3,
        color: "#123456",
        radius: 8,
        padding: 24,
        shadow: "none",
      },
      background: { type: "solid", color1: "#fafafa" },
      sectionTitle: { style: "gold-underline", barColor: "#abcdef", textColor: "#111111" },
    };

    const html = renderFlowToHtml(fixture);

    expect(html).toContain("font-size: 19px");
    expect(html).toContain("Unified design-tab appearance");
    expect(html).toContain("border: 3px solid #123456");
    expect(html).toContain("background: #fafafa");
    expect(html).toContain("border-bottom:2px solid #abcdef");
  });

  it("removes the running footer when it is disabled in the logo tab", () => {
    const fixture = documentFixture();
    fixture.branding.showFooter = false;

    const html = renderFlowToHtml(fixture);

    expect(html).toContain("@bottom-center { content: none; }");
    expect(html).not.toContain('<div class="running-footer');
  });

  it("renders configurable page-number placement and appearance", () => {
    const fixture = documentFixture();
    fixture.page.pageNumber = {
      position: "top-left",
      fontFamily: "Arial, sans-serif",
      fontSizePx: 14,
      color: "#123456",
      backgroundColor: "#abcdef",
      shape: "pill",
      format: "dash",
    };

    const html = renderFlowToHtml(fixture);

    expect(html).toContain('content: "— " attr(data-page-number) " —"');
    expect(html).toContain("top:41.688mm;bottom:auto");
    expect(html).toContain("left:6mm;right:auto");
    expect(html).toContain("font-family: Arial, sans-serif");
    expect(html).toContain("font-size: 14px");
    expect(html).toContain("background:#abcdef");
  });

  it("omits the page-number decoration when numbering is disabled", () => {
    const fixture = documentFixture();
    fixture.page.showPageNumbers = false;

    const html = renderFlowToHtml(fixture);

    expect(html).not.toContain(".pagedjs_sheet::after");
  });
});
