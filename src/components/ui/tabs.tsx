import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { isTabsDebugEnabled, onTabsDebugChange } from "@/lib/tabs-debug-state";

let tabsInstanceCounter = 0;

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, onValueChange, value, defaultValue, ...props }, ref) => {
  const instanceId = React.useRef(++tabsInstanceCounter).current;
  const renderCount = React.useRef(0);
  renderCount.current++;

  // Subscribe to debug state changes to force re-render when toggled
  const [debugOn, setDebugOn] = React.useState(isTabsDebugEnabled);
  React.useEffect(() => onTabsDebugChange(setDebugOn), []);

  const wrappedOnValueChange = React.useCallback(
    (newValue: string) => {
      if (isTabsDebugEnabled()) {
        const sameValue = value === newValue;
        console.group(
          `%c🔀 [Tabs #${instanceId}] שינוי טאב`,
          "color: #4fc3f7; font-weight: bold; font-size: 13px",
        );
        console.log(`📌 ערך נוכחי: "${value}"`);
        console.log(`➡️ ערך חדש: "${newValue}"`);
        if (sameValue) {
          console.warn(`⚠️ אותו ערך! הטאב לא ישתנה`);
        }
        console.log(
          `📦 יש handler onValueChange? ${!!onValueChange ? "✅ כן" : "❌ לא - הטאב לא יגיב!"}`,
        );
        if (!onValueChange) {
          console.error(
            `🚨 חסר onValueChange! הטאב לא ישתנה כי אין מי שיטפל בשינוי.`,
          );
        }
        console.log(`⏱️ ${new Date().toLocaleTimeString()}`);
        console.trace("Stack trace:");
        console.groupEnd();
      }

      if (onValueChange) {
        onValueChange(newValue);
      }
    },
    [onValueChange, value, instanceId],
  );

  React.useEffect(() => {
    if (isTabsDebugEnabled()) {
      console.log(
        `%c📋 [Tabs #${instanceId}] Render ×${renderCount.current} | value="${value}" defaultValue="${defaultValue}"`,
        "color: #81c784; font-size: 11px",
      );
    }
  });

  return (
    <TabsPrimitive.Root
      ref={ref}
      dir="rtl"
      className={cn(className)}
      value={value}
      defaultValue={defaultValue}
      onValueChange={wrappedOnValueChange}
      data-tabs-debug-id={instanceId}
      {...props}
    />
  );
});
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex min-h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, value, disabled, onClick, ...props }, ref) => {
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isTabsDebugEnabled()) {
        const button = e.currentTarget;
        const tabsRoot = button.closest("[data-tabs-debug-id]");
        const tabsId = tabsRoot?.getAttribute("data-tabs-debug-id") || "?";
        const currentValue =
          tabsRoot?.getAttribute("data-value") ||
          tabsRoot
            ?.querySelector('[data-state="active"]')
            ?.getAttribute("data-value") ||
          "?";
        const isActive = button.getAttribute("data-state") === "active";
        const isDisabled = button.disabled || disabled;

        // בדיקת אלמנט חוסם
        const rect = button.getBoundingClientRect();
        let isBlocked = false;
        let blockingEl: Element | null = null;
        if (rect.width > 0 && rect.height > 0) {
          const elementAtPoint = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
          isBlocked =
            !!elementAtPoint &&
            elementAtPoint !== button &&
            !button.contains(elementAtPoint as Node);
          if (isBlocked) blockingEl = elementAtPoint;
        }

        // בדיקת CSS
        const style = window.getComputedStyle(button);
        const pointerEvents = style.pointerEvents;
        const opacity = style.opacity;
        const zIndex = style.zIndex;

        // בדיקת parent elements שחוסמים
        let parentBlock = false;
        let parentBlockEl: HTMLElement | null = null;
        let current: HTMLElement | null = button.parentElement;
        while (current && current !== document.body) {
          const ps = window.getComputedStyle(current);
          if (ps.pointerEvents === "none" || ps.overflow === "hidden") {
            if (ps.pointerEvents === "none") {
              parentBlock = true;
              parentBlockEl = current;
              break;
            }
          }
          current = current.parentElement;
        }

        const color =
          isBlocked || parentBlock
            ? "#ef5350"
            : isActive
              ? "#66bb6a"
              : "#ffb74d";
        console.group(
          `%c👆 [Tabs #${tabsId}] לחיצה על טאב: "${value}"`,
          `color: ${color}; font-weight: bold; font-size: 13px`,
        );
        console.log(`🏷️ ערך הטאב: "${value}"`);
        console.log(
          `📊 מצב נוכחי: ${isActive ? "🟢 פעיל (לחיצה לא תשנה כלום)" : "⚪ לא פעיל (צריך להשתנות)"}`,
        );
        console.log(`🔄 ערך פעיל כרגע: "${currentValue}"`);

        if (isDisabled) {
          console.error(`🚫 הטאב DISABLED - לא יגיב ללחיצות!`);
        }
        if (pointerEvents === "none") {
          console.error(`🚫 pointer-events: none - הטאב לא יכול לקבל לחיצות!`);
        }
        if (isBlocked) {
          console.error(`⛔ חסום! אלמנט אחר מכסה את הטאב:`, blockingEl);
          console.error(
            `   <${(blockingEl as HTMLElement)?.tagName?.toLowerCase()}> class="${(blockingEl as HTMLElement)?.className}"`,
          );
        }
        if (parentBlock) {
          console.error(`⛔ הורה עם pointer-events:none חוסם:`, parentBlockEl);
        }

        console.log(`📐 z-index: ${zIndex} | opacity: ${opacity}`);
        console.log(
          `🖱️ Event target: <${(e.target as HTMLElement)?.tagName?.toLowerCase()}>`,
          e.target,
        );
        console.log(`⏱️ ${new Date().toLocaleTimeString()}`);
        console.groupEnd();
      }

      if (onClick) {
        onClick(e);
      }
    },
    [value, disabled, onClick],
  );

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={handleClick}
      data-value={value}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, value, ...props }, ref) => {
  React.useEffect(() => {
    if (isTabsDebugEnabled()) {
      console.log(
        `%c📄 [TabsContent] עלה: "${value}"`,
        "color: #ce93d8; font-size: 11px",
      );
    }
  }, [value]);

  return (
    <TabsPrimitive.Content
      ref={ref}
      value={value}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
