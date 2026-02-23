/**
 * LIVE WATCH - Opens a real browser, user interacts, I record everything
 * The browser stays open for 5 minutes. User clicks whatever they want.
 */
import { test } from "@playwright/test";

test("Live watch - user controls browser", async ({ browser }) => {
  test.setTimeout(600000); // 10 minutes

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: "he-IL",
  });
  const page = await context.newPage();

  const events: string[] = [];
  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString("he-IL");
    const line = `[${ts}] ${msg}`;
    events.push(line);
    console.log(line);
  };

  // Monitor console
  page.on("console", (msg) => {
    if (msg.type() === "error") log(`❌ CONSOLE ERROR: ${msg.text().substring(0, 250)}`);
    if (msg.type() === "warning") log(`⚠️ WARNING: ${msg.text().substring(0, 150)}`);
  });

  // Monitor network errors
  page.on("response", (res) => {
    if (res.status() >= 400) log(`🔴 HTTP ${res.status()}: ${res.url().substring(0, 150)}`);
  });

  // Monitor JS crashes
  page.on("pageerror", (err) => log(`💥 JS CRASH: ${err.message.substring(0, 250)}`));

  // Monitor navigation
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) log(`🔀 NAVIGATE: ${frame.url()}`);
  });

  // Monitor popups
  page.on("popup", (popup) => log(`🪟 POPUP: ${popup.url()}`));

  // Monitor dialogs
  page.on("dialog", async (dialog) => {
    log(`💬 DIALOG [${dialog.type()}]: ${dialog.message()}`);
    await dialog.dismiss();
  });

  log("=== Opening localhost:8080 ===");
  log("=== YOU control the browser - click whatever you want ===");
  log("=== I'm recording everything that happens ===");
  log("=== Close the browser when done, or wait 10 minutes ===");

  await page.goto("http://localhost:8080");
  await page.waitForLoadState("networkidle").catch(() => {});

  log("✅ Page loaded. Go ahead and use the app!");

  // Wait and monitor - check every 5 seconds for page state
  for (let i = 0; i < 120; i++) { // 120 * 5s = 10 minutes
    await page.waitForTimeout(5000);
    
    // Log current URL every 30 seconds
    if (i % 6 === 0) {
      try {
        const url = page.url();
        log(`📍 Current page: ${url}`);
      } catch {
        log("🔚 Browser closed by user");
        break;
      }
    }
  }

  // Final report
  log("\n========================================");
  log("         SESSION RECORDING SUMMARY");
  log("========================================");
  log(`Total events: ${events.length}`);
  
  const errors = events.filter(e => e.includes("❌") || e.includes("💥") || e.includes("🔴"));
  log(`Errors: ${errors.length}`);
  errors.forEach(e => log(`  ${e}`));

  await context.close();
});
