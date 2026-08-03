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
  /** Disable dragging for this dialog (dragging is enabled by default). */
  disableDrag?: boolean;
  /** Legacy prop kept for compatibility; resize is disabled globally. */
  disableResize?: boolean;
  /** Legacy key prop kept for compatibility with existing call sites. */
  dialogKey?: string;
  /** Optional classes for the internal scroll container. */
  contentClassName?: string;
}

/**
 * Smooth pointer-based dragging for a centered dialog.
 * The element keeps its CSS centering; we only add a pixel offset on top of it
 * and mutate the transform directly (no re-render per frame).
 */
function useDialogDrag(enabled: boolean) {
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const offsetRef = React.useRef({ x: 0, y: 0 });
  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const frameRef = React.useRef<number | null>(null);

  const applyTransform = React.useCallback(() => {
    frameRef.current = null;
    const node = nodeRef.current;
    if (!node) return;
    const { x, y } = offsetRef.current;
    node.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0)`;
  }, []);

  const schedule = React.useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(applyTransform);
  }, [applyTransform]);

  const clamp = React.useCallback((x: number, y: number) => {
    const node = nodeRef.current;
    if (!node) return { x, y };
    const rect = node.getBoundingClientRect();
    // Keep at least a small part of the dialog reachable on screen.
    const margin = 40;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const minX = -centerX + margin - rect.width / 2 + rect.width * 0.25;
    const maxX = centerX - margin + rect.width / 2 - rect.width * 0.25;
    const minY = -centerY + margin;
    const maxY = centerY - margin;
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }, []);

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || event.button !== 0) return;
      const node = nodeRef.current;
      if (!node) return;

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: offsetRef.current.x,
        originY: offsetRef.current.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      node.style.transition = "none";
      node.style.willChange = "transform";
      document.body.style.userSelect = "none";
      event.preventDefault();
    },
    [enabled],
  );

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      offsetRef.current = clamp(
        drag.originX + (event.clientX - drag.startX),
        drag.originY + (event.clientY - drag.startY),
      );
      schedule();
    },
    [clamp, schedule],
  );

  const endDrag = React.useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    const node = nodeRef.current;
    if (node) {
      node.style.willChange = "";
    }
    document.body.style.userSelect = "";
  }, []);

  const resetPosition = React.useCallback(() => {
    offsetRef.current = { x: 0, y: 0 };
    const node = nodeRef.current;
    if (node) {
      node.style.transition = "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)";
    }
    applyTransform();
  }, [applyTransform]);

  React.useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      document.body.style.userSelect = "";
    },
    [],
  );

  return {
    nodeRef,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onDoubleClick: resetPosition,
    },
  };
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, disableDrag, disableResize, dialogKey, contentClassName, ...props }, ref) => {
  void disableResize;
  void dialogKey;

  const draggable = !disableDrag;
  const { nodeRef, handleProps } = useDialogDrag(draggable);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [nodeRef, ref],
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        dir="rtl"
        data-dialog-content="true"
        aria-describedby={undefined}
        className={cn(
          "fixed left-1/2 top-1/2 z-[10050] flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-0 border-2 border-primary/40 bg-background text-right shadow-2xl shadow-primary/20 sm:rounded-lg",
          className,
        )}
        {...props}
      >
        {draggable && (
          <div
            {...handleProps}
            data-dialog-drag-handle="true"
            role="presentation"
            title="גרור להזזת החלון (לחיצה כפולה - מרכוז)"
            className="group absolute inset-x-10 top-0 z-20 flex h-7 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          >
            <div className="h-1 w-12 rounded-full bg-border transition-colors group-hover:bg-primary/50" />
          </div>
        )}

        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden p-6 grid gap-4",
            draggable && "pt-7",
            contentClassName,
          )}
        >
          {children}
        </div>

        <DialogPrimitive.Close
          className="absolute left-3 top-3 z-30 rounded-sm bg-background/80 p-1 opacity-80 ring-offset-background transition-opacity hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
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
