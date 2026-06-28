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
}: Props) {
  const debounceRef = useRef<number | null>(null);
  const pagedMode = Boolean(pageSetup && pageSetup.size !== "none");
  const stripSettings = getStripSettings(templateDesignSettings, designSettings);
  const showHeaderStrip = pagedMode && stripSettings.showHeader && Boolean(stripSettings.headerUrl);
  const showFooterStrip = pagedMode && stripSettings.showFooter && Boolean(stripSettings.footerUrl);

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

  return (
    <div className="flex h-full flex-col bg-background">
      <MenuBar editor={editor} />
      <BubbleToolbar editor={editor} />
      <div
        className={`flow-editor-scroll flex-1 overflow-auto ${
          pagedMode ? "bg-slate-200/70" : "bg-muted/30"
        }`}
        style={editorPageVars(pageSetup)}
      >
        <div
          className={`flow-editor-shell mx-auto my-4 ${
            pagedMode
              ? "flow-editor-shell-paged"
              : "max-w-[860px] rounded-md border bg-background shadow-sm"
          }`}
        >
          {showHeaderStrip && (
            <div
              className="flow-editor-repeat-strip flow-editor-repeat-strip-top"
              aria-hidden="true"
            />
          )}
          {showFooterStrip && (
            <div
              className="flow-editor-repeat-strip flow-editor-repeat-strip-bottom"
              aria-hidden="true"
            />
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
      <style>{`
        .flow-editor-content { padding: 1.5rem; font-family: ${preset?.fonts.body || "Heebo, Arial, sans-serif"}; font-size: ${preset?.fonts.size || "14px"}; line-height: ${preset?.spacing.lineHeight || "1.7"}; color: ${preset?.colors.text || "hsl(var(--foreground))"}; }
        .flow-editor-shell-paged { position: relative; width: var(--flow-editor-page-width); max-width: none; }
        .flow-editor-repeat-strip {
          position: absolute;
          inset-inline: 0;
          z-index: 2;
          pointer-events: none;
          background-color: ${stripSettings.bgColor};
          background-repeat: repeat-y;
          background-size: var(--flow-editor-page-width) calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap));
        }
        .flow-editor-repeat-strip-top {
          top: 0;
          height: calc(var(--flow-editor-page-height) * 3 + var(--flow-editor-page-gap) * 2);
          background-image:
            repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent ${stripSettings.headerHeight}px,
              rgba(255, 255, 255, 0) ${stripSettings.headerHeight}px,
              rgba(255, 255, 255, 0) calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap))
            ),
            url("${String(stripSettings.headerUrl || "").replace(/"/g, "%22")}");
          background-position:
            0 0,
            0 0;
          background-size:
            var(--flow-editor-page-width) calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap)),
            var(--flow-editor-page-width) calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap));
          clip-path: inset(0 0 0 0);
          -webkit-mask-image: repeating-linear-gradient(
            to bottom,
            #000 0,
            #000 ${stripSettings.headerHeight}px,
            transparent ${stripSettings.headerHeight}px,
            transparent calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap))
          );
          mask-image: repeating-linear-gradient(
            to bottom,
            #000 0,
            #000 ${stripSettings.headerHeight}px,
            transparent ${stripSettings.headerHeight}px,
            transparent calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap))
          );
        }
        .flow-editor-repeat-strip-bottom {
          top: 0;
          height: calc(var(--flow-editor-page-height) * 3 + var(--flow-editor-page-gap) * 2);
          background-image: url("${String(stripSettings.footerUrl || "").replace(/"/g, "%22")}");
          background-position: 0 calc(var(--flow-editor-page-height) - ${stripSettings.footerHeight}px);
          background-size: var(--flow-editor-page-width) calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap));
          -webkit-mask-image: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent calc(var(--flow-editor-page-height) - ${stripSettings.footerHeight}px),
            #000 calc(var(--flow-editor-page-height) - ${stripSettings.footerHeight}px),
            #000 var(--flow-editor-page-height),
            transparent var(--flow-editor-page-height),
            transparent calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap))
          );
          mask-image: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent calc(var(--flow-editor-page-height) - ${stripSettings.footerHeight}px),
            #000 calc(var(--flow-editor-page-height) - ${stripSettings.footerHeight}px),
            #000 var(--flow-editor-page-height),
            transparent var(--flow-editor-page-height),
            transparent calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap))
          );
        }
        .flow-editor-content[data-paged="true"] {
          width: var(--flow-editor-page-width);
          min-height: calc(var(--flow-editor-page-height) * 3 + var(--flow-editor-page-gap) * 2);
          padding: var(--flow-editor-page-padding);
          background:
            repeating-linear-gradient(
              to bottom,
              #ffffff 0,
              #ffffff var(--flow-editor-page-height),
              transparent var(--flow-editor-page-height),
              transparent calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap))
            );
          background-clip: padding-box;
          box-shadow:
            0 3px 12px rgba(15, 23, 42, 0.16),
            0 calc(var(--flow-editor-page-height) + var(--flow-editor-page-gap)) 12px rgba(15, 23, 42, 0.16),
            0 calc((var(--flow-editor-page-height) + var(--flow-editor-page-gap)) * 2) 12px rgba(15, 23, 42, 0.16);
          overflow: visible;
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
