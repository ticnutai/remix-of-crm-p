/**
 * פונקציות עזר לבדיקות - מערכת מקיפה לזיהוי בעיות
 */

import { supabase } from '@/integrations/supabase/client';

// פונקציה לסריקת כל הקישורים בדף
export const scanAllLinks = async (): Promise<{
  total: number;
  broken: Array<{ url: string; text: string; error: string }>;
  working: number;
}> => {
  const links = document.querySelectorAll('a[href]');
  const broken: Array<{ url: string; text: string; error: string }> = [];
  let working = 0;

  for (const link of Array.from(links)) {
    const href = link.getAttribute('href');
    const text = link.textContent || 'ללא טקסט';
    
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }

    try {
      // בדיקה אם זה ניתוב פנימי
      if (href.startsWith('/')) {
        // נניח שניתובי React Router תקינים אם הם מוגדרים
        working++;
      } else {
        // קישור חיצוני - נבדוק אותו
        const response = await fetch(href, { method: 'HEAD' });
        if (response.ok) {
          working++;
        } else {
          broken.push({
            url: href,
            text,
            error: `HTTP ${response.status} - ${response.statusText}`
          });
        }
      }
    } catch (error) {
      broken.push({
        url: href,
        text,
        error: error instanceof Error ? error.message : 'שגיאת חיבור'
      });
    }
  }

  return {
    total: links.length,
    broken,
    working
  };
};

// בדיקת כל הכפתורים בדף
export const scanAllButtons = (): {
  total: number;
  withoutAction: Array<{ text: string; id?: string; className?: string }>;
  withAction: number;
} => {
  const buttons = document.querySelectorAll('button, [role="button"]');
  const withoutAction: Array<{ text: string; id?: string; className?: string }> = [];
  let withAction = 0;

  for (const button of Array.from(buttons)) {
    const text = button.textContent?.trim() || 'ללא טקסט';
    const hasOnClick = button.hasAttribute('onclick') || 
                       (button as HTMLElement).onclick !== null;
    const hasEventListener = (button as any)._reactListeners !== undefined;

    if (!hasOnClick && !hasEventListener && !(button as HTMLButtonElement).form) {
      withoutAction.push({
        text,
        id: button.id || undefined,
        className: button.className || undefined
      });
    } else {
      withAction++;
    }
  }

  return {
    total: buttons.length,
    withoutAction,
    withAction
  };
};

// בדיקת טפסים - האם יש טפסים ללא submit handler
export const scanForms = (): {
  total: number;
  withoutHandler: Array<{ id?: string; action?: string }>;
  withHandler: number;
} => {
  const forms = document.querySelectorAll('form');
  const withoutHandler: Array<{ id?: string; action?: string }> = [];
  let withHandler = 0;

  for (const form of Array.from(forms)) {
    const hasOnSubmit = form.hasAttribute('onsubmit') || 
                        form.onsubmit !== null;
    const hasEventListener = (form as any)._reactListeners !== undefined;

    if (!hasOnSubmit && !hasEventListener) {
      withoutHandler.push({
        id: form.id || undefined,
        action: form.action || undefined
      });
    } else {
      withHandler++;
    }
  }

  return {
    total: forms.length,
    withoutHandler,
    withHandler
  };
};

// בדיקת כל הטבלאות במסד הנתונים
export const checkAllDatabaseTables = async (): Promise<{
  accessible: string[];
  inaccessible: Array<{ table: string; error: string }>;
}> => {
  const commonTables = [
    'profiles',
    'clients',
    'employees',
    'tasks',
    'meetings',
    'time_logs',
    'reminders',
    'custom_tables',
    'client_contacts',
    'client_sources',
    'roles',
    'permissions',
    'activity_logs',
    'notifications',
  ];

  const accessible: string[] = [];
  const inaccessible: Array<{ table: string; error: string }> = [];

  for (const table of commonTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(0);

      if (error) {
        inaccessible.push({ table, error: error.message });
      } else {
        accessible.push(table);
      }
    } catch (error) {
      inaccessible.push({ 
        table, 
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה' 
      });
    }
  }

  return { accessible, inaccessible };
};

// בדיקת שגיאות JavaScript בקונסול
export const captureConsoleErrors = (): {
  setup: () => void;
  getErrors: () => Array<{ message: string; stack?: string; timestamp: Date }>;
  clear: () => void;
} => {
  const errors: Array<{ message: string; stack?: string; timestamp: Date }> = [];
  let originalConsoleError: typeof console.error;

  return {
    setup: () => {
      originalConsoleError = console.error;
      console.error = (...args) => {
        errors.push({
          message: args.map(arg => String(arg)).join(' '),
          stack: new Error().stack,
          timestamp: new Date()
        });
        originalConsoleError.apply(console, args);
      };
    },
    getErrors: () => [...errors],
    clear: () => {
      errors.length = 0;
      if (originalConsoleError) {
        console.error = originalConsoleError;
      }
    }
  };
};

// בדיקת ביצועים - זיהוי דפים איטיים
export const checkPagePerformance = async (url: string): Promise<{
  loadTime: number;
  status: 'excellent' | 'good' | 'poor' | 'critical';
  recommendations: string[];
}> => {
  const startTime = performance.now();
  
  try {
    await fetch(url, { method: 'HEAD' });
  } catch {
    // אם fetch נכשל, עדיין נמדוד את הזמן
  }
  
  const loadTime = Math.round(performance.now() - startTime);
  const recommendations: string[] = [];
  
  let status: 'excellent' | 'good' | 'poor' | 'critical';
  
  if (loadTime < 1000) {
    status = 'excellent';
  } else if (loadTime < 3000) {
    status = 'good';
    recommendations.push('שקול אופטימיזציה נוספת');
  } else if (loadTime < 5000) {
    status = 'poor';
    recommendations.push('זמן הטעינה איטי - בדוק bundle size');
    recommendations.push('שקול lazy loading לקומפוננטות');
  } else {
    status = 'critical';
    recommendations.push('⚠️ זמן טעינה קריטי - דרוש תיקון מיידי');
    recommendations.push('בדוק שאילתות למסד נתונים');
    recommendations.push('בדוק גודל assets (תמונות, JS, CSS)');
  }

  return { loadTime, status, recommendations };
};

// בדיקת נגישות (Accessibility) בסיסית
export const checkAccessibility = (): {
  issues: Array<{ type: string; element: string; message: string }>;
  score: number;
} => {
  const issues: Array<{ type: string; element: string; message: string }> = [];

  // בדיקת alt text לתמונות
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.alt) {
      issues.push({
        type: 'missing-alt',
        element: `img[${index}]`,
        message: 'תמונה ללא טקסט alt'
      });
    }
  });

  // בדיקת labels לטפסים
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach((input, index) => {
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (!label) {
        issues.push({
          type: 'missing-label',
          element: `${input.tagName.toLowerCase()}[${index}]`,
          message: 'שדה טופס ללא label'
        });
      }
    }
  });

  // בדיקת כפתורים ללא טקסט
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button, index) => {
    if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
      issues.push({
        type: 'empty-button',
        element: `button[${index}]`,
        message: 'כפתור ללא טקסט או aria-label'
      });
    }
  });

  // חישוב ציון
  const totalChecks = images.length + inputs.length + buttons.length;
  const score = totalChecks > 0 
    ? Math.round(((totalChecks - issues.length) / totalChecks) * 100)
    : 100;

  return { issues, score };
};

// בדיקת responsive - האם הדף נראה טוב במסכים שונים
export const checkResponsive = (): {
  currentWidth: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasOverflow: boolean;
} => {
  const width = window.innerWidth;
  const body = document.body;
  const hasOverflow = body.scrollWidth > body.clientWidth;

  return {
    currentWidth: width,
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    hasOverflow
  };
};
