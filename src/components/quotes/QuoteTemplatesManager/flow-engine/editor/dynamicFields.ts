import { useMemo } from "react";
import { useClientCustomFields } from "@/hooks/useClientCustomFields";

export interface DynamicFieldDefinition {
  key: string;
  label: string;
  group: string;
  /** מסומן true עבור שדות שהוגדרו ע"י המשתמש (custom_data של לקוח) */
  custom?: boolean;
}

export const FLOW_DYNAMIC_FIELDS: DynamicFieldDefinition[] = [
  { key: "customer.name", label: "שם לקוח", group: "לקוח" },
  { key: "customer.address", label: "כתובת לקוח", group: "לקוח" },
  { key: "customer.phone", label: "טלפון", group: "לקוח" },
  { key: "customer.email", label: 'דוא"ל', group: "לקוח" },
  { key: "parcel.block", label: "גוש", group: "נכס" },
  { key: "parcel.lot", label: "חלקה", group: "נכס" },
  { key: "parcel.plot", label: "מגרש", group: "נכס" },
  { key: "quote.number", label: "מספר הצעה", group: "הצעה" },
  { key: "quote.date", label: "תאריך הצעה", group: "הצעה" },
  { key: "quote.validity", label: "תוקף", group: "הצעה" },
  { key: "quote.total", label: 'סה"כ', group: "הצעה" },
];

export function groupDynamicFields(fields = FLOW_DYNAMIC_FIELDS) {
  return fields.reduce<Record<string, DynamicFieldDefinition[]>>((groups, field) => {
    groups[field.group] = groups[field.group] || [];
    groups[field.group].push(field);
    return groups;
  }, {});
}

/**
 * Hook המאחד את השדות הסטטיים עם השדות המותאמים אישית
 * שמוגדרים ב-client_custom_field_definitions.
 * כך כל שדה שהמשתמש יוצר מופיע גם בעורך, גם בכרטיס הלקוח וגם בפרטי פרויקט.
 */
export function useDynamicFields() {
  const { definitions, isLoading } = useClientCustomFields();

  const customFields = useMemo<DynamicFieldDefinition[]>(
    () =>
      (definitions || []).map((d) => ({
        key: `custom.${d.field_key}`,
        label: d.label,
        group: "מותאם אישית",
        custom: true,
      })),
    [definitions],
  );

  const fields = useMemo(() => [...FLOW_DYNAMIC_FIELDS, ...customFields], [customFields]);
  const groups = useMemo(() => groupDynamicFields(fields), [fields]);

  return { fields, groups, customFields, isLoading };
}
