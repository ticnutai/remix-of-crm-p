// Empty State Component - e-control CRM Pro
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in",
      className
    )}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-secondary/10 rounded-full blur-xl animate-pulse" />
        <div className="relative p-4 rounded-full bg-muted">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick} className="btn-gold">
          {action.label}
        </Button>
      )}
    </div>
  );
}
