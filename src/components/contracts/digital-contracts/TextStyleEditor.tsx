import { useState } from "react";
import { Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  lineHeight: number;
  letterSpacing: number;
  color: string;
}

interface TextStyleEditorProps {
  value: TextStyle;
  onChange: (style: TextStyle) => void;
  trigger?: React.ReactNode;
}

const PRESET_COLORS = [
  "#1a1a1a", "#2c3e50", "#34495e", "#2980b9", "#3498db",
  "#16a085", "#27ae60", "#e74c3c", "#9b59b6", "#e67e22",
];

const FONT_OPTIONS = [
  { label: "Heebo (חיבו)", value: "Heebo" },
  { label: "רגיל", value: "Assistant" },
  { label: "Rubik", value: "Rubik" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Alef", value: "Alef" },
  { label: "David Libre", value: "David Libre" },
  { label: "Varela Round", value: "Varela Round" },
];

const FONT_WEIGHTS = [
  { label: "דק", value: "300" },
  { label: "רגיל", value: "400" },
  { label: "בינוני", value: "500" },
  { label: "מודגש", value: "600" },
  { label: "מאוד מודגש", value: "700" },
  { label: "כבד", value: "800" },
];

export function TextStyleEditor({ value, onChange, trigger }: TextStyleEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localStyle, setLocalStyle] = useState<TextStyle>(value);

  const updateStyle = (updates: Partial<TextStyle>) => {
    const newStyle = { ...localStyle, ...updates };
    setLocalStyle(newStyle);
    onChange(newStyle);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium flex items-center gap-2">
            <Type className="w-4 h-4" />
            התאמת טקסט
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-end">
            <Type className="w-5 h-5" />
            התאמת טקסט
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{localStyle.fontSize}</span>
              <Label>גודל</Label>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStyle({ fontSize: Math.max(8, localStyle.fontSize - 1) })}
                className="h-8 w-8 p-0"
              >
                −
              </Button>
              <Slider
                value={[localStyle.fontSize]}
                onValueChange={([val]) => updateStyle({ fontSize: val })}
                min={8}
                max={56}
                step={1}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStyle({ fontSize: Math.min(56, localStyle.fontSize + 1) })}
                className="h-8 w-8 p-0"
              >
                +
              </Button>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label>סוג גופן</Label>
            <Select value={localStyle.fontFamily} onValueChange={(val) => updateStyle({ fontFamily: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Weight */}
          <div className="space-y-2">
            <Label>עובי</Label>
            <Select value={localStyle.fontWeight} onValueChange={(val) => updateStyle({ fontWeight: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map((weight) => (
                  <SelectItem key={weight.value} value={weight.value}>
                    {weight.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Line Height */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{localStyle.lineHeight.toFixed(1)}</span>
              <Label>מרווח שורות</Label>
            </div>
            <Slider
              value={[localStyle.lineHeight]}
              onValueChange={([val]) => updateStyle({ lineHeight: val })}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
          </div>

          {/* Letter Spacing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{localStyle.letterSpacing}px</span>
              <Label>מרווח אותיות</Label>
            </div>
            <Slider
              value={[localStyle.letterSpacing]}
              onValueChange={([val]) => updateStyle({ letterSpacing: val })}
              min={-2}
              max={10}
              step={0.5}
              className="flex-1"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>צבע</Label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateStyle({ color })}
                  className={`w-full h-10 rounded-lg border-2 transition-all ${
                    localStyle.color === color ? "border-primary scale-110" : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="color"
                value={localStyle.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={localStyle.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 border rounded-lg bg-muted/30">
            <Label className="text-xs text-muted-foreground mb-2 block">תצוגה מקדימה</Label>
            <p
              style={{
                fontSize: `${localStyle.fontSize}px`,
                fontFamily: localStyle.fontFamily,
                fontWeight: localStyle.fontWeight,
                lineHeight: localStyle.lineHeight,
                letterSpacing: `${localStyle.letterSpacing}px`,
                color: localStyle.color,
              }}
            >
              טקסט לדוגמה
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
