// סרגל טאבים למובייל + Hook למחוות החלקה
import React, { useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface MobileTab {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  tabs: MobileTab[];
  activeTab: string;
  onChange: (next: string) => void;
}

export function MobileTabsBar({ tabs, activeTab, onChange }: Props) {
  const currentIdx = Math.max(
    0,
    tabs.findIndex((t) => t.value === activeTab),
  );
  const ActiveIcon = tabs[currentIdx]?.icon;

  const goPrev = () => {
    if (currentIdx > 0) onChange(tabs[currentIdx - 1].value);
  };
  const goNext = () => {
    if (currentIdx < tabs.length - 1) onChange(tabs[currentIdx + 1].value);
  };

  return (
    <div
      className="md:hidden flex items-center gap-2 px-3 py-2 border-b bg-card w-full overflow-x-hidden"
      dir="rtl"
    >
      {/* In RTL, "previous" arrow points right */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={goPrev}
        disabled={currentIdx === 0}
        className="h-9 w-9 shrink-0"
        aria-label="טאב קודם"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <Select value={activeTab} onValueChange={onChange}>
        <SelectTrigger className="flex-1 h-10 bg-background">
          <SelectValue>
            <div className="flex items-center gap-2 min-w-0">
              {ActiveIcon && <ActiveIcon className="h-4 w-4 shrink-0" />}
              <span className="truncate text-sm font-medium">
                {tabs[currentIdx]?.label || ""}
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0 mr-auto">
                {currentIdx + 1}/{tabs.length}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rtl" dir="rtl">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            return (
              <SelectItem key={t.value} value={t.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                  <span className="text-[10px] text-muted-foreground mr-2">
                    {i + 1}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={goNext}
        disabled={currentIdx >= tabs.length - 1}
        className="h-9 w-9 shrink-0"
        aria-label="טאב הבא"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
    </div>
  );
}

/**
 * Hook המאזין למחוות החלקה אופקיות על אלמנט נתון ומחליף טאבים.
 * RTL: החלקה ימינה→שמאלה = הבא, החלקה שמאלה→ימינה = קודם.
 */
export function useSwipeTabs(
  ref: React.RefObject<HTMLElement>,
  opts: {
    enabled: boolean;
    onNext: () => void;
    onPrev: () => void;
    threshold?: number;
  },
) {
  const { enabled, onNext, onPrev, threshold = 60 } = opts;
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const tracking = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      // לא להתחיל מחווה כשמתחילים על שדה קלט / כפתור גלילה אופקית
      const target = t.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [data-no-swipe]',
        )
      )
        return;
      startX.current = t.clientX;
      startY.current = t.clientY;
      tracking.current = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking.current || startX.current == null || startY.current == null)
        return;
      tracking.current = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      startX.current = null;
      startY.current = null;
      if (Math.abs(dx) < threshold) return;
      if (Math.abs(dy) > Math.abs(dx)) return; // אנכי - לא להחליף
      // RTL: dx<0 = החלקה ימין→שמאל = הבא
      if (dx < 0) onNext();
      else onPrev();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, onNext, onPrev, threshold, ref]);
}
