// Popover component to show field metadata on Ctrl+Click
import React, { useState, useCallback, ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, User, History, Edit3, Lock } from 'lucide-react';
import { FieldMetadataEntry, useFieldMetadata } from '@/hooks/useFieldMetadata';
import { cn } from '@/lib/utils';

interface FieldMetadataPopoverProps {
  children: ReactNode;
  metadata?: FieldMetadataEntry | null;
  fieldName?: string;
  className?: string;
  disabled?: boolean;
}

export function FieldMetadataPopover({
  children,
  metadata,
  fieldName,
  className,
  disabled = false,
}: FieldMetadataPopoverProps) {
  const [open, setOpen] = useState(false);
  const { formatMetadataForDisplay } = useFieldMetadata();

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Only open on Ctrl+Click
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && metadata) {
        setOpen(true);
      }
    }
  }, [disabled, metadata]);

  const displayData = formatMetadataForDisplay(metadata || null);

  if (!metadata || disabled) {
    return <div onClick={handleClick} className={className}>{children}</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div 
          onClick={handleClick} 
          className={cn('cursor-pointer', className)}
          title="Ctrl+Click לצפייה בפרטי המטא-דאטה"
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-card border-2 border-primary/20 shadow-xl" 
        dir="rtl"
        align="start"
      >
        <div className="p-4 bg-gradient-to-l from-primary/10 to-background border-b">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h4 className="font-bold text-foreground">היסטוריית שדה</h4>
          </div>
          {fieldName && (
            <Badge variant="secondary" className="mt-2">
              {fieldName}
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Creation Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>נוצר</span>
            </div>
            <div className="pr-6 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{displayData?.created.date}</span>
                <Badge variant="outline" className="text-xs">
                  {displayData?.created.relative}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{displayData?.created.time}</span>
              </div>
              {displayData?.created_by && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>מזהה: {displayData.created_by.slice(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>

          {displayData?.isModified && (
            <>
              <Separator />
              
              {/* Last Update Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Edit3 className="h-4 w-4" />
                  <span>עודכן לאחרונה</span>
                </div>
                <div className="pr-6 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{displayData?.updated.date}</span>
                    <Badge variant="outline" className="text-xs">
                      {displayData?.updated.relative}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{displayData?.updated.time}</span>
                  </div>
                  {displayData?.updated_by && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>מזהה: {displayData.updated_by.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-3 bg-muted/30 border-t flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>מטא-דאטה זה ניתן לעריכה רק על ידי מנהלים</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
