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
  ArrowLeft,
  ArrowRight,
  Move,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// A4 at 96dpi
const A4_W = 794;
const A4_H = 1123;
const PX_PER_MM = 3.7795;

// How many convergence passes the auto-fix runs before stopping
const MAX_AUTOFIX_PASSES = 4;

const LS_KEY = "lov-pages-preview-prefs-v1";
const FIX_LS_KEY = "lov-pages-fix-state-v1";

type ViewMode = "single" | "continuous" | "spread" | "grid" | "compare";

interface Prefs {
  mode: ViewMode;
  zoom: number;
  highlightIssues: boolean;
  showSafeZones?: boolean;
}

interface ManualRule {
  path: string;
  fontScale?: number; // 0.5–1.5
  marginTop?: number; // px, can be negative
  offsetX?: number; // px, free drag offset (translateX)
  offsetY?: number; // px, free drag offset (translateY)
  breakBefore?: boolean;
  breakInsideAvoid?: boolean;
}

interface FixState {
  globalEnabled: boolean;
  autoPaths: string[]; // structural paths to force page-break-before
  manual: ManualRule[];
  safeZoneTopMm: number; // safe top margin (in mm) reserved for repeating header
  safeZoneBottomMm: number; // safe bottom margin (in mm) reserved for repeating footer
  protectedBlocks: string[]; // CSS selectors of blocks to keep intact / push from safe zones
  autoEnforceStrips: boolean; // automatically push content out of strip zones on every render
  deletedPages: number[]; // 0-indexed page numbers to remove from the document
}

const DEFAULT_PROTECTED = [
  "h1",
  "h2",
  "h3",
  "h4",
  "tr",
  "table",
  "ul",
  "ol",
  "li",
  "figure",
  "blockquote",
  ".stage-card",
  ".summary-card",
  ".card",
  ".signature-block",
];

const defaultFixState: FixState = {
  globalEnabled: false,
  autoPaths: [],
  manual: [],
  safeZoneTopMm: 20,
  safeZoneBottomMm: 15,
  protectedBlocks: [...DEFAULT_PROTECTED],
  autoEnforceStrips: true,
  deletedPages: [],
};

const loadPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { mode: "single", zoom: 0.85, highlightIssues: false, showSafeZones: true };
    const p = JSON.parse(raw);
    return {
      mode: ["single", "continuous", "spread", "grid", "compare"].includes(p.mode)
        ? p.mode
        : "single",
      zoom: typeof p.zoom === "number" ? Math.min(2, Math.max(0.25, p.zoom)) : 0.85,
      highlightIssues: !!p.highlightIssues,
      showSafeZones: p.showSafeZones !== false,
    };
  } catch {
    return { mode: "single", zoom: 0.85, highlightIssues: false, showSafeZones: true };
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
      safeZoneTopMm:
        typeof p.safeZoneTopMm === "number" ? p.safeZoneTopMm : 20,
      safeZoneBottomMm:
        typeof p.safeZoneBottomMm === "number" ? p.safeZoneBottomMm : 15,
      protectedBlocks: Array.isArray(p.protectedBlocks)
        ? p.protectedBlocks
        : [...DEFAULT_PROTECTED],
      autoEnforceStrips: p.autoEnforceStrips !== false,
      deletedPages: Array.isArray(p.deletedPages) ? p.deletedPages.filter((n: unknown) => typeof n === "number") : [],
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
  const [showSafeZones, setShowSafeZones] = useState<boolean>(
    initial.current.showSafeZones !== false,
  );
  const [page, setPage] = useState(0);
  const [comparePage, setComparePage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [contentH, setContentH] = useState(A4_H);
  const [issues, setIssues] = useState<number>(0);
  const [exporting, setExporting] = useState(false);

  // Drag state for safe-zone lines — kept in refs so the entire preview
  // does NOT re-render on every mousemove. Only the line DOM is updated.
  const dragRef = useRef<{
    active: boolean;
    line: "top" | "bottom";
    startY: number;
    startMm: number;
    lastMm: number;
    scale: number;
  }>({ active: false, line: "top", startY: 0, startMm: 0, lastMm: 0, scale: 1 });

  // Keep a registry of all rendered page-viewport containers so we can update
  // every visible strip line/background in sync during drag.
  const pageContainersRef = useRef<Map<number, HTMLDivElement>>(new Map());

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
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Iterative auto-fix bookkeeping
  const autoFixIterRef = useRef(0);
  const autoFixCumulativeRef = useRef(0);

  // Update the visual position of all strip lines/bgs/labels without React render.
  const updateSafeZoneVisuals = useCallback(
    (topMm: number, bottomMm: number, scale: number) => {
      const topPx = topMm * PX_PER_MM * scale;
      const bottomPx = bottomMm * PX_PER_MM * scale;
      pageContainersRef.current.forEach((container) => {
        const topLine = container.querySelector<HTMLElement>(
          '[data-safe-line="top"]',
        );
        const bottomLine = container.querySelector<HTMLElement>(
          '[data-safe-line="bottom"]',
        );
        const topBg = container.querySelector<HTMLElement>(
          '[data-safe-bg="top"]',
        );
        const bottomBg = container.querySelector<HTMLElement>(
          '[data-safe-bg="bottom"]',
        );
        const topLabel = container.querySelector<HTMLElement>(
          '[data-safe-label="top"]',
        );
        const bottomLabel = container.querySelector<HTMLElement>(
          '[data-safe-label="bottom"]',
        );
        if (topLine) topLine.style.top = `${topPx}px`;
        if (topBg) topBg.style.height = `${topPx}px`;
        if (topLabel)
          topLabel.textContent = `סטריפ עליון · ${topMm} מ"מ`;
        if (bottomLine) bottomLine.style.bottom = `${bottomPx}px`;
        if (bottomBg) bottomBg.style.height = `${bottomPx}px`;
        if (bottomLabel)
          bottomLabel.textContent = `סטריפ תחתון · ${bottomMm} מ"מ`;
      });
    },
    [],
  );

  // Start dragging a safe-zone boundary line.
  const startSafeZoneDrag = useCallback(
    (line: "top" | "bottom", scale: number) =>
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startMm =
          line === "top" ? fixState.safeZoneTopMm : fixState.safeZoneBottomMm;
        dragRef.current = {
          active: true,
          line,
          startY: e.clientY,
          startMm,
          lastMm: startMm,
          scale,
        };
        document.body.style.cursor = "ns-resize";
        document.body.style.userSelect = "none";
        // Disable pointer-events on all page iframes while dragging so the
        // parent window keeps receiving mousemove/mouseup events even when the
        // cursor leaves the thin drag handle and enters the preview iframe.
        const disabledIframes: HTMLIFrameElement[] = [];
        document.querySelectorAll("iframe").forEach((ifr) => {
          if ((ifr.title || "").startsWith("page-")) {
            ifr.style.pointerEvents = "none";
            disabledIframes.push(ifr);
          }
        });

        const onMove = (ev: MouseEvent) => {
          const d = dragRef.current;
          if (!d.active) return;
          const dy = ev.clientY - d.startY;
          // For the bottom line the CSS distance is from the bottom edge:
          // dragging the mouse UP moves the line UP and INCREASES the strip.
          const invert = d.line === "bottom";
          const dmm = (invert ? -dy : dy) / d.scale / PX_PER_MM;
          const snapped = Math.round(d.startMm + dmm);
          const other =
            d.line === "top"
              ? fixState.safeZoneBottomMm
              : fixState.safeZoneTopMm;
          // Leave at least 60mm of content between the two strips.
          const maxMm = Math.max(
            0,
            Math.round(A4_H / PX_PER_MM - other - 60),
          );
          const clamped = Math.max(0, Math.min(maxMm, snapped));
          if (clamped !== d.lastMm) {
            d.lastMm = clamped;
            if (d.line === "top") {
              updateSafeZoneVisuals(clamped, fixState.safeZoneBottomMm, d.scale);
            } else {
              updateSafeZoneVisuals(fixState.safeZoneTopMm, clamped, d.scale);
            }
          }
        };

        const onUp = () => {
          disabledIframes.forEach((ifr) => {
            ifr.style.pointerEvents = "";
          });
          const { line: dragLine } = dragRef.current;
          dragRef.current.active = false;
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          const finalMm = dragRef.current.lastMm;
          if (dragLine === "top") {
            setFixState((s) => ({ ...s, safeZoneTopMm: finalMm }));
          } else {
            setFixState((s) => ({ ...s, safeZoneBottomMm: finalMm }));
          }
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      },
    [fixState.safeZoneTopMm, fixState.safeZoneBottomMm, updateSafeZoneVisuals],
  );

  // Persist prefs
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ mode, zoom, highlightIssues, showSafeZones } as Prefs),
      );
    } catch {
      // ignore
    }
  }, [mode, zoom, highlightIssues, showSafeZones]);

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

  // Build global pagination CSS (uses user-selected protected blocks)
  const globalFixCss = useMemo(() => {
    if (!fixState.globalEnabled) return "";
    const sel = (fixState.protectedBlocks.length
      ? fixState.protectedBlocks
      : DEFAULT_PROTECTED
    ).join(",");
    return `
/* lov-pagination-fix:global */
h1,h2,h3,h4,h5{break-after:avoid !important;page-break-after:avoid !important;}
p,li{orphans:3;widows:3;}
${sel}{break-inside:avoid !important;page-break-inside:avoid !important;}
table{border-collapse:collapse;}
table thead{display:table-header-group;}
table tfoot{display:table-footer-group;}
img,svg{break-inside:avoid;page-break-inside:avoid;}
`;
  }, [fixState.globalEnabled, fixState.protectedBlocks]);

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
      const ox = typeof m.offsetX === "number" ? m.offsetX : 0;
      const oy = typeof m.offsetY === "number" ? m.offsetY : 0;
      if (ox !== 0 || oy !== 0) {
        parts.push(`transform:translate(${ox}px,${oy}px) !important`);
        parts.push(`position:relative !important`);
        parts.push(`z-index:2 !important`);
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
          .lov-manual-hover{outline:2px solid hsl(217 91% 60%) !important;outline-offset:2px;cursor:move !important;}
          .lov-manual-selected{outline:3px solid hsl(217 91% 50%) !important;outline-offset:2px;background:hsla(217,91%,60%,0.08) !important;}
          .lov-manual-dragging{outline:3px dashed hsl(217 91% 45%) !important;outline-offset:2px;opacity:0.9 !important;cursor:grabbing !important;}
          .lov-drag-badge{position:fixed;z-index:99999;pointer-events:none;background:hsl(217 91% 45%);color:#fff;font:600 11px/1.4 system-ui,sans-serif;padding:3px 7px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.25);white-space:nowrap;}
          body.lov-manual-dragging-active{user-select:none !important;cursor:grabbing !important;}
        </style>`
      : "";
    const fixCssBlock = paginationCss
      ? `<style data-lov-fix>${paginationCss}</style>`
      : "";
    const autoPathsJson = JSON.stringify(fixState.autoPaths);
    const manualRulesJson = JSON.stringify(
      fixState.manual.map((m) => ({
        path: m.path,
        offsetX: m.offsetX || 0,
        offsetY: m.offsetY || 0,
      })),
    );
    const safeTopPx = Math.round(fixState.safeZoneTopMm * 3.7795);
    const safeBottomPx = Math.round(fixState.safeZoneBottomMm * 3.7795);
    const protectSel = (fixState.protectedBlocks.length
      ? fixState.protectedBlocks
      : DEFAULT_PROTECTED
    ).join(",");
    // Hard enforcement: regular content gets pushed inside the safe zones via
    // body padding, and @page margins are set so the print path uses the same
    // strip reservations. Visual masks cover the strips so any text that still
    // overflows is hidden; the repeating header/footer overlays are promoted
    // above the masks so they remain visible in their reserved zones.
    const enforceCss = `<style data-lov-safe-enforce>
      html, body { box-sizing: border-box; }
      @page {
        margin-top: ${safeTopPx}px;
        margin-bottom: ${safeBottomPx}px;
      }
      body {
        padding-top: ${safeTopPx}px !important;
        padding-bottom: ${safeBottomPx}px !important;
      }
      /* ===== Strip / mask layering system =====
         Layer order (highest wins):
           --lov-z-strip   = 2147483600  (logo + footer strips — ALWAYS on top)
           --lov-z-mask    = 2147482000  (white masks that hide content bleed)
           --lov-z-content =          1  (regular quote content)
         Using near-max int values guarantees we beat any user CSS, and the
         body gets 'isolation: isolate' so an ancestor stacking context can't
         trap our layers underneath theirs. */
      :root {
        --lov-z-content: 1;
        --lov-z-mask: 2147482000;
        --lov-z-strip: 2147483600;
      }
      body {
        isolation: isolate;
        position: relative;
      }
      /* Per-page masks (injected absolutely by the runtime script below) hide
         any regular content that bleeds into the strips on EVERY page. */
      .lov-safe-mask {
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        background: #ffffff !important;
        z-index: var(--lov-z-mask) !important;
        pointer-events: none !important;
        transform: none !important;
        filter: none !important;
        opacity: 1 !important;
      }
      /* Strip elements must render above the masks in EVERY scenario.
         We promote both the wrapper AND its inner cell so table-based
         repeating headers/footers (<thead>/<tfoot>) layer correctly. */
      .lov-repeat-overlay-header,
      .lov-repeat-overlay-footer,
      .header-strip,
      .quote-fixed-header,
      .quote-fixed-footer,
      .footer,
      .header {
        position: relative !important;
        z-index: var(--lov-z-strip) !important;
        isolation: isolate;
      }
      /* thead/tfoot themselves don't honour z-index reliably — promote the
         td/div children that actually paint. */
      .print-repeat-header,
      .print-repeat-footer {
        position: relative;
        z-index: var(--lov-z-strip);
      }
      .print-repeat-header td,
      .print-repeat-footer td,
      .print-repeat-header > tr > td > *,
      .print-repeat-footer > tr > td > * {
        position: relative;
        z-index: var(--lov-z-strip) !important;
      }
      /* The repeated overlays live in their reserved strip and never escape. */
      .lov-repeat-overlay-header {
        max-height: ${safeTopPx}px !important;
        overflow: hidden !important;
      }
      .lov-repeat-overlay-footer {
        max-height: ${safeBottomPx}px !important;
        overflow: hidden !important;
      }
      /* Repeating originals (page-1 header / last-page footer) clipped too. */
      .print-repeat-header td { max-height: ${safeTopPx}px; overflow: hidden; }
      .print-repeat-footer td { max-height: ${safeBottomPx}px; overflow: hidden; }
    </style>`;

    const script = `
<script>
(function(){
  var H=${A4_H};
  var MANUAL=${manualMode ? "true" : "false"};
  var HIGHLIGHT=${highlightIssues ? "true" : "false"};
  var AUTO_PATHS=${autoPathsJson};
  var MANUAL_RULES=${manualRulesJson};
  var SAFE_TOP_PX=${safeTopPx};
  var SAFE_BOTTOM_PX=${safeBottomPx};
  var PROTECT_SEL=${JSON.stringify(protectSel)};
  var AUTO_ENFORCE=${fixState.autoEnforceStrips ? "true" : "false"};
  var DELETED_PAGES=${JSON.stringify(fixState.deletedPages || [])};

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
    MANUAL_RULES.forEach(function(m,i){
      var el=findByPath(m.path);
      if(el){
        el.setAttribute('data-manual-id','m-'+i);
        el.setAttribute('data-lov-ox', String(m.offsetX||0));
        el.setAttribute('data-lov-oy', String(m.offsetY||0));
      }
    });
  }
  function meaningfulOf(t){
    var m=t && t.closest && t.closest('h1,h2,h3,h4,h5,p,li,tr,table,figure,blockquote,img,.stage-card,.summary-card,.card,.signature-block');
    return m||t;
  }

  function detectIssues(){
    var count=0;
    var SAFE_TOP=parseInt(document.body.getAttribute('data-safe-top')||'0',10)||0;
    var SAFE_BOTTOM=parseInt(document.body.getAttribute('data-safe-bottom')||'0',10)||0;
    var SEL=document.body.getAttribute('data-protect-sel')||'h1,h2,h3,h4,li,tr,.stage-card,.summary-card,.card';
    document.querySelectorAll(SEL).forEach(function(el){
      var r=el.getBoundingClientRect();
      var top=r.top+window.scrollY;
      var bottom=top+r.height;
      var startPage=Math.floor(top/H);
      var endPage=Math.floor((bottom-1)/H);
      var topInPage=top - startPage*H;
      var bottomInPage=bottom - endPage*H;
      var crosses = endPage>startPage && r.height < H*0.9;
      var hitsHeader = topInPage < SAFE_TOP;
      var hitsFooter = bottomInPage > (H - SAFE_BOTTOM);
      if(crosses || hitsHeader || hitsFooter){
        if(HIGHLIGHT) el.classList.add('lov-issue');
        count++;
      }
    });
    try{window.parent.postMessage({__lovIssues:count},'*');}catch(e){}
  }

  var DRAG=null;        // active drag descriptor
  var JUST_DRAGGED=false; // suppress the click that follows a real drag

  // Click-to-jump for issues OR manual select
  document.addEventListener('click',function(ev){
    if(MANUAL){
      ev.preventDefault();
      ev.stopPropagation();
      if(JUST_DRAGGED){ JUST_DRAGGED=false; return; }
      var meaningful=meaningfulOf(ev.target);
      var path=pathFor(meaningful);
      var text=(meaningful.innerText||'').slice(0,80);
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
    var hovered=null;
    document.addEventListener('mouseover',function(ev){
      if(DRAG) return;
      var m=meaningfulOf(ev.target);
      if(hovered && hovered!==m) hovered.classList.remove('lov-manual-hover');
      if(m && m.classList){ m.classList.add('lov-manual-hover'); hovered=m; }
    },true);
    document.addEventListener('mouseout',function(ev){
      if(DRAG) return;
      var m=meaningfulOf(ev.target);
      if(m && m.classList) m.classList.remove('lov-manual-hover');
    },true);

    // ----- Free drag to reposition -----
    var badge=null;
    function showBadge(x,y,ox,oy){
      if(!badge){
        badge=document.createElement('div');
        badge.className='lov-drag-badge';
        document.body.appendChild(badge);
      }
      badge.style.left=(x+14)+'px';
      badge.style.top=(y+14)+'px';
      badge.textContent='↔ '+Math.round(ox)+'px  ↕ '+Math.round(oy)+'px';
    }
    function hideBadge(){ if(badge && badge.parentNode){ badge.parentNode.removeChild(badge); } badge=null; }

    document.addEventListener('mousedown',function(ev){
      if(ev.button!==0) return;
      var m=meaningfulOf(ev.target);
      if(!m || m===document.body) return;
      ev.preventDefault();
      var baseX=parseFloat(m.getAttribute('data-lov-ox')||'0')||0;
      var baseY=parseFloat(m.getAttribute('data-lov-oy')||'0')||0;
      DRAG={el:m, startX:ev.clientX, startY:ev.clientY, baseX:baseX, baseY:baseY, ox:baseX, oy:baseY, moved:false};
      m.classList.add('lov-manual-dragging');
      document.body.classList.add('lov-manual-dragging-active');
    },true);

    document.addEventListener('mousemove',function(ev){
      if(!DRAG) return;
      ev.preventDefault();
      var dx=ev.clientX-DRAG.startX;
      var dy=ev.clientY-DRAG.startY;
      if(Math.abs(dx)>3 || Math.abs(dy)>3) DRAG.moved=true;
      DRAG.ox=DRAG.baseX+dx;
      DRAG.oy=DRAG.baseY+dy;
      DRAG.el.style.setProperty('transform','translate('+DRAG.ox+'px,'+DRAG.oy+'px)','important');
      DRAG.el.style.setProperty('position','relative','important');
      DRAG.el.style.setProperty('z-index','3','important');
      showBadge(ev.clientX,ev.clientY,DRAG.ox,DRAG.oy);
    },true);

    document.addEventListener('mouseup',function(ev){
      if(!DRAG) return;
      var d=DRAG; DRAG=null;
      d.el.classList.remove('lov-manual-dragging');
      document.body.classList.remove('lov-manual-dragging-active');
      hideBadge();
      if(d.moved){
        JUST_DRAGGED=true;
        var path=pathFor(d.el);
        d.el.setAttribute('data-lov-ox',String(d.ox));
        d.el.setAttribute('data-lov-oy',String(d.oy));
        document.querySelectorAll('.lov-manual-selected').forEach(function(n){n.classList.remove('lov-manual-selected');});
        d.el.classList.add('lov-manual-selected');
        try{window.parent.postMessage({__lovManualDrag:true, path:path, offsetX:Math.round(d.ox), offsetY:Math.round(d.oy), text:(d.el.innerText||'').slice(0,80)},'*');}catch(e){}
      }
    },true);
  }

  // Auto-fix request from parent
  window.addEventListener('message',function(ev){
    var d=ev.data;
    if(!d) return;
    if(d.__lovRequestAutoFix){
      var SAFE_TOP=parseInt(d.safeTopPx,10)||0;
      var SAFE_BOTTOM=parseInt(d.safeBottomPx,10)||0;
      var SEL=(d.selectors||'h1,h2,h3,h4,li,tr,.stage-card,.summary-card,.card');
      var newPaths=[];
      var pushes=[];
      var seen={};
      document.querySelectorAll(SEL).forEach(function(el){
        var r=el.getBoundingClientRect();
        if(r.height<=0) return;
        var top=r.top+window.scrollY;
        var bottom=top+r.height;
        var startPage=Math.floor(top/H);
        var endPage=Math.floor((bottom-1)/H);
        var topInPage=top - startPage*H;
        var bottomInPage=bottom - endPage*H;
        // Elements taller than ~a full page can't be saved by a page break —
        // pushing them only creates blank pages. Skip them.
        var tooTall = r.height >= H*0.92;
        var crosses=endPage>startPage && !tooTall;
        var hitsHeader=topInPage < SAFE_TOP;
        var hitsFooter=bottomInPage > (H - SAFE_BOTTOM) && !tooTall;
        var path=pathFor(el);
        if(seen[path]) return; seen[path]=true;

        // Skip if an ancestor was already scheduled for a break (avoid double-push)
        var anc=el.parentElement, skip=false;
        while(anc && anc!==document.body){
          var ap=pathFor(anc);
          if(newPaths.indexOf(ap)>=0){ skip=true; break; }
          anc=anc.parentElement;
        }
        if(skip) return;

        // 1) Element starts inside the bottom safe-zone OR crosses a page boundary
        //    → push it to the next page with a clean break
        if(crosses || hitsFooter){
          newPaths.push(path);
          return;
        }
        // 2) Element sits under the header strip → push it down past the safe zone
        if(hitsHeader){
          var delta=Math.ceil(SAFE_TOP - topInPage + 4); // +4px breathing
          if(delta>0 && delta < H*0.5){
            pushes.push({path:path, marginTop:delta});
          }
        }
      });
      try{window.parent.postMessage({__lovAutoFixResult:true, paths:newPaths, pushes:pushes},'*');}catch(e){}
    }
  });

  function setupSafeMasks(){
    try{
      var body=document.body;
      if(!body) return;
      // Remove previous masks
      document.querySelectorAll('.lov-safe-mask').forEach(function(n){ n.parentNode && n.parentNode.removeChild(n); });
      var PH=parseInt(body.getAttribute('data-page-height')||'1123',10) || 1123;
      var docH=Math.max(document.documentElement.scrollHeight, body.scrollHeight, PH);
      var pageCount=Math.max(1, Math.ceil(docH/PH));
      // Ensure body is positioned so absolute masks anchor to it
      var bs=getComputedStyle(body);
      if(bs.position==='static') body.style.position='relative';
      for(var i=0;i<pageCount;i++){
        if(SAFE_TOP_PX>0){
          var mt=document.createElement('div');
          mt.className='lov-safe-mask lov-safe-mask-top';
          mt.style.top=(i*PH)+'px';
          mt.style.height=SAFE_TOP_PX+'px';
          body.appendChild(mt);
        }
        if(SAFE_BOTTOM_PX>0){
          var mb=document.createElement('div');
          mb.className='lov-safe-mask lov-safe-mask-bottom';
          mb.style.top=((i+1)*PH - SAFE_BOTTOM_PX)+'px';
          mb.style.height=SAFE_BOTTOM_PX+'px';
          body.appendChild(mb);
        }
      }
    }catch(e){ /* noop */ }
  }

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

  // Defensive runtime pass: walk every strip element and re-assert that its
  // z-index is strictly above any mask, regardless of inline styles or
  // user CSS authored inside the quote HTML. Idempotent — safe to re-run.
  function enforceLayerOrder(){
    try{
      var STRIP_SEL='.lov-repeat-overlay-header,.lov-repeat-overlay-footer,.print-repeat-header,.print-repeat-footer,.header-strip,.quote-fixed-header,.quote-fixed-footer,.footer,.header';
      var STRIP_Z='2147483600';
      var MASK_Z='2147482000';
      document.querySelectorAll('.lov-safe-mask').forEach(function(n){
        n.style.setProperty('z-index', MASK_Z, 'important');
        n.style.setProperty('position', 'absolute', 'important');
      });
      document.querySelectorAll(STRIP_SEL).forEach(function(n){
        var cs=getComputedStyle(n);
        if(cs.position==='static') n.style.setProperty('position','relative','important');
        n.style.setProperty('z-index', STRIP_Z, 'important');
        // Promote inner painters too (td/div children of thead/tfoot etc.)
        n.querySelectorAll('td,th,div,img,svg').forEach(function(c){
          var ccs=getComputedStyle(c);
          if(ccs.position==='static') c.style.position='relative';
          c.style.zIndex=STRIP_Z;
        });
      });
      // Body must form a stacking context so our layers can't be trapped.
      document.body.style.isolation='isolate';
      if(getComputedStyle(document.body).position==='static'){
        document.body.style.position='relative';
      }
    }catch(e){ /* noop */ }
  }

  // Auto-cut: push content out of strip zones onto the next page.
  // Walks elements that can absorb a margin push and adds a top margin large
  // enough to escape the strip. Runs iteratively because each push may shift
  // siblings. Idempotent via data-lov-cut marker.
  function autoCutStrips(){
    if(!AUTO_ENFORCE) return;
    try{
      var SEL=PROTECT_SEL || 'h1,h2,h3,h4,h5,p,li,tr,table,figure,blockquote,.stage-card,.summary-card,.card';
      var maxIter=4;
      for(var iter=0;iter<maxIter;iter++){
        var changed=false;
        document.querySelectorAll(SEL).forEach(function(el){
          if(!el || !el.getBoundingClientRect) return;
          if(el.closest && (el.closest('.lov-repeat-overlay')||el.closest('.print-repeat-header')||el.closest('.print-repeat-footer')||el.closest('.lov-safe-mask'))) return;
          var r=el.getBoundingClientRect();
          if(r.height<=0||r.height>=H*0.92) return;
          var top=r.top+window.scrollY;
          var bottom=top+r.height;
          var startPage=Math.floor(top/H);
          var endPage=Math.floor((bottom-1)/H);
          var topInPage=top - startPage*H;
          var bottomInPage=bottom - endPage*H;
          var hitsHeader=topInPage < SAFE_TOP_PX;
          var hitsFooter=bottomInPage > (H - SAFE_BOTTOM_PX);
          var crosses=endPage>startPage;
          var delta=0;
          if(hitsHeader){
            // push down past the top strip on the same page
            delta=Math.ceil(SAFE_TOP_PX - topInPage + 4);
          } else if(hitsFooter || crosses){
            // push to the next page below the strip
            delta=Math.ceil((H - topInPage) + SAFE_TOP_PX + 4);
          }
          if(delta>0 && delta<H*1.5){
            var cur=parseInt(el.style.marginTop||'0',10)||0;
            el.style.marginTop=(cur+delta)+'px';
            el.setAttribute('data-lov-cut','1');
            changed=true;
          }
        });
        if(!changed) break;
      }
    }catch(e){ /* noop */ }
  }

  // Delete pages: hide any top-level body child whose vertical midpoint
  // falls inside a deleted page range; remaining content reflows up.
  function applyDeletedPages(){
    if(!DELETED_PAGES || !DELETED_PAGES.length) return;
    try{
      var ranges=DELETED_PAGES.map(function(i){ return [i*H, (i+1)*H]; });
      var children=document.body.children;
      for(var i=0;i<children.length;i++){
        var c=children[i];
        if(c.classList && (c.classList.contains('lov-safe-mask')||c.classList.contains('lov-repeat-overlay'))) continue;
        var r=c.getBoundingClientRect();
        if(r.height<=0) continue;
        var mid=r.top+window.scrollY+r.height/2;
        for(var k=0;k<ranges.length;k++){
          if(mid>=ranges[k][0] && mid<=ranges[k][1]){
            c.style.display='none';
            break;
          }
        }
      }
    }catch(e){ /* noop */ }
  }

  function init(){
    try{
      document.body.setAttribute('data-safe-top', String(SAFE_TOP_PX));
      document.body.setAttribute('data-safe-bottom', String(SAFE_BOTTOM_PX));
      document.body.setAttribute('data-protect-sel', PROTECT_SEL);
    }catch(e){}
    tagAutoPaths();
    applyDeletedPages();
    autoCutStrips();
    setupRepeatOverlays();
    setupSafeMasks();
    enforceLayerOrder();
    setTimeout(detectIssues,300);
    // Re-run setup after content settles (fonts/images)
    setTimeout(function(){
      applyDeletedPages();
      autoCutStrips();
      setupRepeatOverlays();
      setupSafeMasks();
      enforceLayerOrder();
      try{window.parent.postMessage({__lovPageCountUpdate:true, h:document.documentElement.scrollHeight},'*');}catch(e){}
    },600);
    setTimeout(function(){ enforceLayerOrder(); },1500);
  }
  if(document.readyState==='complete') setTimeout(init,200);
  else window.addEventListener('load',function(){setTimeout(init,200);});
})();
</script>`;
    const injection = `${enforceCss}${highlightCss}${manualCss}${fixCssBlock}${script}`;
    return html.includes("</body>")
      ? html.replace("</body>", `${injection}</body>`)
      : `${html}${injection}`;
  }, [html, highlightIssues, manualMode, paginationCss, fixState.autoPaths, fixState.manual, fixState.safeZoneTopMm, fixState.safeZoneBottomMm, fixState.protectedBlocks, fixState.autoEnforceStrips, fixState.deletedPages]);

  // Measure
  const handleMeasureLoad = useCallback(() => {
    const iframe = measureRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const measure = () => {
        const body = doc.body;
        const h = Math.max(
          doc.documentElement.scrollHeight || 0,
          body?.scrollHeight || 0,
          doc.documentElement.offsetHeight || 0,
          body?.offsetHeight || 0,
          A4_H,
        );
        setContentH(h);
        setPageCount(Math.max(1, Math.ceil(h / A4_H)));
      };
      setTimeout(measure, 350);
      setTimeout(measure, 900);
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
      if (d.__lovManualDrag && d.path) {
        const ox = typeof d.offsetX === "number" ? d.offsetX : 0;
        const oy = typeof d.offsetY === "number" ? d.offsetY : 0;
        setFixState((s) => {
          const idx = s.manual.findIndex((m) => m.path === d.path);
          const next = [...s.manual];
          if (idx >= 0) next[idx] = { ...next[idx], offsetX: ox, offsetY: oy };
          else next.push({ path: d.path, offsetX: ox, offsetY: oy });
          return { ...s, manual: next };
        });
        setSelectedManual({ path: d.path, text: d.text || "" });
      }
      if (d.__lovAutoFixResult && Array.isArray(d.paths)) {
        const pushes: Array<{ path: string; marginTop: number }> = Array.isArray(d.pushes) ? d.pushes : [];
        const found = d.paths.length + pushes.length;
        if (found > 0) {
          setFixState((s) => {
            const uniqueAuto = Array.from(new Set([...s.autoPaths, ...d.paths]));
            // Merge pushes into manual rules (overwrite marginTop for same path)
            const manualMap = new Map(s.manual.map((m) => [m.path, m]));
            pushes.forEach((p) => {
              const existing = manualMap.get(p.path) || { path: p.path };
              manualMap.set(p.path, { ...existing, marginTop: p.marginTop });
            });
            return {
              ...s,
              globalEnabled: true,
              autoPaths: uniqueAuto,
              manual: Array.from(manualMap.values()),
            };
          });
          autoFixCumulativeRef.current += found;
        }

        // Iterate: pushing elements shifts the layout, which can reveal new
        // page-break issues. Re-analyse the (reloaded) preview until it
        // converges or we hit the pass limit.
        if (found > 0 && autoFixIterRef.current < MAX_AUTOFIX_PASSES - 1) {
          autoFixIterRef.current += 1;
          // Wait for the iframe to reload with the new pagination CSS and relayout.
          setTimeout(() => {
            postAutoFixRequest();
          }, 950);
        } else {
          setAutoFixing(false);
          const total = autoFixCumulativeRef.current;
          if (total > 0) {
            toast.success(`תוקנו ${total} בעיות עימוד`, {
              description: `הניתוח רץ ב-${autoFixIterRef.current + 1} מעברים עד להתכנסות`,
            });
          } else {
            toast.info("לא נמצאו בעיות עימוד לתיקון", {
              description: "המסמך נראה תקין, או שהבעיות דורשות התאמה ידנית",
            });
          }
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onJumpToEditor, fixState.autoPaths]);

  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
    if (comparePage >= pageCount) setComparePage(Math.max(0, pageCount - 1));
  }, [pageCount, page, comparePage]);

  // Keyboard navigation: ←/→ for pages, Space/Shift+Space scroll.
  // Capture phase prevents Radix Tabs from stealing arrows and switching editor tabs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        setPage((p) => Math.min(pageCount - 1, p + 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        setPage((p) => Math.max(0, p - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        e.stopPropagation();
        setPage(0);
      } else if (e.key === "End") {
        e.preventDefault();
        e.stopPropagation();
        setPage(Math.max(0, pageCount - 1));
      } else if (e.key === "PageDown") {
        e.preventDefault();
        e.stopPropagation();
        setPage((p) => Math.min(pageCount - 1, p + 1));
      } else if (e.key === "PageUp") {
        e.preventDefault();
        e.stopPropagation();
        setPage((p) => Math.max(0, p - 1));
      } else if (e.key === " ") {
        const scroller = scrollerRef.current;
        if (scroller) {
          e.preventDefault();
          e.stopPropagation();
          scroller.scrollBy({
            top: e.shiftKey ? -scroller.clientHeight * 0.9 : scroller.clientHeight * 0.9,
            behavior: "smooth",
          });
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [pageCount]);

  // Find the live iframe for sending messages
  const findLiveIframe = useCallback((): HTMLIFrameElement | null => {
    const list = document.querySelectorAll<HTMLIFrameElement>("iframe");
    for (const ifr of Array.from(list)) {
      if (ifr === measureRef.current) continue;
      if ((ifr.title || "").startsWith("page-")) return ifr;
    }
    return null;
  }, []);

  // Auto-detect safe zones from the rendered preview:
  // - top: read .header-strip OR .header height
  // - bottom: read .footer OR .quote-fixed-footer height
  const autoDetectSafeZones = useCallback(() => {
    const ifr = findLiveIframe();
    const doc = ifr?.contentDocument;
    if (!doc) {
      toast.error("לא ניתן לזהות אוטומטית — התצוגה לא טעונה");
      return;
    }
    const PX_PER_MM = 3.7795;
    const topEl =
      doc.querySelector<HTMLElement>(".header-strip") ||
      doc.querySelector<HTMLElement>(".header") ||
      doc.querySelector<HTMLElement>(".quote-fixed-header");
    const bottomEl =
      doc.querySelector<HTMLElement>(".footer") ||
      doc.querySelector<HTMLElement>(".quote-fixed-footer");
    const topPx = topEl?.getBoundingClientRect().height || 0;
    const bottomPx = bottomEl?.getBoundingClientRect().height || 0;
    const topMm = Math.max(0, Math.min(60, Math.round(topPx / PX_PER_MM)));
    const bottomMm = Math.max(0, Math.min(60, Math.round(bottomPx / PX_PER_MM)));
    if (!topPx && !bottomPx) {
      toast.message("לא נמצאו סטריפים בתצוגה");
      return;
    }
    setFixState((s) => ({
      ...s,
      safeZoneTopMm: topPx ? topMm : s.safeZoneTopMm,
      safeZoneBottomMm: bottomPx ? bottomMm : s.safeZoneBottomMm,
    }));
    toast.success(`זוהה: עליון ${topMm}מ"מ · תחתון ${bottomMm}מ"מ`);
  }, [findLiveIframe]);

  // Post a single auto-fix analysis request to the live iframe.
  const postAutoFixRequest = useCallback((): boolean => {
    const ifr = findLiveIframe();
    if (!ifr || !ifr.contentWindow) return false;
    const safeTopPx = Math.round(fixState.safeZoneTopMm * 3.7795);
    const safeBottomPx = Math.round(fixState.safeZoneBottomMm * 3.7795);
    const selectors = (fixState.protectedBlocks.length
      ? fixState.protectedBlocks
      : DEFAULT_PROTECTED
    ).join(",");
    try {
      ifr.contentWindow.postMessage(
        { __lovRequestAutoFix: true, safeTopPx, safeBottomPx, selectors },
        "*",
      );
      return true;
    } catch {
      return false;
    }
  }, [findLiveIframe, fixState.safeZoneTopMm, fixState.safeZoneBottomMm, fixState.protectedBlocks]);

  const handleAutoFix = useCallback(() => {
    autoFixIterRef.current = 0;
    autoFixCumulativeRef.current = 0;
    const ok = postAutoFixRequest();
    if (!ok) {
      // Fall back: just enable global CSS
      setFixState((s) => ({ ...s, globalEnabled: true }));
      toast.success("הופעל תיקון עימוד גלובלי");
      return;
    }
    setAutoFixing(true);
    // Safety timeout in case a pass never reports back
    setTimeout(() => setAutoFixing(false), 12000);
  }, [postAutoFixRequest]);

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
    setExporting(true);
    // Render finalHtml in a hidden iframe attached to the main document, then
    // run html2canvas on its body. html2canvas can't capture iframes wrapped in
    // a transformed/scaled container — that's why the previous version produced
    // blank PNGs.
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `position:fixed;left:-99999px;top:0;width:${A4_W}px;height:${Math.max(contentH, A4_H)}px;border:0;background:#ffffff;`;
    document.body.appendChild(iframe);
    try {
      await new Promise<void>((resolve, reject) => {
        iframe.onload = () => resolve();
        iframe.onerror = () => reject(new Error("iframe load failed"));
        iframe.srcdoc = finalHtml;
      });
      await new Promise((r) => setTimeout(r, 400));
      const doc = iframe.contentDocument;
      const body = doc?.body;
      if (!doc || !body) throw new Error("no iframe document");
      const imgs = Array.from(doc.images || []);
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((res) => {
              if (img.complete) return res();
              img.onload = () => res();
              img.onerror = () => res();
            }),
        ),
      );
      const fullCanvas = await html2canvas(body, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: A4_W,
        height: Math.max(contentH, A4_H),
        windowWidth: A4_W,
        windowHeight: Math.max(contentH, A4_H),
      });
      const out = document.createElement("canvas");
      out.width = A4_W * 2;
      out.height = A4_H * 2;
      const ctx = out.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(
          fullCanvas,
          0,
          page * A4_H * 2,
          A4_W * 2,
          A4_H * 2,
          0,
          0,
          A4_W * 2,
          A4_H * 2,
        );
      }
      const link = document.createElement("a");
      link.download = `${templateName || "quote"}-page-${page + 1}.png`;
      link.href = out.toDataURL("image/png");
      link.click();
      toast.success("הדף נשמר כתמונה");
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בייצוא התמונה");
    } finally {
      try { document.body.removeChild(iframe); } catch { /* */ }
      setExporting(false);
    }
  }, [page, templateName, finalHtml, contentH]);

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
  ) => {
    const safeTopPx = fixState.safeZoneTopMm * PX_PER_MM * scale;
    const safeBottomPx = fixState.safeZoneBottomMm * PX_PER_MM * scale;
    return (
      <div
        data-page-index={pageIdx}
        ref={(el) => {
          if (el) {
            pageContainersRef.current.set(pageIdx, el);
            // Make sure the initial strip visuals are in sync with fixState
            // (especially after zoom / mode switches that recreate containers).
            requestAnimationFrame(() => {
              updateSafeZoneVisuals(
                fixState.safeZoneTopMm,
                fixState.safeZoneBottomMm,
                scale,
              );
            });
          } else {
            pageContainersRef.current.delete(pageIdx);
          }
        }}
        className="relative bg-card shadow-md border border-border"
        style={{
          width: A4_W * scale,
          height: A4_H * scale,
          overflow: "hidden",
        }}
      >
      <div
        style={{
          width: A4_W * scale,
          height: Math.max(contentH, A4_H) * scale,
          position: "relative",
          pointerEvents: interactive ? "auto" : "none",
        }}
      >
        <iframe
          title={`page-${pageIdx + 1}${label ? "-" + label : ""}`}
          srcDoc={finalHtml}
          style={{
            position: "absolute",
            left: 0,
            top: -pageIdx * A4_H * scale,
            width: A4_W,
            height: Math.max(contentH, A4_H),
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: 0,
            display: "block",
            background: "white",
          }}
        />
      </div>
      {showSafeZones && (
        <>
          {/* Top strip background — visually marks the reserved logo area. */}
          <div
            data-safe-bg="top"
            className="absolute left-0 right-0 top-0 pointer-events-none z-10"
            style={{
              height: safeTopPx,
              background:
                "repeating-linear-gradient(45deg, hsl(var(--accent) / 0.08), hsl(var(--accent) / 0.08) 10px, hsl(var(--accent) / 0.04) 10px, hsl(var(--accent) / 0.04) 20px)",
            }}
          />
          {/* Bottom strip background — visually marks the reserved footer area. */}
          <div
            data-safe-bg="bottom"
            className="absolute left-0 right-0 bottom-0 pointer-events-none z-10"
            style={{
              height: safeBottomPx,
              background:
                "repeating-linear-gradient(45deg, hsl(var(--accent) / 0.08), hsl(var(--accent) / 0.08) 10px, hsl(var(--accent) / 0.04) 10px, hsl(var(--accent) / 0.04) 20px)",
            }}
          />

          {/* Top safe-zone boundary — draggable dashed line. */}
          <div
            data-safe-line="top"
            className="absolute left-0 right-0 group z-50"
            style={{
              top: safeTopPx,
              height: 24,
              marginTop: -12,
              cursor: interactive ? "ns-resize" : "default",
              pointerEvents: interactive ? "auto" : "none",
            }}
            title={
              interactive
                ? "גרור לשינוי גובה הסטריפ העליון (קפיצות של 1 מ\"מ)"
                : undefined
            }
            onMouseDown={startSafeZoneDrag("top", scale)}
            aria-label="גרור לשינוי גובה סטריפ עליון"
          >
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 transition-all"
              style={{
                borderTop: "2px dashed hsl(var(--accent))",
                boxShadow: "0 0 0 1px hsl(var(--accent) / 0.25)",
              }}
            />
            <span
              data-safe-label="top"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-semibold px-1.5 py-0.5 rounded-sm select-none pointer-events-none whitespace-nowrap"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--primary))",
                lineHeight: 1,
              }}
            >
              סטריפ עליון · {fixState.safeZoneTopMm} מ"מ
            </span>
          </div>

          {/* Bottom safe-zone boundary — draggable dashed line. */}
          <div
            data-safe-line="bottom"
            className="absolute left-0 right-0 group z-50"
            style={{
              bottom: safeBottomPx,
              height: 24,
              marginBottom: -12,
              cursor: interactive ? "ns-resize" : "default",
              pointerEvents: interactive ? "auto" : "none",
            }}
            title={
              interactive
                ? "גרור לשינוי גובה הסטריפ התחתון (קפיצות של 1 מ\"מ)"
                : undefined
            }
            onMouseDown={startSafeZoneDrag("bottom", scale)}
            aria-label="גרור לשינוי גובה סטריפ תחתון"
          >
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 transition-all"
              style={{
                borderTop: "2px dashed hsl(var(--accent))",
                boxShadow: "0 0 0 1px hsl(var(--accent) / 0.25)",
              }}
            />
            <span
              data-safe-label="bottom"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-semibold px-1.5 py-0.5 rounded-sm select-none pointer-events-none whitespace-nowrap"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--primary))",
                lineHeight: 1,
              }}
            >
              סטריפ תחתון · {fixState.safeZoneBottomMm} מ"מ
            </span>
          </div>
        </>
      )}

      <div className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-foreground/70 text-background pointer-events-none">
        {label ? `${label} · ` : ""}
        {pageIdx + 1} / {pageCount}
      </div>

      {interactive && (
        <button
          type="button"
          title="מחק את הדף הזה (התוכן יוסר)"
          onClick={(e) => {
            e.stopPropagation();
            if (!confirm(`למחוק את עמוד ${pageIdx + 1}? התוכן שעליו יוסר מההצגה.`)) return;
            setFixState((s) => ({
              ...s,
              deletedPages: Array.from(new Set([...(s.deletedPages || []), pageIdx])).sort((a, b) => a - b),
            }));
          }}
          className="absolute top-1 left-1 z-[60] text-[10px] font-semibold px-2 py-1 rounded bg-destructive text-destructive-foreground shadow hover:opacity-90"
        >
          🗑 מחק דף
        </button>
      )}

  useEffect(() => {
    if (mode === "single" || mode === "compare") return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const target = scroller.querySelector<HTMLElement>(`[data-page-index="${page}"]`);
    if (!target) return;
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [mode, page]);

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
            variant={mode === "continuous" ? "default" : "ghost"}
            className="h-8 text-xs"
            onClick={() => setMode("continuous")}
          >
            <FileText className="h-3.5 w-3.5 ml-1.5" />
            רציף
          </Button>
          <Button
            size="sm"
            variant={mode === "spread" ? "default" : "ghost"}
            className="h-8 text-xs"
            onClick={() => setMode("spread")}
          >
            <SplitSquareHorizontal className="h-3.5 w-3.5 ml-1.5" />
            כפולה
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

        {pageCount > 1 && (
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
            title="זיהוי אוטומטי של בעיות + הטמעת CSS מקצועי + מעברי דף + הזחה מאזורי בטיחות"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {autoFixing ? "מתקן..." : "תקן עימוד"}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="הגדרות תיקון עימוד"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 p-4 space-y-4"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-safe-zones"
                    checked={showSafeZones}
                    onCheckedChange={(v) => setShowSafeZones(!!v)}
                  />
                  <Label htmlFor="show-safe-zones" className="text-xs font-semibold cursor-pointer">
                    הצג קווי גבול סטריפים
                  </Label>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-[11px] gap-1"
                  onClick={autoDetectSafeZones}
                  title="זיהוי אוטומטי לפי גובה הסטריפ העליון/תחתון בתבנית"
                >
                  <Wand2 className="h-3 w-3" />
                  זיהוי אוטומטי
                </Button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold">
                    אזור בטיחות עליון (סטריפ כותרת)
                  </Label>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {fixState.safeZoneTopMm} מ"מ
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {[10, 15, 20, 25, 30].map((mm) => (
                    <Button
                      key={mm}
                      size="sm"
                      variant={
                        fixState.safeZoneTopMm === mm ? "default" : "outline"
                      }
                      className="h-7 px-2 text-[11px]"
                      onClick={() =>
                        setFixState((s) => ({ ...s, safeZoneTopMm: mm }))
                      }
                    >
                      {mm}
                    </Button>
                  ))}
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={fixState.safeZoneTopMm}
                    onChange={(e) =>
                      setFixState((s) => ({
                        ...s,
                        safeZoneTopMm: Math.max(
                          0,
                          Math.min(60, Number(e.target.value) || 0),
                        ),
                      }))
                    }
                    className="h-7 w-16 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold">
                    אזור בטיחות תחתון (סטריפ פוטר)
                  </Label>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {fixState.safeZoneBottomMm} מ"מ
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {[10, 15, 20, 25].map((mm) => (
                    <Button
                      key={mm}
                      size="sm"
                      variant={
                        fixState.safeZoneBottomMm === mm ? "default" : "outline"
                      }
                      className="h-7 px-2 text-[11px]"
                      onClick={() =>
                        setFixState((s) => ({ ...s, safeZoneBottomMm: mm }))
                      }
                    >
                      {mm}
                    </Button>
                  ))}
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={fixState.safeZoneBottomMm}
                    onChange={(e) =>
                      setFixState((s) => ({
                        ...s,
                        safeZoneBottomMm: Math.max(
                          0,
                          Math.min(60, Number(e.target.value) || 0),
                        ),
                      }))
                    }
                    className="h-7 w-16 text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-xs font-semibold mb-2 block">
                  בלוקים מוגנים (לא יחתכו)
                </Label>
                <div className="space-y-1.5 max-h-48 overflow-auto pr-1">
                  {[
                    { sel: "h1,h2,h3,h4", label: "כותרות (h1-h4)" },
                    { sel: "tr,table", label: "טבלאות ושורות" },
                    { sel: "ul,ol,li", label: "רשימות ופריטים" },
                    { sel: ".stage-card,.summary-card,.card", label: "כרטיסים" },
                    { sel: "figure,blockquote", label: "תיבות מודגשות / מסגרות" },
                    { sel: ".signature-block", label: "בלוק חתימה" },
                  ].map(({ sel, label }) => {
                    const parts = sel.split(",");
                    const allOn = parts.every((p) =>
                      fixState.protectedBlocks.includes(p),
                    );
                    return (
                      <label
                        key={sel}
                        className="flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <Checkbox
                          checked={allOn}
                          onCheckedChange={(v) => {
                            setFixState((s) => {
                              const set = new Set(s.protectedBlocks);
                              if (v) parts.forEach((p) => set.add(p));
                              else parts.forEach((p) => set.delete(p));
                              return {
                                ...s,
                                protectedBlocks: Array.from(set),
                              };
                            });
                          }}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t text-[11px] text-muted-foreground leading-relaxed">
                שיטה: הזחה דינמית של אלמנטים שמתחת לסטריפים +
                page-break-before לבלוקים שנחתכים. הלחיצה על "תקן עימוד" תפעיל
                את הניתוח לפי ההגדרות האלה.
              </div>
            </PopoverContent>
          </Popover>
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
            <Move className="h-3 w-3" />
            גרור אלמנט בתצוגה כדי להזיז · לחיצה פותחת עריכה
          </span>
        )}

        <div className="flex-1" />

        <span className="hidden lg:inline-flex text-[11px] text-muted-foreground">
          חצים ←/→ עוברים דפים · Space גולל
        </span>

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
      <div ref={scrollerRef} className="pages-preview-scroll flex-1 overflow-auto p-6" dir="ltr">
        {mode === "single" && (
          <div className="flex justify-center">
            <div ref={captureRef}>{renderPageViewport(page, zoom, true)}</div>
          </div>
        )}

        {mode === "continuous" && (
          <div className="flex flex-col gap-8 items-center pb-8">
            {Array.from({ length: pageCount }).map((_, i) => (
              <div key={i}>{renderPageViewport(i, zoom, true)}</div>
            ))}
          </div>
        )}

        {mode === "spread" && (
          <div className="flex flex-col gap-8 items-center pb-8">
            {Array.from({ length: Math.ceil(pageCount / 2) }).map((_, spreadIdx) => {
              const right = spreadIdx * 2;
              const left = right + 1;
              return (
                <div key={spreadIdx} className="flex flex-wrap gap-6 justify-center items-start">
                  {renderPageViewport(right, zoom * 0.78, true)}
                  {left < pageCount ? (
                    renderPageViewport(left, zoom * 0.78, true)
                  ) : (
                    <div
                      className="border border-dashed border-border/70 bg-muted/40"
                      style={{ width: A4_W * zoom * 0.78, height: A4_H * zoom * 0.78 }}
                    />
                  )}
                </div>
              );
            })}
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

            {/* Free-drag offset (set by dragging in the preview) */}
            <div className="space-y-1.5 pt-1 border-t">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium flex items-center gap-1">
                  <Move className="h-3 w-3" />
                  מיקום חופשי (גרירה)
                </label>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  ↔ {currentManualRule?.offsetX ?? 0} · ↕{" "}
                  {currentManualRule?.offsetY ?? 0}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                גרור את האלמנט ישירות בתצוגה כדי למקם אותו. אפשר גם לדייק בחיצים:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() =>
                    upsertManualRule(selectedManual.path, {
                      offsetX: (currentManualRule?.offsetX ?? 0) - 5,
                    })
                  }
                >
                  <ArrowLeft className="h-3 w-3 ml-1" />
                  שמאלה
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() =>
                    upsertManualRule(selectedManual.path, {
                      offsetX: (currentManualRule?.offsetX ?? 0) + 5,
                    })
                  }
                >
                  <ArrowRight className="h-3 w-3 ml-1" />
                  ימינה
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() =>
                    upsertManualRule(selectedManual.path, {
                      offsetY: (currentManualRule?.offsetY ?? 0) - 5,
                    })
                  }
                >
                  <ArrowUp className="h-3 w-3 ml-1" />
                  למעלה
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() =>
                    upsertManualRule(selectedManual.path, {
                      offsetY: (currentManualRule?.offsetY ?? 0) + 5,
                    })
                  }
                >
                  <ArrowDown className="h-3 w-3 ml-1" />
                  למטה
                </Button>
              </div>
              {((currentManualRule?.offsetX ?? 0) !== 0 ||
                (currentManualRule?.offsetY ?? 0) !== 0) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] w-full text-muted-foreground"
                  onClick={() =>
                    upsertManualRule(selectedManual.path, {
                      offsetX: 0,
                      offsetY: 0,
                    })
                  }
                >
                  <RotateCcw className="h-3 w-3 ml-1" />
                  אפס מיקום גרירה
                </Button>
              )}
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
