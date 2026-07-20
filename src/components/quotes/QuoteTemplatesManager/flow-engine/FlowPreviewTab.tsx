// Flow Engine — Tab UI
// טאב נקי, מבודד לחלוטין. אין שימוש ב-PreviewIframe / paged-engine / safe masks.
// משתמש ישירות ב-Paged.js Previewer על HTML זורם שמיוצר ע"י renderer.ts.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { resolveFlowPageMetrics } from "./pageMetrics";

interface FlowPreviewTabProps {
  template: QuoteTemplate;
  mergeData?: MergeData;
  /** HTML שנערך בעורך החדש. אם קיים — מקבל עדיפות על פני סריאליזציה מהתבנית. */
  editedHtml?: string;
  preset?: DesignPresetConfig;
  projectDetails?: any;
  designSettings?: any;
  pageSetup?: FlowPageSetup;
  /** הסתר את שורת הכלים העליונה — לשימוש בתצוגת השוואה. */
  hideToolbar?: boolean;
  onPrintReady?: (handler: (() => Promise<void>) | null) => void;
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

async function waitForFlowAssets(html: string) {
  const fontReady = document.fonts?.ready || Promise.resolve();
  if (typeof DOMParser === "undefined") {
    await fontReady;
    return;
  }

  const parsed = new DOMParser().parseFromString(html, "text/html");
  const sources = Array.from(parsed.images)
    .map((image) => image.getAttribute("src"))
    .filter((source): source is string => Boolean(source));
  const imageReady = Promise.all(
    Array.from(new Set(sources)).map(
      (source) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = source;
          if (image.complete) resolve();
        }),
    ),
  );

  await Promise.race([
    Promise.all([fontReady, imageReady]),
    new Promise((resolve) => window.setTimeout(resolve, 5_000)),
  ]);
}

export default function FlowPreviewTab({
  template,
  mergeData,
  editedHtml,
  preset,
  projectDetails,
  designSettings,
  pageSetup,
  hideToolbar,
  onPrintReady,
}: FlowPreviewTabProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rendering, setRendering] = useState(false);
  const [printing, setPrinting] = useState(false);
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
    } catch {
      // localStorage may be unavailable in private/embedded browser contexts.
    }
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
        // תמונות ופונטים משנים גבהים. מעמדים רק אחרי שהם מוכנים כדי שהתצוגה
        // וה-PDF ישתמשו באותן שבירות עמוד בדיוק.
        await waitForFlowAssets(html);
        if (cancelled) return;
        // dynamic import כדי לא להעמיס bundle ראשי
        const mod: any = await import("pagedjs");
        if (cancelled) return;
        const Previewer = mod.Previewer || mod.default?.Previewer;
        if (!Previewer) throw new Error("pagedjs Previewer not found");
        const previewer = new Previewer();
        const pagedDocument = splitPagedDocument(html);
        const flow = await previewer.preview(pagedDocument.content, pagedDocument.stylesheets, target);
        if (cancelled) return;
        const renderedPages = Array.from(
          target.querySelectorAll<HTMLElement>(".pagedjs_page"),
        );
        renderedPages.forEach((page, index) => {
          const sheet = page.querySelector<HTMLElement>(".pagedjs_sheet");
          if (sheet) {
            sheet.dataset.pageNumber = page.dataset.pageNumber || String(index + 1);
          }
        });
        setPageCount(flow?.total ?? renderedPages.length);
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

  const handlePrint = useCallback(async () => {
    const target = containerRef.current;
    const pages = target
      ? Array.from(target.querySelectorAll<HTMLElement>(".pagedjs_page"))
      : [];
    if (!target || pages.length === 0) {
      window.alert("התצוגה עוד לא הסתיימה לטעון. נסה שוב בעוד רגע.");
      return;
    }
    setPrinting(true);
    try {
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;
      await (document.fonts?.ready || Promise.resolve());
      const pageImages: string[] = [];
      for (const [pageIndex, page] of pages.entries()) {
        // Capture the physical sheet rather than the outer Paged.js wrapper.
        // Left/even pages can be offset inside that wrapper; capturing it caused
        // their running header to be cropped from the exported PDF.
        const captureTarget =
          page.querySelector<HTMLElement>(".pagedjs_sheet") || page;
        const previousId = captureTarget.id;
        const captureId = `flow-print-page-${pageIndex + 1}-${Date.now()}`;
        captureTarget.id = captureId;
        captureTarget.dataset.pageNumber = String(pageIndex + 1);
        try {
          const canvas = await html2canvas(captureTarget, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
            logging: false,
            width: captureTarget.offsetWidth,
            height: captureTarget.offsetHeight,
            onclone: (clonedDocument) => {
              const clonedPage = clonedDocument.getElementById(captureId);
              if (!clonedPage) return;
              clonedPage.dataset.pageNumber = String(pageIndex + 1);
              clonedPage.style.boxShadow = "none";
              clonedPage.style.margin = "0";
              // Paged.js duplicates running elements with the same data-ref.
              // html2canvas can otherwise resolve the even page to a sibling's
              // running element and omit its header/footer from the bitmap.
              clonedPage
                .querySelectorAll<HTMLElement>(".running-header, .running-footer")
                .forEach((element) => {
                  element.style.position = "static";
                  element.style.display = element.classList.contains("strip")
                    ? "block"
                    : element.style.display;
                });
            },
          });
          pageImages.push(canvas.toDataURL("image/png"));
        } finally {
          if (previousId) captureTarget.id = previousId;
          else captureTarget.removeAttribute("id");
        }
      }

      const printMetrics = resolveFlowPageMetrics(flowDoc.page);
      const printPageSize = `${printMetrics.widthMm}mm ${printMetrics.heightMm}mm`;
      const title = flowDoc.title.replace(/[<>]/g, "");
      const printDoc = `<!doctype html>
<html dir="rtl" lang="he"><head><meta charset="utf-8" />
<title>${title}</title>
<style>
@page { size: ${printPageSize}; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
.print-page {
  display: block; width: ${printMetrics.widthMm}mm; height: ${printMetrics.heightMm}mm;
  margin: 0; padding: 0; overflow: hidden; break-after: page; page-break-after: always;
}
.print-page:last-child { break-after: auto; page-break-after: auto; }
.print-page img { display: block; width: 100%; height: 100%; object-fit: fill; margin: 0; }
</style></head><body>
${pageImages.map((src, index) => `<section class="print-page"><img src="${src}" alt="עמוד ${index + 1}" /></section>`).join("\n")}
</body></html>`;

      const iframe = document.createElement("iframe");
      iframe.title = "Flow exact A4 print";
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
      if (!printWindow || !printDocument) throw new Error("print iframe unavailable");

      const cleanup = () => window.setTimeout(() => iframe.remove(), 500);
      printWindow.addEventListener("afterprint", cleanup, { once: true });
      printDocument.open();
      printDocument.write(printDoc);
      printDocument.close();
      await Promise.all(
        Array.from(printDocument.images).map(
          (image) =>
            new Promise<void>((resolve) => {
              if (image.complete) return resolve();
              image.onload = () => resolve();
              image.onerror = () => resolve();
            }),
        ),
      );
      printWindow.focus();
      printWindow.print();
      window.setTimeout(cleanup, 30000);
    } catch (error) {
      console.error("[flow-print] exact A4 print failed", error);
      window.alert("לא ניתן להכין את מסמך ה-A4 להדפסה. נסה לרענן את התצוגה.");
    } finally {
      setPrinting(false);
    }
  }, [flowDoc.page, flowDoc.title]);

  useEffect(() => {
    onPrintReady?.(handlePrint);
    return () => onPrintReady?.(null);
  }, [handlePrint, onPrintReady]);

  return (
    <div className={`flex flex-col bg-muted/30 ${hideToolbar ? "" : "h-full"}`}>

      {/* Toolbar */}
      {!hideToolbar && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-4 py-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">תצוגה מקדימה (Flow V2) — לקריאה והדפסה בלבד</span>
            <Badge variant="outline" className="h-5 text-[10px]">לעריכה עברו למצב עריכת מסמך</Badge>
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
            <Button type="button" variant="default" size="sm" onClick={handlePrint} disabled={printing || rendering}>
              {printing ? <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" /> : <Printer className="ml-1 h-3.5 w-3.5" />}
              {printing ? "מכין A4..." : "הדפסה / PDF מדויק"}
            </Button>
          </div>
        </div>
      )}

      {/* Render area — כשמוצג בתוך Compare/Split (hideToolbar) לא יוצרים סקרול פנימי;
          הסקרול נשלט ע"י הקונטיינר החיצוני כדי למנוע סקרול מקונן שקוטע עמודים. */}
      <div className={hideToolbar ? "p-4" : "flex-1 overflow-auto p-6"}>
        <div
          ref={containerRef}
          className={`flow-preview-host mx-auto ${diagnostics ? "flow-diag" : ""}`}
          style={hideToolbar ? undefined : { minHeight: "100%" }}
        />
        <style>{`
          .flow-preview-host .pagedjs_pages {
            display: flex; flex-direction: column; align-items: center; gap: 16px;
          }
          .flow-preview-host .pagedjs_page {
            background: #fff;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          }
          /* ===== Diagnostics overlay ===== */
          .flow-preview-host.flow-diag .pagedjs_pagebox { outline: 1px dashed hsl(var(--primary) / 0.55); outline-offset: -1px; }
          .flow-preview-host.flow-diag .pagedjs_margin-top,
          .flow-preview-host.flow-diag .pagedjs_margin-bottom {
            outline: 1px dashed hsl(var(--destructive) / 0.7);
            outline-offset: -1px;
            background: hsl(var(--destructive) / 0.06);
            position: relative;
          }
          .flow-preview-host.flow-diag .pagedjs_margin-top::after,
          .flow-preview-host.flow-diag .pagedjs_margin-bottom::after {
            content: attr(class);
            position: absolute; inset-inline-end: 4px; top: 2px;
            font: 10px/1 ui-monospace, monospace;
            color: hsl(var(--destructive));
            background: hsl(var(--background) / 0.85);
            padding: 1px 4px; border-radius: 3px;
            pointer-events: none;
          }
          .flow-preview-host.flow-diag .running-header.strip,
          .flow-preview-host.flow-diag .running-footer.strip {
            outline: 2px solid hsl(var(--accent-foreground) / 0.9);
            outline-offset: -2px;
            box-shadow: inset 0 0 0 9999px hsl(var(--primary) / 0.08);
            position: relative;
          }
          .flow-preview-host.flow-diag .running-footer.strip::before,
          .flow-preview-host.flow-diag .running-header.strip::before {
            content: "STRIP";
            position: absolute; top: 2px; inset-inline-start: 4px;
            font: 10px/1 ui-monospace, monospace;
            color: hsl(var(--primary-foreground));
            background: hsl(var(--primary));
            padding: 2px 5px; border-radius: 3px;
            z-index: 5;
          }
          .flow-preview-host.flow-diag .running-footer.strip::before { content: "FOOTER STRIP"; }
          .flow-preview-host.flow-diag .running-header.strip::before { content: "HEADER STRIP"; }
          /* קו אדום דק בקצה התחתון של כל דף — כדי לזהות מיד רווח לבן מתחת לסטריפ */
          .flow-preview-host.flow-diag .pagedjs_page { position: relative; }
          .flow-preview-host.flow-diag .pagedjs_page::before {
            content: "";
            position: absolute; left: 0; right: 0; bottom: 0;
            height: 2px; background: hsl(var(--destructive));
            pointer-events: none; z-index: 6;
          }
        `}</style>
      </div>
    </div>
  );
}
