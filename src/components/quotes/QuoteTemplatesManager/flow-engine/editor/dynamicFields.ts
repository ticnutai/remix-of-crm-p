export interface DynamicFieldDefinition {
  key: string;
  label: string;
  group: string;
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
