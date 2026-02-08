import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Palette,
  Type,
  Box,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { QuoteDocumentData, DesignSettings3D, AdvancedFontSettings } from './types';

interface AdvancedDesignSettingsProps {
  document: QuoteDocumentData;
  onUpdate: (updates: Partial<QuoteDocumentData>) => void;
}

const EXTENDED_FONT_OPTIONS = [
  { value: 'Heebo', label: 'Heebo', style: 'sans-serif' },
  { value: 'Assistant', label: 'Assistant', style: 'sans-serif' },
  { value: 'Rubik', label: 'Rubik', style: 'sans-serif' },
  { value: 'Open Sans Hebrew', label: 'Open Sans', style: 'sans-serif' },
  { value: 'Alef', label: 'Alef', style: 'sans-serif' },
  { value: 'Secular One', label: 'Secular One', style: 'display' },
  { value: 'Varela Round', label: 'Varela Round', style: 'rounded' },
  { value: 'Frank Ruhl Libre', label: 'Frank Ruhl', style: 'serif' },
  { value: 'David Libre', label: 'David Libre', style: 'serif' },
  { value: 'Suez One', label: 'Suez One', style: 'display' },
];

const PRESET_THEMES = [
  { id: 'professional', name: 'מקצועי', primary: '#1e3a5f', secondary: '#c9a227', accent: '#3b82f6' },
  { id: 'modern', name: 'מודרני', primary: '#18181b', secondary: '#6366f1', accent: '#22c55e' },
  { id: 'warm', name: 'חם', primary: '#b45309', secondary: '#d97706', accent: '#fbbf24' },
  { id: 'cool', name: 'קריר', primary: '#0369a1', secondary: '#0891b2', accent: '#06b6d4' },
  { id: 'elegant', name: 'אלגנטי', primary: '#581c87', secondary: '#7e22ce', accent: '#d946ef' },
  { id: 'nature', name: 'טבעי', primary: '#166534', secondary: '#22c55e', accent: '#86efac' },
  { id: 'minimal', name: 'מינימלי', primary: '#374151', secondary: '#6b7280', accent: '#9ca3af' },
  { id: 'bold', name: 'נועז', primary: '#dc2626', secondary: '#f97316', accent: '#fbbf24' },
];

const GRADIENT_DIRECTIONS = [
  { value: 'to-right', label: 'לימין' },
  { value: 'to-left', label: 'לשמאל' },
  { value: 'to-bottom', label: 'למטה' },
  { value: 'to-top', label: 'למעלה' },
  { value: 'diagonal', label: 'אלכסוני' },
];

const ELEVATION_OPTIONS = [
  { value: 'none', label: 'ללא' },
  { value: 'low', label: 'נמוך' },
  { value: 'medium', label: 'בינוני' },
  { value: 'high', label: 'גבוה' },
];

const default3DSettings: DesignSettings3D = {
  enabled: false,
  shadowDepth: 10,
  shadowColor: 'rgba(0,0,0,0.15)',
  borderRadius: 8,
  gradient: false,
  gradientDirection: 'to-right',
  elevation: 'none',
};

const defaultFontSettings: AdvancedFontSettings = {
  titleSize: 24,
  bodySize: 14,
  headerSize: 18,
  lineHeight: 1.5,
  letterSpacing: 0,
  fontWeight: 'normal',
};

export function AdvancedDesignSettings({ document, onUpdate }: AdvancedDesignSettingsProps) {
  const design3D = document.design3D || default3DSettings;
  const fontSettings = document.fontSettings || defaultFontSettings;

  const update3D = (updates: Partial<DesignSettings3D>) => {
    onUpdate({
      design3D: { ...design3D, ...updates },
    });
  };

  const updateFontSettings = (updates: Partial<AdvancedFontSettings>) => {
    onUpdate({
      fontSettings: { ...fontSettings, ...updates },
    });
  };

  const applyTheme = (themeId: string) => {
    const theme = PRESET_THEMES.find(t => t.id === themeId);
    if (theme) {
      onUpdate({
        primaryColor: theme.primary,
        secondaryColor: theme.secondary,
        accentColor: theme.accent,
      });
    }
  };

  const resetDesign = () => {
    onUpdate({
      design3D: default3DSettings,
      fontSettings: defaultFontSettings,
      primaryColor: '#1e3a5f',
      secondaryColor: '#c9a227',
      accentColor: '#3b82f6',
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Theme Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">ערכות נושא מוכנות</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetDesign}>
                <RotateCcw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>איפוס עיצוב</TooltipContent>
          </Tooltip>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESET_THEMES.map((theme) => (
            <Tooltip key={theme.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => applyTheme(theme.id)}
                  className="h-8 rounded-md transition-all hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-primary"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.accent} 100%)`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>{theme.name}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* Colors Section */}
        <AccordionItem value="colors" className="border rounded-lg px-3">
          <AccordionTrigger className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              צבעים מתקדמים
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">צבע ראשי</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    type="color"
                    value={document.primaryColor}
                    onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                    className="w-8 h-8 p-0 border-0"
                  />
                  <Input
                    value={document.primaryColor}
                    onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                    className="flex-1 text-xs h-8"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">צבע משני</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    type="color"
                    value={document.secondaryColor}
                    onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                    className="w-8 h-8 p-0 border-0"
                  />
                  <Input
                    value={document.secondaryColor}
                    onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                    className="flex-1 text-xs h-8"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">צבע הדגשה</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    type="color"
                    value={document.accentColor || '#3b82f6'}
                    onChange={(e) => onUpdate({ accentColor: e.target.value })}
                    className="w-8 h-8 p-0 border-0"
                  />
                  <Input
                    value={document.accentColor || '#3b82f6'}
                    onChange={(e) => onUpdate({ accentColor: e.target.value })}
                    className="flex-1 text-xs h-8"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">צבע רקע</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    type="color"
                    value={document.backgroundColor || '#ffffff'}
                    onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                    className="w-8 h-8 p-0 border-0"
                  />
                  <Input
                    value={document.backgroundColor || '#ffffff'}
                    onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                    className="flex-1 text-xs h-8"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">צבע טקסט</Label>
              <div className="flex gap-1 mt-1">
                <Input
                  type="color"
                  value={document.textColor || '#1f2937'}
                  onChange={(e) => onUpdate({ textColor: e.target.value })}
                  className="w-8 h-8 p-0 border-0"
                />
                <Input
                  value={document.textColor || '#1f2937'}
                  onChange={(e) => onUpdate({ textColor: e.target.value })}
                  className="flex-1 text-xs h-8"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Typography Section */}
        <AccordionItem value="typography" className="border rounded-lg px-3">
          <AccordionTrigger className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              טיפוגרפיה
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-3">
            <div>
              <Label className="text-xs">גופן</Label>
              <Select
                value={document.fontFamily}
                onValueChange={(v) => onUpdate({ fontFamily: v })}
              >
                <SelectTrigger className="mt-1 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXTENDED_FONT_OPTIONS.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                      <span className="text-xs text-muted-foreground mr-2">({font.style})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">כותרת</Label>
                <Input
                  type="number"
                  value={fontSettings.titleSize}
                  onChange={(e) => updateFontSettings({ titleSize: Number(e.target.value) })}
                  min={16}
                  max={48}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs">כותרת משנה</Label>
                <Input
                  type="number"
                  value={fontSettings.headerSize}
                  onChange={(e) => updateFontSettings({ headerSize: Number(e.target.value) })}
                  min={12}
                  max={32}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs">גוף</Label>
                <Input
                  type="number"
                  value={fontSettings.bodySize}
                  onChange={(e) => updateFontSettings({ bodySize: Number(e.target.value) })}
                  min={10}
                  max={24}
                  className="mt-1 h-8"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">משקל גופן</Label>
              <Select
                value={fontSettings.fontWeight}
                onValueChange={(v: AdvancedFontSettings['fontWeight']) => updateFontSettings({ fontWeight: v })}
              >
                <SelectTrigger className="mt-1 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">רגיל</SelectItem>
                  <SelectItem value="medium">בינוני</SelectItem>
                  <SelectItem value="semibold">חצי מודגש</SelectItem>
                  <SelectItem value="bold">מודגש</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">גובה שורה</Label>
                <span className="text-xs text-muted-foreground">{fontSettings.lineHeight}</span>
              </div>
              <Slider
                value={[fontSettings.lineHeight]}
                onValueChange={([v]) => updateFontSettings({ lineHeight: v })}
                min={1}
                max={2.5}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">מרווח אותיות</Label>
                <span className="text-xs text-muted-foreground">{fontSettings.letterSpacing}px</span>
              </div>
              <Slider
                value={[fontSettings.letterSpacing]}
                onValueChange={([v]) => updateFontSettings({ letterSpacing: v })}
                min={-1}
                max={5}
                step={0.5}
                className="mt-2"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3D Effects Section */}
        <AccordionItem value="3d" className="border rounded-lg px-3">
          <AccordionTrigger className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              אפקטים תלת מימדיים
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">הפעל אפקטים 3D</Label>
              <Switch
                checked={design3D.enabled}
                onCheckedChange={(v) => update3D({ enabled: v })}
              />
            </div>

            {design3D.enabled && (
              <>
                <div>
                  <Label className="text-xs">רמת הגבהה</Label>
                  <Select
                    value={design3D.elevation}
                    onValueChange={(v: DesignSettings3D['elevation']) => update3D({ elevation: v })}
                  >
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ELEVATION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">עומק צל</Label>
                    <span className="text-xs text-muted-foreground">{design3D.shadowDepth}px</span>
                  </div>
                  <Slider
                    value={[design3D.shadowDepth]}
                    onValueChange={([v]) => update3D({ shadowDepth: v })}
                    min={0}
                    max={30}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-xs">צבע צל</Label>
                  <Input
                    value={design3D.shadowColor}
                    onChange={(e) => update3D({ shadowColor: e.target.value })}
                    placeholder="rgba(0,0,0,0.15)"
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">עיגול פינות</Label>
                    <span className="text-xs text-muted-foreground">{design3D.borderRadius}px</span>
                  </div>
                  <Slider
                    value={[design3D.borderRadius]}
                    onValueChange={([v]) => update3D({ borderRadius: v })}
                    min={0}
                    max={24}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">אפקט גרדיאנט</Label>
                  <Switch
                    checked={design3D.gradient}
                    onCheckedChange={(v) => update3D({ gradient: v })}
                  />
                </div>

                {design3D.gradient && (
                  <div>
                    <Label className="text-xs">כיוון גרדיאנט</Label>
                    <Select
                      value={design3D.gradientDirection}
                      onValueChange={(v: DesignSettings3D['gradientDirection']) => 
                        update3D({ gradientDirection: v })
                      }
                    >
                      <SelectTrigger className="mt-1 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADIENT_DIRECTIONS.map(dir => (
                          <SelectItem key={dir.value} value={dir.value}>
                            {dir.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Elements Visibility */}
        <AccordionItem value="visibility" className="border rounded-lg px-3">
          <AccordionTrigger className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              הצגת/הסתרת אלמנטים
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 pb-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">לוגו</Label>
              <Switch
                checked={document.showLogo}
                onCheckedChange={(v) => onUpdate({ showLogo: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">פרטי חברה</Label>
              <Switch
                checked={document.showCompanyDetails}
                onCheckedChange={(v) => onUpdate({ showCompanyDetails: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">פרטי לקוח</Label>
              <Switch
                checked={document.showClientDetails}
                onCheckedChange={(v) => onUpdate({ showClientDetails: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">מספרי פריטים</Label>
              <Switch
                checked={document.showItemNumbers}
                onCheckedChange={(v) => onUpdate({ showItemNumbers: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">מע"מ</Label>
              <Switch
                checked={document.showVat}
                onCheckedChange={(v) => onUpdate({ showVat: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">תנאי תשלום</Label>
              <Switch
                checked={document.showPaymentTerms}
                onCheckedChange={(v) => onUpdate({ showPaymentTerms: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">חתימה</Label>
              <Switch
                checked={document.showSignature}
                onCheckedChange={(v) => onUpdate({ showSignature: v })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default AdvancedDesignSettings;
