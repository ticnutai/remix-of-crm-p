import React, { memo, useEffect, useRef, useState } from "react";

export type InlineEditPayload = {
  path: string;
  value: string;
};

export type FreeTextEditPayload = {
  html: string;
};

export type FreeTextCommand = {
  id: number;
  action?: string;
  command?: string;
  value?: string;
};

interface PreviewIframeProps {
  html: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  onInlineEdit?: (payload: InlineEditPayload) => void;
  onFreeTextSave?: (payload: FreeTextEditPayload) => void;
  enableInlineEdit?: boolean;
  autoHeight?: boolean;
  minAutoHeight?: number;
  plainTextMode?: boolean;
  plainTextScope?: "document" | "selection";
  freeTextEditMode?: boolean;
  freeTextCommand?: FreeTextCommand | null;
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

const PLAIN_TEXT_SCRIPT = `
<style>
  html, body, body * {
    user-select: text !important;
    -webkit-user-select: text !important;
  }
  [data-editable],
  [data-editable]:hover,
  [data-editable][contenteditable="true"] {
    outline: none !important;
    background-color: transparent !important;
    box-shadow: none !important;
    cursor: text !important;
  }
  ::selection {
    background: rgba(216, 172, 39, 0.28);
  }
  [data-plain-text-scope="selection"] .container {
    cursor: text;
  }
  [data-plain-text-active="1"] {
    outline: 2px solid rgba(22, 44, 88, 0.22) !important;
    outline-offset: 8px;
    border-radius: 6px;
  }
</style>
<script>
(function(){
  document.documentElement.setAttribute('data-plain-text-mode', '1');
  var scope = '__PLAIN_TEXT_SCOPE__';
  document.documentElement.setAttribute('data-plain-text-scope', scope);
  if (scope === 'selection') {
    document.addEventListener('click', function(e){
      var target = e.target && e.target.closest
        ? e.target.closest('.stage-card, .project-details, .summary-card, .footer, .header, [data-editable]')
        : null;
      document.querySelectorAll('[data-plain-text-active="1"]').forEach(function(el){
        el.removeAttribute('data-plain-text-active');
      });
      if (target) target.setAttribute('data-plain-text-active', '1');
    }, true);
  }
})();
</script>
`;

const FREE_TEXT_EDIT_SCRIPT = `
<style data-free-text-editor-assets="1">
  html, body, body * {
    user-select: text !important;
    -webkit-user-select: text !important;
  }
  [data-editable],
  [data-editable]:hover,
  [data-editable][contenteditable="true"] {
    outline: none !important;
    background-color: transparent !important;
    box-shadow: none !important;
    cursor: text !important;
  }
  [data-free-text-block="1"] {
    min-height: 1em;
    border-radius: 4px;
    outline: 1px dashed transparent;
    transition: outline-color 0.15s ease, background-color 0.15s ease;
  }
  [data-free-text-block="1"]:hover,
  [data-free-text-current="1"] {
    outline: 2px solid rgba(216, 172, 39, 0.55) !important;
    background: rgba(216, 172, 39, 0.06) !important;
  }
  #free-text-toolbar {
    position: fixed;
    top: 0;
    left: 0;
    transform: translate(-50%, calc(-100% - 10px));
    z-index: 2147483647;
    display: none;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px;
    border: 1px solid rgba(15, 23, 42, 0.16);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
    direction: rtl;
    font-family: Arial, sans-serif;
    max-width: calc(100vw - 24px);
    pointer-events: auto;
  }
  #free-text-toolbar[data-visible="1"] {
    display: flex;
  }
  #free-text-toolbar[data-placement="below"] {
    transform: translate(-50%, 10px);
  }
  #free-text-toolbar button,
  #free-text-toolbar select,
  #free-text-toolbar input {
    height: 32px;
    border: 1px solid #d6d6d6;
    border-radius: 8px;
    background: #fff;
    color: #111827;
    font-size: 12px;
  }
  #free-text-toolbar button {
    min-width: 32px;
    padding: 0 8px;
    cursor: pointer;
  }
  #free-text-toolbar button:hover {
    border-color: #d8ac27;
    background: #fff9e8;
  }
  #free-text-toolbar select {
    width: 118px;
  }
  #free-text-toolbar input[type="number"] {
    width: 56px;
    padding: 0 6px;
  }
  #free-text-toolbar input[type="color"] {
    width: 34px;
    padding: 2px;
  }
  #free-text-toolbar .free-text-save {
    border-color: #162C58;
    background: #162C58;
    color: #fff;
  }
  #free-text-toolbar .free-text-separator {
    width: 1px;
    height: 24px;
    background: #e5e7eb;
  }
</style>
<script data-free-text-editor-assets="1">
(function(){
  if (window.__lovableFreeTextEditInit) return;
  window.__lovableFreeTextEditInit = true;

  var currentBlock = null;
  var toolbarEl = null;
  var toolbarRaf = 0;
  var savedRange = null;
  var selector = [
    'h1','h2','h3','h4','h5','h6','p','li','td','th',
    '.stage-card div','.project-details div','.summary-card div',
    '[data-editable]'
  ].join(',');

  function isToolbarTarget(node) {
    return node && node.closest && node.closest('#free-text-toolbar');
  }

  function markEditableBlocks() {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function(el) {
      if (!el || el.id === 'free-text-toolbar' || isToolbarTarget(el)) return;
      if (el.parentElement && el.parentElement.closest('[data-free-text-block="1"]')) return;
      var text = (el.innerText || '').replace(/\\s+/g, '');
      if (!text) return;
      if (el.querySelector && el.querySelector('#free-text-toolbar')) return;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-free-text-block', '1');
      el.setAttribute('spellcheck', 'false');
    });
  }

  function setCurrent(el) {
    if (!el || isToolbarTarget(el)) return;
    var block = el.closest && el.closest('[data-free-text-block="1"]');
    if (!block) return;
    if (currentBlock && currentBlock !== block) {
      currentBlock.removeAttribute('data-free-text-current');
    }
    currentBlock = block;
    currentBlock.setAttribute('data-free-text-current', '1');
    scheduleToolbarPosition();
  }

  function exec(command, value) {
    restoreSavedRange();
    document.execCommand(command, false, value || null);
    if (currentBlock) currentBlock.focus();
    scheduleToolbarPosition();
  }

  function rangeInsideEditable(range) {
    if (!range) return false;
    var node = range.commonAncestorContainer;
    if (node && node.nodeType === 3) node = node.parentElement;
    return !!(node && node.closest && node.closest('[data-free-text-block="1"]'));
  }

  function rememberSelection() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    var range = sel.getRangeAt(0);
    if (!rangeInsideEditable(range)) return;
    savedRange = range.cloneRange();
  }

  function restoreSavedRange() {
    if (!savedRange || !rangeInsideEditable(savedRange)) return false;
    var sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  }

  function applyInlineStyle(stylePatch) {
    restoreSavedRange();
    var sel = window.getSelection();
    var range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    var block = rangeInsideEditable(range) ? blockFromSelection() : currentBlock;
    if (!block) return;

    if (!range || range.collapsed || !rangeInsideEditable(range)) {
      Object.keys(stylePatch).forEach(function(key) {
        block.style[key] = stylePatch[key];
      });
      setCurrent(block);
      scheduleToolbarPosition();
      return;
    }

    var span = document.createElement('span');
    Object.keys(stylePatch).forEach(function(key) {
      span.style[key] = stylePatch[key];
    });
    span.appendChild(range.extractContents());
    range.insertNode(span);

    sel.removeAllRanges();
    var nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    sel.addRange(nextRange);
    savedRange = nextRange.cloneRange();
    setCurrent(block);
    scheduleToolbarPosition();
  }

  function insertSoftLineBreak() {
    restoreSavedRange();
    if (!document.execCommand('insertHTML', false, '<br>')) {
      var block = blockFromSelection();
      if (block) block.appendChild(document.createElement('br'));
    }
    rememberSelection();
    scheduleToolbarPosition();
  }

  function blockFromSelection() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return currentBlock;
    var node = sel.anchorNode;
    if (node && node.nodeType === 3) node = node.parentElement;
    return node && node.closest ? node.closest('[data-free-text-block="1"]') : currentBlock;
  }

  function moveBlock(direction) {
    var block = blockFromSelection();
    if (!block || !block.parentElement) return;
    if ((block.tagName === 'TD' || block.tagName === 'TH') && block.closest('tr')) {
      block = block.closest('tr');
    }
    var sibling = direction < 0 ? block.previousElementSibling : block.nextElementSibling;
    while (sibling && sibling.getAttribute('data-free-text-block') !== '1' && sibling.tagName !== 'TR') {
      sibling = direction < 0 ? sibling.previousElementSibling : sibling.nextElementSibling;
    }
    if (!sibling) return;
    if (direction < 0) {
      block.parentElement.insertBefore(block, sibling);
    } else {
      block.parentElement.insertBefore(sibling, block);
    }
    setCurrent(block);
    block.focus();
  }

  function cutBlock() {
    var block = blockFromSelection();
    if (!block) return;
    var text = block.innerText || '';
    try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) {}
    if ((block.tagName === 'TD' || block.tagName === 'TH') && block.closest('tr')) {
      block.closest('tr').remove();
      currentBlock = null;
      hideToolbar();
      return;
    }
    block.remove();
    currentBlock = null;
    hideToolbar();
  }

  function selectionRect() {
    var sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      var range = sel.getRangeAt(0);
      var node = sel.anchorNode;
      if (node && node.nodeType === 3) node = node.parentElement;
      var insideEditable = node && node.closest && node.closest('[data-free-text-block="1"]');
      if (insideEditable) {
        var rect = range.getBoundingClientRect();
        if ((!rect || (!rect.width && !rect.height)) && range.getClientRects) {
          rect = range.getClientRects()[0];
        }
        if (rect && (rect.width || rect.height)) return rect;
      }
    }
    return currentBlock ? currentBlock.getBoundingClientRect() : null;
  }

  function hideToolbar() {
    if (!toolbarEl) return;
    toolbarEl.removeAttribute('data-visible');
  }

  function positionToolbar() {
    if (!toolbarEl) return;
    var rect = selectionRect();
    if (!rect) {
      hideToolbar();
      return;
    }
    toolbarEl.setAttribute('data-visible', '1');
    toolbarEl.setAttribute('data-placement', 'above');

    var width = toolbarEl.offsetWidth || 320;
    var height = toolbarEl.offsetHeight || 48;
    var x = rect.left + rect.width / 2;
    x = Math.max(12 + width / 2, Math.min(window.innerWidth - 12 - width / 2, x));

    var top = rect.top - 10;
    if (top - height < 8) {
      top = rect.bottom + 10;
      toolbarEl.setAttribute('data-placement', 'below');
    }
    top = Math.max(height + 14, Math.min(window.innerHeight - 14, top));
    toolbarEl.style.left = x + 'px';
    toolbarEl.style.top = top + 'px';
  }

  function scheduleToolbarPosition() {
    if (toolbarRaf) cancelAnimationFrame(toolbarRaf);
    toolbarRaf = requestAnimationFrame(positionToolbar);
  }

  function cleanAndSerialize() {
    var clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('[data-free-text-editor-assets="1"], #free-text-toolbar').forEach(function(el){
      el.remove();
    });
    clone.querySelectorAll('[data-free-text-block], [data-free-text-current]').forEach(function(el){
      el.removeAttribute('contenteditable');
      el.removeAttribute('data-free-text-block');
      el.removeAttribute('data-free-text-current');
      el.removeAttribute('spellcheck');
    });
    clone.removeAttribute('data-plain-text-mode');
    clone.removeAttribute('data-plain-text-scope');
    return '<!DOCTYPE html>\\n' + clone.outerHTML;
  }

  function save() {
    try {
      window.parent.postMessage({
        __lovableFreeTextSave: true,
        html: cleanAndSerialize()
      }, '*');
    } catch (e) {}
  }

  function runFreeTextAction(action, command, value) {
    if (command) {
      exec(command, value);
      return;
    }
    if (action === 'line') insertSoftLineBreak();
    if (action === 'up') moveBlock(-1);
    if (action === 'down') moveBlock(1);
    if (action === 'cut') cutBlock();
    if (action === 'undo') exec('undo');
    if (action === 'redo') exec('redo');
    if (action === 'save') save();
    if (action === 'font') applyInlineStyle({ fontFamily: value || 'Arial' });
    if (action === 'color') applyInlineStyle({ color: value || '#333333' });
    if (action === 'size') {
      var size = Math.max(8, Math.min(72, parseInt(value, 10) || 16));
      applyInlineStyle({ fontSize: size + 'px' });
    }
  }

  function addToolbar() {
    if (document.getElementById('free-text-toolbar')) return;
    var toolbar = document.createElement('div');
    toolbar.id = 'free-text-toolbar';
    toolbar.setAttribute('data-free-text-editor-assets', '1');
    toolbar.innerHTML =
      '<button type="button" data-cmd="bold" title="מודגש"><b>B</b></button>' +
      '<button type="button" data-cmd="italic" title="נטוי"><i>I</i></button>' +
      '<button type="button" data-cmd="underline" title="קו תחתון"><u>U</u></button>' +
      '<span class="free-text-separator"></span>' +
      '<button type="button" data-cmd="justifyRight" title="יישור ימין">ימין</button>' +
      '<button type="button" data-cmd="justifyCenter" title="מרכז">מרכז</button>' +
      '<button type="button" data-cmd="justifyLeft" title="יישור שמאל">שמאל</button>' +
      '<span class="free-text-separator"></span>' +
      '<select data-font title="גופן">' +
        '<option value="Arial">Arial</option>' +
        '<option value="Heebo">Heebo</option>' +
        '<option value="Assistant">Assistant</option>' +
        '<option value="David">David</option>' +
        '<option value="Times New Roman">Times</option>' +
      '</select>' +
      '<input data-size type="number" min="8" max="72" value="16" title="גודל">' +
      '<input data-color type="color" value="#333333" title="צבע">' +
      '<span class="free-text-separator"></span>' +
      '<button type="button" data-action="line" title="שורה חדשה">שורה</button>' +
      '<button type="button" data-action="up" title="העבר שורה למעלה">למעלה</button>' +
      '<button type="button" data-action="down" title="העבר שורה למטה">למטה</button>' +
      '<button type="button" data-action="cut" title="חתוך שורה">חתוך</button>' +
      '<span class="free-text-separator"></span>' +
      '<button type="button" data-action="undo" title="בטל">↶</button>' +
      '<button type="button" data-action="redo" title="בצע שוב">↷</button>' +
      '<button type="button" class="free-text-save" data-action="save" title="שמור">שמור</button>';
    document.body.appendChild(toolbar);
    toolbarEl = toolbar;
    toolbar.addEventListener('mousedown', function(e){
      if (e.target && e.target.closest && e.target.closest('select,input')) return;
      e.preventDefault();
    });
    toolbar.addEventListener('click', function(e) {
      var target = e.target.closest('button');
      if (!target) return;
      var cmd = target.getAttribute('data-cmd');
      var action = target.getAttribute('data-action');
      runFreeTextAction(action, cmd);
    });
    toolbar.querySelector('[data-font]').addEventListener('change', function(e){
      runFreeTextAction('font', null, e.target.value);
    });
    toolbar.querySelector('[data-size]').addEventListener('change', function(e){
      runFreeTextAction('size', null, e.target.value);
    });
    toolbar.querySelector('[data-color]').addEventListener('input', function(e){
      runFreeTextAction('color', null, e.target.value);
    });
    scheduleToolbarPosition();
  }

  window.addEventListener('message', function(e) {
    var data = e.data;
    if (!data || !data.__lovableFreeTextCommand) return;
    runFreeTextAction(data.action, data.command, data.value);
  });

  document.addEventListener('focusin', function(e){ setCurrent(e.target); }, true);
  document.addEventListener('click', function(e){ setCurrent(e.target); }, true);
  document.addEventListener('selectionchange', function(){
    rememberSelection();
    scheduleToolbarPosition();
  });
  document.addEventListener('mouseup', scheduleToolbarPosition, true);
  document.addEventListener('keyup', scheduleToolbarPosition, true);
  document.addEventListener('scroll', scheduleToolbarPosition, true);
  window.addEventListener('resize', scheduleToolbarPosition);
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      save();
    }
  }, true);

  markEditableBlocks();
  addToolbar();
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

function injectPlainTextAssets(
  html: string,
  scope: "document" | "selection",
): string {
  if (!html) return html;
  const script = PLAIN_TEXT_SCRIPT.replace("__PLAIN_TEXT_SCOPE__", scope);
  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}</body>`);
  }
  return html + script;
}

function injectFreeTextEditAssets(html: string): string {
  if (!html) return html;
  if (html.includes("__lovableFreeTextEditInit")) return html;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${FREE_TEXT_EDIT_SCRIPT}</body>`);
  }
  return html + FREE_TEXT_EDIT_SCRIPT;
}

const PreviewIframeComponent: React.FC<PreviewIframeProps> = ({
  html,
  title,
  className,
  style,
  onInlineEdit,
  onFreeTextSave,
  enableInlineEdit = true,
  autoHeight = false,
  minAutoHeight = 0,
  plainTextMode = false,
  plainTextScope = "document",
  freeTextEditMode = false,
  freeTextCommand = null,
}) => {
  const handlerRef = useRef(onInlineEdit);
  const freeTextSaveRef = useRef(onFreeTextSave);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState(minAutoHeight);
  useEffect(() => {
    handlerRef.current = onInlineEdit;
  }, [onInlineEdit]);
  useEffect(() => {
    freeTextSaveRef.current = onFreeTextSave;
  }, [onFreeTextSave]);

  useEffect(() => {
    if (!enableInlineEdit && !freeTextEditMode) return;
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data as any;
      if (!data) return;
      if (data.__lovableFreeTextSave && typeof data.html === "string") {
        freeTextSaveRef.current?.({ html: data.html });
        return;
      }
      if (!data.__lovableInlineEdit) return;
      if (typeof data.path !== "string") return;
      handlerRef.current?.({
        path: data.path,
        value: String(data.value ?? ""),
      });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [enableInlineEdit, freeTextEditMode]);

  useEffect(() => {
    if (!freeTextEditMode || !freeTextCommand) return;
    iframeRef.current?.contentWindow?.postMessage(
      {
        __lovableFreeTextCommand: true,
        action: freeTextCommand.action,
        command: freeTextCommand.command,
        value: freeTextCommand.value,
      },
      "*",
    );
  }, [freeTextCommand, freeTextEditMode]);

  const finalHtml = freeTextEditMode
    ? injectFreeTextEditAssets(html)
    : plainTextMode
      ? injectPlainTextAssets(html, plainTextScope)
      : enableInlineEdit
        ? injectInlineEditAssets(html)
        : html;

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
    prev.plainTextMode === next.plainTextMode &&
    prev.plainTextScope === next.plainTextScope &&
    prev.freeTextEditMode === next.freeTextEditMode &&
    prev.freeTextCommand?.id === next.freeTextCommand?.id &&
    JSON.stringify(prev.style) === JSON.stringify(next.style)
  );
});

PreviewIframe.displayName = "PreviewIframe";
