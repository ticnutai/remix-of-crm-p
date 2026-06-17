import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Highlighter,
  Type,
  Plus,
  Minus,
} from "lucide-react";
import { SectionKey, SectionTextStyle, DEFAULT_SECTION_STYLE } from "./types";

interface SelectionToolbarProps {
  getStyle: (sectionKey: SectionKey) => SectionTextStyle;
  onChange: (sectionKey: SectionKey, style: SectionTextStyle) => void;
}

interface ToolbarPosition {
  top: number;
  left: number;
  sectionKey: SectionKey;
}

/**
 * Floating selection toolbar — appears above any text selection inside
 * a [data-section-key] container and applies SectionTextStyle changes
 * to the whole section (since text is rendered, not contentEditable).
 */
export function SelectionToolbar({ getStyle, onChange }: SelectionToolbarProps) {
  const [pos, setPos] = useState<ToolbarPosition | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setPos(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const anchor =
      (selection.anchorNode as HTMLElement | null)?.parentElement ||
      (selection.anchorNode as HTMLElement | null);
    if (!anchor) {
      setPos(null);
      return;
    }
    const sectionEl = (anchor as HTMLElement).closest?.(
      "[data-section-key]",
    ) as HTMLElement | null;
    if (!sectionEl) {
      setPos(null);
      return;
    }
    const sectionKey = sectionEl.getAttribute(
      "data-section-key",
    ) as SectionKey | null;
    if (!sectionKey) {
      setPos(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      setPos(null);
      return;
    }
    setPos({
      top: rect.top + window.scrollY - 48,
      left: rect.left + window.scrollX + rect.width / 2,
      sectionKey,
    });
  }, []);

  useEffect(() => {
    const onUp = () => {
      // Wait a tick so selection is finalized
      window.setTimeout(handleSelection, 10);
    };
    const onDown = (e: MouseEvent) => {
      if (toolbarRef.current?.contains(e.target as Node)) return;
    };
    const onScroll = () => setPos(null);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [handleSelection]);

  // Keyboard shortcuts (Ctrl+B/I/U) on active section selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pos) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        const s = { ...DEFAULT_SECTION_STYLE, ...getStyle(pos.sectionKey) };
        onChange(pos.sectionKey, {
          ...s,
          fontWeight: s.fontWeight === "bold" ? "normal" : "bold",
        });
      } else if (key === "i") {
        e.preventDefault();
        const s = { ...DEFAULT_SECTION_STYLE, ...getStyle(pos.sectionKey) };
        onChange(pos.sectionKey, { ...s, italic: !s.italic });
      } else if (key === "u") {
        e.preventDefault();
        const s = { ...DEFAULT_SECTION_STYLE, ...getStyle(pos.sectionKey) };
        onChange(pos.sectionKey, { ...s, underline: !s.underline });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pos, getStyle, onChange]);

  if (!pos) return null;

  const style = { ...DEFAULT_SECTION_STYLE, ...getStyle(pos.sectionKey) };

  const update = (updates: Partial<SectionTextStyle>) => {
    onChange(pos.sectionKey, { ...style, ...updates });
  };

  const toolbar = (
    <div
      ref={toolbarRef}
      className="fixed z-[100] flex items-center gap-0.5 rounded-lg border border-[#162C58]/20 bg-white shadow-xl px-1.5 py-1 print:hidden"
      style={{
        top: pos.top,
        left: pos.left,
        transform: "translateX(-50%)",
        direction: "rtl",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        title="הקטן גופן"
        onClick={() =>
          update({ fontSize: Math.max(6, (style.fontSize ?? 14) - 1) })
        }
        className="p-1.5 rounded hover:bg-muted text-muted-foreground"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="text-[11px] tabular-nums w-7 text-center text-muted-foreground">
        {style.fontSize}
      </span>
      <button
        title="הגדל גופן"
        onClick={() =>
          update({ fontSize: Math.min(96, (style.fontSize ?? 14) + 1) })
        }
        className="p-1.5 rounded hover:bg-muted text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <button
        title="בולד (Ctrl+B)"
        onClick={() =>
          update({
            fontWeight: style.fontWeight === "bold" ? "normal" : "bold",
          })
        }
        className={`p-1.5 rounded hover:bg-muted ${
          style.fontWeight === "bold" ? "bg-[#d8ac27]/15 text-[#162C58]" : ""
        }`}
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        title="נטוי (Ctrl+I)"
        onClick={() => update({ italic: !style.italic })}
        className={`p-1.5 rounded hover:bg-muted ${
          style.italic ? "bg-[#d8ac27]/15 text-[#162C58]" : ""
        }`}
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        title="קו תחתון (Ctrl+U)"
        onClick={() => update({ underline: !style.underline })}
        className={`p-1.5 rounded hover:bg-muted ${
          style.underline ? "bg-[#d8ac27]/15 text-[#162C58]" : ""
        }`}
      >
        <Underline className="h-3.5 w-3.5" />
      </button>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <button
        title="צבע טקסט"
        className="p-1 rounded hover:bg-muted relative"
      >
        <Type className="h-3.5 w-3.5" />
        <input
          type="color"
          value={style.fontColor}
          onChange={(e) => update({ fontColor: e.target.value })}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </button>
      <button
        title="צבע הדגשה"
        onClick={() =>
          update({
            backgroundColor: style.backgroundColor ? "" : "#fef08a",
          })
        }
        className={`p-1.5 rounded hover:bg-muted ${
          style.backgroundColor ? "bg-[#d8ac27]/15 text-[#162C58]" : ""
        }`}
      >
        <Highlighter className="h-3.5 w-3.5" />
      </button>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <button
        title="יישור לימין"
        onClick={() => update({ textAlign: "right" })}
        className={`p-1.5 rounded hover:bg-muted ${
          style.textAlign === "right" ? "bg-[#d8ac27]/15 text-[#162C58]" : ""
        }`}
      >
        <AlignRight className="h-3.5 w-3.5" />
      </button>
      <button
        title="מרכז"
        onClick={() => update({ textAlign: "center" })}
        className={`p-1.5 rounded hover:bg-muted ${
          style.textAlign === "center" ? "bg-[#d8ac27]/15 text-[#162C58]" : ""
        }`}
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </button>
      <button
        title="יישור לשמאל"
        onClick={() => update({ textAlign: "left" })}
        className={`p-1.5 rounded hover:bg-muted ${
          style.textAlign === "left" ? "bg-[#d8ac27]/15 text-[#162C58]" : ""
        }`}
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </button>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Line height */}
      <button
        title="הקטן מרווח שורות"
        onClick={() => update({ lineHeight: Math.max(0.8, +((style.lineHeight ?? 1.6) - 0.1).toFixed(1)) })}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground text-[11px] font-mono leading-none"
      >↕−</button>
      <span className="text-[11px] tabular-nums w-8 text-center text-muted-foreground">
        {(style.lineHeight ?? 1.6).toFixed(1)}
      </span>
      <button
        title="הגדל מרווח שורות"
        onClick={() => update({ lineHeight: Math.min(4, +((style.lineHeight ?? 1.6) + 0.1).toFixed(1)) })}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground text-[11px] font-mono leading-none"
      >↕+</button>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Letter spacing */}
      <button
        title="הקטן מרווח אותיות"
        onClick={() => update({ letterSpacing: Math.max(-3, +((style.letterSpacing ?? 0) - 0.5).toFixed(1)) })}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground text-[11px] font-mono leading-none"
      >A−</button>
      <span className="text-[11px] tabular-nums w-6 text-center text-muted-foreground">
        {style.letterSpacing ?? 0}
      </span>
      <button
        title="הגדל מרווח אותיות"
        onClick={() => update({ letterSpacing: Math.min(15, +((style.letterSpacing ?? 0) + 0.5).toFixed(1)) })}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground text-[11px] font-mono leading-none"
      >A+</button>

      {/* Small caret pointing down */}
      <span
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-[#162C58]/20 rotate-45"
        aria-hidden
      />
    </div>
  );

  return createPortal(toolbar, document.body);
}
