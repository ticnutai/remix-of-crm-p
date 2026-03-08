/**
 * Sync Status Indicator Component
 * Shows data sync status with cloud and local storage info
 */

import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, HardDrive, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDataSync } from '@/hooks/useDataSync';
import { cn } from '@/lib/utils';

export function SyncStatusIndicator() {
  const {
    isOnline,
    isSyncing,
    lastSyncedAt,
    pendingChanges,
    error,
    isInitialized,
    syncNow,
    forceSync,
    getStorageInfo,
  } = useDataSync();

  const [storageInfo, setStorageInfo] = useState<{ used: string; available: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Get storage info when popover opens
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      const info = await getStorageInfo();
      setStorageInfo(info);
    }
  };

  const handleSync = async () => {
    await syncNow();
  };

  const handleForceSync = async () => {
    await forceSync();
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'לא סונכרן עדיין';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'relative gap-2',
            !isOnline && 'text-orange-500',
            error && 'text-red-500'
          )}
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isOnline ? (
            <Cloud className="h-4 w-4" />
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
          
          {pendingChanges > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {pendingChanges}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">סנכרון נתונים</h4>
            {isOnline ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                מחובר
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-orange-600">
                <AlertCircle className="h-3 w-3" />
                לא מחובר
              </span>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">סנכרון אחרון:</span>
              <span>{formatTime(lastSyncedAt)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">שינויים ממתינים:</span>
              <span className={pendingChanges > 0 ? 'text-orange-600 font-medium' : ''}>
                {pendingChanges}
              </span>
            </div>

            {storageInfo && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  שטח מקומי:
                </span>
                <span>{storageInfo.used} / {storageInfo.available}</span>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-2 rounded">
              {error}
            </div>
          )}

          {/* Offline message */}
          {!isOnline && (
            <div className="bg-orange-50 text-orange-700 text-xs p-2 rounded">
              אתה במצב אופליין. השינויים יסונכרנו כשתחזור לאונליין.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleSync}
              disabled={!isOnline || isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="h-4 w-4 ml-2" />
              )}
              סנכרן עכשיו
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleForceSync}
              disabled={!isOnline || isSyncing}
              title="סנכרון מלא - יוריד מחדש את כל הנתונים"
            >
              <Cloud className="h-4 w-4" />
            </Button>
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center">
            הנתונים נשמרים גם במחשב וגם בענן
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SyncStatusIndicator;
