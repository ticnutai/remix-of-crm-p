// BubbleToolbar — תפריט צף משודרג שמופיע כשבוחרים טקסט בעורך
import React, { useCallback, useMemo, useRef, useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Copy,
  Palette,
  Sparkles,
  Type,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Link2Off,
  Eraser,
  ALargeSmall,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { applyAcrossRanges, getExtraRanges, clearExtraRanges } from "./MultiSelection";
import SmartColorPicker from "./SmartColorPicker";

interface Props {
  editor: Editor | null;
}

const FONT_FAMILIES = [
  { label: "Heebo", value: "Heebo, Arial, sans-serif" },
  { label: "Assistant", value: "Assistant, Arial, sans-serif" },
  { label: "Rubik", value: "Rubik, Arial, sans-serif" },
  { label: "Noto Sans עברית", value: "'Noto Sans Hebrew', Arial, sans-serif" },
  { label: "Alef", value: "Alef, Arial, sans-serif" },
  { label: "Secular One", value: "'Secular One', Arial, sans-serif" },
  { label: "Miriam Libre", value: "'Miriam Libre', Arial, sans-serif" },
  { label: "דוד (David Libre)", value: "'David Libre', 'David', serif" },
  { label: "Frank Ruhl Libre", value: "'Frank Ruhl Libre', serif" },
  { label: "Noto Serif עברית", value: "'Noto Serif Hebrew', serif" },
  { label: "Bellefair", value: "Bellefair, serif" },
  { label: "Suez One", value: "'Suez One', serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times", value: "'Times New Roman', serif" },
  { label: "Courier", value: "'Courier New', monospace" },
];

const FONT_SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "56px"];

const GRADIENTS = [
  { label: "זהב", value: "linear-gradient(90deg,#d8ac27,#f4d03f)" },
  { label: "מלכותי", value: "linear-gradient(90deg,#162C58,#2563eb)" },
  { label: "שקיעה", value: "linear-gradient(90deg,#dc2626,#ea580c,#d8ac27)" },
  { label: "אוקיינוס", value: "linear-gradient(90deg,#0891b2,#2563eb,#7c3aed)" },
  { label: "יער", value: "linear-gradient(90deg,#16a34a,#0891b2)" },
  { label: "ורוד", value: "linear-gradient(90deg,#db2777,#7c3aed)" },
];

const SPACINGS = [
  { label: "צר", value: "-0.02em" },
  { label: "רגיל", value: "0" },
  { label: "רחב", value: "0.05em" },
  { label: "רחב מאוד", value: "0.12em" },
  { label: "עצום", value: "0.25em" },
];

const WORD_SPACINGS = [
  { label: "רגיל", value: "0" },
  { label: "רחב", value: "0.15em" },
  { label: "רחב מאוד", value: "0.35em" },
  { label: "עצום", value: "0.6em" },
];

// כפתור גדול ונוח עם אייקון + תווית
function ToolBtn({
  icon: Icon,
  label,
  active,
  onClick,
  title,
  children,
}: {
  icon?: any;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 min-w-[44px] h-[46px] transition-colors ${
        active
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-foreground hover:bg-muted"
      }`}
    >
      {Icon ? <Icon className="h-[20px] w-[20px]" strokeWidth={2.2} /> : children}
      {label && <span className="text-[10px] leading-none">{label}</span>}
    </button>
  );
}

const divider = (
  <div className="mx-0.5 h-8 w-px bg-border self-center" />
);

export default function BubbleToolbar({ editor }: Props) {
  const [copied, setCopied] = useState(false);
  const [, force] = useState(0);
  const extrasCountRef = useRef(0);
  React.useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const nextCount = getExtraRanges(editor).length;
      if (nextCount !== extrasCountRef.current) {
        extrasCountRef.current = nextCount;
        force((n) => n + 1);
      }
    };
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);

  if (!editor) return null;

  const extras = getExtraRanges(editor);
  const extrasCount = extras.length;

  const apply = (cb: (chain: any) => any) => applyAcrossRanges(editor, cb);
  const bubbleOptions = useMemo(() => ({ placement: "top" as const, offset: 10 }), []);
  const shouldShow = useCallback(({ editor, from, to }: { editor: Editor; from: number; to: number }) => {
    if (!editor.isEditable) return false;
    const hasExtras = getExtraRanges(editor).length > 0;
    if (from === to && !hasExtras) return false;
    return true;
  }, []);

  const copySelection = async () => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const text = editor.state.doc.textBetween(from, to, "\n", " ");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  const promptLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("כתובת קישור (https://...)", prev || "https://");
    if (url === null) return;
    if (url === "") {
      apply((c) => c.unsetLink());
      return;
    }
    apply((c) => c.extendMarkRange("link").setLink({ href: url, target: "_blank" }));
  };

  return (
    <BubbleMenu
      editor={editor}
      options={bubbleOptions}
      shouldShow={shouldShow}
      className="z-50 flex items-center gap-0.5 rounded-xl border border-border bg-popover px-2 py-1.5 shadow-2xl backdrop-blur"
      style={{ direction: "rtl" }}
    >
      {extrasCount > 0 && (
        <>
          <button
            type="button"
            onClick={() => clearExtraRanges(editor)}
            title={`${extrasCount + 1} טווחים נבחרו — לחץ לאיפוס (Esc)`}
            className="inline-flex h-[46px] items-center gap-1 rounded-md bg-primary/10 px-2 text-xs font-bold text-primary hover:bg-primary/20"
          >
            ×{extrasCount + 1}
          </button>
          {divider}
        </>
      )}

      {/* Bold / Italic / Underline */}
      <ToolBtn icon={Bold} label="בולד" active={editor.isActive("bold")} onClick={() => apply((c) => c.toggleBold())} />
      <ToolBtn icon={Italic} label="נטוי" active={editor.isActive("italic")} onClick={() => apply((c) => c.toggleItalic())} />
      <ToolBtn icon={UnderlineIcon} label="קו" active={editor.isActive("underline")} onClick={() => apply((c) => c.toggleUnderline())} />

      {divider}

      {/* Headings */}
      <ToolBtn icon={Heading1} label="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => apply((c) => c.toggleHeading({ level: 1 }))} />
      <ToolBtn icon={Heading2} label="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => apply((c) => c.toggleHeading({ level: 2 }))} />
      <ToolBtn icon={Heading3} label="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => apply((c) => c.toggleHeading({ level: 3 }))} />

      {divider}

      {/* Lists */}
      <ToolBtn icon={List} label="תבליט" active={editor.isActive("bulletList")} onClick={() => apply((c) => c.toggleBulletList())} />
      <ToolBtn icon={ListOrdered} label="ממוספר" active={editor.isActive("orderedList")} onClick={() => apply((c) => c.toggleOrderedList())} />

      {divider}

      {/* Font family */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" title="גופן" className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 min-w-[44px] h-[46px] text-foreground hover:bg-muted">
            <Type className="h-[20px] w-[20px]" strokeWidth={2.2} />
            <span className="text-[10px] leading-none">גופן</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1 max-h-[320px] overflow-y-auto" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">גופן</div>
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              type="button"
              className="w-full rounded px-2 py-1.5 text-right text-sm hover:bg-muted"
              style={{ fontFamily: f.value }}
              onClick={() => apply((c) => c.setFontFamily(f.value))}
            >
              {f.label}
            </button>
          ))}
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            className="w-full rounded px-2 py-1 text-right text-xs text-muted-foreground hover:bg-muted"
            onClick={() => apply((c) => c.unsetFontFamily())}
          >
            אפס גופן
          </button>
        </PopoverContent>
      </Popover>

      {/* Font size */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" title="גודל" className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 min-w-[44px] h-[46px] text-foreground hover:bg-muted">
            <ALargeSmall className="h-[20px] w-[20px]" strokeWidth={2.2} />
            <span className="text-[10px] leading-none">גודל</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="mb-1 px-1 text-[11px] text-muted-foreground">גודל גופן</div>
          <div className="grid grid-cols-3 gap-1">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded border border-border px-1.5 py-1 text-xs hover:bg-muted"
                onClick={() => apply((c) => c.setFontSize(s))}
              >
                {parseInt(s)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 w-full rounded px-2 py-1 text-right text-xs text-muted-foreground hover:bg-muted"
            onClick={() => apply((c) => c.setFontSize(null))}
          >
            אפס
          </button>
        </PopoverContent>
      </Popover>

      {/* Colors */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" title="צבעים" className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 min-w-[44px] h-[46px] text-foreground hover:bg-muted">
            <Palette className="h-[20px] w-[20px]" strokeWidth={2.2} />
            <span className="text-[10px] leading-none">צבע</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 overflow-hidden" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SmartColorPicker
            initialCategory="text"
            onPick={(color, category) => {
              if (category === "text") {
                apply((ch) => ch.setGradient(null).setColor(color));
              } else if (category === "highlight") {
                apply((ch) => ch.setHighlight({ color }));
              } else if (category === "underline") {
                apply((ch) => ch.setUnderlineColor(color));
              }
            }}
            onClear={(category) => {
              if (category === "text") {
                apply((ch) => ch.unsetColor());
              } else if (category === "highlight") {
                apply((ch) => ch.unsetHighlight());
              } else if (category === "underline") {
                apply((ch) => ch.setUnderlineColor(null));
              }
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Gradient */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" title="גרדיאנט" className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 min-w-[44px] h-[46px] text-foreground hover:bg-muted">
            <Sparkles className="h-[20px] w-[20px]" strokeWidth={2.2} />
            <span className="text-[10px] leading-none">גרדיאנט</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="mb-1 text-[11px] text-muted-foreground">גרדיאנט טקסט</div>
          <div className="grid grid-cols-1 gap-1">
            {GRADIENTS.map((g) => (
              <button
                key={g.value}
                type="button"
                className="rounded border border-border px-2 py-1.5 text-right text-sm font-bold"
                style={{
                  background: g.value,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                }}
                onClick={() => apply((c) => c.setGradient(g.value))}
              >
                {g.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-1 w-full rounded px-2 py-1 text-right text-xs text-muted-foreground hover:bg-muted"
            onClick={() => apply((c) => c.setGradient(null))}
          >
            הסר גרדיאנט
          </button>
        </PopoverContent>
      </Popover>

      {divider}

      {/* Align */}
      <ToolBtn icon={AlignRight} label="ימין" active={editor.isActive({ textAlign: "right" })} onClick={() => apply((c) => c.setTextAlign("right"))} />
      <ToolBtn icon={AlignCenter} label="מרכז" active={editor.isActive({ textAlign: "center" })} onClick={() => apply((c) => c.setTextAlign("center"))} />
      <ToolBtn icon={AlignLeft} label="שמאל" active={editor.isActive({ textAlign: "left" })} onClick={() => apply((c) => c.setTextAlign("left"))} />
      <ToolBtn icon={AlignJustify} label="מיושר" active={editor.isActive({ textAlign: "justify" })} onClick={() => apply((c) => c.setTextAlign("justify"))} />

      {divider}

      {/* Letter spacing */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" title="מרווח אותיות" className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 min-w-[44px] h-[46px] text-foreground hover:bg-muted">
            <span className="text-sm font-bold leading-none">A↔</span>
            <span className="text-[10px] leading-none">אותיות</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">מרווח בין אותיות</div>
          {SPACINGS.map((s) => (
            <button key={s.value} type="button" className="w-full rounded px-2 py-1.5 text-right text-sm hover:bg-muted" onClick={() => apply((c) => c.setLetterSpacing(s.value))}>
              {s.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Word spacing */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" title="מרווח מילים" className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 min-w-[44px] h-[46px] text-foreground hover:bg-muted">
            <span className="text-sm font-bold leading-none">W↔</span>
            <span className="text-[10px] leading-none">מילים</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">מרווח בין מילים</div>
          {WORD_SPACINGS.map((s) => (
            <button key={s.value} type="button" className="w-full rounded px-2 py-1.5 text-right text-sm hover:bg-muted" onClick={() => apply((c) => c.setWordSpacing(s.value))}>
              {s.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {divider}

      {/* Link */}
      <ToolBtn icon={Link2} label="קישור" active={editor.isActive("link")} onClick={promptLink} />
      {editor.isActive("link") && (
        <ToolBtn icon={Link2Off} label="הסר" onClick={() => apply((c) => c.unsetLink())} />
      )}

      {/* Clear formatting */}
      <ToolBtn
        icon={Eraser}
        label="נקה"
        title="נקה עיצוב"
        onClick={() => apply((c) => c.unsetAllMarks().clearNodes())}
      />

      {/* Copy */}
      <ToolBtn
        icon={Copy}
        label={copied ? "הועתק" : "העתק"}
        onClick={copySelection}
        active={copied}
      />
    </BubbleMenu>
  );
}
