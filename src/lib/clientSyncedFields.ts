// Built-in client columns that are edited in quotes too and written back to the
// client. One list, so every quote editor syncs the same fields the same way.
//
//   column — the clients table column
//   key    — the field name in quote project details / Quotes Pro meta
//   label  — Hebrew label (also used as the [label] token in quote text)

export interface ClientSyncedField {
  column: "minhal_contract_number" | "new_taba_number";
  key: "minhalContract" | "newTaba";
  label: string;
}

export const CLIENT_SYNCED_FIELDS: ClientSyncedField[] = [
  { column: "minhal_contract_number", key: "minhalContract", label: "מספר חוזה מנהל" },
  { column: "new_taba_number", key: "newTaba", label: 'מספר תב"ע חדשה' },
];

export const CLIENT_SYNCED_COLUMNS = CLIENT_SYNCED_FIELDS.map((f) => f.column);

/**
 * Client column updates from quote values. Only non-empty values are included,
 * so a quote that never had the field does not clear the client's value.
 */
export function clientUpdatesFromQuote(
  source: Partial<Record<ClientSyncedField["key"], unknown>> | null | undefined,
): Partial<Record<ClientSyncedField["column"], string>> {
  const updates: Partial<Record<ClientSyncedField["column"], string>> = {};
  for (const field of CLIENT_SYNCED_FIELDS) {
    const value = String(source?.[field.key] ?? "").trim();
    if (value) updates[field.column] = value;
  }
  return updates;
}

/** Quote values from a client row (missing columns become ""). */
export function quoteValuesFromClient(
  client: Partial<Record<ClientSyncedField["column"], string | null>> | null | undefined,
): Record<ClientSyncedField["key"], string> {
  const values = {} as Record<ClientSyncedField["key"], string>;
  for (const field of CLIENT_SYNCED_FIELDS) {
    values[field.key] = client?.[field.column] || "";
  }
  return values;
}
