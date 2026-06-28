// Quotes Pro — עריכה ישירה: iframe עם שדות contenteditable שמסנכרנים חזרה
import React, { useEffect, useMemo, useRef } from "react";
import { buildDocumentCss, getStripBands, googleFontHref } from "../render/composeDocument";
import { renderBlocksEditable } from "../render/renderBlock";
import type { QPDocument } from "../model/types";

interface Props {
  doc: QPDocument;
  /** נקרא בכל סיום עריכה של שדה */
  onEdit: (blockId: string, path: string, value: string) => void;
}

/** בונה את ה-HTML למצב עריכה (פעם אחת בכניסה למצב) */
function buildEditableHtml(doc: QPDocument): string {
  const css = buildDocumentCss(doc);
  const body = renderBlocksEditable(doc);
  const { header, footer } = getStripBands(doc);
  const fontHref = googleFontHref(doc.theme.fontFamily);
  const padTop = doc.page.margins.top + (doc.strips.header.enabled ? doc.strips.header.height : 0);
  const padBottom = doc.page.margins.top + (doc.strips.footer.enabled ? doc.strips.footer.height : 0);
  return `<!DOCTYPE html>
<html dir="rtl" lang="he"><head><meta charset="utf-8" />
${fontHref ? `<link href="${fontHref}" rel="stylesheet">` : ""}
<style>
*{box-sizing:border-box;}
body{margin:0;background:#fff;}
.qp-page{max-width:210mm;margin:0 auto;padding:${padTop}mm ${doc.page.margins.right}mm ${padBottom}mm;}
.qp-editable{outline:1px dashed transparent;border-radius:3px;transition:background .15s;}
.qp-editable:hover{outline-color:#d8ac27;background:#d8ac2714;}
.qp-editable:focus{outline:2px solid #d8ac27;background:#fff;}
${css}
</style></head>
<body>
${header}
<div class="qp-doc"><div class="qp-page">${body}</div></div>
${footer}
<script>
document.addEventListener('blur', function(e){
  var t = e.target;
  if(!t || !t.getAttribute) return;
  var el = t.closest('[data-qp-edit]');
  if(!el) return;
  var key = el.getAttribute('data-qp-edit');
  var sep = key.indexOf('::');
  if(sep < 0) return;
  var blockId = key.slice(0, sep);
  var path = key.slice(sep + 2);
  var value = path === '@html' ? el.innerHTML : el.innerText;
  parent.postMessage({ __qpEdit: true, blockId: blockId, path: path, value: value }, '*');
}, true);
</script>
</body></html>`;
}

export function InlineEditFrame({ doc, onEdit }: Props) {
  const onEditRef = useRef(onEdit);
  onEditRef.current = onEdit;
  // מחושב פעם אחת בכניסה למצב עריכה — לא מתעדכן בכל שינוי כדי לא לאבד קרסור
  const html = useMemo(() => buildEditableHtml(doc), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const d = e.data;
      if (d && d.__qpEdit) onEditRef.current(d.blockId, d.path, d.value);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <iframe
      title="inline-edit"
      srcDoc={html}
      className="w-full h-full bg-white"
    />
  );
}
