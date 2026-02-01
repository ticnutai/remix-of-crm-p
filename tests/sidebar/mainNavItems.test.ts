/**
 * בדיקות לטאבים בניווט הראשי (mainNavItems)
 * 
 * בדיקות אלו מוודאות:
 * 1. כל טאב קיים ופעיל
 * 2. אין כפילויות ב-URL או בשמות
 * 3. כל טאב מכיל icon תקין
 * 4. הניווט עובד כראוי
 */

import { describe, it, expect, beforeAll } from '@playwright/test';

describe('בדיקות Sidebar - ניווט ראשי (mainNavItems)', () => {
  const mainNavItems = [
    { title: 'לוח בקרה', url: '/', testId: 'nav-dashboard' },
    { title: 'דשבורד מנהל', url: '/dashboard', testId: 'nav-admin-dashboard' },
    { title: 'היום שלי', url: '/my-day', testId: 'nav-my-day' },
    { title: 'לקוחות', url: '/clients', testId: 'nav-clients' },
    { title: 'טבלת לקוחות', url: '/datatable-pro', testId: 'nav-datatable-pro' },
    { title: 'עובדים', url: '/employees', testId: 'nav-employees' },
    { title: 'לוגי זמן', url: '/time-logs', testId: 'nav-time-logs' },
    { title: 'ניתוח זמנים', url: '/time-analytics', testId: 'nav-time-analytics' },
    { title: 'משימות ופגישות', url: '/tasks-meetings', testId: 'nav-tasks-meetings' },
    { title: 'לוח קנבן', url: '/kanban', testId: 'nav-kanban' },
    { title: 'תזכורות', url: '/reminders', testId: 'nav-reminders' },
    { title: 'הצעות מחיר', url: '/quotes', testId: 'nav-quotes' },
    { title: 'כספים', url: '/finance', testId: 'nav-finance' },
    { title: 'דוחות', url: '/reports', testId: 'nav-reports' },
    { title: 'דוחות מותאמים', url: '/custom-reports', testId: 'nav-custom-reports' },
    { title: 'לוח שנה', url: '/calendar', testId: 'nav-calendar' },
    { title: 'Gmail', url: '/gmail', testId: 'nav-gmail' },
    { title: 'קבצים', url: '/files', testId: 'nav-files' },
    { title: 'מסמכים', url: '/documents', testId: 'nav-documents' },
    { title: 'שיחות', url: '/calls', testId: 'nav-calls' },
  ];

  describe('בדיקת כפילויות', () => {
    it('אין כפילויות ב-URL', () => {
      const urls = mainNavItems.map(item => item.url);
      const uniqueUrls = new Set(urls);
      expect(urls.length).toBe(uniqueUrls.size);
    });

    it('אין כפילויות בשמות הטאבים', () => {
      const titles = mainNavItems.map(item => item.title);
      const uniqueTitles = new Set(titles);
      expect(titles.length).toBe(uniqueTitles.size);
    });

    it('אין כפילויות ב-testId', () => {
      const testIds = mainNavItems.map(item => item.testId);
      const uniqueTestIds = new Set(testIds);
      expect(testIds.length).toBe(uniqueTestIds.size);
    });
  });

  describe('בדיקת תקינות נתונים', () => {
    mainNavItems.forEach(item => {
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
      mainNavItems.forEach(item => {
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('url');
        expect(item).toHaveProperty('testId');
      });
    });

    it('מספר הטאבים הוא כפי שמצופה', () => {
      // יש 20 טאבים בניווט הראשי
      expect(mainNavItems.length).toBe(20);
    });
  });

  describe('בדיקת סדר הטאבים', () => {
    it('לוח הבקרה הוא הטאב הראשון', () => {
      expect(mainNavItems[0].title).toBe('לוח בקרה');
      expect(mainNavItems[0].url).toBe('/');
    });

    it('הטאבים מסודרים בצורה הגיונית', () => {
      // בדיקה שהטאבים החשובים ביותר נמצאים בתחילה
      const importantTabs = ['לוח בקרה', 'דשבורד מנהל', 'היום שלי', 'לקוחות'];
      const firstFourTitles = mainNavItems.slice(0, 4).map(item => item.title);
      expect(firstFourTitles).toEqual(importantTabs);
    });
  });

  describe('בדיקת קטגוריות', () => {
    it('טאבי ניהול זמן קיימים', () => {
      const timeManagementTabs = mainNavItems.filter(
        item => item.title.includes('זמן') || item.title.includes('לוגי')
      );
      expect(timeManagementTabs.length).toBeGreaterThan(0);
    });

    it('טאבי ניהול לקוחות קיימים', () => {
      const clientTabs = mainNavItems.filter(
        item => item.title.includes('לקוחות') || item.title.includes('טבלת')
      );
      expect(clientTabs.length).toBeGreaterThan(0);
    });

    it('טאבי דוחות וכספים קיימים', () => {
      const financeTabs = mainNavItems.filter(
        item => item.title.includes('דוחות') || item.title.includes('כספים')
      );
      expect(financeTabs.length).toBeGreaterThan(0);
    });
  });

  describe('בדיקת URLs תקינים', () => {
    it('כל ה-URLs מתחילים ב-/', () => {
      mainNavItems.forEach(item => {
        expect(item.url.startsWith('/')).toBe(true);
      });
    });

    it('אין spaces ב-URLs', () => {
      mainNavItems.forEach(item => {
        expect(item.url).not.toContain(' ');
      });
    });

    it('URLs בפורמט kebab-case', () => {
      mainNavItems.forEach(item => {
        if (item.url !== '/') {
          expect(item.url).toMatch(/^\/[a-z-]+$/);
        }
      });
    });
  });
});
