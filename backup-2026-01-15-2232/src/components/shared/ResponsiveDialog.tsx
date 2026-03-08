// Mobile-optimized Dialog/Modal
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  maxWidth = 'md',
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  }[maxWidth];

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn('max-h-[90vh]', className)}>
          {(title || description) && (
            <DrawerHeader className="text-right">
              {title && <DrawerTitle className="text-lg sm:text-xl">{title}</DrawerTitle>}
              {description && (
                <DrawerDescription className="text-sm">{description}</DrawerDescription>
              )}
            </DrawerHeader>
          )}
          
          <div className="overflow-y-auto px-4 pb-4">
            {children}
          </div>

          {footer && (
            <DrawerFooter className="pt-2 border-t">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidthClass, className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}

        <div className="py-4">
          {children}
        </div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// Full Screen Mobile Dialog
interface MobileFullScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export function MobileFullScreenDialog({
  open,
  onOpenChange,
  title,
  children,
  headerActions,
  className,
}: MobileFullScreenDialogProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('max-w-3xl max-h-[90vh]', className)}>
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {headerActions && <div className="mt-2">{headerActions}</div>}
          </DialogHeader>
          <div className="overflow-y-auto py-4">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'fixed inset-0 h-full max-w-full rounded-none border-0 p-0',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          className
        )}
      >
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold truncate flex-1">{title}</h2>
            {headerActions}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-60px)] p-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Action Sheet - iOS style bottom sheet
interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  cancelLabel?: string;
}

export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
  cancelLabel = 'ביטול',
}: ActionSheetProps) {
  const isMobile = useIsMobile();

  const handleAction = (onClick: () => void) => {
    onClick();
    onOpenChange(false);
  };

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}
          <div className="space-y-2 py-4">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleAction(action.onClick)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    'hover:bg-accent active:scale-[0.98]',
                    action.variant === 'destructive'
                      ? 'text-destructive hover:bg-destructive/10'
                      : 'text-foreground'
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span className="font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full px-4 py-3 font-medium text-muted-foreground hover:bg-accent rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {(title || description) && (
          <div className="px-4 pt-4 pb-2 text-center border-b">
            {title && <h3 className="font-semibold text-base mb-1">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        
        <div className="p-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => handleAction(action.onClick)}
                className={cn(
                  'w-full flex items-center justify-center gap-3 px-4 py-4 rounded-lg transition-colors',
                  'active:scale-[0.98]',
                  action.variant === 'destructive'
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span className="font-medium text-base">{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-2 pt-0 border-t">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full px-4 py-4 font-semibold text-base hover:bg-accent rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
