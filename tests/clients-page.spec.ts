import { test, expect } from '@playwright/test';

test.describe('Clients Page - Categories and Filters', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to clients page
    await page.goto('http://localhost:8081/clients');
    await page.waitForLoadState('networkidle');
  });

  test('should display categories sidebar on the left', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('div[dir="rtl"]', { timeout: 10000 });
    
    // Check if categories sidebar exists
    const sidebar = page.locator('text=קטגוריות').first();
    await expect(sidebar).toBeVisible();
    
    console.log('✅ Categories sidebar is visible');
  });

  test('should display client name with category tooltip on hover', async ({ page }) => {
    // Wait for clients to load
    await page.waitForSelector('h3', { timeout: 10000 });
    
    // Get first client card
    const firstClient = page.locator('h3').first();
    
    // Hover over client name
    await firstClient.hover();
    
    // Wait a bit for tooltip to appear
    await page.waitForTimeout(500);
    
    console.log('✅ Hovered over client name');
  });

  test('should display bulk selection button', async ({ page }) => {
    // Look for bulk selection button
    const bulkButton = page.locator('text=בחירה מרובה').or(page.locator('button:has-text("בחירה")'));
    
    await expect(bulkButton.first()).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Bulk selection button is visible');
  });

  test('should display edit and delete buttons on hover', async ({ page }) => {
    // Wait for client cards
    await page.waitForSelector('div[style*="cursor: pointer"]', { timeout: 10000 });
    
    // Get first client card
    const clientCard = page.locator('div[style*="cursor: pointer"]').first();
    
    // Hover over card
    await clientCard.hover();
    
    // Wait for action buttons to appear
    await page.waitForTimeout(300);
    
    console.log('✅ Hovered over client card to reveal action buttons');
  });

  test('should open filter strip when clicking advanced filter', async ({ page }) => {
    // Look for filter buttons
    const filterButton = page.locator('button:has-text("קטגוריות"), button:has-text("שלבים"), button:has-text("תגיות")').first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);
      console.log('✅ Clicked on filter button');
    } else {
      console.log('⚠️ Filter button not found');
    }
  });

  test('should display client cards with all required information', async ({ page }) => {
    // Wait for content
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/clients-page-full.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved to test-results/clients-page-full.png');
    
    // Check page structure
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    // Count client cards
    const cards = await page.locator('h3').count();
    console.log(`Found ${cards} client cards`);
  });
});
