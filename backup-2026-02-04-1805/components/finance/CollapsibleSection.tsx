import React, { useState, useEffect, ReactNode } from 'react';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
}

const COLLAPSED_SECTIONS_KEY = 'finance-collapsed-sections';

export function CollapsibleSection({ 
  id, 
  children, 
  className,
  defaultCollapsed = false 
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
    if (saved) {
      try {
        const collapsedSections = JSON.parse(saved);
        return collapsedSections.includes(id);
      } catch {
        return defaultCollapsed;
      }
    }
    return defaultCollapsed;
  });

  useEffect(() => {
    // Save to localStorage when changed
    const saved = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
    let collapsedSections: string[] = [];
    if (saved) {
      try {
        collapsedSections = JSON.parse(saved);
      } catch {
        collapsedSections = [];
      }
    }

    if (isCollapsed && !collapsedSections.includes(id)) {
      collapsedSections.push(id);
    } else if (!isCollapsed && collapsedSections.includes(id)) {
      collapsedSections = collapsedSections.filter(s => s !== id);
    }

    localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(collapsedSections));
  }, [isCollapsed, id]);

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
