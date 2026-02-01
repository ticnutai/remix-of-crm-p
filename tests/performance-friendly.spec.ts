/**
 * 🚀 בדיקת ביצועים ידידותית
 * 
 * בדיקה פשוטה וברורה שמראה:
 * - כמה זמן לוקח לאתר לעלות
 * - האם יש אייקון מסתובב תקוע
 * - זמני מעבר בין דפים
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

// הגדרת timeout ארוך
test.setTimeout(120000);

test('🏠 בדיקת טעינת האתר', async ({ page }) => {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          🚀 בדיקת ביצועים ידידותית - NCRM                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // ========== שלב 1: טעינה ראשונית ==========
  console.log('📍 שלב 1: טעינה ראשונית של האתר');
  console.log('─'.repeat(50));
  
  const startTime = Date.now();
  await page.goto(BASE_URL);
  const initialLoad = Date.now() - startTime;
  
  // מחכה לתוכן להופיע
  await page.waitForSelector('#root', { timeout: 30000 });
  const contentVisible = Date.now() - startTime;
  
  console.log(`   ⏱️  הדף התחיל להיטען:     ${initialLoad}ms`);
  console.log(`   ⏱️  התוכן הופיע:          ${contentVisible}ms`);
  
  // בדיקת סטטוס
  let loadStatus = '✅ מצוין';
  if (contentVisible > 10000) loadStatus = '❌ איטי מאוד!';
  else if (contentVisible > 5000) loadStatus = '⚠️ איטי';
  else if (contentVisible > 3000) loadStatus = '🔶 בסדר';
  
  console.log(`   📊 סטטוס:                 ${loadStatus}`);
  console.log('');

  // ========== שלב 2: בדיקת Spinner ==========
  console.log('📍 שלב 2: בדיקת אייקון טעינה (Spinner)');
  console.log('─'.repeat(50));
  
  let spinnerFound = false;
  let spinnerDuration = 0;
  const spinnerStart = Date.now();
  
  // בודק אם יש spinner
  for (let i = 0; i < 30; i++) {
    const hasSpinner = await page.locator('.animate-spin').count();
    
    if (hasSpinner > 0) {
      spinnerFound = true;
      console.log(`   ⏳ נמצא אייקון מסתובב (בדיקה ${i + 1}/30)`);
    } else if (spinnerFound) {
      spinnerDuration = Date.now() - spinnerStart;
      console.log(`   ✅ האייקון נעלם! משך הצגה: ${spinnerDuration}ms`);
      break;
    } else if (i === 0) {
      console.log(`   ✅ אין אייקון מסתובב מיידי`);
      break;
    }
    
    await page.waitForTimeout(500);
    
    if (i === 29 && spinnerFound) {
      spinnerDuration = Date.now() - spinnerStart;
      console.log(`   ⚠️ האייקון עדיין מסתובב אחרי ${spinnerDuration}ms!`);
    }
  }
  
  let spinnerStatus = spinnerDuration === 0 ? '✅ אין spinner' : 
                      spinnerDuration < 3000 ? '✅ מהיר' :
                      spinnerDuration < 7000 ? '⚠️ קצת איטי' : '❌ איטי מדי';
  console.log(`   📊 סטטוס:                 ${spinnerStatus}`);
  console.log('');

  // ========== שלב 3: זמני מעבר בין דפים ==========
  console.log('📍 שלב 3: זמני מעבר בין דפים');
  console.log('─'.repeat(50));
  
  const pages = [
    { path: '/clients', name: 'לקוחות' },
    { path: '/calendar', name: 'יומן' },
    { path: '/tasks', name: 'משימות' },
    { path: '/finance', name: 'פיננסים' },
    { path: '/settings', name: 'הגדרות' },
  ];
  
  const pageTimes: { name: string; time: number }[] = [];
  
  for (const p of pages) {
    const navStart = Date.now();
    try {
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(500);
      const navTime = Date.now() - navStart;
      pageTimes.push({ name: p.name, time: navTime });
      
      const icon = navTime < 2000 ? '✅' : navTime < 5000 ? '🔶' : '❌';
      console.log(`   ${icon} ${p.name.padEnd(10)} ${navTime}ms`);
    } catch {
      console.log(`   ❌ ${p.name.padEnd(10)} נכשל!`);
      pageTimes.push({ name: p.name, time: -1 });
    }
  }
  
  const validTimes = pageTimes.filter(p => p.time > 0);
  const avgTime = validTimes.length > 0 
    ? Math.round(validTimes.reduce((sum, p) => sum + p.time, 0) / validTimes.length)
    : 0;
  
  console.log('');
  console.log(`   📊 ממוצע: ${avgTime}ms`);
  console.log('');

  // ========== שלב 4: בדיקת Console Errors ==========
  console.log('📍 שלב 4: בדיקת שגיאות');
  console.log('─'.repeat(50));
  
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // חוזר לדף הבית ובודק שגיאות
  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);
  
  if (errors.length === 0) {
    console.log('   ✅ אין שגיאות בקונסול');
  } else {
    console.log(`   ⚠️ נמצאו ${errors.length} שגיאות:`);
    errors.slice(0, 3).forEach(e => console.log(`      - ${e.slice(0, 60)}...`));
  }
  console.log('');

  // ========== סיכום ==========
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      📊 סיכום כללי                           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  const totalScore = calculateScore(contentVisible, spinnerDuration, avgTime, errors.length);
  
  console.log(`║                                                              ║`);
  console.log(`║   זמן טעינה ראשונית:    ${String(contentVisible).padStart(6)}ms ${loadStatus.padEnd(20)}   ║`);
  console.log(`║   משך Spinner:          ${String(spinnerDuration).padStart(6)}ms ${spinnerStatus.padEnd(20)}   ║`);
  console.log(`║   זמן ניווט ממוצע:      ${String(avgTime).padStart(6)}ms                            ║`);
  console.log(`║   שגיאות:               ${String(errors.length).padStart(6)}                               ║`);
  console.log(`║                                                              ║`);
  console.log(`║   ═══════════════════════════════════════════════════        ║`);
  console.log(`║   ציון כללי:            ${totalScore.score}/100 ${totalScore.emoji}                          ║`);
  console.log(`║   ═══════════════════════════════════════════════════        ║`);
  console.log(`║                                                              ║`);
  
  if (totalScore.tips.length > 0) {
    console.log(`║   💡 טיפים לשיפור:                                           ║`);
    totalScore.tips.forEach(tip => {
      console.log(`║      • ${tip.padEnd(52)} ║`);
    });
    console.log(`║                                                              ║`);
  }
  
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // הבדיקה עוברת תמיד (זו בדיקה אינפורמטיבית)
  expect(true).toBe(true);
});

function calculateScore(loadTime: number, spinnerTime: number, avgNavTime: number, errorCount: number): {
  score: number;
  emoji: string;
  tips: string[];
} {
  let score = 100;
  const tips: string[] = [];
  
  // ניקוד טעינה (עד 40 נקודות)
  if (loadTime > 10000) {
    score -= 40;
    tips.push('טעינה ראשונית איטית מאוד - בדוק bundle size');
  } else if (loadTime > 7000) {
    score -= 30;
    tips.push('טעינה ראשונית איטית - שקול lazy loading');
  } else if (loadTime > 5000) {
    score -= 20;
    tips.push('טעינה ראשונית יכולה להשתפר');
  } else if (loadTime > 3000) {
    score -= 10;
  }
  
  // ניקוד Spinner (עד 30 נקודות)
  if (spinnerTime > 10000) {
    score -= 30;
    tips.push('Spinner נשאר יותר מדי זמן - בדוק API calls');
  } else if (spinnerTime > 7000) {
    score -= 20;
    tips.push('Spinner איטי - אולי יש קריאות API מיותרות');
  } else if (spinnerTime > 4000) {
    score -= 10;
  }
  
  // ניקוד ניווט (עד 20 נקודות)
  if (avgNavTime > 5000) {
    score -= 20;
    tips.push('ניווט בין דפים איטי');
  } else if (avgNavTime > 3000) {
    score -= 10;
  }
  
  // ניקוד שגיאות (עד 10 נקודות)
  if (errorCount > 5) {
    score -= 10;
    tips.push('יש הרבה שגיאות בקונסול - כדאי לתקן');
  } else if (errorCount > 0) {
    score -= 5;
  }
  
  // סימן
  let emoji = '🏆';
  if (score < 50) emoji = '❌';
  else if (score < 70) emoji = '⚠️';
  else if (score < 85) emoji = '👍';
  else if (score < 95) emoji = '✅';
  
  return { score: Math.max(0, score), emoji, tips };
}
