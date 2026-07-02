// FlowCompareView — תצוגת השוואה זו-לצד-זו בין העורך לתצוגה המקדימה,
// עם מונה עמודים ומחוון האם שבירת העמודים זהה.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Columns2, Eye, Pencil } from "lucide-react";
import type { QuoteTemplate } from "../types";
import type { DesignPresetConfig } from "./presets/types";
import type { FlowPageSetup } from "./types";
import FlowEditor from "./editor/FlowEditor";
import FlowPreviewTab from "./FlowPreviewTab";

interface Props {
  template: QuoteTemplate;
  html: string;
  onChange: (html: string) => void;
  preset?: DesignPresetConfig;
  pageSetup?: FlowPageSetup;
  projectDetails?: any;
  designSettings?: any;
  onDesignSettingsChange?: any;
}

type BreakInfo = { count: number; positionsMm: number[] };

const PX_PER_MM = 96 / 25.4;

function measureEditorBreaks(root: HTMLElement | null): BreakInfo {
  if (!root) return { count: 0, positionsMm: [] };
  // PaginationPlus מוסיף אלמנטים עם class .rm-page-break או data-pagination-break
  const nodes = root.querySelectorAll<HTMLElement>(
    ".rm-page-break, [data-pagination-break], .breaker, .page-break",
  );
  const positions: number[] = [];
  const rootRect = root.getBoundingClientRect();
  nodes.forEach((el) => {
    const rect = el.getBoundingClientRect();
    positions.push(Math.round((rect.top - rootRect.top) / PX_PER_MM));
  });
  return { count: nodes.length + 1, positionsMm: positions };
}

function measurePreviewBreaks(root: HTMLElement | null): BreakInfo {
  if (!root) return { count: 0, positionsMm: [] };
  const pages = root.querySelectorAll<HTMLElement>(".pagedjs_page");
  const positions: number[] = [];
  const rootRect = root.getBoundingClientRect();
  pages.forEach((el, idx) => {
    if (idx === 0) return;
    const rect = el.getBoundingClientRect();
    positions.push(Math.round((rect.top - rootRect.top) / PX_PER_MM));
  });
  return { count: pages.length, positionsMm: positions };
}

const PAGE_WIDTH_PX = (210 * 96) / 25.4;
const FIT_BUFFER_PX = 32;
function computeFit(paneWidth: number) {
  if (!paneWidth) return 1;
  const target = paneWidth - FIT_BUFFER_PX;
  if (target >= PAGE_WIDTH_PX) return 1;
  return Math.max(0.35, target / PAGE_WIDTH_PX);
}

export default function FlowCompareView(props: Props) {
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const previewHostRef = useRef<HTMLDivElement | null>(null);
  const [editorZoom, setEditorZoom] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [editorBreaks, setEditorBreaks] = useState<BreakInfo>({ count: 0, positionsMm: [] });
  const [previewBreaks, setPreviewBreaks] = useState<BreakInfo>({ count: 0, positionsMm: [] });

  useEffect(() => {
    const observe = (el: HTMLElement | null, setter: (n: number) => void) => {
      if (!el) return () => {};
      const ro = new ResizeObserver(() => setter(computeFit(el.clientWidth)));
      ro.observe(el);
      setter(computeFit(el.clientWidth));
      return () => ro.disconnect();
    };
    const c1 = observe(editorHostRef.current, setEditorZoom);
    const c2 = observe(previewHostRef.current, setPreviewZoom);
    return () => { c1(); c2(); };
  }, []);

  // Poll DOM periodically — Paged.js/Pagination Plus אינם פולטים אירועים אחידים.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setEditorBreaks(measureEditorBreaks(editorHostRef.current));
      setPreviewBreaks(measurePreviewBreaks(previewHostRef.current));
      raf = window.setTimeout(tick, 800) as unknown as number;
    };
    tick();
    return () => window.clearTimeout(raf);
  }, [props.html]);

  const diff = useMemo(() => {
    const same = editorBreaks.count === previewBreaks.count;
    const rows: Array<{
      idx: number;
      editor?: number;
      preview?: number;
      diff?: number;
      status: "match" | "diff" | "missing";
    }> = [];
    const max = Math.max(editorBreaks.positionsMm.length, previewBreaks.positionsMm.length);
    for (let i = 0; i < max; i++) {
      const e = editorBreaks.positionsMm[i];
      const p = previewBreaks.positionsMm[i];
      let status: "match" | "diff" | "missing" = "match";
      let d: number | undefined;
      if (e == null || p == null) status = "missing";
      else {
        d = Math.abs(e - p);
        status = d <= 5 ? "match" : "diff";
      }
      rows.push({ idx: i + 1, editor: e, preview: p, diff: d, status });
    }
    return { samePageCount: same, rows };
  }, [editorBreaks, previewBreaks]);

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Header summary */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-background px-3 py-2">
        <Columns2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">השוואה: עריכה ⇄ תצוגה מקדימה</span>
        <Badge variant="outline" className="gap-1">
          <Pencil className="h-3 w-3" /> עורך: {editorBreaks.count} עמ׳
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Eye className="h-3 w-3" /> תצוגה: {previewBreaks.count} עמ׳
        </Badge>
        {diff.samePageCount ? (
          <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
            <CheckCircle2 className="h-3 w-3" /> מספר עמודים זהה
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> פער במספר עמודים
          </Badge>
        )}
        <div className="mr-auto flex flex-wrap items-center gap-1">
          {diff.rows.slice(0, 8).map((r) => (
            <Badge
              key={r.idx}
              variant={r.status === "match" ? "secondary" : r.status === "diff" ? "destructive" : "outline"}
              className="h-5 text-[10px]"
              title={
                r.status === "missing"
                  ? `שבירה #${r.idx}: חסרה בצד אחד`
                  : `שבירה #${r.idx}: עורך ${r.editor}מ״מ · תצוגה ${r.preview}מ״מ · הפרש ${r.diff}מ״מ`
              }
            >
              #{r.idx} {r.status === "match" ? "✓" : r.status === "diff" ? `Δ${r.diff}מ״מ` : "—"}
            </Badge>
          ))}
        </div>
      </div>

      {/* Split view — שני הצדדים בעלי אותה ראשית ציר Y, ללא גלילה אופקית */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col border-l">
          <div className="shrink-0 border-b bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground h-7 flex items-center">
            <Pencil className="ml-1 inline h-3 w-3" /> עורך (Flow Editor)
          </div>
          <div ref={editorHostRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto" style={{ zoom: editorZoom } as React.CSSProperties}>
            <FlowEditor
              initialHtml={props.html}
              onChange={props.onChange}
              preset={props.preset}
              pageSetup={props.pageSetup}
              templateDesignSettings={props.template.design_settings}
              designSettings={props.designSettings}
              onDesignSettingsChange={props.onDesignSettingsChange}
              projectDetails={props.projectDetails}
              toolbarActions={null}
              hideMenuBar
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground h-7 flex items-center">
            <Eye className="ml-1 inline h-3 w-3" /> תצוגה מקדימה (Paged.js)
          </div>
          <div ref={previewHostRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto" style={{ zoom: previewZoom } as React.CSSProperties}>
            <FlowPreviewTab
              template={props.template}
              editedHtml={props.html}
              preset={props.preset}
              projectDetails={props.projectDetails}
              designSettings={props.designSettings}
              pageSetup={props.pageSetup}
              hideToolbar
            />
          </div>
        </div>
      </div>
    </div>
  );
}
