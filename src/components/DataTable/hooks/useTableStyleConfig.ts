// Table Style Config Hook - הגדרות עיצוב טבלה
import { useState } from "react";
import { TableStyleConfig } from "../types";

const defaultConfig: TableStyleConfig = {
  dividers: "horizontal",
  headerSticky: true,
  headerOpacity: "solid",
  rowGap: 0,
  cellPadding: 12,
  striped: true,
  bordered: true,
  compact: false,
  // Color styling defaults
  headerBgColor: undefined,
  headerTextColor: undefined,
  rowBgColor: undefined,
  rowAltBgColor: undefined,
  dividerColor: undefined,
  hoverBgColor: undefined,
  accentColor: undefined,
};

const STORAGE_KEY = "clients-table-style-config";

export function useTableStyleConfig() {
  const [config, setConfig] = useState<TableStyleConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultConfig, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load table style config:", e);
    }
    return defaultConfig;
  });

  const updateConfig = (updates: Partial<TableStyleConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      return newConfig;
    });
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { config, updateConfig, resetConfig };
}

export { defaultConfig, STORAGE_KEY };
