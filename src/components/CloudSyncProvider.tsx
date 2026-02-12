// Cloud Sync Provider - Syncs user preferences between localStorage and cloud
import React, { useEffect, useRef } from "react";
import { useCloudPreferences } from "@/hooks/useCloudPreferences";
import { useAuth } from "@/hooks/useAuth";
import { AutoBackupScheduler } from "@/lib/smartBackup";
import { useToast } from "@/hooks/use-toast";

// Keys that trigger auto-save when changed
const WATCH_KEYS = [
  // Theme & UI
  "ten-arch-theme",
  "theme",
  "ten-arch-custom-themes",
  "animations-enabled",
  "timer-theme",
  "ncrm-reduced-motion",

  // Sidebar & Navigation
  "sidebar-tasks-open",
  "sidebar-gestures-config",
  "button-gestures-config",
  "sidebar-pinned",
  "sidebar-width",
  "sidebar-theme",

  // Dashboard & Widgets
  "widget-layouts-v3",
  "dashboard-widgets-config",
  "dashboard-dynamic-stats",
  "dashboard-theme",
  "dashboard-auto-layout",
  "dashboard-selected-table",
  "widget-edit-mode",
  "work-hours-widget-colors",
  "widget-grid-gap",
  "widget-equalize-heights",
  "widget-auto-expand",
  "widget-gap-x",
  "widget-gap-y",

  // Finance page
  "finance-page-sections",
  "finance-collapsed-sections",
  "finance-tabs-layout",
  "finance-widget-layout",

  // DataTable & Presets
  "datatable-pro-presets",
  "customColumnTemplates",
  "clients-table-style-config",

  // Timelogs filters
  "timelogs-view-mode",
  "timelogs-search",
  "timelogs-client",
  "timelogs-project",
  "timelogs-date-filter",
  "timelogs-custom-range",
  "timelogs-billable",
  "timelogs-active-tab",
  "timelogs-user",

  // Quotes & Contracts filters
  "quotes-search",
  "quotes-status-filter",
  "quotes-active-tab",
  "contracts-search",
  "contracts-status-filter",

  // Reports & MyDay
  "reports-date-range",
  "myday-meetings-view",
  "myday-tasks-view",

  // Calendar
  "calendar-view-type",

  // Clients page
  "clients-mobile-view",
  "clients-view-mode",
  "clientsByStage_viewFilter",
  "clientsByStage_expandedGroups",
  "clientsByStage_expandedConsultants",

  // Employees
  "employees-view-mode",

  // Files
  "starred_files",

  // Notifications
  "notification_sound_enabled",

  // Timer
  "timer-position",
  "timer-size",
  "timer-quick-titles",
  "timer-quick-notes",
  "timer-quick-options",
  "custom-timer-themes",
  "timer-widget-collapsed",
  "timer-widget-minimized",
  "timer-recent-clients",

  // Google integrations config
  "google-calendar-auto-sync-settings",
  "google_calendar_config",
  "google_sheets_config",

  // Backup config
  "auto-backup-config",

  // Developer tools
  "dev-tools-enabled",
  "dev-tools-config",
  "dev-buttons-config",
  "dev-buttons-positions",
  "dev-tools-minimized",
];

// Additional prefixes for dynamic keys (like dashboard-dynamic-stats-1, dashboard-dynamic-stats-2)
const WATCH_KEY_PREFIXES = ["dashboard-dynamic-stats-"];

// Helper to check if a key should be watched
const shouldWatchKey = (key: string): boolean => {
  return (
    WATCH_KEYS.includes(key) ||
    WATCH_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
};

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { saveToCloud, loadFromCloud } = useCloudPreferences();
  const { toast } = useToast();
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedFromCloud = useRef(false);
  const isLoadingFromCloud = useRef(false);
  const backupSchedulerRef = useRef<AutoBackupScheduler | null>(null);

  // Listen for auto-backup notifications and show as toast
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === "success") {
        toast({ title: "✅ גיבוי אוטומטי הושלם", description: detail.message });
      } else if (detail?.type === "error") {
        toast({
          title: "❌ שגיאת גיבוי",
          description: detail.message,
          variant: "destructive",
        });
      }
    };
    window.addEventListener("auto-backup-notification", handler);
    return () =>
      window.removeEventListener("auto-backup-notification", handler);
  }, [toast]);

  // Initialize auto backup scheduler
  useEffect(() => {
    if (!user?.id) {
      // Stop scheduler on logout
      if (backupSchedulerRef.current) {
        backupSchedulerRef.current.stop();
        backupSchedulerRef.current = null;
      }
      return;
    }

    // Load config and start scheduler
    const config = AutoBackupScheduler.loadConfig();
    const scheduler = AutoBackupScheduler.getInstance(config);
    backupSchedulerRef.current = scheduler;

    if (config.enabled) {
      scheduler.start();
      console.log("🔄 גיבוי אוטומטי הופעל");
    }

    return () => {
      if (backupSchedulerRef.current) {
        backupSchedulerRef.current.stop();
      }
    };
  }, [user?.id]);

  // Load from cloud on login
  useEffect(() => {
    if (user?.id && !hasLoadedFromCloud.current) {
      hasLoadedFromCloud.current = true;
      isLoadingFromCloud.current = true;
      loadFromCloud().finally(() => {
        // Allow saves again after cloud data is applied
        setTimeout(() => {
          isLoadingFromCloud.current = false;
        }, 1000);
      });
    }

    // Reset on logout
    if (!user?.id) {
      hasLoadedFromCloud.current = false;
    }
  }, [user?.id, loadFromCloud]);

  // Watch for localStorage changes and auto-save
  useEffect(() => {
    if (!user?.id) return;

    // Override localStorage.setItem to detect changes
    const originalSetItem = localStorage.setItem.bind(localStorage);

    localStorage.setItem = (key: string, value: string) => {
      originalSetItem(key, value);

      // If it's a watched key (static or by prefix), schedule a save
      if (shouldWatchKey(key) && !isLoadingFromCloud.current) {
        if (saveTimeout.current) {
          clearTimeout(saveTimeout.current);
        }
        // Debounce: save after 3 seconds of no changes
        saveTimeout.current = setTimeout(() => {
          saveToCloud();
        }, 3000);
      }
    };

    // Save on page unload
    const handleBeforeUnload = () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      // Sync save (may not complete if page closes too fast)
      saveToCloud();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      localStorage.setItem = originalSetItem;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [user?.id, saveToCloud]);

  return <>{children}</>;
}
