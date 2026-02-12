import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Plus, Trash2, Settings2, X, Check, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  CustomFieldDefinition,
  CustomFieldValues,
  NewFieldDefinition,
} from "@/hooks/useClientCustomFields";

const FIELD_TYPES: {
  value: CustomFieldDefinition["field_type"];
  label: string;
}[] = [
  { value: "text", label: "טקסט" },
  { value: "number", label: "מספר" },
  { value: "email", label: "אימייל" },
  { value: "phone", label: "טלפון" },
  { value: "date", label: "תאריך" },
  { value: "textarea", label: "טקסט ארוך" },
  { value: "select", label: "בחירה מרשימה" },
];

// ──────────────────────────────────────────────────────────
// SmartCustomInput — input + "+" icon that shows existing
// values from other clients' custom_data for auto-complete
// ──────────────────────────────────────────────────────────
interface SmartCustomInputProps {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "rtl" | "ltr";
}

const SmartCustomInput: React.FC<SmartCustomInputProps> = ({
  fieldKey,
  value,
  onChange,
  placeholder,
  type = "text",
  dir = "rtl",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [existingValues, setExistingValues] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy-fetch distinct values for this fieldKey from custom_data JSONB
  const fetchExistingValues = useCallback(async () => {
    if (loaded) return;
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("custom_data")
        .not("custom_data", "is", null)
        .limit(500);

      if (!error && data) {
        const vals = new Set<string>();
        for (const row of data) {
          const cd = row.custom_data as any;
          if (cd && typeof cd === "object" && cd[fieldKey]) {
            const v = String(cd[fieldKey]).trim();
            if (v) vals.add(v);
          }
        }
        setExistingValues([...vals].sort((a, b) => a.localeCompare(b)));
      }
    } catch {
      // silent
    }
    setLoaded(true);
  }, [fieldKey, loaded]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const term = value.toLowerCase().trim();
    if (!term) return existingValues;
    return existingValues.filter((v) => v.toLowerCase().includes(term));
  }, [existingValues, value]);

  const toggleDropdown = async () => {
    if (!isOpen) await fetchExistingValues();
    setIsOpen((p) => !p);
    if (!isOpen) inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-1">
        <Input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!loaded) fetchExistingValues();
            if (existingValues.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={cn(
            "flex-1 h-9",
            dir === "ltr" ? "text-left" : "text-right",
          )}
          dir={dir}
          onFocus={async () => {
            await fetchExistingValues();
            if (existingValues.length > 0) setIsOpen(true);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-primary/30 hover:bg-primary/10"
          onClick={toggleDropdown}
          title="בחר מרשימה קיימת"
        >
          {isOpen ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5 text-primary" />
          )}
        </Button>
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-[500] top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-36 overflow-y-auto">
          {filtered.map((val) => (
            <button
              key={val}
              type="button"
              className={cn(
                "w-full text-right px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between",
                val === value && "bg-accent/50 font-medium",
              )}
              onClick={() => {
                onChange(val);
                setIsOpen(false);
              }}
            >
              <span className="truncate">{val}</span>
              {val === value && (
                <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────
// SmartSelectField — select dropdown + edit-options +
// quick-add new option inline
// ──────────────────────────────────────────────────────
interface SmartSelectFieldProps {
  def: CustomFieldDefinition;
  value: string;
  onChange: (value: string) => void;
  onUpdateOptions: (newOptions: string[]) => Promise<boolean>;
}

const SmartSelectField: React.FC<SmartSelectFieldProps> = ({
  def,
  value,
  onChange,
  onUpdateOptions,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const [newOption, setNewOption] = useState("");

  const openEditor = () => {
    setOptionsText((def.options || []).join("\n"));
    setIsEditing(true);
  };

  const saveOptions = async () => {
    const opts = optionsText
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);
    const ok = await onUpdateOptions(opts);
    if (ok) setIsEditing(false);
  };

  const addQuickOption = async () => {
    if (!newOption.trim()) return;
    const opts = [...(def.options || []), newOption.trim()];
    const ok = await onUpdateOptions(opts);
    if (ok) {
      onChange(newOption.trim());
      setNewOption("");
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <Select value={value} onValueChange={onChange} dir="rtl">
          <SelectTrigger className="text-right h-9 flex-1">
            <SelectValue placeholder={def.placeholder || "בחר..."} />
          </SelectTrigger>
          <SelectContent>
            {(def.options || []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-primary/30 hover:bg-primary/10"
          onClick={openEditor}
          title="ערוך אפשרויות"
        >
          <Pencil className="h-3.5 w-3.5 text-primary" />
        </Button>
      </div>

      {/* Quick-add option inline */}
      <div className="flex gap-1">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="הוסף אפשרות חדשה..."
          className="h-7 text-xs text-right flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addQuickOption();
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={addQuickOption}
          disabled={!newOption.trim()}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Full options editor dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent dir="rtl" className="max-w-xs">
          <DialogHeader className="text-right">
            <DialogTitle>עריכת אפשרויות - {def.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              שורה לכל אפשרות
            </Label>
            <Textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={6}
              className="text-right text-sm"
              placeholder={`אפשרות 1\nאפשרות 2\nאפשרות 3`}
            />
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              ביטול
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={saveOptions}
            >
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ──────────────────────────────────────────────────────
// Main CustomFieldsSection component
// ──────────────────────────────────────────────────────

interface CustomFieldsSectionProps {
  definitions: CustomFieldDefinition[];
  values: CustomFieldValues;
  onChange: (values: CustomFieldValues) => void;
  onAddField: (
    field: NewFieldDefinition,
  ) => Promise<CustomFieldDefinition | null>;
  onDeleteField: (fieldId: string) => Promise<boolean>;
  onUpdateField: (
    fieldId: string,
    updates: Partial<
      Pick<
        CustomFieldDefinition,
        "label" | "field_type" | "options" | "placeholder" | "is_required"
      >
    >,
  ) => Promise<boolean>;
  isLoading?: boolean;
  showManageButton?: boolean;
}

const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
  definitions,
  values,
  onChange,
  onAddField,
  onDeleteField,
  onUpdateField,
  isLoading,
  showManageButton = true,
}) => {
  const [isManageMode, setIsManageMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Inline add-field form (appears inside the dialog, not a sub-dialog)
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] =
    useState<CustomFieldDefinition["field_type"]>("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const newFieldInputRef = useRef<HTMLInputElement>(null);

  const handleValueChange = (fieldKey: string, val: string) => {
    onChange({ ...values, [fieldKey]: val });
  };

  const handleAddField = async () => {
    if (!newFieldLabel.trim()) return;
    const opts =
      newFieldType === "select"
        ? newFieldOptions
            .split("\n")
            .map((o) => o.trim())
            .filter(Boolean)
        : [];

    const result = await onAddField({
      label: newFieldLabel,
      field_type: newFieldType,
      options: opts,
      placeholder: newFieldPlaceholder,
    });

    if (result) {
      setNewFieldLabel("");
      setNewFieldType("text");
      setNewFieldOptions("");
      setNewFieldPlaceholder("");
      setIsAddingField(false);
    }
  };

  const resetAddField = () => {
    setIsAddingField(false);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldOptions("");
    setNewFieldPlaceholder("");
  };

  const handleDeleteField = async () => {
    if (!deleteConfirmId) return;
    await onDeleteField(deleteConfirmId);
    const def = definitions.find((d) => d.id === deleteConfirmId);
    if (def) {
      const v = { ...values };
      delete v[def.field_key];
      onChange(v);
    }
    setDeleteConfirmId(null);
  };

  // Render the appropriate input per field type
  const renderFieldInput = (def: CustomFieldDefinition) => {
    const val = values[def.field_key] || "";

    if (def.field_type === "select") {
      return (
        <SmartSelectField
          def={def}
          value={val}
          onChange={(v) => handleValueChange(def.field_key, v)}
          onUpdateOptions={async (opts) =>
            onUpdateField(def.id, { options: opts })
          }
        />
      );
    }

    if (def.field_type === "textarea") {
      return (
        <Textarea
          value={val}
          onChange={(e) => handleValueChange(def.field_key, e.target.value)}
          placeholder={def.placeholder || def.label}
          className="text-right"
          rows={2}
        />
      );
    }

    if (def.field_type === "date") {
      return (
        <Input
          type="date"
          value={val}
          onChange={(e) => handleValueChange(def.field_key, e.target.value)}
          className="text-left h-9"
          dir="ltr"
        />
      );
    }

    // text / number / email / phone → SmartCustomInput with "+" auto-suggest
    const inputType =
      def.field_type === "number"
        ? "number"
        : def.field_type === "email"
          ? "email"
          : def.field_type === "phone"
            ? "tel"
            : "text";

    const inputDir =
      def.field_type === "email" ||
      def.field_type === "phone" ||
      def.field_type === "number"
        ? "ltr"
        : "rtl";

    return (
      <SmartCustomInput
        fieldKey={def.field_key}
        value={val}
        onChange={(v) => handleValueChange(def.field_key, v)}
        placeholder={
          def.placeholder ||
          (def.field_type === "phone" ? "050-000-0000" : def.label)
        }
        type={inputType}
        dir={inputDir}
      />
    );
  };

  if (isLoading) return null;

  const hasFields = definitions.length > 0;

  return (
    <>
      {/* ── Existing custom fields ── */}
      {hasFields && (
        <div className="border-t pt-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-muted-foreground">
              שדות מותאמים אישית
            </Label>
            {showManageButton && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsManageMode(!isManageMode)}
                className="h-7 px-2 text-xs"
              >
                <Settings2 className="h-3 w-3 ml-1" />
                {isManageMode ? "סיום" : "נהל"}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {definitions.map((def) => (
              <div key={def.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-right text-xs">
                    {def.label}
                    {def.is_required && (
                      <span className="text-red-500 mr-1">*</span>
                    )}
                  </Label>
                  {isManageMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(def.id)}
                      className="h-5 w-5 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {renderFieldInput(def)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Inline Add-Field (inside the dialog itself) ── */}
      {showManageButton && (
        <div className={hasFields ? "mt-3" : "border-t pt-4 mt-2"}>
          {!isAddingField ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddingField(true);
                setTimeout(() => newFieldInputRef.current?.focus(), 50);
              }}
              className="w-full border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50 gap-2"
            >
              <Plus className="h-4 w-4" />
              הוסף שדה
            </Button>
          ) : (
            <div className="rounded-lg border-2 border-primary/30 bg-muted/30 p-3 space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">שדה חדש</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={resetAddField}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Field name + type side-by-side */}
              <div className="flex gap-2">
                <Input
                  ref={newFieldInputRef}
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder='שם השדה (למשל: "סוג נכס")'
                  className="text-right flex-1 h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFieldLabel.trim()) {
                      e.preventDefault();
                      handleAddField();
                    }
                  }}
                />
                <Select
                  value={newFieldType}
                  onValueChange={(v) =>
                    setNewFieldType(v as CustomFieldDefinition["field_type"])
                  }
                  dir="rtl"
                >
                  <SelectTrigger className="w-[120px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>
                        {ft.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Placeholder */}
              <Input
                value={newFieldPlaceholder}
                onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                placeholder="טקסט רמז (אופציונלי)"
                className="text-right h-8 text-xs"
              />

              {/* Options for select type */}
              {newFieldType === "select" && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    אפשרויות (שורה לכל אפשרות)
                  </Label>
                  <Textarea
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder={`אפשרות 1\nאפשרות 2\nאפשרות 3`}
                    className="text-right text-sm"
                    rows={3}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={resetAddField}
                >
                  ביטול
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs bg-green-600 hover:bg-green-700 gap-1"
                  disabled={!newFieldLabel.trim()}
                  onClick={handleAddField}
                >
                  <Plus className="h-3.5 w-3.5" />
                  הוסף
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              מחיקת שדה מותאם
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם למחוק שדה זה? הנתונים שהוזנו בשדה זה בלקוחות קיימים יישארו
              ב-DB אך לא יוצגו עוד.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteField}
              className="bg-red-600 hover:bg-red-700"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CustomFieldsSection;
