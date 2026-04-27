import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDialogPersistence } from "@/hooks/useDialogPersistence";

const Dialog = DialogPrimitive.Root;

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
      "fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ---------- Stacking offset for multiple open dialogs ----------
let openDialogCount = 0;
const STACK_OFFSET = 56; // px shift per stacked dialog, keeps mandatory visual gap between dialogs

function useStackOffset() {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  React.useEffect(() => {
    const idx = openDialogCount;
    openDialogCount += 1;
    setOffset({ x: idx * STACK_OFFSET, y: idx * STACK_OFFSET });
    return () => {
      openDialogCount = Math.max(0, openDialogCount - 1);
    };
  }, []);
  return offset;
}

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Disable the drag/resize chrome (e.g. for confirm dialogs). */
  disableDrag?: boolean;
  disableResize?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, disableDrag, disableResize, style, ...props }, ref) => {
  const stack = useStackOffset();
  const [drag, setDrag] = React.useState({ x: 0, y: 0 });
  const dragStateRef = React.useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const onHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disableDrag) return;
    // Don't start drag from interactive elements
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-no-drag]")) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: drag.x,
      origY: drag.y,
    };
  };
  const onHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragStateRef.current;
    if (!s) return;
    setDrag({
      x: s.origX + (e.clientX - s.startX),
      y: s.origY + (e.clientY - s.startY),
    });
  };
  const onHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const totalX = stack.x + drag.x;
  const totalY = stack.y + drag.y;

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        dir="rtl"
        data-dialog-content="true"
        aria-describedby={undefined}
        style={{
          ...style,
          // Apply stacking + drag offset on top of the centering transform
          transform: `translate(calc(-50% + ${totalX}px), calc(-50% + ${totalY}px))`,
        }}
        className={cn(
          "fixed left-[50%] top-[50%] z-[401] flex flex-col w-full max-w-lg gap-0 border-2 border-primary/40 bg-background text-right shadow-2xl shadow-primary/20 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
          // Resize: user can grab corner to resize
          !disableResize && "resize overflow-hidden min-w-[320px] min-h-[240px] max-w-[calc(100vw-96px)] max-h-[calc(100vh-96px)]",
          disableResize && "max-h-[90vh] overflow-hidden",
          className,
        )}
        {...props}
      >
        {/* Drag handle bar */}
        {!disableDrag && (
          <div
            onPointerDown={onHeaderPointerDown}
            onPointerMove={onHeaderPointerMove}
            onPointerUp={onHeaderPointerUp}
            onPointerCancel={onHeaderPointerUp}
            className="flex items-center justify-center h-6 shrink-0 cursor-grab active:cursor-grabbing select-none border-b border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors rounded-t-md"
            title="גרור להזזת החלון"
            data-dialog-drag-handle
          >
            <div className="w-10 h-1 rounded-full bg-primary/40" />
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 grid gap-4">
          {children}
        </div>

        <DialogPrimitive.Close
          data-no-drag
          className="absolute left-3 top-7 z-10 rounded-sm bg-background/80 p-1 opacity-80 ring-offset-background transition-opacity hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
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
