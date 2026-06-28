// Quotes Pro — פרטי לקוח/פרויקט + חיבור למערכת הלקוחות + placeholders
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientCombobox } from "@/components/quotes/QuoteDocumentEditor/ClientCombobox";
import type { Client } from "@/hooks/useClients";
import type { QPDocMeta } from "../model/types";

interface Props {
  meta: QPDocMeta;
  onChange: (meta: QPDocMeta) => void;
}

function MetaField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
        placeholder={placeholder}
      />
    </div>
  );
}

export function MetaPanel({ meta, onChange }: Props) {
  const set = (patch: Partial<QPDocMeta>) => onChange({ ...meta, ...patch });

  const handleClientSelect = (client: Client) => {
    set({
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone || "",
      clientEmail: client.email || "",
      clientCompany: client.company || "",
      projectAddress: meta.projectAddress || client.address || "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-muted-foreground">בחר לקוח מהמערכת</Label>
        <ClientCombobox
          value={meta.clientName || ""}
          onChange={(name) => set({ clientName: name })}
          onClientSelect={handleClientSelect}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetaField label="שם לקוח" value={meta.clientName} onChange={(v) => set({ clientName: v })} />
        <MetaField label="חברה" value={meta.clientCompany} onChange={(v) => set({ clientCompany: v })} />
        <MetaField label="טלפון" value={meta.clientPhone} onChange={(v) => set({ clientPhone: v })} />
        <MetaField label="אימייל" value={meta.clientEmail} onChange={(v) => set({ clientEmail: v })} />
      </div>

      <div className="border-t pt-3 space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">פרטי פרויקט</Label>
        <MetaField label="שם הפרויקט" value={meta.projectName} onChange={(v) => set({ projectName: v })} />
        <MetaField label="כתובת/ישוב" value={meta.projectAddress} onChange={(v) => set({ projectAddress: v })} />
        <div className="grid grid-cols-2 gap-2">
          <MetaField label="גוש" value={meta.gush} onChange={(v) => set({ gush: v })} />
          <MetaField label="חלקה" value={meta.helka} onChange={(v) => set({ helka: v })} />
          <MetaField label="מגרש" value={meta.migrash} onChange={(v) => set({ migrash: v })} />
          <MetaField label='תב"ע' value={meta.taba} onChange={(v) => set({ taba: v })} />
        </div>
      </div>

      <div className="border-t pt-3 grid grid-cols-2 gap-2">
        <MetaField label="מספר הצעה" value={meta.quoteNumber} onChange={(v) => set({ quoteNumber: v })} />
        <MetaField label="תאריך" type="date" value={meta.issueDate} onChange={(v) => set({ issueDate: v })} />
      </div>

      <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
        <div className="font-semibold">שדות ממוזגים (placeholders)</div>
        <p>
          הקלד בכל טקסט בהצעה תגיות כמו{" "}
          <code className="bg-muted px-1 rounded">{"{{שם הלקוח}}"}</code>,{" "}
          <code className="bg-muted px-1 rounded">{"{{גוש}}"}</code>,{" "}
          <code className="bg-muted px-1 rounded">{"{{חלקה}}"}</code> — והן יוחלפו אוטומטית בערכים שכאן.
        </p>
      </div>
    </div>
  );
}
