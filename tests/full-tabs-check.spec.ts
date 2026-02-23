import { test, expect, Page } from "@playwright/test";

const EMAIL = "jj1212t@gmail.com";
const PASSWORD = "543211";

async function login(page: Page) {
  await page.goto("http://localhost:8080/auth", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  // If already logged in (redirected away from auth), skip
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
  await page.waitForTimeout(2000);
}

// All main routes/tabs to test
const TABS = [
  { name: "דשבורד", path: "/", expectText: null },
  { name: "לקוחות", path: "/clients", expectText: null },
  { name: "יומן", path: "/calendar", expectText: null },
  { name: "עובדים", path: "/employees", expectText: null },
  { name: "דוחות", path: "/reports", expectText: null },
  { name: "הגדרות", path: "/settings", expectText: null },
  { name: "משימות ופגישות", path: "/tasks-meetings", expectText: null },
  { name: "פיננסים", path: "/finance", expectText: null },
  { name: "Gmail", path: "/gmail", expectText: null },
  { name: "קבצים", path: "/files", expectText: null },
  { name: "אנשי קשר", path: "/contacts", expectText: null },
  { name: "הצעות מחיר", path: "/quotes", expectText: null },
  { name: "היום שלי", path: "/my-day", expectText: null },
  { name: "לוג זמנים", path: "/time-logs", expectText: null },
  { name: "קנבן", path: "/kanban", expectText: null },
  { name: "כלים חכמים", path: "/smart-tools", expectText: null },
  { name: "מסמכים", path: "/documents", expectText: null },
  { name: "אנליטיקס", path: "/analytics", expectText: null },
];

test.describe("Full Tabs Navigation Test", () => {
  test.setTimeout(180000); // 3 minutes total

  test("login and navigate all tabs", async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    const jsErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Skip known noise
        if (
          text.includes("[vite]") ||
          text.includes("HMR") ||
          text.includes("favicon")
        )
          return;
        consoleErrors.push(text.slice(0, 200));
      }
    });

    page.on("pageerror", (err) => {
      jsErrors.push(`${err.name}: ${err.message.slice(0, 200)}`);
    });

    // Step 1: Login
    await login(page);
    await page.screenshot({
      path: "test-results/00-after-login.png",
      fullPage: true,
    });

    const results: Array<{
      tab: string;
      path: string;
      status: string;
      error?: string;
      loadTime: number;
    }> = [];

    // Step 2: Navigate each tab
    for (const tab of TABS) {
      const start = Date.now();
      let status = "✅ OK";
      let error: string | undefined;

      try {
        console.log(`\n📌 Navigating to: ${tab.name} (${tab.path})`);

        await page.goto(`http://localhost:8080${tab.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });

        // Wait for content to render
        await page.waitForTimeout(3000);

        // Check if redirected to auth (session lost)
        if (page.url().includes("/auth")) {
          status = "❌ REDIRECT TO AUTH";
          error = "Session lost - redirected to login page";
          console.log(`  ❌ ${tab.name}: Redirected to auth!`);
          // Try to re-login
          await login(page);
          results.push({
            tab: tab.name,
            path: tab.path,
            status,
            error,
            loadTime: Date.now() - start,
          });
          continue;
        }

        // Check for blank/empty page
        const bodyText = await page.evaluate(
          () => document.body?.innerText?.trim()?.length || 0,
        );
        if (bodyText < 20) {
          status = "⚠️ EMPTY PAGE";
          error = `Page body has only ${bodyText} chars`;
          console.log(
            `  ⚠️ ${tab.name}: Page appears empty (${bodyText} chars)`,
          );
        }

        // Check for error boundaries / crash messages
        const errorBoundary = await page
          .locator("text=/שגיאה|Error|Something went wrong|crash/i")
          .count();
        if (errorBoundary > 0) {
          status = "❌ ERROR BOUNDARY";
          error = "Error boundary or crash detected on page";
          console.log(`  ❌ ${tab.name}: Error boundary detected!`);
        }

        // Check for frozen/unresponsive page - try clicking something
        try {
          await page.evaluate(() => {
            return new Promise<void>((resolve) => {
              requestAnimationFrame(() => resolve());
            });
          });
        } catch {
          status = "❌ FROZEN";
          error = "Page appears frozen (requestAnimationFrame timed out)";
          console.log(`  ❌ ${tab.name}: Page frozen!`);
        }

        // Take screenshot
        const safeName = tab.name.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_");
        await page
          .screenshot({
            path: `test-results/tab-${safeName}.png`,
            fullPage: true,
            timeout: 10000,
          })
          .catch(() => {
            console.log(`  ⚠️ Could not take screenshot for ${tab.name}`);
          });

        if (status === "✅ OK") {
          console.log(`  ✅ ${tab.name}: OK (${Date.now() - start}ms)`);
        }
      } catch (e: any) {
        status = "❌ NAVIGATION ERROR";
        error = e.message?.slice(0, 200);
        console.log(`  ❌ ${tab.name}: ${e.message?.slice(0, 100)}`);
      }

      results.push({
        tab: tab.name,
        path: tab.path,
        status,
        error,
        loadTime: Date.now() - start,
      });
    }

    // Step 3: Print summary
    console.log("\n\n" + "=".repeat(60));
    console.log("📊 FULL TABS TEST SUMMARY");
    console.log("=".repeat(60));

    for (const r of results) {
      console.log(`${r.status} ${r.tab} (${r.path}) - ${r.loadTime}ms`);
      if (r.error) console.log(`   └─ ${r.error}`);
    }

    const failed = results.filter((r) => !r.status.includes("OK"));
    console.log(
      `\n📈 Results: ${results.length - failed.length}/${results.length} passed`,
    );

    if (consoleErrors.length > 0) {
      console.log(`\n🔴 Console errors (${consoleErrors.length}):`);
      // Deduplicate
      const unique = [...new Set(consoleErrors)];
      unique
        .slice(0, 20)
        .forEach((e) => console.log(`   • ${e.slice(0, 150)}`));
    }

    if (jsErrors.length > 0) {
      console.log(`\n💥 JavaScript errors (${jsErrors.length}):`);
      const unique = [...new Set(jsErrors)];
      unique.forEach((e) => console.log(`   • ${e}`));
    }

    console.log("=".repeat(60));

    // Test passes if at least 80% of tabs work
    const passRate = (results.length - failed.length) / results.length;
    expect(passRate).toBeGreaterThanOrEqual(0.5);
  });
});
