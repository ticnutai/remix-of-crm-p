// Visual container that hosts the paged.js output and switches between
// the four view modes: single page, continuous scroll, two-page spread,
// and thumbnail grid.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export type PagedViewMode = "single" | "continuous" | "spread" | "grid";

interface ViewModeContainerProps {
  sourceRef: React.MutableRefObject<HTMLDivElement | null>;
  pageCount: number;
  rendering: boolean;
  mode: PagedViewMode;
  zoom: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  scrollRef?: React.MutableRefObject<HTMLDivElement | null>;
  /** Indices (0-based, relative to paged.js output) that should be hidden. */
  deletedPages?: number[];
  onDeletePage?: (idx: number) => void;
  /** Optional overlay heights (px) for visualising the strip zones. */
  stripTopPx?: number;
  stripBottomPx?: number;
  /** Repeating header/footer HTML rendered as an overlay on every page. */
  headerHtml?: string;
  footerHtml?: string;
}

// A4 at 96dpi for layout calculations (paged.js uses the same).
const A4_W = 794;
const A4_H = 1123;

export default function ViewModeContainer({
  sourceRef,
  pageCount,
  rendering,
  mode,
  zoom,
  currentPage,
  onPageChange,
  scrollRef,
  deletedPages = [],
  onDeletePage,
  stripTopPx = 0,
  stripBottomPx = 0,
}: ViewModeContainerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const internalScrollRef = useRef<HTMLDivElement | null>(null);
  const targetScrollRef = scrollRef ?? internalScrollRef;
  const [version, setVersion] = useState(0);

  useLayoutEffect(() => {
    setVersion((v) => v + 1);
  }, [pageCount, rendering]);

  const deletedSet = useMemo(() => new Set(deletedPages), [deletedPages]);

  const renderPages = useCallback(() => {
    if (!viewportRef.current || !sourceRef.current) return;
    const source = sourceRef.current;
    const viewport = viewportRef.current;
    viewport.innerHTML = "";

    const pages = Array.from(
      source.querySelectorAll<HTMLElement>(".pagedjs_page"),
    );
    if (pages.length === 0) return;

    const visiblePages = pages.filter((_, i) => !deletedSet.has(i));
    let visibleIdx = 0;

    pages.forEach((srcPage, idx) => {
      if (deletedSet.has(idx)) return;
      const wrap = document.createElement("div");
      wrap.className = "paged-page-wrap";
      wrap.dataset.pageIdx = String(idx);
      wrap.style.width = `${A4_W}px`;
      wrap.style.height = `${A4_H}px`;
      wrap.style.background = "#ffffff";
      wrap.style.boxShadow = "0 2px 14px rgba(0,0,0,0.12)";
      wrap.style.overflow = "hidden";
      wrap.style.flexShrink = "0";
      wrap.style.position = "relative";

      const clone = srcPage.cloneNode(true) as HTMLElement;
      clone.style.margin = "0";
      wrap.appendChild(clone);

      // Strip overlays (visual guides — paged.js already keeps content out
      // because they are @page margins; this is just a translucent indicator).
      if (stripTopPx > 0) {
        const top = document.createElement("div");
        top.style.cssText = `position:absolute;left:0;right:0;top:0;height:${stripTopPx}px;background:rgba(216,172,39,0.08);border-bottom:1px dashed rgba(216,172,39,0.5);pointer-events:none;`;
        wrap.appendChild(top);
      }
      if (stripBottomPx > 0) {
        const bot = document.createElement("div");
        bot.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:${stripBottomPx}px;background:rgba(216,172,39,0.08);border-top:1px dashed rgba(216,172,39,0.5);pointer-events:none;`;
        wrap.appendChild(bot);
      }

      const label = document.createElement("div");
      label.textContent = `${visibleIdx + 1} / ${visiblePages.length}`;
      label.style.cssText =
        "position:absolute;bottom:6px;left:8px;font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(0,0,0,0.55);color:#fff;pointer-events:none;font-family:sans-serif;z-index:10;";
      wrap.appendChild(label);

      if (onDeletePage) {
        const del = document.createElement("button");
        del.type = "button";
        del.textContent = "🗑";
        del.title = "מחק דף";
        del.style.cssText =
          "position:absolute;top:6px;right:6px;font-size:12px;padding:4px 8px;border-radius:6px;background:rgba(220,38,38,0.92);color:#fff;border:none;cursor:pointer;z-index:11;box-shadow:0 1px 4px rgba(0,0,0,0.3);";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          onDeletePage(idx);
        });
        wrap.appendChild(del);
      }

      if (mode === "grid" || mode === "continuous" || mode === "spread") {
        wrap.style.cursor = "pointer";
        wrap.addEventListener("click", () => onPageChange(visibleIdx));
      }

      viewport.appendChild(wrap);
      visibleIdx++;
    });
  }, [sourceRef, mode, onPageChange, deletedSet, onDeletePage, stripTopPx, stripBottomPx]);

  useLayoutEffect(() => {
    renderPages();
  }, [renderPages, version, mode]);

  useEffect(() => {
    if (mode !== "continuous" && mode !== "spread") return;
    const viewport = viewportRef.current;
    const scroller = targetScrollRef.current;
    if (!viewport || !scroller) return;
    const wraps = viewport.querySelectorAll<HTMLElement>(".paged-page-wrap");
    const target = wraps[currentPage];
    if (!target) return;
    const targetTop = target.offsetTop * zoom;
    scroller.scrollTo({ top: targetTop - 24, behavior: "smooth" });
  }, [currentPage, mode, zoom, targetScrollRef, version]);

  const viewportClass = useMemo(() => {
    switch (mode) {
      case "single":
        return "flex flex-col items-center justify-start gap-6";
      case "continuous":
        return "flex flex-col items-center gap-6";
      case "spread":
        return "grid grid-cols-2 gap-4 justify-items-center";
      case "grid":
        return "flex flex-wrap gap-4 justify-center";
    }
  }, [mode]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const wraps = viewport.querySelectorAll<HTMLElement>(".paged-page-wrap");
    wraps.forEach((w, i) => {
      if (mode === "single") {
        w.style.display = i === currentPage ? "block" : "none";
      } else {
        w.style.display = "block";
      }
    });
  }, [mode, currentPage, version, pageCount, deletedSet]);

  const effectiveZoom = mode === "grid" ? Math.min(0.35, zoom * 0.45) : zoom;

  return (
    <div
      ref={targetScrollRef}
      className="flex-1 overflow-auto bg-muted/30"
      dir="ltr"
      tabIndex={0}
    >
      <div className="p-6 min-h-full flex justify-center">
        <div
          ref={viewportRef}
          className={cn("paged-viewport", viewportClass)}
          style={{
            transform: `scale(${effectiveZoom})`,
            transformOrigin: "top center",
          }}
        />
      </div>

      {rendering && (
        <div className="fixed bottom-6 right-6 bg-card border border-border rounded-md px-3 py-2 shadow-lg text-xs flex items-center gap-2 z-50">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          מעמד את העמודים…
        </div>
      )}
    </div>
  );
}
