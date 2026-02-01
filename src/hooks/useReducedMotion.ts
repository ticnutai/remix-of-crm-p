/**
 * useReducedMotion - Hook לזיהוי העדפת משתמש לאנימציות מופחתות
 * 
 * מאפשר:
 * 1. זיהוי אוטומטי של prefers-reduced-motion
 * 2. הגדרה ידנית לביטול אנימציות
 * 3. שיפור ביצועים משמעותי
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ncrm-reduced-motion';

export function useReducedMotion() {
  // בדיקה אם יש העדפת מערכת או הגדרה שמורה
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // בדיקת localStorage קודם
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    
    // בדיקת העדפת מערכת
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    return false;
  });

  // האזנה לשינויים בהעדפת המערכת
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // אם אין הגדרה ידנית, עדכן לפי המערכת
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setPrefersReducedMotion(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // פונקציה לשינוי ידני
  const setReducedMotion = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setPrefersReducedMotion(value);
    
    // עדכון CSS variable לביטול אנימציות גלובלי
    document.documentElement.style.setProperty(
      '--animation-duration',
      value ? '0.001ms' : ''
    );
    
    // הוספה/הסרה של class לביטול אנימציות
    if (value) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, []);

  // פונקציה לאיפוס להעדפת מערכת
  const resetToSystemPreference = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    
    const systemPrefers = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    setPrefersReducedMotion(systemPrefers);
    
    document.documentElement.style.removeProperty('--animation-duration');
    document.documentElement.classList.remove('reduce-motion');
  }, []);

  return {
    prefersReducedMotion,
    setReducedMotion,
    resetToSystemPreference,
  };
}

// Helper function לשימוש ב-components
export function getAnimationDelay(delay: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : delay;
}

// Helper function לקבלת className מותנה
export function getAnimationClass(className: string, reducedMotion: boolean): string {
  if (reducedMotion) {
    // החלפת אנימציות באפקט מיידי
    return className
      .replace(/animate-fade-in/g, 'opacity-100')
      .replace(/animate-slide-in-(left|right)/g, 'opacity-100')
      .replace(/animate-scale-in/g, 'opacity-100');
  }
  return className;
}
