// PWA Offline Indicator Component
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowBanner(true);
        // Auto-hide after 5 seconds
        setTimeout(() => setShowBanner(false), 5000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowBanner(true);
      setWasOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all duration-300',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>חזרת לאונליין!</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-white hover:bg-white/20"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3 w-3 ml-1" />
            רענן
          </Button>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>אין חיבור לאינטרנט - מצב אופליין</span>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;
