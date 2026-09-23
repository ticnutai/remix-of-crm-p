import { EyeOff, Strikethrough } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type CompletedDisplayMode = "strike" | "hide";

const OPTIONS: Array<{ mode: CompletedDisplayMode; label: string; hint: string; icon: typeof EyeOff }> = [
  { mode: "strike", label: "קו על הושלמו", hint: "פריטים שהושלמו מוצגים עם קו עליהם", icon: Strikethrough },
  { mode: "hide", label: "הסתר הושלמו", hint: "פריטים שהושלמו לא מוצגים בכלל", icon: EyeOff },
];

/** בחירה איך להציג פריטים שהושלמו: עם קו עליהם, או מוסתרים לגמרי. */
export function CompletedDisplayToggle({
  mode,
  onChange,
  iconOnly = false,
}: {
  mode: CompletedDisplayMode;
  onChange: (mode: CompletedDisplayMode) => void;
  /** כפתור אייקון אחד שמחליף בין המצבים — לכותרות של כרטיסים קטנים */
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    const current = OPTIONS.find((o) => o.mode === mode) || OPTIONS[0];
    const next = OPTIONS.find((o) => o.mode !== mode) || OPTIONS[1];
    const Icon = current.icon;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={mode === "hide" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            aria-label={`${current.hint}. לחיצה: ${next.label}`}
            onClick={() => onChange(next.mode)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {current.hint}
          <br />
          <span className="text-muted-foreground">לחיצה: {next.label}</span>
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <div className="flex items-center rounded-md border bg-background p-0.5" role="radiogroup" aria-label="תצוגת פריטים שהושלמו">
      {OPTIONS.map(({ mode: value, label, hint, icon: Icon }) => {
        const active = mode === value;
        return (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={active ? "secondary" : "ghost"}
                size="sm"
                role="radio"
                aria-checked={active}
                className={`h-8 gap-1.5 px-2 text-xs ${active ? "font-semibold" : "text-muted-foreground"}`}
                onClick={() => onChange(value)}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
