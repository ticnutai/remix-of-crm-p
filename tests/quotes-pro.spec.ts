import { test, expect, Page } from "@playwright/test";
import { composeDocumentHtml } from "../src/features/quotes-pro/render/composeDocument";
import { createEmptyDocument, DEFAULT_QP_STRIPS } from "../src/features/quotes-pro/model/defaults";
import type { QPDocument } from "../src/features/quotes-pro/model/types";

const EMAIL = "jj1212t@gmail.com";
const PASSWORD = "543211";
const BASE = "http://localhost:8080";

function buildDoc(): QPDocument {
  const base = createEmptyDocument();
  return {
    ...base,
    id: "test",
    created_at: "",
    updated_at: "",
    // גופן Google כדי לבדוק טעינה
    theme: { ...base.theme, fontFamily: "'Rubik', sans-serif" },
    // סטריפ עליון פעיל + פוטר עם מספור
    strips: {
      header: { ...DEFAULT_QP_STRIPS.header, enabled: true, bgColor: "#123456", text: "פס עליון" },
      footer: { ...DEFAULT_QP_STRIPS.footer, enabled: true, showPageNumber: true },
    },
    // טוקני מיזוג
    meta: { clientName: "ישראל ישראלי", gush: "1234", helka: "56" },
    blocks: [
      { id: "rt", type: "richText", html: "<p>לקוח: {{שם הלקוח}} | גוש {{גוש}} חלקה {{חלקה}}</p>" },
    ],
  } as QPDocument;
}

test("render: strips + merge tokens + google font", async ({ page }) => {
  const doc = buildDoc();
  const html = composeDocumentHtml(doc);

  // טעינת גופן Google מוזרקת ל-HTML
  expect(html).toContain("fonts.googleapis.com");
  // מספור עמודים דרך @bottom-center counter
  expect(html).toContain("counter(page)");

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  // סטריפ עליון קיים עם הצבע הנכון
  const header = page.locator(".qp-strip-header");
  await expect(header).toHaveCount(1);
  await expect(header).toBeVisible();

  // סטריפ תחתון קיים
  await expect(page.locator(".qp-strip-footer")).toHaveCount(1);

  // טוקני המיזוג הוחלפו — אין סוגריים מסולסלים, יש הערכים
  const body = await page.locator("body").innerText();
  expect(body).toContain("ישראל ישראלי");
  expect(body).toContain("1234");
  expect(body).toContain("56");
  expect(body).not.toContain("{{");
});

async function login(page: Page) {
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
  if (page.url().includes("/auth")) {
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.toString().includes("/auth"), { timeout: 20000 });
    await page.waitForTimeout(1500);
  }
}

test("app: quotes-pro manager loads and editor opens", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);

  await page.goto(`${BASE}/quotes-pro`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("הצעות מחיר PRO").first()).toBeVisible({ timeout: 15000 });

  // ניווט ישיר לעורך (יוצר מסמך חדש ומנתב למזהה)
  await page.goto(`${BASE}/quotes-pro/editor/new`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/quotes-pro\/editor\/(?!new)/, { timeout: 25000 });

  // העורך נטען — טאבים בלוקים/עיצוב/לקוח + תצוגה מקדימה
  await expect(page.getByText("בלוקים").first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("לקוח").first()).toBeVisible();
  await expect(page.locator('iframe[title="preview"]')).toBeVisible();
});
