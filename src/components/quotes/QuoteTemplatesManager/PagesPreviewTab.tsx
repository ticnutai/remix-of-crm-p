import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
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
  SplitSquareHorizontal,
  Image as ImageIcon,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";

// A4 at 96dpi
const A4_W = 794;
const A4_H = 1123;

const LS_KEY = "lov-pages-preview-prefs-v1";

type ViewMode = "single" | "grid" | "compare";

interface Prefs {
  mode: ViewMode;
  zoom: number;
  highlightIssues: boolean;
}

const loadPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { mode: "single", zoom: 0.85, highlightIssues: false };
    const p = JSON.parse(raw);
    return {
      mode: ["single", "grid", "compare"].includes(p.mode) ? p.mode : "single",
      zoom: typeof p.zoom === "number" ? Math.min(2, Math.max(0.25, p.zoom)) : 0.85,
      highlightIssues: !!p.highlightIssues,
    };
  } catch {
    return { mode: "single", zoom: 0.85, highlightIssues: false };
  }
};

interface PagesPreviewTabProps {
  html: string;
  onExportPdf?: () => void;
  onExportWord?: () => void;
  onJumpToEditor?: (editablePath: string) => void;
  templateName?: string;
}

export default function PagesPreviewTab({
  html,
  onExportPdf,
  onExportWord,
  onJumpToEditor,
  templateName = "הצעת מחיר",
}: PagesPreviewTabProps) {
  const initial = useRef(loadPrefs());
  const [mode, setMode] = useState<ViewMode>(initial.current.mode);
  const [zoom, setZoom] = useState(initial.current.zoom);
  const [highlightIssues, setHighlightIssues] = useState(
    initial.current.highlightIssues,
  );
  const [page, setPage] = useState(0);
  const [comparePage, setComparePage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [contentH, setContentH] = useState(A4_H);
  const [issues, setIssues] = useState<number>(0);
  const [exporting, setExporting] = useState(false);

  const measureRef = useRef<HTMLIFrameElement | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);

  // Persist prefs
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ mode, zoom, highlightIssues } as Prefs),
      );
    } catch {
      // ignore
    }
  }, [mode, zoom, highlightIssues]);

  // Inject highlight + click-to-jump script
  const finalHtml = useMemo(() => {
    const highlightCss = highlightIssues
      ? `<style>.lov-issue{outline:2px dashed hsl(0 84% 60%) !important;outline-offset:2px;background:hsla(0,84%,60%,0.08) !important;cursor:pointer;}</style>`
      : "";
    const script = `
<script>
(function(){
  var H=${A4_H};
  function findEditable(el){
    var cur=el;
    while(cur && cur!==document.body){
      if(cur.getAttribute && cur.getAttribute('data-editable')) return cur.getAttribute('data-editable');
      cur=cur.parentElement;
    }
    return null;
  }
  function detect(){
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
  document.addEventListener('click',function(ev){
    var path=findEditable(ev.target);
    var issueEl=ev.target.closest && ev.target.closest('.lov-issue');
    if(issueEl){
      ev.preventDefault();
      try{window.parent.postMessage({__lovJump:true, path:path||null, text:(issueEl.innerText||'').slice(0,80)},'*');}catch(e){}
    }
  },true);
  if(${highlightIssues ? "true" : "false"}){
    if(document.readyState==='complete') setTimeout(detect,300);
    else window.addEventListener('load',function(){setTimeout(detect,300);});
  } else {
    try{window.parent.postMessage({__lovIssues:0},'*');}catch(e){}
  }
})();
</script>`;
    return html.replace("</body>", `${highlightCss}${script}</body>`);
  }, [html, highlightIssues]);

  // Measure
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

  // Listen
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as any;
      if (!d) return;
      if (typeof d.__lovIssues === "number") setIssues(d.__lovIssues);
      if (d.__lovJump) {
        if (onJumpToEditor && d.path) {
          onJumpToEditor(d.path);
          toast.success("עובר לעורך", {
            description: d.text || "אזור בעייתי",
          });
        } else {
          toast.info("אזור בעייתי", {
            description: d.text || "נחתך בין דפים",
          });
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onJumpToEditor]);

  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
    if (comparePage >= pageCount) setComparePage(Math.max(0, pageCount - 1));
  }, [pageCount, page, comparePage]);

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

  const handleExportPng = useCallback(async () => {
    if (!captureRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${templateName || "quote"}-page-${page + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("הדף נשמר כתמונה");
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בייצוא התמונה");
    } finally {
      setExporting(false);
    }
  }, [page, templateName]);

  const fitZoom = useCallback(() => setZoom(0.7), []);

  const renderPageViewport = (
    pageIdx: number,
    scale: number,
    interactive = false,
    label?: string,
  ) => (
    <div
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
          title={`page-${pageIdx + 1}${label ? "-" + label : ""}`}
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
        {label ? `${label} · ` : ""}
        {pageIdx + 1} / {pageCount}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-muted/30">
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
            רשת
          </Button>
          <Button
            size="sm"
            variant={mode === "compare" ? "default" : "ghost"}
            className="h-8 text-xs"
            onClick={() => setMode("compare")}
            disabled={pageCount < 2}
          >
            <SplitSquareHorizontal className="h-3.5 w-3.5 ml-1.5" />
            השוואה
          </Button>
        </div>

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

        {highlightIssues && issues > 0 && onJumpToEditor && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Edit3 className="h-3 w-3" />
            לחיצה על אזור אדום פותחת את העורך
          </span>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          {mode === "single" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleExportPng}
              disabled={exporting}
            >
              <ImageIcon className="h-3.5 w-3.5 ml-1.5" />
              {exporting ? "מייצא..." : "PNG"}
            </Button>
          )}
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
        {mode === "single" && (
          <div className="flex justify-center">
            <div ref={captureRef}>
              {renderPageViewport(page, zoom, true)}
            </div>
          </div>
        )}

        {mode === "grid" && (
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

        {mode === "compare" && (
          <div className="flex flex-col gap-4 items-center">
            <div className="flex flex-wrap gap-6 justify-center items-start">
              {/* Right (A) */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[11px] font-medium px-2 tabular-nums">
                    A · דף {page + 1}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {renderPageViewport(page, zoom, true, "A")}
              </div>
              {/* Left (B) */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setComparePage((p) => Math.max(0, p - 1))}
                    disabled={comparePage === 0}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[11px] font-medium px-2 tabular-nums">
                    B · דף {comparePage + 1}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() =>
                      setComparePage((p) => Math.min(pageCount - 1, p + 1))
                    }
                    disabled={comparePage >= pageCount - 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {renderPageViewport(comparePage, zoom, true, "B")}
              </div>
            </div>
          </div>
        )}
      </div>

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
