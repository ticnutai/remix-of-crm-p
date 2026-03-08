// Loading Spinner Component - tenarch CRM Pro
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-secondary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'טוען...' }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-muted animate-pulse" />
          <LoadingSpinner size="lg" className="absolute inset-0" />
        </div>
        <p className="text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn("space-y-3 p-4 rounded-lg border border-border bg-card", className)}>
      <div className="skeleton-shimmer h-4 w-3/4 rounded" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-3 rounded" style={{ width: `${65 + Math.random() * 35}%` }} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-table-header p-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-shimmer h-4 rounded flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-t border-border p-4">
          <div className="flex gap-4">
            {[1, 2, 3, 4].map(j => (
              <div 
                key={j} 
                className="skeleton-shimmer h-4 rounded flex-1" 
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
