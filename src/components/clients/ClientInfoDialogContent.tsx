import React, { useState, useCallback } from "react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  FileText,
  MessageSquare,
  DollarSign,
  FolderKanban,
  CheckSquare,
  Pencil,
  ExternalLink,
  Eye,
  Hash,
  User,
  Briefcase,
  BarChart3,
  Trash2,
  Check,
  X,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { isValidPhone, formatPhoneDisplay } from "@/utils/phoneValidation";
import { useToast } from "@/hooks/use-toast";
import type { ClientDetails } from "@/hooks/useClientData";
import type { CustomFieldDefinition, NewFieldDefinition, CustomFieldValues } from "@/hooks/useClientCustomFields";

// Status badge
const StatusBadge = ({ status }: { status: string | null }) => {
  const config: Record<string, { label: string; color: string }> = {
    active: { label: "פעיל", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    inactive: { label: "לא פעיל", color: "bg-slate-50 text-slate-600 border-slate-200" },
    lead: { label: "ליד", color: "bg-sky-50 text-sky-700 border-sky-200" },
    prospect: { label: "פוטנציאלי", color: "bg-violet-50 text-violet-700 border-violet-200" },
  };
  const { label, color } = config[status || "active"] || config.active;
  return <Badge className={`${color} border font-medium`}>{label}</Badge>;
};

// Section header component
const SectionHeader = ({
  icon: Icon,
  label,
  accentColor = "primary",
}: {
  icon: React.ElementType;
  label: string;
  accentColor?: string;
}) => (
  <div className="flex items-center gap-3 mb-1">
    <div className="h-7 w-7 rounded-lg bg-[#d8ac27]/15 border border-[#d8ac27]/30 flex items-center justify-center">
      <Icon className="h-4 w-4 text-[#d8ac27]" />
    </div>
    <h4 className="text-sm font-black text-foreground tracking-wide">{label}</h4>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#d8ac27]/25 to-[#d8ac27]/40" />
  </div>
);

// Single field card with hover edit/delete
const FieldCard = ({
  icon: Icon,
  label,
  value,
  fieldKey,
  mono = false,
  colSpan2 = false,
  href,
  iconColor,
  hoverColor,
  onEdit,
  onDelete,
  isEditing,
  editValue,
  onEditChange,
  onEditSave,
  onEditCancel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  fieldKey: string;
  mono?: boolean;
  colSpan2?: boolean;
  href?: string;
  iconColor?: string;
  hoverColor?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (v: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
}) => {
  const Wrapper = href ? "a" : "div";
  const linkProps = href
    ? { href, target: href.startsWith("http") || href.startsWith("mailto") ? "_blank" : undefined, rel: "noopener noreferrer" }
    : {};

  if (isEditing) {
    return (
      <div className={`flex items-center gap-3 p-3.5 rounded-xl bg-[#d8ac27]/5 border-2 border-[#d8ac27]/40 ${colSpan2 ? "col-span-2" : ""}`}>
        <div className="h-9 w-9 rounded-lg bg-[#d8ac27]/10 border border-[#d8ac27]/20 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-[#d8ac27]" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground font-semibold mb-0.5">{label}</p>
          <Input
            value={editValue || ""}
            onChange={(e) => onEditChange?.(e.target.value)}
            className="h-7 text-sm border-primary/20"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onEditSave?.();
              if (e.key === "Escape") onEditCancel?.();
            }}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:bg-green-100" onClick={onEditSave}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={onEditCancel}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Wrapper
      {...(linkProps as any)}
      className={`group/field relative flex items-center gap-3.5 p-3.5 rounded-xl bg-muted/20 border border-[#d8ac27]/25 ${hoverColor || "hover:bg-[#d8ac27]/5 hover:border-[#d8ac27]/40"} transition-all ${colSpan2 ? "col-span-2" : ""} ${href ? "cursor-pointer" : ""}`}
    >
      <div className={`h-9 w-9 rounded-lg ${iconColor || "bg-[#d8ac27]/10"} border border-[#d8ac27]/20 flex items-center justify-center flex-shrink-0 transition-colors`}>
        <Icon className={`h-4.5 w-4.5 ${iconColor ? "" : "text-[#d8ac27]"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground font-semibold mb-0.5">{label}</p>
        <p className={`text-base font-bold truncate ${mono ? "font-mono" : ""}`} dir={mono ? "ltr" : undefined}>{value}</p>
      </div>
      {/* Hover actions */}
      {(onEdit || onDelete) && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 opacity-0 group-hover/field:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-md hover:bg-primary/15 text-muted-foreground hover:text-primary"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </Wrapper>
  );
};

interface ClientInfoDialogContentProps {
  client: ClientDetails;
  stats: {
    activeProjects: number;
    thisMonthHours: number;
    totalRevenue: number;
    openTasks: number;
  };
  customFieldDefs: CustomFieldDefinition[];
  parseCustomData: (data: any) => CustomFieldValues;
  updateClient: (updates: Partial<ClientDetails>) => Promise<boolean>;
  buildCustomData: (values: CustomFieldValues) => Record<string, any>;
  addCustomField: (field: NewFieldDefinition) => Promise<CustomFieldDefinition | null>;
  deleteCustomField: (fieldId: string) => Promise<boolean>;
  onClose: () => void;
  onEdit: () => void;
  refresh: () => void;
}

export function ClientInfoDialogContent({
  client,
  stats,
  customFieldDefs,
  parseCustomData,
  updateClient,
  buildCustomData,
  addCustomField,
  deleteCustomField,
  onClose,
  onEdit,
  refresh,
}: ClientInfoDialogContentProps) {
  const { toast } = useToast();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldDefinition["field_type"]>("text");

  // Section visibility (supports dynamic keys for custom fields: "field_<field_key>")
  const [sections, setSections] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem("client-info-dialog-sections");
      return { identity: true, contact: true, location: true, notes: true, stats: true, custom: true, ...(s ? JSON.parse(s) : {}) };
    } catch {
      return { identity: true, contact: true, location: true, notes: true, stats: true, custom: true };
    }
  });

  const isFieldVisible = (fieldKey: string) => {
    const key = `field_${fieldKey}`;
    return sections[key] !== false; // default visible
  };

  const toggleSection = (key: string) => {
    const updated = { ...sections, [key]: sections[key] === false ? true : !sections[key] };
    setSections(updated);
    localStorage.setItem("client-info-dialog-sections", JSON.stringify(updated));
  };

  // Field completion
  const allFields = [
    { key: "name", label: "שם", filled: !!client.name },
    { key: "id_number", label: "ת.ז / ח.פ", filled: !!client.id_number },
    { key: "company", label: "חברה", filled: !!client.company },
    { key: "email", label: "אימייל", filled: !!client.email },
    { key: "phone", label: "טלפון ראשי", filled: !!client.phone },
    { key: "phone_secondary", label: "טלפון משני", filled: !!client.phone_secondary },
    { key: "whatsapp", label: "WhatsApp", filled: !!client.whatsapp },
    { key: "website", label: "אתר", filled: !!client.website },
    { key: "linkedin", label: "LinkedIn", filled: !!client.linkedin },
    { key: "address", label: "כתובת", filled: !!client.address },
    { key: "source", label: "מקור", filled: !!client.source },
    { key: "budget_range", label: "טווח תקציב", filled: !!client.budget_range },
    { key: "gush", label: "גוש", filled: !!client.gush },
    { key: "helka", label: "חלקה", filled: !!client.helka },
    { key: "taba", label: 'תב"א', filled: !!client.taba },
    { key: "migrash", label: "מגרש", filled: !!client.migrash },
    { key: "notes", label: "הערות", filled: !!client.notes },
  ];
  const filledCount = allFields.filter((f) => f.filled).length;
  const totalCount = allFields.length;
  const completionPct = Math.round((filledCount / totalCount) * 100);

  // Inline edit handlers
  const startEdit = (fieldKey: string, currentValue: string) => {
    setEditingField(fieldKey);
    setEditValue(currentValue || "");
  };

  const saveEdit = async () => {
    if (!editingField) return;

    // Check if it's a custom field
    const customData = parseCustomData((client as any).custom_data);
    const isCustom = customFieldDefs.some((d) => d.field_key === editingField);

    if (isCustom) {
      const updatedCustom = { ...customData, [editingField]: editValue };
      const built = buildCustomData(updatedCustom);
      await updateClient({ custom_data: built } as any);
    } else {
      await updateClient({ [editingField]: editValue || null } as any);
    }

    setEditingField(null);
    setEditValue("");
    refresh();
    toast({ title: "השדה עודכן בהצלחה" });
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleDeleteField = async (fieldKey: string) => {
    // Clear the field value
    const isCustom = customFieldDefs.some((d) => d.field_key === fieldKey);
    if (isCustom) {
      const def = customFieldDefs.find((d) => d.field_key === fieldKey);
      if (def) {
        await deleteCustomField(def.id);
        // Also remove from client custom_data
        const customData = parseCustomData((client as any).custom_data);
        delete customData[fieldKey];
        const built = buildCustomData(customData);
        await updateClient({ custom_data: built } as any);
      }
    } else {
      await updateClient({ [fieldKey]: null } as any);
    }
    refresh();
    toast({ title: "השדה נמחק" });
  };

  // Add custom field
  const handleAddField = async () => {
    if (!newFieldLabel.trim()) return;
    const result = await addCustomField({
      label: newFieldLabel.trim(),
      field_type: newFieldType,
    });
    if (result) {
      setNewFieldLabel("");
      setNewFieldType("text");
      setIsAddingField(false);
    }
  };

  // Custom field values
  const customValues = parseCustomData((client as any).custom_data);

  return (
    <>
      {/* Premium Header */}
      <div className="relative bg-gradient-to-bl from-[#d8ac27]/12 via-[#d8ac27]/5 to-transparent px-6 pt-6 pb-4 border-b border-[#d8ac27]/20">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#d8ac27] to-[#b8922a] shadow-lg shadow-[#d8ac27]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-white">{client.name?.charAt(0) || "?"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <DialogHeader className="p-0 space-y-0">
              <DialogTitle className="text-xl font-black tracking-tight">{client.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StatusBadge status={client.status} />
                {client.stage && (
                  <Badge variant="outline" className="text-[10px] border-[#d8ac27]/30 text-[#d8ac27]">
                    {client.stage}
                  </Badge>
                )}
                {client.company && <span className="text-xs text-muted-foreground">• {client.company}</span>}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-[#d8ac27]/10">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-3" dir="rtl">
                <p className="text-xs font-semibold text-muted-foreground mb-2">הצג/הסתר מקטעים</p>
                <div className="space-y-2">
                  {[
                    { key: "identity", label: "זיהוי", icon: Hash },
                    { key: "contact", label: "פרטי התקשרות", icon: Phone },
                    { key: "location", label: "כתובת ומיקום", icon: MapPin },
                    { key: "notes", label: "הערות", icon: FileText },
                    { key: "custom", label: "שדות מותאמים", icon: Sparkles },
                    { key: "stats", label: "סטטיסטיקות", icon: BarChart3 },
                  ].map((s) => (
                    <div key={s.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.label}
                      </div>
                      <Switch
                        checked={sections[s.key as keyof typeof sections]}
                        onCheckedChange={() => toggleSection(s.key)}
                      />
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-[#d8ac27]/10" onClick={onEdit}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Completion Bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[#d8ac27] to-[#d8ac27]/60 transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-[#d8ac27] tabular-nums">{completionPct}%</span>
          <span className="text-[10px] text-muted-foreground">
            {filledCount}/{totalCount} שדות
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
        {/* Identity */}
        {sections.identity && (client.id_number || client.company || client.source || client.budget_range) && (
          <div className="space-y-3">
            <SectionHeader icon={Hash} label="זיהוי" />
            <div className="grid grid-cols-2 gap-2">
              {client.id_number && (
                <FieldCard
                  icon={Hash}
                  label="ת.ז / ח.פ"
                  value={client.id_number}
                  fieldKey="id_number"
                  mono
                  onEdit={() => startEdit("id_number", client.id_number || "")}
                  onDelete={() => handleDeleteField("id_number")}
                  isEditing={editingField === "id_number"}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onEditSave={saveEdit}
                  onEditCancel={cancelEdit}
                />
              )}
              {client.company && (
                <FieldCard
                  icon={Building}
                  label="חברה"
                  value={client.company}
                  fieldKey="company"
                  onEdit={() => startEdit("company", client.company || "")}
                  onDelete={() => handleDeleteField("company")}
                  isEditing={editingField === "company"}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onEditSave={saveEdit}
                  onEditCancel={cancelEdit}
                />
              )}
              {client.source && (
                <FieldCard
                  icon={User}
                  label="מקור"
                  value={client.source}
                  fieldKey="source"
                  onEdit={() => startEdit("source", client.source || "")}
                  onDelete={() => handleDeleteField("source")}
                  isEditing={editingField === "source"}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onEditSave={saveEdit}
                  onEditCancel={cancelEdit}
                />
              )}
              {client.budget_range && (
                <FieldCard
                  icon={Briefcase}
                  label="טווח תקציב"
                  value={client.budget_range}
                  fieldKey="budget_range"
                  onEdit={() => startEdit("budget_range", client.budget_range || "")}
                  onDelete={() => handleDeleteField("budget_range")}
                  isEditing={editingField === "budget_range"}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onEditSave={saveEdit}
                  onEditCancel={cancelEdit}
                />
              )}
            </div>
          </div>
        )}

        {/* Contact */}
        {sections.contact && (
          <>
            {sections.identity && (client.id_number || client.company || client.source || client.budget_range) && <Separator className="opacity-40" />}
            <div className="space-y-3">
              <SectionHeader icon={Phone} label="פרטי התקשרות" />
              <div className="grid grid-cols-2 gap-2">
                {isValidPhone(client.phone) && (
                  <FieldCard
                    icon={Phone}
                    label="טלפון ראשי"
                    value={formatPhoneDisplay(client.phone)}
                    fieldKey="phone"
                    mono
                    href={`tel:${client.phone}`}
                    onEdit={() => startEdit("phone", client.phone || "")}
                    onDelete={() => handleDeleteField("phone")}
                    isEditing={editingField === "phone"}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onEditSave={saveEdit}
                    onEditCancel={cancelEdit}
                  />
                )}
                {isValidPhone(client.phone_secondary) && (
                  <FieldCard
                    icon={Phone}
                    label="טלפון משני"
                    value={formatPhoneDisplay(client.phone_secondary)}
                    fieldKey="phone_secondary"
                    mono
                    href={`tel:${client.phone_secondary}`}
                    onEdit={() => startEdit("phone_secondary", client.phone_secondary || "")}
                    onDelete={() => handleDeleteField("phone_secondary")}
                    isEditing={editingField === "phone_secondary"}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onEditSave={saveEdit}
                    onEditCancel={cancelEdit}
                  />
                )}
                {client.whatsapp && (
                  <FieldCard
                    icon={MessageSquare}
                    label="WhatsApp"
                    value={client.whatsapp}
                    fieldKey="whatsapp"
                    mono
                    href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`}
                    iconColor="bg-green-500/10"
                    hoverColor="hover:bg-green-500/5 hover:border-green-500/30"
                    onEdit={() => startEdit("whatsapp", client.whatsapp || "")}
                    onDelete={() => handleDeleteField("whatsapp")}
                    isEditing={editingField === "whatsapp"}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onEditSave={saveEdit}
                    onEditCancel={cancelEdit}
                  />
                )}
                {client.email && (
                  <FieldCard
                    icon={Mail}
                    label="אימייל"
                    value={client.email}
                    fieldKey="email"
                    href={`mailto:${client.email}`}
                    onEdit={() => startEdit("email", client.email || "")}
                    onDelete={() => handleDeleteField("email")}
                    isEditing={editingField === "email"}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onEditSave={saveEdit}
                    onEditCancel={cancelEdit}
                  />
                )}
                {client.website && (
                  <FieldCard
                    icon={Globe}
                    label="אתר"
                    value={client.website}
                    fieldKey="website"
                    href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                    onEdit={() => startEdit("website", client.website || "")}
                    onDelete={() => handleDeleteField("website")}
                    isEditing={editingField === "website"}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onEditSave={saveEdit}
                    onEditCancel={cancelEdit}
                  />
                )}
                {client.linkedin && (
                  <FieldCard
                    icon={ExternalLink}
                    label="LinkedIn"
                    value="פרופיל"
                    fieldKey="linkedin"
                    href={client.linkedin}
                    iconColor="bg-blue-500/10"
                    hoverColor="hover:bg-blue-500/5 hover:border-blue-500/30"
                    onEdit={() => startEdit("linkedin", client.linkedin || "")}
                    onDelete={() => handleDeleteField("linkedin")}
                    isEditing={editingField === "linkedin"}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onEditSave={saveEdit}
                    onEditCancel={cancelEdit}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Location */}
        {sections.location && (client.address || client.gush) && (
          <>
            <Separator className="opacity-40" />
            <div className="space-y-3">
              <SectionHeader icon={MapPin} label="כתובת ומיקום" />
              <div className="grid grid-cols-2 gap-2">
                {client.address && (
                  <FieldCard
                    icon={MapPin}
                    label="כתובת"
                    value={client.address}
                    fieldKey="address"
                    colSpan2
                    onEdit={() => startEdit("address", client.address || "")}
                    onDelete={() => handleDeleteField("address")}
                    isEditing={editingField === "address"}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onEditSave={saveEdit}
                    onEditCancel={cancelEdit}
                  />
                )}
                {client.gush && (
                  <FieldCard icon={Hash} label="גוש" value={client.gush} fieldKey="gush" mono onEdit={() => startEdit("gush", client.gush || "")} onDelete={() => handleDeleteField("gush")} isEditing={editingField === "gush"} editValue={editValue} onEditChange={setEditValue} onEditSave={saveEdit} onEditCancel={cancelEdit} />
                )}
                {client.helka && (
                  <FieldCard icon={Hash} label="חלקה" value={client.helka} fieldKey="helka" mono onEdit={() => startEdit("helka", client.helka || "")} onDelete={() => handleDeleteField("helka")} isEditing={editingField === "helka"} editValue={editValue} onEditChange={setEditValue} onEditSave={saveEdit} onEditCancel={cancelEdit} />
                )}
                {client.taba && (
                  <FieldCard icon={Hash} label='תב"א' value={client.taba} fieldKey="taba" mono onEdit={() => startEdit("taba", client.taba || "")} onDelete={() => handleDeleteField("taba")} isEditing={editingField === "taba"} editValue={editValue} onEditChange={setEditValue} onEditSave={saveEdit} onEditCancel={cancelEdit} />
                )}
                {client.migrash && (
                  <FieldCard icon={Hash} label="מגרש" value={client.migrash} fieldKey="migrash" mono onEdit={() => startEdit("migrash", client.migrash || "")} onDelete={() => handleDeleteField("migrash")} isEditing={editingField === "migrash"} editValue={editValue} onEditChange={setEditValue} onEditSave={saveEdit} onEditCancel={cancelEdit} />
                )}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {sections.notes && client.notes && (
          <>
            <Separator className="opacity-40" />
            <div className="space-y-3">
              <SectionHeader icon={FileText} label="הערות" />
              <div className="group/field relative p-3.5 rounded-xl bg-muted/30 border border-border/40 text-sm whitespace-pre-wrap leading-relaxed">
                {editingField === "notes" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full min-h-[80px] text-sm border border-primary/20 rounded-lg p-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      autoFocus
                    />
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>
                        ביטול
                      </Button>
                      <Button size="sm" className="h-7 text-xs" onClick={saveEdit}>
                        שמור
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {client.notes}
                    <div className="absolute top-2 left-2 opacity-0 group-hover/field:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-md hover:bg-primary/15 text-muted-foreground hover:text-primary"
                        onClick={() => startEdit("notes", client.notes || "")}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Custom Fields */}
        {sections.custom && (
          <>
            <Separator className="opacity-40" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeader icon={Sparkles} label="שדות מותאמים" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs text-primary hover:bg-primary/10"
                  onClick={() => setIsAddingField(!isAddingField)}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  הוסף שדה
                </Button>
              </div>

              {/* Add field form */}
              {isAddingField && (
                <div className="p-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-2.5">
                  <Input
                    placeholder="שם השדה..."
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddField()}
                  />
                  <div className="flex items-center gap-2">
                    <Select value={newFieldType} onValueChange={(v: any) => setNewFieldType(v)}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">טקסט</SelectItem>
                        <SelectItem value="number">מספר</SelectItem>
                        <SelectItem value="email">אימייל</SelectItem>
                        <SelectItem value="phone">טלפון</SelectItem>
                        <SelectItem value="date">תאריך</SelectItem>
                        <SelectItem value="textarea">טקסט ארוך</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 text-xs" onClick={handleAddField}>
                      הוסף
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setIsAddingField(false)}>
                      ביטול
                    </Button>
                  </div>
                </div>
              )}

              {/* Show custom fields */}
              {customFieldDefs.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {customFieldDefs.map((def) => (
                    <FieldCard
                      key={def.id}
                      icon={Sparkles}
                      label={def.label}
                      value={customValues[def.field_key] || "—"}
                      fieldKey={def.field_key}
                      onEdit={() => startEdit(def.field_key, customValues[def.field_key] || "")}
                      onDelete={() => handleDeleteField(def.field_key)}
                      isEditing={editingField === def.field_key}
                      editValue={editValue}
                      onEditChange={setEditValue}
                      onEditSave={saveEdit}
                      onEditCancel={cancelEdit}
                    />
                  ))}
                </div>
              )}

              {customFieldDefs.length === 0 && !isAddingField && (
                <p className="text-xs text-muted-foreground text-center py-3">אין שדות מותאמים. לחץ על "הוסף שדה" כדי להתחיל.</p>
              )}
            </div>
          </>
        )}

        {/* Stats */}
        {sections.stats && (
          <>
            <Separator className="opacity-40" />
            <div className="space-y-3">
              <SectionHeader icon={BarChart3} label="סטטיסטיקות" />
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/15">
                  <FolderKanban className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-black text-primary">{stats.activeProjects}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">פרויקטים</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-accent/50 border border-accent/30">
                  <Clock className="h-5 w-5 text-accent-foreground mx-auto mb-1" />
                  <p className="text-lg font-black">{stats.thisMonthHours}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">שעות</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                  <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-green-500">₪{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">הכנסות</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
                  <CheckSquare className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-orange-500">{stats.openTasks}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">משימות</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
