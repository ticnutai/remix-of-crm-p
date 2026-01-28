// Email Date Navigator - Calendar picker and floating date indicator
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  ChevronUp, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { format, isToday, isYesterday, isSameDay, addMonths, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EmailDateNavigatorProps {
  onDateSelect: (date: Date) => void;
  onClearDateFilter: () => void;
  selectedDate: Date | null;
  isLoading?: boolean;
}

export const EmailDateNavigator = ({
  onDateSelect,
  onClearDateFilter,
  selectedDate,
  isLoading = false,
}: EmailDateNavigatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());

  const formatSelectedDate = (date: Date) => {
    if (isToday(date)) return 'היום';
    if (isYesterday(date)) return 'אתמול';
    return format(date, 'dd/MM/yyyy', { locale: he });
  };

  const handlePrevMonth = () => {
    setDisplayMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedDate ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            {selectedDate ? formatSelectedDate(selectedDate) : 'חיפוש לפי תאריך'}
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" dir="rtl">
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm">
              {format(displayMonth, 'MMMM yyyy', { locale: he })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Calendar with 2 months */}
          <div className="flex flex-col md:flex-row">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              onSelect={(date) => {
                if (date) {
                  onDateSelect(date);
                  setIsOpen(false);
                }
              }}
              disabled={(date) => date > new Date()}
              numberOfMonths={2}
              locale={he}
              className="p-2"
              classNames={{
                months: "flex flex-col md:flex-row gap-4",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
                caption_label: "hidden",
                nav: "hidden",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md transition-colors",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
              }}
            />
          </div>
          
          {/* Quick Select Buttons */}
          <div className="p-3 border-t space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDateSelect(new Date());
                  setIsOpen(false);
                }}
              >
                היום
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  onDateSelect(yesterday);
                  setIsOpen(false);
                }}
              >
                אתמול
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastWeek = new Date();
                  lastWeek.setDate(lastWeek.getDate() - 7);
                  onDateSelect(lastWeek);
                  setIsOpen(false);
                }}
              >
                לפני שבוע
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  onDateSelect(lastMonth);
                  setIsOpen(false);
                }}
              >
                לפני חודש
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {selectedDate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClearDateFilter}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// Floating date indicator that shows when scrolling
interface FloatingDateIndicatorProps {
  currentDate: string | null;
  isVisible: boolean;
}

export const FloatingDateIndicator = ({
  currentDate,
  isVisible,
}: FloatingDateIndicatorProps) => {
  if (!isVisible || !currentDate) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return 'היום';
      if (isYesterday(date)) return 'אתמול';
      return format(date, 'EEEE, dd בMMMM yyyy', { locale: he });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-2">
      <Badge
        variant="secondary"
        className="bg-background/95 backdrop-blur shadow-lg border px-4 py-2 text-sm font-medium"
      >
        <CalendarIcon className="h-4 w-4 ml-2" />
        {formatDate(currentDate)}
      </Badge>
    </div>
  );
};

// Hook to track visible date while scrolling
export const useScrollDateTracker = (
  containerRef: React.RefObject<HTMLElement>,
  messages: Array<{ id: string; date: string }>,
  enabled: boolean = true
) => {
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const handleScroll = useCallback(() => {
    if (!enabled || !containerRef.current) return;

    setIsScrolling(true);
    
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Hide indicator after scroll stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1500);

    // Find the first visible message
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Find message elements in the container
    const messageElements = container.querySelectorAll('[data-message-id]');
    
    for (const element of messageElements) {
      const rect = element.getBoundingClientRect();
      // Check if element is visible in the container
      if (rect.top >= containerRect.top && rect.top <= containerRect.top + 100) {
        const messageId = element.getAttribute('data-message-id');
        const message = messages.find(m => m.id === messageId);
        if (message) {
          setCurrentDate(message.date);
          break;
        }
      }
    }
  }, [enabled, messages, containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [containerRef, enabled, handleScroll]);

  return { currentDate, isScrolling };
};

// Load more trigger component
interface LoadMoreTriggerProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export const LoadMoreTrigger = ({
  onLoadMore,
  isLoading,
  hasMore,
}: LoadMoreTriggerProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore && !isLoading) return null;

  return (
    <div ref={triggerRef} className="py-4 text-center">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>טוען מיילים נוספים...</span>
        </div>
      ) : hasMore ? (
        <Button variant="ghost" onClick={onLoadMore} className="gap-2">
          <ChevronDown className="h-4 w-4" />
          טען עוד מיילים
        </Button>
      ) : null}
    </div>
  );
};

// Date separator component for email list
interface DateSeparatorProps {
  date: string;
}

export const DateSeparator = ({ date }: DateSeparatorProps) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isToday(d)) return 'היום';
      if (isYesterday(d)) return 'אתמול';
      return format(d, 'EEEE, dd בMMMM', { locale: he });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-4 sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">
        {formatDate(date)}
      </span>
    </div>
  );
};
