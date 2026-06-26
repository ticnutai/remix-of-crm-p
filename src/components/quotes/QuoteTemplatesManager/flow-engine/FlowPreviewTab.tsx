// Flow Engine — Tab UI
// טאב נקי, מבודד לחלוטין. אין שימוש ב-PreviewIframe / paged-engine / safe masks.
// משתמש ישירות ב-Paged.js Previewer על HTML זורם שמיוצר ע"י renderer.ts.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, RefreshCw, Sparkles } from "lucide-react";
import type { QuoteTemplate } from "../types";
import { serializeTemplate, type MergeData } from "./serializer";
import { renderFlowToHtml } from "./renderer";

interface FlowPreviewTabProps {
  template: QuoteTemplate;
  mergeData?: MergeData;
}

export default function FlowPreviewTab({ template, mergeData }: FlowPreviewTabProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rendering, setRendering] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderToken, setRenderToken] = useState(0);

  const flowDoc = useMemo(
    () => serializeTemplate(template, mergeData),
    [template, mergeData],
  );
  const html = useMemo(() => renderFlowToHtml(flowDoc), [flowDoc]);

  useEffect(() => {
    let cancelled = false;
    const target = containerRef.current;
    if (!target) return;

    setRendering(true);
    setError(null);
    target.innerHTML = "";

    (async () => {
      try {
        // dynamic import כדי לא להעמיס bundle ראשי
        const mod: any = await import("pagedjs");
        if (cancelled) return;
        const Previewer = mod.Previewer || mod.default?.Previewer;
        if (!Previewer) throw new Error("pagedjs Previewer not found");
        const previewer = new Previewer();
        const flow = await previewer.preview(html, [], target);
        if (cancelled) return;
        setPageCount(flow?.total ?? target.querySelectorAll(".pagedjs_page").length);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || String(err));
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [html, renderToken]);

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    // נותן ל-pagedjs רגע להריץ עימוד דרך CSS Paged Media של הדפדפן (להדפסה)
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch {
        /* ignore */
      }
    }, 400);
  };

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">תצוגת Flow (V2) — מנוע עימוד נקי</span>
          {rendering ? (
            <Badge variant="secondary" className="h-5 text-[10px]">
              <Loader2 className="ml-1 h-3 w-3 animate-spin" /> מעמד...
            </Badge>
          ) : pageCount != null ? (
            <Badge variant="secondary" className="h-5 text-[10px]">
              {pageCount} עמודים
            </Badge>
          ) : null}
          {error && (
            <Badge variant="destructive" className="h-5 text-[10px]">
              שגיאה: {error}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRenderToken((n) => n + 1)}
          >
            <RefreshCw className="ml-1 h-3.5 w-3.5" />
            רענן
          </Button>
          <Button type="button" variant="default" size="sm" onClick={handlePrint}>
            <Printer className="ml-1 h-3.5 w-3.5" />
            הדפסה / PDF
          </Button>
        </div>
      </div>

      {/* Render area */}
      <div className="flex-1 overflow-auto p-6">
        <div
          ref={containerRef}
          className="flow-preview-host mx-auto"
          style={{
            // העיצוב הויזואלי של "דפים מודפסים" מסופק ע"י Paged.js עצמו
            // (mc .pagedjs_page) — אנחנו רק נותנים רקע שמסביב.
            minHeight: "100%",
          }}
        />
        <style>{`
          .flow-preview-host .pagedjs_pages {
            display: flex; flex-direction: column; align-items: center; gap: 16px;
          }
          .flow-preview-host .pagedjs_page {
            background: #fff;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          }
        `}</style>
      </div>
    </div>
  );
}
