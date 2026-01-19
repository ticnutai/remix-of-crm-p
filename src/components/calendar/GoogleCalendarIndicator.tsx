// Google Calendar Connection Indicator
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Cloud, CloudOff, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleCalendarIndicatorProps {
  isConnected: boolean;
  isLoading: boolean;
  accountEmail?: string;
  lastSyncAt?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenSettings: () => void;
}

export const GoogleCalendarIndicator: React.FC<GoogleCalendarIndicatorProps> = ({
  isConnected,
  isLoading,
  accountEmail,
  lastSyncAt,
  onConnect,
  onDisconnect,
  onOpenSettings,
}) => {
  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-2 px-3 py-1.5 bg-muted">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">מתחבר...</span>
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {isConnected ? (
          <>
            {/* Connected badge with pulsing indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="gap-2 px-3 py-1.5 bg-green-500/10 border-green-500/30 text-green-600 cursor-default"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <Cloud className="h-3 w-3" />
                  <span className="text-xs font-medium hidden sm:inline">Google מחובר</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-right">
                <div className="space-y-1">
                  <p className="font-medium">מחובר ל-Google Calendar</p>
                  {accountEmail && (
                    <p className="text-xs text-muted-foreground">{accountEmail}</p>
                  )}
                  {lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      סנכרון אחרון: {new Date(lastSyncAt).toLocaleString('he-IL')}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Settings button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onOpenSettings}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>הגדרות סנכרון</TooltipContent>
            </Tooltip>

            {/* Disconnect button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={onDisconnect}
                >
                  <CloudOff className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>התנתק מ-Google</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onConnect}
                className="gap-2"
              >
                <CloudOff className="h-4 w-4" />
                <span className="hidden sm:inline">חבר ל-Google Calendar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>התחבר ליומן Google לסנכרון פגישות</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
