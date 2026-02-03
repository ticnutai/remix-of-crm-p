import React, { useState } from 'react';
import { 
  Palette, Square, Circle, Layers, Sparkles, 
  MousePointer, Table2, LayoutDashboard, Sidebar,
  Sun, Zap, Eye, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  UserPreferences, 
  BorderRadius, BorderWidth, ShadowIntensity, 
  CardStyle, ButtonStyle, InputStyle, AnimationSpeed,
  SidebarStyle, HeaderStyle, TableStyle, TableDensity
} from '@/hooks/useUserPreferences';

interface AdvancedThemeSettingsProps {
  preferences: UserPreferences;
  onSave: (prefs: Partial<UserPreferences>) => Promise<void>;
  saving: boolean;
}

interface OptionButtonProps {
  value: string;
  current: string;
  label: string;
  icon?: React.ReactNode;
  preview?: React.ReactNode;
  onChange: (value: string) => void;
}

const OptionButton = React.forwardRef<HTMLButtonElement, OptionButtonProps>(
  ({ value, current, label, icon, preview, onChange }, ref) => {
    const isActive = value === current;
    return (
      <button
        ref={ref}
        onClick={() => onChange(value)}
        className={cn(
          "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
          isActive 
            ? "border-primary bg-primary/10" 
            : "border-border hover:border-primary/50"
        )}
      >
        {preview || icon}
        <span className="text-xs font-medium">{label}</span>
      </button>
    );
  }
);
OptionButton.displayName = 'OptionButton';

function ColorPicker({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  value: string | null; 
  onChange: (val: string | null) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value || placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1 cursor-pointer"
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={placeholder}
          className="flex-1 text-sm"
        />
        {value && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onChange(null)}
            className="h-10 w-10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdvancedThemeSettings({ preferences, onSave, saving }: AdvancedThemeSettingsProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(localPrefs);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPrefs(preferences);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            התאמה אישית מתקדמת
          </CardTitle>
          <CardDescription>
            התאם את העיצוב לטעם שלך - מסגרות, צללים, צבעים ועוד
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="borders" className="w-full">
            <TabsList className="grid grid-cols-4 lg:grid-cols-5 mb-6">
              <TabsTrigger value="borders" className="text-xs">
                <Square className="h-4 w-4 ml-1" />
                מסגרות
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs">
                <Palette className="h-4 w-4 ml-1" />
                צבעים
              </TabsTrigger>
              <TabsTrigger value="elements" className="text-xs">
                <Layers className="h-4 w-4 ml-1" />
                אלמנטים
              </TabsTrigger>
              <TabsTrigger value="layout" className="text-xs">
                <LayoutDashboard className="h-4 w-4 ml-1" />
                פריסה
              </TabsTrigger>
              <TabsTrigger value="effects" className="text-xs hidden lg:flex">
                <Zap className="h-4 w-4 ml-1" />
                אפקטים
              </TabsTrigger>
            </TabsList>

            {/* Borders Tab */}
            <TabsContent value="borders" className="space-y-6">
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Circle className="h-4 w-4" />
                  עיגול פינות
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {(['none', 'small', 'medium', 'large', 'full'] as BorderRadius[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.border_radius}
                      label={{ none: 'ללא', small: 'קטן', medium: 'בינוני', large: 'גדול', full: 'מלא' }[val]}
                      preview={
                        <div 
                          className="w-10 h-10 border-2 border-primary bg-primary/10"
                          style={{ 
                            borderRadius: { none: '0', small: '4px', medium: '8px', large: '12px', full: '50%' }[val] 
                          }}
                        />
                      }
                      onChange={(v) => updatePref('border_radius', v as BorderRadius)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  עובי מסגרות
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'thin', 'normal', 'thick'] as BorderWidth[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.border_width}
                      label={{ none: 'ללא', thin: 'דק', normal: 'רגיל', thick: 'עבה' }[val]}
                      preview={
                        <div 
                          className="w-10 h-10 rounded bg-muted"
                          style={{ 
                            border: `${val === 'none' ? '0' : val === 'thin' ? '1px' : val === 'normal' ? '2px' : '3px'} solid hsl(var(--primary))` 
                          }}
                        />
                      }
                      onChange={(v) => updatePref('border_width', v as BorderWidth)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  עוצמת צללים
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'subtle', 'medium', 'strong'] as ShadowIntensity[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.shadow_intensity}
                      label={{ none: 'ללא', subtle: 'עדין', medium: 'בינוני', strong: 'חזק' }[val]}
                      preview={
                        <div 
                          className="w-10 h-10 rounded bg-card border"
                          style={{ 
                            boxShadow: {
                              none: 'none',
                              subtle: '0 1px 3px rgba(0,0,0,0.1)',
                              medium: '0 4px 6px rgba(0,0,0,0.15)',
                              strong: '0 10px 15px rgba(0,0,0,0.2)'
                            }[val]
                          }}
                        />
                      }
                      onChange={(v) => updatePref('shadow_intensity', v as ShadowIntensity)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="צבע הדגשה (Accent)"
                  value={localPrefs.custom_accent_color}
                  onChange={(v) => updatePref('custom_accent_color', v)}
                  placeholder="#C9A962"
                />
                <ColorPicker
                  label="צבע הצלחה"
                  value={localPrefs.custom_success_color}
                  onChange={(v) => updatePref('custom_success_color', v)}
                  placeholder="#22C55E"
                />
                <ColorPicker
                  label="צבע אזהרה"
                  value={localPrefs.custom_warning_color}
                  onChange={(v) => updatePref('custom_warning_color', v)}
                  placeholder="#F59E0B"
                />
                <ColorPicker
                  label="צבע שגיאה"
                  value={localPrefs.custom_error_color}
                  onChange={(v) => updatePref('custom_error_color', v)}
                  placeholder="#EF4444"
                />
                <ColorPicker
                  label="צבע מסגרות"
                  value={localPrefs.custom_border_color}
                  onChange={(v) => updatePref('custom_border_color', v)}
                  placeholder="#E5E7EB"
                />
              </div>
            </TabsContent>

            {/* Elements Tab */}
            <TabsContent value="elements" className="space-y-6">
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  סגנון כרטיסים
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['flat', 'outlined', 'elevated', 'glass'] as CardStyle[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.card_style}
                      label={{ flat: 'שטוח', outlined: 'מסגרת', elevated: 'מורם', glass: 'זכוכית' }[val]}
                      preview={
                        <div 
                          className="w-12 h-8 rounded-md"
                          style={{ 
                            background: val === 'glass' ? 'rgba(255,255,255,0.1)' : 'hsl(var(--card))',
                            border: val === 'outlined' ? '1px solid hsl(var(--border))' : 'none',
                            boxShadow: val === 'elevated' ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                            backdropFilter: val === 'glass' ? 'blur(8px)' : 'none'
                          }}
                        />
                      }
                      onChange={(v) => updatePref('card_style', v as CardStyle)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  סגנון כפתורים
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['square', 'rounded', 'pill'] as ButtonStyle[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.button_style}
                      label={{ square: 'מרובע', rounded: 'מעוגל', pill: 'גלולה' }[val]}
                      preview={
                        <div 
                          className="w-14 h-6 bg-primary"
                          style={{ 
                            borderRadius: { square: '2px', rounded: '6px', pill: '9999px' }[val]
                          }}
                        />
                      }
                      onChange={(v) => updatePref('button_style', v as ButtonStyle)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  סגנון שדות קלט
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['outlined', 'filled', 'underlined'] as InputStyle[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.input_style}
                      label={{ outlined: 'מסגרת', filled: 'מלא', underlined: 'קו תחתון' }[val]}
                      preview={
                        <div 
                          className="w-14 h-6"
                          style={{ 
                            background: val === 'filled' ? 'hsl(var(--muted))' : 'transparent',
                            border: val === 'outlined' ? '1px solid hsl(var(--border))' : 'none',
                            borderBottom: val === 'underlined' ? '2px solid hsl(var(--primary))' : undefined,
                            borderRadius: val !== 'underlined' ? '4px' : '0'
                          }}
                        />
                      }
                      onChange={(v) => updatePref('input_style', v as InputStyle)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6">
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Sidebar className="h-4 w-4" />
                  סגנון סרגל צד
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['solid', 'gradient', 'transparent'] as SidebarStyle[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.sidebar_style}
                      label={{ solid: 'אחיד', gradient: 'מעבר צבע', transparent: 'שקוף' }[val]}
                      preview={
                        <div 
                          className="w-6 h-12 rounded-sm"
                          style={{ 
                            background: val === 'solid' 
                              ? 'hsl(var(--sidebar-background))' 
                              : val === 'gradient' 
                                ? 'linear-gradient(180deg, hsl(var(--sidebar-background)), hsl(var(--primary)))' 
                                : 'rgba(var(--sidebar-background), 0.5)',
                            border: val === 'transparent' ? '1px dashed hsl(var(--border))' : 'none'
                          }}
                        />
                      }
                      onChange={(v) => updatePref('sidebar_style', v as SidebarStyle)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  סגנון כותרת עליונה
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['solid', 'gradient', 'blur'] as HeaderStyle[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.header_style}
                      label={{ solid: 'אחיד', gradient: 'מעבר צבע', blur: 'טשטוש' }[val]}
                      preview={
                        <div 
                          className="w-14 h-4 rounded-sm"
                          style={{ 
                            background: val === 'solid' 
                              ? 'hsl(var(--card))' 
                              : val === 'gradient' 
                                ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))' 
                                : 'rgba(255,255,255,0.6)',
                            backdropFilter: val === 'blur' ? 'blur(8px)' : 'none',
                            border: '1px solid hsl(var(--border))'
                          }}
                        />
                      }
                      onChange={(v) => updatePref('header_style', v as HeaderStyle)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  סגנון טבלאות
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['minimal', 'striped', 'bordered', 'cards'] as TableStyle[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.table_style}
                      label={{ minimal: 'מינימלי', striped: 'פסים', bordered: 'מסגרות', cards: 'כרטיסים' }[val]}
                      preview={
                        <div className="w-12 h-8 flex flex-col gap-0.5">
                          {[0, 1, 2].map(i => (
                            <div 
                              key={i}
                              className="flex-1 rounded-sm"
                              style={{ 
                                background: val === 'striped' && i % 2 === 1 
                                  ? 'hsl(var(--muted))' 
                                  : 'hsl(var(--card))',
                                border: val === 'bordered' || val === 'cards' 
                                  ? '1px solid hsl(var(--border))' 
                                  : 'none',
                                marginBottom: val === 'cards' ? '2px' : '0'
                              }}
                            />
                          ))}
                        </div>
                      }
                      onChange={(v) => updatePref('table_style', v as TableStyle)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  צפיפות טבלאות
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'normal', 'spacious'] as TableDensity[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.table_density}
                      label={{ compact: 'צפוף', normal: 'רגיל', spacious: 'מרווח' }[val]}
                      preview={
                        <div 
                          className="w-12 flex flex-col border rounded"
                          style={{ gap: { compact: '1px', normal: '3px', spacious: '5px' }[val] }}
                        >
                          {[0, 1, 2].map(i => (
                            <div 
                              key={i}
                              className="bg-muted rounded-sm"
                              style={{ 
                                height: { compact: '4px', normal: '6px', spacious: '8px' }[val]
                              }}
                            />
                          ))}
                        </div>
                      }
                      onChange={(v) => updatePref('table_density', v as TableDensity)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  סף גלילה וירטואלית (מספר שורות)
                </Label>
                <p className="text-xs text-muted-foreground">
                  כאשר מספר השורות בטבלה עולה על הסף, תופעל גלילה וירטואלית לביצועים משופרים
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={10}
                    max={500}
                    value={localPrefs.virtual_scroll_threshold}
                    onChange={(e) => updatePref('virtual_scroll_threshold', parseInt(e.target.value) || 50)}
                    className="w-24"
                    dir="ltr"
                  />
                  <span className="text-sm text-muted-foreground">שורות (ברירת מחדל: 50)</span>
                </div>
              </div>
            </TabsContent>

            {/* Effects Tab */}
            <TabsContent value="effects" className="space-y-6">
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  מהירות אנימציות
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'slow', 'normal', 'fast'] as AnimationSpeed[]).map((val) => (
                    <OptionButton
                      key={val}
                      value={val}
                      current={localPrefs.animation_speed}
                      label={{ none: 'ללא', slow: 'איטי', normal: 'רגיל', fast: 'מהיר' }[val]}
                      icon={<Zap className={`h-6 w-6 ${val === 'none' ? 'text-muted-foreground' : 'text-primary'}`} />}
                      onChange={(v) => updatePref('animation_speed', v as AnimationSpeed)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview Section */}
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              תצוגה מקדימה
            </Label>
            <div 
              className="p-6 rounded-lg border bg-card"
              style={{
                borderRadius: { none: '0', small: '4px', medium: '8px', large: '12px', full: '24px' }[localPrefs.border_radius],
                borderWidth: { none: '0', thin: '1px', normal: '2px', thick: '3px' }[localPrefs.border_width],
                boxShadow: {
                  none: 'none',
                  subtle: '0 1px 3px rgba(0,0,0,0.1)',
                  medium: '0 4px 6px rgba(0,0,0,0.15)',
                  strong: '0 10px 15px rgba(0,0,0,0.2)'
                }[localPrefs.shadow_intensity]
              }}
            >
              <h3 className="font-bold text-lg mb-3">כרטיס לדוגמה</h3>
              <p className="text-muted-foreground text-sm mb-4">
                זוהי תצוגה מקדימה של ההגדרות שבחרת
              </p>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium"
                  style={{ 
                    borderRadius: { square: '2px', rounded: '6px', pill: '9999px' }[localPrefs.button_style]
                  }}
                >
                  כפתור ראשי
                </button>
                <button 
                  className="px-4 py-2 border text-sm font-medium"
                  style={{ 
                    borderRadius: { square: '2px', rounded: '6px', pill: '9999px' }[localPrefs.button_style]
                  }}
                >
                  כפתור משני
                </button>
              </div>
            </div>
          </div>

          {/* Save/Reset Buttons */}
          <div className="flex gap-2 mt-6">
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              className="flex-1"
            >
              {saving ? 'שומר...' : 'שמור שינויים'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 ml-2" />
              בטל שינויים
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
