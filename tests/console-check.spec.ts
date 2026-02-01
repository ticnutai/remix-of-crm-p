/**
 * בדיקת קונסול מהירה - ללא webServer
 */
import { test, expect } from '@playwright/test';

test.describe('🔍 בדיקת קונסול', () => {
  test('בדיקת שגיאות וה logs בקונסול', async ({ page }) => {
    const logs: string[] = [];
    const errors: string[] = [];
    
    // האזנה לכל ההודעות בקונסול
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      logs.push(text);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
      console.log(text);
    });
    
    // האזנה לשגיאות JS
    page.on('pageerror', error => {
      const text = `[PAGE ERROR] ${error.message}`;
      errors.push(text);
      console.log(text);
    });
    
    // האזנה לבקשות נכשלות
    page.on('requestfailed', request => {
      const text = `[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`;
      errors.push(text);
      console.log(text);
    });
    
    console.log('\n📍 טוען את האתר...\n');
    
    // נסה לטעון את האתר
    try {
      await page.goto('http://localhost:8080', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      console.log('✅ האתר נטען בהצלחה\n');
    } catch (e) {
      console.log(`❌ שגיאה בטעינה: ${e}\n`);
    }
    
    // המתן קצת לראות את כל ההודעות
    await page.waitForTimeout(3000);
    
    console.log('\n' + '═'.repeat(50));
    console.log('📊 סיכום:');
    console.log('═'.repeat(50));
    console.log(`סה"כ הודעות בקונסול: ${logs.length}`);
    console.log(`שגיאות: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ שגיאות שנמצאו:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('\n✅ אין שגיאות!');
    }
    
    console.log('═'.repeat(50) + '\n');
  });
});
