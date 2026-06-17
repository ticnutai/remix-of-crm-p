import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Type,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  SectionTextStyle,
  HEBREW_FONTS,
  DEFAULT_SECTION_STYLE,
  SectionKey,
  SECTION_STYLE_PRESETS,
} from "./types";

interface TextFormatPopoverProps {
  sectionKey: SectionKey;
  sectionLabel: string;
  style: SectionTextStyle;
  onChange: (sectionKey: SectionKey, style: SectionTextStyle) => void;
}

const FONT_SIZES = [8, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48, 56, 64, 72];

// Group fonts by category for the select
const groupedFonts = HEBREW_FONTS.reduce<Record<string, typeof HEBREW_FONTS>>(
  (acc, font) => {
    const cat = font.category || "אחר";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(font);
    return acc;
  },
  {},
);

const HIGHLIGHT_COLORS = [
  { value: "", label: "ללא" },
  { value: "#fef08a", label: "צהוב" },
  { value: "#bbf7d0", label: "ירוק" },
  { value: "#bfdbfe", label: "כחול" },
  { value: "#fecaca", label: "אדום" },
  { value: "#f5d0fe", label: "סגול" },
  { value: "#fed7aa", label: "כתום" },
];

const TEXT_COLORS = [
  "#000000",
  "#333333",
  "#666666",
  "#162C58",
  "#d8ac27",
  "#1e40af",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#ea580c",
];

export function TextFormatPopover({
  sectionKey,
  sectionLabel,
  style,
  onChange,
}: TextFormatPopoverProps) {
  const merged = { ...DEFAULT_SECTION_STYLE, ...style };

  const updateStyle = (updates: Partial<SectionTextStyle>) => {
    onChange(sectionKey, { ...merged, ...updates });
  };

  const applyPreset = (presetId: string) => {
    const preset = SECTION_STYLE_PRESETS.find((p) => p.id === presetId);
    if (preset) onChange(sectionKey, { ...merged, ...preset.style });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-60 hover:opacity-100 print:hidden"
          title={`עיצוב ${sectionLabel}`}
        >
          <Type className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-4 max-h-[80vh] overflow-y-auto rtl"
        side="left"
        align="start"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-medium text-sm">עיצוב: {sectionLabel}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(sectionKey, DEFAULT_SECTION_STYLE)}
              className="h-7 text-xs gap-1"
              title="איפוס לברירת מחדל"
            >
              <RotateCcw className="h-3 w-3" />
              איפוס
            </Button>
          </div>

          {/* Style Presets */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#d8ac27]" />
              סגנונות מוכנים
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {SECTION_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className="text-right px-2 py-1.5 rounded border border-input hover:border-[#d8ac27] hover:bg-[#d8ac27]/5 transition-colors"
                  title={preset.description}
                >
                  <div className="text-xs font-medium">{preset.label}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Font Family */}
          <div className="space-y-2">
            <Label className="text-xs">גופן</Label>
            <Select
              value={merged.fontFamily}
              onValueChange={(value) => updateStyle({ fontFamily: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.entries(groupedFonts).map(([cat, fonts]) => (
                  <SelectGroup key={cat}>
                    <SelectLabel className="text-[10px] text-muted-foreground">
                      {cat}
                    </SelectLabel>
                    {fonts.map((font) => (
                      <SelectItem
                        key={font.value}
                        value={font.value}
                        style={{ fontFamily: font.value }}
                      >
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">גודל גופן</Label>
              <span className="text-xs text-muted-foreground">
                {merged.fontSize}px
              </span>
            </div>
            <div className="flex gap-2">
              <Slider
                value={[merged.fontSize]}
                onValueChange={([value]) => updateStyle({ fontSize: value })}
                min={6}
                max={96}
                step={1}
                className="flex-1"
              />
              <Select
                value={String(merged.fontSize)}
                onValueChange={(value) =>
                  updateStyle({ fontSize: Number(value) })
                }
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line height */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">מרווח שורות</Label>
              <span className="text-xs text-muted-foreground">
                {(merged.lineHeight ?? 1.6).toFixed(2)}
              </span>
            </div>
            <Slider
              value={[merged.lineHeight ?? 1.6]}
              onValueChange={([value]) => updateStyle({ lineHeight: value })}
              min={0.8}
              max={3.5}
              step={0.05}
            />
          </div>

          {/* Letter spacing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">מרווח אותיות</Label>
              <span className="text-xs text-muted-foreground">
                {merged.letterSpacing ?? 0}px
              </span>
            </div>
            <Slider
              value={[merged.letterSpacing ?? 0]}
              onValueChange={([value]) =>
                updateStyle({ letterSpacing: value })
              }
              min={-3}
              max={15}
              step={0.1}
            />
          </div>

          {/* Paragraph spacing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">מרווח פסקאות</Label>
              <span className="text-xs text-muted-foreground">
                {merged.paragraphSpacing ?? 0}px
              </span>
            </div>
            <Slider
              value={[merged.paragraphSpacing ?? 0]}
              onValueChange={([value]) =>
                updateStyle({ paragraphSpacing: value })
              }
              min={0}
              max={60}
              step={1}
            />
          </div>

          {/* Text indent */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">הזחה</Label>
              <span className="text-xs text-muted-foreground">
                {merged.textIndent ?? 0}px
              </span>
            </div>
            <Slider
              value={[merged.textIndent ?? 0]}
              onValueChange={([value]) => updateStyle({ textIndent: value })}
              min={0}
              max={80}
              step={1}
            />
          </div>

          <Separator />

          {/* Font Color */}
          <div className="space-y-2">
            <Label className="text-xs">צבע גופן</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={merged.fontColor}
                onChange={(e) => updateStyle({ fontColor: e.target.value })}
                className="w-10 h-8 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={merged.fontColor}
                onChange={(e) => updateStyle({ fontColor: e.target.value })}
                className="flex-1 h-8 font-mono text-xs"
                placeholder="#000000"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateStyle({ fontColor: color })}
                  className="w-6 h-6 rounded border border-input hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Highlight color */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Highlighter className="h-3 w-3" />
              צבע הדגשה (רקע)
            </Label>
            <div className="flex flex-wrap gap-1">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value || "none"}
                  onClick={() => updateStyle({ backgroundColor: c.value })}
                  className={`min-w-[40px] h-7 px-2 rounded border text-[10px] hover:scale-105 transition-transform ${
                    (merged.backgroundColor || "") === c.value
                      ? "border-[#d8ac27] ring-1 ring-[#d8ac27]"
                      : "border-input"
                  }`}
                  style={{
                    backgroundColor: c.value || "transparent",
                  }}
                  title={c.label}
                >
                  {!c.value && "ללא"}
                </button>
              ))}
              <Input
                type="color"
                value={merged.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  updateStyle({ backgroundColor: e.target.value })
                }
                className="w-10 h-7 p-1 cursor-pointer"
                title="צבע מותאם"
              />
            </div>
          </div>

          <Separator />

          {/* Align + Weight + Style toggles */}
          <div className="space-y-2">
            <Label className="text-xs">יישור וסגנון</Label>
            <div className="flex flex-wrap gap-1">
              <ToggleGroup
                type="single"
                value={merged.textAlign}
                onValueChange={(value) =>
                  value &&
                  updateStyle({
                    textAlign: value as SectionTextStyle["textAlign"],
                  })
                }
              >
                <ToggleGroupItem value="right" size="sm" title="ימין">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" size="sm" title="מרכז">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="left" size="sm" title="שמאל">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="justify" size="sm" title="מיושר לשני הצדדים">
                  <AlignJustify className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <Separator orientation="vertical" className="h-8 mx-1" />

              <ToggleGroup
                type="multiple"
                value={[
                  merged.fontWeight === "bold" ? "bold" : "",
                  merged.italic ? "italic" : "",
                  merged.underline ? "underline" : "",
                  merged.strikethrough ? "strike" : "",
                ].filter(Boolean)}
                onValueChange={(values) =>
                  updateStyle({
                    fontWeight: values.includes("bold") ? "bold" : "normal",
                    italic: values.includes("italic"),
                    underline: values.includes("underline"),
                    strikethrough: values.includes("strike"),
                  })
                }
              >
                <ToggleGroupItem value="bold" size="sm" title="בולד (Ctrl+B)">
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" size="sm" title="נטוי (Ctrl+I)">
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="underline"
                  size="sm"
                  title="קו תחתון (Ctrl+U)"
                >
                  <Underline className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="strike" size="sm" title="קו חוצה">
                  <Strikethrough className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Text Transform */}
          <div className="space-y-2">
            <Label className="text-xs">המרת אותיות (לטיני)</Label>
            <ToggleGroup
              type="single"
              value={merged.textTransform || "none"}
              onValueChange={(value) =>
                value &&
                updateStyle({
                  textTransform: value as SectionTextStyle["textTransform"],
                })
              }
              className="justify-start"
            >
              <ToggleGroupItem value="none" size="sm" className="text-xs">
                Aa
              </ToggleGroupItem>
              <ToggleGroupItem value="uppercase" size="sm" className="text-xs">
                AA
              </ToggleGroupItem>
              <ToggleGroupItem value="lowercase" size="sm" className="text-xs">
                aa
              </ToggleGroupItem>
              <ToggleGroupItem
                value="capitalize"
                size="sm"
                className="text-xs"
              >
                Aa.
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Preview */}
          <div className="space-y-1 pt-2 border-t">
            <Label className="text-[10px] text-muted-foreground">תצוגה</Label>
            <div
              className="p-2 rounded border bg-muted/30 text-right"
              style={sectionStyleToCss(merged)}
            >
              דוגמת טקסט בעברית — Sample Text
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="flex flex-wrap gap-1 pt-1 text-[10px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] py-0">
              Ctrl+B בולד
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0">
              Ctrl+I נטוי
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0">
              Ctrl+U קו תחתון
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0">
              Ctrl+S שמירה
            </Badge>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper: convert SectionTextStyle to React CSS properties (used externally too)
export function sectionStyleToCss(
  style: SectionTextStyle,
): React.CSSProperties {
  const merged = { ...DEFAULT_SECTION_STYLE, ...style };
  return {
    fontFamily: merged.fontFamily,
    fontSize: `${merged.fontSize}px`,
    color: merged.fontColor,
    textAlign: merged.textAlign,
    fontWeight: merged.fontWeight,
    fontStyle: merged.italic ? "italic" : "normal",
    textDecoration: [
      merged.underline ? "underline" : "",
      merged.strikethrough ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" ") || "none",
    lineHeight: merged.lineHeight ?? 1.6,
    letterSpacing: `${merged.letterSpacing ?? 0}px`,
    marginBottom: merged.paragraphSpacing
      ? `${merged.paragraphSpacing}px`
      : undefined,
    textIndent: merged.textIndent ? `${merged.textIndent}px` : undefined,
    backgroundColor: merged.backgroundColor || undefined,
    textTransform: (merged.textTransform || "none") as any,
  };
}

// Section labels in Hebrew
export const SECTION_LABELS: Record<SectionKey, string> = {
  header: "כותרת עליונה",
  companyInfo: "פרטי חברה",
  quoteInfo: "פרטי הצעה",
  clientInfo: "פרטי לקוח",
  introduction: "הקדמה",
  itemsTable: "טבלת פריטים",
  totals: "סיכום",
  terms: "תנאים",
  notes: "הערות",
  signature: "חתימות",
};
