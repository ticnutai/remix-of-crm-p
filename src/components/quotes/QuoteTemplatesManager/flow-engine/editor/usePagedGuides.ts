// usePagedGuides — מריץ Paged.js ברקע על אותו HTML של תצוגה מקדימה,
// ומחזיר Y-positions (בפיקסלים ביחס ל-editor DOM) שבהם ייווצרו שבירות עמוד ב-PDF.
//
// אסטרטגיה:
// 1. מוסיפים data-fid רץ לכל בלוק ישיר ב-HTML לפני ההרצה.
// 2. Paged.js מרנדר לתוך div מנותק (offscreen).
// 3. עבור כל pagedjs_page (מהעמוד השני והלאה) — מזהים את ה-fid של האלמנט
//    הראשון בעמוד, ומחפשים את אותו fid ב-DOM של העורך.
// 4. ה-Y של אותו אלמנט בעורך = מיקום שבירת העמוד.
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

/** מוסיף data-flow-fid לכל אלמנט חסום ישיר. משתמש בפונקציה זהה בעורך. */
export function injectFlowIds(root: HTMLElement | Document) {
  let counter = 0;
  const container: HTMLElement = (root as Document).body ?? (root as HTMLElement);
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, null);
  let node = walker.nextNode() as HTMLElement | null;
  while (node) {
    const tag = node.tagName.toLowerCase();
    // רק בלוקים "משמעותיים" — נספיק כדי להצליב מיקומים
    if (
      /^(p|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|blockquote|figure|hr|div|section|article)$/.test(tag) &&
      !node.hasAttribute(FID_ATTR)
    ) {
      counter += 1;
      node.setAttribute(FID_ATTR, String(counter));
    }
    node = walker.nextNode() as HTMLElement | null;
  }
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

  // ניתוח HTML → הזרקת fid → הפרדת stylesheets מהתוכן
  const doc = new DOMParser().parseFromString(html, "text/html");
  injectFlowIds(doc);

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

  // Off-screen target — כדי לא להפריע לויזואל
  const target = document.createElement("div");
  target.setAttribute("data-paged-guides-target", scopeId);
  target.style.cssText =
    "position:fixed;left:-100000px;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;";
  document.body.appendChild(target);

  try {
    const previewer = new Previewer();
    // מסמנים את הסטיילים כדי לנקות רק שלנו
    const flow = await previewer.preview(fragment, stylesheets, target);
    // מיפוי סטיילים שהוזרקו לראש-מסמך — נסמן אותם למחיקה
    document.head
      .querySelectorAll("style[data-pagedjs-inserted-styles]:not([data-owner])")
      .forEach((el) => el.setAttribute("data-owner", scopeId));

    const pages = Array.from(target.querySelectorAll<HTMLElement>(".pagedjs_page"));
    const pageCount = flow?.total ?? pages.length;
    const editorRect = editorContentEl.getBoundingClientRect();
    const breakYs: number[] = [];

    // עבור עמודים 2..N — מוצאים את ה-fid הראשון בעמוד
    for (let i = 1; i < pages.length; i++) {
      const firstWithFid = pages[i].querySelector<HTMLElement>(`[${FID_ATTR}]`);
      if (!firstWithFid) continue;
      const fid = firstWithFid.getAttribute(FID_ATTR);
      if (!fid) continue;
      const inEditor = editorContentEl.querySelector<HTMLElement>(
        `[${FID_ATTR}="${CSS.escape(fid)}"]`,
      );
      if (!inEditor) continue;
      const rect = inEditor.getBoundingClientRect();
      const y = rect.top - editorRect.top + editorContentEl.scrollTop;
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
