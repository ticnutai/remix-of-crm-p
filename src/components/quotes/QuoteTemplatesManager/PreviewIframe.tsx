import React, { memo, useEffect, useRef, useState } from "react";

export type InlineEditPayload = {
  path: string;
  value: string;
};

interface PreviewIframeProps {
  html: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  onInlineEdit?: (payload: InlineEditPayload) => void;
  enableInlineEdit?: boolean;
  autoHeight?: boolean;
  minAutoHeight?: number;
}

const INLINE_EDIT_SCRIPT = `
<style>
  [data-editable] {
    outline: 1px dashed transparent;
    transition: outline-color 0.15s ease, background-color 0.15s ease;
    cursor: text;
    border-radius: 4px;
  }
  [data-editable]:hover {
    outline: 2px solid #d8ac27;
    background-color: rgba(216, 172, 39, 0.06);
  }
  [data-editable][contenteditable="true"] {
    outline: 2px solid #d8ac27;
    background-color: rgba(216, 172, 39, 0.1);
    box-shadow: 0 0 0 3px rgba(216, 172, 39, 0.2);
  }
</style>
<script>
(function(){
  if (window.__lovableInlineEditInit) return;
  window.__lovableInlineEditInit = true;

  function send(path, value) {
    try {
      window.parent.postMessage({ __lovableInlineEdit: true, path: path, value: value }, '*');
    } catch (e) {}
  }

  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-editable]');
    if (!t) return;
    if (t.getAttribute('contenteditable') === 'true') return;
    e.preventDefault();
    e.stopPropagation();
    t.setAttribute('contenteditable', 'true');
    t.focus();
    // Place cursor at end
    var range = document.createRange();
    range.selectNodeContents(t);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, true);

  document.addEventListener('blur', function(e){
    var t = e.target;
    if (!t || !t.getAttribute || t.getAttribute('contenteditable') !== 'true') return;
    var path = t.getAttribute('data-editable');
    var value = t.innerText;
    t.setAttribute('contenteditable', 'false');
    if (path) send(path, value);
  }, true);

  document.addEventListener('keydown', function(e){
    var t = e.target;
    if (!t || !t.getAttribute || t.getAttribute('contenteditable') !== 'true') return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      t.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      t.blur();
    }
  }, true);
})();
</script>
`;

function injectInlineEditAssets(html: string): string {
  if (!html) return html;
  if (html.includes("__lovableInlineEditInit")) return html;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${INLINE_EDIT_SCRIPT}</body>`);
  }
  return html + INLINE_EDIT_SCRIPT;
}

const PreviewIframeComponent: React.FC<PreviewIframeProps> = ({
  html,
  title,
  className,
  style,
  onInlineEdit,
  enableInlineEdit = true,
  autoHeight = false,
  minAutoHeight = 0,
}) => {
  const handlerRef = useRef(onInlineEdit);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState(minAutoHeight);
  useEffect(() => {
    handlerRef.current = onInlineEdit;
  }, [onInlineEdit]);

  useEffect(() => {
    if (!enableInlineEdit) return;
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data as any;
      if (!data || !data.__lovableInlineEdit) return;
      if (typeof data.path !== "string") return;
      handlerRef.current?.({ path: data.path, value: String(data.value ?? "") });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [enableInlineEdit]);

  const finalHtml = enableInlineEdit ? injectInlineEditAssets(html) : html;

  useEffect(() => {
    if (!autoHeight) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let resizeObserver: ResizeObserver | null = null;
    let raf = 0;

    const measure = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const nextHeight = Math.max(
        minAutoHeight,
        doc.documentElement?.scrollHeight || 0,
        doc.body?.scrollHeight || 0,
        doc.documentElement?.offsetHeight || 0,
        doc.body?.offsetHeight || 0,
      );
      setMeasuredHeight((current) =>
        Math.abs(current - nextHeight) > 2 ? nextHeight : current,
      );
    };

    const scheduleMeasure = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    const attachObservers = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      measure();
      setTimeout(measure, 250);
      setTimeout(measure, 900);
      try {
        const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
        fonts?.ready?.then(scheduleMeasure).catch(() => undefined);
      } catch {
        // ignore
      }
      try {
        resizeObserver?.disconnect();
        resizeObserver = new ResizeObserver(scheduleMeasure);
        resizeObserver.observe(doc.documentElement);
        if (doc.body) resizeObserver.observe(doc.body);
      } catch {
        // ignore
      }
    };

    attachObservers();
    iframe.addEventListener("load", attachObservers);

    return () => {
      iframe.removeEventListener("load", attachObservers);
      if (raf) cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
    };
  }, [autoHeight, finalHtml, minAutoHeight]);

  const iframeStyle: React.CSSProperties = {
    ...style,
    ...(autoHeight
      ? {
          height: measuredHeight ? `${measuredHeight}px` : style?.height,
          minHeight: minAutoHeight || style?.minHeight,
          overflow: "hidden",
        }
      : {}),
  };

  return (
    <iframe
      ref={iframeRef}
      srcDoc={finalHtml}
      title={title || "תצוגה מקדימה"}
      className={className}
      style={iframeStyle}
    />
  );
};

/**
 * Memoized iframe that only re-renders when html / device / styling actually change.
 * This prevents the heavy preview from re-rendering on every keystroke in the editor.
 */
export const PreviewIframe = memo(PreviewIframeComponent, (prev, next) => {
  return (
    prev.html === next.html &&
    prev.title === next.title &&
    prev.className === next.className &&
    prev.enableInlineEdit === next.enableInlineEdit &&
    prev.autoHeight === next.autoHeight &&
    prev.minAutoHeight === next.minAutoHeight &&
    JSON.stringify(prev.style) === JSON.stringify(next.style)
  );
});

PreviewIframe.displayName = "PreviewIframe";
