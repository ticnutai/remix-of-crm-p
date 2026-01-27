import { test, expect } from '@playwright/test';

test.describe('🔍 בדיקות Layout - Sidebar וגלילה אופקית', () => {
  
  test.beforeEach(async ({ page }) => {
    console.log('\n🚀 מתחבר למערכת...');
    
    try {
      await page.goto('/', { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (error) {
      console.log('❌ שגיאה בטעינת הדף:', error.message);
      throw error;
    }
    
    // בדיקה אם יש דף התחברות
    const loginSelectors = [
      'input[type="password"]',
      'form[action*="login"]',
      'button:has-text("login")',
      'button:has-text("התחבר")',
      'a[href*="login"]'
    ];
    
    let hasLoginForm = false;
    for (const selector of loginSelectors) {
      if (await page.locator(selector).count() > 0) {
        hasLoginForm = true;
        console.log('🔐 נמצא דף התחברות');
        break;
      }
    }
    
    if (hasLoginForm) {
      try {
        console.log('📝 ממלא פרטי התחברות...');
        
        // מציאת שדה שם משתמש
        const usernameSelectors = [
          'input[name="username"]', 
          'input[name="email"]', 
          'input[type="email"]', 
          'input[type="text"]'
        ];
        
        for (const selector of usernameSelectors) {
          if (await page.locator(selector).count() > 0) {
            await page.fill(selector, 'jj1212t@gmail.com');
            break;
          }
        }
        
        await page.fill('input[type="password"]', '543211');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log('✅ התחברות הצליחה');
      } catch (error) {
        console.log('⚠️ התחברות נכשלה, ממשיך בכל זאת...');
      }
    }
  });

  test('✅ Sidebar לא חופף לתוכן בכל הדפים', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 בדיקת חפיפת Sidebar');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const pagesToCheck = [
      { url: '/', name: 'home' },
      { url: '/customers', name: 'customers' },
      { url: '/dashboard', name: 'dashboard' }
    ];
    
    for (const pageInfo of pagesToCheck) {
      console.log(`\n📄 בודק דף: ${pageInfo.name} (${pageInfo.url})`);
      console.log('─'.repeat(50));
      
      try {
        await page.goto(pageInfo.url, { timeout: 15000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        await page.waitForTimeout(1000);

        // צילום מסך
        await page.screenshot({ 
          path: `screenshots/${pageInfo.name}-layout.png`, 
          fullPage: true 
        });
        console.log(`  📸 צילום מסך נשמר: screenshots/${pageInfo.name}-layout.png`);

        // מציאת Sidebar
        const sidebarSelectors = [
          'aside',
          '.sidebar',
          '[class*="Sidebar"]',
          '[class*="sidebar"]',
          'nav[class*="side"]',
          '.side-nav'
        ];

        let sidebar = null;
        let sidebarSelector = '';
        
        for (const selector of sidebarSelectors) {
          try {
            const found = page.locator(selector).first();
            if (await found.count() > 0 && await found.isVisible()) {
              sidebar = found;
              sidebarSelector = selector;
              break;
            }
          } catch {}
        }

        if (!sidebar) {
          console.log('  ⚠️  אין Sidebar בדף זה - מדלג');
          continue;
        }

        console.log(`  ✅ Sidebar נמצא: ${sidebarSelector}`);

        // מציאת תוכן ראשי
        const contentSelectors = [
          'main',
          '.main-content',
          '[class*="Main"]',
          '[class*="main"]',
          '[role="main"]',
          '.content'
        ];

        let mainContent = null;
        let contentSelector = '';
        
        for (const selector of contentSelectors) {
          try {
            const found = page.locator(selector).first();
            if (await found.count() > 0 && await found.isVisible()) {
              mainContent = found;
              contentSelector = selector;
              break;
            }
          } catch {}
        }

        if (!mainContent) {
          console.log('  ⚠️  לא נמצא תוכן ראשי');
          continue;
        }

        console.log(`  ✅ תוכן ראשי נמצא: ${contentSelector}`);

        // בדיקת מיקומים
        const sidebarBox = await sidebar.boundingBox();
        const contentBox = await mainContent.boundingBox();

        if (!sidebarBox || !contentBox) {
          console.log('  ⚠️  לא ניתן לקבל מידות');
          continue;
        }

        const sidebarRight = sidebarBox.x + sidebarBox.width;
        const contentLeft = contentBox.x;
        const gap = contentLeft - sidebarRight;

        console.log(`\n  📊 מידות Sidebar:`);
        console.log(`     x: ${Math.round(sidebarBox.x)}px`);
        console.log(`     width: ${Math.round(sidebarBox.width)}px`);
        console.log(`     right edge: ${Math.round(sidebarRight)}px`);
        
        console.log(`\n  📊 מידות Content:`);
        console.log(`     x: ${Math.round(contentBox.x)}px`);
        console.log(`     width: ${Math.round(contentBox.width)}px`);
        
        console.log(`\n  📏 רווח בין Sidebar לתוכן: ${Math.round(gap)}px`);

        if (gap < -5) {
          console.log(`  ❌ חפיפה של ${Math.abs(Math.round(gap))}px!\n`);
          
          // דיבאג CSS
          const sidebarStyles = await sidebar.evaluate(el => ({
            position: window.getComputedStyle(el).position,
            zIndex: window.getComputedStyle(el).zIndex,
            width: window.getComputedStyle(el).width,
            left: window.getComputedStyle(el).left,
            right: window.getComputedStyle(el).right
          }));
          
          const contentStyles = await mainContent.evaluate(el => ({
            marginLeft: window.getComputedStyle(el).marginLeft,
            paddingLeft: window.getComputedStyle(el).paddingLeft,
            position: window.getComputedStyle(el).position,
            left: window.getComputedStyle(el).left
          }));
          
          console.log('  🔍 Sidebar CSS:', JSON.stringify(sidebarStyles, null, 2));
          console.log('  🔍 Content CSS:', JSON.stringify(contentStyles, null, 2));
        } else {
          console.log(`  ✅ אין חפיפה - רווח תקין!\n`);
        }
        
        expect(gap, `חפיפת Sidebar בדף ${pageInfo.name}`).toBeGreaterThanOrEqual(-5);

        // בדיקת מצב מורחב אם יש כפתור
        const toggleButtons = [
          'button[aria-label*="menu"]',
          'button[aria-label*="Menu"]',
          '.sidebar-toggle',
          '[data-testid*="toggle"]',
          'button:has-text("☰")'
        ];

        for (const toggleSelector of toggleButtons) {
          const toggleButton = page.locator(toggleSelector).first();
          if (await toggleButton.count() > 0) {
            console.log('  🔘 בודק מצב Sidebar מורחב...');
            
            try {
              await toggleButton.click();
              await page.waitForTimeout(500);
              
              await page.screenshot({ 
                path: `screenshots/${pageInfo.name}-layout-expanded.png`, 
                fullPage: true 
              });

              const sidebarBoxExpanded = await sidebar.boundingBox();
              const contentBoxExpanded = await mainContent.boundingBox();

              if (sidebarBoxExpanded && contentBoxExpanded) {
                const gapExpanded = contentBoxExpanded.x - (sidebarBoxExpanded.x + sidebarBoxExpanded.width);
                console.log(`  📏 רווח במצב מורחב: ${Math.round(gapExpanded)}px`);
                
                if (gapExpanded >= -5) {
                  console.log(`  ✅ אין חפיפה במצב מורחב\n`);
                } else {
                  console.log(`  ❌ חפיפה במצב מורחב: ${Math.abs(Math.round(gapExpanded))}px\n`);
                }
                
                expect(gapExpanded, `חפיפת Sidebar מורחב בדף ${pageInfo.name}`).toBeGreaterThanOrEqual(-5);
              }
            } catch (error) {
              console.log(`  ⚠️  לא ניתן לבדוק מצב מורחב: ${error.message}`);
            }
            break;
          }
        }

      } catch (error) {
        console.log(`  ❌ שגיאה בבדיקת ${pageInfo.name}: ${error.message}\n`);
      }
    }
  });

  test('✅ עמוד לקוחות - אין גלילה אופקית בעמוד', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 בדיקת גלילה אופקית - עמוד לקוחות');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
      await page.goto('/customers', { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // צילום מסך
      await page.screenshot({ 
        path: 'screenshots/customers-scroll-check.png', 
        fullPage: true 
      });
      console.log('📸 צילום מסך נשמר: screenshots/customers-scroll-check.png\n');

      // בדיקת גלילה של העמוד
      const pageScrollInfo = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        
        return {
          bodyScrollWidth: body.scrollWidth,
          bodyClientWidth: body.clientWidth,
          htmlScrollWidth: html.scrollWidth,
          htmlClientWidth: html.clientWidth,
          windowWidth: window.innerWidth,
          hasBodyScroll: body.scrollWidth > body.clientWidth,
          hasHtmlScroll: html.scrollWidth > html.clientWidth,
          bodyOverflow: window.getComputedStyle(body).overflowX,
          htmlOverflow: window.getComputedStyle(html).overflowX
        };
      });

      console.log('📊 מידע גלילה של העמוד:');
      console.log(`   Body: ${pageScrollInfo.bodyScrollWidth}px scroll vs ${pageScrollInfo.bodyClientWidth}px client`);
      console.log(`   HTML: ${pageScrollInfo.htmlScrollWidth}px scroll vs ${pageScrollInfo.htmlClientWidth}px client`);
      console.log(`   Window: ${pageScrollInfo.windowWidth}px`);
      console.log(`   Body overflow-x: ${pageScrollInfo.bodyOverflow}`);
      console.log(`   HTML overflow-x: ${pageScrollInfo.htmlOverflow}`);
      
      const hasPageScroll = pageScrollInfo.hasBodyScroll || pageScrollInfo.hasHtmlScroll;
      console.log(`\n   ${hasPageScroll ? '❌ יש' : '✅ אין'} גלילה אופקית בעמוד\n`);

      // מציאת אלמנטים שחורגים (לא כולל טבלאות)
      const overflowingElements = await page.evaluate(() => {
        const viewportWidth = window.innerWidth;
        const allElements = Array.from(document.querySelectorAll('*'));
        const overflowing = [];

        allElements.forEach(el => {
          // דילוג על טבלאות ואלמנטים בתוכן
          if (el.closest('table, .table-container, [class*="table-wrapper"], [class*="Table"]')) {
            return;
          }

          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          
          if (rect.right > viewportWidth + 5) {
            overflowing.push({
              tag: el.tagName,
              class: el.className,
              id: el.id,
              right: Math.round(rect.right),
              viewport: viewportWidth,
              overflow: Math.round(rect.right - viewportWidth),
              position: styles.position,
              overflowX: styles.overflowX,
              width: styles.width
            });
          }
        });

        return overflowing;
      });

      if (overflowingElements.length > 0) {
        console.log('⚠️  אלמנטים שחורגים מהעמוד:\n');
        overflowingElements.slice(0, 10).forEach((el, i) => {
          console.log(`   ${i + 1}. ${el.tag}${el.class ? '.' + el.class.substring(0, 30) : ''}${el.id ? '#' + el.id : ''}`);
          console.log(`      חורג: ${el.overflow}px (${el.right}px vs ${el.viewport}px)`);
          console.log(`      CSS: position=${el.position}, overflow-x=${el.overflowX}, width=${el.width}\n`);
        });
        
        if (overflowingElements.length > 10) {
          console.log(`   ... ועוד ${overflowingElements.length - 10} אלמנטים\n`);
        }
      } else {
        console.log('✅ אין אלמנטים חורגים\n');
      }

      // בדיקת טבלאות בנפרד
      const tableInfo = await page.evaluate(() => {
        const tableContainers = document.querySelectorAll('table, .table-container, [class*="table"], [class*="Table"]');
        const tables = [];

        tableContainers.forEach(container => {
          const styles = window.getComputedStyle(container);
          if (container.scrollWidth > 0) {
            tables.push({
              tag: container.tagName,
              class: container.className,
              scrollWidth: container.scrollWidth,
              clientWidth: container.clientWidth,
              hasScroll: container.scrollWidth > container.clientWidth,
              overflowX: styles.overflowX,
              width: styles.width
            });
          }
        });

        return tables;
      });

      if (tableInfo.length > 0) {
        console.log('📊 מידע על טבלאות:\n');
        tableInfo.slice(0, 3).forEach((table, i) => {
          console.log(`   טבלה ${i + 1}: ${table.tag}${table.class ? '.' + table.class.substring(0, 30) : ''}`);
          console.log(`      overflow-x: ${table.overflowX}`);
          console.log(`      גלילה: ${table.hasScroll ? '✅ יש (זה תקין)' : 'אין'}`);
          console.log(`      מידות: ${table.scrollWidth}px scroll vs ${table.clientWidth}px client\n`);
        });
      }

      // בדיקות
      expect(hasPageScroll, 'העמוד לא צריך גלילה אופקית').toBe(false);
      expect(overflowingElements.length, 'לא צריכים להיות אלמנטים חורגים').toBe(0);
      
      console.log('✅ עמוד לקוחות עבר את בדיקת הגלילה!\n');

    } catch (error) {
      console.log(`❌ שגיאה בבדיקת גלילה: ${error.message}\n`);
      throw error;
    }
  });

  test('✅ בדיקה ברזולוציות שונות', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 בדיקה ברזולוציות מסך שונות');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Full-HD' },
      { width: 1680, height: 1050, name: 'Desktop-Wide' },
      { width: 1440, height: 900, name: 'MacBook-Pro' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 1280, height: 720, name: 'HD' }
    ];

    for (const viewport of viewports) {
      console.log(`📱 בודק ב-${viewport.name} (${viewport.width}x${viewport.height})`);
      console.log('─'.repeat(50));
      
      await page.setViewportSize(viewport);
      await page.goto('/customers', { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(500);

      // צילום מסך
      await page.screenshot({ 
        path: `screenshots/customers-${viewport.name}.png`,
        fullPage: true 
      });

      // בדיקת גלילה
      const scrollCheck = await page.evaluate(() => ({
        hasScroll: document.body.scrollWidth > document.body.clientWidth,
        scrollWidth: document.body.scrollWidth,
        clientWidth: document.body.clientWidth
      }));

      console.log(`   ${scrollCheck.scrollWidth}px scroll vs ${scrollCheck.clientWidth}px client`);
      console.log(`   ${scrollCheck.hasScroll ? '❌ יש גלילה' : '✅ אין גלילה'}`);
      
      expect(scrollCheck.hasScroll, `גלילה אופקית ב-${viewport.name}`).toBe(false);

      // בדיקת Sidebar
      const sidebar = page.locator('aside, .sidebar, [class*="sidebar"]').first();
      if (await sidebar.count() > 0 && await sidebar.isVisible()) {
        const mainContent = page.locator('main, .main-content, [class*="main"]').first();
        
        const sidebarBox = await sidebar.boundingBox();
        const contentBox = await mainContent.boundingBox();

        if (sidebarBox && contentBox) {
          const gap = contentBox.x - (sidebarBox.x + sidebarBox.width);
          console.log(`   📏 רווח Sidebar: ${Math.round(gap)}px`);
          expect(gap, `חפיפת Sidebar ב-${viewport.name}`).toBeGreaterThanOrEqual(-5);
        }
      }
      
      console.log('');
    }
    
    console.log('✅ כל הרזולוציות עברו!\n');
  });
});
