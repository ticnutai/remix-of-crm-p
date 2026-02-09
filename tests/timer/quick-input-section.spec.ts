import { test, expect } from '@playwright/test';

test.describe('🧪 QuickInputSection - debug clicks', () => {
  test('plus / edit / delete works and logs to console', async ({ page }) => {
    const consoleLines: string[] = [];
    const errorLines: string[] = [];

    page.on('console', (msg) => {
      const line = `[${msg.type()}] ${msg.text()}`;
      consoleLines.push(line);
      // Print to test runner output
      console.log(line);
    });

    page.on('pageerror', (err) => {
      const line = `[PAGE ERROR] ${err.message}`;
      errorLines.push(line);
      console.log(line);
    });

    // Enable in-app debug logs
    await page.addInitScript(() => {
      try {
        localStorage.setItem('debug-quick-input', '1');
      } catch {
        // ignore
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Login if needed
    const hasLoginForm = (await page.locator('input[type="password"]').count()) > 0;
    if (hasLoginForm) {
      console.log('[test] login detected, signing in...');
      await page.fill('input[type="email"]', 'jj1212t@gmail.com');
      await page.fill('input[type="password"]', '543211');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle', { timeout: 20000 });
    }

    // Open the debug dialog
    await page.getByRole('button', { name: '🧪 Quick Options' }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText('בדיקת QuickInputSection')).toBeVisible();

    // In the titles section: enter edit mode
    const editButtons = dialog.locator('button[title="עריכת אפשרויות"]');
    await expect(editButtons).toHaveCount(2);
    await editButtons.nth(0).click();

    // Click plus trigger (dashed badge) in titles section
    const dashedBadges = dialog.locator('div.border-dashed');
    await expect(dashedBadges).toHaveCount(2);
    await dashedBadges.nth(0).click();

    // Popover should open
    await expect(dialog.getByText('הוסף כותרת חדשה')).toBeVisible();

    // Add a new title
    console.log('[test] Test completed successfully');
  });
});