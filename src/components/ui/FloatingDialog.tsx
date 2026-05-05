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

  // Drag from header — uses Pointer Events + direct DOM mutation via rAF
  // to avoid re-rendering the (heavy) dialog body on every move.
  const onHeaderPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, input, textarea, select, [role='tab'], a, [data-no-drag]")) return;
      if (!pos) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.preventDefault();

      const panel = panelRef.current;
      if (!panel) return;

      const startPointerX = e.clientX;
      const startPointerY = e.clientY;
      const startX = pos.x;
      const startY = pos.y;
      const w = size.w ?? defaultWidth;

      let latestX = startX;
      let latestY = startY;
      let rafId: number | null = null;
      const apply = () => {
        rafId = null;
        panel.style.left = latestX + "px";
        panel.style.top = latestY + "px";
      };

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startPointerX;
        const dy = ev.clientY - startPointerY;
        latestX = Math.max(
          -(w - 80),
          Math.min(window.innerWidth - 80, startX + dx),
        );
        latestY = Math.max(
          0,
          Math.min(window.innerHeight - 40, startY + dy),
        );
        if (rafId == null) rafId = requestAnimationFrame(apply);
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("blur", onUp);
        if (rafId != null) cancelAnimationFrame(rafId);
        try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
      };

      const onUp = () => {
        cleanup();
        // Commit final position to React state (single re-render) + persist
        setPos({ x: latestX, y: latestY });
        persist({ x: latestX, y: latestY, w: size.w, h: size.h });
      };

      try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      window.addEventListener("blur", onUp);
    },
    [pos, size.w, size.h, defaultWidth, persist],
  );

  const startResize = useCallback(
    (corner: "se" | "sw" | "ne" | "nw") => (e: React.PointerEvent) => {
      if (!pos) return;
      e.preventDefault();
      e.stopPropagation();
      const panel = panelRef.current;
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      const startW = rect.width;
      const startH = rect.height;
      const startX = e.clientX;
      const startY = e.clientY;
      const startPosX = pos.x;
      const startPosY = pos.y;

      let latestW = startW, latestH = startH, latestX = startPosX, latestY = startPosY;
      let rafId: number | null = null;
      const apply = () => {
        rafId = null;
        panel.style.width = latestW + "px";
        panel.style.height = latestH + "px";
        panel.style.left = latestX + "px";
        panel.style.top = latestY + "px";
      };

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let newW = startW, newH = startH, newX = startPosX, newY = startPosY;
        if (corner === "se") {
          newW = Math.max(minWidth, startW + dx);
          newH = Math.max(minHeight, startH + dy);
        } else if (corner === "sw") {
          newW = Math.max(minWidth, startW - dx);
          newH = Math.max(minHeight, startH + dy);
          newX = startPosX + (startW - newW);
        } else if (corner === "ne") {
          newW = Math.max(minWidth, startW + dx);
          newH = Math.max(minHeight, startH - dy);
          newY = startPosY + (startH - newH);
        } else if (corner === "nw") {
          newW = Math.max(minWidth, startW - dx);
          newH = Math.max(minHeight, startH - dy);
          newX = startPosX + (startW - newW);
          newY = startPosY + (startH - newH);
        }
        latestW = newW; latestH = newH; latestX = newX; latestY = newY;
        if (rafId == null) rafId = requestAnimationFrame(apply);
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("blur", onUp);
        if (rafId != null) cancelAnimationFrame(rafId);
        try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
      };

      const onUp = () => {
        cleanup();
        setSize({ w: latestW, h: latestH });
        setPos({ x: latestX, y: latestY });
        persist({ x: latestX, y: latestY, w: latestW, h: latestH });
      };

      try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      window.addEventListener("blur", onUp);
    },
    [pos, minWidth, minHeight, persist],
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
        onPointerDown={onHeaderPointerDown}
        style={{ touchAction: "none" }}
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
        onPointerDown={startResize("se")}
        style={{ touchAction: "none" }}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
      />
      <span
        onPointerDown={startResize("sw")}
        style={{ touchAction: "none" }}
        className="absolute bottom-0 left-0 h-4 w-4 cursor-sw-resize"
      />
      <span
        onPointerDown={startResize("ne")}
        style={{ touchAction: "none" }}
        className="absolute top-0 right-0 h-4 w-4 cursor-ne-resize"
      />
      <span
        onPointerDown={startResize("nw")}
        style={{ touchAction: "none" }}
        className="absolute top-0 left-0 h-4 w-4 cursor-nw-resize"
      />
    </div>,
    document.body,
  );
}

export default FloatingDialog;
