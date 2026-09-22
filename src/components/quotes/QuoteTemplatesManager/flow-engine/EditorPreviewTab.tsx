// תצוגת A4 למסמך החי — אותו עורך (TipTap + עימוד) במצב קריאה בלבד.
// בעבר התצוגה וההדפסה עברו דרך מנוע עימוד נפרד (Paged.js) ולכן לא תאמו לעורך:
// מרווחים, שבירות עמוד ושורות שונות. כאן יש מנוע אחד — מה שרואים בעורך זה מה
// שמוצג, וההדפסה/PDF הן צילום של אותם עמודים בדיוק.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Printer, ScanEye } from "lucide-react";
import { Button } from "@/components/ui/button";
import FlowEditor from "./editor/FlowEditor";
import { editorPagesToPdfBlob, printEditorPages, readEditorPageMetrics } from "./editorPrint";
import type { DesignPresetConfig } from "./presets/types";
import type { FlowPageSetup } from "./types";
import type { ProjectTokenData } from "./projectTokens";

interface Props {
  html: string;
  title?: string;
  preset?: DesignPresetConfig;
  pageSetup?: FlowPageSetup;
  templateDesignSettings?: any;
  designSettings?: any;
  projectDetails?: ProjectTokenData;
  onPrintReady?: (handler: (() => Promise<void>) | null) => void;
  onPdfBlobReady?: (handler: (() => Promise<Blob>) | null) => void;
}

const noop = () => {};

export default function EditorPreviewTab({
  html,
  title,
  preset,
  pageSetup,
  templateDesignSettings,
  designSettings,
  projectDetails,
  onPrintReady,
  onPdfBlobReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const getRoot = useCallback(async () => {
    // העורך נטען אסינכרונית — ממתינים שהעימוד יסתיים
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const root = containerRef.current?.querySelector<HTMLElement>(".ProseMirror");
      if (root?.querySelector("[data-rm-pagination]")) return root;
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
    throw new Error("התצוגה עוד לא הסתיימה לטעון. נסה שוב בעוד רגע.");
  }, []);

  const handlePrint = useCallback(async () => {
    setPrinting(true);
    try {
      await printEditorPages(await getRoot(), title || "הצעת מחיר");
    } catch (error) {
      console.error("[flow-print] editor A4 print failed", error);
      window.alert("לא ניתן להכין את מסמך ה-A4 להדפסה. נסה שוב.");
    } finally {
      setPrinting(false);
    }
  }, [getRoot, title]);

  const createPdfBlob = useCallback(async () => {
    setPrinting(true);
    try {
      return await editorPagesToPdfBlob(await getRoot());
    } finally {
      setPrinting(false);
    }
  }, [getRoot]);

  useEffect(() => {
    onPrintReady?.(handlePrint);
    return () => onPrintReady?.(null);
  }, [handlePrint, onPrintReady]);

  useEffect(() => {
    onPdfBlobReady?.(createPdfBlob);
    return () => onPdfBlobReady?.(null);
  }, [createPdfBlob, onPdfBlobReady]);

  // מספר עמודים לתצוגה בכותרת
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const update = () => {
      const pm = root.querySelector<HTMLElement>(".ProseMirror");
      if (pm?.querySelector("[data-rm-pagination]")) setPageCount(readEditorPageMetrics(pm).pageCount);
    };
    update();
    const observer = new MutationObserver(() => window.requestAnimationFrame(update));
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-3 py-2">
        <div className="flex items-center gap-2">
          <ScanEye className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">תצוגת A4 — זהה לעורך ולהדפסה</span>
          {pageCount > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{pageCount} עמודים</span>
          )}
        </div>
        <Button type="button" size="sm" onClick={handlePrint} disabled={printing} className="gap-2">
          {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          {printing ? "מכין A4..." : "הדפסה / PDF מדויק"}
        </Button>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden">
        <FlowEditor
          readOnly
          initialHtml={html}
          onChange={noop}
          preset={preset}
          pageSetup={pageSetup}
          templateDesignSettings={templateDesignSettings}
          designSettings={designSettings}
          projectDetails={projectDetails}
        />
      </div>
    </div>
  );
}
