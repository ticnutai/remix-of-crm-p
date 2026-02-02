// Day Counter Cell Component - תא מונה ימים
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Timer, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  calculateDayCounter, 
  DayCounterResult,
  formatDayCounter 
} from '@/lib/workingDaysCalculator';

interface DayCounterConfig {
  targetDays: number;
  connectToTask?: boolean;
  connectToReminder?: boolean;
}

interface DayCounterCellProps {
  startDate: string | Date | null;
  config?: DayCounterConfig;
  showDetails?: boolean;
  className?: string;
}

export function DayCounterCell({ 
  startDate, 
  config = { targetDays: 35 },
  showDetails = false,
  className 
}: DayCounterCellProps) {
  const result = useMemo(() => {
    if (!startDate) return null;
    
    try {
      return calculateDayCounter(startDate, undefined, config.targetDays);
    } catch {
      return null;
    }
  }, [startDate, config.targetDays]);

  if (!result) {
    return <span className="text-muted-foreground">-</span>;
  }

  const percentage = (result.workingDays / config.targetDays) * 100;
  const isOverdue = result.workingDays > config.targetDays;
  const isWarning = percentage >= 80 && !isOverdue;
  const isNearEnd = percentage >= 60 && percentage < 80;

  // Determine color and status
  let colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-300';
  let Icon = CheckCircle;
  let statusText = 'בזמן';

  if (isOverdue) {
    colorClass = 'bg-red-100 text-red-700 border-red-300';
    Icon = AlertTriangle;
    statusText = 'חריגה!';
  } else if (isWarning) {
    colorClass = 'bg-amber-100 text-amber-700 border-amber-300';
    Icon = Clock;
    statusText = 'מתקרב';
  } else if (isNearEnd) {
    colorClass = 'bg-yellow-100 text-yellow-700 border-yellow-300';
    Icon = Timer;
    statusText = 'שימו לב';
  }

  const remainingDays = config.targetDays - result.workingDays;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <Badge 
              variant="outline" 
              className={cn(
                "font-semibold text-sm px-2 py-1 gap-1 cursor-help border",
                colorClass
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{result.workingDays}/{config.targetDays}</span>
            </Badge>
            
            {showDetails && (
              <span className="text-xs text-muted-foreground">
                ({result.totalDays} סה"כ)
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-white border shadow-lg p-3 max-w-[280px]"
        >
          <div className="space-y-2 text-sm" dir="rtl">
            <div className="flex items-center gap-2 font-semibold text-base border-b pb-2">
              <Timer className="h-4 w-4 text-primary" />
              מונה ימי עבודה
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-muted-foreground">תאריך התחלה:</span>
              <span className="font-medium">
                {format(result.fromDate, 'dd/MM/yyyy', { locale: he })}
              </span>
              
              <span className="text-muted-foreground">ימי עבודה:</span>
              <span className="font-medium">{result.workingDays} י"ע</span>
              
              <span className="text-muted-foreground">סה"כ ימים:</span>
              <span>{result.totalDays} ימים</span>
              
              <span className="text-muted-foreground">ימי סופ"ש:</span>
              <span>{result.weekendDays}</span>
              
              <span className="text-muted-foreground">ימי חג:</span>
              <span>{result.holidayDays}</span>
            </div>

            <div className={cn(
              "flex items-center gap-2 pt-2 border-t font-medium",
              isOverdue ? "text-red-600" : isWarning ? "text-amber-600" : "text-emerald-600"
            )}>
              <Icon className="h-4 w-4" />
              {isOverdue 
                ? `חריגה של ${Math.abs(remainingDays)} ימי עבודה!`
                : remainingDays === 0
                  ? 'היום האחרון!'
                  : `נותרו ${remainingDays} ימי עבודה`
              }
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  isOverdue ? "bg-red-500" : isWarning ? "bg-amber-500" : isNearEnd ? "bg-yellow-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for inline display
export function DayCounterBadge({ 
  startDate, 
  targetDays = 35 
}: { 
  startDate: string | Date | null; 
  targetDays?: number;
}) {
  const result = useMemo(() => {
    if (!startDate) return null;
    try {
      return calculateDayCounter(startDate, undefined, targetDays);
    } catch {
      return null;
    }
  }, [startDate, targetDays]);

  if (!result) return null;

  const percentage = (result.workingDays / targetDays) * 100;
  const isOverdue = result.workingDays > targetDays;
  const isWarning = percentage >= 80;

  return (
    <span className={cn(
      "text-xs font-medium px-1.5 py-0.5 rounded",
      isOverdue ? "bg-red-100 text-red-700" :
      isWarning ? "bg-amber-100 text-amber-700" :
      "bg-emerald-100 text-emerald-700"
    )}>
      {result.workingDays}/{targetDays} י"ע
    </span>
  );
}
