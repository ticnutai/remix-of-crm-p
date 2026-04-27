import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

type FloatingRect = Pick<DOMRect, "left" | "right" | "top" | "bottom" | "width" | "height">;
const DEFAULT_DIALOG_GAP = 32;
const VIEWPORT_MARGIN = 16;

function isOverlapping(a: FloatingRect, b: FloatingRect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function moveRect(rect: FloatingRect, x: number, y: number): FloatingRect {
  return {
    left: rect.left + x,
    right: rect.right + x,
    top: rect.top + y,
    bottom: rect.bottom + y,
    width: rect.width,
    height: rect.height,
  };
}

function useDialogSeparation(
  contentRef: React.RefObject<HTMLElement>,
  enabled: boolean,
  gap: number,
) {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const offsetRef = React.useRef(offset);

  React.useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  React.useLayoutEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const node = contentRef.current;
        if (!node) return;

        const rect = node.getBoundingClientRect();
        const current = offsetRef.current;
        const baseRect = moveRect(rect, -current.x, -current.y);
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let next = { x: 0, y: 0 };

        const dialogs = Array.from(window.document.querySelectorAll<HTMLElement>("[data-dialog-content='true']"));

        for (const dialog of dialogs) {
          const dialogRect = dialog.getBoundingClientRect();
          const blocker: FloatingRect = {
            left: dialogRect.left - gap,
            right: dialogRect.right + gap,
            top: dialogRect.top - gap,
            bottom: dialogRect.bottom + gap,
            width: dialogRect.width + gap * 2,
            height: dialogRect.height + gap * 2,
          };
          const shifted = moveRect(baseRect, next.x, next.y);
          if (!isOverlapping(shifted, blocker)) continue;

          const horizontalCandidates = [
            { x: blocker.left - shifted.right, y: 0 },
            { x: blocker.right - shifted.left, y: 0 },
          ];
          const verticalCandidates = [
            { x: 0, y: blocker.top - shifted.bottom },
            { x: 0, y: blocker.bottom - shifted.top },
          ];
          const candidates = [...horizontalCandidates, ...verticalCandidates];
          const valid = candidates.filter((candidate) => {
            const candidateRect = moveRect(shifted, candidate.x, candidate.y);
            return (
              candidateRect.left >= VIEWPORT_MARGIN &&
              candidateRect.right <= viewportWidth - VIEWPORT_MARGIN &&
              candidateRect.top >= VIEWPORT_MARGIN &&
              candidateRect.bottom <= viewportHeight - VIEWPORT_MARGIN
            );
          });
          const pool = valid.length > 0 ? valid : candidates;
          const best = pool.sort((a, b) => Math.abs(a.x) + Math.abs(a.y) - (Math.abs(b.x) + Math.abs(b.y)))[0];
          next = { x: next.x + best.x, y: next.y + best.y };
        }

        const clamped = moveRect(baseRect, next.x, next.y);
        if (clamped.left < VIEWPORT_MARGIN) next.x += VIEWPORT_MARGIN - clamped.left;
        if (clamped.right > viewportWidth - VIEWPORT_MARGIN) next.x -= clamped.right - (viewportWidth - VIEWPORT_MARGIN);
        if (clamped.top < VIEWPORT_MARGIN) next.y += VIEWPORT_MARGIN - clamped.top;
        if (clamped.bottom > viewportHeight - VIEWPORT_MARGIN) next.y -= clamped.bottom - (viewportHeight - VIEWPORT_MARGIN);

        if (Math.abs(next.x - current.x) > 1 || Math.abs(next.y - current.y) > 1) {
          setOffset(next);
        }
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [contentRef, enabled, gap]);

  return offset;
}

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  avoidDialogOverlap?: boolean;
  separationGap?: number;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = "end", sideOffset = 24, collisionPadding = 32, avoidDialogOverlap = false, separationGap = DEFAULT_DIALOG_GAP, style, ...props }, ref) => {
  const localRef = React.useRef<React.ElementRef<typeof PopoverPrimitive.Content>>(null);
  const separationOffset = useDialogSeparation(localRef, avoidDialogOverlap, separationGap);
  const composedRef = React.useCallback(
    (node: React.ElementRef<typeof PopoverPrimitive.Content> | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={composedRef}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        dir="rtl"
        style={{
          ...style,
          ...(avoidDialogOverlap ? { translate: `${separationOffset.x}px ${separationOffset.y}px` } : {}),
        }}
        className={cn(
          // Base look
          "w-72 rounded-md border-2 border-primary/40 bg-popover p-4 text-popover-foreground text-right shadow-2xl shadow-primary/20 outline-none",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          // Resize from any corner + size constraints
          "resize overflow-auto min-w-[260px] min-h-[180px] max-w-[95vw] max-h-[85vh]",
          className,
          "z-[700]",
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
