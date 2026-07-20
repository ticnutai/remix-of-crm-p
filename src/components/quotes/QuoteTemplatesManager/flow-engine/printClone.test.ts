import { describe, expect, it } from "vitest";
import { stabilizeRunningElementsForPrint } from "./printClone";

describe("stabilizeRunningElementsForPrint", () => {
  it("keeps only Paged.js margin copies visible", () => {
    const page = document.createElement("div");
    page.innerHTML = `
      <div class="pagedjs_margin pagedjs_margin-top-center">
        <div class="pagedjs_margin-content">
          <div class="running-header strip">margin header</div>
        </div>
      </div>
      <div class="pagedjs_page_content">
        <div class="running-header strip">source header</div>
        <div class="running-footer strip">source footer</div>
      </div>
      <div class="pagedjs_margin pagedjs_margin-bottom-center">
        <div class="pagedjs_margin-content">
          <div class="running-footer strip">margin footer</div>
        </div>
      </div>
    `;

    stabilizeRunningElementsForPrint(page);

    const marginHeader = page.querySelector<HTMLElement>(".pagedjs_margin .running-header");
    const sourceHeader = page.querySelector<HTMLElement>(".pagedjs_page_content .running-header");
    const marginFooter = page.querySelector<HTMLElement>(".pagedjs_margin .running-footer");
    const sourceFooter = page.querySelector<HTMLElement>(".pagedjs_page_content .running-footer");

    expect(marginHeader?.style.getPropertyValue("display")).toBe("block");
    expect(marginFooter?.style.getPropertyValue("display")).toBe("block");
    expect(sourceHeader?.style.getPropertyValue("display")).toBe("none");
    expect(sourceFooter?.style.getPropertyValue("display")).toBe("none");
    expect(sourceHeader?.style.getPropertyPriority("display")).toBe("important");
  });
});
