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
img, svg, figure, table, tr, blockquote,
.stage-card, .summary-card, .card, .signature-block, .keep-together {
  break-inside: avoid-page;
  page-break-inside: avoid;
}
ul, ol { break-inside: auto; }
.page-break, [data-page-break="true"] {
  break-before: page;
  page-break-before: always;
}
`;

/**
 * Extract just the body HTML and stylesheet text from a full HTML doc.
 * paged.js needs the body content; styles are passed separately.
 */
function splitHtml(raw: string): { body: string; styles: string } {
  if (!raw) return { body: "", styles: "" };
  // Quick parse via DOMParser
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");
    const styleNodes = doc.querySelectorAll("style");
    let styles = "";
    styleNodes.forEach((n) => {
      styles += "\n" + (n.textContent || "");
    });
    const body = doc.body?.innerHTML ?? raw;
    return { body, styles };
  } catch {
    return { body: raw, styles: "" };
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
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || !html) return;
    const myRun = ++runIdRef.current;
    let cancelled = false;
    setRendering(true);
    setError(null);

    (async () => {
      try {
        // Dynamic import keeps the bundle slim until needed.
        const { Previewer } = await import("pagedjs");
        if (cancelled || myRun !== runIdRef.current) return;

        const { body, styles } = splitHtml(html);
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
  };
}
