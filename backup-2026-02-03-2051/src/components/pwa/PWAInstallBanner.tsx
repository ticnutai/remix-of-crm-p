// PWA Install Banner Component
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X, Share, Smartphone, ArrowDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isIOSDevice, promptInstall } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);

  useEffect(() => {
    // Check if user dismissed the banner recently
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return; // Don't show banner if dismissed recently
      }
    }

    // Show banner after a short delay
    const timer = setTimeout(() => {
      if ((canInstall || isIOSDevice) && !isInstalled) {
        setShowBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, isIOSDevice]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setShowBanner(false);
  };

  const handleInstall = async () => {
    if (isIOSDevice) {
      setShowIOSDialog(true);
    } else {
      const success = await promptInstall();
      if (success) {
        setShowBanner(false);
      }
    }
  };

  if (!showBanner || isInstalled) return null;

  return (
    <>
      {/* Fixed Bottom Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 animate-in slide-in-from-bottom duration-300">
        <Card className="max-w-lg mx-auto bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">התקן את האפליקציה</h3>
                <p className="text-xs opacity-90">
                  גישה מהירה מהמסך הראשי - ללא הורדה מחנות
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={handleInstall}
                >
                  <Download className="h-4 w-4 ml-1" />
                  התקן
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* iOS Installation Dialog */}
      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              התקנה באייפון/אייפד
            </DialogTitle>
            <DialogDescription>
              בצע את הצעדים הבאים להתקנת האפליקציה
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">לחץ על כפתור השיתוף</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Share className="h-4 w-4" />
                  <span>בתחתית הדפדפן (Safari)</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">גלול למטה ובחר</p>
                <p className="text-sm text-muted-foreground mt-1">
                  "הוסף למסך הבית" (Add to Home Screen)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">לחץ "הוסף"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  האפליקציה תופיע במסך הבית שלך
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowIOSDialog(false)}>
              הבנתי
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PWAInstallBanner;
