// Swipeable Card - For mobile interactions like delete/archive
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, Archive, Pencil, Check, X } from 'lucide-react';

interface SwipeAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color: 'success' | 'warning' | 'destructive' | 'primary';
  side: 'left' | 'right';
}

interface SwipeableCardProps {
  children: React.ReactNode;
  actions?: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right') => void;
  swipeThreshold?: number;
  disabled?: boolean;
  className?: string;
}

export function SwipeableCard({
  children,
  actions = [],
  onSwipe,
  swipeThreshold = 80,
  disabled = false,
  className,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipedAction, setSwipedAction] = useState<SwipeAction | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const leftActions = actions.filter(a => a.side === 'left');
  const rightActions = actions.filter(a => a.side === 'right');

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limit swipe distance
    const maxSwipe = 150;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setOffset(limitedDiff);

    // Check if threshold reached
    if (Math.abs(limitedDiff) >= swipeThreshold) {
      const direction = limitedDiff > 0 ? 'right' : 'left';
      const relevantActions = direction === 'right' ? leftActions : rightActions;
      if (relevantActions.length > 0) {
        setSwipedAction(relevantActions[0]);
      }
    } else {
      setSwipedAction(null);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    
    setIsDragging(false);

    if (swipedAction && Math.abs(offset) >= swipeThreshold) {
      // Execute action
      swipedAction.onClick();
      onSwipe?.(swipedAction.side === 'left' ? 'right' : 'left');
    }

    // Reset
    setOffset(0);
    setSwipedAction(null);
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'success':
        return 'bg-success text-success-foreground';
      case 'warning':
        return 'bg-warning text-warning-foreground';
      case 'destructive':
        return 'bg-destructive text-destructive-foreground';
      case 'primary':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left Actions Background */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-start">
          {leftActions.map((action, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-center h-full px-6 transition-all',
                getColorClass(action.color),
                offset > swipeThreshold && swipedAction === action && 'opacity-100',
                offset < swipeThreshold && 'opacity-60'
              )}
              style={{
                width: `${Math.max(0, offset)}px`,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium whitespace-nowrap">
                  {action.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Right Actions Background */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end">
          {rightActions.map((action, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-center h-full px-6 transition-all',
                getColorClass(action.color),
                offset < -swipeThreshold && swipedAction === action && 'opacity-100',
                offset > -swipeThreshold && 'opacity-60'
              )}
              style={{
                width: `${Math.max(0, -offset)}px`,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium whitespace-nowrap">
                  {action.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Card Content */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'relative bg-card transition-transform',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Preset Swipeable Cards
export function SwipeableDeleteCard({
  children,
  onDelete,
  onEdit,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const actions: SwipeAction[] = [
    {
      icon: Trash2,
      label: 'מחק',
      onClick: onDelete,
      color: 'destructive',
      side: 'right',
    },
  ];

  if (onEdit) {
    actions.push({
      icon: Edit,
      label: 'ערוך',
      onClick: onEdit,
      color: 'primary',
      side: 'left',
    });
  }

  return (
    <SwipeableCard
      actions={actions}
      disabled={disabled}
      className={className}
    >
      {children}
    </SwipeableCard>
  );
}

export function SwipeableActionCard({
  children,
  onConfirm,
  onReject,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onConfirm: () => void;
  onReject: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SwipeableCard
      actions={[
        {
          icon: Check,
          label: 'אישור',
          onClick: onConfirm,
          color: 'success',
          side: 'left',
        },
        {
          icon: X,
          label: 'דחייה',
          onClick: onReject,
          color: 'destructive',
          side: 'right',
        },
      ]}
      disabled={disabled}
      className={className}
    >
      {children}
    </SwipeableCard>
  );
}
