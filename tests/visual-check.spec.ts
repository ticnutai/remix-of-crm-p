import { test, expect } from '@playwright/test';

test('בדיקה ויזואלית של DataTable Pro עם המתנה', async ({ page }) => {
  // פתיחת העמוד
  await page.goto('http://localhost:8080/datatable-pro');
  
  // המתנה לטעינה מלאה
  await page.waitForLoadState('networkidle');
  
  // צילום מסך ראשוני
  await page.screenshot({ 
    path: 'tests/screenshots/initial-load.png',
    fullPage: true 
  });
  console.log('✅ צילום מסך ראשוני נשמר');
  
  // המתנה של 3 שניות
  console.log('⏳ ממתין 3 שניות...');
  await page.waitForTimeout(3000);
  
  // צילום מסך אחרי המתנה
  await page.screenshot({ 
    path: 'tests/screenshots/after-3-seconds.png',
    fullPage: true 
  });
  console.log('✅ צילום מסך אחרי 3 שניות נשמר');
  
  // בדיקת sidebar overlap - האם יש overlap?
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  const mainContent = page.locator('main');
  
  if (await sidebar.isVisible()) {
    const sidebarBox = await sidebar.boundingBox();
    const mainBox = await mainContent.boundingBox();
    
    console.log('📏 Sidebar position:', sidebarBox);
    console.log('📏 Main content position:', mainBox);
    
    if (sidebarBox && mainBox) {
      const isOverlapping = sidebarBox.x < mainBox.x + mainBox.width && 
                           sidebarBox.x + sidebarBox.width > mainBox.x;
      console.log(isOverlapping ? '❌ יש overlap!' : '✅ אין overlap');
    }
  }
  
  // המתנה נוספת של 5 שניות
  console.log('⏳ ממתין עוד 5 שניות...');
  await page.waitForTimeout(5000);
  
  // צילום מסך סופי
  await page.screenshot({ 
    path: 'tests/screenshots/after-8-seconds.png',
    fullPage: true 
  });
  console.log('✅ צילום מסך סופי נשמר');
  
  // בדיקת גלילה אופקית
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  
  console.log(hasHorizontalScroll ? '❌ יש גלילה אופקית!' : '✅ אין גלילה אופקית');
  
  // בדיקת z-index layers
  const zIndexes = await page.evaluate(() => {
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    const main = document.querySelector('main');
    const header = document.querySelector('header');
    
    return {
      sidebar: sidebar ? window.getComputedStyle(sidebar.parentElement!).zIndex : null,
      main: main ? window.getComputedStyle(main).zIndex : null,
      header: header ? window.getComputedStyle(header).zIndex : null,
    };
  });
  
  console.log('🔢 z-index values:', zIndexes);
});
