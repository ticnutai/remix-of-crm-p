// Auto-Sync Settings Component
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Timer, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { AutoSyncSettings as AutoSyncSettingsType } from '@/hooks/useAutoSync';

interface AutoSyncSettingsProps {
  settings: AutoSyncSettingsType;
  onUpdateSettings: (updates: Partial<AutoSyncSettingsType>) => void;
  lastSyncTime: Date | null;
  nextSyncTime: Date | null;
  isSyncing: boolean;
  onSyncNow: () => void;
  accountsCount: number;
}

const INTERVAL_OPTIONS = [
  { value: 5, label: '5 דקות' },
  { value: 10, label: '10 דקות' },
  { value: 15, label: '15 דקות' },
  { value: 30, label: '30 דקות' },
  { value: 60, label: 'שעה' },
  { value: 120, label: 'שעתיים' },
  { value: 360, label: '6 שעות' },
  { value: 720, label: '12 שעות' },
  { value: 1440, label: '24 שעות' },
];

export function AutoSyncSettingsComponent({
  settings,
  onUpdateSettings,
  lastSyncTime,
  nextSyncTime,
  isSyncing,
  onSyncNow,
  accountsCount,
}: AutoSyncSettingsProps) {
  return (
    <Card className="border-border/50" dir="rtl">
      <CardHeader className="text-right pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">סנכרון אוטומטי</CardTitle>
              <CardDescription>סנכרון ברקע כל X דקות</CardDescription>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onUpdateSettings({ enabled })}
            disabled={accountsCount === 0}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {accountsCount === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>הוסף חשבון Google לפני הפעלת סנכרון אוטומטי</p>
          </div>
        ) : (
          <>
            {/* Interval Selection */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <Label>תדירות סנכרון:</Label>
              </div>
              <Select
                value={String(settings.intervalMinutes)}
                onValueChange={(value) => onUpdateSettings({ intervalMinutes: Number(value) })}
                disabled={!settings.enabled}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Info */}
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>סנכרון אחרון:</span>
                </div>
                <span className="text-muted-foreground">
                  {lastSyncTime
                    ? formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: he })
                    : 'לא בוצע עדיין'}
                </span>
              </div>

              {settings.enabled && nextSyncTime && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span>סנכרון הבא:</span>
                  </div>
                  <Badge variant="outline">
                    {formatDistanceToNow(nextSyncTime, { addSuffix: true, locale: he })}
                  </Badge>
                </div>
              )}
            </div>

            {/* Manual Sync Button */}
            <Button
              variant="outline"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 ml-2" />
              )}
              סנכרן עכשיו
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
