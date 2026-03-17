// Client Field Configuration Hook - Controls which fields appear in Add Client form
// Features: visibility toggle, profiles/templates, field ordering, conditional fields, custom sections
import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "client_field_config";
const PROFILES_KEY = "client_field_profiles";
const ORDER_KEY = "client_field_order";
const CONDITIONS_KEY = "client_field_conditions";
const CUSTOM_SECTIONS_KEY = "client_custom_sections";

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

// Conditional field rule: show targetField only when dependsOnField has a value
export interface FieldCondition {
  id: string;
  targetField: string;
  dependsOnField: string;
  condition: "not_empty" | "empty" | "equals";
  value?: string; // for "equals" condition
}

// Profile preset (template)
export interface FieldProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  visibilityMap: FieldVisibilityMap;
  isBuiltIn: boolean;
}

// Custom section definition
export interface CustomSection {
  key: string;
  label: string;
  order: number;
}

// Default built-in fields with their sections
const DEFAULT_FIELDS: BuiltInField[] = [
  // פרטים בסיסיים
  {
    key: "name",
    label: "שם לקוח",
    section: "basic",
    sectionLabel: "פרטים בסיסיים",
    type: "text",
    required: true,
    visible: true,
    order: 0,
    protected: true,
  },
  {
    key: "email",
    label: "אימייל",
    section: "basic",
    sectionLabel: "פרטים בסיסיים",
    type: "email",
    required: false,
    visible: true,
    order: 1,
    protected: false,
  },
  {
    key: "phone",
    label: "טלפון",
    section: "basic",
    sectionLabel: "פרטים בסיסיים",
    type: "tel",
    required: false,
    visible: true,
    order: 2,
    protected: false,
  },
  // כתובת ומיקום
  {
    key: "street",
    label: "רחוב",
    section: "address",
    sectionLabel: "כתובת ומיקום",
    type: "text",
    required: false,
    visible: true,
    order: 10,
    protected: false,
  },
  {
    key: "moshav",
    label: "מושב / ישוב",
    section: "address",
    sectionLabel: "כתובת ומיקום",
    type: "text",
    required: false,
    visible: true,
    order: 11,
    protected: false,
  },
  // שדות נדל"ן
  {
    key: "idNumber",
    label: "ת.ז / ח.פ",
    section: "realestate",
    sectionLabel: 'פרטי נדל"ן',
    type: "text",
    required: false,
    visible: true,
    order: 20,
    protected: false,
  },
  {
    key: "taba",
    label: 'תב"ע',
    section: "realestate",
    sectionLabel: 'פרטי נדל"ן',
    type: "text",
    required: false,
    visible: true,
    order: 21,
    protected: false,
  },
  {
    key: "gush",
    label: "גוש",
    section: "realestate",
    sectionLabel: 'פרטי נדל"ן',
    type: "text",
    required: false,
    visible: true,
    order: 22,
    protected: false,
  },
  {
    key: "helka",
    label: "חלקה",
    section: "realestate",
    sectionLabel: 'פרטי נדל"ן',
    type: "text",
    required: false,
    visible: true,
    order: 23,
    protected: false,
  },
  {
    key: "migrash",
    label: "מגרש",
    section: "realestate",
    sectionLabel: 'פרטי נדל"ן',
    type: "text",
    required: false,
    visible: true,
    order: 24,
    protected: false,
  },
  // ועד האגודה
  {
    key: "agudaAddress",
    label: "כתובת ועד האגודה",
    section: "aguda",
    sectionLabel: "ועד האגודה",
    type: "text",
    required: false,
    visible: true,
    order: 30,
    protected: false,
  },
  {
    key: "agudaEmail",
    label: "מייל ועד האגודה",
    section: "aguda",
    sectionLabel: "ועד האגודה",
    type: "email",
    required: false,
    visible: true,
    order: 31,
    protected: false,
  },
  // ועד המושב
  {
    key: "vaadMoshavAddress",
    label: "כתובת ועד המושב",
    section: "moshav",
    sectionLabel: "ועד המושב",
    type: "text",
    required: false,
    visible: true,
    order: 40,
    protected: false,
  },
  {
    key: "vaadMoshavEmail",
    label: "מייל ועד המושב",
    section: "moshav",
    sectionLabel: "ועד המושב",
    type: "email",
    required: false,
    visible: true,
    order: 41,
    protected: false,
  },
];

export type FieldVisibilityMap = Record<string, boolean>;
export type FieldOrderMap = Record<string, number>;

// ============ Built-in Profiles ============
const BUILT_IN_PROFILES: FieldProfile[] = [
  {
    id: "all",
    name: "הכל",
    icon: "📋",
    description: "כל השדות מוצגים",
    visibilityMap: Object.fromEntries(DEFAULT_FIELDS.map((f) => [f.key, true])),
    isBuiltIn: true,
  },
  {
    id: "minimal",
    name: "מינימלי",
    icon: "✨",
    description: "שם, אימייל וטלפון בלבד",
    visibilityMap: Object.fromEntries(
      DEFAULT_FIELDS.map((f) => [
        f.key,
        ["name", "email", "phone"].includes(f.key),
      ]),
    ),
    isBuiltIn: true,
  },
  {
    id: "realestate",
    name: 'נדל"ן',
    icon: "🏠",
    description: 'פרטים בסיסיים + כתובת + שדות נדל"ן',
    visibilityMap: Object.fromEntries(
      DEFAULT_FIELDS.map((f) => [
        f.key,
        ["basic", "address", "realestate"].includes(f.section),
      ]),
    ),
    isBuiltIn: true,
  },
  {
    id: "aguda",
    name: "אגודה ומושב",
    icon: "🏘️",
    description: "פרטים בסיסיים + כתובת + ועדים",
    visibilityMap: Object.fromEntries(
      DEFAULT_FIELDS.map((f) => [
        f.key,
        ["basic", "address", "aguda", "moshav"].includes(f.section),
      ]),
    ),
    isBuiltIn: true,
  },
  {
    id: "contact",
    name: "איש קשר",
    icon: "👤",
    description: "רק פרטי התקשרות וכתובת",
    visibilityMap: Object.fromEntries(
      DEFAULT_FIELDS.map((f) => [
        f.key,
        ["basic", "address"].includes(f.section),
      ]),
    ),
    isBuiltIn: true,
  },
];

// ============ Load/Save helpers ============
function loadConfig(): FieldVisibilityMap {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

function saveConfig(config: FieldVisibilityMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

function loadProfiles(): FieldProfile[] {
  try {
    const saved = localStorage.getItem(PROFILES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveProfiles(profiles: FieldProfile[]) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {}
}

function loadFieldOrder(): FieldOrderMap {
  try {
    const saved = localStorage.getItem(ORDER_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

function saveFieldOrder(order: FieldOrderMap) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {}
}

function loadConditions(): FieldCondition[] {
  try {
    const saved = localStorage.getItem(CONDITIONS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveConditions(conditions: FieldCondition[]) {
  try {
    localStorage.setItem(CONDITIONS_KEY, JSON.stringify(conditions));
  } catch {}
}

function loadCustomSections(): CustomSection[] {
  try {
    const saved = localStorage.getItem(CUSTOM_SECTIONS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveCustomSections(sections: CustomSection[]) {
  try {
    localStorage.setItem(CUSTOM_SECTIONS_KEY, JSON.stringify(sections));
  } catch {}
}

// ============ Main Hook ============
export function useClientFieldConfig() {
  const [visibilityOverrides, setVisibilityOverrides] =
    useState<FieldVisibilityMap>(loadConfig);
  const [fieldOrderOverrides, setFieldOrderOverrides] =
    useState<FieldOrderMap>(loadFieldOrder);
  const [customProfiles, setCustomProfiles] =
    useState<FieldProfile[]>(loadProfiles);
  const [conditions, setConditions] =
    useState<FieldCondition[]>(loadConditions);
  const [customSections, setCustomSections] =
    useState<CustomSection[]>(loadCustomSections);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // All profiles (built-in + custom)
  const allProfiles = useMemo(
    () => [...BUILT_IN_PROFILES, ...customProfiles],
    [customProfiles],
  );

  // Compute fields with overrides applied + ordering
  const fields = useMemo(() => {
    return DEFAULT_FIELDS.map((f) => ({
      ...f,
      visible: f.protected ? true : (visibilityOverrides[f.key] ?? f.visible),
      order: fieldOrderOverrides[f.key] ?? f.order,
    })).sort((a, b) => a.order - b.order);
  }, [visibilityOverrides, fieldOrderOverrides]);

  // Get grouped fields by section (including custom sections)
  const sections = useMemo(() => {
    const sectionMap = new Map<
      string,
      { label: string; fields: BuiltInField[]; order: number }
    >();

    // Add built-in sections from fields
    for (const f of fields) {
      if (!sectionMap.has(f.section)) {
        const sectionOrder =
          f.section === "basic"
            ? 0
            : f.section === "address"
              ? 1
              : f.section === "realestate"
                ? 2
                : f.section === "aguda"
                  ? 3
                  : f.section === "moshav"
                    ? 4
                    : 50;
        sectionMap.set(f.section, {
          label: f.sectionLabel,
          fields: [],
          order: sectionOrder,
        });
      }
      sectionMap.get(f.section)!.fields.push(f);
    }

    // Add custom sections (even if empty)
    for (const cs of customSections) {
      if (!sectionMap.has(cs.key)) {
        sectionMap.set(cs.key, {
          label: cs.label,
          fields: [],
          order: cs.order,
        });
      }
    }

    return Array.from(sectionMap.entries())
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => a.order - b.order);
  }, [fields, customSections]);

  // ============ Visibility actions ============
  const toggleField = useCallback((key: string) => {
    setVisibilityOverrides((prev) => {
      const defaultField = DEFAULT_FIELDS.find((f) => f.key === key);
      if (!defaultField || defaultField.protected) return prev;
      const currentVisible = prev[key] ?? defaultField.visible;
      const next = { ...prev, [key]: !currentVisible };
      saveConfig(next);
      return next;
    });
    setActiveProfileId(null); // Custom config — no profile active
  }, []);

  const setFieldVisible = useCallback((key: string, visible: boolean) => {
    setVisibilityOverrides((prev) => {
      const defaultField = DEFAULT_FIELDS.find((f) => f.key === key);
      if (!defaultField || defaultField.protected) return prev;
      const next = { ...prev, [key]: visible };
      saveConfig(next);
      return next;
    });
    setActiveProfileId(null);
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
    setActiveProfileId(null);
  }, []);

  const resetDefaults = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ORDER_KEY);
    } catch {}
    setVisibilityOverrides({});
    setFieldOrderOverrides({});
    setActiveProfileId(null);
  }, []);

  const showAll = useCallback(() => {
    const all: FieldVisibilityMap = {};
    for (const f of DEFAULT_FIELDS) {
      all[f.key] = true;
    }
    saveConfig(all);
    setVisibilityOverrides(all);
    setActiveProfileId("all");
  }, []);

  // ============ Profile actions ============
  const applyProfile = useCallback((profileId: string) => {
    const profile = [...BUILT_IN_PROFILES, ...loadProfiles()].find(
      (p) => p.id === profileId,
    );
    if (!profile) return;
    saveConfig(profile.visibilityMap);
    setVisibilityOverrides(profile.visibilityMap);
    setActiveProfileId(profileId);
  }, []);

  const saveCurrentAsProfile = useCallback(
    (name: string, icon: string, description: string) => {
      const newProfile: FieldProfile = {
        id: `custom_${Date.now()}`,
        name,
        icon,
        description,
        visibilityMap: { ...visibilityOverrides },
        isBuiltIn: false,
      };
      setCustomProfiles((prev) => {
        const next = [...prev, newProfile];
        saveProfiles(next);
        return next;
      });
      setActiveProfileId(newProfile.id);
      return newProfile;
    },
    [visibilityOverrides],
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      setCustomProfiles((prev) => {
        const next = prev.filter((p) => p.id !== profileId);
        saveProfiles(next);
        return next;
      });
      if (activeProfileId === profileId) setActiveProfileId(null);
    },
    [activeProfileId],
  );

  const updateProfile = useCallback(
    (
      profileId: string,
      updates: Partial<Pick<FieldProfile, "name" | "icon" | "description">>,
    ) => {
      setCustomProfiles((prev) => {
        const next = prev.map((p) =>
          p.id === profileId ? { ...p, ...updates } : p,
        );
        saveProfiles(next);
        return next;
      });
    },
    [],
  );

  // ============ Field ordering actions ============
  const reorderField = useCallback((fieldKey: string, newOrder: number) => {
    setFieldOrderOverrides((prev) => {
      const next = { ...prev, [fieldKey]: newOrder };
      saveFieldOrder(next);
      return next;
    });
  }, []);

  const reorderFieldsInSection = useCallback(
    (sectionKey: string, orderedKeys: string[]) => {
      setFieldOrderOverrides((prev) => {
        const next = { ...prev };
        // Get the base order for this section
        const sectionFields = DEFAULT_FIELDS.filter(
          (f) => f.section === sectionKey,
        );
        const baseOrder = Math.min(...sectionFields.map((f) => f.order));
        orderedKeys.forEach((key, index) => {
          next[key] = baseOrder + index;
        });
        saveFieldOrder(next);
        return next;
      });
    },
    [],
  );

  // ============ Conditional fields actions ============
  const addCondition = useCallback((condition: Omit<FieldCondition, "id">) => {
    const newCondition: FieldCondition = {
      ...condition,
      id: `cond_${Date.now()}`,
    };
    setConditions((prev) => {
      const next = [...prev, newCondition];
      saveConditions(next);
      return next;
    });
    return newCondition;
  }, []);

  const removeCondition = useCallback((conditionId: string) => {
    setConditions((prev) => {
      const next = prev.filter((c) => c.id !== conditionId);
      saveConditions(next);
      return next;
    });
  }, []);

  const updateCondition = useCallback(
    (conditionId: string, updates: Partial<FieldCondition>) => {
      setConditions((prev) => {
        const next = prev.map((c) =>
          c.id === conditionId ? { ...c, ...updates } : c,
        );
        saveConditions(next);
        return next;
      });
    },
    [],
  );

  // Check if a field is conditionally visible based on form values
  const isConditionallyVisible = useCallback(
    (fieldKey: string, formValues: Record<string, string>): boolean => {
      const fieldConditions = conditions.filter(
        (c) => c.targetField === fieldKey,
      );
      if (fieldConditions.length === 0) return true; // No conditions = always visible

      // ALL conditions must be met
      return fieldConditions.every((c) => {
        const dependsValue = formValues[c.dependsOnField] || "";
        switch (c.condition) {
          case "not_empty":
            return dependsValue.trim() !== "";
          case "empty":
            return dependsValue.trim() === "";
          case "equals":
            return dependsValue === (c.value || "");
          default:
            return true;
        }
      });
    },
    [conditions],
  );

  // ============ Custom sections actions ============
  const addCustomSection = useCallback(
    (label: string) => {
      const key = `custom_${Date.now()}`;
      const maxOrder = Math.max(50, ...customSections.map((s) => s.order));
      const newSection: CustomSection = { key, label, order: maxOrder + 1 };
      setCustomSections((prev) => {
        const next = [...prev, newSection];
        saveCustomSections(next);
        return next;
      });
      return newSection;
    },
    [customSections],
  );

  const removeCustomSection = useCallback((sectionKey: string) => {
    setCustomSections((prev) => {
      const next = prev.filter((s) => s.key !== sectionKey);
      saveCustomSections(next);
      return next;
    });
  }, []);

  const renameCustomSection = useCallback(
    (sectionKey: string, newLabel: string) => {
      setCustomSections((prev) => {
        const next = prev.map((s) =>
          s.key === sectionKey ? { ...s, label: newLabel } : s,
        );
        saveCustomSections(next);
        return next;
      });
    },
    [],
  );

  // ============ Export/Import for cloud sync ============
  const exportConfig = useCallback(() => {
    return JSON.stringify({
      version: 2,
      visibility: visibilityOverrides,
      fieldOrder: fieldOrderOverrides,
      customProfiles: customProfiles,
      conditions: conditions,
      customSections: customSections,
      activeProfileId,
      exportedAt: new Date().toISOString(),
    });
  }, [
    visibilityOverrides,
    fieldOrderOverrides,
    customProfiles,
    conditions,
    customSections,
    activeProfileId,
  ]);

  const importConfig = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.visibility) {
        setVisibilityOverrides(data.visibility);
        saveConfig(data.visibility);
      }
      if (data.fieldOrder) {
        setFieldOrderOverrides(data.fieldOrder);
        saveFieldOrder(data.fieldOrder);
      }
      if (data.customProfiles) {
        setCustomProfiles(data.customProfiles);
        saveProfiles(data.customProfiles);
      }
      if (data.conditions) {
        setConditions(data.conditions);
        saveConditions(data.conditions);
      }
      if (data.customSections) {
        setCustomSections(data.customSections);
        saveCustomSections(data.customSections);
      }
      if (data.activeProfileId) {
        setActiveProfileId(data.activeProfileId);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // ============ Computed values ============
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
    // Profiles
    allProfiles,
    activeProfileId,
    applyProfile,
    saveCurrentAsProfile,
    deleteProfile,
    updateProfile,
    // Field ordering
    reorderField,
    reorderFieldsInSection,
    // Conditional fields
    conditions,
    addCondition,
    removeCondition,
    updateCondition,
    isConditionallyVisible,
    // Custom sections
    customSections,
    addCustomSection,
    removeCustomSection,
    renameCustomSection,
    // Export/Import
    exportConfig,
    importConfig,
  };
}
