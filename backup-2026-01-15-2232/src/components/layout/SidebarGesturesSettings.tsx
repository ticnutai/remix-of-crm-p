// Sidebar Gestures Settings
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Hand,
  MousePointer,
  Timer,
  Maximize2,
  Pin,
  Settings2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarGesturesConfig {
  // Auto-hide settings
  autoHideEnabled: boolean;
  autoHideDelay: number; // milliseconds
  
  // Hover behavior
  hoverEnabled: boolean;
  hoverSensitivity: number; // pixels from edge
  
  // Pin behavior
  pinEnabled: boolean;
  pinRememberState: boolean;
  
  // Resize settings
  resizeEnabled: boolean;
  minWidth: number;
  maxWidth: number;
  
  // Edge trigger
  edgeTriggerEnabled: boolean;
  edgeTriggerWidth: number; // pixels
  
  // Touch gestures (mobile)
  swipeEnabled: boolean;
  swipeThreshold: number; // pixels
  
  // Animations
  animationSpeed: number; // milliseconds
}

export const defaultGesturesConfig: SidebarGesturesConfig = {
  autoHideEnabled: false,       // disabled by default for better UX
  autoHideDelay: 1200,          // increased for better UX
  hoverEnabled: true,
  hoverSensitivity: 60,         // slightly increased sensitivity zone
  pinEnabled: true,
  pinRememberState: true,
  resizeEnabled: true,
  minWidth: 200,
  maxWidth: 400,
  edgeTriggerEnabled: true,
  edgeTriggerWidth: 30,         // increased for easier targeting
  swipeEnabled: true,
  swipeThreshold: 50,
  animationSpeed: 250,          // faster animations
};

const STORAGE_KEY = 'sidebar-gestures-config';

export const loadGesturesConfig = (): SidebarGesturesConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultGesturesConfig, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading gestures config:', error);
  }
  return defaultGesturesConfig;
};

export const saveGesturesConfig = (config: SidebarGesturesConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving gestures config:', error);
  }
};

interface SidebarGesturesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SidebarGesturesConfig;
  onConfigChange: (config: SidebarGesturesConfig) => void;
}

export function SidebarGesturesDialog({
  open,
  onOpenChange,
  config,
  onConfigChange,
}: SidebarGesturesDialogProps) {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(localConfig);
    saveGesturesConfig(localConfig);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalConfig(defaultGesturesConfig);
  };

  const updateConfig = (key: keyof SidebarGesturesConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            הגדרות מחוות סיידבר
          </DialogTitle>
          <DialogDescription>
            התאם אישית את התנהגות הסיידבר והמחוות
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto-Hide Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  הסתרה אוטומטית
                </Label>
                <p className="text-sm text-muted-foreground">
                  הסתר את הסיידבר כשהעכבר עוזב
                </p>
              </div>
              <Switch
                checked={localConfig.autoHideEnabled}
                onCheckedChange={(checked) => updateConfig('autoHideEnabled', checked)}
              />
            </div>

            {localConfig.autoHideEnabled && (
              <div className="space-y-2 mr-6">
                <div className="flex items-center justify-between">
                  <Label>זמן המתנה לפני הסתרה</Label>
                  <Badge variant="secondary">{localConfig.autoHideDelay}ms</Badge>
                </div>
                <Slider
                  value={[localConfig.autoHideDelay]}
                  onValueChange={([value]) => updateConfig('autoHideDelay', value)}
                  min={100}
                  max={2000}
                  step={100}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {localConfig.autoHideDelay < 500 ? 'מהיר' : localConfig.autoHideDelay < 1000 ? 'בינוני' : 'איטי'}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Hover Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  פתיחה בריחוף
                </Label>
                <p className="text-sm text-muted-foreground">
                  פתח סיידבר כשהעכבר מתקרב לקצה
                </p>
              </div>
              <Switch
                checked={localConfig.hoverEnabled}
                onCheckedChange={(checked) => updateConfig('hoverEnabled', checked)}
              />
            </div>

            {localConfig.hoverEnabled && (
              <div className="space-y-2 mr-6">
                <div className="flex items-center justify-between">
                  <Label>רגישות ריחוף</Label>
                  <Badge variant="secondary">{localConfig.hoverSensitivity}px</Badge>
                </div>
                <Slider
                  value={[localConfig.hoverSensitivity]}
                  onValueChange={([value]) => updateConfig('hoverSensitivity', value)}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {localConfig.hoverSensitivity < 30 ? 'רגיש מאוד' : localConfig.hoverSensitivity < 60 ? 'רגישות בינונית' : 'פחות רגיש'}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Pin Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  הצמדה
                </Label>
                <p className="text-sm text-muted-foreground">
                  אפשר הצמדת הסיידבר למקום
                </p>
              </div>
              <Switch
                checked={localConfig.pinEnabled}
                onCheckedChange={(checked) => updateConfig('pinEnabled', checked)}
              />
            </div>

            {localConfig.pinEnabled && (
              <div className="flex items-center justify-between mr-6">
                <Label className="text-sm">זכור מצב הצמדה</Label>
                <Switch
                  checked={localConfig.pinRememberState}
                  onCheckedChange={(checked) => updateConfig('pinRememberState', checked)}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Resize Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Maximize2 className="h-4 w-4" />
                  שינוי גודל
                </Label>
                <p className="text-sm text-muted-foreground">
                  אפשר גרירה לשינוי רוחב
                </p>
              </div>
              <Switch
                checked={localConfig.resizeEnabled}
                onCheckedChange={(checked) => updateConfig('resizeEnabled', checked)}
              />
            </div>

            {localConfig.resizeEnabled && (
              <div className="space-y-3 mr-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">רוחב מינימלי</Label>
                    <Badge variant="secondary">{localConfig.minWidth}px</Badge>
                  </div>
                  <Slider
                    value={[localConfig.minWidth]}
                    onValueChange={([value]) => updateConfig('minWidth', value)}
                    min={150}
                    max={300}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">רוחב מקסימלי</Label>
                    <Badge variant="secondary">{localConfig.maxWidth}px</Badge>
                  </div>
                  <Slider
                    value={[localConfig.maxWidth]}
                    onValueChange={([value]) => updateConfig('maxWidth', value)}
                    min={300}
                    max={600}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Edge Trigger Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">טריגר קצה</Label>
                <p className="text-sm text-muted-foreground">
                  אזור בקצה המסך לפתיחה
                </p>
              </div>
              <Switch
                checked={localConfig.edgeTriggerEnabled}
                onCheckedChange={(checked) => updateConfig('edgeTriggerEnabled', checked)}
              />
            </div>

            {localConfig.edgeTriggerEnabled && (
              <div className="space-y-2 mr-6">
                <div className="flex items-center justify-between">
                  <Label>רוחב אזור טריגר</Label>
                  <Badge variant="secondary">{localConfig.edgeTriggerWidth}px</Badge>
                </div>
                <Slider
                  value={[localConfig.edgeTriggerWidth]}
                  onValueChange={([value]) => updateConfig('edgeTriggerWidth', value)}
                  min={3}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Mobile Swipe Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">החלקה במובייל</Label>
                <p className="text-sm text-muted-foreground">
                  החלק לפתיחה/סגירה במובייל
                </p>
              </div>
              <Switch
                checked={localConfig.swipeEnabled}
                onCheckedChange={(checked) => updateConfig('swipeEnabled', checked)}
              />
            </div>

            {localConfig.swipeEnabled && (
              <div className="space-y-2 mr-6">
                <div className="flex items-center justify-between">
                  <Label>סף החלקה</Label>
                  <Badge variant="secondary">{localConfig.swipeThreshold}px</Badge>
                </div>
                <Slider
                  value={[localConfig.swipeThreshold]}
                  onValueChange={([value]) => updateConfig('swipeThreshold', value)}
                  min={20}
                  max={150}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Animation Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                מהירות אנימציה
              </Label>
              <Badge variant="secondary">{localConfig.animationSpeed}ms</Badge>
            </div>
            <Slider
              value={[localConfig.animationSpeed]}
              onValueChange={([value]) => updateConfig('animationSpeed', value)}
              min={100}
              max={1000}
              step={50}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {localConfig.animationSpeed < 250 ? 'מהיר מאוד' : localConfig.animationSpeed < 500 ? 'מהיר' : localConfig.animationSpeed < 750 ? 'בינוני' : 'איטי'}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            אפס להגדרות ברירת מחדל
          </Button>
          <Button onClick={handleSave} className="btn-gold">
            שמור הגדרות
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
