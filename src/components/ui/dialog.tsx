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
const VIEWPORT_MARGIN = 24;
const MIN_DIALOG_WIDTH = 320;
const MIN_DIALOG_HEIGHT = 240;

function clampNumber(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function useViewportSize() {
  const [size, setSize] = React.useState(() => ({
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    height: typeof window === 'undefined' ? 768 : window.innerHeight,
  }));

  React.useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

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
  /** Unique key to persist size + position per user (cloud + localStorage). */
  dialogKey?: string;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, disableDrag, disableResize, dialogKey, style, ...props }, ref) => {
  const stack = useStackOffset();
  const viewport = useViewportSize();
  const { state: persisted, update: updatePersisted } = useDialogPersistence(dialogKey);

  const [drag, setDrag] = React.useState({ x: 0, y: 0 });
  const dragStateRef = React.useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  // Apply persisted drag position once available
  React.useEffect(() => {
    if (persisted.x !== undefined && persisted.y !== undefined) {
      setDrag({ x: persisted.x, y: persisted.y });
    }
  }, [persisted.x, persisted.y]);

  // Observe resize and persist size
  React.useEffect(() => {
    if (!dialogKey || disableResize) return;
    const node = innerRef.current;
    if (!node) return;
    let raf: number | null = null;
    const ro = new ResizeObserver(entries => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        if (w > 0 && h > 0) {
          updatePersisted({ width: w, height: h });
        }
      });
    });
    ro.observe(node);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [dialogKey, disableResize, updatePersisted]);

  const onHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disableDrag) return;
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
    const wasDragging = dragStateRef.current !== null;
    dragStateRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (wasDragging && dialogKey) {
      updatePersisted({ x: drag.x, y: drag.y });
    }
  };

  // Use persisted offset (no stacking) when we have a saved position.
  const hasSavedPos = persisted.x !== undefined && persisted.y !== undefined;
  const totalX = (hasSavedPos ? 0 : stack.x) + drag.x;
  const totalY = (hasSavedPos ? 0 : stack.y) + drag.y;

  const maxDialogWidth = Math.max(MIN_DIALOG_WIDTH, viewport.width - VIEWPORT_MARGIN * 2);
  const maxDialogHeight = Math.max(MIN_DIALOG_HEIGHT, viewport.height - VIEWPORT_MARGIN * 2);
  const dialogWidth = !disableResize && persisted.width
    ? clampNumber(persisted.width, MIN_DIALOG_WIDTH, maxDialogWidth)
    : undefined;
  const dialogHeight = !disableResize && persisted.height
    ? clampNumber(persisted.height, MIN_DIALOG_HEIGHT, maxDialogHeight)
    : undefined;
  const effectiveWidth = dialogWidth ?? innerRef.current?.offsetWidth ?? 500;
  const effectiveHeight = dialogHeight ?? innerRef.current?.offsetHeight ?? 400;
  const clampedTotalX = clampNumber(
    totalX,
    -viewport.width / 2 + effectiveWidth / 2 + VIEWPORT_MARGIN,
    viewport.width / 2 - effectiveWidth / 2 - VIEWPORT_MARGIN,
  );
  const clampedTotalY = clampNumber(
    totalY,
    -viewport.height / 2 + effectiveHeight / 2 + VIEWPORT_MARGIN,
    viewport.height / 2 - effectiveHeight / 2 - VIEWPORT_MARGIN,
  );

  const sizeStyle: React.CSSProperties = {};
  if (!disableResize && dialogWidth) sizeStyle.width = dialogWidth;
  if (!disableResize && dialogHeight) sizeStyle.height = dialogHeight;

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        dir="rtl"
        data-dialog-content="true"
        aria-describedby={undefined}
        style={{
          ...style,
          ...sizeStyle,
          transform: `translate(calc(-50% + ${clampedTotalX}px), calc(-50% + ${clampedTotalY}px))`,
        }}
        className={cn(
          "fixed left-[50%] top-[50%] z-[401] flex flex-col w-full max-w-lg gap-0 border-2 border-primary/40 bg-background text-right shadow-2xl shadow-primary/20 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
          !disableResize && "resize overflow-hidden min-w-[320px] min-h-[240px] max-w-[calc(100vw-96px)] max-h-[calc(100vh-96px)]",
          disableResize && "max-h-[90vh] overflow-hidden",
          className,
        )}
        {...props}
      >
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
