// Error Monitoring Hook - Real-time error detection and tracking
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorLog {
  id: string;
  timestamp: Date;
  type: 'console' | 'runtime' | 'network' | 'migration' | 'supabase';
  severity: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  source?: string;
}

export interface ErrorStats {
  total: number;
  errors: number;
  warnings: number;
  lastError?: ErrorLog;
  errorRate: number; // errors per minute
}

export function useErrorMonitoring(enabled: boolean = true) {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats>({
    total: 0,
    errors: 0,
    warnings: 0,
    errorRate: 0
  });

  // Add new error to log
  const logError = useCallback((error: Omit<ErrorLog, 'id' | 'timestamp'>) => {
    const errorLog: ErrorLog = {
      ...error,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setErrors(prev => {
      const updated = [errorLog, ...prev].slice(0, 100); // Keep last 100 errors
      return updated;
    });

    // Update stats
    setStats(prev => ({
      total: prev.total + 1,
      errors: prev.errors + (error.severity === 'error' ? 1 : 0),
      warnings: prev.warnings + (error.severity === 'warning' ? 1 : 0),
      lastError: errorLog,
      errorRate: calculateErrorRate([errorLog, ...errors].slice(0, 100))
    }));

    // Show toast for critical errors
    if (error.severity === 'error' && enabled) {
      toast.error('שגיאה זוהתה במערכת', {
        description: error.message.slice(0, 100),
        action: {
          label: 'פרטים',
          onClick: () => {
            console.group('🔴 Error Details');
            console.error('Message:', error.message);
            console.error('Type:', error.type);
            console.error('Stack:', error.stack);
            console.error('Context:', error.context);
            console.groupEnd();
          }
        }
      });
    }

    return errorLog;
  }, [enabled, errors]);

  // Calculate error rate (errors per minute)
  const calculateErrorRate = (errorList: ErrorLog[]): number => {
    if (errorList.length === 0) return 0;

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentErrors = errorList.filter(e => e.timestamp > oneMinuteAgo);

    return recentErrors.length;
  };

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
    setStats({
      total: 0,
      errors: 0,
      warnings: 0,
      errorRate: 0
    });
    toast.success('לוג השגיאות נוקה');
  }, []);

  // Clear old errors (older than 5 minutes)
  const clearOldErrors = useCallback(() => {
    const fiveMinutesAgo = new Date(Date.now() - 300000);
    setErrors(prev => prev.filter(e => e.timestamp > fiveMinutesAgo));
    toast.info('שגיאות ישנות נוקו');
  }, []);

  // Get errors by type
  const getErrorsByType = useCallback((type: ErrorLog['type']) => {
    return errors.filter(e => e.type === type);
  }, [errors]);

  // Get errors by severity
  const getErrorsBySeverity = useCallback((severity: ErrorLog['severity']) => {
    return errors.filter(e => e.severity === severity);
  }, [errors]);

  // Monitor console errors
  useEffect(() => {
    if (!enabled) return;

    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.error
    console.error = (...args: any[]) => {
      originalError.apply(console, args);

      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      logError({
        type: 'console',
        severity: 'error',
        message,
        stack: new Error().stack,
        source: 'console.error'
      });
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);

      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      logError({
        type: 'console',
        severity: 'warning',
        message,
        source: 'console.warn'
      });
    };

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [enabled, logError]);

  // Monitor unhandled errors
  useEffect(() => {
    if (!enabled) return;

    const handleError = (event: ErrorEvent) => {
      logError({
        type: 'runtime',
        severity: 'error',
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        source: 'window.onerror'
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      logError({
        type: 'runtime',
        severity: 'error',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        source: 'unhandledrejection'
      });
    };

    globalThis.addEventListener('error', handleError);
    globalThis.addEventListener('unhandledrejection', handleRejection);

    return () => {
      globalThis.removeEventListener('error', handleError);
      globalThis.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [enabled, logError]);

  // Monitor network errors
  useEffect(() => {
    if (!enabled) return;

    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        const response = await originalFetch(...args);

        if (!response.ok) {
          logError({
            type: 'network',
            severity: 'error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            context: {
              url: args[0],
              status: response.status,
              statusText: response.statusText
            },
            source: 'fetch'
          });
        }

        return response;
      } catch (error: any) {
        logError({
          type: 'network',
          severity: 'error',
          message: error.message || 'Network request failed',
          stack: error.stack,
          context: {
            url: args[0]
          },
          source: 'fetch'
        });
        throw error;
      }
    };

    return () => {
      globalThis.fetch = originalFetch;
    };
  }, [enabled, logError]);

  return {
    errors,
    stats,
    logError,
    clearErrors,
    clearOldErrors,
    getErrorsByType,
    getErrorsBySeverity
  };
}
