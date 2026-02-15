import React, {
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import DOMPurify from 'dompurify';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Type,
  Palette,
  Undo,
  Redo,
  RemoveFormatting,
  Heading1,
  Heading2,
  Quote,
  Code,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
}

export interface RichTextEditorRef {
  getHTML: () => string;
  setHTML: (html: string) => void;
  insertText: (text: string) => void;
  focus: () => void;
}

const COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#cccccc",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#f43f5e",
];

const FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
];

export const RichTextEditor = forwardRef<
  RichTextEditorRef,
  RichTextEditorProps
>(
  (
    {
      value,
      onChange,
      placeholder = "כתוב כאן...",
      disabled = false,
      minHeight = "200px",
      className,
    },
    ref,
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInitRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getHTML: () => editorRef.current?.innerHTML || "",
      setHTML: (html: string) => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
        }
      },
      insertText: (text: string) => {
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand("insertText", false, text);
        }
      },
      focus: () => editorRef.current?.focus(),
    }));

    // Set initial value
    useEffect(() => {
      if (editorRef.current && value && !isInitRef.current) {
        editorRef.current.innerHTML = value;
        isInitRef.current = true;
      }
    }, [value]);

    const exec = useCallback(
      (command: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        // Trigger onChange
        if (onChange && editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      },
      [onChange],
    );

    const handleInput = useCallback(() => {
      if (onChange && editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, [onChange]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      // Allow rich text paste but sanitize for safety
      e.preventDefault();
      const html = e.clipboardData.getData("text/html");
      const text = e.clipboardData.getData("text/plain");

      if (html) {
        const clean = DOMPurify.sanitize(html, { ALLOW_UNKNOWN_PROTOCOLS: true });
        document.execCommand("insertHTML", false, clean);
      } else {
        document.execCommand("insertText", false, text);
      }
    }, []);

    const insertLink = useCallback(
      (url: string) => {
        if (url) {
          exec("createLink", url.startsWith("http") ? url : `https://${url}`);
        }
      },
      [exec],
    );

    const ToolbarButton = ({
      onClick,
      active,
      title,
      children,
    }: {
      onClick: () => void;
      active?: boolean;
      title: string;
      children: React.ReactNode;
    }) => (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", active && "bg-accent")}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        title={title}
        disabled={disabled}
        tabIndex={-1}
      >
        {children}
      </Button>
    );

    return (
      <div className={cn("border rounded-md overflow-hidden", className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/30">
          {/* Undo/Redo */}
          <ToolbarButton onClick={() => exec("undo")} title="ביטול">
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("redo")} title="חזרה">
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Text formatting */}
          <ToolbarButton onClick={() => exec("bold")} title="מודגש (Ctrl+B)">
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("italic")} title="נטוי (Ctrl+I)">
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("underline")}
            title="קו תחתון (Ctrl+U)"
          >
            <Underline className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("strikethrough")} title="קו חוצה">
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Font size */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="גודל טקסט"
                tabIndex={-1}
              >
                <Type className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-24 p-1" side="bottom">
              {FONT_SIZES.map((size, idx) => (
                <button
                  key={size}
                  className="w-full text-right px-2 py-1 hover:bg-accent rounded text-sm"
                  onClick={() => {
                    editorRef.current?.focus();
                    const span = document.createElement("span");
                    span.style.fontSize = size;
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                      const range = sel.getRangeAt(0);
                      if (!range.collapsed) {
                        range.surroundContents(span);
                      } else {
                        span.innerHTML = "&#8203;";
                        range.insertNode(span);
                        range.setStartAfter(span);
                        sel.removeAllRanges();
                        sel.addRange(range);
                      }
                    }
                    if (onChange && editorRef.current)
                      onChange(editorRef.current.innerHTML);
                  }}
                  style={{ fontSize: size }}
                >
                  {size}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Headings */}
          <ToolbarButton
            onClick={() => exec("formatBlock", "<h1>")}
            title="כותרת 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("formatBlock", "<h2>")}
            title="כותרת 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Colors */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="צבע טקסט"
                tabIndex={-1}
              >
                <Palette className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-2" side="bottom">
              <p className="text-xs text-muted-foreground mb-1">צבע טקסט</p>
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => exec("foreColor", color)}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 mb-1">צבע רקע</p>
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={`bg-${color}`}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => exec("hiliteColor", color)}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => exec("justifyRight")}
            title="יישור לימין"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("justifyCenter")} title="מרכז">
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("justifyLeft")}
            title="יישור לשמאל"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => exec("insertUnorderedList")}
            title="רשימה"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("insertOrderedList")}
            title="רשימה ממוספרת"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>

          {/* Quote */}
          <ToolbarButton
            onClick={() => exec("formatBlock", "<blockquote>")}
            title="ציטוט"
          >
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>

          {/* Code */}
          <ToolbarButton
            onClick={() => exec("formatBlock", "<pre>")}
            title="קוד"
          >
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>

          {/* Horizontal rule */}
          <ToolbarButton
            onClick={() => exec("insertHorizontalRule")}
            title="קו מפריד"
          >
            <Minus className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Link */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="הוסף קישור"
                tabIndex={-1}
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" side="bottom">
              <p className="text-xs text-muted-foreground mb-1">
                הכנס כתובת URL
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.querySelector("input")!;
                  insertLink(input.value);
                }}
              >
                <div className="flex gap-1">
                  <Input
                    placeholder="https://..."
                    className="h-7 text-sm"
                    dir="ltr"
                  />
                  <Button type="submit" size="sm" className="h-7 px-2">
                    הוסף
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>

          {/* Clear formatting */}
          <ToolbarButton onClick={() => exec("removeFormat")} title="נקה עיצוב">
            <RemoveFormatting className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Editor area */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          className={cn(
            "p-3 outline-none overflow-y-auto prose prose-sm max-w-none",
            "focus:ring-1 focus:ring-ring focus:ring-inset",
            disabled && "opacity-50 cursor-not-allowed",
            "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground",
          )}
          style={{ minHeight, direction: "rtl" }}
          data-placeholder={placeholder}
          dir="rtl"
        />
      </div>
    );
  },
);

RichTextEditor.displayName = "RichTextEditor";
