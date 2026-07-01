// MenuBar — סרגל כלים מאורגן בטאבים לפי נושאים
// טאבים: טקסט · פסקה · הוספה · שדות ופעולות
import React, { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table as TableIcon,
  Minus,
  Undo2,
  Redo2,
  Tag,
  Plus,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  Type,
  Palette,
  Sparkles,
  Eraser,
  Quote,
  FileText,
  Pilcrow,
  PlusSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { groupDynamicFields, type DynamicFieldDefinition } from "./dynamicFields";
import { applyAcrossRanges } from "./MultiSelection";
import SmartColorPicker from "./SmartColorPicker";

interface Props {
  editor: Editor | null;
  fields?: DynamicFieldDefinition[];
  onCreateField?: () => void;
  toolbarActions?: React.ReactNode;
}

type TabKey = "text" | "paragraph" | "insert" | "fields";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "text", label: "טקסט", icon: Type },
  { key: "paragraph", label: "פסקה", icon: Pilcrow },
  { key: "insert", label: "הוספה", icon: PlusSquare },
  { key: "fields", label: "שדות", icon: Tag },
];

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

const DIVIDER_COLORS = ["#d8ac27", "#162c58", "#000000", "#666666", "#cccccc", "#dc2626", "#16a34a", "#2563eb"];
const DIVIDER_STYLES: Array<{ label: string; value: "solid" | "dashed" | "dotted" | "double" }> = [
  { label: "מלא", value: "solid" },
  { label: "מקווקוו", value: "dashed" },
  { label: "נקודות", value: "dotted" },
  { label: "כפול", value: "double" },
];

function DividerInserter({ editor }: { editor: Editor }) {
  const [color, setColor] = React.useState("#d8ac27");
  const [thickness, setThickness] = React.useState(1);
  const [style, setStyle] = React.useState<"solid" | "dashed" | "dotted" | "double">("solid");

  const insert = () => {
    const css = `border:0;border-top:${thickness}px ${style} ${color};margin:.8rem 0;`;
    (editor.chain().focus() as any)
      .insertContent(`<hr style="${css}" />`)
      .run();
  };

  return (
    <div className="space-y-2.5">
      <div>
        <div className="text-[11px] text-muted-foreground mb-1">צבע</div>
        <div className="flex flex-wrap gap-1.5">
          {DIVIDER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition",
                color === c ? "border-foreground scale-110" : "border-transparent",
              )}
              style={{ background: c }}
              title={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-6 w-6 cursor-pointer rounded border"
            title="צבע מותאם"
          />
        </div>
      </div>
      <div>
        <div className="text-[11px] text-muted-foreground mb-1">עובי: {thickness}px</div>
        <input
          type="range"
          min={1}
          max={8}
          value={thickness}
          onChange={(e) => setThickness(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <div>
        <div className="text-[11px] text-muted-foreground mb-1">סגנון</div>
        <div className="flex gap-1">
          {DIVIDER_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyle(s.value)}
              className={cn(
                "flex-1 rounded border px-2 py-1 text-xs transition",
                style === s.value ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="rounded border bg-muted/30 p-2"
        style={{ borderTop: `${thickness}px ${style} ${color}`, borderTopWidth: `${thickness}px` }}
      >
        <div style={{ borderTop: `${thickness}px ${style} ${color}`, height: 0 }} />
      </div>
      <Button type="button" size="sm" className="w-full" onClick={insert}>
        הוסף קו
      </Button>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  title,
  disabled,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md px-1.5 text-sm transition-colors",
            "hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
            active && "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

function Sep() {
  return <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />;
}

export default function MenuBar({ editor, fields, onCreateField, toolbarActions }: Props) {
  const [tab, setTab] = useState<TabKey>("text");
  const [fieldsOpen, setFieldsOpen] = useState(false);
  if (!editor) return null;

  const apply = (cb: (chain: any) => any) => applyAcrossRanges(editor, cb);
  const groups = groupDynamicFields(fields);

  const renderText = () => (
    <>
      {/* גופן */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs hover:bg-muted"
            title="גופן"
          >
            <Type className="h-3.5 w-3.5" />
            <span>גופן</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
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

      {/* גודל */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs hover:bg-muted"
            title="גודל"
          >
            <span className="font-bold">A↕</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-32 p-1" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
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

      <Sep />

      <ToolButton
        active={editor.isActive("bold")}
        onClick={() => apply((c) => c.toggleBold())}
        title="מודגש (Ctrl+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        active={editor.isActive("italic")}
        onClick={() => apply((c) => c.toggleItalic())}
        title="נטוי (Ctrl+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        active={editor.isActive("underline")}
        onClick={() => apply((c) => c.toggleUnderline())}
        title="קו תחתון (Ctrl+U)"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        active={editor.isActive("highlight")}
        onClick={() => apply((c) => c.toggleHighlight())}
        title="הדגשה"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </ToolButton>

      <Sep />

      {/* צבע (SmartColorPicker) */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
            title="צבעים"
          >
            <Palette className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 overflow-hidden" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SmartColorPicker
            initialCategory="text"
            onPick={(color, category) => {
              if (category === "text") apply((ch) => ch.setGradient(null).setColor(color));
              else if (category === "highlight") apply((ch) => ch.setHighlight({ color }));
              else if (category === "underline") apply((ch) => ch.setUnderlineColor(color));
            }}
            onClear={(category) => {
              if (category === "text") apply((ch) => ch.unsetColor());
              else if (category === "highlight") apply((ch) => ch.unsetHighlight());
              else if (category === "underline") apply((ch) => ch.setUnderlineColor(null));
            }}
          />
        </PopoverContent>
      </Popover>

      {/* גרדיאנט */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
            title="גרדיאנט"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
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

      <Sep />

      <ToolButton
        onClick={() =>
          apply((c) => c.unsetAllMarks().unsetFontFamily?.().setFontSize?.(null))
        }
        title="נקה עיצוב טקסט"
      >
        <Eraser className="h-3.5 w-3.5" />
      </ToolButton>
    </>
  );

  const renderParagraph = () => (
    <>
      <ToolButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => apply((c) => c.toggleHeading({ level: 1 }))}
        title="כותרת 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => apply((c) => c.toggleHeading({ level: 2 }))}
        title="כותרת 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => apply((c) => c.toggleHeading({ level: 3 }))}
        title="כותרת 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </ToolButton>

      <Sep />

      <ToolButton
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => apply((c) => c.setTextAlign("right"))}
        title="יישור לימין"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => apply((c) => c.setTextAlign("center"))}
        title="מרכז"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => apply((c) => c.setTextAlign("left"))}
        title="יישור לשמאל"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        active={editor.isActive({ textAlign: "justify" })}
        onClick={() => apply((c) => c.setTextAlign("justify"))}
        title="מיושר לשני הצדדים"
      >
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolButton>

      <Sep />

      <ToolButton
        active={editor.isActive("bulletList")}
        onClick={() => apply((c) => c.toggleBulletList())}
        title="רשימת תבליטים"
      >
        <List className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        active={editor.isActive("orderedList")}
        onClick={() => apply((c) => c.toggleOrderedList())}
        title="רשימה ממוספרת"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolButton>

      <Sep />

      <ToolButton
        active={editor.isActive("blockquote")}
        onClick={() => apply((c) => c.toggleBlockquote())}
        title="ציטוט"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolButton>
    </>
  );

  const renderInsert = () => (
    <>
      <ToolButton
        onClick={() =>
          (editor.chain().focus() as any)
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        title="טבלה (3×3)"
      >
        <TableIcon className="h-3.5 w-3.5" />
      </ToolButton>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md px-1.5 text-sm transition-colors hover:bg-muted"
            title="הוסף קו (צבע / עובי / סגנון)"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3 space-y-3" dir="rtl">
          <div className="text-xs font-medium text-muted-foreground">קו מפריד</div>
          <DividerInserter editor={editor} />
        </PopoverContent>
      </Popover>

      <ToolButton
        onClick={() =>
          (editor.chain().focus() as any)
            .insertContent('<hr data-pagebreak="1" class="page-break" />')
            .run()
        }
        title="מעבר עמוד"
      >
        <FileText className="h-3.5 w-3.5" />
      </ToolButton>
    </>
  );

  const renderFields = () => (
    <>
      <DropdownMenu open={fieldsOpen} onOpenChange={setFieldsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 shrink-0 gap-1 text-xs"
            title="הוסף שדה דינמי"
          >
            <Tag className="h-3.5 w-3.5" />
            שדה
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-auto">
          {onCreateField && (
            <>
              <DropdownMenuItem
                onSelect={() => onCreateField()}
                className="gap-2 text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">צור שדה חדש...</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {Object.entries(groups).map(([group, fs], i) => (
            <React.Fragment key={group}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                {group}
              </DropdownMenuLabel>
              {fs.map((f) => (
                <DropdownMenuItem
                  key={f.key}
                  onSelect={() => {
                    (editor.chain().focus() as any).insertDynamicField(f.key, f.label).run();
                  }}
                >
                  <span className="text-sm">{f.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{f.key}</span>
                </DropdownMenuItem>
              ))}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Sep />

      <ToolButton
        disabled={!(editor as any).can?.().undo?.()}
        onClick={() => (editor.chain().focus() as any).undo().run()}
        title="בטל (Ctrl+Z)"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        disabled={!(editor as any).can?.().redo?.()}
        onClick={() => (editor.chain().focus() as any).redo().run()}
        title="בצע שוב (Ctrl+Y)"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </ToolButton>

      <Sep />

      <ToolButton
        onClick={() => apply((c) => c.unsetAllMarks().clearNodes())}
        title="נקה עיצוב מהבחירה"
      >
        <Eraser className="h-3.5 w-3.5" />
      </ToolButton>
    </>
  );

  return (
    <TooltipProvider delayDuration={250}>
      <div className="border-b bg-background" dir="rtl">
        <div className="grid max-h-[72px] grid-flow-col auto-cols-max grid-rows-2 items-center gap-x-1 gap-y-1 overflow-x-auto overflow-y-hidden px-2 py-1.5">
          {toolbarActions && (
            <>
              {toolbarActions}
              <Sep />
            </>
          )}

          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}

          <Sep />
          {tab === "text" && renderText()}
          {tab === "paragraph" && renderParagraph()}
          {tab === "insert" && renderInsert()}
          {tab === "fields" && renderFields()}
        </div>
      </div>
    </TooltipProvider>
  );
}
