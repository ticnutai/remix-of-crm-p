// Floating, draggable, resizable panel with persisted position/size.
// - Drag from header
// - Resize from all 8 edges/corners
// - Minimize to header-only, Maximize to viewport, Restore
import { useCallback, useEffect, useRef, useState } from "react";
import { X, GripVertical, Minus, Maximize, Minimize } from "lucide-react";
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

type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const MIN_W = 220;
const MIN_H = 120;
const HEADER_H = 36;

export default function DraggablePanel({
  open,
  onClose,
  title,
  storageKey,
  defaultWidth = 320,
  defaultHeight = 380,
}: DraggablePanelProps & { children: React.ReactNode }) {
  const { state, update, loaded } = useDialogPersistence(storageKey);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const dragRef = useRef<
    | {
        mode: "move" | Edge;
        startX: number;
        startY: number;
        origX: number;
        origY: number;
        origW: number;
        origH: number;
      }
    | null
  >(null);

  useEffect(() => {
    if (!loaded || initialized || !open) return;
    const persisted = state as typeof state & { minimized?: boolean; maximized?: boolean };
    const w = persisted.width ?? defaultWidth;
    const h = persisted.height ?? defaultHeight;
    const x = persisted.x ?? Math.max(20, window.innerWidth - w - 40);
    const y = persisted.y ?? 90;
    setPos({ x, y });
    setSize({ w, h });
    setMinimized(!!persisted.minimized);
    setMaximized(!!persisted.maximized);
    setInitialized(true);
  }, [loaded, initialized, open, state, defaultWidth, defaultHeight]);

  const persist = useCallback(
    (patch: Record<string, unknown>) => update(patch as never),
    [update],
  );

  // Global pointer handlers for drag/resize
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (d.mode === "move") {
        const nx = Math.max(0, Math.min(window.innerWidth - 80, d.origX + dx));
        const ny = Math.max(0, Math.min(window.innerHeight - HEADER_H, d.origY + dy));
        setPos({ x: nx, y: ny });
        return;
      }
      let nx = d.origX;
      let ny = d.origY;
      let nw = d.origW;
      let nh = d.origH;
      if (d.mode.includes("e")) nw = Math.max(MIN_W, d.origW + dx);
      if (d.mode.includes("s")) nh = Math.max(MIN_H, d.origH + dy);
      if (d.mode.includes("w")) {
        const newW = Math.max(MIN_W, d.origW - dx);
        nx = d.origX + (d.origW - newW);
        nw = newW;
      }
      if (d.mode.includes("n")) {
        const newH = Math.max(MIN_H, d.origH - dy);
        ny = d.origY + (d.origH - newH);
        nh = newH;
      }
      setPos({ x: nx, y: ny });
      setSize({ w: nw, h: nh });
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      // Persist final state from current refs via state setters
      setPos((p) => {
        setSize((s) => {
          persist({ x: p.x, y: p.y, width: s.w, height: s.h });
          return s;
        });
        return p;
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [persist]);

  const startDrag = (mode: "move" | Edge) => (e: React.PointerEvent) => {
    if (maximized) return;
    e.preventDefault();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      origW: size.w,
      origH: size.h,
    };
  };

  const toggleMinimize = () => {
    setMinimized((m) => {
      const next = !m;
      persist({ minimized: next });
      if (next) setMaximized(false);
      return next;
    });
  };
  const toggleMaximize = () => {
    setMaximized((m) => {
      const next = !m;
      persist({ maximized: next });
      if (next) setMinimized(false);
      return next;
    });
  };

  if (!open || !initialized) return null;

  const style: React.CSSProperties = maximized
    ? { left: 8, top: 8, width: "calc(100vw - 16px)", height: "calc(100vh - 16px)" }
    : minimized
    ? { left: pos.x, top: pos.y, width: size.w, height: HEADER_H }
    : { left: pos.x, top: pos.y, width: size.w, height: size.h };

  const showResize = !minimized && !maximized;
  const edgeBase = "absolute z-10";

  return (
    <div
      dir="rtl"
      className="fixed z-50 rounded-md border bg-popover text-popover-foreground shadow-lg flex flex-col overflow-hidden"
      style={style}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 px-2 border-b bg-muted/60 cursor-move select-none shrink-0"
        style={{ height: HEADER_H }}
        onPointerDown={startDrag("move")}
        onDoubleClick={toggleMaximize}
      >
        <div className="flex items-center gap-1.5 text-sm font-semibold truncate">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={toggleMinimize}
            className="rounded p-1 hover:bg-accent text-muted-foreground"
            aria-label={minimized ? "הרחב" : "מזער"}
            title={minimized ? "הרחב" : "מזער"}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleMaximize}
            className="rounded p-1 hover:bg-accent text-muted-foreground"
            aria-label={maximized ? "שחזר" : "הגדל למסך מלא"}
            title={maximized ? "שחזר" : "הגדל למסך מלא"}
          >
            {maximized ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-accent text-muted-foreground"
            aria-label="סגור"
            title="סגור"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="flex-1 overflow-auto p-3 space-y-3">{(arguments as never)["0"].children}</div>
      )}

      {/* Resize handles */}
      {showResize && (
        <>
          <div className={`${edgeBase} top-0 left-2 right-2 h-1.5 cursor-n-resize`} onPointerDown={startDrag("n")} />
          <div className={`${edgeBase} bottom-0 left-2 right-2 h-1.5 cursor-s-resize`} onPointerDown={startDrag("s")} />
          <div className={`${edgeBase} top-2 bottom-2 left-0 w-1.5 cursor-w-resize`} onPointerDown={startDrag("w")} />
          <div className={`${edgeBase} top-2 bottom-2 right-0 w-1.5 cursor-e-resize`} onPointerDown={startDrag("e")} />
          <div className={`${edgeBase} top-0 left-0 w-2.5 h-2.5 cursor-nw-resize`} onPointerDown={startDrag("nw")} />
          <div className={`${edgeBase} top-0 right-0 w-2.5 h-2.5 cursor-ne-resize`} onPointerDown={startDrag("ne")} />
          <div className={`${edgeBase} bottom-0 left-0 w-2.5 h-2.5 cursor-sw-resize`} onPointerDown={startDrag("sw")} />
          <div className={`${edgeBase} bottom-0 right-0 w-3 h-3 cursor-se-resize`} onPointerDown={startDrag("se")} />
        </>
      )}
    </div>
  );
}
