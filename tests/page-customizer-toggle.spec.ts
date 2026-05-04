import { test, expect, Page } from "@playwright/test";

const EMAIL = "jj1212t@gmail.com";
const PASSWORD = "543211";
const BASE = "http://localhost:8080";

async function login(page: Page) {
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
  if (!page.url().includes("/auth")) return;
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.toString().includes("/auth"), { timeout: 20000 });
  await page.waitForTimeout(1500);
}

test("Clients PageCustomizer panel shows Eye + Switch on each layout row", async ({ page }) => {
  test.setTimeout(120000);

  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.log("CONSOLE ERROR:", m.text());
  });

  await login(page);
  await page.goto(`${BASE}/clients`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);

  // Close any sidebar overlay if open (press Escape)
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  const settingsBtn = page.locator('button[aria-label="התאמה אישית של הדף"]').first();
  await expect(settingsBtn).toBeVisible({ timeout: 10000 });
  await settingsBtn.click();
  await page.waitForTimeout(800);

  const panel = page.locator('div.fixed.z-50:has-text("התאמה אישית של עמוד הלקוחות")').first();
  await expect(panel).toBeVisible({ timeout: 5000 });

  // Layout tab is default — no need to click

  await page.screenshot({ path: "test-results/page-customizer-layout.png", fullPage: false });

  const panelSwitches = panel.locator('button[role="switch"]');
  const panelSwitchCount = await panelSwitches.count();
  console.log("Switches inside panel:", panelSwitchCount);

  const eyeButtons = panel.locator('button[title="כבה"], button[title="הפעל"]');
  const eyeCount = await eyeButtons.count();
  console.log("Eye toggle buttons inside panel:", eyeCount);

  expect(panelSwitchCount).toBeGreaterThan(0);
  expect(eyeCount).toBeGreaterThan(0);

  const firstSwitch = panelSwitches.first();
  const initialState = await firstSwitch.getAttribute("data-state");
  console.log("First switch initial state:", initialState);
  await firstSwitch.click();
  await page.waitForTimeout(400);
  const newState = await firstSwitch.getAttribute("data-state");
  console.log("First switch new state:", newState);
  expect(newState).not.toBe(initialState);
});
