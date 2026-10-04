import { useSyncExternalStore } from "react";

// Live registry of the user's custom client fields (client_custom_field_definitions).
// useClientCustomFields publishes every definitions load here, so code that is
// not a React component — token maps in the quote editors, contract
// placeholders, search — can resolve a custom field by its label without each
// caller fetching definitions. A field added by hand therefore shows up in all
// of them automatically.

export interface RegisteredCustomField {
  key: string;
  label: string;
}

let fields: RegisteredCustomField[] = [];
const listeners = new Set<() => void>();

export function setRegisteredCustomFields(next: RegisteredCustomField[]): void {
  const cleaned = next
    .filter((f) => f.key && f.label?.trim())
    .map((f) => ({ key: f.key, label: f.label.trim() }));
  const same =
    cleaned.length === fields.length &&
    cleaned.every((f, i) => f.key === fields[i].key && f.label === fields[i].label);
  if (same) return;
  fields = cleaned;
  listeners.forEach((listener) => listener());
}

export function getRegisteredCustomFields(): RegisteredCustomField[] {
  return fields;
}

export function subscribeCustomFields(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React hook: the registered custom fields, re-rendering when they change. */
export function useRegisteredCustomFields(): RegisteredCustomField[] {
  return useSyncExternalStore(subscribeCustomFields, getRegisteredCustomFields, getRegisteredCustomFields);
}

/** Only plain values of custom_data (drops internal objects like phone labels). */
export function customDataValues(customData: unknown): Record<string, string> {
  if (!customData || typeof customData !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(customData as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) out[key] = text;
    }
  }
  return out;
}

/** label → value for every registered field that has a value in customData. */
export function customFieldTokenMap(customData: unknown): Record<string, string> {
  const values = customDataValues(customData);
  const map: Record<string, string> = {};
  for (const field of fields) {
    if (values[field.key] !== undefined) map[field.label] = values[field.key];
  }
  return map;
}
