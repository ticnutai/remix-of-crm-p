// BubbleToolbar — סרגל צף מעל בחירת טקסט. ללא אנימציה, עם הגדרות משתמש (סדר/הסתרה/שורות/תצוגה).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Settings2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
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

/* ============================================================
   הגדרות משתמש — נשמרות בלוקאל ומסונכרנות לענן
   ============================================================ */
const CFG_KEY = "qt-flow-bubble-toolbar-cfg-v1";
type DisplayMode = "icon" | "icon-label";
type Rows = 1 | 2 | 3;
interface BubbleCfg {
  order: string[];
  hidden: string[];
  rows: Rows;
  mode: DisplayMode;
}

const DEFAULT_ORDER = [
  "bold","italic","underline","sep1",
  "h1","h2","h3","sep2",
  "bullet","ordered","sep3",
  "font","size","color","gradient","sep4",
  "alignRight","alignCenter","alignLeft","alignJustify","sep5",
  "letterSpacing","wordSpacing","sep6",
  "link","clear","copy",
];

const DEFAULT_CFG: BubbleCfg = {
  order: DEFAULT_ORDER,
  hidden: [],
  rows: 2,
  mode: "icon-label",
};

function loadCfg(): BubbleCfg {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (!raw) return DEFAULT_CFG;
    const parsed = JSON.parse(raw) as Partial<BubbleCfg>;
    const order = Array.isArray(parsed.order) ? parsed.order : DEFAULT_CFG.order;
    // ודא שכל ה-IDs הידועים קיימים (למצב שנוספו חדשים)
    const merged = [...order];
    DEFAULT_ORDER.forEach((id) => {
      if (!merged.includes(id)) merged.push(id);
    });
    return {
      order: merged.filter((id) => DEFAULT_ORDER.includes(id)),
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      rows: (parsed.rows === 1 || parsed.rows === 3 ? parsed.rows : 2) as Rows,
      mode: parsed.mode === "icon" ? "icon" : "icon-label",
    };
  } catch {
    return DEFAULT_CFG;
  }
}

function saveCfg(cfg: BubbleCfg) {
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    // מפעיל את מנגנון הסנכרון לענן שמאזין לשינויי localStorage
    window.dispatchEvent(new StorageEvent("storage", { key: CFG_KEY, newValue: JSON.stringify(cfg) }));
  } catch { /* ignore */ }
}

/* ============================================================
   דאטה סטטי
   ============================================================ */
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
const FONT_SIZES = ["10px","12px","14px","16px","18px","20px","24px","28px","32px","40px","56px"];
const INLINE_HEADING_SIZES = { 1: "32px", 2: "28px", 3: "24px" } as const;
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

/* ============================================================
   רכיב כפתור בסיסי
   ============================================================ */
function ToolBtn({
  icon: Icon,
  label,
  active,
  onClick,
  title,
  mode,
}: {
  icon?: any;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  mode: DisplayMode;
}) {
  const showLabel = mode === "icon-label" && !!label;
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={title || label}
      className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 min-w-[40px] ${showLabel ? "h-[46px]" : "h-[36px]"} transition-none ${
        active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-foreground hover:bg-muted"
      }`}
    >
      {Icon ? <Icon className="h-[19px] w-[19px]" strokeWidth={2.2} /> : null}
      {showLabel && <span className="text-[10px] leading-none">{label}</span>}
    </button>
  );
}

/* ============================================================
   מטא-דאטה של הכפתורים (לתפריט ההגדרות)
   ============================================================ */
const TOOL_META: Record<string, { label: string; isSeparator?: boolean }> = {
  bold: { label: "בולד" },
  italic: { label: "נטוי" },
  underline: { label: "קו תחתון" },
  h1: { label: "כותרת 1" },
  h2: { label: "כותרת 2" },
  h3: { label: "כותרת 3" },
  bullet: { label: "תבליטים" },
  ordered: { label: "רשימה ממוספרת" },
  font: { label: "גופן" },
  size: { label: "גודל" },
  color: { label: "צבע" },
  gradient: { label: "גרדיאנט" },
  alignRight: { label: "יישור לימין" },
  alignCenter: { label: "יישור למרכז" },
  alignLeft: { label: "יישור לשמאל" },
  alignJustify: { label: "יישור מיושר" },
  letterSpacing: { label: "מרווח אותיות" },
  wordSpacing: { label: "מרווח מילים" },
  link: { label: "קישור" },
  clear: { label: "נקה עיצוב" },
  copy: { label: "העתק" },
  sep1: { label: "מפריד 1", isSeparator: true },
  sep2: { label: "מפריד 2", isSeparator: true },
  sep3: { label: "מפריד 3", isSeparator: true },
  sep4: { label: "מפריד 4", isSeparator: true },
  sep5: { label: "מפריד 5", isSeparator: true },
  sep6: { label: "מפריד 6", isSeparator: true },
};

/* ============================================================
   הרכיב הראשי
   ============================================================ */
export default function BubbleToolbar({ editor }: Props) {
  const [copied, setCopied] = useState(false);
  const [, force] = useState(0);
  const extrasCountRef = useRef(0);
  const [cfg, setCfg] = useState<BubbleCfg>(() => loadCfg());

  // האזנה לשינויי קונפיג מכרטיסיות אחרות / סנכרון ענן
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === CFG_KEY) setCfg(loadCfg());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const updateCfg = useCallback((patch: Partial<BubbleCfg>) => {
    setCfg((prev) => {
      const next = { ...prev, ...patch };
      saveCfg(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const nextCount = getExtraRanges(editor).length;
      if (nextCount !== extrasCountRef.current) {
        extrasCountRef.current = nextCount;
        force((n) => n + 1);
      }
    };
    editor.on("selectionUpdate", handler);
    return () => { editor.off("selectionUpdate", handler); };
  }, [editor]);

  const bubbleOptions = useMemo(
    () => ({
      placement: "top" as const,
      offset: 10,
      // כיבוי אנימציות/הזזה חלקה של Floating UI
      moveTransition: undefined as any,
      updateDelay: 0,
    }),
    [],
  );

  const shouldShow = useCallback(({ editor, from, to }: { editor: Editor; from: number; to: number }) => {
    if (!editor.isEditable) return false;
    const hasExtras = getExtraRanges(editor).length > 0;
    if (from === to && !hasExtras) return false;
    return true;
  }, []);

  if (!editor) return null;

  const extras = getExtraRanges(editor);
  const extrasCount = extras.length;
  const apply = (cb: (chain: any) => any) => applyAcrossRanges(editor, cb);
  const applyInlineHeading = (level: keyof typeof INLINE_HEADING_SIZES) =>
    apply((chain) => chain.setFontSize(INLINE_HEADING_SIZES[level]).setBold());

  // Keep the ProseMirror selection alive while interacting with toolbar buttons.
  // Without this, mousedown moves focus into a button, BubbleMenu unmounts, and
  // the subsequent click (especially inside a portalled Popover) never applies.
  const preserveEditorSelection = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;
    event.preventDefault();
  };

  const copySelection = async () => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const text = editor.state.doc.textBetween(from, to, "\n", " ");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  const promptLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("כתובת קישור (https://...)", prev || "https://");
    if (url === null) return;
    if (url === "") { apply((c) => c.unsetLink()); return; }
    apply((c) => c.extendMarkRange("link").setLink({ href: url, target: "_blank" }));
  };

  const mode = cfg.mode;

  /* ---- רנדור לפי ID ---- */
  const renderTool = (id: string): React.ReactNode => {
    const meta = TOOL_META[id];
    if (!meta) return null;
    if (meta.isSeparator) {
      return <div key={id} className="mx-0.5 h-7 w-px bg-border self-center" />;
    }
    switch (id) {
      case "bold": return <ToolBtn key={id} mode={mode} icon={Bold} label="בולד" active={editor.isActive("bold")} onClick={() => apply((c) => c.toggleBold())} />;
      case "italic": return <ToolBtn key={id} mode={mode} icon={Italic} label="נטוי" active={editor.isActive("italic")} onClick={() => apply((c) => c.toggleItalic())} />;
      case "underline": return <ToolBtn key={id} mode={mode} icon={UnderlineIcon} label="קו" active={editor.isActive("underline")} onClick={() => apply((c) => c.toggleUnderline())} />;
      // The floating toolbar operates on the exact inline selection. Structural
      // headings are block nodes and would style the entire paragraph even when
      // only a few characters were selected.
      case "h1": return <ToolBtn key={id} mode={mode} icon={Heading1} label="H1" active={editor.isActive("textStyle", { fontSize: INLINE_HEADING_SIZES[1] })} onClick={() => applyInlineHeading(1)} />;
      case "h2": return <ToolBtn key={id} mode={mode} icon={Heading2} label="H2" active={editor.isActive("textStyle", { fontSize: INLINE_HEADING_SIZES[2] })} onClick={() => applyInlineHeading(2)} />;
      case "h3": return <ToolBtn key={id} mode={mode} icon={Heading3} label="H3" active={editor.isActive("textStyle", { fontSize: INLINE_HEADING_SIZES[3] })} onClick={() => applyInlineHeading(3)} />;
      case "bullet": return <ToolBtn key={id} mode={mode} icon={List} label="תבליט" active={editor.isActive("bulletList")} onClick={() => apply((c) => c.toggleBulletList())} />;
      case "ordered": return <ToolBtn key={id} mode={mode} icon={ListOrdered} label="ממוספר" active={editor.isActive("orderedList")} onClick={() => apply((c) => c.toggleOrderedList())} />;
      case "font":
        return (
          <Popover key={id}>
            <PopoverTrigger asChild>
              <button type="button" onMouseDown={preserveEditorSelection} title="גופן" className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 min-w-[40px] ${mode==="icon-label"?"h-[46px]":"h-[36px]"} text-foreground hover:bg-muted transition-none`}>
                <Type className="h-[19px] w-[19px]" strokeWidth={2.2} />
                {mode === "icon-label" && <span className="text-[10px] leading-none">גופן</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1 max-h-[320px] overflow-y-auto" align="center" onOpenAutoFocus={(e) => e.preventDefault()} onMouseDownCapture={preserveEditorSelection}>
              <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">גופן</div>
              {FONT_FAMILIES.map((f) => (
                <button key={f.value} type="button" className="w-full rounded px-2 py-1.5 text-right text-sm hover:bg-muted" style={{ fontFamily: f.value }} onClick={() => apply((c) => c.setFontFamily(f.value))}>
                  {f.label}
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
              <button type="button" className="w-full rounded px-2 py-1 text-right text-xs text-muted-foreground hover:bg-muted" onClick={() => apply((c) => c.unsetFontFamily())}>אפס גופן</button>
            </PopoverContent>
          </Popover>
        );
      case "size":
        return (
          <Popover key={id}>
            <PopoverTrigger asChild>
              <button type="button" onMouseDown={preserveEditorSelection} title="גודל" className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 min-w-[40px] ${mode==="icon-label"?"h-[46px]":"h-[36px]"} text-foreground hover:bg-muted transition-none`}>
                <ALargeSmall className="h-[19px] w-[19px]" strokeWidth={2.2} />
                {mode === "icon-label" && <span className="text-[10px] leading-none">גודל</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2" align="center" onOpenAutoFocus={(e) => e.preventDefault()} onMouseDownCapture={preserveEditorSelection}>
              <div className="mb-1 px-1 text-[11px] text-muted-foreground">גודל גופן</div>
              <div className="grid grid-cols-3 gap-1">
                {FONT_SIZES.map((s) => (
                  <button key={s} type="button" className="rounded border border-border px-1.5 py-1 text-xs hover:bg-muted" onClick={() => apply((c) => c.setFontSize(s))}>{parseInt(s)}</button>
                ))}
              </div>
              <button type="button" className="mt-2 w-full rounded px-2 py-1 text-right text-xs text-muted-foreground hover:bg-muted" onClick={() => apply((c) => c.setFontSize(null))}>אפס</button>
            </PopoverContent>
          </Popover>
        );
      case "color":
        return (
          <Popover key={id}>
            <PopoverTrigger asChild>
              <button type="button" onMouseDown={preserveEditorSelection} title="צבעים" className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 min-w-[40px] ${mode==="icon-label"?"h-[46px]":"h-[36px]"} text-foreground hover:bg-muted transition-none`}>
                <Palette className="h-[19px] w-[19px]" strokeWidth={2.2} />
                {mode === "icon-label" && <span className="text-[10px] leading-none">צבע</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 overflow-hidden" align="center" onOpenAutoFocus={(e) => e.preventDefault()} onMouseDownCapture={preserveEditorSelection}>
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
        );
      case "gradient":
        return (
          <Popover key={id}>
            <PopoverTrigger asChild>
              <button type="button" onMouseDown={preserveEditorSelection} title="גרדיאנט" className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 min-w-[40px] ${mode==="icon-label"?"h-[46px]":"h-[36px]"} text-foreground hover:bg-muted transition-none`}>
                <Sparkles className="h-[19px] w-[19px]" strokeWidth={2.2} />
                {mode === "icon-label" && <span className="text-[10px] leading-none">גרדיאנט</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2" align="center" onOpenAutoFocus={(e) => e.preventDefault()} onMouseDownCapture={preserveEditorSelection}>
              <div className="mb-1 text-[11px] text-muted-foreground">גרדיאנט טקסט</div>
              <div className="grid grid-cols-1 gap-1">
                {GRADIENTS.map((g) => (
                  <button key={g.value} type="button" className="rounded border border-border px-2 py-1.5 text-right text-sm font-bold"
                    style={{ background: g.value, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}
                    onClick={() => apply((c) => c.setGradient(g.value))}>{g.label}</button>
                ))}
              </div>
              <button type="button" className="mt-1 w-full rounded px-2 py-1 text-right text-xs text-muted-foreground hover:bg-muted" onClick={() => apply((c) => c.setGradient(null))}>הסר גרדיאנט</button>
            </PopoverContent>
          </Popover>
        );
      case "alignRight": return <ToolBtn key={id} mode={mode} icon={AlignRight} label="ימין" active={editor.isActive({ textAlign: "right" })} onClick={() => apply((c) => c.setTextAlign("right"))} />;
      case "alignCenter": return <ToolBtn key={id} mode={mode} icon={AlignCenter} label="מרכז" active={editor.isActive({ textAlign: "center" })} onClick={() => apply((c) => c.setTextAlign("center"))} />;
      case "alignLeft": return <ToolBtn key={id} mode={mode} icon={AlignLeft} label="שמאל" active={editor.isActive({ textAlign: "left" })} onClick={() => apply((c) => c.setTextAlign("left"))} />;
      case "alignJustify": return <ToolBtn key={id} mode={mode} icon={AlignJustify} label="מיושר" active={editor.isActive({ textAlign: "justify" })} onClick={() => apply((c) => c.setTextAlign("justify"))} />;
      case "letterSpacing":
        return (
          <Popover key={id}>
            <PopoverTrigger asChild>
              <button type="button" onMouseDown={preserveEditorSelection} title="מרווח אותיות" className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 min-w-[40px] ${mode==="icon-label"?"h-[46px]":"h-[36px]"} text-foreground hover:bg-muted transition-none`}>
                <span className="text-sm font-bold leading-none">A↔</span>
                {mode === "icon-label" && <span className="text-[10px] leading-none">אותיות</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="center" onOpenAutoFocus={(e) => e.preventDefault()} onMouseDownCapture={preserveEditorSelection}>
              <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">מרווח בין אותיות</div>
              {SPACINGS.map((s) => (
                <button key={s.value} type="button" className="w-full rounded px-2 py-1.5 text-right text-sm hover:bg-muted" onClick={() => apply((c) => c.setLetterSpacing(s.value))}>{s.label}</button>
              ))}
            </PopoverContent>
          </Popover>
        );
      case "wordSpacing":
        return (
          <Popover key={id}>
            <PopoverTrigger asChild>
              <button type="button" onMouseDown={preserveEditorSelection} title="מרווח מילים" className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 min-w-[40px] ${mode==="icon-label"?"h-[46px]":"h-[36px]"} text-foreground hover:bg-muted transition-none`}>
                <span className="text-sm font-bold leading-none">W↔</span>
                {mode === "icon-label" && <span className="text-[10px] leading-none">מילים</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="center" onOpenAutoFocus={(e) => e.preventDefault()} onMouseDownCapture={preserveEditorSelection}>
              <div className="mb-1 px-2 py-1 text-[11px] text-muted-foreground">מרווח בין מילים</div>
              {WORD_SPACINGS.map((s) => (
                <button key={s.value} type="button" className="w-full rounded px-2 py-1.5 text-right text-sm hover:bg-muted" onClick={() => apply((c) => c.setWordSpacing(s.value))}>{s.label}</button>
              ))}
            </PopoverContent>
          </Popover>
        );
      case "link":
        return (
          <React.Fragment key={id}>
            <ToolBtn mode={mode} icon={Link2} label="קישור" active={editor.isActive("link")} onClick={promptLink} />
            {editor.isActive("link") && (
              <ToolBtn mode={mode} icon={Link2Off} label="הסר" onClick={() => apply((c) => c.unsetLink())} />
            )}
          </React.Fragment>
        );
      case "clear": return <ToolBtn key={id} mode={mode} icon={Eraser} label="נקה" title="נקה עיצוב" onClick={() => apply((c) => c.unsetAllMarks().clearNodes())} />;
      case "copy": return <ToolBtn key={id} mode={mode} icon={Copy} label={copied ? "הועתק" : "העתק"} onClick={copySelection} active={copied} />;
      default: return null;
    }
  };

  /* ---- חישוב הכפתורים הגלויים לפי סדר, וחלוקה לשורות ---- */
  const visibleIds = cfg.order.filter((id) => !cfg.hidden.includes(id));
  const rows: string[][] = Array.from({ length: cfg.rows }, () => []);
  // חלוקה אחידה לשורות (זרימה טבעית לפי סדר)
  visibleIds.forEach((id, i) => {
    const rowIdx = Math.floor((i * cfg.rows) / Math.max(1, visibleIds.length));
    rows[Math.min(rowIdx, cfg.rows - 1)].push(id);
  });

  return (
    <BubbleMenu
      editor={editor}
      options={bubbleOptions}
      shouldShow={shouldShow}
      className="z-50 rounded-xl border border-border bg-popover px-2 py-1.5 shadow-2xl backdrop-blur"
      style={{ direction: "rtl", transition: "none", animation: "none" }}
    >
      <div className="flex flex-col gap-1">
        {extrasCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => clearExtraRanges(editor)}
              title={`${extrasCount + 1} טווחים נבחרו — לחץ לאיפוס (Esc)`}
              className="inline-flex h-[30px] items-center gap-1 rounded-md bg-primary/10 px-2 text-xs font-bold text-primary hover:bg-primary/20"
            >
              ×{extrasCount + 1}
            </button>
          </div>
        )}
        {rows.map((rowIds, idx) => (
          <div key={idx} className="flex items-center gap-0.5">
            {rowIds.map((id) => renderTool(id))}
            {idx === 0 && (
              <>
                <div className="mx-0.5 h-7 w-px bg-border self-center" />
                <SettingsButton cfg={cfg} onChange={updateCfg} />
              </>
            )}
          </div>
        ))}
      </div>
    </BubbleMenu>
  );
}

/* ============================================================
   כפתור הגדרות — סדר, הסתרה, שורות, תצוגה
   ============================================================ */
function SettingsButton({
  cfg,
  onChange,
}: {
  cfg: BubbleCfg;
  onChange: (patch: Partial<BubbleCfg>) => void;
}) {
  const move = (id: string, dir: -1 | 1) => {
    const list = [...cfg.order];
    const i = list.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    onChange({ order: list });
  };

  const toggleHide = (id: string) => {
    const hidden = cfg.hidden.includes(id) ? cfg.hidden.filter((x) => x !== id) : [...cfg.hidden, id];
    onChange({ hidden });
  };

  const reset = () => onChange({ order: DEFAULT_ORDER, hidden: [], rows: 2, mode: "icon-label" });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="הגדרות סרגל"
          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-none"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end" onOpenAutoFocus={(e) => e.preventDefault()} style={{ direction: "rtl" }}>
        {/* מספר שורות */}
        <div className="mb-3">
          <div className="mb-1.5 text-xs font-bold text-foreground">מספר שורות</div>
          <div className="flex gap-1">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={`flex-1 rounded border px-2 py-1 text-xs ${cfg.rows === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
                onClick={() => onChange({ rows: n as Rows })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* מצב תצוגה */}
        <div className="mb-3">
          <div className="mb-1.5 text-xs font-bold text-foreground">תצוגה</div>
          <div className="flex gap-1">
            <button
              type="button"
              className={`flex-1 rounded border px-2 py-1 text-xs ${cfg.mode === "icon" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
              onClick={() => onChange({ mode: "icon" })}
            >
              אייקון בלבד
            </button>
            <button
              type="button"
              className={`flex-1 rounded border px-2 py-1 text-xs ${cfg.mode === "icon-label" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
              onClick={() => onChange({ mode: "icon-label" })}
            >
              אייקון + תווית
            </button>
          </div>
        </div>

        {/* רשימת כפתורים לניהול */}
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-bold text-foreground">כפתורים וסדר</div>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" /> אפס
          </button>
        </div>
        <div className="max-h-[280px] overflow-y-auto rounded border border-border">
          {cfg.order.map((id) => {
            const meta = TOOL_META[id];
            if (!meta) return null;
            const hidden = cfg.hidden.includes(id);
            return (
              <div key={id} className={`flex items-center gap-1 border-b border-border px-2 py-1 last:border-b-0 ${meta.isSeparator ? "bg-muted/40" : ""}`}>
                <button type="button" onClick={() => toggleHide(id)} title={hidden ? "הצג" : "הסתר"} className="p-1 text-muted-foreground hover:text-foreground">
                  {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <span className={`flex-1 text-xs ${hidden ? "text-muted-foreground line-through" : "text-foreground"}`}>{meta.label}</span>
                <button type="button" onClick={() => move(id, -1)} title="הזז ימינה/למעלה" className="p-1 text-muted-foreground hover:text-foreground">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(id, 1)} title="הזז שמאלה/למטה" className="p-1 text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
