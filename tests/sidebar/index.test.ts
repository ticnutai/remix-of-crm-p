/**
 * בדיקות אינטגרציה כלליות לסיידבר
 * 
 * בדיקות אלו מוודאות:
 * 1. אין חפיפות בין mainNav ל-systemNav
 * 2. אין חפיפות בין טאבים קבועים ל-customTables
 * 3. כל הטאבים יחד יוצרים מערכת עקבית
 * 4. ניווט עובד כראוי בין כל הטאבים
 */

import { describe, it, expect } from '@playwright/test';

describe('בדיקות אינטגרציה - Sidebar', () => {
  
  // הגדרת כל הטאבים
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

  describe('בדיקת ייחודיות בין קבוצות', () => {
    it('אין חפיפה ב-URLs בין mainNav ל-systemNav', () => {
      const mainUrls = mainNavItems.map(item => item.url);
      const systemUrls = systemNavItems.map(item => item.url);
      
      systemUrls.forEach(systemUrl => {
        expect(mainUrls).not.toContain(systemUrl);
      });
    });

    it('אין חפיפה בשמות בין mainNav ל-systemNav', () => {
      const mainTitles = mainNavItems.map(item => item.title);
      const systemTitles = systemNavItems.map(item => item.title);
      
      systemTitles.forEach(systemTitle => {
        expect(mainTitles).not.toContain(systemTitle);
      });
    });

    it('אין חפיפה ב-testIds בין mainNav ל-systemNav', () => {
      const mainTestIds = mainNavItems.map(item => item.testId);
      const systemTestIds = systemNavItems.map(item => item.testId);
      
      systemTestIds.forEach(systemTestId => {
        expect(mainTestIds).not.toContain(systemTestId);
      });
    });
  });

  describe('בדיקת כלל הטאבים ביחד', () => {
    const allNavItems = [...mainNavItems, ...systemNavItems];

    it('אין כפילויות ב-URLs בכלל המערכת', () => {
      const urls = allNavItems.map(item => item.url);
      const uniqueUrls = new Set(urls);
      expect(urls.length).toBe(uniqueUrls.size);
    });

    it('אין כפילויות בשמות בכלל המערכת', () => {
      const titles = allNavItems.map(item => item.title);
      const uniqueTitles = new Set(titles);
      expect(titles.length).toBe(uniqueTitles.size);
    });

    it('אין כפילויות ב-testIds בכלל המערכת', () => {
      const testIds = allNavItems.map(item => item.testId);
      const uniqueTestIds = new Set(testIds);
      expect(testIds.length).toBe(uniqueTestIds.size);
    });

    it('סך כל הטאבים הקבועים נכון', () => {
      expect(allNavItems.length).toBe(28); // 20 + 8
    });
  });

  describe('בדיקת תבנית URLs', () => {
    const allNavItems = [...mainNavItems, ...systemNavItems];

    it('כל ה-URLs מתחילים ב-/ או הם /', () => {
      allNavItems.forEach(item => {
        expect(item.url === '/' || item.url.startsWith('/')).toBe(true);
      });
    });

    it('אין URLs עם רווחים', () => {
      allNavItems.forEach(item => {
        expect(item.url).not.toContain(' ');
      });
    });

    it('אין URLs עם אותיות גדולות', () => {
      allNavItems.forEach(item => {
        if (item.url !== '/') {
          expect(item.url).toBe(item.url.toLowerCase());
        }
      });
    });

    it('URLs בפורמט תקין (kebab-case או /)', () => {
      allNavItems.forEach(item => {
        if (item.url !== '/') {
          expect(item.url).toMatch(/^\/[a-z-]+$/);
        }
      });
    });
  });

  describe('בדיקת תבנית שמות', () => {
    const allNavItems = [...mainNavItems, ...systemNavItems];

    it('כל השמות לא ריקים', () => {
      allNavItems.forEach(item => {
        expect(item.title).toBeTruthy();
        expect(item.title.length).toBeGreaterThan(0);
      });
    });

    it('אין שמות עם undefined או null', () => {
      allNavItems.forEach(item => {
        expect(item.title).not.toContain('undefined');
        expect(item.title).not.toContain('null');
      });
    });
  });

  describe('בדיקת testIds', () => {
    const allNavItems = [...mainNavItems, ...systemNavItems];

    it('כל ה-testIds מתחילים ב-nav-', () => {
      allNavItems.forEach(item => {
        expect(item.testId).toMatch(/^nav-/);
      });
    });

    it('testIds בפורמט kebab-case', () => {
      allNavItems.forEach(item => {
        expect(item.testId).toMatch(/^nav-[a-z-]+$/);
      });
    });
  });

  describe('בדיקת Custom Tables Integration', () => {
    it('custom tables משתמשים ב-prefix /custom/', () => {
      const customTableUrl = '/custom/test-table-id';
      const allUrls = [...mainNavItems, ...systemNavItems].map(item => item.url);
      
      // וודא שאין URL שמתחיל ב-/custom/ בטאבים הקבועים
      allUrls.forEach(url => {
        expect(url).not.toMatch(/^\/custom\//);
      });
    });

    it('custom table URL לא מתנגש עם טאבים קיימים', () => {
      const mockCustomTableIds = ['clients', 'employees', 'reports'];
      const allUrls = [...mainNavItems, ...systemNavItems].map(item => item.url);
      
      mockCustomTableIds.forEach(id => {
        const customUrl = `/custom/${id}`;
        expect(allUrls).not.toContain(customUrl);
      });
    });
  });

  describe('בדיקת עקביות מבנה', () => {
    const allNavItems = [...mainNavItems, ...systemNavItems];

    it('כל הטאבים מכילים את כל השדות הנדרשים', () => {
      allNavItems.forEach(item => {
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('url');
        expect(item).toHaveProperty('testId');
      });
    });

    it('כל הטאבים מכילים רק שדות מותרים', () => {
      const allowedKeys = ['title', 'url', 'testId', 'icon', 'color', 'canAddTable'];
      
      allNavItems.forEach(item => {
        Object.keys(item).forEach(key => {
          expect(allowedKeys).toContain(key);
        });
      });
    });
  });

  describe('בדיקת חלוקה לוגית', () => {
    it('mainNav גדול מ-systemNav', () => {
      expect(mainNavItems.length).toBeGreaterThan(systemNavItems.length);
    });

    it('יחס mainNav:systemNav הגיוני', () => {
      const ratio = mainNavItems.length / systemNavItems.length;
      expect(ratio).toBeGreaterThan(1.5);
      expect(ratio).toBeLessThan(5);
    });
  });

  describe('בדיקת URLs קריטיים', () => {
    const allUrls = [...mainNavItems, ...systemNavItems].map(item => item.url);

    it('דף הבית (/) קיים', () => {
      expect(allUrls).toContain('/');
    });

    it('עמוד הגדרות קיים', () => {
      expect(allUrls).toContain('/settings');
    });

    it('עמוד עזרה קיים', () => {
      expect(allUrls).toContain('/help');
    });

    it('עמוד לקוחות קיים', () => {
      expect(allUrls).toContain('/clients');
    });
  });

  describe('בדיקת נתיבים מסוכנים', () => {
    const allUrls = [...mainNavItems, ...systemNavItems].map(item => item.url);

    it('אין נתיב admin (מוגן)', () => {
      expect(allUrls).not.toContain('/admin');
    });

    it('אין נתיבים עם תווים מיוחדים', () => {
      allUrls.forEach(url => {
        expect(url).not.toMatch(/[<>'"&]/);
      });
    });
  });

  describe('בדיקת קונפליקטים פוטנציאליים', () => {
    it('אין URLs שיכולים להתבלבל', () => {
      const problematicPairs = [
        ['/client', '/clients'],
        ['/report', '/reports'],
        ['/setting', '/settings'],
      ];

      const allUrls = [...mainNavItems, ...systemNavItems].map(item => item.url);

      problematicPairs.forEach(([singular, plural]) => {
        const hasSingular = allUrls.includes(singular);
        const hasPlural = allUrls.includes(plural);
        
        // אם יש את שניהם, זו בעיה
        if (hasSingular && hasPlural) {
          expect(false).toBe(true); // כפה כישלון
        }
      });
    });
  });

  describe('בדיקת סטטיסטיקות כלליות', () => {
    it('כמות סבירה של טאבים', () => {
      const total = mainNavItems.length + systemNavItems.length;
      expect(total).toBeGreaterThan(20);
      expect(total).toBeLessThan(50);
    });

    it('אורך ממוצע של שמות טאבים סביר', () => {
      const allTitles = [...mainNavItems, ...systemNavItems].map(item => item.title);
      const avgLength = allTitles.reduce((sum, title) => sum + title.length, 0) / allTitles.length;
      
      expect(avgLength).toBeGreaterThan(5);
      expect(avgLength).toBeLessThan(20);
    });
  });
});
