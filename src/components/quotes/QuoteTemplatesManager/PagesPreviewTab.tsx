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
  Wand2,
  RotateCcw,
  MousePointerClick,
  X,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

// A4 at 96dpi
const A4_W = 794;
const A4_H = 1123;

const LS_KEY = "lov-pages-preview-prefs-v1";
const FIX_LS_KEY = "lov-pages-fix-state-v1";

type ViewMode = "single" | "grid" | "compare";

interface Prefs {
  mode: ViewMode;
  zoom: number;
  highlightIssues: boolean;
}

interface ManualRule {
  path: string;
  fontScale?: number; // 0.5–1.5
  marginTop?: number; // px, can be negative
  breakBefore?: boolean;
  breakInsideAvoid?: boolean;
}

interface FixState {
  globalEnabled: boolean;
  autoPaths: string[]; // structural paths to force page-break-before
  manual: ManualRule[];
}

const defaultFixState: FixState = {
  globalEnabled: false,
  autoPaths: [],
  manual: [],
};

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

const loadFixState = (templateKey: string): FixState => {
  try {
    const raw = localStorage.getItem(`${FIX_LS_KEY}::${templateKey}`);
    if (!raw) return { ...defaultFixState };
    const p = JSON.parse(raw);
    return {
      globalEnabled: !!p.globalEnabled,
      autoPaths: Array.isArray(p.autoPaths) ? p.autoPaths : [],
      manual: Array.isArray(p.manual) ? p.manual : [],
    };
  } catch {
    return { ...defaultFixState };
  }
};

interface PagesPreviewTabProps {
  html: string;
  onExportPdf?: () => void;
  onExportWord?: () => void;
  onJumpToEditor?: (editablePath: string) => void;
  templateName?: string;
  onPaginationCssChange?: (css: string) => void;
}

export default function PagesPreviewTab({
  html,
  onExportPdf,
  onExportWord,
  onJumpToEditor,
  templateName = "הצעת מחיר",
  onPaginationCssChange,
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

  // Pagination fix state
  const templateKey = templateName || "default";
  const [fixState, setFixState] = useState<FixState>(() =>
    loadFixState(templateKey),
  );
  const [manualMode, setManualMode] = useState(false);
  const [selectedManual, setSelectedManual] = useState<{
    path: string;
    text: string;
  } | null>(null);
  const [autoFixing, setAutoFixing] = useState(false);

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

  // Persist fix state
  useEffect(() => {
    try {
      localStorage.setItem(
        `${FIX_LS_KEY}::${templateKey}`,
        JSON.stringify(fixState),
      );
    } catch {
      // ignore
    }
  }, [fixState, templateKey]);

  // Reload fix state when template changes
  useEffect(() => {
    setFixState(loadFixState(templateKey));
    setSelectedManual(null);
  }, [templateKey]);

  // Build global pagination CSS
  const globalFixCss = useMemo(() => {
    if (!fixState.globalEnabled) return "";
    return `
/* lov-pagination-fix:global */
h1,h2,h3,h4,h5{break-after:avoid !important;page-break-after:avoid !important;}
p,li{orphans:3;widows:3;}
tr,li,figure,blockquote,.stage-card,.summary-card,.card,.signature-block{break-inside:avoid !important;page-break-inside:avoid !important;}
table{border-collapse:collapse;}
table thead{display:table-header-group;}
table tfoot{display:table-footer-group;}
img,svg{break-inside:avoid;page-break-inside:avoid;}
`;
  }, [fixState.globalEnabled]);

  // The full pagination CSS (global + per-element overrides applied via data-fix-id and data-manual-id)
  const paginationCss = useMemo(() => {
    let css = globalFixCss;
    fixState.autoPaths.forEach((_, i) => {
      const id = `auto-${i}`;
      css += `\n[data-fix-id="${id}"]{break-before:page !important;page-break-before:always !important;}`;
    });
    fixState.manual.forEach((m, i) => {
      const id = `m-${i}`;
      const parts: string[] = [];
      if (typeof m.fontScale === "number" && m.fontScale !== 1) {
        parts.push(`font-size:${m.fontScale}em !important`);
      }
      if (typeof m.marginTop === "number" && m.marginTop !== 0) {
        parts.push(`margin-top:${m.marginTop}px !important`);
      }
      if (m.breakBefore) {
        parts.push(`break-before:page !important`);
        parts.push(`page-break-before:always !important`);
      }
      if (m.breakInsideAvoid) {
        parts.push(`break-inside:avoid !important`);
        parts.push(`page-break-inside:avoid !important`);
      }
      if (parts.length > 0) {
        css += `\n[data-manual-id="${id}"]{${parts.join(";")};}`;
      }
    });
    return css;
  }, [globalFixCss, fixState]);

  // Expose pagination CSS to parent (for export consistency)
  useEffect(() => {
    onPaginationCssChange?.(paginationCss);
  }, [paginationCss, onPaginationCssChange]);

  // Inject highlight + click-to-jump + auto-fix + manual-select script
  const finalHtml = useMemo(() => {
    const highlightCss = highlightIssues
      ? `<style>.lov-issue{outline:2px dashed hsl(0 84% 60%) !important;outline-offset:2px;background:hsla(0,84%,60%,0.08) !important;cursor:pointer;}</style>`
      : "";
    const manualCss = manualMode
      ? `<style>
          .lov-manual-hover{outline:2px solid hsl(217 91% 60%) !important;outline-offset:2px;cursor:crosshair !important;}
          .lov-manual-selected{outline:3px solid hsl(217 91% 50%) !important;outline-offset:2px;background:hsla(217,91%,60%,0.08) !important;}
        </style>`
      : "";
    const fixCssBlock = paginationCss
      ? `<style data-lov-fix>${paginationCss}</style>`
      : "";
    const autoPathsJson = JSON.stringify(fixState.autoPaths);
    const manualPathsJson = JSON.stringify(fixState.manual.map((m) => m.path));
    const script = `
<script>
(function(){
  var H=${A4_H};
  var MANUAL=${manualMode ? "true" : "false"};
  var HIGHLIGHT=${highlightIssues ? "true" : "false"};
  var AUTO_PATHS=${autoPathsJson};
  var MANUAL_PATHS=${manualPathsJson};

  function pathFor(el){
    if(!el || el===document.body) return 'body';
    var parts=[];
    var cur=el;
    while(cur && cur!==document.body && cur.nodeType===1){
      var p=cur.parentElement;
      if(!p) break;
      var tag=cur.tagName.toLowerCase();
      var same=Array.prototype.filter.call(p.children,function(c){return c.tagName===cur.tagName;});
      var idx=same.indexOf(cur)+1;
      parts.unshift(tag+':nth-of-type('+idx+')');
      cur=p;
    }
    return 'body>'+parts.join('>');
  }
  function findByPath(path){
    try{return document.querySelector(path);}catch(e){return null;}
  }
  function findEditable(el){
    var cur=el;
    while(cur && cur!==document.body){
      if(cur.getAttribute && cur.getAttribute('data-editable')) return cur.getAttribute('data-editable');
      cur=cur.parentElement;
    }
    return null;
  }

  function tagAutoPaths(){
    AUTO_PATHS.forEach(function(p,i){
      var el=findByPath(p);
      if(el) el.setAttribute('data-fix-id','auto-'+i);
    });
    MANUAL_PATHS.forEach(function(p,i){
      var el=findByPath(p);
      if(el) el.setAttribute('data-manual-id','m-'+i);
    });
  }

  function detectIssues(){
    var count=0;
    document.querySelectorAll('h1,h2,h3,h4,li,tr,.stage-card,.summary-card,.card').forEach(function(el){
      var r=el.getBoundingClientRect();
      var top=r.top+window.scrollY;
      var bottom=top+r.height;
      var startPage=Math.floor(top/H);
      var endPage=Math.floor((bottom-1)/H);
      if(endPage>startPage && r.height < H*0.9){
        if(HIGHLIGHT) el.classList.add('lov-issue');
        count++;
      }
    });
    try{window.parent.postMessage({__lovIssues:count},'*');}catch(e){}
  }

  // Click-to-jump for issues OR manual select
  document.addEventListener('click',function(ev){
    if(MANUAL){
      ev.preventDefault();
      ev.stopPropagation();
      // Find a meaningful block target (h*, p, li, tr, .card, etc.)
      var t=ev.target;
      var meaningful=t.closest && t.closest('h1,h2,h3,h4,h5,p,li,tr,table,figure,blockquote,.stage-card,.summary-card,.card,.signature-block');
      if(!meaningful) meaningful=t;
      var path=pathFor(meaningful);
      var text=(meaningful.innerText||'').slice(0,80);
      // Highlight selected
      document.querySelectorAll('.lov-manual-selected').forEach(function(n){n.classList.remove('lov-manual-selected');});
      meaningful.classList.add('lov-manual-selected');
      try{window.parent.postMessage({__lovManualSelect:true, path:path, text:text},'*');}catch(e){}
      return;
    }
    var path=findEditable(ev.target);
    var issueEl=ev.target.closest && ev.target.closest('.lov-issue');
    if(issueEl){
      ev.preventDefault();
      try{window.parent.postMessage({__lovJump:true, path:path||null, text:(issueEl.innerText||'').slice(0,80)},'*');}catch(e){}
    }
  },true);

  if(MANUAL){
    document.addEventListener('mouseover',function(ev){
      var t=ev.target;
      if(t && t.classList) t.classList.add('lov-manual-hover');
    },true);
    document.addEventListener('mouseout',function(ev){
      var t=ev.target;
      if(t && t.classList) t.classList.remove('lov-manual-hover');
    },true);
  }

  // Auto-fix request from parent
  window.addEventListener('message',function(ev){
    var d=ev.data;
    if(!d) return;
    if(d.__lovRequestAutoFix){
      var newPaths=[];
      document.querySelectorAll('h1,h2,h3,h4,li,tr,.stage-card,.summary-card,.card').forEach(function(el){
        var r=el.getBoundingClientRect();
        var top=r.top+window.scrollY;
        var bottom=top+r.height;
        var startPage=Math.floor(top/H);
        var endPage=Math.floor((bottom-1)/H);
        if(endPage>startPage && r.height < H*0.9){
          newPaths.push(pathFor(el));
        }
      });
      try{window.parent.postMessage({__lovAutoFixResult:true, paths:newPaths},'*');}catch(e){}
    }
  });

  function setupRepeatOverlays(){
    try{
      // Cleanup previous overlays (in case of re-init)
      document.querySelectorAll('.lov-repeat-overlay').forEach(function(n){ n.parentNode && n.parentNode.removeChild(n); });
      var body=document.body;
      if(!body) return;
      var PH=parseInt(body.getAttribute('data-page-height')||'1123',10) || 1123;
      var repH=body.getAttribute('data-repeat-header')==='1';
      var repF=body.getAttribute('data-repeat-footer')==='1';
      if(!repH && !repF) return;

      // Source elements (originals stay in place)
      var headerSrc=document.querySelector('.print-repeat-header > tr > td');
      var footerSrc=document.querySelector('.print-repeat-footer > tr > td');
      if(repH && !headerSrc) repH=false;
      if(repF && !footerSrc) repF=false;
      if(!repH && !repF) return;

      // Measure originals
      var headerH=0, footerH=0;
      if(repH) headerH=headerSrc.getBoundingClientRect().height || 0;
      if(repF) footerH=footerSrc.getBoundingClientRect().height || 90;

      var docH=document.documentElement.scrollHeight;
      var pageCount=Math.max(1, Math.ceil(docH/PH));

      // Header clones for pages 2..N (page 1 already has the original header)
      if(repH){
        for(var i=1;i<pageCount;i++){
          var el=document.createElement('div');
          el.className='lov-repeat-overlay lov-repeat-overlay-header';
          el.style.top=(i*PH)+'px';
          el.style.height=headerH+'px';
          el.innerHTML=headerSrc.innerHTML;
          body.appendChild(el);
        }
      }
      // Footer clones for pages 1..N-1 (last page already has the original footer)
      if(repF){
        for(var j=0;j<pageCount-1;j++){
          var ef=document.createElement('div');
          ef.className='lov-repeat-overlay lov-repeat-overlay-footer';
          ef.style.top=((j+1)*PH-footerH)+'px';
          ef.style.height=footerH+'px';
          ef.innerHTML=footerSrc.innerHTML;
          body.appendChild(ef);
        }
      }
    }catch(e){ /* noop */ }
  }

  function init(){
    tagAutoPaths();
    setupRepeatOverlays();
    setTimeout(detectIssues,300);
    // Re-run overlay setup after content settles (fonts/images)
    setTimeout(setupRepeatOverlays,600);
  }
  if(document.readyState==='complete') setTimeout(init,200);
  else window.addEventListener('load',function(){setTimeout(init,200);});
})();
</script>`;
    return html.replace(
      "</body>",
      `${highlightCss}${manualCss}${fixCssBlock}${script}</body>`,
    );
  }, [html, highlightIssues, manualMode, paginationCss, fixState.autoPaths, fixState.manual]);

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
      if (d.__lovManualSelect && d.path) {
        setSelectedManual({ path: d.path, text: d.text || "" });
      }
      if (d.__lovAutoFixResult && Array.isArray(d.paths)) {
        const unique = Array.from(new Set([...fixState.autoPaths, ...d.paths]));
        setFixState((s) => ({
          ...s,
          globalEnabled: true,
          autoPaths: unique,
        }));
        setAutoFixing(false);
        toast.success(`תוקנו ${d.paths.length} בעיות עימוד`, {
          description: "הוטמע CSS מקצועי + מעברי דף ידניים",
        });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onJumpToEditor, fixState.autoPaths]);

  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
    if (comparePage >= pageCount) setComparePage(Math.max(0, pageCount - 1));
  }, [pageCount, page, comparePage]);

  // Find the live iframe for sending messages
  const findLiveIframe = useCallback((): HTMLIFrameElement | null => {
    const list = document.querySelectorAll<HTMLIFrameElement>("iframe");
    for (const ifr of Array.from(list)) {
      if (ifr === measureRef.current) continue;
      if ((ifr.title || "").startsWith("page-")) return ifr;
    }
    return null;
  }, []);

  const handleAutoFix = useCallback(() => {
    const ifr = findLiveIframe();
    if (!ifr || !ifr.contentWindow) {
      // Fall back: just enable global CSS
      setFixState((s) => ({ ...s, globalEnabled: true }));
      toast.success("הופעל תיקון עימוד גלובלי");
      return;
    }
    setAutoFixing(true);
    try {
      ifr.contentWindow.postMessage({ __lovRequestAutoFix: true }, "*");
    } catch {
      setAutoFixing(false);
    }
    // Safety timeout
    setTimeout(() => setAutoFixing(false), 4000);
  }, [findLiveIframe]);

  const handleResetFix = useCallback(() => {
    setFixState({ ...defaultFixState });
    setSelectedManual(null);
    toast.success("כל תיקוני העימוד אופסו");
  }, []);

  const handlePrint = useCallback(() => {
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    // Inject pagination CSS into print
    const printHtml = paginationCss
      ? html.replace("</head>", `<style data-lov-fix>${paginationCss}</style></head>`)
      : html;
    win.document.open();
    win.document.write(printHtml);
    win.document.close();
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        // ignore
      }
    }, 500);
  }, [html, paginationCss]);

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

  // Manual editing helpers
  const upsertManualRule = useCallback(
    (path: string, patch: Partial<ManualRule>) => {
      setFixState((s) => {
        const idx = s.manual.findIndex((m) => m.path === path);
        const next = [...s.manual];
        if (idx >= 0) {
          next[idx] = { ...next[idx], ...patch };
        } else {
          next.push({ path, ...patch });
        }
        return { ...s, manual: next };
      });
    },
    [],
  );

  const removeManualRule = useCallback((path: string) => {
    setFixState((s) => ({
      ...s,
      manual: s.manual.filter((m) => m.path !== path),
    }));
  }, []);

  const currentManualRule = useMemo<ManualRule | undefined>(() => {
    if (!selectedManual) return undefined;
    return fixState.manual.find((m) => m.path === selectedManual.path);
  }, [selectedManual, fixState.manual]);

  const totalFixCount =
    fixState.autoPaths.length +
    fixState.manual.filter(
      (m) =>
        m.fontScale !== undefined ||
        m.marginTop !== undefined ||
        m.breakBefore ||
        m.breakInsideAvoid,
    ).length +
    (fixState.globalEnabled ? 1 : 0);

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
    <div className="h-full flex flex-col bg-muted/30 relative">
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

        {/* Pagination fix controls */}
        <div className="bg-muted rounded-md p-0.5 flex items-center gap-0.5">
          <Button
            size="sm"
            variant="default"
            className="h-8 text-xs gap-1.5"
            onClick={handleAutoFix}
            disabled={autoFixing}
            title="זיהוי אוטומטי של בעיות + הטמעת CSS מקצועי + מעברי דף"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {autoFixing ? "מתקן..." : "תקן עימוד"}
          </Button>
          <Toggle
            pressed={manualMode}
            onPressedChange={(v) => {
              setManualMode(v);
              if (!v) setSelectedManual(null);
            }}
            size="sm"
            className="h-8 text-xs"
            aria-label="עריכה ידנית"
          >
            <MousePointerClick className="h-3.5 w-3.5 ml-1.5" />
            עריכה ידנית
          </Toggle>
          {totalFixCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs gap-1.5 text-muted-foreground"
              onClick={handleResetFix}
              title="אפס את כל תיקוני העימוד"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              אפס ({totalFixCount})
            </Button>
          )}
        </div>

        {highlightIssues && issues > 0 && onJumpToEditor && !manualMode && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Edit3 className="h-3 w-3" />
            לחיצה על אזור אדום פותחת את העורך
          </span>
        )}
        {manualMode && (
          <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
            <MousePointerClick className="h-3 w-3" />
            לחץ על אלמנט בתצוגה כדי לערוך
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
            <div ref={captureRef}>{renderPageViewport(page, zoom, true)}</div>
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

      {/* Floating manual-edit panel */}
      {manualMode && selectedManual && (
        <div
          className="absolute top-20 left-4 w-72 bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col"
          dir="rtl"
        >
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2 min-w-0">
              <Edit3 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold truncate">
                עריכת אלמנט
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setSelectedManual(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-3 space-y-4 text-sm">
            <div className="text-[11px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5 line-clamp-2">
              {selectedManual.text || "(ללא תוכן)"}
            </div>

            {/* Font scale */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">גודל טקסט</label>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {Math.round((currentManualRule?.fontScale ?? 1) * 100)}%
                </span>
              </div>
              <Slider
                min={50}
                max={150}
                step={5}
                value={[Math.round((currentManualRule?.fontScale ?? 1) * 100)]}
                onValueChange={(v) =>
                  upsertManualRule(selectedManual.path, {
                    fontScale: v[0] / 100,
                  })
                }
              />
            </div>

            {/* Margin top */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">מרווח עליון (מיקום)</label>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {currentManualRule?.marginTop ?? 0}px
                </span>
              </div>
              <Slider
                min={-80}
                max={120}
                step={2}
                value={[currentManualRule?.marginTop ?? 0]}
                onValueChange={(v) =>
                  upsertManualRule(selectedManual.path, { marginTop: v[0] })
                }
              />
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] flex-1"
                  onClick={() =>
                    upsertManualRule(selectedManual.path, {
                      marginTop: (currentManualRule?.marginTop ?? 0) - 10,
                    })
                  }
                >
                  <ArrowUp className="h-3 w-3 ml-1" />
                  למעלה
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] flex-1"
                  onClick={() =>
                    upsertManualRule(selectedManual.path, {
                      marginTop: (currentManualRule?.marginTop ?? 0) + 10,
                    })
                  }
                >
                  <ArrowDown className="h-3 w-3 ml-1" />
                  למטה
                </Button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-1.5">
              <Button
                size="sm"
                variant={currentManualRule?.breakBefore ? "default" : "outline"}
                className="h-8 text-xs w-full justify-start"
                onClick={() =>
                  upsertManualRule(selectedManual.path, {
                    breakBefore: !currentManualRule?.breakBefore,
                  })
                }
              >
                <ChevronLeft className="h-3.5 w-3.5 ml-1.5" />
                דחוף לדף הבא
              </Button>
              <Button
                size="sm"
                variant={
                  currentManualRule?.breakInsideAvoid ? "default" : "outline"
                }
                className="h-8 text-xs w-full justify-start"
                onClick={() =>
                  upsertManualRule(selectedManual.path, {
                    breakInsideAvoid: !currentManualRule?.breakInsideAvoid,
                  })
                }
              >
                <AlertTriangle className="h-3.5 w-3.5 ml-1.5" />
                אל תחתוך אלמנט זה
              </Button>
            </div>

            <div className="flex gap-1.5 pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] flex-1 text-destructive"
                onClick={() => {
                  removeManualRule(selectedManual.path);
                  setSelectedManual(null);
                }}
              >
                <X className="h-3 w-3 ml-1" />
                הסר תיקון
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t bg-card px-4 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>תבנית: {templateName}</span>
        <span className="flex items-center gap-3">
          {totalFixCount > 0 && (
            <span className="text-primary font-medium">
              ✓ {totalFixCount} תיקוני עימוד פעילים
            </span>
          )}
          <span>
            {pageCount} {pageCount === 1 ? "דף" : "דפים"} •{" "}
            {highlightIssues
              ? `${issues} אזורים נחתכים`
              : "מצב סימון כבוי"}
          </span>
        </span>
      </div>
    </div>
  );
}
