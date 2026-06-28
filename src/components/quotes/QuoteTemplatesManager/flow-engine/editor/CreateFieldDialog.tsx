// CreateFieldDialog — יוצר הגדרת שדה חדשה ב-client_custom_field_definitions
// ומחזיר את ההגדרה דרך onCreated כדי שהעורך יכניס אותו במקום הסמן.
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useClientCustomFields,
  type CustomFieldDefinition,
} from "@/hooks/useClientCustomFields";
import type { DynamicFieldDefinition } from "./dynamicFields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (field: DynamicFieldDefinition, def: CustomFieldDefinition) => void;
}

const TYPE_OPTIONS: { value: CustomFieldDefinition["field_type"]; label: string }[] = [
  { value: "text", label: "טקסט" },
  { value: "textarea", label: "טקסט ארוך" },
  { value: "number", label: "מספר" },
  { value: "date", label: "תאריך" },
  { value: "email", label: 'דוא"ל' },
  { value: "phone", label: "טלפון" },
  { value: "select", label: "בחירה מרשימה" },
];

export default function CreateFieldDialog({ open, onOpenChange, onCreated }: Props) {
  const { addField } = useClientCustomFields();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomFieldDefinition["field_type"]>("text");
  const [placeholder, setPlaceholder] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setLabel("");
    setType("text");
    setPlaceholder("");
    setOptionsText("");
  };

  const handleSubmit = async () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setSaving(true);
    const options =
      type === "select"
        ? optionsText
            .split(/\n|,/)
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;
    const def = await addField({
      label: trimmed,
      field_type: type,
      placeholder: placeholder.trim(),
      options,
      section: "custom",
    });
    setSaving(false);
    if (def) {
      const fld: DynamicFieldDefinition = {
        key: `custom.${def.field_key}`,
        label: def.label,
        group: "מותאם אישית",
        custom: true,
      };
      onCreated?.(fld, def);
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>שדה חדש</DialogTitle>
          <DialogDescription>
            השדה יהיה זמין בעורך, בטאב פרטי פרויקט ובכרטיס הלקוח.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">כותרת השדה *</Label>
            <Input
              dir="rtl"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="לדוגמה: מספר תיק, יועץ קרקע..."
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">סוג</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">טקסט מסייע (Placeholder)</Label>
            <Input
              dir="rtl"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="אופציונלי"
            />
          </div>

          {type === "select" && (
            <div className="space-y-1">
              <Label className="text-xs">אפשרויות (שורה או פסיק בין כל אפשרות)</Label>
              <Textarea
                dir="rtl"
                rows={4}
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder={"אפשרות 1\nאפשרות 2"}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={!label.trim() || saving}>
            {saving ? "שומר..." : "צור שדה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
