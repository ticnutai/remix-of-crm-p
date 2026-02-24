/**
 * LIVE MONITORING TEST - Opens a headed browser for the user to interact with
 * Logs ALL: navigation, clicks, console errors, network errors
 */
import { test } from "@playwright/test";

test("Live monitor - user interacts, I observe", async ({ browser }) => {
  test.setTimeout(300000); // 5 minutes

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  // ===== MONITORING SETUP =====
  const events: string[] = [];
  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString("he-IL");
    events.push(`[${ts}] ${msg}`);
    console.log(`[${ts}] ${msg}`);
  };

  // Console errors
  page.on("console", (msg) => {
    if (msg.type() === "error")
      log(`❌ CONSOLE ERROR: ${msg.text().substring(0, 200)}`);
  });

  // Network errors
  page.on("response", (res) => {
    if (res.status() >= 400)
      log(`🔴 NETWORK ${res.status()}: ${res.url().substring(0, 120)}`);
  });

  // JS crashes
  page.on("pageerror", (err) =>
    log(`💥 JS CRASH: ${err.message.substring(0, 200)}`),
  );

  // Navigation tracking
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      log(`🔀 NAVIGATED TO: ${frame.url()}`);
    }
  });

  // ===== LOGIN =====
  log("=== Starting Login ===");
  await page.goto("http://localhost:8080/auth");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  const emailInput = page.locator("#login-email");
  if (await emailInput.isVisible({ timeout: 5000 })) {
    await emailInput.fill("jj1212t@gmail.com");
    await page.locator("#login-password").fill("543211");
    await page.locator('form button[type="submit"]').first().click();
    await page
      .waitForURL((url) => !url.pathname.includes("/auth"), { timeout: 15000 })
      .catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    log(`✅ Logged in, URL: ${page.url()}`);
  }

  // ===== NOW TEST ALL SIDEBAR TABS =====
  log("=== Testing ALL sidebar navigation tabs ===");

  const sidebarTabs = [
    { name: "לוח בקרה (Dashboard)", path: "/" },
    { name: "היום שלי (My Day)", path: "/my-day" },
    { name: "לקוחות (Clients)", path: "/clients" },
    { name: "טבלת לקוחות (DataTable)", path: "/datatable-pro" },
    { name: "עובדים (Employees)", path: "/employees" },
    { name: "לוגי זמן (Time Logs)", path: "/time-logs" },
    { name: "ניתוח זמנים (Time Analytics)", path: "/time-analytics" },
    { name: "משימות, פגישות ותזכורות", path: "/tasks-meetings" },
    { name: "הצעות מחיר (Quotes)", path: "/quotes" },
    { name: "כספים (Finance)", path: "/finance" },
    { name: "תשלומים (Payments)", path: "/payments" },
    { name: "דוחות (Reports)", path: "/reports" },
    { name: "לוח שנה (Calendar)", path: "/calendar" },
    { name: "Gmail", path: "/gmail" },
    { name: "אנשי קשר (Contacts)", path: "/contacts" },
    { name: "קבצים (Files)", path: "/files" },
    { name: "כלים חכמים (Smart Tools)", path: "/smart-tools" },
    { name: "גיבויים וייבוא (Backups)", path: "/backups" },
    { name: "היסטוריה (History)", path: "/history" },
    { name: "הגדרות (Settings)", path: "/settings" },
  ];

  const results: {
    name: string;
    path: string;
    status: string;
    details: string;
  }[] = [];

  for (const tab of sidebarTabs) {
    log(`\n--- Clicking: ${tab.name} → ${tab.path} ---`);

    // Navigate using sidebar link click (not page.goto!)
    // First, make sure sidebar is visible by hovering on the left edge
    await page.mouse.move(1350, 400); // Right side where sidebar is in RTL
    await page.waitForTimeout(500);

    // Try to click the sidebar link
    const sidebarLink = page.locator(`a[href="${tab.path}"]`).first();
    const linkVisible = await sidebarLink
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!linkVisible) {
      log(`⚠️ Sidebar link for ${tab.path} NOT VISIBLE - trying scroll`);
      // Try scrolling the sidebar
      const sidebarNav = page.locator(".sidebar-nav-scroll");
      if (await sidebarNav.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sidebarNav.evaluate((el) => (el.scrollTop = 0));
        await page.waitForTimeout(300);
      }

      const linkVisibleAfterScroll = await sidebarLink
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!linkVisibleAfterScroll) {
        // Try scrolling down
        if (await sidebarNav.isVisible({ timeout: 500 }).catch(() => false)) {
          await sidebarNav.evaluate((el) => (el.scrollTop = el.scrollHeight));
          await page.waitForTimeout(300);
        }
      }
    }

    const canClick = await sidebarLink
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (canClick) {
      try {
        const beforeUrl = page.url();
        await sidebarLink.click({ timeout: 5000 });
        await page.waitForTimeout(2000);
        const afterUrl = page.url();

        if (afterUrl.includes("/auth")) {
          results.push({
            name: tab.name,
            path: tab.path,
            status: "❌ SESSION LOST",
            details: "Redirected to /auth",
          });
          log(`❌ SESSION LOST on ${tab.name}`);
          // Re-login
          const ef = page.locator("#login-email");
          if (await ef.isVisible({ timeout: 3000 }).catch(() => false)) {
            await ef.fill("jj1212t@gmail.com");
            await page.locator("#login-password").fill("543211");
            await page.locator('form button[type="submit"]').first().click();
            await page
              .waitForURL((url) => !url.pathname.includes("/auth"), {
                timeout: 10000,
              })
              .catch(() => {});
            await page.waitForTimeout(2000);
          }
        } else if (
          afterUrl === beforeUrl &&
          !tab.path.endsWith(new URL(beforeUrl).pathname)
        ) {
          results.push({
            name: tab.name,
            path: tab.path,
            status: "⚠️ NO NAVIGATION",
            details: `Stayed at ${afterUrl}`,
          });
          log(`⚠️ ${tab.name}: No navigation happened, stayed at ${afterUrl}`);
        } else {
          // Check for 404/error on page
          const bodyText =
            (await page.textContent("body").catch(() => "")) || "";
          const has404 = bodyText.includes("404") && bodyText.includes("route");
          const hasError = bodyText.includes("שגיאה") && bodyText.length < 500;

          if (has404) {
            results.push({
              name: tab.name,
              path: tab.path,
              status: "❌ 404",
              details: "Page not found",
            });
            log(`❌ ${tab.name}: 404 page`);
          } else if (hasError) {
            results.push({
              name: tab.name,
              path: tab.path,
              status: "❌ ERROR",
              details: "Error on page",
            });
            log(`❌ ${tab.name}: Error on page`);
          } else {
            results.push({
              name: tab.name,
              path: tab.path,
              status: "✅ OK",
              details: afterUrl,
            });
            log(`✅ ${tab.name}: Loaded OK at ${afterUrl}`);
          }
        }
      } catch (e: any) {
        results.push({
          name: tab.name,
          path: tab.path,
          status: "❌ CLICK FAILED",
          details: e.message.substring(0, 100),
        });
        log(`❌ ${tab.name}: Click failed - ${e.message.substring(0, 100)}`);
      }
    } else {
      // Fallback: use direct navigation
      log(`📍 Fallback: direct navigation to ${tab.path}`);
      await page.goto(`http://localhost:8080${tab.path}`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const afterUrl = page.url();
      if (afterUrl.includes("/auth")) {
        results.push({
          name: tab.name,
          path: tab.path,
          status: "❌ SESSION LOST",
          details: "Redirected to /auth",
        });
      } else {
        const bodyText = (await page.textContent("body").catch(() => "")) || "";
        const has404 = bodyText.includes("404") && bodyText.includes("route");
        if (has404) {
          results.push({
            name: tab.name,
            path: tab.path,
            status: "❌ 404",
            details: "Page not found",
          });
        } else {
          results.push({
            name: tab.name,
            path: tab.path,
            status: "✅ OK (direct)",
            details: afterUrl,
          });
        }
      }
    }
  }

  // ===== FINAL REPORT =====
  log("\n========================================");
  log("    SIDEBAR NAVIGATION FULL REPORT");
  log("========================================");

  let passed = 0,
    failed = 0;
  for (const r of results) {
    log(
      `${r.status} | ${r.name.padEnd(35)} | ${r.path.padEnd(20)} | ${r.details}`,
    );
    if (r.status.includes("✅")) passed++;
    else failed++;
  }

  log(
    `\n✅ Passed: ${passed} | ❌ Failed: ${failed} | Total: ${results.length}`,
  );
  log(`\nAll events recorded: ${events.length}`);

  await context.close();
});
