/**
 * DedupToggleButton — small pill button to toggle "show duplicates" mode globally.
 *
 * Shows a badge with the count of duplicate groups when dedup is active.
 * Use it in any page header to give user control.
 */
import React from "react";
import { Layers, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDedup } from "@/contexts/DedupContext";

interface DedupToggleButtonProps {
  className?: string;
}

export function DedupToggleButton({ className }: DedupToggleButtonProps) {
  const { showDuplicates, toggleShowDuplicates, duplicateCount } = useDedup();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={showDuplicates ? "default" : "outline"}
          size="sm"
          onClick={toggleShowDuplicates}
          className={cn(
            "gap-2 h-9 relative",
            showDuplicates
              ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-500"
              : "hover:border-amber-400 hover:text-amber-600",
            className,
          )}
        >
          <Layers className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">
            {showDuplicates ? "הסתר כפולים" : "הצג כפולים"}
          </span>
          {!showDuplicates && duplicateCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -left-2 h-5 min-w-[20px] px-1 text-[10px] rounded-full"
            >
              {duplicateCount}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {showDuplicates
          ? "לחץ להסתרת פריטים כפולים (מצב רגיל)"
          : duplicateCount > 0
            ? `נמצאו ${duplicateCount} קבוצות כפולות — לחץ להצגת הכל`
            : "לחץ להצגת פריטים כפולים (מצב מנהל)"}
      </TooltipContent>
    </Tooltip>
  );
}
