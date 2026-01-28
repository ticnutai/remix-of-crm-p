// Floating Action Button - Mobile Quick Actions
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FABAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export function FloatingActionButton({
  actions,
  position = 'bottom-left',
  className,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-4 sm:bottom-6 right-4 sm:right-6',
    'bottom-left': 'bottom-4 sm:bottom-6 left-4 sm:left-6',
    'top-right': 'top-20 sm:top-24 right-4 sm:right-6',
    'top-left': 'top-20 sm:top-24 left-4 sm:left-6',
  }[position];

  const getVariantColors = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
      case 'success':
        return 'bg-success text-success-foreground hover:bg-success/90';
      case 'warning':
        return 'bg-warning text-warning-foreground hover:bg-warning/90';
      case 'destructive':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
      default:
        return 'bg-accent text-accent-foreground hover:bg-accent/90';
    }
  };

  return (
    <div className={cn('fixed z-40', positionClasses, className)}>
      {/* Action Buttons */}
      <div
        className={cn(
          'flex flex-col-reverse gap-2 sm:gap-3 mb-2 sm:mb-3 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {actions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg active:scale-95 transition-all',
                  getVariantColors(action.variant)
                )}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{action.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-lg active:scale-95 transition-all',
          isOpen
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 rotate-45'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 sm:h-7 sm:w-7" />
        ) : (
          <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
        )}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Mini FAB - Smaller version
interface MiniFABProps {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function MiniFAB({
  icon: Icon,
  label,
  onClick,
  position = 'bottom-right',
  variant = 'primary',
  className,
}: MiniFABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-4 sm:bottom-6 right-4 sm:right-6',
    'bottom-left': 'bottom-4 sm:bottom-6 left-4 sm:left-6',
    'top-right': 'top-20 sm:top-24 right-4 sm:right-6',
    'top-left': 'top-20 sm:top-24 left-4 sm:left-6',
  }[position];

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
      case 'success':
        return 'bg-success text-success-foreground hover:bg-success/90';
      case 'warning':
        return 'bg-warning text-warning-foreground hover:bg-warning/90';
      case 'destructive':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
      default:
        return 'bg-accent text-accent-foreground hover:bg-accent/90';
    }
  };

  const button = (
    <Button
      size="icon"
      onClick={onClick}
      className={cn(
        'fixed z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg active:scale-95 transition-all',
        positionClasses,
        getVariantColors(),
        className
      )}
      aria-label={label}
    >
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    </Button>
  );

  if (label) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
