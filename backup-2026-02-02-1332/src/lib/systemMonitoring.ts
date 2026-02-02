/**
 * System Monitoring - ניטור ביצועים ושגיאות בזמן אמת
 * קריטי לזיהוי בעיות בייצור לפני שהלקוחות מתלוננים
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
}

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  severity: 'error' | 'warning' | 'info';
}

export class SystemMonitoring {
  private static performanceMetrics: PerformanceMetric[] = [];
  private static errorLogs: ErrorLog[] = [];
  private static maxMetrics = 1000; // שמור עד 1000 מדידות
  private static maxErrors = 500;   // שמור עד 500 שגיאות

  /**
   * אתחול ניטור
   */
  static init() {
    console.log('🎯 [MONITORING] מאתחל מערכת ניטור...');

    // ניטור שגיאות
    this.setupErrorHandling();
    
    // ניטור ביצועים
    this.setupPerformanceMonitoring();
    
    // ניטור חיבור רשת
    this.setupNetworkMonitoring();

    // ניטור זיכרון
    this.setupMemoryMonitoring();

    console.log('✅ [MONITORING] מערכת ניטור פעילה');
  }

  /**
   * ניטור שגיאות גלובלי
   */
  private static setupErrorHandling() {
    // שגיאות JavaScript
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        severity: 'error'
      });
    });

    // שגיאות Promise שלא נתפסו
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        severity: 'error'
      });
    });

    // שגיאות console.error
    const originalError = console.error;
    console.error = (...args: any[]) => {
      this.logError({
        message: args.map(a => String(a)).join(' '),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        severity: 'error'
      });
      originalError.apply(console, args);
    };
  }

  /**
   * ניטור ביצועים
   */
  private static setupPerformanceMonitoring() {
    // Page Load Time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (perfData) {
          this.logMetric({
            name: 'page-load-time',
            value: perfData.loadEventEnd - perfData.fetchStart,
            timestamp: Date.now(),
            url: window.location.href
          });

          this.logMetric({
            name: 'dom-content-loaded',
            value: perfData.domContentLoadedEventEnd - perfData.fetchStart,
            timestamp: Date.now(),
            url: window.location.href
          });

          this.logMetric({
            name: 'first-paint',
            value: perfData.responseStart - perfData.fetchStart,
            timestamp: Date.now(),
            url: window.location.href
          });
        }
      }, 0);
    });

    // Monitor route changes (אם יש Router)
    let lastRoute = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== lastRoute) {
        this.logMetric({
          name: 'route-change',
          value: Date.now(),
          timestamp: Date.now(),
          url: window.location.href
        });
        lastRoute = window.location.pathname;
      }
    }, 1000);
  }

  /**
   * ניטור חיבור רשת
   */
  private static setupNetworkMonitoring() {
    // Online/Offline detection
    window.addEventListener('online', () => {
      this.logError({
        message: 'חיבור רשת חזר',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        severity: 'info'
      });
    });

    window.addEventListener('offline', () => {
      this.logError({
        message: 'חיבור רשת אבד!',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        severity: 'warning'
      });
    });

    // Network speed (אם נתמך)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.logMetric({
          name: 'network-speed',
          value: connection.downlink || 0,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * ניטור זיכרון
   */
  private static setupMemoryMonitoring() {
    // בדוק זיכרון כל 30 שניות
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        
        this.logMetric({
          name: 'memory-used',
          value: memory.usedJSHeapSize / 1048576, // MB
          timestamp: Date.now()
        });

        this.logMetric({
          name: 'memory-limit',
          value: memory.jsHeapSizeLimit / 1048576, // MB
          timestamp: Date.now()
        });

        // אזהרה אם הזיכרון מתקרב למגבלה
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (usage > 0.9) {
          this.logError({
            message: `זיכרון גבוה מדי! ${(usage * 100).toFixed(1)}% בשימוש`,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            severity: 'warning'
          });
        }
      }
    }, 30000);
  }

  /**
   * רישום מדד ביצועים
   */
  static logMetric(metric: PerformanceMetric) {
    this.performanceMetrics.push(metric);

    // הגבל את מספר המדדים
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics.shift();
    }

    // אזהרה אם הביצועים גרועים
    if (metric.name === 'page-load-time' && metric.value > 5000) {
      console.warn(`⚠️ [MONITORING] טעינת דף איטית: ${metric.value}ms`);
    }

    // TODO: שלח לשרת ניטור
    // this.sendToMonitoringServer({ type: 'metric', data: metric });
  }

  /**
   * רישום שגיאה
   */
  static logError(error: ErrorLog) {
    this.errorLogs.push(error);

    // הגבל את מספר השגיאות
    if (this.errorLogs.length > this.maxErrors) {
      this.errorLogs.shift();
    }

    console.error(`🚨 [MONITORING] ${error.severity}: ${error.message}`);

    // TODO: שלח לשרת ניטור
    // this.sendToMonitoringServer({ type: 'error', data: error });
  }

  /**
   * קבלת סטטיסטיקות ביצועים
   */
  static getPerformanceStats() {
    const pageLoads = this.performanceMetrics.filter(m => m.name === 'page-load-time');
    const avgLoadTime = pageLoads.length > 0
      ? pageLoads.reduce((sum, m) => sum + m.value, 0) / pageLoads.length
      : 0;

    const memoryUsed = this.performanceMetrics
      .filter(m => m.name === 'memory-used')
      .slice(-1)[0]?.value || 0;

    return {
      avgLoadTime,
      memoryUsed,
      totalErrors: this.errorLogs.filter(e => e.severity === 'error').length,
      totalWarnings: this.errorLogs.filter(e => e.severity === 'warning').length,
      metricsCollected: this.performanceMetrics.length,
      errorsLogged: this.errorLogs.length
    };
  }

  /**
   * קבלת כל השגיאות
   */
  static getRecentErrors(count: number = 10): ErrorLog[] {
    return this.errorLogs.slice(-count).reverse();
  }

  /**
   * קבלת כל המדדים
   */
  static getRecentMetrics(metricName: string, count: number = 10): PerformanceMetric[] {
    return this.performanceMetrics
      .filter(m => m.name === metricName)
      .slice(-count)
      .reverse();
  }

  /**
   * בדיקת בריאות המערכת
   */
  static healthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];

    // בדוק טעינת דפים
    const recentLoads = this.performanceMetrics
      .filter(m => m.name === 'page-load-time')
      .slice(-5);
    
    if (recentLoads.length > 0) {
      const avgLoad = recentLoads.reduce((sum, m) => sum + m.value, 0) / recentLoads.length;
      if (avgLoad > 5000) {
        issues.push(`טעינת דפים איטית מדי (${avgLoad.toFixed(0)}ms ממוצע)`);
      }
    }

    // בדוק שגיאות
    const recentErrors = this.errorLogs.filter(e => 
      e.timestamp > Date.now() - 60000 && // אחרון דקה
      e.severity === 'error'
    );
    
    if (recentErrors.length > 5) {
      issues.push(`${recentErrors.length} שגיאות בדקה האחרונה`);
    }

    // בדוק זיכרון
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      if (usage > 0.9) {
        issues.push(`שימוש גבוה בזיכרון (${(usage * 100).toFixed(1)}%)`);
      }
    }

    // בדוק חיבור רשת
    if (!navigator.onLine) {
      issues.push('אין חיבור רשת');
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  /**
   * ייצוא דוח מלא
   */
  static exportReport(): string {
    const stats = this.getPerformanceStats();
    const health = this.healthCheck();
    const recentErrors = this.getRecentErrors(20);

    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      health,
      stats,
      recentErrors,
      performanceMetrics: this.performanceMetrics.slice(-50),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * ניקוי לוגים ישנים
   */
  static cleanup(olderThanMs: number = 3600000) { // שעה
    const cutoff = Date.now() - olderThanMs;
    
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);
    this.errorLogs = this.errorLogs.filter(e => e.timestamp > cutoff);

    console.log('🧹 [MONITORING] לוגים ישנים נוקו');
  }
}

// אתחול אוטומטי
if (typeof window !== 'undefined') {
  SystemMonitoring.init();
}
