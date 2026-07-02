// usePagedGuides — מריץ Paged.js ברקע על אותו HTML של תצוגה מקדימה,
// ומחזיר Y-positions (בפיקסלים ביחס ל-editor DOM) שבהם ייווצרו שבירות עמוד ב-PDF.
//
// אסטרטגיה:
// 1. מוסיפים data-fid רק לבלוקי תוכן אמיתיים — לא להידר/פוטר/מעטפות Paged.js.
// 2. Paged.js מרנדר לתוך target אמיתי בגודל דף, מחוץ למסך (לא display:none/width:0).
// 3. עבור כל עמוד — מזהים את בלוק התוכן הראשון, מודדים את ההיסט שלו מתחילת אזור התוכן,
//    וממקמים את הקו בעורך לפי אותו בלוק פחות ההיסט הזה.
//
// חשוב: העורך חייב לזרוק את אותם data-fid ב-DOM שלו — מסופק בנפרד ע"י FlowEditor
// שמזריק את המזהים אחרי כל setContent.

import { useEffect, useMemo, useRef, useState } from "react";

export interface PagedGuidesOptions {
  /** ה-HTML המלא של המסמך אחרי merge (מגיע מ-renderer.renderFlowToHtml). */
  html: string;
  /** האם להריץ. כשמנוטרל — לא מבצעים שום עבודה. */
  enabled: boolean;
  /** ה-DOM של תוכן העורך — לחיפוש fid ומיקומים. */
  editorContentEl: HTMLElement | null;
  /** debounce למניעת ריצות רצופות בזמן הקלדה. ברירת מחדל 500ms. */
  debounceMs?: number;
}

export interface PagedGuidesResult {
  /** מערך Y-positions בפיקסלים ביחס לגובה של editorContentEl. */
  breakYs: number[];
  /** מספר עמודים ש-Paged.js חישב. */
  pageCount: number;
  loading: boolean;
  error: string | null;
  /** לחיצה כדי לרענן ידנית. */
  refresh: () => void;
}

const FID_ATTR = "data-flow-fid";

const EDITOR_BLOCK_SELECTOR = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "table",
  "hr",
  "blockquote",
  "div.flow-frame",
  "div.flow-callout",
].join(",");

const PREVIEW_BLOCK_SELECTOR = [
  ".flow-doc .flow-h",
  ".flow-doc .flow-p",
  ".flow-doc .flow-list",
  ".flow-doc .flow-table",
  ".flow-doc .flow-divider",
  ".flow-doc .flow-spacer",
  ".flow-doc .flow-pagebreak",
  ".flow-doc .flow-frame",
  ".flow-doc .flow-callout",
  ".flow-doc blockquote",
].join(",");

function clearStaleFlowIds(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>(`[${FID_ATTR}]`).forEach((el) => {
    if (!isEditorComparableBlock(el)) el.removeAttribute(FID_ATTR);
  });
}

function isEditorComparableBlock(el: HTMLElement): boolean {
  if (!el.matches(EDITOR_BLOCK_SELECTOR)) return false;
  if (
    el.closest(
      [
        ".rm-page-header",
        ".rm-page-footer",
        ".rm-first-page-header",
        ".rm-pagination-gap",
        ".rm-page-break",
        "[data-rm-pagination]",
        ".breaker",
        ".page",
        ".flow-page-strip-frame",
      ].join(","),
    )
  ) {
    return false;
  }
  const frameParent = el.parentElement?.closest(".flow-frame,.flow-callout,blockquote");
  if (frameParent && frameParent !== el) return false;
  return true;
}

function isPreviewComparableBlock(el: HTMLElement): boolean {
  if (!el.matches(PREVIEW_BLOCK_SELECTOR)) return false;
  if (el.closest(".running-header,.running-footer")) return false;
  const frameParent = el.parentElement?.closest(".flow-frame,.flow-callout,blockquote");
  if (frameParent && frameParent !== el) return false;
  return true;
}

function assignFlowIds(nodes: HTMLElement[]) {
  let counter = 0;
  nodes.forEach((node) => {
    counter += 1;
    const next = String(counter);
    if (node.getAttribute(FID_ATTR) !== next) {
      node.setAttribute(FID_ATTR, next);
    }
  });
}

/** מוסיף data-flow-fid לבלוקי העורך בלבד — אותה ספירה כמו ה-renderer. */
export function injectEditorFlowIds(root: HTMLElement) {
  clearStaleFlowIds(root);
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(EDITOR_BLOCK_SELECTOR)).filter(
    isEditorComparableBlock,
  );
  assignFlowIds(nodes);
}

/** מוסיף data-flow-fid למסמך Paged.js בלבד — בלי מעטפות/הידר/פוטר. */
function injectPreviewFlowIds(root: Document) {
  root.querySelectorAll<HTMLElement>(`[${FID_ATTR}]`).forEach((el) => el.removeAttribute(FID_ATTR));
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(PREVIEW_BLOCK_SELECTOR)).filter(
    isPreviewComparableBlock,
  );
  assignFlowIds(nodes);
}

function waitForDocumentFonts() {
  const fonts = (document as any).fonts;
  return fonts?.ready ? Promise.race([fonts.ready, new Promise((r) => window.setTimeout(r, 1200))]) : Promise.resolve();
}

function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  if (!images.length) return Promise.resolve();
  return Promise.race([
    Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    ).then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, 1800)),
  ]);
}

function stripPagedStyles(scopeId: string) {
  document.head
    .querySelectorAll(`style[data-pagedjs-inserted-styles][data-owner="${scopeId}"]`)
    .forEach((el) => el.remove());
}

async function computeBreaks(
  html: string,
  editorContentEl: HTMLElement,
  scopeId: string,
): Promise<{ breakYs: number[]; pageCount: number }> {
  const mod: any = await import("pagedjs");
  const Previewer = mod.Previewer || mod.default?.Previewer;
  if (!Previewer) throw new Error("Paged.js Previewer לא זמין");

  await waitForDocumentFonts();

  // ניתוח HTML → הזרקת fid רק לבלוקי תוכן → הפרדת stylesheets מהתוכן
  const doc = new DOMParser().parseFromString(html, "text/html");
  injectPreviewFlowIds(doc);

  const stylesheets: any[] = [];
  doc.querySelectorAll("style").forEach((style, i) => {
    const css = style.textContent || "";
    if (css.trim()) {
      stylesheets.push({ [`paged-guide-${scopeId}-${i}`]: css });
    }
    style.remove();
  });
  doc.querySelectorAll("link[rel='stylesheet']").forEach((link) => {
    const href = (link as HTMLLinkElement).href;
    if (href) stylesheets.push(href);
    link.remove();
  });
  doc.querySelectorAll("script").forEach((el) => el.remove());

  const fragment = document.createDocumentFragment();
  Array.from(doc.body?.childNodes || []).forEach((child) => {
    fragment.appendChild(document.importNode(child, true));
  });

  // Off-screen target — חייב להיות בעל layout אמיתי; width/height:0 גורמים למדידות שונות.
  const target = document.createElement("div");
  target.setAttribute("data-paged-guides-target", scopeId);
  target.style.cssText =
    "position:fixed;left:-100000px;top:0;width:230mm;min-height:320mm;overflow:visible;opacity:0;pointer-events:none;z-index:-1;";
  document.body.appendChild(target);

  try {
    const previewer = new Previewer();
    // מסמנים את הסטיילים כדי לנקות רק שלנו
    const flow = await previewer.preview(fragment, stylesheets, target);
    await waitForDocumentFonts();
    await waitForImages(target);
    // מיפוי סטיילים שהוזרקו לראש-מסמך — נסמן אותם למחיקה
    document.head
      .querySelectorAll("style[data-pagedjs-inserted-styles]:not([data-owner])")
      .forEach((el) => el.setAttribute("data-owner", scopeId));

    const pages = Array.from(target.querySelectorAll<HTMLElement>(".pagedjs_page"));
    const pageCount = flow?.total ?? pages.length;
    const editorRect = editorContentEl.getBoundingClientRect();
    const breakYs: number[] = [];

    injectEditorFlowIds(editorContentEl);

    // עבור עמודים 2..N — מוצאים את ה-fid הראשון באזור התוכן של העמוד.
    // אם לבלוק יש margin בראש העמוד, מחסרים את ההיסט כדי שהקו יסמן את תחילת אזור התוכן,
    // לא את תחילת הבלוק עצמו.
    for (let i = 1; i < pages.length; i++) {
      const contentArea =
        pages[i].querySelector<HTMLElement>(".pagedjs_page_content") ||
        pages[i].querySelector<HTMLElement>(".pagedjs_area") ||
        pages[i];
      const firstWithFid = Array.from(contentArea.querySelectorAll<HTMLElement>(`[${FID_ATTR}]`)).find(
        isPreviewComparableBlock,
      );
      if (!firstWithFid) continue;
      const fid = firstWithFid.getAttribute(FID_ATTR);
      if (!fid) continue;
      const inEditor = editorContentEl.querySelector<HTMLElement>(
        `[${FID_ATTR}="${CSS.escape(fid)}"]`,
      );
      if (!inEditor) continue;
      const rect = inEditor.getBoundingClientRect();
      const firstRect = firstWithFid.getBoundingClientRect();
      const contentRect = contentArea.getBoundingClientRect();
      const offsetInsidePdfPage = Math.max(0, firstRect.top - contentRect.top);
      const y = rect.top - editorRect.top + editorContentEl.scrollTop - offsetInsidePdfPage;
      breakYs.push(Math.round(y));
    }

    return { breakYs, pageCount };
  } finally {
    target.remove();
    stripPagedStyles(scopeId);
  }
}

export function usePagedGuides({
  html,
  enabled,
  editorContentEl,
  debounceMs = 500,
}: PagedGuidesOptions): PagedGuidesResult {
  const [breakYs, setBreakYs] = useState<number[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const runIdRef = useRef(0);
  const scopeId = useMemo(() => `pg-${Math.random().toString(36).slice(2, 8)}`, []);

  useEffect(() => {
    if (!enabled || !editorContentEl || !html) {
      setBreakYs([]);
      setPageCount(0);
      return;
    }
    const myRun = ++runIdRef.current;
    setLoading(true);
    setError(null);
    const t = window.setTimeout(async () => {
      try {
        const res = await computeBreaks(html, editorContentEl, scopeId);
        if (myRun !== runIdRef.current) return;
        setBreakYs(res.breakYs);
        setPageCount(res.pageCount);
      } catch (err: any) {
        if (myRun !== runIdRef.current) return;
        setError(err?.message || String(err));
      } finally {
        if (myRun === runIdRef.current) setLoading(false);
      }
    }, debounceMs);
    return () => {
      window.clearTimeout(t);
    };
  }, [html, enabled, editorContentEl, debounceMs, scopeId, nonce]);

  useEffect(() => {
    return () => stripPagedStyles(scopeId);
  }, [scopeId]);

  return {
    breakYs,
    pageCount,
    loading,
    error,
    refresh: () => setNonce((n) => n + 1),
  };
}
