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
    const html = renderFlowToHtml(documentFixture());

    expect(html).toContain(".flow-doc *");
    expect(html).toContain("max-width: 100% !important");
    expect(html).toContain("table-layout: fixed");
    expect(html).toContain("overflow-wrap: anywhere");
  });
});
