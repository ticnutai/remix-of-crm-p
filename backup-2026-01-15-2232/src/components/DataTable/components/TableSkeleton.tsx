import React from 'react';
import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full animate-pulse">
      {/* Header skeleton */}
      {showHeader && (
        <div className="flex gap-4 p-4 bg-muted/50 border-b border-table-border">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-muted rounded skeleton-shimmer"
              style={{ width: `${Math.random() * 50 + 50}px` }}
            />
          ))}
        </div>
      )}

      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-table-border"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={cn(
                'h-4 bg-muted rounded skeleton-shimmer',
                colIndex === 0 && 'w-12',
                colIndex !== 0 && 'flex-1'
              )}
              style={{
                animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
