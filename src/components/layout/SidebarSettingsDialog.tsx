// Sidebar Settings Dialog - Theme customization for sidebar only
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Type, Sparkles, RotateCcw, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarTheme {
  backgroundColor: string;
  textColor: string;
  activeItemColor: string;
  iconColor: string;
  borderColor: string;
  headerBgColor: string;
  width: number;
  // New typography settings
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  titleFontSize: number;
  labelFontSize: number;
  itemPadding: number;
  iconSize: number;
  borderRadius: number;
  borderWidth: number;
}

const defaultTheme: SidebarTheme = {
  backgroundColor: 'hsl(220, 60%, 22%)',
  textColor: 'hsl(0, 0%, 100%)',
  activeItemColor: 'hsl(45, 80%, 45%)',
  iconColor: 'hsl(45, 80%, 55%)',
  borderColor: 'hsl(45, 80%, 45%)',
  headerBgColor: 'hsl(220, 60%, 18%)',
  width: 280,
  // Typography defaults
  fontFamily: 'Heebo',
  fontSize: 14,
  fontWeight: '400',
  titleFontSize: 18,
  labelFontSize: 11,
  itemPadding: 10,
  iconSize: 20,
  borderRadius: 16,
  borderWidth: 4,
};

const fontFamilies = [
  { value: 'Heebo', label: 'Heebo (עברית)' },
  { value: 'Assistant', label: 'Assistant' },
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Inter', label: 'Inter' },
  { value: 'system-ui', label: 'מערכת' },
];

const fontWeights = [
  { value: '300', label: 'דק' },
  { value: '400', label: 'רגיל' },
  { value: '500', label: 'בינוני' },
  { value: '600', label: 'שמן' },
  { value: '700', label: 'עבה' },
];

const colorPresets = [
  // Dark themes
  { name: 'Navy Gold', bg: 'hsl(220, 60%, 22%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(45, 80%, 45%)', border: 'hsl(45, 80%, 45%)' },
  { name: 'Dark Slate', bg: 'hsl(220, 20%, 15%)', text: 'hsl(0, 0%, 95%)', accent: 'hsl(200, 90%, 50%)', border: 'hsl(200, 90%, 40%)' },
  { name: 'Purple Night', bg: 'hsl(260, 40%, 20%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(280, 70%, 60%)', border: 'hsl(280, 70%, 50%)' },
  { name: 'Forest', bg: 'hsl(150, 30%, 18%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(140, 60%, 50%)', border: 'hsl(140, 60%, 40%)' },
  { name: 'Burgundy', bg: 'hsl(340, 35%, 20%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(340, 60%, 60%)', border: 'hsl(340, 60%, 50%)' },
  { name: 'Ocean', bg: 'hsl(200, 40%, 20%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(180, 70%, 50%)', border: 'hsl(180, 70%, 40%)' },
  { name: 'Charcoal', bg: 'hsl(0, 0%, 15%)', text: 'hsl(0, 0%, 95%)', accent: 'hsl(0, 0%, 70%)', border: 'hsl(0, 0%, 50%)' },
  { name: 'Sunset', bg: 'hsl(20, 50%, 20%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(30, 90%, 55%)', border: 'hsl(30, 90%, 45%)' },
  // Light/Elegant themes
  { name: 'לבן מפואר', bg: '#FFFFFF', text: '#1B365D', accent: '#D4A843', border: '#D4A84360' },
  { name: 'שמנת זהב', bg: '#FFFEF7', text: '#2C1810', accent: '#C9A961', border: '#C9A96180' },
  { name: 'מודרני בהיר', bg: '#F8FAFC', text: '#0F172A', accent: '#3B82F6', border: '#3B82F640' },
  { name: 'רוז עדין', bg: '#FFF5F5', text: '#4A1D1D', accent: '#B76E79', border: '#B76E7960' },
  { name: 'ירוק טבעי', bg: '#F5FDF5', text: '#1A3A1A', accent: '#4CAF50', border: '#4CAF5060' },
  { name: 'סגול מלכותי', bg: '#FAF5FF', text: '#3B1F5C', accent: '#9333EA', border: '#9333EA50' },
  { name: 'אפור אלגנטי', bg: '#F5F5F5', text: '#333333', accent: '#666666', border: '#CCCCCC' },
  { name: 'תכלת ים', bg: '#F0F9FF', text: '#0C4A6E', accent: '#0EA5E9', border: '#0EA5E950' },
];

interface SidebarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: SidebarTheme;
  onThemeChange: (theme: SidebarTheme) => void;
}

export function SidebarSettingsDialog({
  open,
  onOpenChange,
  theme,
  onThemeChange,
}: SidebarSettingsDialogProps) {
  const [localTheme, setLocalTheme] = useState<SidebarTheme>({ ...defaultTheme, ...theme });

  useEffect(() => {
    setLocalTheme({ ...defaultTheme, ...theme });
  }, [theme]);

  const handleChange = (key: keyof SidebarTheme, value: string | number) => {
    const newTheme = { ...localTheme, [key]: value };
    setLocalTheme(newTheme);
    onThemeChange(newTheme);
  };

  const handleColorChange = (key: keyof SidebarTheme, value: string) => {
    handleChange(key, value);
  };

  const handleNumberChange = (key: keyof SidebarTheme, value: number[]) => {
    handleChange(key, value[0]);
  };

  const handleWidthChange = (value: number[]) => {
    const newTheme = { ...localTheme, width: value[0] };
    setLocalTheme(newTheme);
    onThemeChange(newTheme);
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    const newTheme = {
      ...localTheme,
      backgroundColor: preset.bg,
      textColor: preset.text,
      activeItemColor: preset.accent,
      iconColor: preset.accent,
      borderColor: preset.border || preset.accent,
    };
    setLocalTheme(newTheme);
    onThemeChange(newTheme);
  };

  const resetToDefault = () => {
    setLocalTheme(defaultTheme);
    onThemeChange(defaultTheme);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] bg-background p-0" dir="rtl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            הגדרות סיידבר אישיות
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid grid-cols-4 mx-6 w-[calc(100%-48px)]">
            <TabsTrigger value="colors" className="gap-1 text-xs">
              <Palette className="h-3.5 w-3.5" />
              צבעים
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-1 text-xs">
              <Type className="h-3.5 w-3.5" />
              פונטים
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-1 text-xs">
              <Layout className="h-3.5 w-3.5" />
              מידות
            </TabsTrigger>
            <TabsTrigger value="presets" className="gap-1 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              ערכות
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] px-6">
            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4 mt-4 pb-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>צבע רקע</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localTheme.backgroundColor.startsWith('#') ? localTheme.backgroundColor : '#1B2541'}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={localTheme.backgroundColor}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      className="flex-1"
                      placeholder="hsl(220, 60%, 22%)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>צבע טקסט</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localTheme.textColor.startsWith('#') ? localTheme.textColor : '#FFFFFF'}
                      onChange={(e) => handleColorChange('textColor', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={localTheme.textColor}
                      onChange={(e) => handleColorChange('textColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>צבע פריט פעיל</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localTheme.activeItemColor.startsWith('#') ? localTheme.activeItemColor : '#C9A962'}
                      onChange={(e) => handleColorChange('activeItemColor', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={localTheme.activeItemColor}
                      onChange={(e) => handleColorChange('activeItemColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>צבע אייקונים</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localTheme.iconColor.startsWith('#') ? localTheme.iconColor : '#C9A962'}
                      onChange={(e) => handleColorChange('iconColor', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={localTheme.iconColor}
                      onChange={(e) => handleColorChange('iconColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>צבע מסגרת</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localTheme.borderColor.startsWith('#') ? localTheme.borderColor : '#C9A962'}
                      onChange={(e) => handleColorChange('borderColor', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={localTheme.borderColor}
                      onChange={(e) => handleColorChange('borderColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-5 mt-4 pb-4">
              <div className="space-y-3">
                <Label>פונט</Label>
                <Select
                  value={localTheme.fontFamily}
                  onValueChange={(value) => handleChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר פונט" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>משקל פונט</Label>
                <Select
                  value={localTheme.fontWeight}
                  onValueChange={(value) => handleChange('fontWeight', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר משקל" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontWeights.map((weight) => (
                      <SelectItem key={weight.value} value={weight.value}>
                        {weight.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>גודל טקסט פריטים: {localTheme.fontSize}px</Label>
                <Slider
                  value={[localTheme.fontSize]}
                  onValueChange={(v) => handleNumberChange('fontSize', v)}
                  min={10}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>גודל כותרות: {localTheme.titleFontSize}px</Label>
                <Slider
                  value={[localTheme.titleFontSize]}
                  onValueChange={(v) => handleNumberChange('titleFontSize', v)}
                  min={14}
                  max={28}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>גודל תוויות קבוצות: {localTheme.labelFontSize}px</Label>
                <Slider
                  value={[localTheme.labelFontSize]}
                  onValueChange={(v) => handleNumberChange('labelFontSize', v)}
                  min={8}
                  max={14}
                  step={1}
                  className="w-full"
                />
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-5 mt-4 pb-4">
              <div className="space-y-3">
                <Label>רוחב סיידבר: {localTheme.width}px</Label>
                <Slider
                  value={[localTheme.width]}
                  onValueChange={handleWidthChange}
                  min={200}
                  max={400}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>גודל אייקונים: {localTheme.iconSize}px</Label>
                <Slider
                  value={[localTheme.iconSize]}
                  onValueChange={(v) => handleNumberChange('iconSize', v)}
                  min={14}
                  max={28}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>ריווח פריטים: {localTheme.itemPadding}px</Label>
                <Slider
                  value={[localTheme.itemPadding]}
                  onValueChange={(v) => handleNumberChange('itemPadding', v)}
                  min={4}
                  max={16}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>עיגול פינות: {localTheme.borderRadius}px</Label>
                <Slider
                  value={[localTheme.borderRadius]}
                  onValueChange={(v) => handleNumberChange('borderRadius', v)}
                  min={0}
                  max={32}
                  step={2}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>עובי מסגרת: {localTheme.borderWidth}px</Label>
                <Slider
                  value={[localTheme.borderWidth]}
                  onValueChange={(v) => handleNumberChange('borderWidth', v)}
                  min={0}
                  max={8}
                  step={1}
                  className="w-full"
                />
              </div>
            </TabsContent>

            {/* Presets Tab */}
            <TabsContent value="presets" className="mt-4 pb-4">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">ערכות נושא כהות</p>
                <div className="grid grid-cols-2 gap-2">
                  {colorPresets.slice(0, 8).map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "p-3 rounded-lg transition-all hover:scale-105",
                        "flex flex-col items-center gap-1.5"
                      )}
                      style={{
                        backgroundColor: preset.bg,
                        border: `2px solid ${preset.border || preset.accent}`,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: preset.accent }}
                      />
                      <span style={{ color: preset.text }} className="text-xs font-medium">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">ערכות נושא בהירות</p>
                <div className="grid grid-cols-2 gap-2">
                  {colorPresets.slice(8).map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "p-3 rounded-lg transition-all hover:scale-105",
                        "flex flex-col items-center gap-1.5"
                      )}
                      style={{
                        backgroundColor: preset.bg,
                        border: `2px solid ${preset.border || preset.accent}`,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: preset.accent }}
                      />
                      <span style={{ color: preset.text }} className="text-xs font-medium">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between p-6 pt-4 border-t">
          <Button variant="outline" onClick={resetToDefault} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            איפוס
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { defaultTheme as defaultSidebarTheme };
