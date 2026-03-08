import { test, expect, Page } from "@playwright/test";

const EMAIL = "jj1212t@gmail.com";
const PASSWORD = "543211";

async function login(page: Page) {
  await page.goto("http://localhost:8080/auth", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  if (!page.url().includes("/auth")) {
    console.log("✅ Already logged in, skipping login");
    return;
  }

  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.toString().includes("/auth"), {
    timeout: 20000,
  });
  console.log("✅ Logged in successfully");
  await page.waitForTimeout(3000);
}

test.describe("Deep Gmail & System Investigation", () => {
  test.setTimeout(300000); // 5 minutes

  test("thorough gmail and tab switching investigation", async ({ page }) => {
    // ==============================
    // PHASE 0: Setup console monitoring
    // ==============================
    const allConsoleLogs: Array<{
      type: string;
      text: string;
      timestamp: number;
      phase: string;
    }> = [];
    let currentPhase = "init";

    const networkErrors: Array<{
      url: string;
      status: number;
      phase: string;
    }> = [];
    const jsErrors: Array<{ error: string; phase: string }> = [];

    page.on("console", (msg) => {
      const text = msg.text();
      // Skip vite noise
      if (text.includes("[vite]") || text.includes("HMR")) return;

      allConsoleLogs.push({
        type: msg.type(),
        text: text.slice(0, 500),
        timestamp: Date.now(),
        phase: currentPhase,
      });
    });

    page.on("pageerror", (err) => {
      jsErrors.push({
        error: `${err.name}: ${err.message.slice(0, 500)}`,
        phase: currentPhase,
      });
      console.log(
        `🔴 JS ERROR [${currentPhase}]: ${err.name}: ${err.message.slice(0, 200)}`,
      );
    });

    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400 && status !== 404) {
        const url = response.url();
        if (!url.includes("favicon") && !url.includes(".hot-update")) {
          networkErrors.push({
            url: url.slice(0, 200),
            status,
            phase: currentPhase,
          });
        }
      }
    });

    // ==============================
    // PHASE 1: Login
    // ==============================
    currentPhase = "login";
    console.log("\n========================================");
    console.log("🔑 PHASE 1: LOGIN");
    console.log("========================================");
    await login(page);

    await page.screenshot({
      path: "test-results/deep-01-after-login.png",
      fullPage: true,
    });
    console.log(`📍 After login URL: ${page.url()}`);

    // Check what's visible after login
    const pageTitle = await page.title();
    console.log(`📍 Page title: ${pageTitle}`);

    // ==============================
    // PHASE 2: Navigate to Gmail
    // ==============================
    currentPhase = "gmail-navigate";
    console.log("\n========================================");
    console.log("📧 PHASE 2: NAVIGATE TO GMAIL");
    console.log("========================================");

    // Navigate directly to Gmail (sidebar may be scrolled out of view)
    await page.goto("http://localhost:8080/gmail", {
      waitUntil: "domcontentloaded",
    });
    console.log("📍 Navigated to /gmail");

    await page.waitForTimeout(5000);
    console.log(`📍 Current URL after Gmail nav: ${page.url()}`);

    await page.screenshot({
      path: "test-results/deep-02-gmail-initial.png",
      fullPage: true,
    });

    // ==============================
    // PHASE 3: Investigate Gmail page state
    // ==============================
    currentPhase = "gmail-investigate";
    console.log("\n========================================");
    console.log("🔍 PHASE 3: INVESTIGATE GMAIL STATE");
    console.log("========================================");

    // Check for loading indicators
    const loadingSpinners = await page.locator(".animate-spin").count();
    console.log(`📍 Loading spinners visible: ${loadingSpinners}`);

    // Check for "connect" buttons
    const connectButtons = await page
      .locator(
        'button:has-text("חבר"), button:has-text("התחבר"), button:has-text("Connect")',
      )
      .count();
    console.log(`📍 Connect buttons found: ${connectButtons}`);

    // Check for error messages
    const errorElements = await page
      .locator(
        '[class*="error"], [class*="destructive"], .text-red-500, .text-destructive',
      )
      .count();
    console.log(`📍 Error elements found: ${errorElements}`);

    // Check for "מתחבר" / connecting indicators
    const connectingText = await page.locator("text=מתחבר").count();
    console.log(`📍 "מתחבר" (connecting) elements: ${connectingText}`);

    // Check the main content area text
    const mainContent = await page
      .locator("main, [role='main'], .flex-1")
      .first();
    if (await mainContent.isVisible()) {
      const mainText = await mainContent.innerText();
      console.log(
        `📍 Main content text (first 500 chars): ${mainText.slice(0, 500)}`,
      );
    }

    // Check for Google connection status indicators
    const googleConnected = await page
      .locator("text=מחובר, text=Google מחובר")
      .count();
    const googleDisconnected = await page
      .locator("text=לא מחובר, text=לא מחובר ל-Google, text=חבר חשבון Google")
      .count();
    console.log(`📍 Google "connected" indicators: ${googleConnected}`);
    console.log(`📍 Google "disconnected" indicators: ${googleDisconnected}`);

    // Wait more and screenshot
    await page.waitForTimeout(5000);
    await page.screenshot({
      path: "test-results/deep-03-gmail-after-wait.png",
      fullPage: true,
    });

    // Check loading state again
    const loadingSpinners2 = await page.locator(".animate-spin").count();
    console.log(`📍 Loading spinners after 10s total: ${loadingSpinners2}`);

    // ==============================
    // PHASE 4: Check cloud/Supabase connection
    // ==============================
    currentPhase = "cloud-check";
    console.log("\n========================================");
    console.log("☁️ PHASE 4: CHECK CLOUD CONNECTION");
    console.log("========================================");

    // Count Supabase-related errors so far
    const supabaseErrors = allConsoleLogs.filter(
      (l) =>
        l.type === "error" &&
        (l.text.includes("supabase") ||
          l.text.includes("Supabase") ||
          l.text.includes("Failed to fetch") ||
          l.text.includes("NetworkError") ||
          l.text.includes("fetch")),
    );
    console.log(`📍 Supabase/fetch errors so far: ${supabaseErrors.length}`);
    supabaseErrors.forEach((e, i) => {
      console.log(`   [${i + 1}] ${e.phase}: ${e.text.slice(0, 150)}`);
    });

    // Count Google API errors
    const googleErrors = allConsoleLogs.filter(
      (l) =>
        l.type === "error" &&
        (l.text.includes("google") ||
          l.text.includes("Google") ||
          l.text.includes("gapi") ||
          l.text.includes("oauth") ||
          l.text.includes("googleapis")),
    );
    console.log(`📍 Google API errors so far: ${googleErrors.length}`);
    googleErrors.forEach((e, i) => {
      console.log(`   [${i + 1}] ${e.phase}: ${e.text.slice(0, 150)}`);
    });

    // Check all console warnings
    const warnings = allConsoleLogs.filter((l) => l.type === "warning");
    console.log(`📍 Console warnings so far: ${warnings.length}`);
    warnings.slice(0, 10).forEach((w, i) => {
      console.log(`   [${i + 1}] ${w.phase}: ${w.text.slice(0, 150)}`);
    });

    // ==============================
    // PHASE 5: Try interacting with Gmail page
    // ==============================
    currentPhase = "gmail-interact";
    console.log("\n========================================");
    console.log("🖱️ PHASE 5: INTERACT WITH GMAIL");
    console.log("========================================");

    // Click any "connect" button if present
    if (connectButtons > 0) {
      console.log("📍 Clicking connect button...");
      await page
        .locator(
          'button:has-text("חבר"), button:has-text("התחבר"), button:has-text("Connect")',
        )
        .first()
        .click();
      await page.waitForTimeout(5000);
      await page.screenshot({
        path: "test-results/deep-04-after-connect-click.png",
        fullPage: true,
      });
      console.log(`📍 URL after connect click: ${page.url()}`);
    }

    // Try clicking tabs within Gmail page
    const gmailTabs = await page
      .locator('[role="tab"], [role="tablist"] button')
      .all();
    console.log(`📍 Tab elements found on Gmail page: ${gmailTabs.length}`);
    for (const tab of gmailTabs.slice(0, 5)) {
      const tabText = await tab.innerText().catch(() => "unknown");
      console.log(`   Tab: "${tabText}"`);
    }

    // Check for inbox/sent/draft folder structure
    const folderLinks = await page
      .locator(
        "text=נכנסים, text=נשלחו, text=טיוטות, text=Inbox, text=Sent, text=Draft",
      )
      .count();
    console.log(`📍 Email folder links found: ${folderLinks}`);

    // ==============================
    // PHASE 6: Switch to another tab and back
    // ==============================
    currentPhase = "tab-switch";
    console.log("\n========================================");
    console.log("🔄 PHASE 6: TAB SWITCHING FROM GMAIL");
    console.log("========================================");

    const tabsToTest = [
      { name: "דשבורד", path: "/" },
      { name: "לקוחות", path: "/clients" },
      { name: "משימות ופגישות", path: "/tasks-meetings" },
      { name: "יומן", path: "/calendar" },
      { name: "הגדרות", path: "/settings" },
    ];

    for (const tab of tabsToTest) {
      currentPhase = `switch-to-${tab.name}`;
      console.log(`\n--- Switching to ${tab.name} (${tab.path}) ---`);

      const startTime = Date.now();

      // Navigate directly (sidebar may be scrolled out of view)
      await page.goto(`http://localhost:8080${tab.path}`, {
        waitUntil: "domcontentloaded",
      });

      await page.waitForTimeout(3000);
      const loadTime = Date.now() - startTime;
      console.log(
        `📍 ${tab.name}: loaded in ${loadTime}ms, URL: ${page.url()}`,
      );

      // Check for JS errors during navigation
      const errorsInPhase = jsErrors.filter((e) => e.phase === currentPhase);
      if (errorsInPhase.length > 0) {
        console.log(`🔴 JS errors during ${tab.name} navigation:`);
        errorsInPhase.forEach((e) => console.log(`   ${e.error}`));
      }

      // Check for loading spinners
      const spinners = await page.locator(".animate-spin").count();
      if (spinners > 0) {
        console.log(
          `⏳ ${tab.name}: ${spinners} loading spinners still visible`,
        );
      }

      // Check page isn't blank
      const bodyText = await page.locator("body").innerText();
      const hasContent = bodyText.trim().length > 50;
      console.log(
        `${hasContent ? "✅" : "🔴"} ${tab.name}: content present (${bodyText.trim().length} chars)`,
      );

      await page.screenshot({
        path: `test-results/deep-05-tab-${tab.name}.png`,
        fullPage: true,
      });
    }

    // ==============================
    // PHASE 7: Go back to Gmail
    // ==============================
    currentPhase = "gmail-return";
    console.log("\n========================================");
    console.log("📧 PHASE 7: RETURN TO GMAIL");
    console.log("========================================");

    // Navigate directly back to Gmail
    await page.goto("http://localhost:8080/gmail", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(5000);

    console.log(`📍 Gmail return URL: ${page.url()}`);
    const spinners3 = await page.locator(".animate-spin").count();
    console.log(`📍 Loading spinners on Gmail return: ${spinners3}`);

    await page.screenshot({
      path: "test-results/deep-06-gmail-return.png",
      fullPage: true,
    });

    // ==============================
    // PHASE 8: Rapid tab switching stress test
    // ==============================
    currentPhase = "rapid-switch";
    console.log("\n========================================");
    console.log("⚡ PHASE 8: RAPID TAB SWITCHING");
    console.log("========================================");

    const rapidTabs = [
      "/gmail",
      "/clients",
      "/gmail",
      "/tasks-meetings",
      "/gmail",
      "/calendar",
      "/gmail",
      "/settings",
      "/gmail",
    ];
    for (const path of rapidTabs) {
      // Use direct navigation for reliability during rapid switching
      await page.goto(`http://localhost:8080${path}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(1500);
      const tabJsErrors = jsErrors.filter((e) => e.phase === "rapid-switch");
      if (tabJsErrors.length > 0) {
        console.log(
          `🔴 JS error during rapid switch to ${path}: ${tabJsErrors[tabJsErrors.length - 1].error.slice(0, 100)}`,
        );
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "test-results/deep-07-after-rapid-switch.png",
      fullPage: true,
    });

    // Check page is still responsive
    const bodyExists = await page.locator("body").isVisible();
    console.log(`📍 Page responsive after rapid switching: ${bodyExists}`);

    // ==============================
    // PHASE 9: Check localStorage/sessionStorage state
    // ==============================
    currentPhase = "storage-check";
    console.log("\n========================================");
    console.log("💾 PHASE 9: LOCAL STORAGE STATE");
    console.log("========================================");

    const storageInfo = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const googleKeys = keys.filter(
        (k) =>
          k.includes("google") ||
          k.includes("Google") ||
          k.includes("gmail") ||
          k.includes("Gmail") ||
          k.includes("token") ||
          k.includes("Token") ||
          k.includes("oauth"),
      );
      const supabaseKeys = keys.filter(
        (k) => k.includes("supabase") || k.includes("sb-"),
      );
      const appKeys = keys.filter(
        (k) =>
          k.includes("crm") ||
          k.includes("theme") ||
          k.includes("sidebar") ||
          k.includes("calendar"),
      );

      const result: Record<string, string> = {};
      googleKeys.forEach((k) => {
        const val = localStorage.getItem(k);
        result[k] = val ? val.slice(0, 100) : "null";
      });

      return {
        totalKeys: keys.length,
        googleKeys: googleKeys,
        supabaseKeys: supabaseKeys.length,
        appKeys: appKeys.length,
        googleValues: result,
        allKeys: keys.sort(),
      };
    });

    console.log(`📍 Total localStorage keys: ${storageInfo.totalKeys}`);
    console.log(`📍 Google-related keys: ${storageInfo.googleKeys.length}`);
    storageInfo.googleKeys.forEach((k) => {
      console.log(`   ${k}: ${storageInfo.googleValues[k]}`);
    });
    console.log(`📍 Supabase keys: ${storageInfo.supabaseKeys}`);
    console.log(`📍 App keys: ${storageInfo.appKeys}`);
    console.log(`📍 All keys: ${storageInfo.allKeys.join(", ")}`);

    // ==============================
    // FINAL SUMMARY
    // ==============================
    console.log("\n========================================");
    console.log("📊 FINAL SUMMARY");
    console.log("========================================");

    const totalJsErrors = jsErrors.length;
    const totalConsoleErrors = allConsoleLogs.filter(
      (l) => l.type === "error",
    ).length;
    const totalNetworkErrors = networkErrors.length;

    console.log(`🔴 JS Errors (page crashes): ${totalJsErrors}`);
    jsErrors.forEach((e, i) => {
      console.log(`   [${i + 1}] [${e.phase}] ${e.error.slice(0, 200)}`);
    });

    console.log(`\n⚠️ Console errors: ${totalConsoleErrors}`);
    const uniqueErrors = [
      ...new Set(
        allConsoleLogs
          .filter((l) => l.type === "error")
          .map((l) => l.text.slice(0, 100)),
      ),
    ];
    uniqueErrors.forEach((e, i) => {
      console.log(`   [${i + 1}] ${e}`);
    });

    console.log(`\n🌐 Network errors (non-404): ${totalNetworkErrors}`);
    networkErrors.slice(0, 10).forEach((e, i) => {
      console.log(`   [${i + 1}] [${e.phase}] ${e.status}: ${e.url}`);
    });

    console.log(`\n⚠️ Console warnings: ${warnings.length}`);

    // Log all console errors grouped by phase
    console.log(`\n📋 All errors by phase:`);
    const phases = [
      ...new Set(
        allConsoleLogs.filter((l) => l.type === "error").map((l) => l.phase),
      ),
    ];
    phases.forEach((phase) => {
      const phaseErrors = allConsoleLogs.filter(
        (l) => l.type === "error" && l.phase === phase,
      );
      console.log(`   ${phase}: ${phaseErrors.length} errors`);
    });

    // The test passes if no JS crashes occurred
    console.log(
      `\n${totalJsErrors === 0 ? "✅" : "🔴"} Test ${totalJsErrors === 0 ? "PASSED" : "FAILED"}: ${totalJsErrors} JS errors`,
    );
  });
});
