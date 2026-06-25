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
import companyHeaderImg from "@/assets/company-header.png";

// Inject (once) a stylesheet that forces strip contents to fit their overlay.
// Uses !important so the legacy template's inline `position:absolute`,
// fixed `height:171px`, etc. don't break the strip.
const STRIP_STYLE_ID = "lov-paged-strip-fit-styles";
const resolvedCompanyHeaderImg = import.meta.env.DEV
  ? "/src/assets/company-header.png"
  : companyHeaderImg;
function ensureStripStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STRIP_STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STRIP_STYLE_ID;
  s.textContent = `
    .paged-page-wrap .paged-strip-top,
    .paged-page-wrap .paged-strip-bottom {
      display: block !important;
      box-sizing: border-box !important;
    }
    .paged-page-wrap .paged-strip-top > *,
    .paged-page-wrap .paged-strip-bottom > *,
    .paged-page-wrap .paged-strip-top .header-strip,
    .paged-page-wrap .paged-strip-bottom .footer,
    .paged-page-wrap .paged-strip-bottom .footer-strip {
      display: block !important;
      position: static !important;
      inset: auto !important;
      top: auto !important; left: auto !important;
      right: auto !important; bottom: auto !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      transform: none !important;
    }
    .paged-page-wrap .paged-strip-top *,
    .paged-page-wrap .paged-strip-bottom * {
      box-sizing: border-box !important;
    }
    .paged-page-wrap .paged-strip-top [style*="position: fixed"],
    .paged-page-wrap .paged-strip-bottom [style*="position: fixed"],
    .paged-page-wrap .paged-strip-top [style*="position:fixed"],
    .paged-page-wrap .paged-strip-bottom [style*="position:fixed"] {
      position: absolute !important;
    }
    .paged-page-wrap .paged-strip-top img,
    .paged-page-wrap .paged-strip-bottom img,
    .paged-page-wrap .paged-strip-top svg,
    .paged-page-wrap .paged-strip-bottom svg,
    .paged-page-wrap .paged-strip-top canvas,
    .paged-page-wrap .paged-strip-bottom canvas {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      object-position: center !important;
    }
  `;
  document.head.appendChild(s);
}

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
  /** Extra clear space between body content and repeated strips. */
  stripGapPx?: number;
  /** Final visual side inset for body content. */
  sideInsetPx?: number;
  /** Repeating header/footer HTML rendered as an overlay on every page. */
  headerHtml?: string;
  footerHtml?: string;
  /** When true, draws visible bounding boxes for strips + safe area + content. */
  debug?: boolean;
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
  stripGapPx = 0,
  sideInsetPx = 0,
  headerHtml = "",
  footerHtml = "",
  debug = false,
}: ViewModeContainerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const internalScrollRef = useRef<HTMLDivElement | null>(null);
  const targetScrollRef = scrollRef ?? internalScrollRef;
  const [version, setVersion] = useState(0);

  useLayoutEffect(() => {
    ensureStripStyles();
  }, []);

  useLayoutEffect(() => {
    setVersion((v) => v + 1);
  }, [pageCount, rendering]);

  const deletedSet = useMemo(() => new Set(deletedPages), [deletedPages]);

  const renderPages = useCallback(() => {
    if (!viewportRef.current || !sourceRef.current) {
      console.log(`[ViewModeContainer] renderPages skipped — viewport=${!!viewportRef.current} source=${!!sourceRef.current}`);
      return;
    }
    const source = sourceRef.current;
    const viewport = viewportRef.current;
    viewport.innerHTML = "";

    const pages = Array.from(
      source.querySelectorAll<HTMLElement>(".pagedjs_page"),
    );
    console.log(`[ViewModeContainer] renderPages — pages=${pages.length} stripTopPx=${stripTopPx} stripBottomPx=${stripBottomPx} stripGapPx=${stripGapPx} sideInsetPx=${sideInsetPx} headerHtmlLen=${headerHtml.length} footerHtmlLen=${footerHtml.length}`);
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
      clone.style.position = "absolute";
      clone.style.inset = "0";
      clone.style.width = "100%";
      clone.style.height = "100%";
      clone.style.overflow = "hidden";

      // Defensive visual safe-area: paged.js already creates the main strip
      // and side margins. Keep an extra inner gap, and clamp side bleed, while
      // avoiding a double top/bottom offset that would hide the first page.
      const safeTop = Math.max(0, Math.round(stripTopPx + stripGapPx));
      const safeBottom = Math.max(0, Math.round(stripBottomPx + stripGapPx));
      const safeSide = Math.max(0, Math.round(sideInsetPx));
      const setImportant = (el: HTMLElement, prop: string, value: string) => {
        el.style.setProperty(prop, value, "important");
      };
      clone
        .querySelectorAll<HTMLElement>(
          ".pagedjs_sheet, .pagedjs_pagebox, .pagedjs_area, .pagedjs_page_content",
        )
        .forEach((el) => setImportant(el, "overflow", "hidden"));
      const area = clone.querySelector<HTMLElement>(".pagedjs_area");
      if (area) {
        setImportant(area, "position", "absolute");
        setImportant(area, "top", `${safeTop}px`);
        setImportant(area, "bottom", `${safeBottom}px`);
        setImportant(area, "left", `${safeSide}px`);
        setImportant(area, "right", `${safeSide}px`);
        setImportant(area, "width", "auto");
        setImportant(area, "height", "auto");
        setImportant(area, "box-sizing", "border-box");
      }
      const pageContent = clone.querySelector<HTMLElement>(".pagedjs_page_content");
      if (pageContent) {
        setImportant(pageContent, "max-width", "100%");
        setImportant(pageContent, "box-sizing", "border-box");
      }
      wrap.appendChild(clone);

      // Strip overlays — render the actual header/footer HTML so the logo
      // (and any other branding inside the strip) appears on every page.
      // The overlays sit on top of the @page margin zones; paged.js already
      // keeps body content out of those zones, so there is no coverage.
      const fitChild = (parent: HTMLElement) => {
        const child = parent.firstElementChild as HTMLElement | null;
        if (child) {
          setImportant(child, "display", "block");
          setImportant(child, "position", "static");
          setImportant(child, "inset", "auto");
          setImportant(child, "width", "100%");
          setImportant(child, "height", "100%");
          setImportant(child, "margin", "0");
          setImportant(child, "padding", "0");
          setImportant(child, "max-width", "100%");
          setImportant(child, "max-height", "100%");
          setImportant(child, "box-sizing", "border-box");
        }
        // Make sure no descendant escapes / overflows the strip area.
        parent.querySelectorAll<HTMLElement>("*").forEach((n) => {
          setImportant(n, "box-sizing", "border-box");
          const pos = n.style.position;
          if (pos === "fixed") setImportant(n, "position", "absolute");
        });
        // Scale images/svg/canvas to fit the visible strip height.
        parent.querySelectorAll<HTMLElement>("img, svg, canvas").forEach((m) => {
          if (m instanceof HTMLImageElement) {
            const src = m.getAttribute("src") || "";
            const alt = m.getAttribute("alt") || "";
            const isHeaderImage = parent.classList.contains("paged-strip-top");
            if (src.includes("company-header") || alt.includes("Header Strip")) {
              m.src = resolvedCompanyHeaderImg;
            }
            m.addEventListener("error", () => {
              if (isHeaderImage) m.src = resolvedCompanyHeaderImg;
            }, { once: true });
          }
          setImportant(m, "display", "block");
          setImportant(m, "max-width", "100%");
          setImportant(m, "max-height", "100%");
          setImportant(m, "width", "100%");
          setImportant(m, "height", "100%");
          setImportant(m, "object-fit", "contain");
          setImportant(m, "object-position", "center");
        });
      };

      if (stripTopPx > 0) {
        const top = document.createElement("div");
        top.className = "paged-strip-top";
        top.style.cssText = `position:absolute;left:0;right:0;top:0;height:${stripTopPx}px;overflow:hidden;pointer-events:none;z-index:5;display:flex;align-items:center;justify-content:center;`;
        if (headerHtml) {
          top.innerHTML = headerHtml;
          fitChild(top);
        }
        wrap.appendChild(top);
      }
      if (stripBottomPx > 0) {
        const bot = document.createElement("div");
        bot.className = "paged-strip-bottom";
        bot.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:${stripBottomPx}px;overflow:hidden;pointer-events:none;z-index:5;display:flex;align-items:center;justify-content:center;`;
        if (footerHtml) {
          bot.innerHTML = footerHtml;
          fitChild(bot);
        }
        wrap.appendChild(bot);
      }

      // DEBUG overlay — bounding boxes for strips, safe-area gap, content area
      // and side insets. Sits above everything (z=50) and ignores pointer events.
      if (debug) {
        const mkBox = (cssText: string, label: string, color: string) => {
          const d = document.createElement("div");
          d.className = "lov-debug-box";
          d.style.cssText =
            `position:absolute;pointer-events:none;z-index:50;` +
            `outline:2px solid ${color};outline-offset:-2px;` +
            `background:${color}1a;` + // ~10% alpha (hex 1a)
            `font:600 10px/1 ui-sans-serif,system-ui;color:#fff;` +
            cssText;
          const tag = document.createElement("span");
          tag.textContent = label;
          tag.style.cssText =
            `position:absolute;top:2px;left:2px;padding:1px 5px;border-radius:3px;` +
            `background:${color};color:#fff;letter-spacing:.02em;`;
          d.appendChild(tag);
          return d;
        };
        const safeTopPx = Math.max(0, Math.round(stripTopPx + stripGapPx));
        const safeBottomPx = Math.max(0, Math.round(stripBottomPx + stripGapPx));
        const safeSidePx = Math.max(0, Math.round(sideInsetPx));
        // Top strip box (blue)
        if (stripTopPx > 0) {
          wrap.appendChild(
            mkBox(
              `left:0;right:0;top:0;height:${stripTopPx}px;`,
              `STRIP TOP ${Math.round(stripTopPx)}px`,
              "#2563eb",
            ),
          );
        }
        // Bottom strip box (purple)
        if (stripBottomPx > 0) {
          wrap.appendChild(
            mkBox(
              `left:0;right:0;bottom:0;height:${stripBottomPx}px;`,
              `STRIP BOT ${Math.round(stripBottomPx)}px`,
              "#9333ea",
            ),
          );
        }
        // Safe-area gap above content (amber) — between strip and content area
        if (stripGapPx > 0) {
          wrap.appendChild(
            mkBox(
              `left:0;right:0;top:${stripTopPx}px;height:${Math.round(stripGapPx)}px;`,
              `SAFE GAP ${Math.round(stripGapPx)}px`,
              "#f59e0b",
            ),
          );
          wrap.appendChild(
            mkBox(
              `left:0;right:0;bottom:${stripBottomPx}px;height:${Math.round(stripGapPx)}px;`,
              `SAFE GAP ${Math.round(stripGapPx)}px`,
              "#f59e0b",
            ),
          );
        }
        // Side insets (teal)
        if (safeSidePx > 0) {
          wrap.appendChild(
            mkBox(
              `left:0;top:${safeTopPx}px;bottom:${safeBottomPx}px;width:${safeSidePx}px;`,
              `SIDE ${safeSidePx}px`,
              "#0d9488",
            ),
          );
          wrap.appendChild(
            mkBox(
              `right:0;top:${safeTopPx}px;bottom:${safeBottomPx}px;width:${safeSidePx}px;`,
              `SIDE ${safeSidePx}px`,
              "#0d9488",
            ),
          );
        }
        // Content safe area (green) — what's left for flowing content
        wrap.appendChild(
          mkBox(
            `left:${safeSidePx}px;right:${safeSidePx}px;top:${safeTopPx}px;bottom:${safeBottomPx}px;background:transparent;outline:2px dashed #16a34a;`,
            `CONTENT SAFE AREA`,
            "#16a34a",
          ),
        );
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
  }, [sourceRef, mode, onPageChange, deletedSet, onDeletePage, stripTopPx, stripBottomPx, stripGapPx, sideInsetPx, headerHtml, footerHtml, debug]);

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

  // Auto-fit-width: when zoom <= 0, fit page width to scroller width.
  const [fitZoom, setFitZoom] = useState(1);
  useEffect(() => {
    const scroller = targetScrollRef.current;
    if (!scroller) return;
    const compute = () => {
      const pad = 8; // minimal padding
      const avail = scroller.clientWidth - pad;
      const cols = mode === "spread" ? 2 : 1;
      const needed = A4_W * cols + (cols - 1) * 16;
      const ratio = avail / needed;
      setFitZoom(Math.max(0.2, ratio));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [targetScrollRef, mode]);

  const effectiveZoom =
    mode === "grid"
      ? Math.min(0.35, zoom * 0.45)
      : zoom <= 0
        ? fitZoom
        : Math.max(zoom, fitZoom);

  return (
    <div
      ref={targetScrollRef}
      className="flex-1 min-h-0 overflow-auto bg-muted/30"
      dir="ltr"
      tabIndex={0}
    >
      <div className="p-1 w-full flex justify-center">
        <div
          ref={viewportRef}
          className={cn("paged-viewport", viewportClass)}
          style={{
            // Use `zoom` so the scaled pages reserve real layout space
            // and the outer scroller grows to fit. `transform: scale()` would
            // keep the unscaled box and clip / leave empty space.
            zoom: effectiveZoom,
          } as React.CSSProperties}
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
