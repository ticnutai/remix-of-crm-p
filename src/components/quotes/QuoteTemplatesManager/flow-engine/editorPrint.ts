// הדפסה / PDF מתוך העורך עצמו (מנוע עימוד אחד).
// העורך (TipTap + tiptap-pagination-plus) כבר מחלק לעמודי A4: כל עמוד הוא רצועה
// בגובה --rm-page-height, ובין עמודים יש רווח .rm-pagination-gap. מצלמים כל עמוד
// במיקום המדויק שלו — כך ההדפסה זהה פיקסל-לפיקסל למה שרואים בעורך.

const PX_PER_MM = 96 / 25.4;

export interface EditorPageMetrics {
  pageCount: number;
  pageHeightPx: number;
  gapPx: number;
  widthPx: number;
  widthMm: number;
  heightMm: number;
}

export function readEditorPageMetrics(root: HTMLElement): EditorPageMetrics {
  const style = getComputedStyle(root);
  const pageHeightPx = parseFloat(style.getPropertyValue("--rm-page-height")) || 1122.52;
  const gap = root.querySelector<HTMLElement>(".rm-pagination-gap");
  const gapPx = gap ? gap.getBoundingClientRect().height : 0;
  const pagination = root.querySelector<HTMLElement>("[data-rm-pagination]");
  const pageCount = Math.max(1, pagination?.children.length || 1);
  const widthPx = root.getBoundingClientRect().width;
  return {
    pageCount,
    pageHeightPx,
    gapPx,
    widthPx,
    widthMm: Math.round((widthPx / PX_PER_MM) * 100) / 100,
    heightMm: Math.round((pageHeightPx / PX_PER_MM) * 100) / 100,
  };
}

const HEBREW_LETTERS = "אבגדהוזחטיכלמנסעפצקרשת";

/**
 * html2canvas מצייר מספור של רשימה ב-RTL בצד השמאלי של הדף (כאילו LTR). לכן בעותק
 * להדפסה המספור הופך לטקסט אמיתי, באותו מקום שבו הדפדפן מצייר אותו — מימין לפריט.
 */
function materializeListMarkers(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("ol, ul").forEach((list) => {
    const ordered = list.tagName === "OL";
    const nestedOrdered = ordered && Boolean(list.parentElement?.closest("ol"));
    let counter = ordered ? Number(list.getAttribute("start") || 1) : 0;
    Array.from(list.children).forEach((item) => {
      if (item.tagName !== "LI") return;
      const marker = document.createElement("span");
      marker.className = "flow-print-marker";
      marker.setAttribute("aria-hidden", "true");
      if (ordered) {
        const n = counter;
        marker.textContent = nestedOrdered ? `${HEBREW_LETTERS[(n - 1) % HEBREW_LETTERS.length]}.` : `${n}.`;
        counter += 1;
      } else {
        marker.textContent = "•";
      }
      // בתוך השורה הראשונה של הפריט — כך המספר מיושר לקו הבסיס של הטקסט
      const host = item.querySelector<HTMLElement>(":scope > p") || (item as HTMLElement);
      host.insertBefore(marker, host.firstChild);
    });
  });
}

/** מסיר מהעותק לצילום כל סימון של עריכה (סמן, בחירה, מסגרות, תוויות). */
function cleanCloneForPrint(clonedRoot: HTMLElement): HTMLStyleElement {
  clonedRoot.classList.add("flow-editor-printing");
  clonedRoot.querySelectorAll(".ProseMirror-selectednode").forEach((node) => node.classList.remove("ProseMirror-selectednode"));
  clonedRoot.style.boxShadow = "none";
  clonedRoot.style.outline = "none";
  clonedRoot.style.caretColor = "transparent";
  const doc = clonedRoot.ownerDocument;
  const style = doc.createElement("style");
  style.textContent = `
    .flow-editor-printing .ProseMirror-selectednode,
    .flow-editor-printing [data-flow-protected="1"],
    .flow-editor-printing .payments-block { outline: none !important; box-shadow: none !important; background: transparent !important; }
    .flow-editor-printing [data-flow-protected="1"]::after,
    .flow-editor-printing .payments-block::before { display: none !important; content: none !important; }
    .flow-editor-printing .flow-autofill-value { text-decoration: none !important; }
    .flow-editor-printing .flow-editor-strip-handle { display: none !important; }
    .flow-editor-printing .flow-multi-sel { background: transparent !important; }
    .flow-editor-printing .ProseMirror-gapcursor, .flow-editor-printing .is-empty::before { display: none !important; }
    .flow-editor-printing.flow-editor-content.rm-with-pagination .rm-pagination-gap,
    .flow-editor-printing.flow-editor-content.rm-with-pagination .breaker { background: #ffffff !important; box-shadow: none !important; border-color: transparent !important; }
    .flow-editor-printing.flow-editor-content.rm-with-pagination .rm-pagination-gap::before { display: none !important; }
    .flow-editor-printing.ProseMirror ol, .flow-editor-printing.ProseMirror ul,
    .flow-editor-printing.ProseMirror ol ol, .flow-editor-printing.ProseMirror ul ul { list-style: none !important; }
    .flow-editor-printing.ProseMirror li::marker { content: "" !important; }
    .flow-editor-printing .flow-print-marker { display: inline-block; width: 6mm; margin-inline-start: -6mm; padding-inline-end: 1.2mm; box-sizing: border-box; text-align: left; font-weight: 600; white-space: nowrap; }
  `;
  materializeListMarkers(clonedRoot);
  doc.head.appendChild(style);
  return style;
}

/**
 * עותק מחוץ למסך של העמודים, בלי אף מיכל גלילה מעליו. בעבר צילמנו את העורך במקומו,
 * אבל הוא יושב בתוך מיכל עם גלילה (כולל גלילה אופקית ב-RTL) ו-html2canvas לא משחזר
 * אותה במדויק — העמודים יצאו מוזזים/חתוכים. כאן: "חלון" בגודל עמוד A4 בדיוק
 * (overflow: hidden) ובתוכו העמודים, מוזזים לעמוד המבוקש.
 */
function buildOffscreenPages(root: HTMLElement, metrics: EditorPageMetrics) {
  const chain: HTMLElement[] = [];
  let el = root.parentElement;
  while (el && !el.classList.contains("flow-editor-scroll")) {
    chain.unshift(el);
    el = el.parentElement;
  }
  if (el) chain.unshift(el);

  const viewport = document.createElement("div");
  viewport.setAttribute("aria-hidden", "true");
  Object.assign(viewport.style, {
    position: "absolute",
    left: "0px",
    top: "0px",
    width: `${metrics.widthPx}px`,
    height: `${metrics.pageHeightPx}px`,
    overflow: "hidden",
    background: "#ffffff",
    zIndex: "-1",
    pointerEvents: "none",
    direction: "rtl",
  } as Partial<CSSStyleDeclaration>);
  const shifter = document.createElement("div");
  viewport.appendChild(shifter);

  // משחזרים את שרשרת ההורים (מחלקות + משתני CSS) — חלק מעיצוב העמוד תלוי בהם
  let parent: HTMLElement = shifter;
  for (const ancestor of chain) {
    const copy = document.createElement(ancestor.tagName);
    copy.className = ancestor.className;
    const inline = ancestor.getAttribute("style");
    if (inline) copy.setAttribute("style", inline);
    Object.assign(copy.style, { margin: "0", padding: "0", overflow: "visible", height: "auto", minHeight: "0", background: "transparent", boxShadow: "none" });
    parent.appendChild(copy);
    parent = copy;
  }
  const clone = root.cloneNode(true) as HTMLElement;
  clone.removeAttribute("contenteditable");
  clone.removeAttribute("id");
  parent.appendChild(clone);
  const printStyle = cleanCloneForPrint(clone);
  document.body.appendChild(viewport);
  return { viewport, shifter, printStyle };
}

/** צילום כל עמוד בעורך כתמונה (PNG data URL). */
export async function captureEditorPageImages(root: HTMLElement, scale = 2): Promise<string[]> {
  const { default: html2canvas } = await import("html2canvas");
  await (document.fonts?.ready || Promise.resolve());
  const metrics = readEditorPageMetrics(root);
  const { viewport, shifter, printStyle } = buildOffscreenPages(root, metrics);
  const images: string[] = [];
  try {
    for (let page = 0; page < metrics.pageCount; page += 1) {
      shifter.style.marginTop = `${-page * (metrics.pageHeightPx + metrics.gapPx)}px`;
      const canvas = await html2canvas(viewport, {
        backgroundColor: "#ffffff",
        scale,
        useCORS: true,
        logging: false,
        width: metrics.widthPx,
        height: metrics.pageHeightPx,
        scrollX: 0,
        scrollY: 0,
      });
      images.push(canvas.toDataURL("image/png"));
    }
  } finally {
    viewport.remove();
    printStyle.remove();
  }
  return images;
}

export async function editorPagesToPdfBlob(root: HTMLElement): Promise<Blob> {
  const metrics = readEditorPageMetrics(root);
  const images = await captureEditorPageImages(root);
  const { jsPDF } = await import("jspdf");
  const orientation = metrics.widthMm > metrics.heightMm ? "landscape" : "portrait";
  const pdf = new jsPDF({ unit: "mm", format: [metrics.widthMm, metrics.heightMm], orientation, compress: true });
  images.forEach((image, index) => {
    if (index > 0) pdf.addPage([metrics.widthMm, metrics.heightMm], orientation);
    pdf.addImage(image, "PNG", 0, 0, metrics.widthMm, metrics.heightMm, undefined, "FAST");
  });
  return pdf.output("blob");
}

export async function printEditorPages(root: HTMLElement, title: string): Promise<void> {
  const metrics = readEditorPageMetrics(root);
  const images = await captureEditorPageImages(root);
  const safeTitle = (title || "מסמך").replace(/[<>]/g, "");
  const printDoc = `<!doctype html>
<html dir="rtl" lang="he"><head><meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
@page { size: ${metrics.widthMm}mm ${metrics.heightMm}mm; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
.print-page { display: block; width: ${metrics.widthMm}mm; height: ${metrics.heightMm}mm; margin: 0; padding: 0; overflow: hidden; break-after: page; page-break-after: always; }
.print-page:last-child { break-after: auto; page-break-after: auto; }
.print-page img { display: block; width: 100%; height: 100%; object-fit: fill; margin: 0; }
</style></head><body>
${images.map((src, index) => `<section class="print-page"><img src="${src}" alt="עמוד ${index + 1}" /></section>`).join("\n")}
</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.title = "Flow editor A4 print";
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, { position: "fixed", left: "-10000px", top: "0", width: "1px", height: "1px", border: "0", opacity: "0", pointerEvents: "none" });
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
      (image) => new Promise<void>((resolve) => {
        if (image.complete) return resolve();
        image.onload = () => resolve();
        image.onerror = () => resolve();
      }),
    ),
  );
  printWindow.focus();
  printWindow.print();
  window.setTimeout(cleanup, 30000);
}
