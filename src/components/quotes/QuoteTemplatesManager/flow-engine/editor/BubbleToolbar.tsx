// BubbleToolbar — תפריט צף שמופיע כשבוחרים טקסט בעורך
import React, { useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Copy,
  Palette,
  Sparkles,
  Type,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { applyAcrossRanges, getExtraRanges, clearExtraRanges } from "./MultiSelection";
import SmartColorPicker from "./SmartColorPicker";
import type { ColorCategory } from "./useSavedColors";

interface Props {
  editor: Editor | null;
}

const FONT_FAMILIES = [
  { label: "Heebo", value: "Heebo, Arial, sans-serif" },
  { label: "Assistant", value: "Assistant, Arial, sans-serif" },
  { label: "Rubik", value: "Rubik, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times", value: "'Times New Roman', serif" },
  { label: "Courier", value: "'Courier New', monospace" },
];

const FONT_SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "56px"];

const COLOR_SWATCHES = [
  "#000000", "#1f2937", "#dc2626", "#ea580c", "#d97706",
  "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#db2777",
  "#162C58", "#d8ac27",
];

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

export default function BubbleToolbar({ editor }: Props) {
  const [copied, setCopied] = useState(false);
  // re-render כשמשתנים ה-ranges (storage לא מפעיל רנדר אוטומטית)
  const [, force] = useState(0);
  React.useEffect(() => {
    if (!editor) return;
    const handler = () => force((n) => n + 1);
    editor.on("transaction", handler);
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("transaction", handler);
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);

  if (!editor) return null;

  const extras = getExtraRanges(editor);
  const extrasCount = extras.length;

  const btnBase =
    "inline-flex h-7 w-7 items-center justify-center rounded text-foreground hover:bg-muted transition-colors";
  const btnActive = "bg-primary text-primary-foreground hover:bg-primary/90";

  const apply = (cb: (chain: any) => any) => applyAcrossRanges(editor, cb);
  const run = (fn: () => void) => () => fn();

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

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top" }}
      shouldShow={({ editor, from, to }) => {
        if (!editor.isEditable) return false;
        const hasExtras = getExtraRanges(editor).length > 0;
        if (from === to && !hasExtras) return false;
        return true;
      }}
      className="z-50 flex items-center gap-0.5 rounded-lg border border-border bg-popover px-1.5 py-1 shadow-lg"
    >
      {/* Multi-selection indicator */}
      {extrasCount > 0 && (
        <>
          <button
            type="button"
            onClick={() => clearExtraRanges(editor)}
            title={`${extrasCount + 1} טווחים נבחרו — לחץ לאיפוס (Esc)`}
            className="inline-flex h-7 items-center gap-1 rounded bg-primary/10 px-1.5 text-[10px] font-bold text-primary hover:bg-primary/20"
          >
            ×{extrasCount + 1}
          </button>
          <div className="mx-1 h-5 w-px bg-border" />
        </>
      )}

      {/* Bold / Italic / Underline */}
      <button
        type="button"
        className={`${btnBase} ${editor.isActive("bold") ? btnActive : ""}`}
        onClick={run(() => apply((c) => c.toggleBold()))}
        title="מודגש"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={`${btnBase} ${editor.isActive("italic") ? btnActive : ""}`}
        onClick={run(() => apply((c) => c.toggleItalic()))}
        title="נטוי"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={`${btnBase} ${editor.isActive("underline") ? btnActive : ""}`}
        onClick={run(() => apply((c) => c.toggleUnderline()))}
        title="קו תחתון"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={`${btnBase} ${editor.isActive("highlight") ? btnActive : ""}`}
        onClick={run(() => apply((c) => c.toggleHighlight()))}
        title="הדגשה צהובה"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Font family */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={btnBase} title="גופן">
            <Type className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-44 p-1"
          align="center"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">גופן</div>
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              type="button"
              className="w-full rounded px-2 py-1 text-right text-sm hover:bg-muted"
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
          <button type="button" className={`${btnBase} text-[10px] font-bold`} title="גודל">
            A↕
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-32 p-1" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">גודל</div>
          <div className="grid grid-cols-3 gap-1">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded border border-border px-1 py-0.5 text-xs hover:bg-muted"
                onClick={() => apply((c) => c.setFontSize(s))}
              >
                {parseInt(s)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-1 w-full rounded px-2 py-1 text-right text-xs text-muted-foreground hover:bg-muted"
            onClick={() => apply((c) => c.setFontSize(null))}
          >
            אפס
          </button>
        </PopoverContent>
      </Popover>

      {/* Color */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={btnBase} title="צבע טקסט">
            <Palette className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="mb-1 text-[11px] text-muted-foreground">צבע טקסט</div>
          <div className="grid grid-cols-6 gap-1.5">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className="h-6 w-6 rounded border border-border"
                style={{ backgroundColor: c }}
                onClick={() => apply((ch) => ch.setGradient(null).setColor(c))}
                title={c}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              className="h-7 w-7 cursor-pointer rounded border border-border"
              onChange={(e) => {
                const v = e.target.value;
                apply((ch) => ch.setGradient(null).setColor(v));
              }}
            />
            <button
              type="button"
              className="ml-auto rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => apply((ch) => ch.setGradient(null).unsetColor())}
            >
              אפס צבע
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Gradient */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={btnBase} title="גרדיאנט">
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
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

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Letter spacing */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={`${btnBase} text-[10px] font-bold`} title="מרווח אותיות">
            A↔
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">מרווח בין אותיות</div>
          {SPACINGS.map((s) => (
            <button
              key={s.value}
              type="button"
              className="w-full rounded px-2 py-1 text-right text-sm hover:bg-muted"
              onClick={() => apply((c) => c.setLetterSpacing(s.value))}
            >
              {s.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Word spacing */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={`${btnBase} text-[10px] font-bold`} title="מרווח מילים">
            W↔
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">מרווח בין מילים</div>
          {WORD_SPACINGS.map((s) => (
            <button
              key={s.value}
              type="button"
              className="w-full rounded px-2 py-1 text-right text-sm hover:bg-muted"
              onClick={() => apply((c) => c.setWordSpacing(s.value))}
            >
              {s.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Align */}
      <button
        type="button"
        className={`${btnBase} ${editor.isActive({ textAlign: "right" }) ? btnActive : ""}`}
        onClick={() => apply((c) => c.setTextAlign("right"))}
        title="ימין"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={`${btnBase} ${editor.isActive({ textAlign: "center" }) ? btnActive : ""}`}
        onClick={() => apply((c) => c.setTextAlign("center"))}
        title="מרכז"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={`${btnBase} ${editor.isActive({ textAlign: "left" }) ? btnActive : ""}`}
        onClick={() => apply((c) => c.setTextAlign("left"))}
        title="שמאל"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={`${btnBase} ${editor.isActive({ textAlign: "justify" }) ? btnActive : ""}`}
        onClick={() => apply((c) => c.setTextAlign("justify"))}
        title="מיושר"
      >
        <AlignJustify className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Copy */}
      <button
        type="button"
        className={btnBase}
        onClick={copySelection}
        title={copied ? "הועתק" : "העתק"}
      >
        <Copy className={`h-3.5 w-3.5 ${copied ? "text-primary" : ""}`} />
      </button>
    </BubbleMenu>
  );
}
