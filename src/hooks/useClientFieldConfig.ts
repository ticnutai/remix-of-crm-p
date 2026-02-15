// Client Field Configuration Hook - Controls which fields appear in Add Client form
import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "client_field_config";

export interface BuiltInField {
  key: string;
  label: string;
  section: string;
  sectionLabel: string;
  type: "text" | "email" | "tel" | "number";
  required: boolean;
  visible: boolean;
  order: number;
  protected: boolean; // Cannot be hidden (e.g. name)
}

// Default built-in fields with their sections
const DEFAULT_FIELDS: BuiltInField[] = [
  // פרטים בסיסיים
  { key: "name", label: "שם לקוח", section: "basic", sectionLabel: "פרטים בסיסיים", type: "text", required: true, visible: true, order: 0, protected: true },
  { key: "email", label: "אימייל", section: "basic", sectionLabel: "פרטים בסיסיים", type: "email", required: false, visible: true, order: 1, protected: false },
  { key: "phone", label: "טלפון", section: "basic", sectionLabel: "פרטים בסיסיים", type: "tel", required: false, visible: true, order: 2, protected: false },
  // כתובת ומיקום
  { key: "street", label: "רחוב", section: "address", sectionLabel: "כתובת ומיקום", type: "text", required: false, visible: true, order: 10, protected: false },
  { key: "moshav", label: "מושב / ישוב", section: "address", sectionLabel: "כתובת ומיקום", type: "text", required: false, visible: true, order: 11, protected: false },
  // שדות נדל"ן
  { key: "idNumber", label: "ת.ז / ח.פ", section: "realestate", sectionLabel: 'פרטי נדל"ן', type: "text", required: false, visible: true, order: 20, protected: false },
  { key: "taba", label: 'תב"ע', section: "realestate", sectionLabel: 'פרטי נדל"ן', type: "text", required: false, visible: true, order: 21, protected: false },
  { key: "gush", label: "גוש", section: "realestate", sectionLabel: 'פרטי נדל"ן', type: "text", required: false, visible: true, order: 22, protected: false },
  { key: "helka", label: "חלקה", section: "realestate", sectionLabel: 'פרטי נדל"ן', type: "text", required: false, visible: true, order: 23, protected: false },
  { key: "migrash", label: "מגרש", section: "realestate", sectionLabel: 'פרטי נדל"ן', type: "text", required: false, visible: true, order: 24, protected: false },
  // ועד האגודה
  { key: "agudaAddress", label: "כתובת ועד האגודה", section: "aguda", sectionLabel: "ועד האגודה", type: "text", required: false, visible: true, order: 30, protected: false },
  { key: "agudaEmail", label: "מייל ועד האגודה", section: "aguda", sectionLabel: "ועד האגודה", type: "email", required: false, visible: true, order: 31, protected: false },
  // ועד המושב
  { key: "vaadMoshavAddress", label: "כתובת ועד המושב", section: "moshav", sectionLabel: "ועד המושב", type: "text", required: false, visible: true, order: 40, protected: false },
  { key: "vaadMoshavEmail", label: "מייל ועד המושב", section: "moshav", sectionLabel: "ועד המושב", type: "email", required: false, visible: true, order: 41, protected: false },
];

export type FieldVisibilityMap = Record<string, boolean>;

function loadConfig(): FieldVisibilityMap {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

function saveConfig(config: FieldVisibilityMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useClientFieldConfig() {
  const [visibilityOverrides, setVisibilityOverrides] = useState<FieldVisibilityMap>(loadConfig);

  // Compute fields with overrides applied
  const fields = useMemo(() => {
    return DEFAULT_FIELDS.map((f) => ({
      ...f,
      visible: f.protected ? true : (visibilityOverrides[f.key] ?? f.visible),
    }));
  }, [visibilityOverrides]);

  // Get grouped fields by section
  const sections = useMemo(() => {
    const sectionMap = new Map<string, { label: string; fields: BuiltInField[] }>();
    for (const f of fields) {
      if (!sectionMap.has(f.section)) {
        sectionMap.set(f.section, { label: f.sectionLabel, fields: [] });
      }
      sectionMap.get(f.section)!.fields.push(f);
    }
    return Array.from(sectionMap.entries()).map(([key, val]) => ({
      key,
      ...val,
    }));
  }, [fields]);

  const toggleField = useCallback((key: string) => {
    setVisibilityOverrides((prev) => {
      // Find the default field
      const defaultField = DEFAULT_FIELDS.find((f) => f.key === key);
      if (!defaultField || defaultField.protected) return prev;

      const currentVisible = prev[key] ?? defaultField.visible;
      const next = { ...prev, [key]: !currentVisible };
      saveConfig(next);
      return next;
    });
  }, []);

  const setFieldVisible = useCallback((key: string, visible: boolean) => {
    setVisibilityOverrides((prev) => {
      const defaultField = DEFAULT_FIELDS.find((f) => f.key === key);
      if (!defaultField || defaultField.protected) return prev;
      const next = { ...prev, [key]: visible };
      saveConfig(next);
      return next;
    });
  }, []);

  const toggleSection = useCallback((sectionKey: string, visible: boolean) => {
    setVisibilityOverrides((prev) => {
      const next = { ...prev };
      for (const f of DEFAULT_FIELDS) {
        if (f.section === sectionKey && !f.protected) {
          next[f.key] = visible;
        }
      }
      saveConfig(next);
      return next;
    });
  }, []);

  const resetDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setVisibilityOverrides({});
  }, []);

  const showAll = useCallback(() => {
    const all: FieldVisibilityMap = {};
    for (const f of DEFAULT_FIELDS) {
      all[f.key] = true;
    }
    saveConfig(all);
    setVisibilityOverrides(all);
  }, []);

  const isVisible = useCallback(
    (key: string): boolean => {
      const field = fields.find((f) => f.key === key);
      return field ? field.visible : true;
    },
    [fields],
  );

  const hiddenCount = useMemo(
    () => fields.filter((f) => !f.visible && !f.protected).length,
    [fields],
  );

  const visibleCount = useMemo(
    () => fields.filter((f) => f.visible).length,
    [fields],
  );

  return {
    fields,
    sections,
    toggleField,
    setFieldVisible,
    toggleSection,
    resetDefaults,
    showAll,
    isVisible,
    hiddenCount,
    visibleCount,
    totalCount: DEFAULT_FIELDS.length,
  };
}
