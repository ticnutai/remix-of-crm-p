import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Type, Plus, Minus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TextCustomizerButtonProps {
  className?: string;
  pageId?: string; // מזהה ייחודי לכל עמוד
}

const fontFamilies = [
  { value: 'Heebo', label: 'Heebo (חיבו)' },
  { value: 'Assistant', label: 'Assistant (עוזר)' },
  { value: 'Rubik', label: 'Rubik (רוביק)' },
  { value: 'Alef', label: 'Alef (אלף)' },
  { value: 'Frank Ruhl Libre', label: 'Frank Ruhl (פרנק רוהל)' },
  { value: 'David Libre', label: 'David (דוד)' },
  { value: 'Miriam Libre', label: 'Miriam (מרים)' },
  { value: 'Noto Sans Hebrew', label: 'Noto Sans Hebrew' },
  { value: 'Secular One', label: 'Secular One' },
  { value: 'Varela Round', label: 'Varela Round' },
  { value: 'Suez One', label: 'Suez One (סואץ)' },
  { value: 'Arial, sans-serif', label: 'Arial (אריאל)' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma (טהומה)' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
];

const fontWeights = [
  { value: '300', label: 'דק' },
  { value: '400', label: 'רגיל' },
  { value: '500', label: 'בינוני' },
  { value: '600', label: 'מודגש' },
  { value: '700', label: 'מודגש מאוד' },
  { value: '800', label: 'עבה' },
];

const colors = [
  { value: '#1a1a1a', label: 'שחור', bg: '#1a1a1a' },
  { value: '#4a5568', label: 'אפור כהה', bg: '#4a5568' },
  { value: '#718096', label: 'אפור', bg: '#718096' },
  { value: '#1e40af', label: 'כחול כהה', bg: '#1e40af' },
  { value: '#3b82f6', label: 'כחול', bg: '#3b82f6' },
  { value: '#0891b2', label: 'תכלת', bg: '#0891b2' },
  { value: '#059669', label: 'ירוק', bg: '#059669' },
  { value: '#dc2626', label: 'אדום', bg: '#dc2626' },
  { value: '#9333ea', label: 'סגול', bg: '#9333ea' },
  { value: '#ea580c', label: 'כתום', bg: '#ea580c' },
];

interface PageTextSettings {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  lineHeight: number;
  letterSpacing: number;
}

const defaultSettings: PageTextSettings = {
  fontSize: 16,
  fontFamily: 'Heebo',
  fontWeight: '400',
  color: '#1a1a1a',
  lineHeight: 1.5,
  letterSpacing: 0,
};

export function TextCustomizerButton({ className, pageId = 'default' }: TextCustomizerButtonProps) {
  const [open, setOpen] = useState(false);
  
  // טעינת הגדרות מ-localStorage לפי עמוד
  const loadSettings = (): PageTextSettings => {
    try {
      const saved = localStorage.getItem(`page-text-settings-${pageId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // מיזוג עם defaultSettings כדי להבטיח שכל השדות קיימים
        return { ...defaultSettings, ...parsed };
      }
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  };

  const [settings, setSettings] = useState<PageTextSettings>(loadSettings);

  // שמירת הגדרות ל-localStorage
  const saveSettings = (newSettings: PageTextSettings) => {
    setSettings(newSettings);
    localStorage.setItem(`page-text-settings-${pageId}`, JSON.stringify(newSettings));
    applySettings(newSettings);
  };

  // החלת הגדרות על העמוד
  const applySettings = (settings: PageTextSettings) => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.style.fontSize = `${settings.fontSize}px`;
      mainElement.style.fontFamily = settings.fontFamily;
      mainElement.style.fontWeight = settings.fontWeight;
      mainElement.style.color = settings.color;
      mainElement.style.lineHeight = settings.lineHeight.toString();
      mainElement.style.letterSpacing = `${settings.letterSpacing}px`;
    }
  };

  // החל הגדרות בטעינה
  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const handleFontSizeChange = (value: number[]) => {
    saveSettings({ ...settings, fontSize: value[0] });
  };

  const handleFontFamilyChange = (value: string) => {
    saveSettings({ ...settings, fontFamily: value });
  };

  const handleFontWeightChange = (value: string) => {
    saveSettings({ ...settings, fontWeight: value });
  };

  const handleColorChange = (value: string) => {
    saveSettings({ ...settings, color: value });
  };

  const incrementFontSize = () => {
    const newSize = Math.min(settings.fontSize + 2, 56);
    saveSettings({ ...settings, fontSize: newSize });
  };

  const decrementFontSize = () => {
    const newSize = Math.max(settings.fontSize - 2, 8);
    saveSettings({ ...settings, fontSize: newSize });
  };

  const resetToDefaults = () => {
    saveSettings(defaultSettings);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 p-0",
              className
            )}
            title="התאמת טקסט עמוד"
          >
            <Type className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right text-xl font-bold">
              התאמת טקסט
            </DialogTitle>
            <DialogDescription className="text-right">
              התאם את הטקסט בעמוד זה בלבד
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pl-4">
            <div className="space-y-6 py-4">
              
              {/* גודל גופן */}
              <div className="space-y-4">
                <Label className="text-right block text-base font-semibold">
                  גודל
                </Label>
                <div className="flex items-center gap-4 flex-row-reverse">
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={incrementFontSize}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2 flex-row-reverse">
                      <span className="text-sm text-muted-foreground">56</span>
                      <span className="text-2xl font-bold bg-gray-100 dark:bg-gray-800 px-4 py-1 rounded-lg">
                        {settings.fontSize}
                      </span>
                      <span className="text-sm text-muted-foreground">8</span>
                    </div>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={handleFontSizeChange}
                      min={8}
                      max={56}
                      step={1}
                      className="rtl-slider"
                      dir="rtl"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={decrementFontSize}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* סוג גופן */}
              <div className="space-y-3">
                <Label className="text-right block text-base font-semibold">
                  סוג גופן
                </Label>
                <Select value={settings.fontFamily} onValueChange={handleFontFamilyChange}>
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-right">
                    {fontFamilies.map(font => (
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

              {/* עובי גופן */}
              <div className="space-y-3">
                <Label className="text-right block text-base font-semibold">
                  עובי
                </Label>
                <Select value={settings.fontWeight} onValueChange={handleFontWeightChange}>
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-right">
                    {fontWeights.map(weight => (
                      <SelectItem key={weight.value} value={weight.value}>
                        {weight.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* מרווח שורות */}
              <div className="space-y-3">
                <Label className="text-right block text-base font-semibold">
                  מרווח שורות
                </Label>
                <div className="flex items-center gap-4 flex-row-reverse">
                  <span className="text-sm font-medium min-w-[3rem] text-center">{settings.lineHeight.toFixed(1)}</span>
                  <Slider
                    value={[settings.lineHeight]}
                    onValueChange={(value) => saveSettings({ ...settings, lineHeight: value[0] })}
                    min={1}
                    max={3}
                    step={0.1}
                    className="rtl-slider flex-1"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* מרווח אותיות */}
              <div className="space-y-3">
                <Label className="text-right block text-base font-semibold">
                  מרווח אותיות
                </Label>
                <div className="flex items-center gap-4 flex-row-reverse">
                  <span className="text-sm font-medium min-w-[3rem] text-center">{settings.letterSpacing}px</span>
                  <Slider
                    value={[settings.letterSpacing]}
                    onValueChange={(value) => saveSettings({ ...settings, letterSpacing: value[0] })}
                    min={-2}
                    max={10}
                    step={0.5}
                    className="rtl-slider flex-1"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* צבע */}
              <div className="space-y-3">
                <Label className="text-right block text-base font-semibold">
                  צבע
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => handleColorChange(color.value)}
                      className={cn(
                        "w-full h-10 rounded-md border-2 transition-all",
                        settings.color === color.value 
                          ? "border-primary ring-2 ring-primary ring-offset-2" 
                          : "border-gray-300 hover:border-gray-400"
                      )}
                      style={{ backgroundColor: color.bg }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* תצוגה מקדימה */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-right block text-base font-semibold">
                  תצוגה מקדימה
                </Label>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-right">
                  <p
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      fontFamily: settings.fontFamily,
                      fontWeight: settings.fontWeight,
                      color: settings.color,
                      lineHeight: settings.lineHeight,
                      letterSpacing: `${settings.letterSpacing}px`,
                    }}
                  >
                    זהו טקסט לדוגמה להמחשת ההגדרות הנבחרות.<br/>
                    ניתן לראות כאן כיצד נראה הטקסט עם הפונט שנבחר.<br/>
                    שינויי הגדרות ישפיעו על כל טקסטי המערכת.
                  </p>
                </div>
              </div>

              {/* כפתור איפוס */}
              <Button
                variant="outline"
                className="w-full"
                onClick={resetToDefaults}
              >
                אפס לברירת מחדל
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
