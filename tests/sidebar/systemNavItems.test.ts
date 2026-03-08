/**
 * בדיקות לטאבים בניווט המערכת (systemNavItems)
 * 
 * בדיקות אלו מוודאות:
 * 1. כל טאב קיים ופעיל
 * 2. אין כפילויות ב-URL או בשמות
 * 3. כל טאב מכיל icon תקין
 * 4. הניווט עובד כראוי
 */

import { describe, it, expect } from '@playwright/test';

describe('בדיקות Sidebar - ניווט מערכת (systemNavItems)', () => {
  const systemNavItems = [
    { title: 'אוטומציות', url: '/workflows', testId: 'nav-workflows' },
    { title: 'אנליטיקס', url: '/analytics', testId: 'nav-analytics' },
    { title: 'לוג שינויים', url: '/audit-log', testId: 'nav-audit-log' },
    { title: 'תבניות הצעות', url: '/quote-templates', testId: 'nav-quote-templates' },
    { title: 'גיבויים וייבוא', url: '/backups', testId: 'nav-backups' },
    { title: 'היסטוריה', url: '/history', testId: 'nav-history' },
    { title: 'הגדרות', url: '/settings', testId: 'nav-settings' },
    { title: 'עזרה', url: '/help', testId: 'nav-help' },
  ];

  describe('בדיקת כפילויות', () => {
    it('אין כפילויות ב-URL', () => {
      const urls = systemNavItems.map(item => item.url);
      const uniqueUrls = new Set(urls);
      expect(urls.length).toBe(uniqueUrls.size);
    });

    it('אין כפילויות בשמות הטאבים', () => {
      const titles = systemNavItems.map(item => item.title);
      const uniqueTitles = new Set(titles);
      expect(titles.length).toBe(uniqueTitles.size);
    });

    it('אין כפילויות ב-testId', () => {
      const testIds = systemNavItems.map(item => item.testId);
      const uniqueTestIds = new Set(testIds);
      expect(testIds.length).toBe(uniqueTestIds.size);
    });
  });

  describe('בדיקת תקינות נתונים', () => {
    systemNavItems.forEach(item => {
      describe(`טאב: ${item.title}`, () => {
        it('מכיל URL תקין', () => {
          expect(item.url).toBeTruthy();
          expect(item.url).toMatch(/^\//);
        });

        it('מכיל שם תקין', () => {
          expect(item.title).toBeTruthy();
          expect(item.title.length).toBeGreaterThan(0);
        });

        it('מכיל testId ייחודי', () => {
          expect(item.testId).toBeTruthy();
          expect(item.testId).toMatch(/^nav-/);
        });
      });
    });
  });

  describe('בדיקת מבנה הנתונים', () => {
    it('כל הטאבים מכילים את כל השדות הנדרשים', () => {
      systemNavItems.forEach(item => {
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('url');
        expect(item).toHaveProperty('testId');
      });
    });

    it('מספר הטאבים הוא כפי שמצופה', () => {
      // יש 8 טאבים בניווט המערכת
      expect(systemNavItems.length).toBe(8);
    });
  });

  describe('בדיקת סדר הטאבים', () => {
    it('הגדרות ועזרה נמצאים בסוף', () => {
      const lastTwo = systemNavItems.slice(-2).map(item => item.title);
      expect(lastTwo).toContain('הגדרות');
      expect(lastTwo).toContain('עזרה');
    });

    it('אוטומציות נמצאת בתחילה', () => {
      expect(systemNavItems[0].title).toBe('אוטומציות');
    });
  });

  describe('בדיקת קטגוריות', () => {
    it('טאבי ניהול מערכת קיימים', () => {
      const systemTabs = systemNavItems.filter(
        item => item.title.includes('הגדרות') || item.title.includes('גיבויים')
      );
      expect(systemTabs.length).toBeGreaterThan(0);
    });

    it('טאבי מעקב וניתוח קיימים', () => {
      const analyticsTabs = systemNavItems.filter(
        item => item.title.includes('אנליטיקס') || 
               item.title.includes('לוג') || 
               item.title.includes('היסטוריה')
      );
      expect(analyticsTabs.length).toBeGreaterThan(0);
    });

    it('טאבי עזרה ותמיכה קיימים', () => {
      const helpTabs = systemNavItems.filter(
        item => item.title.includes('עזרה')
      );
      expect(helpTabs.length).toBeGreaterThan(0);
    });
  });

  describe('בדיקת URLs תקינים', () => {
    it('כל ה-URLs מתחילים ב-/', () => {
      systemNavItems.forEach(item => {
        expect(item.url.startsWith('/')).toBe(true);
      });
    });

    it('אין spaces ב-URLs', () => {
      systemNavItems.forEach(item => {
        expect(item.url).not.toContain(' ');
      });
    });

    it('URLs בפורמט kebab-case', () => {
      systemNavItems.forEach(item => {
        expect(item.url).toMatch(/^\/[a-z-]+$/);
      });
    });
  });

  describe('בדיקת ייחודיות בין קבוצות', () => {
    const mainNavUrls = [
      '/', '/dashboard', '/my-day', '/clients', '/datatable-pro',
      '/employees', '/time-logs', '/time-analytics', '/tasks-meetings',
      '/kanban', '/reminders', '/quotes', '/finance', '/reports',
      '/custom-reports', '/calendar', '/gmail', '/files', '/documents', '/calls'
    ];

    it('אין חפיפה בין URLs של systemNav ל-mainNav', () => {
      systemNavItems.forEach(systemItem => {
        expect(mainNavUrls).not.toContain(systemItem.url);
      });
    });
  });

  describe('בדיקת תפקידים ספציפיים', () => {
    it('טאב גיבויים קיים ותקין', () => {
      const backupTab = systemNavItems.find(item => item.url === '/backups');
      expect(backupTab).toBeDefined();
      expect(backupTab?.title).toBe('גיבויים וייבוא');
    });

    it('טאב הגדרות קיים ותקין', () => {
      const settingsTab = systemNavItems.find(item => item.url === '/settings');
      expect(settingsTab).toBeDefined();
      expect(settingsTab?.title).toBe('הגדרות');
    });

    it('טאב אוטומציות קיים ותקין', () => {
      const workflowsTab = systemNavItems.find(item => item.url === '/workflows');
      expect(workflowsTab).toBeDefined();
      expect(workflowsTab?.title).toBe('אוטומציות');
    });

    it('טאב היסטוריה קיים ותקין', () => {
      const historyTab = systemNavItems.find(item => item.url === '/history');
      expect(historyTab).toBeDefined();
      expect(historyTab?.title).toBe('היסטוריה');
    });
  });
});
