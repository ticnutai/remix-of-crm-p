import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Upload,
  Sparkles,
  Image,
  Trash2,
  Loader2,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LogoUploadSectionProps {
  logo?: string;
  onLogoChange: (logo: string | undefined) => void;
}

const AI_LOGO_STYLES = [
  { id: 'modern', label: 'מודרני', description: 'עיצוב נקי ומינימליסטי' },
  { id: 'classic', label: 'קלאסי', description: 'עיצוב מסורתי ואלגנטי' },
  { id: 'creative', label: 'יצירתי', description: 'עיצוב ייחודי ובולט' },
  { id: 'professional', label: 'מקצועי', description: 'עיצוב עסקי ורשמי' },
  { id: 'playful', label: 'שובב', description: 'עיצוב צבעוני ומשחקי' },
];

const PRESET_COLORS = [
  '#1e3a5f', '#2563eb', '#059669', '#dc2626', '#7c3aed',
  '#ea580c', '#0891b2', '#4f46e5', '#be185d', '#65a30d',
];

export function LogoUploadSection({ logo, onLogoChange }: LogoUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('יש להעלות קובץ תמונה בלבד');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('גודל הקובץ המקסימלי הוא 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onLogoChange(result);
      toast.success('הלוגו הועלה בהצלחה');
    };
    reader.onerror = () => {
      toast.error('שגיאה בטעינת הקובץ');
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onLogoChange]);

  const handleRemoveLogo = useCallback(() => {
    onLogoChange(undefined);
    toast.success('הלוגו הוסר');
  }, [onLogoChange]);

  const generateAILogo = useCallback(async () => {
    if (!companyName.trim()) {
      toast.error('יש להזין שם חברה');
      return;
    }

    setIsGenerating(true);
    setGeneratedLogos([]);

    try {
      // Use Supabase Edge Function or external AI API
      const { data, error } = await supabase.functions.invoke('generate-logo', {
        body: {
          companyName,
          industry,
          style: selectedStyle,
          color: selectedColor,
          notes: additionalNotes,
        },
      });

      if (error) throw error;

      if (data?.logos?.length > 0) {
        setGeneratedLogos(data.logos);
        toast.success('לוגואים נוצרו בהצלחה!');
      } else {
        // Fallback: Generate simple SVG logo
        const fallbackLogos = generateFallbackLogos(companyName, selectedColor);
        setGeneratedLogos(fallbackLogos);
        toast.success('לוגואים נוצרו (מצב מקומי)');
      }
    } catch (error) {
      console.error('Logo generation error:', error);
      // Fallback to local generation
      const fallbackLogos = generateFallbackLogos(companyName, selectedColor);
      setGeneratedLogos(fallbackLogos);
      toast.info('לוגואים נוצרו באופן מקומי');
    } finally {
      setIsGenerating(false);
    }
  }, [companyName, industry, selectedStyle, selectedColor, additionalNotes]);

  const generateFallbackLogos = (name: string, color: string): string[] => {
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const logos: string[] = [];

    // Style 1: Circle with initials
    logos.push(createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="${color}"/>
        <text x="50" y="50" text-anchor="middle" dy=".35em" fill="white" font-family="Arial" font-size="32" font-weight="bold">${initials}</text>
      </svg>
    `));

    // Style 2: Rounded rectangle
    logos.push(createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" rx="15" fill="${color}"/>
        <text x="50" y="50" text-anchor="middle" dy=".35em" fill="white" font-family="Arial" font-size="32" font-weight="bold">${initials}</text>
      </svg>
    `));

    // Style 3: Hexagon
    logos.push(createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="${color}"/>
        <text x="50" y="50" text-anchor="middle" dy=".35em" fill="white" font-family="Arial" font-size="28" font-weight="bold">${initials}</text>
      </svg>
    `));

    // Style 4: Diamond
    logos.push(createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="50" y="10" width="56.57" height="56.57" transform="rotate(45 50 50)" fill="${color}"/>
        <text x="50" y="50" text-anchor="middle" dy=".35em" fill="white" font-family="Arial" font-size="28" font-weight="bold">${initials}</text>
      </svg>
    `));

    return logos;
  };

  const createSvgDataUrl = (svgContent: string): string => {
    const encoded = btoa(unescape(encodeURIComponent(svgContent)));
    return `data:image/svg+xml;base64,${encoded}`;
  };

  const selectGeneratedLogo = useCallback((logoUrl: string) => {
    onLogoChange(logoUrl);
    setAiDialogOpen(false);
    toast.success('הלוגו נבחר בהצלחה');
  }, [onLogoChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">לוגו</Label>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>העלאת לוגו</TooltipContent>
          </Tooltip>

          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>יצירת לוגו עם AI</TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  יצירת לוגו עם AI
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label>שם החברה *</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="הכנס את שם החברה"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label>תחום פעילות</Label>
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="למשל: טכנולוגיה, בנייה, עיצוב..."
                  />
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label>סגנון עיצוב</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AI_LOGO_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-3 rounded-lg border text-right transition-all ${
                          selectedStyle === style.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{style.label}</div>
                        <div className="text-xs text-muted-foreground">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-2">
                  <Label>צבע עיקרי</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          selectedColor === color
                            ? 'ring-2 ring-offset-2 ring-primary'
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <Input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-8 h-8 p-0 border-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label>הערות נוספות</Label>
                  <Textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="תיאור נוסף, אלמנטים מבוקשים, סמלים וכו'..."
                    rows={2}
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateAILogo}
                  disabled={isGenerating || !companyName.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      מייצר לוגואים...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 ml-2" />
                      צור לוגואים
                    </>
                  )}
                </Button>

                {/* Generated Logos */}
                {generatedLogos.length > 0 && (
                  <div className="space-y-2">
                    <Label>לוגואים שנוצרו - בחר אחד:</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {generatedLogos.map((logoUrl, index) => (
                        <button
                          key={index}
                          onClick={() => selectGeneratedLogo(logoUrl)}
                          className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          <img
                            src={logoUrl}
                            alt={`Logo option ${index + 1}`}
                            className="w-full h-20 object-contain"
                          />
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={generateAILogo}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      <RefreshCw className={`h-4 w-4 ml-2 ${isGenerating ? 'animate-spin' : ''}`} />
                      צור לוגואים נוספים
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Logo Preview */}
      <div className="relative">
        {logo ? (
          <div className="relative border rounded-lg p-4 bg-muted/30 group">
            <img
              src={logo}
              alt="Company Logo"
              className="max-h-16 max-w-full mx-auto object-contain"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveLogo}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              לחץ להעלאת לוגו או השתמש ב-AI ליצירה
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}

export default LogoUploadSection;
