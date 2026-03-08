// Mobile Card Component - For displaying table rows as cards on mobile
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface MobileCardAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

export interface MobileCardField {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  fullWidth?: boolean;
}

export interface MobileCardProps {
  title: string;
  subtitle?: string;
  fields: MobileCardField[];
  actions?: MobileCardAction[];
  status?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  onClick?: () => void;
  className?: string;
}

export function MobileCard({
  title,
  subtitle,
  fields,
  actions,
  status,
  onClick,
  className,
}: MobileCardProps) {
  return (
    <Card
      className={cn(
        'w-full overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {status && (
              <Badge
                variant={status.variant || 'default'}
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
              >
                {status.label}
              </Badge>
            )}
            {actions && actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {actions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                      className={cn(
                        action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                      )}
                    >
                      {action.icon && <action.icon className="h-4 w-4 ml-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {fields.map((field, index) => (
            <div
              key={index}
              className={cn(
                'flex flex-col gap-0.5',
                field.fullWidth && 'col-span-2'
              )}
            >
              <div className="flex items-center gap-1">
                {field.icon && <field.icon className="h-3 w-3 text-muted-foreground" />}
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {field.label}
                </span>
              </div>
              <div
                className={cn(
                  'text-xs sm:text-sm',
                  field.highlight ? 'font-semibold text-primary' : 'text-foreground'
                )}
              >
                {field.value || '-'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Mobile Table Wrapper - switches between table and cards based on screen size
interface MobileResponsiveTableProps {
  children: React.ReactNode;
  mobileCards?: React.ReactNode;
  breakpoint?: 'sm' | 'md' | 'lg';
}

export function MobileResponsiveTable({
  children,
  mobileCards,
  breakpoint = 'md',
}: MobileResponsiveTableProps) {
  const breakpointClass = {
    sm: 'sm:block',
    md: 'md:block',
    lg: 'lg:block',
  }[breakpoint];

  return (
    <>
      {/* Mobile Cards View */}
      {mobileCards && (
        <div className={cn('block', breakpointClass, 'hidden')}>
          {mobileCards}
        </div>
      )}
      
      {/* Desktop Table View */}
      <div className={cn('hidden', breakpointClass)}>
        {children}
      </div>
    </>
  );
}
