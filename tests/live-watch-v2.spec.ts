/**
 * LIVE WATCH v2 - Tracks EVERY click + navigation to diagnose sidebar issue
 */
import { test } from "@playwright/test";

test("Live watch v2 - click tracking", async ({ browser }) => {
  test.setTimeout(600000); // 10 minutes

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: "he-IL",
  });
  const page = await context.newPage();

  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString("he-IL");
    console.log(`[${ts}] ${msg}`);
  };

  // Track CLICKS
  await page.exposeFunction(
    "__logClick",
    (x: number, y: number, tag: string, text: string, href: string) => {
      log(
        `🖱️ CLICK at (${x},${y}) on <${tag}> text="${text.substring(0, 50)}" href="${href}"`,
      );
    },
  );

  // Track mousedown to see what element is being pressed
  await page.exposeFunction(
    "__logMouseDown",
    (x: number, y: number, tag: string, text: string, href: string) => {
      log(
        `👆 MOUSEDOWN at (${x},${y}) on <${tag}> text="${text.substring(0, 50)}" href="${href}"`,
      );
    },
  );

  // Inject click/mousedown trackers
  await page.addInitScript(() => {
    document.addEventListener(
      "click",
      (e) => {
        const target = e.target as HTMLElement;
        const link = target.closest("a");
        (window as any).__logClick?.(
          e.clientX,
          e.clientY,
          target.tagName,
          target.textContent?.trim().substring(0, 50) || "",
          link?.getAttribute("href") || "",
        );
      },
      true,
    );

    document.addEventListener(
      "mousedown",
      (e) => {
        const target = e.target as HTMLElement;
        const link = target.closest("a");
        (window as any).__logMouseDown?.(
          e.clientX,
          e.clientY,
          target.tagName,
          target.textContent?.trim().substring(0, 50) || "",
          link?.getAttribute("href") || "",
        );
      },
      true,
    );
  });

  // Console errors
  page.on("console", (msg) => {
    if (msg.type() === "error")
      log(`❌ ERROR: ${msg.text().substring(0, 200)}`);
  });

  // Network errors
  page.on("response", (res) => {
    if (res.status() >= 400)
      log(`🔴 HTTP ${res.status()}: ${res.url().substring(0, 120)}`);
  });

  // Navigation
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) log(`🔀 NAVIGATE: ${frame.url()}`);
  });

  // JS crashes
  page.on("pageerror", (err) =>
    log(`💥 CRASH: ${err.message.substring(0, 200)}`),
  );

  // Popups
  page.on("popup", (popup) => log(`🪟 POPUP: ${popup.url()}`));

  log("=== BROWSER OPEN - localhost:8080 ===");
  log("=== Click on sidebar tabs - I'm tracking every click ===");

  await page.goto("http://localhost:8080");
  await page.waitForLoadState("domcontentloaded");

  log("✅ Page loaded. Start clicking!");

  // Monitor for 10 minutes
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(5000);
    if (i % 6 === 0) {
      try {
        log(`📍 Current: ${page.url()}`);
      } catch {
        log("🔚 Browser closed");
        break;
      }
    }
  }

  await context.close();
});
