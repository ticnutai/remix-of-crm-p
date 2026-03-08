// Typography Settings Component - Fonts, Sizes, Spacing
import { Type, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPreferences, fontOptions } from '@/hooks/useUserPreferences';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface TypographySettingsProps {
  preferences: UserPreferences;
  onSave: (prefs: Partial<UserPreferences>) => Promise<void>;
  onReset: () => Promise<void>;
  saving: boolean;
}

export function TypographySettings({ preferences, onSave, onReset, saving }: TypographySettingsProps) {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Font Selection */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-5 w-5 text-primary" />
            בחירת גופנים
          </CardTitle>
          <CardDescription>
            בחר את הגופנים המועדפים עליך
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>גופן ראשי</Label>
              <Select
                value={preferences.font_family}
                onValueChange={(value) => onSave({ font_family: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>גופן כותרות</Label>
              <Select
                value={preferences.heading_font}
                onValueChange={(value) => onSave({ heading_font: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">גודל גופן</CardTitle>
          <CardDescription>התאם את גודל הגופן הבסיסי</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-12">קטן</span>
            <Slider
              value={[preferences.font_size]}
              onValueChange={([value]) => onSave({ font_size: value })}
              min={80}
              max={120}
              step={5}
              disabled={saving}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12">גדול</span>
            <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full min-w-[60px] text-center">
              {preferences.font_size}%
            </span>
          </div>
          
          <div className="flex justify-center gap-2">
            <Button
              variant={preferences.font_size === 85 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSave({ font_size: 85 })}
              disabled={saving}
            >
              קטן
            </Button>
            <Button
              variant={preferences.font_size === 100 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSave({ font_size: 100 })}
              disabled={saving}
            >
              רגיל
            </Button>
            <Button
              variant={preferences.font_size === 115 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSave({ font_size: 115 })}
              disabled={saving}
            >
              גדול
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Line Height & Letter Spacing */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">מרווחים</CardTitle>
          <CardDescription>התאם את מרווחי השורות והאותיות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>גובה שורה</Label>
            <ToggleGroup
              type="single"
              value={preferences.line_height}
              onValueChange={(value) => value && onSave({ line_height: value as 'compact' | 'normal' | 'spacious' })}
              className="justify-start"
            >
              <ToggleGroupItem value="compact" className="px-6">צפוף</ToggleGroupItem>
              <ToggleGroupItem value="normal" className="px-6">רגיל</ToggleGroupItem>
              <ToggleGroupItem value="spacious" className="px-6">מרווח</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-3">
            <Label>מרווח אותיות</Label>
            <ToggleGroup
              type="single"
              value={preferences.letter_spacing}
              onValueChange={(value) => value && onSave({ letter_spacing: value as 'compact' | 'normal' | 'spacious' })}
              className="justify-start"
            >
              <ToggleGroupItem value="compact" className="px-6">צפוף</ToggleGroupItem>
              <ToggleGroupItem value="normal" className="px-6">רגיל</ToggleGroupItem>
              <ToggleGroupItem value="spacious" className="px-6">מרווח</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">תצוגה מקדימה</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 bg-muted/30 rounded-lg border"
            style={{
              fontFamily: preferences.font_family,
              fontSize: `${preferences.font_size}%`,
              lineHeight: preferences.line_height === 'compact' ? 1.4 : preferences.line_height === 'spacious' ? 1.8 : 1.6,
              letterSpacing: preferences.letter_spacing === 'compact' ? '-0.02em' : preferences.letter_spacing === 'spacious' ? '0.02em' : '0',
            }}
          >
            <h3 
              className="text-xl font-bold mb-3"
              style={{ fontFamily: preferences.heading_font }}
            >
              כותרת לדוגמה
            </h3>
            <p className="text-muted-foreground">
              זהו טקסט לדוגמה שמציג כיצד ייראו הגופנים והמרווחים שבחרת. 
              השינויים מוחלים בזמן אמת על כל האפליקציה.
            </p>
            <p className="text-sm mt-2 text-muted-foreground/70">
              טקסט קטן יותר לבדיקת קריאות בגדלים שונים
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={onReset}
          disabled={saving}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          איפוס להגדרות ברירת מחדל
        </Button>
      </div>
    </div>
  );
}
