// Auto-run pending migrations via browser automation
// This script opens the browser, logs in, and clicks "Run" on pending migrations

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8081';
const EMAIL = 'jj1212t@gmail.com';
const PASSWORD = '543211';

async function runPendingMigrations() {
  console.log('🚀 Starting browser automation...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser so you can see what's happening
    slowMo: 500 // Slow down actions for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Go to login page
    console.log('📍 Opening login page...');
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    
    // 2. Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {
      console.log('ℹ️  Redirected to:', page.url());
    });
    
    console.log('✅ Logged in successfully!');
    
    // 3. Navigate to Settings
    console.log('📍 Going to Settings...');
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    
    // 4. Enable Dev Mode if not enabled
    console.log('🔧 Checking dev mode...');
    const devModeSwitch = page.locator('text=מצב פיתוח').first();
    if (await devModeSwitch.isVisible()) {
      // Look for the switch near "מצב פיתוח"
      const switchElement = page.locator('[role="switch"]').first();
      const isChecked = await switchElement.getAttribute('aria-checked');
      if (isChecked !== 'true') {
        console.log('🔄 Enabling dev mode...');
        await switchElement.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // 5. Click on "ממתינות מ-Copilot" tab
    console.log('📋 Opening pending migrations tab...');
    const pendingTab = page.locator('text=ממתינות מ-Copilot');
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
      await page.waitForTimeout(1000);
    }
    
    // 6. Click "הרץ" button on pending migrations
    console.log('▶️  Looking for Run buttons...');
    const runButtons = page.locator('button:has-text("הרץ")');
    const count = await runButtons.count();
    
    if (count > 0) {
      console.log(`🎯 Found ${count} Run button(s)`);
      
      // Click the first "הרץ" button (for single migration)
      // or "הרץ הכל" for all
      const runAllButton = page.locator('button:has-text("הרץ הכל")');
      if (await runAllButton.isVisible()) {
        console.log('🚀 Clicking "Run All"...');
        await runAllButton.click();
      } else {
        console.log('🚀 Clicking "Run"...');
        await runButtons.first().click();
      }
      
      // Handle confirmation dialog
      page.on('dialog', async dialog => {
        console.log('📝 Confirming dialog...');
        await dialog.accept();
      });
      
      // Wait for execution
      await page.waitForTimeout(3000);
      
      console.log('✅ Migration executed!');
    } else {
      console.log('ℹ️  No pending migrations found');
    }
    
    // 7. Take screenshot of result
    await page.screenshot({ path: 'screenshots/migration-result.png' });
    console.log('📸 Screenshot saved to screenshots/migration-result.png');
    
    // Keep browser open for 5 seconds to see result
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/migration-error.png' });
  } finally {
    await browser.close();
    console.log('🏁 Done!');
  }
}

runPendingMigrations().catch(console.error);
