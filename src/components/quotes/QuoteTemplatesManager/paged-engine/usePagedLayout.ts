// Hook that runs paged.js on raw HTML and returns the fragmented pages.
// paged.js is the W3C CSS Paged Media polyfill (https://pagedjs.org/) -
// it splits long-form HTML into real A4 page elements with proper
// widows/orphans, break-inside:avoid, headers/footers etc.
import { useEffect, useRef, useState } from "react";

export interface PagedLayoutResult {
  /** Render container ref - attach to a div to host the rendered pages. */
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  /** Total page count after fragmentation. */
  pageCount: number;
  /** True while paged.js is processing. */
  rendering: boolean;
  /** Last error (if any). */
  error: string | null;
  /** Bump to force re-render. */
  rerender: () => void;
  /** Extracted header strip HTML (rendered as overlay on every page). */
  headerHtml: string;
  /** Extracted footer strip HTML (rendered as overlay on every page). */
  footerHtml: string;
}

// CSS injected into every paged.js render. Defines @page rules and
// professional break/widows/orphans behaviour.
const BASE_PAGED_CSS = `
@page {
  size: A4;
  margin: 22mm 14mm 18mm 14mm;
}
html, body { background: #ffffff; color: #111; }
body {
  font-family: inherit;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  widows: 3;
  orphans: 3;
  /* Neutralize any padding the legacy template added to make room for
     position:fixed strips — paged.js handles the strip zone via @page. */
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin: 0 !important;
}

/* === Break the legacy <table class="print-page-shell"> wrapper ===
   The legacy template wraps ALL content in a <table> with thead/tbody/tfoot
   so the browser repeats header/footer when printing. paged.js can't
   fragment that — the giant thead consumes a whole page and the body
   appears empty. Flatten the table to block flow. */
.print-page-shell,
.print-page-shell > thead,
.print-page-shell > tbody,
.print-page-shell > tfoot,
.print-page-shell > thead > tr,
.print-page-shell > tbody > tr,
.print-page-shell > tfoot > tr,
.print-page-shell > thead > tr > td,
.print-page-shell > tbody > tr > td,
.print-page-shell > tfoot > tr > td {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  border: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* Let paged.js really fragment the legacy shell. The template was built for
   browser print repetition, where tables/cards were kept whole. In paged.js
   that prevents proper cutting and content can visually run into margins. */
.print-page-shell,
.print-page-shell *,
.container,
.content,
.project-details,
table,
tbody,
thead,
tfoot,
tr,
td,
.stage-card,
.summary-card,
.card {
  break-inside: auto !important;
  page-break-inside: auto !important;
}

.container,
.content {
  width: 100% !important;
  max-width: none !important;
  box-sizing: border-box !important;
}

/* Hard visual guard: the content area itself is clipped to the @page body box,
   so even if a legacy element reports a huge rectangle, it cannot paint under
   the top/bottom strips. The continuation is rendered by paged.js on the next
   page. */
.pagedjs_page,
.pagedjs_sheet,
.pagedjs_pagebox,
.pagedjs_area,
.pagedjs_page_content {
  overflow: hidden !important;
}

/* Hide the original strips inside the paged.js flow — we render them as
   overlays on top of every page wrap instead (much more reliable than
   paged.js running elements, which mangle inline-styled / image strips). */
.print-repeat-header, .print-repeat-footer,
.quote-fixed-header, .header-strip, .repeat-header, .lov-repeat-overlay-header,
.quote-fixed-footer, .footer-strip, .repeat-footer, .lov-repeat-overlay-footer {
  display: none !important;
}

/* Catch-all: anything still position:fixed gets dropped back into flow. */
[style*="position: fixed"], [style*="position:fixed"] {
  position: static !important;
}

/* Hide leftover masks from the legacy preview engine. */
.lov-safe-mask, .lov-safe-mask-top, .lov-safe-mask-bottom,
.lov-repeat-overlay { display: none !important; }

/* The legacy frame overlay is fixed-positioned full-screen — kill it. */
.print-frame-overlay { display: none !important; }

h1, h2, h3, h4 {
  break-after: avoid-page;
  page-break-after: avoid;
}
p, li { widows: 3; orphans: 3; }
img, svg, figure, blockquote,
.signature-block, .keep-together {
  break-inside: avoid-page;
  page-break-inside: avoid;
}
.stage-card, .summary-card, .card, table, tr {
  break-inside: auto !important;
  page-break-inside: auto !important;
}
ul, ol { break-inside: auto; }
.page-break, [data-page-break="true"] {
  break-before: page;
  page-break-before: always;
}
`;

// Selector → strategy. For table-based wrappers (thead/tfoot) we must pull
// the inner <td> content; for plain divs we keep outerHTML.
const HEADER_SOURCES: { sel: string; inner?: string }[] = [
  { sel: ".print-repeat-header", inner: "tr > td" },
  { sel: ".quote-fixed-header" },
  { sel: ".header-strip" },
  { sel: ".repeat-header" },
  { sel: ".lov-repeat-overlay-header" },
];
const FOOTER_SOURCES: { sel: string; inner?: string }[] = [
  { sel: ".print-repeat-footer", inner: "tr > td" },
  { sel: ".quote-fixed-footer" },
  { sel: ".footer-strip" },
  { sel: ".repeat-footer" },
  { sel: ".lov-repeat-overlay-footer" },
];

function pickStrip(
  doc: Document,
  sources: { sel: string; inner?: string }[],
  label: string,
): string {
  console.log(`[paged-engine] pickStrip(${label}) — scanning ${sources.length} selectors`);
  for (const { sel, inner } of sources) {
    const all = doc.querySelectorAll(sel);
    console.log(`[paged-engine] pickStrip(${label}) sel="${sel}" matches=${all.length}`);
    const el = all[0];
    if (!el) continue;
    if (inner) {
      const innerEl = el.querySelector(inner);
      console.log(
        `[paged-engine] pickStrip(${label}) inner="${inner}" found=${!!innerEl} innerLen=${innerEl?.innerHTML.trim().length ?? 0}`,
      );
      if (innerEl && innerEl.innerHTML.trim()) return innerEl.innerHTML;
      if (el.textContent?.trim()) {
        console.log(`[paged-engine] pickStrip(${label}) fallback to outer innerHTML`);
        return el.innerHTML;
      }
      continue;
    }
    console.log(`[paged-engine] pickStrip(${label}) — using outerHTML len=${el.outerHTML.length}`);
    return el.outerHTML;
  }
  console.warn(`[paged-engine] pickStrip(${label}) — NO MATCH, returning empty`);
  return "";
}

/**
 * Extract body HTML, stylesheet text, and the repeating header/footer strips.
 * paged.js receives the body content; strips are rendered as overlays.
 */
function splitHtml(raw: string): {
  body: string;
  styles: string;
  headerHtml: string;
  footerHtml: string;
} {
  if (!raw) return { body: "", styles: "", headerHtml: "", footerHtml: "" };
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");
    const styleNodes = doc.querySelectorAll("style");
    let styles = "";
    styleNodes.forEach((n) => {
      styles += "\n" + (n.textContent || "");
    });
    const body = doc.body?.innerHTML ?? raw;
    const headerHtml = pickStrip(doc, HEADER_SOURCES, "header");
    const footerHtml = pickStrip(doc, FOOTER_SOURCES, "footer");
    console.log(`[paged-engine] splitHtml — bodyLen=${body.length} stylesLen=${styles.length} headerLen=${headerHtml.length} footerLen=${footerHtml.length}`);
    return { body, styles, headerHtml, footerHtml };
  } catch {
    return { body: raw, styles: "", headerHtml: "", footerHtml: "" };
  }
}

export function usePagedLayout(
  html: string,
  extraCss: string = "",
): PagedLayoutResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [headerHtml, setHeaderHtml] = useState("");
  const [footerHtml, setFooterHtml] = useState("");
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || !html) return;
    console.log(`[paged-engine] useEffect — htmlLen=${html.length} extraCssLen=${extraCss.length} renderKey=${renderKey}`);
    const myRun = ++runIdRef.current;
    let cancelled = false;
    setRendering(true);
    setError(null);

    (async () => {
      try {
        // Dynamic import keeps the bundle slim until needed.
        const { Previewer } = await import("pagedjs");
        if (cancelled || myRun !== runIdRef.current) return;

        const { body, styles, headerHtml: hh, footerHtml: fh } = splitHtml(html);
        console.log(`[paged-engine] setHeaderHtml len=${hh.length} preview="${hh.slice(0, 120).replace(/\s+/g, " ")}"`);
        console.log(`[paged-engine] setFooterHtml len=${fh.length} preview="${fh.slice(0, 120).replace(/\s+/g, " ")}"`);
        setHeaderHtml(hh);
        setFooterHtml(fh);
        const container = containerRef.current;
        if (!container) return;

        // Reset container
        container.innerHTML = "";

        // Create a fresh DOM source for paged.js
        const sourceWrapper = document.createElement("div");
        sourceWrapper.innerHTML = body;

        const previewer = new Previewer();
        const allCss = `${BASE_PAGED_CSS}\n${styles}\n${extraCss}`;
        const styleEl = document.createElement("style");
        styleEl.textContent = allCss;

        const flow = await previewer.preview(
          sourceWrapper.innerHTML,
          [{ _: allCss }] as unknown as string[], // pagedjs accepts CSS strings via objects
          container,
        );

        if (cancelled || myRun !== runIdRef.current) return;

        const total =
          (flow && typeof flow.total === "number" && flow.total) ||
          container.querySelectorAll(".pagedjs_page").length ||
          1;

        setPageCount(Math.max(1, total));
        setRendering(false);
      } catch (e: unknown) {
        if (cancelled || myRun !== runIdRef.current) return;
        console.error("[paged-engine] render failed", e);
        setError(e instanceof Error ? e.message : String(e));
        setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [html, extraCss, renderKey]);

  return {
    containerRef,
    pageCount,
    rendering,
    error,
    rerender: () => setRenderKey((k) => k + 1),
    headerHtml,
    footerHtml,
  };
}
