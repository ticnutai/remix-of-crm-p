// Timer Settings Dialog - Enhanced Theme Customization
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Palette, Sparkles, Maximize2, RotateCcw, Save, Trash2, Edit2, Type, 
  Eye, Play, Pause, Clock, User, Briefcase, Tag, Check, Copy, Wand2,
  Sun, Moon, Zap, Heart, Gem, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface TimerTheme {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  buttonColor: string;
  width: number;
  height: number;
  fontFamily: string;
  timerFontFamily?: string; // Font for timer digits (00:00:00)
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  lineHeight?: number;
  glowEffect?: boolean;
  gradientBg?: boolean;
  gradientDirection?: string;
  secondaryBgColor?: string;
  shadowIntensity?: 'none' | 'soft' | 'medium' | 'strong';
  iconColor: 'gold' | 'navy' | 'gray' | 'white' | 'accent';
  inputTextColor: 'gold' | 'navy' | 'gray' | 'white' | 'accent';
  inputBgColor: 'gold' | 'navy' | 'gray' | 'white' | 'accent';
  frameColor: 'gold' | 'navy' | 'gray' | 'white' | 'accent';
  timerDisplayFontSize?: number; // Font size for the timer display (00:00:00)
  // Text customization options
  timerDigitsColor?: string; // Custom color for timer digits
  labelsColor?: string; // Color for labels like "היום:", "רישומי זמן היום"
  labelsFontSize?: number; // Font size for labels
  entryTextColor?: string; // Color for time entry text (descriptions)
  entryFontSize?: number; // Font size for time entry descriptions
  entryFontFamily?: string; // Font for time entries
  // Button customization
  buttonShape?: 'circle' | 'rounded' | 'square'; // Shape of action buttons
  buttonSize?: number; // Size of action buttons (px)
  buttonGradient?: boolean; // Whether buttons have gradient
  buttonShadow?: boolean; // Whether buttons have shadow
  // Tag customization
  tagShape?: 'pill' | 'rounded' | 'square'; // Shape of tags
  tagSize?: 'sm' | 'md' | 'lg'; // Size of tags
  tagBgOpacity?: number; // Background opacity for tags (0-100)
  tagBorderWidth?: number; // Border width for tags
  tagTextColor?: string; // Custom text color for tags
  tagBgColor?: string; // Custom background color for tags
  // Input field customization
  inputShape?: 'rounded' | 'pill' | 'square'; // Shape of input fields
  inputBorderWidth?: number; // Border width for inputs
  inputHeight?: number; // Height of input fields
  // Play/Pause button customization
  playButtonColor?: string; // Custom color for play button
  playButtonBgColor?: string; // Custom background color for play button
}

// Extended color mappings
export const TIMER_COLOR_MAP = {
  gold: { 
    bg: 'hsl(45, 80%, 50%)', 
    text: 'hsl(45, 80%, 55%)', 
    border: 'hsl(45, 80%, 50%)',
    icon: 'hsl(45, 85%, 60%)',
    light: 'hsl(45, 80%, 95%)',
    dark: 'hsl(45, 80%, 20%)'
  },
  navy: { 
    bg: 'hsl(220, 60%, 20%)', 
    text: 'hsl(220, 60%, 25%)', 
    border: 'hsl(220, 60%, 30%)',
    icon: 'hsl(220, 60%, 30%)',
    light: 'hsl(220, 60%, 95%)',
    dark: 'hsl(220, 60%, 15%)'
  },
  gray: { 
    bg: 'hsl(0, 0%, 50%)', 
    text: 'hsl(0, 0%, 45%)', 
    border: 'hsl(0, 0%, 55%)',
    icon: 'hsl(0, 0%, 55%)',
    light: 'hsl(0, 0%, 95%)',
    dark: 'hsl(0, 0%, 25%)'
  },
  white: { 
    bg: 'hsl(0, 0%, 100%)', 
    text: 'hsl(0, 0%, 100%)', 
    border: 'hsl(0, 0%, 95%)',
    icon: 'hsl(0, 0%, 100%)',
    light: 'hsl(0, 0%, 100%)',
    dark: 'hsl(0, 0%, 90%)'
  },
  accent: { 
    bg: 'inherit', 
    text: 'inherit', 
    border: 'inherit',
    icon: 'inherit',
    light: 'inherit',
    dark: 'inherit'
  },
};

interface CustomTimerTheme {
  id: string;
  name: string;
  theme: TimerTheme;
  isBuiltIn?: boolean;
}

const CUSTOM_TIMER_THEMES_KEY = 'custom-timer-themes';

// Extended font options with categories
const FONT_OPTIONS = [
  { value: 'Heebo', label: 'חיבו (Heebo)', category: 'modern', sample: 'אבגדה 12345' },
  { value: 'David Libre', label: 'דוד (David)', category: 'classic', sample: 'אבגדה 12345' },
  { value: 'Frank Ruhl Libre', label: 'פרנק רוהל', category: 'elegant', sample: 'אבגדה 12345' },
  { value: 'Rubik', label: 'רוביק (Rubik)', category: 'modern', sample: 'אבגדה 12345' },
  { value: 'Assistant', label: 'אסיסטנט', category: 'modern', sample: 'אבגדה 12345' },
  { value: 'Secular One', label: 'סקולר אחד', category: 'bold', sample: 'אבגדה 12345' },
  { value: 'Varela Round', label: 'ורלה עגול', category: 'friendly', sample: 'אבגדה 12345' },
  { value: 'Alef', label: 'אלף (Alef)', category: 'classic', sample: 'אבגדה 12345' },
  { value: 'Noto Sans Hebrew', label: 'נוטו סאנס', category: 'modern', sample: 'אבגדה 12345' },
  { value: 'Suez One', label: 'סואץ אחד', category: 'display', sample: 'אבגדה 12345' },
  { value: 'Amatic SC', label: 'אמאטיק', category: 'handwritten', sample: 'אבגדה 12345' },
];

// Timer digit font options (monospace and display fonts for numbers)
const TIMER_FONT_OPTIONS = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono', sample: '00:00:00', category: 'monospace' },
  { value: 'Fira Code', label: 'Fira Code', sample: '00:00:00', category: 'monospace' },
  { value: 'Source Code Pro', label: 'Source Code Pro', sample: '00:00:00', category: 'monospace' },
  { value: 'Roboto Mono', label: 'Roboto Mono', sample: '00:00:00', category: 'monospace' },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono', sample: '00:00:00', category: 'monospace' },
  { value: 'Space Mono', label: 'Space Mono', sample: '00:00:00', category: 'monospace' },
  { value: 'Courier Prime', label: 'Courier Prime', sample: '00:00:00', category: 'classic' },
  { value: 'Orbitron', label: 'Orbitron', sample: '00:00:00', category: 'futuristic' },
  { value: 'Digital-7', label: 'Digital 7', sample: '00:00:00', category: 'digital' },
  { value: 'Segment7', label: 'Segment 7', sample: '00:00:00', category: 'digital' },
  { value: 'Share Tech Mono', label: 'Share Tech Mono', sample: '00:00:00', category: 'tech' },
  { value: 'Oxanium', label: 'Oxanium', sample: '00:00:00', category: 'futuristic' },
  { value: 'Rajdhani', label: 'Rajdhani', sample: '00:00:00', category: 'modern' },
  { value: 'Teko', label: 'Teko', sample: '00:00:00', category: 'display' },
  { value: 'Oswald', label: 'Oswald', sample: '00:00:00', category: 'display' },
  { value: 'Bebas Neue', label: 'Bebas Neue', sample: '00:00:00', category: 'display' },
];

const defaultTheme: TimerTheme = {
  backgroundColor: 'hsl(220, 60%, 20%)',
  textColor: 'hsl(0, 0%, 100%)',
  accentColor: 'hsl(45, 80%, 55%)',
  borderColor: 'hsl(45, 80%, 50%)',
  buttonColor: 'hsl(45, 80%, 50%)',
  width: 420,
  height: 520,
  fontFamily: 'Heebo',
  timerFontFamily: 'JetBrains Mono',
  borderWidth: 3,
  borderRadius: 16,
  fontSize: 14,
  lineHeight: 1.5,
  glowEffect: true,
  gradientBg: false,
  gradientDirection: 'to-br',
  secondaryBgColor: 'hsl(220, 60%, 25%)',
  shadowIntensity: 'medium',
  iconColor: 'gold',
  inputTextColor: 'navy',
  inputBgColor: 'white',
  frameColor: 'gold',
  timerDisplayFontSize: 28,
  timerDigitsColor: 'hsl(0, 0%, 100%)',
  labelsColor: 'hsl(45, 80%, 55%)',
  labelsFontSize: 12,
  entryTextColor: 'hsl(0, 0%, 100%)',
  entryFontSize: 14,
  entryFontFamily: 'Heebo',
  // Button defaults
  buttonShape: 'rounded',
  buttonSize: 40,
  buttonGradient: true,
  buttonShadow: true,
  // Tag defaults
  tagShape: 'pill',
  tagSize: 'sm',
  tagBgOpacity: 20,
  tagBorderWidth: 1,
  tagTextColor: '',
  tagBgColor: '',
  // Input defaults
  inputShape: 'rounded',
  inputBorderWidth: 1,
  inputHeight: 40,
  // Play button defaults
  playButtonColor: '',
  playButtonBgColor: '',
};

// Extended color presets with categories
const colorPresets = [
  // Premium
  { name: 'Navy Gold', bg: 'hsl(220, 60%, 18%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(45, 80%, 55%)', icon: Crown, category: 'premium' },
  { name: 'Royal Purple', bg: 'hsl(270, 50%, 15%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(280, 80%, 70%)', icon: Gem, category: 'premium' },
  { name: 'Rose Gold', bg: 'hsl(350, 30%, 18%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(15, 70%, 65%)', icon: Heart, category: 'premium' },
  
  // Modern
  { name: 'Dark Modern', bg: 'hsl(240, 10%, 8%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(210, 100%, 60%)', icon: Zap, category: 'modern' },
  { name: 'Midnight', bg: 'hsl(240, 20%, 12%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(250, 90%, 70%)', icon: Moon, category: 'modern' },
  { name: 'Neon', bg: 'hsl(260, 30%, 10%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(170, 100%, 50%)', icon: Zap, category: 'modern' },
  
  // Nature
  { name: 'Emerald', bg: 'hsl(160, 40%, 15%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(150, 80%, 50%)', icon: Sparkles, category: 'nature' },
  { name: 'Forest', bg: 'hsl(140, 35%, 12%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(130, 70%, 45%)', icon: Sparkles, category: 'nature' },
  { name: 'Ocean', bg: 'hsl(200, 50%, 15%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(190, 90%, 50%)', icon: Sparkles, category: 'nature' },
  
  // Warm
  { name: 'Amber', bg: 'hsl(30, 30%, 15%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(35, 90%, 55%)', icon: Sun, category: 'warm' },
  { name: 'Sunset', bg: 'hsl(20, 35%, 15%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(25, 95%, 55%)', icon: Sun, category: 'warm' },
  { name: 'Copper', bg: 'hsl(25, 30%, 12%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(30, 75%, 50%)', icon: Sun, category: 'warm' },
  
  // Cool
  { name: 'Arctic', bg: 'hsl(210, 15%, 12%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(210, 20%, 70%)', icon: Moon, category: 'cool' },
  { name: 'Teal', bg: 'hsl(180, 35%, 12%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(175, 70%, 50%)', icon: Moon, category: 'cool' },
  { name: 'Sakura', bg: 'hsl(340, 25%, 15%)', text: 'hsl(0, 0%, 100%)', accent: 'hsl(350, 80%, 70%)', icon: Heart, category: 'cool' },
];

interface TimerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: TimerTheme;
  onThemeChange: (theme: TimerTheme) => void;
}

export function TimerSettingsDialog({
  open,
  onOpenChange,
  theme,
  onThemeChange,
}: TimerSettingsDialogProps) {
  const [localTheme, setLocalTheme] = useState<TimerTheme>(theme);
  const [customThemes, setCustomThemes] = useState<CustomTimerTheme[]>([]);
  const [newThemeName, setNewThemeName] = useState('');
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingThemeName, setEditingThemeName] = useState('');
  const [previewMode, setPreviewMode] = useState<'idle' | 'running' | 'paused'>('idle');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Load custom themes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_TIMER_THEMES_KEY);
    if (saved) {
      setCustomThemes(JSON.parse(saved));
    }
  }, []);

  // Save custom themes to localStorage
  const saveCustomThemes = (themes: CustomTimerTheme[]) => {
    localStorage.setItem(CUSTOM_TIMER_THEMES_KEY, JSON.stringify(themes));
    setCustomThemes(themes);
  };

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const handleColorChange = (key: keyof TimerTheme, value: any) => {
    const newTheme = { ...localTheme, [key]: value };
    setLocalTheme(newTheme);
    onThemeChange(newTheme);
  };

  const handleSizeChange = (key: keyof TimerTheme, value: number[]) => {
    const newTheme = { ...localTheme, [key]: value[0] };
    setLocalTheme(newTheme);
    onThemeChange(newTheme);
  };

  const handleFontChange = (fontFamily: string) => {
    const newTheme = { ...localTheme, fontFamily };
    setLocalTheme(newTheme);
    onThemeChange(newTheme);
  };

  const handleTimerFontChange = (timerFontFamily: string) => {
    const newTheme = { ...localTheme, timerFontFamily };
    setLocalTheme(newTheme);
    onThemeChange(newTheme);
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    const newTheme = {
      ...localTheme,
      backgroundColor: preset.bg,
      textColor: preset.text,
      accentColor: preset.accent,
      borderColor: preset.accent,
      buttonColor: preset.accent,
    };
    setLocalTheme(newTheme);
    onThemeChange(newTheme);
  };

  const applyCustomTheme = (customTheme: CustomTimerTheme) => {
    const mergedTheme = { ...defaultTheme, ...customTheme.theme };
    setLocalTheme(mergedTheme);
    onThemeChange(mergedTheme);
    toast.success(`ערכת "${customTheme.name}" הוחלה`);
  };

  const saveCurrentAsCustom = () => {
    if (!newThemeName.trim()) {
      toast.error('יש להזין שם לערכת הנושא');
      return;
    }
    
    const newCustomTheme: CustomTimerTheme = {
      id: Date.now().toString(),
      name: newThemeName.trim(),
      theme: { ...localTheme },
    };
    
    saveCustomThemes([...customThemes, newCustomTheme]);
    setNewThemeName('');
    toast.success('ערכת הנושא נשמרה בהצלחה');
  };

  const savePresetAsCustom = (preset: typeof colorPresets[0]) => {
    const newCustomTheme: CustomTimerTheme = {
      id: Date.now().toString(),
      name: `${preset.name} (עותק)`,
      theme: { 
        ...localTheme,
        backgroundColor: preset.bg,
        textColor: preset.text,
        accentColor: preset.accent,
        borderColor: preset.accent,
        buttonColor: preset.accent,
      },
    };
    
    saveCustomThemes([...customThemes, newCustomTheme]);
    toast.success(`ערכת "${preset.name}" נשמרה כעותק`);
  };

  const startEditingTheme = (customTheme: CustomTimerTheme) => {
    setEditingThemeId(customTheme.id);
    setEditingThemeName(customTheme.name);
    applyCustomTheme(customTheme);
  };

  const saveEditedTheme = (id: string) => {
    if (!editingThemeName.trim()) {
      toast.error('יש להזין שם לערכת הנושא');
      return;
    }
    
    const updated = customThemes.map(t => 
      t.id === id ? { ...t, name: editingThemeName.trim(), theme: { ...localTheme } } : t
    );
    saveCustomThemes(updated);
    setEditingThemeId(null);
    setEditingThemeName('');
    toast.success('ערכת הנושא עודכנה');
  };

  const deleteCustomTheme = (id: string) => {
    saveCustomThemes(customThemes.filter(t => t.id !== id));
    toast.success('ערכת הנושא נמחקה');
  };

  const resetToDefault = () => {
    setLocalTheme(defaultTheme);
    onThemeChange(defaultTheme);
    toast.success('ההגדרות אופסו לברירת מחדל');
  };

  // Get background style for preview
  const getPreviewBgStyle = (): React.CSSProperties => {
    if (localTheme.gradientBg && localTheme.secondaryBgColor) {
      const directions: Record<string, string> = {
        'to-br': '135deg',
        'to-b': '180deg',
        'to-r': '90deg',
        'to-tr': '45deg',
      };
      const deg = directions[localTheme.gradientDirection || 'to-br'] || '135deg';
      return {
        background: `linear-gradient(${deg}, ${localTheme.backgroundColor}, ${localTheme.secondaryBgColor})`,
      };
    }
    return { backgroundColor: localTheme.backgroundColor };
  };

  // Get shadow style
  const getShadowStyle = (): string => {
    const shadows: Record<string, string> = {
      none: 'none',
      soft: '0 4px 20px rgba(0,0,0,0.1)',
      medium: '0 8px 30px rgba(0,0,0,0.2)',
      strong: '0 12px 40px rgba(0,0,0,0.4)',
    };
    return shadows[localTheme.shadowIntensity || 'medium'];
  };

  // Filter presets by category
  const filteredPresets = activeCategory === 'all' 
    ? colorPresets 
    : colorPresets.filter(p => p.category === activeCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden bg-background p-0" dir="rtl">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Palette className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg">עורך ערכות נושא לטיימר</span>
              <Badge variant="secondary" className="mr-2 text-xs">מתקדם</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[550px] max-h-[calc(90vh-100px)]">
          {/* Live Preview Panel */}
          <div className="w-[280px] border-l bg-muted/30 p-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Eye className="h-4 w-4" />
                תצוגה מקדימה
              </Label>
              <div className="flex gap-1">
                {(['idle', 'running', 'paused'] as const).map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={previewMode === mode ? 'default' : 'ghost'}
                    className="h-7 px-2 text-xs"
                    onClick={() => setPreviewMode(mode)}
                  >
                    {mode === 'idle' ? 'עצור' : mode === 'running' ? 'פועל' : 'מושהה'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Timer Preview */}
            <div 
              className="flex-1 rounded-xl overflow-hidden transition-all duration-300"
              style={{
                ...getPreviewBgStyle(),
                borderWidth: `${localTheme.borderWidth || 3}px`,
                borderStyle: 'solid',
                borderColor: localTheme.borderColor,
                borderRadius: `${localTheme.borderRadius || 16}px`,
                boxShadow: getShadowStyle(),
                fontFamily: `"${localTheme.fontFamily}", sans-serif`,
              }}
            >
              <div className="p-4 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: localTheme.accentColor }} />
                    <span className="text-sm font-medium" style={{ color: localTheme.textColor }}>
                      טיימר
                    </span>
                  </div>
                  {localTheme.glowEffect && (
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: localTheme.accentColor }}
                    />
                  )}
                </div>

                {/* Time Display */}
                <div 
                  className={cn(
                    "text-center py-4 font-mono text-3xl font-light tracking-widest transition-all",
                    localTheme.glowEffect && previewMode === 'running' && "drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                  )}
                  style={{ 
                    color: previewMode === 'running' ? localTheme.accentColor : 
                           previewMode === 'paused' ? 'hsl(30, 90%, 60%)' : 
                           `${localTheme.textColor}99`,
                    fontSize: `${(localTheme.fontSize || 14) * 2}px`,
                  }}
                >
                  {previewMode === 'running' ? '01:23:45' : previewMode === 'paused' ? '00:45:30' : '00:00:00'}
                </div>

                {/* Client/Project Tags */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div 
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${localTheme.accentColor}20`,
                      color: localTheme.accentColor,
                      border: `1px solid ${localTheme.accentColor}40`,
                    }}
                  >
                    <User className="h-3 w-3" />
                    <span>לקוח לדוגמה</span>
                  </div>
                  <div 
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: 'hsl(210, 80%, 50%, 0.2)',
                      color: 'hsl(210, 80%, 60%)',
                      border: '1px solid hsl(210, 80%, 50%, 0.3)',
                    }}
                  >
                    <Briefcase className="h-3 w-3" />
                    <span>פרויקט</span>
                  </div>
                </div>

                {/* Input Preview */}
                <div 
                  className={cn(
                    "px-3 py-2 text-sm mb-3",
                    localTheme.inputShape === 'pill' && "rounded-full",
                    localTheme.inputShape === 'rounded' && "rounded-lg",
                    localTheme.inputShape === 'square' && "rounded-none"
                  )}
                  style={{ 
                    backgroundColor: TIMER_COLOR_MAP[localTheme.inputBgColor || 'white'].bg,
                    color: TIMER_COLOR_MAP[localTheme.inputTextColor || 'navy'].text,
                    borderWidth: `${localTheme.inputBorderWidth || 1}px`,
                    borderStyle: 'solid',
                    borderColor: `${localTheme.borderColor}40`,
                    fontSize: `${localTheme.fontSize || 14}px`,
                    lineHeight: localTheme.lineHeight || 1.5,
                    height: `${localTheme.inputHeight || 40}px`,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  על מה אתה עובד?
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-2 mt-auto">
                  <div 
                    className={cn(
                      "flex items-center justify-center transition-transform hover:scale-105",
                      localTheme.buttonShape === 'circle' && "rounded-full",
                      localTheme.buttonShape === 'rounded' && "rounded-xl",
                      localTheme.buttonShape === 'square' && "rounded-none"
                    )}
                    style={{ 
                      width: `${localTheme.buttonSize || 40}px`,
                      height: `${localTheme.buttonSize || 40}px`,
                      background: localTheme.buttonGradient 
                        ? `linear-gradient(135deg, ${localTheme.playButtonBgColor || localTheme.buttonColor}, ${localTheme.accentColor})`
                        : (localTheme.playButtonBgColor || localTheme.buttonColor),
                      boxShadow: localTheme.buttonShadow 
                        ? `0 4px 15px ${localTheme.accentColor}40`
                        : 'none',
                    }}
                  >
                    {previewMode === 'running' ? (
                      <Pause className="h-4 w-4" style={{ color: localTheme.playButtonColor || localTheme.backgroundColor }} />
                    ) : (
                      <Play className="h-4 w-4 mr-[-2px]" style={{ color: localTheme.playButtonColor || localTheme.backgroundColor }} />
                    )}
                  </div>
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: `${localTheme.textColor}30` }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" style={{ color: localTheme.textColor }} />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3 justify-center">
                  {['עיצוב', 'פגישה'].map((tag) => {
                    const tagColor = localTheme.tagTextColor || localTheme.accentColor;
                    const tagBg = localTheme.tagBgColor || localTheme.accentColor;
                    const tagSizeClasses = {
                      sm: 'px-2 py-0.5 text-[10px]',
                      md: 'px-2.5 py-1 text-xs',
                      lg: 'px-3 py-1.5 text-sm',
                    };
                    return (
                      <span
                        key={tag}
                        className={cn(
                          tagSizeClasses[localTheme.tagSize || 'sm'],
                          localTheme.tagShape === 'pill' && "rounded-full",
                          localTheme.tagShape === 'rounded' && "rounded-md",
                          localTheme.tagShape === 'square' && "rounded-none"
                        )}
                        style={{ 
                          backgroundColor: `${tagBg}${Math.round((localTheme.tagBgOpacity || 20) * 2.55).toString(16).padStart(2, '0')}`,
                          color: tagColor,
                          borderWidth: `${localTheme.tagBorderWidth || 1}px`,
                          borderStyle: 'solid',
                          borderColor: `${tagColor}40`,
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <Tabs defaultValue="presets" className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <TabsList className="mx-4 mt-2 grid grid-cols-6 flex-shrink-0">
                <TabsTrigger value="presets" className="gap-1 text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  ערכות
                </TabsTrigger>
                <TabsTrigger value="colors" className="gap-1 text-xs">
                  <Palette className="h-3.5 w-3.5" />
                  צבעים
                </TabsTrigger>
                <TabsTrigger value="fonts" className="gap-1 text-xs">
                  <Type className="h-3.5 w-3.5" />
                  טיפוגרפיה
                </TabsTrigger>
                <TabsTrigger value="elements" className="gap-1 text-xs">
                  <Tag className="h-3.5 w-3.5" />
                  אלמנטים
                </TabsTrigger>
                <TabsTrigger value="effects" className="gap-1 text-xs">
                  <Wand2 className="h-3.5 w-3.5" />
                  אפקטים
                </TabsTrigger>
                <TabsTrigger value="size" className="gap-1 text-xs">
                  <Maximize2 className="h-3.5 w-3.5" />
                  גודל
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 min-h-0 h-full">
                <div className="px-4 py-3">
                {/* Presets Tab */}
                <TabsContent value="presets" className="mt-0 space-y-4">
                  {/* Save current as custom */}
                  <div className="p-3 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Save className="h-4 w-4 text-primary" />
                      שמור ערכה מותאמת אישית
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="שם ערכת הנושא..."
                        value={newThemeName}
                        onChange={(e) => setNewThemeName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={saveCurrentAsCustom} size="sm" className="gap-1">
                        <Save className="h-4 w-4" />
                        שמור
                      </Button>
                    </div>
                  </div>

                  {/* Custom themes */}
                  {customThemes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        ערכות מותאמות אישית ({customThemes.length})
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {customThemes.map((customTheme) => (
                          <div key={customTheme.id} className="relative group">
                            {editingThemeId === customTheme.id ? (
                              <div 
                                className="p-3 rounded-xl border-2 space-y-2"
                                style={{ borderColor: customTheme.theme.accentColor }}
                              >
                                <Input
                                  value={editingThemeName}
                                  onChange={(e) => setEditingThemeName(e.target.value)}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    className="flex-1 h-7 text-xs"
                                    onClick={() => saveEditedTheme(customTheme.id)}
                                  >
                                    <Check className="h-3 w-3 ml-1" />
                                    שמור
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setEditingThemeId(null)}
                                  >
                                    ביטול
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => applyCustomTheme(customTheme)}
                                className={cn(
                                  "w-full p-4 rounded-xl border-2 transition-all hover:scale-[1.02]",
                                  "flex flex-col items-center gap-2"
                                )}
                                style={{
                                  backgroundColor: customTheme.theme.backgroundColor,
                                  borderColor: customTheme.theme.accentColor,
                                  fontFamily: `"${customTheme.theme.fontFamily || 'Heebo'}", sans-serif`
                                }}
                              >
                                <div
                                  className="w-10 h-10 rounded-full shadow-lg"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${customTheme.theme.accentColor}, ${customTheme.theme.buttonColor})` 
                                  }}
                                />
                                <span style={{ color: customTheme.theme.textColor }} className="text-sm font-medium">
                                  {customTheme.name}
                                </span>
                              </button>
                            )}
                            
                            {/* Edit/Delete buttons */}
                            {editingThemeId !== customTheme.id && (
                              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingTheme(customTheme);
                                  }}
                                  className="p-1.5 rounded-lg bg-background/90 hover:bg-background text-foreground shadow-md backdrop-blur-sm"
                                  title="עריכה"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCustomTheme(customTheme.id);
                                  }}
                                  className="p-1.5 rounded-lg bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md"
                                  title="מחיקה"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Built-in presets with categories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">ערכות מובנות</Label>
                      <div className="flex gap-1">
                        {['all', 'premium', 'modern', 'nature', 'warm', 'cool'].map((cat) => (
                          <Button
                            key={cat}
                            size="sm"
                            variant={activeCategory === cat ? 'default' : 'ghost'}
                            className="h-6 px-2 text-[10px]"
                            onClick={() => setActiveCategory(cat)}
                          >
                            {cat === 'all' ? 'הכל' : 
                             cat === 'premium' ? 'פרימיום' :
                             cat === 'modern' ? 'מודרני' :
                             cat === 'nature' ? 'טבע' :
                             cat === 'warm' ? 'חם' : 'קריר'}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {filteredPresets.map((preset) => {
                        const Icon = preset.icon;
                        return (
                          <div key={preset.name} className="relative group">
                            <button
                              onClick={() => applyPreset(preset)}
                              className={cn(
                                "w-full p-3 rounded-xl border-2 transition-all hover:scale-[1.03]",
                                "flex flex-col items-center gap-1.5"
                              )}
                              style={{
                                backgroundColor: preset.bg,
                                borderColor: preset.accent,
                              }}
                            >
                              <Icon className="h-5 w-5" style={{ color: preset.accent }} />
                              <div
                                className="w-5 h-5 rounded-full"
                                style={{ backgroundColor: preset.accent }}
                              />
                              <span style={{ color: preset.text }} className="text-xs font-medium">
                                {preset.name}
                              </span>
                            </button>
                            
                            {/* Copy button for built-in presets */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                savePresetAsCustom(preset);
                              }}
                              className="absolute top-1 left-1 p-1 rounded-md bg-background/80 hover:bg-background text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              title="שמור כעותק"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* Colors Tab */}
                <TabsContent value="colors" className="mt-0 space-y-4">
                  <div className="grid gap-4">
                    {[
                      { key: 'backgroundColor', label: 'צבע רקע', defaultColor: '#1B2541' },
                      { key: 'secondaryBgColor', label: 'צבע רקע משני (לגרדיאנט)', defaultColor: '#2A3A5A' },
                      { key: 'textColor', label: 'צבע טקסט', defaultColor: '#FFFFFF' },
                      { key: 'accentColor', label: 'צבע הדגשה', defaultColor: '#C9A962' },
                      { key: 'borderColor', label: 'צבע מסגרת', defaultColor: '#C9A962' },
                      { key: 'buttonColor', label: 'צבע כפתורים', defaultColor: '#C9A962' },
                    ].map(({ key, label, defaultColor }) => (
                      <div key={key} className="space-y-2">
                        <Label>{label}</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={(localTheme[key as keyof TimerTheme] as string)?.startsWith('#') 
                              ? localTheme[key as keyof TimerTheme] as string 
                              : defaultColor}
                            onChange={(e) => handleColorChange(key as keyof TimerTheme, e.target.value)}
                            className="w-14 h-10 p-1 cursor-pointer rounded-lg"
                          />
                          <Input
                            value={localTheme[key as keyof TimerTheme] as string}
                            onChange={(e) => handleColorChange(key as keyof TimerTheme, e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Advanced element colors */}
                  <div className="border-t pt-4 space-y-4">
                    <Label className="text-sm font-medium">צבעי אלמנטים</Label>
                    
                    {[
                      { key: 'iconColor', label: 'צבע אייקונים', icon: Palette },
                      { key: 'inputTextColor', label: 'צבע טקסט בשדות', icon: Type },
                      { key: 'inputBgColor', label: 'צבע רקע שדות', icon: Maximize2 },
                      { key: 'frameColor', label: 'צבע מסגרות', icon: Tag },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4" />
                          {label}
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['gold', 'navy', 'gray', 'white'] as const).map((color) => (
                            <button
                              key={color}
                              onClick={() => handleColorChange(key as keyof TimerTheme, color)}
                              className={cn(
                                "p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                                localTheme[key as keyof TimerTheme] === color 
                                  ? "ring-2 ring-primary ring-offset-2" 
                                  : "hover:border-primary/50"
                              )}
                              style={{ 
                                backgroundColor: TIMER_COLOR_MAP[color].bg,
                                borderColor: localTheme[key as keyof TimerTheme] === color 
                                  ? TIMER_COLOR_MAP[color].border 
                                  : 'transparent'
                              }}
                            >
                              <span className="text-[10px] font-medium" style={{ 
                                color: color === 'white' ? '#333' : '#fff' 
                              }}>
                                {color === 'gold' ? 'זהב' : color === 'navy' ? 'נייבי' : color === 'gray' ? 'אפור' : 'לבן'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Fonts Tab */}
                <TabsContent value="fonts" className="mt-0 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>בחירת פונט</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {FONT_OPTIONS.map((font) => (
                          <button
                            key={font.value}
                            onClick={() => handleFontChange(font.value)}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all text-right",
                              localTheme.fontFamily === font.value 
                                ? "border-primary bg-primary/10" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="font-medium text-sm">{font.label}</div>
                            <div 
                              className="text-lg text-muted-foreground mt-1"
                              style={{ fontFamily: `"${font.value}", sans-serif` }}
                            >
                              {font.sample}
                            </div>
                            <Badge variant="outline" className="mt-1 text-[10px]">
                              {font.category === 'modern' ? 'מודרני' :
                               font.category === 'classic' ? 'קלאסי' :
                               font.category === 'elegant' ? 'אלגנטי' :
                               font.category === 'bold' ? 'בולט' :
                               font.category === 'friendly' ? 'ידידותי' :
                               font.category === 'display' ? 'תצוגה' : 'כתב יד'}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>גודל פונט: {localTheme.fontSize || 14}px</Label>
                      <Slider
                        value={[localTheme.fontSize || 14]}
                        onValueChange={(v) => handleSizeChange('fontSize', v)}
                        min={10}
                        max={20}
                        step={1}
                      />
                    </div>

                    {/* Timer Digits Font Selection */}
                    <div className="space-y-2 pt-4 border-t">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        גופן מספרי הטיימר
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TIMER_FONT_OPTIONS.map((font) => (
                          <button
                            key={font.value}
                            onClick={() => handleTimerFontChange(font.value)}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all text-center",
                              localTheme.timerFontFamily === font.value 
                                ? "border-primary bg-primary/10" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="font-medium text-xs mb-1">{font.label}</div>
                            <div 
                              className="text-2xl font-light tracking-wider"
                              style={{ fontFamily: `"${font.value}", monospace` }}
                            >
                              {font.sample}
                            </div>
                            <Badge variant="outline" className="mt-1 text-[9px]">
                              {font.category === 'monospace' ? 'מונוספייס' :
                               font.category === 'futuristic' ? 'עתידני' :
                               font.category === 'digital' ? 'דיגיטלי' :
                               font.category === 'tech' ? 'טכנולוגי' :
                               font.category === 'display' ? 'תצוגה' : 'קלאסי'}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timer Display Font Size */}
                    <div className="space-y-2">
                      <Label>גודל מספרי הטיימר: {localTheme.timerDisplayFontSize || 28}px</Label>
                      <Slider
                        value={[localTheme.timerDisplayFontSize || 28]}
                        onValueChange={(v) => {
                          const newTheme = { ...localTheme, timerDisplayFontSize: v[0] };
                          setLocalTheme(newTheme);
                          onThemeChange(newTheme);
                        }}
                        min={18}
                        max={48}
                        step={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        גודל התצוגה של 00:00:00
                      </p>
                    </div>

                    {/* Timer Digits Color */}
                    <div className="space-y-2 pt-4 border-t">
                      <Label>צבע מספרי הטיימר</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={localTheme.timerDigitsColor || '#ffffff'}
                          onChange={(e) => handleColorChange('timerDigitsColor', e.target.value)}
                          className="w-12 h-10 p-1 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={localTheme.timerDigitsColor || 'hsl(0, 0%, 100%)'}
                          onChange={(e) => handleColorChange('timerDigitsColor', e.target.value)}
                          className="flex-1"
                          placeholder="hsl(0, 0%, 100%)"
                        />
                      </div>
                    </div>

                    {/* Labels Customization */}
                    <div className="space-y-3 pt-4 border-t">
                      <Label className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        עיצוב תוויות (היום, רישומי זמן וכו׳)
                      </Label>
                      <div className="space-y-2">
                        <Label className="text-xs">צבע תוויות</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={localTheme.labelsColor || '#d4af37'}
                            onChange={(e) => handleColorChange('labelsColor', e.target.value)}
                            className="w-12 h-10 p-1 rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={localTheme.labelsColor || 'hsl(45, 80%, 55%)'}
                            onChange={(e) => handleColorChange('labelsColor', e.target.value)}
                            className="flex-1"
                            placeholder="hsl(45, 80%, 55%)"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">גודל תוויות: {localTheme.labelsFontSize || 12}px</Label>
                        <Slider
                          value={[localTheme.labelsFontSize || 12]}
                          onValueChange={(v) => handleSizeChange('labelsFontSize', v)}
                          min={10}
                          max={18}
                          step={1}
                        />
                      </div>
                    </div>

                    {/* Time Entry Text Customization */}
                    <div className="space-y-3 pt-4 border-t">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        עיצוב טקסט רישומי זמן
                      </Label>
                      <div className="space-y-2">
                        <Label className="text-xs">צבע טקסט</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={localTheme.entryTextColor || '#ffffff'}
                            onChange={(e) => handleColorChange('entryTextColor', e.target.value)}
                            className="w-12 h-10 p-1 rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={localTheme.entryTextColor || 'hsl(0, 0%, 100%)'}
                            onChange={(e) => handleColorChange('entryTextColor', e.target.value)}
                            className="flex-1"
                            placeholder="hsl(0, 0%, 100%)"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">גודל טקסט: {localTheme.entryFontSize || 14}px</Label>
                        <Slider
                          value={[localTheme.entryFontSize || 14]}
                          onValueChange={(v) => handleSizeChange('entryFontSize', v)}
                          min={12}
                          max={20}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">גופן לרישומי זמן</Label>
                        <Select
                          value={localTheme.entryFontFamily || 'Heebo'}
                          onValueChange={(v) => handleColorChange('entryFontFamily', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="בחר גופן" />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                <span style={{ fontFamily: `"${font.value}", sans-serif` }}>{font.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>מרווח בין שורות: {localTheme.lineHeight || 1.5}</Label>
                      <Slider
                        value={[(localTheme.lineHeight || 1.5) * 10]}
                        onValueChange={(v) => {
                          const newTheme = { ...localTheme, lineHeight: v[0] / 10 };
                          setLocalTheme(newTheme);
                          onThemeChange(newTheme);
                        }}
                        min={10}
                        max={25}
                        step={1}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Elements Tab - Buttons, Tags, Inputs */}
                <TabsContent value="elements" className="mt-0 space-y-4">
                  <div className="space-y-4">
                    {/* Action Buttons Customization */}
                    <div className="p-3 rounded-xl border bg-gradient-to-br from-primary/5 to-transparent space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        כפתורי פעולה (Play/Pause)
                      </Label>
                      
                      {/* Button Shape */}
                      <div className="space-y-2">
                        <Label className="text-xs">צורת כפתור</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['circle', 'rounded', 'square'] as const).map((shape) => (
                            <Button
                              key={shape}
                              size="sm"
                              variant={localTheme.buttonShape === shape ? 'default' : 'outline'}
                              onClick={() => handleColorChange('buttonShape', shape)}
                              className="text-xs gap-1"
                            >
                              <div className={cn(
                                "w-4 h-4 bg-primary/50",
                                shape === 'circle' && "rounded-full",
                                shape === 'rounded' && "rounded-md",
                                shape === 'square' && "rounded-none"
                              )} />
                              {shape === 'circle' ? 'עגול' : shape === 'rounded' ? 'מעוגל' : 'מרובע'}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Button Size */}
                      <div className="space-y-2">
                        <Label className="text-xs">גודל כפתור: {localTheme.buttonSize || 40}px</Label>
                        <Slider
                          value={[localTheme.buttonSize || 40]}
                          onValueChange={(v) => handleSizeChange('buttonSize', v)}
                          min={28}
                          max={56}
                          step={4}
                        />
                      </div>

                      {/* Button Gradient */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">אפקט גרדיאנט</Label>
                        <Button
                          size="sm"
                          variant={localTheme.buttonGradient ? 'default' : 'outline'}
                          onClick={() => handleColorChange('buttonGradient', !localTheme.buttonGradient)}
                          className="h-7 text-xs"
                        >
                          {localTheme.buttonGradient ? 'פעיל' : 'כבוי'}
                        </Button>
                      </div>

                      {/* Button Shadow */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">צל כפתור</Label>
                        <Button
                          size="sm"
                          variant={localTheme.buttonShadow ? 'default' : 'outline'}
                          onClick={() => handleColorChange('buttonShadow', !localTheme.buttonShadow)}
                          className="h-7 text-xs"
                        >
                          {localTheme.buttonShadow ? 'פעיל' : 'כבוי'}
                        </Button>
                      </div>

                      {/* Custom Play Button Colors */}
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-xs">צבע אייקון כפתור</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={localTheme.playButtonColor || localTheme.backgroundColor || '#1B2541'}
                            onChange={(e) => handleColorChange('playButtonColor', e.target.value)}
                            className="w-12 h-8 p-1 rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={localTheme.playButtonColor || ''}
                            onChange={(e) => handleColorChange('playButtonColor', e.target.value)}
                            placeholder="אוטומטי (לפי רקע)"
                            className="flex-1 text-xs h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">צבע רקע כפתור</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={localTheme.playButtonBgColor || localTheme.accentColor || '#C9A962'}
                            onChange={(e) => handleColorChange('playButtonBgColor', e.target.value)}
                            className="w-12 h-8 p-1 rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={localTheme.playButtonBgColor || ''}
                            onChange={(e) => handleColorChange('playButtonBgColor', e.target.value)}
                            placeholder="אוטומטי (לפי הדגשה)"
                            className="flex-1 text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tags Customization */}
                    <div className="p-3 rounded-xl border bg-gradient-to-br from-amber-500/5 to-transparent space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        תגיות (לקוח, פרויקט, קטגוריה)
                      </Label>

                      {/* Tag Shape */}
                      <div className="space-y-2">
                        <Label className="text-xs">צורת תגית</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['pill', 'rounded', 'square'] as const).map((shape) => (
                            <Button
                              key={shape}
                              size="sm"
                              variant={localTheme.tagShape === shape ? 'default' : 'outline'}
                              onClick={() => handleColorChange('tagShape', shape)}
                              className="text-xs gap-1"
                            >
                              <div className={cn(
                                "px-2 py-0.5 bg-amber-500/30 text-[8px]",
                                shape === 'pill' && "rounded-full",
                                shape === 'rounded' && "rounded-md",
                                shape === 'square' && "rounded-none"
                              )}>
                                תג
                              </div>
                              {shape === 'pill' ? 'גלולה' : shape === 'rounded' ? 'מעוגל' : 'מרובע'}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Tag Size */}
                      <div className="space-y-2">
                        <Label className="text-xs">גודל תגית</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['sm', 'md', 'lg'] as const).map((size) => (
                            <Button
                              key={size}
                              size="sm"
                              variant={localTheme.tagSize === size ? 'default' : 'outline'}
                              onClick={() => handleColorChange('tagSize', size)}
                              className="text-xs"
                            >
                              {size === 'sm' ? 'קטן' : size === 'md' ? 'בינוני' : 'גדול'}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Tag Background Opacity */}
                      <div className="space-y-2">
                        <Label className="text-xs">שקיפות רקע: {localTheme.tagBgOpacity || 20}%</Label>
                        <Slider
                          value={[localTheme.tagBgOpacity || 20]}
                          onValueChange={(v) => handleSizeChange('tagBgOpacity', v)}
                          min={5}
                          max={100}
                          step={5}
                        />
                      </div>

                      {/* Tag Border Width */}
                      <div className="space-y-2">
                        <Label className="text-xs">עובי מסגרת תגית: {localTheme.tagBorderWidth || 1}px</Label>
                        <Slider
                          value={[localTheme.tagBorderWidth || 1]}
                          onValueChange={(v) => handleSizeChange('tagBorderWidth', v)}
                          min={0}
                          max={4}
                          step={1}
                        />
                      </div>

                      {/* Custom Tag Colors */}
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-xs">צבע טקסט תגית (מותאם אישית)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={localTheme.tagTextColor || localTheme.accentColor || '#C9A962'}
                            onChange={(e) => handleColorChange('tagTextColor', e.target.value)}
                            className="w-12 h-8 p-1 rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={localTheme.tagTextColor || ''}
                            onChange={(e) => handleColorChange('tagTextColor', e.target.value)}
                            placeholder="אוטומטי (לפי הדגשה)"
                            className="flex-1 text-xs h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">צבע רקע תגית (מותאם אישית)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={localTheme.tagBgColor || localTheme.accentColor || '#C9A962'}
                            onChange={(e) => handleColorChange('tagBgColor', e.target.value)}
                            className="w-12 h-8 p-1 rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={localTheme.tagBgColor || ''}
                            onChange={(e) => handleColorChange('tagBgColor', e.target.value)}
                            placeholder="אוטומטי (לפי הדגשה)"
                            className="flex-1 text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Input Fields Customization */}
                    <div className="p-3 rounded-xl border bg-gradient-to-br from-blue-500/5 to-transparent space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        שדות קלט
                      </Label>

                      {/* Input Shape */}
                      <div className="space-y-2">
                        <Label className="text-xs">צורת שדה</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['rounded', 'pill', 'square'] as const).map((shape) => (
                            <Button
                              key={shape}
                              size="sm"
                              variant={localTheme.inputShape === shape ? 'default' : 'outline'}
                              onClick={() => handleColorChange('inputShape', shape)}
                              className="text-xs"
                            >
                              {shape === 'rounded' ? 'מעוגל' : shape === 'pill' ? 'גלולה' : 'מרובע'}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Input Border Width */}
                      <div className="space-y-2">
                        <Label className="text-xs">עובי מסגרת: {localTheme.inputBorderWidth || 1}px</Label>
                        <Slider
                          value={[localTheme.inputBorderWidth || 1]}
                          onValueChange={(v) => handleSizeChange('inputBorderWidth', v)}
                          min={0}
                          max={4}
                          step={1}
                        />
                      </div>

                      {/* Input Height */}
                      <div className="space-y-2">
                        <Label className="text-xs">גובה שדה: {localTheme.inputHeight || 40}px</Label>
                        <Slider
                          value={[localTheme.inputHeight || 40]}
                          onValueChange={(v) => handleSizeChange('inputHeight', v)}
                          min={32}
                          max={56}
                          step={4}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Effects Tab */}
                <TabsContent value="effects" className="mt-0 space-y-4">
                  <div className="space-y-4">
                    {/* Glow Effect */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label className="text-sm font-medium">אפקט זוהר</Label>
                        <p className="text-xs text-muted-foreground">זוהר סביב הטיימר כשפועל</p>
                      </div>
                      <Button
                        size="sm"
                        variant={localTheme.glowEffect ? 'default' : 'outline'}
                        onClick={() => handleColorChange('glowEffect', !localTheme.glowEffect)}
                      >
                        {localTheme.glowEffect ? 'פעיל' : 'כבוי'}
                      </Button>
                    </div>

                    {/* Gradient Background */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label className="text-sm font-medium">רקע גרדיאנט</Label>
                        <p className="text-xs text-muted-foreground">מעבר צבע ברקע</p>
                      </div>
                      <Button
                        size="sm"
                        variant={localTheme.gradientBg ? 'default' : 'outline'}
                        onClick={() => handleColorChange('gradientBg', !localTheme.gradientBg)}
                      >
                        {localTheme.gradientBg ? 'פעיל' : 'כבוי'}
                      </Button>
                    </div>

                    {localTheme.gradientBg && (
                      <div className="space-y-2 pr-4">
                        <Label className="text-sm">כיוון הגרדיאנט</Label>
                        <Select 
                          value={localTheme.gradientDirection || 'to-br'}
                          onValueChange={(v) => handleColorChange('gradientDirection', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-[9999]">
                            <SelectItem value="to-br">אלכסוני למטה</SelectItem>
                            <SelectItem value="to-tr">אלכסוני למעלה</SelectItem>
                            <SelectItem value="to-r">אופקי</SelectItem>
                            <SelectItem value="to-b">אנכי</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Shadow Intensity */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">עוצמת צל</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['none', 'soft', 'medium', 'strong'] as const).map((intensity) => (
                          <Button
                            key={intensity}
                            size="sm"
                            variant={localTheme.shadowIntensity === intensity ? 'default' : 'outline'}
                            onClick={() => handleColorChange('shadowIntensity', intensity)}
                            className="text-xs"
                          >
                            {intensity === 'none' ? 'ללא' :
                             intensity === 'soft' ? 'עדין' :
                             intensity === 'medium' ? 'בינוני' : 'חזק'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Border Radius */}
                    <div className="space-y-2">
                      <Label>עיגול פינות: {localTheme.borderRadius || 16}px</Label>
                      <Slider
                        value={[localTheme.borderRadius || 16]}
                        onValueChange={(v) => handleSizeChange('borderRadius', v)}
                        min={0}
                        max={32}
                        step={2}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Size Tab */}
                <TabsContent value="size" className="mt-0 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>רוחב: {localTheme.width}px</Label>
                      <Slider
                        value={[localTheme.width]}
                        onValueChange={(v) => handleSizeChange('width', v)}
                        min={300}
                        max={600}
                        step={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>גובה: {localTheme.height}px</Label>
                      <Slider
                        value={[localTheme.height]}
                        onValueChange={(v) => handleSizeChange('height', v)}
                        min={400}
                        max={700}
                        step={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>עובי מסגרת: {localTheme.borderWidth || 3}px</Label>
                      <Slider
                        value={[localTheme.borderWidth || 3]}
                        onValueChange={(v) => handleSizeChange('borderWidth', v)}
                        min={0}
                        max={10}
                        step={1}
                      />
                    </div>
                  </div>
                </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>

            {/* Footer */}
            <div className="flex justify-between p-4 border-t bg-background">
              <Button variant="outline" onClick={resetToDefault} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                איפוס
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                סגור
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { defaultTheme as defaultTimerTheme };
