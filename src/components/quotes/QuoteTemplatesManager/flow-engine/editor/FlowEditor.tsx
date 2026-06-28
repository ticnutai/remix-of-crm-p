// FlowEditor — TipTap rich text editor, RTL, עם autosave ושדות דינמיים
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { FontFamily } from "@tiptap/extension-font-family";
import { PaginationPlus, type PaginationPlusOptions } from "tiptap-pagination-plus";
import { Tag, Plus } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import DynamicField, { setFieldResolver } from "./DynamicField";
import { projectToMergeData, type ProjectTokenData } from "../projectTokens";
import MenuBar from "./MenuBar";
import BubbleToolbar from "./BubbleToolbar";
import AdvancedTextStyle from "./AdvancedTextStyle";
import { useDynamicFields, type DynamicFieldDefinition } from "./dynamicFields";
import CreateFieldDialog from "./CreateFieldDialog";
import { MultiSelection, addExtraRange, clearExtraRanges, getExtraRanges } from "./MultiSelection";

import type { DesignPresetConfig } from "../presets/types";
import type { FlowPageSetup } from "../types";

interface Props {
  initialHtml: string;
  onChange: (html: string) => void;
  preset?: DesignPresetConfig;
  pageSetup?: FlowPageSetup;
  templateDesignSettings?: any;
  designSettings?: any;
  onDesignSettingsChange?: (patch: Record<string, any>) => void;
  projectDetails?: ProjectTokenData;
}

const PAGE_SIZES_MM: Record<string, { width: number; height: number }> = {
  A5: { width: 148, height: 210 },
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
};

const MM_TO_PX = 96 / 25.4;
const DEFAULT_PAGE_GAP_PX = 18;
const DEFAULT_STRIP_CONTENT_GAP_PX = 18;
const DEFAULT_MARGIN_MM = { top: 32, right: 18, bottom: 28, left: 18 };

function mmToPx(mm: number) {
  return Math.round(mm * MM_TO_PX);
}

function resolvePageMetrics(pageSetup?: FlowPageSetup) {
  const base =
    pageSetup?.size === "custom"
      ? {
          width: Math.max(50, pageSetup.customSizeMm?.width || 210),
          height: Math.max(50, pageSetup.customSizeMm?.height || 297),
        }
      : PAGE_SIZES_MM[pageSetup?.size || "A4"] || PAGE_SIZES_MM.A4;
  const landscape = pageSetup?.size !== "custom" && pageSetup?.orientation === "landscape";
  const width = landscape ? base.height : base.width;
  const height = landscape ? base.width : base.height;
  const margin = pageSetup?.marginMm || DEFAULT_MARGIN_MM;

  return {
    widthMm: width,
    heightMm: height,
    marginMm: margin,
    widthPx: mmToPx(width),
    heightPx: mmToPx(height),
    marginPx: {
      top: mmToPx(margin.top),
      right: mmToPx(margin.right),
      bottom: mmToPx(margin.bottom),
      left: mmToPx(margin.left),
    },
  };
}

function editorPageVars(pageSetup?: FlowPageSetup): React.CSSProperties {
  if (!pageSetup || pageSetup.size === "none") return {};

  const { widthMm, heightMm, marginMm } = resolvePageMetrics(pageSetup);

  return {
    "--flow-editor-page-width": `${widthMm}mm`,
    "--flow-editor-page-height": `${heightMm}mm`,
    "--flow-editor-page-padding-top": `${marginMm.top}mm`,
    "--flow-editor-page-padding-right": `${marginMm.right}mm`,
    "--flow-editor-page-padding-bottom": `${marginMm.bottom}mm`,
    "--flow-editor-page-padding-left": `${marginMm.left}mm`,
    "--flow-editor-page-padding": `${marginMm.top}mm ${marginMm.right}mm ${marginMm.bottom}mm ${marginMm.left}mm`,
  } as React.CSSProperties;
}

function firstValue<T>(...values: Array<T | null | undefined | "">): T | undefined {
  return values.find((value) => value !== undefined && value !== null && value !== "") as T | undefined;
}

function numberValue(value: unknown, fallback: number, min = 0, max = Number.POSITIVE_INFINITY) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function getStripSettings(templateDesignSettings?: any, designSettings?: any) {
  const ds = { ...(templateDesignSettings || {}), ...(designSettings || {}) };
  const logoUrl = firstValue(ds.logoUrl, ds.logo_url, ds.logoURL, ds.originalLogoUrl, ds.original_logo_url);
  const logoPosition = firstValue(ds.logoPosition, ds.logo_position);
  const isStripLogo = logoPosition === "custom-strip" || logoPosition === "full-width";
  const headerUrl = firstValue(ds.headerStripUrl, ds.header_strip_url, ds.stripUrl, ds.strip_url, isStripLogo ? logoUrl : undefined);
  const footerUrl = firstValue(ds.footerStripUrl, ds.footer_strip_url, ds.footerLogoUrl, ds.footer_logo_url, isStripLogo ? logoUrl : undefined);

  return {
    headerUrl,
    footerUrl,
    bgColor: firstValue(ds.stripBgColor, ds.strip_bg_color, "#ffffff") || "#ffffff",
    headerHeight: Math.max(24, Math.round(Number(ds.headerStripHeight) || 150)),
    footerHeight: Math.max(24, Math.round(Number(ds.footerStripHeight) || 90)),
    headerContentGap: numberValue(
      firstValue(ds.headerStripContentGapPx, ds.header_content_gap_px),
      DEFAULT_STRIP_CONTENT_GAP_PX,
      0,
      240,
    ),
    footerContentGap: numberValue(
      firstValue(ds.footerStripContentGapPx, ds.footer_content_gap_px),
      DEFAULT_STRIP_CONTENT_GAP_PX,
      0,
      240,
    ),
    pageGap: numberValue(
      firstValue(ds.flowPageGapPx, ds.flow_page_gap_px),
      DEFAULT_PAGE_GAP_PX,
      0,
      120,
    ),
    showHeader: ds.repeatHeaderOnAllPages !== false,
    showFooter: ds.repeatFooterOnAllPages !== false,
  };
}

function escapeAttr(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function makeStripHtml(
  position: "header" | "footer",
  url: unknown,
  height: number,
  bgColor: string,
  canResize: boolean,
) {
  if (!url) return "";

  const handleClass =
    position === "header" ? "flow-editor-strip-handle-bottom" : "flow-editor-strip-handle-top";
  const handleTitle =
    position === "header" ? "גרור לשינוי גובה הסטריפ העליון" : "גרור לשינוי גובה הסטריפ התחתון";
  const resizeHandle = canResize
    ? `<button type="button" class="flow-editor-strip-handle ${handleClass}" data-flow-strip-handle="${position}" title="${handleTitle}" aria-label="${handleTitle}"></button>`
    : "";

  return `
    <div class="flow-page-strip-frame flow-page-strip-${position}" contenteditable="false" style="height:${Math.max(
      24,
      Math.round(height),
    )}px;background-color:${escapeAttr(bgColor)};">
      <img class="flow-page-strip-img" src="${escapeAttr(url)}" alt="" draggable="false" />
      ${resizeHandle}
    </div>
  `;
}

function buildPaginationOptions({
  pageSetup,
  pagedMode,
  stripSettings,
  showHeaderStrip,
  showFooterStrip,
  canResizeStrips,
}: {
  pageSetup?: FlowPageSetup;
  pagedMode: boolean;
  stripSettings: ReturnType<typeof getStripSettings>;
  showHeaderStrip: boolean;
  showFooterStrip: boolean;
  canResizeStrips: boolean;
}): PaginationPlusOptions {
  const metrics = resolvePageMetrics(pageSetup);

  return {
    enabled: pagedMode,
    pageBreakBackground: "transparent",
    pageHeight: metrics.heightPx,
    pageWidth: metrics.widthPx,
    marginTop: showHeaderStrip ? 0 : metrics.marginPx.top,
    marginBottom: showFooterStrip ? 0 : metrics.marginPx.bottom,
    marginLeft: metrics.marginPx.left,
    marginRight: metrics.marginPx.right,
    pageGap: stripSettings.pageGap,
    pageGapBorderSize: 0,
    pageGapBorderColor: "transparent",
    contentMarginTop: showHeaderStrip ? stripSettings.headerContentGap : 0,
    contentMarginBottom: showFooterStrip ? stripSettings.footerContentGap : 0,
    headerLeft: showHeaderStrip
      ? makeStripHtml(
          "header",
          stripSettings.headerUrl,
          stripSettings.headerHeight,
          stripSettings.bgColor,
          canResizeStrips,
        )
      : "",
    headerRight: "",
    footerLeft: showFooterStrip
      ? makeStripHtml(
          "footer",
          stripSettings.footerUrl,
          stripSettings.footerHeight,
          stripSettings.bgColor,
          canResizeStrips,
        )
      : "",
    footerRight: pageSetup?.showPageNumbers ? '<span class="flow-page-number-label">עמוד {page}</span>' : "",
    customHeader: {},
    customFooter: {},
  };
}

export default function FlowEditor({
  initialHtml,
  onChange,
  preset,
  pageSetup,
  templateDesignSettings,
  designSettings,
  onDesignSettingsChange,
  projectDetails,
}: Props) {
  const debounceRef = useRef<number | null>(null);
  const dragRef = useRef<{
    position: "header" | "footer";
    startY: number;
    startHeight: number;
  } | null>(null);
  const pagedMode = Boolean(pageSetup && pageSetup.size !== "none");
  const stripSettings = getStripSettings(templateDesignSettings, designSettings);
  const showHeaderStrip = pagedMode && stripSettings.showHeader && Boolean(stripSettings.headerUrl);
  const showFooterStrip = pagedMode && stripSettings.showFooter && Boolean(stripSettings.footerUrl);
  const canResizeStrips = Boolean(onDesignSettingsChange);
  const { fields: dynamicFields, groups: fieldGroups } = useDynamicFields();
  const [createFieldOpen, setCreateFieldOpen] = useState(false);
  const paginationOptions = useMemo(
    () =>
      buildPaginationOptions({
        pageSetup,
        pagedMode,
        stripSettings,
        showHeaderStrip,
        showFooterStrip,
        canResizeStrips,
      }),
    [
      pageSetup?.size,
      pageSetup?.orientation,
      pageSetup?.customSizeMm?.width,
      pageSetup?.customSizeMm?.height,
      pageSetup?.marginMm?.top,
      pageSetup?.marginMm?.right,
      pageSetup?.marginMm?.bottom,
      pageSetup?.marginMm?.left,
      pageSetup?.showPageNumbers,
      pagedMode,
      stripSettings.headerUrl,
      stripSettings.footerUrl,
      stripSettings.bgColor,
      stripSettings.headerHeight,
      stripSettings.footerHeight,
      stripSettings.headerContentGap,
      stripSettings.footerContentGap,
      stripSettings.pageGap,
      showHeaderStrip,
      showFooterStrip,
      canResizeStrips,
    ],
  );

  const beginStripResize = (position: "header" | "footer", clientY: number) => {
    dragRef.current = {
      position,
      startY: clientY,
      startHeight: position === "header" ? stripSettings.headerHeight : stripSettings.footerHeight,
    };
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  const setContextMenuCursor = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!editor) return;
    const target = event.target as HTMLElement | null;
    if (!target || !editor.view.dom.contains(target)) return;
    if (target.closest(".rm-page-header, .rm-page-footer, .rm-pages-wrapper")) {
      event.preventDefault();
      return;
    }

    const resolved = editor.view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });
    if (!resolved) return;

    editor.chain().setTextSelection(resolved.pos).run();
  };

  const insertField = (field: DynamicFieldDefinition) => {
    if (!editor) return;
    (editor.chain().focus() as any).insertDynamicField(field.key, field.label).run();
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        history: { depth: 200, newGroupDelay: 400 },
      } as any),
      AdvancedTextStyle,
      Color,
      FontFamily,
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      DynamicField,
      MultiSelection,
      Placeholder.configure({ placeholder: "התחל לכתוב..." }),
      PaginationPlus.configure(paginationOptions),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        dir: "rtl",
        class:
          "flow-editor-content min-h-[60vh] max-w-none focus:outline-none",
        "data-paged": pagedMode ? "true" : "false",
      },
      handleKeyDown(view, event) {
        const mod = event.ctrlKey || event.metaKey;
        if (!mod) return false;
        const key = event.key.toLowerCase();
        // Ctrl/Cmd + Z = undo, Ctrl/Cmd + Shift + Z = redo, Ctrl/Cmd + Y = redo
        if (key === "z" && !event.shiftKey) {
          event.preventDefault();
          (editor as any)?.chain().focus().undo().run();
          return true;
        }
        if ((key === "z" && event.shiftKey) || key === "y") {
          event.preventDefault();
          (editor as any)?.chain().focus().redo().run();
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        onChange(editor.getHTML());
      }, 500);
    },
  });

  // עדכון תוכן כשטוענים מסמך חדש (החלפת תבנית)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (initialHtml && initialHtml !== current) {
      editor.commands.setContent(initialHtml, { emitUpdate: false } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml, editor]);

  // עדכון resolver של שדות דינמיים + צריבת snapshot לתוך attrs של כל node
  // כך שערכים שנפתרו יישרדו רענון/החלפת טאב גם בלי resolver פעיל.
  useEffect(() => {
    if (!editor) return;
    const mergeData = projectToMergeData(projectDetails);
    setFieldResolver((key) => {
      const v = mergeData[key];
      return v === undefined || v === "" ? null : v;
    });
    try {
      const { state } = editor;
      const tr = state.tr;
      let changed = false;
      state.doc.descendants((node, pos) => {
        if (node.type.name !== "dynamicField") return;
        const key = String(node.attrs.key || "");
        const live = mergeData[key];
        const next =
          live === undefined || live === ""
            ? node.attrs.resolvedValue ?? null
            : String(live);
        if (next !== (node.attrs.resolvedValue ?? null)) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, resolvedValue: next });
          changed = true;
        }
      });
      if (changed) {
        editor.view.dispatch(tr);
      } else {
        // טריגר רינדור גם כשאין שינוי attrs (למשל החלפת תבנית בלי ערכים)
        editor.view.dispatch(state.tr.setMeta("dynamicFieldResolverChanged", true));
      }
    } catch {
      /* ignore */
    }
    return () => {
      setFieldResolver(null);
    };
  }, [editor, projectDetails]);

  useEffect(() => {
    if (!editor) return;

    const dom = editor.view.dom as HTMLElement;
    dom.dataset.paged = pagedMode ? "true" : "false";

    const commands = editor.commands as any;
    if (pagedMode) {
      commands.enablePagination?.();
      commands.updatePageBreakBackground?.(paginationOptions.pageBreakBackground);
      commands.updatePageWidth?.(paginationOptions.pageWidth);
      commands.updatePageHeight?.(paginationOptions.pageHeight);
      commands.updatePageGap?.(paginationOptions.pageGap);
      commands.updateMargins?.({
        top: paginationOptions.marginTop,
        right: paginationOptions.marginRight,
        bottom: paginationOptions.marginBottom,
        left: paginationOptions.marginLeft,
      });
      commands.updateContentMargins?.({
        top: paginationOptions.contentMarginTop,
        bottom: paginationOptions.contentMarginBottom,
      });
      commands.updateHeaderContent?.(paginationOptions.headerLeft, paginationOptions.headerRight);
      commands.updateFooterContent?.(paginationOptions.footerLeft, paginationOptions.footerRight);
    } else {
      commands.disablePagination?.();
    }

    editor.view.dispatch(
      editor.state.tr.setMeta("flow-pagination-settings", {
        enabled: pagedMode,
        pageWidth: paginationOptions.pageWidth,
        pageHeight: paginationOptions.pageHeight,
      }),
    );
  }, [editor, pagedMode, paginationOptions]);

  useEffect(() => {
    if (!editor || !onDesignSettingsChange) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const handle = target?.closest("[data-flow-strip-handle]");
      if (!handle || !editor.view.dom.contains(handle)) return;

      const position = handle.getAttribute("data-flow-strip-handle") === "footer" ? "footer" : "header";
      event.preventDefault();
      event.stopPropagation();
      beginStripResize(position, event.clientY);
    };

    const dom = editor.view.dom;
    dom.addEventListener("mousedown", handleMouseDown, true);
    return () => dom.removeEventListener("mousedown", handleMouseDown, true);
  }, [
    editor,
    onDesignSettingsChange,
    stripSettings.headerHeight,
    stripSettings.footerHeight,
  ]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !onDesignSettingsChange) return;
      const delta = event.clientY - drag.startY;
      const rawHeight =
        drag.position === "header"
          ? drag.startHeight + delta
          : drag.startHeight - delta;
      const nextHeight = Math.max(24, Math.min(420, Math.round(rawHeight)));
      onDesignSettingsChange(
        drag.position === "header"
          ? { headerStripHeight: nextHeight }
          : { footerStripHeight: nextHeight },
      );
    };

    const handleUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [onDesignSettingsChange]);

  // Multi-selection: Ctrl/Cmd + drag לסימון מספר טווחים, ESC/קליק רגיל לאיפוס
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;

    const onMouseDown = (e: MouseEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const sel = editor.state.selection;
      if (!sel.empty) {
        addExtraRange(editor, { from: sel.from, to: sel.to });
      }
    };
    const onClick = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      // איפוס רק אם לא לוחצים על תפריט הצף/פופאובר
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-radix-popper-content-wrapper]")) return;
      if (getExtraRanges(editor).length) clearExtraRanges(editor);
    };

    dom.addEventListener("mousedown", onMouseDown, true);
    dom.addEventListener("click", onClick);
    return () => {
      dom.removeEventListener("mousedown", onMouseDown, true);
      dom.removeEventListener("click", onClick);
    };
  }, [editor]);

  return (
    <div className="flex h-full flex-col bg-background">

      <MenuBar
        editor={editor}
        fields={dynamicFields}
        onCreateField={() => setCreateFieldOpen(true)}
      />
      <BubbleToolbar editor={editor} />
      <CreateFieldDialog
        open={createFieldOpen}
        onOpenChange={setCreateFieldOpen}
        onCreated={(field) => {
          if (editor) {
            (editor.chain().focus() as any).insertDynamicField(field.key, field.label).run();
          }
        }}
      />
      <div
        className={`flow-editor-scroll flex-1 overflow-auto ${
          pagedMode ? "bg-slate-200/70" : "bg-muted/30"
        }`}
        style={{
          ...editorPageVars(pageSetup),
          "--flow-editor-header-strip-height": showHeaderStrip
            ? `${stripSettings.headerHeight}px`
            : "0px",
          "--flow-editor-footer-strip-height": showFooterStrip
            ? `${stripSettings.footerHeight}px`
            : "0px",
          "--flow-editor-page-gap": `${stripSettings.pageGap}px`,
        } as React.CSSProperties}
      >
        <div
          className={`flow-editor-shell mx-auto my-4 ${
            pagedMode
              ? "flow-editor-shell-paged flow-editor-shell-pagination-plus"
              : "max-w-[860px] rounded-md border bg-background shadow-sm"
          }`}
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="flow-editor-context-trigger" onContextMenu={setContextMenuCursor}>
                <EditorContent editor={editor} />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="max-h-80 w-64 overflow-auto">
              <ContextMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                הוסף שדה במקום הסמן
              </ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem
                onSelect={() => setCreateFieldOpen(true)}
                className="gap-2 text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">צור שדה חדש...</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              {Object.entries(fieldGroups).map(([group, fields], index) => (
                <React.Fragment key={group}>
                  {index > 0 && <ContextMenuSeparator />}
                  <ContextMenuSub>
                    <ContextMenuSubTrigger className="justify-between">
                      {group}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="max-h-72 w-56 overflow-auto">
                      {fields.map((field) => (
                        <ContextMenuItem
                          key={field.key}
                          onSelect={() => insertField(field)}
                          className="gap-2"
                        >
                          <span className="text-sm">{field.label}</span>
                          <span className="mr-auto text-[10px] text-muted-foreground">
                            {field.key}
                          </span>
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </React.Fragment>
              ))}
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>
      <style>{`
        .flow-editor-content { padding: 1.5rem; font-family: ${preset?.fonts.body || "Heebo, Arial, sans-serif"}; font-size: ${preset?.fonts.size || "14px"}; line-height: ${preset?.spacing.lineHeight || "1.7"}; color: ${preset?.colors.text || "hsl(var(--foreground))"}; }
        .flow-editor-shell-paged {
          position: relative;
          width: var(--flow-editor-page-width);
          max-width: none;
          min-height: auto;
        }
        .flow-editor-content.rm-with-pagination[data-paged="true"] {
          box-sizing: border-box;
          width: var(--flow-editor-page-width) !important;
          max-width: none;
          min-height: var(--flow-editor-page-height);
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          background: #ffffff;
          border: 1px solid rgba(22, 44, 88, 0.18) !important;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
          overflow: visible;
        }
        .flow-editor-content.rm-with-pagination[data-paged="false"],
        .flow-editor-content.rm-with-pagination[rm-pagination-disabled] {
          width: auto !important;
          border: 0 !important;
          padding: 1.5rem !important;
          background: transparent;
          box-shadow: none;
          min-height: 60vh !important;
        }
        .flow-editor-content.rm-with-pagination .rm-page-header,
        .flow-editor-content.rm-with-pagination .rm-page-footer {
          direction: rtl;
          cursor: default !important;
          overflow: visible !important;
        }
        .flow-editor-content.rm-with-pagination .rm-page-header-content,
        .flow-editor-content.rm-with-pagination .rm-page-footer-content {
          position: relative;
          overflow: visible !important;
        }
        .flow-editor-content.rm-with-pagination .rm-first-page-header .rm-page-header-content {
          width: calc(100% + var(--rm-margin-left) + var(--rm-margin-right)) !important;
          margin-left: calc(-1 * var(--rm-margin-left));
          margin-right: calc(-1 * var(--rm-margin-right));
        }
        .flow-editor-content.rm-with-pagination .rm-page-header-left,
        .flow-editor-content.rm-with-pagination .rm-page-footer-left {
          display: block !important;
          float: none !important;
          width: 100%;
          margin: 0 !important;
        }
        .flow-editor-content.rm-with-pagination .rm-page-header-right {
          display: none !important;
        }
        .flow-editor-content.rm-with-pagination .rm-page-footer-right {
          position: absolute;
          left: 50%;
          bottom: 6px;
          z-index: 4;
          display: block !important;
          float: none !important;
          margin: 0 !important;
          transform: translateX(-50%);
        }
        .flow-page-strip-frame {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-top: 1px solid rgba(216, 172, 39, 0.34);
          border-bottom: 1px solid rgba(216, 172, 39, 0.34);
          background: ${stripSettings.bgColor};
        }
        .flow-page-strip-img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: fill;
          user-select: none;
          pointer-events: none;
        }
        .flow-page-number-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 38px;
          height: 20px;
          padding: 0 8px;
          border: 1px solid rgba(22, 44, 88, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.84);
          color: #162c58;
          font-size: 11px;
          line-height: 1;
          white-space: nowrap;
        }
        .flow-editor-content.rm-with-pagination .rm-pagination-gap {
          border: 0 !important;
          background: transparent !important;
          position: relative;
        }
        .flow-editor-content.rm-with-pagination .rm-pagination-gap::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 12%;
          right: 12%;
          height: 1px;
          transform: translateY(-50%);
          background: rgba(216, 172, 39, 0.95);
        }
        .flow-editor-strip-handle {
          position: absolute;
          left: 50%;
          z-index: 8;
          width: 92px;
          height: 13px;
          transform: translateX(-50%);
          border: 1px solid rgba(22, 44, 88, 0.35);
          border-radius: 999px;
          background: linear-gradient(180deg, #ffffff, #eef4fb);
          box-shadow: 0 3px 10px rgba(15, 23, 42, 0.18);
          cursor: ns-resize;
          pointer-events: auto;
          padding: 0;
        }
        .flow-editor-strip-handle::before {
          content: "";
          position: absolute;
          inset: 4px 20px;
          border-top: 1px solid rgba(22, 44, 88, 0.5);
          border-bottom: 1px solid rgba(22, 44, 88, 0.5);
        }
        .flow-editor-strip-handle-bottom {
          bottom: -7px;
        }
        .flow-editor-strip-handle-top {
          top: -7px;
        }
        .flow-editor-content h1 { font-size: ${preset?.headings.h1.size || "1.6rem"}; font-weight: ${preset?.headings.h1.weight || "700"}; margin: 1rem 0 0.5rem; color: ${preset?.colors.heading || "hsl(var(--primary))"}; border-bottom: 2px solid ${preset?.colors.accent || "hsl(var(--accent))"}; padding-bottom: .3rem; font-family: ${preset?.fonts.heading || "inherit"}; }
        .flow-editor-content h2 { font-size: ${preset?.headings.h2.size || "1.3rem"}; font-weight: ${preset?.headings.h2.weight || "700"}; margin: .9rem 0 .4rem; color: ${preset?.colors.heading || "hsl(var(--primary))"}; font-family: ${preset?.fonts.heading || "inherit"}; }
        .flow-editor-content h3 { font-size: 1.1rem; font-weight: 600; margin: .7rem 0 .3rem; color: ${preset?.colors.heading || "hsl(var(--primary))"}; }
        .flow-editor-content p { margin: 0 0 ${preset?.spacing.paragraphGap || ".5rem"}; }
        .flow-editor-content ul, .flow-editor-content ol { padding-inline-start: 1.5rem; margin: 0 0 .7rem; }
        .flow-editor-content li { margin-bottom: .2rem; }
        .flow-editor-content table { border-collapse: collapse; width: 100%; margin: .5rem 0; }
        .flow-editor-content th, .flow-editor-content td { border: 1px solid hsl(var(--border)); padding: .35rem .55rem; text-align: right; }
        .flow-editor-content th { background: ${preset?.colors.heading || "hsl(var(--primary))"}; color: #fff; }
        .flow-editor-content hr { border: 0; border-top: 1px dashed hsl(var(--border)); margin: .8rem 0; }
        .flow-editor-content mark { background: ${preset?.colors.accent || "hsl(var(--accent))"}59; padding: 0 .15rem; border-radius: .15rem; }
        .flow-editor-content [data-field] { user-select: all; }
        .flow-editor-content .ProseMirror-focused { outline: none; }
      `}</style>
    </div>
  );
}
