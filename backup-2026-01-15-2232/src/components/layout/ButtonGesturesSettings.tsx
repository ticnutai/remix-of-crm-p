// Button Gestures Configuration
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
  MousePointer2,
  MousePointerClick,
  Timer,
  Hand,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonGesturesConfig {
  // Click gestures
  doubleClickEnabled: boolean;
  doubleClickDelay: number; // milliseconds between clicks
  longPressEnabled: boolean;
  longPressDuration: number; // milliseconds to hold
  rightClickEnabled: boolean;
  
  // Touch gestures (mobile)
  touchHoldEnabled: boolean;
  touchHoldDuration: number;
  doubleTapEnabled: boolean;
  doubleTapDelay: number;
  
  // Feedback
  hapticFeedback: boolean;
  visualFeedback: boolean;
  soundFeedback: boolean;
}

export const defaultButtonGesturesConfig: ButtonGesturesConfig = {
  doubleClickEnabled: true,
  doubleClickDelay: 300,
  longPressEnabled: true,
  longPressDuration: 500,
  rightClickEnabled: true,
  touchHoldEnabled: true,
  touchHoldDuration: 500,
  doubleTapEnabled: true,
  doubleTapDelay: 300,
  hapticFeedback: true,
  visualFeedback: true,
  soundFeedback: false,
};

const STORAGE_KEY = 'button-gestures-config';

export const loadButtonGesturesConfig = (): ButtonGesturesConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultButtonGesturesConfig, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading button gestures config:', error);
  }
  return defaultButtonGesturesConfig;
};

export const saveButtonGesturesConfig = (config: ButtonGesturesConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving button gestures config:', error);
  }
};

interface ButtonGesturesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ButtonGesturesConfig;
  onConfigChange: (config: ButtonGesturesConfig) => void;
}

export function ButtonGesturesDialog({
  open,
  onOpenChange,
  config,
  onConfigChange,
}: ButtonGesturesDialogProps) {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(localConfig);
    saveButtonGesturesConfig(localConfig);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalConfig(defaultButtonGesturesConfig);
  };

  const updateConfig = (key: keyof ButtonGesturesConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5" />
            הגדרות מחוות לחצנים
          </DialogTitle>
          <DialogDescription>
            התאם אישית את סוגי הלחיצות והמחוות על כפתורים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Double Click Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MousePointer2 className="h-4 w-4" />
                  לחיצה כפולה
                </Label>
                <p className="text-sm text-muted-foreground">
                  לחץ פעמיים במהירות לפעולה מיוחדת
                </p>
              </div>
              <Switch
                checked={localConfig.doubleClickEnabled}
                onCheckedChange={(checked) => updateConfig('doubleClickEnabled', checked)}
              />
            </div>

            {localConfig.doubleClickEnabled && (
              <div className="space-y-2 mr-6">
                <div className="flex items-center justify-between">
                  <Label>זמן בין לחיצות</Label>
                  <Badge variant="secondary">{localConfig.doubleClickDelay}ms</Badge>
                </div>
                <Slider
                  value={[localConfig.doubleClickDelay]}
                  onValueChange={([value]) => updateConfig('doubleClickDelay', value)}
                  min={100}
                  max={800}
                  step={50}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {localConfig.doubleClickDelay < 250 ? 'מהיר מאוד' : localConfig.doubleClickDelay < 400 ? 'מהיר' : localConfig.doubleClickDelay < 600 ? 'בינוני' : 'איטי'}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Long Press Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  לחיצה ארוכה
                </Label>
                <p className="text-sm text-muted-foreground">
                  החזק לחוץ לפעולה מיוחדת
                </p>
              </div>
              <Switch
                checked={localConfig.longPressEnabled}
                onCheckedChange={(checked) => updateConfig('longPressEnabled', checked)}
              />
            </div>

            {localConfig.longPressEnabled && (
              <div className="space-y-2 mr-6">
                <div className="flex items-center justify-between">
                  <Label>משך לחיצה</Label>
                  <Badge variant="secondary">{localConfig.longPressDuration}ms</Badge>
                </div>
                <Slider
                  value={[localConfig.longPressDuration]}
                  onValueChange={([value]) => updateConfig('longPressDuration', value)}
                  min={200}
                  max={2000}
                  step={100}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {localConfig.longPressDuration < 500 ? 'קצר' : localConfig.longPressDuration < 1000 ? 'בינוני' : 'ארוך'}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Right Click Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4" />
                  לחיצה ימנית
                </Label>
                <p className="text-sm text-muted-foreground">
                  לחץ עם כפתור ימני לתפריט הקשר
                </p>
              </div>
              <Switch
                checked={localConfig.rightClickEnabled}
                onCheckedChange={(checked) => updateConfig('rightClickEnabled', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Mobile Touch Hold */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Hand className="h-4 w-4" />
                  החזקה במגע (מובייל)
                </Label>
                <p className="text-sm text-muted-foreground">
                  החזק אצבע על המסך לפעולה
                </p>
              </div>
              <Switch
                checked={localConfig.touchHoldEnabled}
                onCheckedChange={(checked) => updateConfig('touchHoldEnabled', checked)}
              />
            </div>

            {localConfig.touchHoldEnabled && (
              <div className="space-y-2 mr-6">
                <div className="flex items-center justify-between">
                  <Label>משך החזקה</Label>
                  <Badge variant="secondary">{localConfig.touchHoldDuration}ms</Badge>
                </div>
                <Slider
                  value={[localConfig.touchHoldDuration]}
                  onValueChange={([value]) => updateConfig('touchHoldDuration', value)}
                  min={200}
                  max={2000}
                  step={100}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Double Tap (Mobile) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">הקשה כפולה (מובייל)</Label>
                <p className="text-sm text-muted-foreground">
                  הקש פעמיים במהירות
                </p>
              </div>
              <Switch
                checked={localConfig.doubleTapEnabled}
                onCheckedChange={(checked) => updateConfig('doubleTapEnabled', checked)}
              />
            </div>

            {localConfig.doubleTapEnabled && (
              <div className="space-y-2 mr-6">
                <div className="flex items-center justify-between">
                  <Label>זמן בין הקשות</Label>
                  <Badge variant="secondary">{localConfig.doubleTapDelay}ms</Badge>
                </div>
                <Slider
                  value={[localConfig.doubleTapDelay]}
                  onValueChange={([value]) => updateConfig('doubleTapDelay', value)}
                  min={100}
                  max={800}
                  step={50}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Feedback Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              משוב למשתמש
            </Label>

            <div className="space-y-3 mr-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">רטט (Haptic)</Label>
                  <p className="text-xs text-muted-foreground">רטט קל במובייל</p>
                </div>
                <Switch
                  checked={localConfig.hapticFeedback}
                  onCheckedChange={(checked) => updateConfig('hapticFeedback', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">אפקט ויזואלי</Label>
                  <p className="text-xs text-muted-foreground">הבהוב או אנימציה</p>
                </div>
                <Switch
                  checked={localConfig.visualFeedback}
                  onCheckedChange={(checked) => updateConfig('visualFeedback', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">צליל</Label>
                  <p className="text-xs text-muted-foreground">צליל קליק קצר</p>
                </div>
                <Switch
                  checked={localConfig.soundFeedback}
                  onCheckedChange={(checked) => updateConfig('soundFeedback', checked)}
                />
              </div>
            </div>
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

// Custom hook for using button gestures
export function useButtonGestures(config: ButtonGesturesConfig) {
  const handleDoubleClick = (callback: () => void) => {
    if (!config.doubleClickEnabled) return undefined;
    
    let lastClick = 0;
    return (e: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastClick < config.doubleClickDelay) {
        callback();
        if (config.visualFeedback) {
          (e.target as HTMLElement).classList.add('active-scale');
          setTimeout(() => (e.target as HTMLElement).classList.remove('active-scale'), 200);
        }
      }
      lastClick = now;
    };
  };

  const handleLongPress = (callback: () => void) => {
    if (!config.longPressEnabled) return {};
    
    let timer: NodeJS.Timeout;
    
    return {
      onMouseDown: () => {
        timer = setTimeout(() => {
          callback();
          if (config.hapticFeedback && 'vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }, config.longPressDuration);
      },
      onMouseUp: () => clearTimeout(timer),
      onMouseLeave: () => clearTimeout(timer),
    };
  };

  const handleTouchHold = (callback: () => void) => {
    if (!config.touchHoldEnabled) return {};
    
    let timer: NodeJS.Timeout;
    
    return {
      onTouchStart: () => {
        timer = setTimeout(() => {
          callback();
          if (config.hapticFeedback && 'vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }, config.touchHoldDuration);
      },
      onTouchEnd: () => clearTimeout(timer),
    };
  };

  return {
    handleDoubleClick,
    handleLongPress,
    handleTouchHold,
  };
}
