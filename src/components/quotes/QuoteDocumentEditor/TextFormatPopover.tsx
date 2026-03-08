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
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Type,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Bold,
  Palette,
} from "lucide-react";
import {
  SectionTextStyle,
  HEBREW_FONTS,
  DEFAULT_SECTION_STYLE,
  SectionKey,
} from "./types";

interface TextFormatPopoverProps {
  sectionKey: SectionKey;
  sectionLabel: string;
  style: SectionTextStyle;
  onChange: (sectionKey: SectionKey, style: SectionTextStyle) => void;
}

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48];

export function TextFormatPopover({
  sectionKey,
  sectionLabel,
  style,
  onChange,
}: TextFormatPopoverProps) {
  const updateStyle = (updates: Partial<SectionTextStyle>) => {
    onChange(sectionKey, { ...style, ...updates });
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
      <PopoverContent className="w-80 p-4" side="left" align="start" dir="rtl">
        <div className="space-y-4">
          <h4 className="font-medium text-sm border-b pb-2">
            עיצוב: {sectionLabel}
          </h4>

          {/* Font Family */}
          <div className="space-y-2">
            <Label className="text-xs">גופן</Label>
            <Select
              value={style.fontFamily}
              onValueChange={(value) => updateStyle({ fontFamily: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEBREW_FONTS.map((font) => (
                  <SelectItem
                    key={font.value}
                    value={font.value}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">גודל גופן</Label>
              <span className="text-xs text-muted-foreground">
                {style.fontSize}px
              </span>
            </div>
            <div className="flex gap-2">
              <Slider
                value={[style.fontSize]}
                onValueChange={([value]) => updateStyle({ fontSize: value })}
                min={8}
                max={72}
                step={1}
                className="flex-1"
              />
              <Select
                value={String(style.fontSize)}
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

          {/* Font Color */}
          <div className="space-y-2">
            <Label className="text-xs">צבע גופן</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={style.fontColor}
                onChange={(e) => updateStyle({ fontColor: e.target.value })}
                className="w-10 h-8 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={style.fontColor}
                onChange={(e) => updateStyle({ fontColor: e.target.value })}
                className="flex-1 h-8 font-mono text-xs"
                placeholder="#000000"
              />
              <div className="flex gap-1">
                {[
                  "#000000",
                  "#333333",
                  "#666666",
                  "#1e40af",
                  "#dc2626",
                  "#16a34a",
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateStyle({ fontColor: color })}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Text Align & Bold */}
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label className="text-xs">יישור</Label>
              <ToggleGroup
                type="single"
                value={style.textAlign}
                onValueChange={(value) =>
                  value &&
                  updateStyle({
                    textAlign: value as "right" | "center" | "left",
                  })
                }
                className="justify-start"
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
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">משקל</Label>
              <ToggleGroup
                type="single"
                value={style.fontWeight}
                onValueChange={(value) =>
                  value &&
                  updateStyle({ fontWeight: value as "normal" | "bold" })
                }
                className="justify-start"
              >
                <ToggleGroupItem value="normal" size="sm" title="רגיל">
                  A
                </ToggleGroupItem>
                <ToggleGroupItem value="bold" size="sm" title="בולד">
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(sectionKey, DEFAULT_SECTION_STYLE)}
            className="w-full"
          >
            איפוס לברירת מחדל
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
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
