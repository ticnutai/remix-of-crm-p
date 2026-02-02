// StageTimerDisplay - Styled timer display that cycles through styles on click
import React from 'react';
import { cn } from '@/lib/utils';
import { calculateDayCounter, DayCounterResult } from '@/lib/workingDaysCalculator';
import { Timer, Clock, Calendar, Zap, Target } from 'lucide-react';

interface StageTimerDisplayProps {
  startedAt?: string | null;
  targetDays?: number | null;
  displayStyle?: number;
  onStyleChange?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// 5 different visual styles for the timer
const TIMER_STYLES = [
  // Style 1: Navy Clean - Large text, no background, navy color (DEFAULT)
  {
    name: 'navy-clean',
    icon: Timer,
    getClasses: (result: DayCounterResult) => cn(
      "inline-flex items-center gap-2 transition-all cursor-pointer hover:opacity-80",
      result.isOverdue 
        ? "text-red-600"
        : "text-[#1e3a5f]" // Navy blue
    ),
    textClasses: (result: DayCounterResult, size: string) => cn(
      "font-bold tracking-tight",
      size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl',
      result.isOverdue ? "text-red-600" : "text-[#1e3a5f]"
    ),
  },
  // Style 2: Badge style - compact with icon
  {
    name: 'badge',
    icon: Timer,
    getClasses: (result: DayCounterResult) => cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer hover:scale-105",
      result.isOverdue 
        ? "bg-red-100 text-red-700 border border-red-300"
        : result.daysRemaining <= 5 
          ? "bg-amber-100 text-amber-700 border border-amber-300"
          : "bg-emerald-100 text-emerald-700 border border-emerald-300"
    ),
  },
  // Style 3: Pill style - elongated with gradient
  {
    name: 'pill',
    icon: Clock,
    getClasses: (result: DayCounterResult) => cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer hover:shadow-md",
      result.isOverdue 
        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200"
        : result.daysRemaining <= 5 
          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-200"
          : "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-emerald-200"
    ),
  },
  // Style 4: Card style - with border and shadow
  {
    name: 'card',
    icon: Calendar,
    getClasses: (result: DayCounterResult) => cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer hover:scale-[1.02] border-2",
      result.isOverdue 
        ? "bg-red-50 text-red-800 border-red-400 shadow-lg shadow-red-100"
        : result.daysRemaining <= 5 
          ? "bg-amber-50 text-amber-800 border-amber-400 shadow-lg shadow-amber-100"
          : "bg-emerald-50 text-emerald-800 border-emerald-400 shadow-lg shadow-emerald-100"
    ),
  },
  // Style 5: Minimal - clean and simple
  {
    name: 'minimal',
    icon: Target,
    getClasses: (result: DayCounterResult) => cn(
      "inline-flex items-center gap-1 text-xs font-medium transition-all cursor-pointer hover:underline underline-offset-2",
      result.isOverdue 
        ? "text-red-600"
        : result.daysRemaining <= 5 
          ? "text-amber-600"
          : "text-emerald-600"
    ),
  },
];

export function StageTimerDisplay({
  startedAt,
  targetDays,
  displayStyle = 1,
  onStyleChange,
  size = 'md',
  className,
}: StageTimerDisplayProps) {
  // Return null if required props are missing
  if (!startedAt || !targetDays) return null;

  // Calculate days
  const result = calculateDayCounter(startedAt, undefined, targetDays);
  
  // Get current style (1-indexed, so subtract 1)
  const styleIndex = Math.max(0, Math.min(4, (displayStyle || 1) - 1));
  const style = TIMER_STYLES[styleIndex];
  const Icon = style.icon;

  // Size adjustments for regular styles
  const sizeClasses = {
    sm: 'text-[10px]',
    md: '',
    lg: 'text-sm px-4 py-2',
  };

  // Format display text - show X/Y format (current day / target days)
  const displayText = result.isOverdue 
    ? `${result.currentWorkingDay}/${targetDays}`
    : `${result.currentWorkingDay}/${targetDays}`;

  // Additional info for tooltip
  const statusText = result.isOverdue 
    ? `איחור של ${Math.abs(result.daysRemaining)} ימי עבודה`
    : result.daysRemaining === 0 
      ? 'היום האחרון!' 
      : `נותרו ${result.daysRemaining} ימי עבודה`;

  // Navy Clean style (style 1) - special rendering
  if (style.name === 'navy-clean') {
    const textSizeClass = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-4xl' : 'text-xl';
    const iconSizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onStyleChange?.();
        }}
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer transition-all hover:opacity-70",
          size === 'lg' && "bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-xl shadow-lg border border-[#1e3a5f]/20",
          className
        )}
        title={`${statusText} | התחלה: ${new Date(startedAt).toLocaleDateString('he-IL')} | יעד: ${targetDays} ימי עבודה | לחץ לשינוי עיצוב`}
      >
        <Icon className={cn(
          iconSizeClass,
          "shrink-0",
          result.isOverdue ? "text-red-600" : "text-[#1e3a5f]"
        )} />
        <span className={cn(
          textSizeClass,
          "font-bold tracking-tight",
          result.isOverdue ? "text-red-600" : "text-[#1e3a5f]"
        )}>
          {displayText}
        </span>
        {result.isOverdue && <span className="text-red-500">⚠️</span>}
      </div>
    );
  }

  // Regular styles rendering
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onStyleChange?.();
      }}
      className={cn(style.getClasses(result), sizeClasses[size], className)}
      title={`${statusText} | התחלה: ${new Date(startedAt).toLocaleDateString('he-IL')} | יעד: ${targetDays} ימי עבודה | לחץ לשינוי עיצוב`}
    >
      <Icon className={cn(
        "shrink-0",
        size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
      )} />
      <span>{displayText}</span>
      {result.isOverdue && <span>⚠️</span>}
    </div>
  );
}

// Compact version for task items
export function TaskTimerBadge({
  startedAt,
  targetDays,
  displayStyle = 1,
  onStyleChange,
  className,
}: Omit<StageTimerDisplayProps, 'size'>) {
  return (
    <StageTimerDisplay
      startedAt={startedAt}
      targetDays={targetDays}
      displayStyle={displayStyle}
      onStyleChange={onStyleChange}
      size="sm"
      className={className}
    />
  );
}
