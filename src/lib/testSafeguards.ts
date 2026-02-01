/**
 * מערכת הגנות לבדיקות - מונעת בעיות נפוצות
 */

import { supabase } from '@/integrations/supabase/client';

export class TestSafeguards {
  private static runningTests = new Set<string>();
  private static lastRunTime: Map<string, number> = new Map();
  private static readonly RATE_LIMIT_MS = 5000; // 5 שניות בין הרצות
  private static readonly MAX_TEST_DURATION = 120000; // 2 דקות מקסימום לבדיקה

  /**
   * בדיקת תנאים מוקדמים לפני הרצת בדיקות
   */
  static async validatePrerequisites(): Promise<{ ok: boolean; error?: string }> {
    console.log('🔍 [SAFEGUARD] בדיקת תנאים מוקדמים...');

    // 1. בדיקת חיבור משתמש
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ [SAFEGUARD] משתמש לא מחובר');
        return { ok: false, error: 'יש להתחבר למערכת לפני הרצת בדיקות' };
      }
      console.log('✅ [SAFEGUARD] משתמש מחובר:', user.id);
    } catch (error) {
      console.error('❌ [SAFEGUARD] שגיאה בבדיקת משתמש:', error);
      return { ok: false, error: 'שגיאה בבדיקת חיבור משתמש' };
    }

    // 2. בדיקת חיבור למסד נתונים
    try {
      const startTime = Date.now();
      const { error: dbError } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true });
      
      const responseTime = Date.now() - startTime;
      
      if (dbError) {
        console.error('❌ [SAFEGUARD] מסד נתונים לא זמין:', dbError);
        return { ok: false, error: 'מסד הנתונים לא זמין - בדוק את החיבור' };
      }
      
      if (responseTime > 10000) {
        console.warn('⚠️ [SAFEGUARD] מסד נתונים איטי מאוד:', responseTime);
        return { ok: false, error: 'מסד הנתונים איטי מדי - המתן ונסה שוב' };
      }
      
      console.log(`✅ [SAFEGUARD] מסד נתונים זמין (${responseTime}ms)`);
    } catch (error) {
      console.error('❌ [SAFEGUARD] שגיאת חיבור למסד נתונים:', error);
      return { ok: false, error: 'לא ניתן להתחבר למסד הנתונים' };
    }

    // 3. בדיקת טבלאות קריטיות
    const criticalTables = ['clients', 'tasks', 'profiles'];
    for (const table of criticalTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ [SAFEGUARD] טבלה ${table} לא נגישה:`, error);
          return { ok: false, error: `טבלה קריטית '${table}' לא זמינה` };
        }
        console.log(`✅ [SAFEGUARD] טבלה ${table} נגישה`);
      } catch (error) {
        console.error(`❌ [SAFEGUARD] שגיאה בגישה לטבלה ${table}:`, error);
        return { ok: false, error: `שגיאה בגישה לטבלה '${table}'` };
      }
    }

    console.log('✅ [SAFEGUARD] כל התנאים מתקיימים');
    return { ok: true };
  }

  /**
   * בדיקת Rate Limiting - מונע הרצות תכופות מדי
   */
  static checkRateLimit(testId: string): { ok: boolean; error?: string; waitTime?: number } {
    const now = Date.now();
    const lastRun = this.lastRunTime.get(testId);

    if (lastRun) {
      const timeSinceLastRun = now - lastRun;
      if (timeSinceLastRun < this.RATE_LIMIT_MS) {
        const waitTime = Math.ceil((this.RATE_LIMIT_MS - timeSinceLastRun) / 1000);
        console.warn(`⚠️ [SAFEGUARD] Rate limit: המתן ${waitTime} שניות`);
        return { 
          ok: false, 
          error: `המתן ${waitTime} שניות לפני הרצה נוספת`,
          waitTime 
        };
      }
    }

    this.lastRunTime.set(testId, now);
    return { ok: true };
  }

  /**
   * סימון תחילת בדיקה - מונע הרצות כפולות
   */
  static startTest(testId: string): { ok: boolean; error?: string } {
    if (this.runningTests.has(testId)) {
      console.warn(`⚠️ [SAFEGUARD] בדיקה ${testId} כבר רצה`);
      return { ok: false, error: 'בדיקה זו כבר רצה כעת' };
    }

    this.runningTests.add(testId);
    console.log(`🚀 [SAFEGUARD] התחלת בדיקה: ${testId}`);
    return { ok: true };
  }

  /**
   * סימון סיום בדיקה
   */
  static endTest(testId: string): void {
    this.runningTests.delete(testId);
    console.log(`🏁 [SAFEGUARD] סיום בדיקה: ${testId}`);
  }

  /**
   * בדיקה האם בדיקה רצה כעת
   */
  static isTestRunning(testId: string): boolean {
    return this.runningTests.has(testId);
  }

  /**
   * עטיפת בדיקה עם Timeout
   */
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = this.MAX_TEST_DURATION,
    testName: string = 'בדיקה'
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        console.error(`⏱️ [SAFEGUARD] Timeout: ${testName} לקח יותר מ-${timeoutMs}ms`);
        reject(new Error(`${testName} לקח יותר מדי זמן (${timeoutMs / 1000} שניות)`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  /**
   * ניקוי נתוני בדיקה - חובה לקרוא בסוף בדיקה
   */
  static async cleanupTestData(testId: string, clientIds: string[] = []): Promise<void> {
    console.log(`🧹 [SAFEGUARD] ניקוי נתוני בדיקה ${testId}...`);
    
    try {
      // ניקוי בסדר הנכון - קודם רשומות תלויות, אחר כך לקוחות
      if (clientIds.length > 0) {
        // 1. מחיקת הצעות מחיר של הלקוחות
        const { error: quotesError } = await supabase
          .from('quotes')
          .delete()
          .in('client_id', clientIds);
        
        if (quotesError) {
          console.warn('⚠️ [SAFEGUARD] שגיאה בניקוי הצעות מחיר:', quotesError);
        } else {
          console.log('✅ [SAFEGUARD] נוקו הצעות מחיר של לקוחות הבדיקה');
        }

        // 2. מחיקת חשבוניות של הלקוחות
        const { error: invoicesError } = await supabase
          .from('invoices')
          .delete()
          .in('client_id', clientIds);
        
        if (invoicesError) {
          console.warn('⚠️ [SAFEGUARD] שגיאה בניקוי חשבוניות:', invoicesError);
        } else {
          console.log('✅ [SAFEGUARD] נוקו חשבוניות של לקוחות הבדיקה');
        }

        // 3. מחיקת משימות של הלקוחות
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .in('client_id', clientIds);
        
        if (tasksError) {
          console.warn('⚠️ [SAFEGUARD] שגיאה בניקוי משימות:', tasksError);
        } else {
          console.log('✅ [SAFEGUARD] נוקו משימות של לקוחות הבדיקה');
        }

        // 4. מחיקת רישומי זמן של הלקוחות
        const { error: timeEntriesError } = await supabase
          .from('time_entries')
          .delete()
          .in('client_id', clientIds);
        
        if (timeEntriesError) {
          console.warn('⚠️ [SAFEGUARD] שגיאה בניקוי רישומי זמן:', timeEntriesError);
        } else {
          console.log('✅ [SAFEGUARD] נוקו רישומי זמן של לקוחות הבדיקה');
        }

        // 5. עכשיו אפשר למחוק את הלקוחות
        const { error: clientsError } = await supabase
          .from('clients')
          .delete()
          .in('id', clientIds);
        
        if (clientsError) {
          console.error('⚠️ [SAFEGUARD] שגיאה בניקוי לקוחות:', clientsError);
        } else {
          console.log(`✅ [SAFEGUARD] נוקו ${clientIds.length} לקוחות`);
        }
      }

      // ניקוי משימות ישנות מבדיקות (יותר משבוע)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { error: oldTasksError } = await supabase
        .from('tasks')
        .delete()
        .like('title', '%E2E%')
        .lt('created_at', weekAgo.toISOString());
      
      if (oldTasksError) {
        console.error('⚠️ [SAFEGUARD] שגיאה בניקוי משימות ישנות:', oldTasksError);
      } else {
        console.log('✅ [SAFEGUARD] נוקו משימות ישנות מבדיקות');
      }

    } catch (error) {
      console.error('❌ [SAFEGUARD] שגיאה בניקוי נתונים:', error);
    }
  }

  /**
   * בדיקת תקינות טבלה לפני שימוש
   */
  static async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        // בדיקה אם זו שגיאה של טבלה לא קיימת
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.warn(`⚠️ [SAFEGUARD] טבלה ${tableName} לא קיימת`);
          return false;
        }
        // שגיאה אחרת - אולי RLS
        console.warn(`⚠️ [SAFEGUARD] שגיאה בגישה לטבלה ${tableName}:`, error.message);
        return true; // נניח שהטבלה קיימת, רק יש בעיית הרשאות
      }
      
      console.log(`✅ [SAFEGUARD] טבלה ${tableName} קיימת ונגישה`);
      return true;
    } catch (error) {
      console.error(`❌ [SAFEGUARD] שגיאה בבדיקת טבלה ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Retry מנגנון - ניסיון חוזר במקרה של כישלון זמני
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    testName: string = 'פעולה'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [SAFEGUARD] ${testName} - ניסיון ${attempt}/${maxRetries}`);
        const result = await fn();
        if (attempt > 1) {
          console.log(`✅ [SAFEGUARD] ${testName} הצליח בניסיון ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ [SAFEGUARD] ${testName} נכשל בניסיון ${attempt}:`, lastError.message);
        
        if (attempt < maxRetries) {
          const waitTime = delayMs * attempt; // Exponential backoff
          console.log(`⏳ [SAFEGUARD] ממתין ${waitTime}ms לפני ניסיון נוסף...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error(`❌ [SAFEGUARD] ${testName} נכשל אחרי ${maxRetries} ניסיונות`);
    throw lastError!;
  }

  /**
   * איפוס מלא של מערכת ההגנות (לשימוש בפיתוח בלבד)
   */
  static reset(): void {
    console.warn('⚠️ [SAFEGUARD] איפוס מלא של מערכת ההגנות');
    this.runningTests.clear();
    this.lastRunTime.clear();
  }

  /**
   * קבלת סטטוס נוכחי
   */
  static getStatus() {
    return {
      runningTests: Array.from(this.runningTests),
      testCount: this.runningTests.size,
      lastRunTimes: Object.fromEntries(this.lastRunTime)
    };
  }
}
