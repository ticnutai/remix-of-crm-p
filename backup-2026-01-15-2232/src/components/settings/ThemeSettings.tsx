// Theme Settings Component - Advanced Color Schemes with Edit/Delete/Export/Import
import { Check, Palette, Sparkles, Edit2, Trash2, Download, Upload, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPreferences, themePresets } from '@/hooks/useUserPreferences';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface CustomTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  primaryHex: string;
  secondaryHex: string;
}

interface ThemeSettingsProps {
  preferences: UserPreferences;
  onSave: (prefs: Partial<UserPreferences>) => Promise<void>;
  saving: boolean;
}

const CUSTOM_THEMES_KEY = 'ten-arch-custom-themes';

// Helper to convert hex to HSL
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ThemeSettings({ preferences, onSave, saving }: ThemeSettingsProps) {
  const [customPrimary, setCustomPrimary] = useState(preferences.custom_primary_color || '#1B2541');
  const [customSecondary, setCustomSecondary] = useState(preferences.custom_secondary_color || '#C9A962');
  const [customThemeName, setCustomThemeName] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
  const [deleteTheme, setDeleteTheme] = useState<CustomTheme | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom themes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (saved) {
      try {
        setCustomThemes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom themes:', e);
      }
    }
  }, []);

  // Save custom themes to localStorage
  const saveCustomThemes = (themes: CustomTheme[]) => {
    setCustomThemes(themes);
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  };

  const handleThemeSelect = async (preset: string, isCustom?: boolean) => {
    if (isCustom) {
      const theme = customThemes.find(t => t.id === preset);
      if (theme) {
        await onSave({ 
          theme_preset: 'custom',
          custom_primary_color: theme.primary, 
          custom_secondary_color: theme.secondary,
        });
      }
    } else {
      await onSave({ 
        theme_preset: preset, 
        custom_primary_color: null, 
        custom_secondary_color: null 
      });
    }
  };

  const handleSaveCustomTheme = () => {
    if (!customThemeName.trim()) {
      toast.error('יש להזין שם לערכת הנושא');
      return;
    }

    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: customThemeName.trim(),
      primary: hexToHsl(customPrimary),
      secondary: hexToHsl(customSecondary),
      primaryHex: customPrimary,
      secondaryHex: customSecondary,
    };

    saveCustomThemes([...customThemes, newTheme]);
    setCustomThemeName('');
    setShowCustom(false);
    toast.success('ערכת הנושא נשמרה');

    // Apply the new theme
    handleThemeSelect(newTheme.id, true);
  };

  const handleUpdateTheme = () => {
    if (!editingTheme) return;

    const updated = customThemes.map(t => 
      t.id === editingTheme.id 
        ? {
            ...t,
            name: editingTheme.name,
            primary: hexToHsl(editingTheme.primaryHex),
            secondary: hexToHsl(editingTheme.secondaryHex),
            primaryHex: editingTheme.primaryHex,
            secondaryHex: editingTheme.secondaryHex,
          }
        : t
    );
    saveCustomThemes(updated);
    setEditingTheme(null);
    toast.success('ערכת הנושא עודכנה');
  };

  const handleDeleteTheme = () => {
    if (!deleteTheme) return;
    const updated = customThemes.filter(t => t.id !== deleteTheme.id);
    saveCustomThemes(updated);
    setDeleteTheme(null);
    toast.success('ערכת הנושא נמחקה');
  };

  const handleExportThemes = () => {
    const data = {
      version: 1,
      themes: customThemes,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ten-arch-themes-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ערכות הנושא יוצאו בהצלחה');
  };

  const handleImportThemes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.themes && Array.isArray(data.themes)) {
          const imported = data.themes.map((t: CustomTheme) => ({
            ...t,
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }));
          saveCustomThemes([...customThemes, ...imported]);
          toast.success(`יובאו ${imported.length} ערכות נושא`);
        }
      } catch (err) {
        toast.error('שגיאה בייבוא הקובץ');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isCustomThemeActive = (theme: CustomTheme) => {
    return preferences.theme_preset === 'custom' && 
           preferences.custom_primary_color === theme.primary;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Built-in Themes */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            ערכות צבעים
          </CardTitle>
          <CardDescription>
            בחר ערכת צבעים מוכנה או צור ערכה מותאמת אישית
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(themePresets).map(([key, theme]) => {
              const isActive = preferences.theme_preset === key && !preferences.custom_primary_color;
              return (
                <button
                  key={key}
                  onClick={() => handleThemeSelect(key)}
                  disabled={saving}
                  className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    isActive 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {isActive && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs">
                      <Check className="h-3 w-3 ml-1" />
                      פעיל
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-6 h-6 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: theme.primaryHex }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: theme.secondaryHex }}
                    />
                  </div>
                  <span className="text-sm font-medium">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Themes */}
      {customThemes.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                ערכות מותאמות אישית
              </CardTitle>
              <CardDescription>
                ערכות נושא שיצרת
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportThemes}
                className="h-8"
              >
                <Download className="h-4 w-4 ml-1" />
                יצוא
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8"
              >
                <Upload className="h-4 w-4 ml-1" />
                ייבוא
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportThemes}
                className="hidden"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {customThemes.map((theme) => {
                const isActive = isCustomThemeActive(theme);
                return (
                  <div
                    key={theme.id}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      isActive 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {isActive && (
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs">
                        <Check className="h-3 w-3 ml-1" />
                        פעיל
                      </Badge>
                    )}
                    
                    {/* Edit/Delete buttons */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTheme({ ...theme });
                            }}
                            className="p-1 rounded hover:bg-muted"
                          >
                            <Edit2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                          <DialogHeader>
                            <DialogTitle>עריכת ערכת נושא</DialogTitle>
                            <DialogDescription>
                              ערוך את הגדרות ערכת הנושא
                            </DialogDescription>
                          </DialogHeader>
                          {editingTheme && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>שם</Label>
                                <Input
                                  value={editingTheme.name}
                                  onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>צבע ראשי</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="color"
                                      value={editingTheme.primaryHex}
                                      onChange={(e) => setEditingTheme({ ...editingTheme, primaryHex: e.target.value })}
                                      className="w-14 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                      value={editingTheme.primaryHex}
                                      onChange={(e) => setEditingTheme({ ...editingTheme, primaryHex: e.target.value })}
                                      className="flex-1"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>צבע משני</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="color"
                                      value={editingTheme.secondaryHex}
                                      onChange={(e) => setEditingTheme({ ...editingTheme, secondaryHex: e.target.value })}
                                      className="w-14 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                      value={editingTheme.secondaryHex}
                                      onChange={(e) => setEditingTheme({ ...editingTheme, secondaryHex: e.target.value })}
                                      className="flex-1"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div 
                                className="p-4 rounded-lg border"
                                style={{ 
                                  backgroundColor: editingTheme.secondaryHex,
                                  color: editingTheme.primaryHex
                                }}
                              >
                                <span className="font-bold">תצוגה מקדימה</span>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button onClick={handleUpdateTheme}>
                              <Save className="h-4 w-4 ml-1" />
                              שמור
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTheme(theme);
                        }}
                        className="p-1 rounded hover:bg-destructive/20"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleThemeSelect(theme.id, true)}
                      disabled={saving}
                      className="w-full text-right"
                    >
                      <div className="flex items-center gap-2 mb-2 mt-4">
                        <div 
                          className="w-6 h-6 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: theme.primaryHex }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: theme.secondaryHex }}
                        />
                      </div>
                      <span className="text-sm font-medium">{theme.name}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Custom Theme */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            ערכה מותאמת אישית חדשה
          </CardTitle>
          <CardDescription>
            בחר צבעים משלך ליצירת מראה ייחודי
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowCustom(!showCustom)}
            className="w-full"
          >
            {showCustom ? 'הסתר' : 'צור ערכה מותאמת'}
          </Button>

          {showCustom && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label>שם ערכת הנושא</Label>
                <Input
                  value={customThemeName}
                  onChange={(e) => setCustomThemeName(e.target.value)}
                  placeholder="לדוגמה: העיצוב שלי"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>צבע ראשי</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      placeholder="#1B2541"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>צבע משני</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customSecondary}
                      onChange={(e) => setCustomSecondary(e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={customSecondary}
                      onChange={(e) => setCustomSecondary(e.target.value)}
                      placeholder="#C9A962"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>תצוגה מקדימה</Label>
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: customSecondary,
                    color: customPrimary
                  }}
                >
                  <h3 className="font-bold text-lg mb-2">כותרת לדוגמה</h3>
                  <p className="text-sm opacity-90">טקסט לדוגמה עם הצבעים שבחרת</p>
                  <button 
                    className="mt-3 px-4 py-2 rounded-md text-sm font-medium"
                    style={{ 
                      backgroundColor: customPrimary,
                      color: customSecondary
                    }}
                  >
                    כפתור לדוגמה
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleSaveCustomTheme} 
                disabled={saving || !customThemeName.trim()}
                className="w-full"
              >
                <Save className="h-4 w-4 ml-1" />
                שמור ערכה מותאמת
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import/Export when no custom themes */}
      {customThemes.length === 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-primary" />
              ייבוא ערכות נושא
            </CardTitle>
            <CardDescription>
              ייבא ערכות נושא מקובץ JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 ml-1" />
              בחר קובץ לייבוא
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportThemes}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTheme} onOpenChange={(open) => !open && setDeleteTheme(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת ערכת נושא</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את ערכת הנושא "{deleteTheme?.name}"? פעולה זו אינה הפיכה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTheme} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
