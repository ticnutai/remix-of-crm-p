/**
 * E2E debug test for the floating "בחר תאריך ביצוע" dialog.
 * Run: npx playwright test tests/date-dialog-debug.spec.ts --reporter=list --workers=1
 */
import { test, expect, Page, Locator } from "@playwright/test";

const EMAIL = "jj1212t@gmail.com";
const PASSWORD = "543211";
const BASE = process.env.PW_BASE_URL || "http://localhost:8080";

async function login(page: Page) {
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
  if (page.url().includes("/auth")) {
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.toString().includes("/auth"), { timeout: 30000 });
  }
  await page.waitForTimeout(2000);
}

function attachConsoleSink(page: Page, logs: string[]) {
  page.on("console", (msg) => {
    const t = msg.text();
    if (t.includes("[vite]") || t.includes("HMR")) return;
    logs.push(`[${msg.type()}] ${t.slice(0, 600)}`);
  });
  page.on("pageerror", (e) => logs.push(`[PAGEERROR] ${e.message}`));
}

/** Try to find a task row inside an open stage; if none, create one. */
async function findOrCreateTask(page: Page): Promise<Locator | null> {
  // Stage cards: title elements that, when clicked, open a Radix Dialog
  const stageTitles = page.locator('h3.font-semibold, h2.font-semibold');
  const count = Math.min(await stageTitles.count(), 8);
  console.log(`→ ${count} candidate stage titles`);

  for (let i = 0; i < count; i++) {
    const t = stageTitles.nth(i);
    if (!(await t.isVisible().catch(() => false))) continue;
    try {
      await t.scrollIntoViewIfNeeded();
      await t.click({ timeout: 2000 });
    } catch {
      continue;
    }
    await page.waitForTimeout(700);

    const dlg = page.locator('[role="dialog"]').last();
    if (!(await dlg.isVisible().catch(() => false))) continue;

    const taskRows = dlg.locator(".group:has(svg.lucide-grip-vertical)");
    const taskCount = await taskRows.count();
    console.log(`  → stage #${i}: ${taskCount} tasks`);

    if (taskCount > 0) return taskRows.first();

    // Empty: try add
    const addBtn = dlg.getByRole("button", { name: /הוסף משימה/ }).first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const input = page.locator('input[placeholder="שם המשימה..."]').first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill(`__pw_${Date.now()}`);
        await input.press("Enter");
        await page.waitForTimeout(1500);
        const rows2 = dlg.locator(".group:has(svg.lucide-grip-vertical)");
        if ((await rows2.count()) > 0) {
          console.log("  → created temp task");
          return rows2.first();
        }
      }
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }
  return null;
}

test("date-change dialog: open / drag / theme-switcher", async ({ page }) => {
  test.setTimeout(240000);
  const logs: string[] = [];
  attachConsoleSink(page, logs);

  console.log("\n=== 1. LOGIN ===");
  await login(page);

  console.log("\n=== 2. /clients ===");
  await page.goto(`${BASE}/clients`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const cCount = await page.locator("div.group.cursor-pointer").count();
  console.log(`→ ${cCount} client cards`);

  let taskRow: Locator | null = null;

  for (let i = 0; i < Math.min(cCount, 6); i++) {
    console.log(`\n--- client #${i} ---`);
    await page.goto(`${BASE}/clients`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const card = page.locator("div.group.cursor-pointer").nth(i);
    if (!(await card.isVisible().catch(() => false))) continue;
    await card.click();
    try {
      await page.waitForURL((u) => u.toString().includes("/client-profile/"), { timeout: 10000 });
    } catch {
      continue;
    }
    console.log("→", page.url());
    await page.waitForTimeout(2500);

    taskRow = await findOrCreateTask(page);
    if (taskRow) break;
  }

  if (!taskRow) throw new Error("no task available on first 6 clients");

  console.log("\n=== 3. RIGHT-CLICK TASK ===");
  await taskRow.scrollIntoViewIfNeeded();
  const rb = await taskRow.boundingBox();
  if (!rb) throw new Error("no bb");
  await page.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2);
  await page.mouse.click(rb.x + rb.width / 2, rb.y + rb.height / 2, { button: "right" });
  await page.waitForTimeout(700);

  console.log("\n=== 4. CLICK 'שנה תאריך ביצוע' ===");
  const menuItem = page.getByRole("menuitem", { name: /שנה תאריך ביצוע/ }).first();
  await expect(menuItem).toBeVisible({ timeout: 5000 });
  await menuItem.click();
  await page.waitForTimeout(900);

  console.log("\n=== 5. PANEL CHECKS ===");
  const panel = page.getByTestId("date-change-dialog");
  await expect(panel).toBeVisible({ timeout: 5000 });
  const panelInfo = await panel.evaluate((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      transform: cs.transform,
      pointerEvents: cs.pointerEvents,
      zIndex: cs.zIndex,
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    };
  });
  console.log("→ panel:", panelInfo);
  expect(panelInfo.pointerEvents).toBe("auto");
  expect(Number(panelInfo.zIndex)).toBeGreaterThanOrEqual(1000);

  console.log("\n=== 6. DRAG ===");
  const handle = page.getByTestId("date-change-dialog-handle");
  const hb = await handle.boundingBox();
  if (!hb) throw new Error("no hb");
  const sx = hb.x + hb.width / 2;
  const sy = hb.y + 12;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 80, sy + 60, { steps: 8 });
  await page.mouse.move(sx + 160, sy + 120, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const after = await panel.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top };
  });
  const delta = Math.abs(after.left - panelInfo.left) + Math.abs(after.top - panelInfo.top);
  console.log("→ after drag:", after, "delta:", delta);
  expect(delta).toBeGreaterThan(30);

  console.log("\n=== 7. THEME SWITCHER ===");
  const trigger = page.getByTestId("dialog-theme-switcher-trigger");
  await expect(trigger).toBeVisible();
  await trigger.click();
  await page.waitForTimeout(500);
  const menu = page.getByTestId("dialog-theme-switcher-menu");
  await expect(menu).toBeVisible({ timeout: 3000 });
  const menuInfo = await menu.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { z: cs.zIndex, pe: cs.pointerEvents };
  });
  console.log("→ menu:", menuInfo);
  expect(menuInfo.pe).toBe("auto");
  expect(Number(menuInfo.z)).toBeGreaterThan(Number(panelInfo.zIndex));

  const firstThemeBtn = menu.locator("button").first();
  if (await firstThemeBtn.isVisible().catch(() => false)) {
    const label = (await firstThemeBtn.innerText()).trim().slice(0, 40);
    await firstThemeBtn.click();
    console.log("→ picked theme:", label);
    await page.waitForTimeout(400);
  }

  console.log("\n=== 8. CONSOLE (filtered) ===");
  for (const l of logs) {
    if (
      l.includes("[DateDialog]") ||
      l.includes("[ThemeSwitcher]") ||
      l.startsWith("[error]") ||
      l.startsWith("[PAGEERROR]")
    ) {
      console.log(l);
    }
  }
  console.log(`(total: ${logs.length})`);
});
