// FlowEditor — TipTap rich text editor, RTL, עם autosave ושדות דינמיים
import React, { useEffect, useRef } from "react";
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
import DynamicField from "./DynamicField";
import MenuBar from "./MenuBar";
import BubbleToolbar from "./BubbleToolbar";
import AdvancedTextStyle from "./AdvancedTextStyle";

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
}

const PAGE_SIZES_MM: Record<string, { width: number; height: number }> = {
  A5: { width: 148, height: 210 },
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
};

function editorPageVars(pageSetup?: FlowPageSetup): React.CSSProperties {
  if (!pageSetup || pageSetup.size === "none") return {};

  const base =
    pageSetup.size === "custom"
      ? {
          width: Math.max(50, pageSetup.customSizeMm?.width || 210),
          height: Math.max(50, pageSetup.customSizeMm?.height || 297),
        }
      : PAGE_SIZES_MM[pageSetup.size] || PAGE_SIZES_MM.A4;
  const landscape = pageSetup.size !== "custom" && pageSetup.orientation === "landscape";
  const width = landscape ? base.height : base.width;
  const height = landscape ? base.width : base.height;
  const margin = pageSetup.marginMm || { top: 32, right: 18, bottom: 28, left: 18 };

  return {
    "--flow-editor-page-width": `${width}mm`,
    "--flow-editor-page-height": `${height}mm`,
    "--flow-editor-page-gap": "18mm",
    "--flow-editor-page-padding-top": `${margin.top}mm`,
    "--flow-editor-page-padding-right": `${margin.right}mm`,
    "--flow-editor-page-padding-bottom": `${margin.bottom}mm`,
    "--flow-editor-page-padding-left": `${margin.left}mm`,
    "--flow-editor-page-padding": `${margin.top}mm ${margin.right}mm ${margin.bottom}mm ${margin.left}mm`,
  } as React.CSSProperties;
}

function firstValue<T>(...values: Array<T | null | undefined | "">): T | undefined {
  return values.find((value) => value !== undefined && value !== null && value !== "") as T | undefined;
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
    showHeader: ds.repeatHeaderOnAllPages !== false,
    showFooter: ds.repeatFooterOnAllPages !== false,
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
  const visualPageCount = 10;

  const startStripResize = (
    position: "header" | "footer",
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      position,
      startY: event.clientY,
      startHeight: position === "header" ? stripSettings.headerHeight : stripSettings.footerHeight,
    };
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
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
      Placeholder.configure({ placeholder: "התחל לכתוב..." }),
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

  return (
    <div className="flex h-full flex-col bg-background">
      <MenuBar editor={editor} />
      <BubbleToolbar editor={editor} />
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
          "--flow-editor-visual-page-count": visualPageCount,
        } as React.CSSProperties}
      >
        <div
          className={`flow-editor-shell mx-auto my-4 ${
            pagedMode
              ? "flow-editor-shell-paged"
              : "max-w-[860px] rounded-md border bg-background shadow-sm"
          }`}
        >
          {showHeaderStrip &&
            Array.from({ length: visualPageCount }).map((_, index) => (
              <div
                key={`header-${index}`}
                className="flow-editor-strip-instance flow-editor-strip-header"
                style={{
                  top: `calc(${index} * (var(--flow-editor-page-height) + var(--flow-editor-page-gap)))`,
                  height: `${stripSettings.headerHeight}px`,
                  backgroundImage: `url("${String(stripSettings.headerUrl || "").replace(/"/g, "%22")}")`,
                }}
              >
                {onDesignSettingsChange && index === 0 && (
                  <button
                    type="button"
                    className="flow-editor-strip-handle flow-editor-strip-handle-bottom"
                    onMouseDown={(event) => startStripResize("header", event)}
                    title="גרור לשינוי גובה הסטריפ העליון"
                    aria-label="גרור לשינוי גובה הסטריפ העליון"
                  />
                )}
              </div>
            ))}
          {showFooterStrip &&
            Array.from({ length: visualPageCount }).map((_, index) => (
              <div
                key={`footer-${index}`}
                className="flow-editor-strip-instance flow-editor-strip-footer"
                style={{
                  top: `calc(${index} * (var(--flow-editor-page-height) + var(--flow-editor-page-gap)) + var(--flow-editor-page-height) - ${stripSettings.footerHeight}px)`,
                  height: `${stripSettings.footerHeight}px`,
                  backgroundImage: `url("${String(stripSettings.footerUrl || "").replace(/"/g, "%22")}")`,
                }}
              >
                {onDesignSettingsChange && index === 0 && (
                  <button
                    type="button"
                    className="flow-editor-strip-handle flow-editor-strip-handle-top"
                    onMouseDown={(event) => startStripResize("footer", event)}
                    title="גרור לשינוי גובה הסטריפ התחתון"
                    aria-label="גרור לשינוי גובה הסטריפ התחתון"
                  />
                )}
              </div>
            ))}
          <EditorContent editor={editor} />
        </div>
      </div>
      <style>{`
        .flow-editor-content { padding: 1.5rem; font-family: ${preset?.fonts.body || "Heebo, Arial, sans-serif"}; font-size: ${preset?.fonts.size || "14px"}; line-height: ${preset?.spacing.lineHeight || "1.7"}; color: ${preset?.colors.text || "hsl(var(--foreground))"}; }
        .flow-editor-shell-paged {
          position: relative;
          width: var(--flow-editor-page-width);
          max-width: none;
          min-height: calc(var(--flow-editor-page-height) * var(--flow-editor-visual-page-count) + var(--flow-editor-page-gap) * (var(--flow-editor-visual-page-count) - 1));
        }
        .flow-editor-shell-paged::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          inset-inline: 8%;
          z-index: 6;
          pointer-events: none;
          background:
            repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent var(--flow-editor-page-height),
              rgba(216, 172, 39, 0.9) var(--flow-editor-page-height),
              rgba(216, 172, 39, 0.9) calc(var(--flow-editor-page-height) + 1px),
              transparent calc(var(--flow-editor-page-height) + 1px),
              transparent calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap))
            );
        }
        .flow-editor-strip-instance {
          position: absolute;
          inset-inline: 0;
          z-index: 7;
          pointer-events: none;
          background-color: ${stripSettings.bgColor};
          background-repeat: no-repeat;
          background-position: center;
          background-size: 100% 100%;
          border: 1px solid rgba(216, 172, 39, 0.38);
          box-shadow: 0 1px 6px rgba(15, 23, 42, 0.08);
        }
        .flow-editor-strip-header { border-top: 0; }
        .flow-editor-strip-footer { border-bottom: 0; }
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
        .flow-editor-content[data-paged="true"] {
          width: var(--flow-editor-page-width);
          min-height: calc(var(--flow-editor-page-height) * var(--flow-editor-visual-page-count) + var(--flow-editor-page-gap) * (var(--flow-editor-visual-page-count) - 1));
          padding:
            max(var(--flow-editor-page-padding-top), calc(var(--flow-editor-header-strip-height) + 18px))
            var(--flow-editor-page-padding-right)
            max(var(--flow-editor-page-padding-bottom), calc(var(--flow-editor-footer-strip-height) + 18px))
            var(--flow-editor-page-padding-left);
          background:
            repeating-linear-gradient(
              to bottom,
              #ffffff 0,
              #ffffff var(--flow-editor-page-height),
              transparent var(--flow-editor-page-height),
              transparent calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap))
            );
          box-shadow:
            0 3px 12px rgba(15, 23, 42, 0.16),
            0 calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap)) 12px rgba(15, 23, 42, 0.16),
            0 calc((var(--flow-editor-page-height) + var(--flow-editor-page-gap)) * 2) 12px rgba(15, 23, 42, 0.16),
            0 calc((var(--flow-editor-page-height) + var(--flow-editor-page-gap)) * 3) 12px rgba(15, 23, 42, 0.16),
            0 calc((var(--flow-editor-page-height) + var(--flow-editor-page-gap)) * 4) 12px rgba(15, 23, 42, 0.16),
            0 calc((var(--flow-editor-page-height) + var(--flow-editor-page-gap)) * 5) 12px rgba(15, 23, 42, 0.16),
            0 calc((var(--flow-editor-page-height) + var(--flow-editor-page-gap)) * 6) 12px rgba(15, 23, 42, 0.16),
            0 calc((var(--flow-editor-page-height) + var(--flow-editor-page-gap)) * 7) 12px rgba(15, 23, 42, 0.16),
            0 calc((var(--flow-editor-page-height) + var(--flow-editor-page-gap)) * 8) 12px rgba(15, 23, 42, 0.16),
            0 calc((var(--flow-editor-page-height) + var(--flow-editor-page-gap)) * 9) 12px rgba(15, 23, 42, 0.16);
          overflow: visible;
        }
        .flow-editor-content[data-paged="true"] .ProseMirror {
          position: relative;
          z-index: 1;
        }
        .flow-editor-content[data-paged="true"] .ProseMirror {
          min-height: calc(var(--flow-editor-page-height) - 60mm);
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
