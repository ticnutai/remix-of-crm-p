// LiveSplitView — פיצול מסך: עורך מצד אחד, תצוגה מקדימה חיה (ללא Paged.js) מצד שני.
// המטרה: עדכון מיידי בזמן הקלדה, בלי רינדור שמורגש בעין.
// (מציג עיצוב אמת, סטריפים, טוקנים — אבל ללא חלוקה מדויקת לעמודים.)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import type { QuoteTemplate } from "../types";
import type { DesignPresetConfig } from "./presets/types";
import type { FlowPageSetup } from "./types";
import FlowEditor from "./editor/FlowEditor";
import { htmlToFlowDoc } from "./editor/htmlToFlowDoc";
import { renderFlowToHtml } from "./renderer";
import { projectToMergeData } from "./projectTokens";

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

const PAGE_WIDTH_MM = 210;
const PAGE_WIDTH_PX = (PAGE_WIDTH_MM * 96) / 25.4; // ≈ 793.7
const FIT_BUFFER_PX = 32;

function computeFit(paneWidth: number, pageWidthPx = PAGE_WIDTH_PX) {
  if (!paneWidth) return 1;
  const target = paneWidth - FIT_BUFFER_PX;
  if (target >= pageWidthPx) return 1;
  return Math.max(0.35, target / pageWidthPx);
}

export default function LiveSplitView(props: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);
  const editorPaneRef = useRef<HTMLDivElement | null>(null);
  const previewPaneRef = useRef<HTMLDivElement | null>(null);
  const [editorZoom, setEditorZoom] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(1);

  useEffect(() => {
    const observe = (el: HTMLElement | null, setter: (n: number) => void) => {
      if (!el) return () => {};
      const ro = new ResizeObserver(() => setter(computeFit(el.clientWidth)));
      ro.observe(el);
      setter(computeFit(el.clientWidth));
      return () => ro.disconnect();
    };
    const c1 = observe(editorPaneRef.current, setEditorZoom);
    const c2 = observe(previewPaneRef.current, setPreviewZoom);
    return () => { c1(); c2(); };
  }, []);

  // עדכון zoom בתוך ה-iframe
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc?.body) (doc.body.style as any).zoom = String(previewZoom);
  }, [previewZoom]);

  const previewHtml = useMemo(() => {
    try {
      const doc = htmlToFlowDoc(props.html, props.template, {
        designSettings: props.designSettings,
      });
      const finalDoc = props.pageSetup
        ? { ...doc, page: { ...doc.page, ...props.pageSetup } }
        : doc;
      const merge = projectToMergeData(props.projectDetails);
      return renderFlowToHtml(finalDoc, props.preset, merge);
    } catch {
      return props.html;
    }
  }, [
    props.html,
    props.template,
    props.designSettings,
    props.pageSetup,
    props.preset,
    props.projectDetails,
  ]);

  // אתחול המסמך פעם אחת — לאחר מכן מעדכנים רק את גוף ה-HTML בלי לטעון מחדש (בלי הבזק).
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    readyRef.current = false;
    const handleLoad = () => {
      readyRef.current = true;
      writePreview(iframe, previewHtml);
    };
    iframe.addEventListener("load", handleLoad);
    // srcdoc ריק כדי לפתוח document ריק ואז לכתוב אליו
    iframe.srcdoc = `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"/></head><body></body></html>`;
    return () => iframe.removeEventListener("load", handleLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !readyRef.current) return;
    writePreview(iframe, previewHtml);
  }, [previewHtml]);

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col border-l">
          <div className="flex h-7 shrink-0 items-center border-b bg-background/60 px-3 text-xs font-medium text-muted-foreground">
            <Pencil className="ml-1 inline h-3 w-3" /> עריכה
          </div>
          <div
            ref={editorPaneRef}
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
            style={{ zoom: editorZoom } as React.CSSProperties}
          >
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
          <div className="flex h-7 shrink-0 items-center border-b bg-background/60 px-3 text-xs font-medium text-muted-foreground">
            <Eye className="ml-1 inline h-3 w-3" /> תצוגה חיה
          </div>
          <div ref={previewPaneRef} className="min-h-0 flex-1 overflow-hidden bg-white">
            <iframe
              ref={iframeRef}
              title="live-preview"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** כותב תצוגה מקדימה לתוך ה-iframe בלי לטעון אותו מחדש (מונע הבזק). */
function writePreview(iframe: HTMLIFrameElement, html: string) {
  const doc = iframe.contentDocument;
  if (!doc) return;
  // מנסים לחלץ style/body מתוך ה-HTML שהופק ע"י renderFlowToHtml
  const match = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  const body = match ? match[1] : html;
  const headStyles = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((m) => m[0])
    .join("\n");
  const linkTags = Array.from(html.matchAll(/<link[^>]*>/gi))
    .map((m) => m[0])
    .join("\n");

  // עדכון head פעם אחת
  if (!doc.head.dataset.livePrepared) {
    doc.head.innerHTML = `
      <meta charset="utf-8" />
      <base target="_blank" />
      ${linkTags}
      <style>
        html, body { margin:0; padding:0; background:#f5f5f5; }
        body { direction: rtl; font-family: Heebo, Arial, sans-serif; }
        .live-page {
          background: white;
          margin: 12px auto;
          padding: 20mm 18mm;
          width: 210mm;
          min-height: 200mm;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          box-sizing: border-box;
        }
        table { border-collapse: collapse; width: 100%; }
        img { max-width: 100%; }
      </style>
      ${headStyles}
    `;
    doc.head.dataset.livePrepared = "1";
  } else {
    // רק סטיילים משתנים (preset) — נעדכן את בלוק הסטיילים האחרון
    const styleHolder = doc.getElementById("live-dynamic-styles");
    if (styleHolder) styleHolder.innerHTML = headStyles;
    else {
      const s = doc.createElement("div");
      s.id = "live-dynamic-styles";
      s.innerHTML = headStyles;
      doc.head.appendChild(s);
    }
  }

  // עדכון body
  doc.body.innerHTML = `<div class="live-page">${body}</div>`;
}
