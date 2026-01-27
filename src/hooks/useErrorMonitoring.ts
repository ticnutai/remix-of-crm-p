// Enhanced Error Monitoring Hook - Real-time error detection with Supabase integration
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface ErrorLog {
  id: string;
  timestamp: Date;
  type: 'console' | 'runtime' | 'network' | 'migration' | 'supabase' | 'auth';
  severity: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  source?: string;
  resolved?: boolean;
}

export interface ErrorStats {
  total: number;
  errors: number;
  warnings: number;
  lastError?: ErrorLog;
  errorRate: number;
  supabaseErrors: number;
  networkErrors: number;
  runtimeErrors: number;
}

// Global error storage for sharing between components
const globalErrorStore: ErrorLog[] = [];
const globalListeners: Set<(errors: ErrorLog[]) => void> = new Set();

function notifyListeners() {
  globalListeners.forEach(listener => listener([...globalErrorStore]));
}

function addGlobalError(error: ErrorLog) {
  globalErrorStore.unshift(error);
  if (globalErrorStore.length > 200) {
    globalErrorStore.pop();
  }
  notifyListeners();
}

export function useErrorMonitoring(enabled: boolean = true) {
  const [errors, setErrors] = useState<ErrorLog[]>([...globalErrorStore]);
  const [stats, setStats] = useState<ErrorStats>({
    total: 0,
    errors: 0,
    warnings: 0,
    errorRate: 0,
    supabaseErrors: 0,
    networkErrors: 0,
    runtimeErrors: 0
  });
  const initialized = useRef(false);
  const originalConsoleError = useRef<typeof console.error | null>(null);
  const originalConsoleWarn = useRef<typeof console.warn | null>(null);
  const originalFetch = useRef<typeof fetch | null>(null);

  // Add new error to log
  const logError = useCallback((error: Omit<ErrorLog, 'id' | 'timestamp'>) => {
    const errorLog: ErrorLog = {
      ...error,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false
    };

    addGlobalError(errorLog);

    // Show toast for critical errors
    if (error.severity === 'error' && enabled) {
      toast.error(`🔴 ${error.type.toUpperCase()}: שגיאה זוהתה`, {
        description: error.message.slice(0, 150),
        duration: 8000,
        action: {
          label: 'פרטים בקונסול',
          onClick: () => {
            console.group(`🔴 Error Details [${error.type}]`);
            console.error('Message:', error.message);
            console.error('Type:', error.type);
            console.error('Source:', error.source);
            console.error('Stack:', error.stack);
            console.error('Context:', error.context);
            console.groupEnd();
          }
        }
      });
    }

    return errorLog;
  }, [enabled]);

  // Calculate stats
  const calculateStats = useCallback((errorList: ErrorLog[]): ErrorStats => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentErrors = errorList.filter(e => e.timestamp > oneMinuteAgo);

    return {
      total: errorList.length,
      errors: errorList.filter(e => e.severity === 'error').length,
      warnings: errorList.filter(e => e.severity === 'warning').length,
      lastError: errorList[0],
      errorRate: recentErrors.length,
      supabaseErrors: errorList.filter(e => e.type === 'supabase').length,
      networkErrors: errorList.filter(e => e.type === 'network').length,
      runtimeErrors: errorList.filter(e => e.type === 'runtime').length
    };
  }, []);

  // Subscribe to global error store
  useEffect(() => {
    const listener = (newErrors: ErrorLog[]) => {
      setErrors(newErrors);
      setStats(calculateStats(newErrors));
    };

    globalListeners.add(listener);
    setStats(calculateStats(globalErrorStore));

    return () => {
      globalListeners.delete(listener);
    };
  }, [calculateStats]);

  // Monitor console errors
  useEffect(() => {
    if (!enabled || initialized.current) return;
    initialized.current = true;

    // Store original functions
    originalConsoleError.current = console.error;
    originalConsoleWarn.current = console.warn;

    // Override console.error
    console.error = (...args: any[]) => {
      originalConsoleError.current?.apply(console, args);

      // Skip React internal errors and our own logs
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      // Filter out noise
      if (message.includes('Warning:') || 
          message.includes('🔴 Error Details') ||
          message.includes('[vite]') ||
          message.includes('HMR')) {
        return;
      }

      logError({
        type: 'console',
        severity: 'error',
        message: message.slice(0, 500),
        stack: new Error().stack,
        source: 'console.error'
      });
    };

    // Override console.warn (only for important warnings)
    console.warn = (...args: any[]) => {
      originalConsoleWarn.current?.apply(console, args);

      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      // Only log significant warnings
      if (message.includes('deprecated') || 
          message.includes('Error') ||
          message.includes('fail') ||
          message.includes('Supabase')) {
        logError({
          type: 'console',
          severity: 'warning',
          message: message.slice(0, 500),
          source: 'console.warn'
        });
      }
    };

    // Cleanup
    return () => {
      if (originalConsoleError.current) {
        console.error = originalConsoleError.current;
      }
      if (originalConsoleWarn.current) {
        console.warn = originalConsoleWarn.current;
      }
      initialized.current = false;
    };
  }, [enabled, logError]);

  // Monitor unhandled errors
  useEffect(() => {
    if (!enabled) return;

    const handleError = (event: ErrorEvent) => {
      logError({
        type: 'runtime',
        severity: 'error',
        message: event.message || 'Unknown error',
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
      const message = event.reason?.message || String(event.reason);
      
      // Filter out specific errors
      if (message.includes('ResizeObserver') || 
          message.includes('Script error')) {
        return;
      }

      logError({
        type: 'runtime',
        severity: 'error',
        message: message.slice(0, 500),
        stack: event.reason?.stack,
        context: {
          reason: String(event.reason)
        },
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

  // Monitor fetch/network errors
  useEffect(() => {
    if (!enabled) return;

    originalFetch.current = globalThis.fetch;

    globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
      
      try {
        const response = await originalFetch.current!(...args);

        // Log failed HTTP requests (4xx, 5xx)
        if (!response.ok && response.status >= 400) {
          const isSupabase = url.includes('supabase');
          
          logError({
            type: isSupabase ? 'supabase' : 'network',
            severity: response.status >= 500 ? 'error' : 'warning',
            message: `HTTP ${response.status}: ${response.statusText} - ${url.slice(0, 100)}`,
            context: {
              url: url.slice(0, 200),
              status: response.status,
              statusText: response.statusText,
              method: (args[1] as RequestInit)?.method || 'GET'
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
            url: url.slice(0, 200),
            error: error.name
          },
          source: 'fetch'
        });
        throw error;
      }
    };

    return () => {
      if (originalFetch.current) {
        globalThis.fetch = originalFetch.current;
      }
    };
  }, [enabled, logError]);

  // Monitor Supabase auth state changes for errors
  useEffect(() => {
    if (!enabled) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        // Only log if unexpected
        const lastError = errors[0];
        if (lastError?.type === 'supabase' && 
            Date.now() - lastError.timestamp.getTime() < 5000) {
          // Auth issue detected after Supabase error
          logError({
            type: 'auth',
            severity: 'warning',
            message: 'Session ended - possible authentication issue',
            context: { event },
            source: 'supabase.auth'
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, errors, logError]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    globalErrorStore.length = 0;
    notifyListeners();
    toast.success('לוג השגיאות נוקה');
  }, []);

  // Clear old errors (older than 5 minutes)
  const clearOldErrors = useCallback(() => {
    const fiveMinutesAgo = new Date(Date.now() - 300000);
    const recentErrors = globalErrorStore.filter(e => e.timestamp > fiveMinutesAgo);
    globalErrorStore.length = 0;
    globalErrorStore.push(...recentErrors);
    notifyListeners();
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

  // Test error logging
  const testErrorLogging = useCallback(() => {
    logError({
      type: 'console',
      severity: 'info',
      message: '🧪 בדיקת מערכת - זו שגיאה לדוגמה',
      context: { test: true, timestamp: new Date().toISOString() },
      source: 'test'
    });

    // Test Supabase connection
    supabase.from('profiles').select('count', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) {
          logError({
            type: 'supabase',
            severity: 'error',
            message: `Supabase test failed: ${error.message}`,
            context: { code: error.code, details: error.details },
            source: 'supabase.test'
          });
        } else {
          toast.success('✅ Supabase מחובר ועובד');
        }
      });
  }, [logError]);

  return {
    errors,
    stats,
    logError,
    clearErrors,
    clearOldErrors,
    getErrorsByType,
    getErrorsBySeverity,
    testErrorLogging
  };
}
