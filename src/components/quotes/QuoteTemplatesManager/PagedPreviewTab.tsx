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
  topMm: 22,
  bottomMm: 18,
  sideMm: 14,
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
      topMm: clampMm(p.topMm, DEFAULT_PREFS.topMm),
      bottomMm: clampMm(p.bottomMm, DEFAULT_PREFS.bottomMm),
      sideMm: clampMm(p.sideMm, DEFAULT_PREFS.sideMm),
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
  margin: ${debouncedTop}mm ${debouncedSide}mm ${debouncedBottom}mm ${debouncedSide}mm !important;
}
`,
    [debouncedTop, debouncedBottom, debouncedSide],
  );

  const { containerRef, pageCount, rendering, error, rerender } =
    usePagedLayout(html, extraCss);

  const visibleCount = Math.max(0, pageCount - deletedPages.length);

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, Math.max(0, visibleCount - 1)));
  }, [visibleCount]);

  // Reset deleted pages when the underlying HTML changes substantially.
  useEffect(() => {
    setDeletedPages((d) => d.filter((i) => i < pageCount));
  }, [pageCount]);

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
                onChange={(v) => setTopMm(clampMm(v, DEFAULT_PREFS.topMm))}
              />
              <StripRow
                label="תחתון (מ״מ)"
                value={bottomMm}
                onChange={(v) => setBottomMm(clampMm(v, DEFAULT_PREFS.bottomMm))}
              />
              <StripRow
                label="צד (מ״מ)"
                value={sideMm}
                onChange={(v) => setSideMm(clampMm(v, DEFAULT_PREFS.sideMm))}
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
        </div>

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
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="range"
          min={5}
          max={60}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
        />
        <Input
          type="number"
          min={5}
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
