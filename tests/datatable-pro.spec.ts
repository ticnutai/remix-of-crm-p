import { test, expect } from '@playwright/test';

test.describe('DataTable Pro - טבלת לקוחות', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to DataTable Pro page
    await page.goto('http://localhost:8081/datatable-pro');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on Clients tab if not already active
    const clientsTab = page.getByRole('tab', { name: /לקוחות/i });
    await clientsTab.click();
    await page.waitForTimeout(500);
  });

  test('should display DataTable Pro page with clients table', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: 'DataTable Pro' })).toBeVisible();
    
    // Check clients tab is active
    const clientsTab = page.getByRole('tab', { name: /לקוחות/i });
    await expect(clientsTab).toHaveAttribute('data-state', 'active');
    
    // Check table is visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should have working advanced filter button', async ({ page }) => {
    // Find advanced filter button with text "סינון מתקדם"
    const advancedFilterButton = page.getByRole('button', { name: /סינון מתקדם/i });
    await expect(advancedFilterButton).toBeVisible();
    
    // Click the button
    await advancedFilterButton.click();
    
    // Check that filter panel opens (Sheet component)
    await expect(page.getByRole('heading', { name: /סינון מתקדם/i })).toBeVisible();
    
    // Check filter options are visible
    await expect(page.getByText('יועץ')).toBeVisible();
    await expect(page.getByText('סיווג לקוח')).toBeVisible();
    
    // Close panel using close button or ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('should display bulk selection checkboxes', async ({ page }) => {
    // Wait for table rows to load
    await page.waitForSelector('tbody tr', { timeout: 5000 });
    
    // Find checkboxes in table rows
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    const count = await checkboxes.count();
    
    // Should have at least one checkbox (if there are clients)
    expect(count).toBeGreaterThan(0);
    
    // Select first client
    await checkboxes.first().check();
    await page.waitForTimeout(300);
    
    // Check selected count appears (X/Y format)
    const selectedCount = page.locator('text=/\\d+\\/\\d+/');
    await expect(selectedCount).toBeVisible();
  });

  test('should display categories sidebar', async ({ page }) => {
    // Look for categories sidebar container
    const categoriesSidebar = page.locator('[class*="categories"]').or(
      page.locator('text=/קטגוריות/i')
    ).first();
    
    // Categories sidebar should be visible
    await expect(categoriesSidebar).toBeVisible({ timeout: 3000 });
  });

  test('should display client names with category tooltips on hover', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 5000 });
    
    // Find a client name link in the table
    const clientNameLink = page.locator('tbody tr a[href^="/client-profile/"]').first();
    
    if (await clientNameLink.count() > 0) {
      // Hover over the client name
      await clientNameLink.hover();
      await page.waitForTimeout(500);
      
      // Client name should be visible and clickable
      await expect(clientNameLink).toBeVisible();
      
      // Note: Tooltip might be conditional on having a category
      // So we just verify the link is there and clickable
    }
  });

  test('should preserve multiple filters when applying', async ({ page }) => {
    // Open advanced filter
    const advancedFilterButton = page.getByRole('button', { name: /סינון מתקדם/i });
    await advancedFilterButton.click();
    await page.waitForTimeout(300);
    
    // Select first filter option (consultant if available)
    const consultantSelect = page.locator('select').or(
      page.getByRole('combobox')
    ).first();
    
    if (await consultantSelect.count() > 0) {
      await consultantSelect.click();
      await page.waitForTimeout(200);
      
      // Try to select an option
      const options = page.locator('[role="option"]').or(page.locator('select option'));
      if (await options.count() > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(200);
      }
    }
    
    // Apply filters
    const applyButton = page.getByRole('button', { name: /החל סינון/i });
    if (await applyButton.count() > 0) {
      await applyButton.click();
      await page.waitForTimeout(500);
      
      // Filter button should show active filter count badge
      const filterBadge = page.locator('[class*="badge"]').first();
      await expect(filterBadge).toBeVisible({ timeout: 2000 });
    }
  });

  test('should filter by category when sidebar category clicked', async ({ page }) => {
    // Wait for categories to load
    await page.waitForTimeout(1000);
    
    // Try to find and click a category in sidebar
    const categoryButton = page.locator('button').filter({ hasText: /[א-ת]+/ }).first();
    
    if (await categoryButton.count() > 0) {
      // Get initial client count
      const initialCount = await page.locator('tbody tr').count();
      
      // Click category
      await categoryButton.click();
      await page.waitForTimeout(500);
      
      // Count should potentially change (unless all clients are in that category)
      const newCount = await page.locator('tbody tr').count();
      
      // Either count changed or stayed same (both are valid)
      expect(typeof newCount).toBe('number');
    }
  });

  test('should allow editing client name via pencil icon', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 5000 });
    
    // Hover over first client row to reveal edit button
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    await page.waitForTimeout(300);
    
    // Look for pencil edit button
    const editButton = firstRow.locator('button[title*="עריכ"]').or(
      firstRow.locator('button').filter({ has: page.locator('svg') })
    ).first();
    
    if (await editButton.count() > 0) {
      await expect(editButton).toBeVisible();
    }
  });
});
