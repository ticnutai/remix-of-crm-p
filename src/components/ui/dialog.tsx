import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type DialogRootProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;

const Dialog = ({ modal = false, ...props }: DialogRootProps) => (
  <DialogPrimitive.Root modal={modal} {...props} />
);

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[10040] pointer-events-none bg-transparent",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Legacy prop kept for compatibility; drag chrome is disabled globally. */
  disableDrag?: boolean;
  /** Legacy prop kept for compatibility; resize is disabled globally. */
  disableResize?: boolean;
  /** Legacy key prop kept for compatibility with existing call sites. */
  dialogKey?: string;
  /** Optional classes for the internal scroll container. */
  contentClassName?: string;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, disableDrag, disableResize, dialogKey, contentClassName, ...props }, ref) => {
  void disableDrag;
  void disableResize;
  void dialogKey;

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        dir="rtl"
        data-dialog-content="true"
        aria-describedby={undefined}
        className={cn(
          "fixed left-1/2 top-1/2 z-[10050] flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-0 border-2 border-primary/40 bg-background text-right shadow-2xl shadow-primary/20 sm:rounded-lg",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden p-6 grid gap-4",
            contentClassName,
          )}
        >
          {children}
        </div>

        <DialogPrimitive.Close
          className="absolute left-3 top-3 z-10 rounded-sm bg-background/80 p-1 opacity-80 ring-offset-background transition-opacity hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="סגור (Esc)"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">סגור</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-right", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row-reverse sm:justify-start gap-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
