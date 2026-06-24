// Pages preview tab powered by paged.js (CSS Paged Media polyfill).
// Real DOM fragmentation: each page is a .pagedjs_page with proper
// widows/orphans, break-inside:avoid, and @page margins (= the top/bottom
// strips). Text is physically impossible to leak into the strip areas
// because paged.js fragments at the page-box boundary.
//
// Features wired here:
//   - 4 view modes (single / continuous / spread / grid)
//   - Dynamic strip heights (mm) via @page margin overrides
//   - Per-page delete + restore
//   - PDF/Word export hooks
//   - Persisted preferences
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Grid3x3,
  Square,
  Printer,
  FileText,
  FileType,
  RefreshCw,
  ScrollText,
  BookOpen,
  Keyboard,
  Undo2,
  Ruler,
  Bug,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { usePagedLayout } from "./paged-engine/usePagedLayout";
import { useKeyboardNav } from "./paged-engine/useKeyboardNav";
import ViewModeContainer, {
  type PagedViewMode,
} from "./paged-engine/ViewModeContainer";

const LS_KEY = "lov-paged-preview-prefs-v2";

interface Prefs {
  mode: PagedViewMode;
  zoom: number;
  topMm: number;
  bottomMm: number;
  sideMm: number;
}

const DEFAULT_PREFS: Prefs = {
  mode: "single",
  zoom: 0.85,
  topMm: 30,
  bottomMm: 26,
  sideMm: 20,
};

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = JSON.parse(raw);
    return {
      mode: ["single", "continuous", "spread", "grid"].includes(p.mode)
        ? p.mode
        : DEFAULT_PREFS.mode,
      zoom:
        typeof p.zoom === "number"
          ? Math.max(0.25, Math.min(2, p.zoom))
          : DEFAULT_PREFS.zoom,
      topMm: Math.max(DEFAULT_PREFS.topMm, clampMm(p.topMm, DEFAULT_PREFS.topMm)),
      bottomMm: Math.max(DEFAULT_PREFS.bottomMm, clampMm(p.bottomMm, DEFAULT_PREFS.bottomMm)),
      sideMm: Math.max(DEFAULT_PREFS.sideMm, clampMm(p.sideMm, DEFAULT_PREFS.sideMm)),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function clampMm(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!isFinite(n)) return fallback;
  return Math.max(5, Math.min(60, n));
}

const MM_TO_PX = 96 / 25.4; // ~3.78
const STRIP_SAFE_GAP_MM = 5;

function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

interface PagedPreviewTabProps {
  html: string;
  onExportPdf?: () => void;
  onExportWord?: () => void;
  onJumpToEditor?: (editablePath: string) => void;
  templateName?: string;
  onPaginationCssChange?: (css: string) => void;
}

const MODE_BUTTONS: {
  mode: PagedViewMode;
  label: string;
  Icon: typeof Square;
  hint: string;
}[] = [
  { mode: "single", label: "דף בודד", Icon: Square, hint: "עמוד אחד במרכז" },
  {
    mode: "continuous",
    label: "גלילה",
    Icon: ScrollText,
    hint: "כל העמודים זה מתחת לזה",
  },
  { mode: "spread", label: "ספר", Icon: BookOpen, hint: "שני עמודים זה לצד זה" },
  { mode: "grid", label: "רשת", Icon: Grid3x3, hint: "תצוגה ממוזערת" },
];

export default function PagedPreviewTab({
  html,
  onExportPdf,
  onExportWord,
  templateName = "הצעת מחיר",
}: PagedPreviewTabProps) {
  const initial = useRef(loadPrefs());
  const [mode, setMode] = useState<PagedViewMode>(initial.current.mode);
  const [zoom, setZoom] = useState(initial.current.zoom);
  const [topMm, setTopMm] = useState(initial.current.topMm);
  const [bottomMm, setBottomMm] = useState(initial.current.bottomMm);
  const [sideMm, setSideMm] = useState(initial.current.sideMm);
  const [currentPage, setCurrentPage] = useState(0);
  const [deletedPages, setDeletedPages] = useState<number[]>([]);
  const [debug, setDebug] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Debounce the strip values that drive @page margins so dragging sliders
  // doesn't trigger paged.js fragmentation on every pixel (~300ms idle wait).
  const debouncedTop = useDebouncedValue(topMm, 300);
  const debouncedBottom = useDebouncedValue(bottomMm, 300);
  const debouncedSide = useDebouncedValue(sideMm, 300);
  const stripsSettling =
    debouncedTop !== topMm ||
    debouncedBottom !== bottomMm ||
    debouncedSide !== sideMm;

  // Dynamic @page CSS — overrides margins (= strip heights). paged.js
  // guarantees no content lands inside the page margin.
  const extraCss = useMemo(
    () => `
@page {
  size: A4;
  margin: ${debouncedTop + STRIP_SAFE_GAP_MM}mm ${debouncedSide}mm ${debouncedBottom + STRIP_SAFE_GAP_MM}mm ${debouncedSide}mm !important;
${debug ? `  /* DEBUG: outline the page box and margin boxes */
  border: 1px solid #ef4444 !important;
  @top-center { background: rgba(34,197,94,0.18) !important; outline: 1px dashed #16a34a !important; }
  @bottom-center { background: rgba(34,197,94,0.18) !important; outline: 1px dashed #16a34a !important; }
` : ""}}
${debug ? `
/* DEBUG: highlight running elements (header/footer strips) */
.print-repeat-header, .quote-fixed-header, .header-strip, .repeat-header, .lov-repeat-overlay-header {
  outline: 2px solid #2563eb !important;
  background: rgba(37,99,235,0.10) !important;
}
.print-repeat-footer, .quote-fixed-footer, .footer-strip, .repeat-footer, .lov-repeat-overlay-footer {
  outline: 2px solid #9333ea !important;
  background: rgba(147,51,234,0.10) !important;
}
/* DEBUG: outline each rendered page + the content area */
.pagedjs_page { outline: 2px solid #ef4444 !important; }
.pagedjs_page_content { outline: 1px dashed #f59e0b !important; background: rgba(245,158,11,0.04) !important; }
.pagedjs_margin-top, .pagedjs_margin-bottom,
.pagedjs_margin-left, .pagedjs_margin-right {
  background: rgba(34,197,94,0.10) !important;
  outline: 1px dashed #16a34a !important;
}
.pagedjs_margin-top-center, .pagedjs_margin-bottom-center {
  background: rgba(34,197,94,0.22) !important;
}
/* DEBUG: tag every element inside a running header/footer */
.print-repeat-header *, .print-repeat-footer * {
  outline: 1px dotted rgba(37,99,235,0.5) !important;
}
` : ""}
`,
    [debouncedTop, debouncedBottom, debouncedSide, debug],
  );

  const { containerRef, pageCount, rendering, error, rerender, headerHtml, footerHtml } =
    usePagedLayout(html, extraCss);

  const visibleCount = Math.max(0, pageCount - deletedPages.length);

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, Math.max(0, visibleCount - 1)));
  }, [visibleCount]);

  // Reset deleted pages when the underlying HTML changes substantially.
  useEffect(() => {
    setDeletedPages((d) => d.filter((i) => i < pageCount));
  }, [pageCount]);

  // Render-check: after every paged render, verify the logo strips actually
  // exist on every visible page. Reports both to console and to a status flag
  // surfaced in the bottom status bar.
  const [stripCheck, setStripCheck] = useState<{
    pages: number;
    withTop: number;
    withBottom: number;
    visibleTop: number;
    visibleBottom: number;
    overlaps: number;
  } | null>(null);

  const runStripCheck = useCallback(() => {
    if (rendering) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    // Wait one frame so ViewModeContainer has finished painting.
    const raf = window.requestAnimationFrame(() => {
      const wraps = scroller.querySelectorAll<HTMLElement>(".paged-page-wrap");
      let withTop = 0;
      let withBottom = 0;
      let visibleTop = 0;
      let visibleBottom = 0;
      let overlaps = 0;
      let sideOverlaps = 0;

      const restoredDisplays: Array<[HTMLElement, string]> = [];
      wraps.forEach((w) => {
        restoredDisplays.push([w, w.style.display]);
        w.style.display = "block";
      });

      wraps.forEach((w) => {
        const top = w.querySelector(".paged-strip-top");
        const bot = w.querySelector(".paged-strip-bottom");
        if (top && top.children.length > 0) withTop++;
        if (bot && bot.children.length > 0) withBottom++;
        const topRect = top?.getBoundingClientRect();
        const botRect = bot?.getBoundingClientRect();
        const topChild = top?.firstElementChild as HTMLElement | null;
        const botChild = bot?.firstElementChild as HTMLElement | null;
        const topImg = top?.querySelector("img") as HTMLImageElement | null;
        const botBox = botChild?.getBoundingClientRect();
        const topBox = topImg?.getBoundingClientRect() || topChild?.getBoundingClientRect();
        if (
          top &&
          topChild &&
          topRect &&
          topRect.width > 1 &&
          topRect.height > 1 &&
          topBox &&
          topBox.width > 1 &&
          topBox.height > 1 &&
          window.getComputedStyle(topChild).display !== "none" &&
          (!topImg || (topImg.complete && topImg.naturalWidth > 0))
        ) {
          visibleTop++;
        }
        if (
          bot &&
          botChild &&
          botRect &&
          botRect.width > 1 &&
          botRect.height > 1 &&
          botBox &&
          botBox.width > 1 &&
          botBox.height > 1 &&
          window.getComputedStyle(botChild).display !== "none"
        ) {
          visibleBottom++;
        }

        const clippedRect = (el: HTMLElement) => {
          const base = el.getBoundingClientRect();
          let top = base.top;
          let right = base.right;
          let bottom = base.bottom;
          let left = base.left;
          let parent = el.parentElement;
          while (parent && parent !== w.parentElement) {
            const style = window.getComputedStyle(parent);
            if (style.overflow !== "visible" || style.overflowX !== "visible" || style.overflowY !== "visible") {
              const pr = parent.getBoundingClientRect();
              top = Math.max(top, pr.top);
              right = Math.min(right, pr.right);
              bottom = Math.min(bottom, pr.bottom);
              left = Math.max(left, pr.left);
            }
            parent = parent.parentElement;
          }
          return { top, right, bottom, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
        };

        const areaRect = w.querySelector<HTMLElement>(".pagedjs_area")?.getBoundingClientRect();
        w.querySelectorAll<HTMLElement>(".pagedjs_area *").forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") return;
          if ([...el.children].some((child) => (child.textContent || "").trim())) return;
          const r = clippedRect(el);
          if (r.width < 1 || r.height < 1) return;
          const hitTop = topRect && r.bottom > topRect.top + 1 && r.top < topRect.bottom - 1;
          const hitBottom = botRect && r.bottom > botRect.top + 1 && r.top < botRect.bottom - 1;
          if (hitTop || hitBottom) overlaps++;
          if (areaRect && (r.left < areaRect.left - 1 || r.right > areaRect.right + 1)) sideOverlaps++;
        });
      });
      restoredDisplays.forEach(([w, display]) => {
        w.style.display = display;
      });
      const pages = wraps.length;
      const totalOverlaps = overlaps + sideOverlaps;
      setStripCheck({ pages, withTop, withBottom, visibleTop, visibleBottom, overlaps: totalOverlaps });
      if (
        pages > 0 &&
        (withTop < pages || withBottom < pages || visibleTop < pages || visibleBottom < pages || totalOverlaps > 0)
      ) {
        console.warn(
          `[PagedPreviewTab] strip check: header ${withTop}/${pages} visible ${visibleTop}/${pages}, ` +
          `footer ${withBottom}/${pages} visible ${visibleBottom}/${pages}, stripOverlaps=${overlaps}, sideOverlaps=${sideOverlaps}`,
          { headerHtmlPresent: !!headerHtml, footerHtmlPresent: !!footerHtml, overlaps, sideOverlaps },
        );
      } else if (pages > 0) {
        console.info(
          `[PagedPreviewTab] strip check OK: visible header+footer on all ${pages} pages, strip/side overlaps=0`,
        );
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [rendering, headerHtml, footerHtml]);

  useEffect(() => runStripCheck(), [runStripCheck, pageCount, deletedPages, mode, zoom]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ mode, zoom, topMm, bottomMm, sideMm } as Prefs),
      );
    } catch {
      /* ignore */
    }
  }, [mode, zoom, topMm, bottomMm, sideMm]);

  useKeyboardNav({
    pageCount: visibleCount,
    currentPage,
    onPageChange: setCurrentPage,
    scrollContainerRef: scrollRef,
  });

  const fitZoom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const availableW = el.clientWidth - 64;
    setZoom(Math.max(0.3, Math.min(1.5, +(availableW / 794).toFixed(2))));
  }, []);

  const handleDeletePage = useCallback((idx: number) => {
    setDeletedPages((d) => (d.includes(idx) ? d : [...d, idx].sort((a, b) => a - b)));
  }, []);

  const restoreDeleted = useCallback(() => setDeletedPages([]), []);

  const totalLabel = useMemo(() => {
    if (deletedPages.length > 0) {
      return `${visibleCount} מתוך ${pageCount} דפים`;
    }
    return visibleCount === 1 ? "1 דף" : `${visibleCount} דפים`;
  }, [visibleCount, pageCount, deletedPages.length]);

  const stripTopPx = topMm * MM_TO_PX;
  const stripBottomPx = bottomMm * MM_TO_PX;
  const stripGapPx = STRIP_SAFE_GAP_MM * MM_TO_PX;
  const sideInsetPx = sideMm * MM_TO_PX;
  // Log strip metrics only when the meaningful values change (avoid spam).
  useEffect(() => {
    console.log(
      `[PagedPreviewTab] strips — topPx=${stripTopPx.toFixed(1)} bottomPx=${stripBottomPx.toFixed(1)} ` +
      `headerHtmlLen=${headerHtml.length} footerHtmlLen=${footerHtml.length} pageCount=${pageCount}`,
    );
  }, [stripTopPx, stripBottomPx, headerHtml.length, footerHtml.length, pageCount]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full flex flex-col bg-muted/30 relative" dir="rtl">
        {/* Off-screen source */}
        <div
          aria-hidden
          ref={containerRef}
          style={{
            position: "absolute",
            left: -100000,
            top: 0,
            width: 794,
            visibility: "hidden",
            pointerEvents: "none",
          }}
        />

        {/* Toolbar */}
        <div className="border-b bg-card px-4 py-2 flex items-center gap-3 flex-wrap shrink-0">
          {/* View modes */}
          <div className="bg-muted rounded-md p-0.5 flex gap-0.5">
            {MODE_BUTTONS.map(({ mode: m, label, Icon, hint }) => (
              <Tooltip key={m}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={mode === m ? "default" : "ghost"}
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setMode(m)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{hint}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Zoom */}
          <div className="bg-muted rounded-md p-0.5 flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))}
              aria-label="הקטן"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium min-w-[3rem] text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
              aria-label="הגדל"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={fitZoom}
                  aria-label="התאם לרוחב"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>התאם לרוחב</TooltipContent>
            </Tooltip>
          </div>

          {/* Page nav */}
          <div className="bg-muted rounded-md p-0.5 flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              aria-label="הקודם"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium min-w-[5.5rem] text-center tabular-nums">
              דף {Math.min(currentPage + 1, visibleCount)} / {visibleCount}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(visibleCount - 1, p + 1))}
              disabled={currentPage >= visibleCount - 1}
              aria-label="הבא"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Strip height controls */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                <Ruler className="h-3.5 w-3.5" />
                סטריפים: {topMm}/{bottomMm} מ"מ
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3" dir="rtl">
              <div className="text-sm font-semibold">גובה סטריפים ושוליים</div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Paged.js מבטיח שטקסט לא ייכנס לאזורים האלה — הוא נחתך אוטומטית
                לדף הבא.
              </p>
              <StripRow
                label="עליון (מ״מ)"
                value={topMm}
                min={DEFAULT_PREFS.topMm}
                onChange={(v) => setTopMm(Math.max(DEFAULT_PREFS.topMm, clampMm(v, DEFAULT_PREFS.topMm)))}
              />
              <StripRow
                label="תחתון (מ״מ)"
                value={bottomMm}
                min={DEFAULT_PREFS.bottomMm}
                onChange={(v) => setBottomMm(Math.max(DEFAULT_PREFS.bottomMm, clampMm(v, DEFAULT_PREFS.bottomMm)))}
              />
              <StripRow
                label="צד (מ״מ)"
                value={sideMm}
                min={DEFAULT_PREFS.sideMm}
                onChange={(v) => setSideMm(Math.max(DEFAULT_PREFS.sideMm, clampMm(v, DEFAULT_PREFS.sideMm)))}
              />
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setTopMm(DEFAULT_PREFS.topMm);
                  setBottomMm(DEFAULT_PREFS.bottomMm);
                  setSideMm(DEFAULT_PREFS.sideMm);
                }}
              >
                איפוס ברירת מחדל
              </Button>
            </PopoverContent>
          </Popover>

          {/* Restore deleted pages */}
          {deletedPages.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={restoreDeleted}
            >
              <Undo2 className="h-3.5 w-3.5" />
              שחזר {deletedPages.length} דפים
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={debug ? "default" : "outline"}
                className="h-8 text-xs gap-1.5"
                onClick={() => setDebug((v) => !v)}
              >
                <Bug className="h-3.5 w-3.5" />
                דיבוג
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              מסמן גבולות דף (אדום), אזור תוכן (כתום), שולי @page (ירוק),
              סטריפ עליון (כחול), תחתון (סגול)
            </TooltipContent>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="קיצורי מקלדת"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 text-xs space-y-1.5" dir="rtl">
              <div className="font-semibold mb-1.5 text-sm">קיצורי מקלדת</div>
              <Shortcut keys="←/→" desc="ניווט בין דפים" />
              <Shortcut keys="Space / Shift+Space" desc="גלילה" />
              <Shortcut keys="Home / End" desc="ראשון / אחרון" />
            </PopoverContent>
          </Popover>

          <div className="flex-1" />

          {onExportPdf && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={onExportPdf}
            >
              <Printer className="h-3.5 w-3.5 ml-1.5" />
              PDF
            </Button>
          )}
          {onExportWord && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={onExportWord}
            >
              <FileType className="h-3.5 w-3.5 ml-1.5" />
              Word
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={rerender}
            aria-label="רענן"
            title="רענן את הפריסה"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={runStripCheck}
            aria-label="בדוק רינדור"
            title="בדוק סטריפים וחפיפות"
          >
            <ScanLine className="h-4 w-4" />
          </Button>
        </div>

        {stripCheck && stripCheck.pages > 0 &&
          (stripCheck.withTop < stripCheck.pages ||
            stripCheck.withBottom < stripCheck.pages ||
            stripCheck.visibleTop < stripCheck.pages ||
            stripCheck.visibleBottom < stripCheck.pages ||
            stripCheck.overlaps > 0) && (
            <div
              role="alert"
              className="border-b border-destructive/40 bg-destructive/10 text-destructive px-4 py-2 text-xs flex items-center gap-2 shrink-0"
            >
              <span className="font-semibold">⚠ בדיקת רינדור:</span>
              <span>
                סטריפ עליון מופיע ב-{stripCheck.withTop} מתוך {stripCheck.pages}{" "}
                עמודים, סטריפ תחתון ב-{stripCheck.withBottom} מתוך{" "}
                {stripCheck.pages}.
              </span>
              <span>
                נראות בפועל: ▲ {stripCheck.visibleTop}/{stripCheck.pages} · ▼{" "}
                {stripCheck.visibleBottom}/{stripCheck.pages}; חפיפות תוכן: {stripCheck.overlaps}.
              </span>
              {!headerHtml && stripCheck.withTop === 0 && (
                <span className="text-destructive/80">
                  (לא נמצא אלמנט סטריפ עליון בתבנית)
                </span>
              )}
              {!footerHtml && stripCheck.withBottom === 0 && (
                <span className="text-destructive/80">
                  (לא נמצא אלמנט סטריפ תחתון בתבנית)
                </span>
              )}
            </div>
          )}


        <ViewModeContainer
          sourceRef={containerRef}
          pageCount={pageCount}
          rendering={rendering}
          mode={mode}
          zoom={zoom}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          scrollRef={scrollRef}
          deletedPages={deletedPages}
          onDeletePage={handleDeletePage}
          stripTopPx={stripTopPx}
          stripBottomPx={stripBottomPx}
          stripGapPx={stripGapPx}
          sideInsetPx={sideInsetPx}
          headerHtml={headerHtml}
          footerHtml={footerHtml}
        />

        <div className="border-t bg-card px-4 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between shrink-0">
          <span>תבנית: {templateName}</span>
          <span className="flex items-center gap-3">
            {error && (
              <span className="text-destructive">
                <FileText className="h-3 w-3 inline ml-1" />
                שגיאת עימוד: {error}
              </span>
            )}
            {stripCheck && stripCheck.pages > 0 && (
              <span
                className={
                  stripCheck.withTop === stripCheck.pages &&
                  stripCheck.withBottom === stripCheck.pages &&
                  stripCheck.visibleTop === stripCheck.pages &&
                  stripCheck.visibleBottom === stripCheck.pages &&
                  stripCheck.overlaps === 0
                    ? "text-success"
                    : "text-destructive"
                }
                title="בדיקת רינדור: קיום ונראות סטריפים + בדיקת חפיפת תוכן"
              >
                סטריפים: ▲ {stripCheck.withTop}/{stripCheck.pages} · ▼{" "}
                {stripCheck.withBottom}/{stripCheck.pages} · נראה ▲ {stripCheck.visibleTop}/{stripCheck.pages} · חפיפות {stripCheck.overlaps}
              </span>
            )}
            <span>
              {totalLabel} • paged.js {rendering ? "(מעבד…)" : "(מוכן)"}
            </span>
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}

function StripRow({
  label,
  value,
  min = 5,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="range"
          min={min}
          max={60}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
        />
        <Input
          type="number"
          min={min}
          max={60}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 h-8 text-xs"
        />
      </div>
    </div>
  );
}

function Shortcut({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{desc}</span>
      <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px] border border-border">
        {keys}
      </kbd>
    </div>
  );
}
