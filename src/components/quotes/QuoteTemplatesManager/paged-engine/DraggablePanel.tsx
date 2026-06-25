// Floating, draggable, resizable panel with persisted position/size.
import { useCallback, useEffect, useRef, useState } from "react";
import { X, GripVertical } from "lucide-react";
import { useDialogPersistence } from "@/hooks/useDialogPersistence";

interface DraggablePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  storageKey: string;
  defaultWidth?: number;
  defaultHeight?: number;
  children: React.ReactNode;
}

export default function DraggablePanel({
  open,
  onClose,
  title,
  storageKey,
  defaultWidth = 320,
  defaultHeight,
  children,
}: DraggablePanelProps) {
  const { state, update, loaded } = useDialogPersistence(storageKey);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [size, setSize] = useState<{ w: number; h: number | undefined }>({
    w: defaultWidth,
    h: defaultHeight,
  });
  const [initialized, setInitialized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Initialize once persisted state is loaded.
  useEffect(() => {
    if (!loaded || initialized || !open) return;
    const w = state.width ?? defaultWidth;
    const h = state.height ?? defaultHeight;
    const x = state.x ?? Math.max(20, window.innerWidth - w - 40);
    const y = state.y ?? 90;
    setPos({ x, y });
    setSize({ w, h });
    setInitialized(true);
  }, [loaded, initialized, open, state, defaultWidth, defaultHeight]);

  const onPointerDownHeader = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
      };
    },
    [pos.x, pos.y],
  );

  const onPointerMoveHeader = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const nx = Math.max(0, Math.min(window.innerWidth - 80, dragRef.current.origX + dx));
    const ny = Math.max(0, Math.min(window.innerHeight - 40, dragRef.current.origY + dy));
    setPos({ x: nx, y: ny });
  }, []);

  const onPointerUpHeader = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      update({ x: pos.x, y: pos.y });
    },
    [pos.x, pos.y, update],
  );

  // Persist size after CSS resize.
  const panelElRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!panelElRef.current) return;
    const el = panelElRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        if (Math.abs(w - (size.w ?? 0)) > 2 || Math.abs(h - (size.h ?? 0)) > 2) {
          setSize({ w, h });
          update({ width: w, height: h });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  if (!open || !initialized) return null;

  return (
    <div
      ref={panelElRef}
      dir="rtl"
      className="fixed z-50 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        resize: "both",
        minWidth: 260,
        minHeight: 180,
      }}
    >
      <div
        className="flex items-center justify-between gap-2 px-2 py-1.5 border-b bg-muted/60 cursor-move select-none"
        onPointerDown={onPointerDownHeader}
        onPointerMove={onPointerMoveHeader}
        onPointerUp={onPointerUpHeader}
        onPointerCancel={onPointerUpHeader}
      >
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          {title}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 hover:bg-accent text-muted-foreground"
          aria-label="סגור"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">{children}</div>
    </div>
  );
}
