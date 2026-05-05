import React, { useState, useEffect, ReactNode } from 'react';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSyncedSetting } from '@/hooks/useSyncedSetting';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
}

export function CollapsibleSection({ 
  id, 
  children, 
  className,
  defaultCollapsed = false 
}: CollapsibleSectionProps) {
  const [collapsedList, setCollapsedList] = useSyncedSetting<string[]>({
    key: 'finance-collapsed-sections',
    defaultValue: [],
  });
  const isCollapsed = collapsedList.includes(id);
  const setIsCollapsed = (next: boolean) => {
    setCollapsedList((prev) => {
      const has = prev.includes(id);
      if (next && !has) return [...prev, id];
      if (!next && has) return prev.filter((s) => s !== id);
      return prev;
    });
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-2 left-2 z-10 h-6 w-6",
          "opacity-60 hover:opacity-100 transition-opacity",
          "bg-background/80 backdrop-blur-sm border shadow-sm"
        )}
        onClick={toggleCollapse}
        title={isCollapsed ? "הרחב סקציה" : "מזער סקציה"}
      >
        {isCollapsed ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <Minus className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "max-h-16 opacity-70" : "max-h-[5000px] opacity-100"
        )}
      >
        {children}
      </div>

      {/* Collapsed Indicator */}
      {isCollapsed && (
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 cursor-pointer flex items-end justify-center pb-2"
          onClick={toggleCollapse}
        >
          <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full border">
            לחץ להרחבה
          </span>
        </div>
      )}
    </div>
  );
}
