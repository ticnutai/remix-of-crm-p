/**
 * React Performance Optimization Utility
 * מונע re-renders מיותרים ומשפר ביצועים
 */

import { useEffect, useRef, DependencyList } from 'react';

/**
 * Debounced useEffect - מריץ effect רק אחרי השהיה
 * שימושי לשמירת localStorage, API calls, וכו'
 */
export function useDebouncedEffect(
  effect: () => void | (() => void),
  deps: DependencyList,
  delay: number = 500
) {
  const cleanup = useRef<(() => void) | void>();

  useEffect(() => {
    const handler = setTimeout(() => {
      cleanup.current = effect();
    }, delay);

    return () => {
      clearTimeout(handler);
      if (cleanup.current) {
        cleanup.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

/**
 * Batched localStorage save - שומר מספר ערכים בבת אחת
 * במקום useEffect נפרד לכל ערך
 */
export function useBatchedLocalStorage(items: Record<string, any>, delay: number = 300) {
  useDebouncedEffect(() => {
    Object.entries(items).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    });
  }, [JSON.stringify(items)], delay);
}

/**
 * Deep comparison for useMemo/useCallback dependencies
 * שימושי כשצריך להשוות objects או arrays
 */
export function useDeepCompareMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<DependencyList>();
  const signalRef = useRef<number>(0);

  if (!ref.current || !deepEqual(deps, ref.current)) {
    ref.current = deps;
    signalRef.current += 1;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(factory, [signalRef.current]);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => deepEqual(a[key], b[key]));
}

/**
 * Optimized navigation - מבטל דיליי בניווט
 */
export function useOptimizedNavigation() {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return (callback: () => void) => {
    // Clear any pending navigation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Use requestAnimationFrame for immediate, smooth navigation
    requestAnimationFrame(() => {
      callback();
    });
  };
}

/**
 * Prevent multiple rapid clicks
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return ((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }) as T;
}

/**
 * Throttled callback - מגביל קצב הקריאות
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRan = useRef(Date.now());
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return ((...args) => {
    const now = Date.now();
    if (now - lastRan.current >= delay) {
      callbackRef.current(...args);
      lastRan.current = now;
    }
  }) as T;
}

import React from 'react';

export default {
  useDebouncedEffect,
  useBatchedLocalStorage,
  useDeepCompareMemo,
  useOptimizedNavigation,
  useDebounceCallback,
  useThrottleCallback,
};
