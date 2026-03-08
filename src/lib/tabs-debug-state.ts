/**
 * Tabs Debug State - מצב הדיבאג של הטאבים
 * קובץ נפרד כדי לאפשר Fast Refresh תקין
 */

let _tabsDebugEnabled = false;
const _listeners = new Set<(enabled: boolean) => void>();

export function isTabsDebugEnabled(): boolean {
  return _tabsDebugEnabled;
}

export function setTabsDebugEnabled(enabled: boolean): void {
  _tabsDebugEnabled = enabled;
  try {
    localStorage.setItem("tabs-debug-enabled", String(enabled));
  } catch (e) {
    // localStorage not available
    console.warn("localStorage not available for tabs debug state");
  }
  _listeners.forEach((fn) => fn(enabled));
}

export function onTabsDebugChange(fn: (enabled: boolean) => void): () => void {
  _listeners.add(fn);
  return () => {
    _listeners.delete(fn);
  };
}

// Initialize from localStorage
try {
  const saved = localStorage.getItem("tabs-debug-enabled");
  if (saved === "true") {
    _tabsDebugEnabled = true;
  }
} catch (e) {
  // localStorage not available
  console.warn("localStorage not available for tabs debug state");
}
