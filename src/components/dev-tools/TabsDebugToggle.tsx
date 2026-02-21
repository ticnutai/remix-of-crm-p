/**
 * TabsDebugToggle - כפתור צף להפעלה/כיבוי דיבאג של טאבים
 *
 * מציג כפתור קטן בפינה שמאלית תחתונה.
 * לחיצה מפעילה/מכבה דיבאג מפורט בקונסול לכל הטאבים במערכת.
 *
 * הבעיות שהדיבאג מזהה:
 * - אלמנט חוסם (overlay) מעל הטאב
 * - pointer-events: none
 * - טאב disabled
 * - z-index בעייתי
 * - onValueChange חסר
 * - לחיצה על טאב שכבר פעיל
 * - ערך value לא תואם לאף TabsContent
 */

import React, { useState, useEffect } from "react";
import { Bug, BugOff } from "lucide-react";
import {
  isTabsDebugEnabled,
  setTabsDebugEnabled,
  onTabsDebugChange,
} from "@/lib/tabs-debug-state";

export function TabsDebugToggle() {
  const [enabled, setEnabled] = useState(isTabsDebugEnabled);

  useEffect(() => {
    return onTabsDebugChange((v) => setEnabled(v));
  }, []);

  const toggle = () => {
    const next = !enabled;
    setTabsDebugEnabled(next);

    if (next) {
      console.log(
        "%c🐛 TABS DEBUG: ON - לחץ על כל טאב ותראה דיבאג מפורט בקונסול",
        "background: #4caf50; color: white; font-size: 14px; padding: 6px 12px; border-radius: 4px;",
      );
      // Run a scan of all current tabs on the page
      runTabsScan();
    } else {
      console.log(
        "%c🐛 TABS DEBUG: OFF",
        "background: #f44336; color: white; font-size: 14px; padding: 6px 12px; border-radius: 4px;",
      );
    }
  };

  return (
    <button
      onClick={toggle}
      title={enabled ? "כבה דיבאג טאבים" : "הפעל דיבאג טאבים"}
      style={{
        position: "fixed",
        bottom: "80px",
        left: "16px",
        zIndex: 99999,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        border: `2px solid ${enabled ? "#4caf50" : "#666"}`,
        background: enabled
          ? "linear-gradient(135deg, #1b5e20, #388e3c)"
          : "linear-gradient(135deg, #333, #555)",
        color: enabled ? "#a5d6a7" : "#aaa",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: enabled
          ? "0 0 12px rgba(76, 175, 80, 0.5)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        transition: "all 0.3s ease",
        fontSize: "20px",
      }}
    >
      {enabled ? <Bug size={20} /> : <BugOff size={20} />}
    </button>
  );
}

/**
 * סריקה מיידית של כל הטאבים בדף - מזהה בעיות פוטנציאליות
 */
function runTabsScan() {
  // 1. חיפוש טאבים מבוססי Radix (data-tabs-debug-id)
  const radixTabs = document.querySelectorAll("[data-tabs-debug-id]");
  // 2. חיפוש טאבים מבוססי role="tablist"
  const roleTabs = document.querySelectorAll('[role="tablist"]');
  // 3. חיפוש כפתורי ניווט מבוססי Button (כמו Gmail sidebar)
  const buttonNavs = document.querySelectorAll(
    '[class*="sidebar"] button, [class*="nav"] button, [class*="tab"] button',
  );

  const allTabRoots = new Set<Element>();
  radixTabs.forEach((el) => allTabRoots.add(el));
  roleTabs.forEach((el) => {
    const parent = el.closest("[data-tabs-debug-id]");
    if (parent) {
      allTabRoots.add(parent);
    } else {
      allTabRoots.add(el);
    }
  });

  console.group(
    "%c🔍 TABS SCAN - סריקת כל הטאבים בדף",
    "background: #1565c0; color: white; font-size: 14px; padding: 6px 12px; border-radius: 4px;",
  );

  const radixCount = radixTabs.length;
  const roleCount = roleTabs.length;
  const btnCount = buttonNavs.length;

  console.log(
    `📊 סיכום: ${radixCount} Radix Tabs | ${roleCount} role="tablist" | ${btnCount} כפתורי ניווט`,
  );

  if (allTabRoots.size === 0 && btnCount === 0) {
    console.log(
      "%c⚠️ לא נמצאו טאבים בדף הזה!",
      "color: #ff9800; font-size: 13px;",
    );
    console.log(
      "💡 אם יש כפתורי ניווט (כמו בדף Gmail), הדיבאג יעבוד כשתנווט לדף עם טאבים.",
    );
    console.log("💡 הדיבאג פעיל ברקע - לחיצה על כל טאב בכל דף תיצור לוג.");
    console.groupEnd();
    return;
  }

  let issuesFound = 0;
  let tabRootIdx = 0;

  // סריקת Radix tabs
  allTabRoots.forEach((root) => {
    tabRootIdx++;
    const debugId =
      root.getAttribute("data-tabs-debug-id") || `root-${tabRootIdx}`;
    const triggers = root.querySelectorAll('[role="tab"], [data-value]');
    const uniqueTriggers = new Set<Element>();
    triggers.forEach((t) => uniqueTriggers.add(t));

    console.group(`📋 Tabs #${debugId} - ${uniqueTriggers.size} טאבים`);

    uniqueTriggers.forEach((trigger) => {
      const el = trigger as HTMLElement;
      const value =
        el.getAttribute("data-value") ||
        el.getAttribute("value") ||
        el.textContent?.trim().substring(0, 20) ||
        "?";
      const state = el.getAttribute("data-state");
      const isDisabled =
        el.hasAttribute("disabled") ||
        el.getAttribute("data-disabled") !== null;
      const computedStyle = window.getComputedStyle(el);
      const pointerEvents = computedStyle.pointerEvents;
      const opacity = computedStyle.opacity;
      const visibility = computedStyle.visibility;
      const display = computedStyle.display;

      // בדיקת אלמנט חוסם
      const rect = el.getBoundingClientRect();
      let isBlocked = false;
      let blockingElement: Element | null = null;

      if (rect.width > 0 && rect.height > 0) {
        const elementAtPoint = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        if (elementAtPoint) {
          isBlocked =
            elementAtPoint !== el && !el.contains(elementAtPoint as Node);
          if (isBlocked) blockingElement = elementAtPoint;
        }
      }

      const problems: string[] = [];

      if (isBlocked)
        problems.push(
          `⛔ חסום ע"י: <${(blockingElement as HTMLElement)?.tagName?.toLowerCase()}> .${(blockingElement as HTMLElement)?.className?.split(" ")[0] || ""}`,
        );
      if (isDisabled) problems.push("🚫 disabled");
      if (pointerEvents === "none") problems.push("🚫 pointer-events: none");
      if (opacity === "0") problems.push("👻 שקוף");
      if (visibility === "hidden") problems.push("👻 hidden");
      if (display === "none") problems.push("👻 display: none");
      if (rect.width === 0 || rect.height === 0) problems.push("📏 גודל 0");

      // בדיקת parent חוסם
      let parent: HTMLElement | null = el.parentElement;
      while (parent && parent !== document.body) {
        const ps = window.getComputedStyle(parent);
        if (ps.pointerEvents === "none") {
          problems.push(`⛔ הורה חוסם: <${parent.tagName.toLowerCase()}>`);
          break;
        }
        parent = parent.parentElement;
      }

      const statusIcon = problems.length > 0 ? "❌" : "✅";
      const stateIcon = state === "active" ? "🟢" : "⚪";

      if (problems.length > 0) {
        issuesFound += problems.length;
        console.warn(
          `${statusIcon} ${stateIcon} "${value}" - ${problems.join(" | ")}`,
        );
      } else {
        console.log(`${statusIcon} ${stateIcon} "${value}" - תקין`);
      }
    });

    console.groupEnd();
  });

  // סריקת כפתורי ניווט (כמו Gmail)
  if (buttonNavs.length > 0) {
    console.group(`🔘 כפתורי ניווט (${buttonNavs.length} כפתורים)`);
    buttonNavs.forEach((btn) => {
      const el = btn as HTMLElement;
      const text = el.textContent?.trim().substring(0, 30) || "?";
      const isDisabled = el.hasAttribute("disabled");
      const variant = el.getAttribute("data-variant") || "";
      const isActive =
        variant === "secondary" ||
        el.classList.contains("bg-secondary") ||
        el.getAttribute("data-state") === "active";

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // skip hidden

      let isBlocked = false;
      const elementAtPoint = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      if (elementAtPoint) {
        isBlocked =
          elementAtPoint !== el && !el.contains(elementAtPoint as Node);
      }

      if (isBlocked || isDisabled) {
        issuesFound++;
        console.warn(
          `❌ "${text}" - ${isBlocked ? "⛔ חסום" : ""} ${isDisabled ? "🚫 disabled" : ""}`,
        );
      }
    });
    console.groupEnd();
  }

  if (issuesFound === 0) {
    console.log(
      "%c✅ לא נמצאו בעיות! הטאבים תקינים כרגע.",
      "color: #4caf50; font-size: 13px;",
    );
    console.log(
      "💡 הדיבאג פעיל ברקע. לחץ על טאב שלא עובד ותראה את הבעיה בזמן אמת.",
    );
  } else {
    console.log(
      `%c⚠️ נמצאו ${issuesFound} בעיות! ראה פירוט למעלה.`,
      "color: #ff9800; font-size: 13px;",
    );
  }

  console.groupEnd();
}
