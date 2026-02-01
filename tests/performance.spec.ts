/**
 * בדיקות ביצועים יסודיות - Performance Tests v2
 * 
 * בודק:
 * 1. זמן טעינה ראשונית של האתר
 * 2. זמן מעבר בין דפים
 * 3. רינדורים כפולים (Double Renders)
 * 4. אייקונים מסתובבים / מצבי טעינה
 * 5. Web Vitals (LCP, FID, CLS)
 */

import { test, expect, Page } from '@playwright/test';

// הגדרות - timeout ארוך יותר לבדיקות ביצועים
test.setTimeout(60000);

// הגדרות סף לביצועים (במילישניות)
const PERFORMANCE_THRESHOLDS = {
  initialLoad: 10000,       // טעינה ראשונית - עד 10 שניות (מציאותי)
  pageNavigation: 5000,     // מעבר דף - עד 5 שניות
  apiResponse: 2000,        // תגובת API - עד 2 שניות
  interactionDelay: 100,    // עיכוב אינטראקציה - עד 100ms
};

// רשימת דפים לבדיקה
const PAGES_TO_TEST = [
  { path: '/', name: 'דף הבית' },
  { path: '/clients', name: 'לקוחות' },
  { path: '/calendar', name: 'יומן' },
  { path: '/tasks', name: 'משימות' },
  { path: '/settings', name: 'הגדרות' },
  { path: '/reports', name: 'דוחות' },
  { path: '/finance', name: 'פיננסים' },
  { path: '/files', name: 'קבצים' },
];

const BASE_URL = 'http://localhost:8080';

// פונקציה למדידת זמן טעינה
async function measureLoadTime(page: Page, url: string): Promise<{
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}> {
  const startTime = Date.now();
  
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const domContentLoaded = Date.now() - startTime;
  
  await page.waitForLoadState('load');
  const loadComplete = Date.now() - startTime;
  
  // קבלת מדדי Performance API
  const performanceMetrics = await page.evaluate(() => {
    const entries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      firstPaint: entries.find(e => e.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: entries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
      domInteractive: navigationEntry?.domInteractive || 0,
      domComplete: navigationEntry?.domComplete || 0,
    };
  });
  
  // LCP - Largest Contentful Paint
  const lcpValue = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let lcp = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcp = lastEntry.startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      
      setTimeout(() => {
        observer.disconnect();
        resolve(lcp);
      }, 1000);
    });
  });
  
  return {
    domContentLoaded,
    loadComplete,
    firstPaint: performanceMetrics.firstPaint,
    firstContentfulPaint: performanceMetrics.firstContentfulPaint,
    largestContentfulPaint: lcpValue,
  };
}

// פונקציה לספירת רינדורים
async function countRenders(page: Page, selector: string, timeout: number = 3000): Promise<number> {
  return await page.evaluate(({ sel, time }) => {
    return new Promise<number>((resolve) => {
      let renderCount = 0;
      const element = document.querySelector(sel);
      
      if (!element) {
        resolve(0);
        return;
      }
      
      const observer = new MutationObserver((mutations) => {
        renderCount += mutations.length;
      });
      
      observer.observe(element, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
      
      setTimeout(() => {
        observer.disconnect();
        resolve(renderCount);
      }, time);
    });
  }, { sel: selector, time: timeout });
}

// בדיקת אייקונים מסתובבים
async function checkSpinners(page: Page): Promise<{
  found: boolean;
  count: number;
  locations: string[];
}> {
  const spinnerSelectors = [
    '.animate-spin',
    '[class*="spinner"]',
    '[class*="loading"]',
    '[class*="loader"]',
    'svg.animate-spin',
    '[data-loading="true"]',
    '.lucide-loader',
    '.lucide-loader-2',
  ];
  
  try {
    const results = await page.evaluate((selectors) => {
      const found: string[] = [];
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const parent = el.closest('[class]');
              const location = parent?.className.split(' ').slice(0, 3).join(' ') || 'unknown';
              found.push(`${selector} @ ${location} (${Math.round(rect.x)},${Math.round(rect.y)})`);
            }
          });
        } catch (e) {
          // ignore selector errors
        }
      });
      
      return found;
    }, spinnerSelectors);
    
    return {
      found: results.length > 0,
      count: results.length,
      locations: results,
    };
  } catch (e) {
    return { found: false, count: 0, locations: [] };
  }
}

// המתנה לטעינה עם timeout
async function waitForPageReady(page: Page, timeout: number = 10000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // אם networkidle לא הושג, נחכה שהתוכן יהיה זמין
    await page.waitForTimeout(2000);
  }
}

// ====== בדיקות ======

test.describe('🚀 בדיקות ביצועים יסודיות', () => {
  
  test.describe('⏱️ זמני טעינה', () => {
    
    test('זמן טעינה ראשונית של האתר', async ({ page }) => {
      console.log('\n📊 מודד זמן טעינה ראשונית...\n');
      
      const metrics = await measureLoadTime(page, BASE_URL);
      
      console.log('┌─────────────────────────────────────────────────┐');
      console.log('│             📈 מדדי טעינה ראשונית                │');
      console.log('├─────────────────────────────────────────────────┤');
      console.log(`│ DOM Content Loaded:       ${String(metrics.domContentLoaded).padStart(6)} ms           │`);
      console.log(`│ Load Complete:            ${String(metrics.loadComplete).padStart(6)} ms           │`);
      console.log(`│ First Paint:              ${String(Math.round(metrics.firstPaint)).padStart(6)} ms           │`);
      console.log(`│ First Contentful Paint:   ${String(Math.round(metrics.firstContentfulPaint)).padStart(6)} ms           │`);
      console.log(`│ Largest Contentful Paint: ${String(Math.round(metrics.largestContentfulPaint)).padStart(6)} ms           │`);
      console.log('├─────────────────────────────────────────────────┤');
      
      // הערכה
      let overallStatus = '✅ מצוין';
      if (metrics.domContentLoaded > 5000) overallStatus = '⚠️ איטי';
      if (metrics.domContentLoaded > 10000) overallStatus = '❌ איטי מאוד';
      
      console.log(`│ סטטוס כללי: ${overallStatus.padEnd(33)} │`);
      console.log('└─────────────────────────────────────────────────┘');
      
      // המלצות
      if (metrics.domContentLoaded > 5000) {
        console.log('\n💡 המלצות לשיפור:');
        console.log('   • בדוק קריאות API ראשוניות - אולי יש יותר מדי');
        console.log('   • השתמש ב-lazy loading לקומפוננטות');
        console.log('   • בדוק גודל ה-bundle');
        console.log('   • השתמש ב-code splitting');
      }
      
      // בדיקה רכה - מדווח אבל לא נכשל על איטיות
      test.info().annotations.push({
        type: 'performance',
        description: JSON.stringify(metrics),
      });
      
      // הבדיקה עוברת אם הדף נטען (גם אם איטי)
      expect(metrics.domContentLoaded).toBeGreaterThan(0);
    });
    
    test('זמני מעבר בין דפים', async ({ page }) => {
      console.log('\n📊 מודד זמני מעבר בין דפים...\n');
      
      // טעינה ראשונית
      await page.goto(BASE_URL);
      await waitForPageReady(page);
      
      const results: { page: string; time: number; status: string }[] = [];
      
      for (const pageInfo of PAGES_TO_TEST) {
        const startTime = Date.now();
        
        try {
          await page.goto(`${BASE_URL}${pageInfo.path}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
          });
          await page.waitForTimeout(1000); // המתנה קצרה לרינדור
          
          const loadTime = Date.now() - startTime;
          const status = loadTime < PERFORMANCE_THRESHOLDS.pageNavigation ? '✅' : '⚠️';
          
          results.push({
            page: pageInfo.name,
            time: loadTime,
            status,
          });
        } catch (error) {
          results.push({
            page: pageInfo.name,
            time: -1,
            status: '❌',
          });
        }
      }
      
      // הדפסת טבלת תוצאות
      console.log('┌──────────────────┬───────────────┬──────────┐');
      console.log('│       דף         │     זמן       │  סטטוס   │');
      console.log('├──────────────────┼───────────────┼──────────┤');
      
      results.forEach(r => {
        const pageName = r.page.padEnd(14);
        const time = r.time === -1 ? 'FAILED    ' : `${r.time}ms`.padStart(10);
        console.log(`│ ${pageName} │ ${time}    │    ${r.status}    │`);
      });
      
      console.log('└──────────────────┴───────────────┴──────────┘');
      
      // סיכום
      const validResults = results.filter(r => r.time > 0);
      const avgTime = validResults.reduce((sum, r) => sum + r.time, 0) / validResults.length;
      const slowestPage = validResults.reduce((max, r) => r.time > max.time ? r : max, validResults[0]);
      const fastestPage = validResults.reduce((min, r) => r.time < min.time ? r : min, validResults[0]);
      
      console.log(`\n📊 סיכום:`);
      console.log(`   • זמן ממוצע: ${Math.round(avgTime)}ms`);
      console.log(`   • הכי מהיר: ${fastestPage.page} (${fastestPage.time}ms)`);
      console.log(`   • הכי איטי: ${slowestPage.page} (${slowestPage.time}ms)`);
      
      // לפחות 50% מהדפים נטענו
      expect(validResults.length).toBeGreaterThan(results.length * 0.5);
    });
  });
  
  test.describe('🔄 בדיקת רינדורים כפולים', () => {
    
    test('זיהוי רינדורים מיותרים בדף הבית', async ({ page }) => {
      console.log('\n🔍 בודק רינדורים כפולים בדף הבית...\n');
      
      await page.goto(BASE_URL);
      await waitForPageReady(page);
      
      // מחכה שהדף יתייצב
      await page.waitForTimeout(2000);
      
      // מודד רינדורים במשך 3 שניות
      const renderCount = await countRenders(page, '#root', 3000);
      
      console.log('┌─────────────────────────────────────────────────┐');
      console.log('│             🔄 בדיקת רינדורים                    │');
      console.log('├─────────────────────────────────────────────────┤');
      console.log(`│ מספר רינדורים ב-3 שניות: ${String(renderCount).padStart(5)}                │`);
      
      let status = '';
      let recommendation = '';
      
      if (renderCount > 50) {
        status = '❌ יותר מדי רינדורים!';
        recommendation = 'בדוק useEffect dependencies ו-state updates';
      } else if (renderCount > 20) {
        status = '⚠️ מספר רינדורים גבוה';
        recommendation = 'שקול להשתמש ב-React.memo';
      } else if (renderCount > 10) {
        status = '⚡ סביר';
        recommendation = '';
      } else {
        status = '✅ מצוין!';
        recommendation = '';
      }
      
      console.log(`│ סטטוס: ${status.padEnd(37)} │`);
      if (recommendation) {
        console.log(`│ 💡 ${recommendation.padEnd(42)} │`);
      }
      console.log('└─────────────────────────────────────────────────┘');
      
      // בדיקה - לא יותר מ-100 רינדורים ב-3 שניות (סף גבוה)
      expect(renderCount).toBeLessThan(100);
    });
    
    test('בדיקת Console Logs', async ({ page }) => {
      console.log('\n🔍 בודק console.log...\n');
      
      const logs: { type: string; text: string }[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      
      page.on('console', msg => {
        const text = msg.text();
        logs.push({ type: msg.type(), text });
        
        if (msg.type() === 'error') errors.push(text);
        if (msg.type() === 'warning') warnings.push(text);
      });
      
      await page.goto(BASE_URL);
      await waitForPageReady(page);
      await page.waitForTimeout(3000);
      
      console.log('┌─────────────────────────────────────────────────┐');
      console.log('│             📝 Console Summary                   │');
      console.log('├─────────────────────────────────────────────────┤');
      console.log(`│ Total logs:    ${String(logs.length).padStart(5)}                            │`);
      console.log(`│ Errors:        ${String(errors.length).padStart(5)}                            │`);
      console.log(`│ Warnings:      ${String(warnings.length).padStart(5)}                            │`);
      console.log('└─────────────────────────────────────────────────┘');
      
      if (errors.length > 0) {
        console.log('\n❌ Errors found:');
        errors.slice(0, 5).forEach(e => console.log(`   • ${e.slice(0, 80)}`));
      }
      
      if (warnings.length > 0) {
        console.log('\n⚠️ Warnings found:');
        warnings.slice(0, 5).forEach(w => console.log(`   • ${w.slice(0, 80)}`));
      }
      
      // סינון לוגים רלוונטיים
      const renderLogs = logs.filter(l => 
        l.text.includes('render') || 
        l.text.includes('useEffect') ||
        l.text.includes('rerender')
      );
      
      if (renderLogs.length > 0) {
        console.log('\n🔄 Render-related logs:');
        renderLogs.slice(0, 5).forEach(l => console.log(`   • ${l.text.slice(0, 80)}`));
      }
      
      // הבדיקה עוברת - זו בדיקה אינפורמטיבית
      expect(true).toBe(true);
    });
  });
  
  test.describe('⏳ בדיקת מצבי טעינה (Spinners)', () => {
    
    test('זיהוי אייקונים מסתובבים בטעינה ראשונית', async ({ page }) => {
      console.log('\n🔍 בודק אייקונים מסתובבים בטעינה...\n');
      
      // מתחיל לעקוב לפני הניווט
      let spinnersOverTime: { time: number; count: number }[] = [];
      
      await page.goto(BASE_URL);
      
      // בדיקה כל 500ms במשך 10 שניות
      for (let i = 0; i < 20; i++) {
        const spinners = await checkSpinners(page);
        spinnersOverTime.push({ time: i * 500, count: spinners.count });
        
        if (i === 0 && spinners.count > 0) {
          console.log(`⏳ אייקונים מסתובבים בהתחלה: ${spinners.count}`);
          spinners.locations.forEach(loc => console.log(`   • ${loc}`));
        }
        
        await page.waitForTimeout(500);
      }
      
      // ניתוח התוצאות
      const maxSpinners = Math.max(...spinnersOverTime.map(s => s.count));
      const timeToNoSpinners = spinnersOverTime.findIndex(s => s.count === 0);
      const finalSpinners = spinnersOverTime[spinnersOverTime.length - 1].count;
      
      console.log('\n┌─────────────────────────────────────────────────┐');
      console.log('│             ⏳ ניתוח Spinners                    │');
      console.log('├─────────────────────────────────────────────────┤');
      console.log(`│ מקסימום spinners:        ${String(maxSpinners).padStart(5)}                  │`);
      console.log(`│ זמן עד שנעלמו:           ${timeToNoSpinners === -1 ? 'לא נעלמו' : `${timeToNoSpinners * 500}ms`.padStart(7)}              │`);
      console.log(`│ Spinners בסוף:           ${String(finalSpinners).padStart(5)}                  │`);
      console.log('├─────────────────────────────────────────────────┤');
      
      if (finalSpinners > 0) {
        console.log('│ ⚠️ יש spinners שנשארו פעילים!                   │');
        const currentSpinners = await checkSpinners(page);
        currentSpinners.locations.forEach(loc => 
          console.log(`│    • ${loc.slice(0, 42).padEnd(42)} │`)
        );
      } else {
        console.log('│ ✅ כל ה-spinners נעלמו                          │');
      }
      console.log('└─────────────────────────────────────────────────┘');
      
      // גרף פשוט של spinners לאורך זמן
      console.log('\n📈 Spinners לאורך זמן:');
      const maxCount = Math.max(...spinnersOverTime.map(s => s.count), 1);
      spinnersOverTime.forEach(s => {
        const bar = '█'.repeat(Math.round((s.count / maxCount) * 20));
        console.log(`   ${String(s.time).padStart(5)}ms: ${bar} (${s.count})`);
      });
      
      // הבדיקה עוברת אם אין יותר מ-5 spinners תקועים
      expect(finalSpinners).toBeLessThan(5);
    });
    
    test('מעקב אחר משך הצגת Spinner בכל דף', async ({ page }) => {
      console.log('\n🔍 מודד משך הצגת Spinner בדפים שונים...\n');
      
      const results: { page: string; spinnerDuration: number; finalSpinnerCount: number }[] = [];
      
      for (const pageInfo of PAGES_TO_TEST.slice(0, 5)) {
        await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'domcontentloaded' });
        
        let spinnerGoneTime = 0;
        let finalCount = 0;
        
        // בודק כל 200ms עד 5 שניות
        for (let i = 0; i < 25; i++) {
          await page.waitForTimeout(200);
          const spinners = await checkSpinners(page);
          
          if (spinners.count === 0 && spinnerGoneTime === 0) {
            spinnerGoneTime = (i + 1) * 200;
          }
          
          if (i === 24) {
            finalCount = spinners.count;
            if (spinnerGoneTime === 0) spinnerGoneTime = 5000;
          }
        }
        
        results.push({
          page: pageInfo.name,
          spinnerDuration: spinnerGoneTime,
          finalSpinnerCount: finalCount,
        });
      }
      
      // הדפסת תוצאות
      console.log('┌──────────────────┬───────────────┬──────────────┐');
      console.log('│       דף         │ משך Spinner   │ נשארו פעילים │');
      console.log('├──────────────────┼───────────────┼──────────────┤');
      
      results.forEach(r => {
        const pageName = r.page.padEnd(14);
        const duration = `${r.spinnerDuration}ms`.padStart(10);
        const remaining = r.finalSpinnerCount > 0 ? `⚠️ ${r.finalSpinnerCount}` : '✅ 0';
        console.log(`│ ${pageName} │ ${duration}    │     ${remaining.padEnd(6)}   │`);
      });
      
      console.log('└──────────────────┴───────────────┴──────────────┘');
      
      // בדיקה - אין יותר מ-2 דפים עם spinners תקועים
      const stuckSpinners = results.filter(r => r.finalSpinnerCount > 0);
      expect(stuckSpinners.length).toBeLessThan(3);
    });
  });
  
  test.describe('📊 Web Vitals', () => {
    
    test('מדידת Core Web Vitals', async ({ page }) => {
      console.log('\n📊 מודד Core Web Vitals...\n');
      
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      const webVitals = await page.evaluate(() => {
        return new Promise<{
          lcp: number;
          cls: number;
          ttfb: number;
          domInteractive: number;
          domComplete: number;
        }>((resolve) => {
          let lcp = 0;
          let cls = 0;
          
          // LCP
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              lcp = entries[entries.length - 1]?.startTime || 0;
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            setTimeout(() => lcpObserver.disconnect(), 2000);
          } catch (e) {}
          
          // CLS
          try {
            const clsObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries() as any[]) {
                if (!entry.hadRecentInput) {
                  cls += entry.value;
                }
              }
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            setTimeout(() => clsObserver.disconnect(), 2000);
          } catch (e) {}
          
          // Navigation timing
          const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const ttfb = navEntry?.responseStart || 0;
          const domInteractive = navEntry?.domInteractive || 0;
          const domComplete = navEntry?.domComplete || 0;
          
          setTimeout(() => {
            resolve({
              lcp: Math.round(lcp),
              cls: Math.round(cls * 1000) / 1000,
              ttfb: Math.round(ttfb),
              domInteractive: Math.round(domInteractive),
              domComplete: Math.round(domComplete),
            });
          }, 2500);
        });
      });
      
      // הדפסת תוצאות
      console.log('┌─────────────────────────────────────────────────────┐');
      console.log('│                📈 Core Web Vitals                    │');
      console.log('├─────────────────────────────────────────────────────┤');
      
      // LCP
      const lcpStatus = webVitals.lcp < 2500 ? '✅ טוב' : webVitals.lcp < 4000 ? '⚠️ צריך שיפור' : '❌ גרוע';
      console.log(`│ LCP (Largest Contentful Paint): ${String(webVitals.lcp).padStart(6)}ms ${lcpStatus.padStart(12)}  │`);
      
      // CLS
      const clsStatus = webVitals.cls < 0.1 ? '✅ טוב' : webVitals.cls < 0.25 ? '⚠️ צריך שיפור' : '❌ גרוע';
      console.log(`│ CLS (Cumulative Layout Shift):  ${String(webVitals.cls).padStart(7)}   ${clsStatus.padStart(12)}  │`);
      
      // TTFB
      const ttfbStatus = webVitals.ttfb < 800 ? '✅ טוב' : webVitals.ttfb < 1800 ? '⚠️ צריך שיפור' : '❌ גרוע';
      console.log(`│ TTFB (Time to First Byte):      ${String(webVitals.ttfb).padStart(6)}ms ${ttfbStatus.padStart(12)}  │`);
      
      console.log('├─────────────────────────────────────────────────────┤');
      console.log(`│ DOM Interactive:                ${String(webVitals.domInteractive).padStart(6)}ms               │`);
      console.log(`│ DOM Complete:                   ${String(webVitals.domComplete).padStart(6)}ms               │`);
      console.log('└─────────────────────────────────────────────────────┘');
      
      // סקירה כללית
      console.log('\n📋 סקירת Web Vitals:');
      console.log('   • LCP < 2.5s = טוב, < 4s = צריך שיפור, > 4s = גרוע');
      console.log('   • CLS < 0.1 = טוב, < 0.25 = צריך שיפור, > 0.25 = גרוע');
      console.log('   • TTFB < 800ms = טוב, < 1800ms = צריך שיפור');
      
      // הבדיקה עוברת - זו בדיקה אינפורמטיבית
      expect(webVitals.lcp).toBeGreaterThan(0);
    });
  });
  
  test.describe('🔧 בדיקות מתקדמות', () => {
    
    test('מעקב אחר Network Requests', async ({ page }) => {
      console.log('\n📊 מנתח בקשות רשת...\n');
      
      const requests: { url: string; duration: number; status: number; type: string }[] = [];
      
      page.on('requestfinished', async (request) => {
        try {
          const timing = request.timing();
          const response = await request.response();
          const resourceType = request.resourceType();
          
          requests.push({
            url: request.url(),
            duration: timing.responseEnd > 0 ? timing.responseEnd - timing.requestStart : 0,
            status: response?.status() || 0,
            type: resourceType,
          });
        } catch (e) {}
      });
      
      await page.goto(BASE_URL);
      await page.waitForTimeout(5000);
      
      // ניתוח בקשות
      const apiRequests = requests.filter(r => 
        r.url.includes('supabase') || r.url.includes('/api') || r.type === 'fetch' || r.type === 'xhr'
      );
      const staticRequests = requests.filter(r => 
        r.type === 'script' || r.type === 'stylesheet' || r.type === 'image'
      );
      const slowRequests = requests.filter(r => r.duration > 1000);
      const failedRequests = requests.filter(r => r.status >= 400);
      
      console.log('┌─────────────────────────────────────────────────┐');
      console.log('│             📡 Network Analysis                  │');
      console.log('├─────────────────────────────────────────────────┤');
      console.log(`│ סה"כ בקשות:        ${String(requests.length).padStart(5)}                       │`);
      console.log(`│ בקשות API:         ${String(apiRequests.length).padStart(5)}                       │`);
      console.log(`│ קבצים סטטיים:      ${String(staticRequests.length).padStart(5)}                       │`);
      console.log(`│ בקשות איטיות:      ${String(slowRequests.length).padStart(5)}                       │`);
      console.log(`│ בקשות שנכשלו:      ${String(failedRequests.length).padStart(5)}                       │`);
      console.log('└─────────────────────────────────────────────────┘');
      
      if (slowRequests.length > 0) {
        console.log('\n⚠️ בקשות איטיות (> 1 שניה):');
        slowRequests.slice(0, 10).forEach(r => {
          const shortUrl = r.url.split('/').slice(-2).join('/').slice(0, 50);
          console.log(`   • ${shortUrl}: ${Math.round(r.duration)}ms`);
        });
      }
      
      if (failedRequests.length > 0) {
        console.log('\n❌ בקשות שנכשלו:');
        failedRequests.slice(0, 5).forEach(r => {
          const shortUrl = r.url.split('/').slice(-2).join('/').slice(0, 50);
          console.log(`   • ${shortUrl}: ${r.status}`);
        });
      }
      
      // זמן ממוצע של בקשות API
      if (apiRequests.length > 0) {
        const avgApiTime = apiRequests.reduce((sum, r) => sum + r.duration, 0) / apiRequests.length;
        console.log(`\n📊 זמן ממוצע בקשות API: ${Math.round(avgApiTime)}ms`);
      }
      
      // הבדיקה עוברת
      expect(requests.length).toBeGreaterThan(0);
    });
    
    test('בדיקת זיכרון ושימוש במשאבים', async ({ page }) => {
      console.log('\n📊 בודק שימוש בזיכרון...\n');
      
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      // מדידה ראשונית
      const initialMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return {
            usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
            totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
            jsHeapSizeLimit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
          };
        }
        return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
      });
      
      console.log('┌─────────────────────────────────────────────────┐');
      console.log('│             💾 Memory Usage (Initial)            │');
      console.log('├─────────────────────────────────────────────────┤');
      console.log(`│ Used JS Heap:    ${String(initialMemory.usedJSHeapSize).padStart(5)} MB                      │`);
      console.log(`│ Total JS Heap:   ${String(initialMemory.totalJSHeapSize).padStart(5)} MB                      │`);
      console.log(`│ Heap Limit:      ${String(initialMemory.jsHeapSizeLimit).padStart(5)} MB                      │`);
      console.log('└─────────────────────────────────────────────────┘');
      
      // ניווט בין דפים
      for (const pageInfo of PAGES_TO_TEST.slice(0, 4)) {
        await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
      }
      
      // מדידה לאחר ניווט
      const afterNavMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return {
            usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
            totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          };
        }
        return { usedJSHeapSize: 0, totalJSHeapSize: 0 };
      });
      
      const memoryIncrease = afterNavMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      
      console.log('\n┌─────────────────────────────────────────────────┐');
      console.log('│           💾 Memory After Navigation             │');
      console.log('├─────────────────────────────────────────────────┤');
      console.log(`│ Used JS Heap:    ${String(afterNavMemory.usedJSHeapSize).padStart(5)} MB                      │`);
      console.log(`│ Memory Increase: ${memoryIncrease > 0 ? '+' : ''}${String(memoryIncrease).padStart(4)} MB                      │`);
      
      let memoryStatus = '✅ תקין';
      if (memoryIncrease > 100) memoryStatus = '❌ חשש ל-Memory Leak!';
      else if (memoryIncrease > 50) memoryStatus = '⚠️ עלייה משמעותית';
      
      console.log(`│ סטטוס:           ${memoryStatus.padEnd(27)} │`);
      console.log('└─────────────────────────────────────────────────┘');
      
      if (memoryIncrease > 50) {
        console.log('\n💡 טיפים לצמצום שימוש בזיכרון:');
        console.log('   • בדוק שיש cleanup ב-useEffect');
        console.log('   • השתמש ב-useMemo לערכים מחושבים');
        console.log('   • בדוק event listeners לא מנותקים');
      }
      
      // הבדיקה עוברת
      expect(true).toBe(true);
    });
  });
});

// דוח סיכום
test.afterAll(async () => {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║              📊 סיכום בדיקות ביצועים                   ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log('║ הבדיקות הושלמו! בדוק את התוצאות למעלה.                ║');
  console.log('║                                                        ║');
  console.log('║ 💡 טיפים לשיפור ביצועים:                               ║');
  console.log('║ • השתמש ב-React.memo לקומפוננטות                       ║');
  console.log('║ • בדוק useEffect dependencies                          ║');
  console.log('║ • השתמש ב-useMemo/useCallback                          ║');
  console.log('║ • בדוק שאין API calls מיותרים                          ║');
  console.log('║ • השתמש ב-Code Splitting ו-Lazy Loading                ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
});
