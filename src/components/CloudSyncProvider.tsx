// Cloud Sync Provider - Syncs user preferences between localStorage and cloud
import React, { useEffect, useRef } from "react";
import { useCloudPreferences } from "@/hooks/useCloudPreferences";
import { useAuth } from "@/hooks/useAuth";
import { AutoBackupScheduler } from "@/lib/smartBackup";

// Keys that trigger auto-save when changed
const WATCH_KEYS = [
  // Theme & UI
  "ten-arch-theme",
  "animations-enabled",
  "timer-theme",

  // Sidebar & Navigation
  "sidebar-tasks-open",
  "sidebar-gestures-config",
  "button-gestures-config",
  "sidebar-pinned",

  // Dashboard & Widgets
  "widget-layouts-v2",
  "dashboard-widgets-config",
  "dashboard-dynamic-stats",
  "dashboard-theme",
  "dashboard-auto-layout",
  "dashboard-selected-table",
  "widget-edit-mode",
  "work-hours-widget-colors",

  // Finance page
  "finance-page-sections",
  "finance-collapsed-sections",

  // DataTable & Presets
  "datatable-pro-presets",

  // Timelogs filters
  "timelogs-view-mode",
  "timelogs-search",
  "timelogs-client",
  "timelogs-project",
  "timelogs-date-filter",
  "timelogs-custom-range",
  "timelogs-billable",

  // Quotes filters
  "quotes-search",
  "quotes-status-filter",

  // Reports & MyDay
  "reports-date-range",
  "myday-meetings-view",

  // Clients page
  "clients-mobile-view",
  "clients-view-mode",

  // Google integrations config
  "google-calendar-auto-sync-settings",
  "google_calendar_config",
  "google_sheets_config",

  // Developer tools
  "dev-tools-enabled",
  "dev-tools-config",
  "dev-buttons-config",
];

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { saveToCloud, loadFromCloud } = useCloudPreferences();
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedFromCloud = useRef(false);
  const isLoadingFromCloud = useRef(false);
  const backupSchedulerRef = useRef<AutoBackupScheduler | null>(null);

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

      // If it's a watched key, schedule a save
      if (WATCH_KEYS.includes(key) && !isLoadingFromCloud.current) {
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
