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
import { htmlToFlowDoc } from "./editor/htmlToFlowDoc";
import type { DesignPresetConfig } from "./presets/types";
import type { FlowPageSetup } from "./types";

interface FlowPreviewTabProps {
  template: QuoteTemplate;
  mergeData?: MergeData;
  /** HTML שנערך בעורך החדש. אם קיים — מקבל עדיפות על פני סריאליזציה מהתבנית. */
  editedHtml?: string;
  preset?: DesignPresetConfig;
  projectDetails?: any;
  designSettings?: any;
  pageSetup?: FlowPageSetup;
}

export default function FlowPreviewTab({
  template,
  mergeData,
  editedHtml,
  preset,
  projectDetails,
  designSettings,
  pageSetup,
}: FlowPreviewTabProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rendering, setRendering] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderToken, setRenderToken] = useState(0);

  const flowDoc = useMemo(() => {
    const doc =
      editedHtml && editedHtml.trim()
        ? htmlToFlowDoc(editedHtml, template, { designSettings })
        : serializeTemplate(template, mergeData, { projectDetails, designSettings });
    return pageSetup ? { ...doc, page: { ...doc.page, ...pageSetup } } : doc;
  }, [template, mergeData, editedHtml, projectDetails, designSettings, pageSetup]);
  const html = useMemo(() => renderFlowToHtml(flowDoc, preset), [flowDoc, preset]);

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
    // משתמשים בתוצר ה-Paged.js שכבר עומד מול המשתמש (containerRef).
    // מעתיקים את אותו DOM לחלון חדש ומוסיפים CSS הדפסה שמבטיח שכל
    // .pagedjs_page יתפוס דף בפועל ב-PDF (break-after: page).
    const target = containerRef.current;
    if (!target || !target.querySelector(".pagedjs_page")) {
      window.alert("התצוגה עוד לא הסתיימה לטעון. נסה שוב בעוד רגע.");
      return;
    }
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) return;
    const printPageSize =
      flowDoc.page.size === "custom"
        ? `${Math.max(50, flowDoc.page.customSizeMm?.width || 210)}mm ${Math.max(
            50,
            flowDoc.page.customSizeMm?.height || 297,
          )}mm`
        : `${flowDoc.page.size}${flowDoc.page.orientation === "landscape" ? " landscape" : ""}`;
    const printDoc = `<!doctype html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<title>${flowDoc.title.replace(/</g, "&lt;")}</title>
<style>
  @page { size: ${printPageSize}; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  *, *::before, *::after { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pagedjs_pages { display: block; }
  .pagedjs_page {
    display: block !important;
    box-shadow: none !important;
    margin: 0 !important;
    page-break-after: always;
    break-after: page;
  }
  .pagedjs_page:last-child { page-break-after: auto; break-after: auto; }
  /* paged.js מציב .pagedjs_pagebox עם רוחב/גובה דף — נשמור עליהם */
  @media print {
    body { background: #fff; }
    .pagedjs_pages { gap: 0 !important; }
  }
</style>
</head>
<body>${target.innerHTML}</body>
</html>`;
    w.document.open();
    w.document.write(printDoc);
    w.document.close();
    const tryPrint = () => {
      try {
        if (!w.document.querySelector(".pagedjs_page")) {
          return window.setTimeout(tryPrint, 150);
        }
        w.focus();
        w.print();
      } catch {
        /* ignore */
      }
    };
    window.setTimeout(tryPrint, 400);
  };

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">תצוגה מקדימה (Flow V2) — לקריאה והדפסה בלבד</span>
          <Badge variant="outline" className="h-5 text-[10px]">העריכה מתבצעת בטאבים האחרים</Badge>
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
