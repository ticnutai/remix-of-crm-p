import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CheckCheck, FolderPlus, ListPlus, Loader2, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClientCustomFields, type CustomFieldDefinition } from "@/hooks/useClientCustomFields";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ClientRow = {
  id: string;
  name: string;
  custom_data: Record<string, unknown> | null;
  [key: string]: unknown;
};

type BulkField = {
  key: string;
  column?: string;
  label: string;
  section: string;
  custom?: CustomFieldDefinition;
};

const BUILT_IN_FIELDS: BulkField[] = [
  { key: "email", column: "email", label: "אימייל", section: "פרטים בסיסיים" },
  { key: "phone", column: "phone", label: "טלפון", section: "פרטים בסיסיים" },
  { key: "company", column: "company", label: "חברה", section: "פרטים בסיסיים" },
  { key: "street", column: "street", label: "רחוב", section: "כתובת ומיקום" },
  { key: "moshav", column: "moshav", label: "מושב / יישוב", section: "כתובת ומיקום" },
  { key: "idNumber", column: "id_number", label: "ת.ז / ח.פ", section: "פרטי נדל״ן" },
  { key: "taba", column: "taba", label: "תב״ע", section: "פרטי נדל״ן" },
  { key: "gush", column: "gush", label: "גוש", section: "פרטי נדל״ן" },
  { key: "helka", column: "helka", label: "חלקה", section: "פרטי נדל״ן" },
  { key: "migrash", column: "migrash", label: "מגרש", section: "פרטי נדל״ן" },
  { key: "agudaAddress", column: "aguda_address", label: "כתובת ועד האגודה", section: "ועד האגודה" },
  { key: "agudaEmail", column: "aguda_email", label: "מייל ועד האגודה", section: "ועד האגודה" },
  { key: "vaadMoshavAddress", column: "vaad_moshav_address", label: "כתובת ועד המושב", section: "ועד המושב" },
  { key: "vaadMoshavEmail", column: "vaad_moshav_email", label: "מייל ועד המושב", section: "ועד המושב" },
];

const valueOf = (client: ClientRow, field: BulkField): string => {
  const raw = field.custom
    ? client.custom_data?.[field.custom.field_key]
    : client[field.column || field.key];
  return raw == null ? "" : String(raw).trim();
};

const quickOptionKey = (field: BulkField): string => field.column || field.key;

export function BulkClientFieldsDialog({
  open,
  onOpenChange,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}) {
  const { user } = useAuth();
  const { definitions, addField, updateField } = useClientCustomFields({ enabled: open });
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [quickOptions, setQuickOptions] = useState<Record<string, string[]>>({});
  const [fieldKey, setFieldKey] = useState("");
  const [value, setValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [baseline, setBaseline] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingOption, setDeletingOption] = useState("");
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldSection, setNewFieldSection] = useState("שדות מותאמים אישית");
  const [newFieldOption, setNewFieldOption] = useState("");
  const [creatingField, setCreatingField] = useState(false);

  const fields = useMemo<BulkField[]>(() => [
    ...BUILT_IN_FIELDS,
    ...definitions.map((custom) => ({
      key: `custom:${custom.field_key}`,
      label: custom.label,
      section: custom.section || "שדות מותאמים אישית",
      custom,
    })),
  ], [definitions]);
  const field = fields.find((item) => item.key === fieldKey);
  const sections = useMemo(() => Array.from(new Set(fields.map((item) => item.section).filter(Boolean))), [fields]);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const columns = ["id", "name", "custom_data", ...BUILT_IN_FIELDS.map((f) => f.column)].filter(Boolean).join(",");
      const [clientsResult, optionsResult] = await Promise.all([
        supabase.from("clients").select(columns).order("name"),
        user?.id
          ? supabase.from("field_quick_options" as any).select("field_name,option_value,sort_order").eq("user_id", user.id).order("sort_order")
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (clientsResult.error) throw clientsResult.error;
      if (optionsResult.error) throw optionsResult.error;
      setClients((clientsResult.data || []) as unknown as ClientRow[]);
      const grouped: Record<string, string[]> = {};
      for (const row of (optionsResult.data || []) as any[]) {
        grouped[row.field_name] = [...(grouped[row.field_name] || []), String(row.option_value)];
      }
      setQuickOptions(grouped);
    } catch (error) {
      console.error("Bulk fields load failed", error);
      toast({ title: "לא ניתן לטעון את השדות והלקוחות", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [open, user?.id]);

  useEffect(() => { void load(); }, [load]);

  const options = useMemo(() => {
    if (!field) return [];
    const saved = field.custom ? field.custom.options || [] : quickOptions[quickOptionKey(field)] || [];
    const used = clients.map((client) => valueOf(client, field)).filter(Boolean);
    return Array.from(new Set([...saved, ...used])).sort((a, b) => a.localeCompare(b, "he"));
  }, [clients, field, quickOptions]);

  useEffect(() => {
    if (!field || !value) {
      setSelected(new Set());
      setBaseline(new Set());
      return;
    }
    const ids = new Set(clients.filter((client) => valueOf(client, field) === value).map((client) => client.id));
    setSelected(new Set(ids));
    setBaseline(new Set(ids));
  }, [clients, fieldKey, value]);

  const visibleClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("he");
    return !query ? clients : clients.filter((client) => client.name.toLocaleLowerCase("he").includes(query));
  }, [clients, search]);

  const addOption = async () => {
    const next = newValue.trim();
    if (!field || !next) return;
    try {
      if (field.custom) {
        const nextOptions = Array.from(new Set([...(field.custom.options || []), next]));
        if (!(await updateField(field.custom.id, { options: nextOptions }))) return;
      } else {
        if (!user?.id) throw new Error("No user");
        const optionKey = quickOptionKey(field);
        const { error } = await supabase.from("field_quick_options" as any).upsert({
          user_id: user.id,
          field_name: optionKey,
          option_value: next,
          sort_order: (quickOptions[optionKey]?.length || 0) + 1,
        }, { onConflict: "user_id,field_name,option_value" });
        if (error) throw error;
        setQuickOptions((prev) => ({ ...prev, [optionKey]: Array.from(new Set([...(prev[optionKey] || []), next])) }));
      }
      setValue(next);
      setNewValue("");
    } catch (error) {
      console.error("Add quick option failed", error);
      toast({ title: "לא ניתן לשמור את האפשרות", variant: "destructive" });
    }
  };

  const createField = async () => {
    const label = newFieldLabel.trim();
    const section = newFieldSection.trim() || "שדות מותאמים אישית";
    const firstOption = newFieldOption.trim();
    if (!label || creatingField) return;
    setCreatingField(true);
    try {
      const created = await addField({
        label,
        section,
        field_type: "select",
        options: firstOption ? [firstOption] : [],
        placeholder: `בחר ${label}`,
      });
      if (!created) return;
      setFieldKey(`custom:${created.field_key}`);
      setValue(firstOption);
      setNewFieldLabel("");
      setNewFieldSection("שדות מותאמים אישית");
      setNewFieldOption("");
      setShowNewField(false);
      toast({
        title: "השדה מוכן לשיוך",
        description: firstOption ? `אפשר כעת לבחור לקוחות עבור „${firstOption}”` : "הוסף ערך שמור ובחר לקוחות",
      });
    } finally {
      setCreatingField(false);
    }
  };

  const deleteOption = async (option: string) => {
    if (!field || !option || deletingOption) return;
    const assignedClients = clients.filter((client) => valueOf(client, field) === option);
    const usageMessage = assignedClients.length
      ? `הערך משויך ל־${assignedClients.length} לקוחות. המחיקה תסיר גם את הערך מהלקוחות האלה.`
      : "הערך יוסר מרשימת הערכים השמורים.";
    if (!window.confirm(`למחוק את הערך „${option}”?\n${usageMessage}`)) return;

    setDeletingOption(option);
    try {
      if (field.custom) {
        const nextOptions = (field.custom.options || []).filter((item) => item !== option);
        if (!(await updateField(field.custom.id, { options: nextOptions }))) {
          throw new Error("Custom field option update failed");
        }
        for (const client of assignedClients) {
          const customData = { ...(client.custom_data || {}) } as Record<string, unknown>;
          delete customData[field.custom.field_key];
          const { error } = await supabase.from("clients").update({ custom_data: customData as any }).eq("id", client.id);
          if (error) throw error;
        }
      } else if (field.column) {
        if (assignedClients.length) {
          const { error } = await supabase
            .from("clients")
            .update({ [field.column]: null })
            .in("id", assignedClients.map((client) => client.id));
          if (error) throw error;
        }
        if (user?.id) {
          const optionKey = quickOptionKey(field);
          const { error } = await supabase
            .from("field_quick_options" as any)
            .delete()
            .eq("user_id", user.id)
            .eq("field_name", optionKey)
            .eq("option_value", option);
          if (error) throw error;
          setQuickOptions((prev) => ({
            ...prev,
            [optionKey]: (prev[optionKey] || []).filter((item) => item !== option),
          }));
        }
      }

      if (value === option) setValue("");
      toast({
        title: "הערך נמחק",
        description: assignedClients.length ? `השיוך הוסר מ־${assignedClients.length} לקוחות` : undefined,
      });
      await load();
      onUpdated?.();
    } catch (error) {
      console.error("Delete quick option failed", error);
      toast({ title: "מחיקת הערך נכשלה", variant: "destructive" });
    } finally {
      setDeletingOption("");
    }
  };

  const save = async () => {
    if (!field || !value) return;
    setSaving(true);
    try {
      const added = [...selected].filter((id) => !baseline.has(id));
      const removed = [...baseline].filter((id) => !selected.has(id));
      if (field.custom) {
        const byId = new Map(clients.map((client) => [client.id, client]));
        for (const id of [...added, ...removed]) {
          const client = byId.get(id);
          if (!client) continue;
          const customData = { ...(client.custom_data || {}) } as Record<string, unknown>;
          if (added.includes(id)) customData[field.custom.field_key] = value;
          else delete customData[field.custom.field_key];
          const { error } = await supabase.from("clients").update({ custom_data: customData as any }).eq("id", id);
          if (error) throw error;
        }
      } else if (field.column) {
        if (added.length) {
          const { error } = await supabase.from("clients").update({ [field.column]: value }).in("id", added);
          if (error) throw error;
        }
        if (removed.length) {
          const { error } = await supabase.from("clients").update({ [field.column]: null }).in("id", removed);
          if (error) throw error;
        }
      }
      toast({ title: "השדה עודכן", description: `${added.length} נוספו, ${removed.length} הוסרו` });
      await load();
      onUpdated?.();
    } catch (error) {
      console.error("Bulk field update failed", error);
      toast({ title: "עדכון השדה נכשל", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const allVisibleSelected = visibleClients.length > 0 && visibleClients.every((client) => selected.has(client.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[82vh]" contentClassName="p-0 overflow-hidden block">
        <DialogHeader className="border-b bg-gradient-to-l from-primary/10 to-background px-7 py-5">
          <DialogTitle className="flex items-center gap-3 text-2xl"><SlidersHorizontal className="h-6 w-6 text-primary" /> מילוי מהיר של שדות לקוחות</DialogTitle>
          <p className="text-sm text-muted-foreground">בחר שדה וערך, ולאחר מכן הוסף או הסר לקוחות בבחירה מרובה.</p>
        </DialogHeader>
        <div className="grid h-[calc(82vh-104px)] grid-cols-[240px_260px_1fr] divide-x divide-x-reverse" dir="rtl">
          <ScrollArea className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">1. בחירת שדה</p>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setShowNewField((current) => !current)}>
                {showNewField ? <X className="h-3.5 w-3.5" /> : <FolderPlus className="h-3.5 w-3.5" />}
                {showNewField ? "סגור" : "שדה חדש"}
              </Button>
            </div>
            {showNewField && (
              <div className="mb-4 space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3 shadow-sm">
                <p className="text-xs font-semibold text-primary">יצירת שדה למילוי מהיר</p>
                <Input value={newFieldLabel} onChange={(event) => setNewFieldLabel(event.target.value)} placeholder="שם השדה, לדוג: מספר היתר" className="h-9 bg-background" />
                <div>
                  <Input value={newFieldSection} onChange={(event) => setNewFieldSection(event.target.value)} placeholder="שם הקטגוריה" list="bulk-client-field-sections" className="h-9 bg-background" />
                  <datalist id="bulk-client-field-sections">{sections.map((section) => <option key={section} value={section} />)}</datalist>
                </div>
                <Input value={newFieldOption} onChange={(event) => setNewFieldOption(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createField(); }} placeholder="ערך שמור ראשון (אופציונלי)" className="h-9 bg-background" />
                <Button type="button" size="sm" className="w-full" onClick={() => void createField()} disabled={!newFieldLabel.trim() || creatingField}>
                  {creatingField ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Plus className="ml-2 h-4 w-4" />}
                  צור שדה והמשך לשיוך
                </Button>
              </div>
            )}
            <div className="space-y-1">
              {fields.map((item) => (
                <button key={item.key} onClick={() => { setFieldKey(item.key); setValue(""); }} className={cn("w-full rounded-lg px-3 py-2 text-right text-sm hover:bg-muted", fieldKey === item.key && "bg-primary text-primary-foreground hover:bg-primary") }>
                  <span className="block font-medium">{item.label}</span><span className="block text-[11px] opacity-70">{item.section}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="flex min-h-0 flex-col p-4">
            <p className="mb-3 text-sm font-semibold">2. בחירת ערך שמור</p>
            {!field ? <p className="text-sm text-muted-foreground">בחר שדה מהרשימה</p> : <>
              <div className="mb-3 flex gap-2"><Input value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void addOption(); }} placeholder="אפשרות חדשה..." /><Button size="icon" onClick={() => void addOption()} disabled={!newValue.trim()}><Plus className="h-4 w-4" /></Button></div>
              <ScrollArea className="min-h-0 flex-1"><div className="space-y-1 pr-1">{options.map((option) => <div key={option} className={cn("group flex w-full items-center rounded-lg border text-sm hover:bg-muted", value === option && "border-primary bg-primary/10 font-semibold")}><button type="button" onClick={() => setValue(option)} className="flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-right"><span className="truncate">{option}</span>{value === option && <Check className="h-4 w-4 shrink-0 text-primary" />}</button><button type="button" onClick={() => void deleteOption(option)} disabled={Boolean(deletingOption)} className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-55 transition hover:bg-destructive/10 hover:text-destructive hover:opacity-100 focus:opacity-100 disabled:pointer-events-none" title={`מחק את הערך ${option}`} aria-label={`מחק את הערך ${option}`}>{deletingOption === option ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></div>)}{options.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">אין עדיין אפשרויות. הוסף את הראשונה למעלה.</p>}</div></ScrollArea>
            </>}
          </div>
          <div className="flex min-h-0 flex-col p-4">
            <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">3. שיוך לקוחות</p><p className="text-xs text-muted-foreground">{value ? `הערך „${value}” משויך ל־${selected.size} לקוחות` : "בחר ערך כדי לנהל את הלקוחות"}</p></div>{value && <Button variant="outline" size="sm" onClick={() => setSelected((prev) => { const next = new Set(prev); visibleClients.forEach((client) => allVisibleSelected ? next.delete(client.id) : next.add(client.id)); return next; })}><CheckCheck className="ml-2 h-4 w-4" />{allVisibleSelected ? "בטל בחירת הכל" : "בחר הכל"}</Button>}</div>
            {value && <><div className="relative mb-3"><Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" placeholder="חיפוש לקוח..." /></div><ScrollArea className="min-h-0 flex-1 rounded-xl border"><div className="divide-y">{visibleClients.map((client) => { const checked = selected.has(client.id); const currentValue = valueOf(client, field!); return <button key={client.id} onClick={() => setSelected((prev) => { const next = new Set(prev); checked ? next.delete(client.id) : next.add(client.id); return next; })} className="flex w-full items-center gap-3 px-4 py-3 text-right hover:bg-muted/70"><span className={cn("flex h-5 w-5 items-center justify-center rounded border", checked && "border-primary bg-primary text-primary-foreground")}>{checked && <Check className="h-3.5 w-3.5" />}</span><span className="min-w-0 flex-1 truncate font-medium">{client.name}</span>{currentValue ? <span className="max-w-[45%] truncate rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" title={`ערך משויך: ${currentValue}`}>{currentValue}</span> : <span className="text-xs text-muted-foreground">ללא ערך</span>}</button>; })}</div></ScrollArea></>}
            <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>סגור</Button><Button onClick={() => void save()} disabled={!field || !value || saving}>{saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ListPlus className="ml-2 h-4 w-4" />}שמור שיוכים</Button></div>
          </div>
        </div>
        {loading && <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/70"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
      </DialogContent>
    </Dialog>
  );
}
