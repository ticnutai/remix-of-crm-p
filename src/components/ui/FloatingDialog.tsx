import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * FloatingDialog
 * - Non-modal: does NOT block the page (no backdrop overlay)
 * - Centered on first open
 * - Draggable from header; resizable via 4 corners
 * - ESC closes
 * - Position + size persisted to localStorage and (optionally) to user_settings (cloud)
 * - Renders nothing when !open (zero render cost)
 */

export interface FloatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stable id used to persist position+size. Required for persistence. */
  storageKey: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Default width in px (used on first open). */
  defaultWidth?: number;
  /** Default height in px. If omitted, content auto-size is used. */
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  contentClassName?: string;
  /** When true, sync position to Supabase user_settings. Default true. */
  cloudSync?: boolean;
  /** RTL direction. Default "rtl". */
  dir?: "rtl" | "ltr";
}

interface PersistedRect {
  x: number;
  y: number;
  w?: number;
  h?: number;
}

const PREFIX = "floating-dlg::";

function readLocal(key: string): PersistedRect | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v?.x === "number" && typeof v?.y === "number") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function writeLocal(key: string, rect: PersistedRect) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(rect));
  } catch {
    /* ignore */
  }
}

export function FloatingDialog({
  open,
  onOpenChange,
  storageKey,
  title,
  description,
  icon,
  children,
  footer,
  defaultWidth = 560,
  defaultHeight,
  minWidth = 360,
  minHeight = 240,
  className,
  contentClassName,
  cloudSync = true,
  dir = "rtl",
}: FloatingDialogProps) {
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number | undefined }>({
    w: defaultWidth,
    h: defaultHeight,
  });
  const draggingRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizingRef = useRef<{
    corner: "se" | "sw" | "ne" | "nw";
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const cloudSaveTimerRef = useRef<number | null>(null);

  // Initial load from localStorage + cloud (only when first opened)
  useEffect(() => {
    if (!open) return;
    const local = readLocal(storageKey);
    if (local) {
      setPos({ x: local.x, y: local.y });
      if (local.w || local.h) {
        setSize({ w: local.w ?? defaultWidth, h: local.h ?? defaultHeight });
      }
    }
    // Async cloud fetch (lower priority — fires-and-forgets)
    if (cloudSync && user?.id) {
      (async () => {
        try {
          const { data } = await supabase
            .from("user_settings")
            .select("setting_value")
            .eq("user_id", user.id)
            .eq("setting_key", PREFIX + storageKey)
            .maybeSingle();
          const v = (data as any)?.setting_value as PersistedRect | undefined;
          if (v && typeof v.x === "number" && typeof v.y === "number") {
            setPos({ x: v.x, y: v.y });
            if (v.w || v.h) {
              setSize({ w: v.w ?? defaultWidth, h: v.h ?? defaultHeight });
            }
            writeLocal(storageKey, v);
          }
        } catch {
          /* ignore cloud failures */
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storageKey]);

  // Center on first open if no persisted position
  useLayoutEffect(() => {
    if (!open) return;
    if (pos) return;
    const w = size.w ?? defaultWidth;
    const h = panelRef.current?.offsetHeight ?? size.h ?? 360;
    const x = Math.max(8, Math.round((window.innerWidth - w) / 2));
    const y = Math.max(8, Math.round((window.innerHeight - h) / 2));
    setPos({ x, y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pos]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onOpenChange]);

  const persist = useCallback(
    (next: PersistedRect) => {
      writeLocal(storageKey, next);
      if (!cloudSync || !user?.id) return;
      if (cloudSaveTimerRef.current) {
        window.clearTimeout(cloudSaveTimerRef.current);
      }
      cloudSaveTimerRef.current = window.setTimeout(async () => {
        try {
          await supabase.from("user_settings").upsert(
            {
              user_id: user.id,
              setting_key: PREFIX + storageKey,
              setting_value: next as any,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,setting_key" },
          );
        } catch {
          /* ignore */
        }
      }, 600);
    },
    [storageKey, cloudSync, user?.id],
  );

  // Drag from header
  const onHeaderMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, input, textarea, select, [role='tab'], a")) return;
      if (!pos) return;
      e.preventDefault();
      draggingRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
      const onMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        const nx = Math.max(
          -((size.w ?? defaultWidth) - 80),
          Math.min(window.innerWidth - 80, ev.clientX - draggingRef.current.dx),
        );
        const ny = Math.max(
          0,
          Math.min(window.innerHeight - 40, ev.clientY - draggingRef.current.dy),
        );
        setPos({ x: nx, y: ny });
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        draggingRef.current = null;
        setPos((p) => {
          if (p) persist({ x: p.x, y: p.y, w: size.w, h: size.h });
          return p;
        });
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [pos, size.w, size.h, defaultWidth, persist],
  );

  const startResize = useCallback(
    (corner: "se" | "sw" | "ne" | "nw") => (e: React.MouseEvent) => {
      if (!pos) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = panelRef.current?.getBoundingClientRect();
      const startW = rect?.width ?? size.w ?? defaultWidth;
      const startH = rect?.height ?? size.h ?? 360;
      resizingRef.current = {
        corner,
        startX: e.clientX,
        startY: e.clientY,
        startW,
        startH,
        startPosX: pos.x,
        startPosY: pos.y,
      };
      const onMove = (ev: MouseEvent) => {
        const r = resizingRef.current;
        if (!r) return;
        const dx = ev.clientX - r.startX;
        const dy = ev.clientY - r.startY;
        let newW = r.startW;
        let newH = r.startH;
        let newX = r.startPosX;
        let newY = r.startPosY;
        if (r.corner === "se") {
          newW = Math.max(minWidth, r.startW + dx);
          newH = Math.max(minHeight, r.startH + dy);
        } else if (r.corner === "sw") {
          newW = Math.max(minWidth, r.startW - dx);
          newH = Math.max(minHeight, r.startH + dy);
          newX = r.startPosX + (r.startW - newW);
        } else if (r.corner === "ne") {
          newW = Math.max(minWidth, r.startW + dx);
          newH = Math.max(minHeight, r.startH - dy);
          newY = r.startPosY + (r.startH - newH);
        } else if (r.corner === "nw") {
          newW = Math.max(minWidth, r.startW - dx);
          newH = Math.max(minHeight, r.startH - dy);
          newX = r.startPosX + (r.startW - newW);
          newY = r.startPosY + (r.startH - newH);
        }
        setSize({ w: newW, h: newH });
        setPos({ x: newX, y: newY });
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        resizingRef.current = null;
        setPos((p) =>
          p ? (persist({ x: p.x, y: p.y, w: size.w, h: size.h }), p) : p,
        );
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [pos, size.w, size.h, defaultWidth, minWidth, minHeight, persist],
  );

  const style = useMemo<React.CSSProperties>(() => {
    if (!pos) return { visibility: "hidden", position: "fixed", top: 0, left: 0 };
    return {
      position: "fixed",
      top: pos.y,
      left: pos.x,
      width: size.w,
      height: size.h,
      zIndex: 60,
    };
  }, [pos, size.w, size.h]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      dir={dir}
      style={style}
      className={cn(
        "rounded-xl border border-border/70 bg-background shadow-2xl",
        "flex flex-col overflow-hidden",
        className,
      )}
    >
      {/* Header (drag handle) */}
      <div
        onMouseDown={onHeaderMouseDown}
        className="flex items-start justify-between gap-2 px-3 py-2 border-b bg-muted/40 cursor-move select-none"
      >
        <div className="flex-1 min-w-0">
          {title && (
            <div className="flex items-center gap-2 text-sm font-semibold leading-tight">
              {icon}
              <span className="truncate">{title}</span>
            </div>
          )}
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {description}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          aria-label="סגור"
          title="סגור (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className={cn("flex-1 overflow-auto px-3 py-3", contentClassName)}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t bg-muted/20 px-3 py-2 flex items-center justify-end gap-2">
          {footer}
        </div>
      )}

      {/* Resize handles */}
      <span
        onMouseDown={startResize("se")}
        className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"
      />
      <span
        onMouseDown={startResize("sw")}
        className="absolute bottom-0 left-0 h-3 w-3 cursor-sw-resize"
      />
      <span
        onMouseDown={startResize("ne")}
        className="absolute top-0 right-0 h-3 w-3 cursor-ne-resize"
      />
      <span
        onMouseDown={startResize("nw")}
        className="absolute top-0 left-0 h-3 w-3 cursor-nw-resize"
      />
    </div>,
    document.body,
  );
}

export default FloatingDialog;
