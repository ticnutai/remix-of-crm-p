// E2E — סרגל בועה בעורך Flow: מסמנים טקסט, פותחים Popover (גודל/גופן),
// ובוחרים ערך — השינוי חייב לחול על הטקסט המסומן (רגרסיה של המקרה בו
// לחיצה בתוך Popover איבדה את הבחירה).
import { test, expect, Page } from "@playwright/test";

const EMAIL = process.env.PW_EMAIL ?? "jj1212t@gmail.com";
const PASSWORD = process.env.PW_PASSWORD ?? "543211";
const BASE = process.env.PW_BASE_URL ?? "http://localhost:8080";
// אפשר לדרוס עם PW_TEMPLATE_ID כדי לפתוח תבנית קיימת.
const TEMPLATE_ID = process.env.PW_TEMPLATE_ID ?? "new";

async function login(page: Page) {
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);
  if (page.url().includes("/auth")) {
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.toString().includes("/auth"), { timeout: 20000 });
    await page.waitForTimeout(1000);
  }
}

async function openFlowEditor(page: Page) {
  await page.goto(`${BASE}/quote-templates/editor/${TEMPLATE_ID}`, {
    waitUntil: "domcontentloaded",
  });

  // אם צריך לוחצים על טאב "Flow"/"עורך" כדי להציג את FlowWorkspaceTab.
  const flowTab = page
    .getByRole("tab")
    .filter({ hasText: /Flow|עורך|תוכן/i })
    .first();
  if (await flowTab.count().catch(() => 0)) {
    await flowTab.click().catch(() => {});
  }

  // ProseMirror render — .flow-editor-content הוא ה-contenteditable שלנו
  const editor = page.locator(".flow-editor-content").first();
  await editor.waitFor({ state: "visible", timeout: 30000 });
  return editor;
}

async function typeAndSelectAll(page: Page, editor: ReturnType<Page["locator"]>, text: string) {
  await editor.click();
  // מחיקת התוכן הקיים ואז הכנסת טקסט בדיקה נקי
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Delete");
  await page.keyboard.type(text, { delay: 10 });
  await page.keyboard.press("Control+A");
  // הבחירה חייבת להיות לא-ריקה כדי שסרגל הבועה יופיע
  const nonEmpty = await editor.evaluate(() => {
    const s = window.getSelection();
    return !!s && !s.isCollapsed;
  });
  expect(nonEmpty).toBe(true);
}

test.describe("Flow editor — bubble toolbar applies to selection", () => {
  test.setTimeout(120000);

  test("שינוי גודל דרך Popover חל על הטקסט המסומן", async ({ page }) => {
    await login(page);
    const editor = await openFlowEditor(page);
    await typeAndSelectAll(page, editor, "בדיקת גודל");

    // כפתור "גודל" בסרגל הבועה
    const sizeBtn = page.getByRole("button", { name: /גודל/ }).first();
    await sizeBtn.waitFor({ state: "visible", timeout: 10000 });
    await sizeBtn.click();

    // בפופאובר יש 3 עמודות של מספרים (10..56). לוחצים על 24.
    const size24 = page.getByRole("button", { name: /^24$/ }).first();
    await size24.waitFor({ state: "visible", timeout: 5000 });
    await size24.click();

    // מוודאים שיש span עם font-size: 24px בתוך העורך על הטקסט שהוכנס
    const styledSpan = editor.locator('span[style*="font-size: 24px"]').first();
    await expect(styledSpan).toBeVisible({ timeout: 5000 });
    await expect(styledSpan).toContainText("בדיקת גודל");
  });

  test("שינוי גופן דרך Popover חל על הטקסט המסומן", async ({ page }) => {
    await login(page);
    const editor = await openFlowEditor(page);
    await typeAndSelectAll(page, editor, "בדיקת גופן");

    const fontBtn = page.getByRole("button", { name: /^גופן$/ }).first();
    await fontBtn.waitFor({ state: "visible", timeout: 10000 });
    await fontBtn.click();

    // בוחרים את Rubik בפופאובר הגופנים
    const rubik = page.getByRole("button", { name: /^Rubik$/ }).first();
    await rubik.waitFor({ state: "visible", timeout: 5000 });
    await rubik.click();

    const styledSpan = editor.locator('span[style*="Rubik"]').first();
    await expect(styledSpan).toBeVisible({ timeout: 5000 });
    await expect(styledSpan).toContainText("בדיקת גופן");
  });

  test("שינוי צבע דרך Popover חל על הטקסט המסומן", async ({ page }) => {
    await login(page);
    const editor = await openFlowEditor(page);
    await typeAndSelectAll(page, editor, "בדיקת צבע");

    const colorBtn = page.getByRole("button", { name: /^צבע$/ }).first();
    await colorBtn.waitFor({ state: "visible", timeout: 10000 });
    await colorBtn.click();

    // SmartColorPicker: קטגוריית "טקסט" פתוחה כברירת מחדל.
    // בוחרים דגימת צבע כלשהי (הראשונה שנטענת בגריד הצבעים).
    const swatch = page
      .locator('[role="dialog"], [data-radix-popper-content-wrapper]')
      .locator('button[style*="background"]')
      .first();
    await swatch.waitFor({ state: "visible", timeout: 5000 });
    await swatch.click();

    // כל צבע טקסט מתורגם ל-color: rgb(...) על ה-span
    const styledSpan = editor.locator('span[style*="color"]').first();
    await expect(styledSpan).toBeVisible({ timeout: 5000 });
    await expect(styledSpan).toContainText("בדיקת צבע");
  });
});
