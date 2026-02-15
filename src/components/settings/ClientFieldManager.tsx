// Client Field Manager - Admin UI for managing client form fields
// Features: toggle visibility, profiles, drag-to-reorder, conditional fields, custom sections, export/import
import React, { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  EyeOff,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Shield,
  FormInput,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertTriangle,
  Settings2,
  Layers,
  Download,
  Upload,
  Copy,
  BookMarked,
  Sparkles,
  Link2,
  Unlink2,
  FolderPlus,
  Save,
} from "lucide-react";
import { useClientFieldConfig, type FieldProfile, type FieldCondition } from "@/hooks/useClientFieldConfig";
import { useClientCustomFields, type NewFieldDefinition, type CustomFieldDefinition } from "@/hooks/useClientCustomFields";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============ Sortable Field Item ============
function SortableFieldItem({
  field,
  onToggle,
}: {
  field: { key: string; label: string; visible: boolean; required: boolean; protected: boolean; type: string };
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between py-2 px-3 rounded-lg transition-colors",
        field.visible ? "bg-background" : "bg-muted/50",
        "hover:bg-muted/80",
        isDragging && "opacity-60 shadow-lg z-50 bg-background",
      )}
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground" />
        </button>
        {field.visible ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground/50" />
        )}
        <span className={cn("text-sm", !field.visible && "text-muted-foreground line-through")}>
          {field.label}
        </span>
        {field.required && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">חובה</Badge>
        )}
        {field.protected && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger><Shield className="h-3 w-3 text-amber-500" /></TooltipTrigger>
              <TooltipContent>שדה מוגן — לא ניתן להסתרה</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {field.type === "email" ? "אימייל" : field.type === "tel" ? "טלפון" : "טקסט"}
        </Badge>
        <Switch
          checked={field.visible}
          onCheckedChange={onToggle}
          disabled={field.protected}
          aria-label={`הצג/הסתר ${field.label}`}
        />
      </div>
    </div>
  );
}

// ============ Main Component ============
export function ClientFieldManager() {
  const {
    fields,
    sections,
    toggleField,
    toggleSection,
    resetDefaults,
    showAll,
    hiddenCount,
    visibleCount,
    totalCount,
    // Profiles
    allProfiles,
    activeProfileId,
    applyProfile,
    saveCurrentAsProfile,
    deleteProfile,
    // Ordering
    reorderFieldsInSection,
    // Conditions
    conditions,
    addCondition,
    removeCondition,
    // Custom sections
    customSections,
    addCustomSection,
    removeCustomSection,
    renameCustomSection,
    // Export/Import
    exportConfig,
    importConfig,
  } = useClientFieldConfig();

  const {
    definitions: customFieldDefs,
    isLoading: customFieldsLoading,
    addField: addCustomField,
    updateField: updateCustomField,
    deleteField: deleteCustomField,
  } = useClientCustomFields();

  const { toast } = useToast();

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // UI state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [editFieldDialog, setEditFieldDialog] = useState<CustomFieldDefinition | null>(null);
  const [deleteFieldConfirm, setDeleteFieldConfirm] = useState<string | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showConditionDialog, setShowConditionDialog] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"fields" | "profiles" | "conditions" | "sections">("fields");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New field form
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<NewFieldDefinition["field_type"]>("text");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");

  // Edit field form
  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState<NewFieldDefinition["field_type"]>("text");
  const [editPlaceholder, setEditPlaceholder] = useState("");
  const [editRequired, setEditRequired] = useState(false);
  const [editOptions, setEditOptions] = useState("");

  // Profile form
  const [profileName, setProfileName] = useState("");
  const [profileIcon, setProfileIcon] = useState("📋");
  const [profileDesc, setProfileDesc] = useState("");

  // Condition form
  const [condTarget, setCondTarget] = useState("");
  const [condDepends, setCondDepends] = useState("");
  const [condType, setCondType] = useState<"not_empty" | "empty" | "equals">("not_empty");
  const [condValue, setCondValue] = useState("");

  // Section form
  const [sectionLabel, setSectionLabel] = useState("");

  const toggleSectionCollapse = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ============ Handlers ============
  const handleAddField = async () => {
    if (!newFieldLabel.trim()) {
      toast({ title: "שגיאה", description: "יש למלא שם שדה", variant: "destructive" });
      return;
    }
    const result = await addCustomField({
      label: newFieldLabel.trim(),
      field_type: newFieldType,
      placeholder: newFieldPlaceholder.trim(),
      is_required: newFieldRequired,
      section: "custom",
      options: newFieldType === "select" ? newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    });
    if (result) {
      setAddFieldDialogOpen(false);
      setNewFieldLabel(""); setNewFieldType("text"); setNewFieldPlaceholder(""); setNewFieldRequired(false); setNewFieldOptions("");
    }
  };

  const handleEditField = async () => {
    if (!editFieldDialog || !editLabel.trim()) return;
    const success = await updateCustomField(editFieldDialog.id, {
      label: editLabel.trim(),
      field_type: editType,
      placeholder: editPlaceholder.trim(),
      is_required: editRequired,
      options: editType === "select" ? editOptions.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    });
    if (success) {
      toast({ title: "שדה עודכן בהצלחה" });
      setEditFieldDialog(null);
    }
  };

  const handleDeleteField = async () => {
    if (!deleteFieldConfirm) return;
    await deleteCustomField(deleteFieldConfirm);
    setDeleteFieldConfirm(null);
  };

  const openEditDialog = (field: CustomFieldDefinition) => {
    setEditLabel(field.label);
    setEditType(field.field_type);
    setEditPlaceholder(field.placeholder);
    setEditRequired(field.is_required);
    setEditOptions(field.options?.join(", ") || "");
    setEditFieldDialog(field);
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    saveCurrentAsProfile(profileName.trim(), profileIcon, profileDesc.trim());
    toast({ title: "פרופיל נשמר", description: `"${profileName}" נשמר בהצלחה` });
    setShowProfileDialog(false);
    setProfileName(""); setProfileIcon("📋"); setProfileDesc("");
  };

  const handleAddCondition = () => {
    if (!condTarget || !condDepends) return;
    addCondition({ targetField: condTarget, dependsOnField: condDepends, condition: condType, value: condType === "equals" ? condValue : undefined });
    toast({ title: "תנאי נוסף" });
    setShowConditionDialog(false);
    setCondTarget(""); setCondDepends(""); setCondType("not_empty"); setCondValue("");
  };

  const handleAddSection = () => {
    if (!sectionLabel.trim()) return;
    addCustomSection(sectionLabel.trim());
    toast({ title: "סקציה נוצרה", description: `"${sectionLabel}" נוספה` });
    setShowSectionDialog(false);
    setSectionLabel("");
  };

  const handleExport = () => {
    const data = exportConfig();
    navigator.clipboard.writeText(data);
    toast({ title: "הועתק!", description: "ההגדרות הועתקו ללוח — אפשר להדביק במחשב אחר" });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importConfig(ev.target?.result as string);
      toast({ title: result ? "יובא בהצלחה!" : "שגיאה בייבוא", variant: result ? "default" : "destructive" });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const result = importConfig(text);
      toast({ title: result ? "יובא בהצלחה!" : "שגיאה — הטקסט לא תקין", variant: result ? "default" : "destructive" });
    } catch {
      toast({ title: "אין גישה ללוח", variant: "destructive" });
    }
  };

  const handleDownloadExport = () => {
    const data = exportConfig();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `field-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDragEnd = (sectionKey: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sectionFields = fields.filter((f) => f.section === sectionKey);
    const oldIndex = sectionFields.findIndex((f) => f.key === active.id);
    const newIndex = sectionFields.findIndex((f) => f.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sectionFields, oldIndex, newIndex);
    reorderFieldsInSection(sectionKey, reordered.map((f) => f.key));
  };

  const fieldTypeLabels: Record<string, string> = {
    text: "טקסט", number: "מספר", date: "תאריך", select: "בחירה",
    email: "אימייל", phone: "טלפון", textarea: "טקסט ארוך",
  };

  const sectionIcons: Record<string, React.ReactNode> = {
    basic: <FormInput className="h-4 w-4" />,
    address: <Layers className="h-4 w-4" />,
    realestate: <Settings2 className="h-4 w-4" />,
    aguda: <Shield className="h-4 w-4" />,
    moshav: <Shield className="h-4 w-4" />,
  };

  const conditionLabels: Record<string, string> = {
    not_empty: "לא ריק",
    empty: "ריק",
    equals: "שווה ל-",
  };

  const profileEmojis = ["📋", "🏠", "🏘️", "👤", "✨", "⭐", "🔵", "🟢", "🟡", "🔴", "💼", "📁"];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FormInput className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">ניהול שדות לקוח</CardTitle>
                <CardDescription>
                  שליטה מלאה בשדות הטופס — הסתרה, סידור, פרופילים, תנאים ושדות מותאמים
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hiddenCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  <EyeOff className="h-3 w-3 ml-1" />{hiddenCount} מוסתרים
                </Badge>
              )}
              <Badge variant="outline">{visibleCount}/{totalCount + customFieldDefs.length} פעילים</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {([
              { key: "fields" as const, label: "שדות", icon: <FormInput className="h-3.5 w-3.5" /> },
              { key: "profiles" as const, label: "פרופילים", icon: <BookMarked className="h-3.5 w-3.5" /> },
              { key: "conditions" as const, label: "תנאים", icon: <Link2 className="h-3.5 w-3.5" /> },
              { key: "sections" as const, label: "סקציות", icon: <Layers className="h-3.5 w-3.5" /> },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-1 justify-center",
                  activeTab === tab.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={showAll}><Eye className="h-4 w-4 ml-1" />הצג הכל</Button>
            <Button variant="outline" size="sm" onClick={resetDefaults}><RotateCcw className="h-4 w-4 ml-1" />איפוס</Button>
            <Button size="sm" onClick={() => setAddFieldDialogOpen(true)}><Plus className="h-4 w-4 ml-1" />הוסף שדה</Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={handleExport}><Copy className="h-4 w-4 ml-1" />העתק הגדרות</Button>
            <Button variant="ghost" size="sm" onClick={handleDownloadExport}><Download className="h-4 w-4 ml-1" />ייצוא</Button>
            <Button variant="ghost" size="sm" onClick={handleImportClipboard}><Upload className="h-4 w-4 ml-1" />ייבוא מלוח</Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 ml-1" />ייבוא קובץ</Button>
          </div>
        </CardContent>
      </Card>

      {/* ============ FIELDS TAB ============ */}
      {activeTab === "fields" && (
        <>
          {/* Profile quick-apply bar */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground ml-2">פרופיל מהיר:</span>
                {allProfiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant={activeProfileId === profile.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyProfile(profile.id)}
                    className="text-xs"
                    title={profile.description}
                  >
                    {profile.icon} {profile.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Built-in Fields by Section (with DnD) */}
          {sections.map((section) => {
            const isCollapsed = collapsedSections.has(section.key);
            const sectionVisibleCount = section.fields.filter((f) => f.visible).length;
            const sectionTotalCount = section.fields.length;
            const allVisible = sectionVisibleCount === sectionTotalCount;
            const noneVisible = sectionVisibleCount === 0;
            if (sectionTotalCount === 0) return null; // empty custom sections

            return (
              <Card key={section.key} className={cn(noneVisible && "opacity-60")}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-2 text-right flex-1 hover:opacity-80 transition-opacity"
                      onClick={() => toggleSectionCollapse(section.key)}
                    >
                      {sectionIcons[section.key] || <Layers className="h-4 w-4" />}
                      <CardTitle className="text-base">{section.label}</CardTitle>
                      <Badge variant="outline" className="mr-2 text-xs">{sectionVisibleCount}/{sectionTotalCount}</Badge>
                      {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <div className="flex items-center gap-2">
                      {section.key !== "basic" && (
                        <Button variant="ghost" size="sm" onClick={() => toggleSection(section.key, !allVisible)} className="text-xs">
                          {allVisible ? <><EyeOff className="h-3.5 w-3.5 ml-1" />הסתר</> : <><Eye className="h-3.5 w-3.5 ml-1" />הצג</>}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent className="pt-0">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(section.key)}>
                      <SortableContext items={section.fields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                          {section.fields.map((field) => (
                            <SortableFieldItem key={field.key} field={field} onToggle={() => toggleField(field.key)} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Custom Fields (from Supabase) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Plus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">שדות מותאמים אישית</CardTitle>
                    <CardDescription className="text-xs">שדות שנוספו ידנית — נשמרים בענן</CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAddFieldDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-1" />הוסף שדה
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customFieldsLoading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">טוען...</div>
              ) : customFieldDefs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FormInput className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">אין שדות מותאמים עדיין</p>
                  <p className="text-xs mt-1">לחץ "הוסף שדה" כדי ליצור שדה חדש</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {customFieldDefs.map((field) => (
                    <div key={field.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <CheckCircle2 className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">{field.label}</span>
                        {field.is_required && <Badge variant="outline" className="text-[10px] px-1.5 py-0">חובה</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{fieldTypeLabels[field.field_type] || field.field_type}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(field)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteFieldConfirm(field.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ============ PROFILES TAB ============ */}
      {activeTab === "profiles" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-blue-500" />
                <div>
                  <CardTitle className="text-base">פרופילי שדות</CardTitle>
                  <CardDescription className="text-xs">
                    תבניות מוכנות — לחיצה אחת מחליפה את כל השדות. אפשר גם ליצור פרופיל מותאם.
                  </CardDescription>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowProfileDialog(true)}>
                <Save className="h-4 w-4 ml-1" />שמור נוכחי כפרופיל
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                    activeProfileId === profile.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  )}
                  onClick={() => applyProfile(profile.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{profile.icon}</span>
                      <span className="font-medium text-sm">{profile.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {activeProfileId === profile.id && (
                        <Badge className="text-[10px]">פעיל</Badge>
                      )}
                      {!profile.isBuiltIn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.description}</p>
                  <div className="mt-2 flex gap-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {Object.values(profile.visibilityMap).filter(Boolean).length} שדות פעילים
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ CONDITIONS TAB ============ */}
      {activeTab === "conditions" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-orange-500" />
                <div>
                  <CardTitle className="text-base">שדות מותנים</CardTitle>
                  <CardDescription className="text-xs">
                    הגדר תנאים — הצג שדה מסוים רק כאשר שדה אחר מלא או מכיל ערך ספציפי
                  </CardDescription>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowConditionDialog(true)}>
                <Plus className="h-4 w-4 ml-1" />הוסף תנאי
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {conditions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">אין תנאים עדיין</p>
                <p className="text-xs mt-1">הוסף תנאי כדי להציג שדות באופן דינמי לפי תוכן שדות אחרים</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conditions.map((cond) => {
                  const targetLabel = fields.find((f) => f.key === cond.targetField)?.label || cond.targetField;
                  const dependsLabel = fields.find((f) => f.key === cond.dependsOnField)?.label || cond.dependsOnField;
                  return (
                    <div key={cond.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        <span>הצג</span>
                        <Badge variant="outline">{targetLabel}</Badge>
                        <span>כאשר</span>
                        <Badge variant="outline">{dependsLabel}</Badge>
                        <Badge variant="secondary">{conditionLabels[cond.condition]}</Badge>
                        {cond.condition === "equals" && <Badge>{cond.value}</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeCondition(cond.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============ SECTIONS TAB ============ */}
      {activeTab === "sections" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                <div>
                  <CardTitle className="text-base">סקציות מותאמות</CardTitle>
                  <CardDescription className="text-xs">
                    צור קטגוריות/סקציות חדשות לארגון השדות בטופס
                  </CardDescription>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowSectionDialog(true)}>
                <FolderPlus className="h-4 w-4 ml-1" />סקציה חדשה
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Built-in sections */}
              {sections.filter((s) => !customSections.some((cs) => cs.key === s.key)).map((section) => (
                <div key={section.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    {sectionIcons[section.key] || <Layers className="h-4 w-4" />}
                    <span className="text-sm font-medium">{section.label}</span>
                    <Badge variant="secondary" className="text-[10px]">{section.fields.length} שדות</Badge>
                    <Badge variant="outline" className="text-[10px]">מובנית</Badge>
                  </div>
                </div>
              ))}
              {/* Custom sections */}
              {customSections.map((cs) => (
                <div key={cs.key} className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium">{cs.label}</span>
                    <Badge variant="secondary" className="text-[10px]">מותאמת</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeCustomSection(cs.key)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {customSections.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-xs">אין סקציות מותאמות — לחץ "סקציה חדשה" ליצירה</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning if many fields hidden */}
      {hiddenCount > 3 && (
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{hiddenCount} שדות מוסתרים — לקוחות חדשים לא יכללו מידע זה. נתונים קיימים לא יימחקו.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ DIALOGS ============ */}

      {/* Add Field Dialog */}
      <Dialog open={addFieldDialogOpen} onOpenChange={setAddFieldDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right"><Plus className="h-5 w-5 text-green-500" />הוספת שדה מותאם</DialogTitle>
            <DialogDescription className="text-right">השדה יופיע בטופס הוספת לקוח ובפרופיל הלקוח</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label className="text-right">שם השדה *</Label>
              <Input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="למשל: מספר רישיון" className="text-right" /></div>
            <div className="space-y-2"><Label className="text-right">סוג שדה</Label>
              <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as NewFieldDefinition["field_type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">טקסט</SelectItem><SelectItem value="number">מספר</SelectItem>
                  <SelectItem value="date">תאריך</SelectItem><SelectItem value="select">בחירה מרשימה</SelectItem>
                  <SelectItem value="email">אימייל</SelectItem><SelectItem value="phone">טלפון</SelectItem>
                  <SelectItem value="textarea">טקסט ארוך</SelectItem>
                </SelectContent>
              </Select></div>
            {newFieldType === "select" && (
              <div className="space-y-2"><Label className="text-right">אפשרויות (מופרד בפסיקים)</Label>
                <Input value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} placeholder="אפשרות 1, אפשרות 2, אפשרות 3" className="text-right" /></div>
            )}
            <div className="space-y-2"><Label className="text-right">טקסט placeholder</Label>
              <Input value={newFieldPlaceholder} onChange={(e) => setNewFieldPlaceholder(e.target.value)} placeholder="טקסט עזר שיוצג בשדה ריק" className="text-right" /></div>
            <div className="flex items-center justify-between"><Label className="text-right">שדה חובה</Label><Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} /></div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setAddFieldDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleAddField} disabled={!newFieldLabel.trim()}><Plus className="h-4 w-4 ml-1" />הוסף שדה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={!!editFieldDialog} onOpenChange={(open) => !open && setEditFieldDialog(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right"><Edit2 className="h-5 w-5 text-blue-500" />עריכת שדה מותאם</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label className="text-right">שם השדה *</Label>
              <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="text-right" /></div>
            <div className="space-y-2"><Label className="text-right">סוג שדה</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as NewFieldDefinition["field_type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">טקסט</SelectItem><SelectItem value="number">מספר</SelectItem>
                  <SelectItem value="date">תאריך</SelectItem><SelectItem value="select">בחירה מרשימה</SelectItem>
                  <SelectItem value="email">אימייל</SelectItem><SelectItem value="phone">טלפון</SelectItem>
                  <SelectItem value="textarea">טקסט ארוך</SelectItem>
                </SelectContent>
              </Select></div>
            {editType === "select" && (
              <div className="space-y-2"><Label className="text-right">אפשרויות (מופרד בפסיקים)</Label>
                <Input value={editOptions} onChange={(e) => setEditOptions(e.target.value)} className="text-right" /></div>
            )}
            <div className="space-y-2"><Label className="text-right">טקסט placeholder</Label>
              <Input value={editPlaceholder} onChange={(e) => setEditPlaceholder(e.target.value)} className="text-right" /></div>
            <div className="flex items-center justify-between"><Label className="text-right">שדה חובה</Label><Switch checked={editRequired} onCheckedChange={setEditRequired} /></div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setEditFieldDialog(null)}>ביטול</Button>
            <Button onClick={handleEditField} disabled={!editLabel.trim()}>שמור שינויים</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right"><Save className="h-5 w-5 text-blue-500" />שמירת פרופיל חדש</DialogTitle>
            <DialogDescription className="text-right">הגדרות השדות הנוכחיות יישמרו כפרופיל לשימוש עתידי</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>שם הפרופיל *</Label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder='למשל: "לקוח נדל"ן"' className="text-right" /></div>
            <div className="space-y-2"><Label>אייקון</Label>
              <div className="flex gap-2 flex-wrap">
                {profileEmojis.map((emoji) => (
                  <button key={emoji} onClick={() => setProfileIcon(emoji)}
                    className={cn("w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all",
                      profileIcon === emoji ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}>
                    {emoji}
                  </button>
                ))}
              </div></div>
            <div className="space-y-2"><Label>תיאור</Label>
              <Input value={profileDesc} onChange={(e) => setProfileDesc(e.target.value)} placeholder="תיאור קצר..." className="text-right" /></div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>ביטול</Button>
            <Button onClick={handleSaveProfile} disabled={!profileName.trim()}>שמור פרופיל</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Condition Dialog */}
      <Dialog open={showConditionDialog} onOpenChange={setShowConditionDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right"><Link2 className="h-5 w-5 text-orange-500" />הוספת תנאי</DialogTitle>
            <DialogDescription className="text-right">הצג שדה מסוים רק כאשר תנאי מתקיים</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>הצג את השדה:</Label>
              <Select value={condTarget} onValueChange={setCondTarget}>
                <SelectTrigger><SelectValue placeholder="בחר שדה..." /></SelectTrigger>
                <SelectContent>{fields.filter((f) => !f.protected).map((f) => (
                  <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                ))}</SelectContent>
              </Select></div>
            <div className="space-y-2"><Label>כאשר השדה הזה:</Label>
              <Select value={condDepends} onValueChange={setCondDepends}>
                <SelectTrigger><SelectValue placeholder="בחר שדה תלות..." /></SelectTrigger>
                <SelectContent>{fields.filter((f) => f.key !== condTarget).map((f) => (
                  <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                ))}</SelectContent>
              </Select></div>
            <div className="space-y-2"><Label>תנאי:</Label>
              <Select value={condType} onValueChange={(v) => setCondType(v as typeof condType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_empty">לא ריק (מלא)</SelectItem>
                  <SelectItem value="empty">ריק</SelectItem>
                  <SelectItem value="equals">שווה לערך ספציפי</SelectItem>
                </SelectContent>
              </Select></div>
            {condType === "equals" && (
              <div className="space-y-2"><Label>ערך:</Label>
                <Input value={condValue} onChange={(e) => setCondValue(e.target.value)} placeholder="הערך הנדרש" className="text-right" /></div>
            )}
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setShowConditionDialog(false)}>ביטול</Button>
            <Button onClick={handleAddCondition} disabled={!condTarget || !condDepends}>הוסף תנאי</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right"><FolderPlus className="h-5 w-5 text-indigo-500" />סקציה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>שם הסקציה *</Label>
              <Input value={sectionLabel} onChange={(e) => setSectionLabel(e.target.value)} placeholder='למשל: "פרטים נוספים"' className="text-right" /></div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setShowSectionDialog(false)}>ביטול</Button>
            <Button onClick={handleAddSection} disabled={!sectionLabel.trim()}>צור סקציה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFieldConfirm} onOpenChange={(open) => !open && setDeleteFieldConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת שדה מותאם</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תמחק את הגדרת השדה. נתונים שכבר הוזנו ללקוחות קיימים יישמרו אך לא יוצגו.
              <br /><strong>האם להמשיך?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteField} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 ml-1" />מחק שדה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
