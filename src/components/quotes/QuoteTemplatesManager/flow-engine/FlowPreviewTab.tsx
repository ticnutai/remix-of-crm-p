// Flow Engine — Tab UI
// טאב נקי, מבודד לחלוטין. אין שימוש ב-PreviewIframe / paged-engine / safe masks.
// משתמש ישירות ב-Paged.js Previewer על HTML זורם שמיוצר ע"י renderer.ts.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, RefreshCw, Sparkles, Ruler } from "lucide-react";
import type { QuoteTemplate } from "../types";
import { serializeTemplate, type MergeData } from "./serializer";
import { renderFlowToHtml } from "./renderer";
import { htmlToFlowDoc } from "./editor/htmlToFlowDoc";
import { projectToMergeData } from "./projectTokens";
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

function splitPagedDocument(html: string) {
  if (typeof DOMParser === "undefined") {
    return { content: html, stylesheets: [] as Array<Record<string, string> | string> };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const stylesheets: Array<Record<string, string> | string> = [];
  const content = document.createDocumentFragment();

  doc.querySelectorAll("style:not([data-pagedjs-ignore])").forEach((style, index) => {
    const css = style.textContent || "";
    if (css.trim()) {
      stylesheets.push({ [`${window.location.href}#flow-preview-style-${index}`]: css });
    }
    style.remove();
  });

  doc.querySelectorAll("link[rel='stylesheet']:not([data-pagedjs-ignore])").forEach((link) => {
    const href = (link as HTMLLinkElement).href;
    if (href) stylesheets.push(href);
    link.remove();
  });

  doc.querySelectorAll("script").forEach((script) => script.remove());
  Array.from(doc.body?.childNodes || []).forEach((node) => {
    content.appendChild(document.importNode(node, true));
  });

  return {
    content,
    stylesheets,
  };
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
  const [diagnostics, setDiagnostics] = useState<boolean>(() => {
    try {
      return localStorage.getItem("flow-preview:diagnostics") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("flow-preview:diagnostics", diagnostics ? "1" : "0");
    } catch {}
  }, [diagnostics]);

  const flowDoc = useMemo(() => {
    const doc =
      editedHtml && editedHtml.trim()
        ? htmlToFlowDoc(editedHtml, template, { designSettings })
        : serializeTemplate(template, mergeData, { projectDetails, designSettings });
    return pageSetup ? { ...doc, page: { ...doc.page, ...pageSetup } } : doc;
  }, [template, mergeData, editedHtml, projectDetails, designSettings, pageSetup]);
  const effectiveMerge = useMemo<MergeData>(
    () => ({ ...projectToMergeData(projectDetails), ...(mergeData || {}) }),
    [projectDetails, mergeData],
  );
  const html = useMemo(
    () => renderFlowToHtml(flowDoc, preset, effectiveMerge),
    [flowDoc, preset, effectiveMerge],
  );

  useEffect(() => {
    let cancelled = false;
    const target = containerRef.current;
    if (!target) return;

    setRendering(true);
    setError(null);
    target.innerHTML = "";
    // Paged.js מזריק סטיילים ל-head ולא מנקה אותם בין רנדרים.
    // הסרה ידנית מבטיחה שכללי @page / ::after ישנים לא ידלפו לרנדר הבא.
    document.head
      .querySelectorAll("style[data-pagedjs-inserted-styles]")
      .forEach((el) => el.remove());

    (async () => {
      try {
        // dynamic import כדי לא להעמיס bundle ראשי
        const mod: any = await import("pagedjs");
        if (cancelled) return;
        const Previewer = mod.Previewer || mod.default?.Previewer;
        if (!Previewer) throw new Error("pagedjs Previewer not found");
        const previewer = new Previewer();
        const pagedDocument = splitPagedDocument(html);
        const flow = await previewer.preview(pagedDocument.content, pagedDocument.stylesheets, target);
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

  const handlePrint = async () => {
    // משתמשים בתוצר ה-Paged.js שכבר עומד מול המשתמש (containerRef).
    // מעתיקים את אותו DOM ל-iframe נסתר כדי לא לפתוח about:blank בדפדפן הפנימי.
    const target = containerRef.current;
    if (!target || !target.querySelector(".pagedjs_page")) {
      window.alert("התצוגה עוד לא הסתיימה לטעון. נסה שוב בעוד רגע.");
      return;
    }
    const printPageSize =
      flowDoc.page.size === "custom"
        ? `${Math.max(50, flowDoc.page.customSizeMm?.width || 210)}mm ${Math.max(
            50,
            flowDoc.page.customSizeMm?.height || 297,
          )}mm`
        : `${flowDoc.page.size}${flowDoc.page.orientation === "landscape" ? " landscape" : ""}`;
    const pagedStyles = Array.from(
      document.querySelectorAll<HTMLStyleElement>("style[data-pagedjs-inserted-styles]"),
    )
      .map((style) => style.textContent || "")
      .filter(Boolean)
      .join("\n");
    const printDoc = `<!doctype html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<title>${flowDoc.title.replace(/</g, "&lt;")}</title>
<style>
  ${pagedStyles}
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
    const iframe = document.createElement("iframe");
    iframe.title = "Flow print preview";
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "1px",
      height: "1px",
      border: "0",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.appendChild(iframe);

    const printWindow = iframe.contentWindow;
    const printDocument = iframe.contentDocument || printWindow?.document;
    if (!printWindow || !printDocument) {
      iframe.remove();
      window.alert("לא ניתן לפתוח את מערכת ההדפסה בדפדפן הזה.");
      return;
    }

    const cleanup = () => {
      window.setTimeout(() => iframe.remove(), 500);
    };
    printWindow.addEventListener("afterprint", cleanup, { once: true });

    printDocument.open();
    printDocument.write(printDoc);
    printDocument.close();

    const waitForImages = Promise.all(
      Array.from(printDocument.images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );
    const waitForFonts = printDocument.fonts?.ready || Promise.resolve();
    await Promise.race([
      Promise.all([waitForImages, waitForFonts]),
      new Promise((resolve) => window.setTimeout(resolve, 2500)),
    ]);

    if (!printDocument.querySelector(".pagedjs_page")) {
      cleanup();
      window.alert("התצוגה להדפסה לא נטענה. נסה לרענן את התצוגה המקדימה.");
      return;
    }

    try {
      printWindow.focus();
      printWindow.print();
      window.setTimeout(cleanup, 30000);
    } catch {
      cleanup();
      window.alert("לא ניתן לפתוח את חלון ההדפסה בדפדפן הזה.");
    }
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
            variant={diagnostics ? "default" : "outline"}
            size="sm"
            onClick={() => setDiagnostics((v) => !v)}
            title="הצג/הסתר גבולות של סטריפים ותאי Paged.js לצורך אבחון"
          >
            <Ruler className="ml-1 h-3.5 w-3.5" />
            דיאגנוסטיקה
          </Button>
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
          className={`flow-preview-host mx-auto ${diagnostics ? "flow-diag" : ""}`}
          style={{
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
