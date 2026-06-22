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
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

// A4 at 96dpi
const A4_W = 794;
const A4_H = 1123;

interface PagesPreviewTabProps {
  html: string;
  onExportPdf?: () => void;
  onExportWord?: () => void;
  templateName?: string;
}

/**
 * "תצוגה מקדימה משוכללת" — paged preview of the live HTML.
 * Two modes: single (one A4 page with nav) / grid (all thumbnails).
 * Toolbar: zoom, page nav, exports, problem-area highlighter.
 */
export default function PagesPreviewTab({
  html,
  onExportPdf,
  onExportWord,
  templateName = "הצעת מחיר",
}: PagesPreviewTabProps) {
  const [mode, setMode] = useState<"grid" | "single">("single");
  const [zoom, setZoom] = useState(0.85);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [contentH, setContentH] = useState(A4_H);
  const [highlightIssues, setHighlightIssues] = useState(false);
  const [issues, setIssues] = useState<number>(0);
  const measureRef = useRef<HTMLIFrameElement | null>(null);

  // Inject highlight script if requested
  const finalHtml = useMemo(() => {
    if (!highlightIssues) return html;
    const script = `
<style>.lov-issue{outline:2px dashed hsl(0 84% 60%) !important;outline-offset:2px;background:hsla(0,84%,60%,0.08) !important;}</style>
<script>
(function(){
  function detect(){
    var H=${A4_H};
    var count=0;
    document.querySelectorAll('h1,h2,h3,h4,li,tr,.stage-card,.summary-card').forEach(function(el){
      var r=el.getBoundingClientRect();
      var top=r.top+window.scrollY;
      var bottom=top+r.height;
      var startPage=Math.floor(top/H);
      var endPage=Math.floor((bottom-1)/H);
      if(endPage>startPage && r.height < H*0.9){
        el.classList.add('lov-issue');
        count++;
      }
    });
    try{window.parent.postMessage({__lovIssues:count},'*');}catch(e){}
  }
  if(document.readyState==='complete') setTimeout(detect,300);
  else window.addEventListener('load',function(){setTimeout(detect,300);});
})();
</script>`;
    return html.replace("</body>", `${script}</body>`);
  }, [html, highlightIssues]);

  // Measure page count from hidden iframe
  const handleMeasureLoad = useCallback(() => {
    const iframe = measureRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      setTimeout(() => {
        const h = doc.documentElement.scrollHeight || A4_H;
        setContentH(h);
        setPageCount(Math.max(1, Math.ceil(h / A4_H)));
      }, 350);
    } catch {
      // ignore
    }
  }, []);

  // Listen for issue count messages
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as any;
      if (d && typeof d.__lovIssues === "number") setIssues(d.__lovIssues);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [pageCount, page]);

  const handlePrint = useCallback(() => {
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        // ignore
      }
    }, 500);
  }, [html]);

  const fitZoom = useCallback(() => setZoom(0.7), []);

  // Render a single "page viewport" — a clipped iframe positioned at page N
  const renderPageViewport = (
    pageIdx: number,
    scale: number,
    interactive = false,
  ) => {
    return (
      <div
        key={pageIdx}
        className="relative bg-card shadow-md border border-border"
        style={{
          width: A4_W * scale,
          height: A4_H * scale,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: A4_W,
            height: contentH,
            transform: `scale(${scale}) translateY(${-pageIdx * A4_H}px)`,
            transformOrigin: "top right",
            pointerEvents: interactive ? "auto" : "none",
          }}
        >
          <iframe
            title={`page-${pageIdx + 1}`}
            srcDoc={finalHtml}
            style={{
              width: A4_W,
              height: contentH,
              border: 0,
              display: "block",
              background: "white",
            }}
          />
        </div>
        <div className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-foreground/70 text-background pointer-events-none">
          {pageIdx + 1} / {pageCount}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Hidden measurer */}
      <iframe
        ref={measureRef}
        title="measurer"
        srcDoc={finalHtml}
        onLoad={handleMeasureLoad}
        style={{
          position: "absolute",
          left: -99999,
          top: -99999,
          width: A4_W,
          height: 200,
          border: 0,
          visibility: "hidden",
        }}
        aria-hidden
      />

      {/* Toolbar */}
      <div className="border-b bg-card px-4 py-2 flex items-center gap-3 flex-wrap">
        {/* Mode toggle */}
        <div className="bg-muted rounded-md p-0.5 flex gap-0.5">
          <Button
            size="sm"
            variant={mode === "single" ? "default" : "ghost"}
            className="h-8 text-xs"
            onClick={() => setMode("single")}
          >
            <Square className="h-3.5 w-3.5 ml-1.5" />
            דף בודד
          </Button>
          <Button
            size="sm"
            variant={mode === "grid" ? "default" : "ghost"}
            className="h-8 text-xs"
            onClick={() => setMode("grid")}
          >
            <Grid3x3 className="h-3.5 w-3.5 ml-1.5" />
            רשת דפים
          </Button>
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
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={fitZoom}
            aria-label="התאם"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Page nav (single mode) */}
        {mode === "single" && (
          <div className="bg-muted rounded-md p-0.5 flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="הקודם"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium min-w-[4.5rem] text-center tabular-nums">
              דף {page + 1} מתוך {pageCount}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              aria-label="הבא"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Issue highlighter */}
        <Toggle
          pressed={highlightIssues}
          onPressedChange={setHighlightIssues}
          size="sm"
          className="h-8 text-xs data-[state=on]:bg-destructive/15 data-[state=on]:text-destructive"
          aria-label="סמן אזורים בעייתיים"
        >
          <AlertTriangle className="h-3.5 w-3.5 ml-1.5" />
          סמן בעיות
          {highlightIssues && issues > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px]">
              {issues}
            </span>
          )}
        </Toggle>

        <div className="flex-1" />

        {/* Exports */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={handlePrint}
          >
            <Printer className="h-3.5 w-3.5 ml-1.5" />
            הדפסה
          </Button>
          {onExportPdf && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={onExportPdf}
            >
              <FileText className="h-3.5 w-3.5 ml-1.5" />
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
            onClick={() => {
              // force remeasure
              const ifr = measureRef.current;
              if (ifr) {
                const src = ifr.srcdoc;
                ifr.srcdoc = "";
                requestAnimationFrame(() => {
                  ifr.srcdoc = src;
                });
              }
            }}
            aria-label="רענן"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-auto p-6" dir="ltr">
        {mode === "single" ? (
          <div className="flex justify-center">
            {renderPageViewport(page, zoom, true)}
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPage(i);
                  setMode("single");
                }}
                className="group relative focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                title={`עבור לדף ${i + 1}`}
              >
                {renderPageViewport(i, zoom * 0.55, false)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="border-t bg-card px-4 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>תבנית: {templateName}</span>
        <span>
          {pageCount} {pageCount === 1 ? "דף" : "דפים"} •{" "}
          {highlightIssues
            ? `${issues} אזורים נחתכים בין דפים`
            : "מצב סימון כבוי"}
        </span>
      </div>
    </div>
  );
}
