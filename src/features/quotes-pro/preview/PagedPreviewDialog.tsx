// Quotes Pro — תצוגה מקדימה מעומדת A4 (paged.js) + ייצוא
import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";
import { buildDocumentCss, getStripBands, googleFontHref } from "../render/composeDocument";
import { renderBlocks } from "../render/renderBlock";
import { printDocument, downloadHtml } from "./exportPdf";
import type { QPDocument } from "../model/types";

interface Props {
  doc: QPDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PagedPreviewDialog({ doc, open, onOpenChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rendering, setRendering] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !doc) return;
    let cancelled = false;
    setRendering(true);
    setError(null);

    // טעינת הגופן הנבחר ל-document הראשי (כדי שתצוגת ה-A4 תשתמש בו)
    const fontHref = googleFontHref(doc.theme.fontFamily);
    if (fontHref && !document.querySelector(`link[href="${fontHref}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fontHref;
      document.head.appendChild(link);
    }

    (async () => {
      try {
        const { Previewer } = await import("pagedjs");
        if (cancelled) return;
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const body = renderBlocks(doc);
        const css = buildDocumentCss(doc);
        const previewer = new Previewer();
        const flow = await previewer.preview(
          `<div class="qp-doc">${body}</div>`,
          [{ _: css }] as unknown as string[],
          container,
        );
        if (cancelled) return;
        setPageCount(
          (flow && typeof flow.total === "number" && flow.total) ||
            container.querySelectorAll(".pagedjs_page").length ||
            1,
        );

        // הזרקת פסים (כותרת/פוטר) לכל עמוד A4
        const { header, footer } = getStripBands(doc);
        if (header || footer) {
          const styleEl = document.createElement("style");
          styleEl.textContent =
            ".pagedjs_page{position:relative;}.pagedjs_page .qp-strip{position:absolute;left:0;right:0;z-index:50;padding:0 8mm;}.pagedjs_page .qp-strip-header{top:0;}.pagedjs_page .qp-strip-footer{bottom:0;}";
          container.appendChild(styleEl);
          container.querySelectorAll(".pagedjs_page").forEach((page) => {
            if (header) page.insertAdjacentHTML("afterbegin", header);
            if (footer) page.insertAdjacentHTML("beforeend", footer);
          });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, doc]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0" dir="rtl">
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2">
            תצוגה מקדימה
            {rendering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : pageCount > 0 ? (
              <span className="text-xs text-muted-foreground font-normal">{pageCount} עמודים</span>
            ) : null}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => doc && downloadHtml(doc)}>
              <Download className="h-4 w-4 ml-1" />
              HTML
            </Button>
            <Button
              size="sm"
              className="bg-[#d8ac27] hover:bg-[#c49b22] text-white"
              onClick={() => doc && printDocument(doc)}
            >
              <Printer className="h-4 w-4 ml-1" />
              הדפס / PDF
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted/40 p-4">
          {error ? (
            <div className="text-center text-destructive text-sm py-8">שגיאה בעימוד: {error}</div>
          ) : (
            <div ref={containerRef} className="qp-paged-container mx-auto" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
