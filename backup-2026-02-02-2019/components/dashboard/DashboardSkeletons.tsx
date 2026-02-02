/**
 * Skeleton Components - קומפוננטות טעינה לדשבורד
 * 
 * הצגת skeletons במקום spinners לחוויית משתמש טובה יותר
 * - הצגה מיידית של מבנה העמוד
 * - אנימציה עדינה של shimmer
 * - מותאם לכל גודל מסך
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Skeleton לכרטיס סטטיסטיקה בודד
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton ל-4 כרטיסי סטטיסטיקה
export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
}

// Skeleton לגרף
export function ChartSkeleton({ className, height = 300 }: { className?: string; height?: number }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <CardContent>
        <div style={{ height }} className="flex items-end justify-around gap-2 pt-4">
          {/* Bars Skeleton */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton 
                className="w-full" 
                style={{ height: `${30 + Math.random() * 70}%` }} 
              />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton ל-Pie Chart
export function PieChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-40" />
      </CardHeader>
      <CardContent className="flex items-center justify-center py-8">
        <div className="relative">
          <Skeleton className="h-48 w-48 rounded-full" />
          {/* Legend */}
          <div className="absolute -right-24 top-1/2 -translate-y-1/2 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton לטבלה
export function TableSkeleton({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex gap-4 border-b pb-2">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 py-2">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton לכרטיסי שעות עבודה
export function WorkHoursSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton מלא לדשבורד
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats Cards */}
      <DashboardStatsSkeleton />
      
      {/* Charts Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartSkeleton height={250} />
        <PieChartSkeleton />
      </div>
      
      {/* Work Hours Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <WorkHoursSkeleton />
        <WorkHoursSkeleton />
      </div>
    </div>
  );
}

// Skeleton לכרטיס עם כותרת בלבד (לגרפים שטוענים אחרי הסטטיסטיקות)
export function CardSkeleton({ title, className }: { title?: string; className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        {title ? (
          <div className="text-sm font-medium">{title}</div>
        ) : (
          <Skeleton className="h-5 w-32" />
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="animate-pulse">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="8" strokeWidth="2" stroke="currentColor" fill="none" opacity="0.3" />
            </svg>
          </div>
          <span className="text-xs">טוען נתונים...</span>
        </div>
      </CardContent>
    </Card>
  );
}
