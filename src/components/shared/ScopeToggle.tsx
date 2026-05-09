// ScopeToggle - admin-only toggle: view all vs view mine
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, User as UserIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type ViewScope = "mine" | "all";

interface Props {
  scope: ViewScope;
  onChange: (scope: ViewScope) => void;
}

export function ScopeToggle({ scope, onChange }: Props) {
  const isAll = scope === "all";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(isAll ? "mine" : "all")}
            className="gap-1.5 h-8"
            style={{
              background: isAll ? "#d8ac2715" : "transparent",
              borderColor: "#d8ac2750",
              color: "#d8ac27",
            }}
          >
            {isAll ? <Eye className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
            <span className="text-xs">{isAll ? "כל המשתמשים" : "רק שלי"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isAll ? "מציג פריטים של כל המשתמשים — לחץ להצגת שלך בלבד" : "מציג רק את הפריטים שלך — לחץ להצגת כולם"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
