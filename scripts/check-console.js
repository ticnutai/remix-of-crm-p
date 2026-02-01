/**
 * בדיקת קונסול מהירה
 */
import { chromium } from 'playwright';

async function checkConsole() {
  console.log('\n🔍 מתחיל בדיקת קונסול...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const logs = [];
  const errors = [];
  
  // האזנה לקונסול
  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    logs.push(text);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
    console.log(text);
  });
  
  page.on('pageerror', error => {
    const text = `[PAGE ERROR] ${error.message}`;
    errors.push(text);
    console.log('\x1b[31m' + text + '\x1b[0m');
  });
  
  page.on('requestfailed', request => {
    const text = `[REQUEST FAILED] ${request.url()}`;
    errors.push(text);
    console.log('\x1b[31m' + text + '\x1b[0m');
  });
  
  console.log('📍 טוען http://localhost:8080 ...\n');
  
  try {
    await page.goto('http://localhost:8080', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    console.log('\n✅ האתר נטען בהצלחה!');
  } catch (e) {
    console.log(`\n❌ שגיאה בטעינה: ${e.message}`);
  }
  
  // המתן לראות הודעות נוספות
  await page.waitForTimeout(5000);
  
  console.log('\n' + '═'.repeat(50));
  console.log('📊 סיכום בדיקת קונסול:');
  console.log('═'.repeat(50));
  console.log(`סה"כ הודעות: ${logs.length}`);
  console.log(`שגיאות: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ רשימת שגיאות:');
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err.substring(0, 200)}`));
  } else {
    console.log('\n✅ אין שגיאות בקונסול!');
  }
  console.log('═'.repeat(50) + '\n');
  
  await browser.close();
}

checkConsole().catch(console.error);
