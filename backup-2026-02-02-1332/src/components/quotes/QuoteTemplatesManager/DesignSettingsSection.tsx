// סקשן הגדרות עיצוב משודרג
import React, { useRef, useState } from 'react';
import { 
  Palette, 
  Upload, 
  Type, 
  Layout, 
  Image, 
  Table2, 
  Phone,
  Mail,
  MapPin,
  Globe,
  Sparkles,
  X,
  Droplets,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DesignSettings, 
  DEFAULT_DESIGN_SETTINGS,
  HEADER_STYLES,
  FONT_FAMILIES,
  TABLE_STYLES,
  BACKGROUND_PATTERNS,
} from './types';
import { cn } from '@/lib/utils';

// Preset color schemes
const COLOR_PRESETS = [
  { name: 'זהב קלאסי', primary: '#d8ac27', secondary: '#1a365d', accent: '#10b981' },
  { name: 'כחול מקצועי', primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b' },
  { name: 'ירוק אלגנטי', primary: '#059669', secondary: '#064e3b', accent: '#d97706' },
  { name: 'סגול יוקרתי', primary: '#7c3aed', secondary: '#4c1d95', accent: '#ec4899' },
  { name: 'אדום נועז', primary: '#dc2626', secondary: '#7f1d1d', accent: '#fbbf24' },
  { name: 'טורקיז מודרני', primary: '#0891b2', secondary: '#164e63', accent: '#f97316' },
  { name: 'ורוד עדין', primary: '#ec4899', secondary: '#831843', accent: '#06b6d4' },
  { name: 'אפור מינימלי', primary: '#374151', secondary: '#111827', accent: '#3b82f6' },
];

interface DesignSettingsSectionProps {
  settings: DesignSettings;
  onUpdate: (settings: Partial<DesignSettings>) => void;
}

export function DesignSettingsSection({
  settings,
  onUpdate,
}: DesignSettingsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('colors');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdate({ logo_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    onUpdate({
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
    });
  };

  const updateContactInfo = (field: keyof DesignSettings['contact_info'], value: string) => {
    onUpdate({
      contact_info: {
        ...settings.contact_info,
        [field]: value,
      },
    });
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Palette className="h-5 w-5" style={{ color: settings.primary_color }} />
          <span>הגדרות עיצוב מתקדמות</span>
        </div>
        
        {/* Quick preview of colors */}
        <div className="flex items-center gap-1">
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: settings.primary_color }}
            title="צבע ראשי"
          />
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: settings.secondary_color }}
            title="צבע משני"
          />
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: settings.accent_color || '#10b981' }}
            title="צבע הדגשה"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="colors" className="flex items-center gap-1 text-xs">
            <Droplets className="h-3.5 w-3.5" />
            צבעים
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-1 text-xs">
            <Image className="h-3.5 w-3.5" />
            מיתוג
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-1 text-xs">
            <Layout className="h-3.5 w-3.5" />
            פריסה
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-1 text-xs">
            <Type className="h-3.5 w-3.5" />
            גופן
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-1 text-xs">
            <Phone className="h-3.5 w-3.5" />
            פרטים
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4 mt-4">
          {/* Color Presets */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              ערכות צבעים מוכנות
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "p-2 rounded-lg border-2 transition-all hover:scale-105",
                    settings.primary_color === preset.primary
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent bg-muted/50 hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span className="text-xs">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>צבע ראשי</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => onUpdate({ primary_color: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => onUpdate({ primary_color: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>צבע משני</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => onUpdate({ secondary_color: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => onUpdate({ secondary_color: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>צבע הדגשה</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.accent_color || '#10b981'}
                  onChange={(e) => onUpdate({ accent_color: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                />
                <Input
                  value={settings.accent_color || '#10b981'}
                  onChange={(e) => onUpdate({ accent_color: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Background Pattern */}
          <div className="space-y-2">
            <Label>תבנית רקע</Label>
            <Select
              value={settings.background_pattern || 'none'}
              onValueChange={(v: any) => onUpdate({ background_pattern: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BACKGROUND_PATTERNS.map((pattern) => (
                  <SelectItem key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Logo */}
            <div className="space-y-2">
              <Label>לוגו החברה</Label>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  "hover:bg-muted/50 hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {settings.logo_url ? (
                  <div className="relative group">
                    <img src={settings.logo_url} alt="Logo" className="h-16 mx-auto object-contain" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onUpdate({ logo_url: null }); }}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">העלה לוגו</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>

            {/* Company Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>שם החברה</Label>
                <Input
                  value={settings.company_name}
                  onChange={(e) => onUpdate({ company_name: e.target.value })}
                  placeholder="שם החברה או העסק"
                />
              </div>
              <div className="space-y-2">
                <Label>תת-כותרת / מקצוע</Label>
                <Input
                  value={settings.company_subtitle}
                  onChange={(e) => onUpdate({ company_subtitle: e.target.value })}
                  placeholder="אדריכלות ועיצוב פנים"
                />
              </div>
            </div>
          </div>

          {/* Watermark */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                סימן מים
              </Label>
              <Switch
                checked={settings.show_watermark || false}
                onCheckedChange={(v) => onUpdate({ show_watermark: v })}
              />
            </div>
            {settings.show_watermark && (
              <Input
                value={settings.watermark_text || ''}
                onChange={(e) => onUpdate({ watermark_text: e.target.value })}
                placeholder="טקסט לסימן מים (למשל: טיוטה)"
              />
            )}
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4 mt-4">
          {/* Header Style */}
          <div className="space-y-2">
            <Label>סגנון כותרת</Label>
            <div className="grid grid-cols-5 gap-2">
              {HEADER_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => onUpdate({ header_style: style.value as any })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                    settings.header_style === style.value
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <span className="text-xl">{style.icon}</span>
                  <span className="text-xs">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Header Height */}
            <div className="space-y-2">
              <Label>גובה כותרת</Label>
              <Select
                value={settings.header_height || 'normal'}
                onValueChange={(v: any) => onUpdate({ header_height: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">קומפקטי</SelectItem>
                  <SelectItem value="normal">רגיל</SelectItem>
                  <SelectItem value="large">גדול</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border Style */}
            <div className="space-y-2">
              <Label>סגנון מסגרת</Label>
              <Select
                value={settings.border_style || 'rounded'}
                onValueChange={(v: any) => onUpdate({ border_style: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  <SelectItem value="simple">פשוט</SelectItem>
                  <SelectItem value="rounded">מעוגל</SelectItem>
                  <SelectItem value="shadow">עם צל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Style */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              סגנון טבלאות
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {TABLE_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => onUpdate({ table_style: style.value as any })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-sm",
                    (settings.table_style || 'modern') === style.value
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Section Divider */}
            <div className="space-y-2">
              <Label>מפריד סקציות</Label>
              <Select
                value={settings.section_divider || 'line'}
                onValueChange={(v: any) => onUpdate({ section_divider: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  <SelectItem value="line">קו</SelectItem>
                  <SelectItem value="dots">נקודות</SelectItem>
                  <SelectItem value="gradient">גרדיאנט</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Footer Style */}
            <div className="space-y-2">
              <Label>סגנון כותרת תחתונה</Label>
              <Select
                value={settings.footer_style || 'detailed'}
                onValueChange={(v: any) => onUpdate({ footer_style: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">מינימלי</SelectItem>
                  <SelectItem value="detailed">מפורט</SelectItem>
                  <SelectItem value="branded">ממותג</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-4 mt-4">
          {/* Font Family */}
          <div className="space-y-2">
            <Label>גופן</Label>
            <div className="grid grid-cols-4 gap-2">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  onClick={() => onUpdate({ font_family: font.value as any })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                    (settings.font_family || 'default') === font.value
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <span className={cn(
                    "text-lg",
                    font.value === 'modern' && "font-sans",
                    font.value === 'classic' && "font-serif",
                    font.value === 'elegant' && "italic"
                  )}>
                    {font.sample}
                  </span>
                  <span className="text-xs">{font.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label>גודל גופן</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'small', label: 'קטן', size: 'text-sm' },
                { value: 'medium', label: 'בינוני', size: 'text-base' },
                { value: 'large', label: 'גדול', size: 'text-lg' },
              ].map((size) => (
                <button
                  key={size.value}
                  onClick={() => onUpdate({ font_size: size.value as any })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    size.size,
                    (settings.font_size || 'medium') === size.value
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            פרטי קשר יופיעו בכותרת התחתונה של ההצעה
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                טלפון
              </Label>
              <Input
                value={settings.contact_info?.phone || ''}
                onChange={(e) => updateContactInfo('phone', e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                אימייל
              </Label>
              <Input
                value={settings.contact_info?.email || ''}
                onChange={(e) => updateContactInfo('email', e.target.value)}
                placeholder="info@company.com"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                אתר אינטרנט
              </Label>
              <Input
                value={settings.contact_info?.website || ''}
                onChange={(e) => updateContactInfo('website', e.target.value)}
                placeholder="www.company.com"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                כתובת
              </Label>
              <Input
                value={settings.contact_info?.address || ''}
                onChange={(e) => updateContactInfo('address', e.target.value)}
                placeholder="רחוב הראשי 1, תל אביב"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
