import { test, expect } from '@playwright/test';

test.describe('QuickInputSection - dialog button clicks', () => {
  test('plus/select/delete work and console logs are emitted', async ({ page }) => {
    test.setTimeout(60_000);
    const logs: string[] = [];
    const errors: string[] = [];

    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      logs.push(text);
      if (msg.type() === 'error') errors.push(text);
      console.log(text);
    });
    page.on('pageerror', (err) => {
      const text = `[PAGE ERROR] ${err.message}`;
      errors.push(text);
      console.log(text);
    });

    const email = process.env.PW_EMAIL;
    const password = process.env.PW_PASSWORD;

    await page.goto('/', { waitUntil: 'networkidle' });

    // Login if needed
    const hasLoginForm = (await page.locator('input[type="password"]').count()) > 0;
    if (hasLoginForm) {
      if (!email || !password) {
        throw new Error('Login required but PW_EMAIL/PW_PASSWORD are not set');
      }
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle', { timeout: 30_000 });
    }

    // enable debug logs inside the component
    await page.evaluate(() => {
      localStorage.setItem('debug-quick-input', '1');
    });
    await page.reload({ waitUntil: 'networkidle' });

    // Open test dialog (be resilient to transient overlays)
    const openBtn = page.getByRole('button', { name: '🧪 Quick Options' });
    await expect(openBtn).toBeVisible({ timeout: 30_000 });
    await openBtn.scrollIntoViewIfNeeded();
    try {
      await openBtn.click({ timeout: 10_000 });
    } catch {
      await openBtn.click({ force: true });
    }

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    // TITLE: open plus popover and add a new option
    await dialog.locator('div.border-dashed').first().click();
    await expect(dialog.getByText('הוסף כותרת חדשה')).toBeVisible();

    const newTitle = `כותרת בדיקה ${Date.now()}`;
    await dialog.getByPlaceholder('שם הכותרת...').fill(newTitle);
    await dialog.getByRole('button', { name: 'הוסף' }).click();

    // Select an existing option (should log)
    await dialog.getByText('תכנון', { exact: true }).click();

    // Enter edit mode and delete the option we added
    await dialog.getByTitle('עריכת אפשרויות').click();
    await expect(dialog.getByTitle('סיום עריכה')).toBeVisible();

    // Delete the first visible delete button (red X)
    await dialog.locator('button.bg-red-500').first().click();

    // NOTES: open plus popover and add a new option
    await dialog.locator('div.border-dashed').nth(1).click();
    await expect(dialog.getByText('הוסף הערה חדשה')).toBeVisible();

    const newNote = `הערה בדיקה ${Date.now()}`;
    await dialog.getByPlaceholder('שם ההערה...').fill(newNote);
    await dialog.getByRole('button', { name: 'הוסף' }).click();

    // We expect component debug logs to have appeared at least once
    const hasDebug = logs.some((l) => l.includes('[QuickInputSection]'));
    expect(hasDebug).toBeTruthy();

    // No JS errors
    expect(errors).toHaveLength(0);
  });
});
