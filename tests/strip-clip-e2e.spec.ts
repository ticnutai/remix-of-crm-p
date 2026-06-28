import { test, expect, Page, FrameLocator } from "@playwright/test";

const EMAIL = "jj1212t@gmail.com";
const PASSWORD = "543211";

async function login(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  if (await page.locator('input[type="password"]').count()) {
    const loginTab = page.getByRole("tab", { name: "כניסה" });
    if (await loginTab.count()) await loginTab.click().catch(() => {});
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(4000);
  }
}

// Open the template at `templateIndex` in the editor and switch to the
// "תצוגת דפים" (pages) tab.
async function openPagesPreview(page: Page, templateIndex: number) {
  await page.goto("/quote-templates", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);

  const openBtns = page.getByRole("button", { name: /פתח בעורך/ });
  await openBtns.first().waitFor({ state: "visible", timeout: 15000 });
  const idx = Math.min(templateIndex, (await openBtns.count()) - 1);
  await openBtns.nth(idx).click();
  await page.waitForTimeout(4500);

  // The sticky tab bar renders *behind* the project panel; scroll every scroll
  // container to the top so the tab bar is exposed, then native-click the tab.
  await page.evaluate(() => {
    document.querySelectorAll("*").forEach((el) => {
      const e = el as HTMLElement;
      const cs = getComputedStyle(e);
      if ((cs.overflowY === "auto" || cs.overflowY === "scroll") && e.scrollTop > 0) e.scrollTop = 0;
    });
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  const pagesTab = page.locator('.md\\:flex [role="tab"][data-value="pages"]').first();
  await pagesTab.waitFor({ state: "visible", timeout: 15000 });
  await pagesTab.click();
  await page.waitForTimeout(3500); // let the preview iframe render + overlay script run

  // The page-1 iframe renders the FULL document (sliced per page) and its
  // injected script builds the repeating strip overlays for every page, so a
  // single iframe is enough to audit all pages.
}

/**
 * Inside one live preview page-iframe, analyse the repeating header/footer
 * overlays and any document text that would show *behind* them.
 * Returns per-band coverage info so we can assert "no text behind strips".
 */
async function analyseStrips(frame: FrameLocator) {
  return await frame.locator("body").evaluate(() => {
    function alphaOf(bg: string): number {
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (!m) return 0;
      const p = m[1].split(",").map((s) => parseFloat(s));
      return p.length >= 4 ? p[3] : 1;
    }
    const PH = parseInt(document.body.getAttribute("data-page-height") || "1123", 10) || 1123;
    // offsetHeight mirrors the product's page-count formula (PagesPreviewTab):
    // it excludes the absolutely-positioned strip overlays that pollute
    // scrollHeight, so the test counts pages the same way the app renders them.
    const docH = Math.max(document.documentElement.offsetHeight, document.body.offsetHeight);
    const pageCount = Math.max(1, Math.ceil(docH / PH));

    const overlays = Array.from(
      document.querySelectorAll<HTMLElement>(".lov-repeat-overlay"),
    ).map((el) => {
      const cs = getComputedStyle(el);
      const top = parseFloat(el.style.top || "0");
      const h = el.getBoundingClientRect().height;
      return {
        kind: el.classList.contains("lov-repeat-overlay-header") ? "header" : "footer",
        top,
        height: h,
        bgAlpha: alphaOf(cs.backgroundColor),
        opaque: alphaOf(cs.backgroundColor) >= 1,
      };
    });

    // Find body text that intersects a strip band. With the "opaque cover/clip"
    // approach the text stays in the DOM but must be hidden behind an OPAQUE
    // overlay. So we only flag text sitting behind a band that is NOT opaque —
    // that is genuinely visible "text behind the strip".
    const uncovered: { tag: string; text: string; top: number; band: string }[] = [];
    const bands = overlays.map((o) => ({ y0: o.top, y1: o.top + o.height, kind: o.kind, opaque: o.opaque }));
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<HTMLElement>();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const txt = (node.nodeValue || "").trim();
      if (!txt) continue;
      const el = node.parentElement as HTMLElement | null;
      if (!el) continue;
      if (el.closest(".lov-repeat-overlay")) continue; // strip's own text – ok
      if (el.closest(".print-repeat-header, .print-repeat-footer")) continue; // page-1 in-flow strip
      if (seen.has(el)) continue;
      seen.add(el);
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const bottom = top + r.height;
      for (const b of bands) {
        const overlaps = top < b.y1 && bottom > b.y0;
        if (overlaps && !b.opaque) {
          uncovered.push({ tag: el.tagName.toLowerCase(), text: txt.slice(0, 40), top: Math.round(top), band: b.kind });
          break;
        }
      }
    }

    return {
      pageCount,
      pageHeight: PH,
      overlays,
      headerOverlays: overlays.filter((o) => o.kind === "header").length,
      footerOverlays: overlays.filter((o) => o.kind === "footer").length,
      opaqueOverlays: overlays.filter((o) => o.opaque).length,
      uncoveredTextCount: uncovered.length,
      uncoveredTextSamples: uncovered.slice(0, 8),
    };
  });
}

// Multi-page templates discovered via strip-find-multipage probe.
const MULTI_PAGE_TEMPLATES = [2, 3, 4, 5, 7];

test("strips: every page has an opaque top+bottom strip with no text behind", async ({ page }) => {
  test.setTimeout(300000);
  await login(page);

  const results: Record<string, unknown>[] = [];

  for (const templateIndex of MULTI_PAGE_TEMPLATES) {
    await openPagesPreview(page, templateIndex);

    // Wait for the preview to fully settle: web fonts + late images grow the
    // document and change the page count, so poll until the rendered page-iframe
    // count is stable across consecutive reads before auditing.
    const frames = page.locator('iframe[title^="page-"]');
    await page
      .frameLocator('iframe[title^="page-"]')
      .first()
      .locator("body")
      .evaluate(async () => {
        const d = document as Document & { fonts?: FontFaceSet };
        try { await d.fonts?.ready; } catch { /* ignore */ }
        const imgs = Array.from(document.images);
        await Promise.all(
          imgs.map((im) => im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; })),
        );
      })
      .catch(() => {});
    let stable = 0;
    let prevCount = -1;
    for (let i = 0; i < 15 && stable < 2; i++) {
      await page.waitForTimeout(700);
      const c = await frames.count();
      stable = c === prevCount ? stable + 1 : 0;
      prevCount = c;
    }

    const count = await frames.count();
    console.log(`\n=== TEMPLATE ${templateIndex} — page iframes: ${count} ===`);
    expect(count, `template ${templateIndex}: expected a preview page iframe`).toBeGreaterThan(0);

    const first = page.frameLocator('iframe[title^="page-"]').first();
    const report = await analyseStrips(first);
    console.log(`TEMPLATE ${templateIndex} REPORT:`, JSON.stringify({
      pageCount: report.pageCount,
      headerOverlays: report.headerOverlays,
      footerOverlays: report.footerOverlays,
      opaqueOverlays: report.opaqueOverlays,
      overlays: report.overlays.length,
      uncoveredTextCount: report.uncoveredTextCount,
    }));
    results.push({ templateIndex, ...report });

    await page.screenshot({ path: `tests/screenshots/strip-after-t${templateIndex}.png`, fullPage: true });

    // 0) measurement consistency: the in-iframe page count (scrollHeight/PH) must
    //    match the number of page iframes React renders. A mismatch means late
    //    font/image loading grew the document after measuring → some displayed
    //    page would lack a strip.
    expect(report.pageCount, `t${templateIndex}: in-iframe pageCount must match rendered iframes`).toBe(count);
    // 1) every page must show a top AND bottom strip: pages 2..N get a header
    //    overlay, pages 1..N-1 get a footer overlay (page-1 header / last footer
    //    are in-flow), so each count must equal pageCount-1.
    if (count > 1) {
      expect(report.headerOverlays, `t${templateIndex}: header overlay on every page 2..N`).toBe(count - 1);
      expect(report.footerOverlays, `t${templateIndex}: footer overlay on every page 1..N-1`).toBe(count - 1);
    }
    // 2) every overlay must be fully opaque
    expect(report.opaqueOverlays, `t${templateIndex}: all strip overlays must be opaque`).toBe(report.overlays.length);
    // 3) no document text may be visible behind a (non-opaque) strip band
    expect(
      report.uncoveredTextCount,
      `t${templateIndex}: text visible behind strips: ${JSON.stringify(report.uncoveredTextSamples)}`,
    ).toBe(0);
  }

  console.log("\nALL TEMPLATES PASSED:", results.length);
});
