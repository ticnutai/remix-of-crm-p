// סקשן הגדרות עיצוב
import React, { useRef } from 'react';
import { Palette, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DesignSettings } from './types';

interface DesignSettingsSectionProps {
  settings: DesignSettings;
  onUpdate: (settings: Partial<DesignSettings>) => void;
}

export function DesignSettingsSection({
  settings,
  onUpdate,
}: DesignSettingsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for preview (in real app, upload to storage)
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdate({ logo_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Palette className="h-5 w-5" style={{ color: settings.primary_color }} />
        <span>הגדרות עיצוב</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Logo */}
        <div className="space-y-2">
          <Label>לוגו</Label>
          <div 
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="h-12 mx-auto object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span className="text-sm">העלה לוגו</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>

        {/* Primary Color */}
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
              placeholder="#d8ac27"
              className="flex-1"
            />
          </div>
        </div>

        {/* Secondary Color */}
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
              placeholder="#1a365d"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Company Name */}
        <div className="space-y-2">
          <Label>שם החברה</Label>
          <Input
            value={settings.company_name}
            onChange={(e) => onUpdate({ company_name: e.target.value })}
            placeholder="שם החברה או העסק"
          />
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <Label>תת-כותרת</Label>
          <Input
            value={settings.company_subtitle}
            onChange={(e) => onUpdate({ company_subtitle: e.target.value })}
            placeholder="תיאור קצר / מקצוע"
          />
        </div>
      </div>
    </div>
  );
}
