// Page Transition Wrapper - e-control CRM Pro
// עם תמיכה ב-reduced motion לשיפור ביצועים
import React from 'react';
import { cn } from '@/lib/utils';

// בדיקה מיידית אם יש העדפה לביטול אנימציות
function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  // בדיקת הגדרה שמורה
  const saved = localStorage.getItem('ncrm-reduced-motion');
  if (saved === 'true') return true;
  
  // בדיקת העדפת מערכת
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reduceMotion = shouldReduceMotion();
  
  return (
    <div 
      className={cn(
        reduceMotion ? "opacity-100" : "animate-fade-in",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className, staggerDelay = 0.05 }: StaggeredListProps) {
  const reduceMotion = shouldReduceMotion();
  
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={reduceMotion ? "opacity-100" : "animate-fade-in"}
          style={reduceMotion ? undefined : { 
            animationDelay: `${index * staggerDelay}s`,
            animationFillMode: 'both'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const reduceMotion = shouldReduceMotion();
  
  return (
    <div
      className={cn(
        reduceMotion ? "opacity-100" : "animate-fade-in",
        "h-full", // Ensure height passes through
        className
      )}
      style={reduceMotion ? undefined : { 
        animationDelay: `${delay}s`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
}

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  delay?: number;
  className?: string;
}

export function SlideIn({ children, direction = 'right', delay = 0, className }: SlideInProps) {
  const reduceMotion = shouldReduceMotion();
  
  return (
    <div
      className={cn(
        reduceMotion 
          ? "opacity-100" 
          : direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left',
        className
      )}
      style={reduceMotion ? undefined : { 
        animationDelay: `${delay}s`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
}

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  const reduceMotion = shouldReduceMotion();
  
  return (
    <div
      className={cn(reduceMotion ? "opacity-100" : "animate-scale-in", className)}
      style={reduceMotion ? undefined : { 
        animationDelay: `${delay}s`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
}
