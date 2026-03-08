/**
 * Tab Navigation Test - After Gmail, switch to other tabs
 * Login → Gmail → Dashboard → Clients → and more
 */
import { test, expect } from "@playwright/test";

test("Navigate between tabs after Gmail", async ({ page }) => {
  test.setTimeout(120000);
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error")
      consoleErrors.push(msg.text().substring(0, 200));
  });
  page.on("response", (res) => {
    if (res.status() >= 400)
      networkErrors.push(`${res.status()} ${res.url().substring(0, 120)}`);
  });
  page.on("pageerror", (err) => pageErrors.push(err.message.substring(0, 200)));

  // ===== LOGIN =====
  console.log("=== LOGIN ===");
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
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    console.log("✅ Logged in, URL:", page.url());
  }

  // Define tabs to test
  const tabs = [
    { name: "Gmail", path: "/gmail", expectText: ["התחבר", "Gmail", "דואר"] },
    {
      name: "Dashboard",
      path: "/",
      expectText: ["דשבורד", "לוח בקרה", "סיכום", "ברוך"],
    },
    {
      name: "Clients",
      path: "/clients",
      expectText: ["לקוחות", "חיפוש", "הוסף"],
    },
    { name: "Projects", path: "/projects", expectText: ["פרויקטים", "פרויקט"] },
    { name: "Tasks", path: "/tasks", expectText: ["משימות", "משימה"] },
    {
      name: "Calendar",
      path: "/calendar",
      expectText: ["לוח שנה", "יומן", "calendar"],
    },
    {
      name: "Reports",
      path: "/reports",
      expectText: ["דוחות", "דוח", "סטטיסטיקות"],
    },
    { name: "Settings", path: "/settings", expectText: ["הגדרות", "settings"] },
  ];

  const results: {
    name: string;
    status: string;
    url: string;
    errors: number;
    networkErrs: number;
    loadTime: number;
  }[] = [];

  for (const tab of tabs) {
    console.log(`\n--- Navigating to: ${tab.name} (${tab.path}) ---`);

    // Clear error counters
    const errsBefore = consoleErrors.length;
    const netErrsBefore = networkErrors.length;

    const startTime = Date.now();

    await page.goto(`http://localhost:8080${tab.path}`, { timeout: 30000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    const loadTime = Date.now() - startTime;
    const currentUrl = page.url();

    // Check if we got redirected to auth (session lost)
    if (currentUrl.includes("/auth")) {
      console.log(`❌ ${tab.name}: Redirected to /auth - SESSION LOST!`);
      results.push({
        name: tab.name,
        status: "SESSION_LOST",
        url: currentUrl,
        errors: 0,
        networkErrs: 0,
        loadTime,
      });

      // Re-login
      const emailField = page.locator("#login-email");
      if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailField.fill("jj1212t@gmail.com");
        await page.locator("#login-password").fill("543211");
        await page.locator('form button[type="submit"]').first().click();
        await page
          .waitForURL((url) => !url.pathname.includes("/auth"), {
            timeout: 10000,
          })
          .catch(() => {});
        await page.waitForTimeout(2000);
        console.log("  Re-logged in");
      }
      continue;
    }

    // Check page loaded content
    const bodyText = (await page.textContent("body")) || "";
    const hasExpectedContent = tab.expectText.some(
      (text) =>
        bodyText.includes(text) ||
        bodyText.toLowerCase().includes(text.toLowerCase()),
    );

    // Check for visible errors on page
    const hasErrorOnPage =
      bodyText.includes("שגיאה") ||
      bodyText.includes("Error") ||
      bodyText.includes("404");

    const newConsoleErrs = consoleErrors.length - errsBefore;
    const newNetworkErrs = networkErrors.length - netErrsBefore;

    let status = "✅ OK";
    if (!hasExpectedContent) status = "⚠️ No expected content";
    if (hasErrorOnPage) status = "❌ Error on page";
    if (newConsoleErrs > 3) status = "⚠️ Console errors";

    console.log(
      `${status} | ${tab.name} | URL: ${currentUrl} | Load: ${loadTime}ms | Console errors: ${newConsoleErrs} | Network errors: ${newNetworkErrs}`,
    );

    results.push({
      name: tab.name,
      status,
      url: currentUrl,
      errors: newConsoleErrs,
      networkErrs: newNetworkErrs,
      loadTime,
    });

    // Take screenshot
    await page.screenshot({
      path: `test-results/tab-${tab.name.toLowerCase()}.png`,
      fullPage: false,
    });
  }

  // ===== RAPID SWITCHING TEST =====
  console.log("\n=== RAPID SWITCHING TEST ===");
  const rapidTabs = [
    "/",
    "/clients",
    "/gmail",
    "/projects",
    "/tasks",
    "/",
    "/calendar",
    "/clients",
    "/gmail",
  ];

  for (const path of rapidTabs) {
    await page.goto(`http://localhost:8080${path}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
  }
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const finalUrl = page.url();
  const rapidSwitchOk = !finalUrl.includes("/auth");
  console.log(
    `Rapid switch result: ${rapidSwitchOk ? "✅ OK" : "❌ Session lost"} | Final URL: ${finalUrl}`,
  );

  // ===== FINAL SUMMARY =====
  console.log("\n========================================");
  console.log("         TAB NAVIGATION SUMMARY");
  console.log("========================================");

  for (const r of results) {
    console.log(
      `  ${r.status} | ${r.name.padEnd(12)} | ${r.loadTime}ms | Errs: ${r.errors} console, ${r.networkErrs} network`,
    );
  }

  console.log(`\nTotal console errors: ${consoleErrors.length}`);
  console.log(`Total network errors: ${networkErrors.length}`);
  console.log(`Total JS crashes: ${pageErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log("\nConsole errors:");
    // Deduplicate
    const unique = [...new Set(consoleErrors)];
    unique.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  if (networkErrors.length > 0) {
    console.log("\nNetwork errors:");
    const unique = [...new Set(networkErrors)];
    unique.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  if (pageErrors.length > 0) {
    console.log("\nJS page crashes:");
    pageErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  console.log(`\nRapid switching: ${rapidSwitchOk ? "✅ PASS" : "❌ FAIL"}`);

  // Test passes if no JS crashes and we didn't lose session
  expect(pageErrors.length).toBe(0);
  expect(rapidSwitchOk).toBe(true);
});
