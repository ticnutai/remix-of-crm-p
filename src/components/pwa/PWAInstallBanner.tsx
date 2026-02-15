// PWA Install Banner Component - Enhanced
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  Download,
  X,
  Share,
  Smartphone,
  ArrowDown,
  Bell,
  Zap,
  WifiOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isIOSDevice, promptInstall } =
    usePWAInstall();
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
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-3 animate-in slide-in-from-bottom duration-500"
        dir="rtl"
      >
        <Card className="max-w-lg mx-auto bg-gradient-to-r from-[hsl(222,47%,20%)] to-[hsl(222,47%,30%)] text-white shadow-2xl border-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[hsl(45,70%,55%)] rounded-xl flex-shrink-0">
                <Smartphone className="h-6 w-6 text-[hsl(222,47%,15%)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm mb-1">התקן את ArchFlow CRM</h3>
                <p className="text-xs opacity-80 mb-2">
                  גישה מהירה מהמסך הראשי, עבודה אופליין, והתראות
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-white/30 text-white/80"
                  >
                    <Zap className="h-3 w-3 ml-1" />
                    מהיר יותר
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-white/30 text-white/80"
                  >
                    <WifiOff className="h-3 w-3 ml-1" />
                    אופליין
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-white/30 text-white/80"
                  >
                    <Bell className="h-3 w-3 ml-1" />
                    התראות
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-[hsl(45,70%,55%)] text-[hsl(222,47%,15%)] hover:bg-[hsl(45,70%,60%)] font-bold"
                    onClick={handleInstall}
                  >
                    <Download className="h-4 w-4 ml-1" />
                    התקן עכשיו
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/10"
                    onClick={handleDismiss}
                  >
                    לא עכשיו
                  </Button>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-white/40 hover:text-white hover:bg-white/10 h-7 w-7 flex-shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
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
