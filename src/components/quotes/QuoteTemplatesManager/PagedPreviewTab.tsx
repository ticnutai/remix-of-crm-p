// Modern pages-preview tab powered by paged.js (CSS Paged Media polyfill).
// Replaces the legacy transform-based viewport with real DOM fragmentation:
// each page is its own .pagedjs_page element with proper widows/orphans,
// break-inside:avoid, and @page margins.
//
// Features:
//  - 4 view modes: single | continuous | spread (book) | grid
//  - Full keyboard navigation (←/→, Space/Shift+Space, Home/End, Ctrl+G)
//  - Zoom controls + fit-to-width
//  - Manual page jump
//  - Drop-in compatible with the old PagesPreviewTab props
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
  Ruler,
  Check,
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
import { cn } from "@/lib/utils";

import { usePagedLayout } from "./paged-engine/usePagedLayout";
import { useKeyboardNav } from "./paged-engine/useKeyboardNav";
import ViewModeContainer, {
  type PagedViewMode,
} from "./paged-engine/ViewModeContainer";

const LS_KEY = "lov-paged-preview-prefs-v1";

// ─── Page size definitions (96 dpi, portrait) ────────────────────────────────
interface PageSizeOption {
  id: string;
  label: string;
  dims: string;
  cssSize: string;
  widthPx: number;
  heightPx: number;
}

const PAGE_SIZES: PageSizeOption[] = [
  { id: "A4",     label: "A4",     dims: '210×297 מ"מ', cssSize: "A4",     widthPx: 794,  heightPx: 1123 },
  { id: "A3",     label: "A3",     dims: '297×420 מ"מ', cssSize: "A3",     widthPx: 1123, heightPx: 1587 },
  { id: "A5",     label: "A5",     dims: '148×210 מ"מ', cssSize: "A5",     widthPx: 560,  heightPx: 794  },
  { id: "Letter", label: "Letter", dims: '216×279 מ"מ', cssSize: "letter", widthPx: 816,  heightPx: 1056 },
  { id: "Legal",  label: "Legal",  dims: '216×356 מ"מ', cssSize: "legal",  widthPx: 816,  heightPx: 1344 },
];
// ─────────────────────────────────────────────────────────────────────────────

interface Prefs {
  mode: PagedViewMode;
  zoom: number;
  pageSizeId: string;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { mode: "single", zoom: 0.85, pageSizeId: "A4" };
    const p = JSON.parse(raw);
    const validModes: PagedViewMode[] = [
      "single",
      "continuous",
      "spread",
      "grid",
    ];
    const validSizeId = PAGE_SIZES.find((s) => s.id === p.pageSizeId)?.id ?? "A4";
    return {
      mode: validModes.includes(p.mode) ? p.mode : "single",
      zoom:
        typeof p.zoom === "number"
          ? Math.max(0.25, Math.min(2, p.zoom))
          : 0.85,
      pageSizeId: validSizeId,
    };
  } catch {
    return { mode: "single", zoom: 0.85, pageSizeId: "A4" };
  }
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
    hint: "כל העמודים זה מתחת לזה (כמו Word)",
  },
  {
    mode: "spread",
    label: "ספר",
    Icon: BookOpen,
    hint: "שני עמודים זה לצד זה",
  },
  {
    mode: "grid",
    label: "רשת",
    Icon: Grid3x3,
    hint: "תצוגה ממוזערת של כל העמודים",
  },
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
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSizeId, setPageSizeId] = useState(initial.current.pageSizeId);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  const pageSize = PAGE_SIZES.find((s) => s.id === pageSizeId) ?? PAGE_SIZES[0];
  const pageSizeOverrideCss = `@page { size: ${pageSize.cssSize}; margin: 18mm 14mm 16mm 14mm; }`;

  // Off-screen render container - paged.js writes the fragmented DOM here.
  // ViewModeContainer clones the resulting .pagedjs_page nodes into the
  // visible viewport, so the heavy fragmentation only runs once per HTML.
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { containerRef, pageCount, rendering, error, rerender } =
    usePagedLayout(html, pageSizeOverrideCss);

  // Clamp current page when count changes
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  // Persist prefs
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ mode, zoom, pageSizeId } as Prefs),
      );
    } catch {
      // ignore
    }
  }, [mode, zoom, pageSizeId]);

  // Keyboard navigation
  useKeyboardNav({
    pageCount,
    currentPage,
    onPageChange: setCurrentPage,
    scrollContainerRef: scrollRef,
  });

  const fitZoom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const availableW = el.clientWidth - 64;
    const newZoom = Math.max(
      0.3,
      Math.min(1.5, +(availableW / pageSize.widthPx).toFixed(2)),
    );
    setZoom(newZoom);
  }, [pageSize.widthPx]);

  const totalLabel = useMemo(
    () =>
      pageCount === 1
        ? "1 דף"
        : `${pageCount} דפים`,
    [pageCount],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full flex flex-col bg-muted/30 relative" dir="rtl">
        {/* Off-screen source: paged.js renders into here. */}
        <div
          aria-hidden
          ref={containerRef}
          style={{
            position: "absolute",
            left: -100000,
            top: 0,
            width: pageSize.widthPx,
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
              onClick={() =>
                setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))
              }
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
              onClick={() =>
                setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))
              }
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

          {/* Page nav (single mode mainly) */}
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
              דף {currentPage + 1} / {pageCount}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() =>
                setCurrentPage((p) => Math.min(pageCount - 1, p + 1))
              }
              disabled={currentPage >= pageCount - 1}
              aria-label="הבא"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Keyboard hint */}
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
            <PopoverContent
              align="end"
              className="w-72 text-xs space-y-1.5"
            >
              <div className="font-semibold mb-1.5 text-sm">קיצורי מקלדת</div>
              <Shortcut keys="←" desc="עמוד הבא" />
              <Shortcut keys="→" desc="עמוד קודם" />
              <Shortcut keys="Space" desc="גלילה למטה" />
              <Shortcut keys="Shift+Space" desc="גלילה למעלה" />
              <Shortcut keys="Home / End" desc="עמוד ראשון / אחרון" />
              <Shortcut keys="PageUp / PageDown" desc="עמוד שלם" />
              <Shortcut keys="Ctrl+G" desc="קפיצה לעמוד" />
            </PopoverContent>
          </Popover>

          {/* Page size selector */}
          <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 min-w-[68px] font-medium"
                    aria-label="גודל עמוד"
                  >
                    <Ruler className="h-3.5 w-3.5 shrink-0" />
                    {pageSize.label}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>גודל עמוד</TooltipContent>
            </Tooltip>
            <PopoverContent align="start" side="bottom" className="w-56 p-2" dir="rtl">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
                גודל עמוד
              </p>
              <div className="space-y-0.5">
                {PAGE_SIZES.map((s) => {
                  const THUMB_H = 42;
                  const ratio = s.widthPx / s.heightPx;
                  const thumbW = Math.round(THUMB_H * ratio);
                  const selected = s.id === pageSizeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setPageSizeId(s.id); setPageSizeOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-right transition-colors",
                        selected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      {/* Mini page thumbnail */}
                      <div
                        className="shrink-0 rounded-[2px] border flex items-center justify-center text-[8px] font-bold"
                        style={{
                          width: thumbW,
                          height: THUMB_H,
                          background: selected ? "hsl(var(--primary)/0.08)" : "#f8fafc",
                          borderColor: selected ? "hsl(var(--primary)/0.4)" : "#cbd5e0",
                          color: selected ? "hsl(var(--primary))" : "#94a3b8",
                        }}
                      >
                        {s.label}
                      </div>
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="text-xs font-semibold leading-tight">{s.label}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.dims}</span>
                      </div>
                      {selected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1" />

          {/* Export */}
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

        {/* Viewport */}
        <ViewModeContainer
          sourceRef={containerRef}
          pageCount={pageCount}
          rendering={rendering}
          mode={mode}
          zoom={zoom}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          scrollRef={scrollRef}
          pageWidth={pageSize.widthPx}
          pageHeight={pageSize.heightPx}
        />

        {/* Status bar */}
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
              {totalLabel} • paged.js {rendering ? "(מעבד...)" : "(מוכן)"}
            </span>
          </span>
        </div>
      </div>
    </TooltipProvider>
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
