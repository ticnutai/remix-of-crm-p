import { test, expect, Page } from "@playwright/test";

const EMAIL = "jj1212t@gmail.com";
const PASSWORD = "543211";
const BASE = "http://localhost:8080";

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE}/auth`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(2000);
  if (!page.url().includes("/auth")) {
    console.log("✅ Already logged in");
    return;
  }
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.toString().includes("/auth"), {
    timeout: 20000,
  });
  console.log("✅ Logged in");
  await page.waitForTimeout(2000);
}

/** Check page is alive: not blank, no error boundary, no freeze */
async function healthCheck(
  page: Page,
  label: string,
): Promise<{
  ok: boolean;
  bodyLen: number;
  hasError: boolean;
  isFrozen: boolean;
  redirectedToAuth: boolean;
  details: string;
}> {
  const result = {
    ok: true,
    bodyLen: 0,
    hasError: false,
    isFrozen: false,
    redirectedToAuth: false,
    details: "",
  };

  // Auth redirect?
  if (page.url().includes("/auth")) {
    result.ok = false;
    result.redirectedToAuth = true;
    result.details = "Redirected to /auth — session lost";
    return result;
  }

  // Page content length
  result.bodyLen = await page.evaluate(
    () => document.body?.innerText?.trim()?.length || 0,
  );
  if (result.bodyLen < 15) {
    result.ok = false;
    result.details += `Blank page (${result.bodyLen} chars). `;
  }

  // Error boundary / crash text
  const errCount = await page
    .locator("text=/שגיאה|Error|Something went wrong|crashed/i")
    .count();
  if (errCount > 0) {
    result.hasError = true;
    result.ok = false;
    result.details += `Error boundary detected (${errCount} matches). `;
  }

  // Frozen check via rAF
  try {
    await page.evaluate(
      () =>
        new Promise<void>((r) => {
          requestAnimationFrame(() => r());
        }),
      { timeout: 5000 },
    );
  } catch {
    result.isFrozen = true;
    result.ok = false;
    result.details += "Page frozen (rAF timeout). ";
  }

  if (result.ok) result.details = "OK";
  return result;
}

/** Safely screenshot, returns true if succeeded */
async function safeScreenshot(page: Page, name: string): Promise<boolean> {
  try {
    await page.screenshot({
      path: `test-results/${name}.png`,
      fullPage: true,
      timeout: 10000,
    });
    return true;
  } catch {
    console.log(`  ⚠️ Screenshot failed: ${name}`);
    return false;
  }
}

/** Navigate to a path and wait for it to settle */
async function navigateTo(
  page: Page,
  path: string,
  settleMs = 3000,
): Promise<number> {
  const start = Date.now();
  await page.goto(`${BASE}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await page.waitForTimeout(settleMs);
  return Date.now() - start;
}

// ──────────────────────────────────────────────────────────
// All tabs in the app
// ──────────────────────────────────────────────────────────
const ALL_TABS = [
  { name: "דשבורד", path: "/" },
  { name: "לקוחות", path: "/clients" },
  { name: "יומן", path: "/calendar" },
  { name: "עובדים", path: "/employees" },
  { name: "דוחות", path: "/reports" },
  { name: "הגדרות", path: "/settings" },
  { name: "משימות ופגישות", path: "/tasks-meetings" },
  { name: "פיננסים", path: "/finance" },
  { name: "Gmail", path: "/gmail" },
  { name: "קבצים", path: "/files" },
  { name: "אנשי קשר", path: "/contacts" },
  { name: "הצעות מחיר", path: "/quotes" },
  { name: "היום שלי", path: "/my-day" },
  { name: "לוג זמנים", path: "/time-logs" },
  { name: "קנבן", path: "/kanban" },
  { name: "כלים חכמים", path: "/smart-tools" },
  { name: "מסמכים", path: "/documents" },
  { name: "אנליטיקס", path: "/analytics" },
];

// ──────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────

test.describe("Gmail Deep Navigation Test", () => {
  test.setTimeout(300000); // 5 minutes

  test("Gmail tab — connect attempt, then navigate all tabs, then return", async ({
    page,
  }) => {
    // ── Collect errors ──
    const consoleErrors: string[] = [];
    const jsErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("[vite]") ||
          text.includes("HMR") ||
          text.includes("favicon")
        )
          return;
        consoleErrors.push(text.slice(0, 300));
      }
    });

    page.on("pageerror", (err) => {
      jsErrors.push(`${err.name}: ${err.message.slice(0, 300)}`);
    });

    page.on("requestfailed", (req) => {
      const url = req.url();
      if (url.includes("favicon") || url.includes("hot-update")) return;
      networkErrors.push(
        `${req.method()} ${url.slice(0, 150)} → ${req.failure()?.errorText || "unknown"}`,
      );
    });

    // ═══════════════════════════════════════════════════════
    // PHASE 1: Login
    // ═══════════════════════════════════════════════════════
    console.log("\n═══ PHASE 1: LOGIN ═══");
    await login(page);
    await safeScreenshot(page, "01-after-login");

    const phaseResults: Array<{
      phase: string;
      tab: string;
      path: string;
      loadTime: number;
      health: Awaited<ReturnType<typeof healthCheck>>;
    }> = [];

    // ═══════════════════════════════════════════════════════
    // PHASE 2: Go to Gmail tab (not connected)
    // ═══════════════════════════════════════════════════════
    console.log("\n═══ PHASE 2: GMAIL TAB (NOT CONNECTED) ═══");
    let loadTime = await navigateTo(page, "/gmail", 4000);
    let health = await healthCheck(page, "Gmail initial");
    phaseResults.push({
      phase: "2-gmail-initial",
      tab: "Gmail",
      path: "/gmail",
      loadTime,
      health,
    });
    console.log(`  Gmail initial: ${health.details} (${loadTime}ms)`);
    await safeScreenshot(page, "02-gmail-not-connected");

    // Verify "not connected" UI is visible
    const connectBtn = page.locator(
      'button:has-text("התחבר עכשיו"), button:has-text("התחבר ל-Gmail")',
    );
    const connectBtnCount = await connectBtn.count();
    console.log(`  Connect buttons found: ${connectBtnCount}`);
    expect(connectBtnCount).toBeGreaterThan(0);

    // ═══════════════════════════════════════════════════════
    // PHASE 3: Click connect button (will fail — no real OAuth)
    // ═══════════════════════════════════════════════════════
    console.log("\n═══ PHASE 3: CLICK CONNECT (EXPECT FAILURE) ═══");
    const errsBefore = jsErrors.length;
    const consoleErrsBefore = consoleErrors.length;

    // Click and wait — OAuth popup will likely fail
    try {
      // Listen for popup
      const popupPromise = page
        .waitForEvent("popup", { timeout: 8000 })
        .catch(() => null);
      await connectBtn.first().click();
      const popup = await popupPromise;

      if (popup) {
        console.log(`  OAuth popup opened: ${popup.url()}`);
        // Close it to simulate user cancelling
        await popup.close();
        console.log("  Closed OAuth popup (simulating cancel)");
      } else {
        console.log("  No OAuth popup appeared (expected in test environment)");
      }
    } catch (e: any) {
      console.log(`  Connect click handling: ${e.message?.slice(0, 100)}`);
    }

    await page.waitForTimeout(3000);
    await safeScreenshot(page, "03-gmail-after-connect-attempt");

    // Check Gmail page is still alive after the failed connect
    health = await healthCheck(page, "Gmail after connect");
    phaseResults.push({
      phase: "3-gmail-after-connect",
      tab: "Gmail",
      path: "/gmail",
      loadTime: 0,
      health,
    });
    console.log(`  Gmail after connect attempt: ${health.details}`);

    const newJsErrors = jsErrors.slice(errsBefore);
    const newConsoleErrors = consoleErrors.slice(consoleErrsBefore);
    if (newJsErrors.length > 0) {
      console.log(`  ⚠️ New JS errors after connect: ${newJsErrors.length}`);
      newJsErrors.forEach((e) => console.log(`    • ${e.slice(0, 150)}`));
    }
    if (newConsoleErrors.length > 0) {
      console.log(
        `  ⚠️ New console errors after connect: ${newConsoleErrors.length}`,
      );
      newConsoleErrors
        .slice(0, 5)
        .forEach((e) => console.log(`    • ${e.slice(0, 150)}`));
    }

    // Page should NOT be in error boundary state
    const gmailErrorBoundary = await page
      .locator("text=/שגיאה בטעינת/i")
      .count();
    if (gmailErrorBoundary > 0) {
      console.log("  ❌ Gmail error boundary activated!");
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 4: Navigate FROM Gmail to every other tab
    // ═══════════════════════════════════════════════════════
    console.log("\n═══ PHASE 4: NAVIGATE FROM GMAIL → ALL TABS ═══");
    const otherTabs = ALL_TABS.filter((t) => t.path !== "/gmail");

    for (const tab of otherTabs) {
      console.log(`\n  📌 Gmail → ${tab.name} (${tab.path})`);
      const jsErrsBefore = jsErrors.length;

      try {
        loadTime = await navigateTo(page, tab.path, 3000);
        health = await healthCheck(page, `${tab.name} after Gmail`);
        phaseResults.push({
          phase: "4-from-gmail",
          tab: tab.name,
          path: tab.path,
          loadTime,
          health,
        });

        if (health.redirectedToAuth) {
          console.log(`  ❌ ${tab.name}: Session lost! Re-logging in...`);
          await login(page);
          continue;
        }

        // Check for interactive elements (page not empty shell)
        const interactiveCount = await page
          .locator('button, a, input, select, [role="button"]')
          .count();
        console.log(
          `  ${health.ok ? "✅" : "❌"} ${tab.name}: ${health.details} | ${interactiveCount} interactive elements | ${loadTime}ms`,
        );

        const safeName = tab.name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_");
        await safeScreenshot(page, `04-from-gmail-${safeName}`);

        // Any new JS errors caused by this navigation?
        const tabNewJsErrors = jsErrors.slice(jsErrsBefore);
        if (tabNewJsErrors.length > 0) {
          console.log(
            `  ⚠️ ${tab.name} caused ${tabNewJsErrors.length} JS error(s):`,
          );
          tabNewJsErrors.forEach((e) =>
            console.log(`    • ${e.slice(0, 150)}`),
          );
        }
      } catch (e: any) {
        console.log(
          `  ❌ ${tab.name}: Navigation failed — ${e.message?.slice(0, 150)}`,
        );
        phaseResults.push({
          phase: "4-from-gmail",
          tab: tab.name,
          path: tab.path,
          loadTime: 0,
          health: {
            ok: false,
            bodyLen: 0,
            hasError: false,
            isFrozen: false,
            redirectedToAuth: false,
            details: `Nav error: ${e.message?.slice(0, 100)}`,
          },
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 5: Return to Gmail after visiting all tabs
    // ═══════════════════════════════════════════════════════
    console.log("\n═══ PHASE 5: RETURN TO GMAIL ═══");
    loadTime = await navigateTo(page, "/gmail", 4000);
    health = await healthCheck(page, "Gmail return");
    phaseResults.push({
      phase: "5-gmail-return",
      tab: "Gmail",
      path: "/gmail",
      loadTime,
      health,
    });
    console.log(`  Gmail on return: ${health.details} (${loadTime}ms)`);
    await safeScreenshot(page, "05-gmail-return");

    // ═══════════════════════════════════════════════════════
    // PHASE 6: Rapid tab switching (stress test)
    // ═══════════════════════════════════════════════════════
    console.log("\n═══ PHASE 6: RAPID TAB SWITCHING (STRESS TEST) ═══");
    const rapidSequence = [
      "/gmail",
      "/clients",
      "/gmail",
      "/tasks-meetings",
      "/gmail",
      "/settings",
      "/gmail",
      "/finance",
      "/gmail",
      "/calendar",
      "/gmail",
      "/quotes",
      "/gmail",
    ];

    for (const path of rapidSequence) {
      const tabName = ALL_TABS.find((t) => t.path === path)?.name || path;
      try {
        // Shorter settle time to simulate rapid switching
        loadTime = await navigateTo(page, path, 1500);
        health = await healthCheck(page, `rapid-${tabName}`);
        phaseResults.push({
          phase: "6-rapid",
          tab: tabName,
          path,
          loadTime,
          health,
        });

        if (!health.ok) {
          console.log(`  ❌ Rapid switch to ${tabName}: ${health.details}`);
          if (health.redirectedToAuth) {
            await login(page);
          }
        } else {
          console.log(`  ✅ ${tabName} (${loadTime}ms)`);
        }
      } catch (e: any) {
        console.log(`  ❌ Rapid ${tabName}: ${e.message?.slice(0, 100)}`);
        phaseResults.push({
          phase: "6-rapid",
          tab: tabName,
          path,
          loadTime: 0,
          health: {
            ok: false,
            bodyLen: 0,
            hasError: false,
            isFrozen: false,
            redirectedToAuth: false,
            details: e.message?.slice(0, 100) || "unknown",
          },
        });
      }
    }

    await safeScreenshot(page, "06-after-rapid-switching");

    // ═══════════════════════════════════════════════════════
    // PHASE 7: Navigate via sidebar (click links, not goto)
    // ═══════════════════════════════════════════════════════
    console.log("\n═══ PHASE 7: SIDEBAR NAVIGATION (CLICK) ═══");
    // First ensure we're on a stable page
    await navigateTo(page, "/", 3000);

    const sidebarTestTabs = [
      { name: "Gmail", path: "/gmail" },
      { name: "לקוחות", path: "/clients" },
      { name: "משימות ופגישות", path: "/tasks-meetings" },
      { name: "הגדרות", path: "/settings" },
      { name: "Gmail", path: "/gmail" },
    ];

    for (const tab of sidebarTestTabs) {
      console.log(`  📌 Sidebar click → ${tab.name}`);
      try {
        // Hover right edge to open overlay sidebar (RTL: right side)
        await page.mouse.move(page.viewportSize()!.width - 5, 300);
        await page.waitForTimeout(800);

        // Find and click the sidebar link
        const sidebarLink = page
          .locator(
            `nav a[href="${tab.path}"], aside a[href="${tab.path}"], [data-sidebar] a[href="${tab.path}"]`,
          )
          .first();
        const linkVisible = await sidebarLink.isVisible().catch(() => false);

        if (linkVisible) {
          await sidebarLink.click();
          await page.waitForTimeout(3000);
          health = await healthCheck(page, `sidebar-${tab.name}`);
          phaseResults.push({
            phase: "7-sidebar",
            tab: tab.name,
            path: tab.path,
            loadTime: 0,
            health,
          });
          console.log(
            `  ${health.ok ? "✅" : "❌"} ${tab.name}: ${health.details}`,
          );
        } else {
          // Try clicking by text in the sidebar area
          const textLink = page.locator(`a:has-text("${tab.name}")`).first();
          const textVisible = await textLink.isVisible().catch(() => false);
          if (textVisible) {
            await textLink.click();
            await page.waitForTimeout(3000);
            health = await healthCheck(page, `sidebar-${tab.name}`);
            phaseResults.push({
              phase: "7-sidebar",
              tab: tab.name,
              path: tab.path,
              loadTime: 0,
              health,
            });
            console.log(
              `  ${health.ok ? "✅" : "❌"} ${tab.name}: ${health.details}`,
            );
          } else {
            console.log(
              `  ⚠️ Sidebar link not found for ${tab.name}, falling back to goto`,
            );
            await navigateTo(page, tab.path, 3000);
            health = await healthCheck(page, `sidebar-fallback-${tab.name}`);
            phaseResults.push({
              phase: "7-sidebar",
              tab: tab.name,
              path: tab.path,
              loadTime: 0,
              health,
            });
          }
        }

        const safeName = tab.name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_");
        await safeScreenshot(page, `07-sidebar-${safeName}`);
      } catch (e: any) {
        console.log(`  ❌ Sidebar ${tab.name}: ${e.message?.slice(0, 100)}`);
      }
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 8: Gmail interactions while on the page
    // ═══════════════════════════════════════════════════════
    console.log("\n═══ PHASE 8: GMAIL PAGE INTERACTIONS ═══");
    await navigateTo(page, "/gmail", 4000);

    // Try clicking various buttons/elements on Gmail page
    const interactionTests = [
      {
        label: "Refresh button",
        selector:
          'button:has-text("רענון"), button:has(svg.lucide-refresh-cw), button:has(svg.lucide-rotate-cw)',
      },
      {
        label: "Search input",
        selector: 'input[placeholder*="חיפוש"], input[type="search"]',
      },
      { label: "Connect button again", selector: 'button:has-text("התחבר")' },
    ];

    for (const { label, selector } of interactionTests) {
      try {
        const el = page.locator(selector).first();
        const visible = await el.isVisible().catch(() => false);
        if (visible) {
          if (label.includes("Search")) {
            await el.fill("test search");
            await page.waitForTimeout(1000);
            await el.fill("");
            console.log(`  ✅ ${label}: interacted OK`);
          } else {
            // For buttons, just click with a popup listener
            const popupP = page
              .waitForEvent("popup", { timeout: 3000 })
              .catch(() => null);
            await el.click();
            const popup = await popupP;
            if (popup) await popup.close();
            await page.waitForTimeout(2000);
            console.log(`  ✅ ${label}: clicked OK`);
          }
        } else {
          console.log(`  ⚠️ ${label}: not visible`);
        }
      } catch (e: any) {
        console.log(`  ⚠️ ${label}: ${e.message?.slice(0, 80)}`);
      }
    }

    health = await healthCheck(page, "Gmail after interactions");
    phaseResults.push({
      phase: "8-gmail-interactions",
      tab: "Gmail",
      path: "/gmail",
      loadTime: 0,
      health,
    });
    console.log(`  Gmail after interactions: ${health.details}`);
    await safeScreenshot(page, "08-gmail-after-interactions");

    // ═══════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════
    console.log("\n\n" + "═".repeat(70));
    console.log("📊 DEEP NAVIGATION TEST — FULL SUMMARY");
    console.log("═".repeat(70));

    // Group by phase
    const phases = [...new Set(phaseResults.map((r) => r.phase))];
    for (const phase of phases) {
      const items = phaseResults.filter((r) => r.phase === phase);
      console.log(`\n── ${phase} ──`);
      for (const r of items) {
        const icon = r.health.ok ? "✅" : "❌";
        console.log(
          `  ${icon} ${r.tab} (${r.path}) — ${r.health.details} ${r.loadTime ? `[${r.loadTime}ms]` : ""}`,
        );
      }
    }

    // Error summary
    const uniqueJsErrors = [...new Set(jsErrors)];
    const uniqueConsoleErrors = [...new Set(consoleErrors)];

    console.log(`\n── Error Summary ──`);
    console.log(
      `  JavaScript errors: ${jsErrors.length} total, ${uniqueJsErrors.length} unique`,
    );
    console.log(
      `  Console errors:    ${consoleErrors.length} total, ${uniqueConsoleErrors.length} unique`,
    );
    console.log(`  Network failures:  ${networkErrors.length}`);

    if (uniqueJsErrors.length > 0) {
      console.log(`\n🔴 JavaScript Errors:`);
      uniqueJsErrors.forEach((e) => console.log(`  • ${e.slice(0, 250)}`));
    }

    if (uniqueConsoleErrors.length > 0) {
      console.log(`\n🟡 Console Errors:`);
      uniqueConsoleErrors
        .slice(0, 15)
        .forEach((e) => console.log(`  • ${e.slice(0, 250)}`));
    }

    if (networkErrors.length > 0) {
      console.log(`\n🟠 Network Failures:`);
      [...new Set(networkErrors)]
        .slice(0, 10)
        .forEach((e) => console.log(`  • ${e}`));
    }

    // Pass/fail counts
    const totalChecks = phaseResults.length;
    const passed = phaseResults.filter((r) => r.health.ok).length;
    const failed = phaseResults.filter((r) => !r.health.ok).length;
    const frozen = phaseResults.filter((r) => r.health.isFrozen).length;
    const errorBoundaries = phaseResults.filter(
      (r) => r.health.hasError,
    ).length;
    const authLost = phaseResults.filter(
      (r) => r.health.redirectedToAuth,
    ).length;

    console.log(`\n── Final Score ──`);
    console.log(`  Total checks:     ${totalChecks}`);
    console.log(`  ✅ Passed:        ${passed}`);
    console.log(`  ❌ Failed:        ${failed}`);
    console.log(`  🧊 Frozen:        ${frozen}`);
    console.log(`  💥 Error boundary: ${errorBoundaries}`);
    console.log(`  🔒 Auth lost:     ${authLost}`);
    console.log(
      `  Pass rate:        ${((passed / totalChecks) * 100).toFixed(1)}%`,
    );
    console.log("═".repeat(70));

    // Assert pass rate >= 80%
    expect(passed / totalChecks).toBeGreaterThanOrEqual(0.8);
    // Assert no pages were frozen
    expect(frozen).toBe(0);
  });
});
