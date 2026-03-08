import { test, Page } from "@playwright/test";

const EMAIL = "jj1212t@gmail.com";
const PASSWORD = "543211";
const BASE = "http://localhost:8080";

async function login(page: Page) {
  await page.goto(`${BASE}/auth`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(2000);
  if (!page.url().includes("/auth")) return;
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.toString().includes("/auth"), {
    timeout: 20000,
  });
  await page.waitForTimeout(2000);
}

test("Console audit — capture ALL output on key pages", async ({ page }) => {
  test.setTimeout(180000);

  const allLogs: Array<{
    type: string;
    text: string;
    page: string;
    time: number;
  }> = [];
  let currentPage = "init";
  const startTime = Date.now();

  page.on("console", (msg) => {
    const text = msg.text();
    if (
      text.includes("[vite]") ||
      text.includes("HMR") ||
      text.includes("[Vue warn]")
    )
      return;
    allLogs.push({
      type: msg.type(),
      text: text.slice(0, 400),
      page: currentPage,
      time: Date.now() - startTime,
    });
  });

  page.on("pageerror", (err) => {
    allLogs.push({
      type: "PAGEERROR",
      text: `${err.name}: ${err.message.slice(0, 400)}`,
      page: currentPage,
      time: Date.now() - startTime,
    });
  });

  // Login
  currentPage = "login";
  await login(page);

  // Visit key pages and collect 8 seconds of console output each
  const pages = [
    { name: "דשבורד", path: "/" },
    { name: "לקוחות", path: "/clients" },
    { name: "Gmail", path: "/gmail" },
    { name: "משימות", path: "/tasks-meetings" },
    { name: "הגדרות", path: "/settings" },
    { name: "פיננסים", path: "/finance" },
    { name: "קבצים", path: "/files" },
    { name: "הצעות מחיר", path: "/quotes" },
    { name: "יומן", path: "/calendar" },
  ];

  for (const p of pages) {
    currentPage = p.name;
    const before = allLogs.length;
    await page.goto(`${BASE}${p.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(8000); // let it settle and watch console
    const after = allLogs.length;
    console.log(`📄 ${p.name}: ${after - before} console messages in 8s`);
  }

  // Now wait 15 more seconds on dashboard to catch interval/poll noise
  currentPage = "דשבורד-idle";
  await page.goto(`${BASE}/`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  const idleBefore = allLogs.length;
  await page.waitForTimeout(15000);
  const idleAfter = allLogs.length;
  console.log(
    `📄 דשבורד (idle 15s): ${idleAfter - idleBefore} console messages`,
  );

  // ═══════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(70));
  console.log("📊 CONSOLE AUDIT REPORT");
  console.log("═".repeat(70));

  // Total by type
  const byType: Record<string, number> = {};
  for (const l of allLogs) {
    byType[l.type] = (byType[l.type] || 0) + 1;
  }
  console.log("\n── By Type ──");
  for (const [type, count] of Object.entries(byType).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${type}: ${count}`);
  }

  // Total by page
  const byPage: Record<string, number> = {};
  for (const l of allLogs) {
    byPage[l.page] = (byPage[l.page] || 0) + 1;
  }
  console.log("\n── By Page ──");
  for (const [pg, count] of Object.entries(byPage).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${pg}: ${count}`);
  }

  // Find repeated messages (likely re-render noise)
  const msgCounts: Record<string, number> = {};
  for (const l of allLogs) {
    // Normalize: strip dynamic parts like IDs, timestamps
    const normalized = l.text
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        "<UUID>",
      )
      .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, "<TIMESTAMP>")
      .replace(/\d{3,}(ms)?/g, "<NUM>")
      .slice(0, 200);
    msgCounts[normalized] = (msgCounts[normalized] || 0) + 1;
  }

  console.log("\n── Top 30 Repeated Messages ──");
  const sorted = Object.entries(msgCounts).sort((a, b) => b[1] - a[1]);
  sorted.slice(0, 30).forEach(([msg, count], i) => {
    console.log(`  ${(i + 1).toString().padStart(2)}. [×${count}] ${msg}`);
  });

  // Errors summary
  const errors = allLogs.filter(
    (l) => l.type === "error" || l.type === "PAGEERROR",
  );
  console.log(`\n── Errors (${errors.length} total) ──`);
  const uniqueErrors = [...new Set(errors.map((e) => e.text.slice(0, 150)))];
  uniqueErrors.forEach((e) => console.log(`  🔴 ${e}`));

  // Warnings
  const warnings = allLogs.filter((l) => l.type === "warning");
  console.log(`\n── Warnings (${warnings.length} total) ──`);
  const uniqueWarnings = [
    ...new Set(warnings.map((w) => w.text.slice(0, 150))),
  ];
  uniqueWarnings.slice(0, 15).forEach((w) => console.log(`  🟡 ${w}`));

  // Info/log noise
  const infoLogs = allLogs.filter((l) => l.type === "log" || l.type === "info");
  console.log(`\n── Info/Log messages (${infoLogs.length} total) ──`);
  const uniqueInfoNormalized = [
    ...new Set(
      infoLogs.map((l) => {
        return l.text
          .replace(
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
            "<UUID>",
          )
          .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, "<TS>")
          .replace(/\d+/g, "<N>")
          .slice(0, 150);
      }),
    ),
  ];
  console.log(`  Unique patterns: ${uniqueInfoNormalized.length}`);
  uniqueInfoNormalized.slice(0, 30).forEach((l) => console.log(`  📝 ${l}`));

  console.log("\n── Summary ──");
  console.log(`  Total console messages: ${allLogs.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Info/Log: ${infoLogs.length}`);
  console.log(`  Unique message patterns: ${sorted.length}`);
  console.log(
    `  Most repeated: [×${sorted[0]?.[1] || 0}] ${sorted[0]?.[0]?.slice(0, 80) || "none"}`,
  );
  console.log("═".repeat(70));
});
