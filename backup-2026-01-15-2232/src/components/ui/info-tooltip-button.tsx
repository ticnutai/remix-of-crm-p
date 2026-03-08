// Info Tooltip Button - Shows info in popover on click
import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface InfoSection {
  title: string;
  icon?: React.ReactNode;
  items: string[];
  variant?: 'default' | 'destructive' | 'secondary' | 'muted';
}

interface InfoTooltipButtonProps {
  sections: InfoSection[];
  className?: string;
  buttonClassName?: string;
  contentClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

const variantStyles = {
  default: 'bg-primary/10 border-primary/20',
  destructive: 'bg-destructive/10 border-destructive/20',
  secondary: 'bg-secondary/10 border-secondary/20',
  muted: 'bg-muted border-border',
};

const variantTextStyles = {
  default: 'text-primary',
  destructive: 'text-destructive',
  secondary: 'text-secondary',
  muted: 'text-muted-foreground',
};

export function InfoTooltipButton({
  sections,
  className,
  buttonClassName,
  contentClassName,
  side = 'top',
  align = 'end',
}: InfoTooltipButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center",
            "bg-primary/10 hover:bg-primary/20 text-primary",
            "border border-primary/30 hover:border-primary/50",
            "transition-all duration-200 hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            buttonClassName
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className={cn(
          "w-auto max-w-[400px] p-4 bg-card border-border shadow-xl",
          contentClassName
        )}
      >
        <div className={cn("space-y-3", className)}>
          {sections.length === 1 ? (
            // Single section - no grid
            <div className={cn(
              "p-3 rounded-lg border",
              variantStyles[sections[0].variant || 'default']
            )}>
              <div className="flex items-center gap-2 mb-2">
                {sections[0].icon && (
                  <span className={variantTextStyles[sections[0].variant || 'default']}>
                    {sections[0].icon}
                  </span>
                )}
                <span className="font-medium text-sm">{sections[0].title}</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {sections[0].items.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : (
            // Multiple sections - grid layout
            <div className={cn(
              "grid gap-3",
              sections.length === 2 && "grid-cols-2",
              sections.length >= 3 && "grid-cols-3"
            )}>
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border",
                    variantStyles[section.variant || 'default']
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {section.icon && (
                      <span className={variantTextStyles[section.variant || 'default']}>
                        {section.icon}
                      </span>
                    )}
                    <span className="font-medium text-xs">{section.title}</span>
                  </div>
                  <ul className="text-[10px] text-muted-foreground space-y-0.5">
                    {section.items.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
