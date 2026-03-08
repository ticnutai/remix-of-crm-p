// Pull to Refresh Component for Mobile
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0) {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop === 0) {
        e.preventDefault();
        const adjustedDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(adjustedDistance);
        setCanRefresh(adjustedDistance >= threshold);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    if (canRefresh && pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setCanRefresh(false);
      }
    }
    
    setPullDistance(0);
    setCanRefresh(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, canRefresh, pullDistance]);

  const refreshProgress = Math.min((pullDistance / threshold) * 100, 100);
  const iconRotation = isRefreshing ? 'animate-spin' : `rotate-[${refreshProgress * 3.6}deg]`;

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Pull Indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300 z-50',
          pullDistance > 0 ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${pullDistance}px`,
          transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`,
        }}
      >
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-4 rounded-full transition-all',
            canRefresh ? 'bg-primary/20' : 'bg-muted/50',
            isRefreshing && 'bg-success/20'
          )}
        >
          <RefreshCw
            className={cn(
              'h-6 w-6 transition-all',
              canRefresh ? 'text-primary' : 'text-muted-foreground',
              isRefreshing ? 'text-success animate-spin' : iconRotation
            )}
          />
          <span className="text-xs font-medium">
            {isRefreshing ? 'מרענן...' : canRefresh ? 'שחרר לרענון' : 'משוך לרענון'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance > 0 && !isRefreshing ? pullDistance : 0}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Simple refresh button for desktop/fallback
export function RefreshButton({ 
  onRefresh, 
  className 
}: { 
  onRefresh: () => Promise<void>; 
  className?: string;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-muted hover:bg-muted/80 active:scale-95',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <RefreshCw
        className={cn(
          'h-4 w-4',
          isRefreshing && 'animate-spin'
        )}
      />
      <span className="text-sm font-medium">
        {isRefreshing ? 'מרענן...' : 'רענן'}
      </span>
    </button>
  );
}
